'use dom';

import '../bencho-theme.css';
import '../blocks/ScratchCard.css';
import './reveal.css';
import type { DOMProps } from 'expo/dom';
import { ScratchCard, type Foil } from '../blocks/ScratchCard';
import { ActivityFaceHTML, useSerifReady, type RarityKey } from './revealParts';

/** The activity under the same foil as the place card */
export default function ActivityScratchDom(p: {
  text: string;
  rarity: RarityKey;
  width: number;
  height: number;
  foil: Foil;
  revealNow?: boolean;
  onTick: () => Promise<void>;
  onRevealed: () => Promise<void>;
  dom?: DOMProps;
}) {
  useSerifReady();
  return (
    <ScratchCard
      width={p.width}
      height={p.height}
      foil={p.foil}
      corner={22}
      brush={34}
      reveal={55}
      revealNow={p.revealNow}
      onTick={p.onTick}
      onRevealed={p.onRevealed}
      prize={<ActivityFaceHTML text={p.text} rarity={p.rarity} />}
    />
  );
}
