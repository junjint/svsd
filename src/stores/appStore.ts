import { create } from 'zustand';
import {
  ANN_ARBOR_CENTER,
  DEFAULT_PREFERENCES,
  type AppUser,
  type Coordinates,
  type DemoState,
  type DiscoveryState,
  type Mood,
  type RecommendationFeedback,
  type Sidequest,
  type StoryChapter,
  type UserPreferences,
} from '@/types';
import { storage } from '@/services/persistence/storage';
import { createId } from '@/utils/id';
import {
  forceStatus,
  isActiveStatus,
  transitionSidequest,
  ARRIVAL_THRESHOLD_METERS,
} from '@/services/sidequest/lifecycle';
import { createChapter, computeJournalStats } from '@/services/journal/chapters';
import {
  generateSidequestNow,
  runDiscoveryPass,
} from '@/services/discovery/engine';
import { distanceMeters } from '@/utils/geo';
import { openWalkingDirections } from '@/services/navigation/maps';
import {
  startBackgroundUpdates,
  startForegroundWatching,
  stopAllLocationMonitoring,
  inferTravelMode,
} from '@/services/location/monitoring';
import {
  requestBackgroundLocation,
  requestForegroundLocation,
  getCurrentPosition,
} from '@/services/location/permissions';
import { scheduleSidequestNotification } from '@/services/notifications/notifications';

interface AppState {
  hydrated: boolean;
  user: AppUser | null;
  preferences: UserPreferences;
  sidequests: Sidequest[];
  chapters: StoryChapter[];
  feedback: RecommendationFeedback[];
  discovery: DiscoveryState;
  demo: DemoState;
  currentLocation: Coordinates | null;
  lastNotificationPreview: { title: string; body: string } | null;

  hydrate: () => Promise<void>;
  persist: () => Promise<void>;

  completeOnboarding: (prefs: Partial<UserPreferences>) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;

  setExplorationEnabled: (enabled: boolean) => Promise<void>;
  enableBackgroundDiscovery: () => Promise<{ ok: boolean; message: string }>;
  disableBackgroundDiscovery: () => Promise<void>;

  refreshLocation: () => Promise<Coordinates | null>;
  setSimulatedLocation: (coords: Coordinates, label?: string) => Promise<void>;
  setDemoEnabled: (enabled: boolean) => Promise<void>;

  discoverNearby: (opts?: { notify?: boolean }) => Promise<Sidequest[]>;
  generateNow: () => Promise<Sidequest | null>;

  acceptQuest: (id: string) => Promise<void>;
  dismissQuest: (id: string) => Promise<void>;
  saveQuest: (id: string) => Promise<void>;
  startEnRoute: (id: string) => Promise<void>;
  openDirections: (id: string) => Promise<void>;
  markArrived: (id: string) => Promise<void>;
  checkArrival: () => Promise<Sidequest | null>;
  completeQuest: (
    id: string,
    reflection: string,
    extras?: { photoUri?: string; rating?: number; mood?: Mood }
  ) => Promise<StoryChapter | null>;
  abandonQuest: (id: string) => Promise<void>;

  updateChapter: (id: string, patch: Partial<StoryChapter>) => Promise<void>;
  clearPersonalData: () => Promise<void>;

  simulateWalkIntoArea: () => Promise<Sidequest | null>;
  triggerDemoNotification: () => Promise<Sidequest | null>;

  getActiveQuest: () => Sidequest | null;
  getJournalStats: () => ReturnType<typeof computeJournalStats>;
}

function defaultDiscovery(): DiscoveryState {
  return {
    status: 'paused',
    notificationsSentToday: 0,
    notificationsDayKey: new Date().toISOString().slice(0, 10),
    travelMode: 'unknown',
    currentAreaLabel: 'Downtown Ann Arbor (demo)',
  };
}

function defaultDemo(): DemoState {
  return {
    enabled: process.env.EXPO_PUBLIC_DEMO_MODE !== 'false',
    simulatedLocation: ANN_ARBOR_CENTER,
    locationLabel: 'Downtown Ann Arbor',
  };
}

async function persistSlice(state: AppState): Promise<void> {
  await Promise.all([
    storage.setJson('user', state.user),
    storage.setJson('preferences', state.preferences),
    storage.setJson('sidequests', state.sidequests),
    storage.setJson('chapters', state.chapters),
    storage.setJson('feedback', state.feedback),
    storage.setJson('discovery', state.discovery),
    storage.setJson('demo', state.demo),
  ]);
}

function pushFeedback(
  list: RecommendationFeedback[],
  quest: Sidequest,
  action: RecommendationFeedback['action'],
  rating?: number
): RecommendationFeedback[] {
  return [
    {
      id: createId('fb'),
      sidequestId: quest.id,
      placeId: quest.placeId,
      category: quest.category,
      action,
      rating,
      createdAt: new Date().toISOString(),
    },
    ...list,
  ].slice(0, 200);
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  user: null,
  preferences: { ...DEFAULT_PREFERENCES },
  sidequests: [],
  chapters: [],
  feedback: [],
  discovery: defaultDiscovery(),
  demo: defaultDemo(),
  currentLocation: ANN_ARBOR_CENTER,
  lastNotificationPreview: null,

  hydrate: async () => {
    const [user, preferences, sidequests, chapters, feedback, discovery, demo] =
      await Promise.all([
        storage.getJson<AppUser>('user'),
        storage.getJson<UserPreferences>('preferences'),
        storage.getJson<Sidequest[]>('sidequests'),
        storage.getJson<StoryChapter[]>('chapters'),
        storage.getJson<RecommendationFeedback[]>('feedback'),
        storage.getJson<DiscoveryState>('discovery'),
        storage.getJson<DemoState>('demo'),
      ]);

    const nextDemo = demo ?? defaultDemo();
    set({
      hydrated: true,
      user,
      preferences: preferences
        ? { ...DEFAULT_PREFERENCES, ...preferences }
        : { ...DEFAULT_PREFERENCES },
      sidequests: sidequests ?? [],
      chapters: chapters ?? [],
      feedback: feedback ?? [],
      discovery: discovery ?? defaultDiscovery(),
      demo: nextDemo,
      currentLocation: nextDemo.enabled
        ? nextDemo.simulatedLocation
        : ANN_ARBOR_CENTER,
    });

    // Resume foreground watching if exploration already enabled
    const prefs = get().preferences;
    if (prefs.explorationEnabled && !nextDemo.enabled) {
      await startForegroundWatching((coords, speed) => {
        set({
          currentLocation: coords,
          discovery: {
            ...get().discovery,
            travelMode: inferTravelMode(speed),
            estimatedSpeedMps: speed,
          },
        });
      });
    }
  },

  persist: async () => {
    await persistSlice(get());
  },

  completeOnboarding: async (prefs) => {
    const user: AppUser = {
      id: createId('user'),
      createdAt: new Date().toISOString(),
      onboardingCompleted: true,
    };
    const preferences: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...prefs,
      interests: prefs.interests ?? DEFAULT_PREFERENCES.interests,
    };
    set({ user, preferences });
    await persistSlice(get());
  },

  updatePreferences: async (prefs) => {
    set({ preferences: { ...get().preferences, ...prefs } });
    await persistSlice(get());
  },

  setExplorationEnabled: async (enabled) => {
    const preferences = {
      ...get().preferences,
      explorationEnabled: enabled,
    };
    const discovery: DiscoveryState = {
      ...get().discovery,
      status: enabled ? 'exploring' : 'paused',
    };
    set({ preferences, discovery });

    if (!enabled) {
      await stopAllLocationMonitoring();
      preferences.backgroundLocationEnabled = false;
      set({
        preferences: { ...preferences, backgroundLocationEnabled: false },
      });
    } else if (!get().demo.enabled) {
      const granted = await requestForegroundLocation();
      if (granted) {
        await startForegroundWatching((coords, speed) => {
          set({
            currentLocation: coords,
            discovery: {
              ...get().discovery,
              travelMode: inferTravelMode(speed),
              estimatedSpeedMps: speed,
            },
          });
        });
      }
    }
    await persistSlice(get());
  },

  enableBackgroundDiscovery: async () => {
    if (get().demo.enabled) {
      await get().updatePreferences({ backgroundLocationEnabled: true });
      await get().setExplorationEnabled(true);
      return {
        ok: true,
        message: 'Demo mode: background discovery simulated locally.',
      };
    }
    const granted = await requestBackgroundLocation();
    if (!granted) {
      return {
        ok: false,
        message:
          'Background location denied. Foreground discovery still works when the app is open.',
      };
    }
    await get().updatePreferences({ backgroundLocationEnabled: true });
    await get().setExplorationEnabled(true);
    await startBackgroundUpdates();
    return { ok: true, message: 'Background discovery enabled.' };
  },

  disableBackgroundDiscovery: async () => {
    await stopAllLocationMonitoring();
    await get().updatePreferences({ backgroundLocationEnabled: false });
  },

  refreshLocation: async () => {
    if (get().demo.enabled) {
      const loc = get().demo.simulatedLocation;
      set({ currentLocation: loc });
      return loc;
    }
    const pos = await getCurrentPosition();
    if (!pos) return get().currentLocation;
    const coords = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
    set({
      currentLocation: coords,
      discovery: {
        ...get().discovery,
        travelMode: inferTravelMode(pos.coords.speed ?? undefined),
        estimatedSpeedMps: pos.coords.speed ?? undefined,
      },
    });
    return coords;
  },

  setSimulatedLocation: async (coords, label) => {
    const demo = {
      ...get().demo,
      enabled: true,
      simulatedLocation: coords,
      locationLabel: label ?? get().demo.locationLabel,
      lastSimulationNote: `Location set to ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
    };
    set({ demo, currentLocation: coords });
    await persistSlice(get());
  },

  setDemoEnabled: async (enabled) => {
    const demo = { ...get().demo, enabled };
    set({
      demo,
      currentLocation: enabled
        ? demo.simulatedLocation
        : get().currentLocation,
    });
    await persistSlice(get());
  },

  discoverNearby: async (opts) => {
    const location =
      (await get().refreshLocation()) ?? get().currentLocation ?? ANN_ARBOR_CENTER;
    const result = await runDiscoveryPass({
      location,
      preferences: get().preferences,
      discovery: get().discovery,
      existingSidequests: get().sidequests,
      feedback: get().feedback,
      isSimulated: get().demo.enabled,
      forceNotify: opts?.notify,
    });

    // Merge candidates (avoid dup place ids in suggested list)
    const existing = get().sidequests;
    const existingPlaceIds = new Set(
      existing
        .filter((q) =>
          ['suggested', 'accepted', 'en_route', 'arrived', 'saved'].includes(
            q.status
          )
        )
        .map((q) => q.placeId)
    );
    const fresh = result.candidates.filter((c) => !existingPlaceIds.has(c.placeId));
    const sidequests = [...fresh, ...existing].slice(0, 100);

    set({
      sidequests,
      discovery: result.discovery,
      lastNotificationPreview: result.notified
        ? {
            title: result.notified.isSimulated
              ? '[DEMO] Sidequest unlocked'
              : 'Sidequest unlocked',
            body: result.notified.storyHook,
          }
        : get().lastNotificationPreview,
    });
    await persistSlice(get());
    return fresh;
  },

  generateNow: async () => {
    const location =
      (await get().refreshLocation()) ?? get().currentLocation ?? ANN_ARBOR_CENTER;
    const quest = await generateSidequestNow({
      location,
      preferences: get().preferences,
      discovery: get().discovery,
      existingSidequests: get().sidequests,
      feedback: get().feedback,
      isSimulated: get().demo.enabled,
    });
    if (!quest) return null;
    const suggested =
      quest.status === 'discovered'
        ? transitionSidequest(quest, 'suggested')
        : quest;
    set({ sidequests: [suggested, ...get().sidequests] });
    await persistSlice(get());
    return suggested;
  },

  acceptQuest: async (id) => {
    const quest = get().sidequests.find((q) => q.id === id);
    if (!quest) return;
    let next = quest;
    if (quest.status === 'saved' || quest.status === 'discovered') {
      next = forceStatus(quest, 'suggested');
    }
    next = transitionSidequest(next, 'accepted');
    set({
      sidequests: get().sidequests.map((q) => (q.id === id ? next : q)),
      feedback: pushFeedback(get().feedback, next, 'accept'),
    });
    await persistSlice(get());
  },

  dismissQuest: async (id) => {
    const quest = get().sidequests.find((q) => q.id === id);
    if (!quest) return;
    const next = forceStatus(quest, 'dismissed');
    set({
      sidequests: get().sidequests.map((q) => (q.id === id ? next : q)),
      feedback: pushFeedback(get().feedback, next, 'dismiss'),
    });
    await persistSlice(get());
  },

  saveQuest: async (id) => {
    const quest = get().sidequests.find((q) => q.id === id);
    if (!quest) return;
    const next = forceStatus(quest, 'saved');
    set({
      sidequests: get().sidequests.map((q) => (q.id === id ? next : q)),
      feedback: pushFeedback(get().feedback, next, 'save'),
    });
    await persistSlice(get());
  },

  startEnRoute: async (id) => {
    const quest = get().sidequests.find((q) => q.id === id);
    if (!quest) return;
    let next = quest;
    if (quest.status === 'accepted') {
      next = transitionSidequest(quest, 'en_route');
    } else {
      next = forceStatus(forceStatus(quest, 'accepted'), 'en_route');
    }
    set({ sidequests: get().sidequests.map((q) => (q.id === id ? next : q)) });
    await persistSlice(get());
  },

  openDirections: async (id) => {
    const quest = get().sidequests.find((q) => q.id === id);
    if (!quest) return;
    await get().startEnRoute(id);
    await openWalkingDirections(quest.coordinates, quest.placeName);
  },

  markArrived: async (id) => {
    const quest = get().sidequests.find((q) => q.id === id);
    if (!quest) return;
    let next = quest;
    if (quest.status === 'en_route' || quest.status === 'accepted') {
      if (quest.status === 'accepted') {
        next = transitionSidequest(quest, 'en_route');
      }
      next = transitionSidequest(next, 'arrived');
    } else {
      next = forceStatus(quest, 'arrived');
    }
    set({ sidequests: get().sidequests.map((q) => (q.id === id ? next : q)) });
    await persistSlice(get());
  },

  checkArrival: async () => {
    const active = get().getActiveQuest();
    const location = get().currentLocation;
    if (!active || !location) return null;
    const d = distanceMeters(location, active.coordinates);
    if (d <= ARRIVAL_THRESHOLD_METERS) {
      await get().markArrived(active.id);
      return get().sidequests.find((q) => q.id === active.id) ?? null;
    }
    return null;
  },

  completeQuest: async (id, reflection, extras) => {
    const quest = get().sidequests.find((q) => q.id === id);
    if (!quest) return null;
    const completed = forceStatus(quest, 'completed');
    const chapter = createChapter({
      sidequest: completed,
      reflection,
      photoUri: extras?.photoUri,
      rating: extras?.rating,
      mood: extras?.mood,
      existingChapters: get().chapters,
    });
    set({
      sidequests: get().sidequests.map((q) => (q.id === id ? completed : q)),
      chapters: [chapter, ...get().chapters],
      feedback: pushFeedback(get().feedback, completed, 'complete', extras?.rating),
    });
    await persistSlice(get());
    return chapter;
  },

  abandonQuest: async (id) => {
    const quest = get().sidequests.find((q) => q.id === id);
    if (!quest) return;
    const next = forceStatus(quest, 'abandoned');
    set({
      sidequests: get().sidequests.map((q) => (q.id === id ? next : q)),
      feedback: pushFeedback(get().feedback, next, 'abandon'),
    });
    await persistSlice(get());
  },

  updateChapter: async (id, patch) => {
    set({
      chapters: get().chapters.map((c) =>
        c.id === id
          ? { ...c, ...patch, updatedAt: new Date().toISOString() }
          : c
      ),
    });
    await persistSlice(get());
  },

  clearPersonalData: async () => {
    await stopAllLocationMonitoring();
    await storage.clearAllPersonalData();
    set({
      user: null,
      preferences: { ...DEFAULT_PREFERENCES },
      sidequests: [],
      chapters: [],
      feedback: [],
      discovery: defaultDiscovery(),
      demo: defaultDemo(),
      currentLocation: ANN_ARBOR_CENTER,
      lastNotificationPreview: null,
    });
  },

  simulateWalkIntoArea: async () => {
    // Shift ~400m northeast into denser demo POIs
    const base = get().demo.simulatedLocation;
    const next = {
      latitude: base.latitude + 0.0035,
      longitude: base.longitude + 0.0035,
    };
    await get().setSimulatedLocation(next, 'Simulated walk — near Main St');
    await get().setExplorationEnabled(true);
    const found = await get().discoverNearby({ notify: true });
    set({
      demo: {
        ...get().demo,
        lastSimulationNote:
          'Simulated walking into a new area and ran discovery.',
      },
    });
    return found[0] ?? null;
  },

  triggerDemoNotification: async () => {
    let quest =
      get().sidequests.find((q) => q.status === 'suggested') ??
      (await get().generateNow());
    if (!quest) return null;
    if (quest.status === 'discovered') {
      quest = transitionSidequest(quest, 'suggested');
      set({
        sidequests: get().sidequests.map((q) =>
          q.id === quest!.id ? quest! : q
        ),
      });
    }
    const entry = await scheduleSidequestNotification(
      { ...quest, isSimulated: true },
      { simulated: true }
    );
    if (entry) {
      set({
        lastNotificationPreview: { title: entry.title, body: entry.body },
        discovery: {
          ...get().discovery,
          lastNotificationAt: entry.sentAt,
          notificationsSentToday: get().discovery.notificationsSentToday + 1,
        },
      });
    }
    await persistSlice(get());
    return quest;
  },

  getActiveQuest: () => {
    return (
      get().sidequests.find((q) => isActiveStatus(q.status)) ?? null
    );
  },

  getJournalStats: () => {
    const completed = get().sidequests.filter((q) => q.status === 'completed');
    return computeJournalStats(get().chapters, completed);
  },
}));
