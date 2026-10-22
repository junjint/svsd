import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { GalleryRow } from '@/features/profile/GalleryRow';
import { ProfileHeader } from '@/features/profile/ProfileHeader';
import { SidequestCalendar } from '@/features/profile/SidequestCalendar';
import { useMostColorful } from '@/features/profile/colorfulness';
import { Chevron } from '@/features/folders/icons';
import { pickAvatar } from '@/features/folders/pickPhotos';
import { BadgeCelebration } from '@/features/quest/BadgeCelebration';
import { SuggestSheet } from '@/features/suggest/SuggestSheet';
import { TrophyCase } from '@/features/profile/TrophyCase';
import { useSidequestStore } from '@/stores/sidequestStore';
import { Paper, Text, TornPaper, color, space } from '@/theme';
import type { QuestFolder } from '@/types';
import { LiquidToggle, showToast, useTabBarSpace } from '@/ui';

/** The demo's stand-in until someone picks their own (Unsplash, free licence) */
const DEMO_AVATAR = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces&q=80&auto=format';

export default function ProfileScreen() {
  const tabSpace = useTabBarSpace();
  const prefs = useSidequestStore((s) => s.prefs);
  const cityLabel = useSidequestStore((s) => s.location.cityLabel);
  const quests = useSidequestStore((s) => s.quests);
  const folders = useSidequestStore((s) => s.folders);
  const badges = useSidequestStore((s) => s.badges);
  const updatePrefs = useSidequestStore((s) => s.updatePrefs);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const stats = useMemo(() => {
    const done = quests.filter((q) => q.status === 'completed');
    const cities = new Set(done.map((q) => q.cityLabel)).size;
    return [
      { value: done.length, label: 'Sidequests' },
      { value: cities, label: cities === 1 ? 'City' : 'Cities' },
      { value: folders.reduce((n, f) => n + f.photos.length, 0), label: 'Photos' },
    ];
  }, [quests, folders]);
  const gallery = useMemo(() => folders.filter((f) => f.savedToGallery), [folders]);
  // the banner is the most colourful sidequest photo, blurred down to its colours
  const photoUris = useMemo(() => folders.flatMap((f) => f.photos.map((p) => p.uri)).slice(0, 80), [folders]);
  const banner = useMostColorful(photoUris);
  const changeAvatar = async () => {
    const uri = await pickAvatar();
    if (uri === 'denied') showToast('Allow photo access in Settings to add one');
    else if (uri) void updatePrefs({ avatarUri: uri });
  };
  const isPublic = prefs.profileVisibility === 'public';
  const openFolder = (f: QuestFolder) => router.push({ pathname: '/folder/[id]', params: { id: f.id } });

  return (
    <Paper>
      <ScrollView contentContainerStyle={{ paddingBottom: tabSpace, gap: space.xxl }} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          name={prefs.displayName}
          city={prefs.confirmedCity ?? cityLabel}
          banner={banner}
          avatar={prefs.avatarUri ?? DEMO_AVATAR}
          onAvatar={() => void changeAvatar()}
          stats={stats}
          onRename={(n) => void updatePrefs({ displayName: n || undefined })}
          onSettings={() => router.push('/settings')}
        />

        <SidequestCalendar folders={folders} onOpen={openFolder} />

        <TrophyCase earned={badges} />

        <GalleryRow folders={gallery} visibility={prefs.profileVisibility} onOpen={openFolder} />

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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Suggest a sidequest"
          onPress={() => setSuggestOpen(true)}
          style={({ pressed }) => [styles.cardWrap, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        >
          <TornPaper seed="profile-suggest" contentStyle={styles.card}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="headline">Suggest a sidequest</Text>
              <Text variant="caption" style={{ color: color.ink2 }}>One a day. It joins the pool for everyone here</Text>
            </View>
            <Chevron dir="right" tint={color.ink2} />
          </TornPaper>
        </Pressable>
      </ScrollView>
      <SuggestSheet visible={suggestOpen} onClose={() => setSuggestOpen(false)} />
      <BadgeCelebration delayMs={600} />
    </Paper>
  );
}

const styles = StyleSheet.create({
  cardWrap: { marginHorizontal: space.xl },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, minHeight: 72 },
});
