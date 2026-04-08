# backend/routers/health.py
from fastapi import APIRouter
from services.llm import ping_llm
from services.db  import test_connection

router = APIRouter()

@router.get("")
def health():
    return {"status": "ok"}

@router.get("/detail")
def health_detail():
    """LLM + DB 상태를 한 번에 반환 — 프론트 StatusBar에서 사용"""
    llm_status = ping_llm()
    db_status  = test_connection()
    return {
        "status": "ok",
        "llm": llm_status,
        "db":  db_status,
    }
