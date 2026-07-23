import React, { useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { colors, radius, shadows } from '../../theme';

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
      <Text style={styles.icon}>{type === 'success' ? '✓' : type === 'error' ? '!' : 'i'}</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.dark,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    zIndex: 9999,
    ...shadows.raised,
  },
  success: { backgroundColor: colors.success },
  error: { backgroundColor: colors.danger },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  text: { flex: 1, color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: '500' },
});
