import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trophy } from 'lucide-react-native';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAnimationPreference } from '../../hooks/useAnimationPreference';
import { format } from 'date-fns';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { reduceAnimation } = useAnimationPreference();

  const {
    data: sessions,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const renderSession = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
      onPress={() => router.push(`/(tabs)/session/${item.id}`)}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-semibold text-gray-900">{item.name}</Text>
        <View
          className={`px-3 py-1 rounded-full ${
            item.status === 'active'
              ? 'bg-green-100'
              : item.status === 'completed'
              ? 'bg-gray-100'
              : 'bg-blue-100'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              item.status === 'active'
                ? 'text-green-700'
                : item.status === 'completed'
                ? 'text-gray-700'
                : 'text-blue-700'
            }`}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center space-x-4">
        <Text className="text-sm text-gray-600">
          {item.sport === 'padel' ? '🎾 Padel' : '🎾 Tennis'}
        </Text>
        <Text className="text-sm text-gray-600">•</Text>
        <Text className="text-sm text-gray-600">{item.type}</Text>
        <Text className="text-sm text-gray-600">•</Text>
        <Text className="text-sm text-gray-600">{item.courts} court(s)</Text>
      </View>

      {item.club_name && (
        <Text className="text-sm text-gray-500 mt-1">📍 {item.club_name}</Text>
      )}

      <Text className="text-xs text-gray-400 mt-2">
        Created {format(new Date(item.created_at), 'MMM d, yyyy')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: reduceAnimation ? '#FFFFFF' : '#F9FAFB' }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 pt-16 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Tournaments</Text>
            <Text className="text-sm text-gray-600 mt-1">
              Manage your Mexicano sessions
            </Text>
          </View>
          <TouchableOpacity
            className="bg-primary-500 rounded-full p-3"
            onPress={() => router.push('/create-session')}
          >
            <Plus color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sessions List */}
      <View className="flex-1 px-6 pt-4">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Loading tournaments...</Text>
          </View>
        ) : sessions && sessions.length > 0 ? (
          <FlatList
            data={sessions}
            renderItem={renderSession}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#3B82F6"
              />
            }
            contentContainerClassName="pb-6"
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Trophy color="#9CA3AF" size={64} />
            <Text className="text-xl font-semibold text-gray-900 mt-4">
              No Tournaments Yet
            </Text>
            <Text className="text-gray-600 text-center mt-2 mb-6">
              Create your first Mexicano tournament to get started
            </Text>
            <TouchableOpacity
              className="bg-primary-500 rounded-lg px-6 py-3"
              onPress={() => router.push('/create-session')}
            >
              <Text className="text-white font-semibold">Create Tournament</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Debug: Sign Out Button */}
      <View className="p-4 border-t border-gray-200">
        <TouchableOpacity
          className="bg-gray-200 rounded-lg px-6 py-3 items-center"
          onPress={signOut}
        >
          <Text className="text-gray-700 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
