if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "E:/Users/Administrator/.gradle/caches/8.9/transforms/a46ac8b31baf3b222bae7a572777441a/transformed/hermes-android-0.76.5-release/prefab/modules/libhermes/libs/android.armeabi-v7a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "E:/Users/Administrator/.gradle/caches/8.9/transforms/a46ac8b31baf3b222bae7a572777441a/transformed/hermes-android-0.76.5-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

