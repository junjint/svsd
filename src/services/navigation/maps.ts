import { Linking, Platform } from 'react-native';
import type { Coordinates } from '@/types';

export type MapsProvider = 'apple' | 'google' | 'system';

/**
 * Open walking directions in an external maps app.
 * Does not modify Apple Maps / Google Maps — deep links only.
 */
export async function openWalkingDirections(
  destination: Coordinates,
  label?: string,
  provider: MapsProvider = 'system'
): Promise<boolean> {
  const { latitude, longitude } = destination;
  const encodedLabel = encodeURIComponent(label ?? 'Sidequest');

  const appleUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w&q=${encodedLabel}`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
  const googleNative = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=walking`;

  let url: string;
  if (provider === 'apple') {
    url = appleUrl;
  } else if (provider === 'google') {
    const canGoogle = await Linking.canOpenURL(googleNative);
    url = canGoogle ? googleNative : googleUrl;
  } else {
    url = Platform.OS === 'ios' ? appleUrl : googleUrl;
  }

  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    // Last resort web Google Maps
    await Linking.openURL(googleUrl);
    return true;
  }
  await Linking.openURL(url);
  return true;
}

export function mapsDeepLinkPreview(
  destination: Coordinates,
  label?: string
): { apple: string; google: string } {
  const { latitude, longitude } = destination;
  const encodedLabel = encodeURIComponent(label ?? 'Sidequest');
  return {
    apple: `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w&q=${encodedLabel}`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`,
  };
}
