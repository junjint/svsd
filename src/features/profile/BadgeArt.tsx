import { useId } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import type { BadgeArt as Art } from '@/data/badges';
import { fonts } from '@/theme';

/* The suggestion medals are struck to sit beside the chrome PNGs: a thick
   polished ring, and the milestone in Garamond italic, in the same metal. */
function Medal({ mark, size }: { mark: string; size: number }) {
  const id = useId().replace(/:/g, '');
  const chrome = `chrome${id}`;
  const shine = `shine${id}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={chrome} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F4F3F1" />
          <Stop offset="0.28" stopColor="#9C9894" />
          <Stop offset="0.5" stopColor="#4A4643" />
          <Stop offset="0.68" stopColor="#B9B5B1" />
          <Stop offset="0.86" stopColor="#5E5A57" />
          <Stop offset="1" stopColor="#D9D6D2" />
        </LinearGradient>
        <LinearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Circle cx="50" cy="50" r="42" fill="none" stroke={`url(#${chrome})`} strokeWidth="9" />
      <Circle cx="50" cy="50" r="42" fill="none" stroke={`url(#${shine})`} strokeWidth="3" />
      <Circle cx="50" cy="50" r="46.5" fill="none" stroke="#3E3A37" strokeOpacity="0.35" strokeWidth="0.6" />
      <Circle cx="50" cy="50" r="37.5" fill="none" stroke="#3E3A37" strokeOpacity="0.35" strokeWidth="0.6" />
      <SvgText
        x="50"
        y={mark.length > 1 ? 63 : 66}
        textAnchor="middle"
        fontFamily={fonts.serifItalic}
        fontSize={mark.length > 1 ? 38 : 46}
        fill={`url(#${chrome})`}
        stroke="#3E3A37"
        strokeOpacity="0.4"
        strokeWidth="0.6"
      >
        {mark}
      </SvgText>
    </Svg>
  );
}

/** A badge's art at `size` points square, whichever kind it is */
export function BadgeArt({ art, size }: { art: Art; size: number }) {
  if (art.kind === 'medal') {
    return (
      <View style={{ width: size, height: size }} accessible={false}>
        <Medal mark={art.mark} size={size} />
      </View>
    );
  }
  return <Image source={art.src} style={{ width: size, height: size }} contentFit="contain" accessible={false} />;
}
