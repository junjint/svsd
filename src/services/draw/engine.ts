import { ACTIVITIES } from '@/data/activities';
import { placeService } from '@/services/places/PlaceService';
import { selectWeighted } from '@/services/recommendation/engine';
import { distanceMeters } from '@/utils/geo';
import { createId } from '@/utils/id';
import type {
  Activity,
  Coordinates,
  DrawSettings,
  DrawnSidequest,
  Place,
  QuestType,
  Rarity,
  RecommendationScoreBreakdown,
  RevealStyle,
} from '@/types';
import {
  OPTIONS_FOR_STYLE,
  RARITY_WEIGHTS,
  VARIANT_EVERY,
  VARIANT_REVEALS,
  activityFitsPlace,
  categoriesFor,
  milesToMeters,
} from './rules';

type Rng = () => number;

/* ── rarity ─────────────────────────────────────────────── */

export function rollRarity(random: Rng = Math.random): Rarity {
  const r = random();
  if (r < RARITY_WEIGHTS.legendary) return 'legendary';
  if (r < RARITY_WEIGHTS.legendary + RARITY_WEIGHTS.rare) return 'rare';
  return 'common';
}

const TIER_ORDER: Rarity[] = ['legendary', 'rare', 'common'];

/* ── reveal styles ──────────────────────────────────────── */

export function pickRevealStyles(
  drawNumber: number,
  rarity: Rarity,
  random: Rng = Math.random
): { place: RevealStyle; activity: RevealStyle } {
  const base = { place: 'scratch' as RevealStyle, activity: 'scratch' as RevealStyle };
  const variant = rarity === 'legendary' || (drawNumber > 0 && drawNumber % VARIANT_EVERY === 0);
  if (!variant) return base;
  const style = VARIANT_REVEALS[Math.floor(random() * VARIANT_REVEALS.length)]!;
  // Only the peel works for a single place; the choice reveals go on the activity
  if (style === 'peel' && random() < 0.5) return { ...base, place: 'peel' };
  return { ...base, activity: style };
}

/* ── activities ─────────────────────────────────────────── */

export interface ActivityQuery {
  place: Place;
  questType: QuestType;
  focus: DrawSettings['focus'];
  partySize: number;
  excludeIds?: string[];
  pool?: Activity[];
}

export function eligibleActivities(q: ActivityQuery): Activity[] {
  const pool = q.pool ?? ACTIVITIES;
  const exclude = new Set(q.excludeIds ?? []);
  return pool.filter((a) => {
    if (exclude.has(a.id)) return false;
    if (q.partySize < a.minParty || q.partySize > a.maxParty) return false;
    if (q.questType !== 'random' && !a.questTypes.includes(q.questType)) return false;
    if (q.questType === 'focus' && q.focus !== 'any' && a.indoorOutdoor !== 'any' && a.indoorOutdoor !== q.focus) {
      return false;
    }
    return activityFitsPlace(a, q.place);
  });
}

/**
 * Pick up to `count` distinct activities at the draw's rarity, falling back to
 * lower tiers when a tier is empty. The first one is "the" activity.
 */
export function drawActivities(
  q: ActivityQuery,
  rarity: Rarity,
  count = 1,
  random: Rng = Math.random
): Activity[] {
  let candidates = eligibleActivities(q);
  // Loosen the quest-type filter before giving up: a fitting activity beats none
  if (candidates.length === 0) candidates = eligibleActivities({ ...q, questType: 'random' });
  const picked: Activity[] = [];
  const start = TIER_ORDER.indexOf(rarity);
  for (let t = start; t < TIER_ORDER.length && picked.length < count; t++) {
    const tier = shuffle(candidates.filter((a) => a.rarity === TIER_ORDER[t]), random);
    for (const a of tier) {
      if (picked.length >= count) break;
      picked.push(a);
    }
  }
  return picked;
}

function shuffle<T>(list: T[], random: Rng): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/* ── places ─────────────────────────────────────────────── */

export interface PlaceQuery {
  location: Coordinates;
  settings: DrawSettings;
  /** Places drawn or done recently, kept out of the reel */
  excludePlaceIds: string[];
  partySize?: number;
}

function scoreForDraw(place: Place, q: PlaceQuery, radiusMeters: number): RecommendationScoreBreakdown {
  const d = distanceMeters(q.location, place.coordinates);
  // Anywhere inside the radius is fair game; slightly favor the nearer half
  const proximity = d > radiusMeters ? 0 : 1 - 0.4 * (d / radiusMeters);
  const interest = categoriesFor(q.settings.questType).includes(place.category) ? 1 : 0.3;
  const context = place.openingHours?.openNow === false ? 0.1 : 0.9;
  const story = place.storyHooks?.length ? 0.9 : 0.5;
  const novelty = 1;
  const surprise = place.category === 'unexpected' ? 0.9 : 0.4;
  const total = 0.3 * interest + 0.25 * proximity + 0.2 * context + 0.15 * story + 0.1 * surprise;
  return { interest, proximity, novelty, context, surprise, story, total };
}

export async function drawPlace(q: PlaceQuery, random: Rng = Math.random): Promise<Place | null> {
  const radius = milesToMeters(q.settings.radiusMiles);
  const places = await placeService.searchNearby(q.location, radius, categoriesFor(q.settings.questType), {
    excludePlaceIds: q.excludePlaceIds,
  });
  const scored = places
    .filter((p) => distanceMeters(q.location, p.coordinates) <= radius)
    .map((place) => ({ place, score: scoreForDraw(place, q, radius) }));
  return selectWeighted(scored, random)?.place ?? null;
}

/* ── assembling the quest ───────────────────────────────── */

export function buildDrawnQuest(args: {
  place: Place;
  activity: Activity;
  location: Coordinates;
  settings: DrawSettings;
  rarity: Rarity;
  revealStyle: DrawnSidequest['revealStyle'];
  rerollsUsed: DrawnSidequest['rerollsUsed'];
  cityLabel: string;
}): DrawnSidequest {
  const { activity, settings } = args;
  // demo listings carry a "[DEMO] " tag; the saved quest shows the name alone
  const place = { ...args.place, name: args.place.name.replace(/^\[[^\]]*\]\s*/, '') };
  const now = new Date().toISOString();
  const d = Math.round(distanceMeters(args.location, place.coordinates));
  const text = settings.partySize > 1 && activity.groupText ? activity.groupText : activity.text;
  return {
    id: createId('quest'),
    placeId: place.id,
    placeName: place.name,
    category: place.category,
    description: place.description,
    coordinates: place.coordinates,
    address: place.address,
    distanceMeters: d,
    estimatedWalkingMinutes: Math.max(1, Math.round(d / 80)),
    openingHours: place.openingHours,
    costInfo: place.priceLevel === 0 ? 'Free' : place.priceLevel === 1 ? '$' : place.priceLevel === 2 ? '$$' : undefined,
    personalizationScore: 0,
    storyHook: `While you're in ${args.cityLabel}, go to ${place.name}.`,
    suggestedActivity: text,
    status: 'suggested',
    whyRecommended: '',
    isSimulated: place.source === 'mock',
    createdAt: now,
    suggestedAt: now,
    updatedAt: now,
    activityId: activity.id,
    activityText: text,
    partySize: settings.partySize,
    questType: settings.questType,
    rarity: args.rarity,
    rerollsUsed: args.rerollsUsed,
    revealStyle: args.revealStyle,
    cityLabel: args.cityLabel,
    placePhotoUrl: place.photoUrl,
  };
}

export function optionsFor(style: RevealStyle): number {
  return OPTIONS_FOR_STYLE[style];
}
