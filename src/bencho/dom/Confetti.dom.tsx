'use dom';

import '../bencho-theme.css';
import '../blocks/Confetti.css';
import type { DOMProps } from 'expo/dom';
import { Confetti } from '../blocks/Confetti';

export default function ConfettiDom(p: {
  width: number;
  height: number;
  /** each increment is one burst */
  fire: number;
  onDone: () => Promise<void>;
  dom?: DOMProps;
}) {
  return (
    <Confetti
      width={p.width}
      height={p.height}
      fire={p.fire}
      amount={150}
      spread={110}
      power={Math.max(1, p.height / 420)}
      origin={{ x: 0.5, y: 0.58 }}
      onDone={p.onDone}
    />
  );
}
