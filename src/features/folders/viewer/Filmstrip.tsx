import { forwardRef, useImperativeHandle } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { color } from '@/theme';
import type { FolderPhoto } from '@/types';

/* ══ Filmstrip scrubber — the photo-viewer reference ═════════
   A strip of thumbnails pinned to the bottom. Its scroll offset IS the
   viewer's position: `progress` = offset / step, a float, so the main
   image slides with the finger. The thumb nearest the centre grows and
   gets a frame. `scrub` goes to 1 on every scroll event and eases back
   to 0 once the strip has been still for a beat — the title reads it. */

export const THUMB = 44;
const STEP = THUMB + 8;
const SETTLE = Easing.bezier(0.16, 1, 0.3, 1); // text-blur's expo-out

export interface FilmstripHandle {
  jumpTo: (i: number, animated?: boolean) => void;
}

export const Filmstrip = forwardRef<FilmstripHandle, {
  photos: FolderPhoto[];
  width: number;
  progress: SharedValue<number>;
  scrub: SharedValue<number>;
  still: boolean;
  onIndex: (i: number) => void;
}>(function Filmstrip({ photos, width, progress, scrub, still, onIndex }, ref) {
  const scroller = useAnimatedRef<Animated.ScrollView>();
  const pad = (width - THUMB) / 2;

  useImperativeHandle(ref, () => ({
    jumpTo: (i, animated = true) => {
      const x = Math.max(0, Math.min(photos.length - 1, i)) * STEP;
      scheduleOnUI(() => {
        'worklet';
        scrollTo(scroller, x, 0, animated && !still);
      });
    },
  }), [photos.length, scroller, still]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      progress.value = e.contentOffset.x / STEP;
      if (still) return;
      scrub.value = withSequence(
        withTiming(1, { duration: 90 }),
        withDelay(180, withTiming(0, { duration: 820, easing: SETTLE }))
      );
    },
  });

  useAnimatedReaction(
    () => Math.round(progress.value),
    (i, prev) => {
      if (prev !== null && i !== prev) scheduleOnRN(onIndex, i);
    },
    [onIndex]
  );

  return (
    <View style={{ height: THUMB * 1.5 + 12, justifyContent: 'center' }}>
      <Animated.ScrollView
        ref={scroller}
        horizontal
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToInterval={STEP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: pad, alignItems: 'center', height: THUMB * 1.5 + 12 }}
        accessibilityRole="adjustable"
        accessibilityLabel="Photo scrubber"
      >
        {photos.map((p, i) => (
          <Thumb
            key={p.id}
            i={i}
            uri={p.uri}
            progress={progress}
            count={photos.length}
            onPress={() => {
              scheduleOnUI(() => {
                'worklet';
                scrollTo(scroller, i * STEP, 0, !still);
              });
            }}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
});

function Thumb({ i, uri, progress, count, onPress }: { i: number; uri: string; progress: SharedValue<number>; count: number; onPress: () => void }) {
  const st = useAnimatedStyle(() => {
    const near = 1 - Math.min(1, Math.abs(progress.value - i));
    return { transform: [{ scale: 1 + 0.42 * near }], zIndex: near > 0.5 ? 2 : 1 };
  });
  const frame = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, Math.abs(progress.value - i) * 1.6) }));
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Photo ${i + 1} of ${count}`} onPress={onPress} hitSlop={{ top: 12, bottom: 12 }} style={{ width: STEP, alignItems: 'center' }}>
      <Animated.View style={[styles.thumb, st]}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={uri} />
        <Animated.View pointerEvents="none" style={[styles.frame, frame]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  thumb: { width: THUMB, height: THUMB, borderRadius: 8, overflow: 'hidden', backgroundColor: color.line },
  frame: { ...StyleSheet.absoluteFill, borderRadius: 8, borderWidth: 2, borderColor: color.white },
});
