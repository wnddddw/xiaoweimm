// Minimal stub: satisfied System.loadLibrary without any JNI implementation.
// All real JNI methods are already registered by libreactnative.so / libhermestooling.so
// when they were pre-loaded in MainApplication.onCreate().
#include <jni.h>

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* reserved) {
    return JNI_VERSION_1_6;
}
