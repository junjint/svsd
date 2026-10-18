import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Brand,
  Button,
  Chip,
  HeaderBand,
  Muted,
  QuestRow,
  Screen,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { INTEREST_LABELS, type InterestCategory } from '@/types';
import { formatDistance } from '@/utils/geo';
import { stickerForCategory } from '@/design';
import { space } from '@/design/tokens';

export default function DiscoverScreen() {
  const router = useRouter();
  const sidequests = useAppStore((s) => s.sidequests);
  const discoverNearby = useAppStore((s) => s.discoverNearby);
  const [filter, setFilter] = useState<InterestCategory | 'all'>('all');
  const [busy, setBusy] = useState(false);

  const items = useMemo(
    () =>
      sidequests
        .filter((q) => ['suggested', 'saved', 'discovered'].includes(q.status))
        .filter((q) => (filter === 'all' ? true : q.category === filter)),
    [sidequests, filter]
  );

  const categories = useMemo(
    () => [...new Set(sidequests.map((q) => q.category))],
    [sidequests]
  );

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <HeaderBand left="Sidequest * Discover" right={`${items.length}`} />
      <Brand />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: space[2] }}>
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        {categories.map((c) => (
          <Chip
            key={c}
            label={INTEREST_LABELS[c]}
            sticker={stickerForCategory(c)}
            selected={filter === c}
            onPress={() => setFilter(c)}
          />
        ))}
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: space[8] }}
        ListEmptyComponent={<Muted>No sidequests yet.</Muted>}
        ListHeaderComponent={
          <Button
            label={busy ? '…' : 'Refresh'}
            variant="ghost"
            onPress={async () => {
              setBusy(true);
              try {
                await discoverNearby();
              } finally {
                setBusy(false);
              }
            }}
          />
        }
        renderItem={({ item }) => (
          <QuestRow
            name={item.placeName}
            meta={formatDistance(item.distanceMeters)}
            sticker={stickerForCategory(item.category)}
            onPress={() => router.push(`/quest/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}
