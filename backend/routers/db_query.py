# backend/routers/db_query.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.db import run_query, test_connection
from services.llm import ask_llm

router = APIRouter()

class QueryRequest(BaseModel):
    sql: str
    max_rows: int = 5000

class NLRequest(BaseModel):
    question: str   # 자연어 질문 → SQL 생성

@router.post("/query")
def query(req: QueryRequest):
    result = run_query(req.sql, req.max_rows)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result

@router.post("/nl2sql")
def nl2sql(req: NLRequest):
    """자연어 → SQL 생성"""
    prompt = (
        f"MSSQL 데이터베이스에서 다음 질문에 맞는 SELECT SQL 쿼리를 작성하세요.\n"
        f"SQL 코드만 출력하고 설명은 하지 마세요.\n\n질문: {req.question}"
    )
    try:
        sql = ask_llm(prompt)
        return {"sql": sql}
    except RuntimeError as e:
        raise HTTPException(503, str(e))

@router.get("/ping")
def ping():
    return test_connection()
