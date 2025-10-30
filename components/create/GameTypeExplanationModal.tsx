import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X, Users, RefreshCw, Target, UserPlus } from 'lucide-react-native';
import { GameType } from '../../hooks/useSessionForm';

interface GameTypeInfo {
  type: GameType;
  label: string;
  icon: typeof Users;
  description: string;
  bestFor: string;
  requirements?: string;
  example: string;
  color: string;
}

const GAME_TYPE_INFO: GameTypeInfo[] = [
  {
    type: 'mexicano',
    label: 'Mexicano',
    icon: RefreshCw,
    description: 'Players rotate partners each round to ensure everyone plays with and against everyone. The format automatically balances competition by mixing skill levels.',
    bestFor: 'Social play, skill balancing, maximizing variety',
    example: 'With 8 players, each plays 7 rounds with 7 different partners. After all rounds, players with the most wins rank highest on the leaderboard.',
    color: '#3B82F6',
  },
  {
    type: 'mixed_mexicano',
    label: 'Mixed Mexicano',
    icon: Users,
    description: 'Same rotation system as Mexicano, but ensures all pairs are gender-balanced (1 male + 1 female). Creates mixed doubles matches every round.',
    bestFor: 'Mixed-gender groups wanting balanced competition',
    requirements: 'Requires equal number of male and female players',
    example: '4 males + 4 females = 8 players. Each round creates 4 mixed pairs (2 courts). Players rotate to play with all opposite-gender players.',
    color: '#EC4899',
  },
  {
    type: 'americano',
    label: 'Americano',
    icon: Target,
    description: 'Each player pairs with every other player throughout the session in a round-robin format. Everyone plays with all other players as partners at some point.',
    bestFor: 'Social play, team building, getting to know all players',
    example: 'With 8 players, each player partners with all 7 others across multiple rounds. The player with the most individual wins ranks highest on the leaderboard.',
    color: '#F59E0B',
  },
  {
    type: 'fixed_partner',
    label: 'Fixed Partner',
    icon: UserPlus,
    description: 'Pairs are assigned during session creation and stay together throughout all matches. Perfect for pre-established teams or strategic pairing.',
    bestFor: 'Team tournaments, pre-formed partnerships, competitive play',
    requirements: 'Partners must be assigned during session creation',
    example: 'During setup, you assign Player A with Player B, Player C with Player D. These pairs compete as fixed teams throughout the session.',
    color: '#10B981',
  },
];

interface GameTypeExplanationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function GameTypeExplanationModal({
  visible,
  onClose,
}: GameTypeExplanationModalProps) {
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
                Game Types Explained
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                Choose the format that fits your group
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
            {GAME_TYPE_INFO.map((info, index) => {
              const IconComponent = info.icon;

              return (
                <View
                  key={info.type}
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
                    <Text style={{ fontSize: 19, fontWeight: '700', color: '#111827', flex: 1, letterSpacing: -0.3 }}>
                      {info.label}
                    </Text>
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

                  {/* Requirements (if applicable) */}
                  {info.requirements && (
                    <View
                      style={{
                        backgroundColor: '#FEF2F2',
                        borderRadius: 14,
                        padding: 14,
                        marginBottom: 12,
                        borderLeftWidth: 3,
                        borderLeftColor: '#EF4444',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                        REQUIREMENTS
                      </Text>
                      <Text style={{ fontSize: 14, color: '#991B1B', lineHeight: 21, fontWeight: '500' }}>
                        {info.requirements}
                      </Text>
                    </View>
                  )}

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
