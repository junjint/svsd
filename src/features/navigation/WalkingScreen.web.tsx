import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ANN_ARBOR_DEMO_PLACES } from "@/data/annArborPlaces";
import { Receipt } from "@/features/draw/printer/Receipt";
import { HoldToComplete } from "@/features/quest/HoldToComplete";
import { buildDrawnQuest, eligibleActivities } from "@/services/draw/engine";
import { useSidequestStore, type DrawSession } from "@/stores/sidequestStore";
import { GlassIconButton, PillButton, Text, color, fonts } from "@/theme";
import { DeviceSystemOverlay, useScreen } from "@/ui/DeviceFrame";
import { Sheet } from "@/ui";
import type { Coordinates } from "@/types";
import { initialWalk, interpolate, routeFor, walkReducer } from "./walkFlow";
import "./walking.css";

const START: Coordinates = { latitude: 42.2808, longitude: -83.743 };
const UNION: Coordinates = { latitude: 42.2751, longitude: -83.7415 };
const clean = (name: string) => name.replace(/^\[[^\]]*\]\s*/, "");
function example() {
  const place = ANN_ARBOR_DEMO_PLACES.find(
    (p) => p.id === "aa_graffiti_alley",
  )!;
  const settings = {
    questType: "random" as const,
    partySize: 1,
    radiusMiles: 2,
    focus: "any" as const,
  };
  const options = eligibleActivities({ place, ...settings });
  const activity =
    options.find((a) =>
      a.placeTags.some(
        (tag) => place.tags?.includes(tag) || tag === place.category,
      ),
    ) ?? options[0];
  const quest = buildDrawnQuest({
    place,
    activity,
    location: START,
    settings,
    rarity: "common",
    revealStyle: { place: "scratch", activity: "scratch" },
    rerollsUsed: { place: 0, activity: 0 },
    cityLabel: "Ann Arbor",
  });
  const draw: DrawSession = {
    id: quest.id,
    phase: "result",
    settings,
    rarity: "common",
    revealStyle: quest.revealStyle,
    place,
    activity,
    activityOptions: [activity],
    rerolls: { place: 0, activity: 0 },
    placeLocked: false,
    seenActivityIds: [],
    seenPlaceIds: [],
  };
  return { quest, draw };
}

export default function WalkingScreen() {
  const { quest: requestedId } = useLocalSearchParams<{ quest?: string }>();
  const quests = useSidequestStore((s) => s.quests);
  const folders = useSidequestStore((s) => s.folders);
  const [{ quest: sample, draw }] = useState(example);
  const [activeId, setActiveId] = useState<string | null>(requestedId ?? null);
  const target = quests.find((q) => q.id === activeId) ?? sample;
  const missing = !!requestedId && !quests.some((q) => q.id === requestedId);
  const [state, dispatch] = useReducer(walkReducer, !!requestedId, initialWalk);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false),
    holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    held = useRef(false);
  const activity = useRef<HTMLDivElement>(null),
    swipeStart = useRef(0),
    swiped = useRef(false);
  const { width, height } = useScreen();
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(
    null,
  );
  const direct = !!requestedId;
  const start = useMemo(
    () =>
      direct
        ? {
            latitude: target.coordinates.latitude + 0.003,
            longitude: target.coordinates.longitude + 0.002,
          }
        : START,
    [direct, target.coordinates.latitude, target.coordinates.longitude],
  );
  const destination = direct ? target.coordinates : UNION;
  const detouring = ["detouring", "arrived"].includes(state.phase);
  const route = routeFor(
    state.phase === "done" && activeId ? target.coordinates : start,
    detouring ? target.coordinates : destination,
  );
  const bounds = [start, target.coordinates, destination];
  const north = Math.max(...bounds.map((p) => p.latitude)),
    south = Math.min(...bounds.map((p) => p.latitude));
  const west = Math.min(...bounds.map((p) => p.longitude)),
    east = Math.max(...bounds.map((p) => p.longitude));
  const scale = Math.min(
    (width - 100) / Math.max((east - west) * 0.74, 0.002),
    (height * 0.43) / Math.max(north - south, 0.003),
  );
  const project = (p: Coordinates) => ({
    x: width / 2 + (p.longitude - (east + west) / 2) * 0.74 * scale,
    y: height * 0.43 - (p.latitude - (north + south) / 2) * scale,
  });
  const path = (points: Coordinates[]) =>
    points
      .map((p, i) => {
        const v = project(p);
        return `${i ? "L" : "M"}${v.x} ${v.y}`;
      })
      .join(" ");
  const position = project(interpolate(route, state.progress));
  const pin = project(detouring ? target.coordinates : destination);
  const nearby = project(target.coordinates);
  const folder = folders.find((f) => f.sidequestId === activeId);
  const back = () => router.replace("/draw");
  const openFolder = () =>
    folder
      ? router.replace({ pathname: "/folder/[id]", params: { id: folder.id } })
      : router.replace("/folders");

  useEffect(() => {
    if (missing) return;
    const timer = setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => clearInterval(timer);
  }, [missing]);
  useEffect(
    () => () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!state.expanded) return;
    const previous = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() =>
      activity.current
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true }),
    );
    return () => {
      cancelAnimationFrame(frame);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [state.expanded]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch({ type: "collapse" });
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);

  const accept = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const store = useSidequestStore.getState();
      const accepted = await store.acceptNavigationQuest(sample);
      if (
        !useSidequestStore
          .getState()
          .folders.some((f) => f.sidequestId === accepted.id)
      ) {
        await store.createFolder({
          title: accepted.activityText,
          sidequestId: accepted.id,
        });
      }
      setActiveId(accepted.id);
      dispatch({ type: "accept" });
    } catch {
      setError("Couldn’t save this detour. Please try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const finish = async () => {
    if (lock.current || !activeId) return;
    lock.current = true;
    setError("");
    try {
      if (target.status !== "completed")
        await useSidequestStore.getState().completeQuest(activeId);
      dispatch({ type: "finish" });
    } catch {
      setError("Couldn’t keep this visit. You can finish it from the folder.");
    } finally {
      lock.current = false;
    }
  };
  const stopHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };
  const stage =
    state.phase === "done"
      ? direct
        ? "You’re here"
        : "Your walk, continued"
      : detouring
        ? clean(target.placeName)
        : direct
          ? clean(target.placeName)
          : "Michigan Union";
  const variables = {
    "--rw-paper": color.paper,
    "--rw-ink": color.ink,
    "--rw-muted": color.ink2,
    "--rw-line": color.line,
    "--rw-font": fonts.sans,
    "--rw-semi": fonts.sansSemi,
  } as CSSProperties;
  if (missing)
    return (
      <div className="rw-walk" style={variables}>
        <div className="rw-missing">
          <Text variant="title">This sidequest isn’t here.</Text>
          <PillButton label="Back to Sidequest" onPress={back} />
        </div>
      </div>
    );
  return (
    <div className="rw-walk" style={variables}>
      <svg
        className="rw-map"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Simplified walking demo map. Drag to pan; use the zoom controls."
        onPointerDown={(e) => {
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            cx: camera.x,
            cy: camera.y,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current)
            setCamera((c) => ({
              ...c,
              x: drag.current!.cx + e.clientX - drag.current!.x,
              y: drag.current!.cy + e.clientY - drag.current!.y,
            }));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <rect width={width} height={height} fill="#F0EEE8" />
        <g
          transform={`translate(${camera.x} ${camera.y}) translate(${width / 2} ${height / 2}) scale(${camera.zoom}) translate(${-width / 2} ${-height / 2})`}
        >
          {Array.from({ length: 9 }, (_, r) =>
            Array.from({ length: 6 }, (_, c) => (
              <rect
                key={`${r}-${c}`}
                x={c * 86 - 70}
                y={r * 94 - 60}
                width="74"
                height="82"
                rx="5"
                fill={c === 4 ? "#DDE6D0" : "#E7E4DD"}
              />
            )),
          )}
          <text x="25" y={height * 0.39} className="rw-road">
            LIBERTY ST
          </text>
          <text x={width * 0.69} y={height * 0.57} className="rw-road">
            STATE ST
          </text>
          <path
            d={path(routeFor(start, destination))}
            fill="none"
            stroke="#9BA6AD"
            strokeWidth="3"
            strokeDasharray="3 7"
            opacity={detouring ? 0.4 : 0}
          />
          <path
            d={path(route)}
            fill="none"
            stroke="white"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path(route)}
            fill="none"
            stroke="#2682EC"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {["nearby", "preview"].includes(state.phase) && (
            <g transform={`translate(${nearby.x} ${nearby.y})`}>
              <circle r="17" fill={color.paper} stroke="#B3B59E" />
              <text textAnchor="middle" y="6" fill="#6A745C" fontSize="22">
                ✦
              </text>
            </g>
          )}
          <circle
            cx={pin.x}
            cy={pin.y}
            r="8"
            fill={detouring ? "#6E805B" : "#E16E61"}
            stroke="white"
            strokeWidth="3"
          />
          <g
            className="rw-location"
            style={{ transform: `translate(${position.x}px,${position.y}px)` }}
          >
            <circle r="17" fill="#2682EC20" />
            <circle r="8" fill="#2682EC" stroke="white" strokeWidth="3" />
          </g>
        </g>
      </svg>
      <header className="rw-top">
        <GlassIconButton label="Back to Sidequest" onPress={back}>
          <Text>‹</Text>
        </GlassIconButton>
        <span>
          Maps <small>WALKING DEMO</small>
        </span>
        <GlassIconButton
          label="Replay walking demo"
          onPress={() => {
            if (!direct) setActiveId(null);
            dispatch({ type: "replay", direct });
          }}
        >
          <Text>↻</Text>
        </GlassIconButton>
      </header>
      <div className="rw-direction">
        <b>↑</b>
        <span>
          {state.phase === "done" && direct
            ? "Destination reached"
            : "Continue walking"}
          <small>
            {detouring
              ? "A little detour"
              : direct
                ? clean(target.placeName)
                : "Toward Michigan Union"}
          </small>
        </span>
      </div>
      <div className="rw-tools">
        <button
          aria-label="Recenter map"
          onClick={() => setCamera({ x: 0, y: 0, zoom: 1 })}
        >
          ⌖
        </button>
        <button
          aria-label="Zoom in"
          onClick={() =>
            setCamera((c) => ({ ...c, zoom: Math.min(2, c.zoom + 0.2) }))
          }
        >
          +
        </button>
        <button
          aria-label="Zoom out"
          onClick={() =>
            setCamera((c) => ({ ...c, zoom: Math.max(0.7, c.zoom - 0.2) }))
          }
        >
          −
        </button>
      </div>
      <div className="rw-route-card">
        <div className="rw-grab" />
        <div className="rw-route-title">
          <span>{stage}</span>
          <button
            aria-label={state.paused ? "Resume walking" : "Pause walking"}
            onClick={() => dispatch({ type: "pause" })}
          >
            {state.paused ? "▷" : "Ⅱ"}
          </button>
        </div>
        <p>
          {state.phase === "done"
            ? direct
              ? target.status === "completed"
                ? "Your visit is saved in your folder."
                : "Open your folder to finish when you’re ready."
              : "Back to your original route."
            : `${detouring ? Math.max(1, Math.ceil((1 - state.progress) * 4)) : 8} min walk · demo estimate`}
        </p>
        {state.phase === "nearby" ? (
          <PillButton
            label="Open nearby Sidequest"
            onPress={() => dispatch({ type: "open" })}
          />
        ) : state.phase === "detouring" ? (
          <PillButton
            label="Preview arrival"
            onPress={() => dispatch({ type: "arrive" })}
          />
        ) : state.phase === "arrived" ? (
          <PillButton
            label="Open your Sidequest"
            onPress={() => dispatch({ type: "dismiss" })}
          />
        ) : state.phase === "done" ? (
          <PillButton
            label={folder ? "Open your folder" : "Back to Sidequest"}
            onPress={folder ? openFolder : back}
          />
        ) : (
          <small>A Sidequest might find you along the way.</small>
        )}
        <footer>Simulated iOS · approximate demo route</footer>
      </div>
      <Sheet
        visible={state.phase === "preview"}
        onClose={() => dispatch({ type: "skip" })}
        title="A little detour?"
      >
        <div className="rw-receipt">
          <Receipt draw={draw} from={START} cityLabel="Ann Arbor" width={235} />
        </div>
        <PillButton
          label={busy ? "Starting…" : "Take this detour"}
          disabled={busy}
          onPress={() => void accept()}
        />
        <button
          className="rw-text-button"
          onClick={() => dispatch({ type: "skip" })}
        >
          Keep walking
        </button>
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      </Sheet>
      <Sheet
        visible={state.phase === "arrived" && !state.banner}
        onClose={() => dispatch({ type: "skip" })}
        title="You’re here"
        subtitle={clean(target.placeName)}
      >
        <Text variant="prose">{target.activityText}</Text>
        {target.status === "completed" ? (
          <PillButton label="Open your folder" onPress={openFolder} />
        ) : (
          <HoldToComplete onComplete={() => void finish()} />
        )}
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      </Sheet>
      <DeviceSystemOverlay>
        <div className="rw-system" style={variables}>
          {state.expanded && (
            <button
              className="rw-system-backdrop"
              aria-label="Collapse Live Activity"
              onClick={() => dispatch({ type: "collapse" })}
            />
          )}
          <div className={`rw-island ${state.expanded ? "expanded" : ""}`}>
            <button
              className="rw-island-compact"
              aria-label="Expand Sidequest Live Activity"
              disabled={!detouring}
              onPointerDown={() => {
                held.current = false;
                holdTimer.current = setTimeout(() => {
                  held.current = true;
                  dispatch({ type: "expand" });
                }, 550);
              }}
              onPointerUp={stopHold}
              onPointerCancel={stopHold}
              onPointerLeave={stopHold}
              onClick={() => {
                if (!held.current) dispatch({ type: "expand" });
              }}
            >
              <span>{detouring ? "✦" : "↗"}</span>
              <span>
                {state.phase === "arrived"
                  ? "here"
                  : detouring
                    ? `${Math.max(1, Math.ceil((1 - state.progress) * 4))}m`
                    : "walk"}
              </span>
            </button>
            {state.expanded && (
              <div
                ref={activity}
                className="rw-island-body"
                role="dialog"
                aria-modal="true"
                aria-label="Sidequest Live Activity"
                onKeyDown={(e) => {
                  if (e.key !== "Tab") return;
                  const buttons =
                    activity.current?.querySelectorAll<HTMLButtonElement>(
                      "button",
                    );
                  if (!buttons?.length) return;
                  const first = buttons[0],
                    last = buttons[buttons.length - 1];
                  if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                  } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                  }
                }}
              >
                <div>
                  <b>SIDEQUEST</b>
                  <button
                    aria-label="Collapse activity"
                    onClick={() => dispatch({ type: "collapse" })}
                  >
                    −
                  </button>
                </div>
                <h2>{clean(target.placeName)}</h2>
                <p>
                  {state.phase === "arrived"
                    ? "You’re here."
                    : "A little off your usual way."}
                </p>
                <div className="rw-activity-track">
                  <i style={{ width: `${state.progress * 100}%` }} />
                </div>
                <button onClick={() => dispatch({ type: "collapse" })}>
                  Continue walking ↗
                </button>
                <small>Simulated Live Activity · tap or hold to expand</small>
              </div>
            )}
          </div>
          {state.banner && (
            <div
              className="rw-banner"
              role="region"
              aria-label="Sidequest notification"
              onPointerDown={(e) => {
                swipeStart.current = e.clientY;
                swiped.current = false;
                (e.target as Element).setPointerCapture(e.pointerId);
              }}
              onPointerUp={(e) => {
                if (swipeStart.current - e.clientY > 24) {
                  swiped.current = true;
                  dispatch({ type: "dismiss" });
                }
              }}
            >
              <button
                onClick={() => {
                  if (!swiped.current)
                    dispatch({
                      type: state.phase === "arrived" ? "dismiss" : "open",
                    });
                }}
              >
                <b>✦</b>
                <span>
                  <small>
                    SIDEQUEST <em>now</em>
                  </small>
                  <strong>
                    {state.phase === "arrived"
                      ? "You’ve found your little escape."
                      : "Something good, a little off-route."}
                  </strong>
                  <span>{clean(target.placeName)}</span>
                </span>
              </button>
              <button
                aria-label="Dismiss notification"
                onClick={() => dispatch({ type: "dismiss" })}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </DeviceSystemOverlay>
    </div>
  );
}
