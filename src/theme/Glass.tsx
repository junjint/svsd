import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';

export type GlassTone = 'clear' | 'ink';

/** Real Liquid Glass on iOS 26; everywhere else, the same look built by hand */
const NATIVE_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

const INK_TINT = 'rgba(21,16,14,0.82)';

/**
 * Apple-style Liquid Glass. `clear` for most controls, `ink` for the one
 * main action. The fallback stacks a blur, a thin fill, a bright rim along
 * the top edge, a soft inner glow and a light lift, so it reads as glass
 * on paper rather than a painted button.
 */
export function Glass({
  tone = 'clear',
  radius = 999,
  interactive = false,
  style,
  children,
}: {
  tone?: GlassTone;
  radius?: number;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  if (NATIVE_GLASS) {
    return (
      <GlassView
        glassEffectStyle="regular"
        isInteractive={interactive}
        tintColor={tone === 'ink' ? INK_TINT : undefined}
        style={[{ borderRadius: radius, overflow: 'hidden' }, style]}
      >
        {children}
      </GlassView>
    );
  }
  const ink = tone === 'ink';
  return (
    <View style={[{ borderRadius: radius }, ink ? styles.liftInk : styles.lift, style]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} pointerEvents="none">
        <BlurView intensity={ink ? 30 : 24} tint={ink ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: ink ? INK_TINT : 'rgba(255,255,255,0.42)' }]} />
        {/* specular sheen across the upper half */}
        <LinearGradient
          colors={ink ? ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']}
          locations={[0, 0.55]}
          style={StyleSheet.absoluteFill}
        />
        {/* the rim: bright on top, a faint dark line underneath */}
        <View style={[StyleSheet.absoluteFill, { borderRadius: radius }, ink ? styles.rimInk : styles.rim]} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  lift: {
    boxShadow: '0 6px 18px rgba(21,16,14,0.08), 0 1px 2px rgba(21,16,14,0.06)',
  },
  liftInk: {
    boxShadow: '0 8px 22px rgba(21,16,14,0.22), 0 1px 2px rgba(21,16,14,0.2)',
  },
  rim: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.95), inset 0 -1px 1px rgba(21,16,14,0.07), inset 0 0 10px rgba(255,255,255,0.35)',
  },
  rimInk: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -1px 1px rgba(0,0,0,0.3)',
  },
});
