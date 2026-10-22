import { router } from 'expo-router';
import type { Coordinates } from '@/types';

export interface NavigationTarget {
  sidequestId: string;
  placeName: string;
  coordinates: Coordinates;
}

/**
 * The entryway to in-app navigation. Every "Get directions" button calls
 * this one function; it opens the walk (src/app/walk.tsx): the route on a
 * paper map, the Live Activity, and the hold to finish when you arrive.
 * The paper-model map (/map) stays for looking around.
 */
export function startNavigation(target: NavigationTarget) {
  router.push({ pathname: '/walk', params: { quest: target.sidequestId } });
}
