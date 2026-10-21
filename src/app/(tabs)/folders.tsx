import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { FolderTile, NewFolderTile, type FolderTone } from '@/features/folders/FolderTile';
import { NewFolderSheet } from '@/features/folders/NewFolderSheet';
import { QuestStrip } from '@/features/folders/QuestStrip';
import { Plus } from '@/features/folders/icons';
import { feedback } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { CountPill, Glass, GlassIconButton, Paper, PillButton, Text, color, fonts, space } from '@/theme';
import type { DrawnSidequest, QuestFolder } from '@/types';
import { showToast, useTabBarSpace, useScreen } from '@/ui';

const ACTIVE = new Set(['accepted', 'en_route', 'arrived']);
const GAP = space.md;

type Filter = 'all' | 'nature' | 'focus' | 'snack' | 'meal' | 'legendary' | 'mine';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'nature', label: 'Nature' },
  { id: 'focus', label: 'Focus' },
  { id: 'snack', label: 'Snack' },
  { id: 'meal', label: 'Meal' },
  { id: 'legendary', label: 'Legendary' },
  { id: 'mine', label: 'My own' },
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
  const [making, setMaking] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);

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
        if (filter === 'mine') return !q;
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
            if (c.id === 'mine') return !q;
            if (c.id === 'legendary') return q?.rarity === 'legendary';
            return toneFor(f, q) === c.id;
          })
      ),
    [folders, byId]
  );

  const openQuest = (id: string) => router.push({ pathname: '/quest/[id]', params: { id } });
  const openFolder = (id: string) => {
    setOpenId(null);
    router.push({ pathname: '/folder/[id]', params: { id } });
  };

  return (
    <Paper>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabSpace }}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setOpenId(null)}
      >
        <View style={styles.header}>
          <View style={{ flex: 1, gap: space.sm }}>
            <View style={styles.titleRow}>
              <Text variant="display" style={styles.bigTitle} accessibilityRole="header">
                Folders
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
          {!empty && (
            <GlassIconButton label="New folder" onPress={() => setMaking(true)} size={44}>
              <Plus size={16} tint={color.ink} />
            </GlassIconButton>
          )}
        </View>

        {empty ? (
          <EmptyFolders onMake={() => setMaking(true)} />
        ) : (
          <>
            {(active.length > 0 || saved.length > 0) && (
              <View>
                <View style={styles.sectionRow}>
                  <Text variant="headline">On the go</Text>
                  <CountPill count={active.length} />
                </View>
                <QuestStrip active={active} saved={saved} onOpen={(q) => openQuest(q.id)} />
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
                const q = f.sidequestId ? byId.get(f.sidequestId) : undefined;
                return (
                  <Animated.View
                    key={f.id}
                    style={{ zIndex: openId === f.id ? 50 : 1 }}
                    entering={still ? undefined : FadeInDown.delay(Math.min(i, 8) * 40).springify().damping(18).stiffness(180)}
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
              {filter === 'all' || filter === 'mine' ? <NewFolderTile size={tile} onPress={() => setMaking(true)} /> : null}
            </View>
          </>
        )}
      </ScrollView>

      <NewFolderSheet
        visible={making}
        onClose={() => setMaking(false)}
        onCreated={(f) => {
          setMaking(false);
          showToast('Folder made');
          openFolder(f.id);
        }}
      />
    </Paper>
  );
}

/** Nothing yet: point at the Draw tab, with a quiet way to make one by hand */
function EmptyFolders({ onMake }: { onMake: () => void }) {
  return (
    <View style={styles.empty}>
      <Text variant="title" style={{ textAlign: 'center' }}>Nothing in here yet</Text>
      <Text variant="body" style={{ textAlign: 'center', color: color.ink2, maxWidth: 280 }}>
        Draw a sidequest, go do it, and its folder lands here, ready for photos.
      </Text>
      <PillButton label="Draw a sidequest" sound="tabSwitch" onPress={() => router.navigate('/draw')} style={{ alignSelf: 'stretch', marginTop: space.md }} />
      <PillButton label="Make a folder myself" tone="frost" sound={null} onPress={onMake} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.lg },
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
