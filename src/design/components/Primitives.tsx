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
import { color, fonts, poster, space } from '../tokens';
import { Body, Display, Label, Muted, Title } from './Text';
import { Sticker } from './Sticker';
import { Atmosphere, FloorMark } from './Poster';
import type { StickerId } from '../stickers';
import { type as typeScale } from '../tokens';

export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Label style={styles.eyebrow}>{children}</Label>;
}

export function Screen({
  children,
  style,
  atmosphere = true,
  floor,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  atmosphere?: boolean;
  floor?: string | false;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      {atmosphere ? <Atmosphere /> : null}
      {floor !== false ? <FloorMark text={floor || 'SIDEQUEST'} /> : null}
      <View style={[styles.inner, style]}>{children}</View>
    </SafeAreaView>
  );
}

export function ScreenScroll({
  children,
  refreshControl,
  atmosphere = true,
  floor,
}: {
  children: React.ReactNode;
  refreshControl?: React.ReactElement;
  atmosphere?: boolean;
  floor?: string | false;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      {atmosphere ? <Atmosphere /> : null}
      {floor !== false ? <FloorMark text={floor || 'SIDEQUEST'} /> : null}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Silver pill CTA — Damn Good / Dark gallery "Visit site" */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}) {
  if (variant === 'ghost') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.ghost,
          pressed && styles.ghostPressed,
          disabled && styles.disabled,
        ]}
      >
        <Text style={styles.ghostLabel}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export function CenterGhost({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.centerGhost, pressed && styles.ghostPressed]}
    >
      <Text style={styles.centerGhostLabel}>{label}</Text>
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
        selected && styles.chipOn,
        pressed && styles.chipPressed,
      ]}
    >
      {sticker ? <Sticker id={sticker} size="sm" /> : null}
      <Text style={[styles.chipLabel, selected && styles.chipSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <View style={styles.toggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: color.line, true: color.ink }}
        thumbColor={color.surface}
        ios_backgroundColor={color.line}
      />
    </View>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={color.muted}
      style={[styles.input, props.style]}
    />
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <Atmosphere />
      <ActivityIndicator color={color.ink} />
    </View>
  );
}

export function QuestRow({
  name,
  meta,
  sticker,
  onPress,
}: {
  name: string;
  meta?: string;
  sticker: StickerId;
  onPress: () => void;
  hook?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quest, pressed && styles.questPressed]}
    >
      <Sticker id={sticker} size="md" />
      <View style={styles.questText}>
        <Body>{name}</Body>
        {meta ? <Muted>{meta}</Muted> : null}
      </View>
    </Pressable>
  );
}

export function Brand({ sticker }: { sticker?: StickerId; knockout?: boolean }) {
  return (
    <View style={styles.brand}>
      <Text style={styles.brandWord}>SIDEQUEST</Text>
      {sticker ? <Sticker id={sticker} size="sm" /> : null}
    </View>
  );
}

export { Title, Body, Muted, Label, Display };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  inner: {
    flex: 1,
    paddingHorizontal: space[4],
    paddingTop: space[4],
    zIndex: 2,
  },
  scroll: {
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[9],
    zIndex: 2,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginBottom: space[5],
  },
  brandWord: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: 1,
    color: color.ink,
  },
  panel: {
    width: '100%',
    marginVertical: space[4],
  },
  eyebrow: {
    textAlign: 'center',
    color: color.muted,
    marginBottom: space[2],
  },
  button: {
    backgroundColor: color.surface,
    paddingVertical: 14,
    paddingHorizontal: space[6],
    alignItems: 'center',
    marginTop: space[4],
    alignSelf: 'center',
    borderRadius: poster.radius,
    minWidth: 180,
  },
  buttonPressed: {
    backgroundColor: color.ink,
  },
  buttonLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    letterSpacing: 0.2,
    color: color.onSurface,
  },
  ghost: {
    paddingVertical: space[3],
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  ghostPressed: {
    backgroundColor: color.floor,
  },
  ghostLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: color.ink,
    textAlign: 'center',
  },
  centerGhost: {
    paddingVertical: space[3],
    alignItems: 'center',
    width: '100%',
  },
  centerGhostLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: color.muted,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    marginHorizontal: space[1],
    marginBottom: space[2],
  },
  chipOn: {
    borderBottomWidth: 1,
    borderBottomColor: color.ink,
  },
  chipPressed: {
    backgroundColor: color.floor,
  },
  chipLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: color.muted,
  },
  chipSelected: {
    color: color.ink,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
  },
  toggleLabel: {
    fontFamily: fonts.sans,
    fontSize: typeScale.body.fontSize,
    color: color.ink,
  },
  input: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
    paddingVertical: space[3],
    fontSize: typeScale.body.fontSize,
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
  quest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
  },
  questPressed: {
    backgroundColor: color.floor,
  },
  questText: { flex: 1, gap: space[1] },
  disabled: { opacity: 0.35 },
});
