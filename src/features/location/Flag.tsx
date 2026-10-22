import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import type { CountryCode } from '@/data/demoCities';

/* Flags drawn on a 3:2 tile in their own colours, after Bencho's country
   wheel (simplified to read at 24pt), never emoji */
const tri = (a: string, b: string, c: string) => (
  <>
    <Rect width="10" height="20" fill={a} />
    <Rect x="10" width="10" height="20" fill={b} />
    <Rect x="20" width="10" height="20" fill={c} />
  </>
);

const ART: Record<CountryCode, React.ReactNode> = {
  US: (
    <>
      <Rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <Rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#B22234" />
      ))}
      <Rect width="13" height={(20 * 7) / 13} fill="#3C3B6E" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => <Circle key={`${r}${c}`} cx={2 + c * 3} cy={2 + r * 3.4} r="0.65" fill="#fff" />)
      )}
    </>
  ),
  CA: (
    <>
      <Rect width="30" height="20" fill="#fff" />
      <Rect width="7.5" height="20" fill="#D80621" />
      <Rect x="22.5" width="7.5" height="20" fill="#D80621" />
      {/* the leaf, reduced to its silhouette */}
      <Path d="M15 4.2l1.2 2.4 1.6-.6-.5 3.4 2-1.8.5 1.3 1.6-.3-.9 2.2.8.6-3 2.3.3 1.2-3-.4V17h-.8v-2.7l-3 .4.3-1.2-3-2.3.8-.6-.9-2.2 1.6.3.5-1.3 2 1.8-.5-3.4 1.6.6z" fill="#D80621" />
    </>
  ),
  MX: (
    <>
      {tri('#006847', '#fff', '#CE1126')}
      <Circle cx="15" cy="10" r="2.4" fill="#8C6A2C" opacity={0.85} />
    </>
  ),
  GB: (
    <>
      <Rect width="30" height="20" fill="#012169" />
      <Path d="M0 0L30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
      <Path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.6" />
      <Path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
      <Path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3.4" />
    </>
  ),
  FR: tri('#002395', '#fff', '#ED2939'),
  JP: (
    <>
      <Rect width="30" height="20" fill="#fff" />
      <Circle cx="15" cy="10" r="6" fill="#BC002D" />
    </>
  ),
};

/** A country's flag on a rounded 3:2 tile with a faint edge, so white fields don't vanish */
export function Flag({ code, width = 24 }: { code: CountryCode; width?: number }) {
  const h = (width * 2) / 3;
  return (
    <View style={{ width, height: h, borderRadius: width / 6, overflow: 'hidden' }} accessible={false}>
      <Svg width={width} height={h} viewBox="0 0 30 20">
        <G>{ART[code]}</G>
        <Rect x="0.5" y="0.5" width="29" height="19" rx="4" fill="none" stroke="rgba(0,0,0,0.14)" />
      </Svg>
    </View>
  );
}
