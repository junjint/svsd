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
  const createFolder = useSidequestStore((s) => s.createFolder);
  const discardDraw = useSidequestStore((s) => s.discardDraw);
  const leaving = useRef(false);

  const out = draw.rerolls.activity >= REROLLS_PER_STAGE && (draw.placeLocked || draw.rerolls.place >= REROLLS_PER_STAGE);

  const confirmGo = async () => {
    if (leaving.current) return false;
    leaving.current = true;
    // going starts the sidequest and files it straight into a new folder (finished
    // later by holding the button on its page). The receipt stays on the printer
    // while the page arrives: clearing it first flashed the home screen resetting
    const q = await go({ keepDraw: true });
    const folder = q ? await createFolder({ title: q.activityText, sidequestId: q.id }) : null;
    leaving.current = false;
    if (!folder) {
      discardDraw();
      return false;
    }
    setTimeout(discardDraw, 700);
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
