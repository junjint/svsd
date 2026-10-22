import { StyleSheet, View } from 'react-native';
import { Text, TornPaper, color, receiptInk, space } from '@/theme';
import type { BadgeDef } from '@/data/badges';
import type { EarnedBadge } from '@/types';
import { Lock } from '@/features/folders/icons';
import { shortDate } from '@/features/folders/format';
import { BadgeArt } from './BadgeArt';

/* A trophy-case tile: a torn receipt stub. Earned: the chrome badge art,
   the name, the day. Locked: the same stub, faded, with a lock. */

export function BadgeCard({ badge, earned, width, big = false }: { badge: BadgeDef; earned?: EarnedBadge; width: number; big?: boolean }) {
  const height = width * 1.12;
  const tilt = ((badge.id.length * 7) % 5) - 2;
  return (
    <View
      accessible
      accessibilityLabel={earned ? `${badge.name}, earned ${shortDate(earned.earnedAt)}` : `${badge.name}, locked. ${badge.rule}`}
      style={{ width, opacity: earned ? 1 : 0.5, transform: [{ rotate: `${earned ? tilt * 0.6 : 0}deg` }] }}
    >
      <TornPaper seed={`badge-${badge.id}`} contentStyle={[styles.face, { minHeight: height, padding: big ? space.xl : space.sm }]}>
        <View>
          <BadgeArt art={badge.art} size={width * (big ? 0.5 : 0.56)} />
          {!earned && (
            <View style={styles.lockPin}>
              <Lock size={9} />
            </View>
          )}
        </View>
        <Text style={[receiptInk, styles.name, big && { fontSize: 16, lineHeight: 20 }]} numberOfLines={2}>
          {badge.name.toUpperCase()}
        </Text>
        {big ? (
          <Text variant="caption" style={{ color: color.ink2, textAlign: 'center' }}>
            {badge.rule}
          </Text>
        ) : earned ? (
          <Text style={[receiptInk, styles.date]}>{shortDate(earned.earnedAt).toUpperCase()}</Text>
        ) : null}
      </TornPaper>
    </View>
  );
}

const styles = StyleSheet.create({
  face: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  name: { fontSize: 10, lineHeight: 13, letterSpacing: 0.6, textAlign: 'center', alignSelf: 'stretch' },
  date: { fontSize: 8.5, letterSpacing: 0.8, opacity: 0.7 },
  lockPin: { position: 'absolute', right: -10, bottom: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: color.line },
});
