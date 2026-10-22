import type { Coordinates } from '@/types';

/** Countries the city picker offers, keyed by ISO 3166 code */
export const COUNTRIES = {
  US: 'United States',
  CA: 'Canada',
  MX: 'Mexico',
  GB: 'United Kingdom',
  FR: 'France',
  JP: 'Japan',
} as const;

export type CountryCode = keyof typeof COUNTRIES;

/**
 * Cities you can pick by hand (and the web prototype's stand-ins for GPS).
 * Ann Arbor and New York have curated demo places; the rest draw from the
 * live places provider once it's on.
 */
export const DEMO_CITIES = {
  ann_arbor: { label: 'Ann Arbor', country: 'US', center: { latitude: 42.2808, longitude: -83.743 } as Coordinates, demoPlaces: true },
  nyc: { label: 'New York City', country: 'US', center: { latitude: 40.7505, longitude: -73.9877 } as Coordinates, demoPlaces: true },
  chicago: { label: 'Chicago', country: 'US', center: { latitude: 41.8837, longitude: -87.6289 } as Coordinates, demoPlaces: false },
  san_francisco: { label: 'San Francisco', country: 'US', center: { latitude: 37.7793, longitude: -122.4193 } as Coordinates, demoPlaces: false },
  toronto: { label: 'Toronto', country: 'CA', center: { latitude: 43.6532, longitude: -79.3832 } as Coordinates, demoPlaces: false },
  montreal: { label: 'Montréal', country: 'CA', center: { latitude: 45.5019, longitude: -73.5674 } as Coordinates, demoPlaces: false },
  mexico_city: { label: 'Mexico City', country: 'MX', center: { latitude: 19.4326, longitude: -99.1332 } as Coordinates, demoPlaces: false },
  london: { label: 'London', country: 'GB', center: { latitude: 51.5072, longitude: -0.1276 } as Coordinates, demoPlaces: false },
  paris: { label: 'Paris', country: 'FR', center: { latitude: 48.8566, longitude: 2.3522 } as Coordinates, demoPlaces: false },
  tokyo: { label: 'Tokyo', country: 'JP', center: { latitude: 35.6762, longitude: 139.6503 } as Coordinates, demoPlaces: false },
} as const satisfies Record<string, { label: string; country: CountryCode; center: Coordinates; demoPlaces: boolean }>;

export type DemoCityKey = keyof typeof DEMO_CITIES;

export const citiesIn = (country: CountryCode) =>
  (Object.keys(DEMO_CITIES) as DemoCityKey[]).filter((k) => DEMO_CITIES[k].country === country);
