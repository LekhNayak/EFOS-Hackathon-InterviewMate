import os
import json
from io import BytesIO
from urllib.parse import urlparse, unquote
from typing import Any, Dict, List

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import BadRequest
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import requests
from groq import Groq
from sentence_transformers import SentenceTransformer, util
import chromadb


# ---------------------------------
# Environment and global resources
# ---------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# Load .env from project root first, then from api_service as fallback
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Lazy initialization - will be loaded on first use
embedding_model = None
chroma_client = None
collection = None

def get_embedding_model():
    """Lazy load embedding model"""
    global embedding_model
    if embedding_model is None:
        embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return embedding_model

def resolve_resume_db_path() -> str:
    """Resolve the path to the ChromaDB 'resume_db' directory with sensible fallbacks.

    Priority:
    1) RESUME_DB_PATH env var if set
    2) <project_root>/resume_db if exists
    3) <api_service>/resume_db if exists
    4) default to <project_root>/resume_db
    """
    # 1) Explicit env var
    env_path = os.getenv("RESUME_DB_PATH")
    if env_path and os.path.isdir(env_path):
        return env_path

    # 2) Project root
    project_db = os.path.join(PROJECT_ROOT, "resume_db")
    if os.path.isdir(project_db):
        return project_db

    # 3) api_service dir
    service_db = os.path.join(BASE_DIR, "resume_db")
    if os.path.isdir(service_db):
        return service_db

    # 4) Default
    return project_db


def get_chroma_client():
    """Lazy load ChromaDB client"""
    global chroma_client
    if chroma_client is None:
        chroma_path = resolve_resume_db_path()
        chroma_client = chromadb.PersistentClient(path=chroma_path)
    return chroma_client

def get_collection():
    """Lazy load ChromaDB collection"""
    global collection
    if collection is None:
        client = get_chroma_client()
        try:
            collection = client.get_collection("resumes")
        except Exception:
            collection = client.get_or_create_collection("resumes")
    return collection


def get_resume_db_diagnostics() -> Dict[str, Any]:
    """Return diagnostics about the resume database path and collection count."""
    path = resolve_resume_db_path()
    try:
        coll = get_collection()
        count = coll.count()
    except Exception as e:
        count = f"error: {e}"
    return {"resume_db_path": path, "collection": "resumes", "count": count}

def _get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GROQ_API_KEY in .env")
    return Groq(api_key=api_key.strip())


# ---------------------------------
# Prompt used in the Streamlit app
# ---------------------------------
INPUT_PROMPT = """
Act as a highly skilled and experienced ATS (Application Tracking System) 
with deep expertise in technical recruiting and resume parsing.

Your task is to analyze and evaluate a resume against a provided job description (JD). 
Provide a comprehensive and structured evaluation in about 200–250 words.

Inputs:
resume: {text}
description: {jd}

Your output must be a structured string in JSON format with the following fields:

{{
"JD Match": "xx%", 
"MissingKeywords": ["keyword1", "keyword2", ...], 
"Profile Summary": "A concise summary based on the resume",
"TechnicalSkillsMatch": ["skill1", "skill2", ...], 
"SoftSkillsMatch": ["skill1", "skill2", ...], 
"ExperienceAlignment": "Brief summary comparing candidate's experience with JD", 
"ImprovementSuggestions": ["Tip1", "Tip2", ...],
"ProjectsAnalysis": "Evaluate the candidate's projects: are they relevant to the JD, is the tech stack aligned with required skills, and do the projects demonstrate practical experience?",
"OverallComment": "Final verdict on candidate's alignment with the JD"
}}
"""


# ---------------------------------
# Helper functions
# ---------------------------------
def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(pdf_bytes))
    return "".join([page.extract_text() or "" for page in reader.pages])


def safe_parse_json(text: str) -> Dict[str, Any]:
    try:
        cleaned = text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned)
    except Exception:
        return {"raw_text": text}


def compute_local_score(resume_text: str, jd_text: str) -> float:
    model = get_embedding_model()
    emb_resume = model.encode(resume_text)
    emb_jd = model.encode(jd_text)
    sim = util.cos_sim(emb_resume, emb_jd).item()
    # Cosine similarity raw scores cluster in 0.3–0.7; scale to a friendlier 0–99 range
    boosted = min(99.0, sim * 100 * 1.5)
    return round(boosted, 2)


def fetch_pdf_bytes_from_url(resume_url: str) -> (bytes, str):
    """Download PDF from a URL and return bytes and a best-effort filename.

    Raises:
        BadRequest: if the URL is invalid, not reachable, not a PDF, or empty.
    """
    if not resume_url or not isinstance(resume_url, str):
        raise BadRequest("Invalid resume_url")

    try:
        resp = requests.get(resume_url, timeout=20, stream=True)
    except Exception as e:
        raise BadRequest(f"Failed to download resume: {str(e)}")

    if resp.status_code != 200:
        raise BadRequest(f"Failed to download resume: HTTP {resp.status_code}")

    content_type = resp.headers.get("Content-Type", "").lower()
    if "pdf" not in content_type and not resume_url.lower().endswith(".pdf"):
        # Some providers may not set content-type properly; allow .pdf suffix fallback
        raise BadRequest("URL does not point to a PDF file")

    pdf_bytes = resp.content
    if not pdf_bytes:
        raise BadRequest("Downloaded file is empty")

    parsed = urlparse(resume_url)
    filename = os.path.basename(parsed.path) or "resume.pdf"
    filename = unquote(filename)
    if not filename.lower().endswith(".pdf"):
        filename = f"{filename}.pdf"

    return pdf_bytes, filename


def get_best_resumes_for_JD(jd_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
    try:
        resume_collection = get_collection()
        model = get_embedding_model()
        
        # Check if collection has any data
        if resume_collection.count() == 0:
            return []
        
        jd_embedding = model.encode(jd_text).tolist()
        results = resume_collection.query(query_embeddings=[jd_embedding], n_results=top_k)
        documents = results.get("documents", [[]])[0] if results else []
        metadatas = results.get("metadatas", [[]])[0] if results else []
        return [
            {"filename": meta.get("filename", "Unknown"), "snippet": (doc or "")[:700]}
            for doc, meta in zip(documents, metadatas)
        ]
    except Exception as e:
        # Return empty list if database query fails
        print(f"Warning: Could not query resume database: {e}")
        return []


def get_gemini_response(resume_text: str, jd: str) -> str:
    client = _get_groq_client()
    model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    user_prompt = INPUT_PROMPT.format(text=resume_text, jd=jd)
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You are a highly skilled ATS analyst. Always respond with valid JSON only — no markdown fences, no explanation outside the JSON."},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=1024,
    )
    return response.choices[0].message.content.strip()


# ---------------------------------
# Flask app
# ---------------------------------
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "message": "ATS Score Tracker API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/api/health",
            "analyze": "/api/analyze (POST)"
        }
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/debug/db", methods=["GET"])
def debug_db():
    return jsonify(get_resume_db_diagnostics())


@app.route("/api/analyze", methods=["POST"])
def analyze_resume():
    # Accept either multipart/form-data with file OR resume_url, or JSON with resume_url
    jd_text = None
    resume_filename = None
    pdf_bytes = None

    if request.is_json:
        body = request.get_json(silent=True) or {}
        jd_text = (body.get("jd_text") or "").strip()
        resume_url = (body.get("resume_url") or "").strip()
    else:
        jd_text = (request.form.get("jd_text") or "").strip()
        resume_url = (request.form.get("resume_url") or "").strip()

    if not jd_text:
        return jsonify({"error": "JD text is required"}), 400

    # 1) File upload path
    if "file" in request.files and request.files["file"].filename != "":
        file = request.files["file"]
        if not file.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Only PDF files are supported"}), 400
        resume_filename = file.filename
        pdf_bytes = file.read()
    # 2) URL path
    elif resume_url:
        try:
            pdf_bytes, resume_filename = fetch_pdf_bytes_from_url(resume_url)
        except BadRequest as br:
            return jsonify({"error": str(br)}), 400
        except Exception as e:
            return jsonify({"error": f"Failed to fetch resume from URL: {str(e)}"}), 400
    else:
        return jsonify({"error": "Provide either a PDF file or resume_url"}), 400
    
    try:
        resume_text = extract_text_from_pdf_bytes(pdf_bytes)
    except Exception as e:
        return jsonify({"error": f"Failed to parse PDF: {str(e)}"}), 400
    
    # Compute local ATS score
    local_score = compute_local_score(resume_text, jd_text)
    
    # Get Gemini response
    try:
        gemini_raw = get_gemini_response(resume_text, jd_text)
        gemini_json = safe_parse_json(gemini_raw)
    except Exception as e:
        gemini_json = {
            "JD Match": "N/A",
            "MissingKeywords": [],
            "Profile Summary": "Gemini API unavailable.",
            "TechnicalSkillsMatch": [],
            "SoftSkillsMatch": [],
            "ExperienceAlignment": "—",
            "ImprovementSuggestions": ["Retry later or check API key."],
            "OverallComment": f"Evaluation failed: {str(e)}"
        }
    
    # Get best resumes for JD
    top_resumes = get_best_resumes_for_JD(jd_text, top_k=3)
    
    # Prepare result
    result = {
        "resume_filename": resume_filename,
        "local_ATS_score": local_score,
        "Gemini_JSON": gemini_json,
        "BestResumesForJD": top_resumes,
    }
    
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=6050, debug=True)
