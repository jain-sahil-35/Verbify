# Verbify — AI Function Name Generator

Verbify is an AI-powered developer tool that converts natural-language descriptions into concise, meaningful function names.

Built using FastAPI, LangChain, Groq, and Llama 3.1, Verbify helps developers quickly generate clean and professional function names while coding.

---

## Example

### Input

```text
Check whether a user is logged in
```

### Output

```text
isLoggedIn
```

### Another Example

#### Input

```text
Remove duplicate values from an array
```

#### Output

```text
deduplicate
```

---

## Features

- AI-powered function name generation
- Context-aware naming using chat history
- FastAPI backend
- Groq-powered LLM inference
- Clean and modern frontend
- Easy local setup
- Ready for deployment on Render, Railway, or Fly.io

---

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- FastAPI
- LangChain
- Groq API

### AI Model
- Llama 3.1 8B Instant

---

## Project Structure

```text
Verbify/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/jain-sahil-35/Verbify.git
cd Verbify
```

## Backend Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
```

### 2. Activate Virtual Environment

#### Windows

```bash
venv\Scripts\activate
```

#### Linux / macOS

```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file:

```env
GROQ_API_KEY=your_groq_api_key
```

### 5. Run the Backend

```bash
uvicorn main:app --reload
```

Backend:
```text
http://localhost:8000
```

API Docs:
```text
http://localhost:8000/docs
```

---

## Frontend Setup

Open `frontend/index.html` using VS Code Live Server

OR

```bash
cd frontend
python -m http.server 5500
```

Open:

```text
http://localhost:5500
```

---

## API Reference

### POST /generate

#### Request

```json
{
  "description": "check if a user is logged in",
  "history": [
    {
      "role": "user",
      "content": "get all active users"
    },
    {
      "role": "assistant",
      "content": "fetchActiveUsers"
    }
  ]
}
```

#### Response

```json
{
  "name": "isLoggedIn"
}
```

### GET /health

```json
{
  "status": "ok"
}
```

---

## Deployment

### Frontend (GitHub Pages)

1. Push the repository to GitHub.
2. Open Settings → Pages.
3. Select "Deploy from a branch".
4. Choose the `main` branch.
5. Save changes.

### Backend (Render)

Build Command:

```bash
pip install -r requirements.txt
```

Start Command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Environment Variable:

```env
GROQ_API_KEY=your_api_key
```

---

## Roadmap

### Phase 1 (Completed)
- Function naming assistant

### Phase 2 (In Progress)
- Variable name suggestions
- Class name suggestions
- File name suggestions

### Phase 3 (Planned)
- Context-aware naming improvements
- Multiple naming options

### Phase 4 (Planned)
- Code-to-name generation
- Refactoring assistance

### Phase 5 (Planned)
- Repository-wide naming recommendations

---

## Contributing

Contributions, ideas, and feature requests are welcome.

Feel free to fork the repository and submit a pull request.

---

## License

MIT License

---

## Author

**Sahil Jain**

Built with FastAPI, LangChain, Groq, and a passion for developer tooling.
