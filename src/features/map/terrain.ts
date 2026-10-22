import type { Coordinates } from '@/types';

/**
 * The city as a paper model: a seeded low-poly board with a river, a
 * street grid in the core, buildings that rise toward the middle, trees
 * on the outskirts and a few parks. Pure, so the web (three.js) and the
 * native (SVG) scenes draw the same place, and a city always looks the
 * same. World units: the board is MAP_SIZE across, x east, z south.
 */

export type CellKind = 'land' | 'water' | 'street' | 'park';

export interface MapPoint {
  x: number;
  z: number;
}

export interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  /** 0 to 1, for a slight shade difference between blocks */
  tone: number;
}

export interface Tree {
  x: number;
  z: number;
  s: number;
}

export interface Terrain {
  seed: string;
  center: Coordinates;
  radiusMeters: number;
  size: number;
  grid: number;
  cell: number;
  /** radius of the flat city core, world units */
  core: number;
  /** (grid + 1)² vertex heights, row by row from the north edge */
  heights: Float32Array;
  /** grid² cell kinds, same order */
  cells: CellKind[];
  buildings: Building[];
  trees: Tree[];
  maxHeight: number;
}

export const MAP_SIZE = 100;
const GRID = 56;
/** streets every this many cells, lined up through the centre */
const BLOCK = 4;
const PEAK = 9;

/* ── seeded randomness ─────────────────────────────────────── */

function fnv(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let h = seed || 1;
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function lattice(ix: number, iy: number, seed: number) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + seed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, v: number) => smooth(Math.min(1, Math.max(0, (v - a) / (b - a))));

function valueNoise(x: number, y: number, seed: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = lattice(ix, iy, seed);
  const b = lattice(ix + 1, iy, seed);
  const c = lattice(ix, iy + 1, seed);
  const d = lattice(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

/** three octaves, 0 to 1 */
function fbm(u: number, v: number, seed: number) {
  return (valueNoise(u * 3, v * 3, seed) + valueNoise(u * 6, v * 6, seed + 1) * 0.5 + valueNoise(u * 12, v * 12, seed + 2) * 0.25) / 1.75;
}

/* ── the board ─────────────────────────────────────────────── */

export function buildTerrain(seed: string, center: Coordinates, radiusMeters: number): Terrain {
  const s = fnv(seed);
  const rand = rng(s);
  const size = MAP_SIZE;
  const half = size / 2;
  const cell = size / GRID;
  const core = half * 0.4;
  const mid = GRID / 2;

  // the river: a slow sine across the board, off to one side of the middle
  const across = rand() < 0.5;
  const offset = (rand() < 0.5 ? -1 : 1) * half * (0.3 + rand() * 0.22);
  const amp = half * (0.1 + rand() * 0.12);
  const freq = (Math.PI * 2) / (size * (0.8 + rand() * 0.6));
  const phase = rand() * Math.PI * 2;
  const riverW = cell * 1.6;
  const riverGap = (x: number, z: number) => {
    const along = across ? x : z;
    const side = across ? z : x;
    return Math.abs(side - (offset + amp * Math.sin(along * freq + phase)));
  };

  const parks = Array.from({ length: 4 }, (_, i) => {
    const a = rand() * Math.PI * 2;
    const r = i === 0 ? core * (0.3 + rand() * 0.4) : half * (0.35 + rand() * 0.5);
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, r: cell * (i === 0 ? 2.2 : 2.5 + rand() * 2.5) };
  });

  const n1 = GRID + 1;
  const heights = new Float32Array(n1 * n1);
  let maxHeight = 0;
  for (let j = 0; j < n1; j++) {
    for (let i = 0; i < n1; i++) {
      const x = -half + i * cell;
      const z = -half + j * cell;
      const r = Math.hypot(x, z);
      const hills = Math.pow(fbm(i / GRID, j / GRID, s), 1.5) * PEAK;
      let h = 0.3 + hills * smoothstep(core * 0.9, core * 2, r) + fbm(i / GRID + 7, j / GRID, s) * 0.25;
      const gap = riverGap(x, z);
      if (gap < riverW * 2.2) h = lerp(-0.6, h, smoothstep(riverW * 0.7, riverW * 2.2, gap));
      heights[j * n1 + i] = h;
      maxHeight = Math.max(maxHeight, h);
    }
  }

  const cells: CellKind[] = new Array(GRID * GRID);
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const x = -half + (i + 0.5) * cell;
      const z = -half + (j + 0.5) * cell;
      const r = Math.hypot(x, z);
      const onGrid = (i - mid) % BLOCK === 0 || (j - mid) % BLOCK === 0;
      const arterial = i === mid || j === mid;
      let kind: CellKind = 'land';
      if (riverGap(x, z) < riverW) kind = 'water';
      else if (arterial || (onGrid && r < core)) kind = 'street';
      else if (parks.some((p) => Math.hypot(x - p.x, z - p.z) < p.r)) kind = 'park';
      cells[j * GRID + i] = kind;
    }
  }

  const terrain: Terrain = { seed, center, radiusMeters, size, grid: GRID, cell, core, heights, cells, buildings: [], trees: [], maxHeight };

  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const kind = cells[j * GRID + i];
      const x = -half + (i + 0.5) * cell;
      const z = -half + (j + 0.5) * cell;
      const r = Math.hypot(x, z);
      const roll = rand();
      if (kind === 'land' && r < core * 1.5) {
        const inner = r < core;
        if (roll > (inner ? 0.85 : 0.25)) continue;
        const rise = inner ? Math.pow(1 - r / core, 1.6) : 0;
        terrain.buildings.push({
          x: x + (rand() - 0.5) * cell * 0.12,
          z: z + (rand() - 0.5) * cell * 0.12,
          w: cell * (0.55 + rand() * 0.3),
          d: cell * (0.55 + rand() * 0.3),
          h: 0.6 + rise * 4 * (0.5 + rand()) + rand() * 0.4,
          tone: rand(),
        });
      } else if (kind === 'park' || (kind === 'land' && r > core * 1.2)) {
        const forest = fbm(i / GRID + 3, j / GRID + 3, s);
        const chance = kind === 'park' ? 0.45 : Math.max(0, forest - 0.42) * 1.6;
        if (roll > chance) continue;
        terrain.trees.push({ x: x + (rand() - 0.5) * cell * 0.6, z: z + (rand() - 0.5) * cell * 0.6, s: 0.6 + rand() * 0.5 });
      }
    }
  }

  return terrain;
}

/* ── helpers ───────────────────────────────────────────────── */

const M_PER_DEG_LAT = 110540;
const M_PER_DEG_LON = 111320;

/**
 * A coordinate to the board, kept just inside its edge. Like a tourist
 * map, the middle gets more room than the outskirts: distance from the
 * centre is square-rooted, so a cluster of places nearby spreads out and
 * the far ones still land on the board. Bearings stay true.
 */
export function project(t: Terrain, coord: Coordinates): MapPoint {
  const east = (coord.longitude - t.center.longitude) * Math.cos((t.center.latitude * Math.PI) / 180) * M_PER_DEG_LON;
  const north = (coord.latitude - t.center.latitude) * M_PER_DEG_LAT;
  const r = Math.hypot(east, north);
  if (r < 1e-9) return { x: 0, z: 0 };
  const reach = (t.size / 2) * 0.9 * Math.sqrt(r / Math.max(1, t.radiusMeters));
  const lim = (t.size / 2) * 0.94;
  const clamp = (v: number) => Math.max(-lim, Math.min(lim, v));
  return { x: clamp((east / r) * reach), z: clamp((-north / r) * reach) };
}

/** Ground height under a point, bilinear across the vertex grid */
export function heightAt(t: Terrain, x: number, z: number): number {
  const n1 = t.grid + 1;
  const gx = Math.max(0, Math.min(t.grid - 1e-6, (x + t.size / 2) / t.cell));
  const gz = Math.max(0, Math.min(t.grid - 1e-6, (z + t.size / 2) / t.cell));
  const i = Math.floor(gx);
  const j = Math.floor(gz);
  const fx = gx - i;
  const fz = gz - j;
  const h = (a: number, b: number) => t.heights[b * n1 + a]!;
  return lerp(lerp(h(i, j), h(i + 1, j), fx), lerp(h(i, j + 1), h(i + 1, j + 1), fx), fz);
}

export function cellAt(t: Terrain, x: number, z: number): CellKind {
  const i = Math.max(0, Math.min(t.grid - 1, Math.floor((x + t.size / 2) / t.cell)));
  const j = Math.max(0, Math.min(t.grid - 1, Math.floor((z + t.size / 2) / t.cell)));
  return t.cells[j * t.grid + i]!;
}

/**
 * A walk from a to b along the street grid: out to the nearest street,
 * along it, one turn, and in to the door. Endpoints are a and b exactly.
 */
export function routeBetween(t: Terrain, a: MapPoint, b: MapPoint): MapPoint[] {
  const step = t.cell * BLOCK;
  const lim = t.size / 2 - step / 2;
  const snap = (v: number) => Math.max(-lim, Math.min(lim, Math.round(v / step) * step));
  const sx = snap(a.x);
  const sz = snap(b.z);
  const pts: MapPoint[] = [a, { x: sx, z: a.z }, { x: sx, z: sz }, { x: b.x, z: sz }, b];
  return pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1]!.x, p.z - pts[i - 1]!.z) > 1e-6);
}
