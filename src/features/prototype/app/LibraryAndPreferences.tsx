import { useState, type Dispatch } from "react";
import { Icon } from "../Icons";
import { photos, logo } from "./assets";
import { questById } from "./data";
import { InterestChips } from "./Onboarding";
import type { AppAction, AppState } from "./model";
import { Sheet, Toggle } from "./ui";
import { MemoryCalendar } from "./MemoryCalendar";
import { groupMemoryDays, memoriesOnDay } from "./calendar";

export function Memories({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  const [segment, setSegment] = useState<"completed" | "saved">("completed");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const shown = memoriesOnDay(state.memories, selectedDay);
  const unique = new Set(state.memories.map((m) => m.questId)).size;
  return (
    <section className="sq-page sq-memories" aria-label="Memories">
      <header>
        <span className="sq-kicker">THE INTERESTING WAY</span>
        <h1>
          Little <em>discoveries.</em>
        </h1>
        <p>
          {state.memories.length
            ? `${state.memories.length} ${state.memories.length === 1 ? "moment" : "moments"} kept · ${unique} ${unique === 1 ? "place" : "places"} discovered`
            : "Not everything good needs a plan."}
        </p>
      </header>
      <div
        className="sq-segment"
        role="tablist"
        aria-label="Discovery collection"
      >
        <button
          role="tab"
          aria-selected={segment === "completed"}
          onClick={() => setSegment("completed")}
        >
          Discovered <span>{state.memories.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={segment === "saved"}
          onClick={() => {
            setSegment("saved");
            setSelectedDay(null);
          }}
        >
          Saved <span>{state.saved.length}</span>
        </button>
      </div>
      {segment === "completed" && state.memories.length > 0 && (
        <MemoryCalendar
          memories={state.memories}
          selected={selectedDay}
          onSelect={setSelectedDay}
        />
      )}
      {segment === "completed" && state.memories.length > 0 ? (
        <div className="sq-memory-grid sq-receipt-grid">
          {shown.map((m) => {
            const q = questById(m.questId)!;
            return (
              <button
                key={m.id}
                onClick={() =>
                  dispatch({
                    type: "overlay",
                    overlay: { kind: "memory", memoryId: m.id },
                  })
                }
              >
                <div>
                  <img src={m.photo ?? photos[q.image]} alt={q.name} />
                  {m.note && (
                    <span className="sq-note-badge">
                      <Icon name="book" />
                    </span>
                  )}
                </div>
                <strong>{q.name}</strong>
                <small>
                  {new Date(m.completedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · a moment kept
                </small>
                <span className="sq-library-stub">
                  <span>
                    No.{" "}
                    {String(
                      state.memories.length - state.memories.indexOf(m),
                    ).padStart(3, "0")}
                  </span>
                  <span>KEPT ↗</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : segment === "saved" && state.saved.length > 0 ? (
        <div className="sq-memory-grid">
          {state.saved.map((id) => {
            const q = questById(id)!;
            return (
              <button
                key={id}
                onClick={() => dispatch({ type: "open-quest", id })}
              >
                <div>
                  <img src={photos[q.image]} alt={q.name} />
                  <span className="sq-note-badge">
                    <Icon name="bookmark" />
                  </span>
                </div>
                <strong>{q.name}</strong>
                <small>Another day · +{q.detourMinutes} min</small>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="sq-collection-empty">
          <div>
            <Icon name={segment === "saved" ? "bookmark" : "spark"} />
          </div>
          <h2>
            {segment === "saved"
              ? "A possibility for later."
              : "Your first little adventure."}
          </h2>
          <p>
            {segment === "saved"
              ? "Save a discovery when the timing isn’t quite right. It’ll be waiting here."
              : "Take a detour. Notice something new. Keep a small piece of the day."}
          </p>
          <button
            className="sq-primary"
            onClick={() => dispatch({ type: "screen", screen: "map" })}
          >
            Back to your walk <Icon name="arrow" />
          </button>
        </div>
      )}
      {state.memories.length > 0 && segment === "completed" && (
        <div className="sq-memory-footnote">
          <Icon name="walk" />
          <p>
            {state.memories.reduce(
              (total, m) => total + questById(m.questId)!.detourMinutes,
              0,
            )}{" "}
            minutes of small adventures
            <small>Seeded demo estimates. Real curiosity.</small>
          </p>
        </div>
      )}
    </section>
  );
}
export function Preferences({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  const p = state.prefs;
  const latest = state.memories[0];
  const cover = latest
    ? (latest.photo ?? photos[questById(latest.questId)!.image])
    : photos.garden;
  const places = new Set(state.memories.map((m) => m.questId)).size;
  const days = groupMemoryDays(state.memories).size;
  const minutes = state.memories.reduce(
    (total, memory) => total + questById(memory.questId)!.detourMinutes,
    0,
  );
  return (
    <section
      className="sq-page sq-preferences sq-profile"
      aria-label="Profile and preferences"
    >
      <header>
        <span className="sq-kicker">YOUR LITTLE CORNER</span>
        <h1>
          A curious
          <br />
          kind of <em>you.</em>
        </h1>
      </header>
      <div className="sq-profile-card">
        <img className="sq-profile-cover" src={cover} alt="" />
        <div className="sq-profile-identity">
          <span>
            <img src={logo} alt="" />
          </span>
          <div>
            <strong>Your Sidequest</strong>
            <small>Ann Arbor · kept on this browser</small>
          </div>
        </div>
        <div className="sq-profile-stats">
          <div>
            <strong>{places}</strong>
            <span>{places === 1 ? "place found" : "places found"}</span>
          </div>
          <div>
            <strong>{days}</strong>
            <span>{days === 1 ? "day out" : "days out"}</span>
          </div>
          <div>
            <strong>{minutes}</strong>
            <span>demo minutes</span>
          </div>
        </div>
      </div>
      <h2 className="sq-profile-section">
        Your kind of <em>wandering.</em>
      </h2>
      <div className="sq-preference-group">
        <div className="sq-setting-row">
          <div>
            <strong>Sidequests</strong>
            <small>Keep a little room for the unexpected</small>
          </div>
          <Toggle
            label="Sidequests enabled"
            checked={p.enabled}
            onChange={(enabled) =>
              dispatch({ type: "prefs", patch: { enabled } })
            }
          />
        </div>
        <label className="sq-range-label">
          Discovery radius
          <strong>
            {p.radius < 1000
              ? `${p.radius} m`
              : `${(p.radius / 1000).toFixed(1)} km`}
          </strong>
          <input
            type="range"
            aria-label="Discovery radius"
            min="200"
            max="2000"
            step="100"
            value={p.radius}
            onChange={(e) =>
              dispatch({
                type: "prefs",
                patch: { radius: Number(e.target.value) },
              })
            }
          />
        </label>
        <label className="sq-range-label">
          A detour, no longer than<strong>{p.maxDetour} min</strong>
          <input
            type="range"
            aria-label="Maximum detour minutes"
            min="2"
            max="15"
            value={p.maxDetour}
            onChange={(e) =>
              dispatch({
                type: "prefs",
                patch: { maxDetour: Number(e.target.value) },
              })
            }
          />
        </label>
      </div>
      <p className="sq-caption">A LITTLE MORE OF WHAT YOU LOVE</p>
      <InterestChips state={state} dispatch={dispatch} />
      <div className="sq-preference-group">
        <div className="sq-setting-row">
          <div>
            <strong>Notifications</strong>
            <small>Simulated banners inside this phone</small>
          </div>
          <Toggle
            label="Notification banners"
            checked={p.notifications}
            onChange={(notifications) =>
              dispatch({ type: "prefs", patch: { notifications } })
            }
          />
        </div>
        <div className="sq-setting-row">
          <div>
            <strong>Quiet mode</strong>
            <small>No automatic nudges. Ask when ready.</small>
          </div>
          <Toggle
            label="Quiet mode"
            checked={p.quiet}
            onChange={(quiet) => dispatch({ type: "prefs", patch: { quiet } })}
          />
        </div>
        <label className="sq-setting-row">
          <span>
            <strong>A little nudge</strong>
            <small>How often suggestions find you</small>
          </span>
          <select
            aria-label="Suggestion frequency"
            value={p.frequency}
            onChange={(e) =>
              dispatch({
                type: "prefs",
                patch: { frequency: e.target.value as typeof p.frequency },
              })
            }
          >
            <option value="often">More often</option>
            <option value="balanced">Now & then</option>
            <option value="rare">Rarely</option>
          </select>
        </label>
        <div className="sq-setting-row">
          <div>
            <strong>Demo location</strong>
            <small>Seeded walk in Ann Arbor · not GPS</small>
          </div>
          <Toggle
            label="Ann Arbor demo location"
            checked={p.location === "demo"}
            onChange={(enabled) =>
              dispatch({
                type: "prefs",
                patch: { location: enabled ? "demo" : "off" },
              })
            }
          />
        </div>
      </div>
      <div className="sq-preference-group">
        <button
          className="sq-settings-link"
          onClick={() => dispatch({ type: "guided" })}
        >
          <Icon name="replay" />
          <span>Replay the guided walk</span>
          <Icon name="arrow" />
        </button>
        <button
          className="sq-settings-link"
          onClick={() => dispatch({ type: "explore" })}
        >
          <Icon name="map" />
          <span>Explore on your own</span>
          <Icon name="arrow" />
        </button>
        <button
          className="sq-settings-link sq-danger"
          onClick={() =>
            dispatch({ type: "overlay", overlay: { kind: "reset" } })
          }
        >
          <Icon name="replay" />
          <span>Reset this demo</span>
          <Icon name="arrow" />
        </button>
      </div>
      <div className="sq-about">
        <img src={logo} alt="Sidequest" />
        <p>A little off your usual way.</p>
        <small>
          Web concept · seeded places · simulated iOS
          <br />
          Preferences and memories stay in this browser.
        </small>
      </div>
    </section>
  );
}
export function ResetSheet({ dispatch }: { dispatch: Dispatch<AppAction> }) {
  return (
    <Sheet title="Reset demo" onClose={() => dispatch({ type: "close" })}>
      <div className="sq-sheet-content">
        <span className="sq-kicker">A FRESH START</span>
        <h2>Wander again?</h2>
        <p className="sq-challenge">
          This clears your memories, saved places, and preferences from this
          browser. You’ll return to the beginning.
        </p>
        <button
          className="sq-primary"
          onClick={() => dispatch({ type: "reset" })}
        >
          Reset this demo <Icon name="replay" />
        </button>
        <button
          className="sq-text-button"
          onClick={() => dispatch({ type: "close" })}
        >
          Keep my discoveries
        </button>
      </div>
    </Sheet>
  );
}
