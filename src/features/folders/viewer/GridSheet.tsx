import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { color, space } from '@/theme';
import type { FolderPhoto } from '@/types';
import { Sheet, useScreen } from '@/ui';

/** Every photo at once; tap one to jump the viewer there */
export function GridSheet({ photos, current, visible, onClose, onPick }: { photos: FolderPhoto[]; current: number; visible: boolean; onClose: () => void; onPick: (i: number) => void }) {
  const { width } = useScreen();
  const cell = Math.floor((Math.min(width, 430) - space.xl * 2 - space.sm * 2) / 3);
  return (
    <Sheet visible={visible} onClose={onClose} title={`${photos.length} photo${photos.length === 1 ? '' : 's'}`}>
      <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={styles.grid}>
        {photos.map((p, i) => (
          <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Go to photo ${i + 1}`} onPress={() => onPick(i)}>
            {({ pressed }) => (
              <View style={[styles.cell, { width: cell, height: cell, transform: [{ scale: pressed ? 0.96 : 1 }] }, i === current && styles.on]}>
                <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cell: { borderRadius: 12, overflow: 'hidden', backgroundColor: color.line },
  on: { borderWidth: 3, borderColor: color.cobalt },
});
