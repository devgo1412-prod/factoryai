# =============================
# backend/ingest.py - RAG 문서 인덱싱
# =============================
import os, sys, shutil, argparse
from pathlib import Path
from config import CHROMA_DIR, EMBEDDING_MODEL


def _load_documents(file_path: str):
    ext = Path(file_path).suffix.lower()
    try:
        if ext in (".txt", ".md", ".log", ".csv"):
            from langchain_community.document_loaders import TextLoader
            return TextLoader(file_path, encoding="utf-8").load()
        elif ext == ".pdf":
            from langchain_community.document_loaders import PyPDFLoader
            return PyPDFLoader(file_path).load()
        elif ext in (".docx", ".doc"):
            from langchain_community.document_loaders import Docx2txtLoader
            return Docx2txtLoader(file_path).load()
        else:
            print(f"  ⚠️  지원하지 않는 형식: {ext}")
            return []
    except Exception as e:
        print(f"  ❌ 로드 실패 ({file_path}): {e}")
        return []


def ingest(file_paths: list, reset: bool = False):
    try:
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        from langchain_community.vectorstores import Chroma
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
        except ImportError:
            from langchain.embeddings import HuggingFaceEmbeddings
    except ImportError as e:
        print(f"패키지 없음: {e}")
        sys.exit(1)

    print(f"\n{'='*50}\n  RAG 인덱싱 시작\n  저장 경로: {CHROMA_DIR}\n{'='*50}\n")

    print("📦 임베딩 모델 로딩 중...")
    embedding = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    if reset and os.path.exists(CHROMA_DIR):
        shutil.rmtree(CHROMA_DIR)
        print(f"🗑️  기존 인덱스 삭제: {CHROMA_DIR}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500, chunk_overlap=50,
        separators=["\n\n", "\n", ".", " ", ""],
    )

    all_texts = []
    for fp in file_paths:
        if not os.path.exists(fp):
            print(f"  ⚠️  파일 없음: {fp}"); continue
        print(f"📄 처리 중: {fp}")
        docs  = _load_documents(fp)
        texts = splitter.split_documents(docs)
        print(f"     → {len(docs)}개 문서 → {len(texts)}개 청크")
        all_texts.extend(texts)

    if not all_texts:
        print("\n❌ 인덱싱할 문서가 없습니다."); return

    print(f"\n🔄 총 {len(all_texts)}개 청크 임베딩 중...")
    Chroma.from_documents(all_texts, embedding, persist_directory=CHROMA_DIR)
    print(f"\n✅ 완료! {len(all_texts)}개 청크 저장됨 → {CHROMA_DIR}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="문서를 ChromaDB에 인덱싱합니다.")
    parser.add_argument("files", nargs="+", help="인덱싱할 파일 경로")
    parser.add_argument("--reset", action="store_true", help="기존 인덱스 초기화")
    args = parser.parse_args()
    ingest(args.files, reset=args.reset)
    # 사용 예: python ingest.py ./docs/매뉴얼.txt ./docs/보고서.pdf --reset
