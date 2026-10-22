import { buildTerrain, heightAt, project, routeBetween } from '@/features/map/terrain';

const CENTER = { latitude: 42.2808, longitude: -83.743 };

describe('map terrain', () => {
  it('builds the same city from the same seed', () => {
    const a = buildTerrain('Ann Arbor', CENTER, 3200);
    const b = buildTerrain('Ann Arbor', CENTER, 3200);
    expect(Array.from(a.heights)).toEqual(Array.from(b.heights));
    expect(a.cells).toEqual(b.cells);
    expect(a.buildings).toEqual(b.buildings);
    expect(a.trees).toEqual(b.trees);
  });

  it('builds a different city from a different seed', () => {
    const a = buildTerrain('Ann Arbor', CENTER, 3200);
    const b = buildTerrain('New York City', CENTER, 3200);
    expect(Array.from(a.heights)).not.toEqual(Array.from(b.heights));
  });

  it('has finite heights, buildings, trees and water', () => {
    const t = buildTerrain('Ann Arbor', CENTER, 3200);
    expect(t.heights.length).toBe((t.grid + 1) ** 2);
    expect(t.grid).toBe(56);
    for (const h of t.heights) expect(Number.isFinite(h)).toBe(true);
    expect(t.buildings.length).toBeGreaterThan(20);
    expect(t.trees.length).toBeGreaterThan(20);
    expect(t.cells).toContain('water');
    expect(t.cells).toContain('street');
    for (const b of t.buildings) expect(Number.isFinite(b.h) && b.h > 0).toBe(true);
    expect(Number.isFinite(heightAt(t, 12.3, -7.7))).toBe(true);
    expect(Number.isFinite(heightAt(t, 999, -999))).toBe(true);
  });

  it('projects the centre to the middle and keeps far places on the board', () => {
    const t = buildTerrain('Ann Arbor', CENTER, 3200);
    const c = project(t, CENTER);
    expect(c.x).toBeCloseTo(0, 6);
    expect(c.z).toBeCloseTo(0, 6);
    const north = project(t, { latitude: CENTER.latitude + 0.01, longitude: CENTER.longitude });
    expect(north.z).toBeLessThan(0);
    const east = project(t, { latitude: CENTER.latitude, longitude: CENTER.longitude + 0.01 });
    expect(east.x).toBeGreaterThan(0);
    const far = project(t, { latitude: 0, longitude: 0 });
    expect(Math.abs(far.x)).toBeLessThanOrEqual(t.size / 2);
    expect(Math.abs(far.z)).toBeLessThanOrEqual(t.size / 2);
  });

  it('routes from a to b along the streets', () => {
    const t = buildTerrain('Ann Arbor', CENTER, 3200);
    const a = { x: 1.3, z: 2.1 };
    const b = { x: -17.4, z: 22.8 };
    const r = routeBetween(t, a, b);
    expect(r[0]).toEqual(a);
    expect(r[r.length - 1]).toEqual(b);
    // every leg runs straight along x or z
    for (let i = 1; i < r.length; i++) {
      const dx = Math.abs(r[i]!.x - r[i - 1]!.x);
      const dz = Math.abs(r[i]!.z - r[i - 1]!.z);
      expect(Math.min(dx, dz)).toBeLessThan(1e-9);
    }
  });
});
