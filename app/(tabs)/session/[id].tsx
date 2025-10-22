import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Share2, MoreVertical, Play, Trophy, BarChart3, History } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useTheme, getThemeColors } from '../../../contexts/ThemeContext';

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

  // State
  const [tab, setTab] = useState<Tab>('rounds');
  const [sortBy, setSortBy] = useState<SortBy>('points');
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [algorithm, setAlgorithm] = useState<MexicanoAlgorithm | null>(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

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
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: reduceAnimation ? colors.background : colors.backgroundSecondary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View
        className="px-6 pb-4"
        style={{
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingTop: Math.max(insets.top, 16) + 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <ChevronLeft color={colors.text} size={24} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text style={{ color: colors.text, fontSize: 20 * fontScale }} className="font-bold" numberOfLines={1}>
                {session.name}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 * fontScale }} className="mt-0.5">
                {session.sport} • {session.type} • Round {currentRoundIndex + 1}/{allRounds.length || 1}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            className="p-2"
            onPress={() => setSettingsModalVisible(true)}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Open session settings"
          >
            <MoreVertical color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync Indicator */}
      <SyncIndicator />

      {/* Tab Content */}
      <View className="flex-1 pb-24">
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
          <StatisticsTab players={players} allRounds={allRounds} />
        )}
        {tab === 'history' && (
          <EventHistoryTab eventHistory={eventHistory} />
        )}
      </View>

      {/* Floating Bottom Tab Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4"
        style={{
          paddingBottom: Math.max(insets.bottom, 8) + 8,
          elevation: 8,
        }}
      >
        <View
          className="rounded-3xl px-2 py-2.5"
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: isDark ? '#000' : '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
          }}
        >
          <View className="flex-row items-center justify-around">
            {(['rounds', 'leaderboard', 'statistics', 'history'] as Tab[]).map((t) => {
              const isActive = tab === t;
              const iconColor = isActive ? '#FFFFFF' : colors.textSecondary;
              const iconSize = 20;

              let Icon;
              switch (t) {
                case 'rounds':
                  Icon = Play;
                  break;
                case 'leaderboard':
                  Icon = Trophy;
                  break;
                case 'statistics':
                  Icon = BarChart3;
                  break;
                case 'history':
                  Icon = History;
                  break;
              }

              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTab(t)}
                  className="flex-1 items-center justify-center py-2.5 px-2 rounded-2xl"
                  style={{
                    backgroundColor: isActive ? colors.primary : 'transparent',
                  }}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${t} tab`}
                >
                  <Icon color={iconColor} size={iconSize} strokeWidth={2.5} />
                  <Text
                    style={{
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      fontSize: 12 * fontScale,
                    }}
                    className="font-semibold capitalize mt-1"
                    numberOfLines={1}
                  >
                    {t === 'leaderboard' ? 'Board' : t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Session Settings Modal */}
      <SessionSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
