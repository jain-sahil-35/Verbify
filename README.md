# Verbify — AI Developer Naming Assistant

Verbify is an AI-powered developer tool that converts natural-language descriptions into clean, convention-correct names for **functions, variables, classes, and files**.

Built using FastAPI, LangChain, Groq, and Llama 3.1 8B Instant.

---

## What's new in v2

- **4 naming types**: Function (camelCase), Variable (camelCase), Class (PascalCase), File (kebab-case)
- **3 suggestions per request**: 1 best match + 2 alternatives, all copyable
- **Type-aware prompt engineering**: each type has its own rules and examples
- **Robust JSON parsing**: fallback regex extraction if the model drifts from JSON
- **Improved error handling**: network failures, invalid inputs, bad responses
- **Updated history panel**: shows type badge + best name + alternatives

---

## Example

| Type | Description | Best | Alternatives |
|------|-------------|------|--------------|
| function | Check if a user exists | `findUser` | `getUser`, `lookupUser` |
| variable | Number of active users | `activeUserCount` | `onlineUserCount`, `activeUsersTotal` |
| class | Handles payment processing | `PaymentProcessor` | `PaymentHandler`, `PaymentService` |
| file | Authentication routes | `auth-routes` | `auth-router`, `authentication-routes` |

---

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (no build step)
- **Backend**: Python, FastAPI, LangChain, Groq API
- **Model**: Llama 3.1 8B Instant

---

## Project Structure

```
Verbify/
├── backend/
│   ├── main.py            ← FastAPI app (v2)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── README.md
```

---

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # Add your GROQ_API_KEY
uvicorn main:app --reload
```

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

### Frontend

Open `frontend/index.html` with Live Server, or:

```bash
cd frontend
python -m http.server 5500
```

---

## API Reference

### `POST /generate`

```json
// Request
{
  "type": "function",
  "description": "check if a user is logged in",
  "history": [
    { "role": "user", "content": "[function] get all active users" },
    { "role": "assistant", "content": "fetchActiveUsers" }
  ]
}

// Response
{
  "best": "isLoggedIn",
  "alternatives": ["checkUserSession", "isUserAuthenticated"]
}
```

Valid `type` values: `function` | `variable` | `class` | `file`

### `GET /health`

```json
{ "status": "ok" }
```

---

## Deployment

### Frontend → GitHub Pages

1. Push to GitHub
2. Settings → Pages → Deploy from `main` branch
3. Update `API_BASE` in `app.js` to your Render URL

### Backend → Render

- **Build**: `pip install -r requirements.txt`
- **Start**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Env var**: `GROQ_API_KEY=your_key`

---

## Roadmap

- [x] Phase 1 — Function naming
- [x] Phase 2 — Multi-type naming (function / variable / class / file) + multiple suggestions
- [ ] Phase 3 — Context-aware consistency improvements
- [ ] Phase 4 — Code snippet → name generation
- [ ] Phase 5 — Repository-wide naming recommendations

---

## Author

**Sahil Jain** · Built with FastAPI, LangChain, Groq, and a passion for developer tooling.
