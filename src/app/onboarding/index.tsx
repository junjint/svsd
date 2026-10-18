import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  Chip,
  EditorialHeadline,
  InlineStickerLine,
  Muted,
  Screen,
  Section,
} from '@/components/ui';
import {
  INTEREST_LABELS,
  type BudgetPreference,
  type DetourMinutes,
  type InterestCategory,
  type NotificationFrequency,
  type SpontaneityLevel,
} from '@/types';
import { useAppStore } from '@/stores/appStore';
import { requestForegroundLocation } from '@/services/location/permissions';
import { stickerForCategory } from '@/design';
import { space } from '@/design/tokens';

const ALL_INTERESTS = Object.keys(INTEREST_LABELS) as InterestCategory[];

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const setExplorationEnabled = useAppStore((s) => s.setExplorationEnabled);

  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<InterestCategory[]>([
    'coffee',
    'bookstores',
    'art',
  ]);
  const [detourMinutes, setDetourMinutes] = useState<DetourMinutes>(10);
  const [budget, setBudget] = useState<BudgetPreference>('any');
  const [spontaneity, setSpontaneity] =
    useState<SpontaneityLevel>('adventurous');
  const [frequency, setFrequency] = useState<NotificationFrequency>('medium');
  const [avoided, setAvoided] = useState<InterestCategory[]>([]);
  const [locationNote, setLocationNote] = useState('');

  const toggleInterest = (c: InterestCategory) => {
    setInterests((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const toggleAvoid = (c: InterestCategory) => {
    setAvoided((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const finish = async (enableExploration: boolean) => {
    await completeOnboarding({
      interests,
      avoidedCategories: avoided,
      detourMinutes,
      budget,
      spontaneity,
      notificationFrequency: frequency,
      explorationEnabled: enableExploration,
    });
    if (enableExploration) {
      await setExplorationEnabled(true);
    }
    router.replace('/(tabs)/home');
  };

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: space[10] }}>
        <EditorialHeadline
          before="Side"
          script="quest"
          sticker="spark"
        />
        <InlineStickerLine
          leading="Life's better with"
          sticker="croissant"
          trailing="unexpected detours."
        />

        {step === 0 && (
          <Section title="Curious about" sticker="orb">
            <Body>Pick anything that sounds fun.</Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {ALL_INTERESTS.map((c) => (
                <Chip
                  key={c}
                  label={INTEREST_LABELS[c]}
                  sticker={stickerForCategory(c)}
                  selected={interests.includes(c)}
                  onPress={() => toggleInterest(c)}
                />
              ))}
            </View>
            <Button label="Next" sticker="walk" onPress={() => setStep(1)} />
          </Section>
        )}

        {step === 1 && (
          <Section title="Preferences" sticker="pencil">
            <Muted>Walking detour</Muted>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {([5, 10, 15, 20] as DetourMinutes[]).map((m) => (
                <Chip
                  key={m}
                  label={`${m} min`}
                  selected={detourMinutes === m}
                  onPress={() => setDetourMinutes(m)}
                />
              ))}
            </View>

            <Muted>Budget</Muted>
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
                  selected={budget === v}
                  onPress={() => setBudget(v)}
                />
              ))}
            </View>

            <Muted>Spontaneity</Muted>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {(
                [
                  ['comfortable', 'Comfortable'],
                  ['adventurous', 'Adventurous'],
                  ['surprise_me', 'Surprise Me'],
                ] as [SpontaneityLevel, string][]
              ).map(([v, label]) => (
                <Chip
                  key={v}
                  label={label}
                  selected={spontaneity === v}
                  onPress={() => setSpontaneity(v)}
                />
              ))}
            </View>

            <Muted>Notifications</Muted>
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
                  selected={frequency === v}
                  onPress={() => setFrequency(v)}
                />
              ))}
            </View>

            <Muted>Avoid (optional)</Muted>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {ALL_INTERESTS.map((c) => (
                <Chip
                  key={c}
                  label={INTEREST_LABELS[c]}
                  selected={avoided.includes(c)}
                  onPress={() => toggleAvoid(c)}
                />
              ))}
            </View>

            <Button label="Back" variant="ghost" onPress={() => setStep(0)} />
            <Button label="Next" sticker="walk" onPress={() => setStep(2)} />
          </Section>
        )}

        {step === 2 && (
          <Section title="Location" sticker="map">
            <Body>
              Sidequest can suggest nearby places when you grant location
              access. Background discovery is requested later only if you
              explicitly enable it.
            </Body>
            <Muted>
              Demo mode works without permissions using downtown Ann Arbor.
            </Muted>
            {locationNote ? <Body>{locationNote}</Body> : null}
            <Button
              label="Allow foreground location"
              variant="secondary"
              sticker="arrive"
              onPress={async () => {
                const ok = await requestForegroundLocation();
                setLocationNote(
                  ok
                    ? 'Foreground location granted.'
                    : 'Not granted — demo mode still works.'
                );
              }}
            />
            <Button
              label="Start exploring"
              sticker="spark"
              onPress={() => finish(true)}
            />
            <Button
              label="Skip for now"
              variant="ghost"
              onPress={() => finish(false)}
            />
            <Button label="Back" variant="ghost" onPress={() => setStep(1)} />
          </Section>
        )}
      </ScrollView>
    </Screen>
  );
}
