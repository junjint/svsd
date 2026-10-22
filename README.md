# Sidequest

Rebecca’s printer-first Sidequest app, with a focused iOS-style walking demo added alongside it.

The active app uses Rebecca Sun’s `8516b88` baseline: brushed-metal printer, thermal receipts, Plus Jakarta Sans, Library / + / Profile tabs, folders, photo calendar and hold-to-finish. Maps is a secondary integration, not a replacement design system.

## Preview

```sh
npm install
npm run web -- --port 49870
```

Open `http://localhost:49870/`. Web entry opens the original animated printer home. Print a Sidequest, reroll a line and slide to go. “Get directions” in its folder opens the walking demo for that quest. The small arrow at the top-left of home starts a generic walking example.

In the generic demo, a nearby notification appears after four active walking ticks. Open the original receipt sheet and choose “Take this detour.” A simulated expanded Live Activity appears; “Continue walking” collapses it. Tap or hold the island to expand again. The simple map supports pan, zoom, recenter and pause. Arrival follows automatically, or use “Preview arrival.” Open the notification and hold to finish (keyboard activation is also available). The completed quest appears in the same Library as printed quests.

Maps, location movement, estimates, notification banners and Live Activities are browser simulations. The map is a local schematic SVG, not geographic navigation or Apple MapKit tiles. No native ActivityKit, background notifications, GPS permission or Apple Maps extension is implemented. The walking integration currently targets web; native routes show an explanatory fallback.

Existing native-store data is preserved. Earlier browser-preview memories and bookmarks are imported once into the shared Library with stable IDs; notes, actual visit dates and supported local photo data are retained. Old fallback imagery is not turned into a personal photo. Data remains local. Rebecca’s seeded sample Library remains available.

## Checks

```sh
npm run typecheck
npm run lint:integration
npm test -- --runInBand
npx expo export --platform web
```

The active app is `src/app`, `src/features/draw`, folders/profile/quest modules and `src/theme`. The focused integration is `src/features/navigation`. The earlier map-first UI in `src/features/prototype` is retained but unmounted; only its data catalog supports migration. Full-repository lint still reports issues in restored/older modules; focused integration lint passes.

See [current architecture and verification](docs/REBECCA-BASELINE.md). Earlier prototype guides are historical, not the active app specification.

See [LICENSE](LICENSE).
