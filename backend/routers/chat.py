# backend/routers/chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.llm import ask_llm, ping_llm

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: str
    system: str = ""

class ChatResponse(BaseModel):
    answer: str

@router.post("", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not req.prompt.strip():
        raise HTTPException(400, "prompt가 비어있습니다.")
    try:
        answer = ask_llm(req.prompt, req.system)
        return ChatResponse(answer=answer)
    except RuntimeError as e:
        raise HTTPException(503, str(e))

@router.get("/ping")
def ping():
    return ping_llm()
