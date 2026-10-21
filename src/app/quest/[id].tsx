import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { ConfirmSheet } from '@/features/folders/ConfirmSheet';
import { SoftButton } from '@/features/folders/SoftButton';
import { partyLabel } from '@/features/folders/format';
import { Chevron } from '@/features/folders/icons';
import { QuestHero } from '@/features/quest/QuestHero';
import { formatMiles, travelLabel } from '@/services/draw/rules';
import { openWalkingDirections } from '@/services/navigation/maps';
import { feedback } from '@/services/sound';
import { useSidequestStore } from '@/stores/sidequestStore';
import { GlassIconButton, Paper, PillButton, Text, TornPaper, color, fonts, radius, rarityColor, receiptInk, space } from '@/theme';
import { showToast, useScreen } from '@/ui';

const ACTIVE = new Set(['accepted', 'en_route', 'arrived']);

export default function QuestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const quest = useSidequestStore((s) => s.quests.find((q) => q.id === id));
  const folder = useSidequestStore((s) => s.folders.find((f) => f.sidequestId === id));
  const { completeQuest, abandonQuest, startSavedQuest, createFolder } = useSidequestStore.getState();
  const { width } = useScreen();
  const still = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/folders'));

  if (!quest) {
    return (
      <Paper edges={['top', 'bottom']}>
        <TopBar onBack={back} />
        <View style={styles.missing}>
          <Text variant="title">This quest has wandered off</Text>
          <Text variant="callout">It may have been cleared from this phone.</Text>
          <PillButton label="Back to Folders" sound={null} onPress={() => router.replace('/folders')} />
        </View>
      </Paper>
    );
  }

  const isActive = ACTIVE.has(quest.status);
  const isSaved = quest.status === 'saved';
  const isDone = quest.status === 'completed';
  const contentW = Math.min(width, 430) - space.xl * 2;
  const r = rarityColor[quest.rarity];
  const openFolder = (fid: string) => router.push({ pathname: '/folder/[id]', params: { id: fid } });

  const complete = async () => {
    if (busy) return;
    setBusy(true);
    const f = await completeQuest(quest.id);
    feedback('questCompleted');
    setBusy(false);
    if (f) router.replace({ pathname: '/folder/[id]', params: { id: f.id } });
  };

  const start = async () => {
    feedback('go');
    await startSavedQuest(quest.id);
    showToast('Quest started');
  };

  const makeFolder = async () => {
    if (folder) return openFolder(folder.id);
    feedback('saveForLater');
    const f = await createFolder({ title: quest.activityText, sidequestId: quest.id });
    showToast('Folder made');
    openFolder(f.id);
  };

  const abandon = async () => {
    await abandonQuest(quest.id);
    showToast(isSaved ? 'Removed from saved' : 'Quest abandoned');
    back();
  };

  const enter = (i: number) => (still ? undefined : FadeInDown.delay(60 + i * 50).springify().damping(18).stiffness(180));

  return (
    <Paper edges={['top', 'bottom']}>
      <TopBar onBack={back} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.xl }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={enter(0)}>
          <QuestHero quest={quest} width={contentW} />
        </Animated.View>

        <Animated.View entering={enter(1)} style={{ gap: space.sm }}>
          <View style={styles.chips}>
            <StatusChip status={isDone ? 'Done' : isSaved ? 'Saved for later' : 'In progress'} live={isActive} />
            {quest.rarity !== 'common' && (
              <View style={[styles.chip, { backgroundColor: r.a + '33' }]}>
                <Text variant="caption" style={{ color: color.ink, fontWeight: '600' }}>{r.label}</Text>
              </View>
            )}
          </View>
          <Text variant="display" accessibilityRole="header">{quest.activityText}</Text>
        </Animated.View>

        <Animated.View entering={enter(2)}>
          <TornPaper seed={`${quest.id}:meta`} contentStyle={styles.meta}>
            <Meta label="Party" value={partyLabel(quest.partySize)} />
            <Meta label="Walk" value={travelLabel(quest.distanceMeters)} />
            <Meta label="Distance" value={formatMiles(quest.distanceMeters)} />
          </TornPaper>
        </Animated.View>

        <Animated.View entering={enter(4)} style={{ flexDirection: 'row', gap: space.sm }}>
          <SoftButton
            label="Directions"
            accessibilityLabel={`Open walking directions to ${quest.placeName}`}
            style={{ flex: 1 }}
            onPress={() => void openWalkingDirections(quest.coordinates, quest.placeName)}
          />
          {!isSaved && (
            <SoftButton
              label={folder ? `Folder · ${folder.photos.length}` : 'Make a folder now'}
              accessibilityLabel={folder ? 'Open this quest’s folder' : 'Make a folder now, for photos along the way'}
              tone="cobalt"
              style={{ flex: 1.3 }}
              onPress={() => void makeFolder()}
            />
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        {isActive && <PillButton label={busy ? 'Completing…' : 'Complete'} sound={null} disabled={busy} onPress={() => void complete()} />}
        {isSaved && <PillButton label="Start this quest" sound={null} onPress={() => void start()} />}
        {isDone && folder && <PillButton label="Open the folder" sound={null} onPress={() => openFolder(folder.id)} />}
        {(isActive || isSaved) && (
          <SoftButton
            label={isSaved ? 'Remove from saved' : 'Abandon quest'}
            tone="signal"
            style={styles.abandon}
            onPress={() => setConfirmAbandon(true)}
          />
        )}
      </View>

      <ConfirmSheet
        visible={confirmAbandon}
        title={isSaved ? 'Remove this one?' : 'Abandon this quest?'}
        body={
          folder
            ? 'Your folder and its photos stay put. Only the quest goes.'
            : 'It leaves your Active strip. You can always draw again.'
        }
        confirmLabel={isSaved ? 'Remove' : 'Abandon'}
        onConfirm={() => void abandon()}
        onClose={() => setConfirmAbandon(false)}
      />
    </Paper>
  );
}

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.top}>
      <GlassIconButton label="Back" onPress={onBack} size={44}>
        <Chevron />
      </GlassIconButton>
    </View>
  );
}

function StatusChip({ status, live }: { status: string; live: boolean }) {
  return (
    <View style={[styles.chip, { backgroundColor: live ? color.cobaltSoft : color.line }]}>
      {live && <View style={styles.liveDot} />}
      <Text variant="caption" style={{ color: live ? color.cobalt : color.ink2, fontWeight: '600' }}>{status}</Text>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
      <Text style={[receiptInk, { fontSize: 12, fontFamily: fonts.monoBold }]} numberOfLines={1}>{value.toUpperCase()}</Text>
      <Text style={[receiptInk, { fontSize: 9, letterSpacing: 1, opacity: 0.7 }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: space.lg, paddingVertical: space.sm, flexDirection: 'row' },
  missing: { flex: 1, padding: space.xl, gap: space.md, justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: space.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 26, borderRadius: radius.pill },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.cobalt },
  meta: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.lg },
  footer: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.sm, gap: space.sm },
  abandon: { backgroundColor: 'transparent', borderWidth: 0, shadowOpacity: 0, elevation: 0 },
});
