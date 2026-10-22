import { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { BADGES } from '@/data/badges';
import { useSidequestStore } from '@/stores/sidequestStore';
import { color } from '@/theme';
import { useScreen } from '@/ui';

const GRAIN = require('../../../../assets/decor/grain.webp');
const SIZE = 58;
const GAP = 18;
/** points per second: an unhurried drift */
const SPEED = 22;
const EDGE = 72;

/** web: an ellipse centred on the screen edge, solid there and gone well
    before the strip's inner side, top or bottom, so no edge ever shows */
const OVAL = (x: string) =>
  ({ maskImage: `radial-gradient(ellipse 100% 42% at ${x} 50%, #000 0%, rgba(0,0,0,0.6) 45%, transparent 100%)` }) as ViewStyle;

/**
 * The badges you've earned, drifting right to left under the printer
 * forever. They come out of, and go into, a band of grainy frosted glass
 * at each edge of the screen.
 */
export function BadgeCarousel() {
  const earned = useSidequestStore((s) => s.badges);
  const { width } = useScreen();
  const still = useReducedMotion();

  const art = useMemo(() => {
    const ids = new Set(earned.map((b) => b.id));
    return BADGES.filter((b) => ids.has(b.id));
  }, [earned]);

  // repeat the set until one copy is wider than the screen, then run two copies end to end
  const reps = art.length ? Math.max(1, Math.ceil(width / (art.length * (SIZE + GAP)))) : 0;
  const lane = Array.from({ length: reps }, () => art).flat();
  const span = lane.length * (SIZE + GAP);

  const x = useSharedValue(0);
  useEffect(() => {
    if (!span || still) return;
    x.value = 0;
    x.value = withRepeat(withTiming(-span, { duration: (span / SPEED) * 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [span, still, x]);
  const move = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  if (!art.length) return null;

  return (
    <View
      style={[styles.wrap, { width }]}
      pointerEvents="none"
      accessible
      accessibilityLabel={`Badges earned: ${art.map((b) => b.name).join(', ')}`}
    >
      <Animated.View style={[styles.lane, move]}>
        {[...lane, ...lane].map((b, i) => (
          <Image key={`${b.id}-${i}`} source={b.art} contentFit="contain" style={styles.badge} />
        ))}
      </Animated.View>
      <FrostEdge side="left" />
      <FrostEdge side="right" />
    </View>
  );
}

/* The frost has no edges of its own: on the web every layer is masked by an
   ellipse anchored at the screen edge, so it thins out sideways *and* up and
   down into plain paper. Elsewhere (no CSS masks) three strips of rising blur
   step into the edge, with paper fades over their tops and bottoms. */
function FrostEdge({ side }: { side: 'left' | 'right' }) {
  const left = side === 'left';
  const pos: ViewStyle = left ? { left: 0 } : { right: 0 };
  const mask = OVAL(left ? '0%' : '100%');

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.edge, pos]} pointerEvents="none">
        <BlurView intensity={24} tint="light" style={[StyleSheet.absoluteFill, mask]} />
        {/* a breath of paper and a little grain, so it reads as frosted glass */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: color.paper, opacity: 0.32 }, mask]} />
        <View style={[StyleSheet.absoluteFill, { opacity: 0.06 }, mask]}>
          <Image source={GRAIN} contentFit="cover" style={StyleSheet.absoluteFill} />
        </View>
      </View>
    );
  }

  const veil = left ? ([color.paper, 'rgba(251,250,247,0)'] as const) : (['rgba(251,250,247,0)', color.paper] as const);
  return (
    <View style={[styles.edge, pos]} pointerEvents="none">
      {[0, 1, 2].map((i) => (
        <BlurView
          key={i}
          intensity={6 + i * 6}
          tint="light"
          style={[styles.step, left ? { left: 0, width: EDGE * (1 - i / 3) } : { right: 0, width: EDGE * (1 - i / 3) }]}
        />
      ))}
      <LinearGradient colors={veil} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} />
      <LinearGradient colors={[color.paper, 'rgba(251,250,247,0)', 'rgba(251,250,247,0)', color.paper]} locations={[0, 0.3, 0.7, 1]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  // taller than the badges, so the frost fades out over empty paper above and below them
  wrap: { height: SIZE + 64, alignSelf: 'center', overflow: 'hidden', justifyContent: 'center' },
  lane: { flexDirection: 'row', gap: GAP, paddingLeft: GAP },
  badge: { width: SIZE, height: SIZE },
  edge: { position: 'absolute', top: 0, bottom: 0, width: EDGE },
  step: { position: 'absolute', top: 0, bottom: 0 },
});
