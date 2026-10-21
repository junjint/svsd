import { StyleSheet } from 'react-native';
import { Glass, Text, color } from '@/theme';
import { PressScale } from '../PressScale';

/** A selectable pill of liquid glass; the chosen one turns to ink glass */
export function Chip({
  label,
  selected,
  onPress,
  size = 'md',
  a11yLabel,
  grow,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  size?: 'sm' | 'md';
  a11yLabel?: string;
  /** stretch to share the row with its siblings */
  grow?: boolean;
}) {
  const sm = size === 'sm';
  return (
    <PressScale
      onPress={onPress}
      scaleTo={0.94}
      hitSlop={sm ? 8 : 4}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={a11yLabel ?? label}
      outerStyle={grow ? styles.grow : undefined}
    >
      <Glass tone={selected ? 'ink' : 'clear'} interactive style={[styles.chip, sm && styles.sm]}>
        <Text numberOfLines={1} style={[styles.label, sm && styles.labelSm, { color: selected ? color.white : color.ink }]}>
          {label}
        </Text>
      </Glass>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1, flexBasis: 0 },
  chip: { height: 40, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  sm: { height: 32, paddingHorizontal: 13 },
  label: { fontSize: 15, fontWeight: '500', letterSpacing: -0.1 },
  labelSm: { fontSize: 13 },
});
