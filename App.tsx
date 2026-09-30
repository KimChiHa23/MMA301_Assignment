import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {Platform.OS === 'android' && (
        <RNStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      )}
      <AppNavigator />
    </SafeAreaProvider>
  );
}
