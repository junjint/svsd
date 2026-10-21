import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

/* Chrome ornaments: brushed-metal pieces used as quiet decoration */
const DECOR = {
  filigree: { src: require('../../assets/decor/filigree.webp'), aspect: 900 / 548 },
  archOrnate: { src: require('../../assets/decor/arch-ornate.webp'), aspect: 900 / 518 },
  archWire: { src: require('../../assets/decor/arch-wire.webp'), aspect: 900 / 542 },
  swallow: { src: require('../../assets/decor/swallow.webp'), aspect: 900 / 866 },
  lion: { src: require('../../assets/decor/lion.webp'), aspect: 698 / 900 },
} as const;

export type DecorName = keyof typeof DECOR;

/** A decorative piece, sized by width; hidden from screen readers */
export function Decor({ name, width, style }: { name: DecorName; width: number; style?: StyleProp<ImageStyle> }) {
  const d = DECOR[name];
  return (
    <Image
      source={d.src}
      style={[{ width, height: width / d.aspect }, style]}
      contentFit="contain"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
      pointerEvents="none"
    />
  );
}
