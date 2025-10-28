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
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    <View className="flex-1 bg-gray-50">
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Background Bubbles */}
      <View className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left - Rose */}
        <View className="absolute rounded-full" style={{ width: 380, height: 380, top: -100, left: -120, backgroundColor: '#FCE4EC', opacity: 0.3 }} />
        {/* Top right - Slate blue */}
        <View className="absolute rounded-full" style={{ width: 320, height: 320, top: 60, right: -100, backgroundColor: '#E2E8F0', opacity: 0.35 }} />
        {/* Middle left - Soft purple */}
        <View className="absolute rounded-full" style={{ width: 280, height: 280, top: 400, left: -80, backgroundColor: '#F3E8FF', opacity: 0.25 }} />
        {/* Middle right - Light peach */}
        <View className="absolute rounded-full" style={{ width: 240, height: 240, top: 500, right: -60, backgroundColor: '#FED7AA', opacity: 0.2 }} />
        {/* Bottom left - Light cyan */}
        <View className="absolute rounded-full" style={{ width: 300, height: 300, bottom: -100, left: -80, backgroundColor: '#CFFAFE', opacity: 0.3 }} />
        {/* Bottom right - Soft grey */}
        <View className="absolute rounded-full" style={{ width: 260, height: 260, bottom: 150, right: -70, backgroundColor: '#F5F5F5', opacity: 0.35 }} />
      </View>

      {/* iOS 18 Style Header */}
      <View style={{
        paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) + 16 : 20,
        paddingBottom: 16,
        paddingHorizontal: 16,
        ...(Platform.OS === 'ios' && {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }),
      }}>
        {Platform.OS === 'ios' ? (
          <>
            <BlurView intensity={80} tint="light" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)' }} />
          </>
        ) : (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF' }} />
        )}

        <View className="flex-row items-center justify-between" style={{ position: 'relative' }}>
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <ChevronLeft color="#111827" size={28} strokeWidth={2} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
                {session.name}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280', marginTop: 2 }}>
                {session.sport?.charAt(0).toUpperCase()}{session.sport?.slice(1)} • {session.type?.charAt(0).toUpperCase()}{session.type?.slice(1)} • R{currentRoundIndex + 1}/{allRounds.length || 1}
              </Text>
            </View>
          </View>

          {/* Dropdown Menu Button */}
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              onPress={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: 36,
                height: 36,
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.4)',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MoreVertical color="#4B5563" size={18} />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <View style={{
                position: 'absolute',
                right: 0,
                top: 45,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 16,
                width: 200,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
                overflow: 'hidden',
                zIndex: 50,
              }}>
                <TouchableOpacity
                  style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(229, 231, 235, 0.5)' }}
                  onPress={() => { setDropdownOpen(false); Toast.show({ type: 'info', text1: 'Coming soon' }); }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#374151' }}>Share Session</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(229, 231, 235, 0.5)' }}
                  onPress={() => { setDropdownOpen(false); Toast.show({ type: 'info', text1: 'Coming soon' }); }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#374151' }}>Session Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 16, paddingVertical: 14 }}
                  onPress={() => { setDropdownOpen(false); Toast.show({ type: 'info', text1: 'Coming soon' }); }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#EF4444' }}>End Session</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 120 }}>
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
          />
        )}
      </ScrollView>

      {/* Tab Bar - Full Width at Bottom (Navigation Bar Style) */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        paddingBottom: Platform.OS === 'ios' ? insets.bottom + 4 : 20,
        paddingTop: 4,
        elevation: 0,
        ...(Platform.OS === 'ios' && {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }),
      }}>
        {Platform.OS === 'ios' ? (
          <>
            <BlurView intensity={80} tint="light" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)' }} />
          </>
        ) : (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF' }} />
        )}

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
                onPress={() => {
                  if (t !== 'rounds') {
                    Toast.show({ type: 'info', text1: 'Coming Soon', text2: `${t.charAt(0).toUpperCase()}${t.slice(1)} tab will be available soon!` });
                  } else {
                    setTab(t);
                  }
                }}
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
    </View>
  );
}
