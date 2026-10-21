import { ANN_ARBOR_DEMO_PLACES } from '@/data/annArborPlaces';
import { NYC_DEMO_PLACES } from '@/data/nycPlaces';
import { distanceMeters } from '@/utils/geo';
import type { InterestCategory, Place } from '@/types';
import type { PlaceProvider, PlaceSearchFilters } from './types';
import type { Coordinates } from '@/types';

/** Every demo city's places; the radius filter keeps each draw local */
export const MOCK_PLACES: Place[] = [...ANN_ARBOR_DEMO_PLACES, ...NYC_DEMO_PLACES];

export class MockPlaceProvider implements PlaceProvider {
  readonly name = 'mock';

  async searchNearby(
    location: Coordinates,
    radiusMeters: number,
    categories: InterestCategory[],
    filters?: PlaceSearchFilters
  ): Promise<Place[]> {
    const categorySet =
      categories.length > 0 ? new Set(categories) : null;
    const exclude = new Set(filters?.excludePlaceIds ?? []);

    let results = MOCK_PLACES.filter((place) => {
      if (exclude.has(place.id)) return false;
      const d = distanceMeters(location, place.coordinates);
      if (d > radiusMeters) return false;
      if (categorySet && !categorySet.has(place.category)) {
        // Still allow unexpected for surprise factor later in scoring
        if (place.category !== 'unexpected') return false;
      }
      if (filters?.budget && filters.budget !== 'any') {
        const maxLevel =
          filters.budget === 'free' ? 0 : filters.budget === 'under_10' ? 1 : 2;
        if ((place.priceLevel ?? 3) > maxLevel) return false;
      }
      if (filters?.openNowPreferred && place.openingHours?.openNow === false) {
        return false;
      }
      // Filter expired events
      if (place.eventEnd && new Date(place.eventEnd).getTime() < Date.now()) {
        return false;
      }
      return true;
    });

    results = results
      .map((p) => ({ place: p, d: distanceMeters(location, p.coordinates) }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.place);

    const max = filters?.maxResults ?? 25;
    return results.slice(0, max);
  }

  async getPlaceDetails(placeId: string): Promise<Place | null> {
    return MOCK_PLACES.find((p) => p.id === placeId) ?? null;
  }
}
