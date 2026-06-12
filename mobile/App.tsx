import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/store/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1a44aa" />
      <RootNavigator />
    </AuthProvider>
  );
}
