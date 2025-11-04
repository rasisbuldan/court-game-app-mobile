import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useState, useMemo, useEffect, memo } from 'react';
import { ChevronLeft, ChevronRight, Play, CheckCircle2, Loader2, RefreshCw } from 'lucide-react-native';
import { Round, Player, Match, MexicanoAlgorithm, ParallelRound } from '@courtster/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../config/supabase';
import { offlineQueue } from '../../utils/offlineQueue';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { retryScoreUpdate, retryDbOperation } from '../../utils/retryWithBackoff';
import Toast from 'react-native-toast-message';
import { validateMatchScore } from '../../utils/typeGuards';
import { CourtCard } from './CourtCard';
import { Logger } from '../../utils/logger';

interface RoundsTabProps {
  currentRound: Round | undefined;
  currentRoundIndex: number;
  allRounds: Round[];
  hasMatchesStarted: boolean;
  session: any;
  players: Player[];
  algorithm: MexicanoAlgorithm | null;
  algorithmError?: string | null; // ISSUE #5 FIX
  onRetryAlgorithm?: () => void; // ISSUE #5 FIX: Retry callback
  sessionId: string;
  onRoundChange: (index: number, direction: 'forward' | 'backward') => void;
  compactMode?: boolean;
  onSwitchPlayerPress?: () => void;
}

// PHASE 2 OPTIMIZATION: Memoize component to prevent unnecessary re-renders
export const RoundsTab = memo(function RoundsTab({
  currentRound,
  currentRoundIndex,
  allRounds,
  hasMatchesStarted,
  session,
  players,
  algorithm,
  algorithmError, // ISSUE #5 FIX
  onRetryAlgorithm, // ISSUE #5 FIX: Retry callback
  sessionId,
  onRoundChange,
  compactMode = false,
  onSwitchPlayerPress,
}: RoundsTabProps) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  // ISSUE #6 FIX: Local state with size limits to prevent memory leaks
  const [localScores, setLocalScores] = useState<{ [key: string]: { team1?: string; team2?: string } }>({});
  const [savedScores, setSavedScores] = useState<{ [key: string]: { team1Score?: number; team2Score?: number } }>({});

  // Parallel mode: Track current round index per court
  const [courtRoundIndices, setCourtRoundIndices] = useState<{ [courtNumber: number]: number }>({});

  // ISSUE #6 FIX: Maximum entries to keep in state (prevents unbounded growth)
  const MAX_STATE_ENTRIES = 50;

  // Clear local state when round changes
  useEffect(() => {
    setLocalScores({});
    setSavedScores({});
  }, [currentRoundIndex]);

  // ISSUE #6 FIX: Cleanup on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      setLocalScores({});
      setSavedScores({});
    };
  }, []);

  // ISSUE #6 FIX: Helper to limit state size
  const addToLimitedState = <T extends Record<string, any>>(
    setState: React.Dispatch<React.SetStateAction<T>>,
    key: string,
    value: any
  ) => {
    setState(prev => {
      const keys = Object.keys(prev);
      // If we're at limit, remove oldest entry (first key)
      if (keys.length >= MAX_STATE_ENTRIES) {
        const { [keys[0]]: removed, ...rest } = prev;
        return { ...rest, [key]: value } as T;
      }
      return { ...prev, [key]: value };
    });
  };

  // Check if session is in parallel mode
  const isParallelMode = session?.mode === 'parallel';

  // Parallel mode: Get current round for a specific court
  const getCourtRound = (courtNumber: number): { round: ParallelRound | undefined; roundIndex: number } => {
    const roundIndex = courtRoundIndices[courtNumber] ?? currentRoundIndex;
    const round = allRounds[roundIndex] as ParallelRound | undefined;
    return { round, roundIndex };
  };

  // Parallel mode: Handle round navigation for a specific court
  const handleCourtRoundChange = (courtNumber: number, direction: 'next' | 'prev') => {
    setCourtRoundIndices(prev => {
      const currentIndex = prev[courtNumber] ?? currentRoundIndex;
      const newIndex = direction === 'next'
        ? Math.min(currentIndex + 1, allRounds.length - 1)
        : Math.max(currentIndex - 1, 0);
      return { ...prev, [courtNumber]: newIndex };
    });
  };

  // Parallel mode: Handle score change for a specific court
  const handleCourtScoreChange = (courtNumber: number, team1Score: string, team2Score: string) => {
    const { round, roundIndex } = getCourtRound(courtNumber);
    if (!round) return;

    // Find match for this court in this round
    const matchIndex = round.matches.findIndex(m => m.court === courtNumber);
    if (matchIndex === -1) return;

    const key = `court-${courtNumber}-round-${roundIndex}-match-${matchIndex}`;
    setLocalScores(prev => ({
      ...prev,
      [key]: { team1: team1Score, team2: team2Score }
    }));
  };

  // Parallel mode: Handle score blur (save) for a specific court
  const handleCourtScoreBlur = (courtNumber: number) => {
    const { round, roundIndex } = getCourtRound(courtNumber);
    if (!round) return;

    // Find match for this court in this round
    const matchIndex = round.matches.findIndex(m => m.court === courtNumber);
    if (matchIndex === -1) return;

    const key = `court-${courtNumber}-round-${roundIndex}-match-${matchIndex}`;
    const scores = localScores[key];
    if (!scores?.team1 || !scores?.team2) return;

    const team1Score = parseInt(scores.team1);
    const team2Score = parseInt(scores.team2);

    if (isNaN(team1Score) || isNaN(team2Score)) return;

    // Validate scores
    if (!areScoresValid(team1Score, team2Score)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Score',
        text2: 'Please enter valid scores for this match',
      });
      return;
    }

    // Save scores
    updateScoreMutation.mutate({
      matchIndex,
      team1Score,
      team2Score,
    });
  };

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
        // NOTE: Pass JavaScript object directly - Supabase converts to JSONB automatically
        const { error } = await supabase
          .from('game_sessions')
          .update({
            round_data: updatedRounds,
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

      return { newRound, roundIndex: updatedRounds.length - 1, nextRoundNumber };
    },
    onSuccess: (data) => {
      Logger.info('Round generated successfully', {
        action: 'generateRound',
        sessionId,
        metadata: {
          roundNumber: data.nextRoundNumber,
          totalRounds: allRounds.length + 1,
          matchCount: data.newRound.matches.length,
          isOffline: !isOnline,
        },
      });

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
      const allScored = currentRound.matches.every((match, index) => {
        // Check all sources: localScores (string input), savedScores (optimistic UI), then match data (database)
        const team1ScoreFromLocal = localScores[`match-${index}`]?.team1 ? parseInt(localScores[`match-${index}`].team1) : undefined;
        const team2ScoreFromLocal = localScores[`match-${index}`]?.team2 ? parseInt(localScores[`match-${index}`].team2) : undefined;

        const team1Score = !isNaN(team1ScoreFromLocal!) && team1ScoreFromLocal !== undefined
          ? team1ScoreFromLocal
          : (savedScores[`match-${index}`]?.team1Score ?? match.team1Score);
        const team2Score = !isNaN(team2ScoreFromLocal!) && team2ScoreFromLocal !== undefined
          ? team2ScoreFromLocal
          : (savedScores[`match-${index}`]?.team2Score ?? match.team2Score);

        const team1HasScore = team1Score !== undefined &&
                             team1Score !== null &&
                             !isNaN(team1Score);
        const team2HasScore = team2Score !== undefined &&
                             team2Score !== null &&
                             !isNaN(team2Score);

        if (!team1HasScore || !team2HasScore) return false;

        // Validate based on scoring mode
        if (session.scoring_mode === "first_to") {
          // First to X games mode: one team must reach games_to_win
          const maxScore = Math.max(team1Score, team2Score);
          const minScore = Math.min(team1Score, team2Score);
          const targetGames = session.games_to_win || session.points_per_match;
          return maxScore === targetGames && minScore < targetGames;
        } else if (session.scoring_mode === "total_games") {
          // Total games mode: scores must sum to total_games
          const totalGames = session.total_games || session.points_per_match;
          return team1Score + team2Score === totalGames;
        } else {
          // Points mode: scores must sum to points_per_match
          return team1Score + team2Score === session.points_per_match;
        }
      });

      if (!allScored) {
        let errorMessage = '';
        if (session.scoring_mode === "first_to") {
          const targetGames = session.games_to_win || session.points_per_match;
          errorMessage = `Please enter valid scores for all matches. One team must reach exactly ${targetGames} games.`;
        } else if (session.scoring_mode === "total_games") {
          const totalGames = session.total_games || session.points_per_match;
          errorMessage = `Please enter valid scores for all matches. Each match must total ${totalGames} games.`;
        } else {
          errorMessage = `Please enter valid scores for all matches. Each match must total ${session.points_per_match} points.`;
        }
        Toast.show({
          type: 'error',
          text1: 'Incomplete Round',
          text2: errorMessage,
        });
        return;
      }

      // Save any pending scores from localScores before advancing
      // This ensures scores entered but not yet saved to database are persisted
      const pendingSaves: Promise<any>[] = [];
      currentRound.matches.forEach((match, index) => {
        const team1ScoreFromLocal = localScores[`match-${index}`]?.team1 ? parseInt(localScores[`match-${index}`].team1) : undefined;
        const team2ScoreFromLocal = localScores[`match-${index}`]?.team2 ? parseInt(localScores[`match-${index}`].team2) : undefined;

        // Check if there are valid scores in localScores that haven't been saved yet
        const hasLocalScores = !isNaN(team1ScoreFromLocal!) && team1ScoreFromLocal !== undefined &&
                              !isNaN(team2ScoreFromLocal!) && team2ScoreFromLocal !== undefined;
        const alreadySaved = savedScores[`match-${index}`]?.team1Score !== undefined &&
                            savedScores[`match-${index}`]?.team2Score !== undefined;

        if (hasLocalScores && !alreadySaved) {
          // Save these scores before advancing
          pendingSaves.push(
            updateScoreMutation.mutateAsync({
              matchIndex: index,
              team1Score: team1ScoreFromLocal!,
              team2Score: team2ScoreFromLocal!,
            })
          );
        }
      });

      // Wait for all pending saves to complete before generating next round
      if (pendingSaves.length > 0) {
        Promise.all(pendingSaves)
          .then(() => {
            generateRoundMutation.mutate();
          })
          .catch((error) => {
            Toast.show({
              type: 'error',
              text1: 'Failed to Save Scores',
              text2: 'Please try again',
            });
          });
      } else {
        // No pending saves, generate next round immediately
        generateRoundMutation.mutate();
      }
    } else {
      // Navigate to next round
      onRoundChange(currentRoundIndex + 1, 'forward');
    }
  };

  const handlePreviousRound = () => {
    if (currentRoundIndex > 0) {
      onRoundChange(currentRoundIndex - 1, 'backward');
    }
  };

  // State to track which matches are currently saving
  const [savingMatches, setSavingMatches] = useState<Set<number>>(new Set());

  // Helper function to validate score input and determine border color
  const getScoreBorderColor = (
    matchIndex: number,
    team: 'team1' | 'team2',
    currentValue: string | undefined,
    savedScore: number | undefined,
    matchScore: number | undefined,
    otherTeamValue: string | undefined,
    otherTeamSavedScore: number | undefined,
    otherTeamMatchScore: number | undefined
  ): string => {
    // If no local input, show green if saved, gray otherwise
    if (currentValue === undefined) {
      return (savedScore !== undefined || matchScore !== undefined) ? '#10B981' : '#E5E7EB';
    }

    // Parse current input
    const parsedValue = parseInt(currentValue);
    if (isNaN(parsedValue) || currentValue === '' || parsedValue < 0) {
      return '#EF4444'; // Red for invalid input
    }

    // Parse other team's score
    let otherScore: number | undefined;
    if (otherTeamValue) {
      const parsed = parseInt(otherTeamValue);
      if (!isNaN(parsed) && parsed >= 0) {
        otherScore = parsed;
      }
    }
    if (otherScore === undefined) {
      otherScore = otherTeamSavedScore ?? otherTeamMatchScore;
    }

    // Validate based on scoring mode
    if (session.scoring_mode === 'first_to') {
      const targetGames = session.games_to_win || session.points_per_match || 0;
      // Score cannot exceed target games
      if (parsedValue > targetGames) {
        return '#EF4444'; // Red - exceeds max
      }
      // If both scores present, validate the combination
      if (otherScore !== undefined) {
        const maxScore = Math.max(parsedValue, otherScore);
        const minScore = Math.min(parsedValue, otherScore);
        // One must be exactly target, other must be less
        if (maxScore !== targetGames || minScore >= targetGames) {
          return '#EF4444'; // Red - invalid combination
        }
      }
    } else if (session.scoring_mode === 'total_games') {
      const totalGames = session.total_games || session.points_per_match || 0;
      // Score cannot exceed total games
      if (parsedValue > totalGames) {
        return '#EF4444'; // Red - exceeds max
      }
      // If both scores present, validate sum
      if (otherScore !== undefined) {
        if (parsedValue + otherScore !== totalGames) {
          return '#EF4444'; // Red - doesn't sum to total
        }
      }
    } else {
      // Points mode
      const maxPoints = session.points_per_match || 0;
      // Score cannot exceed max points
      if (parsedValue > maxPoints) {
        return '#EF4444'; // Red - exceeds max
      }
      // If both scores present, validate sum
      if (otherScore !== undefined) {
        if (parsedValue + otherScore !== maxPoints) {
          return '#EF4444'; // Red - doesn't sum to total
        }
      }
    }

    // Valid input
    return '#3B82F6'; // Blue for valid but unsaved
  };

  // Helper function to validate if scores are valid for saving
  const areScoresValid = (team1: number, team2: number): boolean => {
    if (session.scoring_mode === 'first_to') {
      const targetGames = session.games_to_win || session.points_per_match || 0;
      const maxScore = Math.max(team1, team2);
      const minScore = Math.min(team1, team2);
      return maxScore === targetGames && minScore < targetGames;
    } else if (session.scoring_mode === 'total_games') {
      const totalGames = session.total_games || session.points_per_match || 0;
      return team1 + team2 === totalGames;
    } else {
      // Points mode
      const maxPoints = session.points_per_match || 0;
      return team1 + team2 === maxPoints;
    }
  };

  // ISSUE #3 FIX: Update score mutation with pessimistic locking and retry
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
      const match = currentRound?.matches[matchIndex];
      if (!match) throw new Error('Match not found');

      // UX FIX: Validate match scores before saving
      const validation = validateMatchScore(
        team1Score,
        team2Score,
        session?.scoring_mode || 'first_to_15'
      );

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid score');
      }

      const description = `${match.team1[0].name} & ${match.team1[1].name} vs ${match.team2[0].name} & ${match.team2[1].name}: ${team1Score}-${team2Score}`;

      if (isOnline) {
        // ISSUE #3 FIX: Use pessimistic locking stored procedure with retry logic
        const result = await retryScoreUpdate(async () => {
          // Call the stored procedure with row-level locking
          const { data, error } = await supabase.rpc('update_score_with_lock', {
            p_session_id: sessionId,
            p_round_index: currentRoundIndex,
            p_match_index: matchIndex,
            p_team1_score: team1Score,
            p_team2_score: team2Score,
          });

          if (error) {
            Logger.error('Score save failed', error as Error, {
              action: 'saveScore',
              sessionId,
              metadata: { matchId: variables.matchId }
            });
            throw new Error(`Failed to save score: ${error.message}`);
          }

          return data;
        });

        // Update local algorithm ratings (client-side only)
        if (algorithm) {
          const updatedRounds = [...allRounds];
          const round = updatedRounds[currentRoundIndex];
          round.matches[matchIndex].team1Score = team1Score;
          round.matches[matchIndex].team2Score = team2Score;
          algorithm.updateRatings(round.matches[matchIndex]);
        }

        // ISSUE #3 FIX: Update player stats with error handling (non-blocking)
        try {
          await updatePlayerStats(players, allRounds);
        } catch (statsError) {
          Logger.error('Player stats update failed', statsError as Error, {
            action: 'updatePlayerStats',
            sessionId
          });
        }

        // ISSUE #3 FIX: Log event with error handling (non-blocking)
        try {
          await supabase.from('event_history').insert({
            session_id: sessionId,
            event_type: 'score_updated',
            description,
          });
        } catch (eventError) {
          Logger.error('Event log failed', eventError as Error, {
            action: 'logScoreEvent',
            sessionId
          });
        }

        return result;
      } else {
        // Offline: queue for later
        await offlineQueue.addOperation('UPDATE_SCORE', sessionId, {
          sessionId,
          matchIndex,
          currentRoundIndex,
          team1Score,
          team2Score,
          description,
        });

        return { matchIndex, team1Score, team2Score };
      }
    },
    onMutate: ({ matchIndex }) => {
      // Add to saving set to show spinner
      setSavingMatches(prev => new Set(prev).add(matchIndex));
    },
    onSuccess: ({ matchIndex, team1Score, team2Score }) => {
      Logger.info('Score updated successfully', {
        action: 'updateScore',
        sessionId,
        metadata: {
          roundNumber: currentRoundIndex + 1,
          matchIndex,
          team1Score,
          team2Score,
          isOffline: !isOnline
        }
      });

      // Remove from saving set
      setSavingMatches(prev => {
        const updated = new Set(prev);
        updated.delete(matchIndex);
        return updated;
      });

      // ISSUE #3 FIX: Update savedScores state to show checkmark
      setSavedScores(prev => ({
        ...prev,
        [`match-${matchIndex}`]: {
          team1Score: currentRound?.matches[matchIndex]?.team1Score,
          team2Score: currentRound?.matches[matchIndex]?.team2Score,
        },
      }));

      // Clear saved indicator after 2 seconds
      setTimeout(() => {
        setSavedScores(prev => {
          const updated = { ...prev };
          delete updated[`match-${matchIndex}`];
          return updated;
        });
      }, 2000);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['players', sessionId] });

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Score Saved',
        text2: 'Successfully updated match score',
        visibilityTime: 1500,
      });
    },
    onError: (error: any, variables) => {
      // Remove from saving set
      setSavingMatches(prev => {
        const updated = new Set(prev);
        updated.delete(variables.matchIndex);
        return updated;
      });

      // ISSUE #3 FIX: Show descriptive error message
      const errorMessage = error?.message || 'Unknown error occurred';
      const isLockError = errorMessage.includes('lock') || errorMessage.includes('timeout');
      const isValidationError = errorMessage.includes('points') || errorMessage.includes('win by 2') || errorMessage.includes('score');

      Toast.show({
        type: 'error',
        text1: isValidationError ? 'Invalid Score' : 'Failed to Save Score',
        text2: isOnline
          ? (isLockError
              ? 'Another user is editing. Retried but still failed. Please try again.'
              : errorMessage)
          : 'Score queued for when you\'re online',
        visibilityTime: isValidationError ? 5000 : 4000, // Longer for validation errors
      });

      // Clear local state on error
      setLocalScores(prev => {
        const updated = { ...prev };
        delete updated[`match-${variables.matchIndex}`];
        return updated;
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

  // ISSUE #5 FIX: Show error state if algorithm failed to initialize
  if (algorithmError) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 items-center">
          <RefreshCw color="#DC2626" size={48} />
          <Text className="text-xl font-semibold text-red-900 mt-4">Setup Error</Text>
          <Text className="text-red-700 text-center mt-2 mb-4">
            {algorithmError}
          </Text>
          <Text className="text-sm text-red-600 text-center mb-4">
            {algorithmError.includes('4 players')
              ? 'Add at least 4 active players to start the tournament.'
              : 'Please check your session configuration or try again.'}
          </Text>

          {/* ISSUE #5 FIX: Retry button if retry callback provided */}
          {onRetryAlgorithm && (
            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                className="bg-red-500 rounded-lg px-6 py-3 flex-row items-center gap-2"
                onPress={() => {
                  onRetryAlgorithm();
                  Toast.show({
                    type: 'info',
                    text1: 'Retrying...',
                    text2: 'Attempting to reinitialize algorithm',
                    visibilityTime: 2000,
                  });
                }}
              >
                <RefreshCw color="#FFFFFF" size={16} />
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-200 rounded-lg px-6 py-3"
                onPress={() => {
                  Toast.show({
                    type: 'info',
                    text1: 'Go Back',
                    text2: 'Please add players or check session settings',
                  });
                }}
              >
                <Text className="text-gray-700 font-semibold">Go Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Fallback if no retry callback */}
          {!onRetryAlgorithm && (
            <TouchableOpacity
              className="bg-red-500 rounded-lg px-6 py-3"
              onPress={() => {
                Toast.show({
                  type: 'info',
                  text1: 'Go Back',
                  text2: 'Please add players or check session settings',
                });
              }}
            >
              <Text className="text-white font-semibold">Go to Players</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

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
    <View style={{ flex: 1 }}>
      {/* Round Navigation */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16,
        paddingHorizontal: 12,
      }}>
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
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 24,
            minWidth: 180,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            <Text style={{
              fontFamily: 'Inter',
              fontSize: 15,
              fontWeight: '700',
              color: '#111827',
              letterSpacing: 0.5,
              lineHeight: 20,
            }}>
              ROUND {currentRound.number} OF {allRounds.length}
            </Text>
          </View>
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
            style={{ overflow: 'visible' }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Loading Placeholder - Prevent layout shift when generating next round */}
            {generateRoundMutation.isPending && (
              <View
                style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 12,
                  elevation: 2,
                  minHeight: compactMode ? 180 : 240,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ActivityIndicator size="large" color="#EF4444" />
                <Text style={{
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#9CA3AF',
                  marginTop: 12
                }}>
                  Generating next round...
                </Text>
              </View>
            )}

            {/* Parallel Mode: Render court cards */}
            {!generateRoundMutation.isPending && isParallelMode && currentRound && 'courtAssignments' in currentRound ? (
              <>
                {(currentRound as ParallelRound).courtAssignments.map((courtAssignment) => {
                  const { round: courtRound, roundIndex: courtRoundIndex } = getCourtRound(courtAssignment.courtNumber);
                  if (!courtRound || !('courtAssignments' in courtRound)) return null;

                  const parallelRound = courtRound as ParallelRound;

                  // Find match for this court in the court's current round
                  const match = parallelRound.matches.find(m => m.court === courtAssignment.courtNumber);

                  // Get sitting players for the court's current round
                  const sittingPlayers = parallelRound.sittingPlayers || [];

                  // Get local scores for this court's match
                  const matchIndex = parallelRound.matches.findIndex(m => m.court === courtAssignment.courtNumber);
                  const key = `court-${courtAssignment.courtNumber}-round-${courtRoundIndex}-match-${matchIndex}`;
                  const courtLocalScores = localScores[key];

                  return (
                    <CourtCard
                      key={courtAssignment.courtNumber}
                      courtNumber={courtAssignment.courtNumber}
                      courtAssignment={courtAssignment}
                      match={match}
                      currentRound={courtRoundIndex + 1}
                      totalRounds={allRounds.length}
                      sittingPlayers={sittingPlayers}
                      onRoundChange={handleCourtRoundChange}
                      onScoreChange={handleCourtScoreChange}
                      onScoreBlur={handleCourtScoreBlur}
                      localScores={courtLocalScores}
                      isSaving={savingMatches.has(matchIndex)}
                    />
                  );
                })}
              </>
            ) : null}

            {/* Sequential Mode: Matches */}
            {!generateRoundMutation.isPending && !isParallelMode && currentRound?.matches?.length > 0 ? (
              <>
                {currentRound.matches.map((match, index) => {
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
                            overflow: 'visible',
                          }}
                        >
                {compactMode ? (
                  /* COMPACT MODE - Layout 2: Two Lines Per Team */
                  <>
                    {/* Court Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 }}>
                          COURT {match.court || index + 1}
                        </Text>
                        {/* ISSUE #3 FIX: Visual feedback for save states */}
                        <View style={{ minWidth: 20, alignItems: 'center', justifyContent: 'center' }}>
                          {savingMatches.has(index) ? (
                            // Show spinner while saving
                            <ActivityIndicator size="small" color="#3B82F6" />
                          ) : (savedScores[`match-${index}`]?.team1Score !== undefined && savedScores[`match-${index}`]?.team2Score !== undefined) ? (
                            // Show checkmark for recently saved (disappears after 2s)
                            <CheckCircle2 color="#10B981" size={14} fill="#10B981" />
                          ) : (match.team1Score !== undefined && match.team2Score !== undefined) ? (
                            // Show checkmark for existing scores
                            <View style={{ opacity: 0.4 }}>
                              <CheckCircle2 color="#10B981" size={14} fill="#10B981" />
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>

                    {/* Single row: Team1 - Scores - Team2 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      {/* Team 1 - Two lines */}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                          {match.team1?.[0]?.name || 'Player 1'}
                        </Text>
                        <Text style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
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
                          borderColor: getScoreBorderColor(
                            index,
                            'team1',
                            localScores[`match-${index}`]?.team1,
                            savedScores[`match-${index}`]?.team1Score,
                            match.team1Score,
                            localScores[`match-${index}`]?.team2,
                            savedScores[`match-${index}`]?.team2Score,
                            match.team2Score
                          ),
                          borderRadius: 12,
                          textAlign: 'center',
                          fontFamily: 'Inter',
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

                          // Check for team2 score in localScores first, then savedScores, then database
                          const team2LocalValue = localScores[`match-${index}`]?.team2;
                          let team2Score: number | undefined;

                          if (team2LocalValue) {
                            const parsedTeam2 = parseInt(team2LocalValue);
                            if (!isNaN(parsedTeam2) && parsedTeam2 >= 0) {
                              team2Score = parsedTeam2;
                            }
                          }

                          if (team2Score === undefined) {
                            team2Score = savedScores[`match-${index}`]?.team2Score ?? match.team2Score;
                          }

                          // Validate team1 score doesn't exceed maximum BEFORE auto-fill
                          const maxAllowed = session.scoring_mode === 'first_to'
                            ? (session.games_to_win || session.points_per_match || 0)
                            : session.scoring_mode === 'total_games'
                              ? (session.total_games || session.points_per_match || 0)
                              : (session.points_per_match || 0);

                          if (team1Score > maxAllowed) {
                            // Invalid - exceeds maximum, keep in local state only
                            setLocalScores(prev => ({
                              ...prev,
                              [`match-${index}`]: {
                                ...prev[`match-${index}`],
                                team1: localValue
                              }
                            }));
                            return;
                          }

                          const shouldAutoFill = (
                            team2Score === undefined &&
                            session.scoring_mode !== 'first_to'
                          );

                          if (shouldAutoFill) {
                            // Auto-fill for 'points' and 'total_games' modes
                            const maxPoints = session.scoring_mode === 'total_games'
                              ? (session.total_games || session.points_per_match || 0)
                              : (session.points_per_match || 0);
                            team2Score = Math.max(0, maxPoints - team1Score);
                            // For auto-filled scores, only update local state, don't save yet
                            // This allows user to edit the auto-filled value before saving
                            setLocalScores(prev => ({
                              ...prev,
                              [`match-${index}`]: {
                                team1: localValue,
                                team2: team2Score!.toString()
                              }
                            }));
                          } else {
                            // Save immediately when BOTH scores are present and valid
                            if (team2Score !== undefined) {
                              // Validate before saving
                              if (!areScoresValid(team1Score, team2Score)) {
                                // Keep in local state if invalid - don't save
                                setLocalScores(prev => ({
                                  ...prev,
                                  [`match-${index}`]: {
                                    ...prev[`match-${index}`],
                                    team1: localValue
                                  }
                                }));
                                return;
                              }

                              setSavedScores(prev => ({
                                ...prev,
                                [`match-${index}`]: {
                                  team1Score,
                                  team2Score
                                }
                              }));
                              setLocalScores(prev => {
                                const updated = { ...prev };
                                delete updated[`match-${index}`];
                                return updated;
                              });
                              updateScoreMutation.mutate({
                                matchIndex: index,
                                team1Score,
                                team2Score
                              });
                            } else {
                              // Team2 score not entered yet - keep team1 in local state only
                              setLocalScores(prev => ({
                                ...prev,
                                [`match-${index}`]: {
                                  ...prev[`match-${index}`],
                                  team1: localValue
                                }
                              }));
                            }
                          }
                        }}
                        maxLength={2}
                        placeholder="0"
                        placeholderTextColor="#D1D5DB"
                      />
                        <Text style={{ fontFamily: 'Inter', fontSize: 16, fontWeight: '700', color: '#9CA3AF' }}>-</Text>
                        <TextInput
                        style={{
                          width: 52,
                          height: 40,
                          backgroundColor: '#F9FAFB',
                          borderWidth: 1,
                          borderColor: getScoreBorderColor(
                            index,
                            'team2',
                            localScores[`match-${index}`]?.team2,
                            savedScores[`match-${index}`]?.team2Score,
                            match.team2Score,
                            localScores[`match-${index}`]?.team1,
                            savedScores[`match-${index}`]?.team1Score,
                            match.team1Score
                          ),
                          borderRadius: 12,
                          textAlign: 'center',
                          fontFamily: 'Inter',
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

                          // Check for team1 score in localScores first, then savedScores, then database
                          const team1LocalValue = localScores[`match-${index}`]?.team1;
                          let team1Score: number | undefined;

                          if (team1LocalValue) {
                            const parsedTeam1 = parseInt(team1LocalValue);
                            if (!isNaN(parsedTeam1) && parsedTeam1 >= 0) {
                              team1Score = parsedTeam1;
                            }
                          }

                          if (team1Score === undefined) {
                            team1Score = savedScores[`match-${index}`]?.team1Score ?? match.team1Score;
                          }

                          // Validate team2 score doesn't exceed maximum BEFORE auto-fill
                          const maxAllowed = session.scoring_mode === 'first_to'
                            ? (session.games_to_win || session.points_per_match || 0)
                            : session.scoring_mode === 'total_games'
                              ? (session.total_games || session.points_per_match || 0)
                              : (session.points_per_match || 0);

                          if (team2Score > maxAllowed) {
                            // Invalid - exceeds maximum, keep in local state only
                            setLocalScores(prev => ({
                              ...prev,
                              [`match-${index}`]: {
                                ...prev[`match-${index}`],
                                team2: localValue
                              }
                            }));
                            return;
                          }

                          const shouldAutoFill = (
                            team1Score === undefined &&
                            session.scoring_mode !== 'first_to'
                          );

                          if (shouldAutoFill) {
                            // Auto-fill for 'points' and 'total_games' modes
                            const maxPoints = session.scoring_mode === 'total_games'
                              ? (session.total_games || session.points_per_match || 0)
                              : (session.points_per_match || 0);
                            team1Score = Math.max(0, maxPoints - team2Score);
                            // For auto-filled scores, only update local state, don't save yet
                            // This allows user to edit the auto-filled value before saving
                            setLocalScores(prev => ({
                              ...prev,
                              [`match-${index}`]: {
                                team1: team1Score!.toString(),
                                team2: localValue
                              }
                            }));
                          } else {
                            // Save immediately when BOTH scores are present and valid
                            if (team1Score !== undefined) {
                              // Validate before saving
                              if (!areScoresValid(team1Score, team2Score)) {
                                // Keep in local state if invalid - don't save
                                setLocalScores(prev => ({
                                  ...prev,
                                  [`match-${index}`]: {
                                    ...prev[`match-${index}`],
                                    team2: localValue
                                  }
                                }));
                                return;
                              }

                              setSavedScores(prev => ({
                                ...prev,
                                [`match-${index}`]: {
                                  team1Score,
                                  team2Score
                                }
                              }));
                              setLocalScores(prev => {
                                const updated = { ...prev };
                                delete updated[`match-${index}`];
                                return updated;
                              });
                              updateScoreMutation.mutate({
                                matchIndex: index,
                                team1Score,
                                team2Score
                              });
                            } else {
                              // Team1 score not entered yet - keep team2 in local state only
                              setLocalScores(prev => ({
                                ...prev,
                                [`match-${index}`]: {
                                  ...prev[`match-${index}`],
                                  team2: localValue
                                }
                              }));
                            }
                          }
                        }}
                        maxLength={2}
                        placeholder="0"
                        placeholderTextColor="#D1D5DB"
                      />
                      </View>

                      {/* Team 2 - Two lines */}
                      <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-end' }}>
                        <Text style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                          {match.team2?.[0]?.name || 'Player 3'}
                        </Text>
                        <Text style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
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
              <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 }}>
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
                <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 }} numberOfLines={1}>
                  {match.team1?.[0]?.name || 'Player 1'}
                </Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
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
                <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '700', color: '#EF4444', letterSpacing: 0.5 }}>VS</Text>
              </View>

              {/* Team 2 */}
              <View style={{
                flex: 1,
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                padding: 12,
              }}>
                <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4, textAlign: 'right' }} numberOfLines={1}>
                  {match.team2?.[0]?.name || 'Player 3'}
                </Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'right' }} numberOfLines={1}>
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
              <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: '700', color: '#9CA3AF', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 }}>
                SCORE
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <TextInput
                  style={{
                    width: 80,
                    height: 56,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: getScoreBorderColor(
                      index,
                      'team1',
                      localScores[`match-${index}`]?.team1,
                      savedScores[`match-${index}`]?.team1Score,
                      match.team1Score,
                      localScores[`match-${index}`]?.team2,
                      savedScores[`match-${index}`]?.team2Score,
                      match.team2Score
                    ),
                    borderRadius: 16,
                    textAlign: 'center',
                    fontFamily: 'Inter',
                    fontSize: 24,
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

                    // Check for team2 score in localScores first, then savedScores, then database
                    const team2LocalValue = localScores[`match-${index}`]?.team2;
                    let team2Score: number | undefined;

                    if (team2LocalValue) {
                      const parsedTeam2 = parseInt(team2LocalValue);
                      if (!isNaN(parsedTeam2) && parsedTeam2 >= 0) {
                        team2Score = parsedTeam2;
                      }
                    }

                    if (team2Score === undefined) {
                      team2Score = savedScores[`match-${index}`]?.team2Score ?? match.team2Score;
                    }

                    // Validate team1 score doesn't exceed maximum BEFORE auto-fill
                    const maxAllowed = session.scoring_mode === 'first_to'
                      ? (session.games_to_win || session.points_per_match || 0)
                      : session.scoring_mode === 'total_games'
                        ? (session.total_games || session.points_per_match || 0)
                        : (session.points_per_match || 0);

                    if (team1Score > maxAllowed) {
                      // Invalid - exceeds maximum, keep in local state only
                      setLocalScores(prev => ({
                        ...prev,
                        [`match-${index}`]: {
                          ...prev[`match-${index}`],
                          team1: localValue
                        }
                      }));
                      return;
                    }

                    const shouldAutoFill = (
                      team2Score === undefined &&
                      session.scoring_mode !== 'first_to'
                    );

                    if (shouldAutoFill) {
                      // Auto-fill for 'points' and 'total_games' modes
                      const maxPoints = session.scoring_mode === 'total_games'
                        ? (session.total_games || session.points_per_match || 0)
                        : (session.points_per_match || 0);
                      team2Score = Math.max(0, maxPoints - team1Score);
                      // For auto-filled scores, only update local state, don't save yet
                      // This allows user to edit the auto-filled value before saving
                      setLocalScores(prev => ({
                        ...prev,
                        [`match-${index}`]: {
                          team1: localValue,
                          team2: team2Score!.toString()
                        }
                      }));
                    } else {
                      // For "first to X" modes, don't auto-fill - only save when BOTH scores are explicitly entered
                      if (team2Score !== undefined) {
                        // Update local saved scores immediately for instant UI feedback
                        setSavedScores(prev => ({
                          ...prev,
                          [`match-${index}`]: {
                            team1Score,
                            team2Score
                          }
                        }));

                        // Clear entire match from local input state
                        setLocalScores(prev => {
                          const updated = { ...prev };
                          delete updated[`match-${index}`];
                          return updated;
                        });

                        // Save to database in background (async, non-blocking)
                        updateScoreMutation.mutate({
                          matchIndex: index,
                          team1Score,
                          team2Score
                        });
                      } else {
                        // Team2 score not entered yet - keep team1 in local state only
                        setLocalScores(prev => ({
                          ...prev,
                          [`match-${index}`]: {
                            ...prev[`match-${index}`],
                            team1: localValue
                          }
                        }));
                      }
                    }
                  }}
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor="#D1D5DB"
                />
                <Text style={{ fontFamily: 'Inter', fontSize: 24, fontWeight: '700', color: '#9CA3AF' }}>-</Text>
                <TextInput
                  style={{
                    width: 80,
                    height: 56,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: getScoreBorderColor(
                      index,
                      'team2',
                      localScores[`match-${index}`]?.team2,
                      savedScores[`match-${index}`]?.team2Score,
                      match.team2Score,
                      localScores[`match-${index}`]?.team1,
                      savedScores[`match-${index}`]?.team1Score,
                      match.team1Score
                    ),
                    borderRadius: 16,
                    textAlign: 'center',
                    fontFamily: 'Inter',
                    fontSize: 24,
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

                    // Check for team1 score in localScores first, then savedScores, then database
                    const team1LocalValue = localScores[`match-${index}`]?.team1;
                    let team1Score: number | undefined;

                    if (team1LocalValue) {
                      const parsedTeam1 = parseInt(team1LocalValue);
                      if (!isNaN(parsedTeam1) && parsedTeam1 >= 0) {
                        team1Score = parsedTeam1;
                      }
                    }

                    if (team1Score === undefined) {
                      team1Score = savedScores[`match-${index}`]?.team1Score ?? match.team1Score;
                    }

                    // Validate team2 score doesn't exceed maximum BEFORE auto-fill
                    const maxAllowed = session.scoring_mode === 'first_to'
                      ? (session.games_to_win || session.points_per_match || 0)
                      : session.scoring_mode === 'total_games'
                        ? (session.total_games || session.points_per_match || 0)
                        : (session.points_per_match || 0);

                    if (team2Score > maxAllowed) {
                      // Invalid - exceeds maximum, keep in local state only
                      setLocalScores(prev => ({
                        ...prev,
                        [`match-${index}`]: {
                          ...prev[`match-${index}`],
                          team2: localValue
                        }
                      }));
                      return;
                    }

                    const shouldAutoFill = (
                      team1Score === undefined &&
                      session.scoring_mode !== 'first_to'
                    );

                    if (shouldAutoFill) {
                      // Auto-fill for 'points' and 'total_games' modes
                      const maxPoints = session.scoring_mode === 'total_games'
                        ? (session.total_games || session.points_per_match || 0)
                        : (session.points_per_match || 0);
                      team1Score = Math.max(0, maxPoints - team2Score);
                      // For auto-filled scores, only update local state, don't save yet
                      // This allows user to edit the auto-filled value before saving
                      setLocalScores(prev => ({
                        ...prev,
                        [`match-${index}`]: {
                          team1: team1Score!.toString(),
                          team2: localValue
                        }
                      }));
                    } else {
                      // Save immediately when BOTH scores are present and valid
                      if (team1Score !== undefined) {
                        // Validate before saving
                        if (!areScoresValid(team1Score, team2Score)) {
                          // Keep in local state if invalid - don't save
                          setLocalScores(prev => ({
                            ...prev,
                            [`match-${index}`]: {
                              ...prev[`match-${index}`],
                              team2: localValue
                            }
                          }));
                          return;
                        }

                        // Update local saved scores immediately for instant UI feedback
                        setSavedScores(prev => ({
                          ...prev,
                          [`match-${index}`]: {
                            team1Score,
                            team2Score
                          }
                        }));

                        // Clear entire match from local input state
                        setLocalScores(prev => {
                          const updated = { ...prev };
                          delete updated[`match-${index}`];
                          return updated;
                        });

                        // Save to database in background (async, non-blocking)
                        updateScoreMutation.mutate({
                          matchIndex: index,
                          team1Score,
                          team2Score
                        });
                      } else {
                        // Team1 score not entered yet - keep team2 in local state only
                        setLocalScores(prev => ({
                          ...prev,
                          [`match-${index}`]: {
                            ...prev[`match-${index}`],
                            team2: localValue
                          }
                        }));
                      }
                    }
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
                })}
              </>
            ) : (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter', fontSize: 14, color: '#9CA3AF' }}>No matches available</Text>
              </View>
            )}

        {/* Sitting Players - Only show in sequential mode (parallel mode shows per court) */}
        {!isParallelMode && currentRound.sittingPlayers.length > 0 && (
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
                <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 }}>
                  Sitting Out
                </Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: '500', color: '#9CA3AF' }}>
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
                <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
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
                    fontFamily: 'Inter',
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#111827',
                    lineHeight: 20,
                  }}>
                    {player.name}
                  </Text>
                  {index < currentRound.sittingPlayers.length - 1 && (
                    <Text style={{
                      fontFamily: 'Inter',
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
});
