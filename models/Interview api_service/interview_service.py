import json
import os
import tempfile
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Literal, Optional, Tuple

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from groq import Groq
from sarvam_service import text_to_speech

SERVICE_ROOT = Path(__file__).resolve().parent
DATA_DIR = SERVICE_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

STATIC_DIR = SERVICE_ROOT / "static" / "recordings"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv(SERVICE_ROOT / ".env")

INTERVIEW_SESSIONS_FILE = DATA_DIR / "interview_sessions.json"
INTERVIEW_FLOW_LOG = DATA_DIR / "interview_flow.log.jsonl"
INTERVIEW_SESSIONS_LOG = DATA_DIR / "interview_sessions.log.jsonl"
FEEDBACK_FILE = DATA_DIR / "feedback.json"

ALLOWED_AUDIO_EXT = {".mp3", ".wav", ".webm", ".m4a", ".ogg", ".flac"}


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["UPLOAD_FOLDER"] = STATIC_DIR
    app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB

    # 🌟 FIX: Initialize CORS here to ensure it's active for all requests, 
    # including the separate GET request for audio files.
    CORS(app)
    CORS(app, origins=["http://localhost:8080"])
    

    @app.route("/api/start_interview", methods=["POST"])
    def start_interview():
        payload = request.get_json(force=True)

        role = (payload.get("role") or "").strip()
        resume = payload.get("resume")
        jd = (payload.get("jd") or "").strip()
        level = (payload.get("interview_level") or "medium").strip().lower()
        duration = (payload.get("interview_duration") or "15min").strip()
        interview_type = (payload.get("interview_type") or "technical_role").strip().lower()

        if not role or not resume or not jd:
            return jsonify({"error": "role, resume, and jd are required"}), 400
        if level not in {"easy", "medium", "hard"}:
            return jsonify({"error": "interview_level must be easy|medium|hard"}), 400

        session_id = _create_session(role, resume, jd, level, duration, interview_type)
        print("Session ID:", session_id)

        return jsonify({"session_id": session_id, "status": "waiting_intro"}), 200


    @app.route("/api/submit_intro", methods=["POST"])
    def submit_intro():
        try:
            session_id, intro_text = _resolve_input_text(stage="intro")
            result = _handle_intro(session_id, intro_text)
            return jsonify(result), 200
        except ValueError as err:
            return jsonify({"error": str(err)}), 400
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

    @app.route("/api/submit_answer", methods=["POST"])
    def submit_answer():
        try:
            session_id, answer_text = _resolve_input_text(stage="answer")
            result = _handle_answer(session_id, answer_text)
            return jsonify(result), 200
        except ValueError as err:
            return jsonify({"error": str(err)}), 400
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

    @app.route("/api/transcribe_audio", methods=["POST"])
    def transcribe_audio_endpoint():
        try:
            file = request.files.get("audio")
            if not file:
                raise ValueError("No audio file provided")

            ext = Path(file.filename or "").suffix.lower()
            if ext not in ALLOWED_AUDIO_EXT:
                raise ValueError(f"Unsupported audio format. Allowed: {', '.join(sorted(ALLOWED_AUDIO_EXT))}")

            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                file.save(tmp.name)
                tmp_path = Path(tmp.name)

            try:
                transcript = _transcribe_audio_file(tmp_path)
            finally:
                tmp_path.unlink(missing_ok=True)

            return jsonify({"transcribed_text": transcript}), 200

        except ValueError as err:
            return jsonify({"error": str(err)}), 400
        except Exception as exc:
            print("Server error:", exc)
            return jsonify({"error": str(exc)}), 500



    @app.route("/api/get_session/<session_id>", methods=["GET"])
    def get_session(session_id: str):
        try:
            session = _fetch_session(session_id)
            return jsonify(session), 200
        except ValueError as err:
            return jsonify({"error": str(err)}), 404

    @app.route("/api/get_history/<session_id>", methods=["GET"])
    def get_history(session_id: str):
        try:
            session = _fetch_session(session_id)
            return jsonify(
                {
                    "conversation_history": session["conversation_history"],
                    "questions_asked": session["questions_asked"],
                }
            ), 200
        except ValueError as err:
            return jsonify({"error": str(err)}), 404

    @app.route("/api/get_feedback/<session_id>", methods=["GET"])
    def get_feedback(session_id: str):
        try:
            session = _fetch_session(session_id)
            if session["current_state"] != "completed":
                return jsonify({"error": "Interview not completed yet"}), 400
            feedback = _ensure_feedback(session)
            return jsonify(feedback), 200
        except ValueError as err:
            return jsonify({"error": str(err)}), 404
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

    @app.route("/api/static/recordings/<path:filename>", methods=["GET"])
    def serve_recording(filename: str):
        # This is the correct way to serve static files from a separate endpoint
        # The frontend will make a GET request to this URL to fetch the .mp3 file
        return send_from_directory(
            STATIC_DIR, 
            filename, 
            as_attachment=False,
            # Explicitly setting the MIME type for robust browser support
            mimetype="audio/wav"
        )

    return app


# ---------- Internal helpers ----------

def _read_json(path: Path) -> List[Dict]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def _write_json(path: Path, data: List[Dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _append_log(path: Path, entry: Dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def _get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GROQ_API_KEY in api_service/data/config.env")
    return Groq(api_key=api_key.strip())


def _transcribe_audio_file(path: Path) -> str:
    client = Groq(api_key=os.getenv("GROQ_API_KEY", "").strip(), timeout=120.0)
    with open(path, "rb") as f:
        transcription = client.audio.transcriptions.create(
            file=(path.name, f.read()),
            model="whisper-large-v3-turbo",
            response_format="text",
        )
    transcript = transcription.strip() if isinstance(transcription, str) else (transcription.text or "").strip()
    if not transcript:
        raise RuntimeError("Transcription returned empty result")
    return transcript


_DURATION_TO_QUESTIONS = {
    "5min": 3,
    "10min": 5,
    "15min": 8,
    "30min": 12,
    "45min": 17,
}

_INTERVIEW_TYPE_INSTRUCTIONS = {
    "hr": (
        "HR Interview",
        "Focus exclusively on behavioral and cultural-fit questions. Ask about teamwork, conflict resolution, "
        "strengths/weaknesses, motivation, career goals, and past experiences using the STAR method. "
        "Do NOT ask technical or coding questions."
    ),
    "technical_projects": (
        "Technical Interview (Projects Based)",
        "Focus on the candidate's projects listed in their resume. Ask about architecture decisions, tech stack choices, "
        "challenges faced, how they solved problems, and what they would do differently. "
        "Probe depth of ownership and understanding. Do NOT ask generic DSA questions."
    ),
    "technical_role": (
        "Technical Interview (Role Based)",
        "Focus on role-specific technical knowledge based on the JD. Ask about frameworks, tools, design patterns, "
        "system design concepts, and domain knowledge relevant to the role. "
        "Reference the JD's required skills throughout."
    ),
    "dsa": (
        "DSA Interview",
        "Focus entirely on data structures and algorithms. Ask about arrays, strings, trees, graphs, dynamic programming, "
        "sorting, searching, and complexity analysis. Present conceptual problems and ask the candidate to walk through "
        "their approach, time/space complexity, and edge cases. Do NOT ask HR or project questions."
    ),
    "hybrid": (
        "Hybrid Interview (DSA + Technical)",
        "Split the interview equally: half DSA questions (data structures, algorithms, complexity) and half "
        "role-specific technical questions (frameworks, design, domain knowledge from the JD). "
        "Alternate between both categories."
    ),
}


def _max_questions(duration: str) -> int:
    return _DURATION_TO_QUESTIONS.get(duration, 8)


def _system_prompt(role: str, resume: str, jd: str,
                   level: Literal["easy", "medium", "hard"],
                   duration: str, interview_type: str) -> str:
    type_label, type_instructions = _INTERVIEW_TYPE_INSTRUCTIONS.get(
        interview_type, _INTERVIEW_TYPE_INSTRUCTIONS["technical_role"]
    )
    max_q = _max_questions(duration)

    return f"""
You are an expert interviewer conducting a {type_label} for the role: {role}

[CANDIDATE RESUME]
{resume}

[JOB DESCRIPTION]
{jd}

[INTERVIEW PARAMETERS]
- Type: {type_label}
- Level: {level.upper()}
- Duration: {duration}
- Max Questions: {max_q}

[INTERVIEW STYLE]
{type_instructions}

[RULES]
- Give a warm welcome after the candidate's introduction, then ask the first question.
- Ask a maximum of {max_q} questions total. Keep track internally.
- After the {max_q}th question is answered, wrap up warmly: thank the candidate, give a brief encouraging closing remark, and end the interview. Do NOT ask another question.
- Adjust question depth to difficulty level: {level}.
- Probe when answers are vague; move on when satisfied.
- Keep each response focused — one question at a time.

Wait for the candidate's introduction before asking any questions.
""".strip()


def _create_session(role: str, resume: str, jd: str,
                    level: Literal["easy", "medium", "hard"],
                    duration: str, interview_type: str = "technical_role") -> str:
    session_id = str(uuid.uuid4())
    session = {
        "session_id": session_id,
        "role": role,
        "resume_text": resume,
        "jd_text": jd,
        "interview_level": level,
        "interview_duration": duration,
        "interview_type": interview_type,
        "max_questions": _max_questions(duration),
        "system_prompt": _system_prompt(role, resume, jd, level, duration, interview_type),
        "conversation_history": [],
        "questions_asked": [],
        "current_state": "waiting_intro",
        "intro_received": False,
        "start_time": datetime.now().isoformat(),
    }
    sessions = _read_json(INTERVIEW_SESSIONS_FILE)
    sessions.append(session)
    _write_json(INTERVIEW_SESSIONS_FILE, sessions)

    _append_log(
        INTERVIEW_SESSIONS_LOG,
        {
            "session_id": session_id,
            "role": role,
            "level": level,
            "duration": duration,
            "interview_type": interview_type,
            "timestamp": datetime.now().isoformat(),
        },
    )
    return session_id


def _fetch_session(session_id: str) -> Dict:
    for session in _read_json(INTERVIEW_SESSIONS_FILE):
        if session["session_id"] == session_id:
            return session
    raise ValueError(f"Session {session_id} not found")


def _save_session(session: Dict) -> None:
    sessions = _read_json(INTERVIEW_SESSIONS_FILE)
    for idx, item in enumerate(sessions):
        if item["session_id"] == session["session_id"]:
            sessions[idx] = session
            _write_json(INTERVIEW_SESSIONS_FILE, sessions)
            return
    raise ValueError("Session not found while saving")


def _log_flow(session_id: str, action: str, questions_count: Optional[int] = None) -> None:
    entry = {
        "session_id": session_id,
        "action": action,
        "timestamp": datetime.now().isoformat(),
    }
    if questions_count is not None:
        entry["questions_count"] = questions_count
    _append_log(INTERVIEW_FLOW_LOG, entry)


def _groq_response(system: str, user: str) -> str:
    client = _get_groq_client()
    model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.4,
        max_tokens=1024,
    )
    return response.choices[0].message.content.strip()


def _generate_intro_response(session: Dict, intro_text: str) -> str:
    user = f"Candidate introduction:\n{intro_text}\n\nRespond with a warm welcome and the first question."
    return _groq_response(session["system_prompt"], user)


def _generate_followup(session: Dict, new_answer: str) -> str:
    history = "\n".join(
        f"[{msg['role'].upper()}] {msg['content']}"
        for msg in session["conversation_history"]
    )
    user = f"Conversation so far:\n{history}\n[CANDIDATE] {new_answer}\n\nGive the next question or wrap-up, following the guidelines."
    return _groq_response(session["system_prompt"], user)


def _ensure_feedback(session: Dict) -> Dict:
    if session.get("feedback_generated"):
        for fb in _read_json(FEEDBACK_FILE):
            if fb.get("session_id") == session["session_id"]:
                return fb
    feedback = _generate_feedback(session)
    session["feedback_generated"] = True
    _save_session(session)
    return feedback


def _generate_feedback(session: Dict) -> Dict:
    conversation = "\n".join(
        f"[{msg['role'].upper()}] {msg['content']}" for msg in session["conversation_history"]
    )
    system = "You are an expert interview coach. Always respond with valid JSON only — no markdown, no explanation."
    user = f"""Role: {session['role']}
Level: {session['interview_level']}
Duration: {session['interview_duration']}

Conversation:
{conversation}

Provide JSON:
{{
  "overall_rating": "1-10",
  "summary": "...",
  "strengths": ["..."],
  "areas_for_improvement": ["..."],
  "recommended_next_steps": ["..."]
}}"""
    text = _groq_response(system, user)
    start, end = text.find("{"), text.rfind("}") + 1
    feedback = json.loads(text[start:end])

    all_feedback = _read_json(FEEDBACK_FILE)
    all_feedback.append(
        {
            "session_id": session["session_id"],
            "feedback": feedback,
            "role": session["role"],
            "timestamp": datetime.now().isoformat(),
        }
    )
    _write_json(FEEDBACK_FILE, all_feedback)
    return feedback


def _resolve_input_text(stage: str, require_session: bool = True) -> Tuple[str, str]:
    """
    Accepts either:
    - JSON body with text/plain text
    - Multipart/form-data with 'audio' file
    """
    session_id = request.form.get("session_id") or request.args.get("session_id")
    json_payload = request.get_json(silent=True) or {}
    session_id = session_id or json_payload.get("session_id")

    if require_session and not session_id:
        raise ValueError("session_id is required")
    if require_session:
        _fetch_session(session_id)  # ensure exists

    text_value = None
    if isinstance(json_payload, dict):
        text_value = (json_payload.get("text") or "").strip()
    if text_value:
        return session_id, text_value

    file = request.files.get("audio")
    if not file:
        raise ValueError("Provide either 'text' or 'audio' in the request")

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_AUDIO_EXT:
        raise ValueError(f"Unsupported audio format. Allowed: {', '.join(sorted(ALLOWED_AUDIO_EXT))}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        file.save(tmp.name)
        tmp_path = Path(tmp.name)

    try:
        transcript = _transcribe_audio_file(tmp_path)
    finally:
        tmp_path.unlink(missing_ok=True)

    return session_id, transcript


def _handle_intro(session_id: str, intro_text: str) -> Dict:
    session = _fetch_session(session_id)
    if session["intro_received"]:
        raise ValueError("Introduction already submitted")

    response = _generate_intro_response(session, intro_text)
    _record_message(session, "candidate", intro_text, "intro")
    _record_message(session, "interviewer", response, "question")
    session["intro_received"] = True
    session["current_state"] = "in_interview"
    _save_session(session)
    _log_flow(session_id, "intro_submitted")

    audio_url = _synthesize_to_file(session_id, response)
    return {
        "session_id": session_id,
        "response": response,
        "state": "in_interview",
        "audio_url": audio_url,
    }


def _handle_answer(session_id: str, answer_text: str) -> Dict:
    session = _fetch_session(session_id)
    if not session["intro_received"]:
        raise ValueError("Please submit introduction first")

    questions_before = len(session["questions_asked"])
    max_q = session.get("max_questions", _max_questions(session.get("interview_duration", "15min")))

    # questions_before >= max_q means all questions have been asked AND answered —
    # send a warm closing instead of generating another question.
    # questions_before < max_q means the user just answered an intermediate question —
    # ask the next one, even if it will be the last (user must be able to answer it).
    if questions_before >= max_q:
        response = (
            "That's a wrap! You did a fantastic job today — your answers were thoughtful and showed real depth. "
            "I really enjoyed our conversation. "
            "Go ahead and click the 'View Feedback' button on the right to see your detailed feedback, "
            "strengths, areas to improve, and personalised next steps. Best of luck!"
        )
        is_done = True
    else:
        response = _generate_followup(session, answer_text)
        # Let the AI end early if it naturally wraps up (edge case)
        is_done = any(kw in response.lower() for kw in ["thank you", "conclude", "that's a wrap", "best of luck", "pleasure speaking"])

    _record_message(session, "candidate", answer_text, "answer")
    _record_message(session, "interviewer", response, "question")
    _save_session(session)

    questions_after = len(session["questions_asked"])

    if is_done:
        session["current_state"] = "completed"
        session["end_time"] = datetime.now().isoformat()
        _save_session(session)
        _log_flow(session_id, "end_interview", questions_after)
        _ensure_feedback(session)
        state = "completed"
        action = "end_interview"
    else:
        _log_flow(session_id, "new_question", questions_after)
        state = session["current_state"]
        action = "new_question"

    audio_url = _synthesize_to_file(session_id, response)
    return {
        "session_id": session_id,
        "response": response,
        "state": state,
        "action": action,
        "questions_count": questions_after,
        "audio_url": audio_url,
    }


def _record_message(session: Dict, role: str, content: str, msg_type: str) -> None:
    session["conversation_history"].append(
        {"role": role, "content": content, "type": msg_type}
    )
    if role == "interviewer" and msg_type == "question":
        session["questions_asked"].append(content)


def _synthesize_to_file(session_id: str, text: str) -> Optional[str]:
    try:
        filename = f"api_{session_id[:8]}_{uuid.uuid4().hex}.wav"
        out_path = STATIC_DIR / filename
        audio_bytes = text_to_speech(text)
        out_path.write_bytes(audio_bytes)
        return f"/api/static/recordings/{filename}"
    except Exception as e:
        print(f"ERROR: Sarvam TTS failed for session {session_id} and text starting with '{text[:50]}...'. Error: {e}")
        return None

if __name__ == "__main__":
    app = create_app()
    
    # NOTE: The explicit CORS line for 'http://localhost:8080' has been removed
    # because CORS(app) in create_app() now correctly enables it globally for dev.

    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=True
    )