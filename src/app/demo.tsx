import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  Muted,
  Screen,
  Section,
  Subtitle,
  Title,
} from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { ANN_ARBOR_CENTER } from '@/types';
import { offsetCoordinates } from '@/utils/geo';
import { scheduleSidequestNotification } from '@/services/notifications/notifications';

/**
 * Development-only simulation controls.
 * Clearly labeled so demo behavior is not confused with real background GPS.
 */
export default function DemoScreen() {
  const router = useRouter();
  const demo = useAppStore((s) => s.demo);
  const preferences = useAppStore((s) => s.preferences);
  const lastNotificationPreview = useAppStore((s) => s.lastNotificationPreview);
  const setSimulatedLocation = useAppStore((s) => s.setSimulatedLocation);
  const setDemoEnabled = useAppStore((s) => s.setDemoEnabled);
  const setExplorationEnabled = useAppStore((s) => s.setExplorationEnabled);
  const updatePreferences = useAppStore((s) => s.updatePreferences);
  const simulateWalkIntoArea = useAppStore((s) => s.simulateWalkIntoArea);
  const triggerDemoNotification = useAppStore((s) => s.triggerDemoNotification);
  const generateNow = useAppStore((s) => s.generateNow);
  const markArrived = useAppStore((s) => s.markArrived);
  const acceptQuest = useAppStore((s) => s.acceptQuest);
  const getActiveQuest = useAppStore((s) => s.getActiveQuest);
  const discoverNearby = useAppStore((s) => s.discoverNearby);
  const [log, setLog] = useState<string[]>([]);

  const push = (msg: string) => setLog((prev) => [msg, ...prev].slice(0, 20));

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Title>Developer / Demo tools</Title>
        <Muted>
          All actions below are simulated unless you disable demo mode and grant
          real device permissions. Demo data is labeled [DEMO].
        </Muted>

        <Section title="1. Simulated location">
          <Body>
            Current: {demo.locationLabel}
            {'\n'}
            {demo.simulatedLocation.latitude.toFixed(5)},{' '}
            {demo.simulatedLocation.longitude.toFixed(5)}
          </Body>
          <Button
            label="Reset to downtown Ann Arbor"
            onPress={async () => {
              await setDemoEnabled(true);
              await setSimulatedLocation(ANN_ARBOR_CENTER, 'Downtown Ann Arbor');
              push('Reset location to downtown Ann Arbor');
            }}
          />
          <Button
            label="Move near bookstore cluster"
            variant="secondary"
            onPress={async () => {
              const coords = offsetCoordinates(ANN_ARBOR_CENTER, -100, -150);
              await setSimulatedLocation(coords, 'Near State St (simulated)');
              push('Moved near bookstore cluster');
            }}
          />
        </Section>

        <Section title="2. Interests & exploration">
          <Button
            label="Set interests: coffee, art, bookstores"
            onPress={async () => {
              await updatePreferences({
                interests: ['coffee', 'art', 'bookstores'],
                spontaneity: 'adventurous',
              });
              push('Interests set to coffee, art, bookstores');
            }}
          />
          <Button
            label={
              preferences.explorationEnabled
                ? 'Exploration already on'
                : 'Enable Sidequest exploration'
            }
            variant="secondary"
            onPress={async () => {
              await setExplorationEnabled(true);
              push('Exploration enabled');
            }}
          />
        </Section>

        <Section title="3–7. Walk, discover, notify">
          <Button
            label="Simulate walking into a new area + notify"
            onPress={async () => {
              const quest = await simulateWalkIntoArea();
              push(
                quest
                  ? `Discovered: ${quest.placeName}`
                  : 'No quest found (try resetting location)'
              );
              if (quest) {
                Alert.alert(
                  '[DEMO] Sidequest unlocked',
                  quest.storyHook,
                  [
                    {
                      text: 'Open',
                      onPress: () => router.push(`/quest/${quest.id}`),
                    },
                    { text: 'OK' },
                  ]
                );
              }
            }}
          />
          <Button
            label="Generate sidequest now"
            variant="secondary"
            onPress={async () => {
              const quest = await generateNow();
              push(quest ? `Generated: ${quest.placeName}` : 'None generated');
              if (quest) router.push(`/quest/${quest.id}`);
            }}
          />
          <Button
            label="Trigger notification / in-app preview"
            variant="secondary"
            onPress={async () => {
              const quest = await triggerDemoNotification();
              push(
                quest
                  ? `Notification for: ${quest.placeName}`
                  : 'Could not trigger notification'
              );
            }}
          />
          <Button
            label="Refresh nearby without forcing notify"
            variant="secondary"
            onPress={async () => {
              const found = await discoverNearby();
              push(`Nearby candidates: ${found.length}`);
            }}
          />
        </Section>

        {lastNotificationPreview ? (
          <Section title="In-app notification preview">
            <Subtitle>{lastNotificationPreview.title}</Subtitle>
            <Body>{lastNotificationPreview.body}</Body>
          </Section>
        ) : null}

        <Section title="8–14. Accept → arrive → journal">
          <Button
            label="Accept latest suggested quest"
            onPress={async () => {
              const suggested = useAppStore
                .getState()
                .sidequests.find((q) => q.status === 'suggested');
              if (!suggested) {
                push('No suggested quest — generate one first');
                return;
              }
              await acceptQuest(suggested.id);
              push(`Accepted: ${suggested.placeName}`);
              router.push('/quest/active');
            }}
          />
          <Button
            label="Open directions (external maps)"
            variant="secondary"
            onPress={() => {
              const active = getActiveQuest();
              if (!active) {
                Alert.alert('No active quest');
                return;
              }
              router.push('/quest/active');
            }}
          />
          <Button
            label="Simulate arrival"
            variant="secondary"
            onPress={async () => {
              const active = getActiveQuest();
              if (!active) {
                push('No active quest');
                return;
              }
              // Teleport to destination for arrival detection demo
              await setSimulatedLocation(
                active.coordinates,
                `Arrived at ${active.placeName}`
              );
              await markArrived(active.id);
              push(`Arrived at ${active.placeName}`);
              router.push('/quest/active');
            }}
          />
          <Button
            label="Complete & write journal chapter"
            onPress={() => {
              const active = getActiveQuest();
              const arrived = useAppStore
                .getState()
                .sidequests.find((q) => q.status === 'arrived');
              const target = active ?? arrived;
              if (!target) {
                Alert.alert('Accept and arrive at a quest first');
                return;
              }
              router.push({
                pathname: '/quest/complete',
                params: { id: target.id },
              });
            }}
          />
          <Button
            label="Open journal"
            variant="secondary"
            onPress={() => router.push('/(tabs)/journal')}
          />
        </Section>

        <Section title="Notification permission probe">
          <Button
            label="Schedule a raw local notification (3s)"
            variant="secondary"
            onPress={async () => {
              const quest = await generateNow();
              if (!quest) return;
              await scheduleSidequestNotification(
                { ...quest, isSimulated: true },
                { simulated: true, delaySeconds: 3 }
              );
              push('Scheduled notification in 3 seconds');
            }}
          />
        </Section>

        <Section title="Activity log">
          {log.length === 0 ? (
            <Muted>No demo actions yet.</Muted>
          ) : (
            log.map((line, i) => <Muted key={`${i}-${line}`}>• {line}</Muted>)
          )}
          {demo.lastSimulationNote ? (
            <Body>Last note: {demo.lastSimulationNote}</Body>
          ) : null}
        </Section>
      </ScrollView>
    </Screen>
  );
}
