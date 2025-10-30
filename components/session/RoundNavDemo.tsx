import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ChevronLeft, ChevronRight, Circle, CheckCircle2, Users } from 'lucide-react-native';

/**
 * Demo component showing 4 different round navigation styles + 4 match card styles
 * This is for visual comparison - user will choose one to implement
 */
export default function RoundNavDemo() {
  const currentRound = 2;
  const totalRounds = 5;

  // Sample match data
  const sampleMatch = {
    court: 1,
    team1: ['Alice Johnson', 'Bob Smith'],
    team2: ['Charlie Davis', 'Diana Wilson'],
    team1Score: 6,
    team2Score: 4,
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, gap: 32 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
          Round Navigation Styles
        </Text>

        {/* Style 1: Current - Compact Centered */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Style 1: Current (Compact Centered)
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <ChevronLeft color="#111827" size={20} />
            </TouchableOpacity>

            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 24,
              minWidth: 180,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', letterSpacing: 0.5 }}>
                ROUND {currentRound} OF {totalRounds}
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <ChevronRight color="#111827" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Style 2: Full Width Progress Bar */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Style 2: Full Width with Progress Bar
          </Text>
          <View style={{ gap: 8 }}>
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <TouchableOpacity style={{ padding: 4 }}>
                  <ChevronLeft color="#111827" size={20} />
                </TouchableOpacity>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', letterSpacing: 0.5 }}>
                  ROUND {currentRound} OF {totalRounds}
                </Text>
                <TouchableOpacity style={{ padding: 4 }}>
                  <ChevronRight color="#111827" size={20} />
                </TouchableOpacity>
              </View>

              {/* Progress bar */}
              <View style={{ height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                <View style={{
                  height: '100%',
                  width: `${(currentRound / totalRounds) * 100}%`,
                  backgroundColor: '#EF4444',
                  borderRadius: 2,
                }} />
              </View>
            </View>
          </View>
        </View>

        {/* Style 3: Minimal with Pagination Dots */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Style 3: Minimal with Dots
          </Text>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity style={{ padding: 4 }}>
                <ChevronLeft color="#111827" size={20} />
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {Array.from({ length: totalRounds }).map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: index === currentRound - 1 ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: index === currentRound - 1 ? '#EF4444' : index < currentRound - 1 ? '#10B981' : '#E5E7EB',
                    }}
                  />
                ))}
              </View>

              <TouchableOpacity style={{ padding: 4 }}>
                <ChevronRight color="#111827" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Style 4: Segmented Control (iOS Style) */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Style 4: Segmented Control (iOS Style)
          </Text>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#F3F4F6',
              borderRadius: 12,
              padding: 4,
            }}>
              <TouchableOpacity style={{ padding: 8, flex: 0 }}>
                <ChevronLeft color="#111827" size={18} />
              </TouchableOpacity>

              <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
                {Array.from({ length: totalRounds }).map((_, index) => {
                  const isActive = index === currentRound - 1;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                        alignItems: 'center',
                        shadowColor: isActive ? '#000' : 'transparent',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isActive ? 0.1 : 0,
                        shadowRadius: 3,
                        elevation: isActive ? 2 : 0,
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontWeight: isActive ? '700' : '600',
                        color: isActive ? '#111827' : '#6B7280',
                      }}>
                        {index + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={{ padding: 8, flex: 0 }}>
                <ChevronRight color="#111827" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 2, backgroundColor: '#E5E7EB', marginVertical: 16 }} />

        {/* MATCH CARD STYLES */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
          Match Card Styles
        </Text>

        {/* Match Card Style 1: Current - Horizontal Teams with VS Badge */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Card 1: Current (Horizontal Teams)
          </Text>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Court Header */}
            <View style={{ marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 }}>
                COURT {sampleMatch.court}
              </Text>
              <CheckCircle2 color="#10B981" size={16} fill="#10B981" />
            </View>

            {/* Teams Container - Horizontal */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                  {sampleMatch.team1[0]}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  {sampleMatch.team1[1]}
                </Text>
              </View>

              <View style={{ width: 40, height: 40, backgroundColor: '#FEE2E2', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', letterSpacing: 0.5 }}>VS</Text>
              </View>

              <View style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4, textAlign: 'right' }}>
                  {sampleMatch.team2[0]}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'right' }}>
                  {sampleMatch.team2[1]}
                </Text>
              </View>
            </View>

            {/* Scores */}
            <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 }}>
                SCORE
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <View style={{ width: 80, height: 56, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#10B981', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>{sampleMatch.team1Score}</Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#9CA3AF' }}>-</Text>
                <View style={{ width: 80, height: 56, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#10B981', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>{sampleMatch.team2Score}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Match Card Style 2: Vertical Stack with Inline Scores */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Card 2: Vertical Stack with Inline Scores
          </Text>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Court Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 }}>
                  COURT {sampleMatch.court}
                </Text>
                <CheckCircle2 color="#10B981" size={16} fill="#10B981" />
              </View>
              <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>COMPLETE</Text>
              </View>
            </View>

            {/* Team 1 with Score */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  {sampleMatch.team1[0]} & {sampleMatch.team1[1]}
                </Text>
              </View>
              <View style={{ width: 48, height: 48, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#10B981', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{sampleMatch.team1Score}</Text>
              </View>
            </View>

            {/* VS Divider */}
            <View style={{ alignItems: 'center', marginVertical: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 }}>VS</Text>
            </View>

            {/* Team 2 with Score */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                  {sampleMatch.team2[0]} & {sampleMatch.team2[1]}
                </Text>
              </View>
              <View style={{ width: 48, height: 48, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#10B981', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{sampleMatch.team2Score}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Match Card Style 3: Compact with Large Score Display */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Card 3: Compact with Large Score Display
          </Text>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Header Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 }}>
                COURT {sampleMatch.court}
              </Text>
              <CheckCircle2 color="#10B981" size={16} fill="#10B981" />
            </View>

            {/* Main Content - Teams and Score Side by Side */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {/* Teams */}
              <View style={{ flex: 1, gap: 12 }}>
                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#111827' }}>
                    {sampleMatch.team1[0]}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>
                    {sampleMatch.team1[1]}
                  </Text>
                </View>
                <View style={{ alignSelf: 'center', paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#9CA3AF' }}>VS</Text>
                </View>
                <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#111827' }}>
                    {sampleMatch.team2[0]}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>
                    {sampleMatch.team2[1]}
                  </Text>
                </View>
              </View>

              {/* Large Score Display */}
              <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16 }}>
                <Text style={{ fontSize: 32, fontWeight: '700', color: '#111827', lineHeight: 36 }}>
                  {sampleMatch.team1Score}
                </Text>
                <View style={{ width: 30, height: 2, backgroundColor: '#E5E7EB', marginVertical: 8 }} />
                <Text style={{ fontSize: 32, fontWeight: '700', color: '#111827', lineHeight: 36 }}>
                  {sampleMatch.team2Score}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* COMPACT LAYOUT VARIATIONS */}
        <View style={{ height: 2, backgroundColor: '#E5E7EB', marginVertical: 16 }} />

        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
          Compact Layout: [Team1] [score1] - [score2] [Team2]
        </Text>

        {/* Compact Layout 1: Single Row - All in One Line */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Layout 1: Single Row (Very Compact)
          </Text>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Court Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 }}>
                  COURT {sampleMatch.court}
                </Text>
                <CheckCircle2 color="#10B981" size={14} fill="#10B981" />
              </View>
            </View>

            {/* All in one row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Team 1 */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                  {sampleMatch.team1[0]} & {sampleMatch.team1[1]}
                </Text>
              </View>

              {/* Scores */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 48, height: 36, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{sampleMatch.team1Score}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#9CA3AF' }}>-</Text>
                <View style={{ width: 48, height: 36, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{sampleMatch.team2Score}</Text>
                </View>
              </View>

              {/* Team 2 */}
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                  {sampleMatch.team2[0]} & {sampleMatch.team2[1]}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Compact Layout 2: Two Lines per Team */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Layout 2: Two Lines Per Team
          </Text>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Court Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 }}>
                  COURT {sampleMatch.court}
                </Text>
                <CheckCircle2 color="#10B981" size={14} fill="#10B981" />
              </View>
            </View>

            {/* Single row with 2-line team names */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Team 1 - Two lines */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                  {sampleMatch.team1[0]}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                  {sampleMatch.team1[1]}
                </Text>
              </View>

              {/* Scores */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 52, height: 40, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{sampleMatch.team1Score}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#9CA3AF' }}>-</Text>
                <View style={{ width: 52, height: 40, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{sampleMatch.team2Score}</Text>
                </View>
              </View>

              {/* Team 2 - Two lines */}
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                  {sampleMatch.team2[0]}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                  {sampleMatch.team2[1]}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Compact Layout 3: Centered Scores with Background */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 }}>
            Layout 3: Highlighted Center Scores
          </Text>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Court Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 }}>
                  COURT {sampleMatch.court}
                </Text>
                <CheckCircle2 color="#10B981" size={14} fill="#10B981" />
              </View>
            </View>

            {/* Row with emphasized center scores */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Team 1 */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                  {sampleMatch.team1[0]}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                  {sampleMatch.team1[1]}
                </Text>
              </View>

              {/* Scores - Emphasized */}
              <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', minWidth: 28, textAlign: 'center' }}>{sampleMatch.team1Score}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#9CA3AF' }}>-</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', minWidth: 28, textAlign: 'center' }}>{sampleMatch.team2Score}</Text>
              </View>

              {/* Team 2 */}
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                  {sampleMatch.team2[0]}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                  {sampleMatch.team2[1]}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Design Notes */}
        <View style={{
          backgroundColor: '#FEF3C7',
          borderRadius: 12,
          padding: 16,
          marginTop: 16,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 8 }}>
            Navigation Design Notes:
          </Text>
          <Text style={{ fontSize: 13, color: '#78350F', lineHeight: 20, marginBottom: 12 }}>
            • Style 1: Clean, compact, easy to understand{'\n'}
            • Style 2: Shows progress, full width utilization{'\n'}
            • Style 3: Minimal, visual round completion{'\n'}
            • Style 4: Quick round switching, iOS native feel
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 8 }}>
            Match Card Design Notes:
          </Text>
          <Text style={{ fontSize: 13, color: '#78350F', lineHeight: 20 }}>
            • Card 1: Current design, spacious and clear{'\n'}
            • Card 2: Vertical layout, easy to scan{'\n'}
            • Card 3: Prominent score display{'\n'}
            • Card 4: Compact, fits more on screen
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
