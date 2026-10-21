import type { BadgeId } from '@/types';

/** PM-approved line under "New badge: {name}" on the unlock sheet */
export const BADGE_LINES: Record<BadgeId, string> = {
  first_sidequest: 'The first of many',
  seasoned_sidequester: "Five down. You're getting good at this",
  main_character: 'Twenty-five sidequests. Iconic',
  globetrotter: 'Three cities, zero itineraries',
  squad_up: 'Better with friends',
  lone_wolf: "Ten solo. You're great company",
  lucky_draw: 'You pulled a legendary and actually went',
  no_rerolls: 'First draw, no take-backs',
  local_legend: 'Your ideas are in the deck now',
  touch_grass: 'Five nature quests. Certified grass toucher',
};
