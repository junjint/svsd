import {
  START,
  categories,
  destinationById,
  questById,
  quests,
  type Category,
  type Point,
  type Quest,
} from "./data";
import { along, meters, walkingRoute } from "./geo";

export interface Preferences {
  enabled: boolean;
  radius: number;
  maxDetour: number;
  categories: Category[];
  notifications: boolean;
  quiet: boolean;
  frequency: "often" | "balanced" | "rare";
  location: "demo" | "off";
}
export type Phase =
  | "idle"
  | "navigating"
  | "suggestion"
  | "detouring"
  | "arrived"
  | "resumed";
export interface Journey {
  id: number;
  phase: Phase;
  destinationId: string;
  legStart: Point;
  originalStart: Point;
  progress: number;
  elapsed: number;
  nextSuggestionAt: number;
  suggestionId: string | null;
  activeQuestId: string | null;
  dismissed: string[];
  arrivalOpened: boolean;
  arrivalWait: number;
}
export interface Memory {
  id: string;
  questId: string;
  completedAt: string;
  note: string;
  photo: string | null;
}
export type Overlay =
  | { kind: "search" | "route" | "activity" | "reset" }
  | { kind: "printer"; questId: string | null; edition: number }
  | { kind: "quest" | "arrival"; questId: string }
  | { kind: "memory"; memoryId: string }
  | null;
export interface Banner {
  id: number;
  kind: "suggestion" | "arrival";
  questId: string;
  age: number;
}
export interface AppState {
  onboarded: boolean;
  step: number;
  permission: "location" | "notifications" | null;
  asked: { location: boolean; notifications: boolean };
  prefs: Preferences;
  // Presentation defaults are session-only; don't overwrite remembered settings.
  demoSavedPrefs: Preferences | null;
  screen: "map" | "memories" | "preferences";
  overlay: Overlay;
  mode: "guided" | "explore";
  paused: boolean;
  journey: Journey;
  position: Point;
  selectedDestination: string;
  banner: Banner | null;
  activityDone: { questId: string; age: number } | null;
  memories: Memory[];
  saved: string[];
  draftNote: string;
  draftPhoto: string | null;
  clock: number;
  serial: number;
  toast: { text: string; until: number } | null;
}
export const defaultPreferences: Preferences = {
  enabled: true,
  radius: 800,
  maxDetour: 8,
  categories: categories.map((c) => c.id),
  notifications: false,
  quiet: false,
  frequency: "balanced",
  location: "off",
};
const idleJourney = (
  id = 0,
  position: Point = START,
  destinationId = "union",
): Journey => ({
  id,
  phase: "idle",
  destinationId,
  legStart: position,
  originalStart: position,
  progress: 0,
  elapsed: 0,
  nextSuggestionAt: 5,
  suggestionId: null,
  activeQuestId: null,
  dismissed: [],
  arrivalOpened: false,
  arrivalWait: 0,
});
export const initialApp: AppState = {
  onboarded: false,
  step: 0,
  permission: null,
  asked: { location: false, notifications: false },
  prefs: defaultPreferences,
  demoSavedPrefs: null,
  screen: "map",
  overlay: null,
  mode: "explore",
  paused: false,
  journey: idleJourney(),
  position: START,
  selectedDestination: "union",
  banner: null,
  activityDone: null,
  memories: [],
  saved: [],
  draftNote: "",
  draftPhoto: null,
  clock: 0,
  serial: 0,
  toast: null,
};
export const suggestionDelay = (frequency: Preferences["frequency"]) =>
  frequency === "often" ? 3 : frequency === "rare" ? 14 : 5;
export function eligibleQuests(state: AppState, manual = false): Quest[] {
  const { prefs, journey } = state;
  if (!prefs.enabled || prefs.location !== "demo" || (!manual && prefs.quiet))
    return [];
  const available = quests.filter(
    (q) =>
      q.detourMinutes <= prefs.maxDetour &&
      meters(state.position, q.position) <= prefs.radius &&
      q.categories.some((c) => prefs.categories.includes(c)) &&
      !journey.dismissed.includes(q.id) &&
      q.id !== journey.activeQuestId,
  );
  if (state.mode === "guided") return available;
  const completed = new Set(state.memories.map((m) => m.questId));
  return available.sort(
    (a, b) =>
      Number(completed.has(a.id)) - Number(completed.has(b.id)) ||
      meters(state.position, a.position) - meters(state.position, b.position),
  );
}
export function emptyReason(state: AppState) {
  if (!state.prefs.enabled) return "Sidequests are taking a pause.";
  if (state.prefs.location !== "demo")
    return "Turn on the Ann Arbor demo location in Preferences.";
  if (!state.prefs.categories.length)
    return "Choose an interest in Preferences.";
  return "Nothing within your limits just yet. Try a little more room.";
}
export function currentPath(state: AppState): Point[] {
  const j = state.journey;
  return walkingRoute(
    j.phase === "idle" ? state.position : j.legStart,
    j.activeQuestId
      ? questById(j.activeQuestId)!.position
      : destinationById(
          j.phase === "idle" ? state.selectedDestination : j.destinationId,
        ).position,
  );
}
const toast = (state: AppState, text: string): AppState => ({
  ...state,
  toast: { text, until: state.clock + 4 },
});
function startJourney(state: AppState, guided = false): AppState {
  const id = state.serial + 1,
    position = guided ? START : state.position,
    destination = guided ? "union" : state.selectedDestination;
  return {
    ...state,
    onboarded: true,
    screen: "map",
    overlay: null,
    mode: guided ? "guided" : "explore",
    paused: false,
    serial: id,
    selectedDestination: destination,
    position,
    banner: null,
    activityDone: null,
    draftNote: "",
    draftPhoto: null,
    journey: {
      ...idleJourney(id, position, destination),
      phase: "navigating",
      nextSuggestionAt: suggestionDelay(state.prefs.frequency),
    },
  };
}
function arrive(state: AppState): AppState {
  const id = state.journey.activeQuestId;
  if (!id) return state;
  const notifications = state.prefs.notifications && !state.prefs.quiet;
  return {
    ...state,
    position: questById(id)!.position,
    journey: {
      ...state.journey,
      phase: "arrived",
      progress: 1,
      arrivalOpened: !notifications && state.screen === "map",
      arrivalWait: 0,
    },
    banner: notifications
      ? { id: state.clock, kind: "arrival", questId: id, age: 0 }
      : null,
    overlay:
      !notifications && state.screen === "map"
        ? { kind: "arrival", questId: id }
        : state.overlay,
  };
}
function suggest(state: AppState, manual = false): AppState {
  const quest = eligibleQuests(state, manual)[0];
  if (!quest) return manual ? toast(state, emptyReason(state)) : state;
  return {
    ...state,
    journey: {
      ...state.journey,
      phase: "suggestion",
      suggestionId: quest.id,
      nextSuggestionAt:
        state.journey.elapsed + suggestionDelay(state.prefs.frequency),
    },
    banner:
      !manual && state.prefs.notifications && !state.prefs.quiet
        ? { id: state.clock, kind: "suggestion", questId: quest.id, age: 0 }
        : null,
    overlay: manual ? { kind: "quest", questId: quest.id } : state.overlay,
  };
}
export type AppAction =
  | { type: "restore"; raw: string | null }
  | { type: "launch-demo"; raw: string | null }
  | { type: "preview-activity"; journeyId: number; questId: string }
  | {
      type:
        | "onboard-next"
        | "onboard-back"
        | "close-permission"
        | "close"
        | "tick"
        | "start"
        | "guided"
        | "restart-demo"
        | "demo-notification"
        | "explore"
        | "end"
        | "suggest"
        | "print"
        | "dismiss-banner"
        | "cancel-detour"
        | "arrive"
        | "pause"
        | "reset";
    }
  | { type: "finish-onboarding"; mode: "guided" | "explore" }
  | { type: "permission"; permission: "location" | "notifications" }
  | { type: "answer-permission"; allow: boolean }
  | { type: "prefs"; patch: Partial<Preferences> }
  | { type: "screen"; screen: AppState["screen"] }
  | { type: "overlay"; overlay: Overlay }
  | { type: "destination"; id: string }
  | { type: "open-quest" | "accept" | "skip" | "save"; id: string }
  | { type: "open-banner" }
  | { type: "draft"; note?: string; photo?: string | null }
  | { type: "complete"; at: string }
  | { type: "edit-memory"; id: string; note: string; photo?: string | null };

export function appReducer(state: AppState, action: AppAction): AppState {
  const j = state.journey;
  switch (action.type) {
    case "restore":
      return restoreApp(action.raw);
    case "launch-demo":
      return appReducer(restoreApp(action.raw), { type: "restart-demo" });
    case "restart-demo":
      return startJourney(
        {
          ...state,
          demoSavedPrefs: state.demoSavedPrefs ?? state.prefs,
          prefs: {
            ...defaultPreferences,
            categories: [...defaultPreferences.categories],
            location: "demo",
            notifications: true,
          },
        },
        true,
      );
    case "demo-notification":
      return state.mode === "guided" && j.phase === "navigating"
        ? suggest(state)
        : state;
    case "preview-activity":
      return state.mode === "guided" &&
        state.screen === "map" &&
        j.phase === "detouring" &&
        j.id === action.journeyId &&
        j.activeQuestId === action.questId &&
        !state.overlay
        ? { ...state, overlay: { kind: "activity" } }
        : state;
    case "onboard-next":
      return { ...state, step: Math.min(2, state.step + 1) };
    case "onboard-back":
      return { ...state, step: Math.max(0, state.step - 1) };
    case "permission":
      return { ...state, permission: action.permission };
    case "close-permission":
      return { ...state, permission: null };
    case "answer-permission": {
      if (!state.permission) return state;
      const permission = state.permission;
      return {
        ...state,
        permission: null,
        asked: { ...state.asked, [permission]: true },
        prefs: {
          ...state.prefs,
          ...(permission === "location"
            ? { location: action.allow ? ("demo" as const) : ("off" as const) }
            : { notifications: action.allow }),
        },
      };
    }
    case "finish-onboarding":
      return action.mode === "guided"
        ? startJourney({ ...state, onboarded: true }, true)
        : { ...state, onboarded: true, screen: "map", mode: "explore" };
    case "prefs": {
      const prefs = { ...state.prefs, ...action.patch };
      prefs.radius = Math.max(200, Math.min(2000, prefs.radius));
      prefs.maxDetour = Math.max(2, Math.min(15, prefs.maxDetour));
      const next = {
        ...state,
        prefs,
        demoSavedPrefs: state.demoSavedPrefs
          ? {
              ...state.demoSavedPrefs,
              ...action.patch,
              ...(action.patch.radius === undefined
                ? {}
                : { radius: prefs.radius }),
              ...(action.patch.maxDetour === undefined
                ? {}
                : { maxDetour: prefs.maxDetour }),
            }
          : null,
        banner: !prefs.notifications || prefs.quiet ? null : state.banner,
      };
      if (
        j.phase === "suggestion" &&
        j.suggestionId &&
        !eligibleQuests(next, true).some((q) => q.id === j.suggestionId)
      )
        return {
          ...next,
          banner: null,
          journey: { ...j, phase: "navigating", suggestionId: null },
        };
      return next;
    }
    case "print": {
      // An invitation is a preview, never a route change or a completed memory.
      // Do not replace a detour that's already in progress.
      if (j.activeQuestId)
        return toast(state, "Keep or finish your current detour first.");
      const available = eligibleQuests(state, true);
      if (!available.length) return toast(state, emptyReason(state));
      const previous = state.overlay?.kind === "printer" ? state.overlay : null;
      const index = available.findIndex((q) => q.id === previous?.questId);
      const quest = available[(index + 1) % available.length];
      return {
        ...state,
        banner: null,
        overlay: {
          kind: "printer",
          questId: quest.id,
          edition: (previous?.edition ?? 0) + 1,
        },
      };
    }
    case "screen":
      return { ...state, screen: action.screen, overlay: null };
    case "overlay":
      return { ...state, overlay: action.overlay };
    case "close":
      return { ...state, overlay: null };
    case "start":
      return startJourney(state);
    case "guided":
      return startJourney(state, true);
    case "explore":
      return {
        ...state,
        mode: "explore",
        screen: "map",
        overlay: null,
        prefs: state.demoSavedPrefs ?? state.prefs,
        demoSavedPrefs: null,
      };
    case "pause":
      return { ...state, paused: !state.paused };
    case "destination":
      return {
        ...state,
        selectedDestination: destinationById(action.id).id,
        journey: idleJourney(j.id, state.position, action.id),
        overlay: null,
        banner: null,
        activityDone: null,
        paused: false,
      };
    case "end":
      return {
        ...state,
        journey: idleJourney(j.id, state.position, state.selectedDestination),
        overlay: null,
        banner: null,
        activityDone: null,
        paused: false,
      };
    case "suggest": {
      if (j.activeQuestId)
        return toast(state, "Your little detour is already underway.");
      const base = j.phase === "idle" ? startJourney(state) : state;
      return suggest(base, true);
    }
    case "open-quest":
      return questById(action.id)
        ? {
            ...state,
            overlay: { kind: "quest", questId: action.id },
            banner: null,
          }
        : state;
    case "open-banner": {
      if (!state.banner) return state;
      const banner = state.banner;
      return {
        ...state,
        screen: "map",
        banner: null,
        overlay: {
          kind: banner.kind === "arrival" ? "arrival" : "quest",
          questId: banner.questId,
        },
        journey: {
          ...j,
          arrivalOpened: banner.kind === "arrival" || j.arrivalOpened,
        },
      };
    }
    case "dismiss-banner":
      return { ...state, banner: null };
    case "skip": {
      if (j.phase === "detouring" && j.activeQuestId === action.id)
        return appReducer(state, { type: "cancel-detour" });
      return toast(
        {
          ...state,
          overlay: null,
          banner: null,
          journey: {
            ...j,
            phase: j.phase === "suggestion" ? "navigating" : j.phase,
            suggestionId: null,
            dismissed: [...new Set([...j.dismissed, action.id])],
            nextSuggestionAt:
              j.elapsed + suggestionDelay(state.prefs.frequency) + 6,
          },
        },
        "Your route, unchanged.",
      );
    }
    case "save":
      return questById(action.id)
        ? toast(
            {
              ...state,
              saved: state.saved.includes(action.id)
                ? state.saved.filter((id) => id !== action.id)
                : [...state.saved, action.id],
            },
            state.saved.includes(action.id)
              ? "Removed from saved."
              : "A possibility, saved.",
          )
        : state;
    case "accept": {
      const quest = questById(action.id);
      if (!quest) return state;
      if (!state.prefs.enabled || state.prefs.location !== "demo")
        return toast(state, emptyReason(state));
      const base = j.phase === "idle" ? startJourney(state) : state;
      return {
        ...base,
        screen: "map",
        overlay: null,
        banner: null,
        activityDone: null,
        paused: false,
        draftNote: "",
        draftPhoto: null,
        journey: {
          ...base.journey,
          phase: "detouring",
          legStart: base.position,
          progress: 0,
          activeQuestId: quest.id,
          suggestionId: null,
          arrivalOpened: false,
          arrivalWait: 0,
        },
      };
    }
    case "cancel-detour":
      return toast(
        {
          ...state,
          screen: "map",
          overlay: null,
          banner: null,
          activityDone: null,
          draftNote: "",
          draftPhoto: null,
          journey: {
            ...j,
            phase: j.phase === "idle" ? "idle" : "resumed",
            legStart: state.position,
            progress: 0,
            activeQuestId: null,
            suggestionId: null,
            dismissed: j.activeQuestId
              ? [...new Set([...j.dismissed, j.activeQuestId])]
              : j.dismissed,
          },
        },
        "Back to your original walk.",
      );
    case "arrive":
      return j.phase === "detouring" ? arrive(state) : state;
    case "draft":
      return {
        ...state,
        draftNote:
          action.note === undefined
            ? state.draftNote
            : action.note.slice(0, 180),
        draftPhoto:
          action.photo === undefined ? state.draftPhoto : action.photo,
      };
    case "complete": {
      if (j.phase !== "arrived" || !j.activeQuestId) return state;
      const memory: Memory = {
        id: `${j.id}-${j.activeQuestId}-${state.memories.length}`,
        questId: j.activeQuestId,
        completedAt: action.at,
        note: state.draftNote.trim(),
        photo: state.draftPhoto,
      };
      return {
        ...state,
        screen: "map",
        overlay: null,
        banner: null,
        memories: [memory, ...state.memories],
        activityDone: { questId: j.activeQuestId, age: 0 },
        draftNote: "",
        draftPhoto: null,
        journey: {
          ...j,
          phase: "resumed",
          legStart: state.position,
          progress: 0,
          activeQuestId: null,
          suggestionId: null,
        },
      };
    }
    case "edit-memory":
      return {
        ...state,
        memories: state.memories.map((m) =>
          m.id === action.id
            ? {
                ...m,
                note: action.note.slice(0, 180),
                photo: action.photo === undefined ? m.photo : action.photo,
              }
            : m,
        ),
      };
    case "reset":
      return {
        ...initialApp,
        prefs: {
          ...defaultPreferences,
          categories: [...defaultPreferences.categories],
        },
        journey: idleJourney(),
        asked: { location: false, notifications: false },
        saved: [],
        memories: [],
      };
    case "tick": {
      let next: AppState = {
        ...state,
        clock: state.clock + 1,
        banner: state.banner
          ? { ...state.banner, age: state.banner.age + 1 }
          : null,
        activityDone: state.activityDone
          ? { ...state.activityDone, age: state.activityDone.age + 1 }
          : null,
      };
      if (next.banner && next.banner.age >= 9) next.banner = null;
      if (next.activityDone && next.activityDone.age >= 4)
        next.activityDone = null;
      if (next.toast && next.toast.until <= next.clock) next.toast = null;
      if (j.phase === "arrived") {
        const wait = j.arrivalWait + 1;
        next.journey = { ...j, arrivalWait: wait };
        if (
          !j.arrivalOpened &&
          wait >= 3 &&
          state.screen === "map" &&
          !state.overlay
        ) {
          next.overlay = { kind: "arrival", questId: j.activeQuestId! };
          next.journey.arrivalOpened = true;
          next.banner = null;
        }
        return next;
      }
      if (
        state.paused ||
        (state.mode === "guided" && state.overlay?.kind === "activity") ||
        !["navigating", "suggestion", "detouring", "resumed"].includes(j.phase)
      )
        return next;
      const progress = Math.min(
        1,
        j.progress +
          (j.phase === "detouring"
            ? state.mode === "guided"
              ? 0.03
              : 0.025
            : state.mode === "guided"
              ? 0.01
              : 0.007),
      );
      next.journey = { ...j, progress, elapsed: j.elapsed + 1 };
      next.position = along(currentPath(state), progress);
      if (progress >= 1) {
        if (j.phase === "detouring") return arrive(next);
        return toast(
          {
            ...next,
            journey: idleJourney(j.id, next.position, j.destinationId),
            banner: null,
          },
          "You’ve reached your destination.",
        );
      }
      if (
        j.phase === "navigating" &&
        next.journey.elapsed >= j.nextSuggestionAt &&
        state.screen === "map" &&
        !state.overlay
      ) {
        const suggested = suggest(next);
        return suggested === next
          ? {
              ...next,
              journey: {
                ...next.journey,
                nextSuggestionAt:
                  next.journey.elapsed + suggestionDelay(state.prefs.frequency),
              },
            }
          : suggested;
      }
      return next;
    }
  }
}

export const STORAGE_KEY = "sidequest:app:v3";
export function persistedState(state: AppState) {
  return {
    version: 3,
    onboarded: state.onboarded,
    prefs: state.demoSavedPrefs ?? state.prefs,
    memories: state.memories,
    saved: state.saved,
    selectedDestination: state.selectedDestination,
    serial: state.serial,
  };
}
export function restoreApp(raw: string | null): AppState {
  try {
    const value = raw ? JSON.parse(raw) : null;
    if (value?.version !== 3) return { ...initialApp };
    const p = value.prefs ?? {},
      validCategories = categories.map((c) => c.id);
    const prefs: Preferences = {
      ...defaultPreferences,
      enabled: typeof p.enabled === "boolean" ? p.enabled : true,
      radius:
        typeof p.radius === "number"
          ? Math.max(200, Math.min(2000, p.radius))
          : 800,
      maxDetour:
        typeof p.maxDetour === "number"
          ? Math.max(2, Math.min(15, p.maxDetour))
          : 8,
      categories: Array.isArray(p.categories)
        ? p.categories.filter((id: Category) => validCategories.includes(id))
        : defaultPreferences.categories,
      notifications: p.notifications === true,
      quiet: p.quiet === true,
      frequency: ["often", "balanced", "rare"].includes(p.frequency)
        ? p.frequency
        : "balanced",
      location: p.location === "demo" ? "demo" : "off",
    };
    const memories: Memory[] = Array.isArray(value.memories)
      ? value.memories
          .filter(
            (m: Memory) =>
              m &&
              typeof m.id === "string" &&
              questById(m.questId) &&
              typeof m.completedAt === "string" &&
              !isNaN(Date.parse(m.completedAt)),
          )
          .map((m: Memory) => ({
            ...m,
            note: typeof m.note === "string" ? m.note.slice(0, 180) : "",
            photo:
              typeof m.photo === "string" && m.photo.startsWith("data:image/")
                ? m.photo
                : null,
          }))
      : [];
    return {
      ...initialApp,
      onboarded: value.onboarded === true,
      prefs,
      memories,
      saved: Array.isArray(value.saved)
        ? value.saved.filter((id: string) => questById(id))
        : [],
      selectedDestination: destinationById(value.selectedDestination).id,
      serial: Number.isSafeInteger(value.serial)
        ? value.serial
        : memories.length,
    };
  } catch {
    return { ...initialApp };
  }
}
