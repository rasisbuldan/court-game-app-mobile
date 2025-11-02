import { View, Text, TouchableOpacity, Modal, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { X, Check, Users, ChevronDown } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useClubs } from '../../hooks/useClubs';
import { Database } from '@court-game/shared/types/database.types';

type Club = Database['public']['Tables']['clubs']['Row'] & {
  userRole?: 'owner' | 'admin' | 'member';
};

interface ClubSelectorProps {
  selectedClubId: string | null;
  onSelectClub: (clubId: string | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export default function ClubSelector({
  selectedClubId,
  onSelectClub,
  label = 'Club (Optional)',
  placeholder = 'Select a club or create without one',
  disabled = false,
  error,
}: ClubSelectorProps) {
  const { user } = useAuth();
  const { data: clubs, isLoading } = useClubs(user?.id);
  const [modalVisible, setModalVisible] = useState(false);

  const selectedClub = clubs?.find((club) => club.id === selectedClubId);

  const handleSelect = (clubId: string | null) => {
    onSelectClub(clubId);
    setModalVisible(false);
  };

  return (
    <View>
      {/* Label */}
      {label && (
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
          {label}
        </Text>
      )}

      {/* Selector Button */}
      <TouchableOpacity
        onPress={() => !disabled && !isLoading && setModalVisible(true)}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
        style={{
          backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF',
          borderWidth: 1,
          borderColor: error ? '#EF4444' : '#D1D5DB',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color="#9CA3AF" />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#9CA3AF' }}>
              Loading clubs...
            </Text>
          </View>
        ) : selectedClub ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            {/* Club Logo */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: selectedClub.logo_url ? '#E5E7EB' : '#F43F5E',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {selectedClub.logo_url ? (
                <Image
                  source={{ uri: selectedClub.logo_url }}
                  style={{ width: 32, height: 32 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                  {selectedClub.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            {/* Club Name */}
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 }} numberOfLines={1}>
              {selectedClub.name}
            </Text>
          </View>
        ) : (
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#9CA3AF', flex: 1 }} numberOfLines={1}>
            {placeholder}
          </Text>
        )}
        {!isLoading && <ChevronDown color={disabled ? '#9CA3AF' : '#6B7280'} size={20} />}
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
          {error}
        </Text>
      )}

      {/* Help Text */}
      <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
        Sessions can be created for a club or without one
      </Text>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          {/* Header */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              paddingTop: 16,
              paddingBottom: 16,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>Select Club</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X color="#374151" size={18} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* No Club Option */}
            <TouchableOpacity
              onPress={() => handleSelect(null)}
              activeOpacity={0.7}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: selectedClubId === null ? 2 : 0,
                borderColor: selectedClubId === null ? '#EF4444' : 'transparent',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Users color="#6B7280" size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>No Club</Text>
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>Create session without a club</Text>
                  </View>
                </View>
                {selectedClubId === null && (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#EF4444',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check color="#FFFFFF" size={16} strokeWidth={3} />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Loading State */}
            {isLoading && (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={{ marginTop: 12, fontSize: 14, color: '#6B7280' }}>Loading clubs...</Text>
              </View>
            )}

            {/* Clubs List */}
            {!isLoading && clubs && clubs.length > 0 ? (
              <>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12, marginTop: 8 }}>
                  Your Clubs ({clubs.length})
                </Text>
                {clubs.map((club) => (
                  <TouchableOpacity
                    key={club.id}
                    onPress={() => handleSelect(club.id)}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: selectedClubId === club.id ? 2 : 0,
                      borderColor: selectedClubId === club.id ? '#EF4444' : 'transparent',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        {/* Club Logo */}
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: club.logo_url ? '#E5E7EB' : '#F43F5E',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {club.logo_url ? (
                            <Image
                              source={{ uri: club.logo_url }}
                              style={{ width: 48, height: 48 }}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
                              {club.name.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        {/* Club Info */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                            {club.name}
                          </Text>
                          {club.bio && (
                            <Text style={{ fontSize: 13, color: '#6B7280' }} numberOfLines={1}>
                              {club.bio}
                            </Text>
                          )}
                        </View>
                      </View>
                      {selectedClubId === club.id && (
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: '#EF4444',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check color="#FFFFFF" size={16} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              !isLoading && (
                <View
                  style={{
                    backgroundColor: '#DBEAFE',
                    borderRadius: 16,
                    padding: 16,
                    marginTop: 8,
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#1E40AF', fontWeight: '600', marginBottom: 4 }}>
                    No clubs yet
                  </Text>
                  <Text style={{ fontSize: 13, color: '#1E40AF', lineHeight: 20 }}>
                    Create a club from your profile to organize your sessions
                  </Text>
                </View>
              )
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
