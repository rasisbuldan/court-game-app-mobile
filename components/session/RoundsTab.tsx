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
}: RoundsTabProps) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [scores, setScores] = useState<{ team1: string; team2: string }>({ team1: '', team2: '' });

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

      return newRound;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['players', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['eventHistory', sessionId] });
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
      setEditingMatch(null);
      setScores({ team1: '', team2: '' });
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

  const handleSaveScore = (matchIndex: number) => {
    const team1Score = parseInt(scores.team1);
    const team2Score = parseInt(scores.team2);

    if (isNaN(team1Score) || isNaN(team2Score)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Score',
        text2: 'Please enter valid numbers',
      });
      return;
    }

    if (team1Score + team2Score !== session.points_per_match) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Score',
        text2: `Scores must add up to ${session.points_per_match}`,
      });
      return;
    }

    updateScoreMutation.mutate({ matchIndex, team1Score, team2Score });
  };

  const startEditingScore = (matchIndex: number, match: Match) => {
    setEditingMatch(matchIndex);
    setScores({
      team1: match.team1Score?.toString() || '',
      team2: match.team2Score?.toString() || '',
    });
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
      <View className="bg-white border-b border-gray-200 px-6 py-3 flex-row items-center justify-between">
        <TouchableOpacity
          className="p-2"
          disabled={currentRoundIndex === 0}
          onPress={() => {}}
        >
          <ChevronLeft
            color={currentRoundIndex === 0 ? '#D1D5DB' : '#374151'}
            size={24}
          />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-lg font-bold text-gray-900">
            Round {currentRound.number}
          </Text>
          <Text className="text-xs text-gray-600">
            {currentRound.matches.length} {currentRound.matches.length === 1 ? 'match' : 'matches'}
          </Text>
        </View>
        <TouchableOpacity className="p-2" disabled={currentRoundIndex === allRounds.length - 1}>
          <ChevronRight
            color={currentRoundIndex === allRounds.length - 1 ? '#D1D5DB' : '#374151'}
            size={24}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Matches */}
        {currentRound.matches.map((match, index) => (
          <View key={index} className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
            <Text className="text-xs font-medium text-gray-500 mb-3">
              COURT {match.court}
            </Text>

            {/* Team 1 */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900">
                  {match.team1[0].name}
                </Text>
                <Text className="text-sm text-gray-600">{match.team1[1].name}</Text>
              </View>
              {editingMatch === index ? (
                <TextInput
                  className="w-16 h-10 border border-gray-300 rounded-lg px-3 text-center text-lg font-bold"
                  keyboardType="numeric"
                  value={scores.team1}
                  onChangeText={(text) => setScores({ ...scores, team1: text })}
                  maxLength={2}
                />
              ) : (
                <Text className="text-2xl font-bold text-gray-900 w-12 text-center">
                  {match.team1Score ?? '-'}
                </Text>
              )}
            </View>

            {/* VS */}
            <View className="border-t border-gray-200 my-2" />

            {/* Team 2 */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900">
                  {match.team2[0].name}
                </Text>
                <Text className="text-sm text-gray-600">{match.team2[1].name}</Text>
              </View>
              {editingMatch === index ? (
                <TextInput
                  className="w-16 h-10 border border-gray-300 rounded-lg px-3 text-center text-lg font-bold"
                  keyboardType="numeric"
                  value={scores.team2}
                  onChangeText={(text) => setScores({ ...scores, team2: text })}
                  maxLength={2}
                />
              ) : (
                <Text className="text-2xl font-bold text-gray-900 w-12 text-center">
                  {match.team2Score ?? '-'}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View className="mt-3 pt-3 border-t border-gray-200">
              {editingMatch === index ? (
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 bg-primary-500 rounded-lg py-2"
                    onPress={() => handleSaveScore(index)}
                    disabled={updateScoreMutation.isPending}
                  >
                    {updateScoreMutation.isPending ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-white font-semibold text-center">Save</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-gray-200 rounded-lg py-2"
                    onPress={() => {
                      setEditingMatch(null);
                      setScores({ team1: '', team2: '' });
                    }}
                  >
                    <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  className="bg-gray-100 rounded-lg py-2"
                  onPress={() => startEditingScore(index, match)}
                >
                  <Text className="text-gray-700 font-semibold text-center">
                    {match.team1Score !== undefined ? 'Edit Score' : 'Enter Score'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Sitting Players */}
        {currentRound.sittingPlayers.length > 0 && (
          <View className="bg-yellow-50 rounded-lg p-4 mb-3 border border-yellow-200">
            <Text className="text-sm font-medium text-yellow-900 mb-2">Sitting Out</Text>
            {currentRound.sittingPlayers.map((player, index) => (
              <Text key={index} className="text-sm text-yellow-800">
                • {player.name}
              </Text>
            ))}
          </View>
        )}

        {/* Generate Next Round */}
        {currentRoundIndex === allRounds.length - 1 && (
          <TouchableOpacity
            className="bg-primary-500 rounded-lg py-3 mb-6"
            onPress={() => generateRoundMutation.mutate()}
            disabled={generateRoundMutation.isPending || !hasMatchesStarted}
          >
            {generateRoundMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-center">
                Generate Next Round
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
