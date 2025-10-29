import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Play, RefreshCw } from 'lucide-react-native';
import { Round, Player, Match, MexicanoAlgorithm } from '@courtster/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { offlineQueue } from '../../utils/offlineQueue';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import Toast from 'react-native-toast-message';

interface RoundsTabProps {
  currentRound: Round | undefined;
  currentRoundIndex: number;
  allRounds: Round[];
  hasMatchesStarted: boolean;
  session: any;
  players: Player[];
  algorithm: MexicanoAlgorithm | null;
  sessionId: string;
  onRoundChange: (index: number) => void;
}

export function RoundsTab({
  currentRound,
  currentRoundIndex,
  allRounds,
  hasMatchesStarted,
  session,
  players,
  algorithm,
  sessionId,
  onRoundChange,
}: RoundsTabProps) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  // Generate next round mutation
  const generateRoundMutation = useMutation({
    mutationFn: async () => {
      if (!algorithm) throw new Error('Algorithm not initialized');

      const nextRoundNumber = allRounds.length + 1;
      const newRound = algorithm.generateRound(nextRoundNumber);
      const updatedRounds = [...allRounds, newRound];
      const description = `Round ${nextRoundNumber} generated`;

      if (isOnline) {
        // Online: update immediately
        const { error } = await supabase
          .from('game_sessions')
          .update({
            round_data: JSON.stringify(updatedRounds),
            current_round: updatedRounds.length - 1,
          })
          .eq('id', sessionId);

        if (error) throw error;

        await supabase.from('event_history').insert({
          session_id: sessionId,
          event_type: 'round_generated',
          description,
        });
      } else {
        // Offline: queue for later
        await offlineQueue.addOperation('GENERATE_ROUND', sessionId, {
          sessionId,
          newRound,
          updatedRounds,
          description,
        });
      }

      return { newRound, roundIndex: updatedRounds.length - 1 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['players', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['eventHistory', sessionId] });
      onRoundChange(data.roundIndex);
      Toast.show({
        type: 'success',
        text1: 'Round Generated',
        text2: isOnline ? 'New round has been created' : 'Will sync when online',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to Generate Round',
        text2: error.message,
      });
    },
  });

  const handleNextRound = () => {
    if (currentRoundIndex === allRounds.length - 1) {
      // At last round, validate current round before generating new one
      if (!currentRound) return;

      // Check if all matches are scored
      const allScored = currentRound.matches.every((match) => {
        const team1HasScore = match.team1Score !== undefined &&
                             match.team1Score !== null &&
                             !isNaN(match.team1Score);
        const team2HasScore = match.team2Score !== undefined &&
                             match.team2Score !== null &&
                             !isNaN(match.team2Score);

        if (!team1HasScore || !team2HasScore) return false;

        // Validate based on scoring mode
        if (session.scoring_mode === "first_to") {
          const maxScore = Math.max(match.team1Score, match.team2Score);
          const minScore = Math.min(match.team1Score, match.team2Score);
          return maxScore === session.points_per_match && minScore < session.points_per_match;
        } else {
          return match.team1Score + match.team2Score === session.points_per_match;
        }
      });

      if (!allScored) {
        const errorMessage = session.scoring_mode === "first_to"
          ? `Please enter valid scores for all matches. One team must reach exactly ${session.points_per_match} games.`
          : `Please enter valid scores for all matches. Each match must total ${session.points_per_match} ${session.scoring_mode === "total_games" ? "games" : "points"}.`;
        Toast.show({
          type: 'error',
          text1: 'Incomplete Round',
          text2: errorMessage,
        });
        return;
      }

      // All validation passed, generate new round
      generateRoundMutation.mutate();
    } else {
      // Navigate to next round
      onRoundChange(currentRoundIndex + 1);
    }
  };

  const handlePreviousRound = () => {
    if (currentRoundIndex > 0) {
      onRoundChange(currentRoundIndex - 1);
    }
  };

  // Update score mutation
  const updateScoreMutation = useMutation({
    mutationFn: async ({
      matchIndex,
      team1Score,
      team2Score,
    }: {
      matchIndex: number;
      team1Score: number;
      team2Score: number;
    }) => {
      const updatedRounds = [...allRounds];
      const round = updatedRounds[currentRoundIndex];

      if (!round) throw new Error('Round not found');

      // Update match scores
      round.matches[matchIndex].team1Score = team1Score;
      round.matches[matchIndex].team2Score = team2Score;

      // Update ratings
      if (algorithm) {
        algorithm.updateRatings(round.matches[matchIndex]);
      }

      const match = round.matches[matchIndex];
      const description = `${match.team1[0].name} & ${match.team1[1].name} vs ${match.team2[0].name} & ${match.team2[1].name}: ${team1Score}-${team2Score}`;

      if (isOnline) {
        // Online: update immediately
        const { error } = await supabase
          .from('game_sessions')
          .update({ round_data: JSON.stringify(updatedRounds) })
          .eq('id', sessionId);

        if (error) throw error;

        // Update player stats
        await updatePlayerStats(players, updatedRounds);

        await supabase.from('event_history').insert({
          session_id: sessionId,
          event_type: 'score_updated',
          description,
        });
      } else {
        // Offline: queue for later
        await offlineQueue.addOperation('UPDATE_SCORE', sessionId, {
          sessionId,
          matchIndex,
          currentRoundIndex,
          team1Score,
          team2Score,
          updatedRounds,
          description,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['players', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['eventHistory', sessionId] });
      Toast.show({
        type: 'success',
        text1: 'Score Updated',
        text2: isOnline ? 'Score saved successfully' : 'Will sync when online',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to Update Score',
        text2: error.message,
      });
    },
  });

  const updatePlayerStats = async (players: Player[], rounds: Round[]) => {
    // Simplified version - full calculation should be done server-side
    const updatePromises = players.map((player) =>
      supabase
        .from('players')
        .update({
          rating: Math.round(player.rating * 10) / 10,
        })
        .eq('id', player.id)
    );

    await Promise.all(updatePromises);
  };


  if (!currentRound && allRounds.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Play color="#9CA3AF" size={64} />
        <Text className="text-xl font-semibold text-gray-900 mt-4">Ready to Start</Text>
        <Text className="text-gray-600 text-center mt-2 mb-6">
          Generate the first round to begin the tournament
        </Text>
        <TouchableOpacity
          className="bg-primary-500 rounded-lg px-6 py-3"
          onPress={() => generateRoundMutation.mutate()}
          disabled={generateRoundMutation.isPending}
        >
          {generateRoundMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Generate Round 1</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentRound) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">No round selected</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Round Navigation */}
      <View className="flex-row items-center justify-center gap-3 mb-4">
        <TouchableOpacity
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.4)',
            borderRadius: 16,
            padding: 10,
            opacity: currentRoundIndex === 0 ? 0.5 : 1,
          }}
          disabled={currentRoundIndex === 0}
          onPress={handlePreviousRound}
        >
          <ChevronLeft
            color="#374151"
            size={20}
          />
        </TouchableOpacity>

        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.4)',
          borderRadius: 16,
          paddingVertical: 10,
          paddingHorizontal: 20,
          width: 160,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
            Round {currentRound.number} of {allRounds.length}
          </Text>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: generateRoundMutation.isPending ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.4)',
            borderWidth: 1,
            borderColor: generateRoundMutation.isPending ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.4)',
            borderRadius: 16,
            padding: 10,
          }}
          disabled={generateRoundMutation.isPending}
          onPress={handleNextRound}
        >
          {generateRoundMutation.isPending ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <ChevronRight
              color="#374151"
              size={20}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Matches */}
        {currentRound.matches.map((match, index) => (
          <View
            key={index}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 24,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.15,
              shadowRadius: 40,
              elevation: 8,
            }}
          >
            {/* Court Header */}
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16, textAlign: 'center' }}>
              COURT {match.court}
            </Text>

            {/* Teams Container - Horizontal Layout */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              {/* Team 1 */}
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 16,
                padding: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4, textAlign: 'left' }}>
                  {match.team1[0].name}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'left' }}>
                  {match.team1[1].name}
                </Text>
              </View>

              {/* VS Circle */}
              <View style={{
                width: 36,
                height: 36,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#F43F5E' }}>VS</Text>
              </View>

              {/* Team 2 */}
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 16,
                padding: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4, textAlign: 'right' }}>
                  {match.team2[0].name}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'right' }}>
                  {match.team2[1].name}
                </Text>
              </View>
            </View>

            {/* Scores Section */}
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 16,
              padding: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            }}>
              {/* Match Status Badge */}
              {match.team1Score !== undefined && match.team2Score !== undefined && (
                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                  <View style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.25)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#15803D' }}>
                      Complete
                    </Text>
                  </View>
                </View>
              )}
              {(match.team1Score === undefined || match.team2Score === undefined) && (
                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                  <View style={{
                    backgroundColor: 'rgba(234, 179, 8, 0.25)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#A16207' }}>
                      In Progress
                    </Text>
                  </View>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <TextInput
                  style={{
                    width: 64,
                    height: 40,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 16,
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#111827',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  keyboardType="numeric"
                  value={match.team1Score?.toString() || ''}
                  onChangeText={(text) => {
                    const team1Score = parseInt(text) || 0;

                    // Only auto-fill for "points" and "total_games" modes, NOT "first_to"
                    let team2Score = match.team2Score;
                    if (session.scoring_mode !== 'first_to' && session.scoring_mode !== 'first_to_games') {
                      team2Score = Math.max(0, session.points_per_match - team1Score);
                    }

                    updateScoreMutation.mutate({ matchIndex: index, team1Score, team2Score: team2Score || 0 });
                  }}
                  maxLength={2}
                  placeholder="-"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#9CA3AF' }}>-</Text>
                <TextInput
                  style={{
                    width: 64,
                    height: 40,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 16,
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#111827',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  keyboardType="numeric"
                  value={match.team2Score?.toString() || ''}
                  onChangeText={(text) => {
                    const team2Score = parseInt(text) || 0;

                    // Only auto-fill for "points" and "total_games" modes, NOT "first_to"
                    let team1Score = match.team1Score;
                    if (session.scoring_mode !== 'first_to' && session.scoring_mode !== 'first_to_games') {
                      team1Score = Math.max(0, session.points_per_match - team2Score);
                    }

                    updateScoreMutation.mutate({ matchIndex: index, team1Score: team1Score || 0, team2Score });
                  }}
                  maxLength={2}
                  placeholder="-"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>
        ))}

        {/* Sitting Players */}
        {currentRound.sittingPlayers.length > 0 && (
          <View style={{
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(229, 231, 235, 0.3)',
            borderRadius: 24,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                Sitting Out
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(55, 65, 81, 0.85)',
                  borderWidth: 1,
                  borderColor: 'rgba(75, 85, 99, 0.5)',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                onPress={() => {
                  Toast.show({
                    type: 'info',
                    text1: 'Coming Soon',
                    text2: 'Switch player functionality will be available soon',
                  });
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                  Switch Player
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', lineHeight: 22 }}>
              {currentRound.sittingPlayers.map((player) => player.name).join(', ')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
