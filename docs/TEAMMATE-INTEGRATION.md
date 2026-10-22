# Selective teammate integration

Reviewed incoming `origin/master` commit **8516b8893c5f07379b4ebeeb1d715658cba62c5c**, Rebecca Sun, October 21, 2026: “Library/+/Profile tabs, hold-to-finish flow, brushed-metal printer, Plus Jakarta Sans.” It is the only fetched commit beyond our `eefac89` base; no separate remote teammate branches exist. The author, changed files and direct source inspection identify it as the relevant contribution, not merely its recency. The commit changes 51 files (+1502/−624).

Before integration, all non-ignored working-tree changes, new source and image assets were captured using a temporary Git index in local safety commit **703a258**, branch `codex/safety-sidequest-before-integration-20261021`. This left the normal index, working branch and uncommitted files unchanged. Ignored credentials/dependencies were not committed. The incoming commit is also retained by local reference `codex/teammate-rebecca-8516b88`.

`git fetch --all --prune` updated the remote-tracking reference; no broad merge, cherry-pick, working-branch switch, shared-branch write or push was performed. The selected ideas were integrated manually against the full-app working tree. `master` intentionally remains one remote commit behind because that entire commit would replace the current product with the old Draw architecture.

## Decisions

Updated October 22 at the user's explicit request: the initially skipped font, printer, receipt and tab ideas are now incorporated in the current walking app. This supersedes the earlier no-receipts constraint. A second non-ignored working-tree safety snapshot is retained as **c869a6b**, `codex/safety-sidequest-before-printer-20261022`.

| Incoming contribution | Decision | Integrated result / reason |
| --- | --- | --- |
| Photo-day Sidequest calendar | Adapted | Collapsible calendar in Memories, Monday alignment, month navigation, photographic completed days and day filtering. Uses **completedAt**, not a folder’s acceptance/creation date; every memory on a day remains reachable instead of only the first. |
| 1400 ms hold-to-finish | Adapted | Intentional arrival completion with live fill, cancellation on early release/drag-away/blur, unmount cleanup and one-shot completion. Enter/assistive activation remains available without a timed gesture. |
| Central “Get directions” entry | Adapted | “Save & walk here again” on memory detail calls the existing `accept` navigation transition, keeps note/photo edits and original destination, respects enabled/location settings, and never creates a memory until a new visit is completed. The incoming `startNavigation` body only showed “Directions are coming soon”, so it was not copied. |
| Desktop hover feedback and glass clipping | Adopted/adapted | Restrained feedback on existing controls; no alternate component/theme context. Web shell uses `overflow: clip` to prevent off-screen focus from scrolling the whole device, while sheets/pages keep their own scroll. |
| Library / + / Profile, fixed tab positions | Adapted on follow-up | Three stable slots; + launches the printer as an action, not a replacement route/store. Map stays the starting/walking surface, with a persistent “Your walk” shortcut on both other pages. |
| Brushed-metal printer and paper/receipt flow | Adapted on follow-up | Reused the actual brushed texture from 8516b88 unchanged. The printer dispenses an animated photographic invitation; acceptance uses our existing map route. Completed visits become numbered Library keepsakes and editable receipt details, with perforation, a paper edge and a non-monetary ledger. No hardware/physical printing claim. |
| Plus Jakarta Sans replacement | Adopted on follow-up | Local 400/500/600 font files via Expo Asset and CSS faces replace the active interface fonts. EB Garamond's editorial voice remains. Added the font package with Expo install; archived Inter dependency remains for historical code. |
| Profile photo banner / avatar treatment | Visually adapted on follow-up | Latest kept visit's image supplies a blurred cover; a chrome-like logo avatar and actual visit statistics lead into existing preferences. No account, extra picker or onboarding. Country flags/multiple cities remain out of scope. |
| Badge carousel and Draw chip/party mechanics | Skipped | The printer uses the existing radius/category/duration eligibility and saved history; no disconnected gamification or second discovery system. |
| Folder filters, collection landing animation, hover-reveal tabs | Skipped as duplicate/conflicting | Existing saved/discovered collections, preference categories, gallery entrance motion and fixed tabs remain. No duplicate folder/store or collecting-badges mechanic was added. |

## Architecture and files

The current reducer, preferences, localStorage schema, map adapter, banners, active-task Dynamic Island and Guided/Explore modes remain authoritative. There is no second store, native Draw UI or persistence migration. The only new package for the follow-up is the requested Plus Jakarta Sans font. `InvitationPrinter.tsx`, `WalkShortcut.tsx` and `paper.css` provide the new interaction and visual layer.

- Added `app/calendar.ts` and `MemoryCalendar.tsx`: pure local-day/month helpers and a progressively disclosed gallery calendar.
- Added `app/hold.ts` and `HoldToKeep.tsx`: renderer-independent cancelable hold controller and accessible web control; source provenance is retained in comments.
- Updated `LibraryAndPreferences.tsx`: calendar/day-filter integration and filter clearing when switching collections.
- Updated `QuestViews.tsx`, `App.tsx`, `model.ts`: intentional completion, shared memory-to-navigation entry, and preference checks at the navigation transition itself.
- Updated `app.css`: calendar/hold styling, clipped device focus behavior and subtle pointer-hover states, under existing reduced-motion rules.
- Updated `InteractiveMap.web.tsx`: browser QA exposed a WebKit/Leaflet CSS-zoom timeout firing after map teardown. Camera motion now uses cancelable `flyTo`/`flyToBounds` frames and honors reduced motion, with unsafe CSS zoom disabled. Rapid zoom-to-tab navigation no longer produces the error; map SVG sizing was rechecked.
- Extended `__tests__/prototype.test.ts`: hold cancellation/cleanup/one-shot/accessible activation, local completion dates, leap/year boundaries, multi-memory day filtering, revisit/edit/destination retention and preference gates.

## Verification

The initial integration passed typecheck, focused lint, production web export and diff whitespace checks, with 77 tests. The follow-up adds six printer/navigation tests: preview-only state, cycling/bookmarks, all eligibility gates, quiet/manual and active-detour protection, normal acceptance/completion/persistence, and map return from either tab. **83 tests across 5 suites pass.** Full-repository lint remains in disconnected legacy modules; it was not disabled or rewritten.

An isolated `127.0.0.1:49870` browser origin kept QA data separate from the user's `localhost:49870` session. Verified the complete Guided notification → accept → automatic arrival → hold completion → original-route journey; early-release cancellation and keyboard completion; island hold/expand/collapse; notification dismissal; save/skip, alternate quest and cancel; calendar month/day selection/clear with multiple same-day visits; edit-and-revisit; saved memories/settings after reload; Explore mode; and rapid map zoom/tab changes. Final clean-run logs contain no new errors. The calendar stays inside the phone with no horizontal overflow; the device's scroll offset remains zero while pages/sheets scroll independently.

QA found and repaired a browser animation-frame binding error in the initial hold adaptation, then retested both short and successful holds. No new runtime or authentication dependency remains. The existing project development server stays at `http://localhost:49870/`; no duplicate server or restart was needed.

No API keys or new permissions are required. Existing limits remain: simulated iOS/walking/route estimates and seeded quest places, no authenticated MapKit/Apple business enrichment, browser-local persistence, and native builds retaining their browser-preview fallback.

### October 22 paper-design follow-up QA

Typecheck, focused lint, all 83 Jest tests, production web export and whitespace checks pass. Full-project lint is still exactly 61 errors / 17 warnings in the historical modules. Export includes the three local Jakarta font weights and the teammate's brushed texture.

Isolated browser QA verified print / save / reprint; printed-ticket acceptance into an actual map detour; active-detour protection; arrival and intentional completion; the new numbered Library receipt; receipt editing and note persistence after reload; disabled Sidequests recovery; quiet-mode manual printing; keyboard focus wrapping and Escape; and rapid zoom-to-Library navigation. At a 545 px Profile scroll offset, the map shortcut remained fixed and clickable, with no horizontal overflow and device scroll offset zero. The QA tab recorded no new warnings or errors. The user's localhost session and data were not used for testing.

The Sites local-only workflow kept the existing checkout and preview server, with no registration, publication or second app. These design decisions are an adaptation of Rebecca's contribution into the current map-first prototype, not a broad Git merge.
