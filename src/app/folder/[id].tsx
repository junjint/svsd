import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { ConfirmSheet } from '@/features/folders/ConfirmSheet';
import { partyLabel, shortDate } from '@/features/folders/format';
import { Chevron, Dots, Plus } from '@/features/folders/icons';
import { forgetPhoto, pickPhotos } from '@/features/folders/pickPhotos';
import { Photo } from '@/features/folders/Photo';
import { FullBleed } from '@/features/folders/viewer/FullBleed';
import { NoteSheet, moodLabel } from '@/features/folders/viewer/NoteSheet';
import { OptionsSheet } from '@/features/folders/viewer/OptionsSheet';
import { HoldToComplete } from '@/features/quest/HoldToComplete';
import { conceptPhoto } from '@/features/quest/conceptPhotoAssets';
import { DirectionsButton } from '@/features/navigation/DirectionsButton';
import { formatMiles, travelLabel } from '@/services/draw/rules';
import { feedback } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { Decor, GlassIconButton, Paper, PillButton, Text, color, fonts, rarityColor, space } from '@/theme';
import { showToast, useScreen } from '@/ui';

/* Web swaps stack screens with a hard cut, so the page brings its own
   entrance: it rises and fades in. iOS keeps its native slide */
const PAGE_IN = Platform.OS === 'web' ? FadeInDown.duration(420).easing(Easing.bezier(0.22, 1, 0.36, 1)) : undefined;

/** iOS can't present a modal while another is dismissing */
const AFTER_SHEET = 380;
/** How far the paper sheet's folder tab rises above its body */
const TAB = 26;
const COLS = 3;

/**
 * One sidequest's page: the photo up top, then a paper sheet cut like a
 * folder tab holding the exact prompt that was drawn, and the photos
 * taken on the way, with room to add more.
 */
export default function SidequestPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const folder = useSidequestStore((s) => s.folders.find((f) => f.id === id));
  const quest = useSidequestStore((s) => (folder?.sidequestId ? s.quests.find((q) => q.id === folder.sidequestId) : undefined));
  const { addPhotos, updateFolder, removeSidequest, completeQuest } = useSidequestStore.getState();
  const { width, height } = useScreen();
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const [viewAt, setViewAt] = useState<number | null>(null);
  const [sheet, setSheet] = useState<'note' | 'options' | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [finishedHere, setFinishedHere] = useState(false);

  const W = Math.min(width, 430);
  const heroH = Math.round(Math.min(height * 0.5, W * 1.05));
  const back = () => (router.canGoBack() ? router.back() : router.replace('/folders'));

  if (!folder) {
    return (
      <Paper edges={['top', 'bottom']}>
        <View style={styles.missing}>
          <Text variant="title">This folder is gone</Text>
          <PillButton label="Back to Library" sound={null} onPress={() => router.replace('/folders')} />
        </View>
      </Paper>
    );
  }

  const photos = folder.photos;
  const cover = photos[0];
  const gap = 6;
  const cell = Math.floor((W - space.xl * 2 - gap * (COLS - 1)) / COLS);
  const when = shortDate(quest?.completedAt ?? folder.createdAt);
  const kicker = [quest ? 'Sidequest' : 'Folder', quest?.cityLabel, when].filter(Boolean).join(' · ');
  const prompt = quest ? `${quest.storyHook} ${quest.activityText}.` : undefined;
  const mood = moodLabel(folder.mood);
  const enter = (i: number) => (still ? undefined : FadeInDown.delay(80 + i * 60).springify().damping(18).stiffness(180));

  const add = async () => {
    if (adding) return;
    setAdding(true);
    try {
      const picked = await pickPhotos();
      if (picked === 'denied') {
        feedback('formError');
        showToast('Photo access is off. You can turn it on in Settings');
        return;
      }
      const { photos: clean, dropped } = picked;
      if (dropped && !clean.length) {
        feedback('formError');
        showToast(dropped === 1 ? "That photo couldn't be added" : "Those photos couldn't be added");
        return;
      }
      if (!clean.length) return;
      await addPhotos(folder.id, clean);
      feedback('addPhoto');
      const added = clean.length === 1 ? 'Photo added' : `${clean.length} photos added`;
      showToast(dropped ? `${added}. ${dropped} couldn't be read` : added);
    } finally {
      setAdding(false);
    }
  };

  const removeFolder = async () => {
    folder.photos.forEach((p) => forgetPhoto(p.uri));
    await removeSidequest(folder.id);
    showToast(quest ? 'Sidequest deleted' : 'Folder deleted');
    router.replace('/folders');
  };

  return (
    <Animated.View style={styles.page} entering={PAGE_IN}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }}>
        {/* the picture of the sidequest */}
        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel={cover ? 'Open the cover photo' : quest ? `A picture for ${quest.placeName}` : 'No photos yet'}
          disabled={!cover}
          onPress={() => setViewAt(0)}
          style={{ height: heroH + TAB }}
        >
          {cover ? (
            <Animated.View entering={still ? undefined : FadeIn.duration(320)} style={StyleSheet.absoluteFill}>
              <Photo uri={cover.uri} radius={0} style={StyleSheet.absoluteFill} />
            </Animated.View>
          ) : quest ? (
            <View style={StyleSheet.absoluteFill}>
              <Photo uri={conceptPhoto(quest)} radius={0} style={StyleSheet.absoluteFill} />
            </View>
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.noCover]}>
              <Decor name="swallow" width={150} />
            </View>
          )}
        </Pressable>

        {/* paper, cut like a folder: a tab on the left, a slope, the body */}
        <View style={{ marginTop: -TAB * 2 }}>
          <View style={styles.tabRow}>
            <View style={[styles.tab, { width: W * 0.62 }]} />
            <View style={styles.slope} />
          </View>
          <View style={styles.sheet}>
            <Animated.View entering={enter(0)} style={{ marginTop: -TAB + 8 }}>
              <Text style={styles.kicker}>{kicker.toUpperCase()}</Text>
            </Animated.View>

            <Animated.View entering={enter(1)}>
              <Text style={styles.title} accessibilityRole="header">
                {folder.title}
              </Text>
            </Animated.View>

            {prompt ? (
              <Animated.View entering={enter(2)} style={{ gap: space.sm }}>
                <Text style={styles.label}>The prompt</Text>
                <Text style={styles.prompt}>{prompt}</Text>
              </Animated.View>
            ) : null}

            {quest ? (
              <Animated.View entering={enter(3)} style={styles.metaRow}>
                <Meta text={partyLabel(quest.partySize)} />
                <Meta text={rarityColor[quest.rarity].label} dot={rarityColor[quest.rarity].a} />
                <Meta text={quest.placeName} />
                {quest.distanceMeters ? <Meta text={formatMiles(quest.distanceMeters)} /> : null}
              </Animated.View>
            ) : null}

            {quest ? (
              <Animated.View entering={enter(3)}>
                <DirectionsButton
                  target={{ sidequestId: quest.id, placeName: quest.placeName, coordinates: quest.coordinates }}
                  detail={quest.distanceMeters ? travelLabel(quest.distanceMeters) : undefined}
                />
              </Animated.View>
            ) : null}

            <Animated.View entering={enter(4)} style={folder.note || mood ? styles.noteBox : undefined}>
              {folder.note ? <Text style={styles.note}>“{folder.note}”</Text> : null}
              {mood ? <Text variant="caption" style={{ color: color.ink2 }}>Felt {mood.toLowerCase()}</Text> : null}
              <Pressable accessibilityRole="button" onPress={() => setSheet('note')} hitSlop={10} style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                <Text style={styles.noteLink}>{folder.note ? 'Edit note' : 'Add a note'}</Text>
              </Pressable>
            </Animated.View>

            {/* the photos */}
            <Animated.View entering={enter(5)} style={styles.galleryHead}>
              <View>
                <Text variant="headline">Photos</Text>
                <Text variant="caption" style={{ color: color.ink2 }}>
                  {photos.length ? `${photos.length} from this sidequest` : 'Nothing yet'}
                </Text>
              </View>
              {photos.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="View photos"
                  hitSlop={8}
                  onPress={() => router.push({ pathname: '/gallery/[id]', params: { id: folder.id } })}
                  style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.6 }]}
                >
                  <Text style={styles.ghostText}>View photos</Text>
                  <Chevron size={10} tint={color.ink} dir="right" />
                </Pressable>
              )}
            </Animated.View>

            <View style={[styles.grid, { gap }]}>
              {photos.map((p, i) => (
                <Pressable key={p.id} accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1} of ${photos.length}`} onPress={() => setViewAt(i)}>
                  {({ pressed }) => (
                    <Photo uri={p.uri} radius={10} style={{ width: cell, height: cell, transform: [{ scale: pressed ? 0.96 : 1 }] }} />
                  )}
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" accessibilityLabel="Add photos" disabled={adding} onPress={() => void add()}>
                {({ pressed }) => (
                  <View style={[styles.addCell, { width: cell, height: cell, transform: [{ scale: pressed ? 0.96 : 1 }], opacity: adding ? 0.5 : 1 }]}>
                    <Plus size={16} tint={color.ink} />
                    <Text style={styles.addText}>Add</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* finishing is a hold, never a tap; deleting lives in the ⋯ menu */}
            {/* the button stays to show its "complete" state when it was finished right here */}
            {quest && (quest.status !== 'completed' || finishedHere) ? (
              <View style={{ marginTop: space.lg }}>
                <HoldToComplete
                  onComplete={() => {
                    setFinishedHere(true);
                    void completeQuest(quest.id);
                    // a beat on "Sidequest complete", then back out to the Library to watch it land in its folder
                    setTimeout(() => router.navigate({ pathname: '/folders', params: { just: folder.id } }), 1100);
                  }}
                />
              </View>
            ) : quest?.completedAt ? (
              <Text variant="label" style={styles.doneLine}>
                Completed {shortDate(quest.completedAt)}
              </Text>
            ) : null}
            <View style={styles.fin}>
              <Decor name="swallow" width={56} />
              <Text style={styles.finText}>fin.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* floating glass controls over the photo */}
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]} pointerEvents="box-none">
        <GlassIconButton label="Back" onPress={back} size={44}>
          <Chevron />
        </GlassIconButton>
        <GlassIconButton label="More" onPress={() => setSheet('options')} size={44}>
          <Dots />
        </GlassIconButton>
      </View>

      <FullBleed photos={photos} start={viewAt ?? 0} visible={viewAt !== null} onClose={() => setViewAt(null)} />
      <NoteSheet folder={folder} visible={sheet === 'note'} onClose={() => setSheet(null)} onSave={(patch) => void updateFolder(folder.id, patch)} />
      <OptionsSheet
        folder={folder}
        visible={sheet === 'options'}
        hasPhoto={false}
        onClose={() => setSheet(null)}
        onOpenQuest={undefined}
        deleteLabel={quest ? 'Delete sidequest' : 'Delete folder'}
        onDeletePhoto={() => setSheet(null)}
        onDeleteFolder={() => {
          setSheet(null);
          setTimeout(() => setConfirm(true), AFTER_SHEET);
        }}
      />
      <ConfirmSheet
        visible={confirm}
        title={quest ? 'Delete this sidequest?' : 'Delete this folder?'}
        body={
          quest
            ? `Not going after all? It leaves your Library${photos.length ? `, with its ${photos.length} photo${photos.length === 1 ? '' : 's'}` : ''}. Originals stay in your camera roll.`
            : photos.length
              ? `All ${photos.length} photo${photos.length === 1 ? '' : 's'} in it go too. Originals stay in your camera roll.`
              : 'It’s empty, so nothing else is lost.'
        }
        confirmLabel={quest ? 'Delete sidequest' : 'Delete folder'}
        onConfirm={() => void removeFolder()}
        onClose={() => setConfirm(false)}
      />
    </Animated.View>
  );
}

function Meta({ text, dot }: { text: string; dot?: string }) {
  return (
    <View style={styles.meta}>
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const PAPER = color.paper;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: PAPER },
  missing: { flex: 1, padding: space.xl, gap: space.md, justifyContent: 'center' },
  noCover: { backgroundColor: color.mist, alignItems: 'center', justifyContent: 'center' },
  top: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.lg },
  tabRow: { flexDirection: 'row', height: TAB, alignItems: 'flex-end' },
  tab: { height: TAB, backgroundColor: PAPER, borderTopLeftRadius: 22 },
  // a right triangle in paper: the tab's shoulder sloping down to the body
  slope: { width: 0, height: 0, borderBottomWidth: TAB, borderRightWidth: TAB * 1.6, borderBottomColor: PAPER, borderRightColor: 'transparent' },
  sheet: { backgroundColor: PAPER, borderTopRightRadius: 22, paddingTop: TAB, paddingHorizontal: space.xl, gap: space.lg },
  kicker: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 0.9, color: color.ink },
  title: { fontFamily: fonts.sansBold, fontSize: 40, lineHeight: 40, letterSpacing: -1.8, color: color.ink },
  label: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 0.9, color: color.ink2, textTransform: 'uppercase' },
  prompt: { fontFamily: fonts.serif, fontSize: 23, lineHeight: 29, letterSpacing: -0.1, color: color.ink },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: color.mist, maxWidth: '100%' },
  metaText: { fontSize: 13, fontWeight: '500', color: color.ink },
  dot: { width: 8, height: 8, borderRadius: 4 },
  noteBox: { borderLeftWidth: 2, borderLeftColor: color.ink, paddingLeft: space.md, gap: 4 },
  note: { fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 24, color: color.ink },
  galleryHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: space.md },
  ghost: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: color.ink },
  ghostText: { fontSize: 13, fontWeight: '600', color: color.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  doneLine: { textAlign: 'center', marginTop: space.lg },
  fin: { alignItems: 'center', gap: 2, marginTop: space.xxl, opacity: 0.9 },
  finText: { fontFamily: fonts.serifItalic, fontSize: 18, color: color.ink2 },
  addCell: { borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.ink3, alignItems: 'center', justifyContent: 'center', gap: 4 },
  addText: { fontSize: 12, fontWeight: '600', color: color.ink },
  noteLink: { fontSize: 13, fontWeight: '600', color: color.ink, textDecorationLine: 'underline' },
});
