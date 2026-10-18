import { useMemo, useState } from 'react';
import { FlatList, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import {
  Button,
  Chip,
  EditorialHeadline,
  Muted,
  QuestRow,
  Screen,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { INTEREST_LABELS, type InterestCategory } from '@/types';
import { formatDistance } from '@/utils/geo';
import { stickerForCategory } from '@/design';
import { color, space } from '@/design/tokens';

export default function DiscoverScreen() {
  const router = useRouter();
  const sidequests = useAppStore((s) => s.sidequests);
  const currentLocation = useAppStore((s) => s.currentLocation);
  const discoverNearby = useAppStore((s) => s.discoverNearby);
  const [filter, setFilter] = useState<InterestCategory | 'all'>('all');
  const [showMap, setShowMap] = useState(false);
  const [busy, setBusy] = useState(false);

  const items = useMemo(() => {
    return sidequests
      .filter((q) =>
        ['suggested', 'saved', 'discovered'].includes(q.status)
      )
      .filter((q) => (filter === 'all' ? true : q.category === filter));
  }, [sidequests, filter]);

  const categories = useMemo(() => {
    const set = new Set(sidequests.map((q) => q.category));
    return [...set];
  }, [sidequests]);

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <EditorialHeadline
        before="Dis"
        script="cover"
        sticker="map"
        level="title"
      />
      <Muted>Nearby sidequests — accept, save, or dismiss.</Muted>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: space[3] }}>
        <Chip
          label="All"
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
        />
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

      <Button
        label={busy ? 'Refreshing…' : 'Refresh nearby'}
        sticker="compass"
        onPress={async () => {
          setBusy(true);
          try {
            await discoverNearby();
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button
        label={showMap ? 'Show list' : 'Show map'}
        variant="ghost"
        onPress={() => setShowMap((v) => !v)}
      />

      {showMap && currentLocation && Platform.OS !== 'web' ? (
        <MapView
          style={{
            height: 220,
            marginVertical: space[3],
            borderWidth: 1,
            borderColor: color.line,
          }}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
        >
          <Marker coordinate={currentLocation} title="You" />
          {items.map((q) => (
            <Marker
              key={q.id}
              coordinate={q.coordinates}
              title={q.placeName}
              description={q.storyHook}
              onCalloutPress={() => router.push(`/quest/${q.id}`)}
            />
          ))}
        </MapView>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: space[10] }}
        ListEmptyComponent={
          <Muted>No sidequests yet. Refresh or generate from Home.</Muted>
        }
        renderItem={({ item }) => (
          <QuestRow
            name={item.placeName}
            hook={item.storyHook}
            meta={`${formatDistance(item.distanceMeters)} · ${INTEREST_LABELS[item.category]} · ${item.status}${item.isSimulated ? ' · sim' : ''}`}
            sticker={stickerForCategory(item.category)}
            onPress={() => router.push(`/quest/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}
