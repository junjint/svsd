import * as Location from 'expo-location';

export type LocationPermissionState = {
  foreground: Location.PermissionStatus;
  background: Location.PermissionStatus;
  canAskAgainForeground: boolean;
  canAskAgainBackground: boolean;
};

export async function getLocationPermissionState(): Promise<LocationPermissionState> {
  const fg = await Location.getForegroundPermissionsAsync();
  const bg = await Location.getBackgroundPermissionsAsync();
  return {
    foreground: fg.status,
    background: bg.status,
    canAskAgainForeground: fg.canAskAgain,
    canAskAgainBackground: bg.canAskAgain,
  };
}

export async function requestForegroundLocation(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

/**
 * Request background location only after the user explicitly enables
 * passive discovery. Callers should explain the benefit first.
 */
export async function requestBackgroundLocation(): Promise<boolean> {
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== Location.PermissionStatus.GRANTED) {
    const granted = await requestForegroundLocation();
    if (!granted) return false;
  }
  const { status } = await Location.requestBackgroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export async function getCurrentPosition(): Promise<Location.LocationObject | null> {
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== Location.PermissionStatus.GRANTED) return null;
  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch {
    return null;
  }
}
