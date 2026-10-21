import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useReducedMotion, useSharedValue } from 'react-native-reanimated';
import { ConfirmSheet } from '@/features/folders/ConfirmSheet';
import { shortDate } from '@/features/folders/format';
import { Chevron, Grid } from '@/features/folders/icons';
import { Actions } from '@/features/folders/viewer/Actions';
import { forgetPhoto, pickPhotos } from '@/features/folders/pickPhotos';
import { EmptyFolder } from '@/features/folders/viewer/EmptyFolder';
import { Filmstrip, type FilmstripHandle } from '@/features/folders/viewer/Filmstrip';
import { FullBleed } from '@/features/folders/viewer/FullBleed';
import { GridSheet } from '@/features/folders/viewer/GridSheet';
import { NoteSheet, moodLabel } from '@/features/folders/viewer/NoteSheet';
import { OptionsSheet } from '@/features/folders/viewer/OptionsSheet';
import { ScrubTitle } from '@/features/folders/viewer/ScrubTitle';
import { Stage } from '@/features/folders/viewer/Stage';
import { BadgeCelebration } from '@/features/quest/BadgeCelebration';
import { feedback } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { GlassIconButton, Paper, PillButton, Text, space } from '@/theme';
import { showToast, useScreen } from '@/ui';

type Confirm = 'photo' | 'folder' | null;
/** iOS can't present a modal while another is dismissing */
const AFTER_SHEET = 380;

export default function GalleryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const folder = useSidequestStore((s) => s.folders.find((f) => f.id === id));
  const { addPhotos, updateFolder, removePhoto, deleteFolder } = useSidequestStore.getState();
  const { width } = useScreen();
  const W = Math.min(width, 430);
  const still = useReducedMotion();

  const progress = useSharedValue(0);
  const scrub = useSharedValue(0);
  const strip = useRef<FilmstripHandle>(null);
  const [index, setIndex] = useState(0);
  const [stageH, setStageH] = useState(0);
  const [full, setFull] = useState(false);
  const [sheet, setSheet] = useState<'note' | 'options' | 'grid' | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [adding, setAdding] = useState(false);
  const pendingJump = useRef<number | null>(null);

  const photos = folder?.photos ?? [];
  const count = photos.length;
  const current = photos[Math.min(index, count - 1)];

  const onIndex = useCallback(
    (i: number) => {
      setIndex(i);
      feedback('chipSelect');
    },
    []
  );

  // after photos are added or removed, land on the right one
  useEffect(() => {
    if (pendingJump.current !== null && count > 0) {
      const to = Math.min(pendingJump.current, count - 1);
      pendingJump.current = null;
      setTimeout(() => strip.current?.jumpTo(to), 60);
      setIndex(to);
    } else if (index > count - 1 && count > 0) {
      setIndex(count - 1);
      strip.current?.jumpTo(count - 1, false);
    }
  }, [count, index]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/folders'));

  if (!folder) {
    return (
      <Paper edges={['top', 'bottom']}>
        <View style={styles.missing}>
          <Text variant="title">This folder is gone</Text>
          <PillButton label="Back to Folders" sound={null} onPress={() => router.replace('/folders')} />
        </View>
      </Paper>
    );
  }

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
      pendingJump.current = count;
      await addPhotos(folder.id, clean);
      feedback('addPhoto');
      const added = clean.length === 1 ? 'Photo added' : `${clean.length} photos added`;
      showToast(dropped ? `${added}. ${dropped} couldn't be read` : added);
    } finally {
      setAdding(false);
    }
  };

  const later = (fn: () => void) => setTimeout(fn, AFTER_SHEET);

  const deletePhoto = async () => {
    if (!current) return;
    forgetPhoto(current.uri);
    pendingJump.current = Math.max(0, index - (index >= count - 1 ? 1 : 0));
    await removePhoto(folder.id, current.id);
    showToast('Photo deleted');
  };

  const removeFolder = async () => {
    folder.photos.forEach((p) => forgetPhoto(p.uri));
    await deleteFolder(folder.id);
    showToast('Folder deleted');
    back();
  };

  const sub = [folder.subtitle, shortDate(current?.addedAt ?? folder.createdAt), moodLabel(folder.mood)].filter(Boolean).join(' · ');

  return (
    <Paper edges={['top', 'bottom']}>
      <View style={styles.top}>
        <GlassIconButton label="Back" onPress={back} size={44}>
          <Chevron />
        </GlassIconButton>
        {count > 0 && (
          <GlassIconButton label="All photos" onPress={() => setSheet('grid')} size={44}>
            <Grid />
          </GlassIconButton>
        )}
      </View>

      {count === 0 ? (
        <EmptyFolder title={folder.title} sub={sub} busy={adding} onAdd={() => void add()} onEdit={() => setSheet('note')} onMore={() => setSheet('options')} />
      ) : (
        <>
          <View style={{ flex: 1 }} onLayout={(e) => setStageH(e.nativeEvent.layout.height)}>
            {stageH > 0 && <Stage photos={photos} index={index} progress={progress} width={W} height={stageH} onOpen={() => setFull(true)} />}
          </View>

          <View style={{ gap: space.md, paddingTop: space.md }}>
            <ScrubTitle title={folder.title} sub={sub} scrub={scrub} still={still} />
            {folder.note ? (
              <Text variant="callout" numberOfLines={2} style={{ textAlign: 'center', paddingHorizontal: space.xxl }}>
                {folder.note}
              </Text>
            ) : null}
            <Actions busy={adding} onAdd={() => void add()} onEdit={() => setSheet('note')} onMore={() => setSheet('options')} />
            <Filmstrip ref={strip} photos={photos} width={W} progress={progress} scrub={scrub} still={still} onIndex={onIndex} />
          </View>
        </>
      )}

      <FullBleed
        photos={photos}
        start={index}
        visible={full}
        onClose={(at) => {
          setFull(false);
          if (at !== index) {
            setIndex(at);
            strip.current?.jumpTo(at, false);
          }
        }}
      />
      <GridSheet
        photos={photos}
        current={index}
        visible={sheet === 'grid'}
        onClose={() => setSheet(null)}
        onPick={(i) => {
          setSheet(null);
          strip.current?.jumpTo(i);
        }}
      />
      <NoteSheet folder={folder} visible={sheet === 'note'} onClose={() => setSheet(null)} onSave={(patch) => void updateFolder(folder.id, patch)} />
      <OptionsSheet
        folder={folder}
        visible={sheet === 'options'}
        hasPhoto={!!current}
        onClose={() => setSheet(null)}
        onGallery={(v) => {
          void updateFolder(folder.id, { savedToGallery: v });
          showToast(v ? 'Saved to Gallery' : 'Removed from Gallery');
        }}
        onOpenQuest={
          folder.sidequestId
            ? () => {
                setSheet(null);
                later(() => router.push({ pathname: '/quest/[id]', params: { id: folder.sidequestId! } }));
              }
            : undefined
        }
        onDeletePhoto={() => {
          setSheet(null);
          later(() => setConfirm('photo'));
        }}
        onDeleteFolder={() => {
          setSheet(null);
          later(() => setConfirm('folder'));
        }}
      />
      <ConfirmSheet
        visible={confirm === 'photo'}
        title="Delete this photo?"
        body="It's removed from this folder. The original stays in your camera roll."
        confirmLabel="Delete photo"
        onConfirm={() => void deletePhoto()}
        onClose={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'folder'}
        title="Delete this folder?"
        body={count ? `All ${count} photo${count === 1 ? '' : 's'} in it go too. Originals stay in your camera roll.` : 'It’s empty, so nothing else is lost.'}
        confirmLabel="Delete folder"
        onConfirm={() => void removeFolder()}
        onClose={() => setConfirm(null)}
      />
      <BadgeCelebration />
    </Paper>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.sm, zIndex: 20 },
  missing: { flex: 1, padding: space.xl, gap: space.md, justifyContent: 'center' },
});
