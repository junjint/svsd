import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { color, shadow } from '@/theme';
import type { FolderPhoto } from '@/types';
import { Photo } from '../Photo';

/* The main photo floating on paper, edges feathered. All photos near the
   current one are laid side by side and slide with `progress`, so
   scrubbing the strip reads as a carousel. Only ±2 are mounted. */

const WINDOW = 2;

export function Stage({
  photos,
  index,
  progress,
  width,
  height,
  onOpen,
}: {
  photos: FolderPhoto[];
  index: number;
  progress: SharedValue<number>;
  width: number;
  height: number;
  onOpen: (i: number) => void;
}) {
  const from = Math.max(0, index - WINDOW);
  const to = Math.min(photos.length - 1, index + WINDOW);
  const shown = photos.slice(from, to + 1);
  return (
    <View style={{ width, height }}>
      {shown.map((p, k) => (
        <Slide key={p.id} i={from + k} photo={p} progress={progress} width={width} height={height} onPress={() => onOpen(from + k)} count={photos.length} />
      ))}
    </View>
  );
}

function fit(photo: FolderPhoto, maxW: number, maxH: number) {
  const ratio = photo.width && photo.height ? photo.width / photo.height : 4 / 5;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

function Slide({
  i,
  photo,
  progress,
  width,
  height,
  onPress,
  count,
}: {
  i: number;
  photo: FolderPhoto;
  progress: SharedValue<number>;
  width: number;
  height: number;
  onPress: () => void;
  count: number;
}) {
  const { w, h } = fit(photo, width * 0.84, height * 0.94);
  const gap = width * 0.82;
  const st = useAnimatedStyle(() => {
    const d = i - progress.value;
    const far = Math.min(1, Math.abs(d));
    return {
      opacity: 1 - 0.75 * far,
      transform: [{ translateX: d * gap }, { scale: 1 - 0.14 * far }, { rotate: `${d * 2.5}deg` }],
      zIndex: Math.round(10 - Math.abs(d) * 2),
    };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.center, st]} pointerEvents="box-none">
      <Pressable accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1} of ${count}. Open full screen`} onPress={onPress}>
        <View style={[{ width: w, height: h }, styles.lift]}>
          <Photo uri={photo.uri} feather={14} on={color.paper} style={{ width: w, height: h }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  lift: { borderRadius: 22, ...shadow.float, shadowOpacity: 0.06 },
});
