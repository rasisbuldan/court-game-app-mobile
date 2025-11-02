import '../global.css';
import { useEffect, useState } from 'react';
import { View, Text, StatusBar, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useNavigationContainerRef } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { CheckCircle2, XCircle, Info, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from '../hooks/useAuth';
import { ThemeProvider } from '../contexts/ThemeContext';
import { queryClient, asyncStoragePersister } from '../config/react-query';
import { useNotifications } from '../hooks/useNotifications';
import * as Sentry from '@sentry/react-native';
import { OfflineBanner } from '../components/OfflineBanner';

// Initialize Sentry
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: false, // Don't track dev errors
  debug: __DEV__,
  tracesSampleRate: __DEV__ ? 1.0 : 0.01, // 1% sampling in production (free tier: 10k transactions/month)
  environment: __DEV__ ? 'development' : 'production',
  beforeSend(event) {
    // Filter PII - mask email addresses
    if (event.user?.email) {
      const email = event.user.email;
      const [local, domain] = email.split('@');
      event.user.email = `${local.substring(0, 2)}***@${domain}`;
    }
    return event;
  },
  integrations: [
    new Sentry.ReactNativeTracing({
      tracingOrigins: ['localhost', /^\//, /^https:\/\//],
      // Will be configured after navigation ref is available
    }),
  ],
});

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

// Error Fallback Component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F9FAFB' }}>
      <View style={{ alignItems: 'center', maxWidth: 400 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FEE2E2',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <AlertTriangle color="#DC2626" size={40} strokeWidth={2} />
        </View>

        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
          Something went wrong
        </Text>

        <Text style={{ fontSize: 15, color: '#6B7280', marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>
          The app encountered an unexpected error. Don't worry, your data is safe.
        </Text>

        {/* Error details (collapsible in production) */}
        {__DEV__ && (
          <ScrollView
            style={{
              maxHeight: 200,
              width: '100%',
              backgroundColor: '#FEF2F2',
              borderRadius: 8,
              padding: 12,
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 12, fontFamily: 'monospace', color: '#991B1B' }}>
              {error.message}
            </Text>
            {error.stack && (
              <Text style={{ fontSize: 11, fontFamily: 'monospace', color: '#7F1D1D', marginTop: 8 }}>
                {error.stack}
              </Text>
            )}
          </ScrollView>
        )}

        <TouchableOpacity
          onPress={resetErrorBoundary}
          style={{
            backgroundColor: '#EF4444',
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
          activeOpacity={0.8}
        >
          <RefreshCw color="#FFFFFF" size={18} strokeWidth={2.5} />
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
            Try Again
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 16, textAlign: 'center' }}>
          If the problem persists, please contact support
        </Text>
      </View>
    </View>
  );
}

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

// PHASE 1 FIX: Separate component to use notifications inside AuthProvider
function AppContent() {
  // Initialize push notifications (needs to be inside AuthProvider)
  useNotifications();

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F3F4F6' },
          // Platform-specific animations
          animation: Platform.OS === 'ios' ? 'slide_from_right' : 'fade_from_bottom',
          // Enable swipe back gesture
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          // Custom transition timing
          transitionSpec: {
            open: {
              animation: 'spring',
              config: {
                stiffness: 1000,
                damping: 500,
                mass: 3,
                overshootClamping: true,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01,
              },
            },
            close: {
              animation: 'spring',
              config: {
                stiffness: 1000,
                damping: 500,
                mass: 3,
                overshootClamping: true,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01,
              },
            },
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <OfflineBanner />
      <Toast
        config={toastConfig}
        position="bottom"
        bottomOffset={100}
      />
    </>
  );
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter': require('../assets/fonts/InterVariable.ttf'),
    'Inter-Italic': require('../assets/fonts/InterVariable-Italic.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset app state on error recovery
        queryClient.clear();
      }}
      onError={(error, errorInfo) => {
        // Send to Sentry in all environments
        Sentry.captureException(error, {
          level: 'fatal',
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });

        // Log to console in development only
        if (__DEV__) {
          console.error('App Error Boundary caught:', error, errorInfo);
        }
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{ persister: asyncStoragePersister }}
            >
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </PersistQueryClientProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// Wrap with Sentry to catch all unhandled errors
export default Sentry.wrap(RootLayout);
