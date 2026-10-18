import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { pickNotificationBody } from '@/constants/narrativeHooks';
import { createId } from '@/utils/id';
import type { NotificationLogEntry, Sidequest } from '@/types';
import { storage } from '@/services/persistence/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleSidequestNotification(
  quest: Sidequest,
  options?: { simulated?: boolean; delaySeconds?: number }
): Promise<NotificationLogEntry | null> {
  const minutes = quest.estimatedWalkingMinutes ?? 5;
  const title = quest.isSimulated || options?.simulated
    ? '[DEMO] Sidequest unlocked'
    : 'Sidequest unlocked';
  const body = pickNotificationBody(minutes);

  const granted = await ensureNotificationPermissions();
  if (!granted) {
    // Still log a simulated preview entry for demo UX
    const entry: NotificationLogEntry = {
      id: createId('notif'),
      sidequestId: quest.id,
      sentAt: new Date().toISOString(),
      title,
      body,
      wasSimulated: true,
    };
    await appendNotificationLog(entry);
    return entry;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: {
        sidequestId: quest.id,
        placeId: quest.placeId,
        simulated: Boolean(quest.isSimulated || options?.simulated),
      },
      sound: true,
    },
    trigger:
      options?.delaySeconds && options.delaySeconds > 0
        ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: options.delaySeconds,
          }
        : null,
  });

  const entry: NotificationLogEntry = {
    id: createId('notif'),
    sidequestId: quest.id,
    sentAt: new Date().toISOString(),
    title,
    body,
    wasSimulated: Boolean(quest.isSimulated || options?.simulated),
  };
  await appendNotificationLog(entry);
  return entry;
}

async function appendNotificationLog(entry: NotificationLogEntry): Promise<void> {
  const existing =
    (await storage.getJson<NotificationLogEntry[]>('notificationLog')) ?? [];
  existing.unshift(entry);
  await storage.setJson('notificationLog', existing.slice(0, 50));
}

export async function getNotificationLog(): Promise<NotificationLogEntry[]> {
  return (await storage.getJson<NotificationLogEntry[]>('notificationLog')) ?? [];
}

export function addNotificationResponseListener(
  handler: (sidequestId: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const id = response.notification.request.content.data?.sidequestId;
    if (typeof id === 'string') handler(id);
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function platformSupportsBackgroundNotifications(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
