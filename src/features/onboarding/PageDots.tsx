import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { color } from '@/theme';
import { SPRING } from '@/ui/motion';

/** The current page's dot stretches into a cobalt pill */
export function PageDots({ count, index }: { count: number; index: number }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`Step ${index + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} on={i === index} />
      ))}
    </View>
  );
}

function Dot({ on }: { on: boolean }) {
  const still = useReducedMotion();
  const t = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    t.value = still ? (on ? 1 : 0) : withSpring(on ? 1 : 0, SPRING);
  }, [on, still, t]);
  const style = useAnimatedStyle(() => ({
    width: 7 + t.value * 15,
    backgroundColor: interpolateColor(Math.min(1, Math.max(0, t.value)), [0, 1], [color.ink3, color.cobalt]),
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', height: 16 },
  dot: { height: 7, borderRadius: 4 },
});
