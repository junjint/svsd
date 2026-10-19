import type { ReactNode } from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, fonts, poster, radius, space } from '../tokens';
import { Display, Label } from './Text';
import { Sticker } from './Sticker';
import type { StickerId } from '../stickers';

const moonSrc = require('../../../assets/design/moon/moon.png');

export function Atmosphere({ style }: { style?: ViewStyle }) {
  return <View style={[styles.atmosphere, style]} pointerEvents="none" />;
}

export function Grain(props: { style?: ViewStyle }) {
  return <Atmosphere {...props} />;
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
export function FloorMark() {
  return null;
}
export function EdgeMeta() {
  return null;
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
      <View style={styles.brandRow}>
        <View style={styles.logoMark}>
          <Label style={styles.logoText}>mo•n</Label>
        </View>
        <Label style={styles.navLeft}>{left}</Label>
      </View>
      {status ? (
        <View style={[styles.badge, live && styles.badgeLive]}>
          <Label
            style={
              live
                ? { ...styles.badgeText, ...styles.badgeTextLive }
                : styles.badgeText
            }
          >
            {status}
          </Label>
        </View>
      ) : null}
    </View>
  );
}

/** Moon cover-inspired hero: type + lunar image */
export function CollageHero({
  line1 = 'Side',
  line2 = 'quest',
}: {
  line1?: string;
  line2?: string;
  stickers?: StickerId[];
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroCopy}>
        <Display style={styles.heroTitle}>
          {line1}
          {'\n'}
          {line2}
        </Display>
        <Label style={styles.heroSub}>Components · Places · Walks</Label>
      </View>
      <Image source={moonSrc} style={styles.moon} resizeMode="cover" />
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

export function KnockoutMark({ text = 'sidequest' }: { text?: string }) {
  return (
    <View style={styles.knockHero}>
      <Display>{text}</Display>
    </View>
  );
}

export function PosterScreen({
  children,
  bandLeft,
  bandRight,
  centered = false,
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
        {bandLeft ? (
          <HeaderBand left={bandLeft} right={bandRight} />
        ) : null}
        <View style={[styles.body, centered && styles.bodyCentered]}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.goku },
  shell: {
    flex: 1,
    paddingHorizontal: space[4],
    paddingTop: space[2],
    paddingBottom: space[4],
  },
  body: { flex: 1, zIndex: 2 },
  bodyCentered: { alignItems: 'center' },
  atmosphere: {
    ...StyleSheet.absoluteFill,
    backgroundColor: color.goku,
  },

  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: poster.headerPadY,
    marginBottom: space[2],
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  logoMark: {
    backgroundColor: color.gohan,
    borderRadius: radius.sSm,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.beerus,
  },
  logoText: {
    color: color.bulma,
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0,
  },
  navLeft: {
    color: color.bulma,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  badge: {
    backgroundColor: color.hit,
    borderRadius: radius.full,
    paddingHorizontal: space[3],
    paddingVertical: space[1],
  },
  badgeLive: { backgroundColor: 'rgba(12,214,100,0.15)' },
  badgeText: { color: color.trunks, fontSize: 11 },
  badgeTextLive: { color: color.roshi },

  hero: {
    width: '100%',
    minHeight: 200,
    backgroundColor: color.gohan,
    borderRadius: radius.sLg,
    overflow: 'hidden',
    marginVertical: space[4],
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.beerus,
  },
  heroCopy: {
    flex: 1,
    padding: space[5],
    justifyContent: 'center',
    gap: space[3],
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.2,
  },
  heroSub: {
    color: color.trunks,
    fontSize: 13,
  },
  moon: {
    position: 'absolute',
    right: -40,
    top: -20,
    width: 220,
    height: 220,
    opacity: 0.95,
  },

  knockout: {
    backgroundColor: color.gohan,
    borderRadius: radius.sMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.beerus,
    padding: space[4],
    marginBottom: space[4],
    width: '100%',
  },
  knockHero: { marginBottom: space[4] },
});
