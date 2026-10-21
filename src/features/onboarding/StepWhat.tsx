import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { PlaceReveal } from '@/features/reveal';
import { useSidequestStore } from '@/stores/sidequestStore';
import { Text, color, fonts, space } from '@/theme';
import { DEMO_ACTIVITY, demoPlace } from './demo';

/** 1 · What a sidequest is, told by scratching a sample card */
export function StepWhat({ width }: { width: number }) {
  const still = useReducedMotion();
  const location = useSidequestStore((s) => s.location);
  const [revealed, setRevealed] = useState(false);
  const [place] = useState(() => demoPlace(location.cityLabel, location.coords));
  const cardW = Math.min(width - space.xl * 2, 340);
  const cardH = Math.round(cardW * 0.78);

  return (
    <View style={styles.page}>
      <View style={styles.copy}>
        <Text variant="display" style={styles.headline}>
          A tiny adventure,{'\n'}
          <Text variant="display" style={{ color: color.cobalt, fontFamily: fonts.serifItalic }}>
            drawn at random.
          </Text>
        </Text>
        <Text variant="body" style={styles.body}>
          Scratch the card. Every sidequest is a place near you plus one small thing to do there.
        </Text>
      </View>

      <View style={{ alignItems: 'center', gap: space.lg }}>
        <View style={{ transform: [{ rotate: revealed ? '0deg' : '-2deg' }] }}>
          <PlaceReveal
            place={place}
            cityLabel={location.cityLabel}
            distanceLabel="6 min walk"
            rarity="rare"
            style="scratch"
            width={cardW}
            height={cardH}
            revealNow={still}
            onRevealed={() => setRevealed(true)}
          />
        </View>
        <View style={styles.activitySlot}>
          {revealed ? (
            <Animated.View entering={still ? undefined : FadeInDown.springify().damping(18).stiffness(180)} style={{ alignItems: 'center', gap: 2 }}>
              <Text variant="caption">and when you get there</Text>
              <Text variant="title" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
                {DEMO_ACTIVITY}.
              </Text>
            </Animated.View>
          ) : (
            <Text variant="caption">Use your finger, like a lottery ticket</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: space.xl, paddingTop: space.xxl, gap: space.xxl },
  copy: { gap: space.md },
  headline: { fontSize: 46, lineHeight: 48 },
  body: { color: color.ink2, fontSize: 17, lineHeight: 24, maxWidth: 330 },
  activitySlot: { minHeight: 60, alignItems: 'center', justifyContent: 'center' },
});
