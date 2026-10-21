import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { feedback } from '@/services/sound';
import { Glass, Text, color, radius } from '@/theme';
import { CRITICAL, wait } from '../motion';

const H = 60;
const PAD = 5;
const GRIP = H - PAD * 2;
/* the return is 0.62 of critical: it lands with something left over,
   and the overshoot is spent as a squash against the wall */
const HOME = { ...CRITICAL, damping: CRITICAL.damping * 0.62 };

const clamp = (v: number, lo: number, hi: number) => {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
};

/**
 * Go — a native port of Bencho `slide-confirm`. The handle follows the
 * finger; only the end of the track commits, and then the handle unfurls
 * leftward to fill what it crossed (width grows by exactly what x loses,
 * so the right edge never moves).
 */
export function SlideToGo({
  width,
  label = 'Slide to go',
  doneLabel = "Let's go",
  onConfirm,
}: {
  width: number;
  label?: string;
  doneLabel?: string;
  /** resolve false to spring back (e.g. the quest could not be created) */
  onConfirm: () => Promise<boolean | void>;
}) {
  const travel = width - PAD * 2 - GRIP;
  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const anchor = useSharedValue(0);
  const done = useSharedValue(0);
  const pulse = useSharedValue(1);

  const reset = useCallback(() => {
    done.value = 0;
    anchor.value = withSpring(0, { stiffness: 380, damping: 34, mass: 0.9 });
  }, [anchor, done]);

  const confirmed = useCallback(async () => {
    feedback('go');
    await wait(360);
    const ok = await onConfirm();
    if (ok === false) reset();
  }, [onConfirm, reset]);

  const commit = () => {
    'worklet';
    done.value = 1;
    anchor.value = x.value;
    x.value = withSpring(0, CRITICAL);
    pulse.value = withDelay(100, withSequence(withTiming(0.974, { duration: 260 }), withTiming(1, { duration: 160 })));
    scheduleOnRN(confirmed);
  };

  const pan = usePanGesture({
    activeOffsetX: [-4, 4],
    failOffsetY: [-24, 24],
    onActivate: () => {
      'worklet';
      start.value = x.value;
    },
    onUpdate: (e) => {
      'worklet';
      if (done.value) return;
      x.value = clamp(start.value + e.translationX, 0, travel);
    },
    onDeactivate: () => {
      'worklet';
      if (done.value) return;
      if (x.value >= travel - 3) commit();
      else x.value = withSpring(0, HOME);
    },
  });

  const seen = useDerivedValue(() => clamp(x.value, 0, travel));
  const shown = useDerivedValue(() => withTiming(done.value ? 0 : 1, { duration: 160 }));

  const trackStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const washStyle = useAnimatedStyle(() => ({ width: seen.value + GRIP, opacity: done.value ? 0 : 1 }));
  const sayStyle = useAnimatedStyle(() => ({ opacity: interpolate(seen.value, [0, travel * 0.55], [1, 0], 'clamp') }));
  const gripStyle = useAnimatedStyle(() => {
    const squash = 1 - Math.min(0.08, Math.max(0, -x.value) / 110);
    return {
      width: GRIP + clamp(anchor.value - x.value, 0, travel),
      transform: [{ translateX: seen.value }, { scaleX: squash }, { scaleY: 1 / squash }],
    };
  });
  const arrowStyle = useAnimatedStyle(() => ({
    opacity: shown.value * clamp(1 - (seen.value - travel * 0.55) / (travel * 0.4), 0, 1),
  }));
  const doneStyle = useAnimatedStyle(() => ({
    opacity: withTiming(done.value, { duration: 160 }),
    transform: [{ scale: withSpring(done.value ? 1 : 0.7, { damping: 16, stiffness: 260 }) }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Starts this sidequest. Double-tap to confirm."
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={() => {
          if (done.value) return;
          // VoiceOver can't slide: commit straight from the end of the track
          done.value = 1;
          anchor.value = travel;
          x.value = travel;
          x.value = withSpring(0, CRITICAL);
          void confirmed();
        }}
        style={[styles.track, { width }, trackStyle]}
      >
        <Glass style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.wash, washStyle]} />
        <Animated.View style={[styles.say, sayStyle]} pointerEvents="none">
          <Text style={styles.sayText}>{label}</Text>
        </Animated.View>
        <Animated.View style={[styles.grip, gripStyle]}>
          <Animated.View style={[styles.fill, arrowStyle]} pointerEvents="none">
            <Text style={styles.arrow}>→</Text>
          </Animated.View>
          <Animated.View style={[styles.fill, styles.doneRow, doneStyle]} pointerEvents="none">
            <Text style={styles.doneText}>✓</Text>
            <Text style={styles.doneText}>{doneLabel}</Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: { height: H, borderRadius: radius.pill, alignSelf: 'center' },
  // the ground already covered is the handle's own body, so it wipes the label
  wash: { position: 'absolute', left: PAD, top: PAD, bottom: PAD, borderRadius: GRIP / 2, backgroundColor: color.cobalt, zIndex: 1 },
  say: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  sayText: { fontSize: 15, fontWeight: '500', color: color.ink2, letterSpacing: -0.1 },
  grip: {
    position: 'absolute',
    left: PAD,
    top: PAD,
    height: GRIP,
    borderRadius: GRIP / 2,
    backgroundColor: color.cobalt,
    transformOrigin: 'left center',
    zIndex: 2,
    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), 0 4px 12px rgba(21,16,14,0.25)',
  },
  fill: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  doneRow: { flexDirection: 'row', gap: 8 },
  arrow: { fontSize: 22, fontWeight: '600', color: color.white, marginTop: -2 },
  doneText: { fontSize: 16, fontWeight: '600', color: color.white },
});

export const SLIDE_HEIGHT = H;
