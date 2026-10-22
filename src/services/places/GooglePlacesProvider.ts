import type { Coordinates, InterestCategory, Place } from '@/types';
import type { PlaceProvider, PlaceSearchFilters } from './types';
import { createId } from '@/utils/id';

const CATEGORY_TO_GOOGLE_TYPES: Record<InterestCategory, string[]> = {
  coffee: ['cafe', 'coffee_shop'],
  nature: ['park', 'hiking_area'],
  bookstores: ['book_store'],
  live_music: ['night_club', 'performing_arts_theater'],
  art: ['art_gallery', 'museum'],
  thrifting: ['clothing_store', 'store'],
  local_food: ['restaurant', 'meal_takeaway'],
  architecture: ['tourist_attraction', 'historical_landmark'],
  community_events: ['community_center', 'event_venue'],
  study_spots: ['library', 'cafe'],
  cultural: ['museum', 'cultural_center'],
  unexpected: ['tourist_attraction'],
};

/**
 * Google Places API (New) provider.
 * Calls a protected backend endpoint so the API key never ships in the client.
 * Falls back gracefully when backend URL / credentials are missing.
 */
export class GooglePlacesProvider implements PlaceProvider {
  readonly name = 'google';
  private cache = new Map<string, { places: Place[]; fetchedAt: number }>();
  private cacheTtlMs = 10 * 60 * 1000;

  constructor(private backendUrl?: string) {
    this.backendUrl =
      backendUrl ?? process.env.EXPO_PUBLIC_PLACES_BACKEND_URL ?? undefined;
  }

  isConfigured(): boolean {
    return Boolean(this.backendUrl);
  }

  async searchNearby(
    location: Coordinates,
    radiusMeters: number,
    categories: InterestCategory[],
    filters?: PlaceSearchFilters
  ): Promise<Place[]> {
    if (!this.backendUrl) {
      console.warn(
        '[GooglePlacesProvider] EXPO_PUBLIC_PLACES_BACKEND_URL not set — returning empty results.'
      );
      return [];
    }

    const cacheKey = `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}:${radiusMeters}:${categories.sort().join(',')}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < this.cacheTtlMs) {
      return this.applyFilters(cached.places, filters);
    }

    try {
      const includedTypes = categories.flatMap(
        (c) => CATEGORY_TO_GOOGLE_TYPES[c] ?? []
      );

      const response = await fetch(`${this.backendUrl}/places/nearby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          radiusMeters,
          includedTypes,
          maxResultCount: Math.min(filters?.maxResults ?? 20, 20),
        }),
      });

      if (!response.ok) {
        throw new Error(`Places backend error: ${response.status}`);
      }

      const data = (await response.json()) as { places?: unknown[] };
      const places = (data.places ?? []).map((raw) =>
        normalizeGooglePlace(raw as GooglePlaceRaw)
      );

      this.cache.set(cacheKey, { places, fetchedAt: Date.now() });
      return this.applyFilters(places, filters);
    } catch (error) {
      console.warn('[GooglePlacesProvider] search failed:', error);
      return [];
    }
  }

  private applyFilters(places: Place[], filters?: PlaceSearchFilters): Place[] {
    const exclude = new Set(filters?.excludePlaceIds ?? []);
    return places.filter((p) => !exclude.has(p.id) && !exclude.has(p.providerPlaceId ?? ''));
  }
}

interface GooglePlaceRaw {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  priceLevel?: string;
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  editorialSummary?: { text?: string };
  attribution?: string;
}

function mapGoogleTypeToCategory(types: string[] = []): InterestCategory {
  const joined = types.join(' ').toLowerCase();
  if (joined.includes('cafe') || joined.includes('coffee')) return 'coffee';
  if (joined.includes('park') || joined.includes('hiking')) return 'nature';
  if (joined.includes('book')) return 'bookstores';
  if (joined.includes('art') || joined.includes('museum')) return 'art';
  if (joined.includes('restaurant') || joined.includes('food')) return 'local_food';
  if (joined.includes('library')) return 'study_spots';
  if (joined.includes('night') || joined.includes('theater')) return 'live_music';
  return 'unexpected';
}

function normalizeGooglePlace(raw: GooglePlaceRaw): Place {
  const now = new Date().toISOString();
  const category = mapGoogleTypeToCategory(raw.types);
  const name = raw.displayName?.text ?? 'Unknown place';
  return {
    id: raw.id ? `google_${raw.id}` : createId('google'),
    providerPlaceId: raw.id,
    name,
    category,
    description:
      raw.editorialSummary?.text ??
      `A nearby place discovered via Google Places (${category}).`,
    coordinates: {
      latitude: raw.location?.latitude ?? 0,
      longitude: raw.location?.longitude ?? 0,
    },
    address: raw.formattedAddress ?? '',
    openingHours: raw.currentOpeningHours
      ? {
          openNow: raw.currentOpeningHours.openNow,
          weekdayText: raw.currentOpeningHours.weekdayDescriptions,
        }
      : undefined,
    priceLevel: mapPriceLevel(raw.priceLevel),
    source: 'google',
    attribution: raw.attribution ?? 'Google Places',
    verificationStatus: 'verified',
    createdAt: now,
    updatedAt: now,
  };
}

function mapPriceLevel(
  level?: string
): 0 | 1 | 2 | 3 | undefined {
  switch (level) {
    case 'PRICE_LEVEL_FREE':
      return 0;
    case 'PRICE_LEVEL_INEXPENSIVE':
      return 1;
    case 'PRICE_LEVEL_MODERATE':
      return 2;
    case 'PRICE_LEVEL_EXPENSIVE':
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return 3;
    default:
      return undefined;
  }
}
