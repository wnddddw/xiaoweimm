@echo off
set NDK=D:\AndroidSDK_real\ndk\27.1.12297006\toolchains\llvm\prebuilt\windows-x86_64\bin
set INC=D:\AndroidSDK_real\ndk\27.1.12297006\toolchains\llvm\prebuilt\windows-x86_64\sysroot\usr\include
set SRC=D:\xin\mobile\android\minimal_stub.c
set OUT=D:\xin\mobile\android\app\src\main\jniLibs
mkdir %OUT%\arm64-v8a 2>nul
mkdir %OUT%\armeabi-v7a 2>nul
mkdir %OUT%\x86 2>nul
mkdir %OUT%\x86_64 2>nul
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libappmodules.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libappmodules.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libappmodules.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libappmodules.so %%SRC%% -I %%INC%%
echo libappmodules.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libfabricjni.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libfabricjni.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libfabricjni.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libfabricjni.so %%SRC%% -I %%INC%%
echo libfabricjni.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libhermes_executor.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libhermes_executor.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libhermes_executor.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libhermes_executor.so %%SRC%% -I %%INC%%
echo libhermes_executor.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libhermesinstancejni.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libhermesinstancejni.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libhermesinstancejni.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libhermesinstancejni.so %%SRC%% -I %%INC%%
echo libhermesinstancejni.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libjscexecutor.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libjscexecutor.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libjscexecutor.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libjscexecutor.so %%SRC%% -I %%INC%%
echo libjscexecutor.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libjscinstance.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libjscinstance.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libjscinstance.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libjscinstance.so %%SRC%% -I %%INC%%
echo libjscinstance.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libjsijniprofiler.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libjsijniprofiler.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libjsijniprofiler.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libjsijniprofiler.so %%SRC%% -I %%INC%%
echo libjsijniprofiler.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libmapbufferjni.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libmapbufferjni.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libmapbufferjni.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libmapbufferjni.so %%SRC%% -I %%INC%%
echo libmapbufferjni.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libreact_devsupportjni.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libreact_devsupportjni.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libreact_devsupportjni.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libreact_devsupportjni.so %%SRC%% -I %%INC%%
echo libreact_devsupportjni.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libreact_featureflagsjni.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libreact_featureflagsjni.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libreact_featureflagsjni.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libreact_featureflagsjni.so %%SRC%% -I %%INC%%
echo libreact_featureflagsjni.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libreact_newarchdefaults.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libreact_newarchdefaults.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libreact_newarchdefaults.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libreact_newarchdefaults.so %%SRC%% -I %%INC%%
echo libreact_newarchdefaults.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libreactnativeblob.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libreactnativeblob.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libreactnativeblob.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libreactnativeblob.so %%SRC%% -I %%INC%%
echo libreactnativeblob.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\librninstance.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\librninstance.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\librninstance.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\librninstance.so %%SRC%% -I %%INC%%
echo librninstance.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libturbomodulejsijni.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libturbomodulejsijni.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libturbomodulejsijni.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libturbomodulejsijni.so %%SRC%% -I %%INC%%
echo libturbomodulejsijni.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libuimanagerjni.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libuimanagerjni.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libuimanagerjni.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libuimanagerjni.so %%SRC%% -I %%INC%%
echo libuimanagerjni.so done
%%NDK%%\aarch64-linux-android24-clang.cmd -shared -o %%OUT%%\arm64-v8a\libyoga.so %%SRC%% -I %%INC%%
%%NDK%%\armv7a-linux-androideabi24-clang.cmd -shared -o %%OUT%%\armeabi-v7a\libyoga.so %%SRC%% -I %%INC%%
%%NDK%%\i686-linux-android24-clang.cmd -shared -o %%OUT%%\x86\libyoga.so %%SRC%% -I %%INC%%
%%NDK%%\x86_64-linux-android24-clang.cmd -shared -o %%OUT%%\x86_64\libyoga.so %%SRC%% -I %%INC%%
echo libyoga.so done
echo ALL DONE
