import type { Place } from '@/types';

const DEMO = /^\[DEMO\]\s*/;

/** Demo listings are named "[DEMO] Corner Espresso Lab"; Draw shows the name alone */
export const displayName = (name: string) => name.replace(DEMO, '');
export const isDemoPlace = (place: Place) => DEMO.test(place.name);
export const forDisplay = (place: Place): Place => (isDemoPlace(place) ? { ...place, name: displayName(place.name) } : place);
