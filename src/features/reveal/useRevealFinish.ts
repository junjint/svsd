import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { feedback, type FeedbackEvent } from '@/services/sound';
import type { Rarity } from '@/types';

/** How long the finished reveal stays on screen before the Draw moves on */
const HOLD_MS = { natural: 1000, skip: 520 } as const;

/**
 * The one way a reveal ends (SPEC §3.2): plays the end sound once, adds
 * the rare chime, then calls onRevealed exactly once after a beat so the
 * result can be seen. Legendary plays the normal end sound; the Draw
 * result owns the legendary fanfare and confetti.
 *
 * `forced` is true for Skip, the revealNow prop, and Reduce Motion; the
 * surface uses it to run its finish animation immediately.
 */
export function useRevealFinish(opts: { rarity: Rarity; end: FeedbackEvent; revealNow?: boolean; onRevealed: () => void }) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const once = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(opts);
  latest.current = opts;

  const finish = useCallback((how: 'natural' | 'skip') => {
    if (once.current) return;
    once.current = true;
    setDone(true);
    feedback(latest.current.end);
    if (latest.current.rarity === 'rare') setTimeout(() => feedback('rareRevealed'), 140);
    timer.current = setTimeout(() => latest.current.onRevealed(), HOLD_MS[how]);
  }, []);

  const skip = useCallback(() => {
    setSkipped(true);
    finish('skip');
  }, [finish]);

  const forced = skipped || !!opts.revealNow || !!reduce;

  useEffect(() => {
    if ((opts.revealNow || reduce) && !once.current) finish('skip');
  }, [opts.revealNow, reduce, finish]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { done, forced, finish, skip, reduceMotion: !!reduce };
}
