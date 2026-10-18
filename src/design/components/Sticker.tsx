import { Text, View, StyleSheet, type ViewStyle } from 'react-native';
import {
  STICKERS,
  STICKER_SIZE,
  type StickerId,
  type StickerSize,
} from '../stickers';

type Props = {
  id: StickerId;
  size?: StickerSize;
  style?: ViewStyle;
  /** Slight rotation for that “sticker tossed on the page” feel */
  tilt?: number;
};

/**
 * Colorful picture mark. Use leading / trailing / between type only —
 * never as a tinted button or chrome fill.
 */
export function Sticker({ id, size = 'md', style, tilt = 0 }: Props) {
  const px = STICKER_SIZE[size];
  return (
    <View
      style={[
        styles.wrap,
        { width: px + 4, height: px + 4, transform: [{ rotate: `${tilt}deg` }] },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={{ fontSize: px, lineHeight: px + 4 }}>{STICKERS[id]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
