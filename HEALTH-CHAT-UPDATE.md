# MediMind Health Chat Update

This package includes the improved project plus a new Health Chat section.

## What's new
- Sidebar navigation item: Health chat
- New page at `/health-chat`
- Conversational UI with starter prompts, loading state, clear/new chat and error handling
- Authenticated backend endpoint: `POST /api/chat`
- Uses your local Ollama model (`llama3.2:3b` by default)
- Sends the last 20 messages of context to Ollama, no paid API key
- Health-safety system prompt: education only, no diagnosis or prescriptions, emergency escalation

## Apply
1. Back up your existing project folder.
2. Extract this ZIP.
3. Copy the included `MediMind` folder contents over your existing project, allowing files to be replaced.
4. Keep your existing `backend/.env`, `backend/data/db.json`, and any local uploads. Do not overwrite these with blank/default copies.
5. In backend terminal run `npm install` if needed, then `npm run dev`.
6. In frontend terminal run `npm install` if needed, then `npm run dev`.
7. Sign in and select **Health chat** in the sidebar.

## Notes
- Ollama must be running at `http://localhost:11434`.
- `OLLAMA_MODEL=llama3.2:3b` should be present in `backend/.env`.
- Chat history is saved to `backend/data/db.json` per account, so it persists across refreshes and sign-ins on this computer.
- This is an educational tool, not a medical device. Do not use it for diagnosis or emergencies.
