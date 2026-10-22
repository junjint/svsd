import { distanceMeters } from '@/utils/geo';
import type { Coordinates, InterestCategory, Place } from '@/types';
import type { PlaceProvider, PlaceSearchFilters } from './types';

/**
 * Places people suggested for their city's pool. The store hands them in
 * on hydrate and after each suggestion; they're searched like any other.
 */
export class UserPlaceProvider implements PlaceProvider {
  readonly name = 'user';
  private places: Place[] = [];

  setPlaces(places: Place[]): void {
    this.places = places;
  }

  async searchNearby(
    location: Coordinates,
    radiusMeters: number,
    categories: InterestCategory[],
    filters?: PlaceSearchFilters
  ): Promise<Place[]> {
    const categorySet = categories.length > 0 ? new Set(categories) : null;
    const exclude = new Set(filters?.excludePlaceIds ?? []);
    return this.places.filter((place) => {
      if (exclude.has(place.id)) return false;
      if (distanceMeters(location, place.coordinates) > radiusMeters) return false;
      // like the mock provider, "something else" slips through any filter
      if (categorySet && !categorySet.has(place.category) && place.category !== 'unexpected') return false;
      return true;
    });
  }

  async getPlaceDetails(placeId: string): Promise<Place | null> {
    return this.places.find((p) => p.id === placeId) ?? null;
  }
}
