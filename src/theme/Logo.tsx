import { Image } from 'expo-image';

/** Width ÷ height of the chrome "side" wordmark (assets/brand/side-logo-master.png) */
const ASPECT = 2473 / 1143;

/** The chrome "side" wordmark */
export function Logo({ width = 88 }: { width?: number }) {
  return (
    <Image
      source={require('../../assets/brand/side-logo.png')}
      style={{ width, height: width / ASPECT }}
      contentFit="contain"
      accessible
      accessibilityRole="header"
      accessibilityLabel="Sidequest"
    />
  );
}
