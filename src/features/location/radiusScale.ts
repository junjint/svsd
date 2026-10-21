/**
 * Radius scale (SPEC §4.1): 0.5–20 mi on a row of ticks. Each tick is one
 * value; the steps are fine near home and coarse far out, because the
 * difference between 1 and 1.5 miles is a walk and between 18 and 19 is not.
 */
export const RADIUS_STOPS: readonly number[] = [
  0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11, 12, 13, 14, 15, 16,
  17, 18, 19, 20,
];

export const RADIUS_PRESETS = [0.5, 2, 5, 10, 20] as const;
export const RADIUS_MIN = RADIUS_STOPS[0]!;
export const RADIUS_MAX = RADIUS_STOPS[RADIUS_STOPS.length - 1]!;

/** Nearest tick for a value (values off the scale snap to the closest stop) */
export function stopIndex(miles: number): number {
  let best = 0;
  for (let i = 1; i < RADIUS_STOPS.length; i++) {
    if (Math.abs(RADIUS_STOPS[i]! - miles) < Math.abs(RADIUS_STOPS[best]! - miles)) best = i;
  }
  return best;
}

/** Which tick a finger at `x` over a row `width` wide is on */
export function indexAt(x: number, width: number, count: number): number {
  'worklet';
  if (width <= 0) return 0;
  const i = Math.floor((x / width) * count);
  return Math.min(count - 1, Math.max(0, i));
}

/** Countries that measure road distance in miles */
const MILE_REGIONS = new Set(['US', 'GB', 'LR', 'MM']);

export function usesMiles(locale?: string): boolean {
  try {
    const tag = locale ?? Intl.DateTimeFormat().resolvedOptions().locale;
    const region = tag.split(/[-_]/).find((p, i) => i > 0 && /^[A-Z]{2}$/.test(p));
    return region ? MILE_REGIONS.has(region) : true;
  } catch {
    return true;
  }
}

const trim = (n: number, dp = 2) => String(Math.round(n * 10 ** dp) / 10 ** dp);

/** { figure: '2.5', unit: 'mi' } or the km equivalent */
export function radiusParts(miles: number, imperial = usesMiles()): { figure: string; unit: 'mi' | 'km' } {
  if (imperial) return { figure: trim(miles), unit: 'mi' };
  const km = miles * 1.609344;
  return { figure: km < 10 ? trim(km, 1) : String(Math.round(km)), unit: 'km' };
}

export function formatRadius(miles: number, imperial = usesMiles()): string {
  const { figure, unit } = radiusParts(miles, imperial);
  return `${figure} ${unit}`;
}
