import { View, Text, ScrollView } from 'react-native';
import { Trophy, Medal, Award, TrendingUp, Target } from 'lucide-react-native';

// Sample data for demonstration
const samplePlayers = [
  { rank: 1, name: 'Alice Johnson', points: 42, wins: 8, losses: 2, ties: 0, winRate: 80, compensationPoints: 0 },
  { rank: 2, name: 'Bob Smith', points: 38, wins: 7, losses: 3, ties: 1, winRate: 70, compensationPoints: 2 },
  { rank: 3, name: 'Carol Davis', points: 35, wins: 6, losses: 4, ties: 1, winRate: 60, compensationPoints: 0 },
  { rank: 4, name: 'David Wilson', points: 32, wins: 5, losses: 5, ties: 2, winRate: 50, compensationPoints: 3 },
];

export default function LeaderboardLayoutDemo() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB', padding: 16 }}>
      {/* Layout 1: Compact with Horizontal Stats */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
          Layout 1: Compact Horizontal
        </Text>
        <View style={{ gap: 8 }}>
          {samplePlayers.map((player) => (
            <View
              key={player.rank}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Rank Badge */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: player.rank === 1 ? '#FEF3C7' : player.rank === 2 ? '#E5E7EB' : player.rank === 3 ? '#FED7AA' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: player.rank <= 3 ? '#92400E' : '#6B7280' }}>
                  {player.rank}
                </Text>
              </View>

              {/* Name */}
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{player.name}</Text>
              </View>

              {/* Stats */}
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 2 }}>PTS</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#EF4444' }}>{player.points}</Text>
                </View>
                <View style={{ width: 1, height: 20, backgroundColor: '#E5E7EB' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 2 }}>W-L</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>{player.wins}-{player.losses}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Layout 2: Card with Icon and Detailed Stats */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
          Layout 2: Detailed Card
        </Text>
        <View style={{ gap: 12 }}>
          {samplePlayers.map((player) => (
            <View
              key={player.rank}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                {/* Rank Icon */}
                <View style={{ marginRight: 12 }}>
                  {player.rank === 1 ? (
                    <Trophy color="#F59E0B" size={24} strokeWidth={2} />
                  ) : player.rank === 2 ? (
                    <Medal color="#9CA3AF" size={24} strokeWidth={2} />
                  ) : player.rank === 3 ? (
                    <Award color="#F97316" size={24} strokeWidth={2} />
                  ) : (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: '#F3F4F6',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280' }}>{player.rank}</Text>
                    </View>
                  )}
                </View>

                {/* Name */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{player.name}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF', marginTop: 2 }}>
                    Rank #{player.rank}
                  </Text>
                </View>

                {/* Points Badge */}
                <View
                  style={{
                    backgroundColor: '#FEE2E2',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444' }}>{player.points}</Text>
                </View>
              </View>

              {/* Stats Row */}
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 4 }}>WINS</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#10B981' }}>{player.wins}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 4 }}>LOSSES</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#EF4444' }}>{player.losses}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 4 }}>WIN %</Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280' }}>{player.winRate}%</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Layout 3: Minimal with Large Points */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
          Layout 3: Minimal Large Points
        </Text>
        <View style={{ gap: 8 }}>
          {samplePlayers.map((player) => (
            <View
              key={player.rank}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Left: Rank + Name */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#9CA3AF', marginRight: 12, width: 30 }}>
                  {player.rank}
                </Text>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{player.name}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF', marginTop: 2 }}>
                    {player.wins}W • {player.losses}L
                  </Text>
                </View>
              </View>

              {/* Right: Large Points */}
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#EF4444' }}>{player.points}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginTop: 2 }}>POINTS</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Layout 4: Podium Style with Progress Bar */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
          Layout 4: Progress Bar Style
        </Text>
        <View style={{ gap: 10 }}>
          {samplePlayers.map((player) => {
            const maxPoints = samplePlayers[0].points;
            const widthPercentage = (player.points / maxPoints) * 100;

            return (
              <View key={player.rank}>
                {/* Header Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#9CA3AF', width: 24 }}>
                    {player.rank}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' }}>
                    {player.name}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#EF4444' }}>
                    {player.points}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View
                  style={{
                    height: 8,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginLeft: 24,
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${widthPercentage}%`,
                      backgroundColor: player.rank === 1 ? '#EF4444' : player.rank === 2 ? '#F59E0B' : player.rank === 3 ? '#F97316' : '#9CA3AF',
                      borderRadius: 4,
                    }}
                  />
                </View>

                {/* Stats Below */}
                <View style={{ flexDirection: 'row', marginLeft: 24, marginTop: 4, gap: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#10B981' }}>
                    {player.wins}W
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#EF4444' }}>
                    {player.losses}L
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF' }}>
                    {player.winRate}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Layout 5: Badge Style with Compact Info */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
          Layout 5: Badge Compact
        </Text>
        <View style={{ gap: 8 }}>
          {samplePlayers.map((player) => (
            <View
              key={player.rank}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Rank Badge with Color */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: player.rank === 1 ? '#FEE2E2' : player.rank === 2 ? '#E5E7EB' : player.rank === 3 ? '#FED7AA' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                {player.rank <= 3 ? (
                  player.rank === 1 ? (
                    <Trophy color="#EF4444" size={20} strokeWidth={2.5} />
                  ) : player.rank === 2 ? (
                    <Medal color="#6B7280" size={20} strokeWidth={2.5} />
                  ) : (
                    <Award color="#F97316" size={20} strokeWidth={2.5} />
                  )
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#6B7280' }}>{player.rank}</Text>
                )}
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
                  {player.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Target color="#EF4444" size={12} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#EF4444' }}>
                      {player.points} pts
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#D1D5DB' }}>•</Text>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280' }}>
                    {player.wins}-{player.losses}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#D1D5DB' }}>•</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TrendingUp color="#10B981" size={12} />
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#10B981' }}>
                      {player.winRate}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Layout 6: Compact with W-L-T */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
          Layout 6: Compact with W-L-T
        </Text>
        <View style={{ gap: 8 }}>
          {samplePlayers.map((player) => (
            <View
              key={player.rank}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Rank Badge */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: player.rank === 1 ? '#FEF3C7' : player.rank === 2 ? '#E5E7EB' : player.rank === 3 ? '#FED7AA' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: player.rank <= 3 ? '#92400E' : '#6B7280' }}>
                  {player.rank}
                </Text>
              </View>

              {/* Name */}
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{player.name}</Text>
                {player.compensationPoints > 0 && (
                  <Text style={{ fontSize: 11, fontWeight: '500', color: '#F59E0B', marginTop: 2 }}>
                    +{player.compensationPoints} bonus
                  </Text>
                )}
              </View>

              {/* Stats */}
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 2 }}>PTS</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#EF4444' }}>{player.points}</Text>
                </View>
                <View style={{ width: 1, height: 20, backgroundColor: '#E5E7EB' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 2 }}>W-L-T</Text>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#10B981' }}>{player.wins}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#9CA3AF' }}>-</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>{player.losses}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#9CA3AF' }}>-</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280' }}>{player.ties}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Layout 7: Stacked with Compensation */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
          Layout 7: Stacked Info
        </Text>
        <View style={{ gap: 8 }}>
          {samplePlayers.map((player) => (
            <View
              key={player.rank}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Top Row: Rank + Name + Points */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: player.rank === 1 ? '#FEF3C7' : player.rank === 2 ? '#E5E7EB' : player.rank === 3 ? '#FED7AA' : '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: player.rank <= 3 ? '#92400E' : '#6B7280' }}>
                    {player.rank}
                  </Text>
                </View>

                <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' }}>{player.name}</Text>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444' }}>{player.points}</Text>
                  {player.compensationPoints > 0 && (
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#F59E0B' }}>
                      +{player.compensationPoints}
                    </Text>
                  )}
                </View>
              </View>

              {/* Bottom Row: Stats */}
              <View style={{
                flexDirection: 'row',
                backgroundColor: '#F9FAFB',
                borderRadius: 8,
                padding: 8,
                gap: 12,
              }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#9CA3AF', marginBottom: 2 }}>WINS</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981' }}>{player.wins}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#9CA3AF', marginBottom: 2 }}>LOSSES</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>{player.losses}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#9CA3AF', marginBottom: 2 }}>TIES</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>{player.ties}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Layout 8: Inline Detailed */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>
          Layout 8: Inline Detailed
        </Text>
        <View style={{ gap: 8 }}>
          {samplePlayers.map((player) => (
            <View
              key={player.rank}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Rank */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: player.rank === 1 ? '#FEF3C7' : player.rank === 2 ? '#E5E7EB' : player.rank === 3 ? '#FED7AA' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: player.rank <= 3 ? '#92400E' : '#6B7280' }}>
                  {player.rank}
                </Text>
              </View>

              {/* Name & Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                  {player.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {/* Points */}
                  <View style={{
                    backgroundColor: '#FEE2E2',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>
                      {player.points} pts
                    </Text>
                  </View>

                  {/* Compensation */}
                  {player.compensationPoints > 0 && (
                    <View style={{
                      backgroundColor: '#FEF3C7',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#F59E0B' }}>
                        +{player.compensationPoints}
                      </Text>
                    </View>
                  )}

                  {/* W-L-T */}
                  <View style={{
                    backgroundColor: '#F3F4F6',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>
                      {player.wins}W-{player.losses}L-{player.ties}T
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
