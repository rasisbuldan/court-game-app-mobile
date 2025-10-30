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
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <View className="flex-row gap-2">
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: sortBy === 'points' ? '#EF4444' : '#F3F4F6',
            }}
            onPress={() => onSortChange('points')}
          >
            <Text
              style={{
                textAlign: 'center',
                fontWeight: '600',
                color: sortBy === 'points' ? '#FFFFFF' : '#374151',
              }}
            >
              By Points
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: sortBy === 'wins' ? '#EF4444' : '#F3F4F6',
            }}
            onPress={() => onSortChange('wins')}
          >
            <Text
              style={{
                textAlign: 'center',
                fontWeight: '600',
                color: sortBy === 'wins' ? '#FFFFFF' : '#374151',
              }}
            >
              By Wins
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1">
        {/* Table Header */}
        {players.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 8,
              marginBottom: 8,
            }}
          >
            <View style={{ width: 44 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF' }}>RANK</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF' }}>NAME</Text>
            </View>
            <View style={{ width: 64, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF' }}>PTS</Text>
            </View>
            <View style={{ width: 24 }} />
            <View style={{ width: 80, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF' }}>W-L-T</Text>
            </View>
            <View style={{ width: 32 }} />
          </View>
        )}

        {/* Player Cards */}
        {players.map((player, index) => {
          const isExpanded = expandedPlayer === player.id;

          return (
            <View
              key={player.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: index < 3 ? 'rgba(239, 68, 68, 0.15)' : '#E5E7EB',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Rank Badge */}
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: index === 0 ? '#FEF3C7' : index === 1 ? '#E0E7FF' : index === 2 ? '#FED7AA' : '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {index < 3 ? (
                    getMedalIcon(index)
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B7280' }}>
                      {index + 1}
                    </Text>
                  )}
                </View>

                {/* Name with Compensation */}
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                      {player.name}
                    </Text>
                    <View className={`w-2 h-2 rounded-full ${getStatusColor(player.status)}`} />
                  </View>
                  {player.compensationPoints > 0 && (
                    <Text style={{ fontSize: 11, fontWeight: '500', color: '#F59E0B', marginTop: 2 }}>
                      +{player.compensationPoints} bonus
                    </Text>
                  )}
                </View>

                {/* Points Column */}
                <View style={{ width: 64, alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444' }}>
                    {player.totalPoints}
                  </Text>
                </View>

                {/* Divider */}
                <View style={{ width: 1, height: 28, backgroundColor: '#E5E7EB', marginRight: 12 }} />

                {/* W-L-T Column */}
                <View style={{ width: 80, alignItems: 'center', gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#10B981' }}>
                      {player.wins}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF' }}>-</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>
                      {player.losses}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF' }}>-</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280' }}>
                      {player.ties}
                    </Text>
                  </View>
                </View>

                {/* More Options Button */}
                <TouchableOpacity
                  style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}
                  onPress={() => setExpandedPlayer(isExpanded ? null : player.id)}
                >
                  <MoreVertical color="#9CA3AF" size={18} />
                </TouchableOpacity>
              </View>

              {/* Expanded Options */}
              {isExpanded && (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 }}>
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
                      Status
                    </Text>
                    <StatusDropdown
                      currentStatus={player.status as any}
                      onStatusChange={(newStatus) => handleStatusChange(player.id, newStatus)}
                      disabled={updateStatusMutation.isPending}
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
                      Additional Stats
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      <View>
                        <Text style={{ fontSize: 10, fontWeight: '500', color: '#9CA3AF' }}>
                          Played
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 }}>
                          {player.playCount}
                        </Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 10, fontWeight: '500', color: '#9CA3AF' }}>
                          Sat Out
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 }}>
                          {player.sitCount}
                        </Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 10, fontWeight: '500', color: '#9CA3AF' }}>
                          Rating
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 }}>
                          {player.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                    onPress={() => handleReassignClick(player)}
                    disabled={reassignPlayerMutation.isPending}
                  >
                    <UserCog color="#6B7280" size={16} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', flex: 1 }}>
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
      </View>

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
