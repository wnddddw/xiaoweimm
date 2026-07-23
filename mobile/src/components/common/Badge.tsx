import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../../theme';

type BadgeVariant = 'ok' | 'warn' | 'info' | 'err' | 'gray' | 'gold';

export default function Badge({ text, variant = 'info' }: { text: string; variant?: BadgeVariant }) {
  const palette: Record<BadgeVariant, { bg: string; color: string }> = {
    ok: { bg: colors.successSoft, color: colors.successDark },
    warn: { bg: colors.warnSoft, color: colors.warnDark },
    info: { bg: colors.primarySoft, color: colors.primary },
    err: { bg: colors.dangerSoft, color: colors.dangerDark },
    gray: { bg: colors.muted, color: colors.textSecondary },
    gold: { bg: colors.accentSoft, color: colors.accent },
  };
  const c = palette[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.color }]} />
      <Text style={[styles.text, { color: c.color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});
