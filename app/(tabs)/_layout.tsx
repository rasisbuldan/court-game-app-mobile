import { Tabs } from 'expo-router';
import { Home, Calendar, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Tournaments',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="session/[id]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
