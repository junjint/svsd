'use dom';

import type { CSSProperties } from 'react';
import '../bencho-theme.css';
import '../blocks/OptionWheel.css';
import './reveal.css';
import type { DOMProps } from 'expo/dom';
import { OptionWheel } from '../blocks/OptionWheel';
import { SERIF, useSerifReady } from './revealParts';

/** The drum looks empty with two words on it, so go round the options
    as many times as it takes to fill eight slots */
const fill = (texts: string[]) => {
  const out: string[] = [];
  while (out.length < Math.max(8, texts.length)) out.push(...texts);
  return out;
};

export default function OptionWheelDom(p: {
  texts: string[];
  width: number;
  height: number;
  spinTo?: number | null;
  onTick: () => Promise<void>;
  onLand: (i: number) => Promise<void>;
  dom?: DOMProps;
}) {
  useSerifReady();
  const items = fill(p.texts);
  const n = p.texts.length;
  return (
    <div className="rv-wheel" style={{ width: p.width, height: p.height, ['--font-ui' as string]: SERIF } as CSSProperties}>
      <div className="rv-wheel-band" aria-hidden="true" />
      <OptionWheel
        items={items}
        width={p.width}
        height={p.height}
        size={26}
        step={60}
        tilt={60}
        blur={3}
        start={0}
        label="Activities"
        spinTo={p.spinTo}
        onTick={p.onTick}
        onLand={(i) => p.onLand(i % n)}
      />
    </div>
  );
}
