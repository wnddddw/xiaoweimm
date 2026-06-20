import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

const LOCAL_WEB_URL = Platform.select({
  android: 'http://127.0.0.1:3001/index.html',
  default: 'http://localhost:3001/index.html',
});

const APP_WEB_URL = process.env.XIAOWEIMM_APP_URL || LOCAL_WEB_URL || 'http://localhost:3001/index.html';

export default function WebApp() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const source = useMemo(() => ({ uri: APP_WEB_URL }), []);

  React.useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  function handleNavigationStateChange(navState: WebViewNavigation) {
    setCanGoBack(navState.canGoBack);
  }

  function retry() {
    setHasError(false);
    webViewRef.current?.reload();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a44aa" />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>xiaoweimm</Text>
          <Text style={styles.subtitle}>中小企业并购服务平台</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} activeOpacity={0.8} onPress={retry}>
          <Text style={styles.headerButtonText}>刷新</Text>
        </TouchableOpacity>
      </View>

      {hasError ? (
        <View style={styles.errorPanel}>
          <Text style={styles.errorTitle}>页面暂时无法打开</Text>
          <Text style={styles.errorText}>
            请确认本地服务已启动，并已执行 adb reverse tcp:3001 tcp:3001。
          </Text>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={retry}>
            <Text style={styles.primaryButtonText}>重新加载</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={source}
          style={styles.webView}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsBackForwardNavigationGestures
          mixedContentMode="always"
          originWhitelist={['http://*', 'https://*']}
          onNavigationStateChange={handleNavigationStateChange}
          onError={() => setHasError(true)}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 500) {
              setHasError(true);
            }
          }}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color="#1a44aa" size="large" />
              <Text style={styles.loadingText}>正在加载 xiaoweimm</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    minHeight: 64,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#1a44aa',
    borderBottomWidth: 1,
    borderBottomColor: '#002FA7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 1,
  },
  headerButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#555',
    fontSize: 14,
  },
  errorPanel: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#F7F7F8',
  },
  errorTitle: {
    color: '#111',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
    marginBottom: 12,
  },
  errorText: {
    color: '#555',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  primaryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    backgroundColor: '#1a44aa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
