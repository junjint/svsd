import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Polygon, Polyline } from 'react-native-svg';
import { PALETTE, groundColor, mixColor, type MapSceneProps } from './scene';
import { cellAt, heightAt, type CellKind, type MapPoint, type Terrain } from './terrain';

/** Half the three.js grid: every iso cell covers 2 × 2 terrain cells */
const STEP = 2;
const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;
const ZOOM = 1.35;
const BASE = -3;
/** light from the north-west, slightly above */
const LIGHT = normalise([-0.55, 1, -0.35]);

function normalise(v: number[]) {
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
}

type Iso = (x: number, y: number, z: number) => [number, number];

/** cell priority when four terrain cells share one iso cell: streets are drawn as lines instead */
function pick(kinds: CellKind[]): CellKind {
  if (kinds.filter((k) => k === 'water').length >= 2) return 'water';
  if (kinds.filter((k) => k === 'park').length >= 2) return 'park';
  return 'land';
}

function buildShapes(t: Terrain, iso: Iso) {
  const n1 = t.grid + 1;
  const hv = (i: number, j: number) => t.heights[Math.min(t.grid, j) * n1 + Math.min(t.grid, i)]!;
  const wx = (i: number) => -t.size / 2 + i * t.cell;
  const pt = (i: number, j: number) => iso(wx(i), hv(i, j), wx(j)).join(',');
  const ground: { d: string; fill: string }[] = [];
  const len = t.cell * STEP;

  // back to front: smaller i + j first
  const order: [number, number][] = [];
  for (let j = 0; j < t.grid; j += STEP) for (let i = 0; i < t.grid; i += STEP) order.push([i, j]);
  order.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));

  for (const [i, j] of order) {
    const kinds = [t.cells[j * t.grid + i]!, t.cells[j * t.grid + i + 1]!, t.cells[(j + 1) * t.grid + i]!, t.cells[(j + 1) * t.grid + i + 1]!];
    const kind = pick(kinds);
    const h00 = hv(i, j);
    const h10 = hv(i + STEP, j);
    const h01 = hv(i, j + STEP);
    const h11 = hv(i + STEP, j + STEP);
    const dx = (h10 - h00 + h11 - h01) / 2 / len;
    const dz = (h01 - h00 + h11 - h10) / 2 / len;
    const nrm = normalise([-dx, 1, -dz]);
    const lit = nrm[0]! * LIGHT[0]! + nrm[1]! * LIGHT[1]! + nrm[2]! * LIGHT[2]!;
    const shade = 0.84 + 0.16 * lit;
    ground.push({
      d: [pt(i, j), pt(i + STEP, j), pt(i + STEP, j + STEP), pt(i, j + STEP)].join(' '),
      fill: groundColor(t, kind, (h00 + h11) / 2, shade),
    });
  }

  // the board's two front edges, cut like card stock
  const sides: { d: string; fill: string }[] = [];
  for (let k = 0; k < t.grid; k += STEP) {
    const zEdge = t.grid;
    sides.push({
      d: [iso(wx(k), hv(k, zEdge), wx(zEdge)), iso(wx(k + STEP), hv(k + STEP, zEdge), wx(zEdge)), iso(wx(k + STEP), BASE, wx(zEdge)), iso(wx(k), BASE, wx(zEdge))]
        .map((p) => p.join(','))
        .join(' '),
      fill: PALETTE.side,
    });
    sides.push({
      d: [iso(wx(zEdge), hv(zEdge, k), wx(k)), iso(wx(zEdge), hv(zEdge, k + STEP), wx(k + STEP)), iso(wx(zEdge), BASE, wx(k + STEP)), iso(wx(zEdge), BASE, wx(k))]
        .map((p) => p.join(','))
        .join(' '),
      fill: PALETTE.sideDark,
    });
  }

  // streets: the grid lines through the core, plus the two long avenues
  const streets: { a: [number, number]; b: [number, number] }[] = [];
  const blk = t.cell * 4;
  const lim = t.size / 2;
  for (let v = -Math.floor(t.core / blk) * blk; v <= t.core; v += blk) {
    const reach = v === 0 ? lim : Math.sqrt(Math.max(0, t.core * t.core - v * v));
    const segs = 24;
    for (const axis of ['x', 'z'] as const) {
      for (let s = 0; s < segs; s++) {
        const u0 = -reach + (2 * reach * s) / segs;
        const u1 = -reach + (2 * reach * (s + 1)) / segs;
        const [x0, z0, x1, z1] = axis === 'x' ? [v, u0, v, u1] : [u0, v, u1, v];
        if (cellAt(t, (x0 + x1) / 2, (z0 + z1) / 2) === 'water') continue;
        streets.push({ a: iso(x0, heightAt(t, x0, z0) + 0.05, z0), b: iso(x1, heightAt(t, x1, z1) + 0.05, z1) });
      }
    }
  }

  // buildings and trees share one depth order
  type Solid = { depth: number; faces: { d: string; fill: string }[] };
  const solids: Solid[] = [];
  for (const b of t.buildings) {
    const y0 = heightAt(t, b.x, b.z);
    const y1 = y0 + b.h;
    const x0 = b.x - b.w / 2;
    const x1 = b.x + b.w / 2;
    const z0 = b.z - b.d / 2;
    const z1 = b.z + b.d / 2;
    const P = (x: number, y: number, z: number) => iso(x, y, z).join(',');
    const top = mixColor(PALETTE.building, PALETTE.buildingAlt, b.tone);
    solids.push({
      depth: b.x + b.z,
      faces: [
        { d: [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)].join(' '), fill: mixColor(top, top, 0, 0.93) },
        { d: [P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)].join(' '), fill: mixColor(top, top, 0, 0.86) },
        { d: [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)].join(' '), fill: top },
      ],
    });
  }
  for (const tr of t.trees.filter((_, k) => k % 2 === 0)) {
    const y0 = heightAt(t, tr.x, tr.z);
    const r = 0.75 * tr.s;
    const tip = iso(tr.x, y0 + 2.4 * tr.s, tr.z);
    const l = iso(tr.x - r * 0.7, y0 + 0.3, tr.z + r * 0.7);
    const f = iso(tr.x + r * 0.7, y0 + 0.3, tr.z + r * 0.7);
    const rr = iso(tr.x + r * 0.7, y0 + 0.3, tr.z - r * 0.7);
    solids.push({
      depth: tr.x + tr.z,
      faces: [
        { d: [tip, l, f].map((p) => p.join(',')).join(' '), fill: PALETTE.tree },
        { d: [tip, f, rr].map((p) => p.join(',')).join(' '), fill: PALETTE.treeDark },
      ],
    });
  }
  solids.sort((a, b) => a.depth - b.depth);

  return { ground, sides, streets, solids };
}

/** A soft ring that keeps widening, for "finding you" and the target */
function Pulse({ x, y, size, still }: { x: number; y: number; size: number; still: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    p.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(p);
  }, [p, still]);
  const style = useAnimatedStyle(() => ({ opacity: still ? 0.35 : 0.5 * (1 - p.value), transform: [{ scaleX: 0.4 + p.value }, { scaleY: (0.4 + p.value) * 0.58 }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: PALETTE.ink }, style]}
    />
  );
}

/**
 * The map as an isometric paper model in SVG: the same terrain as the
 * three.js scene at half resolution, with a still camera. Used on native
 * and wherever WebGL isn't there.
 */
export function IsoScene({ terrain, pins, gps, target, route, selectedId, onSelect, locating, reducedMotion }: MapSceneProps) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const scale = box.w ? (box.w / (2 * COS * terrain.size)) * ZOOM : 1;

  const iso = useMemo<Iso>(() => {
    const cx = box.w / 2;
    const cy = box.h * 0.5;
    return (x, y, z) => [+(cx + (x - z) * COS * scale).toFixed(1), +(cy + ((x + z) * SIN - y) * scale).toFixed(1)];
  }, [box.w, box.h, scale]);

  const shapes = useMemo(() => (box.w ? buildShapes(terrain, iso) : null), [terrain, iso, box.w]);
  const at = (p: MapPoint, lift = 0) => iso(p.x, heightAt(terrain, p.x, p.z) + lift, p.z);
  const gpsAt = at(gps);
  const routePts = route?.map((p) => at(p, 0.25).join(',')).join(' ');
  const all = target ? [...pins.filter((p) => p.id !== target.id), target] : pins;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => onSelect(null)} accessible={false} />
      {shapes && (
        <Svg width={box.w} height={box.h} style={StyleSheet.absoluteFill} pointerEvents="none">
          {shapes.sides.map((s, k) => (
            <Polygon key={`s${k}`} points={s.d} fill={s.fill} />
          ))}
          {shapes.ground.map((g, k) => (
            <Polygon key={`g${k}`} points={g.d} fill={g.fill} stroke={g.fill} strokeWidth={0.6} />
          ))}
          {shapes.streets.map((s, k) => (
            <Line key={`r${k}`} x1={s.a[0]} y1={s.a[1]} x2={s.b[0]} y2={s.b[1]} stroke={PALETTE.street} strokeWidth={Math.max(1.5, scale * 0.9)} strokeLinecap="round" />
          ))}
          {shapes.solids.map((s, k) => (
            <G key={`b${k}`}>
              {s.faces.map((f, m) => (
                <Polygon key={m} points={f.d} fill={f.fill} stroke="rgba(21,16,14,0.08)" strokeWidth={0.5} strokeLinejoin="round" />
              ))}
            </G>
          ))}
          {routePts && !locating && (
            <>
              <Polyline points={routePts} fill="none" stroke={PALETTE.white} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
              <Polyline points={routePts} fill="none" stroke={PALETTE.ink} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            </>
          )}
          <Circle cx={gpsAt[0]} cy={gpsAt[1]} r={7} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={2} />
          <Circle cx={gpsAt[0]} cy={gpsAt[1]} r={3} fill={PALETTE.ink} />
          {all.map((p) => {
            const big = p.id === target?.id;
            const on = p.id === selectedId;
            const [x, y] = at(p.point);
            const stem = big ? 30 : on ? 26 : 20;
            const head = big ? 8 : on ? 7 : 5.5;
            return (
              <G key={p.id}>
                <Line x1={x} y1={y} x2={x} y2={y - stem} stroke={PALETTE.ink} strokeWidth={1.6} />
                <Circle cx={x} cy={y} r={1.8} fill={PALETTE.ink} />
                <Circle cx={x} cy={y - stem} r={head} fill={PALETTE.ink} />
                {(on || big) && <Circle cx={x} cy={y - stem} r={head * 0.38} fill={PALETTE.white} />}
              </G>
            );
          })}
        </Svg>
      )}
      {shapes && (locating || target) && (
        <>
          {locating && <Pulse x={gpsAt[0]} y={gpsAt[1]} size={56} still={reducedMotion} />}
          {target && !locating && <Pulse x={at(target.point)[0]} y={at(target.point)[1]} size={48} still={reducedMotion} />}
        </>
      )}
      {shapes &&
        all.map((p) => {
          const [x, y] = at(p.point);
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel="A pin"
              onPress={() => onSelect(p.id)}
              style={{ position: 'absolute', left: x - 18, top: y - 44, width: 36, height: 50 }}
            />
          );
        })}
    </View>
  );
}
