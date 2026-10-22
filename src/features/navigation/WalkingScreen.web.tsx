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
import { conceptPhoto } from "@/features/quest/conceptPhotoAssets";
import { buildDrawnQuest, eligibleActivities } from "@/services/draw/engine";
import { useSidequestStore, type DrawSession } from "@/stores/sidequestStore";
import { StyleSheet, View } from "react-native";
import { Chevron } from "@/features/folders/icons";
import { Glass, GlassIconButton, PillButton, Text, TornPaper, color, fonts, space } from "@/theme";
import { DeviceSystemOverlay, useScreen } from "@/ui/DeviceFrame";
import { Sheet } from "@/ui";
import type { Coordinates } from "@/types";
import { initialWalk, interpolate, routeFor, walkReducer } from "./walkFlow";
import {
  AheadIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RecentreIcon,
  ReplayIcon,
} from "./WalkIcons";
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
  const photo = conceptPhoto(target);
  const missing = !!requestedId && !quests.some((q) => q.id === requestedId);
  const [state, dispatch] = useReducer(walkReducer, !!requestedId, initialWalk);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
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
    if (missing || detailsOpen) return;
    const timer = setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => clearInterval(timer);
  }, [missing, detailsOpen]);
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
      if (e.key === "Escape") {
        dispatch({ type: "collapse" });
        dispatch({ type: "collapseNotice" });
        setDetailsOpen(false);
      }
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
  const viewQuest = () => {
    dispatch({ type: "collapse" });
    if (state.phase === "arrived") dispatch({ type: "openArrival" });
    else setDetailsOpen(true);
  };
  const continueWalk = () => {
    if (state.paused) dispatch({ type: "pause" });
    dispatch({ type: "collapse" });
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
    "--rw-serif": fonts.serif,
    "--rw-serif-italic": fonts.serifItalic,
  } as CSSProperties;
  if (missing)
    return (
      <div className="rw-walk" style={variables}>
        <div className="rw-missing">
          <Text variant="title">This sidequest isn’t here.</Text>
          <PillButton tone="ink" label="Back to Sidequest" onPress={back} />
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
        <rect width={width} height={height} fill={MAP.street} />
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
                fill={c === 4 ? MAP.park : MAP.block}
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
            stroke={color.ink3}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="1 7"
            opacity={detouring ? 0.4 : 0}
          />
          <path
            d={path(route)}
            fill="none"
            stroke={color.paper}
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path(route)}
            fill="none"
            stroke={color.ink}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {["nearby", "preview"].includes(state.phase) && (
            <g transform={`translate(${nearby.x} ${nearby.y})`}>
              <circle r="15" fill={color.paper} stroke={color.ink} strokeWidth="1.2" />
              <circle r="4.5" fill={color.ink} />
            </g>
          )}
          <circle
            cx={pin.x}
            cy={pin.y}
            r="7"
            fill={color.ink}
            stroke={color.paper}
            strokeWidth="3"
          />
          <g
            className="rw-location"
            style={{ transform: `translate(${position.x}px,${position.y}px)` }}
          >
            <circle r="18" fill={color.ink} opacity="0.07" />
            <circle r="7.5" fill={color.white} stroke={color.ink} strokeWidth="3" />
          </g>
        </g>
      </svg>
      <header className="rw-top">
        <GlassIconButton label="Back to Sidequest" onPress={back}>
          <Chevron size={14} />
        </GlassIconButton>
        <span className="rw-heading">
          <small>{(target.cityLabel ?? "Ann Arbor").toUpperCase()}</small>
          On foot
        </span>
        <GlassIconButton
          label="Replay walk"
          onPress={() => {
            setDetailsOpen(false);
            if (!direct) setActiveId(null);
            dispatch({ type: "replay", direct });
          }}
        >
          <ReplayIcon />
        </GlassIconButton>
      </header>
      <View style={walkStyles.direction} pointerEvents="none">
        <Glass radius={24} style={walkStyles.directionGlass}>
          <View style={walkStyles.ahead}>
            <AheadIcon />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="headline">
              {state.phase === "arrived" || (state.phase === "done" && direct) ? "You’re there" : "Keep going"}
            </Text>
            <Text variant="caption" style={{ color: color.ink2 }} numberOfLines={1}>
              {state.phase === "detouring"
                ? `Toward ${clean(target.placeName)}`
                : detouring || direct
                  ? clean(target.placeName)
                  : "Toward Michigan Union"}
            </Text>
          </View>
        </Glass>
      </View>
      <View style={walkStyles.tools}>
        <GlassIconButton label="Recentre map" onPress={() => setCamera({ x: 0, y: 0, zoom: 1 })}>
          <RecentreIcon />
        </GlassIconButton>
        <GlassIconButton
          label="Zoom in"
          onPress={() => setCamera((c) => ({ ...c, zoom: Math.min(2, c.zoom + 0.2) }))}
        >
          <PlusIcon />
        </GlassIconButton>
        <GlassIconButton
          label="Zoom out"
          onPress={() => setCamera((c) => ({ ...c, zoom: Math.max(0.7, c.zoom - 0.2) }))}
        >
          <MinusIcon />
        </GlassIconButton>
      </View>
      <View style={walkStyles.cardWrap}>
        <TornPaper seed={`walk-${target.id}`} contentStyle={walkStyles.card}>
          <View style={walkStyles.titleRow}>
            <Text style={walkStyles.place} numberOfLines={2}>
              {stage}
            </Text>
            {state.phase !== "done" && (
              <GlassIconButton
                size={36}
                label={state.paused ? "Resume walking" : "Pause walking"}
                onPress={() => dispatch({ type: "pause" })}
              >
                {state.paused ? <PlayIcon /> : <PauseIcon />}
              </GlassIconButton>
            )}
          </View>
          <Text variant="callout" style={{ color: color.ink2 }}>
            {state.phase === "done"
              ? direct
                ? target.status === "completed"
                  ? "It’s in your Library."
                  : "Finish it from its folder when you’re ready."
                : "Back on your way."
              : state.phase === "arrived"
                ? "Take your time."
                : `${detouring ? Math.max(1, Math.ceil((1 - state.progress) * 4)) : 8} min walk${state.paused ? " · paused" : ""}`}
          </Text>
          <View style={{ marginTop: space.lg }}>
            {state.phase === "nearby" ? (
              <PillButton
                tone="ink"
                label="See what’s nearby"
                onPress={() => dispatch({ type: "open" })}
              />
            ) : state.phase === "detouring" ? (
              <PillButton
                tone="ink"
                label="Skip to arrival"
                onPress={() => dispatch({ type: "arrive" })}
              />
            ) : state.phase === "arrived" ? (
              <PillButton
                tone="ink"
                label="I’m here"
                onPress={() => dispatch({ type: "openArrival" })}
              />
            ) : state.phase === "done" ? (
              <PillButton
                tone="ink"
                label={folder ? "Open its folder" : "Back to Sidequest"}
                onPress={folder ? openFolder : back}
              />
            ) : (
              <Text variant="caption" style={{ color: color.ink2 }}>
                Something might turn up on the way.
              </Text>
            )}
          </View>
        </TornPaper>
      </View>
      <Sheet
        visible={state.phase === "preview"}
        onClose={() => dispatch({ type: "skip" })}
        title="A little detour?"
      >
        <div className="rw-discovery-pair" style={variables}>
          <figure>
            <img
              src={photo}
              alt="Generated concept of a colorful street-art passage"
            />
            <figcaption>
              AI-generated concept
              <br />
              Not a photo of this place
            </figcaption>
          </figure>
          <div className="rw-receipt">
            <Receipt
              draw={draw}
              from={START}
              cityLabel="Ann Arbor"
              width={156}
            />
          </div>
        </div>
        <PillButton
          tone="ink"
          label={busy ? "Starting…" : "Take this detour"}
          disabled={busy}
          onPress={() => void accept()}
        />
        <PillButton
          tone="frost"
          sound={null}
          label="Keep walking"
          onPress={() => dispatch({ type: "skip" })}
        />
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      </Sheet>
      <Sheet
        visible={state.phase === "arrived" && state.arrivalOpen}
        onClose={() => dispatch({ type: "closeArrival" })}
        title="You’re here"
        subtitle={clean(target.placeName)}
      >
        <figure className="rw-quest-photo" style={variables}>
          <img
            src={photo}
            alt={`Generated concept preview for ${clean(target.placeName)}`}
          />
          <figcaption>AI-generated concept · not a place photo</figcaption>
        </figure>
        <Text variant="prose">{target.activityText}</Text>
        {target.status === "completed" ? (
          <PillButton tone="ink" label="Open its folder" onPress={openFolder} />
        ) : (
          <HoldToComplete onComplete={() => void finish()} />
        )}
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      </Sheet>
      <Sheet
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={clean(target.placeName)}
        subtitle="Your little detour"
      >
        <figure className="rw-quest-photo" style={variables}>
          <img
            src={photo}
            alt={`Generated concept preview for ${clean(target.placeName)}`}
          />
          <figcaption>AI-generated concept · not a place photo</figcaption>
        </figure>
        <Text variant="prose">{target.activityText}</Text>
        <PillButton
          tone="ink"
          label="Back to walking"
          onPress={() => setDetailsOpen(false)}
        />
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
              aria-label={
                detouring
                  ? "Expand Sidequest Live Activity"
                  : "Show Sidequest notification"
              }
              disabled={state.phase === "preview" || state.phase === "done"}
              aria-expanded={detouring ? state.expanded : state.noticeOpen}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  dispatch({ type: detouring ? "expand" : "expandNotice" });
                }
              }}
              onPointerDown={() => {
                held.current = false;
                holdTimer.current = setTimeout(() => {
                  held.current = true;
                  dispatch({ type: detouring ? "expand" : "expandNotice" });
                }, 550);
              }}
              onPointerUp={stopHold}
              onPointerCancel={stopHold}
              onPointerLeave={stopHold}
              onClick={() => {
                if (!held.current)
                  dispatch({ type: detouring ? "expand" : "notify" });
              }}
            >
              <span className="rw-island-dot" aria-hidden />
              <span>
                {state.phase === "arrived"
                  ? "here"
                  : detouring
                    ? `${Math.max(1, Math.ceil((1 - state.progress) * 4))}m`
                    : state.phase === "nearby"
                      ? "nearby"
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
                    ? "You’re here. Make a little memory."
                    : state.paused
                      ? "Paused. Take your time."
                      : "A little off your usual way."}
                </p>
                <div className="rw-activity-metrics">
                  <span>
                    <strong>
                      {state.phase === "arrived"
                        ? "Here"
                        : `${Math.max(1, Math.ceil((1 - state.progress) * 4))} min`}
                    </strong>{" "}
                    {state.phase === "arrived"
                      ? "destination reached"
                      : "to go"}
                  </span>
                  <button
                    aria-label={
                      state.paused
                        ? "Resume from Live Activity"
                        : "Pause from Live Activity"
                    }
                    onClick={() => dispatch({ type: "pause" })}
                  >
                    {state.paused ? <PlayIcon tint={color.white} /> : <PauseIcon tint={color.white} />}
                  </button>
                </div>
                <div
                  className="rw-activity-track"
                  role="progressbar"
                  aria-label="Detour progress"
                  aria-valuenow={Math.round(state.progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <i style={{ width: `${state.progress * 100}%` }} />
                </div>
                <div className="rw-activity-actions">
                  <button onClick={viewQuest}>
                    {state.phase === "arrived"
                      ? "Open sidequest"
                      : "View sidequest"}
                  </button>
                  {state.phase !== "arrived" && (
                    <button onClick={continueWalk}>
                      {state.paused ? "Resume walking" : "Keep walking"}
                    </button>
                  )}
                </div>
                              </div>
            )}
          </div>
          {state.banner && (
            <div
              className={`rw-banner ${state.noticeOpen ? "is-open" : ""}`}
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
                } else if (e.clientY - swipeStart.current > 24) {
                  swiped.current = true;
                  dispatch({ type: "expandNotice" });
                }
              }}
            >
              <button
                className="rw-banner-main"
                onClick={() => {
                  if (!swiped.current)
                    dispatch({
                      type: state.phase === "arrived" ? "openArrival" : "open",
                    });
                  swiped.current = false;
                }}
              >
                <img className="rw-notice-thumb" src={photo} alt="" />
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
                className="rw-notice-expand"
                aria-label={
                  state.noticeOpen
                    ? "Collapse notification preview"
                    : "Expand notification preview"
                }
                aria-expanded={state.noticeOpen}
                onClick={() =>
                  dispatch({
                    type: state.noticeOpen ? "collapseNotice" : "expandNotice",
                  })
                }
              >
                {state.noticeOpen ? "⌃" : "⌄"}
              </button>
              <button
                className="rw-notice-dismiss"
                aria-label="Dismiss notification"
                onClick={() => dispatch({ type: "dismiss" })}
              >
                ×
              </button>
              {state.noticeOpen && (
                <div className="rw-notice-detail">
                  <figure>
                    <img
                      src={photo}
                      alt={`Generated concept preview for ${clean(target.placeName)}`}
                    />
                    <figcaption>
                      AI-generated concept · not a place photo
                    </figcaption>
                  </figure>
                  <p>{target.activityText}</p>
                  <div>
                    <button
                      onClick={() =>
                        dispatch({
                          type:
                            state.phase === "arrived" ? "openArrival" : "open",
                        })
                      }
                    >
                      {state.phase === "arrived"
                        ? "Open sidequest"
                        : "Have a look"}
                    </button>
                    <button onClick={() => dispatch({ type: "dismiss" })}>
                      Not now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DeviceSystemOverlay>
    </div>
  );
}

/* the map's paper palette: streets are the paper, blocks a shade under it */
const MAP = { street: "#F6F4F0", block: "#E9E6E0", park: "#DEE2D7" };

const walkStyles = StyleSheet.create({
  direction: { position: "absolute", top: 120, left: 20, right: 20 },
  directionGlass: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 14, paddingHorizontal: 18 },
  ahead: { width: 30, height: 30 },
  tools: { position: "absolute", top: 212, right: 20, gap: 8 },
  cardWrap: { position: "absolute", left: 16, right: 16, bottom: 40 },
  card: { padding: space.xl, paddingTop: space.lg },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  place: { flex: 1, fontFamily: fonts.serif, fontSize: 26, lineHeight: 30, letterSpacing: -0.4, color: color.ink },
});
