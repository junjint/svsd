import { Alert, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  Chip,
  EditorialHeadline,
  Mono,
  Muted,
  Screen,
  Section,
  ToggleRow,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import {
  INTEREST_LABELS,
  type BudgetPreference,
  type DetourMinutes,
  type InterestCategory,
  type NotificationFrequency,
} from '@/types';
import { isSupabaseConfigured } from '@/services/supabase/client';
import { placeService } from '@/services/places/PlaceService';
import { stickerForCategory } from '@/design';
import { space } from '@/design/tokens';

const ALL_INTERESTS = Object.keys(INTEREST_LABELS) as InterestCategory[];

export default function SettingsScreen() {
  const router = useRouter();
  const preferences = useAppStore((s) => s.preferences);
  const demo = useAppStore((s) => s.demo);
  const updatePreferences = useAppStore((s) => s.updatePreferences);
  const setExplorationEnabled = useAppStore((s) => s.setExplorationEnabled);
  const enableBackgroundDiscovery = useAppStore(
    (s) => s.enableBackgroundDiscovery
  );
  const disableBackgroundDiscovery = useAppStore(
    (s) => s.disableBackgroundDiscovery
  );
  const clearPersonalData = useAppStore((s) => s.clearPersonalData);
  const setDemoEnabled = useAppStore((s) => s.setDemoEnabled);

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: space[12] }}>
        <EditorialHeadline before="Set" script="tings" sticker="key" level="title" />

        <Section title="Exploration" sticker="compass">
          <ToggleRow
            label="Exploration on"
            value={preferences.explorationEnabled}
            onValueChange={(v) => setExplorationEnabled(v)}
            description="When off, Sidequest stops monitoring and suggestions."
          />
          <ToggleRow
            label="Background location"
            value={preferences.backgroundLocationEnabled}
            onValueChange={async (v) => {
              if (v) {
                const result = await enableBackgroundDiscovery();
                Alert.alert('Background discovery', result.message);
              } else {
                await disableBackgroundDiscovery();
              }
            }}
            description="Only when you enable passive discovery. Falls back to foreground if denied."
          />
        </Section>

        <Section title="Notifications" sticker="bell">
          <Muted>
            Max {preferences.maxNotificationsPerDay}/day ·{' '}
            {preferences.cooldownMinutes}m cooldown · quiet{' '}
            {preferences.quietHoursStart}:00–{preferences.quietHoursEnd}:00
          </Muted>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(
              [
                ['low', 'Low'],
                ['medium', 'Medium'],
                ['high', 'High'],
              ] as [NotificationFrequency, string][]
            ).map(([v, label]) => (
              <Chip
                key={v}
                label={label}
                selected={preferences.notificationFrequency === v}
                onPress={() => updatePreferences({ notificationFrequency: v })}
              />
            ))}
          </View>
        </Section>

        <Section title="Interests" sticker="orb">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {ALL_INTERESTS.map((c) => (
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
        </Section>

        <Section title="Detour & budget" sticker="walk">
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(
              [
                ['free', 'Free'],
                ['under_10', 'Under $10'],
                ['under_25', 'Under $25'],
                ['any', 'Any'],
              ] as [BudgetPreference, string][]
            ).map(([v, label]) => (
              <Chip
                key={v}
                label={label}
                selected={preferences.budget === v}
                onPress={() => updatePreferences({ budget: v })}
              />
            ))}
          </View>
        </Section>

        <Section title="Privacy" sticker="pause">
          <Body>
            Location is voluntary. Journal chapters are private by default.
            Precise movement history is not retained.
          </Body>
          <ToggleRow
            label="Demo / simulation mode"
            value={demo.enabled}
            onValueChange={(v) => setDemoEnabled(v)}
            description="Downtown Ann Arbor demo places — no real GPS."
          />
          <Button
            label="Clear personal data"
            variant="danger"
            onPress={() => {
              Alert.alert(
                'Clear personal data?',
                'Removes preferences, sidequests, and journal chapters from this device.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                      await clearPersonalData();
                      router.replace('/onboarding');
                    },
                  },
                ]
              );
            }}
          />
        </Section>

        <Section title="Integrations" sticker="coral">
          <Mono>
            provider  {placeService.getMode()}
            {'\n'}
            supabase  {isSupabaseConfigured() ? 'configured' : 'local only'}
          </Mono>
          <Button
            label="Open demo tools"
            variant="ghost"
            sticker="key"
            onPress={() => router.push('/demo')}
          />
        </Section>
      </ScrollView>
    </Screen>
  );
}
