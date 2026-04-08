"""
healthcheck.py
==============
서버 B에서 실행 — 3개 서버의 상태를 한 번에 점검합니다.

사용법:
    python healthcheck.py
    python healthcheck.py --fix    ← 문제 발견 시 서비스 재시작 시도
"""
import argparse, subprocess, sys
import urllib.request, urllib.error, json
from config import LLM_API_BASE_URL, LLM_API_KEY, DB_SERVER, DB_NAME

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
RESET  = "\033[0m"

def ok(msg):    print(f"  {GREEN}✅ {msg}{RESET}")
def fail(msg):  print(f"  {RED}❌ {msg}{RESET}")
def warn(msg):  print(f"  {YELLOW}⚠️  {msg}{RESET}")

results = {}


def check_llm():
    print("\n[1] LLM 서버 (Ollama)")
    try:
        req = urllib.request.Request(
            f"{LLM_API_BASE_URL.rstrip('/')}/models",
            headers={"Authorization": f"Bearer {LLM_API_KEY}"}
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            data   = json.loads(r.read())
            models = [m["id"] for m in data.get("data", [])]
            ok(f"연결 성공 | 모델: {', '.join(models) if models else '없음'}")
            results["llm"] = True
    except urllib.error.URLError as e:
        fail(f"연결 실패: {e}")
        results["llm"] = False
    except Exception as e:
        fail(f"오류: {e}")
        results["llm"] = False


def check_backend():
    print("\n[2] FastAPI Backend (localhost:8000)")
    try:
        with urllib.request.urlopen("http://localhost:8000/api/health", timeout=5) as r:
            data = json.loads(r.read())
            if data.get("status") == "ok":
                ok("정상 응답")
                results["backend"] = True
            else:
                warn(f"비정상 응답: {data}")
                results["backend"] = False
    except Exception as e:
        fail(f"연결 실패: {e}")
        results["backend"] = False


def check_db():
    print("\n[3] MSSQL DB")
    try:
        from services.db import test_connection
        r = test_connection()
        if r["ok"]:
            ok(r["message"])
            results["db"] = True
        else:
            fail(r["message"])
            results["db"] = False
    except Exception as e:
        fail(f"오류: {e}")
        results["db"] = False


def check_chroma():
    print("\n[4] ChromaDB (벡터 인덱스)")
    try:
        from services.rag import _get_db
        db    = _get_db()
        count = db._collection.count()
        if count > 0:
            ok(f"인덱스 정상 | {count:,}개 청크")
        else:
            warn("인덱스 비어있음 — ingest.py 실행 필요")
        results["chroma"] = True
    except Exception as e:
        fail(f"ChromaDB 오류: {e}")
        results["chroma"] = False


def restart_service(name):
    print(f"  → 서비스 재시작 시도: {name}")
    r = subprocess.run(["sc", "stop",  name], capture_output=True)
    r = subprocess.run(["sc", "start", name], capture_output=True)
    if r.returncode == 0:
        ok(f"{name} 재시작 완료")
    else:
        fail(f"{name} 재시작 실패 — 수동으로 services.msc 확인 필요")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--fix", action="store_true", help="문제 발견 시 서비스 재시작 시도")
    args = parser.parse_args()

    print("=" * 50)
    print("  Factory AI Copilot — 헬스체크")
    print("=" * 50)

    check_llm()
    check_backend()
    check_db()
    check_chroma()

    print("\n" + "=" * 50)
    all_ok = all(results.values())
    if all_ok:
        print(f"  {GREEN}모든 서비스 정상입니다.{RESET}")
    else:
        failed = [k for k, v in results.items() if not v]
        print(f"  {RED}문제 있는 항목: {', '.join(failed)}{RESET}")

        if args.fix:
            print("\n[자동 복구 시도]")
            if not results.get("llm"):
                restart_service("OllamaService")
            if not results.get("backend"):
                restart_service("FactoryBackend")

    print("=" * 50 + "\n")
    sys.exit(0 if all_ok else 1)
