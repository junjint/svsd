import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SNAP } from './motion';

/** Pressable that springs down to ~0.97 while held */
export function PressScale({
  children,
  style,
  scaleTo = 0.97,
  outerStyle,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** layout for the pressable itself (flex in a row); `style` is the scaled body */
  outerStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
}) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={outerStyle}
      onPressIn={(e) => {
        s.value = withSpring(scaleTo, SNAP);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, SNAP);
        rest.onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}
