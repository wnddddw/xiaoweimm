@echo off
set JAVA_HOME=D:\AndroidStudioIDE\jbr
set ANDROID_HOME=D:\AndroidSDK
set PATH=E:\Program Files\nodejs;%PATH%
cd /d D:\xin\mobile
echo === Environment ===
echo JAVA_HOME=%JAVA_HOME%
echo ANDROID_HOME=%ANDROID_HOME%
echo === Node check ===
node -v
echo === Starting React Native build ===
npx react-native run-android --no-packager 2>&1
