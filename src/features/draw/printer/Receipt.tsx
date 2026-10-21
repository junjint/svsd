import { StyleSheet, View, type TextStyle } from 'react-native';
import { Image } from 'expo-image';
import { activityText } from '@/features/reveal/content';
import { travelLabel } from '@/services/draw/rules';
import { Text, fonts } from '@/theme';
import { distanceMeters } from '@/utils/geo';
import type { DrawSession } from '@/stores/sidequestStore';
import type { Coordinates } from '@/types';

const CRINKLE = require('../../../../assets/receipt/crinkle.webp');
const INK_DROPOUT = require('../../../../assets/receipt/ink.webp');
const LOGO = require('../../../../assets/brand/side-logo.png');

/** Thermal ink: a warm near-black that bleeds a hair into the paper */
const INK = '#1C1A1D';
const PAPER = '#FFFFFF';

/** "[DEMO] Corner Espresso Lab" → "Corner Espresso Lab" */
const clean = (name: string) => name.replace(/^\[[^\]]*\]\s*/, '');

function Ink({ style, children, bold }: { style?: TextStyle | TextStyle[]; children: React.ReactNode; bold?: boolean }) {
  return <Text style={[styles.ink, bold && { fontFamily: fonts.monoBold }, style as TextStyle]}>{children}</Text>;
}

function Rule() {
  return (
    <Text numberOfLines={1} ellipsizeMode="clip" style={[styles.ink, styles.rule]}>
      {'- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -'}
    </Text>
  );
}

/** The torn end: a row of teeth */
function Teeth({ width }: { width: number }) {
  const n = Math.ceil(width / 9);
  return (
    <View style={[styles.teeth, { width }]}>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={[styles.tooth, { left: i * 9 - 1 }]} />
      ))}
    </View>
  );
}

export function Receipt({
  draw,
  from,
  cityLabel,
  width,
}: {
  draw: DrawSession;
  from: Coordinates;
  cityLabel: string;
  width: number;
}) {
  const place = draw.place!;
  const activity = draw.activity!;
  const meters = distanceMeters(from, place.coordinates);
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const text = activityText(activity, draw.settings.partySize);
  const big = text.length > 46 ? 19 : text.length > 30 ? 22 : 26;

  return (
    <View style={[styles.paper, { width }]} accessible accessibilityLabel={`Receipt. While you're in ${cityLabel}, go to ${clean(place.name)}. ${text}.`}>
      <View style={styles.pad}>
        <Image source={LOGO} tintColor={INK} contentFit="contain" style={styles.logo} />
        <Ink style={styles.center}>SIDEQUEST RECEIPT</Ink>
        <Ink style={[styles.center, styles.small]}>
          {cityLabel.toUpperCase()} · {date} · {time}
        </Ink>
        <Rule />

        <Ink style={styles.label}>WHILE YOU'RE IN {cityLabel.toUpperCase()}, GO TO</Ink>
        <Ink bold style={styles.place}>
          {clean(place.name)}
        </Ink>
        <Ink style={styles.small}>{travelLabel(meters).toUpperCase()}</Ink>
        <Rule />

        <Ink style={styles.label}>AND THEN</Ink>
        <Ink bold style={[styles.activity, { fontSize: big, lineHeight: big * 1.15 }]}>
          {text.toUpperCase()}
        </Ink>
        <Rule />
        <Ink style={[styles.center, styles.small, { marginTop: 2 }]}>NO REFUNDS. NO REGRETS.</Ink>
      </View>

      {/* paper: soft crinkles shade the sheet; ink drops out in specks and faint bands */}
      <Image source={CRINKLE} contentFit="cover" style={[StyleSheet.absoluteFill, { mixBlendMode: 'multiply' }]} pointerEvents="none" />
      <Image source={INK_DROPOUT} contentFit="cover" style={[StyleSheet.absoluteFill, { mixBlendMode: 'screen', opacity: 0.55 }]} pointerEvents="none" />
      <Teeth width={width} />
    </View>
  );
}

/** The idle note the printer leaves out on the home screen: one line, nothing else */
export function IdleReceipt({ width }: { width: number }) {
  return (
    <View style={[styles.paper, { width }]} accessible accessibilityLabel="Surprises come when you least expect it">
      <View style={[styles.pad, styles.idlePad]}>
        <Ink bold style={[styles.center, styles.idle]}>
          SURPRISES COME WHEN YOU LEAST EXPECT IT
        </Ink>
      </View>
      <Image source={CRINKLE} contentFit="cover" style={[StyleSheet.absoluteFill, { mixBlendMode: 'multiply' }]} pointerEvents="none" />
      <Image source={INK_DROPOUT} contentFit="cover" style={[StyleSheet.absoluteFill, { mixBlendMode: 'screen', opacity: 0.55 }]} pointerEvents="none" />
      <Teeth width={width} />
    </View>
  );
}

const styles = StyleSheet.create({
  paper: { backgroundColor: PAPER, overflow: 'visible' },
  pad: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 18, gap: 5 },
  ink: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 15,
    color: INK,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(28,26,29,0.45)',
    textShadowRadius: 0.8,
    textShadowOffset: { width: 0, height: 0 },
  },
  small: { fontSize: 9, lineHeight: 13, letterSpacing: 0 },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  rule: { fontSize: 9, lineHeight: 12, color: INK, opacity: 0.85, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  label: { fontSize: 9.5, lineHeight: 13, marginTop: 2 },
  place: { fontSize: 16, lineHeight: 20, letterSpacing: -0.2 },
  activity: { letterSpacing: -0.4, marginVertical: 2 },
  idlePad: { paddingTop: 26, paddingBottom: 28 },
  idle: { fontSize: 20, lineHeight: 24, letterSpacing: -0.3 },
  logo: { width: 74, height: 34, alignSelf: 'center', marginBottom: 2 },
  teeth: { position: 'absolute', bottom: -5, left: 0, height: 5, overflow: 'hidden' },
  tooth: { position: 'absolute', top: -5, width: 9, height: 9, backgroundColor: PAPER, transform: [{ rotate: '45deg' }] },
});
