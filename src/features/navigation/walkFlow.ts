import type { Coordinates } from "@/types";

export type WalkPhase =
  "walking" | "nearby" | "preview" | "detouring" | "arrived" | "done";
export interface WalkState {
  phase: WalkPhase;
  progress: number;
  ticks: number;
  paused: boolean;
  expanded: boolean;
  banner: boolean;
  noticeOpen: boolean;
  arrivalOpen: boolean;
}
export const initialWalk = (direct = false): WalkState => ({
  phase: direct ? "detouring" : "walking",
  progress: 0,
  ticks: 0,
  paused: false,
  expanded: direct,
  banner: false,
  noticeOpen: false,
  arrivalOpen: false,
});
export type WalkAction =
  | {
      type:
        | "tick"
        | "open"
        | "accept"
        | "arrive"
        | "finish"
        | "skip"
        | "expand"
        | "collapse"
        | "dismiss"
        | "pause";
    }
  | {
      type:
        | "notify"
        | "expandNotice"
        | "collapseNotice"
        | "openArrival"
        | "closeArrival";
    }
  | { type: "replay"; direct?: boolean };
export function walkReducer(state: WalkState, action: WalkAction): WalkState {
  switch (action.type) {
    case "openArrival":
      return state.phase === "arrived"
        ? {
            ...state,
            arrivalOpen: true,
            banner: false,
            noticeOpen: false,
            expanded: false,
          }
        : state;
    case "closeArrival":
      return { ...state, arrivalOpen: false };
    case "notify":
    case "expandNotice":
      return ["walking", "nearby", "arrived"].includes(state.phase)
        ? {
            ...state,
            phase: state.phase === "walking" ? "nearby" : state.phase,
            banner: true,
            noticeOpen: action.type === "expandNotice",
            expanded: false,
          }
        : state;
    case "collapseNotice":
      return { ...state, noticeOpen: false };
    case "replay":
      return initialWalk(action.direct);
    case "pause":
      return { ...state, paused: !state.paused };
    case "expand":
      return state.phase === "detouring" || state.phase === "arrived"
        ? { ...state, expanded: true }
        : state;
    case "collapse":
      return { ...state, expanded: false };
    case "dismiss":
      return { ...state, banner: false, noticeOpen: false };
    case "open":
      return state.phase === "nearby"
        ? { ...state, phase: "preview", banner: false, noticeOpen: false }
        : state;
    case "skip":
      return {
        ...state,
        arrivalOpen: false,
        noticeOpen: false,
        phase: "done",
        progress:
          state.phase === "arrived" || state.phase === "detouring"
            ? 0
            : state.progress,
        banner: false,
        expanded: false,
      };
    case "accept":
      return state.phase === "preview"
        ? {
            ...state,
            phase: "detouring",
            progress: 0,
            expanded: true,
            banner: false,
          }
        : state;
    case "arrive":
      return state.phase === "detouring"
        ? {
            ...state,
            phase: "arrived",
            arrivalOpen: false,
            noticeOpen: false,
            progress: 1,
            expanded: false,
            banner: true,
          }
        : state;
    case "finish":
      return state.phase === "arrived"
        ? {
            ...state,
            phase: "done",
            arrivalOpen: false,
            progress: 0,
            expanded: false,
            banner: false,
          }
        : state;
    case "tick": {
      if (
        state.paused ||
        state.expanded ||
        ["preview", "arrived"].includes(state.phase)
      )
        return state;
      if (state.phase === "done")
        return state.progress >= 1
          ? state
          : { ...state, progress: Math.min(1, state.progress + 0.02) };
      const ticks = state.ticks + 1;
      if (state.phase === "walking")
        return ticks >= 4
          ? { ...state, phase: "nearby", ticks, banner: true }
          : { ...state, ticks, progress: state.progress + 0.015 };
      if (state.phase === "detouring")
        return state.progress + 0.04 >= 1
          ? walkReducer(state, { type: "arrive" })
          : { ...state, ticks, progress: state.progress + 0.04 };
      return state;
    }
  }
}

export function routeFor(start: Coordinates, end: Coordinates): Coordinates[] {
  return [start, { latitude: start.latitude, longitude: end.longitude }, end];
}
export function interpolate(
  route: Coordinates[],
  progress: number,
): Coordinates {
  const lengths = route
    .slice(1)
    .map((p, i) =>
      Math.hypot(
        (p.longitude - route[i].longitude) * 0.74,
        p.latitude - route[i].latitude,
      ),
    );
  let remaining =
    lengths.reduce((a, b) => a + b, 0) * Math.max(0, Math.min(1, progress));
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] && lengths[i] > 0) {
      const t = remaining / lengths[i];
      return {
        latitude:
          route[i].latitude + (route[i + 1].latitude - route[i].latitude) * t,
        longitude:
          route[i].longitude +
          (route[i + 1].longitude - route[i].longitude) * t,
      };
    }
    remaining -= lengths[i];
  }
  return route[route.length - 1];
}
