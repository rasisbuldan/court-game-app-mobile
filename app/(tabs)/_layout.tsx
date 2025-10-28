import { Tabs, useRouter } from 'expo-router';
import { Home, Plus, Settings } from 'lucide-react-native';
import { TouchableOpacity, Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import React from 'react';

export default function TabsLayout() {
  const router = useRouter();

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
          elevation: 0,
          // iOS 18 style shadow
          ...(Platform.OS === 'ios' && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
          }),
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
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
                  overflow: 'hidden',
                }}
              />
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(249, 250, 251, 0.3)', // Light grey tint
              }} />
            </>
          ) : (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#F9FAFB',
            }} />
          )
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Game Sessions',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: focused ? '#DC2626' : '#EF4444',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 8,
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            console.log('Tab pressed, navigating to create-session');
            console.log('Navigation state:', navigation.getState());
            try {
              router.push('/(tabs)/create-session');
              console.log('Navigation successful');
            } catch (error) {
              console.error('Navigation error:', error);
            }
          },
        })}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-session"
        options={{
          href: null, // Hide from tab bar
          presentation: 'modal',
        }}
      />
      <Tabs.Screen
        name="session/[id]"
        options={{
          href: null, // Hide from tab bar
          tabBarStyle: { display: 'none' }, // Hide entire tab bar on session screen
        }}
      />
    </Tabs>
  );
}
