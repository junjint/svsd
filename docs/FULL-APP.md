# Archived map-first prototype

Superseded October 22: this guide describes the previous prototype. The active app now uses Rebecca’s actual printer-first baseline with a focused walking integration. See [the current guide](REBECCA-BASELINE.md).

The recovered Expo 58 project retains the original iPhone frame, branding, EB Garamond, paper palette, grain and photographic direction. The active interface uses Plus Jakarta Sans. `Prototype.web.tsx` exports the full app by default and preserves the earlier implementation as `CinematicPrototype`. The old reducer, tests, SVG map and guide remain available.

## Screens and behavior

- Every reload directly starts the animated guided walk with a reliable session-only demo preset, preserving the remembered preference baseline, bookmarks and memories. Historical onboarding remains reachable after explicit reset, not as the default presentation entry.
- Simplified Apple Maps-inspired stage: local cream city blocks, soft green campus areas, only four road labels, a blue route and location halo, walking maneuver card, compass, pan/zoom, destination search, recenter and route overview. No external map tiles or business/building clutter; only the relevant quest marker is revealed in Guided mode.
- Separate drop-down notification banners: state-triggered entrance, tap, swipe/close, timed exit. An expired/suppressed banner does not delete the opportunity on the map.
- Photo-first quest sheet: short descriptor, expandable story, Accept/Skip/Save. All four discoveries are clearly fictional demo content.
- Meaningful rerouting: keep the original destination, draw a new intermediate leg, animate progress, change quests, cancel/skip and resume.
- System surfaces: Maps walking activity is visible from the start. A separate notification opens a Maps → Sidequest handoff sheet. Acceptance automatically expands the Sidequest Live Activity once per journey/quest; route progress waits while inspecting it. Continue walking collapses it; tap reopens the quest and hold/right-click/Arrow Down expands it. Focus wrapping, Escape and stale-timer guards apply. These are browser simulations, not native ActivityKit.
- Arrival: distinct notification, photographic destination sheet, observation challenge, optional 180-character note and local photo. Completion is duplicate-safe and resumes the original walk.
- Library / + / Profile: three stable bottom slots. The central + opens the invitation printer; a persistent “Your walk” shortcut returns from Library or Profile even after scrolling. The map remains the starting screen and walking surface.
- Invitation printer: the teammate's actual brushed-metal material, digital paper-feed animation, photographic invitation, perforated stub and serrated edge. Print another cycles eligible places, Save bookmarks without accepting, and Take the detour uses the existing route transition. Printing alone never starts a journey, records completion or replaces an active detour. Quiet mode still permits manual requests; other eligibility filters remain enforced.
- Library: Discovered/Saved galleries, dates, totals, numbered photographic keepsake receipts and editable receipt detail with real visit data, notes and photos. The receipt ledger is non-monetary and clearly not a purchase.
- Selective teammate integration: a collapsible photo-day calendar with month navigation and day filtering, cancelable hold-to-keep completion (Enter also works), and a working “Save & walk here again” action on memories. See `TEAMMATE-INTEGRATION.md` for commit attribution and skipped changes.
- Profile: soft photographic banner from the latest kept visit (garden fallback), local identity and real places/days/demo-minute stats. Existing preferences remain directly below: enabled, radius, maximum detour, six categories, banners, quiet mode, frequency, demo location, replay and confirmed reset. No fake account or extra setup.

Guided and Explore share the same reducer and screens. The first presentation suggestion arrives after five one-second walking ticks, and arrival after about 34 active detour ticks. The five-stage walkthrough also offers Show notification, Preview arrival and Replay controls. The original-destination walk can continue afterward. Presentation replay uses fresh demo defaults without overwriting remembered preferences; deliberate setting edits still take effect and persist. “Explore freely” restores the remembered baseline. All eligibility gates remain active for the current session settings.

## Architecture and persistence

- `app/model.ts`: explicit journey states, eligibility, banner lifecycle, clock, completion, edits and defensive persistence.
- `app/data.ts`: seeded quest repository, three destinations and approximate Ann Arbor street graph.
- `app/geo.ts`: Dijkstra over the local graph, projected endpoint connectors, length and distance-based interpolation. Not verified directions.
- `app/InteractiveMap.web.tsx`: isolated Leaflet renderer boundary and `MapHandle`, original local vectors, geographic markers/routes and camera controls. `mapScene.ts` supplies a bounded sparse block/label scene. Future MapKit rendering can replace this component.
- `app/SystemSurfaces.tsx`: independent banners and Live Activity with gesture timer cleanup.
- `app/Onboarding.tsx`, `MapHome.tsx`, `QuestViews.tsx`, `LibraryAndPreferences.tsx`: connected screens and reusable sheets.
- `app/ui.tsx`: status bar, controls, focus-contained sheets and drag-to-dismiss.
- `app/App.tsx`: hydration, one simulation clock, persistence, overlays, tabs and storage-error reporting.
- `app/demo.ts`, `navigation.css`: derived five-stage walkthrough, local route cues and Apple Maps-inspired styling. No Apple map data or native integration is claimed.
- `app/InvitationPrinter.tsx`, `WalkShortcut.tsx`, `paper.css`: the adapted printer, persistent map entry, font replacement and paper/metal design layer. No duplicate store or persistence migration.

LocalStorage key: `sidequest:app:v3`. Preferences, completed memories, bookmarks, selected destination and serial persist. `launch-demo` restores those records, then starts fresh guided navigation; banners, overlays and old progress are not restored. `demoSavedPrefs` is session-only and never serialized; persistence uses the remembered baseline plus explicit preference edits. Corrupt data safely launches the demo. Storage quota/privacy failures produce a visible warning. Photos are validated as JPG/PNG/WebP, limited to 12 MB input and compressed to 720 px JPEG locally; no upload occurs.

## Live versus simulated

Live: working interface/state, browser-local storage/photo handling and map pan/zoom. The map scene is bundled, tile-free local vector artwork.

Simulated: phone/status bar, permissions, banners, Dynamic Island/Live Activities, walking/location, routes and times, all four quest places and their stories. Generated images are not documentary Ann Arbor photographs. No fabricated ratings, hours or availability appear. No accounts, API keys, background GPS, push service or native Apple Maps integration are needed.

The simplified map needs no token or network map requests. City blocks and green areas are abstract presentation geometry, not surveyed footprints or an accurate Apple basemap. The seeded street graph remains the route source. No Apple Maps renderer, live routing or location enrichment is implied.

## Verification

Run typecheck, focused lint, Jest and Expo web export. Tests cover permission choices, banner timing/expiry/dismissal, every preference filter, quiet/manual modes, frequency/pause, changing/canceling quests, arrival, duplicate-safe completion, note/photo persistence, corrupt state, replay/reset and geographic routes.

October 22 presentation pass: **90 tests across five suites pass**, along with typecheck, focused lint, web export and whitespace checks. Seven added tests cover fresh/corrupt reload launching a moving demo, preserved collections and remembered preference baselines, explicit preference edits and Explore restoration, deterministic replay/stale-preview guards, inspecting the Live Activity without advancing the walk, the five stages/zero-length arrival route, and bounded sparse map geometry. Browser QA verified the complete automatic-notification → handoff → automatic expanded activity → arrival → completion path, keyboard focus wrapping/Escape, Library persistence followed by reload to stage 1, remembered “Rarely” frequency returning in Explore, map zoom/recenter/overview, and rapid map-to-Library teardown. There were no new browser warnings/errors, no horizontal overflow, four road labels, zero tile images and zero device scroll offset. QA used a separate origin, leaving the user's localhost data alone.

Browser QA covers onboarding, permission alerts, banner tap, island tap/long-press, accepted/canceled routes, automatic arrival, note completion/edit, reload persistence, saved gallery, settings, guided replay and free exploration. Native file-picker selection may require a human in this host; photo state persistence is covered by tests. Reduced-motion styling applies throughout. Leaflet's unused default image URLs cause Expo CSS warnings; this app uses custom div icons and controls instead.

Full-repo lint still reports 61 errors and 17 warnings in disconnected historical modules. Focused lint checks the reachable app without hiding those legacy failures. Native builds retain the prior browser-preview fallback.
