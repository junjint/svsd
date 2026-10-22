# Sidequest v2 — Build Spec

> A slot machine for spontaneous, optional adventures near you.
> iOS-first · Expo SDK 58 · React Native · Bencho UI blocks + sounds

Status: draft · 2026-10-19

---

## 1. Product

**Who it's for:** Gen Z, in two situations:
- **The traveler** doesn't know the city.
- **The local in a rut** has done everything nearby and can't think of anything new.

**Why now:** Sidequesting means doing spontaneous, optional things that don't lead anywhere in particular. It's a reaction against optimizing every hour and against living for social media, and it comes from wanting autonomy and wonder. Doing whatever you want sounds great, but thinking of *what* to do is the hard part. Sidequest supplies the idea, and you still make the call.

**Principles**
1. **One button.** The home screen has a single main action. Everything else is secondary.
2. **Chance, not a feed.** Results are *revealed*, not ranked. The surprise is the product.
3. **Touch is the fun.** Results are scratched and peeled open with a finger, never just faded in.
4. **Optional by design.** Rerolling or walking away carries no penalty, guilt or streaks.
5. **Small and doable.** A quest takes 15 minutes to 3 hours and costs little or nothing.
6. **Private by default.** You choose to share, one quest at a time.

---

## 2. Visual direction (replaces the Moon design system)

This build drops the current Moon / DM Sans system in `src/design/` entirely. It's based on two references: the *Pool* App Store screenshot and the photo-viewer screen recording (2026-10-19).

**Mood:** modern, clean, sleek and playful. White paper with a little texture, objects that feel physical (cards, foil, glass), one confident accent color, and motion that feels like handling something real.

### 2.1 What we take from each reference

| Reference | What we use |
| --- | --- |
| **Pool** | Fine speckled paper background. Serif wordmark centered in the header. A **pile of tilted cards** as the hero object. **Squircle folder tiles** with content spilling out, each labeled with a count ("Recipes · 345", "Music · +4 New"). A glowing avatar top-left and a red count pill top-right. A cobalt serif headline. |
| **Photo viewer** | A single image floating on a frosted, warm-white backdrop, with **edges feathered** into the background instead of a hard frame. The title and date sit below in a centered serif. A **thumbnail filmstrip scrubber** pinned to the bottom, with the selected thumbnail framed. Round frosted-glass icon buttons (back and grid). The title **blurs out while scrubbing** and sharpens when it settles. Tapping the image goes full-bleed with a "4/13" counter. |

### 2.2 Tokens

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#FBFAF7`, flat, no grain | app background |
| `frost` | `rgba(251,250,247,0.74)` + blur | glass buttons, sheets, tab bar |
| `ink` | `#15100E` | primary text, icons, the CTA and selected states |
| `ink-2` | `#827973` | secondary text, tracked-caps labels |
| `ink-3` | `#B9B2AC` | tertiary text |
| `line` | `#ECE8E3` | hairlines |
| `mist` | `#F0EDE8` | grey chips, pills and wells |
| *(no colour accent)* | | The interface stays neutral (off-white, greys, ink, white). Colour comes only from content: photos, places, and the rarity foils. Folder glows are the folder's own photo, blurred. |
| `signal` | `#B5402E` | destructive actions only |
| `foil-common` | brushed silver (the Bencho scratch-card default) | Common reveal |
| `foil-rare` | holographic band (the Bencho holo layer) | Rare reveal |
| `foil-legendary` | gold-tinted holo (`#F7D774 → #FFB547 → #F5E6B8`) | Legendary reveal |

**Shape:** cards use radius 22, squircle tiles 28, pills 999. Every photo is shown with a 12px **feathered edge** (mask gradient), as in the photo-viewer reference.

**Shadow:** a soft, floaty y-offset: `0 18 40 rgba(17,17,20,0.10)`, plus `0 2 6 rgba(17,17,20,0.06)`.

**Type**
- **Interface: Plus Jakarta Sans** (`@expo-google-fonts/plus-jakarta-sans`, 400/500/600/700/800; replaced Inter on 2026-10-21). Screen titles are Jakarta Bold with tight tracking (about −4%). Labels are 11pt Jakarta Medium in tracked caps (+0.9). Body and buttons are Jakarta. Receipts keep Space Mono.
- **The sidequest's voice: EB Garamond** (`@expo-google-fonts/eb-garamond`). Prompts, activity text on cards, and notes are set in Garamond. **Garamond italic** is the accent beside Jakarta: counts like "(12)", index numbers like "01", and "fin."
- The pairing follows the Kinetic Design Brushes reference: heavy grotesk plus italic serif accents on off-white paper.
- `Text` in `@/theme` picks the right font file for each weight and style, because custom fonts ship one file per weight.

**Logo and decor:** the chrome "side" brushstroke wordmark (`assets/brand/side-logo*.png`). Chrome ornaments live in `assets/decor/` and are used sparingly through `Decor`: the wire arch framing the Deck, the swallow (onboarding, a page's closing "fin."), and the lion (trophy case crest, the empty draw).

**Motion:** spring-first, using Reanimated 4, which is already installed. Defaults are damping 18 and stiffness 180. Every reveal pairs a **sound with a haptic** (see section 5). Honor Reduce Motion: reveals become a cross-fade, and sounds still play.

**Remove:** `src/design/tokens.ts`, `stickers.ts`, `Poster.tsx`, `Sticker.tsx`, and the moon assets. Rebuild `ThemeProvider` around these tokens and add `src/design/bencho-theme.css` (see §6.3).

---

## 3. Core loop: the Draw

> **Changed 2026-10-21: the Draw is now a receipt printer.** The deck and the in-draw scratch/peel/card reveals are retired from the Draw (the scratch card still demos in onboarding).
> - A static, top-down thermal printer sits near the middle of the home screen (`src/features/draw/printer/`). It never moves.
> - **Print a sidequest** (or tapping the printer) feeds a receipt out of the slot in one smooth, steady pull, footer first (after Rebecca's reference video). The paper lies over the printer's front. Tear off, ✕ and reprints cut the receipt and drop it off the bottom of the page.
> - The receipt is Space Mono "thermal ink", warm near-black with a slight bleed. A generated crinkle map multiplies over the paper and an ink-dropout map (specks, faint head banding) screens over it (`assets/receipt/`).
> - It reads only what's needed: logo, city and date, the place with its walk time, and the activity in large type. Nothing that tells people how to do it (no type, rarity, cost or time).
> - Under it: **Reprint** place or activity (2 each, lock place), **Slide to go**, **Save for later**, and **Tear off**. A glass ✕ floats top right while a receipt is out.
> - **Slide to go** (demo flow, 2026-10-21) skips the in-progress screen: it files the sidequest straight into a new folder and opens its page, where people add photos or delete it ("Delete this sidequest" removes the folder and the quest).
> - **Folders:** a tap opens the sidequest's page; press and hold (hover on the web) fans the photos out. Folders use Bencho's Blue/Pink/Lilac plus Mint/Peach, cycling so neighbours differ. Reprints tear the receipt away and print a new one. Legendary still bursts confetti.
> - **Tabs (2026-10-21):** Library | + | Profile. The Wall is gone (the app is about your own sidequesting). The + is the Draw: pressing it opens the New sidequest sheet. Folders is now called **Library**, and folders can't be made by hand: every folder is one sidequest.
> - **Profile:** a blurred-photo banner with the avatar on its edge, name with Edit and Settings, a rule, then Sidequests / Cities / Photos. Below it, a month calendar of circles: a day you sidequested shows a photo from it, and tapping it opens that sidequest.
> - **Tab bar:** Library and Profile have fixed-width slots, so the + never moves; the only way to Profile is the tab bar. Glass layers each carry their own corner radius (Chrome doesn't clip a backdrop-filter to a parent's rounded corners).
> - **Draw framing:** the chrome wire arch stands over the idle printer and fades out while a receipt is out. (The filigree under it was tried and dropped: too small to read.)
> - **Draw is one fixed page (no scrolling):** controls sit in a bottom dock (New sidequest idle; Place/Activity reprints + Slide to go once printed). After the idle note tears off, the arch fades and the printer glides up into its place to make room for the receipt. Nothing above the printer changes size during a print, so there's no jump.
> - **New sidequest sheet:** four flat outline chips (Meal, Snack, Nature, Focus), none picked when the sheet opens; tap to pick, tap again to let go. Nothing picked = Random. The party stepper keeps its slot when Solo, fading in and out, so the toggle never shifts.
> - **Hover (web/iPad pointer):** every button answers a pointer. PressScale and PillButton rise ~2% and pass hover down through `HoverContext`, so Glass inside brightens (clear glass tints warm grey, ink glass lifts a shade, shadows deepen). Chips take a faint wash and darker outline. Slide to go tints its track, leans the handle 7pt toward the end and shows a grab cursor. Icon buttons grow 6%.
> - **Get directions:** the sidequest page has an ink "Get directions" button under the place details (place · walk time). It calls `startNavigation()` in `src/features/navigation/startNavigation.ts`, the single merge point for the separately prototyped Google Maps flow; for now it shows a "coming soon" toast.
> - **Start → finish (2026-10-21):** Slide to go now *starts* the sidequest: it files it into a new folder and opens its page (in progress). The page ends with a press-and-hold **Hold to finish sidequest** button (1.4 s; ink fills from the left, ticks while held, drains if let go early); full, it marks the quest complete (badges, celebration). Delete moved to the ⋯ menu only ("Delete sidequest"); "Add more photos" is gone (the dashed Add tile does it). Active sidequests in Library always open their page.
> - **Badge carousel:** earned badges drift right to left under the idle printer (22 pt/s, endless), entering and leaving through a faint grainy frost at the screen edges (web: every layer masked by an ellipse anchored at the edge, so the frost has no visible border); it fades with the arch when a print starts.
> - **Decor:** chrome lion crest top-right of Library; Profile banner = most colourful photo, blurred and saturated, with the wire arch and chrome swallow on top. Favicon is the chrome swallow.
> - **City line:** shows the country's flag beside the city (from location; `UserLocation.country`). The sheet behind it is distance only; a manual city/country picker was tried and removed (2026-10-21), the app follows location.
> - **Transitions (2026-10-21):** the New sidequest pill fades in place (no exit animation, which used to shrink it to the left). Slide to go keeps the receipt up until the sidequest page has arrived, then clears it out of sight; on web the page brings its own rise-and-fade entrance (iOS keeps the native push). Finishing (hold) shows "Sidequest complete" for a beat, then backs out to Library (`/folders?just=<folder>`): that folder springs into place at the top, fans open and tucks in, and any badge earned is celebrated there.
> - **Printer finish:** brushed aluminium. Gradients carry the light, a generated grain (`assets/printer/brushed.webp`) is laid over them in overlay blend, with a chrome rim, a darker front face and four screws.
> - **Profile photo and banner:** tap the avatar to pick a photo (re-encoded, no location). The banner picks the most colourful sidequest photo (Hasler–Süsstrunk colourfulness, measured on a 32px canvas on web; seeded scores on iOS).
> - The sections below describe the earlier deck version and are kept for history.

> **Changed 2026-10-22: the story layer.** Direction by Fable, built by Opus 5.5. The thread: a story that isn't fed to you is written by chance and by small things other people leave behind.
> - **Suggest a sidequest:** a glass speech-bubble button top left of the Draw (and a card on Profile) opens a sheet: a place (with "how far from you" and "what kind of place" chips), something to do there, or both. It goes straight into the current city's pool (`UserPlaceProvider`, `source: 'user'`; activities via `userActivitiesFor`), stored on device under `v2Suggestions`. One a day by the local calendar; after that the sheet shows today's slip. No moderation in this build, and no counts or likes anywhere.
> - **The place draw is now uniform:** `scoreForDraw` and the top-8 weighting are gone. Every open place in the radius has the same odds, so a suggestion from yesterday is as likely as a landmark. (The mock provider's nearest-25 cut is lifted for the draw too.)
> - **Badges:** Word of Mouth, Local Knowledge, Cartographer, Folklore at 1 / 5 / 10 / 25 suggestions (a day, a week, two weeks, a month of showing up). They're struck SVG medals with a Garamond numeral (`BadgeArt`). Local Legend now means finishing a sidequest at a place you suggested. Celebrations show on Draw, Profile and Library, only on the screen in front.
> - **Map (`/map`):** Get directions opens a simulated 3D paper-model of the city (three.js on web, an isometric SVG elsewhere): it finds you, then draws a walking route to the place, with Open in Maps for the real thing. Browsing (the city line sheet, **Look around**) shows a random 14 identical pins, reshuffled every visit; tap one to read a line about it. No search, no list, no ratings, no counts.
> - **Why Sidequest:** onboarding opens with "Nothing here is / fed to you." under the ornate arch, and the same story lives at Settings > Why Sidequest (`/about`).
> - **Just for you (2026-10-22, after the merge with Jun's walk):** Profile has no Gallery and no public/private toggle, and folders lose "Save to Gallery": Sidequest isn't a social format. Profile keeps the banner, calendar, trophies and the Suggest card.
> - **Get directions opens Jun's walk (`/walk?quest=`)**, restyled to the app: paper map with ink route and pins (no blue), glass buttons with drawn icons, a torn-paper route card in Garamond, and a Live Activity in ink and white. The paper-model `/map` stays for Look around. The header's walking-demo shortcut is gone; top left is Suggest only.

### 3.1 Home = the Draw screen

```
┌──────────────────────────────────┐
│ (◉)        Sidequest         [3] │  avatar glow · serif wordmark · signal pill = active quests
│                                  │
│     New York City · 2 mi ▾       │  tap → radius sheet
│                                  │
│        ╱▔▔╲ ╱▔▔▔╲                │
│      ▕ ?  ▕ ?   ▕ ╲   ← the Deck │  tilted face-down cards (Bencho swipe-deck / card-swap)
│        ╲__╱ ╲___╱ ▕              │
│                                  │
│  Meal  Snack  Nature  Focus  ✦   │  quest-type chips (✦ = Random)
│  Solo ◐ With others   [ − 3 + ]  │  Bencho liq-toggle + rolling-counter
│                                  │
│   ╭──────────────────────────╮   │
│   │     Draw a sidequest     │   │  THE CTA (cobalt pill); tapping the Deck does the same
│   ╰──────────────────────────╯   │
│  ⟡ Draw     ▢ Folders   ◎ Wall   ☺ │  Bencho tab-bar
└──────────────────────────────────┘
```

**Quest types** (pick one; the default is ✦ Random):

| Type | Draws places like | Example activity |
| --- | --- | --- |
| Meal | restaurants, food halls, markets | order the dish you can't pronounce |
| Snack | bakeries, cafés, carts | rate three pastries out of 10 |
| Nature | parks, waterfronts, gardens | collect pretty leaves for bookmarks |
| Focus | libraries, cafés, benches, plazas (sub-toggle: Indoor / Outdoor / Any) | 45 minutes of sketching, phone face-down |
| ✦ Random | anything | anything (the system also picks the type) |

**Party:** a Solo ↔ With others toggle. With others shows a stepper from 2 to 8+. Party size filters activities by `minParty`/`maxParty` and changes the copy ("you each…", "split up and…").

### 3.2 The two-stage reveal

Tapping **Draw** makes the deck shuffle: the Bencho *card-swap* animation, with the **Shuffle** sound and a haptic tick on each card. The top card flies forward and becomes the reveal surface.

**Stage 1, the Place, is a scratch card.**
- The card is covered in foil, using the Bencho `scratch-card` block. The foil color shows the rarity of the draw before you scratch: silver, holo or gold.
- Scratch it with a finger. Flakes fall, and the **Scratch** sound plays in short bursts (no more than one every 70ms). Once 55% is cleared, the rest of the foil lifts off.
- Underneath is a feathered photo of the place and a serif line: *"While you're in New York City, go to* **Herald Square**." Below that: distance, walk or transit time, open now, and cost tier.

**Stage 2, the Activity, is a second scratch card.**
- The place card slides up and a fresh foil card slides in under it, using the same Bencho `scratch-card` block. The foil color matches the draw's rarity.
- Scratch it the same way, with the **Scratch** sound. Once 55% is cleared, the foil lifts off with the **Reveal** sound and the activity shows in serif: **"Feed the pigeons."**
- *(Changed 2026-10-21: the foggy-glass reveal was removed from the app.)*

**The result card** stacks the place over the activity, shows the party chip, and has three actions:
- **Go**: Bencho `slide-confirm`. Sliding to commit feels like a decision.
- **Save for later**
- **Reroll**

**Skip reveal:** every reveal surface (both scratch cards and the §3.3 variants) has a small frosted **Skip** text button in its top-right corner, visible from the start.
- Tapping it plays the reveal's finish animation and sound right away.
- Skipping counts as a normal reveal for rerolls and rarity. It only shows up in the metrics (§11).
- **Always skip reveals** in Profile → Settings turns reveals off entirely: the result card appears straight after the shuffle.
- With Reduce Motion or VoiceOver on, reveals are skipped automatically, and the result is read aloud.

### 3.3 Variety in how results are revealed

To keep the draw from feeling repetitive, every 4th draw (and every Legendary draw) uses a different reveal for one stage, chosen at random:

| Reveal | Bencho block | Gesture |
| --- | --- | --- |
| Peel the sticker | `page-peel` | peel the corner back to find the note |
| Pick a card | `card-fan` | three face-down cards; press one to rise and flip |
| Flip the coin | `coin` | fling the coin, and heads or tails decides between two activities |
| Spin the drum | `option-wheel` | flick the drum, and it slows down and lands |

The scratch card remains the signature reveal for both stages, the one that people come to associate with the app.

### 3.4 Rerolls and rarity

- **Rerolls:** each stage can be rerolled 2 times per draw. After that the deck reshuffles and you start a fresh draw. You can also **lock** the place and reroll only the activity.
- **Rarity** is flavor only and never sold. Draws are weighted 75% Common, 22% Rare and 3% Legendary.
- **A Legendary draw** gets a gold foil, a different reveal, **confetti** (the Bencho `confetti` block) when the result appears, and the **Legendary** sound.

---

## 4. The rest of the app

### 4.1 Location, radius and city changes
- **Radius:** 0.5 to 20 miles, with presets 0.5 / 2 / 5 / 10 / 20. Set with the Bencho `progress` tick scrubber, so you scrub along the ticks and the value shows as you go. Shown in miles in the US and km elsewhere.
- **Getting there:** under about 1.5 miles we show walking time. Further than that, we show transit or driving time and deep-link to maps through the existing `src/services/navigation/maps.ts`.
- **City detection:** when the app opens, `expo-location` `reverseGeocodeAsync` checks the city against the one you last confirmed. If it's different, a sheet slides up with the **Arrive** sound: *"Welcome to Chicago 👋 Set your radius and vibe for here?"* It's prefilled with your previous settings.
- **Permission:** *When in use* only. Background location, geofencing and push discovery are removed in this build.

### 4.2 Quest lifecycle and Folders
- **Go** starts the quest using the existing state machine in `src/services/sidequest/lifecycle.ts`: `accepted → en_route → arrived → completed`, or `abandoned`.
- **An active quest isn't a folder yet.** It lives in an **Active** strip at the top of the Folders tab, and the red count pill on Draw home shows how many there are.
- **Folders are created in two ways:**
  1. **When a quest is finished.** Tapping *Complete* creates the quest's folder and opens it so you can add photos.
  2. **When you make one yourself.** A **+ New folder** tile in the Folders grid lets you name a folder, add photos and optionally attach it to an active or completed quest. You can also make a folder from an active quest's card ("Make a folder now"), so photos taken mid-quest have somewhere to go.
- **Abandoning a quest** never deletes a folder you made by hand.
- **The Folders tab** is a 2-column grid of squircle tiles, like Pool's folder tiles. Each tile uses the Bencho `folder` block: its photos stick out of the folder, and pressing a tile fans them out. The label shows the place and a count ("Herald Square · 12", or "+3 New" after adding photos).
- **Folder detail** follows the photo-viewer reference:
  - one feathered photo floating on frost
  - the serif title "Feed the pigeons" with the date underneath
  - a thumbnail filmstrip scrubber at the bottom; the title blurs while you scrub (Bencho `text-blur`)
  - tap the photo for full-bleed with an "n/N" counter
  - round glass back and grid buttons
- **Adding photos:** `expo-image-picker` adds photos, with the **Shutter** sound. Location data (EXIF GPS) is stripped from every photo before it's saved.
- **Notes:** an optional note, mood and rating, carried over from the `StoryChapter` fields. Friends are tagged by name only in v2.
- **Folder kinds:** *Quest* (linked to a sidequest) or *Freeform* (made by hand and not linked). You can **save either kind to Gallery**, the subset of folders shown on your profile.

### 4.3 Profile and Trophy case
- **Header:** avatar with a soft cobalt glow, display name and home city. Three stats use the Bencho `rolling-counter` (display only): quests, cities and legendary draws.
- **Visibility:** a Bencho `liq-toggle` switches between Public and Private for the profile and Gallery. The default is Private.
- **Trophy case:** a grid of badge tiles using the Bencho `tilt` card, so a badge sinks under your thumb. Locked badges are frosted silhouettes. When you earn one, a sheet appears with confetti and the **Badge** sound.

| Badge | Rule |
| --- | --- |
| First Sidequest | complete 1 |
| Seasoned Sidequester | complete 5 |
| Main Character | complete 25 |
| Globetrotter | complete quests in 3 cities |
| Squad Up | complete 1 with a party of 3 or more |
| Lone Wolf | complete 10 solo |
| Lucky Draw | complete a Legendary |
| No Rerolls | complete a quest drawn with zero rerolls |
| Local Legend | complete a sidequest at a place you suggested |
| Touch Grass | 5 Nature quests |
| Word of Mouth | suggest 1 sidequest |
| Local Knowledge | suggest 5 |
| Cartographer | suggest 10 |
| Folklore | suggest 25 |

Badge rules live in data (`src/data/badges.ts`) and are checked each time a quest is completed or a suggestion goes in.

### 4.4 Suggest a sidequest (crowdsourcing)

*(Rewritten 2026-10-22.)*

**Entry points:** the speech-bubble button top left of the Draw, and the "Suggest a sidequest" card on Profile.

**The sheet:** a place ("Somewhere worth a detour") with how far from you (Right here / A short walk / Across town) and what kind (Food, Coffee or sweets, Outside, Quiet, Art or culture, Something else), and something to do there ("One small thing"). Either or both. We never ask for an exact pin: the place lands at a seeded spot in that distance ring.

**After submitting:** it joins the pool for the current city right away, with the same odds as everything else. "In the pool. Someone might draw it today." One a day; the sheet then shows today's slip until tomorrow.

**Later, with accounts:** suggestions sync to Supabase and join other people's pools, with a profanity filter and reporting. Still no counts, likes or ranking.

### 4.5 The Sidequesters wall (global feed)

The **Wall** tab is a masonry feed of quests people chose to post. Each post shows a feathered photo, "Feed the pigeons @ Herald Square, NYC", the party size and how long ago it was posted.

**Interactions**
- Filter with a segmented control: **Everywhere** or **This city**.
- Pull to refresh with the Bencho `pull` block and the **Refresh** sound.
- New photos load with the Bencho `image-shimmer` placeholder.
- One reaction, ✨ *I'd do this*, using Bencho `emoji-reactions` (a single emoji). It saves that place and activity to your own draw seeds.

**Posting:** you post from a completed folder only. A private profile can still post; the post just doesn't link back to the profile.

**Safety**
- Nothing can be posted while a quest is in progress, so a post never reveals where someone is right now.
- Posts can be reported, and 3 reports hide a post automatically.
- You can block users.
- Onboarding includes a 13+ age gate.

### 4.6 Navigation (iOS tab bar)

| Tab | Screen | Replaces |
| --- | --- | --- |
| **Draw** | the deck (home) | `(tabs)/home.tsx` + `discover.tsx` |
| **Folders** | quest folders | `(tabs)/journal.tsx` |
| **Wall** | global feed | new |
| **Profile** | trophy case, gallery, visibility, settings, suggest | `(tabs)/settings.tsx` moves inside |

- **Tab bar:** Bencho `tab-bar`. The selected tab expands to show its name, and a light tile slides under it on a spring.
- **Onboarding** is 3 screens:
  1. what a sidequest is, told with a demo scratch card you actually scratch
  2. location permission and radius
  3. favorite quest types

---

## 5. Sound and haptics (Bencho Sounds)

**Source:** the [bencho.dev/sounds](https://bencho.dev/sounds) library, which has 95 sounds in 8 families. Each sound is downloaded one at a time from its detail panel. Files go in `assets/sounds/<id>.<ext>` and keep Bencho's ids.

**How sounds play**
- **Player:** `expo-audio`. All sounds are preloaded at module scope with `preload()`. Each one has a single `createAudioPlayer`, retriggered with `seekTo(0)` and then `play()`.
- **Where it lives:** `src/services/sound/sfx.ts` exposes `play(id)`, `playThrottled(id, ms)` and `setEnabled(bool)`.
- **Audio session:** `setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' })`. UI sounds respect the iOS mute switch and never stop the user's music.
- **Settings:** Profile has a *Sounds* toggle (on by default) and a separate *Haptics* toggle.
- **Haptics:** each event pairs its sound with an `expo-haptics` call, listed in the table.

| Event | Bencho sound (id) | Haptic |
| --- | --- | --- |
| Pick a quest-type chip | Detent (`select`) | selection |
| Party stepper +/− | Roll (`count`) | light |
| Solo ↔ With others | Throw (`pressToggle`) | light |
| Press **Draw** | Lever (`mechToggle`) | medium |
| Deck shuffle | Slide (`slide`) ×3, staggered | light ×3 |
| Scratching foil (throttled 70ms) | Ratchet (`mechSelect`) | soft, throttled 140ms |
| Foil lifts off / place revealed | Landed (`landed`) | success |
| Activity foil lifts off | Glass (`ready`) | success |
| Rare reveal | Chime (`chime`) | success |
| Legendary reveal | Chord (`mechSuccess`), then Crest (`crest`) | heavy, then success |
| Reroll | Shift (`shift`) | light |
| Lock place | Latch (`latch`) | rigid |
| Out of rerolls | Bump (`deny`) | warning |
| Slide to **Go** completes | Portal (`portal`) | success |
| Save for later | Pin (`pin`) | light |
| Tab switch | Step (`step`) | selection |
| Sheet open / close | Inhale (`open`) / Exhale (`close`) | none |
| New city detected | Perk (`perk`) | light |
| Add photo | Shutter (`mechTap`) | light |
| Quest completed | Major (`pressSuccess`) | success |
| Badge unlocked | Bell (`bell`) + confetti | success |
| Post to Wall | Swoop (`swoop`) | medium |
| ✨ reaction | Plop (`bubbleTap`) | light |
| Pull to refresh | Fill (`fill`) while pulling, Settle (`land`) on release | light |
| Suggestion sent | Copied (`copied`) | success |
| Form error | Snub (`snub`) | error |

**Budget:** about 26 files, under 600 KB total. Play them through a fixed pool of 4 players so overlapping sounds never stack up.

---

## 6. Bencho integration

### 6.1 Bencho blocks used

All of these come from the Bencho MCP (`search_blocks` / `get_block`). The **Mode** column says how each one is brought in:
- **DOM** means the block's React and CSS run unchanged inside an Expo DOM component (`'use dom'`).
- **Port** means the motion is rebuilt natively with Reanimated and Gesture Handler, using the block's source as the spec. Ports are for chrome, and for anything inside a scrolling list, where a webview per cell would be too heavy.

| Block id | Where | Mode |
| --- | --- | --- |
| `scratch-card` | Stage 1 place and Stage 2 activity reveals, onboarding demo | DOM |
| `page-peel` · `card-fan` · `coin` · `option-wheel` | Variant reveals (§3.3) | DOM |
| `card-swap` / `swipe-deck` | The Deck on Draw home (idle and shuffle) | DOM |
| `confetti` | Legendary result, badge unlock | DOM |
| `slide-confirm` | Go on the result card | DOM |
| `liq-toggle` | Solo/With others, Public/Private, settings toggles | Port |
| `rolling-counter` | Party stepper, profile stats | Port |
| `stepper` | Alternative party control (hold and drag to sweep) | Port |
| `progress` | Radius scrubber | DOM (inside a sheet) |
| `tab-bar` | Main tab bar | Port |
| `folder` | Folder tiles | Port (in a grid) |
| `text-blur` | Folder title blur on scrub, onboarding copy | Port |
| `tilt` | Badge tiles | Port |
| `image-shimmer` | Image placeholders on the Wall and in Folders | Port |
| `pull` | Wall pull to refresh | Port |
| `emoji-reactions` | ✨ reaction on Wall posts | Port |
| `label-input` · `seek` · `tag-input` · `fold-dropdown` · `upload-dropzone` · `form-error` · `feedback-bar` | Suggest form | DOM (a single full-screen DOM form) |
| `toast-stack` | "Saved", "Posted" and other confirmations | Port |
| `avatar-group` | Party members on a completed folder (v2.1) | Port |
| `glass-bubble` | Optional easter egg on the full-bleed photo view | DOM |

### 6.2 How the DOM components are set up

From the Expo SDK 58 docs:
- **No extra install.** SDK 56 and later render DOM components with `@expo/dom-webview` by default.
- **Data in:** props must be serializable.
- **Events out:** async native-action props, such as `onRevealed()` and `onScratchTick()`.
- **Sizing and scrolling:** pass `dom={{ scrollEnabled: false, matchContents: true }}`.

**Where files live:** each block is vendored once into `src/bencho/blocks/<Name>.tsx` and `.css`. Each one gets a thin DOM wrapper at `src/bencho/dom/<Name>.dom.tsx` that adds `'use dom'`.

**Changes to every vendored block**
1. **Images:** replace hard-coded image paths (`/lab/scratch-mountain.jpg`, `/blocks/window.jpg`) with a `src` prop, so we can pass a place photo URL or `word={activityText}`.
2. **Events:** add callback props where the source has sound stubs or reveal points. In the scratch card that's `check()` and the empty "scratchy sound" branch. Each callback is an async native action, so **haptics and sounds always fire on the native side**.
3. **Hover to touch:** pointer events already work with touch. Hover-only states (tilt lean, holo shimmer) instead follow the phone's motion (`expo-sensors` DeviceMotion, passed in as `aim={u,v}`), so the foil catches the light when you tilt the phone.

**Performance**
- Mount only one or two DOM components per screen.
- Never put a DOM component inside a `FlatList` cell. That's why folders, the Wall and badges are ports.
- **Fallback:** if the scratch effect drops below 50 fps on an iPhone 12, port that block to `@shopify/react-native-skia`. The canvas logic carries over almost line for line.

### 6.3 Theme bridge

Bencho CSS reads custom properties such as `--ink`, `--card`, `--fill-on`, `--fill-slab`, `--signal`, `--font-ui` and `--pane-edge`.

`src/design/bencho-theme.css` maps all of them onto the §2.2 tokens, for example `--signal: #2B3FE0` and `--font-ui: -apple-system`. Every DOM wrapper imports this file, so blocks look like they belong to the app.

### 6.4 Licensing ⚠️
- Most blocks used here (scratch-card, rolling-counter and others) are **Bencho Pro**. That allows using them in anything we build, but **not redistributing the block source**.
- **The repo (`junjint/svsd`) is public**, so publishing vendored Pro source there would count as redistribution.
- **Decision: Bencho files stay out of git.** `.gitignore` excludes `src/bencho/blocks/` (the vendored block source and CSS) and `assets/sounds/` (the Bencho audio files).

**What is committed**
- the `'use dom'` wrappers in `src/bencho/dom/`, which are our own code
- `bencho-theme.css`
- `src/bencho/manifest.json` and the per-area lists in `src/bencho/manifests/`, which name every block and every sound

**What is not committed:** `src/bencho/patches/`, the §6.2 edits saved as patch files. They're git-ignored as well, because a diff carries lines of the block's own source with it, which would put Pro code in the public repo. Keep a copy of the patches somewhere private (a private repo or shared drive) next to the licence.

**Fresh-clone setup:** this is a README step.
1. Pull each listed block with the Bencho MCP (`get_block`) into `src/bencho/blocks/.pristine/`.
2. Download each listed sound from bencho.dev/sounds into `assets/sounds/`.
3. Copy the private patches into `src/bencho/patches/`.
4. Run `npm run bencho:setup`.

**Build safety:** typecheck (`tsc`) fails with a clear message if a manifest entry has no file on disk.

- Check the **sound** licence on bencho.dev/licence before shipping. They're git-ignored either way.

---

## 7. Data model changes

Existing types are in `src/types/index.ts`.

- **New `Activity`:** `id, text, questTypes[], placeTags[], minParty, maxParty, rarity, durationMin, costTier, indoorOutdoor, source, cityId?`
- **`Sidequest` additions:** `activityId, activityText, partySize, questType, rarity, rerollsUsed, revealStyle, cityLabel`
- **New `QuestFolder`:** `id, kind ('quest' | 'freeform'), sidequestId?, title, photos[], note, mood, rating, savedToGallery, postedToWall, createdBy ('completion' | 'user')`. This replaces `StoryChapter`. Only folders linked to a completed quest can be posted to the Wall.
- **`UserPreferences`** also gets `alwaysSkipReveals`.
- **New `Badge` / `EarnedBadge`, `Submission`, `WallPost`, `Profile { visibility }`**
- **`UserPreferences`:** remove `detourMinutes`, `walkingRadius*` and the notification fields. Add `radiusMiles, defaultQuestType, defaultParty, confirmedCity, soundsEnabled, hapticsEnabled`.
- **`InterestCategory`** stays as the place taxonomy, and `QuestType` maps onto it.

**Pairing rule:** an activity can be drawn for a place when all of these hold:
- its `placeTags` overlap the place's tags or category
- the party size is within `minParty..maxParty`
- `indoorOutdoor` matches the Focus sub-toggle

The activity is then picked by rarity weight.

**Supabase:** add a migration, `002_v2.sql`, alongside `001_sidequest_schema.sql`.
- New tables: `activities, quest_folders, folder_photos, badges, user_badges, submissions, wall_posts, reports, blocks`, plus `profiles.visibility`.
- RLS: private folders are visible to their owner only, and `wall_posts` are public-read.

---

## 8. Reuse from the current codebase

- **Places:** `src/services/places/*`, meaning `PlaceService`, the Mock, Curated and Google providers, and the `backend/` proxy.
- **Place draw:** `src/services/recommendation/engine.ts` `scorePlace`. Proximity becomes radius-based, and its weighted-random pick becomes the place draw.
- **Novelty:** `src/services/recommendation/cooldowns.ts` stops recently visited places from being drawn again.
- **Lifecycle:** `src/services/sidequest/lifecycle.ts` is unchanged.
- **Folders:** `src/services/journal/chapters.ts` is renamed to `folders.ts`. `computeJournalStats` feeds the profile stats and the badges.
- **Unchanged:** `src/services/navigation/maps.ts`, `src/services/persistence/storage.ts`, `src/stores/appStore.ts` and `src/services/supabase/client.ts`.
- **Already installed:** `react-native-reanimated` 4.7 and `react-native-gesture-handler` 3.3, used for the ports.
- **Add** with `npx expo install`: `expo-audio`, `expo-haptics`, `expo-blur`, `expo-image`, `expo-sensors`, `@expo-google-fonts/inter`, `@expo-google-fonts/eb-garamond`.
- **Remove:**
  - `services/discovery` and `services/notifications`
  - the background tasks in `services/location/monitoring.ts`
  - `UIBackgroundModes` and the "always" location strings in `app.json`
  - the Moon design files (§2.2)

---

## 9. Build phases

| Phase | Scope | Needs a backend? |
| --- | --- | --- |
| **P0 Foundation** | New tokens and fonts, `bencho-theme.css`, the sfx service and sound files, a DOM wrapper for scratch-card proven on a device | no |
| **P1 Draw** | Onboarding, Draw home, Deck, scratch reveals, variant reveals, result card, rerolls and rarity, city sheet, about 150 seed activities | no (mock data + Google proxy) |
| **P2 Folders + Trophies** | Folder grid, the photo-viewer folder detail, gallery, profile, badges | no (local only) |
| **P3 Accounts + Sync** | Sign in with Apple through Supabase, sync, public/private | yes |
| **P4 Suggest** | DOM form, moderation queue, user ideas in the draw pool | yes |
| **P5 Wall** | Feed, posting, ✨ reactions, report and block | yes |

## 10. Out of scope for v2

Push notifications and background discovery, comments, a friends or follow graph, chat, paid rerolls or any other monetization, and Android polish (it must still build). (In-app maps moved in on 2026-10-22, as a simulated model, not real tiles.)

## 11. Success metrics

- draw → Go rate
- Go → completed rate
- rerolls per draw
- share of reveals finished by hand rather than skipped
- share of completed quests with at least one photo
- 7-day return rate
- share of completed quests posted to the Wall
- approved suggestions per city

## 12. Open questions

1. Is the audience **Gen Z**? This spec assumes so.

**Resolved 2026-10-19:**
- A skip-reveal button is in (§3.2).
- Folders are created when a quest is finished or when the user makes one (§4.2).
- Bencho files are kept out of git (§6.4).
- Rerolls are capped at 2 per stage (§3.4).
