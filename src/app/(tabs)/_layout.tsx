import { View } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { CitySheetHost } from '@/features/location';
import { color } from '@/theme';
import { TabBar } from '@/ui';

/* Floating frosted tab bar (Bencho tab-bar port, SPEC §4.6). Screens run
   under it; pad scroll content with useTabBarSpace() from @/ui. */
export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.paper } }}
      >
        {/* Library | + | Gallery: the Draw is the round button in the middle. Profile isn't a
            tab: it's a page (src/app/profile.tsx) opened from the Draw's top right */}
        <Tabs.Screen name="folders" options={{ title: 'Library' }} />
        <Tabs.Screen name="draw" options={{ title: 'New sidequest' }} />
        <Tabs.Screen name="gallery" options={{ title: 'Gallery' }} />
      </Tabs>
      <CitySheetHost />
    </View>
  );
}
