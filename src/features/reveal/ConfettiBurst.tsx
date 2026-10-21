import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useScreen } from '@/ui';
import { useReducedMotion } from 'react-native-reanimated';
import ConfettiDom from '@/bencho/dom/Confetti.dom';

/**
 * Full-screen paper confetti (Bencho `confetti`), one burst each time
 * `fire` turns true. Touches pass straight through. The webview is only
 * mounted while a burst is in the air. Reduce Motion: no confetti.
 */
export function ConfettiBurst({ fire, onDone }: { fire: boolean; onDone?: () => void }) {
  const { width, height } = useScreen();
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);
  const [live, setLive] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const end = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setLive(false);
    doneRef.current?.();
  }, []);

  useEffect(() => {
    if (!fire) return;
    if (reduce) {
      doneRef.current?.();
      return;
    }
    setLive(true);
    setCount((c) => c + 1);
    /* never leave a webview over the screen if onDone is lost */
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(end, 6000);
  }, [fire, reduce, end]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onBurstDone = useCallback(async () => end(), [end]);

  if (!live) return <View pointerEvents="none" />;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 1000 }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <ConfettiDom width={width} height={height} fire={count} onDone={onBurstDone} dom={{ scrollEnabled: false, style: { width, height } }} />
    </View>
  );
}
