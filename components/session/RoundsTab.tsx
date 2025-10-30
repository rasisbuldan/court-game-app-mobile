import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, RefreshCw, CheckCircle2 } from 'lucide-react-native';
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
  compactMode?: boolean;
  onSwitchPlayerPress?: () => void;
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
  compactMode = false,
  onSwitchPlayerPress,
}: RoundsTabProps) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  // Local state to track input values (while typing)
  const [localScores, setLocalScores] = useState<{ [key: string]: { team1?: string; team2?: string } }>({});

  // Local state to track saved scores (immediately after blur, before DB sync)
  const [savedScores, setSavedScores] = useState<{ [key: string]: { team1Score?: number; team2Score?: number } }>({});

  // Clear local state when round changes
  useEffect(() => {
    setLocalScores({});
    setSavedScores({});
  }, [currentRoundIndex]);

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

  // Update score mutation - saves to database in background
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
        // Online: update in background (fire and forget for better UX)
        supabase
          .from('game_sessions')
          .update({ round_data: JSON.stringify(updatedRounds) })
          .eq('id', sessionId)
          .then(({ error }) => {
            if (error) {
              console.error('Error saving score:', error);
              Toast.show({
                type: 'error',
                text1: 'Sync Failed',
                text2: 'Score will retry when online',
              });
            }
          });

        // Update player stats in background
        updatePlayerStats(players, updatedRounds).catch(err =>
          console.error('Error updating player stats:', err)
        );

        // Log event in background
        supabase.from('event_history').insert({
          session_id: sessionId,
          event_type: 'score_updated',
          description,
        }).then(({ error }) => {
          if (error) console.error('Error logging event:', error);
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

      return { matchIndex, team1Score, team2Score };
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
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 10,
            opacity: currentRoundIndex === 0 ? 0.4 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
          disabled={currentRoundIndex === 0}
          onPress={handlePreviousRound}
        >
          <ChevronLeft
            color="#111827"
            size={20}
          />
        </TouchableOpacity>

        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 24,
          minWidth: 180,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 3,
        }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', letterSpacing: 0.5 }}>
            ROUND {currentRound.number} OF {allRounds.length}
          </Text>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: generateRoundMutation.isPending ? '#FEE2E2' : '#FFFFFF',
            borderRadius: 12,
            padding: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
          disabled={generateRoundMutation.isPending}
          onPress={handleNextRound}
        >
          {generateRoundMutation.isPending ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <ChevronRight
              color="#111827"
              size={20}
            />
          )}
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Matches */}
            {currentRound?.matches?.length > 0 ? currentRound.matches.map((match, index) => {
              // Safety checks
              if (!match || !match.team1 || !match.team2) return null;

              return (
              <TouchableWithoutFeedback key={index} onPress={Keyboard.dismiss}>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: compactMode ? 16 : 20,
                    padding: compactMode ? 12 : 16,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 3,
                  }}
                >
                {compactMode ? (
                  /* COMPACT MODE - Layout 2: Two Lines Per Team */
                  <>
                    {/* Court Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 }}>
                          COURT {match.court || index + 1}
                        </Text>
                        <View style={{
                          opacity: (
                            (savedScores[`match-${index}`]?.team1Score !== undefined && savedScores[`match-${index}`]?.team2Score !== undefined) ||
                            (match.team1Score !== undefined && match.team2Score !== undefined)
                          ) ? 1 : 0
                        }}>
                          <CheckCircle2 color="#10B981" size={14} fill="#10B981" />
                        </View>
                      </View>
                    </View>

                    {/* Single row: Team1 - Scores - Team2 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      {/* Team 1 - Two lines */}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                          {match.team1?.[0]?.name || 'Player 1'}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                          {match.team1?.[1]?.name || 'Player 2'}
                        </Text>
                      </View>

                      {/* Scores */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <TextInput
                        style={{
                          width: 52,
                          height: 40,
                          backgroundColor: '#F9FAFB',
                          borderWidth: 1,
                          borderColor: (
                            (savedScores[`match-${index}`]?.team1Score !== undefined || match.team1Score !== undefined) &&
                            localScores[`match-${index}`]?.team1 === undefined
                          ) ? '#10B981' : '#E5E7EB',
                          borderRadius: 12,
                          textAlign: 'center',
                          fontSize: 18,
                          fontWeight: '700',
                          color: '#111827',
                        }}
                        keyboardType="numeric"
                        value={
                          localScores[`match-${index}`]?.team1 ??
                          savedScores[`match-${index}`]?.team1Score?.toString() ??
                          match.team1Score?.toString() ??
                          ''
                        }
                        onChangeText={(text) => {
                          setLocalScores(prev => ({
                            ...prev,
                            [`match-${index}`]: { ...prev[`match-${index}`], team1: text }
                          }));
                        }}
                        onBlur={() => {
                          const localValue = localScores[`match-${index}`]?.team1;
                          if (localValue === undefined) return;
                          if (localValue === '') {
                            setLocalScores(prev => {
                              const updated = { ...prev };
                              if (updated[`match-${index}`]) delete updated[`match-${index}`].team1;
                              return updated;
                            });
                            return;
                          }
                          const team1Score = parseInt(localValue);
                          if (isNaN(team1Score) || team1Score < 0) {
                            setLocalScores(prev => {
                              const updated = { ...prev };
                              if (updated[`match-${index}`]) delete updated[`match-${index}`].team1;
                              return updated;
                            });
                            return;
                          }
                          let team2Score = savedScores[`match-${index}`]?.team2Score ?? match.team2Score;
                          const shouldAutoFill = (
                            team2Score === undefined &&
                            session.scoring_mode !== 'first_to' &&
                            session.scoring_mode !== 'first_to_games'
                          );
                          if (shouldAutoFill) {
                            const maxPoints = session.points_per_match || 0;
                            if (team1Score <= maxPoints) {
                              team2Score = Math.max(0, maxPoints - team1Score);
                            }
                          }
                          setSavedScores(prev => ({
                            ...prev,
                            [`match-${index}`]: {
                              team1Score,
                              team2Score: team2Score !== undefined ? team2Score : (match.team2Score ?? 0)
                            }
                          }));
                          setLocalScores(prev => {
                            const updated = { ...prev };
                            if (updated[`match-${index}`]) delete updated[`match-${index}`].team1;
                            return updated;
                          });
                          updateScoreMutation.mutate({
                            matchIndex: index,
                            team1Score,
                            team2Score: team2Score !== undefined ? team2Score : (match.team2Score ?? 0)
                          });
                        }}
                        maxLength={2}
                        placeholder="0"
                        placeholderTextColor="#D1D5DB"
                      />
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#9CA3AF' }}>-</Text>
                        <TextInput
                        style={{
                          width: 52,
                          height: 40,
                          backgroundColor: '#F9FAFB',
                          borderWidth: 1,
                          borderColor: (
                            (savedScores[`match-${index}`]?.team2Score !== undefined || match.team2Score !== undefined) &&
                            localScores[`match-${index}`]?.team2 === undefined
                          ) ? '#10B981' : '#E5E7EB',
                          borderRadius: 12,
                          textAlign: 'center',
                          fontSize: 18,
                          fontWeight: '700',
                          color: '#111827',
                        }}
                        keyboardType="numeric"
                        value={
                          localScores[`match-${index}`]?.team2 ??
                          savedScores[`match-${index}`]?.team2Score?.toString() ??
                          match.team2Score?.toString() ??
                          ''
                        }
                        onChangeText={(text) => {
                          setLocalScores(prev => ({
                            ...prev,
                            [`match-${index}`]: { ...prev[`match-${index}`], team2: text }
                          }));
                        }}
                        onBlur={() => {
                          const localValue = localScores[`match-${index}`]?.team2;
                          if (localValue === undefined) return;
                          if (localValue === '') {
                            setLocalScores(prev => {
                              const updated = { ...prev };
                              if (updated[`match-${index}`]) delete updated[`match-${index}`].team2;
                              return updated;
                            });
                            return;
                          }
                          const team2Score = parseInt(localValue);
                          if (isNaN(team2Score) || team2Score < 0) {
                            setLocalScores(prev => {
                              const updated = { ...prev };
                              if (updated[`match-${index}`]) delete updated[`match-${index}`].team2;
                              return updated;
                            });
                            return;
                          }
                          let team1Score = savedScores[`match-${index}`]?.team1Score ?? match.team1Score;
                          const shouldAutoFill = (
                            team1Score === undefined &&
                            session.scoring_mode !== 'first_to' &&
                            session.scoring_mode !== 'first_to_games'
                          );
                          if (shouldAutoFill) {
                            const maxPoints = session.points_per_match || 0;
                            if (team2Score <= maxPoints) {
                              team1Score = Math.max(0, maxPoints - team2Score);
                            }
                          }
                          setSavedScores(prev => ({
                            ...prev,
                            [`match-${index}`]: {
                              team1Score: team1Score !== undefined ? team1Score : (match.team1Score ?? 0),
                              team2Score
                            }
                          }));
                          setLocalScores(prev => {
                            const updated = { ...prev };
                            if (updated[`match-${index}`]) delete updated[`match-${index}`].team2;
                            return updated;
                          });
                          updateScoreMutation.mutate({
                            matchIndex: index,
                            team1Score: team1Score !== undefined ? team1Score : (match.team1Score ?? 0),
                            team2Score
                          });
                        }}
                        maxLength={2}
                        placeholder="0"
                        placeholderTextColor="#D1D5DB"
                      />
                      </View>

                      {/* Team 2 - Two lines */}
                      <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                          {match.team2?.[0]?.name || 'Player 3'}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                          {match.team2?.[1]?.name || 'Player 4'}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  /* STANDARD MODE - Card 1 */
                  <>
            {/* Court Header */}
            <View style={{ marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 }}>
                COURT {match.court || index + 1}
              </Text>
              <View style={{
                opacity: (
                  (savedScores[`match-${index}`]?.team1Score !== undefined && savedScores[`match-${index}`]?.team2Score !== undefined) ||
                  (match.team1Score !== undefined && match.team2Score !== undefined)
                ) ? 1 : 0
              }}>
                <CheckCircle2 color="#10B981" size={16} fill="#10B981" />
              </View>
            </View>

            {/* Teams Container - Horizontal Layout */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              {/* Team 1 */}
              <View style={{
                flex: 1,
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                padding: 12,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 }} numberOfLines={1}>
                  {match.team1?.[0]?.name || 'Player 1'}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                  {match.team1?.[1]?.name || 'Player 2'}
                </Text>
              </View>

              {/* VS Badge */}
              <View style={{
                width: 40,
                height: 40,
                backgroundColor: '#FEE2E2',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', letterSpacing: 0.5 }}>VS</Text>
              </View>

              {/* Team 2 */}
              <View style={{
                flex: 1,
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                padding: 12,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4, textAlign: 'right' }} numberOfLines={1}>
                  {match.team2?.[0]?.name || 'Player 3'}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'right' }} numberOfLines={1}>
                  {match.team2?.[1]?.name || 'Player 4'}
                </Text>
              </View>
            </View>

            {/* Scores Section */}
            <View style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 12,
            }}>
              {/* Score Label */}
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 }}>
                SCORE
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <TextInput
                  style={{
                    width: 80,
                    height: 56,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: (
                      (savedScores[`match-${index}`]?.team1Score !== undefined || match.team1Score !== undefined) &&
                      localScores[`match-${index}`]?.team1 === undefined
                    ) ? '#10B981' : '#E5E7EB',
                    borderRadius: 16,
                    textAlign: 'center',
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#111827',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                  keyboardType="numeric"
                  value={
                    localScores[`match-${index}`]?.team1 ??
                    savedScores[`match-${index}`]?.team1Score?.toString() ??
                    match.team1Score?.toString() ??
                    ''
                  }
                  onChangeText={(text) => {
                    // Update local state immediately for smooth typing
                    setLocalScores(prev => ({
                      ...prev,
                      [`match-${index}`]: { ...prev[`match-${index}`], team1: text }
                    }));
                  }}
                  onBlur={() => {
                    const localValue = localScores[`match-${index}`]?.team1;

                    // If no local changes, do nothing
                    if (localValue === undefined) {
                      return;
                    }

                    // Handle empty input - keep existing value
                    if (localValue === '') {
                      setLocalScores(prev => {
                        const updated = { ...prev };
                        if (updated[`match-${index}`]) {
                          delete updated[`match-${index}`].team1;
                        }
                        return updated;
                      });
                      return;
                    }

                    // Parse and validate
                    const team1Score = parseInt(localValue);
                    if (isNaN(team1Score) || team1Score < 0) {
                      // Reset to previous value if invalid
                      setLocalScores(prev => {
                        const updated = { ...prev };
                        if (updated[`match-${index}`]) {
                          delete updated[`match-${index}`].team1;
                        }
                        return updated;
                      });
                      return;
                    }

                    // Auto-fill team2 if needed
                    let team2Score = savedScores[`match-${index}`]?.team2Score ?? match.team2Score;
                    const shouldAutoFill = (
                      team2Score === undefined &&
                      session.scoring_mode !== 'first_to' &&
                      session.scoring_mode !== 'first_to_games'
                    );

                    if (shouldAutoFill) {
                      const maxPoints = session.points_per_match || 0;
                      if (team1Score <= maxPoints) {
                        team2Score = Math.max(0, maxPoints - team1Score);
                      }
                    }

                    // Update local saved scores immediately for instant UI feedback
                    setSavedScores(prev => ({
                      ...prev,
                      [`match-${index}`]: {
                        team1Score,
                        team2Score: team2Score !== undefined ? team2Score : (match.team2Score ?? 0)
                      }
                    }));

                    // Clear local input state
                    setLocalScores(prev => {
                      const updated = { ...prev };
                      if (updated[`match-${index}`]) {
                        delete updated[`match-${index}`].team1;
                      }
                      return updated;
                    });

                    // Save to database in background (async, non-blocking)
                    updateScoreMutation.mutate({
                      matchIndex: index,
                      team1Score,
                      team2Score: team2Score !== undefined ? team2Score : (match.team2Score ?? 0)
                    });
                  }}
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor="#D1D5DB"
                />
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#9CA3AF' }}>-</Text>
                <TextInput
                  style={{
                    width: 80,
                    height: 56,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: (
                      (savedScores[`match-${index}`]?.team2Score !== undefined || match.team2Score !== undefined) &&
                      localScores[`match-${index}`]?.team2 === undefined
                    ) ? '#10B981' : '#E5E7EB',
                    borderRadius: 16,
                    textAlign: 'center',
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#111827',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  keyboardType="numeric"
                  value={
                    localScores[`match-${index}`]?.team2 ??
                    savedScores[`match-${index}`]?.team2Score?.toString() ??
                    match.team2Score?.toString() ??
                    ''
                  }
                  onChangeText={(text) => {
                    // Update local state immediately for smooth typing
                    setLocalScores(prev => ({
                      ...prev,
                      [`match-${index}`]: { ...prev[`match-${index}`], team2: text }
                    }));
                  }}
                  onBlur={() => {
                    const localValue = localScores[`match-${index}`]?.team2;

                    // If no local changes, do nothing
                    if (localValue === undefined) {
                      return;
                    }

                    // Handle empty input - keep existing value
                    if (localValue === '') {
                      setLocalScores(prev => {
                        const updated = { ...prev };
                        if (updated[`match-${index}`]) {
                          delete updated[`match-${index}`].team2;
                        }
                        return updated;
                      });
                      return;
                    }

                    // Parse and validate
                    const team2Score = parseInt(localValue);
                    if (isNaN(team2Score) || team2Score < 0) {
                      // Reset to previous value if invalid
                      setLocalScores(prev => {
                        const updated = { ...prev };
                        if (updated[`match-${index}`]) {
                          delete updated[`match-${index}`].team2;
                        }
                        return updated;
                      });
                      return;
                    }

                    // Auto-fill team1 if needed
                    let team1Score = savedScores[`match-${index}`]?.team1Score ?? match.team1Score;
                    const shouldAutoFill = (
                      team1Score === undefined &&
                      session.scoring_mode !== 'first_to' &&
                      session.scoring_mode !== 'first_to_games'
                    );

                    if (shouldAutoFill) {
                      const maxPoints = session.points_per_match || 0;
                      if (team2Score <= maxPoints) {
                        team1Score = Math.max(0, maxPoints - team2Score);
                      }
                    }

                    // Update local saved scores immediately for instant UI feedback
                    setSavedScores(prev => ({
                      ...prev,
                      [`match-${index}`]: {
                        team1Score: team1Score !== undefined ? team1Score : (match.team1Score ?? 0),
                        team2Score
                      }
                    }));

                    // Clear local input state
                    setLocalScores(prev => {
                      const updated = { ...prev };
                      if (updated[`match-${index}`]) {
                        delete updated[`match-${index}`].team2;
                      }
                      return updated;
                    });

                    // Save to database in background (async, non-blocking)
                    updateScoreMutation.mutate({
                      matchIndex: index,
                      team1Score: team1Score !== undefined ? team1Score : (match.team1Score ?? 0),
                      team2Score
                    });
                  }}
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor="#D1D5DB"
                />
              </View>
            </View>
                  </>
                )}
                </View>
              </TouchableWithoutFeedback>
              );
            }) : (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#9CA3AF' }}>No matches available</Text>
              </View>
            )}

        {/* Sitting Players */}
        {currentRound.sittingPlayers.length > 0 && (
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 }}>
                  Sitting Out
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF' }}>
                  {currentRound.sittingPlayers.length} {currentRound.sittingPlayers.length === 1 ? 'player' : 'players'}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: '#EF4444',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  shadowColor: '#EF4444',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={() => {
                  if (onSwitchPlayerPress) {
                    onSwitchPlayerPress();
                  }
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                  Switch Player
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 8,
            }}>
              {currentRound.sittingPlayers.map((player, index) => (
                <View key={player.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#111827',
                    lineHeight: 20,
                  }}>
                    {player.name}
                  </Text>
                  {index < currentRound.sittingPlayers.length - 1 && (
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#9CA3AF',
                      marginHorizontal: 8,
                      lineHeight: 20,
                    }}>
                      •
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}
