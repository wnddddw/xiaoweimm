@echo off
set NDK=D:\AndroidSDK_real\ndk\27.1.12297006\toolchains\llvm\prebuilt\windows-x86_64\bin
set INC=D:\AndroidSDK_real\ndk\27.1.12297006\toolchains\llvm\prebuilt\windows-x86_64\sysroot\usr\include
set SRC=D:\xin\mobile\android\featureflags_stub.c
set OUT=D:\xin\mobile\android\app\src\main\jniLibs

%NDK%\aarch64-linux-android24-clang.cmd -shared -o %OUT%\arm64-v8a\libreact_featureflagsjni.so %SRC% -I %INC%
echo OK arm64-v8a

%NDK%\armv7a-linux-androideabi24-clang.cmd -shared -o %OUT%\armeabi-v7a\libreact_featureflagsjni.so %SRC% -I %INC%
echo OK armeabi-v7a

%NDK%\i686-linux-android24-clang.cmd -shared -o %OUT%\x86\libreact_featureflagsjni.so %SRC% -I %INC%
echo OK x86

%NDK%\x86_64-linux-android24-clang.cmd -shared -o %OUT%\x86_64\libreact_featureflagsjni.so %SRC% -I %INC%
echo OK x86_64
echo ALL DONE
