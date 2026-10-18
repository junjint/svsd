import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Body,
  Button,
  Chip,
  EditorialHeadline,
  Field,
  Mono,
  Muted,
  Screen,
  Section,
  Sticker,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import type { Mood } from '@/types';
import { stickerForCategory } from '@/design';
import { space } from '@/design/tokens';

const MOODS: Mood[] = [
  'curious',
  'calm',
  'energized',
  'inspired',
  'surprised',
  'reflective',
];

export default function CompleteQuestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const quest = useAppStore((s) => s.sidequests.find((q) => q.id === id));
  const completeQuest = useAppStore((s) => s.completeQuest);

  const [reflection, setReflection] = useState('');
  const [mood, setMood] = useState<Mood | undefined>();
  const [rating, setRating] = useState<number | undefined>();
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  if (!quest) {
    return (
      <Screen>
        <EditorialHeadline before="Missing " script="quest" sticker="pause" level="title" />
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: space[10] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Sticker
            id={stickerForCategory(quest.category)}
            size="xl"
            tilt={-6}
          />
          <View style={{ flex: 1 }}>
            <EditorialHeadline
              before="New "
              script="chapter"
              sticker="pencil"
              level="title"
            />
            <Mono>{quest.placeName}</Mono>
          </View>
        </View>

        <Body style={{ marginTop: space[3] }}>Prompt: {quest.storyHook}</Body>

        <Section title="Reflection" sticker="journal">
          <Field
            value={reflection}
            onChangeText={setReflection}
            placeholder="What did you discover?"
            multiline
            style={{ minHeight: 100 }}
          />
        </Section>

        <Section title="Mood" sticker="orb">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {MOODS.map((m) => (
              <Chip
                key={m}
                label={m}
                selected={mood === m}
                onPress={() => setMood(m)}
              />
            ))}
          </View>
        </Section>

        <Section title="Rating" sticker="spark">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip
                key={n}
                label={`${n}`}
                selected={rating === n}
                onPress={() => setRating(n)}
              />
            ))}
          </View>
        </Section>

        <Section title="Photo" sticker="art">
          <Muted>Stays on-device in this MVP.</Muted>
          <Button
            label={photoUri ? 'Change photo' : 'Attach photo'}
            variant="secondary"
            onPress={async () => {
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!perm.granted) return;
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.7,
              });
              if (!result.canceled && result.assets[0]) {
                setPhotoUri(result.assets[0].uri);
              }
            }}
          />
          {photoUri ? <Muted>Attached.</Muted> : null}
        </Section>

        <Button
          label={busy ? 'Saving…' : 'Save chapter'}
          sticker="journal"
          disabled={busy || reflection.trim().length === 0}
          onPress={async () => {
            setBusy(true);
            try {
              await completeQuest(quest.id, reflection, {
                mood,
                rating,
                photoUri,
              });
              router.replace('/(tabs)/journal');
            } finally {
              setBusy(false);
            }
          }}
        />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
