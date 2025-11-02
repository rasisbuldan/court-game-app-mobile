import { View, Text, ScrollView } from 'react-native';

// Sample data for demo
const sampleStat = {
  player1: { id: '1', name: 'John Smith' },
  player2: { id: '2', name: 'Jane Doe' },
  player1Wins: 5,
  player2Wins: 3,
  ties: 1,
  totalMatches: 9,
  player1Points: 45,
  player2Points: 38,
  winRate1: 55.6,
  winRate2: 33.3,
};

export function HeadToHeadCardVariants() {
  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
        Head-to-Head Card Variants
      </Text>
      <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
        7 different designs for displaying head-to-head matchup statistics
      </Text>

      {/* Variant 1: Current Design - Vertical Layout */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 1: Current - Vertical Stack
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            borderRadius: 16,
            padding: 16,
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
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                {sampleStat.player1.name}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>vs</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{sampleStat.player2.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444' }}>
                {sampleStat.winRate1.toFixed(0)}%
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>win rate</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            <View>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>Matchups</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
                {sampleStat.totalMatches}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>Record</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
                {sampleStat.player1Wins}-{sampleStat.player2Wins}-{sampleStat.ties}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>Points</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{sampleStat.player1Points + sampleStat.player2Points}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Variant 2: Side-by-Side Comparison */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 2: Side-by-Side Comparison
        </Text>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF' }}>
              {sampleStat.totalMatches} MATCHUPS
            </Text>
          </View>

          {/* Two columns */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Player 1 */}
            <View style={{ flex: 1, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
                {sampleStat.player1.name}
              </Text>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Win Rate</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>
                    {sampleStat.winRate1.toFixed(0)}%
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Wins</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
                    {sampleStat.player1Wins}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Points</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
                    {sampleStat.player1Points}
                  </Text>
                </View>
              </View>
            </View>

            {/* VS Divider */}
            <View style={{ justifyContent: 'center', alignItems: 'center', width: 40 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280' }}>VS</Text>
              </View>
            </View>

            {/* Player 2 */}
            <View style={{ flex: 1, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
                {sampleStat.player2.name}
              </Text>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Win Rate</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#3B82F6' }}>
                    {sampleStat.winRate2.toFixed(0)}%
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Wins</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
                    {sampleStat.player2Wins}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Points</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
                    {sampleStat.player2Points}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Ties */}
          {sampleStat.ties > 0 && (
            <View style={{ marginTop: 12, padding: 8, backgroundColor: '#FAFAFA', borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                {sampleStat.ties} {sampleStat.ties === 1 ? 'tie' : 'ties'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Variant 3: Horizontal Bar with Winner Highlight */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 3: Horizontal Bar with Winner
        </Text>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Players */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 }}>
              {sampleStat.player1.name}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#9CA3AF', paddingHorizontal: 12 }}>
              vs
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', flex: 1, textAlign: 'right' }}>
              {sampleStat.player2.name}
            </Text>
          </View>

          {/* Win bar */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', height: 32, borderRadius: 8, overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
              <View
                style={{
                  flex: sampleStat.player1Wins,
                  backgroundColor: '#EF4444',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                  {sampleStat.player1Wins}
                </Text>
              </View>
              {sampleStat.ties > 0 && (
                <View
                  style={{
                    flex: sampleStat.ties,
                    backgroundColor: '#D1D5DB',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>
                    {sampleStat.ties}
                  </Text>
                </View>
              )}
              <View
                style={{
                  flex: sampleStat.player2Wins,
                  backgroundColor: '#3B82F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                  {sampleStat.player2Wins}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>MATCHUPS</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{sampleStat.totalMatches}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>WIN RATE</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>
                {sampleStat.winRate1.toFixed(0)}%
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>TOTAL PTS</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                {sampleStat.player1Points + sampleStat.player2Points}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Variant 4: Minimal with Large Score */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 4: Minimal with Focus on Score
        </Text>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 20,
            borderWidth: 2,
            borderColor: '#F3F4F6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          {/* Main score */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 36, fontWeight: '800', color: '#EF4444' }}>
                {sampleStat.player1Wins}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginTop: 4 }}>
                WINS
              </Text>
            </View>
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#D1D5DB' }}>-</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 36, fontWeight: '800', color: '#3B82F6' }}>
                {sampleStat.player2Wins}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginTop: 4 }}>
                WINS
              </Text>
            </View>
          </View>

          {/* Player names */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 }}>
              {sampleStat.player1.name}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#D1D5DB', paddingHorizontal: 8 }}>VS</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'right' }}>
              {sampleStat.player2.name}
            </Text>
          </View>

          {/* Small stats */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: '#FAFAFA', borderRadius: 10, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Matchups</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {sampleStat.totalMatches}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FAFAFA', borderRadius: 10, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Ties</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {sampleStat.ties}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FAFAFA', borderRadius: 10, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Total Pts</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {sampleStat.player1Points + sampleStat.player2Points}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Variant 5: Compact Score Card */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 5: Compact Score Card
        </Text>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Players and Score in One Line */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
                {sampleStat.player1.name}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#EF4444' }}>
                {sampleStat.player1Wins}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#D1D5DB' }}>:</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#3B82F6' }}>
                {sampleStat.player2Wins}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
                {sampleStat.player2.name}
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>MATCHES</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {sampleStat.totalMatches}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>TIES</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {sampleStat.ties}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>WIN%</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444', marginTop: 2 }}>
                {sampleStat.winRate1.toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Variant 6: Timeline Style */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 6: Timeline Style with Progress Bar
        </Text>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Header with total matches */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 }}>
              RIVALRY SERIES
            </Text>
            <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
              {sampleStat.totalMatches} total matchups
            </Text>
          </View>

          {/* Players with win counts */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
                {sampleStat.player1.name}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
                {sampleStat.player2.name}
              </Text>
            </View>

            {/* Progress bar */}
            <View style={{ height: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F4F6', flexDirection: 'row' }}>
              <View
                style={{
                  width: `${(sampleStat.player1Wins / sampleStat.totalMatches) * 100}%`,
                  backgroundColor: '#EF4444',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  paddingLeft: 8,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                  {sampleStat.player1Wins}W
                </Text>
              </View>
              <View
                style={{
                  width: `${(sampleStat.player2Wins / sampleStat.totalMatches) * 100}%`,
                  backgroundColor: '#3B82F6',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  paddingRight: 8,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                  {sampleStat.player2Wins}W
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom stats */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Win Rate</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#EF4444', marginTop: 2 }}>
                {sampleStat.winRate1.toFixed(0)}%
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Ties</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#6B7280', marginTop: 2 }}>
                {sampleStat.ties}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Win Rate</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#3B82F6', marginTop: 2 }}>
                {sampleStat.winRate2.toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Variant 7: Gradient Badge Style */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 7: Gradient Badge Style
        </Text>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          {/* Header with badge */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              backgroundColor: '#FEF2F2',
              borderRadius: 20,
              paddingVertical: 6,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: '#FEE2E2',
            }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', letterSpacing: 0.5 }}>
                HEAD TO HEAD
              </Text>
            </View>
          </View>

          {/* Player cards side by side */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            {/* Player 1 Card */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                borderWidth: 3,
                borderColor: '#EF4444',
              }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#EF4444' }}>
                  {sampleStat.player1.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', textAlign: 'center' }}>
                {sampleStat.player1.name}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#EF4444', marginTop: 4 }}>
                {sampleStat.player1Wins}
              </Text>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>wins</Text>
            </View>

            {/* VS Badge */}
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#E5E7EB',
              }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#6B7280' }}>VS</Text>
              </View>
            </View>

            {/* Player 2 Card */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#DBEAFE',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                borderWidth: 3,
                borderColor: '#3B82F6',
              }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#3B82F6' }}>
                  {sampleStat.player2.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', textAlign: 'center' }}>
                {sampleStat.player2.name}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#3B82F6', marginTop: 4 }}>
                {sampleStat.player2Wins}
              </Text>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>wins</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, gap: 12 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>MATCHES</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {sampleStat.totalMatches}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>TIES</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {sampleStat.ties}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>POINTS</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {sampleStat.player1Points + sampleStat.player2Points}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
