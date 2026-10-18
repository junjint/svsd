import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Body,
  Button,
  HeaderBand,
  KnockoutBlock,
  Muted,
  ScreenScroll,
  Sticker,
  Title,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { formatDistance } from '@/utils/geo';
import { stickerForCategory } from '@/design';
import { color, space } from '@/design/tokens';

export default function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const quest = useAppStore((s) => s.sidequests.find((q) => q.id === id));
  const acceptQuest = useAppStore((s) => s.acceptQuest);
  const dismissQuest = useAppStore((s) => s.dismissQuest);
  const saveQuest = useAppStore((s) => s.saveQuest);
  const openDirections = useAppStore((s) => s.openDirections);

  if (!quest) {
    return (
      <ScreenScroll>
        <Title>Gone</Title>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      <HeaderBand left="Sidequest * Quest" right={formatDistance(quest.distanceMeters)} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <Sticker id={stickerForCategory(quest.category)} size="lg" />
        <Title style={{ flex: 1, fontSize: 22 }}>{quest.placeName}</Title>
      </View>

      <View style={{ height: space[5] }} />
      <KnockoutBlock style={{ marginBottom: space[4] }}>
        <Body style={{ color: color.onSurface }}>{quest.storyHook}</Body>
      </KnockoutBlock>
      <View style={{ height: space[2] }} />
      <Muted>
        {formatDistance(quest.distanceMeters)}
        {quest.estimatedWalkingMinutes
          ? ` · ${quest.estimatedWalkingMinutes} min`
          : ''}
      </Muted>

      <Button
        label="Accept"
        onPress={async () => {
          await acceptQuest(quest.id);
          router.push('/quest/active');
        }}
      />
      <Button
        label="Directions"
        variant="ghost"
        onPress={async () => {
          await acceptQuest(quest.id);
          await openDirections(quest.id);
          router.push('/quest/active');
        }}
      />
      <Button
        label="Save"
        variant="ghost"
        onPress={async () => {
          await saveQuest(quest.id);
          router.back();
        }}
      />
      <Button
        label="Dismiss"
        variant="ghost"
        onPress={async () => {
          await dismissQuest(quest.id);
          router.back();
        }}
      />
    </ScreenScroll>
  );
}
