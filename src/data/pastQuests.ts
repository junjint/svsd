import { ACTIVITIES } from '@/data/activities';
import { MOCK_PLACES } from '@/services/places/MockPlaceProvider';
import { buildDrawnQuest } from '@/services/draw/engine';
import type { DrawnSidequest, Mood, QuestFolder, QuestType, Rarity } from '@/types';

/**
 * A starter library of sidequests that already happened, so Folders has
 * something to open on a fresh demo install. Photos are Unsplash images
 * (free licence), loaded by URL rather than bundled.
 */

const photo = (id: string) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`;

interface Seed {
  key: string;
  placeId: string;
  activityId: string;
  city: string;
  questType: Exclude<QuestType, 'random'>;
  party: number;
  rarity: Rarity;
  daysAgo: number;
  photos: string[];
  note?: string;
  mood?: Mood;
  rating?: number;
}

const SEEDS: Seed[] = [
  {
    key: 'pigeons',
    placeId: 'nyc_herald_square',
    activityId: 'act_pigeons',
    city: 'New York City',
    questType: 'nature',
    party: 1,
    rarity: 'common',
    daysAgo: 2,
    photos: ['photo-1518157770830-df40b281672e', 'photo-1572403273897-afdaa33405e2', 'photo-1604082668028-1373f1071a07', 'photo-1675188321761-a76342a842c7', 'photo-1618753032450-91298b72a9e0'],
    note: 'one of them followed me for a full block. his name is gerald now',
    mood: 'surprised',
    rating: 5,
  },
  {
    key: 'leaves',
    placeId: 'aa_nichols_arb',
    activityId: 'act_leaf_bookmarks',
    city: 'Ann Arbor',
    questType: 'nature',
    party: 1,
    rarity: 'common',
    daysAgo: 5,
    photos: ['photo-1506193503569-d57d2a678510', 'photo-1459478309853-2c33a60058e7', 'photo-1760883956955-31d8adb4e6d9', 'photo-1757398313132-6a1a061adb2c', 'photo-1429198739803-7db875882052', 'photo-1453959022778-cfda85dbe0f9'],
    note: 'pressed seven in my econ textbook. finally a use for it',
    mood: 'calm',
    rating: 5,
  },
  {
    key: 'pastries',
    placeId: 'mock_nyc_bakery',
    activityId: 'act_pastry_rating',
    city: 'New York City',
    questType: 'snack',
    party: 2,
    rarity: 'common',
    daysAgo: 8,
    photos: ['photo-1534432182912-63863115e106', 'photo-1713152752939-07f9975301ea', 'photo-1643944471768-2d2eac3afb6d', 'photo-1599125816289-736f5025fc05'],
    note: 'cardamom bun 9.5, croissant 8, the mystery one 4 (sorry)',
    mood: 'energized',
    rating: 4,
  },
  {
    key: 'sunset',
    placeId: 'nyc_high_line',
    activityId: 'act_sunset_picnic',
    city: 'New York City',
    questType: 'nature',
    party: 2,
    rarity: 'legendary',
    daysAgo: 11,
    photos: ['photo-1590166774851-bc49b23a18fe', 'photo-1570378036436-e738b3ab3ccb', 'photo-1631116615621-0ef6e1991afd', 'photo-1604251163789-4b8f70807273', 'photo-1560278997-c46ec792c2bd'],
    note: 'grapes, cheese, one sad clementine. sky did the rest',
    mood: 'inspired',
    rating: 5,
  },
  {
    key: 'stones',
    placeId: 'aa_gallup_park',
    activityId: 'act_skip_stones',
    city: 'Ann Arbor',
    questType: 'nature',
    party: 3,
    rarity: 'rare',
    daysAgo: 14,
    photos: ['photo-1609511394000-2a5c8927e113', 'photo-1637016372514-a0495c33fcd4', 'photo-1673024918778-f80e98b90366', 'photo-1732672205358-c16ab5749e19'],
    note: 'record: 6 bounces. disputed.',
    mood: 'energized',
    rating: 4,
  },
  {
    key: 'mural',
    placeId: 'aa_graffiti_alley',
    activityId: 'act_mural_title',
    city: 'Ann Arbor',
    questType: 'focus',
    party: 1,
    rarity: 'common',
    daysAgo: 17,
    photos: ['photo-1582137696617-4031a8e3e268', 'photo-1530406831759-15c5c0cbce8b', 'photo-1521684497690-b384ea6d0a85', 'photo-1580836727752-057f404cf5bd', 'photo-1618518094584-8f14d0c6cd93'],
    note: '“the raccoon who knew too much”',
    mood: 'curious',
    rating: 4,
  },
  {
    key: 'bench',
    placeId: 'nyc_bryant_park',
    activityId: 'act_bench_pages',
    city: 'New York City',
    questType: 'focus',
    party: 1,
    rarity: 'common',
    daysAgo: 20,
    photos: ['photo-1761530622107-d7675f0f1694', 'photo-1786211167357-36263c131f2d', 'photo-1759662280683-520528fb4c5a', 'photo-1779119550121-8923c1a70ec4'],
    mood: 'calm',
    rating: 4,
  },
  {
    key: 'stalls',
    placeId: 'mock_nyc_food_hall',
    activityId: 'act_stall_hop',
    city: 'New York City',
    questType: 'meal',
    party: 3,
    rarity: 'common',
    daysAgo: 24,
    photos: ['photo-1774127421469-1bc575001f9c', 'photo-1765242361225-b964d8ca7531', 'photo-1776870175211-3421678015b7', 'photo-1775831954564-7a0154167f8d'],
    note: 'dumplings > tacos > the weird foam thing',
    mood: 'energized',
    rating: 5,
  },
  {
    key: 'library',
    placeId: 'aa_hatcher',
    activityId: 'act_first_line',
    city: 'Ann Arbor',
    questType: 'focus',
    party: 1,
    rarity: 'common',
    daysAgo: 29,
    photos: ['photo-1683178861337-ca70ef8c0db3', 'photo-1603058817990-2b9a9abbce86', 'photo-1700308234428-c619d7408fbd', 'photo-1494809610410-160faaed4de0'],
    note: 'best first line: “Call me Ishmael.” classic for a reason',
    mood: 'reflective',
    rating: 5,
  },
  {
    key: 'dogs',
    placeId: 'nyc_washington_square',
    activityId: 'act_dog_vibes',
    city: 'New York City',
    questType: 'nature',
    party: 2,
    rarity: 'common',
    daysAgo: 33,
    photos: ['photo-1667230228326-c881966e2a29', 'photo-1596653048881-dc30d5b20b00', 'photo-1703733572989-026dbaf7fc96', 'photo-1619333774340-3a878585c2e4', 'photo-1676564587904-0b29ce94d2c1'],
    note: 'every dog was a 10. the corgi was an 11',
    mood: 'surprised',
    rating: 5,
  },
  {
    key: 'records',
    placeId: 'mock_aa_records',
    activityId: 'act_cover_record',
    city: 'Ann Arbor',
    questType: 'focus',
    party: 1,
    rarity: 'rare',
    daysAgo: 38,
    photos: ['photo-1544734268-37a548d914e1', 'photo-1582751836565-74f64cc184cb', 'photo-1727044114229-adcc53e4b3f1', 'photo-1543940610-e7e6c111ea10'],
    note: 'judged it by the cover. the cover was right',
    mood: 'curious',
    rating: 4,
  },
  {
    key: 'station',
    placeId: 'nyc_grand_central',
    activityId: 'act_station_people',
    city: 'New York City',
    questType: 'focus',
    party: 1,
    rarity: 'common',
    daysAgo: 44,
    photos: ['photo-1501503125584-bb1da5f56d48', 'photo-1781972431659-e728d1f975bc', 'photo-1712493706502-8f79580c949f', 'photo-1536411230469-735ecf56de5d'],
    mood: 'reflective',
    rating: 4,
  },
];

/** "[DEMO] Garment District Bakery" → "Garment District Bakery" */
const clean = (name: string) => name.replace(/^\[[^\]]*\]\s*/, '');

export function buildPastQuests(now = Date.now()): { quests: DrawnSidequest[]; folders: QuestFolder[] } {
  const quests: DrawnSidequest[] = [];
  const folders: QuestFolder[] = [];
  for (const s of SEEDS) {
    const place = MOCK_PLACES.find((p) => p.id === s.placeId);
    const activity = ACTIVITIES.find((a) => a.id === s.activityId);
    if (!place || !activity) continue;
    const at = new Date(now - s.daysAgo * 86400000 - 3 * 3600000).toISOString();
    const placeName = clean(place.name);
    const built = buildDrawnQuest({
      place: { ...place, name: placeName },
      activity,
      location: place.coordinates,
      settings: { questType: s.questType, focus: 'any', partySize: s.party, radiusMiles: 2 },
      rarity: s.rarity,
      revealStyle: { place: 'scratch', activity: 'scratch' },
      rerollsUsed: { place: 0, activity: 0 },
      cityLabel: s.city,
    });
    const id = `seed_quest_${s.key}`;
    const quest: DrawnSidequest = {
      ...built,
      id,
      distanceMeters: 300 + ((s.key.length * 137) % 1400),
      status: 'completed',
      createdAt: at,
      suggestedAt: at,
      acceptedAt: at,
      completedAt: at,
      updatedAt: at,
    };
    quests.push(quest);
    folders.push({
      id: `seed_folder_${s.key}`,
      kind: 'quest',
      sidequestId: id,
      title: quest.activityText,
      subtitle: placeName,
      photos: s.photos.map((p, i) => ({ id: `seed_photo_${s.key}_${i}`, uri: photo(p), addedAt: at })),
      note: s.note,
      mood: s.mood,
      rating: s.rating,
      savedToGallery: s.rating === 5,
      postedToWall: false,
      createdBy: 'completion',
      createdAt: at,
      updatedAt: at,
    });
  }
  return { quests, folders };
}
