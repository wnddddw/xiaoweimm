import React from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import MainNavigator from './MainNavigator';
import { colors } from '../theme';

export default function RootNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingLogo}>xiaoweimm</Text>
        <Text style={styles.loadingText}>正在启动</Text>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    gap: 12,
  },
  loadingLogo: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    marginBottom: 8,
  },
});
