import type { Coordinates, InterestCategory, Place, UserPreferences } from '@/types';

export interface PlaceSearchFilters {
  categories?: InterestCategory[];
  budget?: UserPreferences['budget'];
  openNowPreferred?: boolean;
  excludePlaceIds?: string[];
  maxResults?: number;
}

export interface PlaceProvider {
  readonly name: string;
  searchNearby(
    location: Coordinates,
    radiusMeters: number,
    categories: InterestCategory[],
    filters?: PlaceSearchFilters
  ): Promise<Place[]>;
  getPlaceDetails?(placeId: string): Promise<Place | null>;
}
