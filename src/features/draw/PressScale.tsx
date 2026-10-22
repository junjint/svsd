import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { HoverContext } from '@/theme';
import { SNAP } from './motion';

/**
 * Pressable that springs down to ~0.97 while held. Under a pointer it
 * rises a touch, and tells any glass inside (HoverContext) to brighten.
 */
export function PressScale({
  children,
  style,
  scaleTo = 0.97,
  hoverTo = 1.02,
  outerStyle,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** layout for the pressable itself (flex in a row); `style` is the scaled body */
  outerStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hoverTo?: number;
}) {
  const s = useSharedValue(1);
  const [hovered, setHovered] = useState(false);
  const held = useSharedValue(false);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const live = !rest.disabled;
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={outerStyle}
      onHoverIn={(e) => {
        if (live) {
          setHovered(true);
          if (!held.value) s.value = withSpring(hoverTo, SNAP);
        }
        rest.onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        setHovered(false);
        if (!held.value) s.value = withSpring(1, SNAP);
        rest.onHoverOut?.(e);
      }}
      onPressIn={(e) => {
        held.value = true;
        s.value = withSpring(scaleTo, SNAP);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        held.value = false;
        s.value = withSpring(hovered ? hoverTo : 1, SNAP);
        rest.onPressOut?.(e);
      }}
    >
      <HoverContext.Provider value={hovered}>
        <Animated.View style={[style, anim]}>{children}</Animated.View>
      </HoverContext.Provider>
    </Pressable>
  );
}
