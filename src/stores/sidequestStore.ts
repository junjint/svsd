import { create } from 'zustand';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { ACTIVITIES } from '@/data/activities';
import { newlyEarned } from '@/data/badges';
import { buildDrawnQuest, drawActivities, drawPlace, optionsFor, pickRevealStyles, rollRarity } from '@/services/draw/engine';
import { REROLLS_PER_STAGE } from '@/services/draw/rules';
import { DEMO_CITIES, type DemoCityKey } from '@/data/demoCities';
import { buildPastQuests } from '@/data/pastQuests';
import { getCurrentPosition, requestForegroundLocation } from '@/services/location/permissions';
import { storage } from '@/services/persistence/storage';
import { placeService } from '@/services/places/PlaceService';
import { normaliseActivity, normalisePlace, placeCoordinates, suggestedToday, userActivitiesFor, userPlaces } from '@/services/suggest/pool';
import { importPreview } from '@/services/persistence/importPreview';
import { forceStatus } from '@/services/sidequest/lifecycle';
import { setFeedbackEnabled } from '@/services/sound';
import { createId } from '@/utils/id';
import {
  DEFAULT_V2_PREFERENCES,
  type Activity,
  type BadgeId,
  type Coordinates,
  type DrawSettings,
  type DrawnSidequest,
  type EarnedBadge,
  type FolderPhoto,
  type InterestCategory,
  type Place,
  type QuestFolder,
  type Rarity,
  type RevealStyle,
  type Suggestion,
  type SuggestionBand,
  type V2Preferences,
} from '@/types';

/* ══ The Draw session — docs/SPEC.md §3 ══════════════════════
   shuffling → place → activity → result
   The UI moves phases forward when each reveal finishes (or is
   skipped); rerolls send a stage back to its reveal. */
export type DrawPhase = 'shuffling' | 'place' | 'activity' | 'result' | 'empty';

export interface DrawSession {
  id: string;
  phase: DrawPhase;
  settings: DrawSettings;
  rarity: Rarity;
  revealStyle: { place: RevealStyle; activity: RevealStyle };
  place: Place | null;
  /** face-down choices for cards / coin / wheel; [0] is the default */
  activityOptions: Activity[];
  activity: Activity | null;
  rerolls: { place: number; activity: number };
  placeLocked: boolean;
  seenPlaceIds: string[];
  seenActivityIds: string[];
}

export interface UserLocation {
  coords: Coordinates;
  cityLabel: string;
  /** ISO country code, for the flag beside the city */
  country?: string;
  isDemo: boolean;
  demoCity?: DemoCityKey;
}

interface SidequestState {
  hydrated: boolean;
  prefs: V2Preferences;
  location: UserLocation;
  /** non-null when the app noticed a new city and wants settings re-confirmed */
  cityPrompt: string | null;
  quests: DrawnSidequest[];
  folders: QuestFolder[];
  badges: EarnedBadge[];
  /** badges earned but not yet celebrated */
  badgeQueue: BadgeId[];
  /** what you've left in the pool, newest first */
  suggestions: Suggestion[];
  drawCount: number;
  draw: DrawSession | null;

  hydrate: () => Promise<void>;
  updatePrefs: (patch: Partial<V2Preferences>) => Promise<void>;
  completeOnboarding: (patch: Partial<V2Preferences>) => Promise<void>;

  refreshLocation: (opts?: { ask?: boolean }) => Promise<UserLocation>;
  setDemoCity: (key: DemoCityKey) => Promise<void>;
  confirmCity: (patch?: Partial<V2Preferences>) => Promise<void>;
  dismissCityPrompt: () => void;

  startDraw: () => Promise<DrawSession>;
  setPhase: (phase: DrawPhase) => void;
  chooseActivity: (activityId: string) => void;
  rerollPlace: () => Promise<boolean>;
  rerollActivity: () => boolean;
  toggleLockPlace: () => void;
  canReroll: (stage: 'place' | 'activity') => boolean;
  /** accept the drawn sidequest. `keepDraw` leaves the receipt up, so a screen can leave first and clear it after */
  go: (opts?: { keepDraw?: boolean }) => Promise<DrawnSidequest | null>;
  saveForLater: () => Promise<DrawnSidequest | null>;
  discardDraw: () => void;

  activeQuests: () => DrawnSidequest[];
  completeQuest: (id: string) => Promise<QuestFolder | null>;
  acceptNavigationQuest: (quest: DrawnSidequest) => Promise<DrawnSidequest>;
  abandonQuest: (id: string) => Promise<void>;
  startSavedQuest: (id: string) => Promise<void>;

  createFolder: (args: { title: string; sidequestId?: string }) => Promise<QuestFolder>;
  folderForQuest: (sidequestId: string) => QuestFolder | undefined;
  updateFolder: (id: string, patch: Partial<QuestFolder>) => Promise<void>;
  addPhotos: (folderId: string, photos: Omit<FolderPhoto, 'id' | 'addedAt'>[]) => Promise<void>;
  removePhoto: (folderId: string, photoId: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  /** Delete a folder and the sidequest it belongs to, as if it never happened */
  removeSidequest: (folderId: string) => Promise<void>;

  /** leave a place, an activity, or both in this city's pool; one a day */
  addSuggestion: (input: {
    placeName?: string;
    category?: InterestCategory;
    band?: SuggestionBand;
    activityText?: string;
  }) => Promise<{ ok: true; suggestion: Suggestion } | { ok: false; reason: 'limit' | 'empty' }>;

  shiftBadge: () => BadgeId | undefined;
  clearAll: () => Promise<void>;
}

const DEMO = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';
const defaultLocation = (key: DemoCityKey = 'ann_arbor'): UserLocation => ({
  coords: DEMO_CITIES[key].center,
  cityLabel: DEMO_CITIES[key].label,
  country: DEMO_CITIES[key].country,
  isDemo: true,
  demoCity: key,
});

const now = () => new Date().toISOString();

export const useSidequestStore = create<SidequestState>((set, get) => {
  const persist = async () => {
    const s = get();
    await Promise.all([
      storage.setJson('v2Preferences', s.prefs),
      storage.setJson('v2Quests', s.quests),
      storage.setJson('v2Folders', s.folders),
      storage.setJson('v2Badges', s.badges),
      storage.setJson('v2Suggestions', s.suggestions),
      storage.setJson('v2DrawCount', s.drawCount),
    ]);
  };

  const patchDraw = (patch: Partial<DrawSession>) => {
    const d = get().draw;
    if (d) set({ draw: { ...d, ...patch } });
  };

  const activitiesFor = (d: Pick<DrawSession, 'settings' | 'rarity' | 'revealStyle' | 'seenActivityIds'>, place: Place) =>
    drawActivities(
      {
        place,
        questType: d.settings.questType,
        focus: d.settings.focus,
        partySize: d.settings.partySize,
        excludeIds: d.seenActivityIds,
        pool: [...ACTIVITIES, ...userActivitiesFor(get().suggestions, get().location.cityLabel)],
      },
      d.rarity,
      optionsFor(d.revealStyle.activity)
    );

  const recentPlaceIds = () => {
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    return get()
      .quests.filter((q) => new Date(q.updatedAt).getTime() >= cutoff)
      .map((q) => q.placeId);
  };

  return {
    hydrated: false,
    prefs: DEFAULT_V2_PREFERENCES,
    location: defaultLocation(),
    cityPrompt: null,
    quests: [],
    folders: [],
    badges: [],
    badgeQueue: [],
    suggestions: [],
    drawCount: 0,
    draw: null,

    hydrate: async () => {
      const [prefs, stored, storedFolders, badges, drawCount, seeded, storedSuggestions, previewImported] = await Promise.all([
        storage.getJson<V2Preferences>('v2Preferences'),
        storage.getJson<DrawnSidequest[]>('v2Quests'),
        storage.getJson<QuestFolder[]>('v2Folders'),
        storage.getJson<EarnedBadge[]>('v2Badges'),
        storage.getJson<number>('v2DrawCount'),
        storage.getJson<boolean>('v2Seeded'),
        storage.getJson<Suggestion[]>('v2Suggestions'),
        storage.getJson<boolean>('previewImported'),
      ]);
      const suggestions = storedSuggestions ?? [];
      placeService.setUserPlaces(userPlaces(suggestions));
      let quests = stored ?? [];
      let folders = storedFolders ?? [];
      let importedPreview = false;
      if (Platform.OS === 'web' && !previewImported) {
        try {
          const imported = importPreview(window.localStorage.getItem('sidequest:app:v3'));
          quests = [...quests, ...imported.quests.filter(q => !quests.some(existing => existing.id === q.id))];
          folders = [...folders, ...imported.folders.filter(f => !folders.some(existing => existing.id === f.id))];
          importedPreview = true;
        } catch { /* Storage may be unavailable in a private browser. */ }
      }
      let earned = badges ?? [];
      const seedNow = DEMO && !seeded;
      // Demo installs start with a library of past sidequests, once
      if (seedNow) {
        const past = buildPastQuests();
        const have = new Set(quests.map((q) => q.id));
        quests = [...quests, ...past.quests.filter((q) => !have.has(q.id))];
        folders = [...folders, ...past.folders.filter((f) => !folders.some((x) => x.id === f.id))];
        // their badges count too, quietly: no celebration for the past
        const done = quests.filter((q) => q.status === 'completed');
        const at = new Date().toISOString();
        earned = [...earned, ...newlyEarned({ completed: done, suggestions }, earned.map((b) => b.id)).map((id) => ({ id, earnedAt: at }))];
        void storage.setJson('v2Seeded', true);
      }
      const merged = { ...DEFAULT_V2_PREFERENCES, ...(prefs ?? {}) };
      setFeedbackEnabled({ sounds: merged.soundsEnabled, haptics: merged.hapticsEnabled });
      set({
        hydrated: true,
        prefs: merged,
        quests,
        folders,
        badges: earned,
        suggestions,
        drawCount: drawCount ?? 0,
      });
      if (seedNow || importedPreview) await persist();
      if (importedPreview) await storage.setJson('previewImported', true);
      if (merged.onboarded) void get().refreshLocation();
    },

    updatePrefs: async (patch) => {
      const prefs = { ...get().prefs, ...patch };
      setFeedbackEnabled({ sounds: prefs.soundsEnabled, haptics: prefs.hapticsEnabled });
      set({ prefs });
      await persist();
    },

    completeOnboarding: async (patch) => {
      await get().updatePrefs({ ...patch, onboarded: true, confirmedCity: get().location.cityLabel });
    },

    /* ── location + city change (§4.1) ─────────────────────── */

    refreshLocation: async ({ ask = false } = {}) => {
      const current = get().location;
      let next: UserLocation = current.isDemo ? current : defaultLocation();
      const allowed = ask ? await requestForegroundLocation() : true;
      const pos = allowed && Platform.OS !== 'web' && !DEMO ? await getCurrentPosition() : null;
      if (pos) {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        let cityLabel = 'Nearby';
        let country: string | undefined;
        try {
          const [geo] = await Location.reverseGeocodeAsync(coords);
          cityLabel = geo?.city ?? geo?.subregion ?? geo?.region ?? cityLabel;
          country = geo?.isoCountryCode ?? undefined;
        } catch {
          /* offline: keep the generic label */
        }
        next = { coords, cityLabel, country, isDemo: false };
      }
      const { prefs } = get();
      const moved = prefs.onboarded && prefs.confirmedCity && prefs.confirmedCity !== next.cityLabel;
      set({ location: next, cityPrompt: moved ? next.cityLabel : null });
      return next;
    },

    setDemoCity: async (key) => {
      const next = defaultLocation(key);
      const { prefs } = get();
      const moved = prefs.onboarded && prefs.confirmedCity !== next.cityLabel;
      set({ location: next, cityPrompt: moved ? next.cityLabel : null });
    },

    confirmCity: async (patch) => {
      set({ cityPrompt: null });
      await get().updatePrefs({ ...(patch ?? {}), confirmedCity: get().location.cityLabel });
    },

    dismissCityPrompt: () => set({ cityPrompt: null }),

    /* ── the draw (§3) ─────────────────────────────────────── */

    startDraw: async () => {
      const { prefs, location } = get();
      const drawCount = get().drawCount + 1;
      const settings: DrawSettings = {
        questType: prefs.questType,
        focus: prefs.focus,
        partySize: prefs.partySize,
        radiusMiles: prefs.radiusMiles,
      };
      const rarity = rollRarity();
      const revealStyle = pickRevealStyles(drawCount, rarity);
      const base = {
        id: createId('draw'),
        settings,
        rarity,
        revealStyle,
        rerolls: { place: 0, activity: 0 },
        placeLocked: false,
        seenActivityIds: [] as string[],
      };
      const place = await drawPlace({ location: location.coords, settings, excludePlaceIds: recentPlaceIds() });
      const options = place ? activitiesFor(base, place) : [];
      const session: DrawSession = {
        ...base,
        phase: place && options.length ? 'shuffling' : 'empty',
        place,
        activityOptions: options,
        activity: options[0] ?? null,
        seenPlaceIds: place ? [place.id] : [],
        seenActivityIds: options.map((a) => a.id),
      };
      set({ draw: session, drawCount });
      void storage.setJson('v2DrawCount', drawCount);
      return session;
    },

    setPhase: (phase) => patchDraw({ phase }),

    chooseActivity: (activityId) => {
      const d = get().draw;
      const pick = d?.activityOptions.find((a) => a.id === activityId);
      if (pick) patchDraw({ activity: pick });
    },

    canReroll: (stage) => {
      const d = get().draw;
      if (!d) return false;
      if (stage === 'place' && d.placeLocked) return false;
      return d.rerolls[stage] < REROLLS_PER_STAGE;
    },

    rerollPlace: async () => {
      const d = get().draw;
      if (!d || !get().canReroll('place')) return false;
      const place = await drawPlace({
        location: get().location.coords,
        settings: d.settings,
        excludePlaceIds: [...recentPlaceIds(), ...d.seenPlaceIds],
      });
      if (!place) return false;
      const options = activitiesFor(d, place);
      patchDraw({
        phase: 'place',
        place,
        activityOptions: options,
        activity: options[0] ?? null,
        rerolls: { ...d.rerolls, place: d.rerolls.place + 1 },
        seenPlaceIds: [...d.seenPlaceIds, place.id],
        seenActivityIds: [...d.seenActivityIds, ...options.map((a) => a.id)],
      });
      return true;
    },

    rerollActivity: () => {
      const d = get().draw;
      if (!d || !d.place || !get().canReroll('activity')) return false;
      const options = activitiesFor(d, d.place);
      if (!options.length) return false;
      patchDraw({
        phase: 'activity',
        activityOptions: options,
        activity: options[0]!,
        rerolls: { ...d.rerolls, activity: d.rerolls.activity + 1 },
        seenActivityIds: [...d.seenActivityIds, ...options.map((a) => a.id)],
      });
      return true;
    },

    toggleLockPlace: () => {
      const d = get().draw;
      if (d) patchDraw({ placeLocked: !d.placeLocked });
    },

    go: async ({ keepDraw = false } = {}) => {
      const quest = buildFromDraw(get());
      if (!quest) return null;
      const accepted = forceStatus(quest, 'accepted') as DrawnSidequest;
      set({ quests: [accepted, ...get().quests], ...(keepDraw ? {} : { draw: null }) });
      await persist();
      return accepted;
    },

    saveForLater: async () => {
      const quest = buildFromDraw(get());
      if (!quest) return null;
      const saved = forceStatus(quest, 'saved') as DrawnSidequest;
      set({ quests: [saved, ...get().quests], draw: null });
      await persist();
      return saved;
    },

    discardDraw: () => set({ draw: null }),

    /* ── quests + folders (§4.2) ───────────────────────────── */

    activeQuests: () => get().quests.filter((q) => q.status === 'accepted' || q.status === 'en_route' || q.status === 'arrived'),

    startSavedQuest: async (id) => {
      set({ quests: get().quests.map((q) => (q.id === id ? (forceStatus(q, 'accepted') as DrawnSidequest) : q)) });
      await persist();
    },

    acceptNavigationQuest: async (quest) => {
      const existing = get().quests.find(q => q.id === quest.id);
      if (existing) return existing;
      const accepted = forceStatus(quest, 'accepted') as DrawnSidequest;
      set({ quests: [accepted, ...get().quests] });
      await persist();
      return accepted;
    },

    completeQuest: async (id) => {
      const quest = get().quests.find((q) => q.id === id);
      if (!quest) return null;
      const done = forceStatus(quest, 'completed') as DrawnSidequest;
      const quests = get().quests.map((q) => (q.id === id ? done : q));
      // A folder made mid-quest is kept; otherwise finishing creates one
      let folder = get().folders.find((f) => f.sidequestId === id);
      let folders = get().folders;
      if (!folder) {
        folder = {
          id: createId('folder'),
          kind: 'quest',
          sidequestId: id,
          title: done.activityText,
          subtitle: done.placeName,
          photos: [],
          savedToGallery: false,
          postedToWall: false,
          createdBy: 'completion',
          createdAt: now(),
          updatedAt: now(),
        };
        folders = [folder, ...folders];
      }
      const completed = quests.filter((q) => q.status === 'completed');
      const earned = newlyEarned({ completed, suggestions: get().suggestions }, get().badges.map((b) => b.id));
      set({
        quests,
        folders,
        badges: [...get().badges, ...earned.map((b) => ({ id: b, earnedAt: now(), sidequestId: id }))],
        badgeQueue: [...get().badgeQueue, ...earned],
      });
      await persist();
      return folder;
    },

    abandonQuest: async (id) => {
      set({ quests: get().quests.map((q) => (q.id === id ? (forceStatus(q, 'abandoned') as DrawnSidequest) : q)) });
      await persist();
    },

    createFolder: async ({ title, sidequestId }) => {
      const quest = sidequestId ? get().quests.find((q) => q.id === sidequestId) : undefined;
      const folder: QuestFolder = {
        id: createId('folder'),
        kind: sidequestId ? 'quest' : 'freeform',
        sidequestId,
        title: title.trim() || quest?.activityText || 'Untitled',
        subtitle: quest?.placeName,
        photos: [],
        savedToGallery: false,
        postedToWall: false,
        createdBy: 'user',
        createdAt: now(),
        updatedAt: now(),
      };
      set({ folders: [folder, ...get().folders] });
      await persist();
      return folder;
    },

    folderForQuest: (sidequestId) => get().folders.find((f) => f.sidequestId === sidequestId),

    updateFolder: async (id, patch) => {
      set({ folders: get().folders.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: now() } : f)) });
      await persist();
    },

    addPhotos: async (folderId, photos) => {
      const added: FolderPhoto[] = photos.map((p) => ({ ...p, id: createId('photo'), addedAt: now() }));
      set({
        folders: get().folders.map((f) => (f.id === folderId ? { ...f, photos: [...f.photos, ...added], updatedAt: now() } : f)),
      });
      await persist();
    },

    removePhoto: async (folderId, photoId) => {
      set({
        folders: get().folders.map((f) =>
          f.id === folderId ? { ...f, photos: f.photos.filter((p) => p.id !== photoId), updatedAt: now() } : f
        ),
      });
      await persist();
    },

    removeSidequest: async (folderId) => {
      const folder = get().folders.find((f) => f.id === folderId);
      set({
        folders: get().folders.filter((f) => f.id !== folderId),
        quests: folder?.sidequestId ? get().quests.filter((q) => q.id !== folder.sidequestId) : get().quests,
      });
      await persist();
    },

    deleteFolder: async (id) => {
      set({ folders: get().folders.filter((f) => f.id !== id) });
      await persist();
    },

    /* ── suggest (§4.4) ─────────────────────────────────────── */

    addSuggestion: async ({ placeName, category, band = 'walk', activityText }) => {
      if (suggestedToday(get().suggestions)) return { ok: false, reason: 'limit' };
      const name = placeName ? normalisePlace(placeName) : '';
      const text = activityText ? normaliseActivity(activityText) : '';
      if (!name && !text) return { ok: false, reason: 'empty' };
      const id = createId('sug');
      const { location } = get();
      const suggestion: Suggestion = {
        id,
        cityLabel: location.cityLabel,
        createdAt: now(),
        ...(name && {
          placeName: name,
          category: category ?? 'unexpected',
          coordinates: placeCoordinates(location.coords, band, id),
          placeId: `user_${id}`,
        }),
        ...(text && { activityText: text, activityId: `act_user_${id}` }),
      };
      const suggestions = [suggestion, ...get().suggestions];
      placeService.setUserPlaces(userPlaces(suggestions));
      const completed = get().quests.filter((q) => q.status === 'completed');
      const earned = newlyEarned({ completed, suggestions }, get().badges.map((b) => b.id));
      set({
        suggestions,
        badges: [...get().badges, ...earned.map((b) => ({ id: b, earnedAt: now() }))],
        badgeQueue: [...get().badgeQueue, ...earned],
      });
      await persist();
      return { ok: true, suggestion };
    },

    shiftBadge: () => {
      const [first, ...rest] = get().badgeQueue;
      set({ badgeQueue: rest });
      return first;
    },

    clearAll: async () => {
      await storage.clearAllPersonalData();
      // cleared means empty: don't bring the demo library back
      await storage.setJson('v2Seeded', true);
      placeService.setUserPlaces([]);
      set({
        prefs: DEFAULT_V2_PREFERENCES,
        quests: [],
        folders: [],
        badges: [],
        badgeQueue: [],
        suggestions: [],
        drawCount: 0,
        draw: null,
        location: defaultLocation(),
      });
    },
  };
});

function buildFromDraw(s: SidequestState): DrawnSidequest | null {
  const d = s.draw;
  if (!d || !d.place || !d.activity) return null;
  return buildDrawnQuest({
    place: d.place,
    activity: d.activity,
    location: s.location.coords,
    settings: d.settings,
    rarity: d.rarity,
    revealStyle: d.revealStyle,
    rerollsUsed: d.rerolls,
    cityLabel: s.location.cityLabel,
  });
}
