import { useState } from 'react';
import { FlatList, View } from 'react-native';
import {
  Body,
  Button,
  EditorialHeadline,
  Field,
  Frame,
  Mono,
  Muted,
  Screen,
  Section,
  Sticker,
  Subtitle,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { chapterTitle } from '@/services/journal/chapters';
import { INTEREST_LABELS } from '@/types';
import { stickerForCategory } from '@/design';
import { space } from '@/design/tokens';

export default function JournalScreen() {
  const chapters = useAppStore((s) => s.chapters);
  const getJournalStats = useAppStore((s) => s.getJournalStats);
  const updateChapter = useAppStore((s) => s.updateChapter);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const stats = getJournalStats();

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <EditorialHeadline
        before="Adventure "
        script="journal"
        sticker="journal"
        level="title"
      />
      <Muted>Private chapters from places you found.</Muted>

      <Section title="Collection" sticker="candy">
        <Frame>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sticker id="spark" size="sm" />
            <Mono>Completed  {stats.sidequestsCompleted}</Mono>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Sticker id="map" size="sm" />
            <Mono>Places  {stats.placesDiscovered}</Mono>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Sticker id="journal" size="sm" />
            <Mono>Chapters  {stats.chaptersCollected}</Mono>
          </View>
          <Muted style={{ marginTop: 10 }}>
            {stats.categoriesExplored.length
              ? stats.categoriesExplored.map((c) => INTEREST_LABELS[c]).join(' · ')
              : 'No categories yet'}
          </Muted>
        </Frame>
      </Section>

      <FlatList
        data={chapters}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: space[10] }}
        ListEmptyComponent={
          <Muted>
            No chapters yet. Complete a sidequest and leave a short reflection.
          </Muted>
        }
        renderItem={({ item }) => (
          <View
            style={{
              paddingVertical: space[4],
              borderBottomWidth: 1,
              borderBottomColor: '#E8E8E8',
              flexDirection: 'row',
              gap: space[3],
            }}
          >
            <Sticker
              id={stickerForCategory(item.category)}
              size="lg"
              tilt={-5}
            />
            <View style={{ flex: 1 }}>
              <Subtitle>{chapterTitle(item)}</Subtitle>
              <Mono>
                {new Date(item.visitedAt).toLocaleString()} ·{' '}
                {INTEREST_LABELS[item.category]}
                {item.mood ? ` · ${item.mood}` : ''}
                {item.rating ? ` · ${item.rating}/5` : ''}
              </Mono>
              <Body style={{ marginTop: 6 }}>
                {item.reflection || '(No reflection yet)'}
              </Body>
              <Muted>Prompt: {item.originalPrompt}</Muted>
              {editingId === item.id ? (
                <>
                  <Field
                    value={draft}
                    onChangeText={setDraft}
                    multiline
                    placeholder="Update your reflection"
                  />
                  <Button
                    label="Save reflection"
                    sticker="pencil"
                    onPress={async () => {
                      await updateChapter(item.id, { reflection: draft });
                      setEditingId(null);
                    }}
                  />
                  <Button
                    label="Cancel"
                    variant="ghost"
                    onPress={() => setEditingId(null)}
                  />
                </>
              ) : (
                <Button
                  label="Edit reflection"
                  variant="ghost"
                  onPress={() => {
                    setEditingId(item.id);
                    setDraft(item.reflection);
                  }}
                />
              )}
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
