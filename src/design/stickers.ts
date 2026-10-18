import type { InterestCategory, SidequestStatus } from '@/types';

/**
 * Picture stickers are the ONLY source of color in the UI.
 * They read as small 3D / photoreal objects trailing or leading type —
 * never as flat brand glyphs or tinted chrome.
 */
export type StickerId =
  | 'spark'
  | 'compass'
  | 'coffee'
  | 'leaf'
  | 'book'
  | 'music'
  | 'art'
  | 'thrift'
  | 'food'
  | 'landmark'
  | 'event'
  | 'study'
  | 'culture'
  | 'surprise'
  | 'map'
  | 'journal'
  | 'bell'
  | 'pause'
  | 'walk'
  | 'arrive'
  | 'key'
  | 'pencil'
  | 'seed'
  | 'coral'
  | 'orb'
  | 'croissant'
  | 'banana'
  | 'candy';

export type StickerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const STICKER_SIZE: Record<StickerSize, number> = {
  xs: 14,
  sm: 20,
  md: 28,
  lg: 40,
  xl: 56,
};

/** High-fidelity emoji stand in for 3D sticker assets (swap for PNGs later). */
export const STICKERS: Record<StickerId, string> = {
  spark: '✨',
  compass: '🧭',
  coffee: '☕️',
  leaf: '🌿',
  book: '📖',
  music: '🎧',
  art: '🎨',
  thrift: '🧺',
  food: '🍜',
  landmark: '🏛️',
  event: '🎪',
  study: '📚',
  culture: '🎭',
  surprise: '🎲',
  map: '🗺️',
  journal: '📓',
  bell: '🔔',
  pause: '🫧',
  walk: '👟',
  arrive: '📍',
  key: '⌨️',
  pencil: '✏️',
  seed: '🌱',
  coral: '🪸',
  orb: '🔮',
  croissant: '🥐',
  banana: '🍌',
  candy: '🍬',
};

export const CATEGORY_STICKER: Record<InterestCategory, StickerId> = {
  coffee: 'coffee',
  nature: 'leaf',
  bookstores: 'book',
  live_music: 'music',
  art: 'art',
  thrifting: 'thrift',
  local_food: 'food',
  architecture: 'landmark',
  community_events: 'event',
  study_spots: 'study',
  cultural: 'culture',
  unexpected: 'surprise',
};

export function stickerForCategory(category: InterestCategory): StickerId {
  return CATEGORY_STICKER[category];
}

export function stickerForStatus(status: SidequestStatus): StickerId {
  switch (status) {
    case 'suggested':
    case 'discovered':
      return 'spark';
    case 'accepted':
    case 'en_route':
      return 'walk';
    case 'arrived':
      return 'arrive';
    case 'completed':
      return 'journal';
    case 'saved':
      return 'book';
    case 'dismissed':
    case 'abandoned':
    case 'expired':
      return 'pause';
    default:
      return 'compass';
  }
}

/** Decorative stickers for editorial punctuation (not category-bound). */
export const DECOR_STICKERS: StickerId[] = [
  'spark',
  'orb',
  'croissant',
  'banana',
  'candy',
  'coral',
  'seed',
  'pencil',
  'key',
];
