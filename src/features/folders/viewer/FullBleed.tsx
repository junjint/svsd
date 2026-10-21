import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FrameModal, useScreen } from '@/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassIconButton, Text, color, radius } from '@/theme';
import type { FolderPhoto } from '@/types';
import { Photo } from '../Photo';
import { Close } from '../icons';

/** Tap a photo: it fills the screen, swipe between them, "n/N" up top */
export function FullBleed({
  photos,
  start,
  visible,
  onClose,
}: {
  photos: FolderPhoto[];
  start: number;
  visible: boolean;
  onClose: (at: number) => void;
}) {
  const { width, height } = useScreen();
  const W = Math.min(width, 430);
  const insets = useSafeAreaInsets();
  const [at, setAt] = useState(start);
  const list = useRef<FlatList<FolderPhoto>>(null);

  useEffect(() => {
    if (visible) setAt(start);
  }, [visible, start]);

  return (
    <FrameModal visible={visible} animationType="fade" onRequestClose={() => onClose(at)} statusBarTranslucent>
      <View style={styles.root}>
        <FlatList
          ref={list}
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={Math.min(start, Math.max(0, photos.length - 1))}
          getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
          keyExtractor={(p) => p.id}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setAt(Math.round(e.nativeEvent.contentOffset.x / W))}
          onScroll={(e) => setAt(Math.round(e.nativeEvent.contentOffset.x / W))}
          scrollEventThrottle={64}
          renderItem={({ item }) => (
            <View style={{ width: W, height }}>
              <Photo uri={item.uri} radius={0} contentFit="contain" style={StyleSheet.absoluteFill} />
            </View>
          )}
        />
        <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
          <View style={styles.counter} accessibilityLiveRegion="polite">
            <Text variant="callout" style={{ color: color.white, fontVariant: ['tabular-nums'], fontWeight: '600' }}>
              {Math.min(at + 1, photos.length)}/{photos.length}
            </Text>
          </View>
        </View>
        <View style={[styles.close, { top: insets.top + 4 }]}>
          <GlassIconButton label="Close" onPress={() => onClose(at)} size={44}>
            <Close />
          </GlassIconButton>
        </View>
      </View>
    </FrameModal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ink },
  top: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  counter: { paddingHorizontal: 12, height: 28, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.16)', justifyContent: 'center' },
  close: { position: 'absolute', left: 16 },
});
