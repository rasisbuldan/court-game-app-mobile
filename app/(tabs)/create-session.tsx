import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  Trophy,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useSessionForm } from '../../hooks/useSessionForm';
import { usePlayerForm } from '../../hooks/usePlayerForm';
import { GameFormatSelector } from '../../components/create/GameFormatSelector';
import { ScoringModeSelector } from '../../components/create/ScoringModeSelector';
import { PlayerManager } from '../../components/create/PlayerManager';
import ClubSelector from '../../components/clubs/ClubSelector';

export default function CreateSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { formData, updateField, updateMultipleFields } = useSessionForm();
  const {
    players,
    addPlayer,
    addPair,
    removePlayer,
    updateGender,
    setPartner,
    setPlayersFromImport,
  } = usePlayerForm();

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [reclubUrl, setReclubUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPlayer = (name: string) => {
    try {
      addPlayer(name);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to add player',
      });
    }
  };

  const handleAddPair = (name1: string, name2: string) => {
    try {
      addPair(name1, name2);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to add pair',
      });
    }
  };

  const handleImport = async () => {
    // Placeholder for Reclub import
    Toast.show({
      type: 'info',
      text1: 'Coming Soon',
      text2: 'Reclub import will be implemented',
    });
    setIsImportModalOpen(false);
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Session name
    if (!formData.name.trim()) {
      errors.push('Session name is required');
    } else if (formData.name.trim().length < 3) {
      errors.push('Session name must be at least 3 characters');
    } else if (formData.name.trim().length > 60) {
      errors.push('Session name must be at most 60 characters');
    }

    // Date
    if (!formData.game_date) {
      errors.push('Game date is required');
    }

    // Courts
    if (formData.courts < 1 || formData.courts > 10) {
      errors.push('Courts must be between 1 and 10');
    }

    // Parallel mode constraints
    if (formData.mode === 'parallel') {
      if (formData.courts < 2 || formData.courts > 4) {
        errors.push('Parallel mode requires 2-4 courts');
      }
    }

    // Points
    if (formData.points_per_match < 1 || formData.points_per_match > 100) {
      errors.push('Points must be between 1 and 100');
    }

    // Duration
    if (formData.duration_hours < 0.5 || formData.duration_hours > 24) {
      errors.push('Duration must be between 0.5 and 24 hours');
    }

    // Players
    if (players.length < 4) {
      errors.push('At least 4 players are required');
    }

    // Mixed mexicano validation
    if (formData.type === 'mixed_mexicano') {
      const maleCount = players.filter((p) => p.gender === 'male').length;
      const femaleCount = players.filter((p) => p.gender === 'female').length;

      if (maleCount !== femaleCount) {
        errors.push('Mixed Mexicano requires equal number of male and female players');
      }
    }

    // Fixed partner validation
    if (formData.type === 'fixed_partner') {
      if (players.length % 2 !== 0) {
        errors.push('Fixed Partner mode requires an even number of players');
      }

      const playersWithoutPartners = players.filter((p) => !p.partnerId);
      if (playersWithoutPartners.length > 0) {
        errors.push('All players must have partners in Fixed Partner mode');
      }

      // Check mutual partnerships
      for (const player of players) {
        if (player.partnerId) {
          const partner = players.find((p) => p.id === player.partnerId);
          if (!partner || partner.partnerId !== player.id) {
            errors.push('All partnerships must be mutual');
            break;
          }
        }
      }
    }

    // Parallel mode player count
    if (formData.mode === 'parallel') {
      const minPlayers = formData.courts * 4;
      if (players.length < minPlayers) {
        errors.push(`Parallel mode with ${formData.courts} courts requires at least ${minPlayers} players`);
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = async () => {
    const { isValid, errors } = validateForm();

    if (!isValid) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: errors[0],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement session creation via Supabase
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Session created successfully',
      });

      router.back();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create session',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { errors: validationErrors } = validateForm();

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Fixed Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
        }}
      >
        {Platform.OS === 'ios' ? (
          <>
            <BlurView
              intensity={80}
              tint="light"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
              }}
            />
          </>
        ) : (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#FFFFFF',
            }}
          />
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <ArrowLeft color="#111827" size={24} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Trophy color="#EF4444" size={22} strokeWidth={2} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
              Create Session
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 100,
            paddingHorizontal: 16,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: Session Info */}
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 24,
              padding: 16,
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Session Details
            </Text>

            <TextInput
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Session name"
              placeholderTextColor="#9CA3AF"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderWidth: 1,
                borderColor: 'rgba(209, 213, 219, 0.5)',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: '#111827',
              }}
            />

            <ClubSelector
              selectedClubId={formData.club_id}
              onSelectClub={(clubId) => updateField('club_id', clubId)}
              label=""
              placeholder="Select a club (optional)"
            />
          </View>

          {/* SECTION 2: Sport, Courts & Game Type */}
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 24,
              padding: 16,
              gap: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Sport & Format
            </Text>

            {/* Sport Toggle */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => updateField('sport', 'padel')}
                style={{
                  flex: 1,
                  backgroundColor:
                    formData.sport === 'padel'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(255, 255, 255, 0.4)',
                  borderWidth: formData.sport === 'padel' ? 2 : 1,
                  borderColor: formData.sport === 'padel' ? '#EF4444' : 'rgba(255, 255, 255, 0.6)',
                  borderRadius: 16,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: formData.sport === 'padel' ? '#DC2626' : '#111827',
                  }}
                >
                  Padel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => updateField('sport', 'tennis')}
                style={{
                  flex: 1,
                  backgroundColor:
                    formData.sport === 'tennis'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(255, 255, 255, 0.4)',
                  borderWidth: formData.sport === 'tennis' ? 2 : 1,
                  borderColor: formData.sport === 'tennis' ? '#EF4444' : 'rgba(255, 255, 255, 0.6)',
                  borderRadius: 16,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: formData.sport === 'tennis' ? '#DC2626' : '#111827',
                  }}
                >
                  Tennis
                </Text>
              </TouchableOpacity>
            </View>

            {/* Courts Dropdown */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Courts
              </Text>
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  borderWidth: 1,
                  borderColor: 'rgba(209, 213, 219, 0.5)',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 14, color: '#111827' }}>{formData.courts}</Text>
                <ChevronDown color="#6B7280" size={18} />
              </View>
            </View>

            {/* Game Type */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
                Game Type
              </Text>
              <GameFormatSelector
                value={formData.type}
                onChange={(value) => updateField('type', value)}
              />
            </View>
          </View>

          {/* SECTION 3: Scoring Configuration */}
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 24,
              padding: 16,
              gap: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Scoring
            </Text>

            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
                Scoring Mode
              </Text>
              <ScoringModeSelector
                value={formData.scoring_mode}
                onChange={(value) => updateField('scoring_mode', value)}
                sport={formData.sport}
              />
            </View>

            {/* Points/Games */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                {formData.scoring_mode === 'total_games' || formData.scoring_mode === 'first_to_games'
                  ? 'Games per Match'
                  : 'Points per Match'}
              </Text>
              <TextInput
                value={formData.points_per_match.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  updateField('points_per_match', num);
                }}
                keyboardType="number-pad"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  borderWidth: 1,
                  borderColor: 'rgba(209, 213, 219, 0.5)',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: '#111827',
                }}
              />
            </View>
          </View>

          {/* SECTION 4: Schedule */}
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 24,
              padding: 16,
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Schedule
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                  Date
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Calendar color="#6B7280" size={16} />
                  <TextInput
                    value={formData.game_date}
                    onChangeText={(text) => updateField('game_date', text)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      borderWidth: 1,
                      borderColor: 'rgba(209, 213, 219, 0.5)',
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: '#111827',
                    }}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                  Time
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Clock color="#6B7280" size={16} />
                  <TextInput
                    value={formData.game_time}
                    onChangeText={(text) => updateField('game_time', text)}
                    placeholder="HH:MM"
                    placeholderTextColor="#9CA3AF"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      borderWidth: 1,
                      borderColor: 'rgba(209, 213, 219, 0.5)',
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: '#111827',
                    }}
                  />
                </View>
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Duration (hours)
              </Text>
              <TextInput
                value={formData.duration_hours.toString()}
                onChangeText={(text) => {
                  const num = parseFloat(text) || 0;
                  updateField('duration_hours', num);
                }}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  borderWidth: 1,
                  borderColor: 'rgba(209, 213, 219, 0.5)',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: '#111827',
                }}
              />
            </View>
          </View>

          {/* SECTION 5: Advanced Options (Collapsible) */}
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 24,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <TouchableOpacity
              onPress={() => setIsAdvancedOpen(!isAdvancedOpen)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                Advanced Options
              </Text>
              {isAdvancedOpen ? (
                <ChevronUp color="#6B7280" size={20} />
              ) : (
                <ChevronDown color="#6B7280" size={20} />
              )}
            </TouchableOpacity>

            {isAdvancedOpen && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}>
                {/* Play Mode */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
                    Play Mode
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => updateField('mode', 'sequential')}
                      style={{
                        flex: 1,
                        backgroundColor:
                          formData.mode === 'sequential'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(255, 255, 255, 0.4)',
                        borderWidth: formData.mode === 'sequential' ? 2 : 1,
                        borderColor:
                          formData.mode === 'sequential' ? '#EF4444' : 'rgba(255, 255, 255, 0.6)',
                        borderRadius: 16,
                        paddingVertical: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: formData.mode === 'sequential' ? '#DC2626' : '#111827',
                        }}
                      >
                        Sequential
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => updateField('mode', 'parallel')}
                      style={{
                        flex: 1,
                        backgroundColor:
                          formData.mode === 'parallel'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(255, 255, 255, 0.4)',
                        borderWidth: formData.mode === 'parallel' ? 2 : 1,
                        borderColor:
                          formData.mode === 'parallel' ? '#EF4444' : 'rgba(255, 255, 255, 0.6)',
                        borderRadius: 16,
                        paddingVertical: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: formData.mode === 'parallel' ? '#DC2626' : '#111827',
                        }}
                      >
                        Parallel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Matchup Preference */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
                    Matchup Preference
                  </Text>
                  <View style={{ gap: 8 }}>
                    {(['any', 'mixed_only', 'randomized_modes'] as const).map((pref) => {
                      const isSelected = formData.matchup_preference === pref;
                      const isDisabled = formData.type === 'mixed_mexicano' && pref !== 'mixed_only';

                      return (
                        <TouchableOpacity
                          key={pref}
                          onPress={() => !isDisabled && updateField('matchup_preference', pref)}
                          disabled={isDisabled}
                          style={{
                            backgroundColor: isSelected
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(255, 255, 255, 0.4)',
                            borderWidth: isSelected ? 2 : 1,
                            borderColor: isSelected ? '#EF4444' : 'rgba(255, 255, 255, 0.6)',
                            borderRadius: 16,
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            opacity: isDisabled ? 0.5 : 1,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: isSelected ? '#DC2626' : '#111827',
                            }}
                          >
                            {pref === 'any'
                              ? 'Any'
                              : pref === 'mixed_only'
                              ? 'Mixed Only'
                              : 'Varied Pairings'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* SECTION 6: Players */}
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 24,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <PlayerManager
              players={players}
              onAdd={handleAddPlayer}
              onAddPair={handleAddPair}
              onRemove={removePlayer}
              onGenderChange={updateGender}
              onPartnerChange={setPartner}
              gameType={formData.type}
              onImport={() => setIsImportModalOpen(true)}
            />
          </View>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <View
              style={{
                backgroundColor: 'rgba(254, 242, 242, 0.9)',
                borderWidth: 1,
                borderColor: 'rgba(220, 38, 38, 0.3)',
                borderRadius: 16,
                padding: 14,
                gap: 6,
              }}
            >
              {validationErrors.slice(0, 3).map((error, index) => (
                <Text key={index} style={{ fontSize: 13, color: '#B91C1C', lineHeight: 18 }}>
                  • {error}
                </Text>
              ))}
              {validationErrors.length > 3 && (
                <Text style={{ fontSize: 12, color: '#991B1B', fontStyle: 'italic' }}>
                  +{validationErrors.length - 3} more errors
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Submit Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 16,
          paddingTop: 16,
          backgroundColor: 'rgba(249, 250, 251, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.05)',
        }}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || validationErrors.length > 0}
          style={{
            backgroundColor: validationErrors.length > 0 ? '#9CA3AF' : '#EF4444',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 10,
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {isSubmitting && <ActivityIndicator color="#FFFFFF" />}
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
            {isSubmitting ? 'Creating Session...' : 'Create Session'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Import Modal */}
      <Modal
        visible={isImportModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsImportModalOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 20,
              width: '100%',
              maxWidth: 400,
              gap: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
              Import from Reclub
            </Text>

            <TextInput
              value={reclubUrl}
              onChangeText={setReclubUrl}
              placeholder="Paste Reclub event URL"
              placeholderTextColor="#9CA3AF"
              style={{
                backgroundColor: '#F9FAFB',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: '#111827',
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setIsImportModalOpen(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleImport}
                style={{
                  flex: 1,
                  backgroundColor: '#EF4444',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
