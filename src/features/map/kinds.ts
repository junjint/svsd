import type { InterestCategory } from '@/types';

/** One plain word for what a place is, on the pin card */
export const KIND_WORD: Record<InterestCategory, string> = {
  coffee: 'coffee',
  nature: 'outside',
  bookstores: 'books',
  live_music: 'music',
  art: 'art',
  thrifting: 'thrift',
  local_food: 'food',
  architecture: 'architecture',
  community_events: 'happening now',
  study_spots: 'quiet',
  cultural: 'culture',
  unexpected: 'something else',
};

export const kindWord = (c: InterestCategory) => KIND_WORD[c] ?? KIND_WORD.unexpected;
