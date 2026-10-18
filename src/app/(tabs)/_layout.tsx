import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { color, fonts } from '@/design/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: color.bg,
          borderTopColor: color.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 52,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: color.ink,
        tabBarInactiveTintColor: color.muted,
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        },
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
