'use dom';

import '../bencho-theme.css';
import '../blocks/CardFan.css';
import './reveal.css';
import type { DOMProps } from 'expo/dom';
import { CardFan } from '../blocks/CardFan';
import { ActivityFaceHTML, CardBackHTML, useSerifReady, type RarityKey } from './revealParts';

export default function CardFanDom(p: {
  texts: string[];
  rarity: RarityKey;
  width: number;
  height: number;
  pickNow?: number | null;
  onPick: (i: number) => Promise<void>;
  dom?: DOMProps;
}) {
  useSerifReady();
  return (
    <CardFan
      width={p.width}
      height={p.height}
      spread={100}
      corner={18}
      cards={p.texts.map((t, i) => <ActivityFaceHTML key={i} text={t} rarity={p.rarity} />)}
      labels={p.texts}
      back={<CardBackHTML rarity={p.rarity} />}
      pickNow={p.pickNow}
      onPick={p.onPick}
    />
  );
}
