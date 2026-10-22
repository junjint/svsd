jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { DEMO_CITIES } from '../src/data/demoCities';
import { drawPlace } from '../src/services/draw/engine';
import { activityFitsPlace } from '../src/services/draw/rules';
import { placeService } from '../src/services/places/PlaceService';
import {
  BAND_METERS,
  normaliseActivity,
  placeCoordinates,
  suggestedToday,
  suggestionActivity,
  suggestionPlace,
  userActivitiesFor,
} from '../src/services/suggest/pool';
import { distanceMeters } from '../src/utils/geo';
import type { Suggestion } from '../src/types';

const center = DEMO_CITIES.ann_arbor.center;

const both: Suggestion = {
  id: 'sug_1',
  cityLabel: 'Ann Arbor',
  createdAt: new Date().toISOString(),
  placeName: 'The bench behind the library',
  category: 'study_spots',
  coordinates: placeCoordinates(center, 'walk', 'sug_1'),
  placeId: 'user_sug_1',
  activityText: 'Sit for ten minutes',
  activityId: 'act_user_sug_1',
};

describe('suggestions', () => {
  it('lands a suggested place inside its distance band', () => {
    for (const band of ['here', 'walk', 'town'] as const) {
      for (let i = 0; i < 20; i++) {
        const d = distanceMeters(center, placeCoordinates(center, band, `s${i}`));
        expect(d).toBeGreaterThanOrEqual(BAND_METERS[band][0] - 1);
        expect(d).toBeLessThanOrEqual(BAND_METERS[band][1] + 1);
      }
    }
  });

  it('pairs a suggested activity with the place it came with', () => {
    const place = suggestionPlace(both)!;
    const act = suggestionActivity(both)!;
    expect(place.source).toBe('user');
    expect(activityFitsPlace(act, place)).toBe(true);
  });

  it('lets an activity on its own go anywhere', () => {
    const act = suggestionActivity({ id: 'sug_2', cityLabel: 'Ann Arbor', createdAt: '', activityText: 'Hum', activityId: 'act_user_sug_2' })!;
    expect(act.placeTags).toEqual(['*']);
  });

  it('keeps activities in the city they were suggested in', () => {
    expect(userActivitiesFor([both], 'Ann Arbor')).toHaveLength(1);
    expect(userActivitiesFor([both], 'New York City')).toHaveLength(0);
  });

  it('allows one a day', () => {
    expect(suggestedToday([both])).toBe(both);
    const yesterday = new Date(Date.now() - 26 * 3600 * 1000).toISOString();
    expect(suggestedToday([{ ...both, createdAt: yesterday }])).toBeUndefined();
  });

  it('tidies what people type', () => {
    expect(normaliseActivity('  feed the ducks. ')).toBe('Feed the ducks');
    expect(normaliseActivity('   ')).toBe('');
  });
});

describe('uniform place draw', () => {
  afterAll(() => placeService.setUserPlaces([]));

  it('can land on a suggested place like any other', async () => {
    placeService.setUserPlaces([suggestionPlace(both)!]);
    const q = {
      location: center,
      settings: { questType: 'random' as const, focus: 'any' as const, partySize: 1, radiusMiles: 2 },
      excludePlaceIds: [],
    };
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const p = await drawPlace(q, () => i / 50);
      if (p) seen.add(p.id);
    }
    expect(seen.has('user_sug_1')).toBe(true);
    // a sweep across [0, 1) reaches well past the nearest handful
    expect(seen.size).toBeGreaterThan(20);
  });
});

describe('pin card lines', () => {
  // imported here so the hook file's React import stays out of the suites above
  const { aboutLine } = require('../src/features/map/useMapPlaces') as typeof import('../src/features/map/useMapPlaces');

  it('reads a demo description as a plain line about the place', () => {
    expect(aboutLine('Demo independent bookstore. Small-shelf energy for wandering readers — simulated for demos.')).toBe(
      'An independent bookstore. Small-shelf energy for wandering readers.'
    );
    expect(aboutLine('Demo cultural stop — a public story wall concept for short visits.')).toBe(
      'A cultural stop. A public story wall concept for short visits.'
    );
    expect(aboutLine('Demo taco spot with a short menu on a chalkboard. Not a real listing.')).toBe('A taco spot with a short menu on a chalkboard.');
    expect(aboutLine('The campus art museum on State Street.')).toBe('The campus art museum on State Street.');
  });
});
