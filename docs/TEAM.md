# Sidequest v2: team brief

The PM owns this file. **Read it in full before touching code.** The product spec is [`docs/SPEC.md`](SPEC.md). This file covers how the work is split and the rules everyone follows.

## Who owns what

You edit **only** the files your area owns. If you need something changed in a shared file, don't edit it. Work around it locally and list the request in your final report under **"Requests for PM"**.

| Area | Owns |
| --- | --- |
| **PM** (shared foundation) | `src/theme/**`, `src/stores/**`, `src/services/**`, `src/types/**`, `src/data/badges.ts`, `src/data/demoCities.ts`, `src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/(tabs)/wall.tsx`, `src/bencho/manifest.json`, `src/bencho/bencho-theme.css`, `scripts/**`, `docs/**`, `package.json`, `metro.config.js`, `app.json` |
| **Reveal** | `src/features/reveal/**`, `src/bencho/dom/**`, `src/bencho/blocks/**`, `src/bencho/patches/**`, `src/bencho/manifests/reveal.json`, `src/app/dev/**` |
| **Draw** | `src/app/(tabs)/draw.tsx`, `src/features/draw/**`, `src/bencho/manifests/draw.json` (see the note below on DOM blocks) |
| **Shell** | `src/app/(tabs)/_layout.tsx`, `src/app/onboarding.tsx` (or an `onboarding/` route folder), `src/features/onboarding/**`, `src/features/location/**`, `src/ui/**`, `src/bencho/manifests/shell.json` |
| **Folders & Profile** | `src/app/(tabs)/folders.tsx`, `src/app/(tabs)/profile.tsx`, `src/app/quest/[id].tsx`, `src/app/folder/[id].tsx`, `src/app/settings.tsx`, `src/features/folders/**`, `src/features/profile/**`, `src/features/quest/**`, `src/bencho/manifests/folders.json` |
| **Content** | `src/data/activities.ts`, `src/data/annArborPlaces.ts`, `src/data/nycPlaces.ts` (new), `src/services/places/MockPlaceProvider.ts`, `__tests__/content.test.ts` (new) |

**Who adds Bencho blocks:** only the Reveal designer vendors blocks into `src/bencho/blocks` and `src/bencho/dom`.
- If your area needs a DOM block (for example, Draw needs `slide-confirm` or `card-swap`), vendor it yourself, but name its files with your area as a prefix: `src/bencho/dom/draw-SlideConfirm.dom.tsx`, `src/bencho/blocks/SlideConfirm.tsx`.
- List the block in **your** area's manifest. Never edit files in those folders that another area created.

## Shared foundation (already built, use it)

**Theme: `@/theme`**
- Components: `Paper`, `Frost`, `FeatherImage`, `Text` (variants: `wordmark`, `display`, `title`, `headline`, `body`, `callout`, `caption`, `number`, `label`, `accent`, `prose`), `PillButton`, `GlassIconButton`, `CountPill`, `Logo`, `Decor`, `Glass` (Apple Liquid Glass: native on iOS 26 via expo-glass-effect, hand-built elsewhere; `clear` for controls, `ink` for the main action), `TornPaper` (every card: receipt paper with ripped top and bottom edges), `Barcode`, `DashRule`, `receiptInk`.
- Tokens: `color`, `radius`, `space`, `shadow`, `spring`, `rarityColor`, `FEATHER`.
- Plus Jakarta Sans is the interface face (use the `fonts.sans*` tokens) and EB Garamond is the sidequest's voice, with Garamond italic for accents. Use `Text` from `@/theme`, never React Native's `Text`, so the right font file is picked. The UI stays neutral: no colour accents (see SPEC §2.2).

**Store: `useSidequestStore` in `@/stores/sidequestStore`**
- State: `prefs`, `location`, `cityPrompt`, `quests`, `folders`, `badges`, `badgeQueue`, `draw`.
- Draw: `startDraw`, `setPhase`, `chooseActivity`, `rerollPlace`, `rerollActivity`, `toggleLockPlace`, `canReroll`, `go`, `saveForLater`, `discardDraw`.
- Quests and folders: `completeQuest` (creates a folder when there isn't one), `createFolder`, `addPhotos`, `updateFolder`, `removePhoto`, `deleteFolder`, `shiftBadge`.
- Location and prefs: `refreshLocation`, `setDemoCity`, `confirmCity`, `updatePrefs`, `completeOnboarding`.
- Read the file for exact signatures.

**Draw phases:** `shuffling → place → activity → result`, or `empty` when nothing fits. The Draw screen moves phases forward when a reveal calls `onRevealed`.

**Sound and haptics: `feedback(event)` from `@/services/sound`**
- Every event is listed in `src/services/sound/events.ts`. Use those names and never call expo-audio directly.
- Sound files are git-ignored and may be missing, in which case the app is silent. That's expected.
- Sounds always fire **natively**. A DOM block reports events through an async function prop, and the native side calls `feedback()`.

**Draw engine: `@/services/draw/engine` and `/rules`**
- `travelLabel` and `formatMiles` format distances.
- `REROLLS_PER_STAGE` is 2.

**Data**
- Badges: `@/data/badges` (`BADGES`, `newlyEarned`).
- Demo cities: `@/data/demoCities`, Ann Arbor and NYC. The web build has no GPS, so it uses demo cities.

**Interfaces with stubs (implement these, keep the names and props stable)**
- `@/features/reveal`: `PlaceReveal`, `ActivityReveal`, `ConfettiBurst`. Props are in `src/features/reveal/types.ts`. The Reveal designer implements them.
- `@/ui`: `LiquidToggle`, `RollingCounter`, `Sheet`, `showToast`. The Shell designer implements them.

## Visual direction (SPEC §2): modern, clean, sleek, playful

There are two references.

**1. "Pool" App Store screenshot**
- Off-white paper with a fine speckle texture.
- A centered serif wordmark ("Pool"), with a round avatar on the left that has a soft blue glow beneath it, and a red pill with a count ("712") on the right.
- A loose pile of 6–7 tilted cards in the middle. They're mixed media (photos, a poster, a product shot) at various angles, with soft shadows.
- Below the pile, rounded-square (squircle) tiles with soft grey edges, each with content spilling out of it, labeled "Recipes" with a grey count "345", and "Music" with "+ 4 New".
- A big cobalt serif headline above the phone.

**2. Photo-viewer screen recording**
- A frosted, warm off-white background.
- One image floating in the center with **feathered, blurred edges**, not a hard frame.
- Below it, a centered serif title ("Stars and eyes") with a small grey date underneath.
- Round frosted-glass buttons top-left (back) and top-right (grid).
- A **thumbnail filmstrip** pinned to the bottom, with the selected thumbnail larger and framed. Scrubbing it slides the main images sideways like a carousel, and the title **blurs out while you scrub**, then sharpens when you stop.
- Tapping the image opens it full-bleed with a small "4/13" counter at the top.

**Motion** is spring-based, with Reanimated 4 (damping 18, stiffness 180). Pressed elements scale to about 0.97. Every meaningful action pairs a sound with a haptic. Respect Reduce Motion (`AccessibilityInfo.isReduceMotionEnabled` or Reanimated's `useReducedMotion`).

**Layout:** phone first, designed at 393×852 (iPhone 16 Pro). On desktop web the app runs inside an iPhone frame (`DeviceFrame` in `@/ui`, ported from the Forum prototype), with a status bar, Dynamic Island, home indicator and the phone's safe areas. Inside it, use `useScreen()` from `@/ui` instead of `useWindowDimensions`, and `FrameModal` instead of React Native's `Modal`, so sizes and overlays stay inside the phone. Use generous whitespace, one main action per screen, and no visual clutter.

## Bencho

The `mcp__bencho__search_blocks` and `mcp__bencho__get_block` tools fetch blocks. Before writing a DOM component, read https://docs.expo.dev/guides/dom-components/. Expo is SDK 58 (see AGENTS.md: read versioned docs and don't trust memory).

**DOM mode** (the block's React and CSS run unchanged inside `'use dom'`):
1. Write `get_block`'s TSX and CSS **unchanged** to `src/bencho/blocks/.pristine/<Name>.tsx` and `.css`.
2. Copy them to `src/bencho/blocks/<Name>.tsx` and `.css`, then edit that copy:
   - replace hard-coded image paths with a `src` prop
   - add async callback props (`onRevealed`, `onTick`, and so on) where the source has sound stubs or end states
   - add a `revealNow` prop
   - map hover-only behaviour to touch or device motion
3. Run `npm run bencho:diff` to save the patch to `src/bencho/patches/`.
4. Write the wrapper at `src/bencho/dom/<Name>.dom.tsx`. It starts with `'use dom'`, imports `../bencho-theme.css` and the block's CSS, and renders the block.
5. List the block in your area manifest under `src/bencho/manifests/`.
6. Function props on DOM components must be async and serializable. Pass `dom={{ scrollEnabled: false }}` and set an explicit width and height style.

**Port mode** (rebuilt natively): read the block with `get_block` to learn its motion (springs, timings, structure), then write **your own** React Native and Reanimated code that reproduces the feel. Don't paste block source into committed files, because Bencho Pro is licensed.

`src/bencho/blocks/` and `src/bencho/patches/` are git-ignored. Never copy block source anywhere else.

## Rules

- `npx expo install <pkg>` is the only way to add packages. Ask the PM first by listing it in your report, unless it's clearly needed and tiny.
- **Don't use the browser.** The PM does visual QA. Check your work with:
  - `npx tsc --noEmit`, clean for your files. Note any errors in other areas' files without fixing them.
  - `npx jest`
  - `sh scripts/check-bundle.sh`, which asks the running dev server (port 8090) to bundle everything. It must say `bundle OK`.
- Don't commit, push or run git commands that change state. Don't restart the dev server.
- Write code like the existing foundation: TypeScript strict, small files, comments only where intent isn't obvious.
- Accessibility: every control has an `accessibilityLabel`. Touch targets are at least 44pt.

**End with a short report:**
- what you built (files)
- which Bencho blocks you used and in which mode
- what you verified, and how
- known gaps
- Requests for PM
