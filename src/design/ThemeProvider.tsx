import { createContext, useContext, type ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { color } from './tokens';

const ThemeReadyContext = createContext(false);

export function useThemeReady(): boolean {
  return useContext(ThemeReadyContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  if (!loaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={color.piccolo} />
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
    backgroundColor: color.goku,
  },
});
