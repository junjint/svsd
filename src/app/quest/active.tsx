import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  HeaderBand,
  Muted,
  ScreenScroll,
  Sticker,
  Title,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { formatDistance, distanceMeters } from '@/utils/geo';
import { ARRIVAL_THRESHOLD_METERS } from '@/services/sidequest/lifecycle';
import { stickerForCategory } from '@/design';
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
      <ScreenScroll>
        <Title>No active quest</Title>
        <Button
          label="Discover"
          variant="ghost"
          onPress={() => router.push('/(tabs)/discover')}
        />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      <HeaderBand
        left="Sidequest * Active"
        right={quest.status.replace('_', ' ')}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <Sticker id={stickerForCategory(quest.category)} size="lg" />
        <Title style={{ flex: 1, fontSize: 22 }}>{quest.placeName}</Title>
      </View>
      <View style={{ height: space[4] }} />
      <Body>{quest.storyHook}</Body>
      <Muted>
        {distance != null
          ? `${formatDistance(distance)}${
              distance <= ARRIVAL_THRESHOLD_METERS ? ' (arrived)' : ''
            }`
          : quest.status}
      </Muted>

      <Button label="Directions" onPress={() => openDirections(quest.id)} />
      <Button
        label="I've arrived"
        variant="ghost"
        onPress={() => markArrived(quest.id)}
      />
      <Button
        label="Write chapter"
        variant="ghost"
        onPress={() =>
          router.push({ pathname: '/quest/complete', params: { id: quest.id } })
        }
      />
      <Button
        label="Abandon"
        variant="ghost"
        onPress={async () => {
          await abandonQuest(quest.id);
          router.replace('/(tabs)/home');
        }}
      />
    </ScreenScroll>
  );
}
