import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { color, fonts } from '@/design/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: color.gohan,
          borderTopColor: color.beerus,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 56,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: color.piccolo,
        tabBarInactiveTintColor: color.trunks,
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 11,
          letterSpacing: 0.2,
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
