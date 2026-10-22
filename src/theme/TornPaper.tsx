import { useMemo, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  dimensional = false,
}: {
  /** anything stable (an id) so the tear doesn't change between renders */
  seed: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: 'both' | 'top' | 'bottom';
  dimensional?: boolean;
}) {
  return (
    <View style={[WRAP, dimensional && styles.lifted, style]}>
      {edges !== 'bottom' && <Edge seed={`${seed}:top`} up />}
      <View style={[styles.body, contentStyle]}>
        <Image source={CRINKLE} contentFit="cover" style={[StyleSheet.absoluteFill, { mixBlendMode: 'multiply', opacity: dimensional ? 0.35 : 0.7 }]} pointerEvents="none" />
        {dimensional && <>
          <LinearGradient pointerEvents="none" colors={['rgba(70,61,47,0.06)', 'rgba(255,255,255,0.1)', 'transparent', 'rgba(92,81,65,0.015)', 'rgba(255,255,255,0.5)', 'rgba(70,61,47,0.05)']} locations={[0,0.035,0.12,0.75,0.96,1]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill} />
          <Image pointerEvents="none" source={require('../../assets/receipt/ink.webp')} contentFit="cover" style={[StyleSheet.absoluteFill, { opacity: 0.012, mixBlendMode: 'multiply' }]} />
          <LinearGradient pointerEvents="none" colors={['rgba(55,48,38,0.04)', 'transparent', 'rgba(255,255,255,0.4)']} style={{position:'absolute',left:0,right:0,top:'38%',height:12,transform:[{rotate:'-3deg'}]}} />
        </>}
        {children}
      </View>
      {dimensional && [false, true].map(right => <Svg key={String(right)} pointerEvents="none" width={4} height="100%" viewBox="0 0 4 100" preserveAspectRatio="none" style={{position:'absolute',top:0,bottom:0,...(right ? {right:-2} : {left:-2}),transform:[{scaleX:right ? -1 : 1}]}}>
        <Path d={`M4,0 L${Array.from({length:100},(_,i)=>`${1 + ((i * 17 + seed.length * 3) % 11) / 5},${i}`).join(' L')} L4,100 Z`} fill="#F9F8F4" stroke="rgba(82,72,58,0.14)" strokeWidth={0.3} />
      </Svg>)}
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
  lifted: { boxShadow: '5px 10px 18px rgba(32,27,21,0.20), 1px 2px 3px rgba(32,27,21,0.18)' },
  body: { backgroundColor: PAPER, overflow: 'hidden' },
});
