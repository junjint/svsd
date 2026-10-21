'use dom';

import '../bencho-theme.css';
import '../blocks/PagePeel.css';
import './reveal.css';
import type { DOMProps } from 'expo/dom';
import { PagePeel } from '../blocks/PagePeel';
import { PlaceCardHTML, StickerHTML, type PlaceCardData } from './revealParts';

export default function PagePeelDom(p: {
  place: PlaceCardData;
  width: number;
  height: number;
  revealNow?: boolean;
  onTick: () => Promise<void>;
  onRevealed: () => Promise<void>;
  dom?: DOMProps;
}) {
  return (
    <PagePeel
      width={p.width}
      height={p.height}
      curl={46}
      reach={55}
      revealNow={p.revealNow}
      onTick={p.onTick}
      onRevealed={p.onRevealed}
      cover={<StickerHTML rarity={p.place.rarity} />}
      under={<PlaceCardHTML place={p.place} width={p.width} height={p.height} />}
    />
  );
}
