import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../config/supabase';

export default function CallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    // Handle OAuth callback
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
          // Session established, redirect to home
          router.replace('/(tabs)/home');
        } else {
          // No session, go back to login
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        router.replace('/(auth)/login');
      }
    };

    handleCallback();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="text-gray-600 mt-4">Completing sign in...</Text>
    </View>
  );
}
