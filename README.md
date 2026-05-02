# InterViewMate 

> AI-powered interview preparation and resume analysis platform. Full-stack app with a React frontend, Node.js/Express backend, and three Python ML microservices.

---

## What It Does

| Feature | Description |
|---|---|
| Interview Simulation | Live mock interviews; Groq LLM (llama-3.3-70b-versatile) generates contextual questions |
| Resume Builder | Upload PDF → Groq extracts structured data; edit/save via UI |
| ATS Scoring | Match a resume against a job description; ChromaDB finds similar resumes via embeddings |
| Emotion Recognition | Analyze speech patterns, emotion, and gender from audio (TensorFlow models) |
| Job Finder | Search LinkedIn jobs via RapidAPI; location filter + infinite pagination (8/page, appends new batches) |
| Progress Tracking | LeetCode, Codeforces, and interview history dashboard |
| User Auth | JWT (cookies) + OTP email verification; profile with skills, social links |

---

## Architecture

```
Browser (React + TS, :8080)
    │
    ▼
Express API (Node.js, :8000)
    │
    ├── MongoDB Atlas (users, resumes, JDs, interviews, ATS results)
    ├── Cloudinary (interview videos, resume PDFs)
    ├── Groq API (resume parsing, LLM)
    ├── RapidAPI / LinkedIn Scraper (job search)
    └── Nodemailer (OTP email)

Python Microservices (called by frontend directly or via Express):
    ├── Interview Service  :5000   Flask — session management, Groq Q-gen, Sarvam TTS, transcription
    ├── ATS/Resume Service :6050   Flask — PDF parsing, Groq analysis, ChromaDB similarity
    └── Emotion Analysis   :8090   Flask — TensorFlow MFCC emotion/gender models
```

---

## Repository Layout

```
Efos-Virtual Hack/
├── README.md                          ← this file
├── CONTEXT.md                         ← older context doc (may be stale)
├── frontend/                          React 19 + TypeScript + Vite + TailwindCSS (:8080)
│   └── src/
│       ├── pages/                     Page-level components
│       │   ├── Index.tsx              Landing page
│       │   ├── Auth.tsx               Signup / Login
│       │   ├── Dashboard.tsx          Dashboard shell
│       │   ├── Interview.tsx          Interview simulation (WebRTC + chat)
│       │   ├── JdOnboarding.tsx       Job description upload
│       │   ├── ProfileSetupModel.tsx  Profile completion modal
│       │   ├── Reviews.tsx            Feedback / review page
│       │   └── NotFound.tsx           404
│       ├── components/
│       │   ├── DashboardContent/      Dashboard sub-pages
│       │   │   ├── DashboardHome.tsx
│       │   │   ├── Simulations.tsx
│       │   │   ├── Resume.tsx
│       │   │   ├── ATSChecker.tsx
│       │   │   ├── Performance.tsx
│       │   │   ├── Jobfinder.tsx      Job search (location filter + 8-per-page pagination)
│       │   │   ├── Settings.tsx
│       │   │   └── test.tsx
│       │   ├── Resume/
│       │   │   ├── ResumeList.tsx     Lists user's own resumes; upload PDF
│       │   │   ├── ResumePreview.tsx
│       │   │   └── Resumeeditor.tsx   Tab editor (About, Education, Skills, Projects, Activities)
│       │   ├── simulations/
│       │   ├── progress/              LeetCode, Codeforces
│       │   ├── profile/
│       │   ├── ui/                    shadcn/ui primitives
│       │   ├── Sidebar.tsx
│       │   └── Header.tsx
│       ├── types/index.ts             TypeScript interfaces (Resume, Job, etc.)
│       └── main.tsx
│
├── backend/                           Node.js / Express 5 (:8000)
│   └── src/
│       ├── index.js                   App entry — registers all routes
│       ├── routes/
│       │   ├── user.routes.js         Auth + profile CRUD
│       │   ├── parser.routes.js       Resume upload/parse/CRUD (user-scoped)
│       │   ├── jd.routes.js           Job description management
│       │   ├── ats.routes.js          ATS analysis (calls Python :6050)
│       │   ├── interview.routes.js    Interview session save + history
│       │   ├── company.routes.js      Company data
│       │   └── job.routes.js          LinkedIn job search (RapidAPI)
│       ├── handlers/
│       │   ├── user.handler.js
│       │   ├── parser.handler.js      getAllResumes/createResume/deleteResume — all user-scoped
│       │   ├── jd.handler.js
│       │   ├── ats.handler.js
│       │   ├── interview.handler.js
│       │   └── company.handler.js
│       ├── models/
│       │   ├── user.model.js
│       │   ├── parser.model.js        ParsedResume — userId required
│       │   ├── jd.model.js
│       │   ├── ats.model.js
│       │   ├── interview.model.js
│       │   ├── otp.model.js           TTL 5 min
│       │   └── company.model.js
│       ├── middleware/
│       │   ├── auth.middleware.js     userAuth — verifies JWT from cookie; attaches req.user
│       │   └── upload.middleware.js   Multer (disk: tempUploads/, allows PDF + video)
│       └── config/
│           ├── db.js                  MongoDB Atlas connection
│           ├── cloudinary.js          uploadBuffer(buffer, folder, publicId)
│           ├── firebase.js
│           └── mailer.js              Nodemailer OTP
│
└── models/                            Python ML microservices
    ├── Interview api_service/         Flask :5000
    │   ├── interview_service.py       Entry point
    │   └── .env                       GROQ_API_KEY, SARVAM_API_KEY, PORT
    ├── Resume ATS and JD/
    │   └── api_service/               Flask :6050
    │       ├── main.py                Entry point
    │       └── .env                   GROQ_API_KEY, GROQ_MODEL
    └── Audio_Emotion_Analysis/        Flask :8090
        ├── main.py                    Entry point
        ├── model3.h5                  6-emotion TF model
        ├── model4.h5                  7-emotion TF model
        └── model_mw.h5               Gender detection TF model
```

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
npm run dev          # http://localhost:8000 (nodemon)
```

### Interview Service (Python)
```bash
cd "models/Interview api_service"
pip install -r requirements.txt
python interview_service.py     # http://localhost:5000
```

### ATS / Resume Service (Python)
```bash
cd "models/Resume ATS and JD/api_service"
pip install -r requirements.txt
python main.py                  # http://localhost:6050
```

### Emotion Analysis Service (Python)
```bash
cd models/Audio_Emotion_Analysis
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python main.py                  # http://localhost:8090
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `PORT` | Express port (default 8000) |
| `SECRET_KEY` | JWT signing secret |
| `GROQ_API_KEY` | Groq LLM (resume parsing) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `RAPIDAPI_KEY` | LinkedIn Scraper API (job search) |
| `EMAIL_USER` / `EMAIL_PASS` | Nodemailer SMTP credentials |
| `ML_SERVER` | Base URL for ATS Python service (`http://localhost:6050`) |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | Video + PDF storage |

### Interview Service (`models/Interview api_service/.env`)
| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Groq LLM |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `SARVAM_API_KEY` | Text-to-speech for interviewer audio |
| `PORT` | Service port (5000) |

### ATS Service (`models/Resume ATS and JD/api_service/.env`)
| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Groq LLM for ATS analysis |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |

---

## Key API Endpoints

### Express Backend (`localhost:8000/api/...`)
| Method | Route | Description |
|---|---|---|
| POST | `/user/signup/request-otp` | Send OTP to email |
| POST | `/user/signup/complete` | Verify OTP, create account |
| POST | `/user/login` | Login → JWT cookie |
| GET | `/user/profile` | Get current user profile |
| PUT | `/user/update` | Update profile |
| POST | `/parser/parse` | Upload PDF → Groq parse → save resume |
| GET | `/parser/all` | Get current user's resumes only |
| POST | `/parser/create` | Create resume (userId forced from auth) |
| PUT | `/parser/update/:id` | Update resume (owner only) |
| DELETE | `/parser/delete/:id` | Delete resume (owner only) |
| POST | `/jd/parse` | Create/parse job description |
| GET | `/jd/` | Get all public + user's JDs |
| POST | `/ats/analyze` | Run ATS analysis (calls :6050) |
| GET | `/ats/user` | Get user's ATS history |
| POST | `/interview/save` | Save completed interview session |
| GET | `/interview/user` | Get user's past interviews |
| POST | `/jobs/search` | Search LinkedIn jobs (role + optional location + apiPage) |

### Interview Python Service (`localhost:5000/api/...`)
| Method | Route | Description |
|---|---|---|
| POST | `/start_interview` | Create session (role, company, resume, JD, level, duration, type) |
| POST | `/submit_intro` | Submit user self-introduction |
| POST | `/submit_answer` | Submit answer → receive next question |
| POST | `/transcribe_audio` | Audio blob → transcribed text |
| GET | `/get_feedback/:session_id` | Get final feedback JSON |

### Emotion Service (`localhost:8090/api/...`)
| Method | Route | Description |
|---|---|---|
| POST | `/predict` | Audio blob → emotion + gender predictions |

---

## Data Models (MongoDB)

### User
```
_id, name, email, password (bcrypt), age, gender,
githubUrl, linkedinUrl, codeforcesUrl, leetcodeUrl,
skills[], interests[], timestamps
```

### ParsedResume
```
_id, userId (ref User, required), title, pdfUrl (Cloudinary),
header { name, phone, email, github },
objective, education[], skills { languages[], frameworks[], other[] },
projects[], activities[]
```
> **Security note:** All CRUD operations filter by `userId: req.user._id`. Users can only see/edit/delete their own resumes.

### JobDescription
```
_id, url, title, company, location, description,
requiredSkills[], jobType, uploadedBy (ref User), isPublic, timestamps
```

### ATS
```
_id, user (ref User), resume (ref ParsedResume), jobDescription (ref JobDescription),
jobRole, jdMatch, missingKeywords[], profileSummary,
technicalSkillsMatch[], softSkillsMatch[], experienceAlignment,
improvementSuggestions[], overallComment, localAtsScore (0–100),
topResumes[], timestamps
```

### Interview
```
_id, userId (ref User), role, company, interviewType, level, duration,
jdId (ref JobDescription), resumeId (ref ParsedResume),
video (Cloudinary URL),
transcript [{ question, answer }],
feedback { overall_rating, summary, strengths[], areas_for_improvement[], recommended_next_steps[] },
timestamps
```

### OTP
```
_id, email, otp, createdAt (TTL: 5 minutes)
```

---

## Key Flows

### Resume Upload & Parsing
1. User uploads PDF via `ResumeList.tsx` → `POST /parser/parse`
2. Multer buffers in memory → uploaded to Cloudinary, text extracted via `pdf-parse`
3. Text sent to Groq → structured JSON returned
4. `userId` forced from `req.user._id` (never from body) → saved as `ParsedResume`

### Job Search
1. User enters role + optional location → `POST /jobs/search` with `{ role, location, apiPage }`
2. Backend queries LinkedIn via RapidAPI, filters results server-side by location string
3. Frontend stores all results in `allJobs`, paginates 8 per page locally
4. When user hits Next on the last local page, frontend fetches `apiPage + 1` and appends

### Interview Simulation
1. Frontend starts session → `POST localhost:5000/api/start_interview`
2. User speaks → audio recorded with `MediaRecorder` → `POST /api/transcribe_audio`
3. Transcription shown in input; user sends → `POST /api/submit_intro` or `/submit_answer`
4. Groq generates next question; Sarvam TTS returns audio URL → played in browser
5. On completion → `GET /api/get_feedback/:id` → feedback displayed in modal
6. Session saved to Express backend via `POST /interview/save`

### ATS Analysis
1. User selects resume + JD → Express calls Python ATS service at `ML_SERVER`
2. Service downloads PDF, extracts text, runs Groq analysis, queries ChromaDB for similar resumes
3. Results saved as `ATS` document; frontend renders score + suggestions

### Auth Flow
1. `POST /user/signup/request-otp` → OTP emailed via Nodemailer
2. `POST /user/signup/complete` → OTP verified → user created → JWT set as cookie
3. All protected routes use `userAuth` middleware (verifies JWT from cookie, attaches `req.user`)
4. JWT expires in 7 days

---

## Tech Stack Summary

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19, TypeScript 5.9, Vite 7 | Dev on :8080 |
| Styling | TailwindCSS 4, shadcn/ui, Radix UI | |
| State | TanStack Query 5, React Router 7 | |
| Animation | Framer Motion 12 | |
| Charts | Recharts 3.3 | |
| Backend | Express 5, Node.js | Dev on :8000 via nodemon |
| Database | MongoDB Atlas + Mongoose 8 | |
| Auth | JWT (cookies) + bcrypt | |
| File Upload | Multer 2 (memory storage) | |
| Storage | Cloudinary (video + PDF) | |
| LLM | Groq API (llama-3.3-70b-versatile) | 100k TPD limit on free tier |
| Job Search | RapidAPI — fresh-linkedin-scraper-api | |
| Email | Nodemailer | Gmail app password |
| Python Services | Flask 3 | Three separate processes |
| Transcription | Groq / Sarvam (Interview service) | |
| TTS | Sarvam AI | |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) | ATS service |
| Vector DB | ChromaDB | Persisted in `resume_db/` |
| Audio/ML | TensorFlow 2.20, Librosa | Emotion service |

---

## Common Gotchas

- **Groq rate limit**: Free tier is 100k tokens/day. Resume parsing (~2k tokens) + ATS analysis will hit this fast. Error: `429 rate_limit_exceeded`. Wait for daily reset or upgrade.
- **Resume ownership**: `parser.handler.js` always sets `userId = req.user._id` and all queries include `{ userId: req.user._id }`. Never trust `userId` from `req.body`.
- **ATS Python service port**: Backend `.env` has `ML_SERVER=http://localhost:6050`. The Interview service runs on `:5000`. Do not mix them up.
- **Job location filter**: LinkedIn's API doesn't reliably enforce location. Backend filters results server-side by `job.location.includes(location)` after fetching.
- **Frontend API base**: Uses `VITE_API_BASE_URL` env var. Interview page also hardcodes `http://localhost:5000/api` and `http://localhost:8090/api` for Python services.
- **Cookie auth**: JWT is stored as an HTTP-only cookie. All fetch calls from frontend must include `credentials: "include"`.
