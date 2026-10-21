import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PillButton, Text, color, shadow, space } from '@/theme';
import { Plus } from '../icons';
import { Actions } from './Actions';

/** An empty folder: a little stack of blank prints breathing, and one big add button */
export function EmptyFolder({
  title,
  sub,
  busy,
  onAdd,
  onEdit,
  onMore,
}: {
  title: string;
  sub: string;
  busy: boolean;
  onAdd: () => void;
  onEdit: () => void;
  onMore: () => void;
}) {
  const still = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    t.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })),
      -1
    );
  }, [still, t]);
  const left = useAnimatedStyle(() => ({ transform: [{ translateX: -34 - 6 * t.value }, { rotate: `${-10 - 3 * t.value}deg` }] }));
  const right = useAnimatedStyle(() => ({ transform: [{ translateX: 34 + 6 * t.value }, { rotate: `${9 + 3 * t.value}deg` }] }));
  const mid = useAnimatedStyle(() => ({ transform: [{ translateY: -4 * t.value }] }));

  return (
    <View style={styles.root}>
      <View style={styles.art}>
        <Animated.View style={[styles.print, left]} />
        <Animated.View style={[styles.print, right]} />
        <Animated.View style={[styles.print, styles.front, mid]}>
          <View style={styles.plus}>
            <Plus size={20} tint={color.cobalt} />
          </View>
        </Animated.View>
      </View>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text variant="title" style={{ textAlign: 'center' }} accessibilityRole="header">
          {title}
        </Text>
        <Text variant="callout" style={{ color: color.ink3 }}>{sub}</Text>
      </View>
      <Text variant="body" style={{ color: color.ink2, textAlign: 'center', maxWidth: 280 }}>
        Empty for now. Add the photos you took, or save this for the ones you're about to.
      </Text>
      <PillButton label={busy ? 'Opening photos…' : 'Add photos'} sound={null} disabled={busy} onPress={onAdd} style={{ alignSelf: 'stretch' }} />
      <View style={{ marginTop: space.sm }}>
        <Actions onAdd={onAdd} onEdit={onEdit} onMore={onMore} hideAdd />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl, gap: space.lg, paddingBottom: space.xxl },
  art: { width: 240, height: 210, alignItems: 'center', justifyContent: 'center' },
  print: {
    position: 'absolute',
    width: 128,
    height: 156,
    borderRadius: 18,
    backgroundColor: '#F2F2EF',
    borderWidth: 6,
    borderColor: color.white,
    ...shadow.float,
    shadowOpacity: 0.08,
  },
  front: { backgroundColor: color.white, alignItems: 'center', justifyContent: 'center', borderColor: color.white },
  plus: { width: 56, height: 56, borderRadius: 28, backgroundColor: color.cobaltSoft, alignItems: 'center', justifyContent: 'center' },
});
