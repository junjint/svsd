import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { IsoScene } from './IsoScene';
import { PALETTE, groundColor, mixColor, type MapSceneProps, type ScenePin } from './scene';
import { heightAt, type MapPoint, type Terrain } from './terrain';

const BASE = -4;
const FOV = 32;
const PHI = 0.92;
const PHI_MIN = 0.3;
const PHI_MAX = 1.28;
const DIST_MIN = 22;
const DIST_MAX = 210;
/** how long a drag holds off the slow drift */
const IDLE_MS = 4500;
const ROUTE_IN_MS = 1400;

interface Orbit {
  theta: number;
  phi: number;
  dist: number;
  target: THREE.Vector3;
}

interface Ctx {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  board: THREE.Group;
  pins: THREE.Group;
  gps: THREE.Group;
  route: THREE.Group;
  now: Orbit;
  goal: Orbit;
  home: Orbit;
  lastTouch: number;
  routeAt: number;
}

const color = (c: string) => new THREE.Color(c);

function dispose(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
}

function clear(group: THREE.Group) {
  for (const c of [...group.children]) {
    group.remove(c);
    dispose(c);
  }
}

/* ── the board ─────────────────────────────────────────────── */

function buildBoard(t: Terrain): THREE.Group {
  const g = new THREE.Group();
  const n1 = t.grid + 1;
  const half = t.size / 2;
  const hv = (i: number, j: number) => t.heights[j * n1 + i]!;
  const wx = (i: number) => -half + i * t.cell;

  // ground: two flat-shaded triangles a cell, coloured by what the cell is
  const pos: number[] = [];
  const col: number[] = [];
  const c = new THREE.Color();
  for (let j = 0; j < t.grid; j++) {
    for (let i = 0; i < t.grid; i++) {
      const kind = t.cells[j * t.grid + i]!;
      const a = [wx(i), hv(i, j), wx(j)];
      const b = [wx(i + 1), hv(i + 1, j), wx(j)];
      const d = [wx(i), hv(i, j + 1), wx(j + 1)];
      const e = [wx(i + 1), hv(i + 1, j + 1), wx(j + 1)];
      // streets and water sit flat, so lift streets a hair off the land under them
      if (kind === 'street') for (const p of [a, b, d, e]) p[1] = p[1]! + 0.02;
      pos.push(...a, ...d, ...b, ...b, ...d, ...e);
      c.set(groundColor(t, kind, (a[1]! + e[1]!) / 2));
      for (let k = 0; k < 6; k++) col.push(c.r, c.g, c.b);
    }
  }
  const ground = new THREE.BufferGeometry();
  ground.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  ground.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  ground.computeVertexNormals();
  const groundMesh = new THREE.Mesh(ground, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  groundMesh.receiveShadow = true;
  g.add(groundMesh);

  // the cut edges of the card: four walls down to the base
  const side: number[] = [];
  const sideCol: number[] = [];
  const wall = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tone: string) => {
    side.push(x0, y0, z0, x0, BASE, z0, x1, y1, z1, x1, y1, z1, x0, BASE, z0, x1, BASE, z1);
    c.set(tone);
    for (let k = 0; k < 6; k++) sideCol.push(c.r, c.g, c.b);
  };
  for (let k = 0; k < t.grid; k++) {
    wall(wx(k + 1), hv(k + 1, 0), -half, wx(k), hv(k, 0), -half, PALETTE.sideDark);
    wall(wx(k), hv(k, t.grid), half, wx(k + 1), hv(k + 1, t.grid), half, PALETTE.side);
    wall(-half, hv(0, k), wx(k), -half, hv(0, k + 1), wx(k + 1), PALETTE.sideDark);
    wall(half, hv(t.grid, k + 1), wx(k + 1), half, hv(t.grid, k), wx(k), PALETTE.side);
  }
  const sides = new THREE.BufferGeometry();
  sides.setAttribute('position', new THREE.Float32BufferAttribute(side, 3));
  sides.setAttribute('color', new THREE.Float32BufferAttribute(sideCol, 3));
  sides.computeVertexNormals();
  g.add(new THREE.Mesh(sides, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));

  // buildings: one box, many instances
  const box = new THREE.BoxGeometry(1, 1, 1);
  box.translate(0, 0.5, 0);
  const houses = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ flatShading: true }), t.buildings.length);
  const m = new THREE.Matrix4();
  t.buildings.forEach((b, k) => {
    m.makeScale(b.w, b.h, b.d).setPosition(b.x, heightAt(t, b.x, b.z) - 0.05, b.z);
    houses.setMatrixAt(k, m);
    houses.setColorAt(k, color(mixColor(PALETTE.building, PALETTE.buildingAlt, b.tone)));
  });
  houses.castShadow = true;
  houses.receiveShadow = true;
  g.add(houses);

  // trees: little paper cones
  const cone = new THREE.ConeGeometry(0.7, 2.2, 6);
  cone.translate(0, 1.1, 0);
  const trees = new THREE.InstancedMesh(cone, new THREE.MeshLambertMaterial({ flatShading: true }), t.trees.length);
  t.trees.forEach((tr, k) => {
    m.makeScale(tr.s, tr.s, tr.s).setPosition(tr.x, heightAt(t, tr.x, tr.z) - 0.1, tr.z);
    trees.setMatrixAt(k, m);
    trees.setColorAt(k, color(mixColor(PALETTE.tree, PALETTE.treeDark, (k * 0.37) % 1)));
  });
  trees.castShadow = true;
  g.add(trees);

  return g;
}

/* ── pins, the dot, the route ──────────────────────────────── */

const INK = () => new THREE.MeshLambertMaterial({ color: PALETTE.ink });

function makePin(t: Terrain, pin: ScenePin, big: boolean): THREE.Group {
  const g = new THREE.Group();
  const y = heightAt(t, pin.point.x, pin.point.z);
  g.position.set(pin.point.x, y, pin.point.z);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5, 8), INK());
  stem.position.y = 2.5;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 14), INK());
  head.position.y = 5.3;
  const foot = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), new THREE.MeshBasicMaterial({ color: PALETTE.ink }));
  foot.rotation.x = -Math.PI / 2;
  foot.position.y = 0.06;
  stem.castShadow = head.castShadow = true;
  // a generous invisible target, so a fingertip finds the pin
  const hit = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hit.position.y = 4.4;
  hit.userData.id = pin.id;
  g.add(stem, head, foot, hit);
  if (big) {
    g.scale.setScalar(1.45);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.12, 48), new THREE.MeshBasicMaterial({ color: PALETTE.ink, transparent: true, opacity: 0.5, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    ring.name = 'pulse';
    g.add(ring);
  }
  g.userData = { id: pin.id, big, lift: 0 };
  return g;
}

function makeGps(t: Terrain, p: MapPoint): THREE.Group {
  const g = new THREE.Group();
  g.position.set(p.x, heightAt(t, p.x, p.z) + 0.12, p.z);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.24, 32), new THREE.MeshLambertMaterial({ color: PALETTE.white }));
  const rim = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.18, 40), new THREE.MeshBasicMaterial({ color: PALETTE.ink }));
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.13;
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: PALETTE.ink }));
  core.rotation.x = -Math.PI / 2;
  core.position.y = 0.14;
  g.add(disc, rim, core);
  for (let k = 0; k < 3; k++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.08, 48), new THREE.MeshBasicMaterial({ color: PALETTE.ink, transparent: true, opacity: 0, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.userData.phase = k / 3;
    ring.name = 'finding';
    g.add(ring);
  }
  // you're never hidden behind a building: the dot draws over the city
  g.traverse((o) => {
    const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (mat) mat.depthTest = false;
    o.renderOrder = 10;
  });
  g.scale.setScalar(1.25);
  return g;
}

function makeRoute(t: Terrain, pts: MapPoint[]): THREE.Group {
  const g = new THREE.Group();
  const path = new THREE.CurvePath<THREE.Vector3>();
  let segs = 0;
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1]!;
    const b = pts[k]!;
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.6));
    for (let s = 0; s < n; s++) {
      const p0 = { x: a.x + ((b.x - a.x) * s) / n, z: a.z + ((b.z - a.z) * s) / n };
      const p1 = { x: a.x + ((b.x - a.x) * (s + 1)) / n, z: a.z + ((b.z - a.z) * (s + 1)) / n };
      path.add(new THREE.LineCurve3(new THREE.Vector3(p0.x, heightAt(t, p0.x, p0.z) + 0.3, p0.z), new THREE.Vector3(p1.x, heightAt(t, p1.x, p1.z) + 0.3, p1.z)));
      segs++;
    }
  }
  if (!segs) return g;
  const tube = new THREE.Mesh(new THREE.TubeGeometry(path, segs * 2, 0.26, 6, false), new THREE.MeshLambertMaterial({ color: PALETTE.ink }));
  tube.name = 'tube';
  tube.castShadow = true;
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), new THREE.MeshLambertMaterial({ color: PALETTE.white, emissive: 0x666666 }));
  bead.name = 'bead';
  bead.visible = false;
  g.add(tube, bead);
  g.userData.path = path;
  return g;
}

/* ── camera framing ────────────────────────────────────────── */

function frame(gps: MapPoint, target: MapPoint | undefined, base: number): Orbit {
  if (!target) return { theta: Math.PI / 4, phi: PHI, dist: base, target: new THREE.Vector3(gps.x * 0.5, 0, gps.z * 0.5) };
  const sep = Math.hypot(target.x - gps.x, target.z - gps.z);
  return {
    theta: Math.PI / 4,
    phi: PHI,
    dist: Math.min(DIST_MAX, Math.max(60, sep * 2.4 + 40)),
    target: new THREE.Vector3((gps.x + target.x) / 2, 0, (gps.z + target.z) / 2),
  };
}

const copyOrbit = (o: Orbit): Orbit => ({ ...o, target: o.target.clone() });

/**
 * The map on the web: the same paper board in three.js, flat shaded and
 * fogged into the page. It swoops in, drifts slowly when left alone, and
 * orbits under a drag. Falls back to the SVG model if WebGL won't start.
 */
export function MapScene(props: MapSceneProps) {
  const { terrain, pins, gps, target, route, recentreKey } = props;
  const host = useRef<ComponentRef<typeof View>>(null);
  const ctx = useRef<Ctx | null>(null);
  const live = useRef(props);
  live.current = props;
  const [failed, setFailed] = useState(false);

  // renderer, camera, lights, input and the loop
  useEffect(() => {
    const el = host.current as unknown as HTMLElement | null;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(PALETTE.paper);
    const canvas = renderer.domElement;
    Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' });
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.background = color(PALETTE.paper);
    scene.fog = new THREE.Fog(PALETTE.paper, 170, 400);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2c6, 1.45));
    const sun = new THREE.DirectionalLight(0xffffff, 1.25);
    sun.position.set(-40, 70, -25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -62, right: 62, top: 62, bottom: -62, near: 1, far: 220 });
    sun.shadow.bias = -0.0006;
    sun.shadow.radius = 3;
    scene.add(sun);

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 600);
    const board = new THREE.Group();
    const pinGroup = new THREE.Group();
    const gpsGroup = new THREE.Group();
    const routeGroup = new THREE.Group();
    scene.add(board, routeGroup, pinGroup, gpsGroup);

    const p = live.current;
    const home = frame(p.gps, p.target?.point, 150);
    // the swoop starts high, far and a quarter turn round
    const now: Orbit = p.reducedMotion ? copyOrbit(home) : { theta: home.theta - 0.9, phi: 0.45, dist: home.dist * 1.35, target: home.target.clone() };
    const c: Ctx = { renderer, scene, camera, board, pins: pinGroup, gps: gpsGroup, route: routeGroup, now, goal: copyOrbit(home), home, lastTouch: 0, routeAt: 0 };
    ctx.current = c;

    const size = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // a narrow phone needs to stand further back to see the same board
      camera.userData.fit = Math.max(1, 0.75 / camera.aspect);
      camera.updateProjectionMatrix();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    /* input: drag to orbit, wheel to zoom, tap to pick */
    const ray = new THREE.Raycaster();
    let down: { x: number; y: number; moved: boolean } | null = null;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, moved: false };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      // a pointer resting over the board is aiming at something, so hold the drift
      c.lastTouch = performance.now();
      if (!down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (!down.moved && Math.hypot(dx, dy) < 5) return;
      down.moved = true;
      down.x = e.clientX;
      down.y = e.clientY;
      c.goal.theta -= dx * 0.008;
      c.goal.phi = Math.min(PHI_MAX, Math.max(PHI_MIN, c.goal.phi - dy * 0.006));
      c.lastTouch = performance.now();
    };
    const onUp = (e: PointerEvent) => {
      canvas.style.cursor = 'grab';
      const was = down;
      down = null;
      if (!was || was.moved) return;
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = ray.intersectObjects(pinGroup.children, true).find((h) => h.object.userData.id);
      live.current.onSelect(hit ? (hit.object.userData.id as string) : null);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      c.goal.dist = Math.min(DIST_MAX, Math.max(DIST_MIN, c.goal.dist * (1 + e.deltaY * 0.0012)));
      c.lastTouch = performance.now();
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    /* the loop */
    const aim = new THREE.Vector3();
    let raf = 0;
    let last = performance.now();
    const tick = (time: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      const { reducedMotion: still, selectedId, locating: finding } = live.current;
      if (!still && time - c.lastTouch > IDLE_MS) c.goal.theta += dt * 0.02;

      const k = still ? 1 : 1 - Math.pow(0.04, dt);
      c.now.theta += (c.goal.theta - c.now.theta) * k;
      c.now.phi += (c.goal.phi - c.now.phi) * k;
      c.now.dist += (c.goal.dist - c.now.dist) * k;
      c.now.target.lerp(c.goal.target, k);
      const d = c.now.dist * (camera.userData.fit as number);
      // look a little in front of the subject, so it sits above the card at the bottom
      aim.set(Math.cos(c.now.theta), 0, Math.sin(c.now.theta)).multiplyScalar(d * 0.1).add(c.now.target);
      camera.position.set(
        aim.x + d * Math.sin(c.now.phi) * Math.cos(c.now.theta),
        aim.y + d * Math.cos(c.now.phi),
        aim.z + d * Math.sin(c.now.phi) * Math.sin(c.now.theta)
      );
      camera.lookAt(aim);

      // pins: the chosen one rises a little and grows
      for (const pin of pinGroup.children) {
        const on = pin.userData.id === selectedId && !pin.userData.big;
        const s = pin.userData.big ? 1.45 : on ? 1.3 : 1;
        pin.scale.setScalar(pin.scale.x + (s - pin.scale.x) * (still ? 1 : 1 - Math.pow(0.001, dt)));
        const ring = pin.getObjectByName('pulse') as THREE.Mesh | undefined;
        if (ring) {
          const ph = still ? 0.5 : (time / 1800) % 1;
          ring.scale.setScalar(1 + ph * 2.2);
          (ring.material as THREE.MeshBasicMaterial).opacity = still ? 0.3 : 0.55 * (1 - ph);
        }
      }

      // the dot's rings widen while it's finding you
      for (const ring of gpsGroup.children[0]?.children ?? []) {
        if (ring.name !== 'finding') continue;
        const mat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (!finding || still) {
          mat.opacity = finding ? 0.3 : 0;
          ring.scale.setScalar(finding ? 2.5 : 1);
          continue;
        }
        const ph = (time / 1600 + (ring.userData.phase as number)) % 1;
        ring.scale.setScalar(1 + ph * 5);
        mat.opacity = 0.5 * (1 - ph);
      }

      // the route draws itself in, then a bead walks it
      const tube = routeGroup.getObjectByName('tube') as THREE.Mesh | undefined;
      if (tube) {
        routeGroup.visible = !finding;
        if (!finding && !c.routeAt) c.routeAt = time;
        const geo = tube.geometry as THREE.TubeGeometry;
        const total = geo.index ? geo.index.count : 0;
        const prog = still ? 1 : c.routeAt ? Math.min(1, (time - c.routeAt) / ROUTE_IN_MS) : 0;
        geo.setDrawRange(0, Math.floor((total * prog) / 6) * 6);
        const bead = routeGroup.getObjectByName('bead');
        const path = routeGroup.userData.path as THREE.CurvePath<THREE.Vector3> | undefined;
        if (bead && path) {
          bead.visible = prog >= 1;
          const u = still ? 1 : ((time - c.routeAt - ROUTE_IN_MS) / 5200) % 1;
          if (bead.visible) bead.position.copy(path.getPointAt(Math.max(0, Math.min(1, u)))).add(new THREE.Vector3(0, 0.25, 0));
        }
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    // stop drawing while the tab is hidden
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (document.visibilityState === 'visible') {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      dispose(scene);
      renderer.dispose();
      canvas.remove();
      ctx.current = null;
    };
  }, []);

  useEffect(() => {
    const c = ctx.current;
    if (!c) return;
    clear(c.board);
    c.board.add(buildBoard(terrain));
  }, [terrain, failed]);

  useEffect(() => {
    const c = ctx.current;
    if (!c) return;
    clear(c.pins);
    for (const p of pins) if (p.id !== target?.id) c.pins.add(makePin(terrain, p, false));
    if (target) c.pins.add(makePin(terrain, target, true));
  }, [terrain, pins, target, failed]);

  useEffect(() => {
    const c = ctx.current;
    if (!c) return;
    clear(c.gps);
    c.gps.add(makeGps(terrain, gps));
  }, [terrain, gps, failed]);

  useEffect(() => {
    const c = ctx.current;
    if (!c) return;
    clear(c.route);
    c.route.userData = {};
    c.routeAt = 0;
    if (route) {
      const r = makeRoute(terrain, route);
      c.route.add(...r.children);
      c.route.userData.path = r.userData.path;
    }
  }, [terrain, route, failed]);

  // framing follows what's on the board; recentre flies home
  useEffect(() => {
    const c = ctx.current;
    if (!c) return;
    c.home = frame(gps, target?.point, 150);
    // keep whatever side they've turned the board to
    c.goal = { ...copyOrbit(c.home), theta: c.goal.theta };
    // recentre: the same height and distance, but centred on the dot
    if (recentreKey > 0) c.goal.target.set(gps.x, 0, gps.z);
    if (live.current.reducedMotion) c.now = copyOrbit(c.goal);
  }, [gps, target, recentreKey, failed]);

  if (failed) return <IsoScene {...props} />;
  return <View ref={host} style={styles.host} />;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: PALETTE.paper, overflow: 'hidden' },
});
