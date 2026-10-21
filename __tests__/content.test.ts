import { ACTIVITIES } from '../src/data/activities';
import { ANN_ARBOR_DEMO_PLACES } from '../src/data/annArborPlaces';
import { DEMO_CITIES } from '../src/data/demoCities';
import { NYC_DEMO_PLACES } from '../src/data/nycPlaces';
import { eligibleActivities } from '../src/services/draw/engine';
import { MILE_IN_METERS, QUEST_TYPE_CATEGORIES, placeWords } from '../src/services/draw/rules';
import { MOCK_PLACES, MockPlaceProvider } from '../src/services/places/MockPlaceProvider';
import { distanceMeters } from '../src/utils/geo';
import type { FocusSetting, Place, QuestType } from '../src/types';

const QUEST_TYPES: QuestType[] = ['meal', 'snack', 'nature', 'focus', 'random'];
const CITIES = [
  { key: 'ann_arbor', places: ANN_ARBOR_DEMO_PLACES },
  { key: 'nyc', places: NYC_DEMO_PLACES },
] as const;
const ALL_PLACES: Place[] = [...ANN_ARBOR_DEMO_PLACES, ...NYC_DEMO_PLACES];

const copyOf = (a: (typeof ACTIVITIES)[number]) => [a.text, ...(a.groupText ? [a.groupText] : [])];

describe('activity library', () => {
  it('is big enough to keep the draw fresh', () => {
    expect(ACTIVITIES.length).toBeGreaterThanOrEqual(140);
  });

  it('has unique ids', () => {
    expect(new Set(ACTIVITIES.map((a) => a.id)).size).toBe(ACTIVITIES.length);
  });

  it('follows the copy rules: sentence case, no end punctuation, ≤ 60 chars', () => {
    for (const a of ACTIVITIES) {
      for (const t of copyOf(a)) {
        expect(t).toBe(t.trim());
        expect(t).not.toMatch(/[.!]$/);
        expect(t).not.toMatch(/ {2}/);
        expect(t[0]).toBe(t[0]!.toUpperCase());
        if (t.length > 60) throw new Error(`Too long (${t.length}): ${t}`);
      }
    }
  });

  it('has sane numbers', () => {
    for (const a of ACTIVITIES) {
      expect(a.durationMin).toBeGreaterThanOrEqual(10);
      expect(a.durationMin).toBeLessThanOrEqual(180);
      expect(a.minParty).toBeGreaterThanOrEqual(1);
      expect(a.minParty).toBeLessThanOrEqual(a.maxParty);
      expect(a.questTypes.length).toBeGreaterThan(0);
      expect(a.placeTags.length).toBeGreaterThan(0);
    }
  });

  it('keeps costs mostly free or cheap', () => {
    const cheap = ACTIVITIES.filter((a) => a.costTier <= 1).length;
    expect(cheap / ACTIVITIES.length).toBeGreaterThanOrEqual(0.85);
  });

  it('splits rarity roughly 75 / 20 / 5', () => {
    const share = (r: string) => ACTIVITIES.filter((a) => a.rarity === r).length / ACTIVITIES.length;
    expect(share('common')).toBeGreaterThanOrEqual(0.68);
    expect(share('common')).toBeLessThanOrEqual(0.82);
    expect(share('rare')).toBeGreaterThanOrEqual(0.15);
    expect(share('rare')).toBeLessThanOrEqual(0.27);
    expect(share('legendary')).toBeGreaterThanOrEqual(0.03);
    expect(share('legendary')).toBeLessThanOrEqual(0.08);
  });

  it('covers every quest type, focus both indoors and out', () => {
    for (const t of ['meal', 'snack', 'nature', 'focus'] as const) {
      expect(ACTIVITIES.filter((a) => a.questTypes.includes(t)).length).toBeGreaterThanOrEqual(25);
    }
    const focus = ACTIVITIES.filter((a) => a.questTypes.includes('focus'));
    expect(focus.filter((a) => a.indoorOutdoor === 'indoor').length).toBeGreaterThanOrEqual(15);
    expect(focus.filter((a) => a.indoorOutdoor === 'outdoor').length).toBeGreaterThanOrEqual(15);
  });

  it('has plenty for groups', () => {
    expect(ACTIVITIES.filter((a) => a.groupText).length).toBeGreaterThanOrEqual(30);
    expect(ACTIVITIES.filter((a) => a.minParty >= 2).length).toBeGreaterThanOrEqual(5);
  });

  it('only uses place tags that some place actually has', () => {
    const words = new Set(ALL_PLACES.flatMap((p) => [...placeWords(p)]));
    const unknown = ACTIVITIES.flatMap((a) => a.placeTags.filter((t) => t !== '*' && !words.has(t)).map((t) => `${a.id}:${t}`));
    expect(unknown).toEqual([]);
  });
});

describe('demo places', () => {
  it('has unique ids across cities', () => {
    expect(new Set(ALL_PLACES.map((p) => p.id)).size).toBe(ALL_PLACES.length);
  });

  it.each(CITIES)('$key has ~30 well-formed places near the centre', ({ key, places }) => {
    const center = DEMO_CITIES[key].center;
    expect(places.length).toBeGreaterThanOrEqual(28);
    for (const p of places) {
      expect(p.tags?.length).toBeGreaterThan(0);
      expect(p.photoUrl).toBeUndefined();
      expect(distanceMeters(center, p.coordinates) / MILE_IN_METERS).toBeLessThanOrEqual(10);
      // Made-up businesses must say so
      if (p.id.startsWith('mock_') || p.id.startsWith('curated_')) expect(p.name).toMatch(/^\[(CURATED )?DEMO\]/);
    }
    expect(places.filter((p) => p.openingHours?.openNow !== false).length / places.length).toBeGreaterThanOrEqual(0.8);
  });

  it.each(CITIES)('$key has at least 3 places for each quest type', ({ places }) => {
    for (const cats of Object.values(QUEST_TYPE_CATEGORIES)) {
      expect(places.filter((p) => cats.includes(p.category)).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("includes the spec's Herald Square", () => {
    expect(NYC_DEMO_PLACES.some((p) => p.name === 'Herald Square')).toBe(true);
  });
});

describe('every place yields options', () => {
  const cases = ALL_PLACES.flatMap((place) =>
    QUEST_TYPES.flatMap((questType) => {
      const focuses: FocusSetting[] = questType === 'focus' ? ['any', 'indoor', 'outdoor'] : ['any'];
      return focuses.flatMap((focus) => [1, 3].map((partySize) => ({ place, questType, focus, partySize })));
    })
  );

  it('at least 3 eligible activities for every place × quest type × party 1 and 3', () => {
    const thin = cases
      .map((c) => ({ ...c, n: eligibleActivities(c).length }))
      .filter((c) => c.n < 3)
      .map((c) => `${c.place.id} ${c.questType}/${c.focus} party ${c.partySize}: ${c.n}`);
    expect(thin).toEqual([]);
  });
});

describe('MockPlaceProvider', () => {
  const provider = new MockPlaceProvider();

  it('serves both cities from one pool', () => {
    expect(MOCK_PLACES.length).toBe(ALL_PLACES.length);
  });

  it.each(CITIES)('keeps a 5 mi search in $key local', async ({ key, places }) => {
    const ids = new Set(places.map((p) => p.id));
    const found = await provider.searchNearby(DEMO_CITIES[key].center, 5 * MILE_IN_METERS, [], { maxResults: 100 });
    expect(found.length).toBeGreaterThan(10);
    expect(found.every((p) => ids.has(p.id))).toBe(true);
  });

  it('finds Herald Square for a nature draw near Herald Square', async () => {
    const found = await provider.searchNearby(DEMO_CITIES.nyc.center, 0.5 * MILE_IN_METERS, QUEST_TYPE_CATEGORIES.nature);
    expect(found.map((p) => p.id)).toContain('nyc_herald_square');
  });
});
