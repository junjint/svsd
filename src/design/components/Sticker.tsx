import { Image, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native';
import {
  STICKER_IMAGES,
  STICKER_SIZE,
  type StickerId,
  type StickerSize,
} from '../stickers';

type Props = {
  id: StickerId;
  size?: StickerSize;
  style?: ImageStyle | ViewStyle;
};

/** Transparent PNG sticker. Color only — never chrome. */
export function Sticker({ id, size = 'md', style }: Props) {
  const px = STICKER_SIZE[size];
  return (
    <Image
      source={STICKER_IMAGES[id]}
      style={[{ width: px, height: px }, styles.img, style as ImageStyle]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  img: {
    backgroundColor: 'transparent',
  },
});
