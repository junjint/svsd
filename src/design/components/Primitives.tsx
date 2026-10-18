import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { border, color, fonts, motion, radius, space, type } from '../tokens';
import { Body, Mono, Muted, Subtitle } from './Text';
import { SectionHeader } from './Editorial';
import { Sticker } from './Sticker';
import type { StickerId } from '../stickers';

export function Screen({
  children,
  style,
  scroll = false,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
}) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, style]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screenInner, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      {content}
    </SafeAreaView>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  sticker,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  sticker?: StickerId;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'danger' && styles.buttonDanger,
        (pressed || disabled) && { opacity: motion.pressOpacity },
      ]}
    >
      {sticker ? <Sticker id={sticker} size="sm" /> : null}
      <Text
        style={[
          styles.buttonLabel,
          (variant === 'secondary' || variant === 'ghost') &&
            styles.buttonLabelInverse,
          variant === 'danger' && styles.buttonLabelDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  sticker,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  sticker?: StickerId;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && { opacity: motion.pressOpacity },
      ]}
    >
      {sticker ? <Sticker id={sticker} size="xs" /> : null}
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Row({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.row}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Mono style={styles.rowValue}>{value}</Mono> : null}
    </Pressable>
  );
}

export function ToggleRow({
  label,
  value,
  onValueChange,
  description,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, gap: space[1] }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Muted>{description}</Muted> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: color.lineSubtle, true: color.ink }}
        thumbColor={color.bg}
        ios_backgroundColor={color.lineSubtle}
      />
    </View>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={color.inkTertiary}
      style={[styles.input, props.style]}
    />
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={color.ink} />
    </View>
  );
}

export function Section({
  title,
  children,
  sticker,
}: {
  title: string;
  children: React.ReactNode;
  sticker?: StickerId;
}) {
  return (
    <View style={styles.section}>
      <SectionHeader label={title} sticker={sticker} />
      {children}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function QuestRow({
  name,
  meta,
  hook,
  sticker,
  onPress,
}: {
  name: string;
  meta: string;
  hook?: string;
  sticker: StickerId;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.questRow, pressed && { opacity: motion.pressOpacity }]}
    >
      <Sticker id={sticker} size="lg" tilt={-4} />
      <View style={{ flex: 1, gap: 2 }}>
        <Subtitle>{name}</Subtitle>
        {hook ? <Body numberOfLines={2}>{hook}</Body> : null}
        <Mono>{meta}</Mono>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bg,
  },
  screenInner: {
    flex: 1,
    paddingHorizontal: space[5],
    paddingTop: space[3],
    backgroundColor: color.bg,
  },
  scrollContent: {
    paddingHorizontal: space[5],
    paddingTop: space[3],
    paddingBottom: space[10],
    backgroundColor: color.bg,
  },
  button: {
    backgroundColor: color.fillInverse,
    paddingVertical: space[3] + 2,
    paddingHorizontal: space[4],
    borderRadius: radius.none,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space[2],
    marginVertical: space[1],
    borderWidth: border.hairline,
    borderColor: color.line,
  },
  buttonSecondary: {
    backgroundColor: color.bg,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: color.lineSubtle,
  },
  buttonDanger: {
    backgroundColor: color.bg,
    borderColor: color.ink,
  },
  buttonLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    letterSpacing: 0.2,
    color: color.fillInverseText,
  },
  buttonLabelInverse: {
    color: color.ink,
  },
  buttonLabelDanger: {
    color: color.ink,
  },
  chip: {
    borderWidth: border.hairline,
    borderColor: color.line,
    borderRadius: radius.pill,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    margin: space[1],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    backgroundColor: color.bg,
  },
  chipSelected: {
    backgroundColor: color.fillInverse,
  },
  chipLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: color.ink,
  },
  chipLabelSelected: {
    color: color.fillInverseText,
  },
  row: {
    paddingVertical: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.lineSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[3],
  },
  rowLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: color.ink,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.lineSubtle,
  },
  input: {
    borderWidth: border.hairline,
    borderColor: color.line,
    borderRadius: radius.none,
    padding: space[3],
    fontSize: type.body.fontSize,
    fontFamily: fonts.sans,
    color: color.ink,
    marginVertical: space[2],
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg,
  },
  section: {
    marginBottom: space[2],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: color.lineSubtle,
    marginVertical: space[4],
  },
  questRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    paddingVertical: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.lineSubtle,
  },
});
