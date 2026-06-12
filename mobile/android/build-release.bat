@echo off
set JAVA_HOME=D:\AndroidStudioIDE\jbr
set ANDROID_HOME=D:\AndroidSDK_real
set PATH=E:\Program Files\nodejs;%PATH%
cd /d D:\xin\mobile\android
echo Node: 
node -v
call gradlew.bat assembleRelease
