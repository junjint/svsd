import { useEffect, useRef, useState, type Dispatch } from "react";
import { Icon } from "../Icons";
import { logo } from "./assets";
import { questById } from "./data";
import type { AppAction, AppState } from "./model";
import { IconButton } from "./ui";

export function NotificationBanner({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  const start = useRef({ x: 0, y: 0 }),
    swiped = useRef(false),
    [leaving, setLeaving] = useState(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const banner = state.banner;
  if (!banner) return null;
  const quest = questById(banner.questId)!;
  const dismiss = () => {
    setLeaving(true);
    timer.current = setTimeout(() => dispatch({ type: "dismiss-banner" }), 220);
  };
  return (
    <div
      className={`sq-notification ${leaving || banner.age >= 8 ? "leaving" : ""}`}
      role="region"
      aria-label="Sidequest notification"
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
        swiped.current = false;
        (e.target as Element).setPointerCapture(e.pointerId);
      }}
      onPointerUp={(e) => {
        if (
          start.current.y - e.clientY > 22 ||
          Math.abs(e.clientX - start.current.x) > 70
        ) {
          swiped.current = true;
          dismiss();
        }
      }}
    >
      <button
        className="sq-notification-body"
        onClick={() => {
          if (!leaving && !swiped.current) dispatch({ type: "open-banner" });
        }}
      >
        <img src={logo} alt="" />
        <span>
          <span className="sq-notification-app">
            SIDEQUEST <small>now</small>
          </span>
          <strong>
            {banner.kind === "arrival"
              ? "You’ve found your little escape."
              : "A little off your usual way."}
          </strong>
          <span>
            {banner.kind === "arrival"
              ? `${quest.name} · You’re here`
              : `${quest.name} · ${quest.detourMinutes} min detour`}
          </span>
        </span>
      </button>
      <IconButton icon="close" label="Dismiss notification" onClick={dismiss} />
    </div>
  );
}

export function DynamicIsland({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    activity = useRef<HTMLDivElement>(null),
    held = useRef(false),
    start = useRef({ x: 0, y: 0 });
  const active = questById(state.journey.activeQuestId),
    done = !!state.activityDone,
    expanded = state.overlay?.kind === "activity";
  useEffect(() => {
    if (expanded)
      activity.current
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
  }, [expanded]);
  const cancelTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const open = () => {
    if (!active) {
      if (done) dispatch({ type: "screen", screen: "memories" });
      return;
    }
    dispatch({ type: "screen", screen: "map" });
    dispatch({
      type: "overlay",
      overlay: {
        kind: state.journey.phase === "arrived" ? "arrival" : "quest",
        questId: active.id,
      },
    });
  };
  const expand = () => {
    if (active) {
      held.current = true;
      dispatch({ type: "overlay", overlay: { kind: "activity" } });
    }
  };
  return (
    <>
      {expanded && (
        <button
          className="sq-island-backdrop"
          aria-label="Collapse Live Activity"
          onClick={() => dispatch({ type: "close" })}
        />
      )}
      <div
        className={`dynamic-island sq-island ${active || done ? "has-activity" : ""} ${expanded ? "expanded" : ""}`}
      >
        <div className="island-hardware" aria-hidden="true">
          <span className="island-speaker" />
          <span className="island-lens" />
        </div>
        {(active || done) && (
          <button
            className="sq-island-compact"
            tabIndex={expanded ? -1 : 0}
            aria-hidden={expanded}
            aria-label={
              done
                ? "Sidequest complete"
                : "Active Sidequest. Tap to open, hold to expand."
            }
            title="Tap to open · Hold or right-click to expand"
            onPointerDown={(e) => {
              held.current = false;
              start.current = { x: e.clientX, y: e.clientY };
              cancelTimer();
              timer.current = setTimeout(expand, 550);
            }}
            onPointerMove={(e) => {
              if (
                Math.hypot(
                  e.clientX - start.current.x,
                  e.clientY - start.current.y,
                ) > 12
              )
                cancelTimer();
            }}
            onPointerUp={cancelTimer}
            onPointerCancel={cancelTimer}
            onPointerLeave={cancelTimer}
            onContextMenu={(e) => {
              e.preventDefault();
              expand();
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                expand();
              }
            }}
            onClick={() => {
              if (!held.current) open();
              held.current = false;
            }}
          >
            <span className="sq-island-mark">
              {done ? <Icon name="check" /> : <img src={logo} alt="" />}
            </span>
            <span className="sq-island-value">
              {done
                ? "✓"
                : state.journey.phase === "arrived"
                  ? "here"
                  : `${Math.max(1, Math.ceil((1 - state.journey.progress) * active!.detourMinutes))}m`}
            </span>
          </button>
        )}
        {expanded && active && (
          <div
            ref={activity}
            className="sq-island-detail"
            role="dialog"
            aria-label="Active Sidequest Live Activity"
          >
            <div className="sq-between">
              <img src={logo} alt="Sidequest" />
              <IconButton
                icon="minus"
                label="Collapse activity"
                onClick={() => dispatch({ type: "close" })}
              />
            </div>
            <p className="sq-island-eyebrow">
              {state.paused
                ? "A MOMENT TO PAUSE"
                : state.journey.phase === "arrived"
                  ? "YOU’RE HERE"
                  : "A LITTLE DETOUR"}
            </p>
            <h2>{active.name}</h2>
            <div className="sq-activity-track">
              <span style={{ width: `${state.journey.progress * 100}%` }} />
            </div>
            <div className="sq-between">
              <small>
                {Math.round(state.journey.progress * 100)}% of your demo walk
              </small>
              <Icon name="walk" />
            </div>
            <div className="sq-island-actions">
              <button onClick={open}>
                Open Sidequest <Icon name="arrow" />
              </button>
              <button onClick={() => dispatch({ type: "cancel-detour" })}>
                End detour
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
