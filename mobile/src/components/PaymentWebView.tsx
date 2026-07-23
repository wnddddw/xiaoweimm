import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme';

interface PaymentWebViewProps {
  visible: boolean;
  url: string;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export default function PaymentWebView({
  visible,
  url,
  onClose,
  onPaymentComplete,
}: PaymentWebViewProps) {
  // 支付完成判断：仅当导航 URL 的路径精确等于支付结果/回调路径时才判定完成，
  // 避免微信支付中间跳转 URL 包含子串导致误命中提前关闭。
  // 最终结果以后端订单状态轮询为准（见 PaymentScreen）。
  const handleNavigationChange = (navState: any) => {
    const targetUrl: string = navState.url || '';
    // 用正则提取路径部分，避免依赖 RN 环境下不稳定的 URL 全局对象
    const match = targetUrl.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/]+(\/[^?#]*)?/);
    const pathname = (match?.[1] || '/').replace(/\/+$/, '');
    if (
      pathname === '/payment-result' ||
      pathname === '/api/payments/callback/wechat' ||
      pathname === '/api/payments/callback/alipay'
    ) {
      onClose();
      onPaymentComplete();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>关闭</Text>
          </TouchableOpacity>
          <Text style={styles.title}>收银台</Text>
          <View style={styles.placeholder} />
        </View>
        <WebView
          source={{ uri: url }}
          onNavigationStateChange={handleNavigationChange}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.bg,
  },
  closeBtn: { padding: 4 },
  closeText: { color: colors.primary, fontSize: 16 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  placeholder: { width: 40 },
  webview: { flex: 1 },
});
