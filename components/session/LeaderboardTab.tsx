import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Trophy, Medal, Award, MoreVertical, UserCog } from 'lucide-react-native';
import { Player } from '@courtster/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { StatusDropdown } from '../ui/StatusDropdown';
import { PlayerReassignModal } from '../ui/PlayerReassignModal';
import { offlineQueue } from '../../utils/offlineQueue';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import Toast from 'react-native-toast-message';

interface LeaderboardTabProps {
  players: Player[];
  sortBy: 'points' | 'wins';
  onSortChange: (sortBy: 'points' | 'wins') => void;
  session: any;
  sessionId: string;
  allRounds: any[];
}

export function LeaderboardTab({
  players,
  sortBy,
  onSortChange,
  session,
  sessionId,
  allRounds,
}: LeaderboardTabProps) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [playerToReassign, setPlayerToReassign] = useState<Player | null>(null);

  // Update player status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ playerId, newStatus }: { playerId: string; newStatus: string }) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) throw new Error('Player not found');

      const description = `${player.name} status changed to ${newStatus}`;

      if (isOnline) {
        // Online: update immediately
        const { error } = await supabase.from('players').update({ status: newStatus }).eq('id', playerId);
        if (error) throw error;

        await supabase.from('event_history').insert({
          session_id: sessionId,
          event_type: 'player_status_changed',
          description,
          player_id: playerId,
        });
      } else {
        // Offline: queue for later
        await offlineQueue.addOperation('UPDATE_PLAYER_STATUS', sessionId, {
          playerId,
          newStatus,
          sessionId,
          description,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['eventHistory', sessionId] });
      Toast.show({
        type: 'success',
        text1: 'Status Updated',
        text2: isOnline ? 'Player status changed' : 'Will sync when online',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to Update Status',
        text2: error.message,
      });
    },
  });

  // Reassign player mutation
  const reassignPlayerMutation = useMutation({
    mutationFn: async ({ oldPlayerId, newPlayerId }: { oldPlayerId: string; newPlayerId: string }) => {
      const oldPlayer = players.find((p) => p.id === oldPlayerId);
      const newPlayer = players.find((p) => p.id === newPlayerId);
      if (!oldPlayer || !newPlayer) throw new Error('Player not found');

      // Update rounds data to replace player
      const updatedRounds = allRounds.map((round) => ({
        ...round,
        matches: round.matches.map((match: any) => ({
          ...match,
          team1: match.team1.map((p: Player) => (p.id === oldPlayerId ? newPlayer : p)),
          team2: match.team2.map((p: Player) => (p.id === oldPlayerId ? newPlayer : p)),
        })),
        sittingPlayers: round.sittingPlayers.map((p: Player) => (p.id === oldPlayerId ? newPlayer : p)),
      }));

      const description = `${oldPlayer.name} replaced by ${newPlayer.name}`;

      if (isOnline) {
        // Online: update immediately
        const { error } = await supabase
          .from('game_sessions')
          .update({ round_data: JSON.stringify(updatedRounds) })
          .eq('id', sessionId);

        if (error) throw error;

        await supabase.from('event_history').insert({
          session_id: sessionId,
          event_type: 'player_reassigned',
          description,
        });
      } else {
        // Offline: queue for later
        await offlineQueue.addOperation('REASSIGN_PLAYER', sessionId, {
          oldPlayerId,
          newPlayerId,
          sessionId,
          description,
          updatedRounds,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['players', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['eventHistory', sessionId] });
      Toast.show({
        type: 'success',
        text1: 'Player Reassigned',
        text2: isOnline ? 'Tournament updated successfully' : 'Will sync when online',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to Reassign Player',
        text2: error.message,
      });
    },
  });

  const handleStatusChange = (playerId: string, newStatus: string) => {
    updateStatusMutation.mutate({ playerId, newStatus });
  };

  const handleReassignClick = (player: Player) => {
    setPlayerToReassign(player);
    setReassignModalVisible(true);
    setExpandedPlayer(null);
  };

  const handleReassign = (oldPlayerId: string, newPlayerId: string) => {
    reassignPlayerMutation.mutate({ oldPlayerId, newPlayerId });
  };
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy color="#EAB308" size={20} />;
      case 1:
        return <Medal color="#94A3B8" size={20} />;
      case 2:
        return <Award color="#CD7F32" size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'late':
        return 'bg-yellow-500';
      case 'no_show':
        return 'bg-red-500';
      case 'departed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <View className="flex-1">
      {/* Sort Options */}
      <View className="bg-white border-b border-gray-200 px-6 py-3">
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`flex-1 py-2 px-4 rounded-lg ${
              sortBy === 'points' ? 'bg-primary-500' : 'bg-gray-100'
            }`}
            onPress={() => onSortChange('points')}
          >
            <Text
              className={`text-center font-medium ${
                sortBy === 'points' ? 'text-white' : 'text-gray-700'
              }`}
            >
              By Points
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 px-4 rounded-lg ${
              sortBy === 'wins' ? 'bg-primary-500' : 'bg-gray-100'
            }`}
            onPress={() => onSortChange('wins')}
          >
            <Text
              className={`text-center font-medium ${
                sortBy === 'wins' ? 'text-white' : 'text-gray-700'
              }`}
            >
              By Wins
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {players.map((player, index) => {
          const isExpanded = expandedPlayer === player.id;

          return (
            <View
              key={player.id}
              className={`bg-white rounded-lg p-4 mb-3 border ${
                index < 3 ? 'border-primary-200' : 'border-gray-200'
              }`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1 gap-3">
                  {/* Position */}
                  <View className="w-8 items-center">
                    {getMedalIcon(index) || (
                      <Text className="text-lg font-bold text-gray-500">{index + 1}</Text>
                    )}
                  </View>

                  {/* Player Info */}
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-gray-900">
                        {player.name}
                      </Text>
                      <View className={`w-2 h-2 rounded-full ${getStatusColor(player.status)}`} />
                    </View>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      Rating: {player.rating.toFixed(1)}
                    </Text>
                  </View>

                  {/* Points */}
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-primary-500">
                      {player.totalPoints}
                    </Text>
                    <Text className="text-xs text-gray-500">points</Text>
                  </View>

                  {/* More Options */}
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => setExpandedPlayer(isExpanded ? null : player.id)}
                  >
                    <MoreVertical color="#6B7280" size={20} />
                  </TouchableOpacity>
                </View>
              </View>

            {/* Stats Row */}
            <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
              <View className="flex-1">
                <Text className="text-xs text-gray-500">Record</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {player.wins}W-{player.losses}L-{player.ties}T
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-xs text-gray-500">Played</Text>
                <Text className="text-sm font-medium text-gray-900">{player.playCount}</Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-xs text-gray-500">Sat Out</Text>
                <Text className="text-sm font-medium text-gray-900">{player.sitCount}</Text>
              </View>
            </View>

            {/* Compensation Points */}
            {player.compensationPoints > 0 && (
              <View className="mt-2 pt-2 border-t border-gray-100">
                <Text className="text-xs text-blue-600">
                  +{player.compensationPoints} compensation points
                </Text>
              </View>
            )}

            {/* Expanded Options */}
            {isExpanded && (
              <View className="mt-3 pt-3 border-t border-gray-200 gap-3">
                <View>
                  <Text className="text-xs font-medium text-gray-700 mb-2">Status</Text>
                  <StatusDropdown
                    currentStatus={player.status as any}
                    onStatusChange={(newStatus) => handleStatusChange(player.id, newStatus)}
                    disabled={updateStatusMutation.isPending}
                  />
                </View>

                <TouchableOpacity
                  className="flex-row items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
                  onPress={() => handleReassignClick(player)}
                  disabled={reassignPlayerMutation.isPending}
                >
                  <UserCog color="#6B7280" size={16} />
                  <Text className="text-sm font-medium text-gray-900 flex-1">
                    Replace Player
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
        })}

        {players.length === 0 && (
          <View className="flex-1 items-center justify-center py-12">
            <Trophy color="#9CA3AF" size={48} />
            <Text className="text-gray-500 mt-4">No players yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Reassign Modal */}
      <PlayerReassignModal
        visible={reassignModalVisible}
        onClose={() => {
          setReassignModalVisible(false);
          setPlayerToReassign(null);
        }}
        players={players}
        currentPlayer={playerToReassign}
        onReassign={handleReassign}
      />
    </View>
  );
}
