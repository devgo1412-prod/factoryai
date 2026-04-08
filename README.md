# 🏭 Factory AI Copilot

React (Frontend) + FastAPI (Backend) 분리 구조의 공장용 AI 분석 도구입니다.

---

## 📁 프로젝트 구조

```
factory_app/
├── backend/
│   ├── main.py              # FastAPI 앱 진입점
│   ├── config.py            # 환경변수 설정
│   ├── requirements.txt
│   ├── .env.example         # ← 복사해서 .env 로 저장
│   ├── routers/
│   │   ├── chat.py          # POST /api/chat
│   │   ├── db_query.py      # POST /api/db/query, /api/db/nl2sql
│   │   └── rag.py           # POST /api/rag/search
│   └── services/
│       ├── llm.py           # LLM API 호출
│       ├── db.py            # MSSQL 쿼리
│       └── rag.py           # ChromaDB 검색
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env.example
    └── src/
        ├── App.jsx / App.css
        ├── main.jsx
        ├── api/
        │   └── client.js    # 백엔드 API 호출 함수
        ├── pages/
        │   ├── ChatPage.jsx
        │   ├── DBPage.jsx   # 표 + 바 차트
        │   └── RagPage.jsx
        └── components/
            ├── BarChart.jsx # SVG 바 차트
            └── StatusBar.jsx
```

---

## 🚀 실행 방법

### 1. Backend 설정

```powershell
cd backend

# 가상환경 생성 및 활성화
python -m venv env
.\env\Scripts\activate

# 패키지 설치
pip install -r requirements.txt

# 환경변수 설정
copy .env.example .env
# .env 파일 열어서 LLM 서버 주소, DB 정보 입력

# 서버 실행
uvicorn main:app --reload --port 8000
```

> API 문서 확인: http://localhost:8000/docs

---

### 2. Frontend 설정

```powershell
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

> 브라우저에서 http://localhost:3000 접속

---

### 3. 문서 인덱싱 (RAG 사용 시)

```powershell
cd backend
python ingest.py ./docs/매뉴얼.txt ./docs/보고서.pdf --reset
```

---

## ⚙️ 주요 설정값 (.env)

| 항목 | 설명 | 예시 |
|------|------|------|
| `LLM_API_BASE_URL` | LLM 서버 주소 | `http://192.168.1.100:11434/v1` |
| `LLM_MODEL_NAME` | 사용할 모델명 | `llama3`, `mistral` |
| `DB_SERVER` | MSSQL 서버 주소 | `192.168.1.200` |
| `DB_NAME` | 데이터베이스 이름 | `FactoryDB` |
| `DB_TRUSTED` | Windows 통합 인증 여부 | `true` / `false` |

---

## 🔌 API 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/chat` | LLM 챗봇 |
| GET  | `/api/chat/ping` | LLM 서버 연결 확인 |
| POST | `/api/db/query` | SQL 실행 |
| POST | `/api/db/nl2sql` | 자연어 → SQL 변환 |
| GET  | `/api/db/ping` | DB 연결 확인 |
| POST | `/api/rag/search` | 문서 검색 + AI 답변 |
| GET  | `/api/health` | 헬스체크 |
