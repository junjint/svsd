import { useState, type Dispatch } from "react";
import { Icon } from "../Icons";
import { logo, photos } from "./assets";
import {
  destinations,
  quests,
  questById,
  destinationById,
  type Quest,
} from "./data";
import { meters } from "./geo";
import type { AppAction, AppState, Memory } from "./model";
import { IconButton, Sheet } from "./ui";
import { HoldToKeep } from "./HoldToKeep";

export function SearchSheet({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  const [search, setSearch] = useState("");
  return (
    <Sheet
      title="Choose a destination"
      onClose={() => dispatch({ type: "close" })}
      className="sq-search-sheet"
    >
      <div className="sq-sheet-content">
        <span className="sq-kicker">A WALK AROUND ANN ARBOR</span>
        <h2>Where to?</h2>
        <label className="sq-search-field">
          <Icon name="search" />
          <input
            autoFocus
            aria-label="Search destinations"
            placeholder="A place to head toward"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="sq-search-results">
          {destinations
            .filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
            .map((d) => (
              <button
                key={d.id}
                onClick={() => dispatch({ type: "destination", id: d.id })}
              >
                <span className="sq-result-icon">
                  <Icon name="pin" />
                </span>
                <span>
                  <strong>{d.name}</strong>
                  <small>{d.detail}</small>
                </span>
                {d.id === state.selectedDestination ? (
                  <Icon name="check" />
                ) : (
                  <Icon name="arrow" />
                )}
              </button>
            ))}
        </div>
        <p className="sq-caption">SEEDED LITTLE POSSIBILITIES</p>
        <div className="sq-search-results">
          {quests
            .filter((q) => q.name.toLowerCase().includes(search.toLowerCase()))
            .map((q) => (
              <button
                key={q.id}
                onClick={() => dispatch({ type: "open-quest", id: q.id })}
              >
                <img src={photos[q.image]} alt="" />
                <span>
                  <strong>{q.name}</strong>
                  <small>Demo discovery · +{q.detourMinutes} min</small>
                </span>
                <Icon name="arrow" />
              </button>
            ))}
        </div>
        {!destinations.some((d) =>
          d.name.toLowerCase().includes(search.toLowerCase()),
        ) &&
          !quests.some((q) =>
            q.name.toLowerCase().includes(search.toLowerCase()),
          ) && (
            <p className="sq-empty-search">
              No demo places match. Try “Union” or “garden”.
            </p>
          )}
        <p className="sq-demo-note">
          A small seeded area, not a live business directory.
        </p>
      </div>
    </Sheet>
  );
}
export function QuestSheet({
  state,
  dispatch,
  quest,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  quest: Quest;
}) {
  const active = state.journey.activeQuestId === quest.id,
    saved = state.saved.includes(quest.id),
    ready = state.prefs.enabled && state.prefs.location === "demo";
  return (
    <Sheet
      title={quest.name}
      onClose={() => dispatch({ type: "close" })}
      className="sq-quest-sheet"
    >
      <img
        className="sq-quest-hero"
        src={photos[quest.image]}
        alt={quest.descriptor}
      />
      <div className="sq-quest-copy">
        <div className="sq-between">
          <span className="sq-kicker">{quest.subtitle}</span>
          <button
            className={`sq-save-button ${saved ? "saved" : ""}`}
            aria-label={saved ? "Unsave Sidequest" : "Save Sidequest"}
            aria-pressed={saved}
            onClick={() => dispatch({ type: "save", id: quest.id })}
          >
            <Icon name="bookmark" />
          </button>
        </div>
        <h2>{quest.name}</h2>
        <p className="sq-detour-info">
          <Icon name="walk" /> +{quest.detourMinutes} min detour <i />{" "}
          {Math.round(meters(state.position, quest.position) / 10) * 10} m
          nearby
        </p>
        <p className="sq-quest-description">{quest.descriptor}</p>
        <details>
          <summary>
            A small story <Icon name="plus" />
          </summary>
          <p>{quest.story}</p>
        </details>
        <button
          className="sq-primary"
          onClick={() =>
            active
              ? dispatch({ type: "close" })
              : ready
                ? dispatch({ type: "accept", id: quest.id })
                : dispatch({ type: "screen", screen: "preferences" })
          }
        >
          {active
            ? "Continue walking"
            : ready
              ? "Take the little detour"
              : "Set up Sidequests"}
          <Icon name="arrow" />
        </button>
        <button
          className="sq-text-button"
          onClick={() =>
            dispatch(
              active
                ? { type: "cancel-detour" }
                : { type: "skip", id: quest.id },
            )
          }
        >
          {active ? "Cancel this detour" : "Not this time"}
        </button>
        <p className="sq-demo-note">
          Imagined demo place · generated image · demo estimates
        </p>
      </div>
    </Sheet>
  );
}
export function RouteSheet({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  const q = questById(state.journey.activeQuestId),
    destination = destinationById(state.journey.destinationId);
  return (
    <Sheet
      title="Your walking route"
      onClose={() => dispatch({ type: "close" })}
    >
      <div className="sq-sheet-content">
        <span className="sq-kicker">THE WAY, WITH A LITTLE WONDER</span>
        <h2>Your walk</h2>
        <div className="sq-route-stops">
          <div>
            <span className="sq-stop-dot" />
            <span>
              You are here<small>Simulated location</small>
            </span>
          </div>
          {q && (
            <div>
              <span className="sq-stop-spark">
                <Icon name="spark" />
              </span>
              <span>
                {q.name}
                <small>
                  {state.journey.phase === "arrived"
                    ? "Arrived"
                    : `A +${q.detourMinutes} min demo detour`}
                </small>
              </span>
            </div>
          )}
          <div>
            <Icon name="pin" />
            <span>
              {destination.name}
              <small>Your original destination, kept.</small>
            </span>
          </div>
        </div>
        {q ? (
          <>
            <button
              className="sq-primary"
              onClick={() => {
                if (state.journey.phase === "arrived")
                  dispatch({
                    type: "overlay",
                    overlay: { kind: "arrival", questId: q.id },
                  });
                else dispatch({ type: "close" });
              }}
            >
              Continue{" "}
              {state.journey.phase === "arrived" ? "your Sidequest" : "walking"}
              <Icon name="arrow" />
            </button>
            {state.journey.phase === "detouring" && (
              <button
                className="sq-text-button"
                onClick={() => {
                  dispatch({ type: "close" });
                  dispatch({ type: "arrive" });
                }}
              >
                Simulate arrival now
              </button>
            )}
            <button
              className="sq-text-button sq-danger"
              onClick={() => dispatch({ type: "cancel-detour" })}
            >
              Skip detour & resume original walk
            </button>
          </>
        ) : (
          <>
            <button
              className="sq-primary"
              onClick={() => dispatch({ type: "close" })}
            >
              Back to the map <Icon name="arrow" />
            </button>
            <button
              className="sq-text-button"
              onClick={() => dispatch({ type: "end" })}
            >
              End this walk
            </button>
          </>
        )}
        <p className="sq-demo-note">
          Local street-graph route. Not live directions.
          <br />
          Walking speed and times are simulated.
        </p>
      </div>
    </Sheet>
  );
}

async function localPhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > 12 * 1024 * 1024)
    throw new Error("Choose an image smaller than 12 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 720 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not read the photo.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function MemoryFields({
  note,
  photo,
  onNote,
  onPhoto,
}: {
  note: string;
  photo: string | null;
  onNote: (v: string) => void;
  onPhoto: (v: string | null) => void;
}) {
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  return (
    <div className="sq-memory-fields">
      <label>
        A small thing to remember <span>optional</span>
        <textarea
          aria-label="Memory note"
          placeholder="What did you notice?"
          maxLength={180}
          value={note}
          onChange={(e) => onNote(e.target.value)}
        />
        <small>{note.length} / 180</small>
      </label>
      <div className="sq-photo-field">
        {photo ? (
          <>
            <img src={photo} alt="Your saved moment" />
            <IconButton
              icon="close"
              label="Remove personal photo"
              onClick={() => onPhoto(null)}
            />
          </>
        ) : (
          <label className="sq-photo-picker">
            <Icon name="photo" />
            {loading ? "Keeping your moment…" : "Add your own photo"}
            <input
              type="file"
              aria-label="Add a memory photo"
              accept="image/jpeg,image/png,image/webp"
              disabled={loading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setLoading(true);
                setError("");
                try {
                  onPhoto(await localPhoto(file));
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Photo could not be read.",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            />
          </label>
        )}
      </div>
      {error && (
        <p className="sq-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function ArrivalSheet({
  state,
  dispatch,
  quest,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  quest: Quest;
}) {
  return (
    <Sheet
      title="Your arrival"
      className="sq-arrival-sheet"
      onClose={() => dispatch({ type: "close" })}
    >
      <img
        className="sq-arrival-photo"
        src={photos[quest.image]}
        alt={quest.descriptor}
      />
      <div className="sq-quest-copy">
        <span className="sq-kicker">YOU TOOK THE INTERESTING WAY</span>
        <h2>
          You’re <em>here.</em>
        </h2>
        <p className="sq-arrival-place">{quest.name}</p>
        <p className="sq-challenge">{quest.challenge}</p>
        <MemoryFields
          note={state.draftNote}
          photo={state.draftPhoto}
          onNote={(note) => dispatch({ type: "draft", note })}
          onPhoto={(photo) => dispatch({ type: "draft", photo })}
        />
        <HoldToKeep
          onComplete={() =>
            dispatch({ type: "complete", at: new Date().toISOString() })
          }
        />
        <p className="sq-demo-note">
          A keepsake receipt goes to Library. Saved on this browser only; your
          original walk resumes.
        </p>
      </div>
    </Sheet>
  );
}
export function MemoryDetail({
  memory,
  state,
  dispatch,
}: {
  memory: Memory;
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  const [note, setNote] = useState(memory.note),
    [photo, setPhoto] = useState(memory.photo),
    q = questById(memory.questId)!;
  return (
    <Sheet
      title="Your memory"
      className="sq-memory-detail sq-keepsake-sheet"
      onClose={() => dispatch({ type: "close" })}
    >
      <div className="sq-keepsake-receipt">
        <div className="sq-keepsake-masthead">
          <img src={logo} alt="" />
          <span>
            SIDEQUEST<small>A RECEIPT FOR TAKING THE INTERESTING WAY</small>
          </span>
        </div>
        <img
          className="sq-quest-hero"
          src={photo ?? photos[q.image]}
          alt={q.name}
        />
        <div className="sq-quest-copy">
          <span className="sq-kicker">
            {new Date(memory.completedAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <h2>{q.name}</h2>
          <div className="sq-keepsake-ledger">
            <span>
              Little detour<strong>+{q.detourMinutes} demo min</strong>
            </span>
            <span>
              Something unexpected<strong>1 moment kept</strong>
            </span>
            <span className="sq-keepsake-total">
              Worth keeping<strong>Always.</strong>
            </span>
          </div>
          <p className="sq-challenge">{q.challenge}</p>
          <MemoryFields
            note={note}
            photo={photo}
            onNote={setNote}
            onPhoto={setPhoto}
          />
          <button
            className="sq-primary"
            onClick={() => {
              dispatch({ type: "edit-memory", id: memory.id, note, photo });
              dispatch({ type: "close" });
            }}
          >
            Save memory <Icon name="check" />
          </button>
          <button
            className="sq-text-button"
            onClick={() => {
              dispatch({ type: "edit-memory", id: memory.id, note, photo });
              if (state.prefs.enabled && state.prefs.location === "demo")
                dispatch({ type: "accept", id: q.id });
              else dispatch({ type: "screen", screen: "preferences" });
            }}
          >
            <Icon name="walk" />
            {state.prefs.enabled && state.prefs.location === "demo"
              ? "Save & walk here again"
              : "Set up Sidequests to revisit"}
          </button>
          <p className="sq-demo-note">
            No.{" "}
            {String(
              state.memories.length -
                state.memories.findIndex((m) => m.id === memory.id),
            ).padStart(3, "0")}{" "}
            · A seeded discovery. A memory that’s yours.
          </p>
        </div>
        <div className="sq-receipt-signoff">
          <span aria-hidden="true" className="sq-decorative-barcode" />
          <em>Thanks for going a little off-route.</em>
          <span>KEPT ON THIS BROWSER · NOT A PURCHASE</span>
        </div>
      </div>
    </Sheet>
  );
}
