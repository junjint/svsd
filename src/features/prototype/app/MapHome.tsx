import { useCallback, useRef, type Dispatch } from "react";
import { Icon } from "../Icons";
import { destinationById, questById } from "./data";
import { InteractiveMap, type MapHandle } from "./InteractiveMap.web";
import { currentPath, type AppAction, type AppState } from "./model";
import { routeLength } from "./geo";
import { IconButton, Toggle } from "./ui";
import { walkingCue, walkthroughHints, walkthroughStep } from "./demo";

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
  const step = walkthroughStep(state),
    cue = walkingCue(state);
  return (
    <section className="sq-map-home" aria-label="Maps">
      <InteractiveMap ref={map} state={state} onQuest={onQuest} />
      <div className="sq-map-heading">
        <div className="sq-maps-app-label">
          <span>
            <Icon name="map" />
            Maps
          </span>
          <small>WALKING DEMO</small>
        </div>
        <button
          className="sq-search-pill"
          onClick={() =>
            dispatch({ type: "overlay", overlay: { kind: "search" } })
          }
        >
          <span className="sq-maneuver-arrow" aria-hidden="true">
            {j.phase === "idle" ? <Icon name="search" /> : cue.direction}
          </span>
          <span>
            <strong>
              {j.phase === "idle" ? "Where are you headed?" : cue.instruction}
            </strong>
            {j.phase !== "idle" && (
              <small>
                {cue.street} · {cue.distance} m
              </small>
            )}
          </span>
          <Icon name="chevron" />
        </button>
        <div className="sq-map-status">
          <Icon name="spark" />
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
        <span className="sq-north-indicator" aria-label="North is up">
          N<i>↑</i>
        </span>
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
        {state.mode === "guided" && (
          <div className="sq-demo-rail">
            <div>
              <span>
                INTERACTIVE DEMO <b>{String(step).padStart(2, "0")} / 05</b>
              </span>
              <div className="sq-demo-controls">
                <button
                  aria-label="Replay animated demo"
                  onClick={() => dispatch({ type: "restart-demo" })}
                >
                  <Icon name="replay" />
                  Replay
                </button>
                <button
                  aria-label="Explore freely"
                  onClick={() => dispatch({ type: "explore" })}
                >
                  Explore <Icon name="arrow" />
                </button>
              </div>
            </div>
            <div
              className="sq-demo-dots"
              aria-label={`Walkthrough step ${step} of 5`}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <i key={n} className={n <= step ? "reached" : ""} />
              ))}
            </div>
            <p>{walkthroughHints[step - 1]}</p>
          </div>
        )}
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
                  state.mode === "guided"
                    ? dispatch({ type: "arrive" })
                    : dispatch({ type: "overlay", overlay: { kind: "route" } })
                }
              >
                {state.mode === "guided" ? "Preview arrival" : "Route details"}{" "}
                <Icon name="arrow" />
              </button>
            </div>
          </>
        ) : (
          <div className="sq-card-actions">
            {state.mode !== "guided" && (
              <button onClick={() => dispatch({ type: "end" })}>
                End walk
              </button>
            )}
            <button
              className="sq-find"
              onClick={() =>
                dispatch({
                  type:
                    state.mode === "guided" && j.phase === "navigating"
                      ? "demo-notification"
                      : "suggest",
                })
              }
            >
              <Icon name="spark" />
              {state.mode === "guided" && j.phase === "navigating"
                ? "Show notification"
                : "Find a little detour"}
            </button>
          </div>
        )}
        <p className="sq-map-disclaimer">Simulated walk · demo route & time</p>
      </div>
    </section>
  );
}
