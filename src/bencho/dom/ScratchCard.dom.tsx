'use dom';

import '../bencho-theme.css';
import '../blocks/ScratchCard.css';
import './reveal.css';
import type { DOMProps } from 'expo/dom';
import { ScratchCard, type Foil } from '../blocks/ScratchCard';
import { PlaceCardHTML, type PlaceCardData } from './revealParts';

export default function ScratchCardDom(p: {
  place: PlaceCardData;
  width: number;
  height: number;
  foil: Foil;
  aim?: { u: number; v: number };
  revealNow?: boolean;
  onTick: () => Promise<void>;
  onRevealed: () => Promise<void>;
  dom?: DOMProps;
}) {
  return (
    <ScratchCard
      width={p.width}
      height={p.height}
      foil={p.foil}
      corner={22}
      brush={34}
      reveal={55}
      aim={p.aim}
      revealNow={p.revealNow}
      onTick={p.onTick}
      onRevealed={p.onRevealed}
      prize={<PlaceCardHTML place={p.place} width={p.width} height={p.height} />}
    />
  );
}
