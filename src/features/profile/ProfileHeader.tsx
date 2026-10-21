import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Text, color, fonts, space } from '@/theme';
import { Pencil } from '@/features/folders/icons';

/** The glowing avatar, an editable serif name and home city */
export function ProfileHeader({ name, city, onRename }: { name?: string; city: string; onRename: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name ?? '');
  const shown = name?.trim() || 'Sidequester';

  useEffect(() => setDraft(name ?? ''), [name]);

  const commit = () => {
    setEditing(false);
    const n = draft.trim();
    if (n !== (name ?? '')) onRename(n);
  };

  return (
    <View style={styles.root}>
      <Avatar initial={shown[0]!.toUpperCase()} />
      {editing ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          autoFocus
          maxLength={32}
          returnKeyType="done"
          placeholder="Your name"
          placeholderTextColor={color.ink3}
          style={styles.nameInput}
          accessibilityLabel="Display name"
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Display name, ${shown}. Edit`}
          onPress={() => setEditing(true)}
          style={styles.nameRow}
          hitSlop={8}
        >
          <Text variant="display" numberOfLines={1} style={{ textAlign: 'center' }}>
            {shown}
          </Text>
          <View style={{ opacity: 0.35, marginTop: 8 }}>
            <Pencil size={12} />
          </View>
        </Pressable>
      )}
      <Text variant="callout">Home city · {city}</Text>
    </View>
  );
}

/** A round avatar with Pool's soft cobalt glow pooling beneath it */
function Avatar({ initial }: { initial: string }) {
  const still = useReducedMotion();
  const glow = useSharedValue(0);
  useEffect(() => {
    if (!still) glow.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [still, glow]);
  const halo = useAnimatedStyle(() => ({ opacity: 0.8 + 0.2 * glow.value, transform: [{ scale: 1 + 0.06 * glow.value }] }));
  return (
    <View style={styles.avatarWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* a soft halo: concentric translucent discs, centred, fading outward */}
      <Animated.View style={[styles.halo, halo]} pointerEvents="none">
        {HALO.map((r) => (
          <View key={r.d} style={{ position: 'absolute', width: r.d, height: r.d, borderRadius: r.d / 2, backgroundColor: `rgba(130,121,115,${r.a})` }} />
        ))}
      </Animated.View>
      <View style={styles.avatar}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 44, color: color.white, marginTop: 4 }}>{initial}</Text>
      </View>
    </View>
  );
}

/** diameters and alphas for the halo's rings, outermost first */
const HALO = [
  { d: 150, a: 0.035 },
  { d: 138, a: 0.045 },
  { d: 126, a: 0.06 },
  { d: 116, a: 0.08 },
  { d: 108, a: 0.1 },
];

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: space.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '90%', minHeight: 48 },
  nameInput: { fontFamily: fonts.serif, fontSize: 40, color: color.ink, textAlign: 'center', minWidth: 200, minHeight: 48, borderBottomWidth: 1, borderColor: color.cobalt },
  avatarWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: -space.xs },
  halo: { position: 'absolute', width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: color.cobalt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: color.white,
  },
});
