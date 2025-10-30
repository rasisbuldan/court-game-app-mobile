import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Users, Check, X, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAcceptInvitation, useDeclineInvitation } from '../../hooks/useClubInvitations';
import { useState } from 'react';

interface InvitationWithDetails {
  id: string;
  club_id: string;
  invited_by: string;
  invited_user_id: string | null;
  invited_email: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  club: {
    id: string;
    name: string;
    bio: string | null;
    logo_url: string | null;
    owner_id: string;
    created_at: string;
  };
  inviter: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface ClubInviteNotificationProps {
  invitation: InvitationWithDetails;
  userId: string;
}

export default function ClubInviteNotification({ invitation, userId }: ClubInviteNotificationProps) {
  const router = useRouter();
  const acceptMutation = useAcceptInvitation();
  const declineMutation = useDeclineInvitation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await acceptMutation.mutateAsync({
        invitationId: invitation.id,
        userId,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await declineMutation.mutateAsync({
        invitationId: invitation.id,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewClub = () => {
    router.push(`/clubs/${invitation.club_id}` as any);
  };

  // Calculate time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return created.toLocaleDateString();
  };

  // Calculate time until expiry
  const getExpiryText = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffInHours = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 0) return 'Expired';
    if (diffInHours < 1) return 'Expires in less than 1 hour';
    if (diffInHours < 24) return `Expires in ${diffInHours}h`;
    return `Expires in ${Math.floor(diffInHours / 24)}d`;
  };

  const isExpired = new Date(invitation.expires_at) < new Date();
  const expiryText = getExpiryText(invitation.expires_at);
  const isExpiringSoon = !isExpired && expiryText.includes('less than');

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: isExpired ? '#9CA3AF' : isExpiringSoon ? '#F59E0B' : '#EF4444',
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
        {/* Club Logo */}
        <TouchableOpacity onPress={handleViewClub} activeOpacity={0.7}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: invitation.club.logo_url ? '#E5E7EB' : '#F43F5E',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginRight: 12,
            }}
          >
            {invitation.club.logo_url ? (
              <Image
                source={{ uri: invitation.club.logo_url }}
                style={{ width: 56, height: 56 }}
                resizeMode="cover"
              />
            ) : (
              <Users color="#FFFFFF" size={28} />
            )}
          </View>
        </TouchableOpacity>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {/* Title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 }}>
              Club Invitation
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock color="#9CA3AF" size={12} />
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{getTimeAgo(invitation.created_at)}</Text>
            </View>
          </View>

          {/* Message */}
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 8 }}>
            <Text style={{ fontWeight: '600' }}>
              {invitation.inviter.display_name || invitation.inviter.username || 'Someone'}
            </Text>
            {' invited you to join '}
            <Text style={{ fontWeight: '600' }}>{invitation.club.name}</Text>
          </Text>

          {/* Club Bio */}
          {invitation.club.bio && (
            <Text
              style={{ fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 8 }}
              numberOfLines={2}
            >
              {invitation.club.bio}
            </Text>
          )}

          {/* Expiry Warning */}
          {!isExpired && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: isExpiringSoon ? '#FEF3C7' : '#F3F4F6',
                alignSelf: 'flex-start',
                marginBottom: 12,
              }}
            >
              <Clock color={isExpiringSoon ? '#F59E0B' : '#6B7280'} size={12} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: isExpiringSoon ? '#F59E0B' : '#6B7280',
                }}
              >
                {expiryText}
              </Text>
            </View>
          )}

          {/* Expired Message */}
          {isExpired && (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: '#F3F4F6',
                alignSelf: 'flex-start',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF' }}>
                This invitation has expired
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      {!isExpired && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Accept Button */}
          <TouchableOpacity
            onPress={handleAccept}
            disabled={isProcessing || acceptMutation.isPending}
            activeOpacity={0.7}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: isProcessing || acceptMutation.isPending ? '#FCA5A5' : '#EF4444',
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            {isProcessing || acceptMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check color="#FFFFFF" size={18} strokeWidth={2.5} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Accept</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Decline Button */}
          <TouchableOpacity
            onPress={handleDecline}
            disabled={isProcessing || declineMutation.isPending}
            activeOpacity={0.7}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#FFFFFF',
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#E5E7EB',
            }}
          >
            {isProcessing || declineMutation.isPending ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <>
                <X color="#6B7280" size={18} strokeWidth={2.5} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#6B7280' }}>Decline</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* View Club Button (if expired) */}
      {isExpired && (
        <TouchableOpacity
          onPress={handleViewClub}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: '#F3F4F6',
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Users color="#6B7280" size={18} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#6B7280' }}>View Club</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
