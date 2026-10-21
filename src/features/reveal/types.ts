import type { Activity, Place, Rarity, RevealStyle } from '@/types';

/**
 * Contract between the Draw screen and the reveal surfaces (SPEC §3.2–3.3).
 * The Draw screen owns flow; a reveal owns only its gesture, its art and
 * its sounds, and calls onRevealed exactly once.
 */
export interface RevealBaseProps {
  rarity: Rarity;
  style: RevealStyle;
  /** true → finish immediately (Skip button, Always-skip, Reduce Motion) */
  revealNow?: boolean;
  onRevealed: () => void;
  width: number;
  height: number;
}

export interface PlaceRevealProps extends RevealBaseProps {
  place: Place;
  cityLabel: string;
  distanceLabel: string;
}

export interface ActivityRevealProps extends RevealBaseProps {
  /** options[0] is the default; choice styles (cards/coin/wheel) let the user pick */
  options: Activity[];
  partySize: number;
  onChoose?: (activityId: string) => void;
}
