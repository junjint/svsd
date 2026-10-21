import { StyleSheet, View } from 'react-native';
import { Barcode, DashRule, Text, TornPaper, color, fonts, rarityColor, receiptInk, shadow, space } from '@/theme';
import type { DrawnSidequest } from '@/types';
import { Photo } from '@/features/folders/Photo';

/* The quest's picture: the place photo feathered onto paper, or, when the
   place has none, a torn receipt with the place set big. */
export function QuestHero({ quest, width }: { quest: DrawnSidequest; width: number }) {
  const h = Math.round(width * 0.62);
  if (quest.placePhotoUrl) {
    return <Photo uri={quest.placePhotoUrl} feather={18} style={[{ width, height: h }, shadow.float]} />;
  }
  const r = rarityColor[quest.rarity];
  const date = new Date(quest.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
  return (
    <TornPaper seed={quest.id} style={{ width }} contentStyle={[styles.ticket, { minHeight: h }]}>
      <View style={styles.row}>
        <Text style={[receiptInk, styles.stamp]}>SIDEQUEST</Text>
        <Text style={[receiptInk, styles.stamp]}>{r.label.toUpperCase()}</Text>
      </View>
      <DashRule />
      <Text style={styles.place} numberOfLines={3}>
        {quest.placeName}
      </Text>
      <DashRule />
      <View style={styles.row}>
        <Text style={[receiptInk, styles.stamp]}>{quest.cityLabel.toUpperCase()}</Text>
        <Text style={[receiptInk, styles.stamp]}>{date}</Text>
      </View>
      <Barcode seed={quest.id} width={width - 64} height={22} />
    </TornPaper>
  );
}

const styles = StyleSheet.create({
  ticket: { paddingHorizontal: space.xl, paddingVertical: space.lg, gap: space.sm, justifyContent: 'space-between' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  stamp: { fontSize: 10, letterSpacing: 1.2 },
  place: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 36, color: color.ink, letterSpacing: -0.4, flex: 1, paddingVertical: space.sm },
});
