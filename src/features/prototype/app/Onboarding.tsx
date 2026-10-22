import type { Dispatch } from "react";
import { Icon } from "../Icons";
import { logo, photos } from "./assets";
import { categories } from "./data";
import type { AppAction, AppState } from "./model";
import { IconButton, Toggle } from "./ui";

export function InterestChips({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  return (
    <div className="sq-interests">
      {categories.map((c) => (
        <button
          key={c.id}
          aria-pressed={state.prefs.categories.includes(c.id)}
          onClick={() =>
            dispatch({
              type: "prefs",
              patch: {
                categories: state.prefs.categories.includes(c.id)
                  ? state.prefs.categories.filter((id) => id !== c.id)
                  : [...state.prefs.categories, c.id],
              },
            })
          }
        >
          <Icon name={c.icon} />
          {c.label}
        </button>
      ))}
    </div>
  );
}
export function Onboarding({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  return (
    <section className={`sq-onboarding sq-onboard-${state.step}`}>
      {state.step === 0 ? (
        <>
          <div className="sq-welcome-photo">
            <img
              src={photos.fountain}
              alt="Sunlit fountain tucked into a leafy courtyard"
            />
          </div>
          <div className="sq-welcome-copy">
            <img className="sq-brand" src={logo} alt="Sidequest" />
            <span className="sq-kicker">MAKE ROOM FOR THE UNEXPECTED</span>
            <h1>
              A little off
              <br />
              your <em>usual way.</em>
            </h1>
            <p>
              Small discoveries, woven into
              <br />
              the walks you’re already taking.
            </p>
            <button
              className="sq-primary"
              onClick={() => dispatch({ type: "onboard-next" })}
            >
              Let’s wander <Icon name="arrow" />
            </button>
            <small>A simulated iPhone experience</small>
          </div>
        </>
      ) : (
        <>
          <div className="sq-onboard-top">
            <IconButton
              icon="back"
              label="Previous onboarding step"
              onClick={() => dispatch({ type: "onboard-back" })}
            />
            <img src={logo} alt="Sidequest" />
            <span>{state.step + 1} / 3</span>
          </div>
          {state.step === 1 ? (
            <div className="sq-onboard-body">
              <span className="sq-kicker">YOUR WALK, YOUR PACE</span>
              <h1>
                Leave a little
                <br />
                room for <em>curiosity.</em>
              </h1>
              <div className="sq-setting-row">
                <div>
                  <strong>Sidequests</strong>
                  <small>Little invitations along the way</small>
                </div>
                <Toggle
                  label="Enable Sidequests"
                  checked={state.prefs.enabled}
                  onChange={(enabled) =>
                    dispatch({ type: "prefs", patch: { enabled } })
                  }
                />
              </div>
              <label className="sq-range-label">
                How far would you wander?
                <strong>
                  {state.prefs.radius < 1000
                    ? `${state.prefs.radius} m`
                    : `${(state.prefs.radius / 1000).toFixed(1)} km`}
                </strong>
                <input
                  aria-label="Discovery radius"
                  type="range"
                  min="200"
                  max="2000"
                  step="100"
                  value={state.prefs.radius}
                  onChange={(e) =>
                    dispatch({
                      type: "prefs",
                      patch: { radius: Number(e.target.value) },
                    })
                  }
                />
                <span>
                  Just nearby<span>A little further</span>
                </span>
              </label>
              <p className="sq-caption">WHAT CATCHES YOUR EYE?</p>
              <InterestChips state={state} dispatch={dispatch} />
              <button
                className="sq-primary sq-onboard-next"
                onClick={() => dispatch({ type: "onboard-next" })}
              >
                That sounds like me <Icon name="arrow" />
              </button>
            </div>
          ) : (
            <div className="sq-onboard-body">
              <span className="sq-kicker">ONLY WHEN IT MATTERS</span>
              <h1>
                A quiet nudge.
                <br />A <em>small adventure.</em>
              </h1>
              <p className="sq-muted">
                Choose what Sidequest can do.
                <br />
                You’re always in control.
              </p>
              <div className="sq-permission-rows">
                <button
                  onClick={() =>
                    dispatch({ type: "permission", permission: "location" })
                  }
                >
                  <Icon name="location" />
                  <span>
                    <strong>Find something nearby</strong>
                    <small>Use a seeded Ann Arbor location</small>
                  </span>
                  <span className="sq-permission-value">
                    {state.prefs.location === "demo" ? "On" : "Set up"}
                  </span>
                </button>
                <button
                  onClick={() =>
                    dispatch({
                      type: "permission",
                      permission: "notifications",
                    })
                  }
                >
                  <Icon name="bell" />
                  <span>
                    <strong>A timely little invitation</strong>
                    <small>Show simulated notification banners</small>
                  </span>
                  <span className="sq-permission-value">
                    {state.prefs.notifications ? "On" : "Set up"}
                  </span>
                </button>
              </div>
              <p className="sq-demo-note">
                Demo permissions only. No GPS, system notifications, or
                background access is requested.
              </p>
              <button
                className="sq-primary"
                onClick={() =>
                  dispatch({ type: "finish-onboarding", mode: "guided" })
                }
              >
                Take the guided walk <Icon name="arrow" />
              </button>
              <button
                className="sq-text-button"
                onClick={() =>
                  dispatch({ type: "finish-onboarding", mode: "explore" })
                }
              >
                I’ll explore on my own
              </button>
            </div>
          )}
        </>
      )}
      <div className="sq-onboard-dots" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <i key={i} className={state.step === i ? "active" : ""} />
        ))}
      </div>
    </section>
  );
}
export function PermissionPrompt({
  state,
  dispatch,
}: {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}) {
  if (!state.permission) return null;
  const location = state.permission === "location";
  return (
    <div className="sq-alert-scrim">
      <div
        className="sq-alert"
        role="alertdialog"
        aria-modal="true"
        aria-label={
          location ? "Demo location permission" : "Demo notification permission"
        }
      >
        <img src={logo} alt="" />
        <h2>
          {location
            ? "Allow “Sidequest” to use your location?"
            : "“Sidequest” would like to send you notifications"}
        </h2>
        <p>
          {location
            ? "Find small discoveries near your walk. This demo uses a simulated Ann Arbor location."
            : "A quiet invitation when something interesting is nearby. These banners stay inside this phone."}
        </p>
        <small>SIMULATED iOS PERMISSION</small>
        <button
          autoFocus
          onClick={() => dispatch({ type: "answer-permission", allow: true })}
        >
          {location ? "Allow While Using Demo" : "Allow"}
        </button>
        <button
          onClick={() => dispatch({ type: "answer-permission", allow: false })}
        >
          Don’t Allow
        </button>
      </div>
    </div>
  );
}
