import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { Trophy, Zap, Users, TrendingUp, Swords } from 'lucide-react-native';
import { Player, Round } from '@courtster/shared';
import {
  findPlayerWithLongestStreak,
  findMVP,
  findPerfectPairs,
  findBiggestUpset,
  findTopRivalries,
} from '@courtster/shared';

interface StatisticsWidgetsProps {
  players: Player[];
  allRounds: Round[];
}

export function StatisticsWidgets({ players, allRounds }: StatisticsWidgetsProps) {
  // Calculate all widget data
  const winStreak = useMemo(
    () => findPlayerWithLongestStreak(players, allRounds),
    [players, allRounds]
  );

  const mvp = useMemo(() => findMVP(players, 2), [players]);

  const perfectPairs = useMemo(
    () => findPerfectPairs(players, allRounds, 2),
    [players, allRounds]
  );

  const biggestUpset = useMemo(
    () => findBiggestUpset(players, allRounds),
    [players, allRounds]
  );

  const rivalries = useMemo(
    () => findTopRivalries(players, allRounds, 2, 2),
    [players, allRounds]
  );

  return (
    <View style={{ gap: 12, marginBottom: 16 }}>
      {/* Win Streak Widget */}
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(239, 68, 68, 0.2)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Zap color="#EF4444" size={20} strokeWidth={2} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: '#111827',
              marginLeft: 8,
            }}
          >
            Win Streak
          </Text>
        </View>

        {winStreak && winStreak.currentStreak > 0 ? (
          <View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#EF4444',
                marginBottom: 4,
              }}
            >
              {winStreak.player.name}
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>
              {winStreak.currentStreak} {winStreak.currentStreak === 1 ? 'win' : 'wins'} in a row
            </Text>
          </View>
        ) : (
          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>No active win streaks</Text>
        )}
      </View>

      {/* MVP Widget */}
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(251, 191, 36, 0.2)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Trophy color="#F59E0B" size={20} strokeWidth={2} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: '#111827',
              marginLeft: 8,
            }}
          >
            MVP
          </Text>
        </View>

        {mvp ? (
          <View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#F59E0B',
                marginBottom: 4,
              }}
            >
              {mvp.player.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                {mvp.winRate.toFixed(0)}%
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>
                {mvp.wins}W-{mvp.losses}L-{mvp.ties}T
              </Text>
            </View>
          </View>
        ) : (
          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
            Not enough data (min 2 games)
          </Text>
        )}
      </View>

      {/* Perfect Pairs Widget */}
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(34, 197, 94, 0.2)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Users color="#10B981" size={20} strokeWidth={2} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: '#111827',
              marginLeft: 8,
            }}
          >
            Perfect Pairs
          </Text>
        </View>

        {perfectPairs.length > 0 ? (
          <View style={{ gap: 8 }}>
            {perfectPairs.slice(0, 3).map((pair, index) => (
              <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 }}>
                  {pair.player1.name} & {pair.player2.name}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981' }}>
                  {pair.gamesPlayed} {pair.gamesPlayed === 1 ? 'win' : 'wins'}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
            No partnerships with 100% win rate
          </Text>
        )}
      </View>

      {/* Biggest Upset Widget */}
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(168, 85, 247, 0.2)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TrendingUp color="#A855F7" size={20} strokeWidth={2} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: '#111827',
              marginLeft: 8,
            }}
          >
            Biggest Upset
          </Text>
        </View>

        {biggestUpset ? (
          <View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 4,
              }}
            >
              {biggestUpset.winner.name} beat {biggestUpset.loser.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#A855F7' }}>
                {biggestUpset.winnerScore}-{biggestUpset.loserScore}
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280' }}>
                Rating diff: {biggestUpset.ratingDifference.toFixed(1)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>No upsets yet</Text>
        )}
      </View>

      {/* Rivalry Widget */}
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(239, 68, 68, 0.2)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Swords color="#EF4444" size={20} strokeWidth={2} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: '#111827',
              marginLeft: 8,
            }}
          >
            Top Rivalries
          </Text>
        </View>

        {rivalries.length > 0 ? (
          <View style={{ gap: 12 }}>
            {rivalries.map((rivalry, index) => (
              <View key={index}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 }}>
                    {rivalry.player1.name} vs {rivalry.player2.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>
                    {rivalry.matchesPlayed} {rivalry.matchesPlayed === 1 ? 'match' : 'matches'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <View style={{ flex: 1, backgroundColor: rivalry.player1Wins > rivalry.player2Wins ? 'rgba(239, 68, 68, 0.2)' : 'rgba(229, 231, 235, 0.5)', borderRadius: 8, padding: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#111827', textAlign: 'center' }}>
                      {rivalry.player1Wins}W
                    </Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(229, 231, 235, 0.5)', borderRadius: 8, padding: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', textAlign: 'center' }}>
                      {rivalry.ties}T
                    </Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: rivalry.player2Wins > rivalry.player1Wins ? 'rgba(239, 68, 68, 0.2)' : 'rgba(229, 231, 235, 0.5)', borderRadius: 8, padding: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#111827', textAlign: 'center' }}>
                      {rivalry.player2Wins}W
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
            Not enough matchups (min 2 matches)
          </Text>
        )}
      </View>
    </View>
  );
}
