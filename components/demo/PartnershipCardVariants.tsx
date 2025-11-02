import { View, Text, ScrollView } from 'react-native';
import { Users, TrendingUp, Award } from 'lucide-react-native';

// Sample data for demo
const samplePartnership = {
  player1: { id: '1', name: 'John Smith' },
  player2: { id: '2', name: 'Jane Doe' },
  roundsPlayed: 8,
  wins: 6,
  losses: 1,
  ties: 1,
  totalPoints: 72,
  winRate: 75.0,
  avgPointsPerRound: 9.0,
};

export function PartnershipCardVariants() {
  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
        Partnership Card Variants
      </Text>
      <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
        6 different designs for displaying partnership statistics
      </Text>

      {/* Variant 1: Current Design - Horizontal Stats */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 1: Current - Horizontal Stats
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
                {samplePartnership.player1.name} & {samplePartnership.player2.name}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                {samplePartnership.roundsPlayed} {samplePartnership.roundsPlayed === 1 ? 'round' : 'rounds'} together
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444' }}>
                {samplePartnership.winRate.toFixed(0)}%
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>win rate</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            <View>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>Record</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>
                {samplePartnership.wins}W-{samplePartnership.losses}L-{samplePartnership.ties}T
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>Points Scored</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{samplePartnership.totalPoints}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Variant 2: Icon Badge with Vertical Layout */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 2: Icon Badge with Vertical Stats
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
          {/* Header with icon */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#D1FAE5',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Users color="#10B981" size={20} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
                {samplePartnership.player1.name} & {samplePartnership.player2.name}
              </Text>
            </View>
          </View>

          {/* Win rate badge */}
          <View style={{
            backgroundColor: '#FEE2E2',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 }}>
              WIN RATE
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#EF4444' }}>
              {samplePartnership.winRate.toFixed(0)}%
            </Text>
          </View>

          {/* Stats grid */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>ROUNDS</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {samplePartnership.roundsPlayed}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>WINS</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#10B981', marginTop: 2 }}>
                {samplePartnership.wins}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>POINTS</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {samplePartnership.totalPoints}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Variant 3: Minimal with Large Win Percentage */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 3: Minimal with Large Percentage
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
          {/* Main percentage */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 48, fontWeight: '800', color: '#EF4444', lineHeight: 52 }}>
              {samplePartnership.winRate.toFixed(0)}%
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginTop: 4 }}>
              SUCCESS RATE
            </Text>
          </View>

          {/* Player names */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', textAlign: 'center' }}>
              {samplePartnership.player1.name}
            </Text>
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: 6,
            }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280' }}>+</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', textAlign: 'center' }}>
              {samplePartnership.player2.name}
            </Text>
          </View>

          {/* Bottom stats */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Rounds</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {samplePartnership.roundsPlayed}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Record</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {samplePartnership.wins}-{samplePartnership.losses}-{samplePartnership.ties}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Variant 4: Card with Progress Bar */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 4: Progress Bar Style
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
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
              {samplePartnership.player1.name} & {samplePartnership.player2.name}
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              {samplePartnership.roundsPlayed} rounds partnership
            </Text>
          </View>

          {/* Win rate progress bar */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF' }}>WIN RATE</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>
                {samplePartnership.winRate.toFixed(0)}%
              </Text>
            </View>
            <View style={{ height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
              <View
                style={{
                  width: `${samplePartnership.winRate}%`,
                  height: '100%',
                  backgroundColor: '#EF4444',
                }}
              />
            </View>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: '#FAFAFA', borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>Wins</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#10B981' }}>
                {samplePartnership.wins}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FAFAFA', borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>Losses</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>
                {samplePartnership.losses}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FAFAFA', borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>Points</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>
                {samplePartnership.totalPoints}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Variant 5: Two-Column Stats */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 5: Two-Column Layout
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
          {/* Header with badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 }}>
              {samplePartnership.player1.name} & {samplePartnership.player2.name}
            </Text>
            <View style={{
              backgroundColor: '#FEE2E2',
              borderRadius: 20,
              paddingVertical: 4,
              paddingHorizontal: 10,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>
                {samplePartnership.winRate.toFixed(0)}%
              </Text>
            </View>
          </View>

          {/* Two-column stats */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Left column */}
            <View style={{ flex: 1, gap: 10 }}>
              <View style={{ backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10 }}>
                <Text style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>Rounds Played</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                  {samplePartnership.roundsPlayed}
                </Text>
              </View>
              <View style={{ backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10 }}>
                <Text style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>Total Points</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                  {samplePartnership.totalPoints}
                </Text>
              </View>
            </View>

            {/* Right column */}
            <View style={{ flex: 1, gap: 10 }}>
              <View style={{ backgroundColor: '#D1FAE5', borderRadius: 10, padding: 10 }}>
                <Text style={{ fontSize: 10, color: '#059669', marginBottom: 4 }}>Wins</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#10B981' }}>
                  {samplePartnership.wins}
                </Text>
              </View>
              <View style={{ backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10 }}>
                <Text style={{ fontSize: 10, color: '#DC2626', marginBottom: 4 }}>Losses</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444' }}>
                  {samplePartnership.losses}
                </Text>
              </View>
            </View>
          </View>

          {/* Average points */}
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#6B7280' }}>
              Avg {samplePartnership.avgPointsPerRound.toFixed(1)} pts/round
            </Text>
          </View>
        </View>
      </View>

      {/* Variant 6: Premium Card with Gradient */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
          Variant 6: Premium Gradient Style
        </Text>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          {/* Top badge */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              backgroundColor: '#FEF2F2',
              borderRadius: 20,
              paddingVertical: 6,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: '#FEE2E2',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}>
              <Award color="#EF4444" size={14} strokeWidth={2.5} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', letterSpacing: 0.5 }}>
                TOP PARTNERSHIP
              </Text>
            </View>
          </View>

          {/* Player initials */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12, gap: 8 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#EF4444',
            }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#EF4444' }}>
                {samplePartnership.player1.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280' }}>+</Text>
            </View>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#DBEAFE',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#3B82F6',
            }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#3B82F6' }}>
                {samplePartnership.player2.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          </View>

          {/* Names */}
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 16 }}>
            {samplePartnership.player1.name} & {samplePartnership.player2.name}
          </Text>

          {/* Win rate showcase */}
          <View style={{ backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF', textAlign: 'center', marginBottom: 6 }}>
              Partnership Win Rate
            </Text>
            <Text style={{ fontSize: 40, fontWeight: '800', color: '#EF4444', textAlign: 'center', lineHeight: 44 }}>
              {samplePartnership.winRate.toFixed(0)}%
            </Text>
          </View>

          {/* Stats grid */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>ROUNDS</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {samplePartnership.roundsPlayed}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>RECORD</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {samplePartnership.wins}-{samplePartnership.losses}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 12, padding: 10 }}>
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>POINTS</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 }}>
                {samplePartnership.totalPoints}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
