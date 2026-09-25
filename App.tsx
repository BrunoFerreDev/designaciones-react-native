import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { LoadingProvider } from './src/context/LoadingContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </LoadingProvider>
    </AuthProvider>
  );
}
