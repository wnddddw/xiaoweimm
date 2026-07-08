import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

export default function Card({ children, style, onPress }: { children: React.ReactNode; style?: any; onPress?: () => void }) {
  if (onPress) return <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[styles.card, style]}>{children}</TouchableOpacity>;
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
});
