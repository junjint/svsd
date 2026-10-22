import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { FolderTile, type FolderTone } from '@/features/folders/FolderTile';
import { BadgeCelebration } from '@/features/quest/BadgeCelebration';
import { QuestStrip } from '@/features/folders/QuestStrip';
import { feedback } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { CountPill, Decor, Glass, Paper, PillButton, Text, color, fonts, space } from '@/theme';
import type { DrawnSidequest, QuestFolder } from '@/types';
import { useTabBarSpace, useScreen } from '@/ui';

const ACTIVE = new Set(['accepted', 'en_route', 'arrived']);
const GAP = space.md;

type Filter = 'all' | 'nature' | 'focus' | 'snack' | 'meal' | 'legendary';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'nature', label: 'Nature' },
  { id: 'focus', label: 'Focus' },
  { id: 'snack', label: 'Snack' },
  { id: 'meal', label: 'Meal' },
  { id: 'legendary', label: 'Legendary' },
];

/** What colour a folder is: its quest's type, or lilac for a hand-made one */
function toneFor(f: QuestFolder, quest?: DrawnSidequest): FolderTone {
  if (!quest) return 'freeform';
  if (quest.questType !== 'random') return quest.questType;
  // a Random draw takes its colour from the place it landed on
  const c = quest.category;
  if (c === 'nature') return 'nature';
  if (c === 'local_food') return 'meal';
  if (c === 'coffee') return 'snack';
  return 'focus';
}

export default function FoldersScreen() {
  const tabSpace = useTabBarSpace();
  const quests = useSidequestStore((s) => s.quests);
  const folders = useSidequestStore((s) => s.folders);
  const { width } = useScreen();
  const still = useReducedMotion();
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);

  /* back from finishing a sidequest (?just=<folder>): its folder springs into
     place at the top, fans its photos open, then tucks them in */
  const { just } = useLocalSearchParams<{ just?: string }>();
  const [landing, setLanding] = useState<string | null>(null);
  useEffect(() => {
    if (!just) return;
    const t = [
      setTimeout(() => {
        setLanding(just);
        setFilter('all');
        setOpenId(null);
        scroll.current?.scrollTo({ y: 0, animated: false });
      }, 0),
      setTimeout(() => feedback('questCompleted'), 420),
      setTimeout(() => setOpenId(just), 700),
      setTimeout(() => setOpenId((o) => (o === just ? null : o)), 1700),
      setTimeout(() => { setLanding(null); router.setParams({ just: '' }); }, 2200),
    ];
    return () => t.forEach(clearTimeout);
  }, [just]);

  const active = useMemo(() => quests.filter((q) => ACTIVE.has(q.status)), [quests]);
  const saved = useMemo(() => quests.filter((q) => q.status === 'saved'), [quests]);
  const byId = useMemo(() => new Map(quests.map((q) => [q.id, q])), [quests]);
  const tile = Math.floor((Math.min(width, 430) - space.xl * 2 - GAP) / 2);
  const empty = folders.length === 0 && active.length === 0 && saved.length === 0;
  const photoCount = folders.reduce((n, f) => n + f.photos.length, 0);

  const shown = useMemo(
    () =>
      folders.filter((f) => {
        if (filter === 'all') return true;
        const q = f.sidequestId ? byId.get(f.sidequestId) : undefined;
        if (filter === 'legendary') return q?.rarity === 'legendary';
        return toneFor(f, q) === filter;
      }),
    [folders, filter, byId]
  );
  // only offer chips that have something behind them
  const chips = useMemo(
    () =>
      FILTERS.filter(
        (c) =>
          c.id === 'all' ||
          folders.some((f) => {
            const q = f.sidequestId ? byId.get(f.sidequestId) : undefined;
            if (c.id === 'legendary') return q?.rarity === 'legendary';
            return toneFor(f, q) === c.id;
          })
      ),
    [folders, byId]
  );

  // an active sidequest always opens its own page; one started before folders
  // came with Go gets its folder now. Only saved-for-later ones keep the quest screen
  const openQuest = async (id: string) => {
    const q = quests.find((x) => x.id === id);
    let f = folders.find((x) => x.sidequestId === id);
    if (!f && q && ACTIVE.has(q.status)) f = await useSidequestStore.getState().createFolder({ title: q.activityText, sidequestId: id });
    if (f) router.push({ pathname: '/folder/[id]', params: { id: f.id } });
    else router.push({ pathname: '/quest/[id]', params: { id } });
  };
  const openFolder = (id: string) => {
    setOpenId(null);
    router.push({ pathname: '/folder/[id]', params: { id } });
  };

  return (
    <Paper>
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ paddingBottom: tabSpace }}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setOpenId(null)}
      >
        <View style={styles.header}>
          <View style={{ flex: 1, gap: space.sm }}>
            <View style={styles.titleRow}>
              <Text variant="display" style={styles.bigTitle} accessibilityRole="header">
                Library
              </Text>
              {!empty && <Text variant="accent" style={styles.titleCount}>({folders.length})</Text>}
            </View>
            {!empty && (
              <View style={styles.specs}>
                <Text variant="label">Sidequests</Text>
                <Text style={styles.spec}>{folders.length}</Text>
                <Text variant="label" style={{ marginLeft: space.lg }}>Photos</Text>
                <Text style={styles.spec}>{photoCount}</Text>
              </View>
            )}
          </View>
          {/* chrome crest in the header's empty corner, for looks only */}
          <Decor name="lion" width={64} style={styles.crest} />
        </View>

        {empty ? (
          <EmptyFolders />
        ) : (
          <>
            {(active.length > 0 || saved.length > 0) && (
              <View>
                <View style={styles.sectionRow}>
                  <Text variant="headline">On the go</Text>
                  <CountPill count={active.length} />
                </View>
                <QuestStrip active={active} saved={saved} onOpen={(q) => void openQuest(q.id)} />
              </View>
            )}

            {chips.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {chips.map((c) => {
                  const on = filter === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`Show ${c.label}`}
                      onPress={() => {
                        feedback('chipSelect');
                        setOpenId(null);
                        setFilter(c.id);
                      }}
                      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.95 : 1 }] })}
                    >
                      <Glass tone={on ? 'ink' : 'clear'} interactive style={styles.chip}>
                        <Text style={[styles.chipText, on && { color: color.white }]}>{c.label}</Text>
                      </Glass>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.grid}>
              {shown.map((f, i) => {
                return (
                  <Animated.View
                    key={f.id === landing ? `${f.id}-landing` : f.id}
                    style={{ zIndex: openId === f.id ? 50 : 1 }}
                    entering={
                      still
                        ? undefined
                        : f.id === landing
                          ? ZoomIn.delay(300).springify().damping(13).stiffness(170)
                          : FadeInDown.delay(Math.min(i, 8) * 40).springify().damping(18).stiffness(180)
                    }
                  >
                    <FolderTile
                      folder={f}
                      size={tile}
                      tint={i}
                      open={openId === f.id}
                      dimmed={openId !== null && openId !== f.id}
                      onOpen={() => openFolder(f.id)}
                      onHold={(held) => setOpenId((o) => (held ? f.id : o === f.id ? null : o))}
                    />
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      {/* a badge earned by the sidequest that just landed is celebrated here, once it has */}
      <BadgeCelebration delayMs={2000} />
    </Paper>
  );
}

/** Nothing yet: every folder is a sidequest, so point at the Draw */
function EmptyFolders() {
  return (
    <View style={styles.empty}>
      <Text variant="title" style={{ textAlign: 'center' }}>Nothing in here yet</Text>
      <Text variant="body" style={{ textAlign: 'center', color: color.ink2, maxWidth: 280 }}>
        Every sidequest you go on gets its own folder here, ready for photos.
      </Text>
      <PillButton label="Draw a sidequest" sound="tabSwitch" onPress={() => router.navigate('/draw')} style={{ alignSelf: 'stretch', marginTop: space.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.lg },
  crest: { marginTop: -2, marginRight: -4, transform: [{ rotate: '6deg' }] },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  bigTitle: { fontSize: 46, lineHeight: 46, letterSpacing: -2.2 },
  titleCount: { fontSize: 26, lineHeight: 28, marginTop: -2 },
  specs: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  spec: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 0.9, color: color.ink },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl, marginBottom: space.md, minHeight: 30 },
  chips: { gap: space.sm, paddingHorizontal: space.xl, paddingBottom: space.md },
  chip: { height: 36, paddingHorizontal: 16, justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '500', color: color.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: space.xxl, paddingHorizontal: space.xl, paddingTop: space.xl },
  empty: { alignItems: 'center', paddingHorizontal: space.xl, paddingTop: space.xxl, gap: space.md },
});
