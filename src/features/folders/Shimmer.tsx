import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { color, radius as R } from '@/theme';

/* Native port of Bencho `image-shimmer`: a white tile with a faint prism
   (blue → lilac → peach) sweeping across on a loop, eased in-out. Still
   under Reduce Motion. */

const PRISM = ['rgba(122,162,255,0)', 'rgba(122,162,255,0.13)', 'rgba(184,146,255,0.16)', 'rgba(255,176,146,0.13)', 'rgba(255,176,146,0)'] as const;

export function Shimmer({ style, radius = R.card, duration = 2400 }: { style?: StyleProp<ViewStyle>; radius?: number; duration?: number }) {
  const still = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (still) return;
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.bezier(0.45, 0.05, 0.55, 0.95) }), -1, false);
    return () => cancelAnimation(t);
  }, [still, duration, t]);

  const band = useAnimatedStyle(() => ({ left: `${-100 + t.value * 200}%` }));

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="An image loading"
      style={[{ overflow: 'hidden', borderRadius: radius, backgroundColor: color.white, borderWidth: StyleSheet.hairlineWidth, borderColor: color.line }, style]}
    >
      <Animated.View style={[styles.band, band]}>
        <LinearGradient colors={PRISM} start={{ x: 0, y: 0.35 }} end={{ x: 1, y: 0.65 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, bottom: 0, width: '100%' },
});
