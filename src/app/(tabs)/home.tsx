import { useCallback, useState } from 'react';
import { RefreshControl, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  CollageHero,
  HeaderBand,
  Muted,
  Panel,
  QuestRow,
  ScreenScroll,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { formatDistance } from '@/utils/geo';
import { stickerForCategory } from '@/design';
import { color, space } from '@/design/tokens';

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
  const [busy, setBusy] = useState(false);

  const active = getActiveQuest();
  const nearby = sidequests
    .filter((q) => q.status === 'suggested' || q.status === 'saved')
    .slice(0, 4);

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
    <ScreenScroll
      refreshControl={
        <RefreshControl
          refreshing={busy}
          tintColor={color.piccolo}
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
      <HeaderBand
        left="Home"
        live={discovery.status === 'exploring'}
      />

      <CollageHero line1="Side" line2="quest" />

      <Body style={styles.support}>
        {demo.enabled
          ? `Demo: ${demo.locationLabel}`
          : 'Places worth a short walk from where you are.'}
      </Body>

      <Button
        label={busy ? 'Working' : 'Find a sidequest'}
        onPress={onGenerate}
        disabled={busy}
      />

      {(active || nearby.length > 0) && (
        <Panel>
          {active ? (
            <QuestRow
              name={active.placeName}
              meta={formatDistance(active.distanceMeters)}
              sticker={stickerForCategory(active.category)}
              onPress={() => router.push('/quest/active')}
            />
          ) : null}
          {nearby.map((q) => (
            <QuestRow
              key={q.id}
              name={q.placeName}
              meta={formatDistance(q.distanceMeters)}
              sticker={stickerForCategory(q.category)}
              onPress={() => router.push(`/quest/${q.id}`)}
            />
          ))}
        </Panel>
      )}

      {nearby.length === 0 && !active ? (
        <Muted style={styles.empty}>No suggestions yet.</Muted>
      ) : null}

      <Button
        label={preferences.explorationEnabled ? 'Pause' : 'Explore'}
        variant="ghost"
        onPress={() => setExplorationEnabled(!preferences.explorationEnabled)}
      />
      <Button
        label="Demo"
        variant="ghost"
        onPress={() => router.push('/demo')}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  support: {
    color: color.trunks,
    marginBottom: space[2],
  },
  empty: {
    textAlign: 'center',
    marginTop: space[5],
  },
});
