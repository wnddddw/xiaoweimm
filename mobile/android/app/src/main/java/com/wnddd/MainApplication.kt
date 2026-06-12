package com.wnddd

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {}

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)

    // Pre-load all native libraries that SoLoader will need but that
    // are only available as merged OBJECT targets inside libreactnative.so
    // and libhermestooling.so in the prebuilt AAR.
    //
    // Once the parent .so is loaded, System.loadLibrary can find the
    // symbols via the dynamic linker's global symbol table.
    val preloadLibs = arrayOf(
      "reactnative",      // contains: fabricjni, mapbufferjni, react_*, rninstance, turbomodulejsijni, uimanagerjni, yoga
      "hermestooling",    // contains: hermes_executor, hermesinstancejni, jsijniprofiler
      "jsctooling"        // contains: jscexecutor, jscinstance
    )
    for (lib in preloadLibs) {
      try { System.loadLibrary(lib) } catch (_: Exception) { }
    }

    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
  }
}
