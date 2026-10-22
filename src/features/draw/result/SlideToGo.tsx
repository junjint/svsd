import { useCallback, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
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
import { wait } from '../motion';

/* Bencho's geometry: a 56 track with a 4px inset, so the grip is a 48 circle */
const H = 56;
const PAD = 4;
const GRIP = H - PAD * 2;
/* Speed 50 (the block's default): k = 260 + 0.5 × 640, damped exactly on
   critical so the commit lands against the wall without overshooting */
const STIFF = 580;
const COMMIT = { stiffness: STIFF, damping: 2 * Math.sqrt(STIFF * 0.9), mass: 0.9 };
/* the return is 0.62 of critical: it lands with something left over,
   and the overshoot is spent as a squash against the wall */
const HOME = { ...COMMIT, damping: COMMIT.damping * 0.62 };
/* the settle's curve, and the word's: cubic-bezier(.33,.55,.2,1) */
const SETTLE_EASE = Easing.bezier(0.33, 0.55, 0.2, 1);

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
  /* hover: the handle leans a few points toward the end, beckoning,
     the track brightens, and the cursor offers a grab */
  const nudge = useSharedValue(0);
  const [hovered, setHovered] = useState(false);
  const hoverTo = (on: boolean) => {
    setHovered(on);
    nudge.value = withSpring(on ? 1 : 0, { stiffness: 260, damping: 18, mass: 1 });
  };
  /* the block divides the finger by the scale it is drawn at. On web the
     app sits in a zoomed phone frame, so a screen pixel is not a layout
     pixel and the handle would never reach the end of its track */
  const scale = useSharedValue(1);
  const measure = (e: { currentTarget: unknown }) => {
    if (Platform.OS !== 'web') return;
    const el = e.currentTarget as unknown as HTMLElement;
    scale.value = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1;
  };

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
    x.value = withSpring(0, COMMIT);
    /* a 2.6% dip a beat behind the unfurl, peaking late (0.62 of 420ms),
       so the block gathers as it lands */
    pulse.value = withDelay(
      100,
      withSequence(withTiming(0.974, { duration: 260, easing: SETTLE_EASE }), withTiming(1, { duration: 160, easing: SETTLE_EASE })),
    );
    scheduleOnRN(confirmed);
  };

  const pan = usePanGesture({
    activeOffsetX: [-4, 4],
    failOffsetY: [-24, 24],
    onActivate: () => {
      'worklet';
      nudge.value = withTiming(0, { duration: 120 });
      start.value = x.value;
    },
    onUpdate: (e) => {
      'worklet';
      if (done.value) return;
      x.value = clamp(start.value + e.translationX / scale.value, 0, travel);
    },
    onDeactivate: () => {
      'worklet';
      if (done.value) return;
      // only the end of the track commits
      if (x.value >= travel - 0.5) commit();
      else x.value = withSpring(0, HOME);
    },
  });

  const seen = useDerivedValue(() => clamp(x.value, 0, travel));
  const shown = useDerivedValue(() => withTiming(done.value ? 0 : 1, { duration: 160 }));

  const trackStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const lean = useDerivedValue(() => (done.value ? 0 : nudge.value * NUDGE));
  const washStyle = useAnimatedStyle(() => ({ width: seen.value + lean.value + GRIP, opacity: done.value ? 0 : 1 }));
  const sayStyle = useAnimatedStyle(() => ({ opacity: interpolate(seen.value, [0, travel * 0.55], [1, 0], 'clamp') }));
  const gripStyle = useAnimatedStyle(() => {
    const squash = 1 - Math.min(0.08, Math.max(0, -x.value) / 110);
    return {
      width: GRIP + clamp(anchor.value - x.value, 0, travel),
      transform: [{ translateX: seen.value + lean.value }, { scaleX: squash }, { scaleY: 1 / squash }],
    };
  });
  const arrowStyle = useAnimatedStyle(() => ({
    opacity: shown.value * clamp(1 - (seen.value - travel * 0.55) / (travel * 0.4), 0, 1),
  }));
  const doneStyle = useAnimatedStyle(() => ({
    opacity: withTiming(done.value, { duration: 160, easing: SETTLE_EASE }),
    transform: [{ scale: withTiming(done.value ? 1 : 0.7, { duration: 160, easing: SETTLE_EASE }) }],
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
          x.value = withSpring(0, COMMIT);
          void confirmed();
        }}
        onPointerDown={measure}
        onPointerEnter={() => hoverTo(true)}
        onPointerLeave={() => hoverTo(false)}
        style={[styles.track, { width }, GRAB, trackStyle]}
      >
        <Glass hovered={hovered} style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.wash, washStyle]} />
        <Animated.View style={[styles.say, sayStyle]} pointerEvents="none">
          <Text style={styles.sayText}>{label}</Text>
        </Animated.View>
        <Animated.View style={[styles.grip, gripStyle]}>
          <Animated.View style={[styles.fill, arrowStyle]} pointerEvents="none">
            <ArrowRight />
          </Animated.View>
          <Animated.View style={[styles.fill, styles.doneRow, doneStyle]} pointerEvents="none">
            <Check />
            <Text style={styles.doneText}>{doneLabel}</Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

/* lucide's arrow-right and check at 20 / stroke 2, as the block draws them */
function ArrowRight() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color.white} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14M12 5l7 7-7 7" />
    </Svg>
  );
}

function Check() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color.white} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  track: { height: H, borderRadius: radius.pill, alignSelf: 'center' },
  // the ground already covered is the handle's own body, so it wipes the label
  wash: { position: 'absolute', left: PAD, top: PAD, bottom: PAD, borderRadius: GRIP / 2, backgroundColor: color.cobalt, zIndex: 1 },
  say: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  sayText: { fontSize: 14, fontWeight: '500', color: color.ink2, letterSpacing: -0.14 },
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
  doneText: { fontSize: 14, fontWeight: '500', color: color.white, letterSpacing: -0.14 },
});

export const SLIDE_HEIGHT = H;

const NUDGE = 7;
const GRAB = Platform.OS === 'web' ? ({ cursor: 'grab' } as object) : null;
