import React, { useEffect, useState, useCallback, useMemo, useRef, lazy, Suspense, Component, ReactNode } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Text, Platform, KeyboardAvoidingView, Alert, BackHandler, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Share2, MoreVertical, Play, Trophy, BarChart3, History, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../config/supabase';
import { MexicanoAlgorithm, Player, Round, Match } from '@courtster/shared';
import { useAuth } from '../../../hooks/useAuth';
import Toast from 'react-native-toast-message';
import PagerView from 'react-native-pager-view';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, withTiming, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { tabTransitionConfig } from '../../../utils/animations';
import { offlineQueue } from '../../../utils/offlineQueue';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { toPlayerStatus, toGender, toMatchupPreference, toSessionType } from '../../../utils/typeGuards';
import { Logger } from '../../../utils/logger';

// PHASE 2 OPTIMIZATION: Lazy load heavy tab components for better initial load performance
const RoundsTab = lazy(() => import('../../../components/session/RoundsTab').then(m => ({ default: m.RoundsTab })));
const LeaderboardTab = lazy(() => import('../../../components/session/LeaderboardTab').then(m => ({ default: m.LeaderboardTab })));
const StatisticsTab = lazy(() => import('../../../components/session/StatisticsTab').then(m => ({ default: m.StatisticsTab })));
const EventHistoryTab = lazy(() => import('../../../components/session/EventHistoryTab').then(m => ({ default: m.EventHistoryTab })));
import { SyncIndicator } from '../../../components/ui/SyncIndicator';
import { SessionSettingsModal } from '../../../components/ui/SessionSettingsModal';
import { OfflineIndicator } from '../../../components/ui/OfflineIndicator';
import { useTheme, getThemeColors } from '../../../contexts/ThemeContext';
import { AddPlayerModal } from '../../../components/session/AddPlayerModal';
import { ManagePlayersModal } from '../../../components/session/ManagePlayersModal';
import { SwitchPlayerModal } from '../../../components/session/SwitchPlayerModal';
import { ShareResultsModal } from '../../../components/session/ShareResultsModal';

type Tab = 'rounds' | 'leaderboard' | 'statistics' | 'history';
type SortBy = 'points' | 'wins';

// HIGH PRIORITY FIX #10: Error boundary for lazy-loaded components
class LazyLoadErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Logger.error('Lazy loaded component failed to load', error, {
      action: 'lazyLoadComponent',
      metadata: { componentStack: errorInfo.componentStack }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center px-6 py-12">
          <Text className="text-xl font-semibold text-red-600 mb-2">Failed to Load</Text>
          <Text className="text-gray-600 text-center mb-6">
            This component could not be loaded. Please try refreshing the app.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#EF4444',
              borderRadius: 12,
              paddingHorizontal: 20,
              paddingVertical: 12,
            }}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { isDark, fontScale, reduceAnimation } = useTheme();
  const colors = getThemeColors(isDark);

  // PHASE 2 OPTIMIZATION: Memoize scoring mode text calculation
  const getScoringModeText = useCallback((session: any) => {
    if (!session) return '';

    const pointsPerMatch = session.points_per_match || 0;
    const scoringMode = session.scoring_mode;

    switch (scoringMode) {
      case 'first_to':
        return `First to ${pointsPerMatch} points`;
      case 'first_to_games':
        return `First to ${pointsPerMatch} games`;
      case 'total_points':
        return `Total ${pointsPerMatch} points`;
      default:
        return `${pointsPerMatch} points`;
    }
  }, []);

  // State
  const [tab, setTab] = useState<Tab>('rounds');
  const [sortBy, setSortBy] = useState<SortBy>('points');
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [algorithm, setAlgorithm] = useState<MexicanoAlgorithm | null>(null);
  const [algorithmError, setAlgorithmError] = useState<string | null>(null); // ISSUE #5 FIX
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState(false);
  const [managePlayersModalVisible, setManagePlayersModalVisible] = useState(false);
  const [switchPlayerModalVisible, setSwitchPlayerModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  // Network status
  const { isOnline } = useNetworkStatus();

  // Pager state and refs
  const pagerRef = useRef<PagerView>(null);
  const tabPosition = useSharedValue(0);
  const tabs: Tab[] = ['rounds', 'leaderboard', 'statistics', 'history'];
  const currentTabIndex = tabs.indexOf(tab);

  // Round navigation animation
  const roundTranslateX = useSharedValue(0);
  const roundOpacity = useSharedValue(1);

  // Fetch session data
  const { data: session, isLoading: sessionLoading, isError: sessionError, error: sessionErrorDetails } = useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // CRITICAL FIX #1: Validate user ownership
      if (data.user_id !== user?.id) {
        throw new Error('You do not have access to this session');
      }

      return data;
    },
    enabled: !!user?.id && !!id,
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch players
  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['players', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', id)
        .order('total_points', { ascending: false });

      if (error) throw error;

      // CRITICAL FIX #3: Transform to Player type with type guards
      return data.map(p => ({
        id: p.id,
        name: p.name,
        rating: p.rating,
        playCount: p.play_count,
        sitCount: p.sit_count,
        consecutiveSits: p.consecutive_sits,
        consecutivePlays: p.consecutive_plays,
        status: toPlayerStatus(p.status),
        totalPoints: p.total_points,
        wins: p.wins,
        losses: p.losses,
        ties: p.ties,
        skipRounds: p.skip_rounds || [],
        skipCount: p.skip_count || 0,
        compensationPoints: p.compensation_points || 0,
        gender: toGender(p.gender),
      }));
    },
  });

  // Fetch event history
  const { data: eventHistory = [] } = useQuery({
    queryKey: ['eventHistory', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_history')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Parse rounds from session data
  // NOTE: round_data is JSONB in database - Supabase automatically parses it to JavaScript array
  const allRounds: Round[] = useMemo(() => {
    if (!session?.round_data) return [];

    // If round_data is already an array (from Supabase JSONB), use it directly
    if (Array.isArray(session.round_data)) {
      return session.round_data;
    }

    // Fallback: if it's a string (shouldn't happen with JSONB), parse it
    if (typeof session.round_data === 'string') {
      try {
        return JSON.parse(session.round_data);
      } catch (error) {
        Logger.error('Failed to parse round_data', error as Error, {
          action: 'parseRoundData',
          sessionId: session.id
        });
        return [];
      }
    }

    return [];
  }, [session?.round_data]);

  // CRITICAL FIX #2: Initialize algorithm with race condition prevention
  const initializeAlgorithm = useCallback(() => {
    // Wait for BOTH session AND players to be loaded (prevent race condition)
    if (!session || !players) return;

    if (players.length >= 4) {
      try {
        // CRITICAL FIX #3: Use type guards instead of 'as any'
        const algo = new MexicanoAlgorithm(
          players,
          session.courts || 1,
          true,
          toMatchupPreference(session.matchup_preference),
          toSessionType(session.type)
        );
        setAlgorithm(algo);
        setAlgorithmError(null); // Clear any previous errors
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown algorithm error';
        Logger.error('Algorithm initialization failed', error as Error, {
          action: 'initAlgorithm',
          sessionId: session?.id,
          metadata: { playerCount: players.length, courts: session.courts }
        });

        // Set error state and show toast
        setAlgorithmError(errorMessage);
        setAlgorithm(null);

        Toast.show({
          type: 'error',
          text1: 'Setup Failed',
          text2: errorMessage,
          visibilityTime: 4000,
        });
      }
    } else {
      // Handle insufficient players case
      setAlgorithmError('At least 4 players are required');
      setAlgorithm(null);
    }
  }, [players, session]);

  // CRITICAL FIX #2: Only initialize when BOTH queries are ready
  useEffect(() => {
    // Wait for both queries to complete before initializing
    if (!sessionLoading && !playersLoading && session && players) {
      initializeAlgorithm();
    }
  }, [sessionLoading, playersLoading, session, players, initializeAlgorithm]);

  // Set current round index based on session
  useEffect(() => {
    if (session?.current_round !== undefined) {
      setCurrentRoundIndex(session.current_round);
    }
  }, [session?.current_round]);

  // HIGH PRIORITY FIX #4: Close dropdown on Android back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (dropdownOpen) {
          setDropdownOpen(false);
          return true; // Prevent default behavior (going back)
        }
        return false; // Allow default behavior
      });

      return () => backHandler.remove();
    }
  }, [dropdownOpen]);

  // HIGH PRIORITY FIX #11: Close dropdown when changing tabs
  useEffect(() => {
    setDropdownOpen(false);
  }, [tab]);

  // ISSUE #14 FIX: Optimized player stats calculation using Map for O(1) lookups
  const calculatePlayerStatsFromRounds = useCallback(
    (playersData: Player[], rounds: Round[], sessionData: any): Player[] => {
      // ISSUE #14 FIX: Use Map for O(1) player lookups instead of O(n) findIndex
      // Complexity changed from O(r × m × p × n) to O(r × m × p)
      const playerStatsMap = new Map(
        playersData.map(p => [
          p.id,
          {
            ...p,
            totalPoints: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            playCount: 0,
            sitCount: 0,
            compensationPoints: 0,
          }
        ])
      );

      // Calculate base stats from rounds - now O(r × m × p) instead of O(r × m × p × n)
      rounds.forEach((round) => {
        round.matches.forEach((match) => {
          if (match.team1Score !== undefined && match.team2Score !== undefined) {
            const team1Won = match.team1Score > match.team2Score;
            const team2Won = match.team2Score > match.team1Score;
            const isTie = match.team1Score === match.team2Score;

            // Update team 1 players - O(1) lookup with Map
            match.team1.forEach((player) => {
              const stats = playerStatsMap.get(player.id);
              if (stats) {
                stats.totalPoints += match.team1Score!;
                stats.playCount++;

                if (team1Won) {
                  stats.wins++;
                } else if (team2Won) {
                  stats.losses++;
                } else if (isTie) {
                  stats.ties++;
                }
              }
            });

            // Update team 2 players - O(1) lookup with Map
            match.team2.forEach((player) => {
              const stats = playerStatsMap.get(player.id);
              if (stats) {
                stats.totalPoints += match.team2Score!;
                stats.playCount++;

                if (team2Won) {
                  stats.wins++;
                } else if (team1Won) {
                  stats.losses++;
                } else if (isTie) {
                  stats.ties++;
                }
              }
            });
          }
        });

        // Count sitting players - O(1) lookup with Map
        round.sittingPlayers.forEach((sittingPlayer) => {
          const stats = playerStatsMap.get(sittingPlayer.id);
          if (stats) {
            stats.sitCount++;
          }
        });
      });

      // Convert Map back to array
      const updatedPlayers = Array.from(playerStatsMap.values());

      // Apply compensation points (capped at 1 round)
      if (!sessionData?.points_per_match) return updatedPlayers;

      const compensationPoints = Math.floor(sessionData.points_per_match / 2);
      const maxRoundsPlayed = Math.max(...updatedPlayers.map((p) => p.playCount));

      return updatedPlayers.map((player) => {
        const roundsDeficit = maxRoundsPlayed - player.playCount;

        if (roundsDeficit > 0) {
          const compensationRounds = Math.min(roundsDeficit, 1);
          const compensation = compensationRounds * compensationPoints;

          return {
            ...player,
            totalPoints: player.totalPoints + compensation,
            compensationPoints: compensation,
          };
        }

        return { ...player, compensationPoints: 0 };
      });
    },
    []
  );

  // HIGH PRIORITY FIX #5: Remove stable callback from dependencies
  // Recalculate player stats from rounds (for real-time updates)
  const recalculatedPlayers = useMemo(() => {
    if (!session || allRounds.length === 0) return players;
    return calculatePlayerStatsFromRounds(players, allRounds, session);
  }, [players, allRounds, session]);

  // Sorted players with tiebreakers
  const sortedPlayers = useMemo(() => {
    return [...recalculatedPlayers].sort((a, b) => {
      if (sortBy === 'points') {
        // Primary: Sort by total points
        const pointsDiff = b.totalPoints - a.totalPoints;
        if (pointsDiff !== 0) return pointsDiff;

        // Tiebreaker: W-L record
        const winsDiff = b.wins - a.wins;
        if (winsDiff !== 0) return winsDiff;

        const lossesDiff = a.losses - b.losses;
        if (lossesDiff !== 0) return lossesDiff;

        const tiesDiff = b.ties - a.ties;
        if (tiesDiff !== 0) return tiesDiff;

        // Final fallback: alphabetical
        return a.name.localeCompare(b.name);
      } else {
        // Sort by wins
        const winsDiff = b.wins - a.wins;
        if (winsDiff !== 0) return winsDiff;

        // Tiebreaker: total points
        return b.totalPoints - a.totalPoints;
      }
    });
  }, [recalculatedPlayers, sortBy]);

  const currentRound = allRounds[currentRoundIndex];
  const hasMatchesStarted = useMemo(() => {
    if (!currentRound) return false;
    return currentRound.matches.some(
      (match) => match.team1Score !== undefined || match.team2Score !== undefined
    );
  }, [currentRound]);

  // Add player mutation
  const addPlayerMutation = useMutation({
    mutationFn: async ({ name, rating }: { name: string; rating: number }) => {
      // Insert new player
      const { data: newPlayer, error: playerError } = await supabase
        .from('players')
        .insert({
          session_id: id,
          name,
          rating,
          status: 'active',
          total_points: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          play_count: 0,
          sit_count: 0,
          consecutive_sits: 0,
          consecutive_plays: 0,
          skip_rounds: [],
          skip_count: 0,
          compensation_points: 0,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Log event
      await supabase.from('event_history').insert({
        session_id: id,
        event_type: 'player_added',
        description: `${name} joined the session`,
        metadata: { player_id: newPlayer.id, player_name: name, rating },
      });

      return newPlayer;
    },
    onSuccess: (newPlayer, variables) => {
      Logger.info('Player added successfully', {
        action: 'addPlayer',
        sessionId: id,
        userId: user?.id,
        metadata: {
          playerId: newPlayer.id,
          playerName: variables.name,
          rating: variables.rating,
          totalPlayers: players.length + 1,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['players', id] });
      queryClient.invalidateQueries({ queryKey: ['eventHistory', id] });
      Toast.show({
        type: 'success',
        text1: 'Player Added',
        text2: 'Player has been added to sitting players',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to Add Player',
        text2: error.message,
      });
    },
  });

  // Remove player mutation
  const removePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const player = players.find(p => p.id === playerId);

      // Delete player
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;

      // Log event
      await supabase.from('event_history').insert({
        session_id: id,
        event_type: 'player_removed',
        description: `${player?.name} was removed from the session`,
        metadata: { player_id: playerId, player_name: player?.name },
      });

      return player;
    },
    onSuccess: (player) => {
      Logger.info('Player removed successfully', {
        action: 'removePlayer',
        sessionId: id,
        userId: user?.id,
        metadata: {
          playerId: player?.id,
          playerName: player?.name,
          totalPlayers: players.length - 1,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['players', id] });
      queryClient.invalidateQueries({ queryKey: ['eventHistory', id] });
      Toast.show({
        type: 'success',
        text1: 'Player Removed',
        text2: 'Player has been removed from the session',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to Remove Player',
        text2: error.message,
      });
    },
  });

  // Change player status mutation
  const changeStatusMutation = useMutation({
    mutationFn: async ({ playerId, newStatus }: { playerId: string; newStatus: string }) => {
      const player = players.find(p => p.id === playerId);
      const oldStatus = player?.status;

      const { error } = await supabase
        .from('players')
        .update({ status: newStatus })
        .eq('id', playerId);

      if (error) throw error;

      await supabase.from('event_history').insert({
        session_id: id,
        event_type: 'status_change',
        description: `${player?.name} status changed to ${newStatus}`,
        metadata: { player_id: playerId, new_status: newStatus },
      });

      return { player, oldStatus, newStatus };
    },
    onSuccess: ({ player, oldStatus, newStatus }) => {
      Logger.info('Player status changed', {
        action: 'changePlayerStatus',
        sessionId: id,
        userId: user?.id,
        metadata: {
          playerId: player?.id,
          playerName: player?.name,
          oldStatus,
          newStatus,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['players', id] });
      queryClient.invalidateQueries({ queryKey: ['eventHistory', id] });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to Change Status',
        text2: error.message,
      });
    },
  });

  // Regenerate current round mutation
  const regenerateRoundMutation = useMutation({
    mutationFn: async () => {
      const currentRound = allRounds[currentRoundIndex];
      if (!currentRound || !algorithm) throw new Error('No current round to regenerate');

      // Generate new round with same round number
      const newRound = algorithm.generateRound(currentRound.number);
      const description = `Round ${currentRound.number} regenerated`;

      // Update the round in the rounds array
      const updatedRounds = [...allRounds];
      updatedRounds[currentRoundIndex] = newRound;

      // Save to database or queue for offline
      if (isOnline) {
        const { error } = await supabase
          .from('game_sessions')
          .update({ round_data: updatedRounds })
          .eq('id', id);

        if (error) throw error;

        // Log event
        await supabase.from('event_history').insert({
          session_id: id,
          event_type: 'round_generated',
          description,
        });
      } else {
        // Queue for offline sync
        await offlineQueue.addOperation('REGENERATE_ROUND', id, {
          sessionId: id,
          updatedRounds,
          description,
        });
      }

      return updatedRounds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] });
      queryClient.invalidateQueries({ queryKey: ['eventHistory', id] });
      Toast.show({
        type: 'success',
        text1: 'Round Regenerated',
        text2: `Round ${allRounds[currentRoundIndex]?.number} has been regenerated with new pairings`,
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to Regenerate Round',
        text2: error.message,
      });
    },
  });

  const handleAddPlayer = (name: string, rating: number) => {
    addPlayerMutation.mutate({ name, rating });
  };

  const handleRemovePlayer = (playerId: string) => {
    removePlayerMutation.mutate(playerId);
  };

  const handleChangeStatus = (playerId: string, newStatus: string) => {
    changeStatusMutation.mutate({ playerId, newStatus });
  };

  const handleReassignPlayer = (player: Player) => {
    // This functionality already exists in LeaderboardTab, so we'll just close the modal
    // and let the user use the existing reassignment in leaderboard
    setManagePlayersModalVisible(false);
    setTab('leaderboard');
    Toast.show({
      type: 'info',
      text1: 'Go to Leaderboard',
      text2: 'Use the player actions in leaderboard to reassign',
    });
  };

  const handleRegenerateRound = () => {
    const currentRound = allRounds[currentRoundIndex];

    Alert.alert(
      'Regenerate Round',
      `Are you sure you want to regenerate Round ${currentRound?.number}? All current scores will be lost.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: () => regenerateRoundMutation.mutate(),
        },
      ]
    );
  };

  const handleShareResults = () => {
    setShareModalVisible(true);
  };

  // Animated round navigation handlers
  const handleRoundChange = useCallback((newIndex: number, direction: 'forward' | 'backward') => {
    // Just change the index without animation for now to prevent crashes
    // TODO: Re-enable animation after investigating the crash
    setCurrentRoundIndex(newIndex);

    // Haptic feedback
    if (!reduceAnimation) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [reduceAnimation]);

  // PHASE 2 OPTIMIZATION: Memoize player position getter
  const getPlayerAtPosition = useCallback((
    match: Match,
    position: 'team1_0' | 'team1_1' | 'team2_0' | 'team2_1'
  ): Player | undefined => {
    switch (position) {
      case 'team1_0':
        return match.team1?.[0];
      case 'team1_1':
        return match.team1?.[1];
      case 'team2_0':
        return match.team2?.[0];
      case 'team2_1':
        return match.team2?.[1];
    }
  }, []);

  // PHASE 2 OPTIMIZATION: Memoize player position setter
  const setPlayerAtPosition = useCallback((
    match: Match,
    position: 'team1_0' | 'team1_1' | 'team2_0' | 'team2_1',
    player: Player
  ): void => {
    // Ensure team arrays exist and have correct length
    if (!match.team1 || match.team1.length < 2) {
      match.team1 = [match.team1?.[0] || ({} as Player), match.team1?.[1] || ({} as Player)];
    }
    if (!match.team2 || match.team2.length < 2) {
      match.team2 = [match.team2?.[0] || ({} as Player), match.team2?.[1] || ({} as Player)];
    }

    switch (position) {
      case 'team1_0':
        match.team1[0] = player;
        break;
      case 'team1_1':
        match.team1[1] = player;
        break;
      case 'team2_0':
        match.team2[0] = player;
        break;
      case 'team2_1':
        match.team2[1] = player;
        break;
    }
  }, []);

  // HIGH PRIORITY FIX #8: Comprehensive player switch validation
  const validatePlayerSwitch = useCallback((
    oldPlayer: Player,
    newPlayer: Player,
    matchIndex: number,
    position: 'team1_0' | 'team1_1' | 'team2_0' | 'team2_1'
  ): { valid: boolean; error?: string } => {
    if (!session) return { valid: false, error: 'Session not found' };

    // Validate match exists and has teams
    const currentMatch = currentRound.matches[matchIndex];
    if (!currentMatch) {
      return { valid: false, error: 'Match not found' };
    }

    // UX FIX: Check if match has scores entered
    if (currentMatch.team1Score !== undefined || currentMatch.team2Score !== undefined) {
      return {
        valid: false,
        error: `Cannot switch players after scores have been entered (${currentMatch.team1Score}-${currentMatch.team2Score}). Clear the scores first to make changes.`,
      };
    }

    // UX FIX: Check new player availability with specific reason
    if (newPlayer.status !== 'active') {
      const statusText = newPlayer.status === 'sitting' ? 'currently sitting out' :
                        newPlayer.status === 'skip' ? 'skipping this session' :
                        'not available';
      return {
        valid: false,
        error: `${newPlayer.name} is ${statusText}. Mark them as active first to use them in a match.`,
      };
    }

    // Validate teams exist and have players
    if (!currentMatch.team1 || !currentMatch.team2) {
      return {
        valid: false,
        error: 'Match teams are not properly initialized. Please regenerate this round.'
      };
    }

    if (currentMatch.team1.length < 2 || currentMatch.team2.length < 2) {
      return {
        valid: false,
        error: 'Both teams must have 2 players. Please regenerate this round to fix the match structure.'
      };
    }

    // Validate no duplicate players in the same match (after switch)
    const team1Players = position.startsWith('team1')
      ? [
          position === 'team1_0' ? newPlayer : currentMatch.team1[0],
          position === 'team1_1' ? newPlayer : currentMatch.team1[1],
        ]
      : currentMatch.team1;

    const team2Players = position.startsWith('team2')
      ? [
          position === 'team2_0' ? newPlayer : currentMatch.team2[0],
          position === 'team2_1' ? newPlayer : currentMatch.team2[1],
        ]
      : currentMatch.team2;

    // UX FIX: Check for duplicate players in team1
    if (team1Players[0]?.id === team1Players[1]?.id) {
      return {
        valid: false,
        error: `Cannot have ${team1Players[0]?.name || 'the same player'} twice on Team 1. Choose a different replacement player.`,
      };
    }

    // UX FIX: Check for duplicate players in team2
    if (team2Players[0]?.id === team2Players[1]?.id) {
      return {
        valid: false,
        error: `Cannot have ${team2Players[0]?.name || 'the same player'} twice on Team 2. Choose a different replacement player.`,
      };
    }

    // UX FIX: Check if newPlayer is already in the match (different position)
    const allMatchPlayers = [...team1Players, ...team2Players].filter(p => p && p.id);
    const playerIds = allMatchPlayers.map(p => p.id);
    const uniqueIds = new Set(playerIds);

    if (playerIds.length !== uniqueIds.size) {
      return {
        valid: false,
        error: `${newPlayer.name} is already playing in this match at a different position. To swap positions, use a sitting player as an intermediary.`,
      };
    }

    // UX FIX: For Fixed Partner mode, prevent breaking partnerships
    if (session.type === 'fixed_partner') {
      // Check if oldPlayer has a partner
      if (oldPlayer.partnerId) {
        const partner = players.find(p => p.id === oldPlayer.partnerId);
        if (partner) {
          return {
            valid: false,
            error: `Cannot switch ${oldPlayer.name} - they are partnered with ${partner.name} in Fixed Partner mode. Switch the entire partnership or change session type.`,
          };
        }
      }
    }

    // UX FIX: For Mixed Mexicano, validate gender balance with specific feedback
    if (session.type === 'mixed_mexicano') {
      // Filter out undefined/null players
      const validTeam1Players = team1Players.filter(p => p && p.id);
      const validTeam2Players = team2Players.filter(p => p && p.id);

      if (validTeam1Players.length < 2 || validTeam2Players.length < 2) {
        return {
          valid: false,
          error: 'Both teams must have 2 players for Mixed Mexicano. Please regenerate this round.',
        };
      }

      // Validate team 1 has 1 male + 1 female
      const team1Genders = validTeam1Players.map(p => p.gender).filter(Boolean);
      const team1HasMale = team1Genders.includes('male');
      const team1HasFemale = team1Genders.includes('female');

      if (!team1HasMale || !team1HasFemale) {
        const team1GenderText = team1Genders.join(' + ');
        return {
          valid: false,
          error: `Team 1 would have ${team1GenderText} (needs 1 male + 1 female). This switch breaks gender balance for Mixed Mexicano. Choose a ${team1HasMale ? 'female' : 'male'} player instead.`,
        };
      }

      // Validate team 2 has 1 male + 1 female
      const team2Genders = validTeam2Players.map(p => p.gender).filter(Boolean);
      const team2HasMale = team2Genders.includes('male');
      const team2HasFemale = team2Genders.includes('female');

      if (!team2HasMale || !team2HasFemale) {
        const team2GenderText = team2Genders.join(' + ');
        return {
          valid: false,
          error: `Team 2 would have ${team2GenderText} (needs 1 male + 1 female). This switch breaks gender balance for Mixed Mexicano. Choose a ${team2HasMale ? 'female' : 'male'} player instead.`,
        };
      }
    }

    return { valid: true };
  }, [session, currentRound, players]);

  // PHASE 2 OPTIMIZATION: Memoize player swap logic
  const performPlayerSwap = useCallback((
    round: Round,
    matchIndex: number,
    position: 'team1_0' | 'team1_1' | 'team2_0' | 'team2_1',
    oldPlayer: Player,
    newPlayer: Player
  ): void => {
    // Check if newPlayer is currently playing (swap) or sitting (replace)
    const isSwap = round.matches.some(match =>
      match.team1?.some(p => p?.id === newPlayer.id) ||
      match.team2?.some(p => p?.id === newPlayer.id)
    );

    if (isSwap) {
      // Find where the newPlayer is currently playing
      let swapMatchIndex = -1;
      let swapPosition: 'team1_0' | 'team1_1' | 'team2_0' | 'team2_1' | null = null;

      round.matches.forEach((match, idx) => {
        const team1Pos0 = match.team1?.[0];
        const team1Pos1 = match.team1?.[1];
        const team2Pos0 = match.team2?.[0];
        const team2Pos1 = match.team2?.[1];

        if (team1Pos0?.id === newPlayer.id) {
          swapMatchIndex = idx;
          swapPosition = 'team1_0';
        } else if (team1Pos1?.id === newPlayer.id) {
          swapMatchIndex = idx;
          swapPosition = 'team1_1';
        } else if (team2Pos0?.id === newPlayer.id) {
          swapMatchIndex = idx;
          swapPosition = 'team2_0';
        } else if (team2Pos1?.id === newPlayer.id) {
          swapMatchIndex = idx;
          swapPosition = 'team2_1';
        }
      });

      if (swapMatchIndex === -1 || !swapPosition) {
        throw new Error('Could not find new player position in round matches');
      }

      // Validate swap match exists and has proper structure
      if (!round.matches[swapMatchIndex]) {
        throw new Error('Swap match not found in round');
      }

      // Put newPlayer in the original position
      setPlayerAtPosition(round.matches[matchIndex], position, newPlayer);

      // Put oldPlayer in newPlayer's original position
      setPlayerAtPosition(round.matches[swapMatchIndex], swapPosition, oldPlayer);
    } else {
      // Replace with sitting player
      // Update the match with new player
      setPlayerAtPosition(round.matches[matchIndex], position, newPlayer);

      // Update sitting players - remove new player, add old player
      if (!round.sittingPlayers) {
        round.sittingPlayers = [];
      }
      round.sittingPlayers = round.sittingPlayers.filter(p => p?.id !== newPlayer.id);

      // Only add old player if not already sitting (edge case: player in both matches and sitting)
      const oldPlayerInSitting = round.sittingPlayers.some(p => p?.id === oldPlayer.id);
      if (!oldPlayerInSitting) {
        round.sittingPlayers.push(oldPlayer);
      }
    }
  }, [setPlayerAtPosition]);

  // HIGH PRIORITY FIX #6: Switch player mutation with optimistic updates
  const switchPlayerMutation = useMutation({
    mutationFn: async ({
      matchIndex,
      position,
      newPlayerId,
    }: {
      matchIndex: number;
      position: 'team1_0' | 'team1_1' | 'team2_0' | 'team2_1';
      newPlayerId: string;
    }) => {
      // Validate round exists
      if (!currentRound || !currentRound.matches) {
        throw new Error('No active round found');
      }

      // Validate match index
      if (matchIndex < 0 || matchIndex >= currentRound.matches.length) {
        throw new Error('Invalid match index');
      }

      // Get current match and old player
      const currentMatch = currentRound.matches[matchIndex];
      const oldPlayer = getPlayerAtPosition(currentMatch, position);

      if (!oldPlayer) {
        throw new Error('No player found at the specified position');
      }

      const newPlayer = players.find(p => p.id === newPlayerId);

      if (!newPlayer) {
        throw new Error('Replacement player not found');
      }

      // Check if trying to switch player with themselves
      if (oldPlayer.id === newPlayer.id) {
        throw new Error('Cannot switch player with themselves');
      }

      // ISSUE #10 FIX: Validate the switch before proceeding
      const validation = validatePlayerSwitch(oldPlayer, newPlayer, matchIndex, position);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid player switch');
      }

      // Update rounds data with switched player
      const updatedRounds = [...allRounds];
      const round = updatedRounds[currentRoundIndex];

      // Validate round structure
      if (!round || !round.matches) {
        throw new Error('Round data is corrupted or missing');
      }

      // Perform the swap
      try {
        performPlayerSwap(round, matchIndex, position, oldPlayer, newPlayer);
      } catch (error) {
        throw new Error(`Failed to swap players: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Determine if it was a swap for logging
      const isSwap = round.matches.some(match =>
        match.team1?.some(p => p?.id === oldPlayer.id) ||
        match.team2?.some(p => p?.id === oldPlayer.id)
      );

      // Save to database
      // NOTE: Pass JavaScript array directly - Supabase converts to JSONB automatically
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ round_data: updatedRounds })
        .eq('id', id);

      if (updateError) throw updateError;

      // Log event
      const eventDescription = isSwap
        ? `${oldPlayer.name} and ${newPlayer.name} swapped positions in Round ${currentRoundIndex + 1}`
        : `${oldPlayer.name} replaced by ${newPlayer.name} in Round ${currentRoundIndex + 1}, Court ${currentMatch.court || matchIndex + 1}`;

      await supabase.from('event_history').insert({
        session_id: id,
        event_type: isSwap ? 'player_swapped' : 'player_switched',
        description: eventDescription,
        metadata: {
          round: currentRoundIndex,
          court: currentMatch.court || matchIndex + 1,
          old_player_id: oldPlayer.id,
          old_player_name: oldPlayer.name,
          new_player_id: newPlayer.id,
          new_player_name: newPlayer.name,
          position,
          is_swap: isSwap,
        },
      });

      return updatedRounds;
    },
    // HIGH PRIORITY FIX #6: Optimistic update for instant UI feedback
    onMutate: async (variables) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['session', id] });

      // Snapshot the previous value
      const previousSession = queryClient.getQueryData(['session', id]);

      // Optimistically update the cache
      queryClient.setQueryData(['session', id], (old: any) => {
        if (!old || !old.round_data) return old;

        const updatedRounds = JSON.parse(JSON.stringify(old.round_data));
        const round = updatedRounds[currentRoundIndex];

        if (!round || !round.matches) return old;

        // Get players
        const currentMatch = round.matches[variables.matchIndex];
        const oldPlayer = getPlayerAtPosition(currentMatch, variables.position);
        const newPlayer = players.find(p => p.id === variables.newPlayerId);

        if (!oldPlayer || !newPlayer) return old;

        // Perform optimistic swap
        try {
          performPlayerSwap(round, variables.matchIndex, variables.position, oldPlayer, newPlayer);
        } catch (error) {
          Logger.error('Optimistic player swap update failed', error as Error, {
            action: 'optimisticPlayerSwap',
            sessionId: id,
            metadata: { matchIndex: variables.matchIndex, position: variables.position }
          });
          return old;
        }

        return {
          ...old,
          round_data: updatedRounds,
        };
      });

      // Return context with snapshot
      return { previousSession };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousSession) {
        queryClient.setQueryData(['session', id], context.previousSession);
      }

      Toast.show({
        type: 'error',
        text1: 'Switch Failed',
        text2: err instanceof Error ? err.message : 'Failed to switch player',
        visibilityTime: 4000,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session', id] });
      queryClient.invalidateQueries({ queryKey: ['eventHistory', id] });

      // Determine if it was a swap or replacement based on updated rounds
      const round = data[currentRoundIndex];
      const newPlayer = players.find(p => p.id === variables.newPlayerId);
      const isSwap = !round.sittingPlayers.some(p => p.id === newPlayer?.id);

      Toast.show({
        type: 'success',
        text1: isSwap ? 'Players Swapped' : 'Player Switched',
        text2: isSwap ? 'Players have been successfully swapped' : 'Player has been successfully switched',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to Switch Player',
        text2: error.message,
      });
    },
  });

  const handleSwitchPlayer = (
    matchIndex: number,
    position: 'team1_0' | 'team1_1' | 'team2_0' | 'team2_1',
    newPlayerId: string
  ) => {
    switchPlayerMutation.mutate({ matchIndex, position, newPlayerId });
  };

  // Loading state
  if (sessionLoading || playersLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading session...</Text>
      </View>
    );
  }

  // HIGH PRIORITY FIX #7: Error handling UI
  if (sessionError) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-xl font-semibold text-red-600 mb-2">Failed to Load Session</Text>
        <Text className="text-gray-600 text-center mb-6">
          {sessionErrorDetails?.message || 'An error occurred while loading this session'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#EF4444', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}
            onPress={() => queryClient.invalidateQueries({ queryKey: ['session', id] })}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: '#D1D5DB' }}
            onPress={() => router.back()}
          >
            <Text style={{ color: '#111827', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</Text>
        <Text className="text-gray-600 text-center mb-6">
          This session may have been deleted or you don't have access to it.
        </Text>
        <TouchableOpacity
          className="bg-primary-500 rounded-lg px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Header */}
      <View style={{
        paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) + 16 : insets.top + 16,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
      }}>

        <View className="flex-row items-center justify-between" style={{ position: 'relative' }}>
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <ChevronLeft color="#111827" size={28} strokeWidth={2} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
                {session.name}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280', marginTop: 4 }} numberOfLines={1}>
                {session.sport?.charAt(0).toUpperCase()}{session.sport?.slice(1)} • {session.type?.charAt(0).toUpperCase()}{session.type?.slice(1)} • {getScoringModeText(session)}
              </Text>
            </View>
          </View>

          {/* Share and Menu Buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Share Results Button */}
            <TouchableOpacity
              onPress={handleShareResults}
              style={{
                width: 40,
                height: 40,
                backgroundColor: '#EF4444',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Share2 color="#FFFFFF" size={20} strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Dropdown Menu Button */}
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                onPress={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <MoreVertical color="#111827" size={20} />
              </TouchableOpacity>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                {/* HIGH PRIORITY FIX #4: Backdrop to close dropdown on outside tap */}
                <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
                  <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <View style={{
                  position: 'absolute',
                  right: 0,
                  top: 48,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  width: 200,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 16,
                  elevation: 8,
                  overflow: 'hidden',
                  zIndex: 50,
                }}>
                <TouchableOpacity
                  style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                  onPress={() => {
                    setDropdownOpen(false);
                    setAddPlayerModalVisible(true);
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Add Player</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                  onPress={() => {
                    setDropdownOpen(false);
                    setManagePlayersModalVisible(true);
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Manage Players</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                  onPress={() => {
                    setDropdownOpen(false);
                    if (!currentRound || currentRound.matches.length === 0) {
                      Toast.show({
                        type: 'error',
                        text1: 'No Active Round',
                        text2: 'Please generate a round first',
                      });
                      return;
                    }
                    setSwitchPlayerModalVisible(true);
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Switch Player</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onPress={() => {
                    setDropdownOpen(false);
                    if (!currentRound || currentRound.matches.length === 0 || !algorithm) {
                      Toast.show({
                        type: 'error',
                        text1: 'No Active Round',
                        text2: 'Please generate a round first',
                      });
                      return;
                    }
                    handleRegenerateRound();
                  }}
                  disabled={regenerateRoundMutation.isPending}
                >
                  {regenerateRoundMutation.isPending ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <RefreshCw color="#EF4444" size={16} />
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>Regenerate Round</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                  onPress={() => { setDropdownOpen(false); Toast.show({ type: 'info', text1: 'Coming soon' }); }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Share Session</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                  onPress={() => { setDropdownOpen(false); Toast.show({ type: 'info', text1: 'Coming soon' }); }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Session Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  onPress={() => {
                    setCompactMode(!compactMode);
                    Toast.show({
                      type: 'success',
                      text1: compactMode ? 'Standard view enabled' : 'Compact view enabled'
                    });
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Compact View</Text>
                  <View style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: compactMode ? '#EF4444' : '#E5E7EB',
                    padding: 2,
                    justifyContent: 'center',
                  }}>
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#FFFFFF',
                      transform: [{ translateX: compactMode ? 20 : 0 }],
                    }} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                  onPress={() => { setDropdownOpen(false); Toast.show({ type: 'info', text1: 'Coming soon' }); }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>End Session</Text>
                </TouchableOpacity>
              </View>
              </>
            )}
            </View>
          </View>
        </View>
      </View>

      {/* Swipeable Tab Content */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={currentTabIndex}
        onPageSelected={(e) => {
          const newIndex = e.nativeEvent.position;
          const newTab = tabs[newIndex];
          setTab(newTab);

          // Haptic feedback on tab change
          if (!reduceAnimation) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
        onPageScroll={(e) => {
          // Update tab position for animated indicator
          tabPosition.value = e.nativeEvent.position + e.nativeEvent.offset;
        }}
      >
        {/* HIGH PRIORITY FIX #10: Wrap lazy-loaded tabs in ErrorBoundary + Suspense */}
        {/* Rounds Tab */}
        <View key="rounds" style={{ flex: 1 }}>
          <ScrollView className="flex-1 px-3 pt-3" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            <LazyLoadErrorBoundary>
              <Suspense fallback={
                <View className="flex-1 items-center justify-center py-12">
                  <ActivityIndicator size="large" color="#EF4444" />
                  <Text className="text-gray-600 mt-4">Loading...</Text>
                </View>
              }>
                <RoundsTab
                  currentRound={currentRound}
                  currentRoundIndex={currentRoundIndex}
                  allRounds={allRounds}
                  hasMatchesStarted={hasMatchesStarted}
                  session={session}
                  players={players}
                  algorithm={algorithm}
                  algorithmError={algorithmError}
                  onRetryAlgorithm={initializeAlgorithm}
                  sessionId={id}
                  onRoundChange={handleRoundChange}
                  compactMode={compactMode}
                  onSwitchPlayerPress={() => setSwitchPlayerModalVisible(true)}
                />
              </Suspense>
            </LazyLoadErrorBoundary>
          </ScrollView>
        </View>

        {/* Leaderboard Tab */}
        <View key="leaderboard" style={{ flex: 1, paddingHorizontal: 12, paddingTop: 12 }}>
          <LazyLoadErrorBoundary>
            <Suspense fallback={
              <View className="flex-1 items-center justify-center py-12">
                <ActivityIndicator size="large" color="#EF4444" />
                <Text className="text-gray-600 mt-4">Loading...</Text>
              </View>
            }>
              <LeaderboardTab
                players={sortedPlayers}
                sortBy={sortBy}
                onSortChange={setSortBy}
                session={session}
                sessionId={id}
                allRounds={allRounds}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        </View>

        {/* Statistics Tab */}
        <View key="statistics" style={{ flex: 1 }}>
          <ScrollView className="flex-1 px-3 pt-3" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            <LazyLoadErrorBoundary>
              <Suspense fallback={
                <View className="flex-1 items-center justify-center py-12">
                  <ActivityIndicator size="large" color="#EF4444" />
                  <Text className="text-gray-600 mt-4">Loading...</Text>
                </View>
              }>
                <StatisticsTab
                  players={recalculatedPlayers}
                  allRounds={allRounds}
                />
              </Suspense>
            </LazyLoadErrorBoundary>
          </ScrollView>
        </View>

        {/* History Tab */}
        <View key="history" style={{ flex: 1 }}>
          <ScrollView className="flex-1 px-3 pt-3" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            <LazyLoadErrorBoundary>
              <Suspense fallback={
                <View className="flex-1 items-center justify-center py-12">
                  <ActivityIndicator size="large" color="#EF4444" />
                  <Text className="text-gray-600 mt-4">Loading...</Text>
                </View>
              }>
                <EventHistoryTab
                  events={eventHistory}
                  sessionName={session?.name}
                />
              </Suspense>
            </LazyLoadErrorBoundary>
          </ScrollView>
        </View>
      </PagerView>

      {/* Tab Bar - Full Width at Bottom with Animated Indicator */}
      <TabBarWithIndicator
        tabs={tabs}
        currentTab={tab}
        tabPosition={tabPosition}
        onTabPress={(newTab) => {
          const newIndex = tabs.indexOf(newTab);
          pagerRef.current?.setPage(newIndex);
          setTab(newTab);
        }}
        insets={insets}
      />

      {/* Add Player Modal */}
      <AddPlayerModal
        visible={addPlayerModalVisible}
        onClose={() => setAddPlayerModalVisible(false)}
        onAddPlayer={handleAddPlayer}
        existingPlayers={players}
      />

      {/* Manage Players Modal */}
      <ManagePlayersModal
        visible={managePlayersModalVisible}
        onClose={() => setManagePlayersModalVisible(false)}
        players={players}
        onRemovePlayer={handleRemovePlayer}
        onChangeStatus={handleChangeStatus}
        onReassignPlayer={handleReassignPlayer}
      />

      {/* Switch Player Modal */}
      <SwitchPlayerModal
        visible={switchPlayerModalVisible}
        onClose={() => setSwitchPlayerModalVisible(false)}
        matches={currentRound?.matches || []}
        allPlayers={players}
        onSwitch={handleSwitchPlayer}
      />

      {/* Share Results Modal */}
      <ShareResultsModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        sessionId={id}
        sessionName={session?.name || 'Game Session'}
      />
    </View>
  );
}

// Animated Tab Bar Component
interface TabBarWithIndicatorProps {
  tabs: Tab[];
  currentTab: Tab;
  tabPosition: Animated.SharedValue<number>;
  onTabPress: (tab: Tab) => void;
  insets: { bottom: number };
}

function TabBarWithIndicator({ tabs, currentTab, tabPosition, onTabPress, insets }: TabBarWithIndicatorProps) {
  const getTabIcon = (tab: Tab) => {
    switch (tab) {
      case 'rounds': return Play;
      case 'leaderboard': return Trophy;
      case 'statistics': return BarChart3;
      case 'history': return History;
    }
  };

  const getTabLabel = (tab: Tab) => {
    return tab === 'leaderboard' ? 'Board' : tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
      paddingBottom: Platform.OS === 'ios' ? insets.bottom + 4 : 12,
      paddingTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 8,
    }}>
      {/* Tab Buttons */}
      <View style={{
        flexDirection: 'row',
        flex: 1,
        paddingHorizontal: 8,
      }}>
        {tabs.map((t) => {
          const isActive = currentTab === t;
          const Icon = getTabIcon(t);

          return (
            <TouchableOpacity
              key={t}
              onPress={() => onTabPress(t)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 8,
              }}
            >
              <Icon
                color={isActive ? '#EF4444' : '#6B7280'}
                size={24}
                strokeWidth={1.5}
              />
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: isActive ? '#EF4444' : '#6B7280',
                marginTop: 4,
                paddingBottom: 4,
              }}>
                {getTabLabel(t)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
