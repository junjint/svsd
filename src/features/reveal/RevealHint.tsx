import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Text, Frost, color, radius, shadow } from '@/theme';

/** A quiet frosted prompt along the bottom of a reveal ("Scratch to see where") */
export function RevealHint({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <Animated.View key={text} entering={FadeIn.duration(260)} exiting={FadeOut.duration(200)} style={styles.wrap} pointerEvents="none">
      <Frost style={[styles.pill, shadow.lift]}>
        <Text style={styles.label} accessibilityLiveRegion="polite">
          {text}
        </Text>
      </Frost>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 14, alignItems: 'center', zIndex: 10 },
  pill: { height: 32, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '500', color: color.ink2 },
});
