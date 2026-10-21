import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { FEEDBACK, type FeedbackEvent, type FeedbackSpec, type HapticKind } from './events';
import { playSound, setSoundsEnabled } from './sfx';

let hapticsOn = true;
const lastSound = new Map<string, number>();
const lastHaptic = new Map<string, number>();

export function setFeedbackEnabled(opts: { sounds?: boolean; haptics?: boolean }): void {
  if (opts.sounds !== undefined) setSoundsEnabled(opts.sounds);
  if (opts.haptics !== undefined) hapticsOn = opts.haptics;
}

function haptic(kind: HapticKind): void {
  if (!hapticsOn || kind === 'none' || Platform.OS === 'web') return;
  switch (kind) {
    case 'selection':
      void Haptics.selectionAsync();
      return;
    case 'success':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    case 'warning':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    case 'error':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    default: {
      const style = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
        rigid: Haptics.ImpactFeedbackStyle.Rigid,
        soft: Haptics.ImpactFeedbackStyle.Soft,
      }[kind];
      void Haptics.impactAsync(style);
    }
  }
}

/** Fire the sound + haptic pair for a UI event (throttled where the spec says so) */
export function feedback(event: FeedbackEvent): void {
  const spec: FeedbackSpec = FEEDBACK[event];
  const now = Date.now();
  if (spec.sound) {
    const last = lastSound.get(event) ?? 0;
    if (!spec.throttleMs || now - last >= spec.throttleMs) {
      lastSound.set(event, now);
      playSound(spec.sound);
      if (spec.then) {
        const next = spec.then.sound;
        setTimeout(() => playSound(next), spec.then.afterMs);
      }
    }
  }
  const throttle = spec.hapticThrottleMs ?? spec.throttleMs;
  const lastH = lastHaptic.get(event) ?? 0;
  if (!throttle || now - lastH >= throttle) {
    lastHaptic.set(event, now);
    haptic(spec.haptic);
  }
}
