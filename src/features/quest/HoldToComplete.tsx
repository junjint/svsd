import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { feedback } from '@/services/sound';
import { HoverContext, Glass, Text, color, fonts, hoverOf } from '@/theme';

const HOLD_MS = 1400;
const TICK_MS = 230;

function Check({ tint }: { tint: string }) {
  return (
    <View style={{ width: 18, height: 18 }}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={tint} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20 6 9 17l-5-5" />
      </Svg>
    </View>
  );
}

/**
 * Finish a sidequest by holding, not tapping, so it can't happen by
 * accident. Ink fills the pill from the left for as long as it's held
 * (with a soft tick every so often); let go early and it drains back.
 * Full, it turns into a check and calls onComplete.
 */
export function HoldToComplete({ label = 'Hold to finish sidequest', onComplete }: { label?: string; onComplete: () => void }) {
  const fill = useSharedValue(0);
  const press = useSharedValue(1);
  const [done, setDone] = useState(false);
  const ticks = useRef<ReturnType<typeof setInterval> | null>(null);
  const finished = useRef(false);
  useEffect(() => () => {
    if (ticks.current) clearInterval(ticks.current);
    cancelAnimation(fill);
  }, [fill]);

  const stopTicks = () => {
    if (ticks.current) clearInterval(ticks.current);
    ticks.current = null;
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    cancelAnimation(fill);
    stopTicks();
    setDone(true);
    feedback('questCompleted');
    onComplete();
  };

  const begin = () => {
    if (done) return;
    feedback('chipSelect');
    press.value = withSpring(0.98, { stiffness: 400, damping: 30 });
    stopTicks();
    ticks.current = setInterval(() => feedback('scratchTick'), TICK_MS);
    fill.set(withTiming(1, { duration: HOLD_MS * (1 - fill.get()), easing: Easing.linear }, (ok) => {
      if (ok) runOnJS(finish)();
    }));
  };

  const release = () => {
    press.value = withSpring(1, { stiffness: 400, damping: 30 });
    if (done) return;
    stopTicks();
    cancelAnimation(fill);
    fill.set(withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }));
  };

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const body = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));
  // the label turns white as the ink passes under it
  const lightText = useAnimatedStyle(() => ({ opacity: fill.value > 0.5 ? 1 : 0 }));
  const darkText = useAnimatedStyle(() => ({ opacity: fill.value > 0.5 ? 0 : 1 }));

  if (done) {
    return (
      <Animated.View entering={FadeIn.duration(220)} style={[styles.pill, styles.donePill]} accessibilityLabel="Sidequest complete">
        <Check tint={color.white} />
        <Text style={[styles.label, { color: color.white }]}>Sidequest complete</Text>
      </Animated.View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Press and hold to mark this sidequest complete"
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={finish}
      onPress={(event) => { if ((event.nativeEvent as { detail?: number }).detail === 0) finish(); }}
      onPressIn={begin}
      onPressOut={release}
      delayLongPress={HOLD_MS + 1000}
    >
      {(state) => (
        <HoverContext.Provider value={hoverOf(state)}>
          <Animated.View style={body}>
            <Glass interactive radius={30} style={styles.pill}>
              <Animated.View style={[styles.fill, fillStyle]} pointerEvents="none" />
              <Animated.View style={[styles.row, darkText]} pointerEvents="none">
                <Check tint={color.ink} />
                <Text style={styles.label}>{label}</Text>
              </Animated.View>
              <Animated.View style={[styles.row, StyleSheet.absoluteFill, lightText]} pointerEvents="none">
                <Check tint={color.white} />
                <Text style={[styles.label, { color: color.white }]}>Keep holding…</Text>
              </Animated.View>
            </Glass>
          </Animated.View>
        </HoverContext.Provider>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { height: 60, borderRadius: 30, overflow: 'hidden', justifyContent: 'center' },
  donePill: { backgroundColor: color.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: color.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { fontFamily: fonts.sansSemi, fontSize: 16, letterSpacing: -0.2, color: color.ink },
});
