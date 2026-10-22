import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/* The seeded photos measured ahead of time (same formula, 32×32), so the
   banner is right on iOS too, where there's no canvas to read pixels from */
const SEEDED: Record<string, number> = {
  'photo-1453959022778-cfda85dbe0f9': 109,
  'photo-1459478309853-2c33a60058e7': 103,
  'photo-1521684497690-b384ea6d0a85': 100,
  'photo-1760883956955-31d8adb4e6d9': 96,
  'photo-1506193503569-d57d2a678510': 90,
  'photo-1582137696617-4031a8e3e268': 83,
};

const cache = new Map<string, number>();

/** "photo-…" out of an Unsplash URL */
const unsplashId = (uri: string) => uri.match(/images\.unsplash\.com\/(photo-[\w-]+)/)?.[1];

/**
 * Hasler & Süsstrunk's colourfulness: the spread and strength of the
 * red–green and yellow–blue axes. Grey street shots score ~20, a field of
 * autumn leaves ~100. Web only (canvas); elsewhere, the seeded table or 0.
 */
function measure(uri: string): Promise<number> {
  const id = unsplashId(uri);
  if (Platform.OS !== 'web' || typeof document === 'undefined') return Promise.resolve(id ? (SEEDED[id] ?? 0) : 0);
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 32, 32);
        const d = ctx.getImageData(0, 0, 32, 32).data;
        let n = 0, mrg = 0, myb = 0, srg = 0, syb = 0;
        for (let i = 0; i < d.length; i += 4) {
          const rg = d[i]! - d[i + 1]!;
          const yb = 0.5 * (d[i]! + d[i + 1]!) - d[i + 2]!;
          mrg += rg;
          myb += yb;
          srg += rg * rg;
          syb += yb * yb;
          n++;
        }
        mrg /= n;
        myb /= n;
        resolve(Math.sqrt(srg / n - mrg * mrg + syb / n - myb * myb) + 0.3 * Math.sqrt(mrg * mrg + myb * myb));
      } catch {
        resolve(id ? (SEEDED[id] ?? 0) : 0); // a photo that won't let us read it
      }
    };
    img.onerror = () => resolve(0);
    // a thumbnail is plenty to judge colour
    img.src = id ? uri.replace(/w=\d+/, 'w=64') : uri;
  });
}

async function score(uri: string) {
  const hit = cache.get(uri);
  if (hit !== undefined) return hit;
  const s = await measure(uri);
  cache.set(uri, s);
  return s;
}

/** The most colourful of `uris`; the first one until the scores come in */
export function useMostColorful(uris: string[]): string | undefined {
  const key = uris.join('|');
  const [best, setBest] = useState<string | undefined>(uris[0]);
  useEffect(() => {
    let live = true;
    setBest((b) => (b && uris.includes(b) ? b : uris[0]));
    void Promise.all(uris.map(score)).then((scores) => {
      if (!live || !uris.length) return;
      let top = 0;
      scores.forEach((s, i) => {
        if (s > scores[top]!) top = i;
      });
      setBest(uris[top]);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return best;
}
