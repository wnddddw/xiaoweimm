@echo off
set JAVA_HOME=D:\AndroidStudioIDE\jbr
set ANDROID_HOME=D:\AndroidSDK_real
set PATH=E:\Program Files\nodejs;%PATH%
cd /d D:\xin\mobile\android
echo Building...
call gradlew.bat assembleRelease
echo Installing...
"D:\AndroidSDK_real\platform-tools\adb.exe" -s 127.0.0.1:16384 install -r "D:\xin\mobile\android\app\build\outputs\apk\release\app-release.apk"
echo Done!
