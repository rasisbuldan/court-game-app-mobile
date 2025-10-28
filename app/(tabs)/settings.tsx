import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { ChevronRight, CreditCard, LogOut, User, Bell, Shield, HelpCircle } from 'lucide-react-native';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

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
    <View className="flex-1 bg-gray-50">
      {/* Glassmorphic Background Blobs */}
      <View className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left - Soft blue */}
        <View
          className="absolute rounded-full"
          style={{
            width: 340,
            height: 340,
            top: -80,
            left: -100,
            backgroundColor: '#DBEAFE',
            opacity: 0.3,
          }}
        />

        {/* Top right - Light purple */}
        <View
          className="absolute rounded-full"
          style={{
            width: 280,
            height: 280,
            top: 100,
            right: -80,
            backgroundColor: '#F3E8FF',
            opacity: 0.3,
          }}
        />

        {/* Middle - Soft pink */}
        <View
          className="absolute rounded-full"
          style={{
            width: 240,
            height: 240,
            top: 400,
            left: 50,
            backgroundColor: '#FCE4EC',
            opacity: 0.25,
          }}
        />

        {/* Bottom left - Light cyan */}
        <View
          className="absolute rounded-full"
          style={{
            width: 300,
            height: 300,
            bottom: -100,
            left: -80,
            backgroundColor: '#CFFAFE',
            opacity: 0.3,
          }}
        />

        {/* Bottom right - Soft grey */}
        <View
          className="absolute rounded-full"
          style={{
            width: 260,
            height: 260,
            bottom: 150,
            right: -70,
            backgroundColor: '#F5F5F5',
            opacity: 0.35,
          }}
        />
      </View>

      {/* iOS 18 Style Glassmorphic Header */}
      <View
        style={{
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.7)' : '#FFFFFF',
          borderBottomWidth: 0,
          paddingTop: Platform.OS === 'ios' ? 60 : 20,
          paddingBottom: 16,
          paddingHorizontal: 16,
          ...(Platform.OS === 'ios' && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }),
        }}
      >
        <Text className="text-3xl font-bold text-gray-900">Settings</Text>
        {user?.email && (
          <Text className="text-sm text-gray-600 mt-1">{user.email}</Text>
        )}
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Account Section */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
            Account
          </Text>

          <View className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl overflow-hidden shadow-sm">
            {/* Profile */}
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
              onPress={() => Toast.show({ type: 'info', text1: 'Profile settings coming soon' })}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center">
                  <User color="#6B7280" size={20} />
                </View>
                <View>
                  <Text className="text-base font-semibold text-gray-900">Profile</Text>
                  <Text className="text-xs text-gray-500">Manage your account</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>

            {/* Subscription */}
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4"
              onPress={handleSubscription}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-rose-100 rounded-full items-center justify-center">
                  <CreditCard color="#EF4444" size={20} />
                </View>
                <View>
                  <Text className="text-base font-semibold text-gray-900">Subscription</Text>
                  <Text className="text-xs text-gray-500">Upgrade to premium</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
            Preferences
          </Text>

          <View className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl overflow-hidden shadow-sm">
            {/* Notifications */}
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
              onPress={() => Toast.show({ type: 'info', text1: 'Notification settings coming soon' })}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                  <Bell color="#3B82F6" size={20} />
                </View>
                <View>
                  <Text className="text-base font-semibold text-gray-900">Notifications</Text>
                  <Text className="text-xs text-gray-500">Manage alerts</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>

            {/* Privacy */}
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4"
              onPress={() => Toast.show({ type: 'info', text1: 'Privacy settings coming soon' })}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                  <Shield color="#10B981" size={20} />
                </View>
                <View>
                  <Text className="text-base font-semibold text-gray-900">Privacy</Text>
                  <Text className="text-xs text-gray-500">Data & security</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
            Support
          </Text>

          <View className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl overflow-hidden shadow-sm">
            {/* Help */}
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-4"
              onPress={() => Toast.show({ type: 'info', text1: 'Help center coming soon' })}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                  <HelpCircle color="#A855F7" size={20} />
                </View>
                <View>
                  <Text className="text-base font-semibold text-gray-900">Help & Support</Text>
                  <Text className="text-xs text-gray-500">Get assistance</Text>
                </View>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          className="bg-white/60 backdrop-blur-xl border border-red-200 rounded-3xl px-4 py-4 shadow-sm"
          onPress={handleSignOut}
        >
          <View className="flex-row items-center justify-center gap-3">
            <LogOut color="#EF4444" size={20} />
            <Text className="text-base font-semibold text-red-600">Sign Out</Text>
          </View>
        </TouchableOpacity>

        {/* App Version */}
        <Text className="text-xs text-gray-400 text-center mt-8">
          Courtster v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
