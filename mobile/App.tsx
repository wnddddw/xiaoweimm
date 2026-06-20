import React from 'react';
import ErrorBoundary from './src/components/ErrorBoundary';
import WebApp from './src/WebApp';

export default function App() {
  return (
    <ErrorBoundary>
      <WebApp />
    </ErrorBoundary>
  );
}
