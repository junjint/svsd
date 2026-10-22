import {
  initialStory,
  scenes,
  storyReducer,
  type StoryAction,
  type StoryState,
} from "../src/features/prototype/story";
import {
  appReducer,
  defaultPreferences,
  eligibleQuests,
  initialApp,
  persistedState,
  restoreApp,
  currentPath,
  type AppAction,
  type AppState,
} from "../src/features/prototype/app/model";
import {
  START,
  quests,
  destinationById,
} from "../src/features/prototype/app/data";
import {
  along,
  meters,
  routeLength,
  walkingRoute,
} from "../src/features/prototype/app/geo";
import {
  createHoldController,
  HOLD_MS,
} from "../src/features/prototype/app/hold";
import {
  groupMemoryDays,
  localDayKey,
  memoriesOnDay,
  monthCells,
} from "../src/features/prototype/app/calendar";
const start: StoryAction = { type: "start" };
const next: StoryAction = { type: "next" };
const run = (...actions: StoryAction[]): StoryState =>
  actions.reduce(storyReducer, initialStory);

describe("the contained iPhone demo", () => {
  it("waits for the user to start walking, then follows the six-moment journey", () => {
    expect(storyReducer(initialStory, next)).toBe(initialStory);
    let state = run(start);
    for (const scene of scenes) {
      expect(state.scene).toBe(scene);
      expect(state.completed).toBe(scene === "return");
      state = storyReducer(state, next);
    }
    expect(state.scene).toBe("return");
    expect(state.history).toEqual(scenes.slice(0, -1));
  });
  it("returns to normal navigation when the expanded island is dismissed", () => {
    const dismissed = run(start, next, next, { type: "dismiss" });
    expect(dismissed).toMatchObject({
      scene: "journey",
      walking: true,
      dismissed: true,
      completed: false,
    });
    expect(storyReducer(dismissed, { type: "advance", from: "journey" })).toBe(
      dismissed,
    );
    expect(storyReducer(initialStory, { type: "dismiss" })).toBe(initialStory);
  });
  it("allows another opportunity after a dismissal without completing a quest", () => {
    expect(
      run(start, next, { type: "dismiss" }, start, {
        type: "advance",
        from: "journey",
      }),
    ).toMatchObject({ scene: "nearby", dismissed: false, completed: false });
  });
  it("rejects stale automatic transitions after a replay or scene change", () => {
    const discovery = run(start, next, next);
    expect(storyReducer(discovery, { type: "advance", from: "detour" })).toBe(
      discovery,
    );
    expect(
      run(
        start,
        next,
        next,
        next,
        { type: "replay" },
        { type: "advance", from: "detour" },
      ),
    ).toEqual(initialStory);
    expect(run({ type: "advance", from: "journey" })).toEqual(initialStory);
  });
  it("backtracks through every moment and pauses at the original starting point", () => {
    let state = run(start, next, next, next, next, next);
    for (const scene of [...scenes].reverse().slice(1)) {
      state = storyReducer(state, { type: "back" });
      expect(state.scene).toBe(scene);
      expect(state.completed).toBe(false);
    }
    expect(state).toEqual(initialStory);
    expect(storyReducer(state, { type: "back" })).toBe(state);
  });
  it("lets the completion Live Activity collapse without changing the returned route", () => {
    const returned = run(start, next, next, next, next, next);
    expect(storyReducer(returned, { type: "settle" })).toMatchObject({
      scene: "return",
      completed: true,
      settled: true,
    });
    expect(storyReducer(initialStory, { type: "settle" })).toBe(initialStory);
  });
  it("replays reliably from any moment with no leftover progress", () => {
    let state = run(start);
    for (const scene of scenes) {
      expect(state.scene).toBe(scene);
      expect(storyReducer(state, { type: "replay" })).toEqual(initialStory);
      state = storyReducer(state, next);
    }
  });
});

const fullRun = (state: AppState, ...actions: AppAction[]) =>
  actions.reduce(appReducer, state);
const ready = (): AppState =>
  fullRun(
    initialApp,
    { type: "prefs", patch: { location: "demo", notifications: true } },
    { type: "guided" },
  );
const ticks = (state: AppState, count: number) =>
  Array.from({ length: count }).reduce<AppState>(
    (s) => appReducer(s, { type: "tick" }),
    state,
  );
describe("the complete Sidequest app", () => {
  it("keeps permission choices real and persisted without requesting device access", () => {
    const state = fullRun(
      initialApp,
      { type: "onboard-next" },
      { type: "onboard-next" },
      { type: "onboard-next" },
      { type: "permission", permission: "location" },
      { type: "answer-permission", allow: true },
      { type: "permission", permission: "notifications" },
      { type: "answer-permission", allow: false },
      { type: "finish-onboarding", mode: "explore" },
    );
    expect(state.step).toBe(2);
    expect(state.onboarded).toBe(true);
    expect(state.prefs).toMatchObject({
      location: "demo",
      notifications: false,
    });
    const restored = restoreApp(JSON.stringify(persistedState(state)));
    expect(restored.onboarded).toBe(true);
    expect(restored.prefs).toEqual(state.prefs);
    expect(restored.journey.phase).toBe("idle");
  });
  it("triggers a genuine banner from journey progress, opens it, and preserves the original destination", () => {
    const state = ticks(ready(), 5);
    expect(state.journey.phase).toBe("suggestion");
    expect(state.banner).toMatchObject({
      kind: "suggestion",
      questId: "fountain",
    });
    const opened = appReducer(state, { type: "open-banner" });
    expect(opened.overlay).toEqual({ kind: "quest", questId: "fountain" });
    expect(opened.banner).toBeNull();
    const accepted = appReducer(opened, { type: "accept", id: "fountain" });
    expect(accepted.journey).toMatchObject({
      phase: "detouring",
      destinationId: "union",
      activeQuestId: "fountain",
      progress: 0,
    });
    expect(currentPath(accepted).at(-1)).toEqual(quests[0].position);
  });
  it("dismisses or expires only the banner, without accepting or deleting the opportunity", () => {
    const suggestion = ticks(ready(), 5),
      dismissed = appReducer(suggestion, { type: "dismiss-banner" }),
      expired = ticks(suggestion, 9);
    expect(dismissed.banner).toBeNull();
    expect(expired.banner).toBeNull();
    expect(expired.journey.phase).toBe("suggestion");
    expect(expired.journey.activeQuestId).toBeNull();
    expect(expired.journey.suggestionId).toBe("fountain");
    const skipped = appReducer(dismissed, { type: "skip", id: "fountain" });
    expect(skipped.journey.phase).toBe("navigating");
    expect(eligibleQuests(skipped).some((q) => q.id === "fountain")).toBe(
      false,
    );
  });
  it("respects disabled, location, category, radius and detour limits", () => {
    const base = ready();
    for (const patch of [
      { enabled: false },
      { location: "off" as const },
      { categories: [] },
      { maxDetour: 2 },
    ])
      expect(
        eligibleQuests(appReducer(base, { type: "prefs", patch })),
      ).toEqual([]);
    const art = appReducer(base, {
      type: "prefs",
      patch: { categories: ["art"], radius: 200 },
    });
    expect(eligibleQuests(art).map((q) => q.id)).toEqual(["passage"]);
    expect(
      eligibleQuests(
        appReducer(base, {
          type: "prefs",
          patch: { categories: ["nature"], radius: 200 },
        }),
      ),
    ).toEqual([]);
  });
  it("supports quiet manual discovery and notification-free navigation", () => {
    const quiet = appReducer(ready(), {
      type: "prefs",
      patch: { quiet: true },
    });
    expect(ticks(quiet, 12).banner).toBeNull();
    expect(eligibleQuests(quiet)).toEqual([]);
    expect(appReducer(quiet, { type: "suggest" }).overlay?.kind).toBe("quest");
    const silent = ticks(
      appReducer(ready(), { type: "prefs", patch: { notifications: false } }),
      5,
    );
    expect(silent.banner).toBeNull();
    expect(silent.journey.suggestionId).toBe("fountain");
  });
  it("uses the selected frequency and pauses progress without freezing banner expiry", () => {
    const rare = appReducer(
      fullRun(initialApp, {
        type: "prefs",
        patch: {
          ...defaultPreferences,
          location: "demo",
          notifications: true,
          frequency: "rare",
        },
      }),
      { type: "guided" },
    );
    expect(ticks(rare, 13).banner).toBeNull();
    expect(ticks(rare, 14).banner?.kind).toBe("suggestion");
    const paused = appReducer(ticks(ready(), 5), { type: "pause" }),
      later = ticks(paused, 10);
    expect(later.position).toEqual(paused.position);
    expect(later.journey.progress).toBe(paused.journey.progress);
    expect(later.banner).toBeNull();
  });
  it("reroutes to different quests and restores the original destination when canceled", () => {
    const accepted = fullRun(
        ready(),
        { type: "destination", id: "library" },
        { type: "start" },
        { type: "accept", id: "passage" },
      ),
      walked = ticks(accepted, 4),
      changed = appReducer(walked, { type: "accept", id: "garden" });
    expect(currentPath(changed).at(-1)).toEqual(quests[2].position);
    expect(changed.journey.legStart).toEqual(walked.position);
    const canceled = appReducer(changed, { type: "cancel-detour" });
    expect(canceled.journey).toMatchObject({
      phase: "resumed",
      destinationId: "library",
      activeQuestId: null,
    });
    expect(currentPath(canceled).at(-1)).toEqual(
      destinationById("library").position,
    );
    expect(canceled.memories).toHaveLength(0);
  });
  it("arrives automatically, presents arrival separately, completes once, and resumes the original walk", () => {
    const accepted = appReducer(ready(), { type: "accept", id: "fountain" }),
      arrived = ticks(accepted, 34);
    expect(arrived.journey.phase).toBe("arrived");
    expect(arrived.banner?.kind).toBe("arrival");
    expect(arrived.position).toEqual(quests[0].position);
    const opened = ticks(arrived, 3);
    expect(opened.overlay?.kind).toBe("arrival");
    const done = fullRun(
      opened,
      {
        type: "draft",
        note: "The sound of water.",
        photo: "data:image/jpeg;base64,test",
      },
      { type: "complete", at: "2026-10-21T12:00:00Z" },
    );
    expect(done.memories).toHaveLength(1);
    expect(done.memories[0].note).toBe("The sound of water.");
    expect(done.journey.phase).toBe("resumed");
    expect(done.activityDone?.questId).toBe("fountain");
    expect(currentPath(done).at(-1)).toEqual(destinationById("union").position);
    expect(
      appReducer(done, { type: "complete", at: "2026-10-21T12:00:01Z" })
        .memories,
    ).toHaveLength(1);
    expect(ticks(done, 4).activityDone).toBeNull();
  });
  it("saves, edits and restores memories and bookmarks; reset is explicit and complete", () => {
    const done = fullRun(
        ready(),
        { type: "save", id: "garden" },
        { type: "accept", id: "fountain" },
        { type: "arrive" },
        { type: "complete", at: "2026-10-21T12:00:00Z" },
      ),
      edited = appReducer(done, {
        type: "edit-memory",
        id: done.memories[0].id,
        note: "A quieter way.",
        photo: "data:image/jpeg;base64,moment",
      });
    const restored = restoreApp(JSON.stringify(persistedState(edited)));
    expect(restored.saved).toEqual(["garden"]);
    expect(restored.memories[0]).toMatchObject({
      note: "A quieter way.",
      photo: "data:image/jpeg;base64,moment",
    });
    expect(appReducer(restored, { type: "save", id: "garden" }).saved).toEqual(
      [],
    );
    const reset = appReducer(restored, { type: "reset" });
    expect(reset.onboarded).toBe(false);
    expect(reset.memories).toEqual([]);
    expect(reset.prefs.location).toBe("off");
  });
  it("handles corrupted persisted data, unknown quests and reload without a stale live activity", () => {
    expect(restoreApp("{broken").onboarded).toBe(false);
    expect(restoreApp(null).memories).toEqual([]);
    const restored = restoreApp(
      JSON.stringify({
        version: 3,
        onboarded: true,
        prefs: { radius: 99999, maxDetour: -2, categories: ["fake", "art"] },
        memories: [null, { id: "bad", questId: "unknown", completedAt: "bad" }],
        saved: ["fake", "garden"],
      }),
    );
    expect(restored.prefs).toMatchObject({
      radius: 2000,
      maxDetour: 2,
      categories: ["art"],
    });
    expect(restored.memories).toEqual([]);
    expect(restored.saved).toEqual(["garden"]);
    expect(restored.journey.phase).toBe("idle");
    const active = appReducer(ready(), { type: "accept", id: "garden" });
    expect(
      restoreApp(JSON.stringify(persistedState(active))).journey.activeQuestId,
    ).toBeNull();
  });
  it("replays guided mode deterministically without deleting earlier memories or settings", () => {
    const existing = fullRun(
      ready(),
      { type: "save", id: "coffee" },
      { type: "accept", id: "garden" },
      { type: "arrive" },
      { type: "complete", at: "2026-10-21T12:00:00Z" },
      { type: "guided" },
    );
    expect(existing.position).toEqual(START);
    expect(existing.journey.destinationId).toBe("union");
    expect(existing.saved).toEqual(["coffee"]);
    expect(existing.memories).toHaveLength(1);
    expect(ticks(existing, 5).banner?.questId).toBe("fountain");
  });
});
describe("the geographically anchored demo route engine", () => {
  it("joins every quest to the original destination through the local street graph", () => {
    for (const q of quests) {
      const path = walkingRoute(START, q.position);
      expect(path[0]).toEqual(START);
      expect(path.at(-1)).toEqual(q.position);
      expect(routeLength(path)).toBeGreaterThanOrEqual(
        meters(START, q.position) - 0.1,
      );
      expect(routeLength(path)).toBeLessThan(1500);
      expect(along(path, 0)).toEqual(START);
      expect(along(path, 1)).toEqual(q.position);
    }
  });
  it("interpolates by length and keeps movement on the route", () => {
    const path = walkingRoute(START, destinationById("union").position),
      half = along(path, 0.5);
    expect(meters(START, half)).toBeGreaterThan(100);
    expect(meters(half, path.at(-1)!)).toBeGreaterThan(100);
    expect(along(path, -1)).toEqual(START);
    expect(along(path, 2)).toEqual(path.at(-1));
  });
});

describe("Rebecca integration: intentional completion", () => {
  function harness() {
    let now = 0,
      id = 0;
    const frames = new Map<number, () => void>(),
      complete = jest.fn(),
      progress = jest.fn();
    const hold = createHoldController(
      {
        now: () => now,
        request: (fn) => {
          frames.set(++id, fn);
          return id;
        },
        cancel: (key) => {
          frames.delete(key);
        },
      },
      progress,
      complete,
    );
    const step = (ms: number) => {
      now += ms;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((fn) => fn());
    };
    return { hold, step, complete, progress, frames };
  }
  it("only completes after a continuous 1400 ms hold, once", () => {
    const h = harness();
    h.hold.begin();
    h.step(HOLD_MS - 1);
    expect(h.complete).not.toHaveBeenCalled();
    h.step(1);
    expect(h.complete).toHaveBeenCalledTimes(1);
    h.hold.activate();
    h.hold.begin();
    h.step(2000);
    expect(h.complete).toHaveBeenCalledTimes(1);
  });
  it("cancels an early release or drag-away and starts fresh on the next press", () => {
    const h = harness();
    h.hold.begin();
    h.step(1000);
    h.hold.cancel();
    h.step(1000);
    expect(h.complete).not.toHaveBeenCalled();
    expect(h.progress).toHaveBeenLastCalledWith(0);
    h.hold.begin();
    h.step(500);
    expect(h.complete).not.toHaveBeenCalled();
    h.step(900);
    expect(h.complete).toHaveBeenCalledTimes(1);
  });
  it("cleans pending work on unmount and accepts accessible activation without a timed gesture", () => {
    const h = harness();
    h.hold.begin();
    h.hold.dispose();
    expect(h.frames.size).toBe(0);
    h.step(5000);
    h.hold.activate();
    expect(h.complete).not.toHaveBeenCalled();
    const accessible = harness();
    accessible.hold.activate();
    accessible.hold.activate();
    expect(accessible.complete).toHaveBeenCalledTimes(1);
  });
});
describe("Rebecca integration: photo calendar", () => {
  const memory = (id: string, at: string) => ({
    id,
    questId: "fountain",
    completedAt: at,
    note: "",
    photo: null,
  });
  it("uses local completion days, not UTC dates or acceptance time", () => {
    const completed = new Date(2026, 9, 21, 23, 45),
      m = memory("late", completed.toISOString());
    expect(localDayKey(m.completedAt)).toBe("2026-10-21");
    expect(groupMemoryDays([m]).get("2026-10-21")).toEqual([m]);
    expect(localDayKey("bad-date")).toBeNull();
  });
  it("handles Monday alignment, leap years, and year-boundary navigation", () => {
    expect(monthCells(2024, 1).days).toHaveLength(29);
    expect(monthCells(2026, 5).leading).toBe(0);
    expect(monthCells(2026, 12).days[0].key).toBe("2027-01-01");
    expect(monthCells(2026, -1).days[0].key).toBe("2025-12-01");
  });
  it("groups every discovery on a day and restores the complete gallery on clear", () => {
    const first = memory("a", new Date(2026, 9, 21, 9).toISOString()),
      second = memory("b", new Date(2026, 9, 21, 17).toISOString()),
      other = memory("c", new Date(2026, 9, 20, 12).toISOString()),
      all = [first, second, other];
    expect(groupMemoryDays(all).size).toBe(2);
    expect(memoriesOnDay(all, "2026-10-21")).toEqual([first, second]);
    expect(memoriesOnDay(all, null)).toBe(all);
  });
});
describe("Rebecca integration: a memory is a working navigation entry", () => {
  it("saves edits, revisits without duplicating history, and keeps the original destination", () => {
    const done = fullRun(
        ready(),
        { type: "accept", id: "fountain" },
        { type: "arrive" },
        { type: "complete", at: "2026-10-21T12:00:00Z" },
      ),
      revisit = fullRun(
        done,
        {
          type: "edit-memory",
          id: done.memories[0].id,
          note: "Back for the water.",
        },
        { type: "accept", id: "fountain" },
      );
    expect(revisit.journey).toMatchObject({
      phase: "detouring",
      activeQuestId: "fountain",
      destinationId: "union",
    });
    expect(revisit.memories).toHaveLength(1);
    expect(revisit.memories[0].note).toBe("Back for the water.");
    expect(currentPath(revisit).at(-1)).toEqual(quests[0].position);
  });
  it("does not bypass disabled or denied-location preferences through navigation", () => {
    for (const patch of [{ enabled: false }, { location: "off" as const }]) {
      const blocked = appReducer(ready(), { type: "prefs", patch });
      expect(
        appReducer(blocked, { type: "accept", id: "fountain" }).journey
          .activeQuestId,
      ).toBeNull();
    }
  });
});

describe("invitation printer: paper ritual, existing walk state", () => {
  const openPrinter: AppAction = {
    type: "overlay",
    overlay: { kind: "printer", questId: null, edition: 0 },
  };
  it("prints without starting a walk, completing a memory or changing the original route", () => {
    const idle = fullRun(initialApp, {
      type: "prefs",
      patch: { location: "demo" },
    });
    const printed = fullRun(idle, openPrinter, { type: "print" });
    expect(printed.overlay).toMatchObject({ kind: "printer", edition: 1 });
    expect(printed.journey).toBe(idle.journey);
    expect(printed.position).toBe(idle.position);
    expect(printed.memories).toEqual([]);
    expect(printed.serial).toBe(idle.serial);
  });
  it("cycles eligible invitations and saves without accepting or tearing down the preview", () => {
    const first = fullRun(ready(), openPrinter, { type: "print" });
    const second = appReducer(first, { type: "print" });
    if (first.overlay?.kind !== "printer" || second.overlay?.kind !== "printer")
      throw new Error("Expected paper invitations");
    expect(first.overlay.questId).not.toBe(second.overlay.questId);
    expect(second.overlay.edition).toBe(2);
    const saved = appReducer(second, {
      type: "save",
      id: second.overlay.questId!,
    });
    expect(saved.saved).toContain(second.overlay.questId);
    expect(saved.overlay).toBe(second.overlay);
    expect(saved.journey).toBe(first.journey);
    expect(saved.memories).toHaveLength(0);
  });
  it("respects location, enabled, radius, duration, interests and dismissed places", () => {
    for (const patch of [
      { location: "off" as const },
      { enabled: false },
      { categories: [] },
      { maxDetour: 2 },
    ]) {
      const blocked = fullRun(ready(), { type: "prefs", patch }, openPrinter);
      const printed = appReducer(blocked, { type: "print" });
      expect(printed.overlay).toEqual(blocked.overlay);
      expect(printed.toast).not.toBeNull();
    }
    const filtered = fullRun(
      ready(),
      {
        type: "prefs",
        patch: { radius: 200, categories: ["art"], maxDetour: 3 },
      },
      { type: "skip", id: "passage" },
      openPrinter,
    );
    const options = eligibleQuests(filtered, true);
    const printed = appReducer(filtered, { type: "print" });
    if (printed.overlay?.kind !== "printer")
      throw new Error("Expected printer");
    expect(printed.overlay.questId).toBe(options[0]?.id ?? null);
    expect(printed.overlay.questId).not.toBe("passage");
  });
  it("allows quiet-mode manual printing, but does not interrupt an active or arrived detour", () => {
    const quiet = fullRun(
      ready(),
      { type: "prefs", patch: { quiet: true } },
      openPrinter,
      { type: "print" },
    );
    expect(quiet.overlay).toMatchObject({ kind: "printer", edition: 1 });
    for (const arrive of [false, true]) {
      let active = fullRun(ready(), { type: "accept", id: "fountain" });
      if (arrive) active = appReducer(active, { type: "arrive" });
      const printed = fullRun(active, openPrinter, { type: "print" });
      expect(printed.journey).toBe(active.journey);
      expect(printed.memories).toEqual(active.memories);
      expect(printed.overlay).toMatchObject({ kind: "printer", questId: null });
    }
  });
  it("accepts the printed ticket through the normal navigation and completion lifecycle", () => {
    const printed = fullRun(ready(), openPrinter, { type: "print" });
    if (printed.overlay?.kind !== "printer" || !printed.overlay.questId)
      throw new Error("Expected printed invitation");
    const accepted = appReducer(printed, {
      type: "accept",
      id: printed.overlay.questId,
    });
    expect(accepted.overlay).toBeNull();
    expect(accepted.screen).toBe("map");
    expect(accepted.journey.destinationId).toBe(printed.journey.destinationId);
    expect(accepted.memories).toHaveLength(0);
    const done = fullRun(
      accepted,
      { type: "arrive" },
      { type: "complete", at: "2026-10-22T12:00:00Z" },
    );
    expect(done.memories).toHaveLength(1);
    expect(done.journey.phase).toBe("resumed");
    const restored = restoreApp(JSON.stringify(persistedState(done)));
    expect(restored.memories).toEqual(done.memories);
    expect(restored.overlay).toBeNull();
  });
  it("returns to the map from either tab without replacing the current journey", () => {
    const walking = fullRun(ready(), { type: "accept", id: "fountain" });
    for (const screen of ["memories", "preferences"] as const) {
      const returned = fullRun(
        walking,
        { type: "screen", screen },
        { type: "screen", screen: "map" },
      );
      expect(returned.journey).toBe(walking.journey);
      expect(returned.screen).toBe("map");
    }
  });
});
