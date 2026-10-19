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
import { color, fonts, radius, space } from '../tokens';
import { Body, Display, Label, Muted, Title } from './Text';
import { Sticker } from './Sticker';
import { Atmosphere } from './Poster';
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
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  atmosphere?: boolean;
  floor?: string | false;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <Atmosphere />
      <View style={[styles.inner, style]}>{children}</View>
    </SafeAreaView>
  );
}

export function ScreenScroll({
  children,
  refreshControl,
}: {
  children: React.ReactNode;
  refreshControl?: React.ReactElement;
  atmosphere?: boolean;
  floor?: string | false;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <Atmosphere />
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

/** Moon primary button — piccolo fill, goten label, i-sm radius */
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
        trackColor={{ false: color.beerus, true: color.piccolo }}
        thumbColor={color.goten}
        ios_backgroundColor={color.beerus}
      />
    </View>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={color.trunks}
      style={[styles.input, props.style]}
    />
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={color.piccolo} />
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
      <View style={styles.logoMark}>
        <Text style={styles.logoText}>mo•n</Text>
      </View>
      <Text style={styles.brandWord}>Sidequest</Text>
      {sticker ? <Sticker id={sticker} size="sm" /> : null}
    </View>
  );
}

export { Title, Body, Muted, Label, Display };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.goku },
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
  logoMark: {
    backgroundColor: color.gohan,
    borderRadius: radius.sSm,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.beerus,
  },
  logoText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: color.bulma,
  },
  brandWord: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    letterSpacing: -0.4,
    color: color.bulma,
  },
  panel: {
    width: '100%',
    backgroundColor: color.gohan,
    borderRadius: radius.sMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.beerus,
    paddingHorizontal: space[3],
    marginVertical: space[4],
  },
  eyebrow: {
    marginBottom: space[2],
    color: color.trunks,
  },
  button: {
    backgroundColor: color.piccolo,
    paddingVertical: 12,
    paddingHorizontal: space[5],
    alignItems: 'center',
    marginTop: space[3],
    alignSelf: 'stretch',
    borderRadius: radius.iSm,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    letterSpacing: 0,
    color: color.goten,
  },
  ghost: {
    paddingVertical: space[3],
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: radius.iSm,
  },
  ghostPressed: {
    backgroundColor: color.hit,
  },
  ghostLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: color.bulma,
    textAlign: 'center',
  },
  centerGhost: {
    paddingVertical: space[3],
    alignItems: 'center',
    width: '100%',
  },
  centerGhostLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: color.trunks,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    marginHorizontal: space[1],
    marginBottom: space[2],
    borderRadius: radius.full,
    backgroundColor: color.hit,
  },
  chipOn: {
    backgroundColor: color.piccolo,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: color.bulma,
  },
  chipSelected: {
    color: color.goten,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.beerus,
  },
  toggleLabel: {
    fontFamily: fonts.sans,
    fontSize: typeScale.body.fontSize,
    color: color.bulma,
  },
  input: {
    backgroundColor: color.gohan,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.beerus,
    borderRadius: radius.iSm,
    paddingVertical: space[3],
    paddingHorizontal: space[3],
    fontSize: typeScale.body.fontSize,
    fontFamily: fonts.sans,
    color: color.bulma,
    marginVertical: space[2],
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.goku,
  },
  quest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.beerus,
  },
  questPressed: {
    backgroundColor: color.hit,
  },
  questText: { flex: 1, gap: space[1] },
  disabled: { opacity: 0.4 },
});
