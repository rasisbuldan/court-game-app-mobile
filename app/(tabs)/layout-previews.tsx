import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Layout, Navigation, PlusSquare, BarChart3 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LayoutPreviewsScreen() {
  const router = useRouter();

  const previews = [
    {
      id: 'round-nav',
      route: '/(tabs)/demo-nav',
      icon: Navigation,
      title: 'Round Navigation',
      subtitle: 'View navigation styles',
      color: '#EF4444', // Red
    },
    {
      id: 'session',
      route: '/(tabs)/session-demo',
      icon: Layout,
      title: 'Session Layouts',
      subtitle: 'View 4 layout options',
      color: '#3B82F6', // Blue
    },
    {
      id: 'create-session',
      route: '/(tabs)/create-session-demo',
      icon: PlusSquare,
      title: 'Create Session Layouts',
      subtitle: 'View 4 form layouts',
      color: '#10B981', // Green
    },
    {
      id: 'leaderboard',
      route: '/(tabs)/leaderboard-demo',
      icon: BarChart3,
      title: 'Leaderboard Layouts',
      subtitle: 'View 8 layout options',
      color: '#F59E0B', // Amber
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <ChevronLeft color="#111827" size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
          Layout Previews
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
      >
        {/* Description */}
        <View
          style={{
            backgroundColor: '#EEF2FF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#C7D2FE',
          }}
        >
          <Text style={{ fontSize: 13, color: '#4338CA', fontWeight: '600', marginBottom: 4 }}>
            💡 Development Preview
          </Text>
          <Text style={{ fontSize: 13, color: '#6366F1', lineHeight: 18 }}>
            Explore different UI/UX layout variations for key features. These are design demos to help choose the best user experience.
          </Text>
        </View>

        {/* Preview Cards */}
        {previews.map((preview, index) => {
          const IconComponent = preview.icon;
          return (
            <TouchableOpacity
              key={preview.id}
              onPress={() => router.push(preview.route as any)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Icon */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: `${preview.color}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <IconComponent color={preview.color} size={24} strokeWidth={2} />
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
                  {preview.title}
                </Text>
                <Text style={{ fontSize: 13, color: '#6B7280' }}>
                  {preview.subtitle}
                </Text>
              </View>

              {/* Arrow */}
              <ChevronRight color="#9CA3AF" size={20} strokeWidth={2} />
            </TouchableOpacity>
          );
        })}

        {/* Bottom Spacing */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
