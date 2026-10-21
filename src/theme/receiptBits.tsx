import { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from './components';
import { fonts } from './tokens';

/** Thermal ink: a warm near-black that bleeds a hair into the paper */
export const RECEIPT_INK = '#1C1A1D';

/** Mono receipt type with a slight ink bleed */
export const receiptInk = {
  fontFamily: fonts.mono,
  color: RECEIPT_INK,
  textShadowColor: 'rgba(28,26,29,0.4)',
  textShadowRadius: 0.8,
  textShadowOffset: { width: 0, height: 0 },
} as const;

/** A barcode that's the same every time for the same seed */
export function Barcode({ seed, width, height = 34 }: { seed: string; width: number; height?: number }) {
  const bars = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    const out: { w: number; gap: number }[] = [];
    let used = 0;
    while (used < width - 6) {
      h = Math.imul(h ^ (h >>> 13), 2246822507);
      const w = 1 + (Math.abs(h) % 3);
      const gap = 1 + (Math.abs(h >> 4) % 3);
      if (used + w + gap > width) break;
      out.push({ w, gap });
      used += w + gap;
    }
    return out;
  }, [seed, width]);
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'center' }} accessible={false}>
      {bars.map((b, i) => (
        <View key={i} style={{ width: b.w, marginRight: b.gap, height, backgroundColor: RECEIPT_INK }} />
      ))}
    </View>
  );
}

/** A printed dashed rule that always stays on one line */
export function DashRule({ size = 9 }: { size?: number }) {
  return (
    <Text numberOfLines={1} ellipsizeMode="clip" style={[receiptInk, { fontSize: size, lineHeight: size + 3, opacity: 0.8 }]} accessible={false}>
      {'- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -'}
    </Text>
  );
}
