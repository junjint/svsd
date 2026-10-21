import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { REROLLS_PER_STAGE } from '@/services/draw/rules';
import { feedback } from '@/services/sound';
import { useSidequestStore, type DrawSession } from '@/stores/sidequestStore';
import { Text, color, space } from '@/theme';
import { showToast } from '@/ui';
import { PressScale } from '../PressScale';
import { SPRING } from '../motion';
import { RerollControls } from '../result/RerollControls';
import { SlideToGo } from '../result/SlideToGo';

function TextButton({ label, onPress, hint }: { label: string; onPress: () => void; hint?: string }) {
  return (
    <PressScale onPress={onPress} accessibilityLabel={label} accessibilityHint={hint} hitSlop={6} style={styles.textBtn}>
      <Text style={styles.textBtnLabel}>{label}</Text>
    </PressScale>
  );
}

/** Under a printed receipt: reprint a line, commit, keep it, or tear it off */
export function ReceiptActions({
  draw,
  width,
  onReprint,
  onTearOff,
}: {
  draw: DrawSession;
  width: number;
  onReprint: (stage: 'place' | 'activity') => void;
  onTearOff: () => void;
}) {
  const go = useSidequestStore((s) => s.go);
  const completeQuest = useSidequestStore((s) => s.completeQuest);
  const saveForLater = useSidequestStore((s) => s.saveForLater);
  const toggleLockPlace = useSidequestStore((s) => s.toggleLockPlace);
  const leaving = useRef(false);

  const out = draw.rerolls.activity >= REROLLS_PER_STAGE && (draw.placeLocked || draw.rerolls.place >= REROLLS_PER_STAGE);

  const save = async () => {
    if (leaving.current) return;
    leaving.current = true;
    feedback('saveForLater');
    const q = await saveForLater();
    leaving.current = false;
    if (q) showToast("Saved. It'll be here when you're ready");
  };

  // the demo skips the in-progress step: sliding files the sidequest
  // straight into its folder and opens its page
  const confirmGo = async () => {
    if (leaving.current) return false;
    leaving.current = true;
    const q = await go();
    const folder = q ? await completeQuest(q.id) : null;
    leaving.current = false;
    if (!folder) return false;
    feedback('questCompleted');
    router.push({ pathname: '/folder/[id]', params: { id: folder.id } });
  };

  return (
    <Animated.View entering={FadeInDown.springify().damping(SPRING.damping)} style={[styles.wrap, { width }]}>
      <Text variant="label" style={styles.section}>
        Reprint
      </Text>
      <RerollControls rerolls={draw.rerolls} locked={draw.placeLocked} onReroll={onReprint} onToggleLock={toggleLockPlace} />
      {out && (
        <Text variant="callout" style={{ textAlign: 'center' }}>
          That's all your reprints
        </Text>
      )}
      <SlideToGo width={width} onConfirm={confirmGo} />
      <View style={styles.links}>
        <TextButton label="Save for later" onPress={() => void save()} hint="Keeps it in Folders without starting it" />
        <View style={styles.dot} />
        <TextButton label="Tear off" onPress={onTearOff} hint="Tosses this receipt so you can print a new one" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center', gap: space.md, marginTop: space.xl },
  section: { textAlign: 'center', marginBottom: -space.xs },
  links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: color.ink3 },
  textBtn: { minHeight: 44, paddingHorizontal: space.md, justifyContent: 'center' },
  textBtnLabel: { fontSize: 15, fontWeight: '600', color: color.ink2 },
});
