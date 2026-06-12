import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface ToastProps { message: string; type?: 'success' | 'error' | ''; visible: boolean; onHide: () => void; }

export default function Toast({ message, type, visible, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(onHide);
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View style={[styles.toast, type === 'success' && styles.success, type === 'error' && styles.error, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', top: 60, right: 20, backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, zIndex: 9999 },
  success: { backgroundColor: '#1e8449' },
  error: { backgroundColor: '#c0392b' },
  text: { color: '#fff', fontSize: 14 },
});
