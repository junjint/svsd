import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSidequestStore } from '@/stores/sidequestStore';
import { LiquidToggle, RollingCounter } from '@/ui';
import { color, fonts, space } from '@/theme';
import { OPEN_EASE } from '@/ui/motion';

const MIN_GROUP = 2;
const MAX_GROUP = 8;

/** Solo ↔ With others, and a 2–8 stepper once there are others */
export function PartyControl() {
  const partySize = useSidequestStore((s) => s.prefs.partySize);
  const updatePrefs = useSidequestStore((s) => s.updatePrefs);
  const together = partySize > 1;
  // remember the group size across a Solo detour
  const lastGroup = useRef(Math.max(MIN_GROUP, partySize));

  const setTogether = (v: boolean) => {
    void updatePrefs({ partySize: v ? lastGroup.current : 1 });
  };
  const step = (n: number) => {
    const next = Math.min(MAX_GROUP, Math.max(MIN_GROUP, n));
    if (next === partySize) return;
    lastGroup.current = next;
    void updatePrefs({ partySize: next });
  };

  /* one value drives everything, on the toggle's own easing: the labels
     trade ink and the stepper fades and slides in. The stepper's slot is
     always there, so nothing in the row ever moves sideways. */
  const still = useReducedMotion();
  const t = useSharedValue(together ? 1 : 0);
  useEffect(() => {
    t.value = still ? (together ? 1 : 0) : withTiming(together ? 1 : 0, { ...OPEN_EASE, duration: 420 });
  }, [together, still, t]);
  const soloInk = useAnimatedStyle(() => ({ color: interpolateColor(t.value, [0, 1], [color.ink, color.ink3]) }));
  const groupInk = useAnimatedStyle(() => ({ color: interpolateColor(t.value, [0, 1], [color.ink3, color.ink]) }));
  const stepperIn = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateX: (1 - t.value) * -10 }, { scale: 0.92 + 0.08 * t.value }] }));

  return (
    <View style={styles.row}>
      <View style={styles.toggle}>
        <Animated.Text style={[styles.label, soloInk]}>Solo</Animated.Text>
        <LiquidToggle value={together} onChange={setTogether} label={together ? 'With others' : 'Solo'} />
        <Animated.Text style={[styles.label, groupInk]}>With others</Animated.Text>
      </View>
      <Animated.View style={[styles.stepper, stepperIn]} pointerEvents={together ? 'auto' : 'none'} accessibilityElementsHidden={!together}>
        <RollingCounter value={Math.max(MIN_GROUP, partySize)} min={MIN_GROUP} max={MAX_GROUP} onChange={step} size="sm" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, minHeight: 44 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { fontFamily: fonts.sansMedium, fontSize: 15 },
  stepper: { paddingLeft: space.sm, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: color.line },
});
