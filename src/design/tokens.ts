/**
 * Sidequest ← Damn Good Brands
 * https://damngoodbrands.com/ · dark.design gallery
 *
 * Pure black stage. Giant condensed uppercase wordmark.
 * Stickers float over type like their 3D objects.
 * Tiny tracked caps for chrome. Color only from stickers.
 */

export const color = {
  bg: '#000000',
  ink: '#FFFFFF',
  muted: '#8A8A8A',
  floor: '#141414',
  line: '#2A2A2A',
  surface: '#D9D9D9',
  onSurface: '#000000',
  knockOut: '#FFFFFF',
} as const;

export const bandeira = {
  violet: '#5B2C8E',
  yellow: '#F5C400',
  blue: '#1E4FD6',
  coral: '#E85A3C',
  lime: '#C5E063',
  salmon: '#E8927C',
  green: '#2F6B3A',
  peach: '#F0C9A8',
  pink: '#E8A0C8',
  black: '#000000',
  white: '#FFFFFF',
} as const;

export const poster = {
  headerPadY: 12,
  /** Stacked hero — Bebas condensed */
  heroSize: 92,
  heroLeading: 78,
  heroTracking: 1,
  floorSize: 120,
  floorLeading: 100,
  floorTracking: -2,
  displaySize: 40,
  displayLeading: 42,
  displayTracking: 0.5,
  labelSize: 10,
  labelTracking: 2.4,
  radius: 999,
  radiusBox: 8,
  asterisk: ' * ',
} as const;

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
  /** UI chrome — Neue Montreal analogue */
  sans: 'SchibstedGrotesk_400Regular',
  sansMedium: 'SchibstedGrotesk_500Medium',
  sansSemiBold: 'SchibstedGrotesk_600SemiBold',
  sansBold: 'SchibstedGrotesk_700Bold',
  sansBlack: 'SchibstedGrotesk_900Black',
  /** Hero condensed caps — F37 Stout analogue */
  display: 'BebasNeue_400Regular',
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
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  muted: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  label: {
    fontSize: poster.labelSize,
    lineHeight: 14,
    letterSpacing: poster.labelTracking,
    textTransform: 'uppercase' as const,
  },
} as const;
