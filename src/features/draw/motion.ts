import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { Easing, useReducedMotion } from 'react-native-reanimated';
import { spring } from '@/theme';

/** Team spring (damping 18, stiffness 180) and a snappier one for presses */
export const SPRING = spring;
export const SNAP = { damping: 20, stiffness: 320, mass: 0.8 } as const;
/** Exactly critical: lands without overshoot (slide-confirm's commit) */
export const CRITICAL = { stiffness: 520, damping: 2 * Math.sqrt(520 * 0.9), mass: 0.9 } as const;
export const EASE_IN = Easing.bezier(0.55, 0, 0.75, 0.2);
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Reduce Motion or VoiceOver: reveals finish instantly (SPEC §3.2) */
export function useAutoReveal(): boolean {
  const reduce = useReducedMotion();
  const [reader, setReader] = useState(false);
  useEffect(() => {
    // react-native-web's isScreenReaderEnabled() always resolves true, and
    // the web has no way to know — so on web only Reduce Motion counts
    if (Platform.OS === 'web') return;
    let live = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((v) => live && setReader(v));
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setReader);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return reduce || reader;
}
