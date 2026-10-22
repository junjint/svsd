import { router } from 'expo-router';
import type { Coordinates } from '@/types';

export interface NavigationTarget {
  sidequestId: string;
  placeName: string;
  coordinates: Coordinates;
}

/** Open the browser walking demo for an existing Sidequest. No external map handoff. */
export function startNavigation(target: NavigationTarget) {
  router.push({ pathname: '/walk', params: { quest: target.sidequestId } });
}
