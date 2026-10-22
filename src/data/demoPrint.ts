import type { Activity, Place } from '@/types';

export const DEMO_PRINT_CITY = 'downtown Ann Arbor';
export const DEMO_PRINT_PLACE: Place = {
  id: 'demo-literati', name: 'Literati Book Store', category: 'bookstores',
  description: 'A downtown Ann Arbor bookstore.',
  coordinates: { latitude: 42.2806, longitude: -83.7485 },
  address: 'Downtown Ann Arbor', source: 'mock',
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};
export const DEMO_PRINT_ACTIVITY: Activity = {
  id: 'demo-literati-synopsis',
  text: "Find your favorite childhood book and reread the first page",
  questTypes: ['focus'], placeTags: ['bookstores'], minParty: 1, maxParty: 20,
  rarity: 'common', durationMin: 10, costTier: 0, indoorOutdoor: 'indoor', source: 'seed',
};
