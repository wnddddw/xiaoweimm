// Stub .so files for all React Native libraries that are merged into
// libreactnative.so (via target_merge_so) but loaded individually by SoLoader.
// The prebuilt AAR does not include these as separate .so files.

#include <jni.h>

#define MERGED_SO_STUB(lib) \
JNIEXPORT jint JNICALL Java_com_facebook_react_soloader_OpenSourceMergedSoMapping_lib##lib##_so(JNIEnv* e, jclass c) { return 0; }

MERGED_SO_STUB(appmodules)
MERGED_SO_STUB(fabricjni)
MERGED_SO_STUB(hermes_executor)
MERGED_SO_STUB(hermesinstancejni)
MERGED_SO_STUB(jscexecutor)
MERGED_SO_STUB(jscinstance)
MERGED_SO_STUB(jsijniprofiler)
MERGED_SO_STUB(mapbufferjni)
MERGED_SO_STUB(react_1devsupportjni)
MERGED_SO_STUB(react_1featureflagsjni)
MERGED_SO_STUB(react_1newarchdefaults)
MERGED_SO_STUB(reactnativeblob)
MERGED_SO_STUB(rninstance)
MERGED_SO_STUB(turbomodulejsijni)
MERGED_SO_STUB(uimanagerjni)
MERGED_SO_STUB(yoga)
