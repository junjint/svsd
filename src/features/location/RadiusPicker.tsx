import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text as RNText } from '@/theme';
import { GestureDetector, useExclusiveGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { feedback } from '@/services/sound';
import { color, radius, space } from '@/theme';
import { RADIUS_PRESETS, RADIUS_STOPS, indexAt, radiusParts, stopIndex, usesMiles } from './radiusScale';

/* Port of Bencho `progress` (tick scrubber): a number and a row of ticks,
   nothing else. Scrub along the ticks and the figure follows the finger,
   with a delta from where you started shown only while you scrub. The row
   reads the finger, not the ticks, so a drag that crosses them is one
   continuous gesture. */

const COUNT = RADIUS_STOPS.length;
const ROW_H = 76;
/* the block's `height 420ms cubic-bezier(.22,1,.36,1)` and `background 160ms ease` */
const TICK_EASE = { duration: 420, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const INK_EASE = { duration: 160, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

export interface RadiusPickerProps {
  /** miles */
  value: number;
  /** live, on every tick crossed */
  onChange: (miles: number) => void;
  /** once, when a scrub ends or a preset is tapped */
  onCommit?: (miles: number) => void;
}

export function RadiusPicker({ value, onChange, onCommit }: RadiusPickerProps) {
  const imperial = usesMiles();
  const still = useReducedMotion();
  const idx = useSharedValue(stopIndex(value));
  const scrubbing = useSharedValue(0);
  const width = useSharedValue(0);
  const [shown, setShown] = useState(stopIndex(value));
  const [from, setFrom] = useState<number | null>(null);
  const lastTick = useRef(0);

  /* outside changes (a preset, the store) move the ticks when no finger is on them */
  useEffect(() => {
    if (scrubbing.value) return;
    const i = stopIndex(value);
    idx.value = i;
    setShown(i);
  }, [value, idx, scrubbing]);

  const latest = useRef({ onChange, onCommit });
  latest.current = { onChange, onCommit };

  const tick = (i: number) => {
    setShown(i);
    const now = Date.now();
    if (now - lastTick.current > 45) {
      lastTick.current = now;
      feedback('chipSelect');
    }
    latest.current.onChange(RADIUS_STOPS[i]!);
  };
  const begin = (i: number) => setFrom(i);
  const end = (i: number) => {
    setFrom(null);
    latest.current.onCommit?.(RADIUS_STOPS[i]!);
  };

  const pan = usePanGesture({
    activeOffsetX: [-3, 3],
    failOffsetY: [-14, 14],
    onActivate: (e) => {
      'worklet';
      scrubbing.value = 1;
      scheduleOnRN(begin, idx.value);
      const i = indexAt(e.x, width.value, COUNT);
      if (i !== idx.value) {
        idx.value = i;
        scheduleOnRN(tick, i);
      }
    },
    onUpdate: (e) => {
      'worklet';
      const i = indexAt(e.x, width.value, COUNT);
      if (i !== idx.value) {
        idx.value = i;
        scheduleOnRN(tick, i);
      }
    },
    onFinalize: () => {
      'worklet';
      if (!scrubbing.value) return;
      scrubbing.value = 0;
      scheduleOnRN(end, idx.value);
    },
  });

  const tap = useTapGesture({
    onActivate: (e) => {
      'worklet';
      const i = indexAt(e.x, width.value, COUNT);
      if (i === idx.value) return;
      idx.value = i;
      scheduleOnRN(tick, i);
      scheduleOnRN(end, i);
    },
  });

  const gesture = useExclusiveGestures(pan, tap);

  const pickPreset = (mi: number) => {
    const i = stopIndex(mi);
    if (i === idx.value) return;
    idx.value = i;
    tick(i);
    end(i);
  };

  const step = (by: 1 | -1) => {
    const i = Math.min(COUNT - 1, Math.max(0, idx.value + by));
    if (i === idx.value) return;
    idx.value = i;
    tick(i);
    end(i);
  };

  const { figure, unit } = radiusParts(RADIUS_STOPS[shown]!, imperial);
  const delta = from === null ? 0 : RADIUS_STOPS[shown]! - RADIUS_STOPS[from]!;
  const deltaText = radiusParts(Math.abs(delta), imperial).figure;

  return (
    <View style={{ gap: space.lg }}>
      <View style={styles.head}>
        <RNText style={styles.fig}>
          {figure}
          <RNText style={styles.unit}> {unit}</RNText>
        </RNText>
        <RNText style={[styles.delta, { opacity: from !== null && delta !== 0 ? 1 : 0, color: delta > 0 ? color.cobalt : color.ink2 }]}>
          {delta > 0 ? '+' : '−'}
          {deltaText}
        </RNText>
      </View>

      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Radius"
          accessibilityValue={{ text: `${figure} ${unit === 'mi' ? 'miles' : 'kilometres'}` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
          onLayout={(e) => (width.value = e.nativeEvent.layout.width)}
          style={styles.row}
        >
          {RADIUS_STOPS.map((_, i) => (
            <Tick key={i} i={i} idx={idx} scrubbing={scrubbing} still={still} />
          ))}
        </View>
      </GestureDetector>

      <View style={styles.presets} accessibilityRole="radiogroup" accessibilityLabel="Radius presets">
        {RADIUS_PRESETS.map((mi) => {
          const on = RADIUS_STOPS[shown] === mi;
          const p = radiusParts(mi, imperial);
          return (
            <Pressable
              key={mi}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${p.figure} ${p.unit === 'mi' ? 'miles' : 'kilometres'}`}
              onPress={() => pickPreset(mi)}
              style={({ pressed }) => [styles.preset, on && styles.presetOn, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
            >
              <RNText style={[styles.presetText, on && { color: color.white }]}>{p.figure}</RNText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** a tick: taller and inked once it is inside the radius. The block marks the
    one under the finger in its accent; the app has none, so it lifts to grey
    out of the ink around it */
function Tick({ i, idx, scrubbing, still }: { i: number; idx: SharedValue<number>; scrubbing: SharedValue<number>; still: boolean }) {
  const base = 0.52 + Math.sin(i / 3.1) * 0.14;
  const style = useAnimatedStyle(() => {
    const on = i <= idx.value;
    const cursor = scrubbing.value === 1 && i === idx.value;
    const h = (on ? Math.min(1, base + 0.26) : base) * ROW_H;
    const bg = cursor ? color.ink2 : on ? color.ink : 'rgba(17,17,20,0.12)';
    return {
      height: still ? h : withTiming(h, TICK_EASE),
      backgroundColor: still ? bg : withTiming(bg, INK_EASE),
    };
  });
  return <Animated.View style={[styles.tick, style]} />;
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  fig: { fontSize: 44, lineHeight: 48, fontWeight: '500', letterSpacing: -1.2, color: color.ink, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 22, fontWeight: '500', letterSpacing: -0.4, color: 'rgba(17,17,20,0.35)' },
  delta: { fontSize: 13, fontWeight: '500', fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: ROW_H, borderRadius: 6, overflow: 'hidden' },
  tick: { flex: 1, borderRadius: 2 },
  presets: { flexDirection: 'row', gap: space.sm },
  preset: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
  },
  presetOn: { backgroundColor: color.cobalt, borderColor: color.cobalt },
  presetText: { fontSize: 15, fontWeight: '600', color: color.ink, fontVariant: ['tabular-nums'] },
});
