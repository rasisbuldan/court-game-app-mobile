import { View, Text } from 'react-native';
import { Bell, Users, Trophy } from 'lucide-react-native';

export default function EmptyNotifications() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 64,
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: '#FEE2E2',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <Bell color="#EF4444" size={48} strokeWidth={1.5} />
      </View>

      {/* Title */}
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: '#111827',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        No notifications yet
      </Text>

      {/* Description */}
      <Text
        style={{
          fontSize: 15,
          color: '#6B7280',
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 32,
        }}
      >
        You'll see club invitations and other important updates here
      </Text>

      {/* Info Cards */}
      <View style={{ width: '100%', gap: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#DBEAFE',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users color="#3B82F6" size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
              Club Invitations
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              Get notified when you're invited to join a club
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FEF3C7',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy color="#F59E0B" size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
              Session Updates
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              Stay updated on your club's game sessions
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
