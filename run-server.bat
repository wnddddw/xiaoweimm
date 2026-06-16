@echo off
setlocal
cd /d d:\xin
if exist server.log del /q server.log
if exist server_err.log del /q server_err.log
start "xin-static" /min cmd /c "node serve.js > server.log 2>server_err.log"
start "xin-backend" /min cmd /c "node backend\src\index.js >> backend_out.log 2>> backend_err.log"
echo Static site: http://localhost:3001
echo Backend API: http://localhost:3001/api/health
endlocal
exit /b 0
