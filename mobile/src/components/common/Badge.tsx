import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type BadgeVariant = 'ok' | 'warn' | 'info' | 'err' | 'gray';

export default function Badge({ text, variant = 'info' }: { text: string; variant?: BadgeVariant }) {
  const colors: Record<BadgeVariant, { bg: string; color: string }> = {
    ok: { bg: '#d5f5e3', color: '#145a32' },
    warn: { bg: '#fdebd0', color: '#7d6608' },
    info: { bg: '#d4e4fd', color: '#1a44aa' },
    err: { bg: '#fadbd8', color: '#78281f' },
    gray: { bg: '#e5e7ea', color: '#555' },
  };
  const c = colors[variant];
  return <View style={[styles.badge, { backgroundColor: c.bg }]}><Text style={[styles.text, { color: c.color }]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '600' },
});
