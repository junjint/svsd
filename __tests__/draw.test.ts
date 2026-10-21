import { ACTIVITIES } from '../src/data/activities';
import { BADGES, newlyEarned } from '../src/data/badges';
import {
  drawActivities,
  eligibleActivities,
  pickRevealStyles,
  rollRarity,
} from '../src/services/draw/engine';
import { REROLLS_PER_STAGE, travelLabel } from '../src/services/draw/rules';
import type { DrawnSidequest, Place } from '../src/types';

const seq = (...xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length]!;
};

const park: Place = {
  id: 'p_park',
  name: 'Test Park',
  category: 'nature',
  description: '',
  coordinates: { latitude: 0, longitude: 0 },
  address: '',
  source: 'mock',
  tags: ['park'],
  createdAt: '',
  updatedAt: '',
};

describe('rarity', () => {
  it('rolls by the 75/22/3 split', () => {
    expect(rollRarity(() => 0.01)).toBe('legendary');
    expect(rollRarity(() => 0.1)).toBe('rare');
    expect(rollRarity(() => 0.5)).toBe('common');
  });
});

describe('reveal styles', () => {
  it('uses scratch for both stages on ordinary draws', () => {
    expect(pickRevealStyles(1, 'common')).toEqual({ place: 'scratch', activity: 'scratch' });
  });
  it('swaps in a variant every 4th draw and on legendaries', () => {
    const fourth = pickRevealStyles(4, 'common', seq(0.3, 0.9));
    expect(fourth.place === 'scratch' && fourth.activity === 'scratch').toBe(false);
    const legendary = pickRevealStyles(3, 'legendary', seq(0.3, 0.9));
    expect(legendary.place === 'scratch' && legendary.activity === 'scratch').toBe(false);
  });
});

describe('activity pairing', () => {
  it('only offers activities that fit the place, party and type', () => {
    const list = eligibleActivities({ place: park, questType: 'nature', focus: 'any', partySize: 1 });
    expect(list.length).toBeGreaterThan(0);
    for (const a of list) {
      expect(a.questTypes).toContain('nature');
      expect(a.minParty).toBeLessThanOrEqual(1);
    }
  });
  it('respects party size', () => {
    const solo = eligibleActivities({ place: park, questType: 'random', focus: 'any', partySize: 1 });
    expect(solo.every((a) => a.minParty <= 1)).toBe(true);
  });
  it('returns distinct options and never repeats excluded ones', () => {
    const first = drawActivities({ place: park, questType: 'nature', focus: 'any', partySize: 1 }, 'common', 3);
    expect(new Set(first.map((a) => a.id)).size).toBe(first.length);
    const next = drawActivities(
      { place: park, questType: 'nature', focus: 'any', partySize: 1, excludeIds: first.map((a) => a.id) },
      'common',
      3
    );
    expect(next.some((a) => first.find((f) => f.id === a.id))).toBe(false);
  });
  it('every seed activity has well-formed fields', () => {
    for (const a of ACTIVITIES) {
      expect(a.text).not.toMatch(/\.$/);
      expect(a.minParty).toBeLessThanOrEqual(a.maxParty);
      expect(a.placeTags.length).toBeGreaterThan(0);
    }
    expect(new Set(ACTIVITIES.map((a) => a.id)).size).toBe(ACTIVITIES.length);
  });
});

describe('rules', () => {
  it('caps rerolls at two per stage', () => expect(REROLLS_PER_STAGE).toBe(2));
  it('switches from walking to transit past ~1.5 mi', () => {
    expect(travelLabel(800)).toMatch(/walk/);
    expect(travelLabel(4000)).toMatch(/transit/);
  });
});

describe('badges', () => {
  const quest = (over: Partial<DrawnSidequest> = {}) =>
    ({ partySize: 1, rarity: 'common', rerollsUsed: { place: 0, activity: 0 }, cityLabel: 'A', questType: 'nature', ...over }) as DrawnSidequest;
  it('awards First Sidequest and No Rerolls on the first clean completion', () => {
    const got = newlyEarned({ completed: [quest()], approvedSuggestions: 0 }, []);
    expect(got).toEqual(expect.arrayContaining(['first_sidequest', 'no_rerolls']));
  });
  it('never re-awards an owned badge', () => {
    expect(newlyEarned({ completed: [quest()], approvedSuggestions: 0 }, BADGES.map((b) => b.id))).toEqual([]);
  });
});
