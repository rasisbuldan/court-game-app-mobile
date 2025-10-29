import { View, Text, ScrollView, TouchableOpacity } from 'react';
import { useState, useMemo } from 'react';
import { Users, Target } from 'lucide-react-native';
import { Player, Round } from '@courtster/shared';
import { calculatePartnershipStats, calculateHeadToHeadStats } from '@courtster/shared';
import { StatisticsWidgets } from './widgets/StatisticsWidgets';

interface StatisticsTabProps {
  players: Player[];
  allRounds: Round[];
}

export function StatisticsTab({ players, allRounds }: StatisticsTabProps) {
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
      .filter((stat) => stat.matchesPlayed >= 1)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 20);
  }, [headToHeadStats]);

  return (
    <View className="flex-1">
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
        <View className="flex-row gap-2">
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

      <View className="flex-1">
        {tab === 'partnerships' && (
          <View>
            {topPartnerships.length > 0 ? (
              topPartnerships.map((stat, index) => (
                <View
                  key={`${stat.player1Id}-${stat.player2Id}`}
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
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900">
                        {stat.player1Name} & {stat.player2Name}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {stat.roundsPlayed} {stat.roundsPlayed === 1 ? 'round' : 'rounds'} together
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444' }}>
                        {(stat.winRate * 100).toFixed(0)}%
                      </Text>
                      <Text className="text-xs text-gray-500">win rate</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View>
                      <Text className="text-xs text-gray-500">Record</Text>
                      <Text className="text-sm font-medium text-gray-900">
                        {stat.wins}W-{stat.losses}L-{stat.ties}T
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-gray-500">Points Scored</Text>
                      <Text className="text-sm font-medium text-gray-900">{stat.totalPoints}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="flex-1 items-center justify-center py-12">
                <Users color="#9CA3AF" size={48} />
                <Text className="text-gray-500 mt-4">No partnership data yet</Text>
                <Text className="text-gray-400 text-sm mt-1">Play some rounds to see stats</Text>
              </View>
            )}
          </View>
        )}

        {tab === 'headtohead' && (
          <View>
            {topHeadToHead.length > 0 ? (
              topHeadToHead.map((stat, index) => (
                <View
                  key={`${stat.player1Id}-${stat.player2Id}`}
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
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900">
                        {stat.player1Name}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-0.5">vs</Text>
                      <Text className="text-sm font-medium text-gray-700">{stat.player2Name}</Text>
                    </View>
                    <View className="items-end">
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444' }}>
                        {(stat.winRate * 100).toFixed(0)}%
                      </Text>
                      <Text className="text-xs text-gray-500">win rate</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View>
                      <Text className="text-xs text-gray-500">Matchups</Text>
                      <Text className="text-sm font-medium text-gray-900">
                        {stat.matchesPlayed}
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-xs text-gray-500">Record</Text>
                      <Text className="text-sm font-medium text-gray-900">
                        {stat.wins}-{stat.losses}-{stat.ties}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-gray-500">Points</Text>
                      <Text className="text-sm font-medium text-gray-900">{stat.totalPoints}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="flex-1 items-center justify-center py-12">
                <Target color="#9CA3AF" size={48} />
                <Text className="text-gray-500 mt-4">No head-to-head data yet</Text>
                <Text className="text-gray-400 text-sm mt-1">Play some rounds to see stats</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
