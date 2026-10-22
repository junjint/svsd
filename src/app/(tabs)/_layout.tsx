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
        {/* Library | + | Profile: the Draw is the round button in the middle */}
        <Tabs.Screen name="folders" options={{ title: 'Library' }} />
        <Tabs.Screen name="draw" options={{ title: 'New sidequest' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
      <CitySheetHost />
    </View>
  );
}
