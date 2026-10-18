# Sidequest Design System

**BeReal minimal × editorial type × color-only-via-stickers**

## Principles

1. **Chrome is monochrome.** Backgrounds, borders, text, buttons, toggles — black, white, and gray only.
2. **Color arrives through stickers.** Small picture icons (3D / photoreal / emoji stickers) lead, trail, or sit between type. Never tint UI chrome.
3. **Space is the structure.** Generous padding, thin 1px rules, almost no cards or shadows.
4. **Type carries hierarchy.** Bold Outfit for headlines, IBM Plex Mono for labels/meta, Caveat script for a single accent word.
5. **Extremely little UI.** Prefer raw text + one sticker over badges, gradients, pills clusters, or glow.

## Tokens

| Token | Value |
| --- | --- |
| `color.bg` | `#FFFFFF` |
| `color.ink` | `#000000` |
| `color.inkTertiary` | `#8A8A8A` |
| `color.line` | `#000000` (1px frames) |
| `color.lineSubtle` | `#E8E8E8` (dividers) |
| Grid | 4px base (`space[1]` … `space[12]`) |
| Radius | `0` for frames/buttons; `pill` only for chips |

## Typography

| Role | Font | Use |
| --- | --- | --- |
| Display / Title | Outfit Bold | Brand, screen titles |
| Body | Outfit Regular | Reading |
| Label | IBM Plex Mono Medium, tracked ALL CAPS | `STATUS`, `LOCAL TIME` |
| Mono | IBM Plex Mono | Distances, coords, meta |
| Script | Caveat | One word inside a headline (`sidequests`) |

## Stickers

Import `Sticker` / `stickerForCategory`. Placement patterns:

- **Leading** — before a title (`🧭 Discover`)
- **Trailing** — after a brand line (`Sidequest ✨`)
- **Between** — inline in a sentence (`appeared ✨ nearby`)
- **Row** — left of a quest list item (category sticker)

## Components

- `EditorialHeadline` — brand / hero with script + sticker
- `Frame` — thin black rectangle, optional corner label
- `Capsule` — BeReal-like hollow pill
- `SectionHeader` — mono label + hairline rule + optional sticker
- `QuestRow` — sticker + title + hook + mono meta
- `Button` — filled black or hollow; optional sticker, no accent color
- `Chip` — hollow pill; selected = inverted black fill

## Anti-patterns

- Purple / indigo gradients, cream terracotta themes, glow, multi-shadow cards
- Colored buttons, colored progress bars, colored tab icons
- Dense dashboards, stat strips, floating badges over media
- Using stickers as the only interactive affordance without text

## References

See `assets/design/ref-editorial-blueprint.png` and `ref-editorial-icons.png`.
