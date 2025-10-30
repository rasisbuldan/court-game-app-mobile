import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X, Zap, Target, Trophy, Clock } from 'lucide-react-native';
import { ScoringMode } from '../../hooks/useSessionForm';

interface ScoringModeInfo {
  mode: ScoringMode;
  label: string;
  icon: typeof Zap;
  description: string;
  bestFor: string;
  example: string;
  color: string;
  padelOnly?: boolean;
}

const SCORING_MODE_INFO: ScoringModeInfo[] = [
  {
    mode: 'points',
    label: 'Total Points',
    icon: Zap,
    description: 'Play a single match to exactly X total points. The match ends when the total reaches the target, regardless of the score difference.',
    bestFor: 'Quick matches, time-constrained sessions, casual play',
    example: 'Set to 21 points total. Match might end 11-10, 12-9, or 15-6 as long as the sum equals 21. Ensures consistent match duration.',
    color: '#EF4444',
    padelOnly: true,
  },
  {
    mode: 'first_to',
    label: 'First to X Points',
    icon: Target,
    description: 'First team to reach X points wins the match. Similar to table tennis scoring, teams race to be first to hit the target score.',
    bestFor: 'Standard competitive format, clear winners',
    example: 'Set to 11 points. First team to reach 11 wins (e.g., 11-8, 11-5). Can include deuce rules like "win by 2" for tight matches.',
    color: '#F59E0B',
  },
  {
    mode: 'first_to_games',
    label: 'First to X Games',
    icon: Trophy,
    description: 'Play multiple games. First team to win X games wins the match. Each game is a mini-match with traditional scoring.',
    bestFor: 'Traditional tennis/padel format, longer sessions',
    example: 'Set to 6 games (like a tennis set). First team to win 6 games wins. Each game uses standard scoring (0-15-30-40-game).',
    color: '#10B981',
  },
  {
    mode: 'total_games',
    label: 'Total Games',
    icon: Clock,
    description: 'Play exactly X games regardless of the score. Team with the most game wins takes the match. Great for time management.',
    bestFor: 'Time management, social play, guaranteed duration',
    example: 'Set to 6 games. Play all 6 games no matter what. If score is 4-2, the team with 4 game wins gets the match victory.',
    color: '#3B82F6',
  },
];

interface ScoringModeExplanationModalProps {
  visible: boolean;
  onClose: () => void;
  sport: 'padel' | 'tennis';
}

export function ScoringModeExplanationModal({
  visible,
  onClose,
  sport,
}: ScoringModeExplanationModalProps) {
  // Filter out padel-only modes for tennis
  const availableModes = SCORING_MODE_INFO.filter(
    (mode) => !(sport === 'tennis' && mode.padelOnly)
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '92%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 15,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6',
              backgroundColor: '#FAFAFA',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
                Scoring Modes Explained
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                Choose how to score your matches
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 12,
              }}
            >
              <X color="#6B7280" size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
          >
            {availableModes.map((info) => {
              const IconComponent = info.icon;

              return (
                <View
                  key={info.mode}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: `${info.color}30`,
                    shadowColor: info.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {/* Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 14 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: `${info.color}15`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: `${info.color}30`,
                      }}
                    >
                      <IconComponent color={info.color} size={26} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 19, fontWeight: '700', color: '#111827', letterSpacing: -0.3 }}>
                        {info.label}
                      </Text>
                      {info.padelOnly && (
                        <View style={{
                          backgroundColor: '#FEE2E2',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          marginTop: 4,
                          alignSelf: 'flex-start',
                        }}>
                          <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: '700', letterSpacing: 0.5 }}>
                            PADEL ONLY
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Description */}
                  <Text
                    style={{
                      fontSize: 15,
                      color: '#4B5563',
                      lineHeight: 23,
                      marginBottom: 16,
                    }}
                  >
                    {info.description}
                  </Text>

                  {/* Best For */}
                  <View
                    style={{
                      backgroundColor: `${info.color}08`,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 12,
                      borderLeftWidth: 3,
                      borderLeftColor: info.color,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: info.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                      BEST FOR
                    </Text>
                    <Text style={{ fontSize: 14, color: '#111827', lineHeight: 21, fontWeight: '500' }}>
                      {info.bestFor}
                    </Text>
                  </View>

                  {/* Example */}
                  <View
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                      EXAMPLE
                    </Text>
                    <Text style={{ fontSize: 14, color: '#374151', lineHeight: 21 }}>
                      {info.example}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
