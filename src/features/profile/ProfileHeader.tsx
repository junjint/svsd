import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Gear } from '@/features/folders/icons';
import { Decor, GlassIconButton, Text, color, fonts, space } from '@/theme';
import { RollingCounter } from '@/ui';

const BANNER_H = 148;
/* push the banner's colour further where the platform can (web) */
const VIVID = Platform.OS === 'web' ? ({ filter: 'saturate(1.6) brightness(1.04)' } as object) : null;
const AVATAR = 92;

export interface ProfileStat {
  value: number;
  label: string;
}

/**
 * The top of the profile, after a plain profile card: a banner (the most
 * colourful sidequest photo, blurred until it's only colour), the avatar
 * sitting on its lower edge, the name with Edit and Settings beside it,
 * a rule, then the numbers.
 */
export function ProfileHeader({
  name,
  city,
  banner,
  avatar,
  stats,
  onRename,
  onSettings,
  onAvatar,
}: {
  name?: string;
  city: string;
  banner?: string;
  avatar?: string;
  stats: ProfileStat[];
  onRename: (n: string) => void;
  onSettings: () => void;
  onAvatar: () => void;
}) {
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
    <View>
      <View style={styles.banner} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {banner ? (
          <Image source={{ uri: banner }} blurRadius={28} contentFit="cover" transition={300} style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.25 }] }, VIVID]} />
        ) : (
          <LinearGradient colors={[color.mist, color.line]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        )}
        {/* a wash of saturation, then chrome on top: decoration, not interface */}
        <LinearGradient colors={['rgba(255,255,255,0.0)', 'rgba(21,16,14,0.18)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        <Decor name="archWire" width={300} style={styles.bannerArch} />
        <Decor name="swallow" width={104} style={styles.bannerBird} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={avatar ? 'Change profile photo' : 'Add a profile photo'}
        onPress={onAvatar}
        style={({ pressed }) => [styles.avatar, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
      >
        <View style={styles.avatarClip}>
          {avatar ? (
            <Image source={{ uri: avatar }} contentFit="cover" transition={200} style={StyleSheet.absoluteFill} />
          ) : (
            <Text style={styles.initial}>{shown[0]!.toUpperCase()}</Text>
          )}
        </View>
        {/* a small + on the rim says the photo can be changed */}
        <View style={styles.badge}>
          <View style={[styles.badgeBar, { width: 10, height: 1.8 }]} />
          <View style={[styles.badgeBar, { width: 1.8, height: 10 }]} />
        </View>
      </Pressable>

      <View style={styles.nameRow}>
        <View style={{ flex: 1, gap: 2 }}>
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
            <Text style={styles.name} numberOfLines={1} accessibilityRole="header">
              {shown}
            </Text>
          )}
          <Text variant="callout">{city}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Done editing name' : `Edit name, ${shown}`}
          onPress={() => (editing ? commit() : setEditing(true))}
          style={({ pressed }) => [styles.edit, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
        >
          <Text style={styles.editText}>{editing ? 'Done' : 'Edit'}</Text>
        </Pressable>
        <GlassIconButton label="Settings" onPress={onSettings} size={40}>
          <Gear size={17} />
        </GlassIconButton>
      </View>

      <View style={styles.rule} />

      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat} accessible accessibilityLabel={`${s.value} ${s.label}`}>
            <RollingCounter value={s.value} size="lg" />
            <Text variant="caption">{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { height: BANNER_H, marginHorizontal: space.lg, marginTop: space.sm, borderRadius: 26, overflow: 'hidden', backgroundColor: color.mist },
  bannerArch: { position: 'absolute', alignSelf: 'center', top: 10, opacity: 0.85 },
  bannerBird: { position: 'absolute', right: 18, top: 22, transform: [{ rotate: '-8deg' }] },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    marginTop: -AVATAR / 2,
    marginLeft: space.xl + space.sm,
    backgroundColor: color.paper,
    padding: 4,
  },
  avatarClip: { flex: 1, borderRadius: AVATAR / 2, overflow: 'hidden', backgroundColor: color.mist, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.ink,
    borderWidth: 2,
    borderColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBar: { position: 'absolute', borderRadius: 1, backgroundColor: color.white },
  initial: { fontFamily: fonts.serif, fontSize: 42, lineHeight: 48, color: color.ink, marginTop: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.xl, marginTop: space.md },
  name: { fontFamily: fonts.sansBold, fontSize: 24, lineHeight: 28, letterSpacing: -0.8, color: color.ink },
  nameInput: { fontFamily: fonts.sansBold, fontSize: 24, lineHeight: 28, letterSpacing: -0.8, color: color.ink, padding: 0, borderBottomWidth: 1, borderColor: color.ink },
  edit: { height: 40, paddingHorizontal: 20, borderRadius: 20, backgroundColor: color.ink, justifyContent: 'center' },
  editText: { fontFamily: fonts.sansSemi, fontSize: 14, color: color.white },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: color.ink3, marginHorizontal: space.xl, marginTop: space.lg },
  stats: { flexDirection: 'row', paddingHorizontal: space.xl, paddingTop: space.lg },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
});
