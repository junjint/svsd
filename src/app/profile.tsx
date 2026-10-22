import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ProfileHeader } from '@/features/profile/ProfileHeader';
import { SidequestCalendar } from '@/features/profile/SidequestCalendar';
import { useMostColorful } from '@/features/profile/colorfulness';
import { Chevron } from '@/features/folders/icons';
import { pickAvatar } from '@/features/folders/pickPhotos';
import { BadgeCelebration } from '@/features/quest/BadgeCelebration';
import { SuggestSheet } from '@/features/suggest/SuggestSheet';
import { PURPOSE } from '@/features/onboarding/purposeCopy';
import { WhySheet } from '@/features/profile/WhySheet';
import { DEMO_AVATAR } from '@/features/profile/avatar';
import { TrophyCase } from '@/features/profile/TrophyCase';
import { useSidequestStore } from '@/stores/sidequestStore';
import { GlassIconButton, Paper, Text, TornPaper, color, space } from '@/theme';
import type { QuestFolder } from '@/types';
import { showToast } from '@/ui';

/* a page now, not a tab: on the web it brings its own entrance, like the sidequest page */
const PAGE_IN = Platform.OS === 'web' ? FadeInDown.duration(420).easing(Easing.bezier(0.22, 1, 0.36, 1)) : undefined;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/draw'));
  const prefs = useSidequestStore((s) => s.prefs);
  const cityLabel = useSidequestStore((s) => s.location.cityLabel);
  const quests = useSidequestStore((s) => s.quests);
  const folders = useSidequestStore((s) => s.folders);
  const badges = useSidequestStore((s) => s.badges);
  const updatePrefs = useSidequestStore((s) => s.updatePrefs);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const stats = useMemo(() => {
    const done = quests.filter((q) => q.status === 'completed');
    const cities = new Set(done.map((q) => q.cityLabel)).size;
    return [
      { value: done.length, label: 'Sidequests' },
      { value: cities, label: cities === 1 ? 'City' : 'Cities' },
      { value: folders.reduce((n, f) => n + f.photos.length, 0), label: 'Photos' },
    ];
  }, [quests, folders]);
  // the banner is the most colourful sidequest photo, blurred down to its colours
  const photoUris = useMemo(() => folders.flatMap((f) => f.photos.map((p) => p.uri)).slice(0, 80), [folders]);
  const banner = useMostColorful(photoUris);
  const changeAvatar = async () => {
    const uri = await pickAvatar();
    if (uri === 'denied') showToast('Allow photo access in Settings to add one');
    else if (uri) void updatePrefs({ avatarUri: uri });
  };
  const openFolder = (f: QuestFolder) => router.push({ pathname: '/folder/[id]', params: { id: f.id } });

  return (
    <Paper>
      <Animated.View style={{ flex: 1 }} entering={PAGE_IN}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl, gap: space.xxl }} showsVerticalScrollIndicator={false}>
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

        {/* the two cards sit together, closer than the sections above */}
        <View style={{ gap: space.md }}>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={PURPOSE.story.title}
            onPress={() => setWhyOpen(true)}
            style={({ pressed }) => [styles.cardWrap, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <TornPaper seed="profile-why" contentStyle={styles.card}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="headline">{PURPOSE.story.title}</Text>
                <Text variant="caption" style={{ color: color.ink2 }}>{PURPOSE.story.subtitle}</Text>
              </View>
              <Chevron dir="right" tint={color.ink2} />
            </TornPaper>
          </Pressable>
        </View>
      </ScrollView>
      {/* back to the Draw, floating over the banner's corner */}
      <View style={styles.back} pointerEvents="box-none">
        <GlassIconButton label="Back" onPress={back}>
          <Chevron size={14} />
        </GlassIconButton>
      </View>
      </Animated.View>
      <SuggestSheet visible={suggestOpen} onClose={() => setSuggestOpen(false)} />
      <WhySheet visible={whyOpen} onClose={() => setWhyOpen(false)} />
      <BadgeCelebration delayMs={600} />
    </Paper>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', top: space.sm + 12, left: space.lg + 12 },
  cardWrap: { marginHorizontal: space.xl },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, minHeight: 72 },
});
