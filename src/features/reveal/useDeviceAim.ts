import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Phones have no hover, so the holo foil follows the phone's tilt
 * (SPEC §6.2.3): {u, v} 0..1, where the light falls on the card.
 * Native only, about 15 updates a second, and only when it moved.
 */
export function useDeviceAim(enabled: boolean) {
  const [aim, setAim] = useState<{ u: number; v: number } | undefined>(undefined);
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    let sub: { remove: () => void } | null = null;
    let live = true;
    DeviceMotion.isAvailableAsync()
      .then((ok) => {
        if (!ok || !live) return;
        DeviceMotion.setUpdateInterval(66);
        sub = DeviceMotion.addListener(({ rotation }) => {
          if (!rotation) return;
          /* held for reading, a phone sits about 40° back (beta ≈ 0.7 rad) */
          const u = Math.round((0.5 + clamp(rotation.gamma / 0.6, -1, 1) * 0.45) * 50) / 50;
          const v = Math.round((0.5 + clamp((rotation.beta - 0.7) / 0.6, -1, 1) * 0.45) * 50) / 50;
          setAim((a) => (a && a.u === u && a.v === v ? a : { u, v }));
        });
      })
      .catch(() => {});
    return () => {
      live = false;
      sub?.remove();
    };
  }, [enabled]);
  return aim;
}
