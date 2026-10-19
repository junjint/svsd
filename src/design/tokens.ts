/**
 * Moon Design System v1 — Sidequest theme
 *
 * Figma: https://www.figma.com/design/HqWHs2iA7kDXabttViiAu7/
 * Docs:  https://archive.moon.io/colours
 * Cover: DM Sans, monochrome + piccolo accent
 *
 * Semantic Dragon Ball Z colour names. Prefer tokens over raw hex in UI.
 */

export const color = {
  /** Accent */
  piccolo: '#4E46B4',
  /** Secondary accent / controls */
  hit: '#F5F5F5',
  /** Border / line */
  beerus: '#EBEBEB',
  /** App background */
  goku: '#F5F5F5',
  /** Surface / cards */
  gohan: '#FFFFFF',
  /** Primary text / icons */
  bulma: '#000000',
  /** Secondary text / icons */
  trunks: '#999CA0',
  /** Force white */
  goten: '#FFFFFF',
  /** Force black */
  popo: '#000000',
  /** Overlays */
  heles: 'rgba(255,255,255,0.6)',
  jiren: 'rgba(0,0,0,0.32)',
  /** Support */
  krillin: '#FFB319',
  chichi: '#FF4E64',
  roshi: '#0CD664',
  whis: '#0F75BD',

  // Compatibility aliases used across existing screens
  bg: '#F5F5F5',
  ink: '#000000',
  muted: '#999CA0',
  line: '#EBEBEB',
  surface: '#4E46B4',
  onSurface: '#FFFFFF',
  floor: '#E8E8E8',
  knockOut: '#FFFFFF',
} as const;

/** @deprecated festival accents — use Moon support colours */
export const bandeira = {
  violet: '#4E46B4',
  yellow: '#FFB319',
  blue: '#0F75BD',
  coral: '#FF4E64',
  lime: '#0CD664',
  salmon: '#E8927C',
  green: '#0AB758',
  peach: '#F0C9A8',
  pink: '#E8A0C8',
  black: '#000000',
  white: '#FFFFFF',
} as const;

export const radius = {
  iXs: 4,
  iSm: 8,
  iMd: 12,
  sXs: 4,
  sSm: 8,
  sMd: 12,
  sLg: 16,
  full: 100,
} as const;

export const poster = {
  headerPadY: 12,
  heroSize: 40,
  heroLeading: 44,
  heroTracking: -1.2,
  displaySize: 32,
  displayLeading: 36,
  displayTracking: -1,
  floorSize: 64,
  floorLeading: 56,
  floorTracking: -1.5,
  labelSize: 12,
  labelTracking: 0.2,
  radius: radius.iSm,
  radiusBox: radius.sMd,
  asterisk: ' · ',
} as const;

/** Moon space scale (base 16) */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
  9: 80,
} as const;

export const fonts = {
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
  sansBlack: 'DMSans_700Bold',
  display: 'DMSans_700Bold',
} as const;

export const type = {
  hero: {
    fontSize: poster.heroSize,
    lineHeight: poster.heroLeading,
    letterSpacing: poster.heroTracking,
  },
  floor: {
    fontSize: poster.floorSize,
    lineHeight: poster.floorLeading,
    letterSpacing: poster.floorTracking,
  },
  display: {
    fontSize: poster.displaySize,
    lineHeight: poster.displayLeading,
    letterSpacing: poster.displayTracking,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  label: {
    fontSize: poster.labelSize,
    lineHeight: 16,
    letterSpacing: poster.labelTracking,
  },
} as const;
