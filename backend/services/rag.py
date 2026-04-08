# backend/services/rag.py
from functools import lru_cache
from config import CHROMA_DIR, EMBEDDING_MODEL


@lru_cache(maxsize=1)
def _get_db():
    try:
        from langchain_huggingface import HuggingFaceEmbeddings
    except ImportError:
        from langchain.embeddings import HuggingFaceEmbeddings
    from langchain_community.vectorstores import Chroma

    emb = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    return Chroma(persist_directory=CHROMA_DIR, embedding_function=emb)


def search(query: str, k: int = 3) -> list[dict]:
    if not query.strip():
        return []
    try:
        db = _get_db()
        if db._collection.count() == 0:
            return [{"content": "인덱싱된 문서가 없습니다.", "source": "", "score": 0}]
        results = db.similarity_search_with_score(query, k=k)
        return [
            {"content": d.page_content, "source": d.metadata.get("source",""), "score": round(float(s),4)}
            for d, s in results
        ]
    except Exception as e:
        return [{"content": f"검색 오류: {e}", "source": "", "score": 0}]
