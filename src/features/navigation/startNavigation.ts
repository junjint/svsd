import { showToast } from '@/ui';
import type { Coordinates } from '@/types';

export interface NavigationTarget {
  sidequestId: string;
  placeName: string;
  coordinates: Coordinates;
}

/**
 * The entryway to in-app navigation (the Google Maps flow).
 *
 * MERGE POINT: the navigation flow is prototyped separately. When it
 * lands, replace this body with its entry (e.g. a router.push to its
 * screen, passing `target`). Every "Get directions" button calls this
 * one function, so nothing else needs to change.
 */
export function startNavigation(target: NavigationTarget) {
  showToast('Directions are coming soon');
}
