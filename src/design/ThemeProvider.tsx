import { createContext, useContext, type ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  useFonts,
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_600SemiBold,
  SchibstedGrotesk_700Bold,
  SchibstedGrotesk_900Black,
} from '@expo-google-fonts/schibsted-grotesk';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { color } from './tokens';

const ThemeReadyContext = createContext(false);

export function useThemeReady(): boolean {
  return useContext(ThemeReadyContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [loaded] = useFonts({
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_600SemiBold,
    SchibstedGrotesk_700Bold,
    SchibstedGrotesk_900Black,
    BebasNeue_400Regular,
  });

  if (!loaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={color.ink} />
      </View>
    );
  }

  return (
    <ThemeReadyContext.Provider value={true}>{children}</ThemeReadyContext.Provider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg,
  },
});
