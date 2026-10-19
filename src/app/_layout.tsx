import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppStore } from '@/stores/appStore';
import { addNotificationResponseListener } from '@/services/notifications/notifications';
import { ThemeProvider, color, fonts, Loading } from '@/design';

export default function RootLayout() {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);
  const router = useRouter();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const sub = addNotificationResponseListener((sidequestId) => {
      router.push(`/quest/${sidequestId}`);
    });
    return () => sub.remove();
  }, [router]);

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.bg }}>
        <StatusBar style="dark" />
        {!hydrated ? (
          <Loading />
        ) : (
          <Stack
            screenOptions={{
              headerShown: true,
              headerShadowVisible: false,
              headerStyle: { backgroundColor: color.bg },
              headerTitleStyle: {
                fontFamily: fonts.sansMedium,
                fontSize: 15,
                color: color.ink,
              },
              headerTintColor: color.ink,
              headerBackTitle: '',
              contentStyle: { backgroundColor: color.bg },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="quest/[id]" options={{ title: '' }} />
            <Stack.Screen name="quest/active" options={{ title: '' }} />
            <Stack.Screen name="quest/complete" options={{ title: '' }} />
            <Stack.Screen name="demo" options={{ title: 'Demo' }} />
          </Stack>
        )}
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
