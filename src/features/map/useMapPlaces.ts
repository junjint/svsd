import { useEffect, useState } from 'react';
import { displayName } from '@/features/draw/displayName';
import { placeService } from '@/services/places/PlaceService';
import type { Coordinates, DrawnSidequest, InterestCategory, Place } from '@/types';
import { distanceMeters } from '@/utils/geo';

/** How many pins a browse shows. A new handful every time the map opens */
export const BROWSE_PINS = 14;

export interface MapPin {
  id: string;
  name: string;
  category: InterestCategory;
  coordinates: Coordinates;
  distanceMeters: number;
  /** a story hook or the description; never hours, prices or counts */
  line?: string;
  /** suggested by someone here, not a listing */
  byUser: boolean;
}

function shuffle<T>(list: T[]): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** A place's description as a plain line about it, without the demo listings' disclaimers */
export function aboutLine(description: string): string | undefined {
  const line = description
    .replace(/[\s\u2014]*(Not a (real|live venue) listing|Simulated (place|destination)|simulated for demos)\.?$/i, '')
    .replace(/\s+\u2014\s+(\w)/g, (_, c: string) => `. ${c.toUpperCase()}`)
    .replace(/^Demo\s+(\w)/, (_, c: string) => (/[aeiou]/i.test(c) ? 'An ' : 'A ') + c.toLowerCase())
    .replace(/[.\s]+$/, '');
  return line ? `${line}.` : undefined;
}

function toPin(p: Place, from: Coordinates): MapPin {
  const byUser = p.source === 'user';
  return {
    id: p.id,
    name: displayName(p.name),
    category: p.category,
    coordinates: p.coordinates,
    distanceMeters: distanceMeters(from, p.coordinates),
    // the description, never a story hook: hooks say what to do there, and nothing should.
    // A suggestion's description is only "Suggested by a sidequester", which the card says itself
    line: byUser ? undefined : aboutLine(p.description),
    byUser,
  };
}

/**
 * The pins for the map. Navigate shows only the sidequest's place; browse
 * pulls everything in range and keeps a random 14, in shuffled order.
 */
export function useMapPlaces({
  from,
  radiusMeters,
  quest,
}: {
  from: Coordinates;
  radiusMeters: number;
  quest?: DrawnSidequest;
}): { pins: MapPin[]; loading: boolean } {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(!quest);

  useEffect(() => {
    if (quest) {
      setPins([
        {
          id: quest.placeId,
          name: displayName(quest.placeName),
          category: quest.category,
          coordinates: quest.coordinates,
          distanceMeters: distanceMeters(from, quest.coordinates),
          line: quest.storyHook,
          byUser: false,
        },
      ]);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    placeService
      .searchNearby(from, radiusMeters, [], { maxResults: 500 })
      .then((places) => {
        if (!live) return;
        setPins(shuffle(places).slice(0, BROWSE_PINS).map((p) => toPin(p, from)));
      })
      .catch(() => live && setPins([]))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // a fresh draw of pins per open, not per render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quest?.id, from.latitude, from.longitude, radiusMeters]);

  return { pins, loading };
}
