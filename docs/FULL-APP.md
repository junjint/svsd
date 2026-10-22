# Sidequest — full interactive app

The recovered Expo 58 project retains the original iPhone frame, branding, EB Garamond, paper palette, grain and photographic direction. The active interface uses Plus Jakarta Sans. `Prototype.web.tsx` exports the full app by default and preserves the earlier implementation as `CinematicPrototype`. The old reducer, tests, SVG map and guide remain available.

## Screens and behavior

- Three short onboarding steps: introduction, enabled/radius/interests, and simulated location/notification permissions. Denials remain valid choices.
- Interactive Ann Arbor map: pan/zoom, location, destination search, seeded markers, start/end/pause, recenter and route overview.
- Separate drop-down notification banners: state-triggered entrance, tap, swipe/close, timed exit. An expired/suppressed banner does not delete the opportunity on the map.
- Photo-first quest sheet: short descriptor, expandable story, Accept/Skip/Save. All four discoveries are clearly fictional demo content.
- Meaningful rerouting: keep the original destination, draw a new intermediate leg, animate progress, change quests, cancel/skip and resume.
- Active-task Dynamic Island: compact progress, tap to relevant quest, hold/right-click/Arrow Down to expand, collapse, open and end controls. It is not the discovery notification or preview sheet.
- Arrival: distinct notification, photographic destination sheet, observation challenge, optional 180-character note and local photo. Completion is duplicate-safe and resumes the original walk.
- Library / + / Profile: three stable bottom slots. The central + opens the invitation printer; a persistent “Your walk” shortcut returns from Library or Profile even after scrolling. The map remains the starting screen and walking surface.
- Invitation printer: the teammate's actual brushed-metal material, digital paper-feed animation, photographic invitation, perforated stub and serrated edge. Print another cycles eligible places, Save bookmarks without accepting, and Take the detour uses the existing route transition. Printing alone never starts a journey, records completion or replaces an active detour. Quiet mode still permits manual requests; other eligibility filters remain enforced.
- Library: Discovered/Saved galleries, dates, totals, numbered photographic keepsake receipts and editable receipt detail with real visit data, notes and photos. The receipt ledger is non-monetary and clearly not a purchase.
- Selective teammate integration: a collapsible photo-day calendar with month navigation and day filtering, cancelable hold-to-keep completion (Enter also works), and a working “Save & walk here again” action on memories. See `TEAMMATE-INTEGRATION.md` for commit attribution and skipped changes.
- Profile: soft photographic banner from the latest kept visit (garden fallback), local identity and real places/days/demo-minute stats. Existing preferences remain directly below: enabled, radius, maximum detour, six categories, banners, quiet mode, frequency, demo location, replay and confirmed reset. No fake account or extra setup.

Guided and Explore share the same reducer and screens. At default preferences, the first Guided suggestion arrives after five one-second walking ticks, and arrival after about 34 detour ticks. Reading/interacting naturally produces a roughly 60–90 second presentation. The original-destination walk can continue afterward. Guided replay resets the journey but preserves collected memories and preferences; disabled/location-off/quiet filters remain respected in Guided too.

## Architecture and persistence

- `app/model.ts`: explicit journey states, eligibility, banner lifecycle, clock, completion, edits and defensive persistence.
- `app/data.ts`: seeded quest repository, three destinations and approximate Ann Arbor street graph.
- `app/geo.ts`: Dijkstra over the local graph, projected endpoint connectors, length and distance-based interpolation. Not verified directions.
- `app/InteractiveMap.web.tsx`: isolated Leaflet renderer boundary and `MapHandle`, tiles, geographic markers/routes, camera controls and local vector fallback. Future MapKit rendering can replace this component.
- `app/SystemSurfaces.tsx`: independent banners and Live Activity with gesture timer cleanup.
- `app/Onboarding.tsx`, `MapHome.tsx`, `QuestViews.tsx`, `LibraryAndPreferences.tsx`: connected screens and reusable sheets.
- `app/ui.tsx`: status bar, controls, focus-contained sheets and drag-to-dismiss.
- `app/App.tsx`: hydration, one simulation clock, persistence, overlays, tabs and storage-error reporting.
- `app/InvitationPrinter.tsx`, `WalkShortcut.tsx`, `paper.css`: the adapted printer, persistent map entry, font replacement and paper/metal design layer. No duplicate store or persistence migration.

LocalStorage key: `sidequest:app:v3`. Preferences, completed memories, bookmarks, selected destination and serial persist. Active navigation, banners and overlays intentionally reset on reload. Corrupt data falls back safely. Storage quota/privacy failures produce a visible warning. Photos are validated as JPG/PNG/WebP, limited to 12 MB input and compressed to 720 px JPEG locally; no upload occurs.

## Live versus simulated

Live: working interface/state, browser-local storage/photo handling, map pan/zoom, internet basemap tiles.

Simulated: phone/status bar, permissions, banners, Dynamic Island/Live Activities, walking/location, routes and times, all four quest places and their stories. Generated images are not documentary Ann Arbor photographs. No fabricated ratings, hours or availability appear. No accounts, API keys, background GPS, push service or native Apple Maps integration are needed.

The map uses ordinary browser tile requests/caching, with visible attribution and no bulk download. Network failure reveals the local interactive vector graph. Follow the [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/); select a production tile service before broad public deployment.

## Verification

Run typecheck, focused lint, Jest and Expo web export. Tests cover permission choices, banner timing/expiry/dismissal, every preference filter, quiet/manual modes, frequency/pause, changing/canceling quests, arrival, duplicate-safe completion, note/photo persistence, corrupt state, replay/reset and geographic routes.

Browser QA covers onboarding, permission alerts, banner tap, island tap/long-press, accepted/canceled routes, automatic arrival, note completion/edit, reload persistence, saved gallery, settings, guided replay and free exploration. Native file-picker selection may require a human in this host; photo state persistence is covered by tests. Reduced-motion styling applies throughout. Leaflet's unused default image URLs cause Expo CSS warnings; this app uses custom div icons and controls instead.

Full-repo lint still reports 61 errors and 17 warnings in disconnected historical modules. Focused lint checks the reachable app without hiding those legacy failures. Native builds retain the prior browser-preview fallback.
