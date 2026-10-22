import { streets, type Point } from "./data";
export function meters(a: Point, b: Point) {
  const lat = (b[0] - a[0]) * 111320,
    lon = (b[1] - a[1]) * 111320 * Math.cos(((a[0] + b[0]) * Math.PI) / 360);
  return Math.hypot(lat, lon);
}
export function routeLength(path: readonly Point[]) {
  return path.slice(1).reduce((sum, p, i) => sum + meters(path[i], p), 0);
}
export function along(path: readonly Point[], progress: number): Point {
  let remaining = routeLength(path) * Math.max(0, Math.min(1, progress));
  for (let i = 1; i < path.length; i++) {
    const length = meters(path[i - 1], path[i]);
    if (remaining <= length) {
      const t = length ? remaining / length : 0;
      return [
        path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t,
        path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t,
      ];
    }
    remaining -= length;
  }
  return path[path.length - 1] ?? path[0];
}
const key = (p: Point) => p.map((n) => n.toFixed(7)).join(",");
/** Dijkstra over the seeded street network, with projected start/end connectors. */
export function walkingRoute(start: Point, end: Point): Point[] {
  if (meters(start, end) < 0.05) return [start];
  const segments: [Point, Point][] = [];
  for (const street of streets)
    for (let i = 1; i < street.points.length; i++)
      segments.push([street.points[i - 1], street.points[i]]);
  const intersections: Point[] = [];
  for (const [a, b] of segments)
    for (const [c, d] of segments) {
      if (a[0] === b[0] && c[1] === d[1]) {
        const p: Point = [a[0], c[1]];
        if (
          p[1] >= Math.min(a[1], b[1]) &&
          p[1] <= Math.max(a[1], b[1]) &&
          p[0] >= Math.min(c[0], d[0]) &&
          p[0] <= Math.max(c[0], d[0])
        )
          intersections.push(p);
      }
    }
  const project = (p: Point, a: Point, b: Point): Point => {
    const dx = b[1] - a[1],
      dy = b[0] - a[0],
      t = Math.max(
        0,
        Math.min(
          1,
          ((p[1] - a[1]) * dx + (p[0] - a[0]) * dy) / (dx * dx + dy * dy),
        ),
      );
    return [a[0] + dy * t, a[1] + dx * t];
  };
  const nearest = (p: Point) =>
    segments
      .map(([a, b]) => project(p, a, b))
      .sort((a, b) => meters(p, a) - meters(p, b))[0];
  const s = nearest(start),
    e = nearest(end);
  const points = [...intersections, s, e];
  const graph = new Map<string, { point: Point; edges: Map<string, number> }>();
  const add = (p: Point) => {
    const id = key(p);
    if (!graph.has(id)) graph.set(id, { point: p, edges: new Map() });
    return id;
  };
  for (const [a, b] of segments) {
    const candidates = [
      a,
      b,
      ...points.filter((p) => meters(p, project(p, a, b)) < 0.5),
    ].sort((p, q) => meters(a, p) - meters(a, q));
    for (let i = 1; i < candidates.length; i++) {
      const first = add(candidates[i - 1]),
        second = add(candidates[i]);
      if (first === second) continue;
      const distance = meters(candidates[i - 1], candidates[i]);
      graph.get(first)!.edges.set(second, distance);
      graph.get(second)!.edges.set(first, distance);
    }
  }
  const target = key(e),
    queue = new Set(graph.keys()),
    cost = new Map<string, number>([[key(s), 0]]),
    previous = new Map<string, string>();
  while (queue.size) {
    let current: string | undefined,
      best = Infinity;
    for (const id of queue) {
      const value = cost.get(id) ?? Infinity;
      if (value < best) {
        best = value;
        current = id;
      }
    }
    if (!current) break;
    queue.delete(current);
    if (current === target) break;
    for (const [id, distance] of graph.get(current)!.edges) {
      const candidate = best + distance;
      if (candidate < (cost.get(id) ?? Infinity)) {
        cost.set(id, candidate);
        previous.set(id, current);
      }
    }
  }
  if (!cost.has(target)) return [start, s, e, end];
  const chain: Point[] = [];
  let cursor: string | undefined = target;
  while (cursor) {
    chain.unshift(graph.get(cursor)!.point);
    cursor = previous.get(cursor);
  }
  return [start, ...chain, end].filter(
    (p, i, all) => !i || meters(p, all[i - 1]) > 0.05,
  );
}
