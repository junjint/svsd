import type { MapPoint, Terrain } from './terrain';

export interface ScenePin {
  id: string;
  point: MapPoint;
}

/** What both scenes (three.js on the web, SVG elsewhere) take */
export interface MapSceneProps {
  terrain: Terrain;
  /** identical pins, no labels; the card says what they are */
  pins: ScenePin[];
  gps: MapPoint;
  /** navigate mode: the sidequest's place, drawn larger */
  target?: ScenePin;
  route?: MapPoint[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  locating: boolean;
  reducedMotion: boolean;
  /** bump to fly back to the GPS dot */
  recentreKey: number;
}

/** Paper-model colours: warm card stock, a grey-blue river, ink pins */
export const PALETTE = {
  paper: '#FBFAF7',
  landLow: '#EEEAE2',
  landHigh: '#D9D1C3',
  water: '#C8D2D8',
  street: '#F9F7F3',
  park: '#DCDFCE',
  side: '#E2DCD2',
  sideDark: '#D3CCC0',
  building: '#FFFFFF',
  buildingAlt: '#F3F0EB',
  tree: '#B3BAA4',
  treeDark: '#9EA690',
  ink: '#15100E',
  white: '#FFFFFF',
} as const;

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blend two hex colours and darken by `shade` (1 = as is) */
export function mixColor(a: string, b: string, t: number, shade = 1): string {
  const x = hex(a);
  const y = hex(b);
  const out = x.map((v, i) => Math.max(0, Math.min(255, Math.round((v + (y[i]! - v) * t) * shade))));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Ground colour for a cell kind at a height */
export function groundColor(t: Terrain, kind: string, h: number, shade = 1): string {
  if (kind === 'water') return mixColor(PALETTE.water, PALETTE.water, 0, shade);
  if (kind === 'street') return mixColor(PALETTE.street, PALETTE.street, 0, shade);
  if (kind === 'park') return mixColor(PALETTE.park, PALETTE.park, 0, shade);
  return mixColor(PALETTE.landLow, PALETTE.landHigh, Math.max(0, Math.min(1, h / Math.max(1, t.maxHeight))), shade);
}
