import { router } from 'expo-router';
import type { Coordinates } from '@/types';

export interface NavigationTarget {
  sidequestId: string;
  placeName: string;
  coordinates: Coordinates;
}

/**
 * The entryway to in-app navigation. Every "Get directions" button calls
 * this one function; it opens the paper-model map (src/app/map.tsx) in
 * navigate mode, which finds you, draws the walk and offers a real maps
 * app from its card.
 */
export function startNavigation(target: NavigationTarget) {
  router.push({ pathname: '/map', params: { sidequestId: target.sidequestId } });
}
