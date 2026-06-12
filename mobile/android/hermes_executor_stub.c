// Stub for libhermes_executor.so — provides JNI functions that would
// normally come from the merged SO (libreactnative.so / libhermestooling.so)

#include <jni.h>

// OpenSourceMergedSoMapping entry
JNIEXPORT jint JNICALL
Java_com_facebook_react_soloader_OpenSourceMergedSoMapping_libhermes_1executor_1so(
    JNIEnv* e, jclass c) { return 0; }

// HermesExecutor native methods
JNIEXPORT jobject JNICALL
Java_com_facebook_hermes_reactexecutor_HermesExecutor_initHybridDefaultConfig(
    JNIEnv* e, jclass c, jboolean enableDebugger, jstring debuggerName) {
    return NULL;
}

JNIEXPORT jobject JNICALL
Java_com_facebook_hermes_reactexecutor_HermesExecutor_initHybrid(
    JNIEnv* e, jclass c, jlong runtimeConfig) {
    return NULL;
}
