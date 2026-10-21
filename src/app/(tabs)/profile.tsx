import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Gear } from '@/features/folders/icons';
import { GalleryRow } from '@/features/profile/GalleryRow';
import { ProfileHeader } from '@/features/profile/ProfileHeader';
import { TrophyCase } from '@/features/profile/TrophyCase';
import { useSidequestStore } from '@/stores/sidequestStore';
import { GlassIconButton, Paper, Text, TornPaper, color, radius, space } from '@/theme';
import { LiquidToggle, RollingCounter, showToast, useTabBarSpace } from '@/ui';

export default function ProfileScreen() {
  const tabSpace = useTabBarSpace();
  const prefs = useSidequestStore((s) => s.prefs);
  const cityLabel = useSidequestStore((s) => s.location.cityLabel);
  const quests = useSidequestStore((s) => s.quests);
  const folders = useSidequestStore((s) => s.folders);
  const badges = useSidequestStore((s) => s.badges);
  const updatePrefs = useSidequestStore((s) => s.updatePrefs);

  const stats = useMemo(() => {
    const done = quests.filter((q) => q.status === 'completed');
    return {
      completed: done.length,
      cities: new Set(done.map((q) => q.cityLabel)).size,
      legendary: quests.filter((q) => q.rarity === 'legendary').length,
    };
  }, [quests]);
  const gallery = useMemo(() => folders.filter((f) => f.savedToGallery), [folders]);
  const isPublic = prefs.profileVisibility === 'public';

  return (
    <Paper>
      <ScrollView contentContainerStyle={{ paddingBottom: tabSpace, gap: space.xxl }} showsVerticalScrollIndicator={false}>
        <View>
          <View style={styles.top}>
            <GlassIconButton label="Settings" onPress={() => router.push('/settings')} size={44}>
              <Gear size={18} />
            </GlassIconButton>
          </View>
          <ProfileHeader name={prefs.displayName} city={prefs.confirmedCity ?? cityLabel} onRename={(n) => void updatePrefs({ displayName: n || undefined })} />
        </View>

        <View style={styles.stats}>
          <Stat value={stats.completed} label="Quests" />
          <View style={styles.rule} />
          <Stat value={stats.cities} label={stats.cities === 1 ? 'City' : 'Cities'} />
          <View style={styles.rule} />
          <Stat value={stats.legendary} label="Legendary" />
        </View>

        <TornPaper seed="profile-privacy" style={styles.cardWrap} contentStyle={styles.card}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="headline">Private profile</Text>
            <Text variant="caption" style={{ color: color.ink2 }}>
              {isPublic ? 'Your profile and Gallery can be seen by other Sidequesters' : 'Only you can see your profile and Gallery'}
            </Text>
          </View>
          <LiquidToggle
            value={!isPublic}
            label="Private profile"
            onChange={(priv) => {
              void updatePrefs({ profileVisibility: priv ? 'private' : 'public' });
              showToast(priv ? 'Profile is private' : 'Profile is public');
            }}
          />
        </TornPaper>

        <TrophyCase earned={badges} />

        <GalleryRow folders={gallery} visibility={prefs.profileVisibility} onOpen={(f) => router.push({ pathname: '/folder/[id]', params: { id: f.id } })} />

        <TornPaper seed="profile-suggest" style={[styles.cardWrap, { opacity: 0.55 }]} contentStyle={styles.card}>
        <View
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}
          accessible
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          accessibilityLabel="Suggest a sidequest. Coming soon"
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="headline">Suggest a sidequest</Text>
            <Text variant="caption" style={{ color: color.ink2 }}>Send us an idea for the deck</Text>
          </View>
          <View style={styles.soon}>
            <Text variant="caption" style={{ color: color.ink2, fontWeight: '600' }}>Coming soon</Text>
          </View>
        </View>
        </TornPaper>
      </ScrollView>
    </Paper>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }} accessible accessibilityLabel={`${value} ${label}`}>
      <RollingCounter value={value} size="lg" />
      <Text variant="caption" style={{ color: color.ink2 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.lg, paddingTop: space.sm },
  stats: { flexDirection: 'row', alignItems: 'center', marginHorizontal: space.xl },
  rule: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: color.line },
  cardWrap: { marginHorizontal: space.xl },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, minHeight: 72 },
  soon: { paddingHorizontal: 10, height: 26, borderRadius: radius.pill, backgroundColor: color.line, justifyContent: 'center' },
});
