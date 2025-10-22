import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

export default function CreateSessionScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-6">
        <View className="bg-white rounded-lg p-6 items-center">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Create New Tournament
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            The tournament creation wizard is coming soon! This will include:
          </Text>

          <View className="w-full space-y-3">
            {[
              '🎾 Sport selection (Padel/Tennis)',
              '🏆 Tournament type (Mexicano/Americano/Fixed Partner)',
              '⚙️ Game mode configuration',
              '🎯 Scoring mode selection',
              '👥 Player management',
              '📅 Schedule setup',
            ].map((feature, index) => (
              <View key={index} className="bg-gray-50 rounded-lg p-3">
                <Text className="text-gray-700">{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            className="bg-primary-500 rounded-lg px-6 py-3 mt-6 w-full"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold text-center">Got It</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
