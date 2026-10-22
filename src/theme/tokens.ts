/**
 * Sidequest v2 tokens — docs/SPEC.md §2.2.
 * A neutral interface: off-white paper, ink, greys. Colour comes from
 * the photos and places people bring, never from the chrome.
 */
export const color = {
  paper: '#FBFAF7',
  frost: 'rgba(251,250,247,0.74)',
  frostEdge: 'rgba(255,255,255,0.9)',
  ink: '#15100E',
  ink2: '#827973',
  ink3: '#B9B2AC',
  line: '#ECE8E3',
  /** quiet grey fill for chips, pills and wells */
  mist: '#F0EDE8',
  /** the one accent is ink; kept under this name for existing callers */
  cobalt: '#15100E',
  cobaltSoft: 'rgba(21,16,14,0.07)',
  /** destructive actions only */
  signal: '#B5402E',
  white: '#FFFFFF',
  scrim: 'rgba(21,16,14,0.32)',
} as const;

export const rarityColor = {
  common: { a: '#A8AEB7', b: '#D2D5DB', label: 'Common' },
  rare: { a: '#9FD8F6', b: '#C9B4FF', label: 'Rare' },
  legendary: { a: '#F7D774', b: '#FFB547', label: 'Legendary' },
} as const;

export const radius = {
  card: 22,
  tile: 28,
  sheet: 32,
  pill: 999,
  thumb: 10,
} as const;

/** 4pt scale */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/** Plus Jakarta Sans for the interface, EB Garamond for the sidequest's own voice */
export const fonts = {
  serif: 'EBGaramond_400Regular',
  serifItalic: 'EBGaramond_400Regular_Italic',
  sans: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemi: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
  sansHeavy: 'PlusJakartaSans_800ExtraBold',
  /** thermal-receipt type */
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
  /** kept for callers that ask for the UI face */
  ui: 'PlusJakartaSans_400Regular' as string | undefined,
} as const;

export const type = {
  wordmark: { fontFamily: fonts.sansBold, fontSize: 28, letterSpacing: -1.1, color: color.ink },
  display: { fontFamily: fonts.sansBold, fontSize: 44, lineHeight: 44, letterSpacing: -1.9, color: color.ink },
  title: { fontFamily: fonts.sansBold, fontSize: 30, lineHeight: 32, letterSpacing: -1.1, color: color.ink },
  headline: { fontFamily: fonts.sansSemi, fontSize: 17, letterSpacing: -0.3, color: color.ink },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, letterSpacing: -0.1, color: color.ink },
  callout: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: color.ink2 },
  caption: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16, color: color.ink2 },
  number: { fontFamily: fonts.sansSemi, fontSize: 22, fontVariant: ['tabular-nums'], color: color.ink },
  /** small tracked caps: "BRUSHES  15" */
  label: { fontFamily: fonts.sansMedium, fontSize: 11, lineHeight: 14, letterSpacing: 0.9, textTransform: 'uppercase', color: color.ink2 },
  /** Garamond italic for accents: "(2026)", "01/" */
  accent: { fontFamily: fonts.serifItalic, fontSize: 22, lineHeight: 26, letterSpacing: -0.2, color: color.ink },
  /** the sidequest's voice: prompts and notes */
  prose: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 27, letterSpacing: -0.1, color: color.ink },
} as const;

export const shadow = {
  float: {
    shadowColor: '#15100E',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  lift: {
    shadowColor: '#15100E',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  glow: {
    shadowColor: color.ink,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
} as const;

/** Reanimated spring defaults — §2.2 Motion */
export const spring = { damping: 18, stiffness: 180, mass: 1 } as const;

/** Feathered photo edge width, px — the photo-viewer reference */
export const FEATHER = 12;
