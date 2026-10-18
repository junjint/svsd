import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Brand,
  Button,
  Chip,
  HeaderBand,
  ScreenScroll,
  ToggleRow,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import {
  INTEREST_LABELS,
  type DetourMinutes,
  type InterestCategory,
} from '@/types';
import { stickerForCategory } from '@/design';
import { space } from '@/design/tokens';

const ALL = Object.keys(INTEREST_LABELS) as InterestCategory[];

export default function SettingsScreen() {
  const router = useRouter();
  const preferences = useAppStore((s) => s.preferences);
  const demo = useAppStore((s) => s.demo);
  const updatePreferences = useAppStore((s) => s.updatePreferences);
  const setExplorationEnabled = useAppStore((s) => s.setExplorationEnabled);
  const clearPersonalData = useAppStore((s) => s.clearPersonalData);
  const setDemoEnabled = useAppStore((s) => s.setDemoEnabled);

  return (
    <ScreenScroll>
      <HeaderBand left="Sidequest * Settings" right="Prefs" />
      <Brand />

      <ToggleRow
        label="Exploration"
        value={preferences.explorationEnabled}
        onValueChange={(v) => setExplorationEnabled(v)}
      />
      <ToggleRow
        label="Demo mode"
        value={demo.enabled}
        onValueChange={(v) => setDemoEnabled(v)}
      />

      <View style={{ height: space[5] }} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {ALL.map((c) => (
          <Chip
            key={c}
            label={INTEREST_LABELS[c]}
            sticker={stickerForCategory(c)}
            selected={preferences.interests.includes(c)}
            onPress={() => {
              const interests = preferences.interests.includes(c)
                ? preferences.interests.filter((x) => x !== c)
                : [...preferences.interests, c];
              updatePreferences({ interests });
            }}
          />
        ))}
      </View>

      <View style={{ height: space[3] }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {([5, 10, 15, 20] as DetourMinutes[]).map((m) => (
          <Chip
            key={m}
            label={`${m} min`}
            selected={preferences.detourMinutes === m}
            onPress={() => updatePreferences({ detourMinutes: m })}
          />
        ))}
      </View>

      <Button label="Demo tools" variant="ghost" onPress={() => router.push('/demo')} />
      <Button
        label="Clear data"
        variant="ghost"
        onPress={() => {
          Alert.alert('Clear personal data?', undefined, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clear',
              style: 'destructive',
              onPress: async () => {
                await clearPersonalData();
                router.replace('/onboarding');
              },
            },
          ]);
        }}
      />
    </ScreenScroll>
  );
}
