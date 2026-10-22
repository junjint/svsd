import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initSounds } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { DeviceFrame, ToastHost } from '@/ui';
import { ThemeProvider, color } from '@/theme';

export default function RootLayout() {
  const hydrate = useSidequestStore((s) => s.hydrate);
  const hydrated = useSidequestStore((s) => s.hydrated);

  useEffect(() => {
    void initSounds();
    void hydrate();
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.paper }}>
          {/* Desktop web shows the app inside an iPhone, like the Forum prototype */}
          <DeviceFrame>
          <StatusBar style="dark" />
          {hydrated && (
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.paper } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="quest/[id]" />
              <Stack.Screen name="folder/[id]" />
              <Stack.Screen name="gallery/[id]" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
              <Stack.Screen name="about" options={{ presentation: 'modal' }} />
              <Stack.Screen name="map" />
              <Stack.Screen name="walk" />
            </Stack>
          )}
          {hydrated && <ToastHost />}
          </DeviceFrame>
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
