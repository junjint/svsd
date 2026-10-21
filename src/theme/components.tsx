import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { feedback, type FeedbackEvent } from '@/services/sound';
import { FEATHER, color, fonts, radius, shadow, space, type } from './tokens';
import { Glass } from './Glass';

/* ── surfaces ───────────────────────────────────────────── */

/** Plain off-white paper: the app background on every screen */
export function Paper({ children, style, edges = ['top'] }: { children?: ReactNode; style?: StyleProp<ViewStyle>; edges?: Edge[] }) {
  return (
    <View style={[styles.paper, style]}>
      <SafeAreaView edges={edges} style={{ flex: 1 }}>
        {children}
      </SafeAreaView>
    </View>
  );
}

/** Liquid glass surfaces: icon buttons, sheets, the tab bar, toasts */
export function Frost({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle>; intensity?: number }) {
  const r = (StyleSheet.flatten as (s: unknown) => ViewStyle | undefined)(style)?.borderRadius;
  return (
    <Glass radius={typeof r === 'number' ? r : 0} style={[{ overflow: 'visible' }, style]}>
      {children}
    </Glass>
  );
}

/**
 * A photo whose edges feather into the background — the photo-viewer
 * reference. `on` is the colour it fades into (paper by default).
 */
export function FeatherImage({
  uri,
  style,
  feather = FEATHER,
  on = color.paper,
}: {
  uri: string;
  style?: StyleProp<ViewStyle>;
  feather?: number;
  on?: string;
}) {
  const clear = 'rgba(251,250,247,0)';
  return (
    <View style={[{ overflow: 'hidden', borderRadius: radius.card }, style]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      <LinearGradient colors={[on, clear]} style={[styles.edge, { top: 0, height: feather }]} />
      <LinearGradient colors={[clear, on]} style={[styles.edge, { bottom: 0, height: feather }]} />
      <LinearGradient colors={[on, clear]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.edgeV, { left: 0, width: feather }]} />
      <LinearGradient colors={[clear, on]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.edgeV, { right: 0, width: feather }]} />
    </View>
  );
}

/* ── type ───────────────────────────────────────────────── */

type Variant = keyof typeof type;

const INTER: Record<string, string> = {
  '400': fonts.sans,
  normal: fonts.sans,
  '500': fonts.sansMedium,
  '600': fonts.sansSemi,
  '700': fonts.sansBold,
  bold: fonts.sansBold,
  '800': fonts.sansBold,
  '900': fonts.sansBold,
};
const GARAMOND = new Set<string>([fonts.serif, fonts.serifItalic]);

/**
 * Custom fonts ship one file per weight, so `fontWeight` can't pick the
 * face. Read the weight and style a text asks for and hand back the
 * Inter or Garamond file that draws it.
 */
export function resolveFont(style: StyleProp<TextStyle>): TextStyle {
  const f = StyleSheet.flatten(style) ?? {};
  const fam = f.fontFamily;
  if (fam && GARAMOND.has(fam)) {
    return { fontFamily: f.fontStyle === 'italic' ? fonts.serifItalic : fam, fontWeight: 'normal', fontStyle: 'normal' };
  }
  if (fam && !fam.startsWith('Inter_')) return {};
  const weight = String(f.fontWeight ?? (fam ? fam.slice(6, 9) : '400'));
  return { fontFamily: INTER[weight] ?? fonts.sans, fontWeight: 'normal' };
}

export function Text({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  const merged = [type[variant] as TextStyle, style];
  return <RNText {...rest} style={[merged, resolveFont(merged)]} />;
}

/* ── controls ───────────────────────────────────────────── */

/** The main action: ink-tinted liquid glass. `frost` is the clear-glass secondary */
export function PillButton({
  label,
  onPress,
  disabled,
  tone = 'cobalt',
  sound = 'drawPress',
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'cobalt' | 'ink' | 'frost';
  sound?: FeedbackEvent | null;
  style?: StyleProp<ViewStyle>;
}) {
  const clear = tone === 'frost';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        if (sound) feedback(sound);
        onPress();
      }}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}
    >
      <Glass tone={clear ? 'clear' : 'ink'} interactive style={styles.pill}>
        <Text variant="headline" style={{ color: clear ? color.ink : color.white }}>{label}</Text>
      </Glass>
    </Pressable>
  );
}

/** Round frosted icon button (back, grid, close) */
export function GlassIconButton({
  children,
  onPress,
  label,
  size = 40,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  size?: number;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8}>
      {({ pressed }) => (
        <Frost style={[{ width: size, height: size, borderRadius: size / 2, transform: [{ scale: pressed ? 0.92 : 1 }] }, shadow.lift]}>
          <View style={styles.center}>{children}</View>
        </Frost>
      )}
    </Pressable>
  );
}

/** Ink count pill (Pool's "712") — counts only */
export function CountPill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.count}>
      <Text style={styles.countText}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: { flex: 1, backgroundColor: color.paper },
  frostWrap: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: color.frostEdge },
  edge: { position: 'absolute', left: 0, right: 0 },
  edgeV: { position: 'absolute', top: 0, bottom: 0 },
  pill: { height: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  count: { minWidth: 44, height: 30, borderRadius: radius.pill, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },
  countText: { color: color.white, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
