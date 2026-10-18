import type { ImageSourcePropType } from 'react-native';
import type { InterestCategory, SidequestStatus } from '@/types';

/**
 * Picture stickers — transparent PNGs. Only source of color in the UI.
 * Keep the set small; use sparingly.
 */
export type StickerId =
  | 'spark'
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
  | 'journal';

export type StickerSize = 'sm' | 'md' | 'lg';

export const STICKER_SIZE: Record<StickerSize, number> = {
  sm: 18,
  md: 32,
  lg: 72,
};

export const STICKER_IMAGES: Record<StickerId, ImageSourcePropType> = {
  spark: require('../../assets/stickers/spark.png'),
  coffee: require('../../assets/stickers/coffee.png'),
  leaf: require('../../assets/stickers/leaf.png'),
  book: require('../../assets/stickers/book.png'),
  music: require('../../assets/stickers/music.png'),
  art: require('../../assets/stickers/art.png'),
  thrift: require('../../assets/stickers/thrift.png'),
  food: require('../../assets/stickers/food.png'),
  landmark: require('../../assets/stickers/landmark.png'),
  event: require('../../assets/stickers/event.png'),
  study: require('../../assets/stickers/study.png'),
  culture: require('../../assets/stickers/culture.png'),
  surprise: require('../../assets/stickers/surprise.png'),
  map: require('../../assets/stickers/map.png'),
  journal: require('../../assets/stickers/journal.png'),
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
    case 'completed':
      return 'journal';
    case 'arrived':
    case 'en_route':
    case 'accepted':
      return 'map';
    default:
      return 'spark';
  }
}
