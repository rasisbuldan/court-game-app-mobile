import { View, Text, ScrollView, TouchableOpacity, Platform, Switch, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  CreditCard,
  LogOut,
  User,
  Bell,
  Shield,
  HelpCircle,
  Globe,
  Moon,
  Volume2,
  Smartphone,
  Languages,
  FileText,
  Mail,
  MessageSquare,
  Award,
  Calendar,
  Palette,
  Code,
  RefreshCw,
  Settings as SettingsIcon
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { areNotificationsEnabled } from '../../services/notifications';
import {
  isSimulatorAllowed,
  loadSimulatorState,
  saveSimulatorState,
  clearSimulatorState,
  toggleSimulator,
  updateSubscriptionState,
  applyPreset,
  getAvailablePresets,
  getPresetLabel,
  getPresetDescription,
  type SimulatorState,
  type SimulatorSubscriptionTier,
  type SimulatorPreset
} from '../../utils/accountSimulator';
import { useSubscription } from '../../hooks/useSubscription';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Notification preferences from Supabase
  const { data: preferences, isLoading: preferencesLoading } = useNotificationPreferences(user?.id);
  const updatePreferences = useUpdateNotificationPreferences();

  // Subscription (for refetching when simulator changes)
  const { refetch: refetchSubscription } = useSubscription();

  // Account Simulator state (dev/test accounts only)
  const [simulatorState, setSimulatorState] = useState<SimulatorState | null>(null);
  const isDevAccount = isSimulatorAllowed(user?.email);

  // Load simulator state for dev accounts
  useEffect(() => {
    if (isDevAccount) {
      loadSimulatorState().then(setSimulatorState);
    }
  }, [isDevAccount]);

  // Helper to update preferences with optimistic update
  const updatePreference = (key: string, value: boolean) => {
    if (!user) return;
    updatePreferences.mutate({
      userId: user.id,
      preferences: { [key]: value },
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Toast.show({
        type: 'success',
        text1: 'Signed out successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to sign out',
      });
    }
  };

  const handleSubscription = () => {
    router.push('/(tabs)/subscription');
  };

  // Simulator handlers
  const handleToggleSimulator = async (enabled: boolean) => {
    try {
      const newState = await toggleSimulator(enabled);
      setSimulatorState(newState);
      refetchSubscription();
      Toast.show({
        type: enabled ? 'success' : 'info',
        text1: enabled ? 'Simulator Enabled' : 'Simulator Disabled',
        text2: enabled ? 'Using simulated account state' : 'Using real account state',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to toggle simulator',
      });
    }
  };

  const handleApplyPreset = async (preset: SimulatorPreset) => {
    try {
      const newState = await applyPreset(preset);
      setSimulatorState(newState);
      refetchSubscription();
      Toast.show({
        type: 'success',
        text1: 'Preset Applied',
        text2: getPresetLabel(preset),
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to apply preset',
      });
    }
  };

  const handleUpdateTier = async (tier: SimulatorSubscriptionTier) => {
    try {
      const newState = await updateSubscriptionState({ tier });
      setSimulatorState(newState);
      refetchSubscription();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update tier',
      });
    }
  };

  const handleUpdateTrial = async (isTrialActive: boolean, trialDaysRemaining?: number) => {
    try {
      const updates: any = { isTrialActive };
      if (trialDaysRemaining !== undefined) {
        updates.trialDaysRemaining = trialDaysRemaining;
      }
      const newState = await updateSubscriptionState(updates);
      setSimulatorState(newState);
      refetchSubscription();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update trial',
      });
    }
  };

  const handleUpdateSessionsUsed = async (sessionsUsedThisMonth: number) => {
    try {
      const newState = await updateSubscriptionState({ sessionsUsedThisMonth });
      setSimulatorState(newState);
      refetchSubscription();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update sessions',
      });
    }
  };

  const handleResetSimulator = () => {
    Alert.alert(
      'Reset Simulator',
      'This will clear all simulator overrides and return to your actual account state.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSimulatorState();
              const newState = await loadSimulatorState();
              setSimulatorState(newState);
              refetchSubscription();
              Toast.show({
                type: 'success',
                text1: 'Simulator Reset',
                text2: 'Using real account state',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Failed to reset simulator',
              });
            }
          },
        },
      ]
    );
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
          backgroundColor: '#F9FAFB',
        }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
            Settings
          </Text>
          {user?.email && (
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
              {user.email}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={{ paddingTop: insets.top + 76 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 }}
      >
        {/* Loading State */}
        {preferencesLoading && (
          <View style={{
            backgroundColor: '#DBEAFE',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12
          }}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={{ fontSize: 13, color: '#1E40AF', fontWeight: '500' }}>
              Loading preferences...
            </Text>
          </View>
        )}

        {/* Account Section */}
        <View style={{ gap: 8, marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4 }}>
            Account
          </Text>

          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Profile */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
              onPress={() => Toast.show({ type: 'info', text1: 'Profile settings coming soon' })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <User color="#6B7280" size={20} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Profile</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Manage your account</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>

            {/* Subscription */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
              onPress={handleSubscription}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#FEE2E2',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <CreditCard color="#EF4444" size={20} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Subscription</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Upgrade to premium</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={{ gap: 8, marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4 }}>
            Notifications
          </Text>

          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Push Notifications */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#DBEAFE', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Bell color="#3B82F6" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Push Notifications</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Receive app notifications</Text>
                </View>
              </View>
              <Switch
                value={preferences?.push_enabled ?? true}
                onValueChange={(value) => updatePreference('push_enabled', value)}
                disabled={preferencesLoading || updatePreferences.isPending}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : preferences?.push_enabled ? '#FFFFFF' : '#F3F4F6'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            {/* Email Notifications */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#FEE2E2', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Mail color="#EF4444" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Email Notifications</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Receive email updates</Text>
                </View>
              </View>
              <Switch
                value={preferences?.email_enabled ?? true}
                onValueChange={(value) => updatePreference('email_enabled', value)}
                disabled={preferencesLoading || updatePreferences.isPending}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : preferences?.email_enabled ? '#FFFFFF' : '#F3F4F6'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            {/* Session Reminders */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#FEF3C7', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar color="#F59E0B" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Session Reminders</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Get reminded before games</Text>
                </View>
              </View>
              <Switch
                value={preferences?.session_reminders ?? true}
                onValueChange={(value) => updatePreference('session_reminders', value)}
                disabled={preferencesLoading || updatePreferences.isPending}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : preferences?.session_reminders ? '#FFFFFF' : '#F3F4F6'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            {/* Club Invites */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#D1FAE5', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare color="#10B981" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Club Invitations</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Notify when invited to clubs</Text>
                </View>
              </View>
              <Switch
                value={preferences?.club_invites ?? true}
                onValueChange={(value) => updatePreference('club_invites', value)}
                disabled={preferencesLoading || updatePreferences.isPending}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : preferences?.club_invites ? '#FFFFFF' : '#F3F4F6'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            {/* Match Results */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#F3E8FF', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Award color="#A855F7" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Match Results</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Updates on match outcomes</Text>
                </View>
              </View>
              <Switch
                value={preferences?.match_results ?? true}
                onValueChange={(value) => updatePreference('match_results', value)}
                disabled={preferencesLoading || updatePreferences.isPending}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : preferences?.match_results ? '#FFFFFF' : '#F3F4F6'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={{ gap: 8, marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4 }}>
            Preferences
          </Text>

          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Language */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
              onPress={() => Toast.show({ type: 'info', text1: 'Language settings coming soon' })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#DBEAFE', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Languages color="#3B82F6" size={20} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Language</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>English</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>

            {/* Dark Mode */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Moon color="#6B7280" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Dark Mode</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Coming soon</Text>
                </View>
              </View>
              <Switch
                value={preferences?.dark_mode ?? false}
                onValueChange={(value) => updatePreference('dark_mode', value)}
                disabled={true}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#F3F4F6'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            {/* Sound Effects */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#FED7AA', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Volume2 color="#EA580C" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Sound Effects</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Enable sound feedback</Text>
                </View>
              </View>
              <Switch
                value={preferences?.sound_effects ?? true}
                onValueChange={(value) => updatePreference('sound_effects', value)}
                disabled={preferencesLoading || updatePreferences.isPending}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : preferences?.sound_effects ? '#FFFFFF' : '#F3F4F6'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={{ gap: 8, marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4 }}>
            Privacy & Security
          </Text>

          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Privacy Policy */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
              onPress={() => Toast.show({ type: 'info', text1: 'Privacy Policy coming soon' })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#D1FAE5', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Shield color="#10B981" size={20} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Privacy Policy</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>How we protect your data</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>

            {/* Terms of Service */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
              onPress={() => Toast.show({ type: 'info', text1: 'Terms of Service coming soon' })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#FEE2E2', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <FileText color="#EF4444" size={20} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Terms of Service</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>View our terms</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={{ gap: 8, marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4 }}>
            Support
          </Text>

          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Help */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
              onPress={() => Toast.show({ type: 'info', text1: 'Help center coming soon' })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#F3E8FF', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <HelpCircle color="#A855F7" size={20} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Help & Support</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Get assistance</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Simulator Section (Dev/Test Accounts Only) */}
        {isDevAccount && simulatorState && (
          <View style={{ gap: 8, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Account Simulator
              </Text>
              {simulatorState.enabled && (
                <View style={{ backgroundColor: '#8B5CF6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>ACTIVE</Text>
                </View>
              )}
            </View>

            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
              borderWidth: simulatorState.enabled ? 2 : 0,
              borderColor: simulatorState.enabled ? '#8B5CF6' : 'transparent',
            }}>
              {/* Enable/Disable Toggle */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={{ width: 40, height: 40, backgroundColor: '#EDE9FE', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Code color="#8B5CF6" size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Enable Simulator</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Override account state</Text>
                  </View>
                </View>
                <Switch
                  value={simulatorState.enabled}
                  onValueChange={handleToggleSimulator}
                  trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                  thumbColor={Platform.OS === 'ios' ? undefined : simulatorState.enabled ? '#FFFFFF' : '#F3F4F6'}
                  ios_backgroundColor="#E5E7EB"
                />
              </View>

              {/* Quick Presets */}
              {simulatorState.enabled && (
                <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 12 }}>Quick Presets</Text>
                  <View style={{ gap: 8 }}>
                    {getAvailablePresets().map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => handleApplyPreset(preset)}
                        style={{
                          backgroundColor: '#F9FAFB',
                          borderRadius: 12,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
                          {getPresetLabel(preset)}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>
                          {getPresetDescription(preset)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Current State Display */}
              {simulatorState.enabled && (
                <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 12 }}>Current State</Text>
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, color: '#6B7280' }}>Tier:</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
                        {simulatorState.subscription.tier}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, color: '#6B7280' }}>Trial Active:</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
                        {simulatorState.subscription.isTrialActive ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    {simulatorState.subscription.isTrialActive && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 13, color: '#6B7280' }}>Trial Days:</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
                          {simulatorState.subscription.trialDaysRemaining}
                        </Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, color: '#6B7280' }}>Sessions Used:</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
                        {simulatorState.subscription.sessionsUsedThisMonth}/4
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Manual Controls */}
              {simulatorState.enabled && (
                <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 12 }}>Manual Controls</Text>

                  {/* Tier Selection */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Subscription Tier</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['free', 'personal', 'club'] as SimulatorSubscriptionTier[]).map((tier) => (
                        <TouchableOpacity
                          key={tier}
                          onPress={() => handleUpdateTier(tier)}
                          style={{
                            flex: 1,
                            backgroundColor: simulatorState.subscription.tier === tier ? '#8B5CF6' : '#F9FAFB',
                            borderRadius: 8,
                            paddingVertical: 10,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: simulatorState.subscription.tier === tier ? '#8B5CF6' : '#E5E7EB',
                          }}
                        >
                          <Text style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: simulatorState.subscription.tier === tier ? '#FFFFFF' : '#6B7280',
                            textTransform: 'capitalize',
                          }}>
                            {tier}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Trial Toggle */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>Trial Active</Text>
                      <Switch
                        value={simulatorState.subscription.isTrialActive}
                        onValueChange={(value) => handleUpdateTrial(value, value ? 14 : 0)}
                        trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                        thumbColor={Platform.OS === 'ios' ? undefined : '#F3F4F6'}
                        ios_backgroundColor="#E5E7EB"
                      />
                    </View>
                    {simulatorState.subscription.isTrialActive && (
                      <View style={{ gap: 8 }}>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Trial Days: {simulatorState.subscription.trialDaysRemaining}</Text>
                        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                          {[1, 2, 7, 14].map((days) => (
                            <TouchableOpacity
                              key={days}
                              onPress={() => handleUpdateTrial(true, days)}
                              style={{
                                backgroundColor: '#F9FAFB',
                                borderRadius: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                              }}
                            >
                              <Text style={{ fontSize: 11, color: '#6B7280' }}>{days}d</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Sessions Used */}
                  <View>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                      Sessions Used: {simulatorState.subscription.sessionsUsedThisMonth}/4
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {[0, 1, 2, 3, 4].map((count) => (
                        <TouchableOpacity
                          key={count}
                          onPress={() => handleUpdateSessionsUsed(count)}
                          style={{
                            flex: 1,
                            backgroundColor: simulatorState.subscription.sessionsUsedThisMonth === count ? '#8B5CF6' : '#F9FAFB',
                            borderRadius: 6,
                            paddingVertical: 8,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: simulatorState.subscription.sessionsUsedThisMonth === count ? '#8B5CF6' : '#E5E7EB',
                          }}
                        >
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: simulatorState.subscription.sessionsUsedThisMonth === count ? '#FFFFFF' : '#6B7280',
                          }}>
                            {count}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* Reset Button */}
              {simulatorState.enabled && (
                <TouchableOpacity
                  onPress={handleResetSimulator}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 14,
                  }}
                >
                  <RefreshCw color="#EF4444" size={16} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>Reset to Actual State</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Dev Tools Section */}
        <View style={{ gap: 8, marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 4 }}>
            Dev Tools
          </Text>

          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}>
            {/* Layout Previews */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
              onPress={() => router.push('/(tabs)/layout-previews')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#EDE9FE', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Palette color="#8B5CF6" size={20} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Layout Previews</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>View UI/UX variations</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
          }}
          onPress={handleSignOut}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <LogOut color="#EF4444" size={20} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>Sign Out</Text>
          </View>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 16 }}>
          Courtster v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
