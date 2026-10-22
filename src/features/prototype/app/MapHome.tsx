import { useCallback, useRef, type Dispatch } from "react";
import { Icon } from "../Icons";
import { logo } from "./assets";
import { destinationById, questById } from "./data";
import { InteractiveMap, type MapHandle } from "./InteractiveMap.web";
import { currentPath, type AppAction, type AppState } from "./model";
import { routeLength } from "./geo";
import { IconButton, Toggle } from "./ui";

export function MapHome({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  const map = useRef<MapHandle>(null),
    j = state.journey,
    quest = questById(j.activeQuestId),
    suggestion = questById(j.suggestionId),
    destination = destinationById(state.selectedDestination);
  const onQuest = useCallback(
    (id: string) => dispatch({ type: "open-quest", id }),
    [dispatch],
  );
  const eta = Math.max(
    1,
    Math.ceil(
      (routeLength(currentPath(state)) *
        (j.phase === "idle" ? 1 : 1 - j.progress)) /
        75,
    ),
  );
  return (
    <section className="sq-map-home" aria-label="Maps">
      <InteractiveMap ref={map} state={state} onQuest={onQuest} />
      <div className="sq-map-heading">
        <button
          className="sq-search-pill"
          onClick={() =>
            dispatch({ type: "overlay", overlay: { kind: "search" } })
          }
        >
          <Icon name="search" />
          <span>
            {j.phase === "idle" ? "Where are you headed?" : destination.name}
          </span>
          <Icon name="chevron" />
        </button>
        <div className="sq-map-status">
          <img src={logo} alt="Sidequest" />
          <span>
            {!state.prefs.enabled
              ? "Taking a pause"
              : state.prefs.quiet
                ? "Quiet mode"
                : state.prefs.location === "off"
                  ? "Demo location off"
                  : "Room for a little wonder"}
          </span>
          <Toggle
            label="Sidequests on map"
            checked={state.prefs.enabled}
            onChange={(enabled) =>
              dispatch({ type: "prefs", patch: { enabled } })
            }
          />
        </div>
      </div>
      <div className="sq-map-tools">
        <IconButton
          icon="location"
          label="Recenter map"
          onClick={() => map.current?.recenter()}
        />
        <div>
          <IconButton
            icon="plus"
            label="Zoom in"
            onClick={() => map.current?.zoomBy(1)}
          />
          <IconButton
            icon="minus"
            label="Zoom out"
            onClick={() => map.current?.zoomBy(-1)}
          />
        </div>
        <IconButton
          icon="map"
          label="Show route overview"
          onClick={() => {
            map.current?.overview();
            dispatch({ type: "overlay", overlay: { kind: "route" } });
          }}
        />
      </div>
      <div className="sq-walk-card">
        <div className="sq-handle" />
        <div className="sq-between">
          <span className="sq-kicker">
            {state.mode === "guided" && j.phase !== "idle"
              ? "GUIDED WALK"
              : j.phase === "idle"
                ? "A WALK WITH POSSIBILITIES"
                : quest
                  ? "A LITTLE DETOUR"
                  : "ON YOUR WAY"}
          </span>
          {j.phase !== "idle" && (
            <IconButton
              icon={state.paused ? "play" : "pause"}
              label={state.paused ? "Resume walking" : "Pause walking"}
              onClick={() => dispatch({ type: "pause" })}
            />
          )}
        </div>
        <h2>{quest ? quest.name : destination.name}</h2>
        <div className="sq-route-caption">
          <Icon name="walk" />
          <span>
            {j.phase === "arrived"
              ? "You’re here. Take a breath."
              : state.paused
                ? "Your walk is paused"
                : `${quest ? Math.max(1, Math.ceil(quest.detourMinutes * (1 - j.progress))) : eta} min · ${quest ? "then back to your walk" : destination.detail}`}
          </span>
        </div>
        {j.phase === "idle" ? (
          <>
            <button
              className="sq-primary sq-map-primary"
              onClick={() => dispatch({ type: "start" })}
            >
              Start walking <Icon name="arrow" />
            </button>
            <button
              className="sq-text-button"
              onClick={() => dispatch({ type: "guided" })}
            >
              Try the guided walk <span>~ 1 minute</span>
            </button>
          </>
        ) : j.phase === "arrived" ? (
          <button
            className="sq-primary"
            onClick={() =>
              dispatch({
                type: "overlay",
                overlay: { kind: "arrival", questId: quest!.id },
              })
            }
          >
            Be here a moment <Icon name="arrow" />
          </button>
        ) : suggestion ? (
          <button
            className="sq-suggestion-link"
            onClick={() => dispatch({ type: "open-quest", id: suggestion.id })}
          >
            <span className="sq-mini-spark">
              <Icon name="spark" />
            </span>
            <span>
              <strong>A small possibility nearby</strong>
              <small>
                {suggestion.name} · +{suggestion.detourMinutes} min
              </small>
            </span>
            <Icon name="arrow" />
          </button>
        ) : quest ? (
          <>
            <div
              className="sq-walk-progress"
              role="progressbar"
              aria-label="Detour progress"
              aria-valuenow={Math.round(j.progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${j.progress * 100}%` }} />
            </div>
            <div className="sq-card-actions">
              <button onClick={() => dispatch({ type: "cancel-detour" })}>
                Cancel detour
              </button>
              <button
                onClick={() =>
                  dispatch({ type: "overlay", overlay: { kind: "route" } })
                }
              >
                Route details <Icon name="arrow" />
              </button>
            </div>
          </>
        ) : (
          <div className="sq-card-actions">
            <button onClick={() => dispatch({ type: "end" })}>End walk</button>
            <button
              className="sq-find"
              onClick={() => dispatch({ type: "suggest" })}
            >
              <Icon name="spark" />
              Find a little detour
            </button>
          </div>
        )}
        <p className="sq-map-disclaimer">Simulated walk · demo route & time</p>
      </div>
    </section>
  );
}
