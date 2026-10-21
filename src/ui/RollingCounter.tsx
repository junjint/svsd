import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { feedback } from '@/services/sound';
import { Glass, Text as RNText, color } from '@/theme';

/* Port of Bencho `rolling-counter`. Every digit is a strip of 0–9 (and a
   second 0) behind a window. A column's target is the COUNT of whole
   tens/hundreds in the value, not its digit, so 9 → 10 rolls the ones
   forward to 0 instead of back through eight digits. The ones column
   moves first and each column to its left a beat later, so a carry
   ripples up the number. A spinning digit smears with a ghost trail. */

const SIZES = {
  sm: { font: 20, cell: 40, key: 40 },
  lg: { font: 30, cell: 48, key: 44 },
} as const;

const STAGGER = 45;
/* bounce 45 → a lively but quick landing */
const DIGIT = { stiffness: 210, damping: 17, mass: 1 };
const MAX_PLACES = 5;

export interface RollingCounterProps {
  value: number;
  min?: number;
  max?: number;
  /** With onChange it is a −/+ stepper (hold to repeat); without, display only */
  onChange?: (v: number) => void;
  suffix?: string;
  size?: 'sm' | 'lg';
  /** accessibility name, e.g. "Party size" */
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function RollingCounter({ value, min = 0, max = 99, onChange, suffix, size = 'sm', label, style }: RollingCounterProps) {
  const dims = SIZES[size];
  const still = useReducedMotion();
  const places = Math.min(MAX_PLACES, Math.max(String(Math.abs(Math.round(max))).length, String(Math.abs(Math.round(value))).length));
  const shown = Math.max(1, String(Math.abs(Math.round(value))).length);

  /* ── stepping, with hold-to-repeat ─────────────────────── */
  const val = useRef(value);
  useEffect(() => {
    val.current = value;
  }, [value]);
  const hold = useRef<{ t: ReturnType<typeof setTimeout> | null; since: number }>({ t: null, since: 0 });
  const lastSound = useRef(0);

  const release = () => {
    if (hold.current.t) clearTimeout(hold.current.t);
    hold.current.t = null;
  };
  useEffect(() => release, []);

  const bump = (n: number): boolean => {
    if (!onChange) return false;
    const v = Math.min(max, Math.max(min, val.current + n));
    if (v === val.current) return false;
    val.current = v;
    const now = Date.now();
    if (now - lastSound.current > 70) {
      lastSound.current = now;
      feedback('partyStep');
    }
    onChange(v);
    return true;
  };

  const press = (dir: 1 | -1) => {
    release();
    if (!bump(dir)) return;
    hold.current.since = Date.now();
    const repeat = () => {
      const held = Date.now() - hold.current.since;
      /* ones, then tens after a second and a half (only on wide ranges) */
      const step = held > 1500 && max - min > 40 ? 10 : 1;
      if (!bump(dir * step)) return release();
      hold.current.t = setTimeout(repeat, held > 900 ? 55 : 90);
    };
    hold.current.t = setTimeout(repeat, 380);
  };

  const digits = (
    <View style={[styles.num, { height: dims.cell }]}>
      {Array.from({ length: places }, (_, i) => {
        const p = places - 1 - i;
        return <Column key={p} place={p} value={value} visible={p < shown} dims={dims} still={still} />;
      })}
      {!!suffix && <RNText style={[styles.digit, { fontSize: dims.font, lineHeight: dims.cell }]}>{suffix}</RNText>}
    </View>
  );

  const a11y = `${label ? `${label}, ` : ''}${value}${suffix ?? ''}`;

  if (!onChange) {
    return (
      <View accessible accessibilityLabel={a11y} style={style}>
        {digits}
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label ?? 'Count'}
      accessibilityValue={{ min, max, now: value, text: `${value}${suffix ?? ''}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => bump(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={[{ alignSelf: 'flex-start' }, style]}
    >
      <Glass radius={dims.cell / 2 + 4} style={styles.slab}>
        <Key glyph="−" label="Less" dims={dims} disabled={value <= min} onIn={() => press(-1)} onOut={release} />
        <View style={{ paddingHorizontal: 10 }}>{digits}</View>
        <Key glyph="+" label="More" dims={dims} disabled={value >= max} onIn={() => press(1)} onOut={release} />
      </Glass>
    </View>
  );
}

/* ── a column: one strip, rolling to the count of its place ── */

function Column({ place, value, visible, dims, still }: { place: number; value: number; visible: boolean; dims: (typeof SIZES)['sm' | 'lg']; still: boolean }) {
  const count = Math.floor(Math.abs(value) / 10 ** place);
  const pos = useSharedValue(count);
  const target = useSharedValue(count);
  const width = useSharedValue(visible ? dims.font * 0.62 : 0);

  useEffect(() => {
    const delay = place * STAGGER;
    if (still) {
      pos.value = count;
      target.value = count;
      return;
    }
    /* a column far from home jumps most of the way in whole turns first —
       it looks the same, and a big change doesn't spin for a second */
    const gap = count - pos.value;
    if (Math.abs(gap) > 12) pos.value += Math.round((gap - Math.sign(gap) * 12) / 10) * 10;
    target.value = withDelay(delay, withTiming(count, { duration: 0 }));
    pos.value = withDelay(delay, withSpring(count, DIGIT));
  }, [count, place, still, pos, target]);

  useEffect(() => {
    const w = visible ? dims.font * 0.62 : 0;
    width.value = still ? w : withSpring(w, { stiffness: 300, damping: 22 });
  }, [visible, dims.font, still, width]);

  const box = useAnimatedStyle(() => ({ width: width.value, opacity: Math.min(1, width.value / (dims.font * 0.4)) }));

  return (
    <Animated.View style={[{ height: dims.cell, overflow: 'hidden' }, box]}>
      <Strip pos={pos} target={target} dims={dims} ghost={0} />
      <Strip pos={pos} target={target} dims={dims} ghost={1} />
      <Strip pos={pos} target={target} dims={dims} ghost={-1} />
    </Animated.View>
  );
}

const STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

/** ghost 0 is the digit itself; ±1 are the smear copies trailing its motion */
function Strip({ pos, target, dims, ghost }: { pos: SharedValue<number>; target: SharedValue<number>; dims: (typeof SIZES)['sm' | 'lg']; ghost: number }) {
  const style = useAnimatedStyle(() => {
    const m = ((pos.value % 10) + 10) % 10;
    const speed = Math.min(1, Math.abs(target.value - pos.value));
    const dir = Math.sign(target.value - pos.value) || 1;
    if (ghost === 0) return { opacity: 1 - speed * 0.35, transform: [{ translateY: -m * dims.cell }] };
    const lag = ghost * dir * speed * dims.cell * 0.16;
    return { opacity: speed * 0.28, transform: [{ translateY: -m * dims.cell + lag }] };
  });
  return (
    <Animated.View style={[ghost !== 0 && StyleSheet.absoluteFill, style]}>
      {STRIP.map((d, j) => (
        <RNText key={j} style={[styles.digit, { fontSize: dims.font, height: dims.cell, lineHeight: dims.cell }]}>
          {d}
        </RNText>
      ))}
    </Animated.View>
  );
}

function Key({ glyph, label, dims, disabled, onIn, onOut }: { glyph: string; label: string; dims: (typeof SIZES)['sm' | 'lg']; disabled: boolean; onIn: () => void; onOut: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPressIn={onIn}
      onPressOut={onOut}
      hitSlop={4}
      style={({ pressed }) => [
        styles.key,
        { width: dims.key, height: dims.cell, opacity: disabled ? 0.35 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
        pressed && { backgroundColor: 'rgba(21,16,14,0.08)' },
      ]}
    >
      <RNText style={[styles.glyph, size(dims)]}>{glyph}</RNText>
    </Pressable>
  );
}

const size = (d: (typeof SIZES)['sm' | 'lg']) => ({ fontSize: d.font * 0.8, lineHeight: d.cell });

const styles = StyleSheet.create({
  slab: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  num: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  digit: { color: color.ink, fontWeight: '500', fontVariant: ['tabular-nums'], letterSpacing: -0.4, textAlign: 'center' },
  key: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  glyph: { color: color.ink, fontWeight: '500' },
});
