import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  Capsule,
  Frame,
  Mono,
  Muted,
  Screen,
  Section,
  Sticker,
  Title,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { formatDistance, distanceMeters } from '@/utils/geo';
import { ARRIVAL_THRESHOLD_METERS } from '@/services/sidequest/lifecycle';
import { stickerForCategory, stickerForStatus } from '@/design';
import { space } from '@/design/tokens';

export default function ActiveQuestScreen() {
  const router = useRouter();
  const getActiveQuest = useAppStore((s) => s.getActiveQuest);
  const currentLocation = useAppStore((s) => s.currentLocation);
  const openDirections = useAppStore((s) => s.openDirections);
  const markArrived = useAppStore((s) => s.markArrived);
  const checkArrival = useAppStore((s) => s.checkArrival);
  const abandonQuest = useAppStore((s) => s.abandonQuest);
  const sidequests = useAppStore((s) => s.sidequests);
  const [distance, setDistance] = useState<number | null>(null);

  const quest =
    getActiveQuest() ??
    sidequests.find((q) =>
      ['accepted', 'en_route', 'arrived'].includes(q.status)
    ) ??
    null;

  useEffect(() => {
    if (!quest || !currentLocation) return;
    setDistance(distanceMeters(currentLocation, quest.coordinates));
    void checkArrival();
  }, [quest, currentLocation, checkArrival, sidequests]);

  if (!quest) {
    return (
      <Screen>
        <Title>No active sidequest</Title>
        <Body>Accept a suggestion from Home or Discover to begin.</Body>
        <Button
          label="Go to Discover"
          sticker="map"
          onPress={() => router.push('/(tabs)/discover')}
        />
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: space[10] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Sticker
            id={stickerForCategory(quest.category)}
            size="xl"
            tilt={6}
          />
          <View style={{ flex: 1 }}>
            <Title>{quest.placeName}</Title>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Capsule>{quest.status}</Capsule>
              <Sticker id={stickerForStatus(quest.status)} size="sm" />
            </View>
          </View>
        </View>

        <Body style={{ marginTop: space[4] }}>{quest.storyHook}</Body>

        <Section title="Destination" sticker="arrive">
          <Mono>{quest.address}</Mono>
          <Muted>
            Estimate: {formatDistance(quest.distanceMeters)}
            {quest.estimatedWalkingMinutes
              ? ` · ~${quest.estimatedWalkingMinutes} min`
              : ''}
          </Muted>
          {distance != null ? (
            <Frame label="Now">
              <Body>
                {formatDistance(distance)}
                {distance <= ARRIVAL_THRESHOLD_METERS
                  ? ' — you appear to have arrived.'
                  : ' away'}
              </Body>
            </Frame>
          ) : null}
        </Section>

        <Button
          label="Open directions"
          sticker="map"
          onPress={() => openDirections(quest.id)}
        />
        <Button
          label="Simulate / mark arrival"
          variant="secondary"
          sticker="arrive"
          onPress={async () => {
            await markArrived(quest.id);
          }}
        />
        <Button
          label="Complete & write chapter"
          sticker="journal"
          onPress={() =>
            router.push({ pathname: '/quest/complete', params: { id: quest.id } })
          }
        />
        <Button
          label="Abandon"
          variant="danger"
          onPress={async () => {
            await abandonQuest(quest.id);
            router.replace('/(tabs)/home');
          }}
        />
      </ScrollView>
    </Screen>
  );
}
