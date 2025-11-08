import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Don't navigate until navigation is ready
    if (!navigationState?.key || loading) return;

    if (user) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(auth)/login');
    }
  }, [loading, user, navigationState?.key]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#EF4444" />
    </View>
  );
}
