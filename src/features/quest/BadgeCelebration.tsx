import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useIsFocused } from 'expo-router';
import Animated, { ZoomIn, useReducedMotion, FadeIn } from 'react-native-reanimated';
import { BADGES } from '@/data/badges';
import { BadgeCard } from '@/features/profile/BadgeCard';
import { ConfettiBurst } from '@/features/reveal';
import { feedback } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { PillButton, Text, color, space } from '@/theme';
import type { BadgeId } from '@/types';
import { Sheet } from '@/ui';
import { BADGE_LINES } from './badgeCopy';

/**
 * Drains store.badgeQueue one badge at a time: a sheet with the badge as a
 * tilt card, confetti and the Bell. Mounted on each screen a badge can
 * land on (Library, Draw, Profile, gallery).
 */
export function BadgeCelebration({ delayMs = 700 }: { delayMs?: number }) {
  const queued = useSidequestStore((s) => s.badgeQueue.length);
  const shiftBadge = useSidequestStore((s) => s.shiftBadge);
  const earned = useSidequestStore((s) => s.badges);
  const [current, setCurrent] = useState<BadgeId | null>(null);
  const [fire, setFire] = useState(false);
  const still = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // mounted on several screens; only the one in front celebrates
  const focused = useIsFocused();

  useEffect(() => {
    if (!focused || current || queued === 0) return;
    timer.current = setTimeout(() => {
      const next = shiftBadge();
      if (!next) return;
      setCurrent(next);
      setFire(true);
      feedback('badgeUnlocked');
    }, delayMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [focused, current, queued, shiftBadge, delayMs]);

  const badge = BADGES.find((b) => b.id === current);
  const got = earned.find((b) => b.id === current);
  const close = () => {
    setFire(false);
    setCurrent(null);
  };

  return (
    <>
      <Sheet visible={!!badge} onClose={close} title={badge ? `New badge: ${badge.name}` : undefined}>
        {badge && (
          <View style={{ alignItems: 'center', gap: space.lg }}>
            <Text variant="body" style={{ color: color.ink2, alignSelf: 'stretch' }}>
              {BADGE_LINES[badge.id]}
            </Text>
            <Animated.View entering={still ? FadeIn : ZoomIn.delay(80).springify().damping(12).stiffness(140)}>
              <BadgeCard badge={badge} earned={got ?? { id: badge.id, earnedAt: new Date().toISOString() }} width={190} big />
            </Animated.View>
            <PillButton label={queued > 0 ? 'Next badge' : 'Nice'} sound={null} onPress={close} style={{ alignSelf: 'stretch' }} />
          </View>
        )}
      </Sheet>
      <ConfettiBurst fire={fire} onDone={() => setFire(false)} />
    </>
  );
}
