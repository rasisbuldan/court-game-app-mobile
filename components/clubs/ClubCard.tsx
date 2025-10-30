import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Users, Crown, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Database } from '@court-game/shared/types/database.types';

type Club = Database['public']['Tables']['clubs']['Row'] & {
  userRole?: 'owner' | 'admin' | 'member';
  memberCount?: number;
};

interface ClubCardProps {
  club: Club;
  variant?: 'compact' | 'full';
  onPress?: () => void;
}

export default function ClubCard({ club, variant = 'compact', onPress }: ClubCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(tabs)/club-detail?id=${club.id}`);
    }
  };

  const getRoleIcon = () => {
    if (club.userRole === 'owner') {
      return <Crown color="#F59E0B" size={14} fill="#F59E0B" />;
    }
    if (club.userRole === 'admin') {
      return <Shield color="#3B82F6" size={14} fill="#3B82F6" />;
    }
    return null;
  };

  const getRoleLabel = () => {
    if (club.userRole === 'owner') return 'Owner';
    if (club.userRole === 'admin') return 'Admin';
    return 'Member';
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={{
          width: 120,
          marginRight: 12,
        }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 12,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Logo */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: club.logo_url ? '#E5E7EB' : '#F43F5E',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            {club.logo_url ? (
              <Image
                source={{ uri: club.logo_url }}
                style={{ width: 80, height: 80 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ fontSize: 32, fontWeight: '700', color: '#FFFFFF' }}>
                {club.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* Name */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: '#111827',
              textAlign: 'center',
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {club.name}
          </Text>

          {/* Role badge */}
          {club.userRole && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor:
                  club.userRole === 'owner'
                    ? '#FEF3C7'
                    : club.userRole === 'admin'
                    ? '#DBEAFE'
                    : '#F3F4F6',
              }}
            >
              {getRoleIcon()}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color:
                    club.userRole === 'owner'
                      ? '#F59E0B'
                      : club.userRole === 'admin'
                      ? '#3B82F6'
                      : '#6B7280',
                }}
              >
                {getRoleLabel()}
              </Text>
            </View>
          )}

          {/* Member count */}
          {club.memberCount !== undefined && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: 4,
              }}
            >
              <Users color="#9CA3AF" size={12} />
              <Text style={{ fontSize: 11, color: '#6B7280' }}>
                {club.memberCount} {club.memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Full variant
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
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
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {/* Logo */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: club.logo_url ? '#E5E7EB' : '#F43F5E',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {club.logo_url ? (
            <Image
              source={{ uri: club.logo_url }}
              style={{ width: 100, height: 100 }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ fontSize: 40, fontWeight: '700', color: '#FFFFFF' }}>
              {club.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* Details */}
        <View style={{ flex: 1 }}>
          {/* Name */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#111827',
              marginBottom: 6,
            }}
            numberOfLines={2}
          >
            {club.name}
          </Text>

          {/* Bio */}
          {club.bio && (
            <Text
              style={{
                fontSize: 13,
                color: '#6B7280',
                lineHeight: 18,
                marginBottom: 8,
              }}
              numberOfLines={2}
            >
              {club.bio}
            </Text>
          )}

          {/* Role and member count */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Role badge */}
            {club.userRole && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 12,
                  backgroundColor:
                    club.userRole === 'owner'
                      ? '#FEF3C7'
                      : club.userRole === 'admin'
                      ? '#DBEAFE'
                      : '#F3F4F6',
                }}
              >
                {getRoleIcon()}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color:
                      club.userRole === 'owner'
                        ? '#F59E0B'
                        : club.userRole === 'admin'
                        ? '#3B82F6'
                        : '#6B7280',
                  }}
                >
                  {getRoleLabel()}
                </Text>
              </View>
            )}

            {/* Member count */}
            {club.memberCount !== undefined && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 12,
                  backgroundColor: '#F3F4F6',
                }}
              >
                <Users color="#6B7280" size={14} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>
                  {club.memberCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
