/** A single simulated walk. None of these places, times, or movements use GPS. */
export const scenes = [
  "journey",
  "nearby",
  "discovery",
  "detour",
  "arrival",
  "return",
] as const;
export type Scene = (typeof scenes)[number];
export const sceneLabels = [
  "Walking",
  "Something nearby",
  "A little possibility",
  "Taking the detour",
  "You’re here",
  "On your way",
];

export const discoveries = [
  {
    id: "fountain",
    name: "The Fountain Steps",
    shortName: "Fountain Steps",
    minutes: 4,
    type: "fountain",
    descriptor: "A quiet courtyard. A moment to yourself.",
  },
] as const;
export type Discovery = (typeof discoveries)[number];

export interface StoryState {
  scene: Scene;
  history: Scene[];
  walking: boolean;
  dismissed: boolean;
  completed: boolean;
  settled: boolean;
}
export const initialStory: StoryState = {
  scene: "journey",
  history: [],
  walking: false,
  dismissed: false,
  completed: false,
  settled: false,
};
export type StoryAction =
  | { type: "start" }
  | { type: "next" }
  | { type: "back" }
  | { type: "dismiss" }
  | { type: "replay" }
  | { type: "settle" }
  | { type: "advance"; from: "journey" | "detour" };

export function storyReducer(
  state: StoryState,
  action: StoryAction,
): StoryState {
  const move = (scene: Scene, extra: Partial<StoryState> = {}): StoryState => ({
    ...state,
    ...extra,
    scene,
    history: [...state.history, state.scene],
    settled: false,
  });
  switch (action.type) {
    case "start":
      return state.scene === "journey"
        ? { ...state, walking: true, dismissed: false }
        : state;
    case "advance":
      // A timer from a previous scene cannot advance a replayed or rewound demo.
      return state.scene === action.from &&
        !(action.from === "journey" && state.dismissed)
        ? storyReducer(state, { type: "next" })
        : state;
    case "next":
      if (
        state.scene === "return" ||
        (state.scene === "journey" && !state.walking)
      )
        return state;
      return move(scenes[scenes.indexOf(state.scene) + 1], {
        dismissed: false,
        completed: state.scene === "arrival",
      });
    case "dismiss":
      return state.scene === "nearby" || state.scene === "discovery"
        ? move("journey", { dismissed: true, completed: false, walking: true })
        : state;
    case "back": {
      const scene = state.history[state.history.length - 1];
      if (!scene) return state;
      return {
        ...state,
        scene,
        history: state.history.slice(0, -1),
        walking: scene !== "journey",
        dismissed: false,
        completed: false,
        settled: false,
      };
    }
    case "settle":
      return state.scene === "return" ? { ...state, settled: true } : state;
    case "replay":
      return { ...initialStory, history: [] };
  }
}
