import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  Capsule,
  EditorialHeadline,
  Frame,
  InlineStickerLine,
  Mono,
  Muted,
  QuestRow,
  Screen,
  Section,
  Sticker,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { formatDistance } from '@/utils/geo';
import { INTEREST_LABELS } from '@/types';
import { stickerForCategory, stickerForStatus } from '@/design';
import { space } from '@/design/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const discovery = useAppStore((s) => s.discovery);
  const preferences = useAppStore((s) => s.preferences);
  const demo = useAppStore((s) => s.demo);
  const sidequests = useAppStore((s) => s.sidequests);
  const getActiveQuest = useAppStore((s) => s.getActiveQuest);
  const generateNow = useAppStore((s) => s.generateNow);
  const setExplorationEnabled = useAppStore((s) => s.setExplorationEnabled);
  const discoverNearby = useAppStore((s) => s.discoverNearby);
  const lastNotificationPreview = useAppStore((s) => s.lastNotificationPreview);
  const [busy, setBusy] = useState(false);

  const active = getActiveQuest();
  const nearby = sidequests
    .filter((q) => q.status === 'suggested' || q.status === 'saved')
    .slice(0, 5);

  const onGenerate = useCallback(async () => {
    setBusy(true);
    try {
      const quest = await generateNow();
      if (quest) router.push(`/quest/${quest.id}`);
    } finally {
      setBusy(false);
    }
  }, [generateNow, router]);

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: space[10] }}
        refreshControl={
          <RefreshControl
            refreshing={busy}
            tintColor="#000"
            onRefresh={async () => {
              setBusy(true);
              try {
                await discoverNearby();
              } finally {
                setBusy(false);
              }
            }}
          />
        }
      >
        <EditorialHeadline
          before="Side"
          script="quest"
          sticker="spark"
          stickerPlacement="trailing"
        />
        <InlineStickerLine
          leading="Life's better with"
          sticker="seed"
          trailing="sidequests."
        />

        <Section title="Status" sticker="compass">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Capsule selected={discovery.status === 'exploring'}>
              {discovery.status === 'exploring' ? 'Exploring' : 'Paused'}
            </Capsule>
            <Sticker
              id={discovery.status === 'exploring' ? 'walk' : 'pause'}
              size="md"
              tilt={-10}
            />
          </View>
          <Mono>
            {demo.enabled ? demo.locationLabel : discovery.currentAreaLabel ?? 'Unknown'}
            {demo.enabled ? ' · simulated' : ''}
          </Mono>
          <Muted>
            Travel mode: {discovery.travelMode}
            {preferences.explorationEnabled ? '' : ' · exploration off'}
          </Muted>
          <Button
            label={
              preferences.explorationEnabled
                ? 'Pause Sidequest'
                : 'Resume exploration'
            }
            variant="secondary"
            sticker={preferences.explorationEnabled ? 'pause' : 'walk'}
            onPress={() =>
              setExplorationEnabled(!preferences.explorationEnabled)
            }
          />
        </Section>

        {lastNotificationPreview ? (
          <Frame label="Notification">
            <InlineStickerLine
              leading={lastNotificationPreview.title}
              sticker="bell"
            />
            <Body>{lastNotificationPreview.body}</Body>
          </Frame>
        ) : null}

        {active ? (
          <Section title="Active" sticker={stickerForStatus(active.status)}>
            <QuestRow
              name={active.placeName}
              hook={active.storyHook}
              meta={`${formatDistance(active.distanceMeters)} · ${INTEREST_LABELS[active.category]} · ${active.status}`}
              sticker={stickerForCategory(active.category)}
              onPress={() => router.push('/quest/active')}
            />
          </Section>
        ) : null}

        <Section title="Nearby" sticker="map">
          {nearby.length === 0 ? (
            <Muted>No suggestions yet. Generate one below.</Muted>
          ) : (
            nearby.map((q) => (
              <QuestRow
                key={q.id}
                name={q.placeName}
                hook={q.storyHook}
                meta={`${formatDistance(q.distanceMeters)}${
                  q.estimatedWalkingMinutes
                    ? ` · ~${q.estimatedWalkingMinutes} min`
                    : ''
                }`}
                sticker={stickerForCategory(q.category)}
                onPress={() => router.push(`/quest/${q.id}`)}
              />
            ))
          )}
        </Section>

        <Button
          label={busy ? 'Working…' : 'Generate a sidequest now'}
          sticker="spark"
          onPress={onGenerate}
          disabled={busy}
        />
        <Button
          label="Preferences"
          variant="ghost"
          onPress={() => router.push('/(tabs)/settings')}
        />
        <Button
          label="Developer / Demo tools"
          variant="ghost"
          sticker="key"
          onPress={() => router.push('/demo')}
        />
      </ScrollView>
    </Screen>
  );
}
