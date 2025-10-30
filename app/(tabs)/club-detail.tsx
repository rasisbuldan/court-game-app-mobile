import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useClub, useDeleteClub } from '../../hooks/useClubs';
import { useClubMembers, useRemoveMember, useUpdateMemberRole, useLeaveClub } from '../../hooks/useClubMembers';
import { useUserClubRole } from '../../hooks/useClubMembers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Users,
  Settings,
  UserPlus,
  MoreVertical,
  Edit3,
  Trash2,
  Crown,
  Shield,
  UserMinus,
  LogOut,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

type Tab = 'members' | 'settings';

export default function ClubDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: club, isLoading: clubLoading, refetch: refetchClub } = useClub(id);
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useClubMembers(id);
  const { data: userRole } = useUserClubRole(id, user?.id);

  const deleteClubMutation = useDeleteClub();
  const removeMemberMutation = useRemoveMember();
  const updateRoleMutation = useUpdateMemberRole();
  const leaveClubMutation = useLeaveClub();

  const isOwner = userRole?.role === 'owner';
  const isAdmin = userRole?.role === 'admin' || isOwner;

  const handleRefresh = async () => {
    await Promise.all([refetchClub(), refetchMembers()]);
  };

  const handleDeleteClub = () => {
    Alert.alert(
      'Delete Club',
      'Are you sure you want to delete this club? This action cannot be undone. All members will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteClubMutation.mutate(
              { id: id! },
              {
                onSuccess: () => {
                  router.back();
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleLeaveClub = () => {
    Alert.alert(
      'Leave Club',
      'Are you sure you want to leave this club?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveClubMutation.mutate(
              { clubId: id!, userId: user!.id },
              {
                onSuccess: () => {
                  router.back();
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleRemoveMember = (membershipId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the club?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeMemberMutation.mutate({ membershipId, clubId: id! });
          },
        },
      ]
    );
  };

  const handlePromoteMember = (membershipId: string, currentRole: string, memberName: string) => {
    const newRole = currentRole === 'member' ? 'admin' : 'member';
    const action = newRole === 'admin' ? 'promote' : 'demote';

    Alert.alert(
      `${action === 'promote' ? 'Promote' : 'Demote'} Member`,
      `Are you sure you want to ${action} ${memberName} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'promote' ? 'Promote' : 'Demote',
          onPress: () => {
            updateRoleMutation.mutate({
              membershipId,
              role: newRole as 'admin' | 'member',
              clubId: id!,
            });
          },
        },
      ]
    );
  };

  if (clubLoading || !club) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={{ marginTop: 16, fontSize: 14, color: '#6B7280' }}>Loading club...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft color="#374151" size={20} />
          </TouchableOpacity>

          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Club Details</Text>

          {isOwner && (
            <TouchableOpacity
              onPress={() => router.push(`/clubs/edit/${id}` as any)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Edit3 color="#374151" size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={clubLoading || membersLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Club Header */}
        <View style={{ backgroundColor: '#FFFFFF', padding: 20, alignItems: 'center' }}>
          {/* Logo */}
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: club.logo_url ? '#E5E7EB' : '#F43F5E',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
              marginBottom: 16,
            }}
          >
            {club.logo_url ? (
              <Image
                source={{ uri: club.logo_url }}
                style={{ width: 120, height: 120 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ fontSize: 48, fontWeight: '700', color: '#FFFFFF' }}>
                {club.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* Name */}
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
            {club.name}
          </Text>

          {/* Bio */}
          {club.bio && (
            <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 16 }}>
              {club.bio}
            </Text>
          )}

          {/* Member count */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              backgroundColor: '#F3F4F6',
            }}
          >
            <Users color="#6B7280" size={18} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>
              {members?.length || 0} {members?.length === 1 ? 'Member' : 'Members'}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
            marginTop: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('members')}
            style={{
              flex: 1,
              paddingVertical: 16,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'members' ? '#EF4444' : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: activeTab === 'members' ? '#EF4444' : '#6B7280',
                textAlign: 'center',
              }}
            >
              Members
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('settings')}
            style={{
              flex: 1,
              paddingVertical: 16,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'settings' ? '#EF4444' : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: activeTab === 'settings' ? '#EF4444' : '#6B7280',
                textAlign: 'center',
              }}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <View style={{ padding: 16 }}>
            {/* Invite Button */}
            {isAdmin && (
              <TouchableOpacity
                onPress={() => Toast.show({ type: 'info', text1: 'Coming soon', text2: 'Member invitation feature' })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: '#EF4444',
                  paddingVertical: 14,
                  borderRadius: 16,
                  marginBottom: 16,
                }}
              >
                <UserPlus color="#FFFFFF" size={20} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>Invite Members</Text>
              </TouchableOpacity>
            )}

            {/* Members List */}
            {membersLoading ? (
              <ActivityIndicator size="large" color="#EF4444" style={{ marginTop: 32 }} />
            ) : members && members.length > 0 ? (
              members.map((member) => (
                <View
                  key={member.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      {/* Avatar */}
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: member.profile.avatar_url ? '#E5E7EB' : '#F43F5E',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {member.profile.avatar_url ? (
                          <Image
                            source={{ uri: member.profile.avatar_url }}
                            style={{ width: 48, height: 48 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                            {(member.profile.display_name || member.profile.email).charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                            {member.profile.display_name || member.profile.email}
                          </Text>
                          {member.role === 'owner' && <Crown color="#F59E0B" size={14} fill="#F59E0B" />}
                          {member.role === 'admin' && <Shield color="#3B82F6" size={14} fill="#3B82F6" />}
                        </View>
                        <Text style={{ fontSize: 13, color: '#6B7280' }}>
                          {member.profile.username ? `@${member.profile.username}` : member.profile.email}
                        </Text>
                      </View>
                    </View>

                    {/* Actions (only for admin/owner, not for self, not for owner) */}
                    {isAdmin && member.user_id !== user?.id && member.role !== 'owner' && (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert('Member Actions', `What would you like to do?`, [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: member.role === 'admin' ? 'Demote to Member' : 'Promote to Admin',
                              onPress: () =>
                                handlePromoteMember(
                                  member.id,
                                  member.role,
                                  member.profile.display_name || member.profile.email
                                ),
                            },
                            {
                              text: 'Remove from Club',
                              style: 'destructive',
                              onPress: () =>
                                handleRemoveMember(member.id, member.profile.display_name || member.profile.email),
                            },
                          ]);
                        }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: '#F3F4F6',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MoreVertical color="#6B7280" size={18} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 32 }}>No members yet</Text>
            )}
          </View>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <View style={{ padding: 16 }}>
            {/* Leave Club Button (for non-owners) */}
            {!isOwner && (
              <TouchableOpacity
                onPress={handleLeaveClub}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: '#FFFFFF',
                  paddingVertical: 14,
                  borderRadius: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: '#FCA5A5',
                }}
              >
                <LogOut color="#EF4444" size={20} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#EF4444' }}>Leave Club</Text>
              </TouchableOpacity>
            )}

            {/* Delete Club Button (owner only) */}
            {isOwner && (
              <TouchableOpacity
                onPress={handleDeleteClub}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: '#FEE2E2',
                  paddingVertical: 14,
                  borderRadius: 16,
                }}
              >
                <Trash2 color="#DC2626" size={20} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#DC2626' }}>Delete Club</Text>
              </TouchableOpacity>
            )}

            {/* Info */}
            <View
              style={{
                backgroundColor: '#DBEAFE',
                borderRadius: 16,
                padding: 16,
                marginTop: 16,
              }}
            >
              <Text style={{ fontSize: 14, color: '#1E40AF', fontWeight: '600', marginBottom: 4 }}>
                Club Information
              </Text>
              <Text style={{ fontSize: 13, color: '#1E40AF', lineHeight: 20 }}>
                • Created: {new Date(club.created_at).toLocaleDateString()}{'\n'}
                • Owner: {isOwner ? 'You' : 'Another member'}{'\n'}
                • Your role: {userRole?.role || 'Member'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
