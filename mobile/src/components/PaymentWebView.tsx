import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

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
  const handleNavigationChange = (navState: any) => {
    const targetUrl: string = navState.url || '';
    // Detect return from payment (WeChat/Alipay redirect)
    if (
      targetUrl.includes('/payment-result') ||
      targetUrl.includes('/callback/wechat') ||
      targetUrl.includes('/callback/alipay')
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
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    backgroundColor: '#f4f6fa',
  },
  closeBtn: { padding: 4 },
  closeText: { color: '#1a44aa', fontSize: 16 },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  placeholder: { width: 40 },
  webview: { flex: 1 },
});
