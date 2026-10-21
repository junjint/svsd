/**
 * Every UI event that makes a sound and/or a haptic — docs/SPEC.md §5.
 * Sound ids are Bencho Sounds ids (bencho.dev/sounds); files live in
 * assets/sounds/<id>.<ext>, git-ignored.
 */
export type HapticKind =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'rigid'
  | 'soft'
  | 'success'
  | 'warning'
  | 'error'
  | 'none';

export interface FeedbackSpec {
  sound?: string;
  /** play a second sound after this many ms */
  then?: { sound: string; afterMs: number };
  haptic: HapticKind;
  /** minimum ms between plays, for continuous gestures */
  throttleMs?: number;
  hapticThrottleMs?: number;
}

export const FEEDBACK = {
  chipSelect: { sound: 'select', haptic: 'selection' },
  partyStep: { sound: 'count', haptic: 'light' },
  toggle: { sound: 'pressToggle', haptic: 'light' },
  drawPress: { sound: 'mechToggle', haptic: 'medium' },
  shuffleCard: { sound: 'slide', haptic: 'light' },
  scratchTick: { sound: 'mechSelect', haptic: 'soft', throttleMs: 70, hapticThrottleMs: 140 },
  placeRevealed: { sound: 'landed', haptic: 'success' },
  activityRevealed: { sound: 'ready', haptic: 'success' },
  rareRevealed: { sound: 'chime', haptic: 'success' },
  legendaryRevealed: { sound: 'mechSuccess', then: { sound: 'crest', afterMs: 420 }, haptic: 'heavy' },
  reroll: { sound: 'shift', haptic: 'light' },
  lockPlace: { sound: 'latch', haptic: 'rigid' },
  outOfRerolls: { sound: 'deny', haptic: 'warning' },
  go: { sound: 'portal', haptic: 'success' },
  saveForLater: { sound: 'pin', haptic: 'light' },
  tabSwitch: { sound: 'step', haptic: 'selection' },
  sheetOpen: { sound: 'open', haptic: 'none' },
  sheetClose: { sound: 'close', haptic: 'none' },
  newCity: { sound: 'perk', haptic: 'light' },
  addPhoto: { sound: 'mechTap', haptic: 'light' },
  questCompleted: { sound: 'pressSuccess', haptic: 'success' },
  badgeUnlocked: { sound: 'bell', haptic: 'success' },
  postToWall: { sound: 'swoop', haptic: 'medium' },
  reaction: { sound: 'bubbleTap', haptic: 'light' },
  pullFill: { sound: 'fill', haptic: 'light' },
  pullRelease: { sound: 'land', haptic: 'light' },
  suggestionSent: { sound: 'copied', haptic: 'success' },
  formError: { sound: 'snub', haptic: 'error' },
} as const satisfies Record<string, FeedbackSpec>;

export type FeedbackEvent = keyof typeof FEEDBACK;

/** Every sound id the app references, for the manifest check */
export const SOUND_IDS: string[] = [
  ...new Set(
    Object.values(FEEDBACK as Record<string, FeedbackSpec>).flatMap((f) =>
      [f.sound, f.then?.sound].filter((s): s is string => !!s)
    )
  ),
].sort();
