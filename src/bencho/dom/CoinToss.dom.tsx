'use dom';

import { useEffect, useRef, useState } from 'react';
import '../bencho-theme.css';
import './reveal.css';
import type { DOMProps } from 'expo/dom';
import { SERIF, useSerifReady } from './revealParts';

/* Our own coin, not the Bencho block: Bencho's `coin` is three.js,
   which the app does not ship. This keeps the block's feel: it hangs
   and bobs, a flick throws it, it spins on the speed you gave it and
   lands. Heads (A) is the first option, tails (B) the second. */

type Metal = 'silver' | 'holo' | 'gold';

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export default function CoinTossDom(p: {
  texts: string[];
  metal: Metal;
  width: number;
  height: number;
  /** the side it lands on when tossed, chosen by the native side (0 | 1) */
  result: number;
  /** land on this side at once: Skip, Reduce Motion */
  landNow?: number | null;
  onFlip: () => Promise<void>;
  onLand: (i: number) => Promise<void>;
  dom?: DOMProps;
}) {
  useSerifReady();
  const coin = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState<number | null>(null);
  const st = useRef({ raf: 0, busy: false, done: false, downY: 0, downT: 0, lastY: 0, lastT: 0, v: 0, rot: 0, t0: performance.now() });
  const size = Math.round(Math.min(p.width * 0.48, p.height * 0.34));

  const paint = (y: number, rx: number, ry: number, squash = 1) => {
    const c = coin.current;
    if (c) c.style.transform = `translateY(${y.toFixed(1)}px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) scale(${squash.toFixed(3)}, ${(2 - squash).toFixed(3)})`;
  };

  /* idle: a slow bob and a little turn, as the block hangs in the air */
  useEffect(() => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const s = st.current;
    const idle = (now: number) => {
      if (s.busy || s.done) return;
      const t = (now - s.t0) / 1000;
      paint(still ? 0 : Math.sin(t * 1.3) * 5, s.rot, still ? 0 : Math.sin(t * 0.8) * 14);
      s.raf = requestAnimationFrame(idle);
    };
    s.raf = requestAnimationFrame(idle);
    return () => cancelAnimationFrame(s.raf);
  }, []);

  const finish = (i: number) => {
    const s = st.current;
    if (s.done) return;
    s.done = true;
    setLanded(i);
    void p.onLand(i);
  };

  /* thrown with an upward speed (px/s): higher and more turns the harder */
  const toss = (speed: number) => {
    const s = st.current;
    if (s.busy || s.done) return;
    s.busy = true;
    cancelAnimationFrame(s.raf);
    const k = Math.min(1, Math.max(0.35, speed / 2400));
    const rise = p.height * (0.28 + 0.2 * k);
    const half = 2 * Math.round(3 + 5 * k) + (p.result ? 1 : 0); // half-turns, ending on the result
    const from = s.rot;
    const to = Math.ceil(from / 360) * 360 + half * 180;
    const dur = 900 + 600 * k;
    const t0 = performance.now();
    let lastHalf = Math.floor(from / 180);
    const fly = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const y = -4 * rise * t * (1 - t);
      const rx = from + (to - from) * ease(t);
      const h = Math.floor(rx / 180);
      if (h !== lastHalf) { lastHalf = h; void p.onFlip(); }
      paint(y, rx, 0);
      if (t < 1) { s.raf = requestAnimationFrame(fly); return; }
      s.rot = to;
      /* the landing: a squash, then still */
      const l0 = performance.now();
      const land = (n: number) => {
        const u = Math.min(1, (n - l0) / 260);
        paint(0, to, 0, 1 + Math.sin(u * Math.PI) * 0.06 * (1 - u));
        if (u < 1) s.raf = requestAnimationFrame(land);
        else finish(p.result ? 1 : 0);
      };
      s.raf = requestAnimationFrame(land);
    };
    s.raf = requestAnimationFrame(fly);
  };

  useEffect(() => {
    const s = st.current;
    if (p.landNow == null || s.done) return;
    cancelAnimationFrame(s.raf);
    s.rot = p.landNow ? 180 : 0;
    paint(0, s.rot, 0);
    finish(p.landNow ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.landNow]);

  return (
    <div
      className="rv-coin-stage"
      data-landed={landed !== null || undefined}
      style={{ width: p.width, height: p.height }}
      onPointerDown={(e) => {
        const s = st.current;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* scripted pointer */ }
        s.downY = s.lastY = e.clientY;
        s.downT = s.lastT = performance.now();
        s.v = 0;
      }}
      onPointerMove={(e) => {
        const s = st.current;
        if (!s.downT) return;
        const now = performance.now();
        const dt = Math.max(8, now - s.lastT) / 1000;
        /* smoothed, so one jittery frame cannot fake a flick */
        s.v = s.v * 0.5 + ((s.lastY - e.clientY) / dt) * 0.5;
        s.lastY = e.clientY;
        s.lastT = now;
      }}
      onPointerUp={() => {
        const s = st.current;
        if (!s.downT) return;
        const moved = s.downY - s.lastY;
        const paused = performance.now() - s.lastT > 120;
        s.downT = 0;
        /* a flick up throws it; a tap gives it a gentle toss */
        if (moved > 12 && !paused) toss(s.v);
        else if (Math.abs(moved) < 8) toss(900);
      }}
      role="button"
      aria-label={landed === null ? 'Coin. Flick it up to toss it' : `Landed on ${landed ? 'B' : 'A'}: ${p.texts[landed] ?? ''}`}
    >
      <div className="rv-coin-air" style={{ width: size, height: size }}>
        <div ref={coin} className="rv-coin" data-metal={p.metal} style={{ width: size, height: size }}>
          <div className="rv-coin-face"><span style={{ fontFamily: SERIF, fontSize: size * 0.42 }}>A</span></div>
          <div className="rv-coin-face rv-coin-tails"><span style={{ fontFamily: SERIF, fontSize: size * 0.42 }}>B</span></div>
        </div>
        <div className="rv-coin-shadow" />
      </div>
      <div className="rv-coin-options">
        {p.texts.slice(0, 2).map((t, i) => (
          <div key={i} className="rv-coin-option" data-on={landed === i || undefined}>
            <b style={{ fontFamily: SERIF }}>{i ? 'B' : 'A'}</b>
            <span>{t}</span>
          </div>
        ))}
      </div>
      <span className="rv-coin-hint">{landed === null ? 'Flick the coin up' : ' '}</span>
    </div>
  );
}
