import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Share2, MoreVertical, Play, Trophy, BarChart3, History } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { supabase } from '../../../config/supabase';
import { MexicanoAlgorithm, Player, Round, Match } from '@courtster/shared';
import { useAuth } from '../../../hooks/useAuth';
import Toast from 'react-native-toast-message';

// Import tab components
import { RoundsTab } from '../../../components/session/RoundsTab';
import { LeaderboardTab } from '../../../components/session/LeaderboardTab';
import { StatisticsTab } from '../../../components/session/StatisticsTab';
import { EventHistoryTab } from '../../../components/session/EventHistoryTab';
import { SyncIndicator } from '../../../components/ui/SyncIndicator';
import { SessionSettingsModal } from '../../../components/ui/SessionSettingsModal';
import { OfflineIndicator } from '../../../components/ui/OfflineIndicator';
import { useTheme, getThemeColors } from '../../../contexts/ThemeContext';
import { AddPlayerModal } from '../../../components/session/AddPlayerModal';
import { ManagePlayersModal } from '../../../components/session/ManagePlayersModal';
import { SwitchPlayerModal } from '../../../components/session/SwitchPlayerModal';

type Tab = 'rounds' | 'leaderboard' | 'statistics' | 'history';
type SortBy = 'points' | 'wins';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { isDark, fontScale, reduceAnimation } = useTheme();
  const colors = getThemeColors(isDark);

  // Helper function to format scoring mode
  const getScoringModeText = (session: any) => {
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
  };

  // State
  const [tab, setTab] = useState<Tab>('rounds');
  const [sortBy, setSortBy] = useState<SortBy>('points');
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [algorithm, setAlgorithm] = useState<MexicanoAlgorithm | null>(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState(false);
  const [managePlayersModalVisible, setManagePlayersModalVisible] = useState(false);
  const [switchPlayerModalVisible, setSwitchPlayerModalVisible] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  // Fetch session data
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
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

      // Transform to Player type
      return data.map(p => ({
        id: p.id,
        name: p.name,
        rating: p.rating,
        playCount: p.play_count,
        sitCount: p.sit_count,
        consecutiveSits: p.consecutive_sits,
        consecutivePlays: p.consecutive_plays,
        status: p.status as any,
        totalPoints: p.total_points,
        wins: p.wins,
        losses: p.losses,
        ties: p.ties,
        skipRounds: p.skip_rounds || [],
        skipCount: p.skip_count || 0,
        compensationPoints: p.compensation_points || 0,
        gender: p.gender as any,
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
  const allRounds: Round[] = useMemo(() => {
    if (!session?.round_data) return [];
    try {
      return JSON.parse(session.round_data);
    } catch {
      return [];
    }
  }, [session?.round_data]);

  // Initialize algorithm when players are loaded
  useEffect(() => {
    if (players.length >= 4 && session) {
      try {
        const algo = new MexicanoAlgorithm(
          players,
          session.courts || 1,
          true,
          session.matchup_preference as any,
          session.type as any
        );
        setAlgorithm(algo);
      } catch (error) {
        console.error('Failed to initialize algorithm:', error);
      }
    }
  }, [players, session]);

  // Set current round index based on session
  useEffect(() => {
    if (session?.current_round !== undefined) {
      setCurrentRoundIndex(session.current_round);
    }
  }, [session?.current_round]);

  // Calculate player stats from rounds
  const calculatePlayerStatsFromRounds = useCallback(
    (playersData: Player[], rounds: Round[], sessionData: any): Player[] => {
      // Reset all stats
      const updatedPlayers = playersData.map((player) => ({
        ...player,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        playCount: 0,
        sitCount: 0,
        compensationPoints: 0,
      }));

      // Calculate base stats from rounds
      rounds.forEach((round) => {
        round.matches.forEach((match) => {
          if (match.team1Score !== undefined && match.team2Score !== undefined) {
            const team1Won = match.team1Score > match.team2Score;
            const team2Won = match.team2Score > match.team1Score;
            const isTie = match.team1Score === match.team2Score;

            // Update team 1 players
            match.team1.forEach((player) => {
              const playerIndex = updatedPlayers.findIndex((p) => p.id === player.id);
              if (playerIndex !== -1) {
                updatedPlayers[playerIndex].totalPoints += match.team1Score!;
                updatedPlayers[playerIndex].playCount++;

                if (team1Won) {
                  updatedPlayers[playerIndex].wins++;
                } else if (team2Won) {
                  updatedPlayers[playerIndex].losses++;
                } else if (isTie) {
                  updatedPlayers[playerIndex].ties++;
                }
              }
            });

            // Update team 2 players
            match.team2.forEach((player) => {
              const playerIndex = updatedPlayers.findIndex((p) => p.id === player.id);
              if (playerIndex !== -1) {
                updatedPlayers[playerIndex].totalPoints += match.team2Score!;
                updatedPlayers[playerIndex].playCount++;

                if (team2Won) {
                  updatedPlayers[playerIndex].wins++;
                } else if (team1Won) {
                  updatedPlayers[playerIndex].losses++;
                } else if (isTie) {
                  updatedPlayers[playerIndex].ties++;
                }
              }
            });
          }
        });

        // Count sitting players
        round.sittingPlayers.forEach((sittingPlayer) => {
          const playerIndex = updatedPlayers.findIndex((p) => p.id === sittingPlayer.id);
          if (playerIndex !== -1) {
            updatedPlayers[playerIndex].sitCount++;
          }
        });
      });

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

  // Sorted players with tiebreakers
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
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
  }, [players, sortBy]);

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
    onSuccess: () => {
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
    },
    onSuccess: () => {
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
      const { error } = await supabase
        .from('players')
        .update({ status: newStatus })
        .eq('id', playerId);

      if (error) throw error;

      const player = players.find(p => p.id === playerId);
      await supabase.from('event_history').insert({
        session_id: id,
        event_type: 'status_change',
        description: `${player?.name} status changed to ${newStatus}`,
        metadata: { player_id: playerId, new_status: newStatus },
      });
    },
    onSuccess: () => {
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

  // Switch player mutation
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
      // Get current match and old player
      const currentMatch = currentRound.matches[matchIndex];
      let oldPlayer: Player | undefined;

      switch (position) {
        case 'team1_0':
          oldPlayer = currentMatch.team1?.[0];
          break;
        case 'team1_1':
          oldPlayer = currentMatch.team1?.[1];
          break;
        case 'team2_0':
          oldPlayer = currentMatch.team2?.[0];
          break;
        case 'team2_1':
          oldPlayer = currentMatch.team2?.[1];
          break;
      }

      const newPlayer = players.find(p => p.id === newPlayerId);

      if (!oldPlayer || !newPlayer) {
        throw new Error('Player not found');
      }

      // Update rounds data with switched player
      const updatedRounds = [...allRounds];
      const round = updatedRounds[currentRoundIndex];

      // Check if newPlayer is currently playing (swap) or sitting (replace)
      const isSwap = round.matches.some(match =>
        match.team1?.some(p => p.id === newPlayer.id) ||
        match.team2?.some(p => p.id === newPlayer.id)
      );

      if (isSwap) {
        // Find where the newPlayer is currently playing
        let swapMatchIndex = -1;
        let swapPosition: 'team1_0' | 'team1_1' | 'team2_0' | 'team2_1' | null = null;

        round.matches.forEach((match, idx) => {
          if (match.team1?.[0]?.id === newPlayer.id) {
            swapMatchIndex = idx;
            swapPosition = 'team1_0';
          } else if (match.team1?.[1]?.id === newPlayer.id) {
            swapMatchIndex = idx;
            swapPosition = 'team1_1';
          } else if (match.team2?.[0]?.id === newPlayer.id) {
            swapMatchIndex = idx;
            swapPosition = 'team2_0';
          } else if (match.team2?.[1]?.id === newPlayer.id) {
            swapMatchIndex = idx;
            swapPosition = 'team2_1';
          }
        });

        if (swapMatchIndex !== -1 && swapPosition) {
          // Swap the two players
          // Put newPlayer in the original position
          switch (position) {
            case 'team1_0':
              round.matches[matchIndex].team1[0] = newPlayer;
              break;
            case 'team1_1':
              round.matches[matchIndex].team1[1] = newPlayer;
              break;
            case 'team2_0':
              round.matches[matchIndex].team2[0] = newPlayer;
              break;
            case 'team2_1':
              round.matches[matchIndex].team2[1] = newPlayer;
              break;
          }

          // Put oldPlayer in newPlayer's original position
          switch (swapPosition) {
            case 'team1_0':
              round.matches[swapMatchIndex].team1[0] = oldPlayer;
              break;
            case 'team1_1':
              round.matches[swapMatchIndex].team1[1] = oldPlayer;
              break;
            case 'team2_0':
              round.matches[swapMatchIndex].team2[0] = oldPlayer;
              break;
            case 'team2_1':
              round.matches[swapMatchIndex].team2[1] = oldPlayer;
              break;
          }
        }
      } else {
        // Replace with sitting player
        // Update the match with new player
        switch (position) {
          case 'team1_0':
            round.matches[matchIndex].team1[0] = newPlayer;
            break;
          case 'team1_1':
            round.matches[matchIndex].team1[1] = newPlayer;
            break;
          case 'team2_0':
            round.matches[matchIndex].team2[0] = newPlayer;
            break;
          case 'team2_1':
            round.matches[matchIndex].team2[1] = newPlayer;
            break;
        }

        // Update sitting players - remove new player, add old player
        round.sittingPlayers = round.sittingPlayers.filter(p => p.id !== newPlayer.id);
        round.sittingPlayers.push(oldPlayer);
      }

      // Save to database
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ round_data: JSON.stringify(updatedRounds) })
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
            )}
          </View>
        </View>
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1 px-3 pt-3" contentContainerStyle={{ paddingBottom: 120 }}>
        {tab === 'rounds' && (
          <RoundsTab
            currentRound={currentRound}
            currentRoundIndex={currentRoundIndex}
            allRounds={allRounds}
            hasMatchesStarted={hasMatchesStarted}
            session={session}
            players={players}
            algorithm={algorithm}
            sessionId={id}
            onRoundChange={setCurrentRoundIndex}
            compactMode={compactMode}
            onSwitchPlayerPress={() => setSwitchPlayerModalVisible(true)}
          />
        )}
        {tab === 'leaderboard' && (
          <LeaderboardTab
            players={sortedPlayers}
            sortBy={sortBy}
            onSortChange={setSortBy}
            session={session}
            sessionId={id}
            allRounds={allRounds}
          />
        )}
        {tab === 'statistics' && (
          <StatisticsTab
            players={players}
            allRounds={allRounds}
          />
        )}
        {tab === 'history' && (
          <EventHistoryTab
            events={eventHistory}
          />
        )}
      </ScrollView>

      {/* Tab Bar - Full Width at Bottom */}
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

        <View style={{
          flexDirection: 'row',
          flex: 1,
          paddingHorizontal: 8,
        }}>
          {(['rounds', 'leaderboard', 'statistics', 'history'] as Tab[]).map((t) => {
            const isActive = tab === t;
            let Icon;
            switch (t) {
              case 'rounds': Icon = Play; break;
              case 'leaderboard': Icon = Trophy; break;
              case 'statistics': Icon = BarChart3; break;
              case 'history': Icon = History; break;
            }

            return (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
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
                  {t === 'leaderboard' ? 'Board' : t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
    </View>
  );
}
