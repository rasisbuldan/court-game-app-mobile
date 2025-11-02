import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useMemo, memo } from 'react';
import { Users, Target } from 'lucide-react-native';
import { Player, Round } from '@courtster/shared';
import { calculatePartnershipStats, calculateHeadToHeadStats } from '@courtster/shared';
import { StatisticsWidgets } from './widgets/StatisticsWidgets';

interface StatisticsTabProps {
  players: Player[];
  allRounds: Round[];
}

// PHASE 2 OPTIMIZATION: Memoize component to prevent unnecessary re-renders
export const StatisticsTab = memo(function StatisticsTab({ players, allRounds }: StatisticsTabProps) {
  const [tab, setTab] = useState<'partnerships' | 'headtohead'>('partnerships');

  // Calculate statistics
  const partnershipStats = useMemo(
    () => calculatePartnershipStats(players, allRounds),
    [players, allRounds]
  );

  const headToHeadStats = useMemo(
    () => calculateHeadToHeadStats(players, allRounds),
    [players, allRounds]
  );

  // Filter to show only top stats
  const topPartnerships = useMemo(() => {
    return partnershipStats
      .filter((stat) => stat.roundsPlayed >= 1)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 20);
  }, [partnershipStats]);

  const topHeadToHead = useMemo(() => {
    return headToHeadStats
      .filter((stat) => stat.totalMatches >= 1)
      .sort((a, b) => {
        const maxWinRateA = Math.max(a.winRate1, a.winRate2);
        const maxWinRateB = Math.max(b.winRate1, b.winRate2);
        return maxWinRateB - maxWinRateA;
      })
      .slice(0, 20);
  }, [headToHeadStats]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 16 }}
    >
      {/* Statistics Widgets */}
      <StatisticsWidgets players={players} allRounds={allRounds} />

      {/* Tab Selector */}
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: tab === 'partnerships' ? '#EF4444' : '#F3F4F6',
            }}
            onPress={() => setTab('partnerships')}
          >
            <Text
              style={{
                fontFamily: 'Inter',
                textAlign: 'center',
                fontWeight: '600',
                color: tab === 'partnerships' ? '#FFFFFF' : '#374151',
              }}
            >
              Partnerships
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: tab === 'headtohead' ? '#EF4444' : '#F3F4F6',
            }}
            onPress={() => setTab('headtohead')}
          >
            <Text
              style={{
                fontFamily: 'Inter',
                textAlign: 'center',
                fontWeight: '600',
                color: tab === 'headtohead' ? '#FFFFFF' : '#374151',
              }}
            >
              Head-to-Head
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {tab === 'partnerships' && (
        <View>
            {topPartnerships.length > 0 ? (
              topPartnerships.map((stat, index) => (
                <View
                  key={`${stat.player1.id}-${stat.player2.id}`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(229, 231, 235, 0.5)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#111827' }}>
                        {stat.player1.name} & {stat.player2.name}
                      </Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                        {stat.roundsPlayed} {stat.roundsPlayed === 1 ? 'round' : 'rounds'} together
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'Inter', fontSize: 18, fontWeight: '700', color: '#EF4444' }}>
                        {stat.winRate.toFixed(0)}%
                      </Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6B7280' }}>win rate</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                    <View>
                      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6B7280' }}>Record</Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '500', color: '#111827' }}>
                        {stat.wins}W-{stat.losses}L-{stat.ties}T
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6B7280' }}>Points Scored</Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '500', color: '#111827' }}>{stat.totalPoints}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
                <Users color="#9CA3AF" size={48} />
                <Text style={{ fontFamily: 'Inter', color: '#6B7280', marginTop: 16 }}>No partnership data yet</Text>
                <Text style={{ fontFamily: 'Inter', color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>Play some rounds to see stats</Text>
              </View>
            )}
          </View>
        )}

        {tab === 'headtohead' && (
          <View>
            {topHeadToHead.length > 0 ? (
              topHeadToHead.map((stat, index) => (
                <View
                  key={`${stat.player1.id}-${stat.player2.id}`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(229, 231, 235, 0.5)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '600', color: '#111827' }}>
                        {stat.player1.name}
                      </Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6B7280', marginTop: 2 }}>vs</Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '500', color: '#374151' }}>{stat.player2.name}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'Inter', fontSize: 18, fontWeight: '700', color: '#EF4444' }}>
                        {stat.winRate1.toFixed(0)}%
                      </Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6B7280' }}>win rate</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                    <View>
                      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6B7280' }}>Matchups</Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '500', color: '#111827' }}>
                        {stat.totalMatches}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6B7280' }}>Record</Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '500', color: '#111827' }}>
                        {stat.player1Wins}-{stat.player2Wins}-{stat.ties}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'Inter', fontSize: 12, color: '#6B7280' }}>Points</Text>
                      <Text style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: '500', color: '#111827' }}>{stat.player1Points + stat.player2Points}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
                <Target color="#9CA3AF" size={48} />
                <Text style={{ fontFamily: 'Inter', color: '#6B7280', marginTop: 16 }}>No head-to-head data yet</Text>
                <Text style={{ fontFamily: 'Inter', color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>Play some rounds to see stats</Text>
              </View>
            )}
          </View>
        )}
    </ScrollView>
  );
});
