import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Body,
  Button,
  Capsule,
  Frame,
  InlineStickerLine,
  Mono,
  Muted,
  Screen,
  Section,
  Sticker,
  Title,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { INTEREST_LABELS } from '@/types';
import { formatDistance } from '@/utils/geo';
import { mapsDeepLinkPreview } from '@/services/navigation/maps';
import { stickerForCategory } from '@/design';
import { space } from '@/design/tokens';

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
      <Screen>
        <Title>Sidequest not found</Title>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const links = mapsDeepLinkPreview(quest.coordinates, quest.placeName);
  const sticker = stickerForCategory(quest.category);

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: space[10] }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <Sticker id={sticker} size="xl" tilt={-8} />
          <View style={{ flex: 1 }}>
            <Title>{quest.placeName}</Title>
            {quest.isSimulated ? <Capsule>Simulated</Capsule> : null}
          </View>
        </View>

        <Section title="The hook" sticker="spark">
          <InlineStickerLine leading={quest.storyHook} sticker={sticker} />
          <Muted>{quest.suggestedActivity}</Muted>
        </Section>

        <Section title="Place" sticker="arrive">
          <Body>{quest.description}</Body>
          <Mono>{quest.address}</Mono>
          <Mono>
            {formatDistance(quest.distanceMeters)}
            {quest.estimatedWalkingMinutes
              ? ` · ~${quest.estimatedWalkingMinutes} min walk`
              : ''}
            {' · '}
            {INTEREST_LABELS[quest.category]}
          </Mono>
          {quest.costInfo ? <Muted>Cost: {quest.costInfo}</Muted> : null}
        </Section>

        <Frame label="Why this">
          <Body>{quest.whyRecommended}</Body>
          <Mono style={{ marginTop: 8 }}>
            score  {quest.personalizationScore}
            {quest.scoreBreakdown
              ? ` · interest ${quest.scoreBreakdown.interest.toFixed(2)} · proximity ${quest.scoreBreakdown.proximity.toFixed(2)}`
              : ''}
          </Mono>
        </Frame>

        <Capsule>{quest.status}</Capsule>

        <View style={{ height: space[4] }} />

        <Button
          label="Accept sidequest"
          sticker="walk"
          onPress={async () => {
            await acceptQuest(quest.id);
            router.push('/quest/active');
          }}
        />
        <Button
          label="Open walking directions"
          variant="secondary"
          sticker="map"
          onPress={async () => {
            await acceptQuest(quest.id);
            await openDirections(quest.id);
            router.push('/quest/active');
          }}
        />
        <Button
          label="Save for later"
          variant="ghost"
          sticker="book"
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

        <Section title="Maps" sticker="compass">
          <Muted numberOfLines={2}>Apple: {links.apple}</Muted>
          <Muted numberOfLines={2}>Google: {links.google}</Muted>
        </Section>
      </ScrollView>
    </Screen>
  );
}
