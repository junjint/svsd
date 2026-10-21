import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { DashRule, Text, TornPaper, color, fonts, receiptInk, space } from '@/theme';
import { useScreen } from '@/ui';
import type { DrawnSidequest } from '@/types';

/* The "On the go" strip: in-progress quests first, then saved-for-later. */
export function QuestStrip({ active, saved, onOpen }: { active: DrawnSidequest[]; saved: DrawnSidequest[]; onOpen: (q: DrawnSidequest) => void }) {
  const all = [...active.map((q) => ({ q, saved: false })), ...saved.map((q) => ({ q, saved: true }))];
  // each slip spans the page; more than one pages sideways
  const cardW = useScreen().width - space.xl * 2;
  if (!all.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: space.xl, gap: space.md, paddingBottom: space.xl, paddingTop: space.sm }}
      decelerationRate="fast"
      snapToInterval={cardW + space.md}
      snapToAlignment="start"
    >
      {all.map(({ q, saved }) => (
        <QuestCard key={q.id} quest={q} saved={saved} width={cardW} onPress={() => onOpen(q)} />
      ))}
    </ScrollView>
  );
}

/** A torn receipt slip: a stamp and the activity. Nothing else */
function QuestCard({ quest, saved, width, onPress }: { quest: DrawnSidequest; saved: boolean; width: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${saved ? 'Saved' : 'In progress'}: ${quest.activityText} at ${quest.placeName}`}
      onPress={onPress}
      style={({ pressed }) => ({ width, transform: [{ scale: pressed ? 0.98 : 1 }, { rotate: saved ? '0.4deg' : '-0.4deg' }] })}
    >
      <TornPaper seed={quest.id} contentStyle={styles.slip}>
        <Text style={[receiptInk, styles.stamp]}>{saved ? 'SAVED' : '● IN PROGRESS'}</Text>
        <DashRule />
        <Text style={styles.activity} numberOfLines={3}>
          {quest.activityText}
        </Text>
      </TornPaper>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slip: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16, gap: 8 },
  stamp: { fontSize: 9.5, letterSpacing: 0.8 },
  activity: { fontFamily: fonts.serif, fontSize: 25, lineHeight: 28, color: color.ink, letterSpacing: -0.2 },
});
