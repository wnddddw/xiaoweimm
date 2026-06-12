@echo off
cd /d d:\xin
if exist server.log del server.log
start "xin-server" /B cmd /c "node serve.js > server.log 2>&1"
echo Started PID: %errorlevel%
exit
