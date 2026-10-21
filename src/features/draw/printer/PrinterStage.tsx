import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { feedback } from '@/services/sound';
import type { DrawSession } from '@/stores/sidequestStore';
import type { Coordinates } from '@/types';
import { Printer, printerGeometry } from './Printer';
import { Receipt } from './Receipt';

/** Feed speed, points per second: one smooth, steady pull like the reference */
const FEED_PPS = 190;
const TICK_MS = 120;
const SHADOW_ROOM = 18;

export interface PrinterStageHandle {
  /** Cut the receipt and let it drop away down the page; resolves when it's gone */
  tear: () => Promise<void>;
  /** Put a torn receipt back, when nothing new could be printed */
  restore: () => void;
}

export const PrinterStage = forwardRef<
  PrinterStageHandle,
  {
    width: number;
    draw: DrawSession | null;
    from: Coordinates;
    cityLabel: string;
    instant: boolean;
    disabled: boolean;
    onPress: () => void;
    onPrinted: () => void;
  }
>(function PrinterStage({ width, draw, from, cityLabel, instant, disabled, onPress, onPrinted }, ref) {
  const g = printerGeometry(width);
  const ready = !!draw?.place && !!draw.activity;
  const key = ready ? `${draw!.id}:${draw!.place!.id}:${draw!.activity!.id}` : null;
  const [paperH, setPaperH] = useState(0);
  const tearing = useRef<(() => void) | null>(null);
  const torn = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    tear: () =>
      new Promise<void>((resolve) => {
        if (!key) return resolve();
        feedback('sheetClose');
        tearing.current = resolve;
        torn.value = withTiming(1, { duration: 620, easing: Easing.in(Easing.quad) }, (done) => {
          if (done) runOnJS(finishTear)();
        });
      }),
    restore: () => {
      torn.value = withTiming(0, { duration: 200 });
    },
  }));

  function finishTear() {
    tearing.current?.();
    tearing.current = null;
  }

  // a fresh receipt starts whole again
  useEffect(() => {
    torn.value = 0;
    setPaperH(0);
  }, [key, torn]);

  // cut free, it drops straight down and out of sight, picking up speed
  const tearStyle = useAnimatedStyle(() => ({
    opacity: torn.value > 0.85 ? (1 - torn.value) / 0.15 : 1,
    transform: [{ translateY: torn.value * 900 }],
  }));

  const stageH = key && paperH ? Math.max(g.height, g.paperTop + paperH + 12) : g.height;

  return (
    <View style={{ width, height: stageH }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Print a sidequest"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({ transform: [{ scale: pressed && !disabled ? 0.985 : 1 }] })}
      >
        <Printer width={width} />
      </Pressable>

      {key && (
        <Animated.View
          pointerEvents="box-none"
          style={[{ position: 'absolute', top: g.paperTop, left: (width - g.paperWidth) / 2, width: g.paperWidth }, tearStyle]}
        >
          <Feed key={key} instant={instant} onMeasured={setPaperH} onPrinted={onPrinted}>
            <Receipt draw={draw!} from={from} cityLabel={cityLabel} width={g.paperWidth} />
          </Feed>
          {/* where the paper leaves the slot it's still in shadow */}
          <LinearGradient pointerEvents="none" colors={['rgba(5,5,5,0.55)', 'rgba(5,5,5,0)']} style={styles.slotShade} />
        </Animated.View>
      )}
    </View>
  );
});

/** Clips the paper at the slot and feeds it out in printer-like steps */
function Feed({
  children,
  instant,
  onMeasured,
  onPrinted,
}: {
  children: React.ReactNode;
  instant: boolean;
  onMeasured: (h: number) => void;
  onPrinted: () => void;
}) {
  const still = useReducedMotion();
  const [h, setH] = useState(0);
  const y = useSharedValue(-10000);
  const ticks = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (ticks.current) clearInterval(ticks.current);
  }, []);

  const start = (height: number) => {
    if (instant || still) {
      y.value = 0;
      onPrinted();
      return;
    }
    // footer first, at a steady pull, easing only at the very end
    const ms = Math.round((height / FEED_PPS) * 1000);
    y.value = -height;
    y.value = withTiming(0, { duration: ms, easing: Easing.bezier(0.3, 0, 0.55, 1) }, (done) => {
      if (done) runOnJS(onPrinted)();
    });
    let elapsed = 0;
    ticks.current = setInterval(() => {
      feedback('scratchTick');
      elapsed += TICK_MS;
      if (elapsed >= ms && ticks.current) {
        clearInterval(ticks.current);
        ticks.current = null;
      }
    }, TICK_MS);
  };

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    // the teeth hang a few points below the paper, so the clip leaves them room
    // the clip is cut at the slot but leaves room around the paper for its shadow and teeth
    <View style={{ height: h ? h + SHADOW_ROOM : 1, overflow: 'hidden', marginHorizontal: -SHADOW_ROOM, paddingHorizontal: SHADOW_ROOM }}>
      <Animated.View
        style={[styles.paperShadow, style]}
        onLayout={(e) => {
          const height = Math.ceil(e.nativeEvent.layout.height);
          if (h || !height) return;
          setH(height);
          onMeasured(height);
          start(height);
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slotShade: { position: 'absolute', left: 0, right: 0, top: 0, height: 10 },
  paperShadow: {
    shadowColor: '#15100E',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});
