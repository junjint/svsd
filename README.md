# Sidequest

**Life's better with sidequests.**

Sidequest is a mobile-first Expo app that discovers interesting places near you and occasionally invites spontaneous, walkable detours — framed as miniature adventures with a personal journal.

**v2 build spec (gacha draw, folders, trophies, wall, Bencho UI + sounds): [`docs/SPEC.md`](docs/SPEC.md)**

This repository contains the **functional infrastructure** (routing, discovery, recommendations, location, notifications, quest lifecycle, journal, demo mode) plus a minimal **editorial design system**.

### Design system

BeReal-level chrome restraint: black/white UI only. Color arrives exclusively through picture stickers that lead, trail, or sit between type.

- Tokens & components: `src/design/`
- Spec: [`src/design/DESIGN.md`](src/design/DESIGN.md)
- Type: Schibsted Grotesk (poster neo-grotesque, giant display) · white + grain · stickers only for color
- Poster refs: `assets/design/ref-festival-bandeiras.jpg`, `ref-poster-brush.jpg`, `ref-a2-noir.png`

## Quick start

```bash
cp .env.example .env
npm install
npm start
```

Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code.

### Web prototype (browser)

```bash
npm run prototype
# → http://localhost:8080
```

Or, if `dist/` already exists from a prior export:

```bash
npm run prototype:serve
```

Demo path in the UI: complete onboarding → **Developer / Demo tools** → simulate walk → accept → arrive → journal.

### Native development builds

Background location, geofencing, and some notification behaviors require a **development build** (not Expo Go alone for all features):

```bash
# iOS (macOS + Xcode)
npx expo run:ios

# Android (Android Studio / emulator or device)
npx expo run:android
```

Or with EAS:

```bash
npx eas-cli@latest build --profile development --platform ios
npx eas-cli@latest build --profile development --platform android
```

Configure secrets via `.env` (see `.env.example`). Never put Google Places or Supabase **service-role** keys in the mobile client.

## Simulated demo (no API keys / no walking)

1. Launch the app and complete onboarding (or skip location).
2. Open **Developer / Demo tools** from Home or Settings.
3. Reset location to **downtown Ann Arbor**.
4. Set interests to coffee / art / bookstores.
5. Enable exploration.
6. Tap **Simulate walking into a new area + notify**.
7. Open the suggested sidequest → Accept → Open directions.
8. Tap **Simulate arrival** → **Complete & write journal chapter**.
9. Confirm the chapter appears under **Journal**.

Demo places are labeled `[DEMO]` / `[CURATED DEMO]`. The same lifecycle powers real-world mode.

## Architecture overview

```
src/
  app/                  Expo Router screens (onboarding, tabs, quest, demo)
  components/           Functional placeholder UI
  constants/            Narrative hooks & notification copy
  data/                 Ann Arbor demo places
  services/
    discovery/          Orchestrates search → score → notify
    journal/            Chapter creation & stats
    location/           Permissions, foreground/background monitoring, geofences
    navigation/         External Apple/Google Maps deep links
    notifications/      Local notifications + log
    places/             Mock / Curated / Google providers + facade
    recommendation/     Weighted scoring, cooldowns, quiet hours
    persistence/        AsyncStorage
    sidequest/          Status state machine
    supabase/           Optional client (disabled without env)
  stores/               Zustand app state
  types/                Shared domain models
supabase/migrations/    Optional Postgres schema
backend/                Example Places proxy (server-side key)
```

### Place providers

`PlaceProvider.searchNearby(location, radius, categories, filters)`

| Provider | Role |
| --- | --- |
| `MockPlaceProvider` | Full demo dataset around downtown Ann Arbor |
| `CuratedPlaceProvider` | Pop-ups / unusual spaces with event windows |
| `GooglePlacesProvider` | Places API (New) via `EXPO_PUBLIC_PLACES_BACKEND_URL` |

Set `EXPO_PUBLIC_PLACE_PROVIDER` to `mock` (default), `google`, `curated`, or `composite`.

### Recommendation engine

Weighted scoring: interest, proximity, novelty, context (hours/budget/travel mode), surprise, story potential — then weighted random among top candidates. Feedback (accept/dismiss/save/complete) is stored for future tuning.

### Discovery & notifications

- Opt-in foreground location first; background only after explicit enable.
- Energy-aware updates + geofencing when permitted; OS may defer delivery.
- Defaults: ≤2 unsolicited notifications/day, 3h cooldown, quiet hours 10pm–8am, 7-day duplicate suppression.
- Foreground-only fallback when background is denied.
- Exploration toggle immediately stops monitoring.

## Scripts

```bash
npm start          # Expo dev server
npm run ios        # Native iOS build/run
npm run android    # Native Android build/run
npm test           # Recommendation, cooldown, lifecycle tests
npm run typecheck  # TypeScript
```

## Database

Apply `supabase/migrations/001_sidequest_schema.sql` when enabling Supabase. Tables: `users`, `user_preferences`, `places`, `sidequests`, `user_sidequests`, `story_chapters`, `recommendation_feedback`, `notification_preferences`.

The app runs fully offline with AsyncStorage until Supabase env vars are set.

## What needs a real device / credentials / more production work

| Capability | Requirement |
| --- | --- |
| Accurate GPS + arrival detection | Physical device, foreground location permission |
| Background discovery / geofencing | Dev build + background location permission; OS-limited reliability |
| Local notification delivery | Notification permission; background delivery varies by OS |
| Live Google Places results | Backend with `GOOGLE_PLACES_API_KEY` + `EXPO_PUBLIC_PLACES_BACKEND_URL` |
| Synced accounts / cloud journal | Supabase URL + anon key; auth + RLS policies |
| Photo sync | Storage bucket + privacy review |
| Production maps SDK keys | Platform-specific Maps API keys if required by store builds |
| Design system / branding | Intentionally deferred |

## Privacy notes

- No silent tracking before permission.
- No unnecessary precise movement history.
- Journal chapters are private by default.
- Clear personal data from Settings.

## License

See `LICENSE`.
