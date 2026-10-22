import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  user: '@sidequest/user',
  preferences: '@sidequest/preferences',
  sidequests: '@sidequest/sidequests',
  chapters: '@sidequest/chapters',
  feedback: '@sidequest/feedback',
  notificationLog: '@sidequest/notification_log',
  discovery: '@sidequest/discovery',
  demo: '@sidequest/demo',
  cachedPlaces: '@sidequest/cached_places',
  dismissedPlaceIds: '@sidequest/dismissed_places',
  v2Preferences: '@sidequest/v2/preferences',
  v2Quests: '@sidequest/v2/quests',
  v2Folders: '@sidequest/v2/folders',
  v2Badges: '@sidequest/v2/badges',
  v2DrawCount: '@sidequest/v2/draw_count',
  v2Seeded: '@sidequest/v2/seeded',
  previewImported: '@sidequest/v3/imported',
} as const;

export type StorageKey = keyof typeof KEYS;

async function getJson<T>(key: StorageKey): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS[key]);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setJson<T>(key: StorageKey, value: T): Promise<void> {
  await AsyncStorage.setItem(KEYS[key], JSON.stringify(value));
}

async function remove(key: StorageKey): Promise<void> {
  await AsyncStorage.removeItem(KEYS[key]);
}

export const storage = {
  keys: KEYS,
  getJson,
  setJson,
  remove,
  async clearAllPersonalData(): Promise<void> {
    await AsyncStorage.multiRemove([...Object.values(KEYS), 'sidequest:app:v3']);
  },
};
