import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  return (
    <View style={[{ overflow: 'hidden', borderRadius: radius }, style]}>
      {!loaded && <Shimmer radius={radius} style={StyleSheet.absoluteFill} />}
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        transition={240}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        accessibilityIgnoresInvertColors
      />
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
