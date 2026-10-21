import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureDetector, useExclusiveGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { feedback } from '@/services/sound';
import { color } from '@/theme';

/* Port of Bencho `liq-toggle`: one droplet that lengthens along its
   travel and thins across it (area kept), springing between ends.
   Tap toggles; dragging the droplet flips it as it passes the middle. */

/* the block's 92 × 46 track and 36 thumb, at 0.74 */
const W = 68;
const H = 34;
const THUMB = 26;
const K = W / 92;
const PAD = (H - THUMB) / 2;
const OFF_X = PAD;
const ON_X = W - THUMB - PAD;
const MID_X = (OFF_X + ON_X) / 2;

/* softer than a snap: zeta ≈ 0.87, arrives with a hint of give */
const SETTLE = { stiffness: 170, damping: 21.5, mass: 0.9 };
const EASED = { stiffness: 380, damping: 34, mass: 0.6 };
/* Stretch 36 (the block's default): at most 1 + 0.4 × 0.36 ≈ 1.14 long */
const STRETCH = 0.36;
/* the block's slab and ink: off is a white track with a grey droplet
   (19% ink into the slab), on is an ink track with a white one */
const THUMB_OFF = '#D3D2D1';

export interface LiquidToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function LiquidToggle({ value, onChange, label, disabled }: LiquidToggleProps) {
  const still = useReducedMotion();
  const x = useSharedValue(value ? ON_X : OFF_X);
  const on = useSharedValue(value ? 1 : 0);
  const vel = useSharedValue(0);
  const held = useSharedValue(false);
  const grab = useSharedValue(0);
  const shown = useSharedValue(value);
  /* the finger in the track's own pixels: on web the app sits in a zoomed
     phone frame, and the block divides by that scale too */
  const scale = useSharedValue(1);
  const measure = (e: { currentTarget: unknown }) => {
    if (Platform.OS !== 'web') return;
    const el = e.currentTarget as unknown as HTMLElement;
    scale.value = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1;
  };

  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  /* the droplet rests wherever `value` says, unless a finger has it */
  useEffect(() => {
    shown.value = value;
    // the block's `background 420ms ease`, track and droplet together
    on.value = withTiming(value ? 1 : 0, { duration: 420, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    if (held.value) return;
    x.value = still ? (value ? ON_X : OFF_X) : withSpring(value ? ON_X : OFF_X, SETTLE);
  }, [value, still, x, on, held, shown]);

  /* speed → stretch. Each frame's raw speed is chased by a spring and
     then let go, so a paused drag relaxes back to round. */
  useAnimatedReaction(
    () => x.value,
    (cur, prev) => {
      if (prev === null || still) return;
      const v = (cur - prev) * 60;
      vel.value = withSequence(withSpring(v, EASED), withSpring(0, EASED));
    },
  );

  const flip = (next: boolean) => {
    if (next === latest.current.value) return;
    feedback('toggle');
    latest.current.onChange(next);
  };

  const pan = usePanGesture({
    enabled: !disabled,
    activeOffsetX: [-4, 4],
    failOffsetY: [-12, 12],
    onActivate: () => {
      'worklet';
      held.value = true;
      grab.value = x.value;
    },
    onUpdate: (e) => {
      'worklet';
      const next = Math.min(ON_X, Math.max(OFF_X, grab.value + e.translationX / scale.value));
      x.value = next;
      const past = next > MID_X;
      if (past !== shown.value) {
        shown.value = past;
        scheduleOnRN(flip, past);
      }
    },
    onFinalize: () => {
      'worklet';
      if (!held.value) return;
      held.value = false;
      x.value = withSpring(shown.value ? ON_X : OFF_X, SETTLE);
    },
  });

  const tap = useTapGesture({
    enabled: !disabled,
    onActivate: () => {
      'worklet';
      scheduleOnRN(flip, !shown.value);
    },
  });

  const gesture = useExclusiveGestures(pan, tap);

  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [color.white, color.ink]),
  }));

  const thumb = useAnimatedStyle(() => {
    // velocity is in this track's px/s, so the block's 600 scales with it
    const lengthen = 1 + Math.min(0.4, Math.abs(vel.value) / (600 * K)) * STRETCH;
    return {
      backgroundColor: interpolateColor(on.value, [0, 1], [THUMB_OFF, color.white]),
      transform: [{ translateX: x.value }, { scaleX: lengthen }, { scaleY: 1 / lengthen }],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled: !!disabled }}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={() => flip(!value)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        onPointerDown={measure}
        style={[styles.hit, disabled && { opacity: 0.4 }]}
      >
        <Animated.View style={[styles.track, track]}>
          <Animated.View style={[styles.thumb, thumb]} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hit: { minHeight: 44, minWidth: W, justifyContent: 'center' },
  // the block's Stroke setting, on: a hairline so the white track holds its shape on paper
  track: { width: W, height: H, borderRadius: H / 2, boxShadow: `0 0 0 1px ${color.line}` },
  thumb: {
    position: 'absolute',
    left: 0,
    top: PAD,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
  },
});
