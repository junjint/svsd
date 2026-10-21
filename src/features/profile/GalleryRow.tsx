import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TornPaper, color, radius, receiptInk, space } from '@/theme';
import type { QuestFolder } from '@/types';
import { Photo } from '@/features/folders/Photo';

const W = 132;

/** The folders saved to Gallery, as a strip of covers */
export function GalleryRow({ folders, visibility, onOpen }: { folders: QuestFolder[]; visibility: 'public' | 'private'; onOpen: (f: QuestFolder) => void }) {
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.head}>
        <Text variant="headline">Gallery</Text>
        <Text variant="callout" style={{ color: color.ink3 }}>{visibility === 'public' ? 'Public' : 'Only you'}</Text>
      </View>
      {folders.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="callout" style={{ textAlign: 'center' }}>
            Nothing here yet. Open a folder, tap More, and turn on Save to Gallery.
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingHorizontal: space.xl, paddingBottom: space.md }}>
          {folders.map((f, i) => {
            const cover = f.photos[f.photos.length - 1]?.uri;
            return (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                accessibilityLabel={`${f.title}, ${f.photos.length} photos`}
                onPress={() => onOpen(f)}
                style={({ pressed }) => ({ width: W, transform: [{ scale: pressed ? 0.97 : 1 }, { rotate: `${i % 2 ? 1.5 : -1.5}deg` }] })}
              >
                <TornPaper seed={`gallery-${f.id}`} contentStyle={styles.slip}>
                  <View style={styles.cover}>
                    {cover ? <Photo uri={cover} radius={2} style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: color.line }]} />}
                  </View>
                  <Text style={[receiptInk, styles.caption]} numberOfLines={1}>
                    {f.title.toUpperCase()}
                  </Text>
                </TornPaper>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.xl },
  slip: { padding: 8, gap: 8 },
  cover: { width: W - 16, height: (W - 16) * 1.15, borderRadius: 2, overflow: 'hidden' },
  caption: { fontSize: 9, letterSpacing: 0.6 },
  empty: { marginHorizontal: space.xl, padding: space.xl, borderRadius: radius.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.line },
});
