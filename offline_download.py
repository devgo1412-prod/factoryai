"""
offline_download.py
====================
인터넷 되는 PC에서 실행하여 폐쇄망 서버용 패키지를 모두 준비합니다.
실행 환경: Python 3.11, Windows

사용법:
    python offline_download.py

결과물 (모두 USB에 담아 서버로 이동):
    offline/
    ├── python_packages/     ← pip 오프라인 설치용
    ├── models/
    │   └── all-MiniLM-L6-v2/  ← Embedding 모델
    └── README_설치순서.txt
"""

import os, sys, subprocess, shutil, urllib.request

BASE = "./offline"
PKG_DIR   = f"{BASE}/python_packages"
MODEL_DIR = f"{BASE}/models"

os.makedirs(PKG_DIR,   exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)


def run(cmd, **kw):
    print(f"\n▶ {cmd}")
    result = subprocess.run(cmd, shell=True, **kw)
    if result.returncode != 0:
        print(f"  ❌ 실패 (코드 {result.returncode})")
    return result.returncode == 0


print("=" * 60)
print("  Factory AI Copilot — 오프라인 패키지 다운로드")
print("=" * 60)

# ── 1. Python 패키지 ─────────────────────────────────────
print("\n[1/3] Python 패키지 다운로드...")
req_file = os.path.join(os.path.dirname(__file__), "backend", "requirements.txt")
if not os.path.exists(req_file):
    print(f"  ⚠️  {req_file} 없음. 현재 디렉토리에서 직접 실행하세요.")
    sys.exit(1)

run(f'pip download -r "{req_file}" -d "{PKG_DIR}" --platform win_amd64 --python-version 3.11 --only-binary=:all:')
# binary 전용 실패 시 소스도 허용
run(f'pip download -r "{req_file}" -d "{PKG_DIR}"')

print(f"  ✅ 저장 위치: {PKG_DIR}")

# ── 2. Embedding 모델 ────────────────────────────────────
print("\n[2/3] Embedding 모델 다운로드 (sentence-transformers)...")
try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-MiniLM-L6-v2")
    save_path = os.path.join(MODEL_DIR, "all-MiniLM-L6-v2")
    model.save(save_path)
    print(f"  ✅ 저장 위치: {save_path}")
except ImportError:
    print("  ⚠️  sentence-transformers 없음. 먼저 설치하세요:")
    print("       pip install sentence-transformers")
except Exception as e:
    print(f"  ❌ 다운로드 실패: {e}")

# ── 3. README 생성 ───────────────────────────────────────
print("\n[3/3] 설치 순서 README 생성...")
readme = """
====================================================
  Factory AI Copilot — 폐쇄망 설치 순서
====================================================

[서버 A — LLM 서버]
1. OllamaSetup.exe 설치
2. GGUF 모델 파일을 C:\\ollama\\models\\ 에 복사
3. Modelfile 작성 후: ollama create llama3 -f Modelfile
4. 환경변수: OLLAMA_HOST=0.0.0.0:11434
5. 포트 11434 방화벽 개방
6. NSSM으로 서비스 등록

[서버 B — Backend]
1. python-3.11.x-amd64.exe 설치 (PATH 포함)
2. msodbcsql17.msi 설치
3. 프로젝트 폴더 생성: C:\\factory_app\\backend
4. 가상환경: python -m venv env
5. 패키지 설치:
   env\\Scripts\\activate
   pip install --no-index --find-links=.\\python_packages -r requirements.txt
6. models\\all-MiniLM-L6-v2 폴더를 C:\\factory_app\\models\\ 에 복사
7. .env 파일 작성 (LLM URL, DB 정보)
8. 실행 테스트: start.bat
9. NSSM으로 서비스 등록
10. 포트 8000 방화벽 개방

[서버 C — Frontend]
1. dist\\ 폴더를 C:\\factory_app\\frontend\\dist\\ 에 복사
2. nginx.conf 수정 (서버B IP 입력)
3. Nginx 압축 해제 → C:\\nginx
4. NSSM으로 서비스 등록
5. 포트 80 방화벽 개방

[문서 인덱싱 — 서버 B에서]
  cd C:\\factory_app\\backend
  env\\Scripts\\activate
  python ingest.py C:\\docs\\매뉴얼.txt --reset

====================================================
"""
with open(f"{BASE}/README_설치순서.txt", "w", encoding="utf-8") as f:
    f.write(readme)

print(f"  ✅ 저장: {BASE}/README_설치순서.txt")
print(f"\n{'='*60}")
print(f"  완료! '{BASE}' 폴더를 USB에 담아 서버로 이동하세요.")
print(f"{'='*60}\n")
