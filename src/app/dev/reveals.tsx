import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ActivityReveal, ConfettiBurst, PlaceReveal } from '@/features/reveal';
import { ACTIVITIES } from '@/data/activities';
import { ANN_ARBOR_DEMO_PLACES } from '@/data/annArborPlaces';
import { formatMiles, travelLabel } from '@/services/draw/rules';
import { Paper, PillButton, Text, color, radius, space } from '@/theme';
import type { Activity, Rarity, RevealStyle } from '@/types';

/* Dev-only QA gallery for every reveal style × rarity (/dev/reveals) */

const STYLES: (RevealStyle | 'activity scratch')[] = ['scratch', 'peel', 'activity scratch', 'cards', 'coin', 'wheel'];
const RARITIES: Rarity[] = ['common', 'rare', 'legendary'];
const W = 300;
const H = 400;

const byId = (id: string) => ACTIVITIES.find((a) => a.id === id) as Activity;
const OPTIONS: Activity[] = [
  'act_sunset_picnic',
  'act_pastry_rating',
  'act_pigeons',
  'act_postcard',
  'act_cloud_names',
  'act_ask_local',
]
  .map(byId)
  .filter(Boolean);

function Chips<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Pressable
          key={o}
          accessibilityRole="button"
          accessibilityLabel={o}
          onPress={() => onChange(o)}
          style={[styles.chip, value === o && styles.chipOn]}
        >
          <Text style={[styles.chipText, value === o && { color: color.white }]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function RevealsGallery() {
  const [style, setStyle] = useState<RevealStyle | 'activity scratch' | 'all'>(Platform.OS === 'web' ? 'all' : 'scratch');
  const [rarity, setRarity] = useState<Rarity>('common');
  const [party, setParty] = useState<'solo' | 'party'>('solo');
  const [photo, setPhoto] = useState<'text' | 'photo'>('text');
  const [run, setRun] = useState(0);
  const [skipAll, setSkipAll] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const place = useMemo(() => {
    const p = ANN_ARBOR_DEMO_PLACES[0];
    return photo === 'photo' ? { ...p, photoUrl: 'https://picsum.photos/seed/sidequest/600/420' } : p;
  }, [photo]);
  const note = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${s}`, ...l].slice(0, 8));
  const shown = style === 'all' ? STYLES : [style];

  return (
    <Paper>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.head}>
          <Text variant="title">Reveals</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close gallery" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12}>
            <Text variant="callout">Close</Text>
          </Pressable>
        </View>
        <Chips value={style} options={['all', ...STYLES]} onChange={(v) => { setStyle(v); setRun((r) => r + 1); }} />
        <Chips value={rarity} options={RARITIES} onChange={(v) => { setRarity(v); setRun((r) => r + 1); }} />
        <Chips value={party} options={['solo', 'party']} onChange={(v) => { setParty(v); setRun((r) => r + 1); }} />
        <Chips value={photo} options={['text', 'photo']} onChange={(v) => { setPhoto(v); setRun((r) => r + 1); }} />
        <View style={styles.row}>
          <PillButton label="Replay" tone="frost" sound={null} onPress={() => { setSkipAll(false); setRun((r) => r + 1); }} style={styles.small} />
          <PillButton label="revealNow" tone="frost" sound={null} onPress={() => setSkipAll(true)} style={styles.small} />
          <PillButton label="Confetti" tone="frost" sound={null} onPress={() => setConfetti(true)} style={styles.small} />
        </View>
        <View style={styles.log}>
          {log.length ? log.map((l, i) => <Text key={i} variant="caption">{l}</Text>) : <Text variant="caption">Events appear here</Text>}
        </View>

        {shown.map((s) => (
          <View key={`${s}-${rarity}-${run}`} style={styles.item}>
            <Text variant="callout" style={styles.label}>
              {s} · {rarity}
            </Text>
            {s === 'scratch' || s === 'peel' ? (
              <PlaceReveal
                style={s}
                rarity={rarity}
                place={place}
                cityLabel="Ann Arbor"
                distanceLabel={`${formatMiles(640)} · ${travelLabel(640)}`}
                width={W}
                height={H}
                revealNow={skipAll}
                onRevealed={() => note(`${s}: onRevealed`)}
              />
            ) : (
              <ActivityReveal
                style={s === 'activity scratch' ? 'scratch' : s}
                rarity={rarity}
                options={s === 'activity scratch' ? OPTIONS.slice(0, 1) : OPTIONS}
                partySize={party === 'party' ? 3 : 1}
                width={W}
                height={H}
                revealNow={skipAll}
                onChoose={(id) => note(`${s}: onChoose ${id}`)}
                onRevealed={() => note(`${s}: onRevealed`)}
              />
            )}
          </View>
        ))}
      </ScrollView>
      <ConfettiBurst fire={confetti} onDone={() => { setConfetti(false); note('confetti: onDone'); }} />
    </Paper>
  );
}

const styles = StyleSheet.create({
  page: { padding: space.xl, paddingBottom: 120, gap: space.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minHeight: 36, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: color.white, borderWidth: StyleSheet.hairlineWidth, borderColor: color.line, justifyContent: 'center' },
  chipOn: { backgroundColor: color.ink, borderColor: color.ink },
  chipText: { fontSize: 13, fontWeight: '500', color: color.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  small: { height: 44, paddingHorizontal: space.lg },
  log: { minHeight: 40, padding: space.md, borderRadius: radius.thumb, backgroundColor: color.white },
  item: { alignItems: 'center', gap: space.sm, marginTop: space.xl },
  label: { alignSelf: 'flex-start' },
});
