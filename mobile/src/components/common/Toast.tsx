import React, { useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';

interface ToastProps { message: string; type?: 'success' | 'error' | ''; visible: boolean; onHide: () => void; }

export default function Toast({ message, type, visible, onHide }: ToastProps) {
  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(onHide, 2200);
    return () => clearTimeout(timer);
  }, [visible, onHide]);

  if (!visible) return null;
  return (
    <View pointerEvents="none" style={[styles.toast, type === 'success' && styles.success, type === 'error' && styles.error]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', top: 60, left: 16, right: 16, backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, zIndex: 9999, elevation: 20 },
  success: { backgroundColor: '#1e8449' },
  error: { backgroundColor: '#c0392b' },
  text: { color: '#fff', fontSize: 14, lineHeight: 20 },
});
