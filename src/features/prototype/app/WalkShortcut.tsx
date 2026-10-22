import type { Dispatch } from "react";
import { Icon } from "../Icons";
import type { AppAction, AppState } from "./model";

export function WalkShortcut({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  return (
    <button
      className="sq-walk-shortcut"
      onClick={() => dispatch({ type: "screen", screen: "map" })}
    >
      <Icon name="map" />
      <span>
        {state.journey.phase === "idle" ? "Your walk" : "Back to your walk"}
      </span>
      <Icon name="arrow" />
    </button>
  );
}
