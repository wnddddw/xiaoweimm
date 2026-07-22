import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, shadows } from '../../theme';

export default function Card({ children, style, onPress }: { children: React.ReactNode; style?: any; onPress?: () => void }) {
  if (onPress) return <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={[styles.card, style]}>{children}</TouchableOpacity>;
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
});
