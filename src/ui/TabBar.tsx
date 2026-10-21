import { useContext, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text as RNText } from '@/theme';
import type { ViewStyle } from 'react-native';
import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from 'expo-router/js-tabs';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { feedback } from '@/services/sound';
import { Frost, color, shadow } from '@/theme';
import { OPEN_EASE, TILE } from './motion';
import { TAB_ICONS } from './TabIcons';

/* Port of Bencho `tab-bar`: icon tabs on a floating frosted bar. The tab
   you pick opens to show its name, and ONE light tile slides under it on
   a spring (a slide is one event; a fade would be two). A tab opens on
   the block's 600ms ease-out while the tile chases it on its own spring,
   so the tile overshoots the tab a touch and settles. */

/* the name's fades use CSS `ease` */
const CSS_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

const PAD = 5;
const GAP = 2;
const TAB_H = 48;
const ICON = 20;
const PAD_X = 14;
const LABEL_GAP = 8;
const CLOSED = PAD_X * 2 + ICON;
const BAR_R = 24;

/** Height of the floating bar itself */
export const TAB_BAR_HEIGHT = TAB_H + PAD * 2;

const barBottom = (insetBottom: number) => (insetBottom > 0 ? Math.max(insetBottom - 6, 12) : 16);

/** Bottom padding a tab screen needs so its content clears the floating bar */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + barBottom(insets.bottom) + 16;
}

/** Same as useTabBarSpace (both names are in use) */
export const useTabBarInset = useTabBarSpace;

const openWidth = (labelW: number) => PAD_X + ICON + LABEL_GAP + labelW + PAD_X + 4;

export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const reportHeight = useContext(BottomTabBarHeightCallbackContext);
  const labels = state.routes.map((r) => {
    const t = descriptors[r.key]?.options.title;
    return typeof t === 'string' ? t : r.name;
  });
  /* measured label widths; a guess until the hidden copies lay out */
  const [labelW, setLabelW] = useState<number[]>(() => labels.map((l) => l.length * 7.6));
  const widths = labels.map((_, i) => (i === state.index ? openWidth(labelW[i] ?? 40) : CLOSED));
  const tileX = PAD + widths.slice(0, state.index).reduce((a, w) => a + w + GAP, 0);
  const tileW = widths[state.index] ?? CLOSED;

  const x = useSharedValue(tileX);
  const w = useSharedValue(tileW);
  useEffect(() => {
    x.value = still ? tileX : withSpring(tileX, TILE);
    w.value = still ? tileW : withSpring(tileW, TILE);
  }, [tileX, tileW, still, x, w]);

  const tile = useAnimatedStyle(() => ({ width: w.value, transform: [{ translateX: x.value }] }));

  /* a screen hides the bar with setOptions({ tabBarStyle: { display: 'none' } });
     it sinks out of view rather than vanishing */
  const focusedStyle = StyleSheet.flatten(descriptors[state.routes[state.index]?.key ?? '']?.options.tabBarStyle as never) as ViewStyle | undefined;
  const hidden = focusedStyle?.display === 'none';
  const bottom = barBottom(insets.bottom);
  const sink = useSharedValue(hidden ? 1 : 0);
  useEffect(() => {
    sink.value = still ? (hidden ? 1 : 0) : withSpring(hidden ? 1 : 0, TILE);
  }, [hidden, still, sink]);
  const drop = TAB_BAR_HEIGHT + bottom + 24;
  const wrapStyle = useAnimatedStyle(() => ({
    opacity: still ? 1 - sink.value : 1,
    transform: [{ translateY: still ? 0 : sink.value * drop }],
  }));

  useEffect(() => {
    reportHeight?.(hidden ? 0 : TAB_BAR_HEIGHT + bottom);
  }, [reportHeight, bottom, hidden]);

  return (
    <Animated.View pointerEvents={hidden ? 'none' : 'box-none'} style={[styles.wrap, { bottom }, wrapStyle]}>
      {/* invisible copies, so each name's real width is known */}
      <View style={styles.measure} pointerEvents="none" aria-hidden>
        {labels.map((l, i) => (
          <RNText
            key={l}
            style={styles.label}
            onLayout={(e) => {
              const width = Math.ceil(e.nativeEvent.layout.width);
              setLabelW((prev) => (prev[i] === width ? prev : Object.assign([...prev], { [i]: width })));
            }}
          >
            {l}
          </RNText>
        ))}
      </View>

      <Frost intensity={50} style={[styles.bar, shadow.float]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(17,17,20,0.05)' }]} />
        <Animated.View style={[styles.tile, tile]} />
        <View role="tablist" style={styles.row}>
          {state.routes.map((route, i) => {
            const focused = i === state.index;
            const Icon = TAB_ICONS[route.name];
            const onPress = () => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                feedback('tabSwitch');
                navigateToTab(route.key);
              }
            };
            return (
              <Tab
                key={route.key}
                label={labels[i]!}
                index={i}
                count={state.routes.length}
                focused={focused}
                width={widths[i]!}
                still={still}
                onPress={onPress}
                onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
                icon={(tint) => (Icon ? <Icon tint={tint} /> : null)}
              />
            );
          })}
        </View>
      </Frost>
    </Animated.View>
  );
}

function Tab({
  label,
  index,
  count,
  focused,
  width,
  still,
  onPress,
  onLongPress,
  icon,
}: {
  label: string;
  index: number;
  count: number;
  focused: boolean;
  width: number;
  still: boolean;
  onPress: () => void;
  onLongPress: () => void;
  icon: (tint: string) => React.ReactNode;
}) {
  const w = useSharedValue(width);
  const ink = useSharedValue(focused ? 1 : 0);
  const slide = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    w.value = still ? width : withTiming(width, OPEN_EASE);
  }, [width, still, w]);

  /* the name slides out from behind the icon as the room opens: a beat
     late, fading over 420ms while it travels 8px over 600ms. Closing, it
     fades in 160ms and slides back over 420ms, both at once. */
  useEffect(() => {
    if (still) {
      ink.value = slide.value = focused ? 1 : 0;
    } else if (focused) {
      ink.value = withDelay(160, withTiming(1, { duration: 420, easing: CSS_EASE }));
      slide.value = withDelay(160, withTiming(1, OPEN_EASE));
    } else {
      ink.value = withTiming(0, { duration: 160, easing: CSS_EASE });
      slide.value = withTiming(0, { ...OPEN_EASE, duration: 420 });
    }
  }, [focused, still, ink, slide]);

  const box = useAnimatedStyle(() => ({ width: w.value }));
  const word = useAnimatedStyle(() => ({ opacity: ink.value, transform: [{ translateX: (1 - slide.value) * -8 }] }));
  const tint = focused ? color.cobalt : color.ink;

  return (
    <Pressable
      role="tab"
      accessibilityRole="tab"
      accessibilityLabel={`${label}, tab, ${index + 1} of ${count}`}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}
    >
      <Animated.View style={[styles.tab, box]}>
        <View style={styles.icon}>{icon(tint)}</View>
        <Animated.Text numberOfLines={1} style={[styles.label, styles.name, { color: tint }, word]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  measure: { position: 'absolute', opacity: 0, flexDirection: 'row', left: -1000 },
  bar: { borderRadius: BAR_R, padding: PAD },
  row: { flexDirection: 'row', gap: GAP },
  tile: {
    position: 'absolute',
    top: PAD,
    left: 0,
    height: TAB_H,
    borderRadius: BAR_R - PAD,
    backgroundColor: color.white,
    ...shadow.lift,
  },
  tab: { height: TAB_H, overflow: 'hidden', justifyContent: 'center' },
  icon: { position: 'absolute', left: PAD_X, top: (TAB_H - ICON) / 2 },
  label: { fontSize: 14, fontWeight: '600', letterSpacing: -0.1 },
  name: { position: 'absolute', left: PAD_X + ICON + LABEL_GAP, width: 120 },
});
