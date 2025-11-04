import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { memo } from 'react';
import { Clock, Play, Edit, UserPlus, TrendingUp, Download } from 'lucide-react-native';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Logger } from '../../utils/logger';

interface EventHistoryTabProps {
  events: any[];
  sessionName?: string;
}

// PHASE 2 OPTIMIZATION: Memoize component to prevent unnecessary re-renders
export const EventHistoryTab = memo(function EventHistoryTab({ events, sessionName = 'Session' }: EventHistoryTabProps) {
  const eventHistory = events || [];

  const handleExport = async () => {
    try {
      if (eventHistory.length === 0) {
        Alert.alert('No Events', 'There are no events to export.');
        return;
      }

      // Generate text content
      let content = `${sessionName} - Event History\n`;
      content += `Generated: ${format(new Date(), 'PPpp')}\n`;
      content += `${'='.repeat(50)}\n\n`;

      eventHistory.forEach((event, index) => {
        content += `${index + 1}. ${event.description}\n`;
        content += `   Time: ${format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}\n`;
        if (event.duration) {
          content += `   Duration: ${event.duration}\n`;
        }
        content += `\n`;
      });

      // Create file
      const fileName = `${sessionName.replace(/[^a-z0-9]/gi, '_')}_event_history_${format(new Date(), 'yyyyMMdd_HHmmss')}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Event History',
        });
      } else {
        Alert.alert('Success', `Event history saved to ${fileName}`);
      }
    } catch (error) {
      Logger.error('Error exporting event history', error as Error, { action: 'exportEventHistory' });
      Alert.alert('Error', 'Failed to export event history');
    }
  };
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
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{
        marginBottom: 20,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter', fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
              Event History
            </Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 14, color: '#6B7280' }}>
              {eventHistory.length} {eventHistory.length === 1 ? 'event' : 'events'} recorded
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleExport}
            disabled={eventHistory.length === 0}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: eventHistory.length === 0 ? '#F3F4F6' : '#FFFFFF',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: eventHistory.length === 0 ? '#E5E7EB' : '#D1D5DB',
            }}
          >
            <Download
              color={eventHistory.length === 0 ? '#9CA3AF' : '#6B7280'}
              size={16}
              strokeWidth={2}
            />
            <Text style={{
              fontFamily: 'Inter',
              color: eventHistory.length === 0 ? '#9CA3AF' : '#374151',
              fontSize: 13,
              fontWeight: '600'
            }}>
              Export
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{
          height: 1,
          backgroundColor: '#E5E7EB',
        }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {eventHistory.length > 0 ? (
        eventHistory.map((event) => (
          <View
            key={event.id}
            style={{
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              backgroundColor: '#F9FAFB',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ marginTop: 2 }}>{getEventIcon(event.event_type)}</View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 4 }}>
                  {event.description}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6B7280' }}>
                    {format(new Date(event.created_at), 'MMM d, h:mm a')}
                  </Text>
                  {event.duration && (
                    <>
                      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#9CA3AF' }}>•</Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6B7280' }}>{event.duration}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
          <Clock color="#9CA3AF" size={48} />
          <Text style={{ fontFamily: 'Inter', color: '#6B7280', marginTop: 16 }}>No events yet</Text>
          <Text style={{ fontFamily: 'Inter', color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>
            Actions will be logged as you manage the tournament
          </Text>
        </View>
      )}
      </ScrollView>
    </View>
  );
});
