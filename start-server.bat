@echo off
title xiaoweimm Server
echo.
echo   xiaoweimm M&A Platform
echo   http://localhost:3001
echo   API: http://localhost:3001/api/health
echo.
echo   Starting static site and backend...
echo ==============================
call d:\xin\run-server.bat
echo.
echo   Services started in background.
pause
