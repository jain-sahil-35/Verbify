from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
from typing import List
import os

load_dotenv()

app = FastAPI(title="FuncName API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lock this down to your GitHub Pages URL in production
    allow_methods=["POST"],
    allow_headers=["*"],
)

llm = ChatGroq(
    model_name="llama-3.1-8b-instant",
    temperature=0.5
)

prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a function naming assistant.

Generate a concise function name from the description.

Rules:
- Return ONLY the function name. Nothing else. No punctuation, no explanation, no quotes.
- Use camelCase.
- Prefer verbs.
- Make the names as short as possible while remaining clear."""
    ),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{description}")
])

chain = prompt | llm


# ── Request / Response models ──

class HistoryMessage(BaseModel):
    role: str        # "user" or "assistant"
    content: str

class GenerateRequest(BaseModel):
    description: str
    history: List[HistoryMessage] = []

class GenerateResponse(BaseModel):
    name: str


# ── Route ──

@app.post("/generate", response_model=GenerateResponse)
async def generate_name(req: GenerateRequest):
    if not req.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty.")

    # Convert history to LangChain message objects
    lc_history = []
    for msg in req.history:
        if msg.role == "user":
            lc_history.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            lc_history.append(AIMessage(content=msg.content))

    try:
        response = chain.invoke({
            "description": req.description,
            "history": lc_history
        })
        # Strip any accidental whitespace or punctuation
        name = response.content.strip().split()[0]
        return GenerateResponse(name=name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}
