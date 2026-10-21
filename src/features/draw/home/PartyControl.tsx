import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSidequestStore } from '@/stores/sidequestStore';
import { LiquidToggle, RollingCounter } from '@/ui';
import { Text, color, space } from '@/theme';
import { SPRING } from '../motion';

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

  return (
    <Animated.View layout={LinearTransition.springify().damping(SPRING.damping).stiffness(SPRING.stiffness)} style={styles.row}>
      <View style={styles.toggle}>
        <Text style={[styles.label, !together && styles.on]}>Solo</Text>
        <LiquidToggle value={together} onChange={setTogether} label={together ? 'With others' : 'Solo'} />
        <Text style={[styles.label, together && styles.on]}>With others</Text>
      </View>
      {together && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.stepper}>
          <RollingCounter value={partySize} min={MIN_GROUP} max={MAX_GROUP} onChange={step} size="sm" />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.lg, minHeight: 44 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { fontSize: 15, fontWeight: '500', color: color.ink3 },
  on: { color: color.ink },
  stepper: { paddingLeft: space.sm, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: color.line },
});
