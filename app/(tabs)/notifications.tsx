import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useUserInvitations, useCleanupExpiredInvitations } from '../../hooks/useClubInvitations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, CheckCheck } from 'lucide-react-native';
import ClubInviteNotification from '../../components/notifications/ClubInviteNotification';
import EmptyNotifications from '../../components/notifications/EmptyNotifications';
import { useEffect } from 'react';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const {
    data: invitations,
    isLoading,
    refetch,
    isRefetching,
  } = useUserInvitations(user?.id);

  const cleanupMutation = useCleanupExpiredInvitations();

  // Cleanup expired invitations on mount
  useEffect(() => {
    if (user?.id) {
      cleanupMutation.mutate();
    }
  }, [user?.id]);

  // Calculate counts
  const pendingCount = invitations?.filter(
    (inv) => inv.status === 'pending' && new Date(inv.expires_at) > new Date()
  ).length || 0;

  const expiredCount = invitations?.filter(
    (inv) => inv.status === 'pending' && new Date(inv.expires_at) <= new Date()
  ).length || 0;

  // Separate pending and expired
  const pendingInvitations = invitations?.filter(
    (inv) => inv.status === 'pending' && new Date(inv.expires_at) > new Date()
  ) || [];

  const expiredInvitations = invitations?.filter(
    (inv) => inv.status === 'pending' && new Date(inv.expires_at) <= new Date()
  ) || [];

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top,
            paddingBottom: 16,
            paddingHorizontal: 16,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827' }}>Notifications</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Stay updated</Text>
            </View>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell color="#EF4444" size={24} />
            </View>
          </View>
        </View>

        {/* Loading State */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={{ marginTop: 16, fontSize: 14, color: '#6B7280' }}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingBottom: 16,
          paddingHorizontal: 16,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827' }}>Notifications</Text>
            {pendingCount > 0 ? (
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                {pendingCount} pending {pendingCount === 1 ? 'invitation' : 'invitations'}
              </Text>
            ) : (
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>All caught up!</Text>
            )}
          </View>
          <View style={{ position: 'relative' }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell color="#EF4444" size={24} />
            </View>
            {pendingCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                  {pendingCount > 99 ? '99+' : pendingCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Content */}
      {!invitations || invitations.length === 0 ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#EF4444" />
          }
          contentContainerStyle={{ flex: 1 }}
        >
          <EmptyNotifications />
        </ScrollView>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#EF4444" />
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 100,
          }}
        >
          {/* Pending Invitations Section */}
          {pendingInvitations.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                  Pending ({pendingCount})
                </Text>
              </View>
              {pendingInvitations.map((invitation) => (
                <ClubInviteNotification
                  key={invitation.id}
                  invitation={invitation}
                  userId={user!.id}
                />
              ))}
            </View>
          )}

          {/* Expired Invitations Section */}
          {expiredInvitations.length > 0 && (
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#6B7280' }}>
                  Expired ({expiredCount})
                </Text>
              </View>
              {expiredInvitations.map((invitation) => (
                <ClubInviteNotification
                  key={invitation.id}
                  invitation={invitation}
                  userId={user!.id}
                />
              ))}
            </View>
          )}

          {/* All Clear Message (when only expired invitations exist) */}
          {pendingCount === 0 && expiredCount > 0 && (
            <View
              style={{
                backgroundColor: '#ECFDF5',
                borderRadius: 16,
                padding: 16,
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#10B981',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCheck color="#FFFFFF" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#065F46', marginBottom: 2 }}>
                  All caught up!
                </Text>
                <Text style={{ fontSize: 13, color: '#047857' }}>
                  You have no pending notifications
                </Text>
              </View>
            </View>
          )}

          {/* Info Card */}
          <View
            style={{
              backgroundColor: '#DBEAFE',
              borderRadius: 16,
              padding: 16,
              marginTop: 24,
            }}
          >
            <Text style={{ fontSize: 14, color: '#1E40AF', fontWeight: '600', marginBottom: 4 }}>
              About Notifications
            </Text>
            <Text style={{ fontSize: 13, color: '#1E40AF', lineHeight: 20 }}>
              • Invitations expire after 7 days{'\n'}
              • Accept invitations to join clubs{'\n'}
              • Pull down to refresh notifications{'\n'}
              • New notifications appear automatically
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
