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
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { CourtSelector } from '../../components/create/CourtSelector';
import { PresetSelector } from '../../components/create/PresetSelector';
import { DurationSelector } from '../../components/create/DurationSelector';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { importPlayersFromReclub, isValidReclubUrl } from '../../services/reclubImportService';

export default function CreateSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
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
  const [isImporting, setIsImporting] = useState(false);

  const TAB_BAR_HEIGHT = 88;

  // Auto-select first club if only one exists
  useEffect(() => {
    const loadDefaultClub = async () => {
      if (!user || formData.club_id) return;

      const { data: clubs } = await supabase
        .from('clubs')
        .select('id')
        .eq('creator_id', user.id)
        .limit(2);

      if (clubs && clubs.length === 1) {
        updateField('club_id', clubs[0].id);
      }
    };

    loadDefaultClub();
  }, [user]);

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
    if (!reclubUrl.trim()) {
      Toast.show({
        type: 'error',
        text1: 'URL Required',
        text2: 'Please enter a Reclub event URL',
      });
      return;
    }

    if (!isValidReclubUrl(reclubUrl.trim())) {
      Toast.show({
        type: 'error',
        text1: 'Invalid URL',
        text2: 'Please provide a valid Reclub event link (e.g., https://reclub.co/m/...)',
      });
      return;
    }

    setIsImporting(true);

    try {
      const result = await importPlayersFromReclub(reclubUrl.trim());

      if (result.error) {
        Toast.show({
          type: 'error',
          text1: 'Import Failed',
          text2: result.error,
        });
        return;
      }

      if (result.players.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'No Players Found',
          text2: 'No confirmed players found in this Reclub event',
        });
        return;
      }

      // Import players
      setPlayersFromImport(result.players);

      // Import event details if available
      if (result.eventDetails) {
        const updates: any = {};

        if (result.eventDetails.date) {
          updates.game_date = result.eventDetails.date;
        }

        if (result.eventDetails.time) {
          updates.game_time = result.eventDetails.time;
        }

        if (result.eventDetails.duration) {
          updates.duration_hours = result.eventDetails.duration;
        }

        if (Object.keys(updates).length > 0) {
          updateMultipleFields(updates);
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Import Successful',
        text2: `Imported ${result.players.length} player${result.players.length > 1 ? 's' : ''} from Reclub`,
      });

      setIsImportModalOpen(false);
      setReclubUrl('');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Import Failed',
        text2: error instanceof Error ? error.message : 'Failed to import from Reclub',
      });
    } finally {
      setIsImporting(false);
    }
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

    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'You must be logged in to create a session',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          name: formData.name.trim(),
          club_name: formData.club_name.trim() || null,
          club_id: formData.club_id,
          sport: formData.sport,
          type: formData.type,
          mode: formData.mode,
          scoring_mode: formData.scoring_mode,
          matchup_preference: formData.matchup_preference,
          courts: formData.courts,
          points_per_match: formData.points_per_match,
          game_date: formData.game_date,
          game_time: formData.game_time,
          duration_hours: formData.duration_hours,
          current_round: 0,
          round_data: [],
          user_id: user.id,
          can_edit_settings: true,
          is_public: false,
          share_token: null,
          share_pin: null,
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        throw new Error('Failed to create session');
      }

      if (!sessionData) {
        throw new Error('Session created but no data returned');
      }

      // Create players
      const playersData = players.map((player) => ({
        session_id: sessionData.id,
        name: player.name.trim(),
        gender: player.gender,
        partner_id: player.partnerId || null,
        rating: 5.0,
        total_points: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        play_count: 0,
        sit_count: 0,
        consecutive_sits: 0,
        consecutive_plays: 0,
        status: 'active',
        skip_rounds: [],
        skip_count: 0,
        compensation_points: 0,
      }));

      const { error: playersError } = await supabase.from('players').insert(playersData);

      if (playersError) {
        console.error('Error creating players:', playersError);
        // Rollback: delete the session
        await supabase.from('game_sessions').delete().eq('id', sessionData.id);
        throw new Error('Failed to create players');
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Session created successfully',
      });

      // Navigate to the session detail page
      router.replace(`/session/${sessionData.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error instanceof Error ? error.message : 'Failed to create session',
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
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#FFFFFF',
            opacity: 0.98,
          }}
        />

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
            paddingBottom: TAB_BAR_HEIGHT + 16,
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
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: formData.sport === 'padel' ? '#EF4444' : 'rgba(255, 255, 255, 0.9)',
                  borderWidth: 1,
                  borderColor: formData.sport === 'padel' ? '#EF4444' : 'rgba(209, 213, 219, 0.5)',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  shadowColor: formData.sport === 'padel' ? '#EF4444' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: formData.sport === 'padel' ? 0.25 : 0,
                  shadowRadius: 4,
                  elevation: formData.sport === 'padel' ? 3 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: formData.sport === 'padel' ? '#FFFFFF' : '#111827',
                  }}
                >
                  Padel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => updateField('sport', 'tennis')}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: formData.sport === 'tennis' ? '#EF4444' : 'rgba(255, 255, 255, 0.9)',
                  borderWidth: 1,
                  borderColor: formData.sport === 'tennis' ? '#EF4444' : 'rgba(209, 213, 219, 0.5)',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  shadowColor: formData.sport === 'tennis' ? '#EF4444' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: formData.sport === 'tennis' ? 0.25 : 0,
                  shadowRadius: 4,
                  elevation: formData.sport === 'tennis' ? 3 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: formData.sport === 'tennis' ? '#FFFFFF' : '#111827',
                  }}
                >
                  Tennis
                </Text>
              </TouchableOpacity>
            </View>

            {/* Courts Selector */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                Courts
              </Text>
              <CourtSelector
                value={formData.courts}
                onChange={(value) => updateField('courts', value)}
                mode={formData.mode}
              />
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

            {/* Points/Games Preset Selector */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                {formData.scoring_mode === 'total_games' || formData.scoring_mode === 'first_to_games'
                  ? 'Games per Match'
                  : 'Points per Match'}
              </Text>
              <PresetSelector
                value={formData.points_per_match}
                onChange={(value) => updateField('points_per_match', value)}
                mode={formData.scoring_mode === 'first_to_games' || formData.scoring_mode === 'total_games' ? 'games' : 'points'}
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
                Duration
              </Text>
              <DurationSelector
                value={formData.duration_hours}
                onChange={(value) => updateField('duration_hours', value)}
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
                {/* Play Mode - Horizontal Cards */}
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280' }}>
                      Court Management Mode
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Sequential Card */}
                    <TouchableOpacity
                      onPress={() => updateField('mode', 'sequential')}
                      activeOpacity={0.7}
                      style={{
                        flex: 1,
                        backgroundColor: formData.mode === 'sequential' ? '#EF4444' : 'rgba(255, 255, 255, 0.9)',
                        borderWidth: 1,
                        borderColor: formData.mode === 'sequential' ? '#EF4444' : 'rgba(209, 213, 219, 0.5)',
                        borderRadius: 16,
                        padding: 16,
                        shadowColor: formData.mode === 'sequential' ? '#EF4444' : '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: formData.mode === 'sequential' ? 0.25 : 0.03,
                        shadowRadius: formData.mode === 'sequential' ? 6 : 3,
                        elevation: formData.mode === 'sequential' ? 4 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '700', color: formData.mode === 'sequential' ? '#FFFFFF' : '#111827', marginBottom: 6 }}>
                        Sequential
                      </Text>
                      <Text style={{ fontSize: 12, color: formData.mode === 'sequential' ? 'rgba(255, 255, 255, 0.9)' : '#6B7280', lineHeight: 16 }}>
                        One match at a time on available courts
                      </Text>
                    </TouchableOpacity>

                    {/* Parallel Card */}
                    <TouchableOpacity
                      onPress={() => updateField('mode', 'parallel')}
                      activeOpacity={0.7}
                      style={{
                        flex: 1,
                        backgroundColor: formData.mode === 'parallel' ? '#EF4444' : 'rgba(255, 255, 255, 0.9)',
                        borderWidth: 1,
                        borderColor: formData.mode === 'parallel' ? '#EF4444' : 'rgba(209, 213, 219, 0.5)',
                        borderRadius: 16,
                        padding: 16,
                        shadowColor: formData.mode === 'parallel' ? '#EF4444' : '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: formData.mode === 'parallel' ? 0.25 : 0.03,
                        shadowRadius: formData.mode === 'parallel' ? 6 : 3,
                        elevation: formData.mode === 'parallel' ? 4 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '700', color: formData.mode === 'parallel' ? '#FFFFFF' : '#111827', marginBottom: 6 }}>
                        Parallel
                      </Text>
                      <Text style={{ fontSize: 12, color: formData.mode === 'parallel' ? 'rgba(255, 255, 255, 0.9)' : '#6B7280', lineHeight: 16 }}>
                        All courts play simultaneously (2-4 courts)
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

                      const prefLabels = {
                        any: { title: 'Any Pairing', desc: 'No restrictions on gender pairings' },
                        mixed_only: { title: 'Mixed Only', desc: 'All pairs must be 1 male + 1 female' },
                        randomized_modes: { title: 'Varied Pairings', desc: 'Mix of same-gender and mixed pairings' },
                      };

                      return (
                        <TouchableOpacity
                          key={pref}
                          onPress={() => !isDisabled && updateField('matchup_preference', pref)}
                          disabled={isDisabled}
                          activeOpacity={0.7}
                          style={{
                            backgroundColor: isSelected ? '#EF4444' : 'rgba(255, 255, 255, 0.9)',
                            borderWidth: 1,
                            borderColor: isSelected ? '#EF4444' : 'rgba(209, 213, 219, 0.5)',
                            borderRadius: 12,
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            opacity: isDisabled ? 0.5 : 1,
                            shadowColor: isSelected ? '#EF4444' : 'transparent',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isSelected ? 0.2 : 0,
                            shadowRadius: 4,
                            elevation: isSelected ? 2 : 0,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: '700',
                              color: isSelected ? '#FFFFFF' : '#111827',
                              marginBottom: 2,
                            }}
                          >
                            {prefLabels[pref].title}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: isSelected ? 'rgba(255, 255, 255, 0.9)' : '#6B7280',
                              lineHeight: 16,
                            }}
                          >
                            {prefLabels[pref].desc}
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
          {/* Submit Button */}
          <View style={{ paddingTop: 8, paddingBottom: 8 }}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || validationErrors.length > 0}
              activeOpacity={0.7}
              style={{
                backgroundColor: validationErrors.length > 0 ? '#9CA3AF' : '#EF4444',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: validationErrors.length > 0 ? 0 : 0.35,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              {isSubmitting && <ActivityIndicator color="#FFFFFF" />}
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 }}>
                {isSubmitting ? 'Creating Session...' : 'Create Session'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Import Modal */}
      <Modal
        visible={isImportModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => !isImporting && setIsImportModalOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => !isImporting && setIsImportModalOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              width: '100%',
              maxWidth: 400,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.25,
              shadowRadius: 25,
              elevation: 10,
            }}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={{
              padding: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6',
              backgroundColor: '#FAFAFA',
            }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 2 }}>
                Import from Reclub
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                Paste the Reclub event URL to import players and event details
              </Text>
            </View>

            {/* Content */}
            <View style={{ padding: 20, gap: 16 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
                  Reclub Event URL
                </Text>
                <TextInput
                  value={reclubUrl}
                  onChangeText={setReclubUrl}
                  placeholder="https://reclub.co/m/..."
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  editable={!isImporting}
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderWidth: 2,
                    borderColor: reclubUrl.trim() && !isValidReclubUrl(reclubUrl.trim()) ? '#EF4444' : '#E5E7EB',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: '#111827',
                  }}
                />
                {reclubUrl.trim() && !isValidReclubUrl(reclubUrl.trim()) && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 6 }}>
                    Please enter a valid Reclub URL
                  </Text>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setIsImportModalOpen(false);
                    setReclubUrl('');
                  }}
                  disabled={isImporting}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    opacity: isImporting ? 0.5 : 1,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleImport}
                  disabled={isImporting || !reclubUrl.trim() || !isValidReclubUrl(reclubUrl.trim())}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    backgroundColor: (!reclubUrl.trim() || !isValidReclubUrl(reclubUrl.trim()) || isImporting) ? '#9CA3AF' : '#EF4444',
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: (!reclubUrl.trim() || !isValidReclubUrl(reclubUrl.trim()) || isImporting) ? 0 : 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {isImporting && <ActivityIndicator color="#FFFFFF" size="small" />}
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                    {isImporting ? 'Importing...' : 'Import'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
