import {
  detourToMaxMeters,
  recommendSidequests,
  scorePlace,
  selectWeighted,
} from '../src/services/recommendation/engine';
import {
  canSendUnsolicitedNotification,
  isCooldownActive,
  isQuietHours,
  wasRecentlySuggested,
} from '../src/services/recommendation/cooldowns';
import {
  canTransition,
  transitionSidequest,
} from '../src/services/sidequest/lifecycle';
import {
  ANN_ARBOR_CENTER,
  DEFAULT_PREFERENCES,
  type DiscoveryState,
  type Place,
  type Sidequest,
} from '../src/types';

const basePlace = (overrides: Partial<Place> = {}): Place => ({
  id: 'p1',
  name: 'Test Cafe',
  category: 'coffee',
  description: 'Test',
  coordinates: {
    latitude: ANN_ARBOR_CENTER.latitude + 0.002,
    longitude: ANN_ARBOR_CENTER.longitude + 0.002,
  },
  address: 'Test St',
  source: 'mock',
  priceLevel: 1,
  openingHours: { openNow: true },
  storyHooks: ['Try something new.'],
  suggestedActivity: 'Sit for five minutes.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const prefs = {
  ...DEFAULT_PREFERENCES,
  interests: ['coffee' as const],
  explorationEnabled: true,
  walkingRadiusMinMeters: 50,
  walkingRadiusMaxMeters: 1200,
  detourMinutes: 15 as const,
};

describe('recommendation filtering & scoring', () => {
  it('maps detour minutes to a walking radius band', () => {
    expect(detourToMaxMeters(5)).toBe(400);
    expect(detourToMaxMeters(20)).toBe(1200);
  });

  it('scores interest matches higher than avoided categories', () => {
    const ctx = {
      location: ANN_ARBOR_CENTER,
      preferences: prefs,
      places: [],
      recentPlaceIds: [],
      completedCategories: [],
      feedback: [],
      travelMode: 'walking' as const,
    };
    const coffee = scorePlace(basePlace({ category: 'coffee' }), ctx);
    const avoided = scorePlace(
      basePlace({ id: 'p2', category: 'live_music' }),
      {
        ...ctx,
        preferences: { ...prefs, avoidedCategories: ['live_music'] },
      }
    );
    expect(coffee.interest).toBeGreaterThan(avoided.interest);
    expect(avoided.interest).toBe(0);
  });

  it('filters out driving when walking-only is preferred', () => {
    const place = basePlace();
    const score = scorePlace(place, {
      location: ANN_ARBOR_CENTER,
      preferences: prefs,
      places: [place],
      recentPlaceIds: [],
      completedCategories: [],
      feedback: [],
      travelMode: 'driving',
    });
    expect(score.context).toBe(0);
  });

  it('returns weighted recommendations without inventing places', () => {
    const places = [
      basePlace({ id: 'a', category: 'coffee' }),
      basePlace({
        id: 'b',
        category: 'art',
        coordinates: {
          latitude: ANN_ARBOR_CENTER.latitude + 0.003,
          longitude: ANN_ARBOR_CENTER.longitude,
        },
      }),
      basePlace({
        id: 'c',
        category: 'bookstores',
        coordinates: {
          latitude: ANN_ARBOR_CENTER.latitude + 0.0015,
          longitude: ANN_ARBOR_CENTER.longitude - 0.001,
        },
      }),
    ];
    const quests = recommendSidequests({
      location: ANN_ARBOR_CENTER,
      preferences: {
        ...prefs,
        interests: ['coffee', 'bookstores'],
        spontaneity: 'adventurous',
      },
      places,
      recentPlaceIds: [],
      completedCategories: [],
      feedback: [],
      travelMode: 'walking',
    });
    expect(quests.length).toBeGreaterThan(0);
    expect(quests.every((q) => places.some((p) => p.id === q.placeId))).toBe(
      true
    );
  });

  it('selectWeighted prefers higher scores but allows randomness', () => {
    const scored = [
      {
        place: basePlace({ id: 'low' }),
        score: {
          interest: 0.2,
          proximity: 0.2,
          novelty: 0.2,
          context: 0.8,
          surprise: 0.2,
          story: 0.2,
          total: 0.25,
        },
      },
      {
        place: basePlace({ id: 'high' }),
        score: {
          interest: 1,
          proximity: 1,
          novelty: 1,
          context: 1,
          surprise: 0.5,
          story: 0.8,
          total: 0.95,
        },
      },
    ];
    let highCount = 0;
    for (let i = 0; i < 40; i++) {
      const picked = selectWeighted(scored, () => i / 40);
      if (picked?.place.id === 'high') highCount++;
    }
    expect(highCount).toBeGreaterThan(20);
  });
});

describe('notification cooldowns', () => {
  const discovery = (over: Partial<DiscoveryState> = {}): DiscoveryState => ({
    status: 'exploring',
    notificationsSentToday: 0,
    notificationsDayKey: new Date().toISOString().slice(0, 10),
    travelMode: 'walking',
    ...over,
  });

  it('detects quiet hours across midnight', () => {
    const date = new Date('2026-05-01T23:30:00');
    expect(
      isQuietHours({ quietHoursStart: 22, quietHoursEnd: 8 }, date)
    ).toBe(true);
    const morning = new Date('2026-05-01T10:00:00');
    expect(
      isQuietHours({ quietHoursStart: 22, quietHoursEnd: 8 }, morning)
    ).toBe(false);
  });

  it('enforces cooldown windows', () => {
    const now = new Date('2026-05-01T12:00:00');
    expect(
      isCooldownActive(
        new Date('2026-05-01T10:00:00').toISOString(),
        180,
        now
      )
    ).toBe(true);
    expect(
      isCooldownActive(
        new Date('2026-05-01T08:00:00').toISOString(),
        180,
        now
      )
    ).toBe(false);
  });

  it('blocks unsolicited notifications when paused or over limit', () => {
    expect(
      canSendUnsolicitedNotification(discovery({ status: 'paused' }), {
        ...prefs,
        explorationEnabled: true,
      }).ok
    ).toBe(false);

    expect(
      canSendUnsolicitedNotification(
        discovery({
          notificationsSentToday: 2,
          notificationsDayKey: '2026-05-01',
        }),
        { ...prefs, maxNotificationsPerDay: 2, notificationFrequency: 'medium' },
        new Date('2026-05-01T12:00:00')
      ).ok
    ).toBe(false);
  });

  it('suppresses duplicate place suggestions within the window', () => {
    const now = new Date('2026-05-10T12:00:00');
    expect(
      wasRecentlySuggested(
        'place-1',
        [{ placeId: 'place-1', at: '2026-05-05T12:00:00.000Z' }],
        7,
        now
      )
    ).toBe(true);
    expect(
      wasRecentlySuggested(
        'place-1',
        [{ placeId: 'place-1', at: '2026-04-01T12:00:00.000Z' }],
        7,
        now
      )
    ).toBe(false);
  });
});

describe('sidequest lifecycle', () => {
  const quest = (status: Sidequest['status']): Sidequest => ({
    id: 'q1',
    placeId: 'p1',
    placeName: 'Test',
    category: 'coffee',
    description: 'd',
    coordinates: ANN_ARBOR_CENTER,
    address: 'a',
    distanceMeters: 200,
    personalizationScore: 0.5,
    storyHook: 'hook',
    suggestedActivity: 'act',
    status,
    whyRecommended: 'why',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it('allows discovered → suggested → accepted → en_route → arrived → completed', () => {
    let q = quest('discovered');
    q = transitionSidequest(q, 'suggested');
    expect(q.status).toBe('suggested');
    expect(q.suggestedAt).toBeTruthy();
    q = transitionSidequest(q, 'accepted');
    q = transitionSidequest(q, 'en_route');
    q = transitionSidequest(q, 'arrived');
    q = transitionSidequest(q, 'completed');
    expect(q.status).toBe('completed');
    expect(q.completedAt).toBeTruthy();
  });

  it('rejects illegal transitions', () => {
    expect(canTransition('completed', 'accepted')).toBe(false);
    expect(() => transitionSidequest(quest('completed'), 'accepted')).toThrow();
  });

  it('supports dismiss and save branches', () => {
    expect(canTransition('suggested', 'dismissed')).toBe(true);
    expect(canTransition('suggested', 'saved')).toBe(true);
    expect(canTransition('saved', 'accepted')).toBe(true);
  });
});
