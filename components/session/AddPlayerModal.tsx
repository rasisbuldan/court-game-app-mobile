import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Player } from '@courtster/shared';

interface AddPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  onAddPlayer: (name: string, rating: number) => void;
  existingPlayers: Player[];
}

export function AddPlayerModal({
  visible,
  onClose,
  onAddPlayer,
  existingPlayers,
}: AddPlayerModalProps) {
  const [playerName, setPlayerName] = useState('');
  const [playerRating, setPlayerRating] = useState('1500');
  const [error, setError] = useState('');

  const handleAdd = () => {
    // Validation
    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    if (existingPlayers.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
      setError('A player with this name already exists');
      return;
    }

    const rating = parseInt(playerRating, 10);
    if (isNaN(rating) || rating < 0 || rating > 5000) {
      setError('Rating must be between 0 and 5000');
      return;
    }

    // Add player
    onAddPlayer(playerName.trim(), rating);

    // Reset form
    setPlayerName('');
    setPlayerRating('1500');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setPlayerName('');
    setPlayerRating('1500');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: Platform.OS === 'android'
              ? 'rgba(255, 255, 255, 0.98)'
              : 'rgba(255, 255, 255, 0.95)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 400,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            ...(Platform.OS === 'android' ? { elevation: 8 } : {}),
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Text style={{
                fontSize: 22,
                fontWeight: '700',
                color: '#111827',
              }}>
                Add Player
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(107, 114, 128, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Player Name */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: 8,
                }}>
                  Player Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderStyle: 'solid',
                    borderColor: error && !playerName.trim() ? '#EF4444' : '#E5E7EB',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: '#111827',
                    overflow: 'hidden',
                  }}
                  placeholder="Enter player name"
                  placeholderTextColor="#9CA3AF"
                  value={playerName}
                  onChangeText={(text) => {
                    setPlayerName(text);
                    setError('');
                  }}
                  autoCapitalize="words"
                  autoFocus
                />
              </View>

              {/* Player Rating */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: 8,
                }}>
                  Initial Rating
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderStyle: 'solid',
                    borderColor: '#E5E7EB',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: '#111827',
                    overflow: 'hidden',
                  }}
                  placeholder="1500"
                  placeholderTextColor="#9CA3AF"
                  value={playerRating}
                  onChangeText={(text) => {
                    setPlayerRating(text);
                    setError('');
                  }}
                  keyboardType="numeric"
                />
                <Text style={{
                  fontSize: 12,
                  color: '#6B7280',
                  marginTop: 6,
                }}>
                  Default rating is 1500. Range: 0-5000
                </Text>
              </View>

              {/* Error Message */}
              {error ? (
                <View style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                }}>
                  <Text style={{
                    fontSize: 13,
                    color: '#DC2626',
                    fontWeight: '500',
                  }}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Info Box */}
              <View style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: 12,
                padding: 12,
                marginBottom: 24,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'rgba(59, 130, 246, 0.2)',
              }}>
                <Text style={{
                  fontSize: 12,
                  color: '#1E40AF',
                  lineHeight: 18,
                }}>
                  The new player will be added to the sitting players list and will be included in the next round generation.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={{
                flexDirection: 'row',
                gap: 12,
              }}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Text style={{
                    color: '#374151',
                    fontSize: 15,
                    fontWeight: '600',
                  }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAdd}
                  style={{
                    flex: 1,
                    backgroundColor: '#EF4444',
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    ...(Platform.OS === 'android' ? { elevation: 3 } : {}),
                  }}
                >
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: '700',
                  }}>
                    Add Player
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
