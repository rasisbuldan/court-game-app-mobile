import '../global.css';
import { useEffect, useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { CheckCircle2, XCircle, Info } from 'lucide-react-native';
import { AuthProvider } from '../hooks/useAuth';
import { ThemeProvider } from '../contexts/ThemeContext';
import { queryClient, asyncStoragePersister } from '../config/react-query';

const toastConfig = {
  success: (props: any) => (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#D1FAE5',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <CheckCircle2 color="#10B981" size={20} strokeWidth={2.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
          {props.text1}
        </Text>
        {props.text2 ? (
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280', marginTop: 2 }}>
            {props.text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
  error: (props: any) => (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#FEE2E2',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <XCircle color="#DC2626" size={20} strokeWidth={2.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
          {props.text1}
        </Text>
        {props.text2 ? (
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280', marginTop: 2 }}>
            {props.text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
  info: (props: any) => (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#DBEAFE',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Info color="#3B82F6" size={20} strokeWidth={2.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
          {props.text1}
        </Text>
        {props.text2 ? (
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280', marginTop: 2 }}>
            {props.text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
};

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
              <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#F3F4F6' },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
              <Toast
                config={toastConfig}
                position="bottom"
                bottomOffset={100}
              />
            </AuthProvider>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
