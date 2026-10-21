import { useMemo, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';

const CRINKLE = require('../../assets/receipt/crinkle.webp');

/** Receipt stock. The torn edges are filled a hair darker than white to meet the crinkled body */
export const PAPER = '#FFFFFF';
const EDGE_FILL = '#FAFAF9';
const TEAR = 7;
const POINTS = 64;

/** A small seeded random, so a card always tears the same way */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * A ripped edge as a path in a 100 × TEAR box: a slow wobble plus sharp
 * little jags, the way paper tears against a cutter. `up` points the teeth
 * up (a top edge) or down (a bottom edge).
 */
function tearPath(seed: string, up: boolean) {
  const r = rng(seed);
  const phase = r() * 6.28;
  const pts: string[] = [];
  for (let i = 0; i <= POINTS; i++) {
    const x = (i / POINTS) * 100;
    const wobble = Math.sin(phase + i * 0.35) * 1.3 + Math.sin(phase * 1.7 + i * 0.9) * 0.6;
    const jag = (r() - 0.5) * (i % 2 ? 3.6 : 1.6);
    const depth = Math.max(0.2, Math.min(TEAR - 0.2, TEAR * 0.5 + wobble + jag));
    pts.push(`${x.toFixed(2)},${(up ? depth : TEAR - depth).toFixed(2)}`);
  }
  return up ? `M0,${TEAR} L${pts.join(' L')} L100,${TEAR} Z` : `M0,0 L${pts.join(' L')} L100,0 Z`;
}

function Edge({ seed, up }: { seed: string; up: boolean }) {
  const d = useMemo(() => tearPath(seed, up), [seed, up]);
  return (
    <Svg width="100%" height={TEAR} viewBox={`0 0 100 ${TEAR}`} preserveAspectRatio="none" style={{ display: 'flex' }}>
      <Path d={d} fill={EDGE_FILL} />
    </Svg>
  );
}

/**
 * Every card in the app: a strip of receipt paper torn off at the top and
 * the bottom, softly crinkled, casting a shadow that follows the tear.
 */
export function TornPaper({
  seed,
  children,
  style,
  contentStyle,
  edges = 'both',
}: {
  /** anything stable (an id) so the tear doesn't change between renders */
  seed: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: 'both' | 'top' | 'bottom';
}) {
  return (
    <View style={[WRAP, style]}>
      {edges !== 'bottom' && <Edge seed={`${seed}:top`} up />}
      <View style={[styles.body, contentStyle]}>
        <Image source={CRINKLE} contentFit="cover" style={[StyleSheet.absoluteFill, { mixBlendMode: 'multiply', opacity: 0.7 }]} pointerEvents="none" />
        {children}
      </View>
      {edges !== 'top' && <Edge seed={`${seed}:bottom`} up={false} />}
    </View>
  );
}

// no background on the wrapper, so the shadow takes the torn outline, not a box
const WRAP: ViewStyle =
  Platform.OS === 'web'
    ? ({ filter: 'drop-shadow(0 6px 10px rgba(21,16,14,0.10)) drop-shadow(0 1px 1.5px rgba(21,16,14,0.10))' } as ViewStyle)
    : { shadowColor: '#15100E', shadowOpacity: 0.12, shadowRadius: 9, shadowOffset: { width: 0, height: 5 } };

const styles = StyleSheet.create({
  body: { backgroundColor: PAPER, overflow: 'hidden' },
});
