import { createContext, useContext, type ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import { Caveat_500Medium, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { color } from './tokens';

const ThemeReadyContext = createContext(false);

export function useThemeReady(): boolean {
  return useContext(ThemeReadyContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [loaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    Caveat_500Medium,
    Caveat_700Bold,
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
