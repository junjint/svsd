import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import ScratchCardDom from '@/bencho/dom/ScratchCard.dom';
import PagePeelDom from '@/bencho/dom/PagePeel.dom';
import { feedback } from '@/services/sound';
import { radius, shadow } from '@/theme';
import { foilFor, placeCard } from './content';
import { RevealHint } from './RevealHint';
import { SkipButton } from './SkipButton';
import { useDeviceAim } from './useDeviceAim';
import { useRevealFinish } from './useRevealFinish';
import type { PlaceRevealProps } from './types';

/**
 * Stage 1: the place under foil (scratch, the default) or under a
 * sticker (peel). The foil's colour tells the rarity before you start.
 */
export function PlaceReveal(p: PlaceRevealProps) {
  const { done, forced, finish, skip, reduceMotion } = useRevealFinish({
    rarity: p.rarity,
    end: 'placeRevealed',
    revealNow: p.revealNow,
    onRevealed: p.onRevealed,
  });
  const [touched, setTouched] = useState(false);
  const data = useMemo(
    () => placeCard(p.place, p.cityLabel, p.distanceLabel, p.rarity),
    [p.place, p.cityLabel, p.distanceLabel, p.rarity]
  );
  const peel = p.style === 'peel';
  /* the holo only needs the light to move when there is holo on it */
  const aim = useDeviceAim(!peel && !done && !reduceMotion);

  const onTick = useCallback(async () => {
    setTouched(true);
    feedback('scratchTick');
  }, []);
  const onRevealed = useCallback(async () => finish('natural'), [finish]);

  const size = { width: p.width, height: p.height };
  const dom = { scrollEnabled: false, style: size };

  return (
    <View
      style={[size, { borderRadius: radius.card }, shadow.float]}
      accessible={done}
      accessibilityLabel={done ? `While you're in ${p.cityLabel}, go to ${p.place.name}. ${p.distanceLabel}` : undefined}
    >
      <View style={[size, { borderRadius: radius.card, overflow: peel ? 'visible' : 'hidden' }]}>
        {peel ? (
          <PagePeelDom place={data} {...size} revealNow={forced} onTick={onTick} onRevealed={onRevealed} dom={dom} />
        ) : (
          <ScratchCardDom place={data} {...size} foil={foilFor(p.rarity)} aim={aim} revealNow={forced} onTick={onTick} onRevealed={onRevealed} dom={dom} />
        )}
      </View>
      <RevealHint text={touched || done ? null : peel ? 'Peel the corner' : 'Scratch to see where'} />
      <SkipButton visible={!done} onPress={skip} />
    </View>
  );
}
