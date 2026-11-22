
# MediMind — AI-Powered Medical Report Analyzer

A free, local-first full-stack project for understanding medical reports. It includes:
- Modern React + Vite frontend
- Express backend with JWT authentication
- Local JSON persistence (no paid database or cloud service)
- PDF, DOCX, TXT and image upload support
- Local LLM analysis through **Ollama** (no API key / no per-request cost)
- A built-in extractive fallback when Ollama is not installed or running
- Dashboard, analysis history, report summary, key findings, medical-term explanations and suggested doctor questions

> **Important:** MediMind is an educational information tool, not a diagnostic device. It can make mistakes and must not replace a qualified clinician. Do not use it for emergencies or treatment decisions. Avoid uploading documents containing information you do not want processed on your own computer.

## 1. Requirements

- Windows, macOS or Linux
- Node.js 20.19+ (or 22.12+)
- npm
- Optional: [Ollama](https://ollama.com/) for local LLM-powered analysis

## 2. Install and run

Open two terminals in this project folder.

### Terminal 1 — backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux, use `cp .env.example .env` instead of `copy`.

Backend runs at `http://localhost:5000`.

### Terminal 2 — frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

Create an account from the Sign up page. Your account and analysis history are stored locally in `backend/data/`.

## 3. Enable free local AI (recommended)

1. Install Ollama from https://ollama.com/
2. In a terminal, download a model:

```bash
ollama pull llama3.2:3b
```

3. Keep Ollama running. Its default endpoint is `http://localhost:11434`.
4. In `backend/.env`, set:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

Restart the backend. MediMind will use the local model. The model runs on your machine; no Gemini, OpenAI, or other paid API is used.

If Ollama is not available, the app still works using its local rule-based summary fallback. That fallback is less capable than an LLM and is clearly identified in the result.

## 4. Supported uploads

- PDF: text-based PDFs
- DOCX: Word documents
- TXT: plain text
- PNG, JPG/JPEG, WEBP: OCR using Tesseract.js (first OCR run may download language data)

Scanned PDFs may not contain selectable text. For those, export the pages as images or use an OCR-capable workflow. Upload limit is 10 MB.

## 5. Privacy and security notes

- Uploaded originals are processed by your local backend and deleted after analysis.
- Account records, analysis metadata and a limited extracted-text preview are stored in `backend/data/db.json`; protect this folder and delete it when you no longer need the data.
- Passwords are hashed with bcryptjs.
- JWT secret must be changed before any deployment.
- This starter is designed for local development, not production clinical use. Add HTTPS, stronger rate limits, secure backups, malware scanning, retention controls and a privacy review before deployment.
- Do not expose the backend or Ollama port publicly.

## 6. Useful commands

```bash
# backend
cd backend && npm run dev

# frontend
cd frontend && npm run dev

# production frontend build
cd frontend && npm run build
```

## 7. Project structure

```text
MediMind/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── data/
│   ├── uploads/
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── context/
    │   └── api.js
    └── package.json
```


## Health Chat

The authenticated `/health-chat` page provides a conversational health-education assistant.
It uses the same local Ollama model configured for report analysis (`OLLAMA_URL` and
`OLLAMA_MODEL`) and sends recent conversation turns to Ollama's `/api/chat` endpoint.
No paid API key is required. Conversations are saved per account in `backend/data/db.json`
(see the next section).

The assistant is intended for general education only. It must not diagnose, prescribe,
or replace professional care. Emergency symptoms should be directed to emergency services.

## Persistent Health Chat and report extraction improvements
Health Chat conversations are stored in `backend/data/db.json`, linked to the signed-in account. Create, reopen, rename and delete chats; they remain after navigation and refresh. This is local storage on the backend computer, not cloud sync. Existing database files are upgraded automatically. Text PDFs, DOCX and TXT files are extracted directly; image uploads use Tesseract OCR. Scanned/image-only PDFs are detected and produce a clear message instead of an empty summary. OCR depends on image quality. Analysis is informational only; compare every extracted result with the original report and consult a clinician.

## Optional configuration
- `VITE_API_URL` (frontend `.env`): override the backend URL (default `http://localhost:5000/api`). If you open the app from another device, also set `FRONTEND_URL` in `backend/.env` to that origin.
