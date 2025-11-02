import { Tabs, useRouter } from 'expo-router';
import { Home, Plus, Settings, User, Bell } from 'lucide-react-native';
import { TouchableOpacity, Platform, View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useInvitationsCount } from '../../hooks/useClubInvitations';

export default function TabsLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: invitationsCount } = useInvitationsCount(user?.id);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#EF4444',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          paddingBottom: 4,
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
          // Platform-specific shadows
          ...(Platform.OS === 'ios' ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 0,
          } : {
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          }),
        },
        tabBarBackground: () => (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#FFFFFF',
          }} />
        ),
        // Platform-specific screen animations
        animation: Platform.OS === 'ios' ? 'shift' : 'fade',
        // Enable swipe gestures
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Bell color={color} size={size} strokeWidth={1.5} />
              {invitationsCount !== undefined && invitationsCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: '#EF4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>
                    {invitationsCount > 9 ? '9+' : invitationsCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-session"
        options={{
          href: null, // Hide from tab bar
          presentation: 'modal',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null, // Hide from tab bar
          presentation: 'modal',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Tabs.Screen
        name="session/[id]"
        options={{
          href: null, // Hide from tab bar
          tabBarStyle: { display: 'none' }, // Hide entire tab bar on session screen
          animation: Platform.OS === 'ios' ? 'shift' : 'fade',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <Tabs.Screen
        name="create-club"
        options={{
          href: null, // Hide from tab bar
          presentation: 'modal',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Tabs.Screen
        name="club-detail"
        options={{
          href: null, // Hide from tab bar
          animation: Platform.OS === 'ios' ? 'shift' : 'fade',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <Tabs.Screen
        name="demo-nav"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="leaderboard-demo"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="session-demo"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="create-session-demo"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="layout-previews"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="demo"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="head-to-head-demo"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="partnerships-demo"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="background-demo"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          href: null, // Hide from tab bar
          animation: Platform.OS === 'ios' ? 'shift' : 'fade',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <Tabs.Screen
        name="subscription-layouts-demo"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
