import { offsetCoordinates } from '@/utils/geo';
import type { Activity, Coordinates, InterestCategory, Place, Suggestion, SuggestionBand } from '@/types';

/**
 * Suggestions are what people leave in their city's pool. They go in as
 * ordinary places and activities with `source: 'user'`, and the Draw treats
 * them exactly like everything else: no boost, no ranking, no counts.
 */

/** The "what kind of place" chips. Tags come from the seed places, so seed activities fit too */
export const KINDS: { id: InterestCategory; label: string; tags: string[] }[] = [
  { id: 'local_food', label: 'Food', tags: ['restaurant', 'counter', 'local'] },
  { id: 'coffee', label: 'Coffee or sweets', tags: ['cafe', 'bakery', 'dessert'] },
  { id: 'nature', label: 'Outside', tags: ['park', 'bench', 'trees', 'outdoors'] },
  { id: 'study_spots', label: 'Quiet', tags: ['quiet', 'bench', 'library'] },
  { id: 'art', label: 'Art or culture', tags: ['gallery', 'museum', 'cultural'] },
  { id: 'unexpected', label: 'Something else', tags: ['plaza', 'landmark', 'bench', 'hidden'] },
];

export const BANDS: { id: SuggestionBand; label: string }[] = [
  { id: 'here', label: 'Right here' },
  { id: 'walk', label: 'A short walk' },
  { id: 'town', label: 'Across town' },
];

/** We only ask roughly where a place is, so its pin lands somewhere in this ring around you */
export const BAND_METERS: Record<SuggestionBand, [number, number]> = {
  here: [0, 120],
  walk: [300, 900],
  town: [1600, 3200],
};

export const PLACE_MAX = 40;
export const ACTIVITY_MAX = 60;

/* FNV-1a into a small LCG, the same seeded rng TornPaper uses */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function placeCoordinates(origin: Coordinates, band: SuggestionBand, seed: string): Coordinates {
  const r = rng(seed);
  const [min, max] = BAND_METERS[band];
  const bearing = r() * Math.PI * 2;
  const d = min + r() * (max - min);
  return offsetCoordinates(origin, Math.cos(bearing) * d, Math.sin(bearing) * d);
}

const tidy = (text: string) => text.replace(/\s+/g, ' ').trim();

/** "  feed the ducks. " → "Feed the ducks", the way seed activities read */
export function normaliseActivity(text: string): string {
  const t = tidy(text).replace(/[.!]+$/, '').trim();
  return t ? t[0]!.toUpperCase() + t.slice(1) : '';
}

export function normalisePlace(text: string): string {
  return tidy(text).replace(/[.]+$/, '').trim();
}

const kindOf = (category?: InterestCategory) => KINDS.find((k) => k.id === category) ?? KINDS[KINDS.length - 1]!;

export function suggestionPlace(s: Suggestion): Place | null {
  if (!s.placeId || !s.placeName || !s.coordinates) return null;
  const kind = kindOf(s.category);
  return {
    id: s.placeId,
    name: s.placeName,
    category: kind.id,
    description: `Suggested by a sidequester in ${s.cityLabel}.`,
    coordinates: s.coordinates,
    address: s.cityLabel,
    source: 'user',
    // its own id is a tag, so an activity suggested with it pairs with it
    tags: [...kind.tags, s.placeId],
    openingHours: { openNow: true },
    verificationStatus: 'unverified',
    attribution: 'Sidequester suggestion',
    createdAt: s.createdAt,
    updatedAt: s.createdAt,
  };
}

export function suggestionActivity(s: Suggestion): Activity | null {
  if (!s.activityId || !s.activityText) return null;
  return {
    id: s.activityId,
    text: s.activityText,
    questTypes: ['meal', 'snack', 'nature', 'focus'],
    placeTags: s.placeId ? [s.placeId, ...kindOf(s.category).tags] : ['*'],
    minParty: 1,
    maxParty: 8,
    rarity: 'common',
    durationMin: 30,
    costTier: 0,
    indoorOutdoor: 'any',
    source: 'user',
    cityId: s.cityLabel,
  };
}

export const userPlaces = (suggestions: Suggestion[]) =>
  suggestions.map(suggestionPlace).filter((p): p is Place => !!p);

export const userActivitiesFor = (suggestions: Suggestion[], cityLabel: string) =>
  suggestions
    .filter((s) => s.cityLabel === cityLabel)
    .map(suggestionActivity)
    .filter((a): a is Activity => !!a);

/** Today's suggestion, if there is one: one a day, by the local calendar */
export function suggestedToday(suggestions: Suggestion[], now = new Date()): Suggestion | undefined {
  const day = now.toDateString();
  return suggestions.find((s) => new Date(s.createdAt).toDateString() === day);
}
