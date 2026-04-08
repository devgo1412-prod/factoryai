# =============================
# backend/main.py - FastAPI 서버
# =============================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, rag, db_query, health

app = FastAPI(title="Factory AI Copilot API", version="1.0.0")

# CORS 설정 (React 개발서버 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router,     prefix="/api/chat",   tags=["Chat"])
app.include_router(rag.router,      prefix="/api/rag",    tags=["RAG"])
app.include_router(db_query.router, prefix="/api/db",     tags=["Database"])
app.include_router(health.router,   prefix="/api/health", tags=["Health"])
