import React from 'react';
import HomeScreen from './app/index';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './hooks/useToast';
import { ToastContainer } from './components/Toast';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <HomeScreen />
        <ToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  );
}

