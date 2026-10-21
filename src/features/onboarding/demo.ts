import type { Place } from '@/types';

const now = new Date().toISOString();

/** The onboarding demo card: a sample place, clearly not a real listing */
export function demoPlace(cityLabel: string, center: { latitude: number; longitude: number }): Place {
  return {
    id: 'onboarding_demo',
    name: 'The Fountain Steps',
    category: 'nature',
    description: `A sample sidequest in ${cityLabel}.`,
    coordinates: center,
    address: cityLabel,
    openingHours: { openNow: true },
    priceLevel: 0,
    source: 'mock',
    tags: ['plaza', 'outdoors'],
    verificationStatus: 'editorial',
    attribution: 'Sidequest onboarding demo',
    createdAt: now,
    updatedAt: now,
  };
}

/** What the demo place turns into once it's a quest */
export const DEMO_ACTIVITY = 'Feed the pigeons';
