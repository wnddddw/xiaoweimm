@echo off
title xiaoweimm 开发服务器 (验证码会显示在此窗口)
cd /d "%~dp0"
echo.
echo ============================================
echo   xiaoweimm 开发服务器
echo   验证码会显示在这个窗口里
echo   浏览器打开 http://localhost:3004
echo ============================================
echo.
set SMS_DEV_MODE=true
set DEV_TOKEN_ENABLED=true
set PORT=3004
node backend/src/index.js
if %errorlevel% neq 0 (
    echo.
    echo 端口3004已被占用，尝试3005...
    set PORT=3005
    echo 浏览器打开 http://localhost:3005
    node backend/src/index.js
)
pause
