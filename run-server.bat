@echo off
setlocal
cd /d d:\xin
set SMS_DEV_MODE=true
set NODE_ENV=development
set PORT=3001
if exist backend_out.log del /q backend_out.log
if exist backend_err.log del /q backend_err.log
start "xin-backend" /min cmd /c "node backend\src\index.js >> backend_out.log 2>> backend_err.log"
echo Backend API: http://localhost:3001/api/health
endlocal
exit /b 0
