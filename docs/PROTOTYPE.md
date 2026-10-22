# Archived cinematic prototype

This document describes the preserved earlier six-scene implementation, not the active full app. See [the full-app guide](FULL-APP.md) for current features and behavior.

## One phone, one little detour

This is a simulated iPhone experience, rather than a standalone app or an editorial presentation. Every interaction and transition is clipped to a single persistent device screen. The only presentation controls are a previous arrow, six tiny progress dots, and replay, inside the phone above the home indicator.

## Sequence

1. **Navigation:** Start walking toward Michigan Union. The map shifts and the location breathes.
2. **Opportunity:** After 2.2 seconds, the hardware island widens into a compact Sidequest Live Activity. Tap it.
3. **Preview:** The same black surface expands around a courtyard photograph, a place name, a one-line descriptor, and two choices. “Not now” collapses the island and resumes ordinary navigation, without completing a quest or immediately prompting again.
4. **Detour:** Accepting collapses the preview to a Live Activity. The original route becomes a quiet dashed line, a warm detour draws itself, and the simulated location follows it. Arrival occurs after 7.8 seconds; the small arrow in the navigation sheet can advance immediately when presenting.
5. **Arrival:** The photograph expands into the screen. One restrained cream card offers a moment to pause and “Lovely. Let’s go.”
6. **Return:** Navigation resumes to Michigan Union with an updated route and ETA. A brief completion Live Activity collapses after three seconds, leaving ordinary Maps again.

The full flow is easy to present in under a minute. Replay resets all scene state. Backtracking cancels scene timers and restores valid previous states. The reducer rejects automatic transitions belonging to a different moment. Returning to the initial scene via Back pauses the walkthrough until the user starts again.

## Architecture

- `story.ts`: six moments, explicit start/advance/dismiss/back/replay/settle actions, and locally defined sample place data.
- `Prototype.web.tsx`: one device, native-style status bar, a persistent morphing island, a persistent image layer shared by preview and arrival, scene-owned timers with cleanup, and accessible playback controls.
- `JourneyMap.tsx`: existing original SVG map, route strokes, and position marker. Only its camera and the simulated route move; the device never turns into a larger canvas.
- `prototype.css`: container-relative screen geometry, width-and-height fitting, titanium device edges, island springs, image transitions, route drawing, and reduced-motion overrides.

The old website header, editorial headings, external annotations, wide map stage, settings, alternate discovery, and memory UI have been removed from the active experience. Existing Sidequest theme tokens, logo, paper grain, and bundled fonts remain the brand foundations. Black is used for the native-style Dynamic Island surface.

The arrival photograph is illustrative, not a verified image of a real Ann Arbor listing. It is generated specifically for this fictional discovery. The local file is `assets/prototype/fountain-courtyard.png`; generation details are saved in `assets/prototype/README.md`. No runtime asset URLs or external photo services are used.

## Verification

Use `npm run typecheck`, `npm run lint:prototype`, `npm test -- --runInBand`, and `npx expo export --platform web`. Browser-check the accept/dismiss branches, automatic arrival, completion collapse, back/replay during playback, and phone fitting at desktop and small mobile dimensions.

The full-repository lint command still includes historical modules with existing lint errors. The focused check covers all reachable application code and the new reducer tests.
