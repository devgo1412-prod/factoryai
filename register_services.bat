@echo off
REM =============================================
REM  register_services.bat
REM  각 서버에서 관리자 권한으로 실행하세요.
REM
REM  사용법:
REM    register_services.bat A   ← 서버 A (Ollama)
REM    register_services.bat B   ← 서버 B (Backend)
REM    register_services.bat C   ← 서버 C (Nginx)
REM =============================================

if "%1"=="" (
    echo 사용법: register_services.bat [A^|B^|C]
    pause & exit /b 1
)

REM NSSM 경로 (USB에서 복사한 위치)
set NSSM=C:\tools\nssm.exe

if not exist %NSSM% (
    echo [ERROR] NSSM을 찾을 수 없습니다: %NSSM%
    echo         nssm.exe 를 C:\tools\ 에 복사하세요.
    pause & exit /b 1
)

REM ── 서버 A: Ollama ─────────────────────────────────────
if /I "%1"=="A" (
    echo [서버 A] Ollama 서비스 등록 중...

    set OLLAMA_EXE=%LOCALAPPDATA%\Programs\Ollama\ollama.exe

    %NSSM% stop    OllamaService 2>nul
    %NSSM% remove  OllamaService confirm 2>nul

    %NSSM% install OllamaService "%OLLAMA_EXE%" serve
    %NSSM% set     OllamaService AppEnvironmentExtra "OLLAMA_HOST=0.0.0.0:11434"
    %NSSM% set     OllamaService Start SERVICE_AUTO_START
    %NSSM% set     OllamaService AppStdout C:\logs\ollama_stdout.log
    %NSSM% set     OllamaService AppStderr C:\logs\ollama_stderr.log

    mkdir C:\logs 2>nul
    %NSSM% start OllamaService

    echo.
    echo [방화벽] 포트 11434 개방 중...
    netsh advfirewall firewall delete rule name="Ollama API" 2>nul
    netsh advfirewall firewall add rule name="Ollama API" dir=in action=allow protocol=TCP localport=11434

    echo.
    echo [확인] Ollama 서비스 상태:
    sc query OllamaService
    goto :done
)

REM ── 서버 B: FastAPI Backend ────────────────────────────
if /I "%1"=="B" (
    echo [서버 B] FastAPI Backend 서비스 등록 중...

    set PYTHON_EXE=C:\factory_app\backend\env\Scripts\python.exe
    set APP_DIR=C:\factory_app\backend

    if not exist %PYTHON_EXE% (
        echo [ERROR] 가상환경을 찾을 수 없습니다: %PYTHON_EXE%
        echo         먼저 가상환경을 생성하고 패키지를 설치하세요.
        pause & exit /b 1
    )

    %NSSM% stop    FactoryBackend 2>nul
    %NSSM% remove  FactoryBackend confirm 2>nul

    %NSSM% install FactoryBackend "%PYTHON_EXE%"
    %NSSM% set     FactoryBackend AppParameters "-m uvicorn main:app --host 0.0.0.0 --port 8000"
    %NSSM% set     FactoryBackend AppDirectory  "%APP_DIR%"
    %NSSM% set     FactoryBackend AppEnvironmentExtra "PYTHONUNBUFFERED=1"
    %NSSM% set     FactoryBackend Start SERVICE_AUTO_START
    %NSSM% set     FactoryBackend AppStdout C:\logs\backend_stdout.log
    %NSSM% set     FactoryBackend AppStderr C:\logs\backend_stderr.log

    mkdir C:\logs 2>nul
    %NSSM% start FactoryBackend

    echo.
    echo [방화벽] 포트 8000 개방 중...
    netsh advfirewall firewall delete rule name="Factory Backend" 2>nul
    netsh advfirewall firewall add rule name="Factory Backend" dir=in action=allow protocol=TCP localport=8000

    echo.
    echo [확인] Backend 서비스 상태:
    sc query FactoryBackend
    goto :done
)

REM ── 서버 C: Nginx ──────────────────────────────────────
if /I "%1"=="C" (
    echo [서버 C] Nginx 서비스 등록 중...

    set NGINX_EXE=C:\nginx\nginx.exe

    if not exist %NGINX_EXE% (
        echo [ERROR] Nginx를 찾을 수 없습니다: %NGINX_EXE%
        echo         nginx 폴더를 C:\nginx\ 에 압축 해제하세요.
        pause & exit /b 1
    )

    %NSSM% stop    NginxService 2>nul
    %NSSM% remove  NginxService confirm 2>nul

    %NSSM% install NginxService "%NGINX_EXE%"
    %NSSM% set     NginxService AppDirectory  C:\nginx
    %NSSM% set     NginxService Start SERVICE_AUTO_START
    %NSSM% set     NginxService AppStdout C:\logs\nginx_stdout.log
    %NSSM% set     NginxService AppStderr C:\logs\nginx_stderr.log

    mkdir C:\logs 2>nul
    %NSSM% start NginxService

    echo.
    echo [방화벽] 포트 80 개방 중...
    netsh advfirewall firewall delete rule name="Factory Frontend" 2>nul
    netsh advfirewall firewall add rule name="Factory Frontend" dir=in action=allow protocol=TCP localport=80

    echo.
    echo [확인] Nginx 서비스 상태:
    sc query NginxService
    goto :done
)

echo [ERROR] 알 수 없는 서버 유형: %1
pause & exit /b 1

:done
echo.
echo ✅ 완료! services.msc 에서 자동 시작 여부를 확인하세요.
pause
