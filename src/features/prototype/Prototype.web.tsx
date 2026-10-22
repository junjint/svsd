import { useEffect, useReducer, useRef, type CSSProperties } from "react";
import { Asset } from "expo-asset";
import { color } from "@/theme/tokens";
import {
  discoveries,
  initialStory,
  sceneLabels,
  scenes,
  storyReducer,
} from "./story";
import { Icon } from "./Icons";
import { JourneyMap } from "./JourneyMap";
import "./prototype.css";

const logo = Asset.fromModule(
  require("../../../assets/brand/side-logo.png"),
).uri;
const courtyard = Asset.fromModule(
  require("../../../assets/prototype/fountain-courtyard.png"),
).uri;
const grain = Asset.fromModule(
  require("../../../assets/design/grain-light.png"),
).uri;
const fontFiles = {
  Inter_400Regular: require("@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf"),
  Inter_500Medium: require("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf"),
  Inter_600SemiBold: require("@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf"),
  EBGaramond_400Regular: require("@expo-google-fonts/eb-garamond/400Regular/EBGaramond_400Regular.ttf"),
  EBGaramond_400Regular_Italic: require("@expo-google-fonts/eb-garamond/400Regular_Italic/EBGaramond_400Regular_Italic.ttf"),
};
const fontCSS = Object.entries(fontFiles)
  .map(
    ([name, file]) =>
      `@font-face{font-family:'${name}';src:url('${Asset.fromModule(file).uri}') format('truetype');font-display:swap;}`,
  )
  .join("");

function StatusBar({ light }: { light: boolean }) {
  return (
    <div className={`ios-status ${light ? "light" : ""}`} aria-hidden="true">
      <span className="ios-clock">9:41</span>
      <div className="ios-status-right">
        <svg width="18" height="13" viewBox="0 0 18 13" fill="currentColor">
          <rect x="0" y="9" width="3" height="4" rx=".8" />
          <rect x="5" y="6" width="3" height="7" rx=".8" />
          <rect x="10" y="3" width="3" height="10" rx=".8" />
          <rect x="15" width="3" height="13" rx=".8" />
        </svg>
        <svg
          width="17"
          height="13"
          viewBox="0 0 18 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        >
          <path d="M1 4q8-6 16 0M4 7q5-4 10 0M7 10q2-2 4 0" />
          <circle cx="9" cy="13" r=".8" fill="currentColor" stroke="none" />
        </svg>
        <svg width="26" height="13" viewBox="0 0 27 13" fill="none">
          <rect
            x=".5"
            y="1"
            width="23"
            height="11"
            rx="3"
            stroke="currentColor"
            strokeOpacity=".4"
          />
          <rect
            x="2.5"
            y="3"
            width="18"
            height="7"
            rx="1.4"
            fill="currentColor"
          />
          <path d="M25 4v5q3-1 0-5Z" fill="currentColor" fillOpacity=".4" />
        </svg>
      </div>
    </div>
  );
}

// Retained cinematic implementation from the earlier design pass.
// The full app below reuses its shell, tokens, artwork, and icon language.
export function CinematicPrototype() {
  const [state, dispatch] = useReducer(storyReducer, initialStory);
  const screenRef = useRef<HTMLDivElement>(null);
  const keyboardNavigation = useRef(false);
  const place = discoveries[0];
  const index = scenes.indexOf(state.scene);
  const arrived = state.scene === "arrival";
  const returning = state.scene === "return";
  const mode =
    state.scene === "nearby"
      ? "compact"
      : state.scene === "discovery"
        ? "expanded"
        : state.scene === "detour"
          ? "guiding"
          : returning && !state.settled
            ? "complete"
            : "idle";

  useEffect(() => {
    document.title = "Sidequest — A little off your usual way.";
  }, []);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (state.scene === "journey" && state.walking && !state.dismissed)
      timer = setTimeout(
        () => dispatch({ type: "advance", from: "journey" }),
        2200,
      );
    if (state.scene === "detour")
      timer = setTimeout(
        () => dispatch({ type: "advance", from: "detour" }),
        7800,
      );
    if (state.scene === "return")
      timer = setTimeout(() => dispatch({ type: "settle" }), 3000);
    return () => clearTimeout(timer);
  }, [state.scene, state.walking, state.dismissed]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      keyboardNavigation.current = true;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        dispatch({ type: "back" });
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        dispatch({
          type: state.scene === "journey" && !state.walking ? "start" : "next",
        });
      }
      if (event.key === "Escape") dispatch({ type: "dismiss" });
    };
    const onPointer = () => {
      keyboardNavigation.current = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [state.scene, state.walking]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const focused = document.activeElement;
      if (
        keyboardNavigation.current &&
        (focused === document.body || !focused?.isConnected)
      )
        screenRef.current
          ?.querySelector<HTMLButtonElement>("[data-primary]")
          ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [state.scene]);

  const style = {
    "--paper": color.paper,
    "--ink": color.ink,
    "--muted": color.ink2,
    "--grain": `url('${grain}')`,
  } as CSSProperties;
  return (
    <main className="iphone-demo" data-scene={state.scene} style={style}>
      <style>{fontCSS}</style>
      <div
        className="iphone-device"
        aria-label="Simulated iPhone navigation experience"
      >
        <span className="device-button action-button" />
        <span className="device-button volume-up" />
        <span className="device-button volume-down" />
        <span className="device-button power-button" />
        <div
          ref={screenRef}
          className={`iphone-screen scene-${state.scene} ${state.walking ? "is-walking" : ""} ${state.settled ? "is-settled" : ""}`}
        >
          <div
            className="navigation-app"
            aria-hidden={arrived || state.scene === "discovery"}
            inert={arrived || state.scene === "discovery"}
          >
            <JourneyMap scene={state.scene} place={place} />
            <div className="map-top-shade" />
            <div className="turn-by-turn" aria-label="Walking directions">
              <span className="direction-arrow">
                {state.scene === "detour" ? "↰" : returning ? "↱" : "↑"}
              </span>
              <div>
                <strong>
                  {state.scene === "detour"
                    ? "Turn left"
                    : returning
                      ? "Continue on Liberty"
                      : "Continue straight"}
                </strong>
                <span>
                  {state.scene === "detour"
                    ? "E William St · 200 ft"
                    : returning
                      ? "toward S State St"
                      : "Maynard St · 400 ft"}
                </span>
              </div>
              <span className="direction-walk">
                <Icon name="walk" size={22} />
              </span>
            </div>
            <div className="maps-tools" aria-hidden="true">
              <span className="map-tool">
                <Icon name="compass" size={21} />
                <small>N</small>
              </span>
              <span className="map-tool locate-tool">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="m4 10 16-6-6 16-2-8-8-2Z" />
                </svg>
              </span>
            </div>
            <div className="walking-sheet">
              <div className="sheet-grabber" />
              <div className="destination-row">
                <div>
                  <span className="destination-overline">
                    {state.scene === "detour"
                      ? "A LITTLE DETOUR"
                      : "WALKING TO"}
                  </span>
                  <h1>
                    {state.scene === "detour" ? place.name : "Michigan Union"}
                  </h1>
                </div>
                <span
                  className={`destination-symbol ${state.scene === "detour" ? "quest-symbol" : ""}`}
                >
                  <Icon
                    name={state.scene === "detour" ? "spark" : "walk"}
                    size={24}
                  />
                </span>
              </div>
              <div className="eta-row">
                <strong>
                  {state.scene === "detour" ? "4" : returning ? "7" : "12"}{" "}
                  <span>min</span>
                </strong>
                <span>
                  {state.scene === "detour"
                    ? "Then Michigan Union"
                    : returning
                      ? "0.3 mi · 9:57 arrival"
                      : "0.5 mi · 9:53 arrival"}
                </span>
              </div>
              {state.scene === "journey" && (
                <button
                  data-primary
                  className={`walk-action ${state.walking && !state.dismissed ? "walking-in-progress" : ""}`}
                  disabled={state.walking && !state.dismissed}
                  onClick={() => dispatch({ type: "start" })}
                >
                  <Icon name="walk" size={19} />
                  {state.dismissed
                    ? "Keep walking"
                    : state.walking
                      ? "Walking…"
                      : "Start walking"}
                  <Icon name="arrow" size={17} />
                </button>
              )}
              {state.scene === "detour" && (
                <div className="route-in-progress">
                  <span className="route-pulse" />
                  Following your detour
                  <button
                    data-primary
                    aria-label="Arrive at the Fountain Steps"
                    onClick={() => dispatch({ type: "next" })}
                  >
                    <Icon name="arrow" size={17} />
                  </button>
                </div>
              )}
              {(state.scene === "nearby" ||
                state.scene === "discovery" ||
                returning) && (
                <div className="navigation-active">
                  <span className="route-pulse" />
                  {returning ? "Your walk continues" : "Walking"}
                  <span className="eta-mini-route">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              )}
              <div className="maps-signature">
                <span>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M1 2l3-1 4 2 3-1v8l-3 1-4-2-3 1V2Z"
                      stroke="currentColor"
                    />
                    <path d="M4 1v8m4-6v8" stroke="currentColor" />
                  </svg>
                  Maps
                </span>
                <span>SIMULATED WALK</span>
              </div>
            </div>
          </div>

          <div
            className={`place-photo-layer ${state.scene === "discovery" ? "is-preview" : arrived ? "is-arrival" : ""}`}
            aria-hidden={state.scene !== "discovery" && !arrived}
          >
            <img
              src={courtyard}
              alt="Sunlight falling over a fountain and stone steps in a quiet, leafy courtyard"
              fetchPriority="high"
            />
            <div className="photo-shade" />
          </div>

          <div
            className={`dynamic-island island-${mode}`}
            data-island={mode}
            aria-label={
              mode === "idle" ? "Dynamic Island" : "Sidequest Live Activity"
            }
          >
            <div className="island-hardware" aria-hidden="true">
              <span className="island-speaker" />
              <span className="island-lens" />
            </div>
            {mode === "compact" && (
              <button
                data-primary
                className="compact-island-action"
                aria-label="Open nearby Sidequest"
                onClick={() => dispatch({ type: "next" })}
              >
                <img className="island-logo" src={logo} alt="Sidequest" />
                <span className="compact-time">
                  +4 <small>min</small>
                </span>
              </button>
            )}
            {mode === "guiding" && (
              <div className="live-activity-mini">
                <span className="mini-spark">
                  <Icon name="spark" size={18} />
                </span>
                <span className="compact-time">
                  4 <small>min</small>
                </span>
              </div>
            )}
            {mode === "complete" && (
              <div className="live-activity-mini activity-complete">
                <span className="mini-spark">
                  <Icon name="check" size={18} />
                </span>
                <span className="compact-time">lovely.</span>
              </div>
            )}
            <div
              className="island-expanded-content"
              inert={mode !== "expanded"}
              aria-hidden={mode !== "expanded"}
            >
              <div className="expanded-brand">
                <img src={logo} alt="Sidequest" />
                <span>+4 min</span>
              </div>
              <div className="island-photo-slot" />
              <div className="island-place-copy">
                <h2>{place.name}</h2>
                <p>{place.descriptor}</p>
              </div>
              <div className="island-choices">
                <button
                  className="island-dismiss"
                  onClick={() => dispatch({ type: "dismiss" })}
                >
                  Not now
                </button>
                <button
                  data-primary={mode === "expanded" ? true : undefined}
                  className="island-accept"
                  onClick={() => dispatch({ type: "next" })}
                >
                  Take detour
                  <Icon name="arrow" size={17} />
                </button>
              </div>
            </div>
          </div>

          <StatusBar light={arrived} />
          <div
            className={`arrival-moment ${arrived ? "is-visible" : ""}`}
            inert={!arrived}
            aria-hidden={!arrived}
          >
            <button
              className="back-to-maps"
              onClick={() => dispatch({ type: "back" })}
            >
              <Icon name="back" size={15} />
              Maps
            </button>
            <div className="arrival-caption">
              <span className="arrival-brand">
                <img src={logo} alt="Sidequest" />
                <Icon name="spark" size={17} />
              </span>
              <p className="arrival-eyebrow">THE FOUNTAIN STEPS</p>
              <h2>You’re here.</h2>
              <p className="arrival-whisper">Stay for a quiet minute.</p>
              <button
                data-primary={arrived ? true : undefined}
                className="arrival-finish"
                onClick={() => dispatch({ type: "next" })}
              >
                Lovely. Let’s go.
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </div>
          {state.dismissed && (
            <span className="dismissal-toast" role="status">
              <Icon name="check" size={13} />
              Your route, unchanged.
            </span>
          )}

          <div
            className={`demo-transport ${arrived ? "transport-light" : ""}`}
            aria-label="Demo playback controls"
          >
            <button
              className="transport-back"
              aria-label="Previous moment"
              disabled={!state.history.length}
              onClick={() => dispatch({ type: "back" })}
            >
              <Icon name="back" size={15} />
            </button>
            <ol aria-label="Walk progress">
              {sceneLabels.map((label, i) => (
                <li
                  key={label}
                  aria-current={index === i ? "step" : undefined}
                  aria-label={label}
                  className={`${index === i ? "current" : ""} ${i < index ? "past" : ""}`}
                >
                  <span />
                </li>
              ))}
            </ol>
            <button
              className="transport-replay"
              aria-label="Replay demo"
              onClick={() => dispatch({ type: "replay" })}
            >
              <Icon name="replay" size={14} />
            </button>
          </div>
          <span
            className={`ios-home-indicator ${arrived ? "home-light" : ""}`}
            aria-hidden="true"
          />
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {sceneLabels[index]}.{" "}
            {state.scene === "nearby"
              ? "Sidequest nearby. Tap the Dynamic Island to explore."
              : state.dismissed
                ? "Sidequest dismissed. Continuing to Michigan Union."
                : state.completed
                  ? "Sidequest complete. Continuing to Michigan Union."
                  : ""}{" "}
            This is a simulated iPhone experience.
          </span>
        </div>
      </div>
    </main>
  );
}

export { default } from './app/App';
