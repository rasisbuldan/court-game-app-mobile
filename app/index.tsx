import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Redirect to appropriate screen based on auth state
  if (user) {
    return <Redirect href="/(tabs)/home" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}
