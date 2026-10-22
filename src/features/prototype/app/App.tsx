import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Icon } from "../Icons";
import { fontCSS, grain } from "./assets";
import { questById } from "./data";
import { appReducer, initialApp, persistedState, STORAGE_KEY } from "./model";
import { Onboarding, PermissionPrompt } from "./Onboarding";
import { MapHome } from "./MapHome";
import {
  ArrivalSheet,
  MemoryDetail,
  QuestSheet,
  RouteSheet,
  SearchSheet,
} from "./QuestViews";
import { Memories, Preferences, ResetSheet } from "./LibraryAndPreferences";
import { DynamicIsland, NotificationBanner } from "./SystemSurfaces";
import { StatusBar } from "./ui";
import { InvitationPrinter } from "./InvitationPrinter";
import { WalkShortcut } from "./WalkShortcut";
import "../prototype.css";
import "./app.css";
import "./paper.css";
import "./navigation.css";

export default function SidequestApp() {
  const [state, dispatch] = useReducer(appReducer, initialApp),
    [booted, setBooted] = useState(false),
    [storageError, setStorageError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    document.title = "Sidequest — A little off your usual way.";
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        dispatch({
          type: "launch-demo",
          raw: window.localStorage.getItem(STORAGE_KEY),
        });
      } catch {
        setStorageError(true);
        dispatch({ type: "launch-demo", raw: null });
      }
      setBooted(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const saved = JSON.stringify(persistedState(state));
  useEffect(() => {
    if (!booted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, saved);
      queueMicrotask(() => setStorageError(false));
    } catch {
      queueMicrotask(() => setStorageError(true));
    }
  }, [saved, booted]);
  const ticking =
    booted &&
    ((state.journey.phase !== "idle" && !state.paused) ||
      !!state.banner ||
      !!state.activityDone ||
      !!state.toast);
  useEffect(() => {
    if (!ticking) return;
    const timer = setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => clearInterval(timer);
  }, [ticking]);
  const shownActivities = useRef(new Set<string>());
  const { id: journeyId, activeQuestId, phase } = state.journey;
  useEffect(() => {
    if (
      state.mode !== "guided" ||
      state.screen !== "map" ||
      phase !== "detouring" ||
      !activeQuestId ||
      state.overlay
    )
      return;
    const key = `${journeyId}:${activeQuestId}`;
    if (shownActivities.current.has(key)) return;
    const timer = setTimeout(() => {
      shownActivities.current.add(key);
      dispatch({ type: "preview-activity", journeyId, questId: activeQuestId });
    }, 700);
    return () => clearTimeout(timer);
  }, [
    journeyId,
    activeQuestId,
    phase,
    state.mode,
    state.screen,
    state.overlay,
  ]);
  useEffect(() => {
    const back = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (state.permission) dispatch({ type: "close-permission" });
      else if (state.overlay) dispatch({ type: "close" });
      else if (state.screen !== "map")
        dispatch({ type: "screen", screen: "map" });
    };
    window.addEventListener("keydown", back);
    return () => window.removeEventListener("keydown", back);
  }, [state.permission, state.overlay, state.screen]);
  const overlay = state.overlay,
    quest = overlay && "questId" in overlay ? questById(overlay.questId) : null,
    memory =
      overlay?.kind === "memory"
        ? state.memories.find((m) => m.id === overlay.memoryId)
        : null;
  const style = {
    "--paper": "#FBFAF7",
    "--ink": "#15100E",
    "--muted": "#827973",
    "--grain": `url('${grain}')`,
  } as CSSProperties;
  return (
    <main className="iphone-demo sq-full-app" style={style}>
      <style>{fontCSS}</style>
      <div className="iphone-device" aria-label="Sidequest simulated iPhone">
        <span className="device-button action-button" />
        <span className="device-button volume-up" />
        <span className="device-button volume-down" />
        <span className="device-button power-button" />
        <div className="iphone-screen">
          <div
            className="sq-app-content"
            inert={!!overlay || !!state.permission}
            aria-hidden={!!overlay || !!state.permission}
          >
            {!booted ? (
              <div className="sq-boot">A little wonder…</div>
            ) : !state.onboarded ? (
              <Onboarding state={state} dispatch={dispatch} />
            ) : (
              <>
                {state.screen === "map" ? (
                  <MapHome state={state} dispatch={dispatch} />
                ) : state.screen === "memories" ? (
                  <Memories state={state} dispatch={dispatch} />
                ) : (
                  <Preferences state={state} dispatch={dispatch} />
                )}
                {state.screen !== "map" && (
                  <WalkShortcut state={state} dispatch={dispatch} />
                )}
                <nav
                  className="sq-tab-bar sq-collection-tabs"
                  aria-label="Main navigation"
                >
                  <button
                    aria-current={
                      state.screen === "memories" ? "page" : undefined
                    }
                    onClick={() =>
                      dispatch({ type: "screen", screen: "memories" })
                    }
                  >
                    <Icon name="book" />
                    <span>Library</span>
                  </button>
                  <button
                    className="sq-new-invitation"
                    aria-label="Print a Sidequest invitation"
                    aria-haspopup="dialog"
                    onClick={() =>
                      dispatch({
                        type: "overlay",
                        overlay: { kind: "printer", questId: null, edition: 0 },
                      })
                    }
                  >
                    <span>
                      <Icon name="plus" />
                    </span>
                    <span>A little detour</span>
                  </button>
                  <button
                    aria-current={
                      state.screen === "preferences" ? "page" : undefined
                    }
                    onClick={() =>
                      dispatch({ type: "screen", screen: "preferences" })
                    }
                  >
                    <Icon name="profile" />
                    <span>Profile</span>
                  </button>
                </nav>
              </>
            )}
          </div>
          {overlay?.kind === "printer" && (
            <InvitationPrinter state={state} dispatch={dispatch} />
          )}
          {overlay?.kind === "search" && (
            <SearchSheet state={state} dispatch={dispatch} />
          )}
          {overlay?.kind === "quest" && quest && (
            <QuestSheet state={state} dispatch={dispatch} quest={quest} />
          )}
          {overlay?.kind === "arrival" && quest && (
            <ArrivalSheet state={state} dispatch={dispatch} quest={quest} />
          )}
          {overlay?.kind === "route" && (
            <RouteSheet state={state} dispatch={dispatch} />
          )}
          {overlay?.kind === "memory" && memory && (
            <MemoryDetail
              key={memory.id}
              memory={memory}
              state={state}
              dispatch={dispatch}
            />
          )}
          {overlay?.kind === "reset" && <ResetSheet dispatch={dispatch} />}
          <StatusBar light={!state.onboarded && state.step === 0} />
          <DynamicIsland state={state} dispatch={dispatch} />
          {state.banner && (
            <NotificationBanner
              key={`${state.banner.id}-${state.banner.kind}`}
              state={state}
              dispatch={dispatch}
            />
          )}
          {state.toast && (
            <div className="sq-toast" role="status">
              <Icon name="check" />
              {state.toast.text}
            </div>
          )}
          {storageError && (
            <div className="sq-storage-warning" role="alert">
              Browser storage is full or unavailable. Changes work for this
              visit but may not survive a reload.
            </div>
          )}
          <PermissionPrompt state={state} dispatch={dispatch} />
          <div className="sq-home-indicator" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}
