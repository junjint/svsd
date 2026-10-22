# Rebecca baseline + walking integration

Updated October 22, 2026, at the user’s request to simplify the app and base the entire design system on Rebecca’s latest push.

## Source of truth

Fetched Rebecca Sun’s `origin/master` commit `8516b8893c5f07379b4ebeeb1d715658cba62c5c` (“Library/+/Profile tabs, hold-to-finish flow, brushed-metal printer, Plus Jakarta Sans”). Restored its actual `src` and `assets` implementation, not a visual approximation in the earlier custom web app. No remote branches were changed.

The previous non-ignored working tree is preserved in local snapshot `8ade2f0`, branch `codex/safety-before-rebecca-restructure-20261022`. Ignored credentials/dependencies were excluded. Old prototype files remain for history, tests and the data-only migration, but their UI is no longer mounted.

## Design and navigation

- Original ThemeProvider, typography, paper/ink tokens, glass controls, device frame and sheets.
- Original square brushed-metal printer, chrome arch, idle-paper animation, badges, receipt printing/rerolls and slide-to-go.
- Original Library / + / Profile floating bar, folders, photo/note flows, profile/calendar and settings.
- Web `/` opens `/draw`. No old map-first dashboard, walkthrough rail or separate preference system.
- Home’s small arrow opens `/walk` for a generic iOS demo. Existing folder/quest “Get directions” calls the central `startNavigation` entry with a real quest ID.

## Only new product surface: walking

`WalkingScreen.web.tsx`, `walking.css` and the pure `walkFlow.ts` reducer provide the focused secondary screen. A schematic map, blue route/location, sparse street labels and simple controls keep the map legible. Routes and time estimates are approximate demo geometry, not real directions.

Generic sequence: walk → nearby banner → Rebecca Receipt in Rebecca Sheet → explicit accept → expanded Live Activity → continue → arrival banner → Rebecca HoldToComplete → same Library folder → original walk resumes. A specific quest starts directly with its walking activity. Missing IDs fail gracefully. Replay resets presentation without deleting saved quests. Dismissing a nearby banner keeps its discovery available. Closing an arrival sheet does not falsely complete the quest.

The system overlay is a small extension to DeviceFrame’s portal, above its existing status bar. It cleans up on unmount. Expanded activity contains keyboard focus and supports Escape. Banners support dismiss/swipe-up; the map pans/zooms/recenters; timers and holds clean up. Completion has a one-shot guard and keyboard/assistive activation.

This is not native ActivityKit, a system notification extension, MapKit, background GPS, or an Apple Maps plug-in. No external map tiles, new APIs or dependencies were added. Native builds show an explanatory walking fallback.

## Shared data

All new quests/folders use the existing Zustand `useSidequestStore` and AsyncStorage, not a parallel collection. Accepting a detour leaves any printer draw intact. Completion updates the real native quest and drives existing Library/Profile statistics.

`importPreview.ts` imports earlier `sidequest:app:v3` memories/bookmarks once. IDs are deterministic and hydration deduplicates against existing native records. Visit dates, notes and supported local JPEG/PNG/WebP photo data are preserved. Corrupt/unknown records and remote photo URLs are rejected. Generated fallback imagery is not relabeled as a user photo. The original v3 blob is left untouched except when the user explicitly confirms “Clear all data”; the import marker is written only after persistence succeeds.

## Compatibility fixes

Small non-visual fixes preserve the incoming UI: folders’ landing animation now clears its route parameter after the animation rather than cancelling its own timers; settings’ radius sync is deferred/cleaned up; HoldToComplete cleans up its timer/animation and guards repeated completion. The original slide-to-go also accepts Enter/Space without changing its appearance or native gesture. The explicit `walk.web.tsx` route ensures Metro uses the web integration.

## Verified

- TypeScript check passes.
- `npm run lint:integration` passes for app routes and integration seams.
- 100 tests pass across 6 suites, including walking transitions, replay, interruption, interpolation and migration safeguards.
- Production web export succeeds.
- Browser QA: original home, printer settings/printing/reroll and keyboard-confirmed slide-to-go; Library/Profile/settings navigation; nearby notification dismissal and receipt handoff; acceptance and Live Activity; pause/pan/zoom/recenter; keyboard focus/Escape; automatic arrival, early-release cancellation, full hold and keyboard completion; completed folder/note and reload persistence.
- No errors/warnings observed during the fresh focused browser run.

Full-source ESLint is not clean: 61 errors and 18 warnings remain across restored/older modules (mostly React Compiler/shared-value mutation and effect rules). This is not masked by rule changes; the focused integration command is separate. Native builds, real GPS, native notification delivery, native ActivityKit and personal-photo picker access have not been verified.

The pre-restructure safety snapshot remains available locally; see the branch reference above.
