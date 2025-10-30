import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Users, MapPin, Calendar, Trophy, TrendingUp, Target, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Sample data for demonstration
const sampleSession = {
  name: 'Friday Night Padel',
  sport: 'Padel',
  type: 'Mexicano',
  courts: 3,
  date: '2025-01-30',
  playerCount: 12,
  currentRound: 4,
  totalRounds: 8,
  pointsPerMatch: 21,
  status: 'active',
};

const samplePlayers = [
  { id: '1', name: 'Alex Johnson', points: 63, wins: 3, losses: 0, ties: 0, rank: 1, status: 'active' },
  { id: '2', name: 'Maria Garcia', points: 58, wins: 2, losses: 1, ties: 0, rank: 2, status: 'active' },
  { id: '3', name: 'James Smith', points: 52, wins: 2, losses: 1, ties: 0, rank: 3, status: 'active' },
  { id: '4', name: 'Sophie Chen', points: 47, wins: 1, losses: 2, ties: 0, rank: 4, status: 'active' },
];

const sampleMatches = [
  { court: 1, team1: ['Alex J.', 'Maria G.'], team2: ['James S.', 'Sophie C.'], score1: 15, score2: 8 },
  { court: 2, team1: ['Emma W.', 'Lucas B.'], team2: ['Olivia M.', 'Noah R.'], score1: 12, score2: 21 },
  { court: 3, team1: ['Ava T.', 'Liam K.'], team2: ['Isabella P.', 'Ethan D.'], score1: 21, score2: 18 },
];

export default function SessionLayoutDemo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedLayout, setSelectedLayout] = useState<number>(1);

  // Layout 1: Card-Based with Hero Header
  const Layout1 = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Hero Header */}
      <View style={{
        backgroundColor: '#EF4444',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        padding: 24,
        paddingTop: 16,
      }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>
          {sampleSession.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MapPin color="#FFFFFF" size={16} strokeWidth={2} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>{sampleSession.courts} Courts</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Users color="#FFFFFF" size={16} strokeWidth={2} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>{sampleSession.playerCount} Players</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Calendar color="#FFFFFF" size={16} strokeWidth={2} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Jan 30, 2025</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFFFFF' }}>Round Progress</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>{sampleSession.currentRound}/{sampleSession.totalRounds}</Text>
          </View>
          <View style={{ height: 8, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{
              width: `${(sampleSession.currentRound / sampleSession.totalRounds) * 100}%`,
              height: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: 4,
            }} />
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#FEF3C7', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FDE68A' }}>
            <Trophy color="#F59E0B" size={24} strokeWidth={2} />
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#92400E', marginTop: 8 }}>63</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#92400E' }}>Top Score</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#DBEAFE', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#BFDBFE' }}>
            <TrendingUp color="#3B82F6" size={24} strokeWidth={2} />
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1E3A8A', marginTop: 8 }}>52</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E3A8A' }}>Avg Score</Text>
          </View>
        </View>

        {/* Current Matches */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Current Matches</Text>
          {sampleMatches.map((match) => (
            <View key={match.court} style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>COURT {match.court}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{match.team1.join(' & ')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: match.score1 > match.score2 ? '#10B981' : '#6B7280' }}>{match.score1}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF' }}>-</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: match.score2 > match.score1 ? '#10B981' : '#6B7280' }}>{match.score2}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>{match.team2.join(' & ')}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Top Players */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Top Players</Text>
          {samplePlayers.map((player, index) => (
            <View key={player.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: index === 0 ? '#FEF3C7' : index === 1 ? '#E0E7FF' : '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: index === 0 ? '#F59E0B' : index === 1 ? '#6366F1' : '#6B7280' }}>
                  {player.rank}
                </Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' }}>{player.name}</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#EF4444' }}>{player.points}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Layout 2: Minimalist Split View
  const Layout2 = () => (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Compact Header */}
      <View style={{ backgroundColor: '#FFFFFF', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
          {sampleSession.name}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280' }}>
          {sampleSession.sport} • {sampleSession.type} • Round {sampleSession.currentRound}/{sampleSession.totalRounds}
        </Text>
      </View>

      {/* Split Stats */}
      <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <View style={{ flex: 1, padding: 16, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#E5E7EB' }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#EF4444' }}>{sampleSession.playerCount}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 4 }}>Players</Text>
        </View>
        <View style={{ flex: 1, padding: 16, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#E5E7EB' }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#EF4444' }}>{sampleSession.courts}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 4 }}>Courts</Text>
        </View>
        <View style={{ flex: 1, padding: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#EF4444' }}>{sampleSession.currentRound}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 4 }}>Rounds</Text>
        </View>
      </View>

      {/* Matches List */}
      <View style={{ padding: 16, gap: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 }}>Live Matches</Text>
        {sampleMatches.map((match) => (
          <View key={match.court} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>COURT {match.court}</Text>
              <View style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>LIVE</Text>
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{match.team1.join(' & ')}</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: match.score1 > match.score2 ? '#10B981' : '#9CA3AF' }}>{match.score1}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{match.team2.join(' & ')}</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: match.score2 > match.score1 ? '#10B981' : '#9CA3AF' }}>{match.score2}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Leaderboard Preview */}
      <View style={{ padding: 16, paddingTop: 0 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Leaderboard</Text>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
          {samplePlayers.map((player, index) => (
            <View
              key={player.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderBottomWidth: index < samplePlayers.length - 1 ? 1 : 0,
                borderBottomColor: '#F3F4F6',
                backgroundColor: index === 0 ? '#FFFBEB' : '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#9CA3AF', width: 32 }}>{player.rank}</Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' }}>{player.name}</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#EF4444', marginRight: 8 }}>{player.points}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>{player.wins}-{player.losses}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Layout 3: Dashboard with Quick Stats
  const Layout3 = () => (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Gradient Header */}
      <View style={{
        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        backgroundColor: '#EF4444',
        padding: 20,
        paddingTop: 16,
      }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>
          {sampleSession.name}
        </Text>

        {/* Quick Stats Grid */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' }}>
            <Users color="#FFFFFF" size={18} strokeWidth={2.5} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 6 }}>{sampleSession.playerCount}</Text>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#FFFFFF', opacity: 0.9 }}>Players</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' }}>
            <MapPin color="#FFFFFF" size={18} strokeWidth={2.5} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 6 }}>{sampleSession.courts}</Text>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#FFFFFF', opacity: 0.9 }}>Courts</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' }}>
            <Clock color="#FFFFFF" size={18} strokeWidth={2.5} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 6 }}>{sampleSession.currentRound}</Text>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#FFFFFF', opacity: 0.9 }}>Round</Text>
          </View>
        </View>

        {/* Session Type Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>{sampleSession.sport}</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>{sampleSession.type}</Text>
          </View>
        </View>
      </View>

      {/* Content Sections */}
      <View style={{ padding: 16, gap: 16 }}>
        {/* Active Matches */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Active Matches</Text>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
          </View>
          {sampleMatches.map((match) => (
            <View key={match.court} style={{
              backgroundColor: '#F9FAFB',
              borderRadius: 16,
              padding: 16,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin color="#EF4444" size={14} strokeWidth={2.5} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>Court {match.court}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{match.score1}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#9CA3AF' }}>:</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{match.score2}</Text>
                </View>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{match.team1.join(' & ')}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{match.team2.join(' & ')}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Top 3 Players */}
        <View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Top Performers</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {samplePlayers.slice(0, 3).map((player, index) => (
              <View key={player.id} style={{
                flex: 1,
                backgroundColor: index === 0 ? '#FEF3C7' : index === 1 ? '#E0E7FF' : '#FED7AA',
                borderRadius: 16,
                padding: 14,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: index === 0 ? '#FDE68A' : index === 1 ? '#C7D2FE' : '#FDBA74',
              }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: index === 0 ? '#F59E0B' : index === 1 ? '#6366F1' : '#F97316',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{index + 1}</Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#111827', textAlign: 'center' }} numberOfLines={1}>
                  {player.name.split(' ')[0]}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444', marginTop: 4 }}>{player.points}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Layout 4: Timeline/Activity Feed Style
  const Layout4 = () => (
    <ScrollView style={{ flex: 1, backgroundColor: '#F3F4F6' }} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Compact Header Bar */}
      <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>
            {sampleSession.name}
          </Text>
          <View style={{ backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>ACTIVE</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>
            {sampleSession.sport} • {sampleSession.type}
          </Text>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>
            Round {sampleSession.currentRound} of {sampleSession.totalRounds}
          </Text>
        </View>
      </View>

      {/* Timeline/Activity Feed */}
      <View style={{ padding: 16, gap: 12 }}>
        {/* Progress Section */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TrendingUp color="#EF4444" size={20} strokeWidth={2.5} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginLeft: 8 }}>Session Progress</Text>
          </View>
          <View style={{ height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
            <View style={{
              width: `${(sampleSession.currentRound / sampleSession.totalRounds) * 100}%`,
              height: '100%',
              backgroundColor: '#EF4444',
            }} />
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 8 }}>
            {sampleSession.currentRound} of {sampleSession.totalRounds} rounds completed
          </Text>
        </View>

        {/* Current Matches Section */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: '#10B981' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Target color="#10B981" size={20} strokeWidth={2.5} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginLeft: 8 }}>Live Matches</Text>
          </View>
          {sampleMatches.map((match, index) => (
            <View key={match.court} style={{
              paddingVertical: 12,
              borderTopWidth: index > 0 ? 1 : 0,
              borderTopColor: '#F3F4F6'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981', marginBottom: 4 }}>
                    COURT {match.court}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
                    {match.team1.join(' & ')}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginTop: 2 }}>
                    {match.team2.join(' & ')}
                  </Text>
                </View>
                <View style={{ alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{match.score1}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#9CA3AF' }}>-</Text>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{match.score2}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Leaderboard Section */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Trophy color="#F59E0B" size={20} strokeWidth={2.5} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginLeft: 8 }}>Current Standings</Text>
          </View>
          {samplePlayers.map((player, index) => (
            <View key={player.id} style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              borderTopWidth: index > 0 ? 1 : 0,
              borderTopColor: '#F3F4F6',
            }}>
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: index === 0 ? '#FEF3C7' : '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: index === 0 ? '#F59E0B' : '#6B7280' }}>
                  {player.rank}
                </Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' }}>{player.name}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#EF4444' }}>{player.points}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>{player.wins}W-{player.losses}L</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Stats Summary */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, alignItems: 'center' }}>
            <Users color="#6B7280" size={20} strokeWidth={2} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 6 }}>{sampleSession.playerCount}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>Players</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, alignItems: 'center' }}>
            <MapPin color="#6B7280" size={20} strokeWidth={2} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 6 }}>{sampleSession.courts}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>Courts</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, alignItems: 'center' }}>
            <Trophy color="#6B7280" size={20} strokeWidth={2} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 6 }}>63</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>Top Score</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{
        paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) + 16 : insets.top + 16,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <ChevronLeft color="#111827" size={28} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>
              Session Layouts
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#6B7280', marginTop: 2 }}>
              {selectedLayout === 1 ? 'Card-Based Hero' : selectedLayout === 2 ? 'Minimalist Split' : selectedLayout === 3 ? 'Dashboard Stats' : 'Timeline Feed'}
            </Text>
          </View>
        </View>

        {/* Layout Selector */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3, 4].map((layout) => (
            <TouchableOpacity
              key={layout}
              onPress={() => setSelectedLayout(layout)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: selectedLayout === layout ? '#EF4444' : '#F3F4F6',
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: selectedLayout === layout ? '#FFFFFF' : '#6B7280',
              }}>
                Layout {layout}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Layout Content */}
      {selectedLayout === 1 && <Layout1 />}
      {selectedLayout === 2 && <Layout2 />}
      {selectedLayout === 3 && <Layout3 />}
      {selectedLayout === 4 && <Layout4 />}
    </View>
  );
}
