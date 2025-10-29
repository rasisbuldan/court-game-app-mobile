import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { X, Trash2, Edit2, UserCog } from 'lucide-react-native';
import { Player } from '@courtster/shared';

interface ManagePlayersModalProps {
  visible: boolean;
  onClose: () => void;
  players: Player[];
  onRemovePlayer: (playerId: string) => void;
  onChangeStatus: (playerId: string, newStatus: string) => void;
  onReassignPlayer: (player: Player) => void;
}

export function ManagePlayersModal({
  visible,
  onClose,
  players,
  onRemovePlayer,
  onChangeStatus,
  onReassignPlayer,
}: ManagePlayersModalProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const handleRemove = (player: Player) => {
    Alert.alert(
      'Remove Player',
      `Are you sure you want to remove ${player.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemovePlayer(player.id),
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'late': return '#F59E0B';
      case 'no_show': return '#EF4444';
      case 'departed': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'late': return 'Late';
      case 'no_show': return 'No Show';
      case 'departed': return 'Departed';
      default: return 'Unknown';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: Platform.OS === 'android'
            ? 'rgba(255, 255, 255, 0.98)'
            : 'rgba(255, 255, 255, 0.95)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '85%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          ...(Platform.OS === 'android' ? { elevation: 8 } : {}),
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(229, 231, 235, 0.5)',
          }}>
            <View>
              <Text style={{
                fontSize: 22,
                fontWeight: '700',
                color: '#111827',
              }}>
                Manage Players
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#6B7280',
                marginTop: 2,
              }}>
                {players.length} {players.length === 1 ? 'player' : 'players'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X color="#6B7280" size={20} />
            </TouchableOpacity>
          </View>

          {/* Players List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
          >
            {players.map((player, index) => (
              <View
                key={player.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'rgba(229, 231, 235, 0.5)',
                  overflow: 'hidden',
                }}
              >
                {/* Player Info */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <View style={{ flex: 1 }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                    }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#111827',
                      }}>
                        {player.name}
                      </Text>
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: getStatusColor(player.status),
                      }} />
                    </View>
                    <Text style={{
                      fontSize: 13,
                      color: '#6B7280',
                    }}>
                      Rating: {player.rating.toFixed(1)} • {player.totalPoints} pts
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setExpandedPlayer(
                      expandedPlayer === player.id ? null : player.id
                    )}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: expandedPlayer === player.id
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(107, 114, 128, 0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Edit2
                      color={expandedPlayer === player.id ? '#EF4444' : '#6B7280'}
                      size={16}
                    />
                  </TouchableOpacity>
                </View>

                {/* Expanded Actions */}
                {expandedPlayer === player.id && (
                  <View style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(229, 231, 235, 0.5)',
                    gap: 8,
                  }}>
                    {/* Status Buttons */}
                    <View style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}>
                      {['active', 'late', 'no_show', 'departed'].map((status) => (
                        <TouchableOpacity
                          key={status}
                          onPress={() => {
                            onChangeStatus(player.id, status);
                            setExpandedPlayer(null);
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                            backgroundColor: player.status === status
                              ? `${getStatusColor(status)}20`
                              : 'rgba(107, 114, 128, 0.1)',
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: player.status === status
                              ? getStatusColor(status)
                              : 'transparent',
                          }}
                        >
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: player.status === status
                              ? getStatusColor(status)
                              : '#6B7280',
                          }}>
                            {getStatusLabel(status)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={{
                      flexDirection: 'row',
                      gap: 8,
                      marginTop: 8,
                    }}>
                      <TouchableOpacity
                        onPress={() => {
                          onReassignPlayer(player);
                          setExpandedPlayer(null);
                        }}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: 'rgba(59, 130, 246, 0.2)',
                        }}
                      >
                        <UserCog color="#3B82F6" size={16} />
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: '#3B82F6',
                        }}>
                          Reassign
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleRemove(player)}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: 'rgba(239, 68, 68, 0.2)',
                        }}
                      >
                        <Trash2 color="#EF4444" size={16} />
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: '#EF4444',
                        }}>
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {players.length === 0 && (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 40,
              }}>
                <Text style={{
                  fontSize: 15,
                  color: '#9CA3AF',
                  textAlign: 'center',
                }}>
                  No players in this session
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <View style={{
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(229, 231, 235, 0.5)',
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: '#EF4444',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                ...(Platform.OS === 'android' ? { elevation: 3 } : {
                  shadowColor: '#EF4444',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }),
              }}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: '700',
              }}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
