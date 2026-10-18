import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { color, fonts } from '@/design/tokens';
import { STICKERS } from '@/design/stickers';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.35 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: color.bg },
        headerTitleStyle: {
          fontFamily: fonts.sansSemiBold,
          fontSize: 15,
          color: color.ink,
        },
        tabBarStyle: {
          backgroundColor: color.bg,
          borderTopColor: color.lineSubtle,
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: color.ink,
        tabBarInactiveTintColor: color.inkTertiary,
        tabBarLabelStyle: {
          fontFamily: fonts.monoMedium,
          fontSize: 9,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={STICKERS.compass} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={STICKERS.map} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={STICKERS.journal} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={STICKERS.key} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
