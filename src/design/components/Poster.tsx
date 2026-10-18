import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, fonts, poster, space } from '../tokens';
import { Floor, Hero, Label } from './Text';
import { Sticker } from './Sticker';
import type { StickerId } from '../stickers';

/* ─── Solid black stage ────────────────────────────────────────────── */

export function Atmosphere({ style }: { style?: ViewStyle }) {
  return <View style={[styles.atmosphere, style]} pointerEvents="none" />;
}

export function Grain({ style }: { style?: ViewStyle }) {
  return <Atmosphere style={style} />;
}

export function GrainField() {
  return null;
}
export function InkMass() {
  return null;
}
export function GeoField() {
  return null;
}
export function BrushStrike() {
  return null;
}

/* ─── Edge nav (DASHBOARD / ABOUT style) ───────────────────────────── */

export function HeaderBand({
  left,
  right,
  live,
}: {
  left: string;
  right?: string;
  live?: boolean;
}) {
  const status = live == null ? right : live ? 'Live' : 'Paused';
  return (
    <View style={styles.nav}>
      <Label style={styles.navItem}>{left}</Label>
      {status ? <Label style={styles.navMuted}>{status}</Label> : null}
    </View>
  );
}

/* ─── Collage hero — stickers float over wordmark like DGB 3D objects ─ */

export function CollageHero({
  line1 = 'SIDE',
  line2 = 'QUEST',
  stickers = ['spark', 'coffee', 'book', 'art'] as StickerId[],
}: {
  line1?: string;
  line2?: string;
  stickers?: StickerId[];
}) {
  return (
    <View style={styles.collage}>
      <View style={styles.wordBlock}>
        <Hero style={styles.wordLine}>{line1}</Hero>
        <Hero style={styles.wordLine}>{line2}</Hero>
      </View>
      {stickers[0] ? (
        <View style={[styles.float, styles.floatTL]}>
          <Sticker id={stickers[0]} size="lg" />
        </View>
      ) : null}
      {stickers[1] ? (
        <View style={[styles.float, styles.floatTR]}>
          <Sticker id={stickers[1]} size="lg" />
        </View>
      ) : null}
      {stickers[2] ? (
        <View style={[styles.float, styles.floatBL]}>
          <Sticker id={stickers[2]} size="md" />
        </View>
      ) : null}
      {stickers[3] ? (
        <View style={[styles.float, styles.floatBR]}>
          <Sticker id={stickers[3]} size="md" />
        </View>
      ) : null}
    </View>
  );
}

export function FloorMark({ text = 'SIDEQUEST' }: { text?: string }) {
  return (
    <View style={styles.floorWrap} pointerEvents="none">
      <Floor style={styles.floorText}>{text}</Floor>
    </View>
  );
}

export function EdgeMeta({
  left,
  right,
}: {
  left?: string;
  right?: string;
}) {
  return (
    <View style={styles.edgeRow} pointerEvents="none">
      {left ? <Label style={styles.edgeText}>{left}</Label> : <View />}
      {right ? <Label style={styles.edgeText}>{right}</Label> : null}
    </View>
  );
}

export function KnockoutBlock({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.knockout, style]}>{children}</View>;
}

export function KnockoutMark({ text = 'SIDEQUEST' }: { text?: string }) {
  return (
    <View style={styles.knockHero}>
      <Hero style={styles.knockHeroText}>{text}</Hero>
    </View>
  );
}

export function BandeiraCell() {
  return null;
}
export function BandeiraStrip() {
  return null;
}
export function StickerStrip() {
  return null;
}
export function Marginalia() {
  return null;
}

export function PosterScreen({
  children,
  bandLeft,
  bandRight,
  floor = 'SIDEQUEST',
  centered = true,
  showFloor = true,
  edgeLeft,
  edgeRight,
}: {
  children: ReactNode;
  bandLeft?: string;
  bandRight?: string;
  floor?: string;
  showBandeiras?: boolean;
  showGeo?: boolean;
  showBrush?: boolean;
  centered?: boolean;
  knockoutHero?: string;
  marginalia?: string[];
  showFloor?: boolean;
  edgeLeft?: string;
  edgeRight?: string;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.shell}>
        <Atmosphere />
        {showFloor ? <FloorMark text={floor} /> : null}
        {bandLeft ? (
          <HeaderBand left={bandLeft} right={bandRight} />
        ) : null}
        {(edgeLeft || edgeRight) && (
          <EdgeMeta left={edgeLeft} right={edgeRight} />
        )}
        <View style={[styles.body, centered && styles.bodyCentered]}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  shell: {
    flex: 1,
    paddingHorizontal: space[4],
    paddingTop: space[2],
    paddingBottom: space[3],
    overflow: 'hidden',
  },
  body: { flex: 1, zIndex: 2 },
  bodyCentered: { alignItems: 'center' },

  atmosphere: {
    ...StyleSheet.absoluteFill,
    backgroundColor: color.bg,
  },

  nav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: poster.headerPadY,
    zIndex: 3,
  },
  navItem: {
    color: color.ink,
    fontFamily: fonts.sansMedium,
  },
  navMuted: {
    color: color.muted,
  },

  collage: {
    width: '100%',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: space[4],
  },
  wordBlock: {
    zIndex: 1,
    alignItems: 'center',
  },
  wordLine: {
    textAlign: 'center',
  },
  float: {
    position: 'absolute',
    zIndex: 2,
  },
  floatTL: { top: 8, left: 4 },
  floatTR: { top: 0, right: 8 },
  floatBL: { bottom: 12, left: 20 },
  floatBR: { bottom: 4, right: 12 },

  floorWrap: {
    position: 'absolute',
    left: -24,
    right: -24,
    bottom: -48,
    zIndex: 1,
    overflow: 'hidden',
    height: 110,
    justifyContent: 'flex-end',
  },
  floorText: {
    textAlign: 'center',
    width: '140%',
    marginLeft: '-20%',
  },

  edgeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space[2],
  },
  edgeText: {
    color: color.muted,
    fontSize: 9,
    letterSpacing: 1.6,
  },

  knockout: {
    backgroundColor: color.surface,
    paddingVertical: space[4],
    paddingHorizontal: space[4],
    marginBottom: space[4],
    width: '100%',
    borderRadius: poster.radiusBox,
  },
  knockHero: {
    marginBottom: space[4],
    alignItems: 'center',
  },
  knockHeroText: {
    color: color.floor,
    fontSize: 56,
    lineHeight: 52,
  },
});
