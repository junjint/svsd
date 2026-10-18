/**
 * Sidequest design tokens
 *
 * Philosophy: BeReal-level minimal chrome. Editorial typography + space.
 * Color appears ONLY through picture stickers — never as UI fills/accents.
 */

export const color = {
  bg: '#FFFFFF',
  bgMuted: '#FAFAFA',
  ink: '#000000',
  inkSecondary: '#3A3A3A',
  inkTertiary: '#8A8A8A',
  line: '#000000',
  lineSubtle: '#E8E8E8',
  fillInverse: '#000000',
  fillInverseText: '#FFFFFF',
  // Intentionally no brand accent colors.
} as const;

/** 4px base grid */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
  12: 80,
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  /** BeReal-style status / name pills */
  pill: 999,
} as const;

export const border = {
  hairline: 1,
  thick: 1.5,
} as const;

export const type = {
  /** Brand / screen titles */
  display: {
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.2,
    fontWeight: '700' as const,
  },
  /** Section headlines */
  title: {
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.6,
    fontWeight: '700' as const,
  },
  /** Card / quest names */
  subtitle: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontWeight: '600' as const,
  },
  /** Reading text */
  body: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
    fontWeight: '400' as const,
  },
  /** Meta, captions */
  caption: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  /** ALL-CAPS technical labels (LOCAL TIME, STATUS) */
  label: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
  },
  /** Mono data rows */
  mono: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    fontWeight: '400' as const,
  },
  /** Script accent for a single word in a headline */
  script: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    fontWeight: '400' as const,
  },
} as const;

export const fonts = {
  sans: 'Outfit_400Regular',
  sansMedium: 'Outfit_500Medium',
  sansSemiBold: 'Outfit_600SemiBold',
  sansBold: 'Outfit_700Bold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  script: 'Caveat_500Medium',
  scriptBold: 'Caveat_700Bold',
} as const;

export const motion = {
  pressOpacity: 0.55,
  durationFast: 120,
} as const;
