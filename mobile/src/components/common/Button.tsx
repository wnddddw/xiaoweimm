import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'main' | 'outline' | 'green' | 'red' | 'gray';
  size?: 'sm' | 'md' | 'lg' | 'block';
  loading?: boolean;
  disabled?: boolean;
}

export default function Button({ title, onPress, variant = 'main', size = 'md', loading, disabled }: ButtonProps) {
  const bg = variant === 'main' ? '#1a44aa' : variant === 'green' ? '#1e8449' : variant === 'red' ? '#fff' : variant === 'gray' ? '#e5e7ea' : '#fff';
  const color = variant === 'outline' || variant === 'red' ? '#1a44aa' : variant === 'gray' ? '#444' : '#fff';
  const border = variant === 'outline' ? '#1a44aa' : variant === 'red' ? '#c0392b' : 'transparent';

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bg, borderColor: border, borderWidth: border !== 'transparent' ? 1 : 0 }, size === 'block' && styles.block, size === 'sm' && styles.sm]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}>
      {loading ? <ActivityIndicator color={color} size="small" /> : <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  block: { width: '100%' },
  sm: { paddingVertical: 6, paddingHorizontal: 12 },
  text: { fontSize: 15, fontWeight: '600' },
  textSm: { fontSize: 13 },
});
