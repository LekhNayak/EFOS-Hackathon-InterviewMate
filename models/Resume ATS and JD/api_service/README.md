## ATS Score Tracker API

This is a standalone Flask service that exposes the resume analysis as an HTTP API without modifying the original Streamlit app.

### Prerequisites
- Python 3.9+
- The project root should contain `resume_db` (built by the existing project) and a `.env` with `GOOGLE_API_KEY`.

### Install
```bash
cd api_service
pip install -r requirements.txt
```

### Run
```bash
python main.py
```

Or:
```bash
flask run --host=0.0.0.0 --port=5000
```

The server will run on **http://localhost:5000**

### Endpoints
- GET `/health` → simple health check
- POST `/analyze` (multipart/form-data)
  - `jd_text`: string (form field)
  - `file`: PDF resume (file field)

### Usage Examples

#### Method 1: Using Postman (Recommended!)
1. Start the server: `python main.py`
2. Open Postman
3. Create POST request to `http://localhost:5000/analyze`
4. Body → form-data:
   - `jd_text`: Your job description
   - `file`: Select your PDF resume
5. Click "Send"

#### Method 2: Using curl (Windows PowerShell)
```powershell
curl -X POST `
  -F "jd_text=Experienced Python backend engineer with FastAPI and RAG" `
  -F "file=@C:\path\to\your\resume.pdf" `
  http://localhost:5000/analyze
```

#### Method 3: Using Python requests
```python
import requests

url = "http://localhost:5000/api/analyze"
files = {"file": open("path/to/resume.pdf", "rb")}
data = {"jd_text": "Your job description here..."}

response = requests.post(url, files=files, data=data)
print(response.json())
```

#### Method 4: Using the test script
See `test_api.py` below for a ready-to-use script.

### Response shape
```json
{
  "resume_filename": "resume.pdf",
  "local_ATS_score": 78.34,
  "Gemini_JSON": { /* structured JSON or raw_text on fallback */ },
  "BestResumesForJD": [
    { "filename": "Placed_1.pdf", "snippet": "..." }
  ]
}
```

