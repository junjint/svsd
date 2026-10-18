import { placeService } from '@/services/places/PlaceService';
import {
  canSendUnsolicitedNotification,
  dayKey,
  wasRecentlySuggested,
} from '@/services/recommendation/cooldowns';
import { recommendOne, recommendSidequests } from '@/services/recommendation/engine';
import { scheduleSidequestNotification } from '@/services/notifications/notifications';
import { transitionSidequest } from '@/services/sidequest/lifecycle';
import type {
  Coordinates,
  DiscoveryState,
  RecommendationFeedback,
  Sidequest,
  UserPreferences,
} from '@/types';

export interface DiscoveryInput {
  location: Coordinates;
  preferences: UserPreferences;
  discovery: DiscoveryState;
  existingSidequests: Sidequest[];
  feedback: RecommendationFeedback[];
  isSimulated?: boolean;
  forceNotify?: boolean;
}

export interface DiscoveryResult {
  candidates: Sidequest[];
  notified?: Sidequest;
  discovery: DiscoveryState;
  notificationBlockedReason?: string;
}

function recentPlaceIds(sidequests: Sidequest[], days: number): string[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return sidequests
    .filter((q) => {
      if (q.status === 'dismissed' || q.status === 'completed') {
        const t = new Date(q.dismissedAt ?? q.completedAt ?? q.updatedAt).getTime();
        return t >= cutoff;
      }
      return q.status === 'suggested' || q.status === 'accepted' || q.status === 'en_route';
    })
    .map((q) => q.placeId);
}

function completedCategories(sidequests: Sidequest[]) {
  return [
    ...new Set(
      sidequests.filter((q) => q.status === 'completed').map((q) => q.category)
    ),
  ];
}

/**
 * Core discovery pass: fetch places → score → optionally notify.
 */
export async function runDiscoveryPass(
  input: DiscoveryInput
): Promise<DiscoveryResult> {
  const { location, preferences, discovery, existingSidequests, feedback } = input;
  const exclude = recentPlaceIds(
    existingSidequests,
    preferences.duplicateSuppressionDays
  );

  const places = await placeService.searchNearby(
    location,
    preferences.walkingRadiusMaxMeters,
    preferences.interests.length > 0
      ? preferences.interests
      : [
          'coffee',
          'nature',
          'bookstores',
          'art',
          'local_food',
          'unexpected',
        ],
    { excludePlaceIds: exclude, budget: preferences.budget, openNowPreferred: true }
  );

  const history = existingSidequests.map((q) => ({
    placeId: q.placeId,
    at: q.suggestedAt ?? q.createdAt,
  }));

  const filteredPlaces = places.filter(
    (p) =>
      !wasRecentlySuggested(
        p.id,
        history,
        preferences.duplicateSuppressionDays
      )
  );

  const candidates = recommendSidequests(
    {
      location,
      preferences,
      places: filteredPlaces,
      recentPlaceIds: exclude,
      completedCategories: completedCategories(existingSidequests),
      feedback,
      travelMode: discovery.travelMode,
      isSimulated: input.isSimulated,
    },
    8
  ).map((q) => transitionSidequest(q, 'suggested'));

  let notified: Sidequest | undefined;
  let notificationBlockedReason: string | undefined;
  let nextDiscovery: DiscoveryState = {
    ...discovery,
    lastDiscoveryAt: new Date().toISOString(),
  };

  const gate = canSendUnsolicitedNotification(discovery, preferences);
  if (!gate.ok && !input.forceNotify) {
    notificationBlockedReason = gate.reason;
  } else if (candidates[0]) {
    const quest = candidates[0];
    await scheduleSidequestNotification(quest, {
      simulated: input.isSimulated,
    });
    notified = quest;
    const key = dayKey();
    const sentToday =
      discovery.notificationsDayKey === key ? discovery.notificationsSentToday : 0;
    nextDiscovery = {
      ...nextDiscovery,
      lastNotificationAt: new Date().toISOString(),
      notificationsSentToday: sentToday + 1,
      notificationsDayKey: key,
    };
  }

  return {
    candidates,
    notified,
    discovery: nextDiscovery,
    notificationBlockedReason,
  };
}

export async function generateSidequestNow(
  input: Omit<DiscoveryInput, 'forceNotify'>
): Promise<Sidequest | null> {
  const result = await runDiscoveryPass({ ...input, forceNotify: false });
  if (result.candidates[0]) return result.candidates[0];

  // Broader fallback without exclude if nothing found
  const places = await placeService.searchNearby(
    input.location,
    Math.max(input.preferences.walkingRadiusMaxMeters, 1500),
    [],
    { maxResults: 20 }
  );
  return recommendOne({
    location: input.location,
    preferences: input.preferences,
    places,
    recentPlaceIds: [],
    completedCategories: completedCategories(input.existingSidequests),
    feedback: input.feedback,
    travelMode: input.discovery.travelMode,
    isSimulated: input.isSimulated,
  });
}
