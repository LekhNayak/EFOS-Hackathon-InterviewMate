# InterViewMate — Project Context

> AI-powered interview preparation and resume analysis platform. Full-stack app with a React frontend, Node.js/Express backend, and three Python ML microservices.

---

## What It Does

| Feature | Description |
|---|---|
| Interview Simulation | Practice live mock interviews; Gemini 2.0-flash generates contextual questions |
| Resume Parsing | Upload a PDF resume; Gemini extracts structured data automatically |
| ATS Scoring | Match a resume against a job description; ChromaDB finds similar resumes |
| Emotion Recognition | Analyze speech patterns, emotion, and gender from audio |
| Video Recording | Record interview sessions; stored in Cloudinary |
| Progress Tracking | View past sessions, scores, and improvement areas |
| User Auth | JWT + OTP email verification; profile with skills, social links |

---

## Architecture Overview

```
Browser (React + TS)
    │
    ▼
Express API (Node.js)  ──────────────────────────────┐
    │                                                 │
    ├── MongoDB (users, resumes, JDs, interviews,    │
    │            ATS results)                        │
    ├── Firebase Storage (PDF resumes)               │
    └── Cloudinary (interview videos)               │
                                                     │
Python Microservices (called by Express backend):    │
    ├── Interview Service  :6000  ────────────────────┤
    ├── ATS/Resume Service :5000  ────────────────────┤
    └── Emotion/TTS-STT    :8090  ────────────────────┘
```

---

## Repository Layout

```
InterViewMate1.3/
├── frontend/                      React 19 + TypeScript + Vite + TailwindCSS
│   └── src/
│       ├── pages/                 Page-level components (auth, dashboard, interview…)
│       ├── components/            Reusable UI (shadcn/ui + Radix)
│       ├── hooks/                 Custom React hooks
│       ├── types/                 TypeScript interfaces
│       └── main.tsx               Entry point
│
├── backend/                       Node.js / Express 5
│   └── src/
│       ├── index.js               App entry point (port 5000 default)
│       ├── routes/                API route definitions
│       ├── handlers/              Route handler logic
│       ├── models/                Mongoose schemas
│       ├── middleware/            Auth (JWT), file upload (Multer)
│       ├── config/                MongoDB connection
│       └── utils/                 Validation helpers
│
└── models/                        Python ML microservices
    ├── Interview api_service/     Flask interview engine
    │   ├── interview_service.py   Entry point
    │   └── data/config.env        API keys (Gemini, AssemblyAI)
    ├── Resume ATS and JD/         Flask ATS + resume similarity
    │   └── api_service/main.py    Entry point
    └── TTS and STT api_service/   Flask emotion recognition
        └── main.py                Entry point
```

---

## Tech Stack

### Frontend
- **React 19** + **TypeScript 5.9** — UI framework
- **Vite 7** — build tool (dev server on `localhost:8080`)
- **TailwindCSS 4** — styling
- **Radix UI / shadcn** — accessible component primitives
- **TanStack Query** — server state / data fetching
- **React Router DOM 7** — client-side routing
- **Firebase 12** — auth + PDF storage
- **Framer Motion** — animations
- **Recharts** — analytics charts
- **Tesseract.js** — OCR fallback for resume text

### Backend
- **Express 5** on **Node.js**
- **MongoDB + Mongoose 8** — primary database
- **JWT + bcrypt** — authentication
- **Multer** — file upload
- **Cloudinary** — video storage
- **Google Generative AI (Gemini)** — resume parsing, JD analysis
- **Nodemailer** — OTP emails
- **pdf-parse** — PDF text extraction
- **Axios** — calls to Python services

### Python Services
- **Flask** — HTTP framework for all three services
- **google-generativeai** — Gemini (interview questions, ATS analysis)
- **AssemblyAI** — speech-to-text transcription
- **gTTS** — text-to-speech for interviewer audio
- **ChromaDB + sentence-transformers** — resume similarity search (ATS)
- **TensorFlow 2.20 + librosa** — audio emotion/gender models
- **PyPDF2** — PDF reading in ATS service

---

## Running the Project

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:8080
```

### Backend
```bash
cd backend
npm install
npm run dev          # http://localhost:5000 (nodemon)
```

### Interview Service (Python)
```bash
cd "models/Interview api_service"
pip install -r requirements.txt
python interview_service.py     # http://localhost:6000
```

### ATS / Resume Service (Python)
```bash
cd "models/Resume ATS and JD/api_service"
pip install -r requirements.txt
python main.py                  # http://localhost:5000
```

### Emotion / TTS-STT Service (Python)
```bash
cd "models/TTS and STT api_service"
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt
python main.py                  # http://localhost:8090
```

---

## Environment Variables

### Backend (`.env` in `backend/`)
| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `PORT` | Express server port |
| `SECRET_KEY` | JWT signing secret |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | Video storage |
| `FIREBASE_*` | Firebase config for PDF storage |
| `GEMINI_API_KEY` | Google Generative AI |
| `ML_SERVER` | Base URL for Python microservices |

### Interview Service (`models/Interview api_service/data/config.env`)
| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini API |
| `ASSEMBLYAI_API_KEY` | Speech-to-text |
| `GEMINI_MODEL` | Model name (e.g. `gemini-2.0-flash`) |
| `PORT` | Service port (default 6000) |

### ATS Service (`.env`)
| Variable | Purpose |
|---|---|
| `GOOGLE_API_KEY` | Gemini API |
| `RESUME_DB_PATH` | Path to ChromaDB resume database |

---

## Key API Endpoints

### Express Backend (`/api/...`)
| Route | Method | Description |
|---|---|---|
| `/api/user/signup/request-otp` | POST | Start signup, send OTP |
| `/api/user/signup/complete` | POST | Confirm OTP, create account |
| `/api/user/login` | POST | Login, returns JWT |
| `/api/parser/parse` | POST | Parse PDF resume with Gemini |
| `/api/jd/parse` | POST | Create / parse job description |
| `/api/ats/analyze` | POST | Run ATS analysis (calls Python service) |
| `/api/interview/create` | POST | Save interview session + video |

### Interview Python Service (`/api/...`)
| Route | Method | Description |
|---|---|---|
| `/api/start_interview` | POST | Create session |
| `/api/submit_intro` | POST | Submit user intro |
| `/api/submit_answer` | POST | Answer a question, get next |
| `/api/transcribe_audio` | POST | Audio → text (AssemblyAI) |
| `/api/get_feedback/{id}` | GET | Compiled feedback |

### Emotion Service (`/api/...`)
| Route | Method | Description |
|---|---|---|
| `/api/predict` | POST | Emotion + gender from audio |
| `/api/analyze/features` | POST | Extract MFCC / mel-spectrogram |

---

## Data Models (MongoDB)

| Collection | Key Fields |
|---|---|
| `User` | email, password (hashed), name, skills, GitHub/LinkedIn URLs, JWT refresh token |
| `ParsedResume` | userId, pdfUrl (Firebase), structured sections (header, education, skills, projects) |
| `JobDescription` | title, company, description, requiredSkills, visibility (public/private) |
| `ATS` | resumeId, jdId, geminiAnalysis, localScore (0–100), topMatchingResumes |
| `Interview` | userId, type (Technical/Behavioral/Hybrid), resumeId, jdId, videoUrl, transcript (Q&A pairs) |

---

## Key Flows

### Resume Upload
1. User uploads PDF → Multer buffers in memory
2. Backend saves to Firebase Storage, extracts text via `pdf-parse`
3. Gemini parses text → structured JSON
4. Saved as `ParsedResume` in MongoDB

### Interview Simulation
1. Frontend starts session → Express calls Python Interview Service
2. User submits audio → AssemblyAI transcribes → Gemini generates next question
3. Interviewer responses are spoken via gTTS audio
4. Session saved as `Interview` with Cloudinary video URL

### ATS Analysis
1. User selects resume + JD → Express calls Python ATS Service
2. Service extracts PDF text, runs Gemini analysis, queries ChromaDB for similar resumes
3. Results stored as `ATS` document; frontend renders score + suggestions
