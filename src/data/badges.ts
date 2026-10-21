import type { BadgeId, DrawnSidequest } from '@/types';

/** docs/SPEC.md §4.3 — rules are data; checked on every quest completion */
export interface BadgeStats {
  completed: DrawnSidequest[];
  approvedSuggestions: number;
}

export interface BadgeDef {
  id: BadgeId;
  name: string;
  rule: string;
  /** an emoji stand-in until badge art exists */
  glyph: string;
  earned: (s: BadgeStats) => boolean;
}

const cities = (s: BadgeStats) => new Set(s.completed.map((q) => q.cityLabel)).size;

export const BADGES: BadgeDef[] = [
  { id: 'first_sidequest', name: 'First Sidequest', rule: 'Complete 1 sidequest', glyph: '✦', earned: (s) => s.completed.length >= 1 },
  { id: 'seasoned_sidequester', name: 'Seasoned Sidequester', rule: 'Complete 5 sidequests', glyph: '✺', earned: (s) => s.completed.length >= 5 },
  { id: 'main_character', name: 'Main Character', rule: 'Complete 25 sidequests', glyph: '☀︎', earned: (s) => s.completed.length >= 25 },
  { id: 'globetrotter', name: 'Globetrotter', rule: 'Complete quests in 3 cities', glyph: '◍', earned: (s) => cities(s) >= 3 },
  { id: 'squad_up', name: 'Squad Up', rule: 'Complete one with 3+ people', glyph: '⁂', earned: (s) => s.completed.some((q) => q.partySize >= 3) },
  { id: 'lone_wolf', name: 'Lone Wolf', rule: 'Complete 10 solo', glyph: '☾', earned: (s) => s.completed.filter((q) => q.partySize === 1).length >= 10 },
  { id: 'lucky_draw', name: 'Lucky Draw', rule: 'Complete a Legendary', glyph: '★', earned: (s) => s.completed.some((q) => q.rarity === 'legendary') },
  {
    id: 'no_rerolls',
    name: 'No Rerolls',
    rule: 'Complete a quest drawn with zero rerolls',
    glyph: '➶',
    earned: (s) => s.completed.some((q) => q.rerollsUsed.place + q.rerollsUsed.activity === 0),
  },
  { id: 'local_legend', name: 'Local Legend', rule: '3 of your ideas approved', glyph: '⚑', earned: (s) => s.approvedSuggestions >= 3 },
  { id: 'touch_grass', name: 'Touch Grass', rule: 'Complete 5 Nature quests', glyph: '❦', earned: (s) => s.completed.filter((q) => q.questType === 'nature').length >= 5 },
];

export function newlyEarned(stats: BadgeStats, have: BadgeId[]): BadgeId[] {
  const owned = new Set(have);
  return BADGES.filter((b) => !owned.has(b.id) && b.earned(stats)).map((b) => b.id);
}
