import {
  initialWalk,
  interpolate,
  routeFor,
  walkReducer,
  type WalkAction,
  type WalkState,
} from "../src/features/navigation/walkFlow";
import { importPreview } from "../src/services/persistence/importPreview";
import { conceptPhotoKey } from "../src/features/quest/conceptPhoto";

const run = (state: WalkState, ...actions: WalkAction[]) =>
  actions.reduce(walkReducer, state);
const ticks = (state: WalkState, count: number) =>
  Array.from({ length: count }).reduce<WalkState>(
    (s) => walkReducer(s, { type: "tick" }),
    state,
  );
describe("Rebecca app walking integration", () => {
  it("reopens and expands notifications without accepting or completing a quest", () => {
    const notice = run(initialWalk(), { type: "expandNotice" });
    expect(notice).toMatchObject({
      phase: "nearby",
      banner: true,
      noticeOpen: true,
    });
    expect(run(notice, { type: "dismiss" })).toMatchObject({
      phase: "nearby",
      banner: false,
      noticeOpen: false,
    });
    expect(run(notice, { type: "open" })).toMatchObject({
      phase: "preview",
      banner: false,
      noticeOpen: false,
    });
    expect(run(initialWalk(true), { type: "expandNotice" })).toEqual(
      initialWalk(true),
    );
    const arrival = run(
      initialWalk(true),
      { type: "arrive" },
      { type: "expandNotice" },
    );
    expect(arrival).toMatchObject({
      phase: "arrived",
      banner: true,
      noticeOpen: true,
    });
    expect(run(arrival, { type: "replay" })).toEqual(initialWalk());
    expect(run(arrival, { type: "dismiss" })).toMatchObject({
      phase: "arrived",
      arrivalOpen: false,
      banner: false,
    });
    const opened = run(arrival, { type: "openArrival" });
    expect(opened).toMatchObject({
      phase: "arrived",
      arrivalOpen: true,
      banner: false,
      noticeOpen: false,
    });
    expect(run(opened, { type: "closeArrival" })).toMatchObject({
      phase: "arrived",
      arrivalOpen: false,
    });
    expect(run(opened, { type: "finish" })).toMatchObject({
      phase: "done",
      arrivalOpen: false,
    });
    expect(run(initialWalk(), { type: "openArrival" })).toEqual(initialWalk());
  });
  it("selects relevant concept imagery without mutating quest or personal photo data", () => {
    const quest = Object.freeze({
      placeName: "Graffiti Alley",
      category: "art",
    });
    expect(conceptPhotoKey(quest)).toBe("passage");
    expect(conceptPhotoKey({ placeName: "West Park" })).toBe("garden");
    expect(conceptPhotoKey({ placeName: "The Window Seat" })).toBe("coffee");
    expect(
      conceptPhotoKey({ placeId: "preview:fountain", category: "unexpected" }),
    ).toBe("fountain");
    expect(conceptPhotoKey({})).toBe("fountain");
  });
  it("starts in Maps, then surfaces a separate notification without accepting a quest", () => {
    expect(initialWalk().phase).toBe("walking");
    expect(ticks(initialWalk(), 3).banner).toBe(false);
    expect(ticks(initialWalk(), 4)).toMatchObject({
      phase: "nearby",
      banner: true,
      expanded: false,
    });
  });
  it("dismisses the banner without removing the nearby discovery", () => {
    const nearby = run(ticks(initialWalk(), 4), { type: "dismiss" });
    expect(nearby).toMatchObject({ phase: "nearby", banner: false });
    expect(run(nearby, { type: "open" })).toMatchObject({
      phase: "preview",
      banner: false,
    });
  });
  it("waits for explicit acceptance, then previews the Live Activity", () => {
    const preview = run(ticks(initialWalk(), 4), { type: "open" });
    expect(ticks(preview, 40)).toBe(preview);
    const accepted = run(preview, { type: "accept" });
    expect(accepted).toMatchObject({
      phase: "detouring",
      expanded: true,
      progress: 0,
    });
    expect(ticks(accepted, 30)).toBe(accepted);
    expect(
      ticks(run(accepted, { type: "collapse" }), 1).progress,
    ).toBeGreaterThan(0);
  });
  it("arrives automatically and requires explicit completion to resume the walk", () => {
    const arrived = ticks(run(initialWalk(true), { type: "collapse" }), 26);
    expect(arrived).toMatchObject({
      phase: "arrived",
      progress: 1,
      banner: true,
    });
    expect(ticks(arrived, 20)).toBe(arrived);
    const done = run(arrived, { type: "finish" });
    expect(done).toMatchObject({ phase: "done", progress: 0, banner: false });
    expect(ticks(done, 5).progress).toBeGreaterThan(0);
    expect(ticks(done, 60).progress).toBe(1);
    expect(run(done, { type: "finish" })).toBe(done);
    expect(run(arrived, { type: "skip" })).toMatchObject({
      phase: "done",
      progress: 0,
    });
  });
  it("ignores out-of-order acceptance/arrival/completion and respects pause", () => {
    for (const type of ["accept", "arrive", "finish", "expand"] as const)
      expect(run(initialWalk(), { type })).toEqual(initialWalk());
    const paused = run(initialWalk(), { type: "pause" });
    expect(ticks(paused, 8)).toBe(paused);
    expect(ticks(run(paused, { type: "pause" }), 4).phase).toBe("nearby");
  });
  it("replays a generic walkthrough or a specific existing quest cleanly", () => {
    const active = run(
      initialWalk(true),
      { type: "collapse" },
      { type: "tick" },
    );
    expect(run(active, { type: "replay" })).toEqual(initialWalk());
    expect(run(active, { type: "replay", direct: true })).toEqual(
      initialWalk(true),
    );
    expect(run(active, { type: "skip" })).toMatchObject({
      phase: "done",
      expanded: false,
      banner: false,
    });
  });
  it("keeps the destination exact through pan-independent route interpolation", () => {
    const start = { latitude: 42.28, longitude: -83.74 },
      end = { latitude: 42.27, longitude: -83.73 };
    const route = routeFor(start, end);
    expect(route[0]).toBe(start);
    expect(route.at(-1)).toBe(end);
    expect(interpolate(route, 0)).toEqual(start);
    expect(interpolate(route, 1)).toEqual(end);
    expect(interpolate(route, -2)).toEqual(start);
    expect(interpolate(route, 2)).toEqual(end);
    expect(interpolate(routeFor(start, start), 0.5)).toEqual(start);
  });
});
describe("preserving earlier local memories in Rebecca’s Library", () => {
  const raw = JSON.stringify({
    version: 3,
    memories: [
      {
        id: "one",
        questId: "fountain",
        completedAt: "2026-10-22T12:00:00Z",
        note: "Quiet water.",
        photo: "data:image/jpeg;base64,TEST",
      },
    ],
    saved: ["garden"],
  });
  it("preserves the actual completion date, private photo and note", () => {
    const imported = importPreview(raw);
    expect(imported.quests).toHaveLength(2);
    expect(imported.folders).toHaveLength(1);
    expect(imported.quests[0]).toMatchObject({
      status: "completed",
      completedAt: "2026-10-22T12:00:00Z",
      isSimulated: true,
    });
    expect(imported.folders[0]).toMatchObject({
      note: "Quiet water.",
      sidequestId: imported.quests[0].id,
    });
    expect(imported.folders[0].photos[0].uri).toBe(
      "data:image/jpeg;base64,TEST",
    );
    expect(imported.quests[1].status).toBe("saved");
  });
  it("uses stable IDs so hydration can deduplicate imports", () => {
    const first = importPreview(raw),
      second = importPreview(raw);
    expect(second.quests.map((q) => q.id)).toEqual(
      first.quests.map((q) => q.id),
    );
    expect(second.folders).toEqual(first.folders);
  });
  it("rejects corrupt/unknown records and never imports a remote photo URL", () => {
    expect(importPreview("{bad")).toEqual({ quests: [], folders: [] });
    expect(
      importPreview(JSON.stringify({ version: 9, memories: [] })).quests,
    ).toEqual([]);
    const imported = importPreview(
      JSON.stringify({
        version: 3,
        memories: [
          { id: "bad", questId: "missing", completedAt: "invalid" },
          {
            id: "two",
            questId: "coffee",
            completedAt: "2026-10-22T12:00:00Z",
            photo: "https://example.com/private.jpg",
          },
        ],
      }),
    );
    expect(imported.quests).toHaveLength(1);
    expect(imported.folders[0].photos).toEqual([]);
  });
});
