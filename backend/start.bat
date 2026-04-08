@echo off
REM =============================================
REM  backend\start.bat  —  Backend 수동 실행용
REM  서비스 등록 전 테스트할 때 사용하세요.
REM =============================================

cd /d %~dp0

REM 가상환경 활성화
call env\Scripts\activate.bat

REM .env 존재 확인
if not exist .env (
    echo [ERROR] .env 파일이 없습니다. .env.example 을 복사해서 작성하세요.
    pause
    exit /b 1
)

echo [INFO] FastAPI Backend 시작 중... (http://0.0.0.0:8000)
echo [INFO] API 문서: http://localhost:8000/docs
echo [INFO] 중지하려면 Ctrl+C

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
