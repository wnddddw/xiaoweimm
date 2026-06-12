if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "E:/Users/Administrator/.gradle/caches/8.9/transforms/bf2c7a6bc1ba907a0c15166e4d70c9c7/transformed/hermes-android-0.76.5-debug/prefab/modules/libhermes/libs/android.armeabi-v7a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "E:/Users/Administrator/.gradle/caches/8.9/transforms/bf2c7a6bc1ba907a0c15166e4d70c9c7/transformed/hermes-android-0.76.5-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

