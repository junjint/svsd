import type { Activity, InterestCategory, Place, QuestType, Rarity, RevealStyle } from '@/types';

/** docs/SPEC.md §3.4 */
export const REROLLS_PER_STAGE = 2;

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 0.75,
  rare: 0.22,
  legendary: 0.03,
};

/** Every Nth draw (and every legendary) swaps in a variant reveal — §3.3 */
export const VARIANT_EVERY = 4;
export const VARIANT_REVEALS: RevealStyle[] = ['peel', 'cards', 'coin', 'wheel'];

/** How many face-down options each activity reveal style offers */
export const OPTIONS_FOR_STYLE: Record<RevealStyle, number> = {
  scratch: 1,
  peel: 1,
  cards: 3,
  coin: 2,
  wheel: 6,
};

export const QUEST_TYPE_CATEGORIES: Record<Exclude<QuestType, 'random'>, InterestCategory[]> = {
  meal: ['local_food'],
  snack: ['coffee', 'local_food'],
  nature: ['nature'],
  focus: ['study_spots', 'coffee', 'bookstores', 'cultural', 'architecture'],
};

export const ALL_CATEGORIES: InterestCategory[] = [
  'coffee',
  'nature',
  'bookstores',
  'live_music',
  'art',
  'thrifting',
  'local_food',
  'architecture',
  'community_events',
  'study_spots',
  'cultural',
  'unexpected',
];

export function categoriesFor(type: QuestType): InterestCategory[] {
  return type === 'random' ? ALL_CATEGORIES : QUEST_TYPE_CATEGORIES[type];
}

export const MILE_IN_METERS = 1609.344;
export const milesToMeters = (mi: number) => Math.round(mi * MILE_IN_METERS);

/** Walking under ~1.5 mi, otherwise transit/drive — §4.1 */
export function travelLabel(distanceMeters: number): string {
  const miles = distanceMeters / MILE_IN_METERS;
  if (miles < 1.5) {
    const min = Math.max(1, Math.round(distanceMeters / 80));
    return `${min} min walk`;
  }
  const min = Math.max(5, Math.round((distanceMeters / 1000) * 3));
  return `~${min} min by transit or car`;
}

export function formatMiles(distanceMeters: number): string {
  const mi = distanceMeters / MILE_IN_METERS;
  if (mi < 0.1) return `${Math.round(distanceMeters * 3.28084)} ft`;
  return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
}

/** The place words an activity can match: its category plus its tags */
export function placeWords(place: Place): Set<string> {
  return new Set([place.category, ...(place.tags ?? [])].map((t) => t.toLowerCase()));
}

export function activityFitsPlace(activity: Activity, place: Place): boolean {
  if (activity.placeTags.includes('*')) return true;
  const words = placeWords(place);
  return activity.placeTags.some((t) => words.has(t.toLowerCase()));
}
