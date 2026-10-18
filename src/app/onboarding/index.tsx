import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  Chip,
  CollageHero,
  Panel,
  PosterScreen,
} from '@/components/ui';
import { type DetourMinutes, type InterestCategory } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { stickerForCategory } from '@/design';
import { color, space } from '@/design/tokens';

const INTERESTS: { id: InterestCategory; label: string }[] = [
  { id: 'coffee', label: 'Coffee' },
  { id: 'nature', label: 'Nature' },
  { id: 'bookstores', label: 'Books' },
  { id: 'live_music', label: 'Music' },
  { id: 'art', label: 'Art' },
  { id: 'thrifting', label: 'Thrift' },
  { id: 'local_food', label: 'Food' },
  { id: 'architecture', label: 'Landmarks' },
  { id: 'community_events', label: 'Events' },
  { id: 'study_spots', label: 'Study' },
  { id: 'cultural', label: 'Culture' },
  { id: 'unexpected', label: 'Surprise' },
];

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

  const toggle = (c: InterestCategory) => {
    setInterests((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const finish = async () => {
    await completeOnboarding({
      interests,
      detourMinutes,
      explorationEnabled: true,
    });
    await setExplorationEnabled(true);
    router.replace('/(tabs)/home');
  };

  return (
    <PosterScreen
      bandLeft="Home"
      bandRight={step === 0 ? 'Interests' : 'Distance'}
      edgeLeft="Ann Arbor"
      edgeRight="Walk more"
      floor="SIDEQUEST"
      centered
    >
      <CollageHero
        line1="SIDE"
        line2="QUEST"
        stickers={['spark', 'coffee', 'book', 'art']}
      />

      <Body style={styles.support}>
        {step === 0
          ? 'Pick what you care about. We suggest nearby places worth a short walk.'
          : 'Choose a walking distance that feels easy to say yes to.'}
      </Body>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Panel>
          <View style={styles.chips}>
            {step === 0
              ? INTERESTS.map(({ id, label }) => (
                  <Chip
                    key={id}
                    label={label}
                    sticker={stickerForCategory(id)}
                    selected={interests.includes(id)}
                    onPress={() => toggle(id)}
                  />
                ))
              : ([5, 10, 15, 20] as DetourMinutes[]).map((m) => (
                  <Chip
                    key={m}
                    label={`${m} min`}
                    selected={detourMinutes === m}
                    onPress={() => setDetourMinutes(m)}
                  />
                ))}
          </View>
        </Panel>
      </ScrollView>

      <View style={styles.footer}>
        {step === 0 ? (
          <Button
            label="Continue"
            onPress={() => setStep(1)}
            disabled={interests.length === 0}
          />
        ) : (
          <>
            <Button label="Get started" onPress={finish} />
            <Button label="Back" variant="ghost" onPress={() => setStep(0)} />
          </>
        )}
      </View>
    </PosterScreen>
  );
}

const styles = StyleSheet.create({
  support: {
    textAlign: 'center',
    color: color.muted,
    maxWidth: 300,
    marginBottom: space[4],
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'stretch',
    paddingBottom: space[4],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footer: {
    width: '100%',
    paddingTop: space[3],
    alignItems: 'center',
    gap: space[1],
  },
});
