import { ANN_ARBOR_DEMO_PLACES } from '@/data/annArborPlaces';
import { distanceMeters } from '@/utils/geo';
import type { Coordinates, InterestCategory, Place } from '@/types';
import type { PlaceProvider, PlaceSearchFilters } from './types';

/**
 * Manually curated destinations (pop-ups, exhibitions, unusual public spaces).
 * Starts with curated demo entries; can be extended via local cache or Supabase.
 */
export class CuratedPlaceProvider implements PlaceProvider {
  readonly name = 'curated';
  private extras: Place[] = [];

  addPlaces(places: Place[]): void {
    this.extras = [...this.extras, ...places];
  }

  private all(): Place[] {
    return [
      ...ANN_ARBOR_DEMO_PLACES.filter((p) => p.source === 'curated'),
      ...this.extras,
    ];
  }

  async searchNearby(
    location: Coordinates,
    radiusMeters: number,
    categories: InterestCategory[],
    filters?: PlaceSearchFilters
  ): Promise<Place[]> {
    const categorySet = categories.length > 0 ? new Set(categories) : null;
    const exclude = new Set(filters?.excludePlaceIds ?? []);
    const now = Date.now();

    return this.all()
      .filter((place) => {
        if (exclude.has(place.id)) return false;
        if (distanceMeters(location, place.coordinates) > radiusMeters) return false;
        if (categorySet && !categorySet.has(place.category)) return false;
        if (place.eventEnd && new Date(place.eventEnd).getTime() < now) return false;
        if (place.eventStart && new Date(place.eventStart).getTime() > now + 2 * 60 * 60 * 1000) {
          return false;
        }
        return true;
      })
      .slice(0, filters?.maxResults ?? 25);
  }

  async getPlaceDetails(placeId: string): Promise<Place | null> {
    return this.all().find((p) => p.id === placeId) ?? null;
  }
}
