import { View, Text, ScrollView } from 'react-native';
import { Clock, Play, Edit, UserPlus, TrendingUp } from 'lucide-react-native';
import { format } from 'date-fns';

interface EventHistoryTabProps {
  eventHistory: any[];
}

export function EventHistoryTab({ eventHistory }: EventHistoryTabProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'round_generated':
        return <Play color="#3B82F6" size={16} />;
      case 'score_updated':
        return <Edit color="#10B981" size={16} />;
      case 'player_status_changed':
        return <UserPlus color="#F59E0B" size={16} />;
      case 'rating_updated':
        return <TrendingUp color="#8B5CF6" size={16} />;
      default:
        return <Clock color="#6B7280" size={16} />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'round_generated':
        return 'bg-blue-50 border-blue-200';
      case 'score_updated':
        return 'bg-green-50 border-green-200';
      case 'player_status_changed':
        return 'bg-yellow-50 border-yellow-200';
      case 'rating_updated':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <ScrollView
      className="flex-1 px-6 py-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 16 }}
    >
      {eventHistory.length > 0 ? (
        eventHistory.map((event) => (
          <View
            key={event.id}
            className={`rounded-lg p-4 mb-3 border ${getEventColor(event.event_type)}`}
          >
            <View className="flex-row items-start gap-3">
              <View className="mt-0.5">{getEventIcon(event.event_type)}</View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900 mb-1">
                  {event.description}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-gray-500">
                    {format(new Date(event.created_at), 'MMM d, h:mm a')}
                  </Text>
                  {event.duration && (
                    <>
                      <Text className="text-xs text-gray-400">•</Text>
                      <Text className="text-xs text-gray-500">{event.duration}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View className="flex-1 items-center justify-center py-12">
          <Clock color="#9CA3AF" size={48} />
          <Text className="text-gray-500 mt-4">No events yet</Text>
          <Text className="text-gray-400 text-sm mt-1">
            Actions will be logged as you manage the tournament
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
