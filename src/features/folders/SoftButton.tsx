import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Glass, Text, color, space } from '@/theme';

/** A clear-glass pill for secondary actions; the ink PillButton stays the one main CTA */
export function SoftButton({
  label,
  onPress,
  icon,
  disabled,
  tone = 'ink',
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  tone?: 'ink' | 'cobalt' | 'signal';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const fg = tone === 'cobalt' ? color.cobalt : tone === 'signal' ? color.signal : color.ink;
  const body = (
    <>
      {icon ? <View style={{ marginRight: space.sm }}>{icon}</View> : null}
      <Text variant="headline" style={{ fontSize: 15, color: fg }} numberOfLines={1}>
        {label}
      </Text>
    </>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}
    >
      {tone === 'signal' ? (
        // a destructive action stays a plain text link: no glass to make it inviting
        <View style={styles.btn}>{body}</View>
      ) : (
        <Glass interactive style={styles.btn}>
          {body}
        </Glass>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
