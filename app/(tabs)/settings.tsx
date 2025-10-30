import { View, Text, ScrollView, TouchableOpacity, Platform, Switch } from 'react-native';
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
  Palette
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Toggle states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [clubInvites, setClubInvites] = useState(true);
  const [matchResults, setMatchResults] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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
    Toast.show({
      type: 'info',
      text1: 'Coming Soon',
      text2: 'Subscription features will be available soon!',
    });
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
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : pushNotifications ? '#FFFFFF' : '#F3F4F6'}
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
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : emailNotifications ? '#FFFFFF' : '#F3F4F6'}
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
                value={sessionReminders}
                onValueChange={setSessionReminders}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : sessionReminders ? '#FFFFFF' : '#F3F4F6'}
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
                value={clubInvites}
                onValueChange={setClubInvites}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : clubInvites ? '#FFFFFF' : '#F3F4F6'}
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
                value={matchResults}
                onValueChange={setMatchResults}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : matchResults ? '#FFFFFF' : '#F3F4F6'}
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
                value={darkMode}
                onValueChange={setDarkMode}
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
                value={soundEffects}
                onValueChange={setSoundEffects}
                trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
                thumbColor={Platform.OS === 'ios' ? undefined : soundEffects ? '#FFFFFF' : '#F3F4F6'}
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
            {/* Design Playground */}
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
              onPress={() => router.push('/(tabs)/demo-nav')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, backgroundColor: '#DBEAFE', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Palette color="#3B82F6" size={20} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Design Playground</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>View navigation styles</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>

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
