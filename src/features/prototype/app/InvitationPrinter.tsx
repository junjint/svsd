import type { CSSProperties, Dispatch } from "react";
import { Icon } from "../Icons";
import { brushedMetal, logo, photos } from "./assets";
import { questById } from "./data";
import {
  eligibleQuests,
  emptyReason,
  type AppAction,
  type AppState,
} from "./model";
import { Sheet } from "./ui";

/** Rebecca's printer becomes a discovery ritual, not a replacement for the map. */
export function InvitationPrinter({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  const overlay = state.overlay;
  if (overlay?.kind !== "printer") return null;
  const quest = questById(overlay.questId);
  const active = questById(state.journey.activeQuestId);
  const available = eligibleQuests(state, true);
  const saved = !!quest && state.saved.includes(quest.id);
  return (
    <Sheet
      title="A little invitation"
      className="sq-printer-sheet"
      onClose={() => dispatch({ type: "close" })}
    >
      <div className="sq-printer-intro">
        <span className="sq-kicker">THE SIDEQUEST DISPENSARY</span>
        <h2>
          A little out
          <br />
          of the <em>ordinary.</em>
        </h2>
        <p>No itinerary. Just one small possibility.</p>
      </div>
      <div
        className="sq-dispenser"
        style={{ "--metal": `url('${brushedMetal}')` } as CSSProperties}
      >
        <div className="sq-printer-machine" aria-hidden="true">
          <i className="sq-screw a" />
          <i className="sq-screw b" />
          <i className="sq-screw c" />
          <i className="sq-screw d" />
          <div className="sq-printer-engraving">
            <img src={logo} alt="" />
            <span>SIDEQUEST</span>
          </div>
          <span className={`sq-printer-light ${quest ? "printed" : ""}`} />
          <div className="sq-printer-slot" />
        </div>
        <div className="sq-paper-feed">
          {quest ? (
            <article
              key={overlay.edition}
              className="sq-invitation-ticket"
              aria-label={`Printed invitation to ${quest.name}`}
            >
              <div className="sq-ticket-topline">
                <span>AN INVITATION, NOT A PLAN</span>
                <span>{String(overlay.edition).padStart(2, "0")}</span>
              </div>
              <img
                className="sq-ticket-photo"
                src={photos[quest.image]}
                alt={quest.descriptor}
              />
              <div className="sq-ticket-copy">
                <span className="sq-kicker">{quest.subtitle}</span>
                <h3>{quest.name}</h3>
                <p>{quest.descriptor}</p>
              </div>
              <div className="sq-ticket-perforation" />
              <div className="sq-ticket-stub">
                <span>
                  <Icon name="walk" /> +{quest.detourMinutes} min{" "}
                  <small>demo detour</small>
                </span>
                <span>
                  TAKE THE
                  <br />
                  INTERESTING WAY ↗
                </span>
              </div>
            </article>
          ) : (
            <div className="sq-blank-ticket">
              <img src={logo} alt="" />
              <span>
                GOOD THINGS
                <br />
                ARE A LITTLE
                <br />
                <em>off-route.</em>
              </span>
              <div className="sq-ticket-perforation" />
              <small>ONE INVITATION, JUST FOR THIS WALK</small>
            </div>
          )}
        </div>
      </div>
      <div className="sq-printer-actions" aria-live="polite">
        {active ? (
          <>
            <p>
              You already have a little adventure.
              <br />
              <strong>{active.name}</strong> is waiting.
            </p>
            <button
              className="sq-primary"
              onClick={() => dispatch({ type: "screen", screen: "map" })}
            >
              Back to your walk <Icon name="arrow" />
            </button>
          </>
        ) : quest ? (
          <>
            <button
              className="sq-primary"
              onClick={() => dispatch({ type: "accept", id: quest.id })}
            >
              Take the little detour <Icon name="arrow" />
            </button>
            <div className="sq-ticket-options">
              <button
                aria-pressed={saved}
                onClick={() => dispatch({ type: "save", id: quest.id })}
              >
                <Icon name={saved ? "check" : "bookmark"} />
                {saved ? "Saved for later" : "Save for later"}
              </button>
              <button
                disabled={available.length < 2}
                onClick={() => dispatch({ type: "print" })}
              >
                Another invitation <Icon name="replay" />
              </button>
            </div>
          </>
        ) : available.length ? (
          <>
            <button
              className="sq-primary"
              onClick={() => dispatch({ type: "print" })}
            >
              Print a little possibility <Icon name="plus" />
            </button>
            <button
              className="sq-text-button"
              onClick={() => dispatch({ type: "screen", screen: "map" })}
            >
              <Icon name="map" />
              Or, just keep walking
            </button>
          </>
        ) : (
          <>
            <p>{emptyReason(state)}</p>
            <button
              className="sq-primary"
              onClick={() =>
                dispatch({ type: "screen", screen: "preferences" })
              }
            >
              Adjust your preferences <Icon name="settings" />
            </button>
          </>
        )}
        <p className="sq-demo-note">
          A digital paper ritual · imagined places & demo estimates
        </p>
      </div>
    </Sheet>
  );
}
