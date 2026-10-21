import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';
import { spring } from '@/theme';

/** House spring (SPEC §2.2): damping 18, stiffness 180 */
export const SPRING: WithSpringConfig = { ...spring };

/** A touch under critical: settles with a hint of give, no wobble (toasts, sheets) */
export const SETTLE: WithSpringConfig = { stiffness: 380, damping: 34, mass: 1 };

/** The tab tile: k 260 at a damping ratio of ~0.72, so it overshoots a touch */
export const TILE: WithSpringConfig = { stiffness: 260, damping: 23.4, mass: 1 };

/** Ease used for words opening and closing (cubic-bezier(.22,1,.36,1)) */
export const OPEN_EASE: WithTimingConfig = { duration: 600, easing: Easing.bezier(0.22, 1, 0.36, 1) };

/** Reduce Motion stand-in: a short cross-fade */
export const FADE: WithTimingConfig = { duration: 160 };
