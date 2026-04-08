# Factory AI Copilot — 세션 Q&A 기록

> **세션 일시**: 2026-04-06  
> **주제**: Windows 폐쇄망 환경의 Factory AI Copilot 개발 전 과정  
> **구성**: 소스 분석·수정 → Frontend/Backend 분리 → 서버 구성 절차

---

## 목차

1. [원본 소스 분석 및 수정](#1-원본-소스-분석-및-수정)
2. [venv 실행 오류 해결](#2-venv-실행-오류-해결)
3. [React + FastAPI 분리 아키텍처](#3-react--fastapi-분리-아키텍처)
4. [서버 구성 절차 (폐쇄망 Windows Server)](#4-서버-구성-절차-폐쇄망-windows-server)
5. [전체 파일 목록](#5-전체-파일-목록)

---

## 1. 원본 소스 분석 및 수정

### Q. 이 소스들의 문제점 분석하고 수정해줘. LLM 서버와 모델 부분은 회사 서버에 있으니까 정보를 확인해서 넣을 수 있게만 해줘.

**원본 소스 구성**
- `app.py` — Streamlit UI
- `llm.py` — ctransformers 로컬 GGUF 로드
- `rag.py` — ChromaDB 벡터 검색
- `db.py` — MSSQL 연결
- `ingest.py` — 문서 인덱싱

---

### 문제점 분석

#### `llm.py`
| 문제 | 수정 |
|------|------|
| 로컬 GGUF 파일만 지원, 서버 연결 불가 | API 모드 추가 — Ollama/vLLM/LM Studio 등 OpenAI 호환 서버 지원 |
| 연결 실패 시 앱 전체 크래시 | try/except로 에러 메시지 반환 |
| 서버 주소/모델명이 코드에 하드코딩 | `config.py` + `.env`로 완전 분리 |

#### `rag.py`
| 문제 | 수정 |
|------|------|
| `search_docs()` 호출마다 vectorstore 새로 생성 (매우 느림) | `@lru_cache` 싱글톤으로 변경 |
| `HuggingFaceEmbeddings` deprecated 경로 | `langchain_huggingface` 패키지 우선 사용 |
| 빈 DB 검색 시 크래시 | collection count 확인 후 안내 메시지 |

#### `db.py`
| 문제 | 수정 |
|------|------|
| DB 연결 실패 시 앱 크래시 | try/except + (DataFrame, 에러메시지) 튜플 반환 |
| `DB_DRIVER` 기본값이 구버전 `"SQL Server"` | `"ODBC Driver 17 for SQL Server"` 로 수정 |
| SQL Injection 무방비 | SELECT/WITH/EXEC만 허용, DROP/DELETE 등 차단 |
| `conn.close()` 누락 가능성 | `finally` 블록으로 보장 |

#### `ingest.py`
| 문제 | 수정 |
|------|------|
| TXT 파일만 지원 | PDF, DOCX, MD, CSV 다중 포맷 지원 |
| `db.persist()` deprecated (ChromaDB 0.4+) | 제거 (자동 저장) |
| CLI 인터페이스 없음 | argparse로 `--reset` 옵션 포함 CLI 추가 |

#### `app.py`
| 문제 | 수정 |
|------|------|
| LLM 로드 실패 시 전체 멈춤 | 에러 상태 표시 후 계속 실행 |
| 사이드바에 연결 상태 없음 | LLM/DB 연결 확인 버튼 추가 |
| RAG 결과가 raw list | expander 카드 + 유사도 표시 |
| MSSQL 결과에 에러 처리 없음 | 에러 메시지 표시 + CSV 다운로드 + 차트 추가 |

---

### 수정된 핵심 파일 요약

**`config.py`** — LLM 서버 정보를 한 곳에서 관리
```python
LLM_MODE = os.getenv("LLM_MODE", "api")
# "api"   : OpenAI 호환 REST API (Ollama, vLLM, LM Studio 등)
# "local" : 로컬 GGUF 파일 직접 로드

LLM_API_BASE_URL = os.getenv("LLM_API_BASE_URL", "http://YOUR_SERVER_IP:11434/v1")
LLM_MODEL_NAME   = os.getenv("LLM_MODEL_NAME", "llama3")
```

**`.env` 파일 설정 방법**
```
LLM_API_BASE_URL=http://192.168.1.100:11434/v1
LLM_MODEL_NAME=llama3
LLM_API_KEY=ollama
DB_SERVER=localhost
DB_NAME=YourDB
DB_TRUSTED=false
```

---

## 2. venv 실행 오류 해결

### Q. 파워쉘에서 `.\env\Scripts\Activate.ps1` 실행 시 오류

**오류 내용**
```
.\.venv\Scripts\Activate.ps1 : 이 시스템에서 스크립트 실행이 비활성화되어 있습니다.
```

**원인**: PowerShell 실행 정책이 스크립트 실행을 차단

**해결 방법 1 — 실행 정책 변경** (PowerShell 관리자 권한)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Y 입력 후 엔터
.\env\Scripts\Activate.ps1
```

**해결 방법 2 — CMD 사용** (더 간단)
```cmd
env\Scripts\activate.bat
```

### Q. `(env)` 가 이미 프롬프트 앞에 있는데?

프롬프트에 `(env)`가 붙어 있으면 **이미 가상환경이 활성화된 상태**입니다.  
중복 활성화 불필요 — 바로 실행하면 됩니다.

```powershell
pip install streamlit
streamlit run app.py
```

---

## 3. React + FastAPI 분리 아키텍처

### Q. 분석 결과를 차트·표 등으로 다양하게 보여주고 싶어. Frontend와 Backend로 소스와 서버를 분리하고 싶어. (React + FastAPI)

### 전체 아키텍처

```
factory_app/
├── backend/          ← FastAPI (포트 8000)
│   ├── main.py
│   ├── config.py
│   ├── ingest.py
│   ├── healthcheck.py
│   ├── start.bat
│   ├── routers/
│   │   ├── chat.py       POST /api/chat
│   │   ├── db_query.py   POST /api/db/query, /api/db/nl2sql
│   │   ├── rag.py        POST /api/rag/search
│   │   └── health.py     GET  /api/health, /api/health/detail
│   └── services/
│       ├── llm.py
│       ├── db.py
│       └── rag.py
│
└── frontend/         ← React + Vite (포트 3000)
    ├── build.bat
    └── src/
        ├── pages/
        │   ├── ChatPage.jsx
        │   ├── DBPage.jsx    표·요약통계·막대·라인 차트 탭
        │   └── RagPage.jsx
        └── components/
            ├── BarChart.jsx     SVG 막대 차트
            ├── LineChart.jsx    SVG 라인 차트 (시계열)
            ├── SummaryCards.jsx 숫자 컬럼 합계/평균/최대/최소
            └── StatusBar.jsx    LLM·DB 연결 상태 표시
```

### API 엔드포인트 전체 목록

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/chat` | LLM 챗봇 |
| GET  | `/api/chat/ping` | LLM 서버 연결 확인 |
| POST | `/api/db/query` | SQL 실행 |
| POST | `/api/db/nl2sql` | 자연어 → SQL 변환 |
| GET  | `/api/db/ping` | DB 연결 확인 |
| POST | `/api/rag/search` | 문서 검색 + AI 답변 |
| GET  | `/api/health` | 헬스체크 |
| GET  | `/api/health/detail` | LLM + DB 상태 통합 반환 |

### 화면별 기능

| 화면 | 기능 |
|------|------|
| 💬 Chat | LLM 서버와 실시간 대화, 대화 이력 유지 |
| 🔍 RAG Search | 문서 검색 + 유사도 % + AI 종합 답변 |
| 📊 데이터 분석 | SQL 실행 → 표 / 요약통계 / 막대차트 / 라인차트 탭 전환, CSV 다운로드, 자연어→SQL 생성 |

### 실행 방법

**Backend**
```powershell
cd backend
python -m venv env
.\env\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # .env 열어서 서버 정보 입력
uvicorn main:app --reload --port 8000
# 또는: start.bat
```

**Frontend** (인터넷 PC에서 빌드)
```powershell
cd frontend
npm install
npm run build        # dist/ 폴더 생성
# 또는 개발 서버: npm run dev → http://localhost:3000
```

---

## 4. 서버 구성 절차 (폐쇄망 Windows Server)

### Q. 서비스를 하려면 각 서버 구성 절차와 방법도 알려줘. (Windows Server / 3대 분리 / 완전 폐쇄망)

### 서버 역할 분리

| 서버 | 역할 | 권장 사양 | 주요 소프트웨어 |
|------|------|-----------|----------------|
| 서버 A | LLM 모델 서빙 | RAM 32GB+, Storage 200GB+ | Ollama + GGUF 모델 |
| 서버 B | FastAPI API + ChromaDB | RAM 16GB+, Storage 100GB+ | Python, FastAPI |
| 서버 C | React 웹 서비스 + Nginx | RAM 8GB+ | Nginx |
| 기존 DB 서버 | MSSQL | — | 그대로 활용 |

### 네트워크 흐름

```
사용자 PC
   ↓ HTTP :80
[서버 C] Nginx — React 정적파일 서빙 + /api/ 프록시
   ↓ HTTP :8000
[서버 B] FastAPI — 비즈니스 로직, ChromaDB, ODBC
   ↓ HTTP :11434        ↓ TCP :1433
[서버 A] Ollama      [기존 MSSQL 서버]
```

---

### 사전 준비 (인터넷 PC에서 수행)

**Python 패키지 다운로드**
```powershell
pip download -r requirements.txt -d ./offline_packages
# 또는 자동화 스크립트 사용:
python offline_download.py
```

**React 빌드**
```powershell
cd frontend
npm install
npm run build    # dist/ 폴더 생성 — 서버 C로 이동
```

**필요 파일 목록**
| 항목 | 다운로드 위치 |
|------|--------------|
| Ollama 설치파일 | https://ollama.com/download/OllamaSetup.exe |
| GGUF 모델 | https://huggingface.co |
| Embedding 모델 폴더 | HuggingFace: sentence-transformers/all-MiniLM-L6-v2 |
| Python 3.11 | https://python.org/downloads |
| ODBC Driver 17 | Microsoft 공식 사이트 |
| Nginx for Windows | https://nginx.org/en/download.html |
| NSSM | https://nssm.cc/download |

---

### 서버 A — Ollama LLM 서버 구성

```powershell
# 1. OllamaSetup.exe 설치

# 2. 모델 파일 배치
xcopy llama3-8b-q4.gguf C:\ollama\models\

# 3. Modelfile 작성 후 모델 등록
# Modelfile 내용:
#   FROM C:\ollama\models\llama3-8b-q4.gguf
#   PARAMETER num_ctx 4096
ollama create llama3 -f Modelfile
ollama run llama3 "안녕하세요"    # 동작 확인

# 4. 외부 접근 허용 (관리자 PowerShell)
[System.Environment]::SetEnvironmentVariable('OLLAMA_HOST','0.0.0.0:11434','Machine')

# 5. 방화벽 개방
New-NetFirewallRule -DisplayName 'Ollama API' -Direction Inbound -Protocol TCP -LocalPort 11434 -Action Allow

# 6. NSSM 서비스 등록
nssm install OllamaService "C:\Users\<user>\AppData\Local\Programs\Ollama\ollama.exe" serve
nssm set OllamaService AppEnvironmentExtra OLLAMA_HOST=0.0.0.0:11434
nssm start OllamaService
```
> ✅ 확인: 서버 B에서 `http://서버A_IP:11434/api/tags` 접근 확인

---

### 서버 B — FastAPI Backend 구성

```powershell
# 1. Python 설치
python-3.11.x-amd64.exe /quiet InstallAllUsers=1 PrependPath=1

# 2. 프로젝트 구성
mkdir C:\factory_app\backend
cd C:\factory_app\backend
python -m venv env
.\env\Scripts\activate

# 3. 오프라인 패키지 설치
pip install --no-index --find-links=C:\offline_packages -r requirements.txt

# 4. ODBC Driver 설치
msiexec /i msodbcsql17.msi IACCEPTMSODBCSQLLICENSETERMS=YES /quiet

# 5. Embedding 모델 배치
xcopy /e all-MiniLM-L6-v2 C:\factory_app\models\all-MiniLM-L6-v2\

# 6. .env 파일 설정
# LLM_API_BASE_URL=http://<서버A_IP>:11434/v1
# LLM_MODEL_NAME=llama3
# EMBEDDING_MODEL=C:\factory_app\models\all-MiniLM-L6-v2
# DB_SERVER=<MSSQL_서버_IP>
# DB_TRUSTED=true

# 7. 동작 확인
uvicorn main:app --host 0.0.0.0 --port 8000
# http://서버B_IP:8000/docs 접속 확인

# 8. 방화벽 + NSSM 서비스 등록 (자동화 스크립트)
register_services.bat B
```
> ✅ 확인: `http://서버B_IP:8000/api/health` → `{"status": "ok"}`

---

### 서버 C — React Frontend + Nginx 구성

```powershell
# 1. dist 폴더 배치
xcopy /e dist C:\factory_app\frontend\dist\

# 2. Nginx 압축 해제
Expand-Archive nginx-1.xx.x.zip -DestinationPath C:\nginx

# 3. nginx.conf 수정
# root   C:/factory_app/frontend/dist;
# proxy_pass http://<서버B_IP>:8000;  (위치: /api/ 블록)

# 4. 방화벽 + NSSM 서비스 등록 (자동화 스크립트)
register_services.bat C
```
> ✅ 확인: 사용자 PC에서 `http://서버C_IP` 접속

---

### RAG 문서 인덱싱 (서버 B에서)

```powershell
cd C:\factory_app\backend
.\env\Scripts\activate
python ingest.py C:\docs\매뉴얼.txt C:\docs\보고서.pdf --reset
```

---

### 헬스체크

```powershell
# 서버 B에서 3개 서버 상태 한 번에 점검
python healthcheck.py

# 문제 발견 시 자동 재시작
python healthcheck.py --fix
```

---

### 장애 대응

| 증상 | 원인 | 조치 |
|------|------|------|
| LLM 응답 없음 | Ollama 서비스 중단 | `services.msc` → OllamaService 재시작 |
| API 500 에러 | Backend 서비스 중단 | `services.msc` → FactoryBackend 재시작 |
| 화면 접속 불가 | Nginx 중단 | `services.msc` → NginxService 재시작 |
| DB 연결 실패 | ODBC 미설치 또는 방화벽 | msodbcsql17.msi 재설치, 포트 1433 확인 |
| RAG 검색 결과 없음 | 문서 미인덱싱 | `python ingest.py` 재실행 |
| 모델 응답 느림 | 메모리 부족 | Modelfile에서 `num_ctx` 줄이기 |

---

### 최초 배포 체크리스트

- [ ] 서버 A — Ollama 설치 및 모델 등록 완료
- [ ] 서버 A — `OLLAMA_HOST=0.0.0.0:11434` 환경변수 설정
- [ ] 서버 A — 포트 11434 방화벽 개방
- [ ] 서버 A — OllamaService 서비스 등록 및 자동시작 설정
- [ ] 서버 B — Python + 가상환경 + 패키지 설치 완료
- [ ] 서버 B — ODBC Driver 17 설치
- [ ] 서버 B — Embedding 모델 폴더 배치
- [ ] 서버 B — `.env` 파일 설정 (LLM URL, DB 정보)
- [ ] 서버 B — 포트 8000 방화벽 개방
- [ ] 서버 B — FactoryBackend 서비스 등록 및 자동시작 설정
- [ ] 서버 B — RAG 문서 인덱싱 완료
- [ ] 서버 C — `dist/` 폴더 배치
- [ ] 서버 C — `nginx.conf` 설정 (서버 B IP 입력)
- [ ] 서버 C — 포트 80 방화벽 개방
- [ ] 서버 C — NginxService 서비스 등록 및 자동시작 설정
- [ ] 사용자 PC 브라우저에서 최종 접속 확인

---

## 5. 전체 파일 목록

```
factory_app/                         (총 37개 파일)
├── README.md
├── nginx.conf                       ← 서버 C 배치용
├── offline_download.py              ← 폐쇄망 패키지 준비 자동화
├── register_services.bat            ← A/B/C 서버 NSSM 등록 자동화
│
├── backend/
│   ├── main.py                      ← FastAPI 진입점
│   ├── config.py                    ← 환경변수 설정
│   ├── ingest.py                    ← RAG 문서 인덱싱
│   ├── healthcheck.py               ← 전체 서버 상태 점검
│   ├── start.bat                    ← 수동 실행용
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   ├── chat.py
│   │   ├── db_query.py
│   │   ├── rag.py
│   │   └── health.py
│   └── services/
│       ├── llm.py
│       ├── db.py
│       └── rag.py
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── build.bat                    ← 인터넷 PC 빌드용
    ├── .env.example
    └── src/
        ├── App.jsx / App.css
        ├── main.jsx
        ├── api/
        │   └── client.js
        ├── pages/
        │   ├── ChatPage.jsx
        │   ├── DBPage.jsx
        │   └── RagPage.jsx
        └── components/
            ├── BarChart.jsx
            ├── LineChart.jsx
            ├── SummaryCards.jsx
            └── StatusBar.jsx
```

---

*이 문서는 Factory AI Copilot 프로젝트의 전체 개발 세션을 기록한 것입니다.*
