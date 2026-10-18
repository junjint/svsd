import type { InterestCategory } from '@/types';

/**
 * Category-level narrative hooks. These are generic prompts — not invented
 * history about specific businesses. Place-specific hooks come from curated
 * or verified place.storyHooks fields.
 */
export const CATEGORY_HOOKS: Record<InterestCategory, string[]> = {
  coffee: [
    'Find a coffee spot you\'ve never tried. Order something you wouldn\'t normally choose.',
    'A café nearby might be worth a short detour. Notice how the room feels before you order.',
  ],
  nature: [
    'There\'s a little pocket of green nearby. Find somewhere to sit and notice something you\'ve never noticed before.',
    'Take a short walk into green space. Leave your phone in your pocket for two minutes.',
  ],
  bookstores: [
    'Find a book you\'d never normally pick up. Read its first page.',
    'An independent bookstore is nearby. Wander one shelf that isn\'t your usual genre.',
  ],
  live_music: [
    'Discover a local performance and listen to someone you\'ve never heard of.',
    'Live sound is close. Stay for one song you didn\'t plan to hear.',
  ],
  art: [
    'A quiet gallery or creative space is nearby. Find one piece that stops you.',
    'Look for something hand-made. Ask yourself what story it might be telling.',
  ],
  thrifting: [
    'A thrift or vintage spot is nearby. Find one object with a story you invent for it.',
    'Browse for five minutes without a shopping goal. Just notice what catches your eye.',
  ],
  local_food: [
    'Try a local bite you\'ve walked past before. Order one unfamiliar item.',
    'A neighborhood food spot is close. Taste something you didn\'t plan to eat today.',
  ],
  architecture: [
    'Look up. There\'s an architectural detail nearby most people walk past.',
    'Find a building or landmark you\'ve never really looked at. Sketch it in your mind.',
  ],
  community_events: [
    'Something community-minded is happening nearby. Stay long enough to say hello.',
    'A local gathering is close. Be a guest for a few minutes in someone else\'s scene.',
  ],
  study_spots: [
    'A quieter study corner is nearby. Claim a seat and do one focused thing.',
    'Find a place built for thinking. Stay until you finish one small task.',
  ],
  cultural: [
    'A cultural space is nearby. Spend ten minutes learning something unexpected.',
    'Step into a place that holds local stories. Leave with one new fact.',
  ],
  unexpected: [
    'You\'re close to something you wouldn\'t normally find. Follow curiosity for a few minutes.',
    'A little sidequest just appeared. Take the scenic route?',
  ],
};

export const NOTIFICATION_TEMPLATES = [
  'A little sidequest just appeared {minutes} minutes away.',
  'Your usual route has an unusual detour.',
  'There\'s something nearby you might love.',
  'A new chapter is waiting around the corner.',
  'You\'re close to something you wouldn\'t normally find.',
  'Sidequest unlocked: Take the scenic route?',
];

export function pickHook(category: InterestCategory, placeHooks?: string[]): string {
  if (placeHooks && placeHooks.length > 0) {
    return placeHooks[Math.floor(Math.random() * placeHooks.length)]!;
  }
  const hooks = CATEGORY_HOOKS[category];
  return hooks[Math.floor(Math.random() * hooks.length)]!;
}

export function pickNotificationBody(minutes?: number): string {
  const template =
    NOTIFICATION_TEMPLATES[Math.floor(Math.random() * NOTIFICATION_TEMPLATES.length)]!;
  return template.replace('{minutes}', String(minutes ?? 5));
}
