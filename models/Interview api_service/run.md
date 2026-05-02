Interview API Service
Standalone Flask API that drives the entire interview orchestration flow (Gemini questions, AssemblyAI transcription, gTTS synthesis) using local storage under api_service/data/.
1. Setup
Install dependencies (from project root):
   pip install -r requirements.txt
Create api_service/data/config.env:
   GEMINI_API_KEY=your_gemini_key   ASSEMBLYAI_API_KEY=your_assemblyai_key   GEMINI_MODEL=gemini-2.0-flash   PORT=6000   # optional, defaults to 6000
Start the API:
   cd api_service   python interview_service.py
Visit http://localhost:6000 (adjust port if needed).
2. Data files
api_service/data/interview_sessions.json – active sessions
api_service/data/interview_flow.log.jsonl – flow events
api_service/data/interview_sessions.log.jsonl – session metadata
api_service/data/feedback.json – saved feedback reports
api_service/static/recordings/ – gTTS MP3 files (returned as audio_url)
3. API Endpoints
All endpoints are under /api.
3.1 POST /api/start_interview
Create a session.
{  "role": "Senior Frontend Engineer",  "resume": "Full resume text...",  "jd": "Job description...",  "interview_level": "medium",   // optional (easy|medium|hard)  "interview_duration": "15min"  // optional (5min/10min/15min/20min/30min)}
Response
{  "session_id": "uuid",  "status": "waiting_intro"}
3.2 POST /api/submit_intro
Send candidate introduction as text or audio.
JSON body: { "session_id": "...", "text": "Intro text..." }
OR multipart form-data:
session_id (text field)
audio (file field: mp3/wav/webm/m4a/ogg/flac)
Response
{  "session_id": "uuid",  "response": "Interviewer welcome + first question",  "state": "in_interview",  "audio_url": "/api/static/recordings/..."}
3.3 POST /api/submit_answer
Submit each answer in the same way (text or audio).
Response
{  "session_id": "uuid",  "response": "Next question or wrap-up text",  "state": "in_interview",          // or "completed"  "action": "new_question",         // or "end_interview"  "questions_count": 3,  "audio_url": "/api/static/recordings/..."}
Loop until state becomes "completed".
3.4 POST /api/transcribe_audio
Utility endpoint if you just need text from an audio file.
Multipart form-data: audio field
Response: { "transcript": "..." }
3.5 GET /api/get_session/{session_id}
Full session data.
3.6 GET /api/get_history/{session_id}
Returns conversation_history and questions_asked.
3.7 GET /api/get_feedback/{session_id}
Available once interview is completed; returns the stored feedback JSON (overall rating, strengths, areas to improve, etc.).
3.8 GET /api/static/recordings/{filename}
Serves gTTS MP3 files referenced by audio_url.
4. Typical Flow
POST /api/start_interview
POST /api/submit_intro
Repeatedly POST /api/submit_answer with audio/text
After completion, GET /api/get_feedback/{session_id}
Use the returned audio_url values to play interviewer audio in your frontend.