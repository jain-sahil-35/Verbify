from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
from typing import List
import json
import re

load_dotenv()

app = FastAPI(title="Verbify API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lock down to your GitHub Pages URL in production
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ── LLM ──
llm = ChatGroq(
    model_name="llama-3.1-8b-instant",
    temperature=0.7   # Slightly higher for more varied alternatives
)

# ── Naming rules per type ──
NAMING_RULES = {
    "function": """- Use camelCase (e.g. fetchActiveUsers, isValidEmail, registerUser)
- Always start with a verb (get, set, fetch, check, handle, create, update, delete, validate, parse, format, build, send, load, save, is, has, can)
- Keep it short but self-documenting
- Examples: "Create a user account" → registerUser | "Check if email is valid" → isValidEmail | "Get all active users" → fetchActiveUsers""",

    "variable": """- Use camelCase (e.g. activeUserCount, maxRetryLimit, isLoggedIn)
- Prefer nouns or noun phrases
- Booleans should start with is, has, can, should (e.g. isLoading, hasError)
- Counts/numbers should end with Count, Total, Max, Min (e.g. retryCount, maxItems)
- Examples: "Number of active users" → activeUserCount | "Whether the form is loading" → isFormLoading | "Maximum retry attempts" → maxRetryCount""",

    "class": """- Use PascalCase (e.g. UserAuthService, PaymentProcessor, DatabaseConnection)
- Use nouns or noun phrases — never verbs
- Prefer OOP conventions: Manager, Service, Handler, Controller, Repository, Factory, Builder, Processor, Validator, Provider
- Examples: "Handles user authentication" → AuthenticationManager | "Processes payments" → PaymentProcessor | "Connects to database" → DatabaseConnection""",

    "file": """- Use kebab-case (e.g. auth-routes, user-controller, payment-service)
- All lowercase, words separated by hyphens
- Be concise — 2-3 words maximum
- No file extension in the name
- Examples: "Authentication routes" → auth-routes | "User profile page" → user-profile | "API error handler" → error-handler"""
}

# ── Prompt ──
# The system prompt instructs the model to return strict JSON with best + alternatives.
prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are Verbify, an expert developer naming assistant.

Your task is to generate names for the given naming type based on the description.

NAMING TYPE: {type}

RULES FOR THIS TYPE:
{rules}

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON object. No explanation, no markdown, no code fences.
- Generate exactly 1 best name and exactly 2 alternative names.
- All names must strictly follow the rules for the naming type.
- Names must be concise, professional, and follow industry conventions.
- Do NOT include explanations, comments, or anything outside the JSON.

REQUIRED OUTPUT FORMAT:
{{"best": "primaryName", "alternatives": ["altName1", "altName2"]}}"""
    ),
    MessagesPlaceholder(variable_name="history"),
    ("human", "Type: {type}\nDescription: {description}")
])

chain = prompt | llm


# ── Request / Response models ──

class HistoryMessage(BaseModel):
    role: str        # "user" or "assistant"
    content: str

class GenerateRequest(BaseModel):
    type: str        # "function" | "variable" | "class" | "file"
    description: str
    history: List[HistoryMessage] = []

class GenerateResponse(BaseModel):
    best: str
    alternatives: List[str]


# ── Helpers ──

VALID_TYPES = {"function", "variable", "class", "file"}

def parse_names_from_response(raw: str) -> dict:
    """
    Robustly extract best + alternatives from LLM output.
    Tries JSON parse first, then falls back to regex extraction.
    """
    # Strip any accidental markdown fences
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()

    # Attempt direct JSON parse
    try:
        data = json.loads(cleaned)
        best = str(data.get("best", "")).strip()
        alts = [str(a).strip() for a in data.get("alternatives", []) if str(a).strip()]
        if best:
            return {"best": best, "alternatives": alts[:2]}
    except (json.JSONDecodeError, AttributeError):
        pass

    # Fallback: regex extraction
    best_match = re.search(r'"best"\s*:\s*"([^"]+)"', cleaned)
    alts_matches = re.findall(r'"alternatives"\s*:\s*\[([^\]]+)\]', cleaned)

    best = best_match.group(1).strip() if best_match else None
    alts = []
    if alts_matches:
        alts = re.findall(r'"([^"]+)"', alts_matches[0])

    if best:
        return {"best": best, "alternatives": alts[:2]}

    # Last resort: take the first word-like token as best
    tokens = re.findall(r'\b[a-zA-Z][a-zA-Z0-9\-_]*\b', cleaned)
    if tokens:
        return {"best": tokens[0], "alternatives": tokens[1:3]}

    raise ValueError("Could not parse a valid name from the model response.")


# ── Routes ──

@app.post("/generate", response_model=GenerateResponse)
async def generate_name(req: GenerateRequest):
    # Validate inputs
    if not req.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty.")

    naming_type = req.type.lower().strip()
    if naming_type not in VALID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid type '{req.type}'. Must be one of: function, variable, class, file."
        )

    # Convert history to LangChain message objects
    lc_history = []
    for msg in req.history:
        if msg.role == "user":
            lc_history.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            lc_history.append(AIMessage(content=msg.content))

    try:
        response = chain.invoke({
            "type": naming_type,
            "description": req.description,
            "rules": NAMING_RULES[naming_type],
            "history": lc_history
        })

        parsed = parse_names_from_response(response.content)

        # Ensure we always have 2 alternatives (pad if model returned fewer)
        while len(parsed["alternatives"]) < 2:
            parsed["alternatives"].append(parsed["best"])

        return GenerateResponse(
            best=parsed["best"],
            alternatives=parsed["alternatives"][:2]
        )

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {
        "message": "Verbify API v2 is running",
        "docs": "/docs",
        "health": "/health"
    }
