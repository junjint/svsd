import type { Coordinates, InterestCategory, Place } from '@/types';
import { storage } from '@/services/persistence/storage';
import type { CachedPlaces } from '@/types';
import { CuratedPlaceProvider } from './CuratedPlaceProvider';
import { GooglePlacesProvider } from './GooglePlacesProvider';
import { MockPlaceProvider } from './MockPlaceProvider';
import { UserPlaceProvider } from './UserPlaceProvider';
import type { PlaceProvider, PlaceSearchFilters } from './types';

export type ProviderMode = 'mock' | 'google' | 'curated' | 'composite';

/**
 * Modular facade over place providers with local caching.
 */
export class PlaceService {
  private mock = new MockPlaceProvider();
  private curated = new CuratedPlaceProvider();
  private google = new GooglePlacesProvider();
  private user = new UserPlaceProvider();
  private mode: ProviderMode;

  constructor(mode?: ProviderMode) {
    this.mode =
      mode ??
      ((process.env.EXPO_PUBLIC_PLACE_PROVIDER as ProviderMode) || 'mock');
  }

  setMode(mode: ProviderMode): void {
    this.mode = mode;
  }

  getMode(): ProviderMode {
    return this.mode;
  }

  /** Suggestions from people in the pool; they join every provider mode */
  setUserPlaces(places: Place[]): void {
    this.user.setPlaces(places);
  }

  private providers(): PlaceProvider[] {
    return [...this.base(), this.user];
  }

  private base(): PlaceProvider[] {
    switch (this.mode) {
      case 'google':
        return this.google.isConfigured()
          ? [this.google, this.curated]
          : [this.mock, this.curated];
      case 'curated':
        return [this.curated];
      case 'composite':
        return this.google.isConfigured()
          ? [this.mock, this.curated, this.google]
          : [this.mock, this.curated];
      case 'mock':
      default:
        return [this.mock, this.curated];
    }
  }

  async searchNearby(
    location: Coordinates,
    radiusMeters: number,
    categories: InterestCategory[],
    filters?: PlaceSearchFilters
  ): Promise<Place[]> {
    const results = await Promise.all(
      this.providers().map((p) =>
        p.searchNearby(location, radiusMeters, categories, filters)
      )
    );

    const merged = dedupeById(results.flat());
    await this.cachePlaces(merged, location, radiusMeters);
    return merged;
  }

  async getCachedNearby(
    location: Coordinates,
    maxAgeMs = 15 * 60 * 1000
  ): Promise<Place[] | null> {
    const cached = await storage.getJson<CachedPlaces>('cachedPlaces');
    if (!cached) return null;
    if (Date.now() - new Date(cached.fetchedAt).getTime() > maxAgeMs) return null;
    return cached.places;
  }

  private async cachePlaces(
    places: Place[],
    center: Coordinates,
    radiusMeters: number
  ): Promise<void> {
    const payload: CachedPlaces = {
      places,
      fetchedAt: new Date().toISOString(),
      center,
      radiusMeters,
    };
    await storage.setJson('cachedPlaces', payload);
  }
}

function dedupeById(places: Place[]): Place[] {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const p of places) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

export const placeService = new PlaceService();
