import { useEffect, useState } from 'react';
import { LOGO_URI } from './logoData';

/* Shared HTML for the reveal surfaces (our own code). Rendered inside
   the 'use dom' wrappers, styled by ./reveal.css. Everything here takes
   plain serializable data so the native side can pass it straight in. */

export type RarityKey = 'common' | 'rare' | 'legendary';

export interface PlaceCardData {
  city: string;
  name: string;
  distance: string;
  /** small line under the distance: "Open now · $" */
  meta?: string;
  photoUrl?: string;
  rarity: RarityKey;
}

/** EB Garamond on web (expo-font registers this family), Google Fonts
    inside the native webview, Georgia as the fallback */
export const SERIF = 'EBGaramond_400Regular, "EB Garamond", Georgia, serif';
/** Inter, the interface face, the same two ways */
export const SANS = '"Inter", Inter_400Regular, -apple-system, system-ui, sans-serif';

const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=EB+Garamond:ital@0;1&family=Inter:wght@400;500;600;700&display=swap';

/** Make sure the serif is available, then say so. Never waits more than ~900ms */
export function useSerifReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const done = () => live && setReady(true);
    try {
      if (typeof document === 'undefined') {
        done();
        return;
      }
      if (!document.querySelector(`link[href="${FONT_LINK}"]`)) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = FONT_LINK;
        document.head.appendChild(l);
      }
      const timeout = new Promise((r) => setTimeout(r, 900));
      const load = document.fonts
        ? Promise.all([document.fonts.load(`400 40px ${SERIF}`), document.fonts.load(`italic 400 20px ${SERIF}`)])
        : Promise.resolve();
      Promise.race([load, timeout]).then(done, done);
    } catch {
      done();
    }
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

const RARITY_LABEL: Record<RarityKey, string> = { common: 'Common', rare: 'Rare', legendary: 'Legendary' };

/** Demo data carries a "[DEMO] " prefix; show it as a quiet tag instead */
function splitDemo(name: string) {
  const m = /^\[DEMO\]\s*/i.exec(name);
  return m ? { demo: true, name: name.slice(m[0].length) } : { demo: false, name };
}

/** The place, as the prize under the foil / sticker */
export function PlaceCardHTML({ place, width, height }: { place: PlaceCardData; width: number; height: number }) {
  const { demo, name } = splitDemo(place.name);
  /* long names step down so they never break mid-word */
  const big = Math.round(Math.min(width * 0.15, name.length > 26 ? width * 0.1 : name.length > 16 ? width * 0.125 : width * 0.15));
  return (
    <div className="rv-place" data-rarity={place.rarity} data-photo={place.photoUrl ? true : undefined} style={{ width, height, fontFamily: 'var(--font-ui)' }}>
      {place.rarity !== 'common' && <span className="rv-rarity">{RARITY_LABEL[place.rarity]}</span>}
      {place.photoUrl && (
        <div className="rv-photo">
          <img src={place.photoUrl} alt="" draggable={false} />
        </div>
      )}
      <div className="rv-place-text">
        <p className="rv-lead" style={{ fontFamily: SERIF }}>
          While you’re in {place.city}, go to
        </p>
        <h2 className="rv-name" style={{ fontFamily: SERIF, fontSize: big }}>
          {name}
        </h2>
        <p className="rv-distance">
          {place.distance}
          {demo && <span className="rv-demo">Demo</span>}
        </p>
        {place.meta ? <p className="rv-meta">{place.meta}</p> : null}
      </div>
    </div>
  );
}

/** The back of a face-down card: rarity tint, a star, the logo, fine border */
export function CardBackHTML({ rarity }: { rarity: RarityKey }) {
  return (
    <div className="rv-back" data-rarity={rarity}>
      <span className="rv-back-star" style={{ fontFamily: SERIF }}>
        ✦
      </span>
      <img className="rv-back-word" src={LOGO_URI} alt="Sidequest" draggable={false} />
    </div>
  );
}

/** An activity on the face of a card */
export function ActivityFaceHTML({ text, rarity }: { text: string; rarity: RarityKey }) {
  const size = text.length > 44 ? 17 : text.length > 26 ? 20 : 24;
  return (
    <div className="rv-face" data-rarity={rarity}>
      <span className="rv-face-kicker">Your sidequest</span>
      <span className="rv-face-text" style={{ fontFamily: SERIF, fontSize: size }}>
        {text}
      </span>
    </div>
  );
}

/** The sticker over the peel reveal */
export function StickerHTML({ rarity }: { rarity: RarityKey }) {
  return (
    <div className="rv-sticker" data-rarity={rarity}>
      <span className="rv-sticker-star" style={{ fontFamily: SERIF }}>
        ✦
      </span>
      <img className="rv-sticker-word" src={LOGO_URI} alt="Sidequest" draggable={false} />
      <span className="rv-sticker-hint">Peel from the corner</span>
    </div>
  );
}
