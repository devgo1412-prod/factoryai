@echo off
REM =============================================
REM  frontend\build.bat  —  인터넷 PC에서 빌드 후
REM                          dist\ 폴더를 서버 C로 이동
REM =============================================

cd /d %~dp0

echo [1/3] 패키지 설치 중...
call npm install
if errorlevel 1 ( echo [ERROR] npm install 실패 & pause & exit /b 1 )

echo [2/3] 프로덕션 빌드 중...
call npm run build
if errorlevel 1 ( echo [ERROR] npm run build 실패 & pause & exit /b 1 )

echo [3/3] 완료!
echo.
echo  dist\ 폴더를 서버 C의 C:\factory_app\frontend\dist\ 에 복사하세요.
echo.
pause
