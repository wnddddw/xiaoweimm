import React from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import MainNavigator from './MainNavigator';

export default function RootNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingLogo}>xiaoweimm</Text>
        <Text style={styles.loadingText}>姝ｅ湪鍚姩</Text>
        <ActivityIndicator size="large" color="#ffffff" />
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
    backgroundColor: '#1a44aa',
    gap: 12,
  },
  loadingLogo: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    marginBottom: 8,
  },
});
