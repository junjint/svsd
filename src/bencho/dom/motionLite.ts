import { useRef } from 'react';

/**
 * The slice of framer-motion's API that PagePeel uses: a value you can
 * get/set/watch, its velocity, and a spring `animate`. Our own code, so
 * the block runs without adding framer-motion to the app.
 */
export interface MotionValue {
  get(): number;
  set(v: number): void;
  getVelocity(): number;
  stop(): void;
  on(event: 'change', fn: (v: number) => void): () => void;
}

function motionValue(initial: number): MotionValue & { raf: number } {
  let v = initial;
  let prev = initial;
  let at = 0;
  let prevAt = 0;
  const subs = new Set<(v: number) => void>();
  const mv = {
    raf: 0,
    get: () => v,
    set(next: number) {
      prev = v;
      prevAt = at;
      v = next;
      at = performance.now();
      subs.forEach((fn) => fn(v));
    },
    /* px per second, from the last two writes; stale writes mean at rest */
    getVelocity() {
      const dt = (at - prevAt) / 1000;
      if (!at || dt <= 0 || performance.now() - at > 80) return 0;
      return (v - prev) / dt;
    },
    stop() {
      cancelAnimationFrame(mv.raf);
      mv.raf = 0;
    },
    on(_: 'change', fn: (v: number) => void) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
  };
  return mv;
}

export function useMotionValue(initial: number): MotionValue {
  const ref = useRef<ReturnType<typeof motionValue> | null>(null);
  if (!ref.current) ref.current = motionValue(initial);
  return ref.current;
}

/** A damped spring from the value's current position and speed to `to` */
export function animate(mv: MotionValue, to: number, opts: { stiffness?: number; damping?: number; mass?: number } = {}) {
  const m = mv as ReturnType<typeof motionValue>;
  const k = opts.stiffness ?? 380;
  const c = opts.damping ?? 34;
  const mass = opts.mass ?? 1;
  let x = m.get();
  let vel = m.getVelocity();
  let last = performance.now();
  m.stop();
  const step = (now: number) => {
    const dt = Math.min(1 / 30, (now - last) / 1000);
    last = now;
    for (let i = 0, n = 4, h = dt / n; i < n; i++) {
      vel += ((-k * (x - to) - c * vel) / mass) * h;
      x += vel * h;
    }
    if (Math.abs(x - to) < 0.05 && Math.abs(vel) < 1) {
      m.set(to);
      m.raf = 0;
      return;
    }
    m.set(x);
    m.raf = requestAnimationFrame(step);
  };
  m.raf = requestAnimationFrame(step);
  return { stop: () => m.stop() };
}
