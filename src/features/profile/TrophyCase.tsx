import { StyleSheet, View } from 'react-native';
import { useScreen } from '@/ui';
import { BADGES } from '@/data/badges';
import { Decor, Text, space } from '@/theme';
import type { EarnedBadge } from '@/types';
import { BadgeCard } from './BadgeCard';

const COLS = 3;
const GAP = space.md;

/** Every badge: earned ones first as tilt cards, locked ones as frosted silhouettes */
export function TrophyCase({ earned }: { earned: EarnedBadge[] }) {
  const { width } = useScreen();
  const cell = Math.floor((Math.min(width, 430) - space.xl * 2 - GAP * (COLS - 1)) / COLS);
  const byId = new Map(earned.map((e) => [e.id, e]));
  const sorted = [...BADGES].sort((a, b) => Number(byId.has(b.id)) - Number(byId.has(a.id)));
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.head}>
        <Decor name="lion" width={34} />
        <Text variant="title" style={{ flex: 1 }}>Trophy case</Text>
        <Text variant="accent">
          ({earned.length}/{BADGES.length})
        </Text>
      </View>
      <View style={styles.grid}>
        {sorted.map((b) => (
          <BadgeCard key={b.id} badge={b} earned={byId.get(b.id)} width={cell} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: space.xl },
});
