import { FlatList, View } from 'react-native';
import { Body, Brand, HeaderBand, Muted, Screen, Sticker } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { chapterTitle } from '@/services/journal/chapters';
import { stickerForCategory } from '@/design';
import { space } from '@/design/tokens';

export default function JournalScreen() {
  const chapters = useAppStore((s) => s.chapters);
  const getJournalStats = useAppStore((s) => s.getJournalStats);
  const stats = getJournalStats();

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <HeaderBand left="Sidequest * Journal" right="Chapters" />
      <Brand sticker="journal" />
      <Muted>
        {stats.chaptersCollected} chapters · {stats.placesDiscovered} places
      </Muted>
      <View style={{ height: space[4] }} />
      <FlatList
        data={chapters}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: space[8] }}
        ListEmptyComponent={<Muted>No chapters yet.</Muted>}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              gap: space[3],
              paddingVertical: space[4],
              alignItems: 'flex-start',
            }}
          >
            <Sticker id={stickerForCategory(item.category)} size="md" />
            <View style={{ flex: 1 }}>
              <Body>{chapterTitle(item)}</Body>
              <Muted>{item.reflection || 'No note'}</Muted>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
