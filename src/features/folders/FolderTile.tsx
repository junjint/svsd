import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Text, color, shadow, space, spring } from '@/theme';
import type { QuestFolder, QuestType } from '@/types';
import { Photo } from './Photo';
import { feedback } from '@/services/sound';

/* ══ Folder tile — native port of Bencho `folder` ══════════════
   Photos tucked into a folder, their tops peeking over a frosted front.
   Press and hold (or hover, on the web) and they rise out into a fan
   while the front tips forward; let go and they tuck back. A tap opens
   the sidequest. Every card turns about one
   point far below the folder, so the lean when tucked and the arc when
   fanned are the same rotation. Cards go from the middle outward, on an
   overshooting curve. */

export type FolderTone = Exclude<QuestType, 'random'> | 'freeform';

/**
 * Bencho's folder tints (Blue, Pink, Lilac) plus two of the same family
 * (Mint, Peach). The back is a step deeper than the frosted front.
 */
export const FOLDER_TINTS = [
  { back: '#8EC8F2', front: 'rgba(186,224,252,0.55)' },
  { back: '#E4B6D8', front: 'rgba(247,218,238,0.57)' },
  { back: '#CBB8EE', front: 'rgba(230,220,251,0.57)' },
  { back: '#9ED4BC', front: 'rgba(208,238,224,0.57)' },
  { back: '#F0BE9E', front: 'rgba(252,226,208,0.57)' },
] as const;
const OPEN_EASE = Easing.bezier(0.24, 1.34, 0.38, 1);
const SPREAD = 11;

export function FolderTile({
  folder,
  size,
  open,
  dimmed,
  tint,
  onOpen,
  onHold,
}: {
  folder: QuestFolder;
  size: number;
  /** fanned out: while held (or hovered on the web) */
  open: boolean;
  dimmed: boolean;
  tint: number;
  /** a tap opens the sidequest's page */
  onOpen: () => void;
  /** press and hold fans the photos out; letting go tucks them back */
  onHold: (held: boolean) => void;
}) {
  const colors = FOLDER_TINTS[tint % FOLDER_TINTS.length]!;
  const still = useReducedMotion();
  const press = useSharedValue(0);
  const fade = useSharedValue(1);
  // the three newest photos, middle one on top
  const pics = folder.photos.slice(-3).reverse();
  const S = size;
  const n = folder.photos.length;

  const p0 = useSharedValue(0);
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);
  const cards = [p0, p1, p2];

  useEffect(() => {
    const v = open ? 1 : 0;
    cards.forEach((c, i) => {
      c.value = still ? v : withDelay(Math.abs(i - 1) * 35, withTiming(v, { duration: 600, easing: OPEN_EASE }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, still]);

  useEffect(() => {
    fade.value = withTiming(dimmed ? 0.35 : 1, { duration: 220 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimmed]);

  const wrap = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: 1 - press.value * 0.03 }] }));

  return (
    <Animated.View style={[{ width: S, alignItems: 'center', zIndex: open ? 50 : 1 }, wrap]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${folder.title}, ${n} ${n === 1 ? 'photo' : 'photos'}`}
        accessibilityHint="Opens the sidequest. Press and hold to peek at its photos"
        delayLongPress={260}
        onPressIn={() => (press.value = withSpring(1, spring))}
        onPressOut={() => {
          press.value = withSpring(0, spring);
          onHold(false);
        }}
        onLongPress={() => {
          feedback('sheetOpen');
          onHold(true);
        }}
        onPress={onOpen}
        onHoverIn={() => onHold(true)}
        onHoverOut={() => onHold(false)}
      >
        <View style={{ width: S, height: S * 0.78 }}>
          <View style={[styles.back, { left: S * 0.1, top: S * 0.3, width: S * 0.8, height: S * 0.46, backgroundColor: colors.back }]}>
            <View style={[styles.tab, { width: S * 0.3, height: S * 0.08, top: -S * 0.065, backgroundColor: colors.back }]} />
          </View>
          {[0, 1, 2].map((i) => (
            <FanCard key={i} i={i} S={S} p={cards[i]!} uri={pics[i]?.uri} />
          ))}
          <FolderFront S={S} p={p1} tint={colors.front} />
        </View>
      </Pressable>

      <Text variant="headline" numberOfLines={2} style={[styles.title, { maxWidth: S - space.sm }]}>
        {folder.title}
      </Text>
      <View style={styles.countPill}>
        <Text style={styles.countText}>
          {n} {n === 1 ? 'photo' : 'photos'}
        </Text>
      </View>
    </Animated.View>
  );
}

function FanCard({
  i,
  S,
  p,
  uri,
}: {
  i: number;
  S: number;
  p: SharedValue<number>;
  uri?: string;
}) {
  const k = i - 1; // -1, 0, 1: the middle card is k = 0
  const w = S * 0.4;
  const h = S * 0.44;
  const origin = S * 1.5;

  const st = useAnimatedStyle(() => {
    const t = p.value;
    const a = k * 5 + (k * SPREAD - k * 5) * t;
    return {
      transform: [{ rotate: `${a}deg` }, { translateY: -S * 0.38 * t }, { scale: 1 + 0.08 * t }],
      zIndex: k === 0 ? 3 : 2,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.card, shadow.lift, { width: w, height: h, left: (S - w) / 2, top: S * 0.14, transformOrigin: [w / 2, origin, 0] }, st]}
    >
      {uri ? <Photo uri={uri} radius={12} style={StyleSheet.absoluteFill} /> : <BlankCard />}
    </Animated.View>
  );
}

/** A blank paper card for folders that don't have three photos yet */
function BlankCard() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: color.white, padding: 10, gap: 6 }]}>
      <View style={{ height: 3, width: '70%', borderRadius: 2, backgroundColor: color.line }} />
      <View style={{ height: 3, width: '45%', borderRadius: 2, backgroundColor: color.line }} />
    </View>
  );
}

function FolderFront({ S, p, tint }: { S: number; p: SharedValue<number>; tint: string }) {
  const st = useAnimatedStyle(() => ({ transform: [{ perspective: 520 }, { rotateX: `${-22 * p.value}deg` }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.front, { left: S * 0.06, top: S * 0.42, width: S * 0.88, height: S * 0.36, transformOrigin: ['50%', '100%', 0] }, st]}
    >
      <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
      <View style={styles.frontShine} />
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  back: { position: 'absolute', borderTopLeftRadius: 6, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  tab: { position: 'absolute', left: 0, borderTopLeftRadius: 9, borderTopRightRadius: 9 },
  card: { position: 'absolute', borderRadius: 12, overflow: 'hidden', backgroundColor: color.white, borderWidth: 3, borderColor: color.white },
  front: {
    position: 'absolute',
    zIndex: 30,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  frontShine: { position: 'absolute', left: 12, right: 12, bottom: 8, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.7)' },
  title: { fontSize: 16, textAlign: 'center', marginTop: space.sm },
  countPill: { marginTop: 6, paddingHorizontal: 10, height: 24, borderRadius: 12, backgroundColor: color.mist, justifyContent: 'center' },
  countText: { fontSize: 12, fontWeight: '500', color: color.ink2, fontVariant: ['tabular-nums'] },
});
