import { RADIUS_PRESETS, RADIUS_STOPS, formatRadius, indexAt, radiusParts, stopIndex, usesMiles } from '@/features/location/radiusScale';

describe('radius scale', () => {
  it('spans 0.5–20 mi in ascending ticks', () => {
    expect(RADIUS_STOPS[0]).toBe(0.5);
    expect(RADIUS_STOPS[RADIUS_STOPS.length - 1]).toBe(20);
    for (let i = 1; i < RADIUS_STOPS.length; i++) expect(RADIUS_STOPS[i]!).toBeGreaterThan(RADIUS_STOPS[i - 1]!);
  });

  it('has a tick for every preset', () => {
    for (const p of RADIUS_PRESETS) expect(RADIUS_STOPS[stopIndex(p)]).toBe(p);
  });

  it('snaps off-scale values to the nearest tick', () => {
    expect(RADIUS_STOPS[stopIndex(0.1)]).toBe(0.5);
    expect(RADIUS_STOPS[stopIndex(50)]).toBe(20);
    expect(RADIUS_STOPS[stopIndex(10.4)]).toBe(10);
  });

  it('maps a finger position to a tick and clamps at the ends', () => {
    const n = RADIUS_STOPS.length;
    expect(indexAt(-20, 300, n)).toBe(0);
    expect(indexAt(0, 300, n)).toBe(0);
    expect(indexAt(299.9, 300, n)).toBe(n - 1);
    expect(indexAt(900, 300, n)).toBe(n - 1);
    expect(indexAt(10, 0, n)).toBe(0);
  });

  it('formats miles and kilometres', () => {
    expect(formatRadius(0.75, true)).toBe('0.75 mi');
    expect(formatRadius(2, true)).toBe('2 mi');
    expect(radiusParts(2, false)).toEqual({ figure: '3.2', unit: 'km' });
    expect(radiusParts(20, false)).toEqual({ figure: '32', unit: 'km' });
  });

  it('picks units from the locale region', () => {
    expect(usesMiles('en-US')).toBe(true);
    expect(usesMiles('en-GB')).toBe(true);
    expect(usesMiles('fr-FR')).toBe(false);
    expect(usesMiles('de')).toBe(true);
  });
});
