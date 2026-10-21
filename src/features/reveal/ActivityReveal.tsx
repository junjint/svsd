import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import ActivityScratchDom from '@/bencho/dom/ActivityScratch.dom';
import CardFanDom from '@/bencho/dom/CardFan.dom';
import CoinTossDom from '@/bencho/dom/CoinToss.dom';
import OptionWheelDom from '@/bencho/dom/OptionWheel.dom';
import { feedback } from '@/services/sound';
import { radius, shadow } from '@/theme';
import { activityText, foilFor } from './content';
import { RevealHint } from './RevealHint';
import { SkipButton } from './SkipButton';
import { useRevealFinish } from './useRevealFinish';
import type { ActivityRevealProps } from './types';

const MAX = { cards: 3, coin: 2, wheel: 6 } as const;

/**
 * Stage 2: the activity under scratch foil (the default), or one of the
 * choice reveals — pick a card, toss a coin, spin the drum — which land
 * on one of `options` and report it through onChoose before onRevealed.
 */
export function ActivityReveal(p: ActivityRevealProps) {
  const { done, forced, finish, skip } = useRevealFinish({
    rarity: p.rarity,
    end: 'activityRevealed',
    revealNow: p.revealNow,
    onRevealed: p.onRevealed,
  });
  const choice = p.style === 'cards' || p.style === 'coin' || p.style === 'wheel' ? p.style : null;
  const options = useMemo(() => (choice ? p.options.slice(0, MAX[choice]) : p.options.slice(0, 1)), [choice, p.options]);
  /* a choice reveal needs something to choose between; else it is scratch */
  const style = choice && options.length >= 2 ? choice : 'scratch';
  const texts = useMemo(() => options.map((a) => activityText(a, p.partySize)), [options, p.partySize]);
  const [hint, setHint] = useState<string | null>(
    style === 'scratch' ? 'Scratch to see what' : style === 'cards' ? 'Pick a card' : style === 'wheel' ? 'Flick the drum' : null
  );
  /* the coin's landing side is decided up front, once */
  const coinSide = useRef(Math.random() < 0.5 ? 0 : 1).current;

  const chosen = useRef(false);
  const choose = useCallback(
    (i: number) => {
      if (chosen.current) return;
      chosen.current = true;
      const pick = options[i] ?? options[0];
      if (pick) p.onChoose?.(pick.id);
      finish('natural');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options, finish, p.onChoose]
  );

  /* Skip on a choice reveal lands on the default, options[0] */
  const skipNow = useCallback(() => {
    if (style !== 'scratch' && !chosen.current) {
      chosen.current = true;
      if (options[0]) p.onChoose?.(options[0].id);
    }
    skip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, options, skip, p.onChoose]);
  const forcedPick = forced ? 0 : null;
  useEffect(() => {
    /* revealNow / Reduce Motion: report the default pick too */
    if (forced && style !== 'scratch' && !chosen.current && options[0]) {
      chosen.current = true;
      p.onChoose?.(options[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forced]);

  const onScratch = useCallback(async () => {
    setHint(null);
    feedback('scratchTick');
  }, []);
  const onScratchDone = useCallback(async () => finish('natural'), [finish]);
  const onPick = useCallback(async (i: number) => {
    setHint(null);
    choose(i);
  }, [choose]);
  const onSpinTick = useCallback(async () => {
    setHint(null);
    feedback('scratchTick');
  }, []);
  const onFlip = useCallback(async () => feedback('scratchTick'), []);

  const size = { width: p.width, height: p.height };
  const dom = { scrollEnabled: false, style: size };
  const shown = done ? texts[0] : undefined;

  return (
    <View
      style={[size, { borderRadius: radius.card }, style === 'scratch' || style === 'wheel' ? shadow.float : null]}
      accessibilityLabel={shown && style === 'scratch' ? shown : undefined}
    >
      <View style={[size, { borderRadius: radius.card, overflow: style === 'cards' ? 'visible' : 'hidden' }]}>
        {style === 'scratch' && (
          <ActivityScratchDom text={texts[0] ?? ''} rarity={p.rarity} {...size} foil={foilFor(p.rarity)} revealNow={forced} onTick={onScratch} onRevealed={onScratchDone} dom={dom} />
        )}
        {style === 'cards' && <CardFanDom texts={texts} rarity={p.rarity} {...size} pickNow={forcedPick} onPick={onPick} dom={dom} />}
        {style === 'coin' && (
          <CoinTossDom texts={texts} metal={foilFor(p.rarity)} {...size} result={coinSide} landNow={forcedPick} onFlip={onFlip} onLand={onPick} dom={dom} />
        )}
        {style === 'wheel' && <OptionWheelDom texts={texts} {...size} spinTo={forcedPick} onTick={onSpinTick} onLand={onPick} dom={dom} />}
      </View>
      <RevealHint text={done ? null : hint} />
      <SkipButton visible={!done} onPress={skipNow} />
    </View>
  );
}
