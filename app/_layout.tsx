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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ThemeProvider } from '../contexts/ThemeContext';
import { queryClient, asyncStoragePersister } from '../config/react-query';
import { useNotifications } from '../hooks/useNotifications';
import * as Sentry from '@sentry/react-native';
import { OfflineBanner } from '../components/OfflineBanner';
import { SyncProgressModal } from '../components/SyncProgressModal';
import { initializePostHog, identifyUser } from '../services/posthog';
import { offlineQueue } from '../utils/offlineQueue';
import { Logger } from '../utils/logger';

// Initialize Sentry - wrapped in try-catch to prevent crashes
// Only initialize if feature flag is enabled
const isSentryEnabled = process.env.EXPO_PUBLIC_ENABLE_SENTRY === 'true';

if (isSentryEnabled) {
  try {
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
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
    });

    if (__DEV__) {
      Logger.debug('Sentry initialized successfully');
    }
  } catch (error) {
    // Non-critical - app can run without Sentry
    Logger.error('Sentry initialization failed', error as Error, { action: 'initSentry' });
  }
} else if (__DEV__) {
  Logger.debug('Sentry disabled via feature flag (EXPO_PUBLIC_ENABLE_SENTRY)');
}

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

// Error Fallback Component with Enhanced UX
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const [errorCount, setErrorCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Track error count to detect crash loops
    const loadErrorCount = async () => {
      try {
        const count = parseInt((await AsyncStorage.getItem('error_count')) || '0', 10) + 1;
        setErrorCount(count);
        await AsyncStorage.setItem('error_count', count.toString());

        // Reset error count after 30 seconds (successful recovery)
        const timer = setTimeout(async () => {
          try {
            await AsyncStorage.removeItem('error_count');
          } catch (e) {
            // Ignore storage errors
          }
        }, 30000);

        return () => clearTimeout(timer);
      } catch (e) {
        // Ignore storage errors - default to count 1
        setErrorCount(1);
      }
    };

    loadErrorCount();
  }, []);

  const handleReset = async () => {
    // Clear error count on manual reset
    try {
      await AsyncStorage.removeItem('error_count');
    } catch (e) {
      // Ignore storage errors
    }
    resetErrorBoundary();
  };

  // Detect crash loop (more than 3 errors in short time)
  const isCrashLoop = errorCount > 3;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F9FAFB' }}>
      <View style={{ alignItems: 'center', maxWidth: 400 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: isCrashLoop ? '#FEF2F2' : '#FEE2E2',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <AlertTriangle color={isCrashLoop ? '#991B1B' : '#DC2626'} size={40} strokeWidth={2} />
        </View>

        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
          {isCrashLoop ? 'App Keep Crashing' : 'Something Went Wrong'}
        </Text>

        <Text style={{ fontSize: 15, color: '#6B7280', marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>
          {isCrashLoop
            ? 'The app is experiencing repeated crashes. Try restarting the app or reinstalling if the problem persists.'
            : 'The app encountered an unexpected error. Don\'t worry, your data is safe.'}
        </Text>

        {/* Error details toggle */}
        {__DEV__ && (
          <TouchableOpacity
            onPress={() => setShowDetails(!showDetails)}
            style={{
              marginBottom: 16,
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: '#F3F4F6',
              borderRadius: 8,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>
              {showDetails ? 'Hide' : 'Show'} Error Details
            </Text>
          </TouchableOpacity>
        )}

        {/* Error details (collapsible, dev only) */}
        {__DEV__ && showDetails && (
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
            <Text style={{ fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#991B1B' }}>
              {error.message}
            </Text>
            {error.stack && (
              <Text style={{ fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#7F1D1D', marginTop: 8 }}>
                {error.stack}
              </Text>
            )}
          </ScrollView>
        )}

        {/* Action buttons */}
        <View style={{ width: '100%', gap: 12 }}>
          {!isCrashLoop && (
            <TouchableOpacity
              onPress={handleReset}
              style={{
                backgroundColor: '#EF4444',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              activeOpacity={0.8}
            >
              <RefreshCw color="#FFFFFF" size={18} strokeWidth={2.5} />
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                Try Again
              </Text>
            </TouchableOpacity>
          )}

          {isCrashLoop && (
            <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: '#92400E', fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
                Restart Required
              </Text>
              <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18, textAlign: 'center' }}>
                Close and reopen the app to continue. If the problem persists, try reinstalling the app.
              </Text>
            </View>
          )}
        </View>

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
  const { user } = useAuth();

  // Initialize push notifications (needs to be inside AuthProvider)
  useNotifications();

  // Initialize offline queue and PostHog analytics
  useEffect(() => {
    let isMounted = true;

    // Initialize offline queue
    offlineQueue.initialize().catch((error) => {
      // Non-critical - queue will work with empty state
      Logger.error('Offline queue initialization failed', error as Error, { action: 'initOfflineQueue' });
    });

    // Initialize PostHog on app start
    initializePostHog()
      .then((client) => {
        if (!isMounted || !client) return;

        // Identify user if authenticated
        if (user?.id) {
          identifyUser(user.id, {
            email: user.email,
            createdAt: user.created_at,
          });
        }
      })
      .catch((error) => {
        Logger.error('PostHog initialization failed', error as Error, { action: 'initPostHog' });
      });

    return () => {
      isMounted = false;
      // Cleanup offline queue listeners
      offlineQueue.cleanup();
    };
  }, []);

  // Identify user when they sign in
  useEffect(() => {
    if (user?.id) {
      try {
        identifyUser(user.id, {
          email: user.email,
          createdAt: user.created_at,
        });
      } catch (error) {
        // Non-critical - don't crash app if analytics identification fails
        Logger.error('PostHog user identification failed', error as Error, { action: 'identifyUser', userId: user.id });
      }
    }
  }, [user?.id]);

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
      <SyncProgressModal />
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
          Logger.debug('App Error Boundary caught', { error: error.message, stack: error.stack, componentStack: errorInfo.componentStack });
        }
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: asyncStoragePersister }}
          >
            <AuthProvider>
              <ThemeProvider>
                <AppContent />
              </ThemeProvider>
            </AuthProvider>
          </PersistQueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// Wrap with Sentry to catch all unhandled errors
export default Sentry.wrap(RootLayout);
