import { useContext, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { HoverContext, color, fonts } from '@/theme';
import { PressScale } from '../PressScale';

/**
 * A flat, toggleable pill. Off, it's only an outline, so nothing reads as
 * chosen until it is; on, it fills with ink. The fill fades rather than
 * snapping, so a tap feels like one motion.
 */
export function Chip({
  label,
  selected,
  onPress,
  size = 'md',
  a11yLabel,
  grow,
  role = 'checkbox',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  size?: 'sm' | 'md';
  a11yLabel?: string;
  /** stretch to share the row with its siblings */
  grow?: boolean;
  role?: 'checkbox' | 'radio';
}) {
  const sm = size === 'sm';
  return (
    <PressScale
      onPress={onPress}
      scaleTo={0.95}
      hitSlop={sm ? 8 : 4}
      accessibilityRole={role}
      accessibilityState={role === 'radio' ? { selected } : { checked: selected }}
      accessibilityLabel={a11yLabel ?? label}
      outerStyle={grow ? styles.grow : undefined}
    >
      <ChipBody label={label} selected={selected} sm={sm} />
    </PressScale>
  );
}

/** Inside the pressable, so it can hear the hover */
function ChipBody({ label, selected, sm }: { label: string; selected: boolean; sm: boolean }) {
  const hovered = useContext(HoverContext);
  const still = useReducedMotion();
  const on = useSharedValue(selected ? 1 : 0);
  const over = useSharedValue(0);
  useEffect(() => {
    on.value = still ? (selected ? 1 : 0) : withTiming(selected ? 1 : 0, { duration: 180 });
  }, [selected, still, on]);
  useEffect(() => {
    over.value = withTiming(hovered ? 1 : 0, { duration: 140 });
  }, [hovered, over]);

  // hover: an empty chip takes a faint wash and a darker outline; a picked one lifts a shade
  const fill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [
      interpolateColor(over.value, [0, 1], ['rgba(21,16,14,0)', 'rgba(21,16,14,0.06)']),
      interpolateColor(over.value, [0, 1], [color.ink, '#3A3330']),
    ]),
    borderColor: interpolateColor(on.value, [0, 1], [interpolateColor(over.value, [0, 1], [color.ink3, color.ink2]), color.ink]),
  }));
  const ink = useAnimatedStyle(() => ({ color: interpolateColor(on.value, [0, 1], [color.ink, color.white]) }));

  return (
    <Animated.View style={[styles.chip, sm && styles.sm, fill]}>
      <Animated.Text numberOfLines={1} style={[styles.label, sm && styles.labelSm, ink]}>
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1, flexBasis: 0 },
  chip: { height: 40, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sm: { height: 32, paddingHorizontal: 13 },
  label: { fontFamily: fonts.sansMedium, fontSize: 15, letterSpacing: -0.1 },
  labelSm: { fontSize: 13 },
});
