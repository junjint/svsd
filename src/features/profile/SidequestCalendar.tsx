import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { Photo } from '@/features/folders/Photo';
import { feedback } from '@/services/sound';
import { Text, color, fonts, space } from '@/theme';
import type { QuestFolder } from '@/types';
import { useScreen } from '@/ui';

const GAP = 6;
const MONTHS_BACK = 11;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** "2026-10-21" in local time, so a sidequest lands on the day it felt like */
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * How often you sidequest, as a month of circles: a day you went out
 * shows a photo from it, the rest stay grey. Months run along the top;
 * tap one to see it, tap a photo day to open that sidequest.
 */
export function SidequestCalendar({ folders, onOpen }: { folders: QuestFolder[]; onOpen: (f: QuestFolder) => void }) {
  const { width } = useScreen();
  const still = useReducedMotion();
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const strip = useRef<ScrollViewInstance>(null);

  const byDay = useMemo(() => {
    const m = new Map<string, QuestFolder[]>();
    for (const f of folders) {
      const k = dayKey(new Date(f.createdAt));
      m.set(k, [...(m.get(k) ?? []), f]);
    }
    return m;
  }, [folders]);

  const months = useMemo(() => {
    const out: Date[] = [];
    for (let i = MONTHS_BACK; i >= 0; i--) out.push(new Date(today.getFullYear(), today.getMonth() - i, 1));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today.getFullYear(), today.getMonth()]);
  const hasAny = (m: Date) => [...byDay.keys()].some((k) => k.startsWith(dayKey(m).slice(0, 7)));

  const cell = Math.floor((Math.min(width, 430) - space.xl * 2 - GAP * 6) / 7);
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (month.getDay() + 6) % 7; // Monday first
  const todayKey = dayKey(today);
  const outDays = Array.from({ length: daysIn }, (_, i) => byDay.has(dayKey(new Date(month.getFullYear(), month.getMonth(), i + 1)))).filter(Boolean).length;
  const title = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={{ gap: space.md }}>
      <ScrollView
        ref={strip}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        onContentSizeChange={() => strip.current?.scrollToEnd({ animated: false })}
      >
        {months.map((m) => {
          const on = m.getTime() === month.getTime();
          const label = m.toLocaleDateString('en-US', { month: 'short' });
          return (
            <Pressable
              key={m.getTime()}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              onPress={() => {
                feedback('chipSelect');
                setMonth(m);
              }}
              hitSlop={6}
              style={styles.monthTab}
            >
              <Text style={[styles.month, { color: on ? color.ink : hasAny(m) ? color.ink2 : color.ink3 }]}>{label}</Text>
              <View style={[styles.dot, { opacity: on ? 1 : 0 }]} />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.head}>
        <Text variant="headline">{title}</Text>
        <Text variant="label">
          {outDays} {outDays === 1 ? 'day' : 'days'} out
        </Text>
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((d) => (
          <Text key={d} variant="label" style={{ width: cell, textAlign: 'center', fontSize: 10 }}>
            {d}
          </Text>
        ))}
      </View>

      <Animated.View key={month.getTime()} entering={still ? undefined : FadeIn.duration(220)} style={styles.grid}>
        {Array.from({ length: lead }, (_, i) => (
          <View key={`lead${i}`} style={{ width: cell, height: cell }} />
        ))}
        {Array.from({ length: daysIn }, (_, i) => {
          const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
          const k = dayKey(date);
          const day = byDay.get(k);
          const future = k > todayKey;
          const isToday = k === todayKey;
          const cover = day?.flatMap((f) => f.photos)[0]?.uri;
          const shape = { width: cell, height: cell, borderRadius: cell / 2 };
          if (!day) {
            return (
              <View key={k} style={[shape, styles.empty, future && { opacity: 0.45 }, isToday && styles.today]} accessibilityLabel={`${date.getDate()}, nothing`}>
                <Text style={[styles.num, { color: color.ink3 }]}>{i + 1}</Text>
              </View>
            );
          }
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityLabel={`${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}: ${day.map((f) => f.title).join(', ')}`}
              onPress={() => onOpen(day[0]!)}
              style={({ pressed }) => [shape, styles.filled, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}
            >
              {cover ? <Photo uri={cover} radius={cell / 2} style={StyleSheet.absoluteFill} /> : null}
              <View style={[StyleSheet.absoluteFill, { borderRadius: cell / 2, backgroundColor: cover ? 'rgba(21,16,14,0.22)' : 'transparent' }]} />
              <Text style={[styles.num, { color: color.white }]}>{i + 1}</Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { gap: space.lg, paddingHorizontal: space.xl },
  monthTab: { alignItems: 'center', gap: 4, paddingVertical: 2 },
  month: { fontFamily: fonts.sansSemi, fontSize: 16, letterSpacing: -0.3 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: color.ink },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: space.xl },
  week: { flexDirection: 'row', gap: GAP, paddingHorizontal: space.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: space.xl },
  empty: { backgroundColor: color.mist, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1.5, borderColor: color.ink },
  filled: { backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  num: { fontFamily: fonts.sansSemi, fontSize: 14, fontVariant: ['tabular-nums'] },
});
