if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "E:/Users/Administrator/.gradle/caches/8.9/transforms/273cc190bdb12fc18ad9253cc08eb538/transformed/fbjni-0.6.0/prefab/modules/fbjni/libs/android.x86/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "E:/Users/Administrator/.gradle/caches/8.9/transforms/273cc190bdb12fc18ad9253cc08eb538/transformed/fbjni-0.6.0/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

