import { pickHook } from '@/constants/narrativeHooks';
import { distanceMeters, estimateWalkingMinutes } from '@/utils/geo';
import { createId } from '@/utils/id';
import type {
  Coordinates,
  InterestCategory,
  Place,
  RecommendationFeedback,
  RecommendationScoreBreakdown,
  Sidequest,
  UserPreferences,
} from '@/types';

export interface RecommendationContext {
  location: Coordinates;
  preferences: UserPreferences;
  places: Place[];
  recentPlaceIds: string[];
  completedCategories: InterestCategory[];
  feedback: RecommendationFeedback[];
  travelMode: 'walking' | 'unknown' | 'driving';
  now?: Date;
  isSimulated?: boolean;
}

const WEIGHTS = {
  interest: 0.28,
  proximity: 0.22,
  novelty: 0.18,
  context: 0.14,
  surprise: 0.1,
  story: 0.08,
};

/** Detour minutes → approximate max meters at walking pace */
export function detourToMaxMeters(minutes: number): number {
  return Math.min(1200, Math.max(200, minutes * 80));
}

export function scorePlace(
  place: Place,
  ctx: RecommendationContext
): RecommendationScoreBreakdown {
  const prefs = ctx.preferences;
  const distance = distanceMeters(ctx.location, place.coordinates);
  const maxMeters = Math.min(
    prefs.walkingRadiusMaxMeters,
    detourToMaxMeters(prefs.detourMinutes)
  );
  const minMeters = prefs.walkingRadiusMinMeters;

  // Interest
  let interest = 0.15;
  if (prefs.interests.includes(place.category)) interest = 1;
  else if (prefs.avoidedCategories.includes(place.category)) interest = 0;
  else if (prefs.spontaneity !== 'comfortable') interest = 0.35;

  // Proximity — sweet spot mid-radius
  let proximity = 0;
  if (distance >= minMeters && distance <= maxMeters) {
    const mid = (minMeters + maxMeters) / 2;
    const spread = (maxMeters - minMeters) / 2 || 1;
    proximity = 1 - Math.abs(distance - mid) / spread;
    proximity = Math.max(0.2, Math.min(1, proximity));
  }

  // Novelty
  const seen = ctx.recentPlaceIds.includes(place.id);
  const categoryFamiliar = ctx.completedCategories.includes(place.category);
  let novelty = seen ? 0.05 : 0.85;
  if (!seen && !categoryFamiliar) novelty = 1;
  if (!seen && categoryFamiliar) novelty = 0.55;

  // Context — hours, budget, travel mode, time of day
  let context = 0.7;
  const now = ctx.now ?? new Date();
  const hour = now.getHours();
  if (place.openingHours?.openNow === false) context -= 0.5;
  if (place.openingHours?.openNow === true) context += 0.2;
  if (place.eventEnd && new Date(place.eventEnd).getTime() < now.getTime()) {
    context = 0;
  }
  if (prefs.budget !== 'any') {
    const maxLevel =
      prefs.budget === 'free' ? 0 : prefs.budget === 'under_10' ? 1 : 2;
    if ((place.priceLevel ?? 3) > maxLevel) context -= 0.4;
  }
  if (ctx.travelMode === 'driving' && prefs.preferWalkingOnly) context = 0;
  // Late night safety — dampen outdoor/unexpected after quiet hours start
  if (hour >= prefs.quietHoursStart || hour < prefs.quietHoursEnd) {
    if (place.category === 'nature' || place.category === 'unexpected') {
      context -= 0.3;
    }
  }
  context = Math.max(0, Math.min(1, context));

  // Surprise — gently outside core interests when spontaneity allows
  let surprise = 0.2;
  const outsideCore =
    !prefs.interests.includes(place.category) &&
    !prefs.avoidedCategories.includes(place.category);
  if (prefs.spontaneity === 'comfortable') {
    surprise = outsideCore ? 0.05 : 0.3;
  } else if (prefs.spontaneity === 'adventurous') {
    surprise = outsideCore ? 0.75 : 0.35;
  } else {
    surprise = outsideCore ? 1 : 0.4;
  }
  if (place.category === 'unexpected') surprise = Math.max(surprise, 0.85);

  // Story potential
  let story = 0.4;
  if (place.storyHooks && place.storyHooks.length > 0) story += 0.35;
  if (place.suggestedActivity) story += 0.15;
  if (place.tags && place.tags.length > 2) story += 0.1;
  story = Math.min(1, story);

  const total =
    interest * WEIGHTS.interest +
    proximity * WEIGHTS.proximity +
    novelty * WEIGHTS.novelty +
    context * WEIGHTS.context +
    surprise * WEIGHTS.surprise +
    story * WEIGHTS.story;

  return { interest, proximity, novelty, context, surprise, story, total };
}

/**
 * Weighted random selection among top candidates with controlled randomness.
 */
export function selectWeighted(
  scored: Array<{ place: Place; score: RecommendationScoreBreakdown }>,
  random: () => number = Math.random
): { place: Place; score: RecommendationScoreBreakdown } | null {
  const eligible = scored.filter((s) => s.score.total > 0.18 && s.score.context > 0);
  if (eligible.length === 0) return null;

  eligible.sort((a, b) => b.score.total - a.score.total);
  const top = eligible.slice(0, Math.min(8, eligible.length));
  const weights = top.map((s) => Math.pow(s.score.total, 1.6));
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = random() * sum;
  for (let i = 0; i < top.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return top[i]!;
  }
  return top[0]!;
}

export function buildWhyRecommended(
  place: Place,
  score: RecommendationScoreBreakdown,
  prefs: UserPreferences
): string {
  const reasons: string[] = [];
  if (prefs.interests.includes(place.category) && score.interest > 0.7) {
    reasons.push(`matches your interest in ${place.category.replace('_', ' ')}`);
  }
  if (score.proximity > 0.5) reasons.push('is a realistic walking detour');
  if (score.novelty > 0.7) reasons.push('is somewhere new for you');
  if (score.surprise > 0.7) reasons.push('gently stretches beyond your usual routine');
  if (score.story > 0.6) reasons.push('has a strong story hook');
  if (reasons.length === 0) reasons.push('scored well for your current exploration settings');
  return `Recommended because it ${reasons.join(', ')}.`;
}

export function placeToSidequest(
  place: Place,
  location: Coordinates,
  score: RecommendationScoreBreakdown,
  prefs: UserPreferences,
  isSimulated?: boolean
): Sidequest {
  const distance = distanceMeters(location, place.coordinates);
  const walking = estimateWalkingMinutes(distance);
  const now = new Date().toISOString();
  const storyHook = pickHook(place.category, place.storyHooks);

  return {
    id: createId('quest'),
    placeId: place.id,
    placeName: place.name,
    category: place.category,
    description: place.description,
    coordinates: place.coordinates,
    address: place.address,
    distanceMeters: Math.round(distance),
    estimatedWalkingMinutes: walking,
    openingHours: place.openingHours,
    costInfo:
      place.priceLevel === 0
        ? 'Free'
        : place.priceLevel === 1
          ? 'Under ~$10'
          : place.priceLevel === 2
            ? 'Under ~$25'
            : undefined,
    personalizationScore: Number(score.total.toFixed(3)),
    scoreBreakdown: score,
    storyHook,
    suggestedActivity:
      place.suggestedActivity ??
      'Spend a few minutes exploring and notice one unexpected detail.',
    status: 'discovered',
    whyRecommended: buildWhyRecommended(place, score, prefs),
    isSimulated,
    createdAt: now,
    updatedAt: now,
  };
}

export function recommendSidequests(
  ctx: RecommendationContext,
  count = 5
): Sidequest[] {
  const prefs = ctx.preferences;
  const maxMeters = Math.min(
    prefs.walkingRadiusMaxMeters,
    detourToMaxMeters(prefs.detourMinutes)
  );

  const scored = ctx.places
    .filter((p) => !prefs.avoidedCategories.includes(p.category))
    .filter((p) => !ctx.recentPlaceIds.includes(p.id))
    .map((place) => {
      const d = distanceMeters(ctx.location, place.coordinates);
      if (d < prefs.walkingRadiusMinMeters || d > maxMeters) {
        return { place, score: { ...scorePlace(place, ctx), total: 0, proximity: 0 } };
      }
      return { place, score: scorePlace(place, ctx) };
    })
    .filter((s) => s.score.total > 0);

  const results: Sidequest[] = [];
  const used = new Set<string>();
  const working = [...scored];

  for (let i = 0; i < count && working.length > 0; i++) {
    const available = working.filter((s) => !used.has(s.place.id));
    const picked = selectWeighted(available);
    if (!picked) break;
    used.add(picked.place.id);
    results.push(
      placeToSidequest(
        picked.place,
        ctx.location,
        picked.score,
        prefs,
        ctx.isSimulated
      )
    );
  }

  return results;
}

export function recommendOne(ctx: RecommendationContext): Sidequest | null {
  return recommendSidequests(ctx, 1)[0] ?? null;
}
