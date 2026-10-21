import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedProps, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Text, color, space } from '@/theme';

/* ══ Scrub title — native port of Bencho `text-blur` ═════════
   The block eases text up out of a soft blur (opacity 0, blur 8px,
   0.3em low → sharp, on an expo-out). Here the same curve runs in
   reverse while the filmstrip moves and forward when it settles:
   `scrub` 1 = blurred, dropped and faded; 0 = sharp. The blur is a
   BlurView over the text whose intensity follows `scrub`. */

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

export function ScrubTitle({ title, sub, scrub, still }: { title: string; sub: string; scrub: SharedValue<number>; still: boolean }) {
  const text = useAnimatedStyle(() => ({
    opacity: 1 - 0.55 * scrub.value,
    transform: [{ translateY: 5 * scrub.value }],
  }));
  const blur = useAnimatedProps(() => ({ intensity: Math.max(0, 28 * scrub.value) }));

  return (
    <View style={styles.wrap} accessible accessibilityRole="header" accessibilityLabel={`${title}. ${sub}`}>
      <Animated.View style={[styles.inner, text]}>
        <Text variant="title" numberOfLines={2} style={{ textAlign: 'center' }}>
          {title}
        </Text>
        <Text variant="callout" numberOfLines={1} style={{ color: color.ink3, textAlign: 'center' }}>
          {sub}
        </Text>
      </Animated.View>
      {!still && <AnimatedBlur pointerEvents="none" tint="light" animatedProps={blur} style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center', paddingHorizontal: space.xl, overflow: 'hidden' },
  inner: { alignItems: 'center', gap: 2, paddingVertical: space.xs },
});
