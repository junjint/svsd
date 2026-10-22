import type { BadgeId, DrawnSidequest, Suggestion } from '@/types';

/** docs/SPEC.md §4.3 — rules are data; checked on every quest completion */
export interface BadgeStats {
  completed: DrawnSidequest[];
  suggestions: Suggestion[];
}

/** chrome art drawn with the Kinetic Metal brush (assets/badges), or a struck medal with a numeral */
export type BadgeArt = { kind: 'png'; src: number } | { kind: 'medal'; mark: string };

export interface BadgeDef {
  id: BadgeId;
  name: string;
  rule: string;
  art: BadgeArt;
  earned: (s: BadgeStats) => boolean;
}

const cities = (s: BadgeStats) => new Set(s.completed.map((q) => q.cityLabel)).size;
const medal = (mark: string): BadgeArt => ({ kind: 'medal', mark });
/** finished a sidequest at a place you put in the pool yourself */
const fullCircle = (s: BadgeStats) => {
  const mine = new Set(s.suggestions.map((x) => x.placeId).filter(Boolean));
  return s.completed.some((q) => mine.has(q.placeId));
};

export const BADGES: BadgeDef[] = [
  { id: 'first_sidequest', name: 'First Sidequest', rule: 'Complete 1 sidequest', art: { kind: 'png', src: require('../../assets/badges/first_sidequest.png') }, earned: (s) => s.completed.length >= 1 },
  { id: 'seasoned_sidequester', name: 'Seasoned Sidequester', rule: 'Complete 5 sidequests', art: { kind: 'png', src: require('../../assets/badges/seasoned_sidequester.png') }, earned: (s) => s.completed.length >= 5 },
  { id: 'main_character', name: 'Main Character', rule: 'Complete 25 sidequests', art: { kind: 'png', src: require('../../assets/badges/main_character.png') }, earned: (s) => s.completed.length >= 25 },
  { id: 'globetrotter', name: 'Globetrotter', rule: 'Complete quests in 3 cities', art: { kind: 'png', src: require('../../assets/badges/globetrotter.png') }, earned: (s) => cities(s) >= 3 },
  { id: 'squad_up', name: 'Squad Up', rule: 'Complete one with 3+ people', art: { kind: 'png', src: require('../../assets/badges/squad_up.png') }, earned: (s) => s.completed.some((q) => q.partySize >= 3) },
  { id: 'lone_wolf', name: 'Lone Wolf', rule: 'Complete 10 solo', art: { kind: 'png', src: require('../../assets/badges/lone_wolf.png') }, earned: (s) => s.completed.filter((q) => q.partySize === 1).length >= 10 },
  { id: 'lucky_draw', name: 'Lucky Draw', rule: 'Complete a Legendary', art: { kind: 'png', src: require('../../assets/badges/lucky_draw.png') }, earned: (s) => s.completed.some((q) => q.rarity === 'legendary') },
  {
    id: 'no_rerolls',
    name: 'No Rerolls',
    rule: 'Complete a quest drawn with zero rerolls',
    art: { kind: 'png', src: require('../../assets/badges/no_rerolls.png') },
    earned: (s) => s.completed.some((q) => q.rerollsUsed.place + q.rerollsUsed.activity === 0),
  },
  { id: 'local_legend', name: 'Local Legend', rule: 'Complete a sidequest at a place you suggested', art: { kind: 'png', src: require('../../assets/badges/local_legend.png') }, earned: fullCircle },
  { id: 'touch_grass', name: 'Touch Grass', rule: 'Complete 5 Nature quests', art: { kind: 'png', src: require('../../assets/badges/touch_grass.png') }, earned: (s) => s.completed.filter((q) => q.questType === 'nature').length >= 5 },
  { id: 'word_of_mouth', name: 'Word of Mouth', rule: 'Suggest your first sidequest', art: medal('1'), earned: (s) => s.suggestions.length >= 1 },
  { id: 'local_knowledge', name: 'Local Knowledge', rule: 'Suggest 5 sidequests', art: medal('5'), earned: (s) => s.suggestions.length >= 5 },
  { id: 'cartographer', name: 'Cartographer', rule: 'Suggest 10 sidequests', art: medal('10'), earned: (s) => s.suggestions.length >= 10 },
  { id: 'folklore', name: 'Folklore', rule: 'Suggest 25 sidequests', art: medal('25'), earned: (s) => s.suggestions.length >= 25 },
];

export function newlyEarned(stats: BadgeStats, have: BadgeId[]): BadgeId[] {
  const owned = new Set(have);
  return BADGES.filter((b) => !owned.has(b.id) && b.earned(stats)).map((b) => b.id);
}
