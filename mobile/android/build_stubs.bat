@echo off
setlocal enabledelayedexpansion
set NDK=D:\AndroidSDK_real\ndk\27.1.12297006\toolchains\llvm\prebuilt\windows-x86_64\bin
set INC=D:\AndroidSDK_real\ndk\27.1.12297006\toolchains\llvm\prebuilt\windows-x86_64\sysroot\usr\include
set SRC=D:\xin\mobile\android\merged_so_stubs.c
set OUT=D:\xin\mobile\android\app\src\main\jniLibs
for %%a in (arm64-v8a armeabi-v7a x86 x86_64) do mkdir !OUT!\%%a 2>/dev/null
set LIBS=appmodules fabricjni hermes_executor hermesinstancejni jscexecutor jscinstance jsijniprofiler mapbufferjni react_devsupportjni react_featureflagsjni react_newarchdefaults reactnativeblob rninstance turbomodulejsijni uimanagerjni yoga
for %%l in (%LIBS%) do (
  %NDK%\aarch64-linux-android24-clang.cmd -shared -o %OUT%\arm64-v8a\lib%%l.so %SRC% -I %INC%
  %NDK%\armv7a-linux-androideabi24-clang.cmd -shared -o %OUT%\armeabi-v7a\lib%%l.so %SRC% -I %INC%
  %NDK%\i686-linux-android24-clang.cmd -shared -o %OUT%\x86\lib%%l.so %SRC% -I %INC%
  %NDK%\x86_64-linux-android24-clang.cmd -shared -o %OUT%\x86_64\lib%%l.so %SRC% -I %INC%
  echo OK: lib%%l.so
)
echo ALL DONE
