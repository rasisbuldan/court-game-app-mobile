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
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Trophy,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useSessionForm } from '../../hooks/useSessionForm';
import { usePlayerForm } from '../../hooks/usePlayerForm';
import { GameFormatSelector } from '../../components/create/GameFormatSelector';
import { ScoringModeSelector } from '../../components/create/ScoringModeSelector';
import { PlayerManager } from '../../components/create/PlayerManager';
import { DateTimePickerModal } from '../../components/create/DateTimePickerModal';
import ClubSelector from '../../components/clubs/ClubSelector';
import { CourtSelector } from '../../components/create/CourtSelector';
import { PresetSelector } from '../../components/create/PresetSelector';
import { DurationSelector } from '../../components/create/DurationSelector';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { importPlayersFromReclub, isValidReclubUrl } from '../../services/reclubImportService';
import { useSubscription } from '../../hooks/useSubscription';

// STATE MACHINE: Session creation states
type SessionCreationState =
  | 'idle'
  | 'validating'
  | 'creating_session'
  | 'creating_players'
  | 'generating_round'
  | 'completed'
  | 'error';

export default function CreateSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { subscriptionStatus, featureAccess, incrementSessionCount } = useSubscription();
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
  const [isImporting, setIsImporting] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // STATE MACHINE: Track session creation progress
  const [creationState, setCreationState] = useState<SessionCreationState>('idle');
  const [creationError, setCreationError] = useState<string | null>(null);

  // ANIMATION: Import modal fade
  const importModalFadeAnim = useRef(new Animated.Value(0)).current;
  const importModalScaleAnim = useRef(new Animated.Value(0.9)).current;

  // ANIMATION: Advanced options collapse
  const advancedCollapseAnim = useRef(new Animated.Value(0)).current;

  const TAB_BAR_HEIGHT = 88;

  // Animate import modal
  useEffect(() => {
    if (isImportModalOpen) {
      Animated.parallel([
        Animated.timing(importModalFadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(importModalScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(importModalFadeAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(importModalScaleAnim, {
          toValue: 0.9,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isImportModalOpen, importModalFadeAnim, importModalScaleAnim]);

  // Animate advanced options collapse
  useEffect(() => {
    Animated.timing(advancedCollapseAnim, {
      toValue: isAdvancedOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: false, // height animation requires layout
    }).start();
  }, [isAdvancedOpen, advancedCollapseAnim]);

  // Helper: Check if currently submitting
  const isSubmitting = creationState !== 'idle' && creationState !== 'error' && creationState !== 'completed';

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
      // Check for duplicate names (case-insensitive)
      const normalizedName = name.trim().toLowerCase();
      const isDuplicate = players.some((p) => p.name.toLowerCase() === normalizedName);

      if (isDuplicate) {
        Toast.show({
          type: 'error',
          text1: 'Duplicate Player',
          text2: `"${name.trim()}" has already been added`,
        });
        return;
      }

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
      // Check for duplicate names (case-insensitive)
      const normalized1 = name1.trim().toLowerCase();
      const normalized2 = name2.trim().toLowerCase();

      // Check if names are the same
      if (normalized1 === normalized2) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Pair',
          text2: 'Both players cannot have the same name',
        });
        return;
      }

      // Check if either name already exists
      const isDuplicate1 = players.some((p) => p.name.toLowerCase() === normalized1);
      const isDuplicate2 = players.some((p) => p.name.toLowerCase() === normalized2);

      if (isDuplicate1 || isDuplicate2) {
        const duplicateName = isDuplicate1 ? name1.trim() : name2.trim();
        Toast.show({
          type: 'error',
          text1: 'Duplicate Player',
          text2: `"${duplicateName}" has already been added`,
        });
        return;
      }

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

      // Import players (overwrites existing)
      if (players.length > 0) {
        // Show warning that existing players will be replaced
        const playerCount = players.length;
        Toast.show({
          type: 'info',
          text1: 'Players Replaced',
          text2: `${playerCount} existing player${playerCount > 1 ? 's were' : ' was'} replaced with imported players`,
        });
      }

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
    } else if (formData.game_date && formData.game_time) {
      // Validate date + time is in the future
      try {
        const [year, month, day] = formData.game_date.split('-').map(Number);
        const [hours, minutes] = formData.game_time.split(':').map(Number);
        const selectedDateTime = new Date(year, month - 1, day, hours, minutes);
        const now = new Date();

        if (selectedDateTime < now) {
          errors.push('Session date and time must be in the future');
        }
      } catch (e) {
        // Invalid date format - will be caught by other validation
      }
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
    // Mark that user has attempted submit (enables validation display)
    setHasAttemptedSubmit(true);

    // Haptic feedback on submit
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // STATE MACHINE: Start validation
    setCreationState('validating');
    setCreationError(null);

    // Check subscription limits (free tier: 4 sessions/month)
    if (featureAccess && !featureAccess.canCreateSession) {
      setCreationState('error');
      setCreationError('Session limit reached');
      Toast.show({
        type: 'error',
        text1: 'Session Limit Reached',
        text2: `Free tier allows ${featureAccess.maxSessionsPerMonth} sessions per month. Upgrade to Personal for unlimited sessions.`,
        visibilityTime: 5000,
      });
      return;
    }

    const { isValid, errors } = validateForm();

    if (!isValid) {
      setCreationState('error');
      setCreationError(errors[0]);
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: errors[0],
      });
      return;
    }

    if (!user) {
      setCreationState('error');
      setCreationError('Authentication required');
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'You must be logged in to create a session',
      });
      return;
    }

    // Track session ID for cleanup
    let createdSessionId: string | null = null;

    try {
      // STATE MACHINE: Creating session
      setCreationState('creating_session');

      // ISSUE #1 FIX: Create session with improved error handling
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
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      if (!sessionData) {
        throw new Error('Session created but no data returned');
      }

      // Store session ID for cleanup if players fail
      createdSessionId = sessionData.id;

      // STATE MACHINE: Creating players
      setCreationState('creating_players');

      // Create players with retry logic
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

      // ISSUE #1 FIX: Await player creation with retry
      let playerInsertAttempts = 0;
      const MAX_PLAYER_INSERT_ATTEMPTS = 2;
      let playersError = null;

      while (playerInsertAttempts < MAX_PLAYER_INSERT_ATTEMPTS) {
        const { error } = await supabase.from('players').insert(playersData);

        if (!error) {
          playersError = null;
          break;
        }

        playersError = error;
        playerInsertAttempts++;

        if (playerInsertAttempts < MAX_PLAYER_INSERT_ATTEMPTS) {
          // Wait 500ms before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (playersError) {
        // ISSUE #1 FIX: Improved rollback with error handling
        try {
          const { error: deleteError } = await supabase
            .from('game_sessions')
            .delete()
            .eq('id', sessionData.id);

          if (deleteError) {
            // Log but don't throw - we already have a primary error
            console.error('Failed to rollback session:', deleteError);
          }
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }

        throw new Error(`Failed to create players: ${playersError.message}`);
      }

      // AUTO-GENERATE FIRST ROUND: User wants session to start immediately without "Ready to Start" screen
      setCreationState('generating_round');

      // Fetch the newly created players from database
      const { data: createdPlayers, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionData.id);

      if (fetchError || !createdPlayers || createdPlayers.length === 0) {
        console.error('Failed to fetch created players:', fetchError);
        // Don't throw - session is created, just won't have first round generated
      } else {
        try {
          // Import MexicanoAlgorithm to generate the first round
          const { MexicanoAlgorithm } = await import('@courtster/shared');

          // Transform database players to algorithm format
          const algorithmPlayers = createdPlayers.map(p => ({
            id: p.id,
            name: p.name,
            rating: p.rating || 5.0,
            playCount: p.play_count || 0,
            sitCount: p.sit_count || 0,
            consecutiveSits: p.consecutive_sits || 0,
            consecutivePlays: p.consecutive_plays || 0,
            status: p.status as any,
            totalPoints: p.total_points || 0,
            wins: p.wins || 0,
            losses: p.losses || 0,
            ties: p.ties || 0,
            skipRounds: p.skip_rounds || [],
            skipCount: p.skip_count || 0,
            compensationPoints: p.compensation_points || 0,
            gender: p.gender as any,
            partnerId: p.partner_id,
          }));

          // Initialize algorithm
          const algorithm = new MexicanoAlgorithm(
            algorithmPlayers,
            sessionData.courts,
            true,
            formData.matchup_preference as any,
            formData.type as any
          );

          // Generate first round
          const firstRound = algorithm.generateRound(1);

          // Update session with first round
          // NOTE: Pass JavaScript array directly - Supabase converts to JSONB automatically
          const { error: roundError } = await supabase
            .from('game_sessions')
            .update({
              round_data: [firstRound],
              current_round: 0,
            })
            .eq('id', sessionData.id);

          if (roundError) {
            console.error('Failed to generate first round:', roundError);
            // Don't throw - session is created, user can generate round manually
          } else {
            // Log event for first round generation
            await supabase.from('event_history').insert({
              session_id: sessionData.id,
              event_type: 'round_generated',
              description: 'Round 1 generated automatically',
            });
          }
        } catch (algorithmError) {
          console.error('Failed to initialize algorithm or generate round:', algorithmError);
          // Don't throw - session is created, user can generate round manually
        }
      }

      // STATE MACHINE: Mark as completed
      setCreationState('completed');

      // Increment session count for free tier tracking
      if (featureAccess && featureAccess.maxSessionsPerMonth !== -1) {
        try {
          incrementSessionCount();
        } catch (countError) {
          console.error('Failed to increment session count:', countError);
          // Non-critical error, allow session creation to complete
        }
      }

      // ISSUE #1 FIX: Only show success and navigate after ALL operations complete
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Session created successfully',
      });

      // Small delay to ensure toast is visible before navigation
      setTimeout(() => {
        router.replace(`/session/${sessionData.id}`);
      }, 100);

    } catch (error) {
      // STATE MACHINE: Mark as error
      setCreationState('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      setCreationError(errorMessage);

      // Check if offline
      const networkState = await Network.getNetworkStateAsync();
      const isOffline = !networkState.isConnected || !networkState.isInternetReachable;

      // ISSUE #1 FIX: Better error reporting with offline detection
      Toast.show({
        type: 'error',
        text1: isOffline ? 'No Internet Connection' : 'Error Creating Session',
        text2: isOffline ? 'Please check your connection and try again' : errorMessage,
      });

      // Log for debugging (to be replaced with error tracking service - Issue #11)
      console.error('[Create Session Error]:', error, {
        sessionId: createdSessionId,
        playerCount: players.length,
        isOffline,
      });
    }
  };

  const { errors: validationErrors } = validateForm();

  // Helper: Get loading message based on state
  const getLoadingMessage = () => {
    switch (creationState) {
      case 'validating':
        return 'Validating...';
      case 'creating_session':
        return 'Creating session...';
      case 'creating_players':
        return 'Adding players...';
      case 'generating_round':
        return 'Generating first round...';
      case 'completed':
        return 'Complete!';
      default:
        return 'Creating...';
    }
  };

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
          keyboardShouldPersistTaps="handled"
        >
          {/* Session Limit Banner (Free Tier) */}
          {subscriptionStatus && subscriptionStatus.tier === 'free' && !subscriptionStatus.isTrialActive && (
            <View
              style={{
                backgroundColor: subscriptionStatus.sessionsRemainingThisMonth > 0 ? '#FEF2F2' : '#FEE2E2',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: subscriptionStatus.sessionsRemainingThisMonth > 0 ? '#FCA5A5' : '#EF4444',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#991B1B', marginBottom: 4 }}>
                {subscriptionStatus.sessionsRemainingThisMonth > 0
                  ? `${subscriptionStatus.sessionsRemainingThisMonth}/${subscriptionStatus.sessionsUsedThisMonth + subscriptionStatus.sessionsRemainingThisMonth} sessions remaining this month`
                  : 'Session limit reached (4/4 used)'}
              </Text>
              <Text style={{ fontSize: 12, color: '#7F1D1D', lineHeight: 16 }}>
                {subscriptionStatus.sessionsRemainingThisMonth > 0
                  ? 'Upgrade to Personal for unlimited sessions • IDR 49k/month'
                  : 'Upgrade to Personal to create more sessions • IDR 49k/month'}
              </Text>
            </View>
          )}

          {/* Trial Period Banner */}
          {subscriptionStatus && subscriptionStatus.isTrialActive && (
            <View
              style={{
                backgroundColor: '#DBEAFE',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: '#93C5FD',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E40AF', marginBottom: 4 }}>
                Trial Active: {subscriptionStatus.trialDaysRemaining} days remaining
              </Text>
              <Text style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 16 }}>
                Enjoying full access during your 2-week trial. Upgrade to keep unlimited sessions!
              </Text>
            </View>
          )}

          {/* SECTION 1: Session Info */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 16,
              gap: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
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
              onChangeText={(text) => updateField('name', text.trimStart())}
              placeholder="Session name"
              placeholderTextColor="#9CA3AF"
              maxLength={60}
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
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
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 16,
              gap: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
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
                  backgroundColor: formData.sport === 'padel' ? '#EF4444' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: formData.sport === 'padel' ? '#EF4444' : '#D1D5DB',
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
                  backgroundColor: formData.sport === 'tennis' ? '#EF4444' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: formData.sport === 'tennis' ? '#EF4444' : '#D1D5DB',
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
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 6 }}>
                Courts
              </Text>
              <CourtSelector
                value={formData.courts}
                onChange={(value) => updateField('courts', value)}
                mode={formData.mode}
              />
              {formData.mode === 'parallel' && (
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 4, fontStyle: 'italic' }}>
                  Parallel mode with {formData.courts} court{formData.courts > 1 ? 's' : ''} requires at least {formData.courts * 4} players
                </Text>
              )}
            </View>

            {/* Game Type */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 8 }}>
                Tournament Format
              </Text>
              <GameFormatSelector
                value={formData.type}
                onChange={(value) => updateField('type', value)}
              />
              {formData.type === 'mixed_mexicano' && players.length > 0 && (
                <View style={{ backgroundColor: '#DBEAFE', borderRadius: 12, padding: 10, marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: '#1E40AF', lineHeight: 16 }}>
                    💡 Mixed Mexicano requires equal males and females. Set player genders in the Players section below.
                  </Text>
                </View>
              )}
              {formData.type === 'fixed_partner' && players.length > 0 && players.length % 2 !== 0 && (
                <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 10, marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: '#92400E', lineHeight: 16 }}>
                    ⚠️ Fixed Partner requires even number of players. Add one more or remove one.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* SECTION 3: Scoring Configuration */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 16,
              gap: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
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
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 8 }}>
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
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 6 }}>
                {formData.scoring_mode === 'total_games' || formData.scoring_mode === 'first_to'
                  ? 'Games per Match'
                  : 'Points per Match'}
              </Text>
              <PresetSelector
                value={formData.points_per_match}
                onChange={(value) => updateField('points_per_match', value)}
                mode={formData.scoring_mode === 'first_to' || formData.scoring_mode === 'total_games' ? 'games' : 'points'}
              />
            </View>
          </View>

          {/* SECTION 4: Schedule */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 16,
              gap: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
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

            <View>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 6 }}>
                Date & Time
              </Text>
              <DateTimePickerModal
                dateValue={formData.game_date}
                timeValue={formData.game_time}
                onDateChange={(value) => updateField('game_date', value)}
                onTimeChange={(value) => updateField('game_time', value)}
                minimumDate={new Date()}
                placeholder="Select date & time"
              />
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 6 }}>
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
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
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

            <Animated.View
              style={{
                maxHeight: advancedCollapseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1000], // Large enough to fit content
                }),
                opacity: advancedCollapseAnim,
                overflow: 'hidden',
              }}
            >
              <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}>
                {/* Play Mode - Horizontal Cards */}
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280' }}>
                      Court Management
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Sequential Card */}
                    <TouchableOpacity
                      onPress={() => updateField('mode', 'sequential')}
                      activeOpacity={0.7}
                      style={{
                        flex: 1,
                        backgroundColor: formData.mode === 'sequential' ? '#EF4444' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: formData.mode === 'sequential' ? '#EF4444' : '#D1D5DB',
                        borderRadius: 16,
                        padding: 16,
                        shadowColor: formData.mode === 'sequential' ? '#EF4444' : '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: formData.mode === 'sequential' ? 0.25 : 0.03,
                        shadowRadius: formData.mode === 'sequential' ? 6 : 3,
                        elevation: formData.mode === 'sequential' ? 4 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: formData.mode === 'sequential' ? '#FFFFFF' : '#111827', marginBottom: 6 }}>
                        Sequential
                      </Text>
                      <Text style={{ fontSize: 12, color: formData.mode === 'sequential' ? '#FFFFFF' : '#6B7280', lineHeight: 17 }}>
                        All courts finish rounds together, then advance
                      </Text>
                    </TouchableOpacity>

                    {/* Parallel Card */}
                    <TouchableOpacity
                      onPress={() => updateField('mode', 'parallel')}
                      activeOpacity={0.7}
                      style={{
                        flex: 1,
                        backgroundColor: formData.mode === 'parallel' ? '#EF4444' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: formData.mode === 'parallel' ? '#EF4444' : '#D1D5DB',
                        borderRadius: 16,
                        padding: 16,
                        shadowColor: formData.mode === 'parallel' ? '#EF4444' : '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: formData.mode === 'parallel' ? 0.25 : 0.03,
                        shadowRadius: formData.mode === 'parallel' ? 6 : 3,
                        elevation: formData.mode === 'parallel' ? 4 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: formData.mode === 'parallel' ? '#FFFFFF' : '#111827', marginBottom: 6 }}>
                        Parallel
                      </Text>
                      <Text style={{ fontSize: 12, color: formData.mode === 'parallel' ? '#FFFFFF' : '#6B7280', lineHeight: 17 }}>
                        Each court advances independently (2-4 courts)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Matchup Preference */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 8 }}>
                    Matchup Preference
                  </Text>
                  <View style={{ gap: 8 }}>
                    {(['any', 'mixed_only', 'randomized_modes'] as const).map((pref) => {
                      const isSelected = formData.matchup_preference === pref;
                      const isDisabled = formData.type === 'mixed_mexicano' && pref !== 'mixed_only';

                      const prefLabels = {
                        any: { title: 'Any Pairing', desc: 'Random pairing with no gender restrictions' },
                        mixed_only: { title: 'Mixed Only', desc: 'Every team is 1 male + 1 female (mixed vs mixed)' },
                        randomized_modes: { title: 'Varied Pairings', desc: 'Mix of men\'s, women\'s, and mixed doubles matches' },
                      };

                      return (
                        <TouchableOpacity
                          key={pref}
                          onPress={() => !isDisabled && updateField('matchup_preference', pref)}
                          disabled={isDisabled}
                          activeOpacity={0.7}
                          style={{
                            backgroundColor: isSelected ? '#EF4444' : '#FFFFFF',
                            borderWidth: 1,
                            borderColor: isSelected ? '#EF4444' : '#D1D5DB',
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
                              color: isSelected ? '#FFFFFF' : '#6B7280',
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
            </Animated.View>
          </View>

          {/* SECTION 6: Players */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
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
              canImportFromReclub={featureAccess?.canImportFromReclub ?? false}
            />
          </View>

          {/* Validation Errors - Only show after first submit attempt */}
          {hasAttemptedSubmit && validationErrors.length > 0 && (
            <View
              style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FCA5A5',
                borderRadius: 16,
                padding: 14,
                gap: 6,
              }}
            >
              {(showAllErrors ? validationErrors : validationErrors.slice(0, 3)).map((error, index) => (
                <Text key={index} style={{ fontSize: 13, color: '#B91C1C', lineHeight: 18 }}>
                  • {error}
                </Text>
              ))}
              {validationErrors.length > 3 && (
                <TouchableOpacity
                  onPress={() => setShowAllErrors(!showAllErrors)}
                  style={{ marginTop: 4 }}
                >
                  <Text style={{ fontSize: 13, color: '#DC2626', fontWeight: '600', textDecorationLine: 'underline' }}>
                    {showAllErrors
                      ? 'Show less'
                      : `+${validationErrors.length - 3} more error${validationErrors.length - 3 > 1 ? 's' : ''} • Tap to view all`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {/* Submit Button */}
          <View style={{ paddingTop: 8, paddingBottom: 8 }}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.7}
              style={{
                backgroundColor: '#EF4444',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              {isSubmitting && <ActivityIndicator color="#FFFFFF" />}
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 }}>
                {isSubmitting ? getLoadingMessage() : 'Create Session'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Import Modal */}
      <Modal
        visible={isImportModalOpen}
        transparent
        animationType="none"
        onRequestClose={() => !isImporting && setIsImportModalOpen(false)}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            opacity: importModalFadeAnim,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => !isImporting && setIsImportModalOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <Animated.View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              width: '100%',
              maxWidth: 400,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.25,
              shadowRadius: 25,
              elevation: 10,
              opacity: importModalFadeAnim,
              transform: [{ scale: importModalScaleAnim }],
            }}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={{
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 20,
            }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 6, letterSpacing: 0.3 }}>
                Import from Reclub
              </Text>
              <Text style={{ fontSize: 15, color: '#6B7280', lineHeight: 21 }}>
                Paste the Reclub event URL to import players and event details
              </Text>
            </View>

            {/* Content */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 20 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 10 }}>
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
                    paddingHorizontal: 18,
                    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
                    fontSize: 16,
                    color: '#111827',
                  }}
                />
                {reclubUrl.trim() && !isValidReclubUrl(reclubUrl.trim()) && (
                  <Text style={{ fontSize: 13, color: '#EF4444', marginTop: 8 }}>
                    Please enter a valid Reclub URL
                  </Text>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 14 }}>
                <TouchableOpacity
                  onPress={() => {
                    setIsImportModalOpen(false);
                    setReclubUrl('');
                  }}
                  disabled={isImporting}
                  activeOpacity={0.6}
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 14,
                    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
                    alignItems: 'center',
                    opacity: isImporting ? 0.5 : 1,
                  }}
                >
                  <Text style={{ fontSize: 17, fontWeight: '600', color: '#374151' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleImport}
                  disabled={isImporting || !reclubUrl.trim() || !isValidReclubUrl(reclubUrl.trim())}
                  activeOpacity={0.6}
                  style={{
                    flex: 1,
                    backgroundColor: (!reclubUrl.trim() || !isValidReclubUrl(reclubUrl.trim()) || isImporting) ? '#9CA3AF' : '#EF4444',
                    borderRadius: 14,
                    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
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
                  <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>
                    {isImporting ? 'Importing...' : 'Import'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}
