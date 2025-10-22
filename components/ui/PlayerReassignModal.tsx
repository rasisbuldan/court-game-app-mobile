import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { X, User, ArrowRight } from 'lucide-react-native';
import { Player } from '@courtster/shared';

interface PlayerReassignModalProps {
  visible: boolean;
  onClose: () => void;
  players: Player[];
  currentPlayer: Player | null;
  onReassign: (oldPlayerId: string, newPlayerId: string) => void;
}

export function PlayerReassignModal({
  visible,
  onClose,
  players,
  currentPlayer,
  onReassign,
}: PlayerReassignModalProps) {
  const [selectedNewPlayer, setSelectedNewPlayer] = useState<Player | null>(null);

  // Filter out the current player and already active players in current round
  const availablePlayers = players.filter(
    (p) => p.id !== currentPlayer?.id && p.status !== 'departed' && p.status !== 'no_show'
  );

  const handleConfirm = () => {
    if (currentPlayer && selectedNewPlayer) {
      onReassign(currentPlayer.id, selectedNewPlayer.id);
      setSelectedNewPlayer(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedNewPlayer(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl pt-6 pb-8 max-h-5/6">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 mb-4">
            <Text className="text-xl font-bold text-gray-900">Reassign Player</Text>
            <TouchableOpacity onPress={handleClose}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>

          {/* Current Player */}
          {currentPlayer && (
            <View className="px-6 mb-4">
              <View className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <Text className="text-xs font-medium text-blue-700 mb-1">REPLACING</Text>
                <View className="flex-row items-center gap-2">
                  <User color="#3B82F6" size={20} />
                  <Text className="text-base font-semibold text-blue-900">
                    {currentPlayer.name}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Arrow */}
          {selectedNewPlayer && (
            <View className="items-center mb-4">
              <ArrowRight color="#9CA3AF" size={24} />
            </View>
          )}

          {/* Selected New Player */}
          {selectedNewPlayer && (
            <View className="px-6 mb-4">
              <View className="bg-green-50 rounded-lg p-4 border border-green-200">
                <Text className="text-xs font-medium text-green-700 mb-1">WITH</Text>
                <View className="flex-row items-center gap-2">
                  <User color="#10B981" size={20} />
                  <Text className="text-base font-semibold text-green-900">
                    {selectedNewPlayer.name}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Available Players List */}
          <View className="px-6 mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              {selectedNewPlayer ? 'Or select another player:' : 'Select replacement player:'}
            </Text>
          </View>

          <ScrollView className="flex-1 px-6">
            {availablePlayers.map((player) => {
              const isSelected = selectedNewPlayer?.id === player.id;

              return (
                <TouchableOpacity
                  key={player.id}
                  className={`flex-row items-center justify-between p-4 mb-2 rounded-lg border ${
                    isSelected
                      ? 'bg-primary-50 border-primary-300'
                      : 'bg-white border-gray-200'
                  }`}
                  onPress={() => setSelectedNewPlayer(player)}
                >
                  <View className="flex-1">
                    <Text
                      className={`text-base font-medium ${
                        isSelected ? 'text-primary-900' : 'text-gray-900'
                      }`}
                    >
                      {player.name}
                    </Text>
                    <Text className="text-xs text-gray-600 mt-0.5">
                      Rating: {player.rating.toFixed(1)} • Status: {player.status}
                    </Text>
                  </View>
                  {isSelected && (
                    <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center">
                      <Text className="text-white font-bold text-xs">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {availablePlayers.length === 0 && (
              <View className="items-center py-12">
                <User color="#9CA3AF" size={48} />
                <Text className="text-gray-500 mt-4">No available players</Text>
                <Text className="text-gray-400 text-sm mt-1 text-center">
                  All other players are either playing or unavailable
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View className="px-6 mt-4 flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-gray-200 rounded-lg py-3"
              onPress={handleClose}
            >
              <Text className="text-gray-900 font-semibold text-center">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 rounded-lg py-3 ${
                selectedNewPlayer ? 'bg-primary-500' : 'bg-gray-300'
              }`}
              onPress={handleConfirm}
              disabled={!selectedNewPlayer}
            >
              <Text
                className={`font-semibold text-center ${
                  selectedNewPlayer ? 'text-white' : 'text-gray-500'
                }`}
              >
                Confirm Swap
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
