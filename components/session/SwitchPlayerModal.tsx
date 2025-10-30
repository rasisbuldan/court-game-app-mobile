import { View, Text, Modal, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { X, RefreshCw, ArrowLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Player, Match } from '@courtster/shared';
import { useState, useEffect, useRef } from 'react';

interface SwitchPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  matches: Match[];
  allPlayers: Player[];
  onSwitch: (matchIndex: number, position: 'team1_0' | 'team1_1' | 'team2_0' | 'team2_1', newPlayerId: string) => void;
}

export function SwitchPlayerModal({
  visible,
  onClose,
  matches,
  allPlayers,
  onSwitch,
}: SwitchPlayerModalProps) {
  const [step, setStep] = useState<'select-player' | 'select-replacement'>('select-player');
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<'team1_0' | 'team1_1' | 'team2_0' | 'team2_1' | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [swapExpanded, setSwapExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset to first step when modal closes
    if (!visible) {
      setStep('select-player');
      setSelectedMatch(null);
      setSelectedPosition(null);
      setSelectedPlayer(null);
      setSwapExpanded(false);
      slideAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    // Animate screen transition
    Animated.timing(slideAnim, {
      toValue: step === 'select-replacement' ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayer(playerId);
  };

  const handleSelectPlayerToReplace = (matchIndex: number, position: 'team1_0' | 'team1_1' | 'team2_0' | 'team2_1') => {
    setSelectedMatch(matchIndex);
    setSelectedPosition(position);
    setStep('select-replacement');
  };

  const handleBack = () => {
    setStep('select-player');
    setSelectedPlayer(null);
    setSwapExpanded(false);
  };

  const handleSwitch = () => {
    if (selectedMatch !== null && selectedPosition && selectedPlayer) {
      onSwitch(selectedMatch, selectedPosition, selectedPlayer);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep('select-player');
    setSelectedMatch(null);
    setSelectedPosition(null);
    setSelectedPlayer(null);
    onClose();
  };

  const getCurrentPlayerId = (match: Match, position: 'team1_0' | 'team1_1' | 'team2_0' | 'team2_1') => {
    switch (position) {
      case 'team1_0':
        return match.team1?.[0]?.id;
      case 'team1_1':
        return match.team1?.[1]?.id;
      case 'team2_0':
        return match.team2?.[0]?.id;
      case 'team2_1':
        return match.team2?.[1]?.id;
    }
  };

  const getPlayerName = (match: Match, position: 'team1_0' | 'team1_1' | 'team2_0' | 'team2_1') => {
    switch (position) {
      case 'team1_0':
        return match.team1?.[0]?.name || 'Player 1';
      case 'team1_1':
        return match.team1?.[1]?.name || 'Player 2';
      case 'team2_0':
        return match.team2?.[0]?.name || 'Player 3';
      case 'team2_1':
        return match.team2?.[1]?.name || 'Player 4';
    }
  };

  // Get all players currently playing in this round
  const playingPlayerIds = new Set<string>();
  matches.forEach(match => {
    match.team1?.forEach(player => playingPlayerIds.add(player.id));
    match.team2?.forEach(player => playingPlayerIds.add(player.id));
  });

  // Available players for switching (sitting players)
  const availablePlayers = allPlayers.filter(player => !playingPlayerIds.has(player.id));

  // Get playing players (excluding the selected player)
  const playingPlayers = allPlayers.filter(player => {
    if (!playingPlayerIds.has(player.id)) return false;
    // Exclude the currently selected player to replace
    if (selectedMatch !== null && selectedPosition) {
      const selectedPlayerId = getCurrentPlayerId(matches[selectedMatch], selectedPosition);
      return player.id !== selectedPlayerId;
    }
    return true;
  });

  // Get selected player info
  const selectedPlayerInfo = selectedMatch !== null && selectedPosition
    ? {
        name: getPlayerName(matches[selectedMatch], selectedPosition),
        court: matches[selectedMatch].court || selectedMatch + 1,
      }
    : null;

  const step1TranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -400],
  });

  const step2TranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: '90%',
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
          }}>
            {step === 'select-replacement' ? (
              <TouchableOpacity onPress={handleBack} style={{ padding: 4, marginLeft: -4 }}>
                <ArrowLeft color="#111827" size={24} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 32 }} />
            )}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
                Switch Player
              </Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                Step {step === 'select-player' ? '1' : '2'} of 2
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
              <X color="#9CA3AF" size={24} />
            </TouchableOpacity>
          </View>

          {/* Animated Screens Container */}
          <View style={{ flex: 1, position: 'relative' }}>
            {/* Step 1: Select Player to Replace */}
            <Animated.View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: [{ translateX: step1TranslateX }],
            }}>
              <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
                  Select Player to Replace
                </Text>

                {!matches || matches.length === 0 ? (
                  <View style={{
                    backgroundColor: '#FEF3C7',
                    borderRadius: 12,
                    padding: 16,
                  }}>
                    <Text style={{ fontSize: 13, color: '#92400E', textAlign: 'center' }}>
                      No matches found in current round
                    </Text>
                  </View>
                ) : (
                  matches.map((match, matchIndex) => (
                    <View
                      key={matchIndex}
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      {/* Court Header */}
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 12, letterSpacing: 0.5 }}>
                        COURT {match.court || matchIndex + 1}
                      </Text>

                      {/* Players */}
                      <View style={{ gap: 8 }}>
                        {(['team1_0', 'team1_1', 'team2_0', 'team2_1'] as const).map((position) => {
                          const playerName = getPlayerName(match, position);

                          return (
                            <TouchableOpacity
                              key={position}
                              onPress={() => handleSelectPlayerToReplace(matchIndex, position)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#FFFFFF',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                borderRadius: 12,
                                padding: 12,
                              }}
                            >
                              <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#111827',
                              }}>
                                {playerName}
                              </Text>
                              <ChevronRight color="#9CA3AF" size={20} />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </Animated.View>

            {/* Step 2: Select Replacement Player */}
            <Animated.View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: [{ translateX: step2TranslateX }],
            }}>
              <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {/* Selected Player Info */}
                {selectedPlayerInfo && (
                  <View style={{
                    backgroundColor: '#EFF6FF',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#3B82F6', marginBottom: 4 }}>
                      Replacing
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E40AF' }}>
                      {selectedPlayerInfo.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#60A5FA', marginTop: 2 }}>
                      Court {selectedPlayerInfo.court}
                    </Text>
                  </View>
                )}

                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
                  Select Replacement Player
                </Text>

                {availablePlayers.length > 0 ? (
                  <View style={{ gap: 8 }}>
                    {availablePlayers.map((player) => {
                      const isSelected = selectedPlayer === player.id;

                      return (
                        <TouchableOpacity
                          key={player.id}
                          onPress={() => handlePlayerSelect(player.id)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isSelected ? '#ECFDF5' : '#FFFFFF',
                            borderWidth: 1,
                            borderColor: isSelected ? '#10B981' : '#E5E7EB',
                            borderRadius: 12,
                            padding: 12,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: isSelected ? '#10B981' : '#111827',
                            }}>
                              {player.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                              Sitting out
                            </Text>
                          </View>
                          {isSelected && (
                            <View style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: '#10B981',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={{
                    backgroundColor: '#FEF3C7',
                    borderRadius: 12,
                    padding: 16,
                  }}>
                    <Text style={{ fontSize: 13, color: '#92400E', textAlign: 'center' }}>
                      No players available (all players are currently playing)
                    </Text>
                  </View>
                )}

                {/* Swap with Other Player on Court */}
                <View style={{ marginTop: 24 }}>
                  <TouchableOpacity
                    onPress={() => setSwapExpanded(!swapExpanded)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor: '#F9FAFB',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                      Swap with other player on court
                    </Text>
                    {swapExpanded ? (
                      <ChevronUp color="#9CA3AF" size={20} />
                    ) : (
                      <ChevronDown color="#9CA3AF" size={20} />
                    )}
                  </TouchableOpacity>

                  {swapExpanded && (
                    <View style={{ marginTop: 12, gap: 8 }}>
                      {playingPlayers.map((player) => {
                        const isSelected = selectedPlayer === player.id;

                        // Find which court this player is on
                        let playerCourt = null;
                        matches.forEach((match, idx) => {
                          const inTeam1 = match.team1?.some(p => p.id === player.id);
                          const inTeam2 = match.team2?.some(p => p.id === player.id);
                          if (inTeam1 || inTeam2) {
                            playerCourt = match.court || idx + 1;
                          }
                        });

                        return (
                          <TouchableOpacity
                            key={player.id}
                            onPress={() => handlePlayerSelect(player.id)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: isSelected ? '#FEF3C7' : '#FFFFFF',
                              borderWidth: 1,
                              borderColor: isSelected ? '#F59E0B' : '#E5E7EB',
                              borderRadius: 12,
                              padding: 12,
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: isSelected ? '#F59E0B' : '#111827',
                              }}>
                                {player.name}
                              </Text>
                              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                                Currently on Court {playerCourt}
                              </Text>
                            </View>
                            {isSelected && (
                              <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: '#F59E0B',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </ScrollView>
            </Animated.View>
          </View>

          {/* Action Buttons - Only show on Step 2 */}
          {step === 'select-replacement' && (
            <View style={{
              position: 'absolute',
              bottom: Platform.OS === 'ios' ? 34 : 20,
              left: 0,
              right: 0,
              flexDirection: 'row',
              gap: 12,
              paddingHorizontal: 20,
              paddingTop: 16,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
            }}>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#6B7280' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSwitch}
                disabled={!selectedPlayer}
                style={{
                  flex: 1,
                  backgroundColor: selectedPlayer ? '#EF4444' : '#E5E7EB',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <RefreshCw color="#FFFFFF" size={18} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                  Switch
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
