import type { Coordinates } from '@/types';

/** Demo cities the web prototype can switch between (no GPS on web) */
export const DEMO_CITIES = {
  ann_arbor: { label: 'Ann Arbor', center: { latitude: 42.2808, longitude: -83.743 } as Coordinates },
  nyc: { label: 'New York City', center: { latitude: 40.7505, longitude: -73.9877 } as Coordinates },
} as const;

export type DemoCityKey = keyof typeof DEMO_CITIES;
