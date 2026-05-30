# FuncName — AI Function Name Generator

A full-stack app: a dark-themed static frontend (HTML/CSS/JS) + a Python FastAPI backend using LangChain + Groq.

## Project structure

```
funcname-site/
├── index.html          # Frontend page
├── style.css           # Styles
├── app.js              # Frontend logic (calls the Python backend)
├── README.md
└── backend/
    ├── main.py         # FastAPI app with LangChain + Groq
    ├── requirements.txt
    └── .env.example
```

---

## Backend setup

### 1. Get a Groq API key
Sign up free at [console.groq.com](https://console.groq.com) and create an API key.

### 2. Install dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env and paste your GROQ_API_KEY
```

### 4. Run the server
```bash
uvicorn main:app --reload
# Server runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

---

## Frontend setup

The frontend is a static site — no build step needed.

For **local development**, open `index.html` with a local server (e.g. VS Code Live Server, or `python -m http.server`). The `API_BASE` in `app.js` defaults to `http://localhost:8000`.

For **GitHub Pages**:
1. Deploy the backend somewhere public (see below)
2. Update `API_BASE` in `app.js` to your deployed backend URL
3. Push `index.html`, `style.css`, `app.js` to your repo
4. Enable GitHub Pages under **Settings → Pages**

---

## Deploying the backend

### Render (free tier)
1. Push the `backend/` folder to a GitHub repo
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set **Build command**: `pip install -r requirements.txt`
4. Set **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add `GROQ_API_KEY` as an environment variable
6. Copy the service URL and set it as `API_BASE` in `app.js`

### Railway / Fly.io
Similar steps — set the start command to `uvicorn main:app --host 0.0.0.0 --port $PORT` and add `GROQ_API_KEY` as an env var.

---

## API reference

### `POST /generate`
```json
// Request
{
  "description": "check if a user is logged in",
  "history": [
    { "role": "user", "content": "get all active users" },
    { "role": "assistant", "content": "fetchActiveUsers" }
  ]
}

// Response
{ "name": "isLoggedIn" }
```

### `GET /health`
```json
{ "status": "ok" }
```
