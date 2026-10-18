import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Body,
  Button,
  Field,
  HeaderBand,
  KnockoutMark,
  Muted,
  ScreenScroll,
  Sticker,
  Title,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { stickerForCategory } from '@/design';
import { space } from '@/design/tokens';

export default function CompleteQuestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const quest = useAppStore((s) => s.sidequests.find((q) => q.id === id));
  const completeQuest = useAppStore((s) => s.completeQuest);
  const [reflection, setReflection] = useState('');
  const [busy, setBusy] = useState(false);

  if (!quest) {
    return (
      <ScreenScroll>
        <Title>Gone</Title>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      <HeaderBand left="Sidequest * Chapter" right="Reflect" />
      <KnockoutMark text="chapter" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <Sticker id={stickerForCategory(quest.category)} size="lg" />
        <Title style={{ flex: 1, fontSize: 22 }}>{quest.placeName}</Title>
      </View>
      <Muted style={{ marginTop: space[2] }}>What did you find?</Muted>
      <View style={{ height: space[4] }} />
      <Body>{quest.storyHook}</Body>
      <Field
        value={reflection}
        onChangeText={setReflection}
        placeholder="What did you find?"
        multiline
        style={{ minHeight: 100 }}
      />
      <Button
        label={busy ? '…' : 'Save'}
        disabled={busy || reflection.trim().length === 0}
        onPress={async () => {
          setBusy(true);
          try {
            await completeQuest(quest.id, reflection);
            router.replace('/(tabs)/journal');
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
    </ScreenScroll>
  );
}
