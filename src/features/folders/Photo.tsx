import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { color, radius as R } from '@/theme';
import { Shimmer } from './Shimmer';

/**
 * A photo with an image-shimmer placeholder while it loads and, optionally,
 * edges feathered into `on` (the photo-viewer look). Same edge treatment
 * as the theme's FeatherImage, plus the load state it doesn't expose.
 */
export function Photo({
  uri,
  style,
  radius = R.card,
  feather = 0,
  on = color.paper,
  contentFit = 'cover',
}: {
  uri: string;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  feather?: number;
  on?: string;
  contentFit?: 'cover' | 'contain';
}) {
  const [loaded, setLoaded] = useState(false);
  const clear = transparent(on);
  // our own fade: expo-image's web transition can stick at 0 when the load lands mid page-entrance
  const shown = useSharedValue(0);
  useEffect(() => {
    shown.value = withTiming(loaded ? 1 : 0, { duration: loaded ? 240 : 0 });
  }, [loaded, shown]);
  const fade = useAnimatedStyle(() => ({ opacity: shown.value }));
  useEffect(() => setLoaded(false), [uri]);
  return (
    <View style={[{ overflow: 'hidden', borderRadius: radius }, style]}>
      {!loaded && <Shimmer radius={radius} style={StyleSheet.absoluteFill} />}
      <Animated.View style={[StyleSheet.absoluteFill, fade]}>
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
      {feather > 0 && (
        <>
          <LinearGradient pointerEvents="none" colors={[on, clear]} style={[styles.h, { top: 0, height: feather }]} />
          <LinearGradient pointerEvents="none" colors={[clear, on]} style={[styles.h, { bottom: 0, height: feather }]} />
          <LinearGradient pointerEvents="none" colors={[on, clear]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.v, { left: 0, width: feather }]} />
          <LinearGradient pointerEvents="none" colors={[clear, on]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.v, { right: 0, width: feather }]} />
        </>
      )}
    </View>
  );
}

/** '#RRGGBB' → the same colour at alpha 0, so gradients fade without greying */
function transparent(hex: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 'rgba(250,250,247,0)';
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0)`;
}

const styles = StyleSheet.create({
  h: { position: 'absolute', left: 0, right: 0 },
  v: { position: 'absolute', top: 0, bottom: 0 },
});
