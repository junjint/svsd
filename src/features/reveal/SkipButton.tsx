import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Text, Frost, color, radius, shadow } from '@/theme';

/** The small frosted "Skip" in a reveal's top-right corner (SPEC §3.2) */
export function SkipButton({ onPress, visible }: { onPress: () => void; visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} style={styles.wrap} pointerEvents="box-none">
      <Pressable accessibilityRole="button" accessibilityLabel="Skip reveal" onPress={onPress} hitSlop={10} style={styles.hit}>
        {({ pressed }) => (
          <Frost style={[styles.pill, shadow.lift, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
            <Text style={styles.label}>Skip</Text>
          </Frost>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 10, right: 10, zIndex: 20 },
  /* 44pt touch target around a compact pill */
  hit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  pill: { height: 30, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: color.ink },
});
