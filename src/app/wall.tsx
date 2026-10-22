import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Paper, Text, color, fonts, radius, space } from '@/theme';
import { useTabBarSpace } from '@/ui';

const FILTERS = ['All', 'Nature', 'Focus', 'Snack', 'Meal'] as const;
type Filter = (typeof FILTERS)[number];
const PREVIEWS = [
  { id: '01', name: 'Maya', city: 'Ann Arbor', type: 'Nature', title: 'Take the long way home.', place: 'A riverside trail', task: 'Find a quiet spot by the water. Stay for five minutes without checking your phone.', note: 'Saw a heron. Missed absolutely nothing on my phone.', duration: '18 min', initial: 'M' },
  { id: '02', name: 'Theo', city: 'Chicago', type: 'Focus', title: 'Judge a book by its first page.', place: 'A neighborhood bookshop', task: 'Pick a book you would normally walk past. Read the first page before looking at the cover.', note: 'Went in for five minutes. Left with a new favorite author.', duration: '12 min', initial: 'T' },
  { id: '03', name: 'Jules', city: 'Portland', type: 'Snack', title: 'Order the unfamiliar.', place: 'A corner bakery', task: 'Ask for the pastry the staff would choose. Take it somewhere with a view.', note: 'A cardamom bun and a bench in the sunshine. Worth the detour.', duration: '22 min', initial: 'J' },
  { id: '04', name: 'Sam', city: 'New York', type: 'Meal', title: 'Make lunch a little adventure.', place: 'A neighborhood lunch counter', task: 'Try a dish you have never ordered. Write down three words that describe it.', note: 'Crispy. Tangy. Gone. Coming back next week.', duration: '35 min', initial: 'S' },
] as const;

export default function Wall() {
  const tabSpace = useTabBarSpace();
  const [filter, setFilter] = useState<Filter>('All');
  const shown = PREVIEWS.filter((q) => filter === 'All' || q.type === filter);
  return (
    <Paper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: tabSpace + space.xl }]}>
        <View style={styles.header}>
          <Text variant="label">THE WALL · PREVIEW</Text>
          <Text variant="display" accessibilityRole="header">Sidequesters</Text>
          <Text variant="prose">Small detours. Good stories.</Text>
          <Text variant="caption">Sample sidequests with fictional people and stories. Live community posts are coming later.</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === filter }} onPress={() => setFilter(item)} style={[styles.chip, item === filter && styles.chipSelected]}><Text variant="caption" style={{ color: item === filter ? color.white : color.ink }}>{item}</Text></Pressable>)}
        </ScrollView>
        <Text variant="label">{shown.length} little {shown.length === 1 ? 'adventure' : 'adventures'}</Text>
        {shown.map((q) => (
          <View key={q.id} style={styles.card}>
            <View style={styles.byline}>
              <View style={styles.avatar}><Text variant="headline">{q.initial}</Text></View>
              <View style={{ flex: 1 }}><Text variant="headline">{q.name}</Text><Text variant="caption">{q.city}</Text></View>
              <Text variant="label">Sample</Text>
            </View>
            <View style={styles.receipt}>
              <View style={styles.meta}><Text variant="label">{q.type} / {q.duration}</Text><Text variant="label">No. {q.id}</Text></View>
              <Text style={styles.questTitle}>{q.title}</Text>
              <Text variant="caption">{q.place}</Text>
              <Text variant="body" style={{ marginTop: space.md }}>{q.task}</Text>
              <View style={styles.stamp}><Text variant="label">✓ SIDEQUEST COMPLETED</Text></View>
            </View>
            <Text variant="prose" style={styles.note}>“{q.note}”</Text>
          </View>
        ))}
        <Text variant="caption" style={{ textAlign: 'center' }}>A little inspiration for your next draw.</Text>
      </ScrollView>
    </Paper>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingTop: space.lg, gap: space.lg },
  header: { gap: space.sm },
  filters: { gap: space.sm, paddingVertical: space.xs },
  chip: { paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.pill, backgroundColor: color.mist },
  chipSelected: { backgroundColor: color.ink },
  card: { backgroundColor: color.white, borderRadius: radius.card, borderWidth: 1, borderColor: color.line, overflow: 'hidden' },
  byline: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: color.mist, alignItems: 'center', justifyContent: 'center' },
  receipt: { marginHorizontal: space.lg, padding: space.lg, gap: space.sm, backgroundColor: color.paper, borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line, borderStyle: 'dashed' },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  questTitle: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 32, marginTop: space.sm },
  stamp: { marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderColor: color.line },
  note: { padding: space.lg, fontSize: 19, lineHeight: 25 },
});
