import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Paper, PillButton, Text, space } from '@/theme';
import { GalleryRow } from '@/features/profile/GalleryRow';
import { useSidequestStore } from '@/stores/sidequestStore';
import { useTabBarSpace } from '@/ui';

export default function GalleryScreen() {
  const folders = useSidequestStore(s => s.folders);
  const visibility = useSidequestStore(s => s.prefs.profileVisibility);
  const bottom = useTabBarSpace();
  return <Paper><ScrollView contentContainerStyle={{ paddingBottom: bottom, gap: space.xl }}>
    <View style={{ padding: space.xl }}><Text variant="display">Gallery</Text><Text variant="callout">The sidequests you chose to keep on display.</Text></View>
    <GalleryRow folders={folders.filter(f => f.savedToGallery)} visibility={visibility} onOpen={f => router.push({ pathname: '/folder/[id]', params: { id: f.id } })} />
    <View style={{ paddingHorizontal: space.xl }}><PillButton label="Wall of sidequests" onPress={() => router.push('/wall')} /></View>
  </ScrollView></Paper>;
}
