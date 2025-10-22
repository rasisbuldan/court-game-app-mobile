import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider, PersistQueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../hooks/useAuth';
import { ThemeProvider } from '../contexts/ThemeContext';
import { queryClient, asyncStoragePersister } from '../config/react-query';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: asyncStoragePersister }}
          >
            <AuthProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#F3F4F6' },
                }}
              >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="create-session"
                  options={{
                    presentation: 'modal',
                    headerShown: true,
                    headerTitle: 'Create Tournament',
                  }}
                />
              </Stack>
              <Toast />
            </AuthProvider>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
