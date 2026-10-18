import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Brand,
  Button,
  HeaderBand,
  Muted,
  ScreenScroll,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { ANN_ARBOR_CENTER } from '@/types';
import { space } from '@/design/tokens';

export default function DemoScreen() {
  const router = useRouter();
  const setSimulatedLocation = useAppStore((s) => s.setSimulatedLocation);
  const setDemoEnabled = useAppStore((s) => s.setDemoEnabled);
  const setExplorationEnabled = useAppStore((s) => s.setExplorationEnabled);
  const updatePreferences = useAppStore((s) => s.updatePreferences);
  const simulateWalkIntoArea = useAppStore((s) => s.simulateWalkIntoArea);
  const generateNow = useAppStore((s) => s.generateNow);
  const acceptQuest = useAppStore((s) => s.acceptQuest);
  const markArrived = useAppStore((s) => s.markArrived);
  const getActiveQuest = useAppStore((s) => s.getActiveQuest);
  const [note, setNote] = useState('');

  return (
    <ScreenScroll>
      <HeaderBand left="Sidequest * Demo" right="Simulated" />
      <Brand sticker="spark" knockout />
      <Muted>Simulated · downtown Ann Arbor</Muted>

      <Button
        label="Reset location"
        variant="ghost"
        onPress={async () => {
          await setDemoEnabled(true);
          await setSimulatedLocation(ANN_ARBOR_CENTER, 'Downtown Ann Arbor');
          setNote('Reset');
        }}
      />
      <Button
        label="Set interests"
        variant="ghost"
        onPress={async () => {
          await updatePreferences({
            interests: ['coffee', 'art', 'bookstores'],
          });
          await setExplorationEnabled(true);
          setNote('Interests set');
        }}
      />
      <Button
        label="Simulate walk + notify"
        onPress={async () => {
          const quest = await simulateWalkIntoArea();
          setNote(quest ? quest.placeName : 'None found');
          if (quest) {
            Alert.alert('Sidequest', quest.storyHook, [
              { text: 'Open', onPress: () => router.push(`/quest/${quest.id}`) },
              { text: 'OK' },
            ]);
          }
        }}
      />
      <Button
        label="Generate"
        variant="ghost"
        onPress={async () => {
          const q = await generateNow();
          if (q) router.push(`/quest/${q.id}`);
        }}
      />
      <Button
        label="Accept latest"
        variant="ghost"
        onPress={async () => {
          const suggested = useAppStore
            .getState()
            .sidequests.find((q) => q.status === 'suggested');
          if (!suggested) return;
          await acceptQuest(suggested.id);
          router.push('/quest/active');
        }}
      />
      <Button
        label="Simulate arrival"
        variant="ghost"
        onPress={async () => {
          const active = getActiveQuest();
          if (!active) return;
          await setSimulatedLocation(active.coordinates, active.placeName);
          await markArrived(active.id);
          router.push({
            pathname: '/quest/complete',
            params: { id: active.id },
          });
        }}
      />

      {note ? <Body style={{ marginTop: space[4] }}>{note}</Body> : null}
    </ScreenScroll>
  );
}
