import type { Coordinates } from '@/types';

const EARTH_RADIUS_M = 6371000;

/** Haversine distance in meters */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Rough walking time assuming ~80 m/min (~4.8 km/h) */
export function estimateWalkingMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 80));
}

export function isWithinRadius(
  origin: Coordinates,
  target: Coordinates,
  minMeters: number,
  maxMeters: number
): boolean {
  const d = distanceMeters(origin, target);
  return d >= minMeters && d <= maxMeters;
}

/** Offset a coordinate by meters north/east — useful for demo simulation */
export function offsetCoordinates(
  origin: Coordinates,
  northMeters: number,
  eastMeters: number
): Coordinates {
  const dLat = northMeters / EARTH_RADIUS_M;
  const dLon = eastMeters / (EARTH_RADIUS_M * Math.cos((origin.latitude * Math.PI) / 180));
  return {
    latitude: origin.latitude + (dLat * 180) / Math.PI,
    longitude: origin.longitude + (dLon * 180) / Math.PI,
  };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
