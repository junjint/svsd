import type { Activity, Place, Rarity } from '@/types';
import type { PlaceCardData } from '@/bencho/dom/revealParts';

/** The foil that shows the draw's rarity before you scratch (SPEC §2.2) */
export const foilFor = (r: Rarity) => (r === 'legendary' ? 'gold' : r === 'rare' ? 'holo' : 'silver');

/** The store resolved which activity fits; the copy follows the party */
export const activityText = (a: Activity, partySize: number) => (partySize > 1 && a.groupText ? a.groupText : a.text);

const COST = ['Free', '$', '$$', '$$$'] as const;

export function placeCard(place: Place, cityLabel: string, distanceLabel: string, rarity: Rarity): PlaceCardData {
  const meta = [place.openingHours?.openNow ? 'Open now' : null, place.priceLevel != null ? COST[place.priceLevel] : null]
    .filter(Boolean)
    .join(' · ');
  return { city: cityLabel, name: place.name, distance: distanceLabel, meta: meta || undefined, photoUrl: place.photoUrl, rarity };
}
