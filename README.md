# Sidequest

**A little off your usual way.**

A complete browser-local Sidequest concept app, inside the existing realistic iPhone. Walk, receive a notification, discover a detour, and return to your original destination with a memory worth keeping.

Leaflet provides interactive OpenStreetMap tiles with a local vector fallback. Quest places, walking, approximate route estimates, iOS permissions, notification banners and Live Activities are simulated. No account or API key is required. This is not an Apple Maps extension or native ActivityKit implementation.

## Preview

```sh
npm install
npm run web
```

Or build and serve a production preview:

```sh
npm run prototype
```

The recovered development session uses `BROWSER=none npm run web -- --port 49870` at **http://localhost:49870/**. To serve an existing export, use `npm run prototype:serve`.

## Walk through it

Complete onboarding, enabling the demo location and simulated banners for the full guided walk. A notification appears after five walking ticks. Tap it for a photo-first sheet, then accept, skip or save. Acceptance redraws the route and starts a separate Dynamic Island activity. Tap the island to revisit the quest; hold, right-click or Arrow Down to expand its controls. Arrival follows about 34 Guided detour ticks. Keep an optional note or local photo, complete the discovery, and resume the original walk.

Explore mode includes map pan/zoom, destination selection, four seeded quests, route overview, cancellation, manual discovery, saved places and editable memories. All preference controls affect behavior. Quiet mode suppresses automatic suggestions; notification-off hides banners but leaves the map opportunity available. Replay is in Preferences. Three bottom tabs, sheet close/drag gestures and Escape provide navigation. Motion respects reduced-motion preferences.

Preferences, bookmarks, notes and locally compressed photos persist in this browser. Active simulated journeys deliberately reset on reload. Photos never leave the browser. The original logo, paper palette and EB Garamond remain; the active interface now uses Plus Jakarta Sans. The Library / + / Profile bar includes an invitation printer, numbered keepsake receipts, and a persistent “Your walk” map shortcut. See [the app guide](docs/FULL-APP.md), [Apple integration status](docs/APPLE-INTEGRATION.md), and [image provenance](assets/prototype/README.md).

## Checks

```sh
npm run typecheck
npm run lint:prototype
npm test -- --runInBand
npx expo export --platform web
```

The active app lives in `src/features/prototype/app/`. The earlier cinematic implementation, reducer, illustration and [guide](docs/LEGACY-CINEMATIC.md) remain preserved. Historical mobile modules and [the previous spec](docs/SPEC.md) stay disconnected. Full-repository lint includes those legacy modules (61 existing errors, 17 warnings); focused lint checks reachable app code. Native builds retain the browser-preview message; this concept targets web.

See [LICENSE](LICENSE).
