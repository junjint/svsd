import { currentPath, type AppState } from "./model";
import { along, meters } from "./geo";
import { destinationById, streets } from "./data";

export function walkthroughStep(state: AppState) {
  if (
    state.journey.phase === "resumed" ||
    state.activityDone ||
    (state.journey.phase === "idle" &&
      state.memories.some((m) => m.id.startsWith(`${state.journey.id}-`)))
  )
    return 5;
  if (state.journey.phase === "arrived") return 4;
  if (state.journey.activeQuestId) return 3;
  if (state.journey.suggestionId) return 2;
  return 1;
}
export const walkthroughHints = [
  "You’re walking in Maps. A Sidequest notification is on its way.",
  "A little possibility. Tap the notification or open it below.",
  "Your detour lives in the Dynamic Island. Tap or hold it anytime.",
  "You’re here. Notice something, then keep your moment.",
  "Back on your original walk. Your discoveries stay in Library.",
] as const;

/** Maneuver cues derived from the seeded path, never presented as live directions. */
export function walkingCue(state: AppState) {
  const route = currentPath(state);
  if (route.length < 2)
    return {
      instruction: "You’ve arrived",
      street: destinationById(state.selectedDestination).name,
      distance: 0,
      direction: "✓",
    };
  const here = along(route, state.journey.progress);
  let index = 1;
  for (let i = 1; i < route.length; i++) {
    if (
      meters(here, route[i - 1]) + meters(here, route[i]) <=
      meters(route[i - 1], route[i]) + 1
    ) {
      index = i;
      break;
    }
  }
  const from = route[index - 1],
    to = route[index];
  const vertical =
    Math.abs(to[0] - from[0]) > Math.abs((to[1] - from[1]) * 0.74);
  const road = streets.find((s) =>
    s.points.some((p, i) => {
      if (!i) return false;
      return (
        meters(from, s.points[i - 1]) + meters(from, p) <=
          meters(s.points[i - 1], p) + 1 &&
        meters(to, s.points[i - 1]) + meters(to, p) <=
          meters(s.points[i - 1], p) + 1
      );
    }),
  );
  return {
    instruction:
      state.journey.phase === "arrived" ? "You’ve arrived" : "Continue walking",
    street: road?.name ?? "Toward your next stop",
    distance:
      state.journey.phase === "arrived"
        ? 0
        : Math.max(10, Math.round(meters(here, to) / 10) * 10),
    direction: vertical ? "↑" : "↱",
  };
}
