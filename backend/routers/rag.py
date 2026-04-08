# backend/routers/rag.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.rag import search
from services.llm import ask_llm

router = APIRouter()

class RagRequest(BaseModel):
    query: str
    k: int = 3
    with_answer: bool = True   # RAG 결과 + LLM 답변 여부

@router.post("/search")
def rag_search(req: RagRequest):
    if not req.query.strip():
        raise HTTPException(400, "query가 비어있습니다.")

    docs = search(req.query, k=req.k)
    result = {"docs": docs, "answer": None}

    if req.with_answer and docs and not docs[0]["content"].startswith("인덱싱"):
        context = "\n\n".join(d["content"] for d in docs)
        prompt  = f"다음 문서를 참고해 질문에 답하세요.\n\n[문서]\n{context}\n\n[질문]\n{req.query}"
        try:
            result["answer"] = ask_llm(prompt)
        except RuntimeError as e:
            result["answer"] = f"LLM 오류: {e}"

    return result
