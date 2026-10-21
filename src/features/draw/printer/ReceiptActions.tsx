import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { REROLLS_PER_STAGE } from '@/services/draw/rules';
import { feedback } from '@/services/sound';
import { useSidequestStore, type DrawSession } from '@/stores/sidequestStore';
import { Text, space } from '@/theme';
import { SPRING } from '../motion';
import { RerollControls } from '../result/RerollControls';
import { SlideToGo } from '../result/SlideToGo';

/** Under a printed receipt: reprint the place or the activity, or slide to go */
export function ReceiptActions({
  draw,
  width,
  onReprint,
}: {
  draw: DrawSession;
  width: number;
  onReprint: (stage: 'place' | 'activity') => void;
}) {
  const go = useSidequestStore((s) => s.go);
  const completeQuest = useSidequestStore((s) => s.completeQuest);
  const leaving = useRef(false);

  const out = draw.rerolls.activity >= REROLLS_PER_STAGE && (draw.placeLocked || draw.rerolls.place >= REROLLS_PER_STAGE);

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
      <RerollControls rerolls={draw.rerolls} locked={draw.placeLocked} onReroll={onReprint} />
      {out && (
        <Text variant="callout" style={{ textAlign: 'center' }}>
          That's all your reprints
        </Text>
      )}
      <SlideToGo width={width} onConfirm={confirmGo} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center', gap: space.md, marginTop: space.xl },
});
