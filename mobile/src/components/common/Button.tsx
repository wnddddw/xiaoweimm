import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, shadows } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'main' | 'outline' | 'green' | 'red' | 'gray';
  size?: 'sm' | 'md' | 'lg' | 'block';
  loading?: boolean;
  disabled?: boolean;
}

export default function Button({ title, onPress, variant = 'main', size = 'md', loading, disabled }: ButtonProps) {
  const bg = variant === 'main' ? colors.primary : variant === 'green' ? colors.success : variant === 'red' ? colors.white : variant === 'gray' ? colors.muted : colors.white;
  const color = variant === 'outline' ? colors.primary : variant === 'red' ? colors.danger : variant === 'gray' ? colors.textSecondary : colors.white;
  const border = variant === 'outline' ? colors.primary : variant === 'red' ? colors.dangerSoft : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        variant === 'main' && styles.mainShadow,
        { backgroundColor: bg, borderColor: border, borderWidth: border !== 'transparent' ? 1 : 0 },
        size === 'block' && styles.block,
        size === 'sm' && styles.sm,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}>
      {loading ? <ActivityIndicator color={color} size="small" /> : <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  mainShadow: { ...shadows.subtle },
  block: { width: '100%' },
  sm: { minHeight: 36, paddingVertical: 7, paddingHorizontal: 14 },
  disabled: { opacity: 0.55 },
  text: { fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  textSm: { fontSize: 13 },
});
