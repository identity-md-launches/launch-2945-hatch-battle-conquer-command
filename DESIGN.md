# Myth Arena design system

## Overview

Myth Arena is a compact fantasy game for keepers who hatch, collect, and battle dragons. The implemented visual idea is an emerald dragon in an ancient forest, carried through a quiet, dark command center. Illustrated surfaces provide the fantasy; the surrounding interface stays practical and restrained.

`src/styles.css` is the canonical token and style source. `src/App.tsx` contains the shared shell and product components; `src/DuelBoard.tsx` contains local PvP. `src/game.ts` owns game data and rules. The overview’s illustrated hero is specific to that view; collection and arena pages open directly on their task.

## Colors

All color tokens live in `:root` in `src/styles.css`. The system is deliberately dark only, independent of the device’s light/dark preference. Colors use sRGB hex, with occasional alpha hex for overlays.

| Semantic token     | Value / primitive         | Use                                     |
| ------------------ | ------------------------- | --------------------------------------- |
| `--bg`             | `--forest-950`, `#0c1210` | Page canvas                             |
| `--forest-925`     | `#101713`                 | Sidebar                                 |
| `--surface`        | `--forest-900`, `#141e18` | Egg, dragon, and battle surfaces        |
| `--surface-raised` | `--forest-850`, `#1b2921` | Supporting raised areas                 |
| `--surface-hover`  | `--forest-800`, `#25372c` | Hover feedback                          |
| `--text`           | `--cream-100`, `#f0eee5`  | Main text and headings                  |
| `--text-secondary` | `--sage-300`, `#b0baad`   | Descriptions and secondary labels       |
| `--text-muted`     | `--sage-400`, `#9aa799`   | Captions and metadata                   |
| `--line`           | `#28352b`                 | Structural separators                   |
| `--accent`         | `--jade-400`, `#86c59d`   | Primary button fill and selected states |
| `--accent-hover`   | `--jade-300`, `#9ed4ae`   | Primary hover fill                      |
| `--accent-ink`     | `#102719`                 | Primary button text                     |
| `--focus`          | `#d9eab2`                 | 2px keyboard outline, offset 4px        |
| `--warning`        | `--gold-300`, `#dfc28b`   | Heavy-strike cue and storage notices    |
| `--danger`         | `--rose-300`, `#f2ac9f`   | Form error text                         |
| `--nature`         | `#9ed4ae`                 | Nature category, with leaf icon/text    |
| `--fire`           | `--ember-300`, `#e4b08c`  | Fire category, with flame icon/text     |
| `--storm`          | `--violet-300`, `#c4afdf` | Storm category, with bolt icon/text     |

Element hues encode categories rather than extra primary actions. Rarity tags use subdued green, gold, and violet surfaces with visible text. The destructive reset button uses a dark red fill (`#733c32`), `#ac6c5d` border, and `#fff0e7` label.

Measured pairs: main text/page 16.28:1, muted text/card 6.81:1, secondary text/card 8.52:1, primary button label/fill 7.91:1. These are identified token pairs, not a claim about every pixel. The image-backed hero uses a stronger mobile shade; the minimum sampled mobile body-text ratio was 4.94:1. Method, bounds, and remaining limits are in `artifacts/validation.md` and `artifacts/contrast-results.json`.

## Typography

`--font-body` is **DM Sans**, with Arial and sans-serif fallbacks. Its local WOFF2 is declared for weights 400–600; the current UI uses 400 and 500. `--font-display` is **DM Serif Display**, weight 400, with Georgia and serif fallbacks. Both fonts are local, use `font-display: swap`, and were confirmed loaded in the rendered export. Font synthesis is disabled.

| Token            | Default size    | Role                                                |
| ---------------- | --------------- | --------------------------------------------------- |
| `--text-xs`      | 12px / .75rem   | Compact data, badges, captions, mobile navigation   |
| `--text-sm`      | 14px / .875rem  | Dense interface copy and buttons                    |
| `--text-base`    | 16px / 1rem     | Dragon names, fields, guide subheads                |
| `--text-lg`      | 22px / 1.375rem | Section headings, compact display names, statistics |
| `--text-xl`      | 32px / 2rem     | Inner-page titles and result headings               |
| `--text-display` | 64px / 4rem     | Overview hero; 44px / 2.75rem at ≤760px             |

The body copy line height is 1.6; buttons use 1.4, the hero 1.06 (1.08 on mobile), and inner-page titles 1.2. Display tracking is −.025em in the hero and −.02em on page titles; ordinary text has natural tracking. Headings balance lines except the deliberately broken hero. Prose uses `text-wrap: pretty`; long hero words may wrap rather than clip when text is enlarged. Changing numbers use tabular figures. Fields are at least 16px on mobile to avoid input zoom.

The overview probe measured five sizes and two weights at each of 390 and 1440. The 32px token appears on inner views, making six defined roles across the product.

## Layout

The desktop shell uses a fixed 220px sidebar, an 80px top bar, and a main area capped at 1560px. Main horizontal padding is 32px by default. A single shared leading edge aligns the welcome row, hero, statistics, and section grids.

The declared spacing vocabulary is 4, 8, 12, 16, 20, 24, 32, and 40px (`--space-1` through `--space-10`, with named steps in the source). Existing component declarations also use optical/density adjustments such as 10, 14, 18, and 26px; not every spacing declaration consumes a custom property. Reuse the established component spacing rather than introducing an unrelated scale.

The overview pairs a three-egg grid with an arena invitation at roughly 2.16:1. The roster and introductory quests follow the same columns. Collection cards use three columns; the arena setup uses two. Reading order stays overview → stats → eggs → arena → roster → quests as the grid collapses.

| Breakpoint | Implemented behavior                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ≥1600px    | Main padding 44px, taller 380px hero and slightly larger illustration regions                                                                                |
| ≤1250px    | Sidebar 200px; main padding 26px; tighter card gaps; collection uses two columns                                                                             |
| ≤1060px    | Overview sections stack; arena invitation becomes a horizontal illustration/copy block; arena setup stacks                                                   |
| ≤760px     | Sidebar removed; brand and utilities move to header; fixed bottom navigation appears; main inset 20px; display size 44px                                     |
| ≤520px     | Main inset 16px; eggs adapt to a two-column grid; overview’s final odd egg becomes a horizontal tile; collection becomes one column; arena invitation stacks |
| ≤350px     | Main inset 12px and tighter card/control spacing                                                                                                             |

Mobile stats, egg grids, and move controls use `auto-fit` with rem-based minimums, allowing fewer columns when text is enlarged. Mobile navigation wraps when its labels need more room. Main bottom padding reserves space for navigation; safe-area padding is supported. Cards use `minmax(0, …)` and flexible text regions instead of clipped critical labels. Dialogs fit the viewport and scroll internally when necessary.

The actual export was inspected at 390 and 1440; overview reflow was checked at nine widths between 320 and 1920. All four views were checked at 320, 390, 620, 900, and 1440. A 200% root text enlargement check passed at 390. Native zoom, physical-device behavior, and RTL mirroring remain unverified.

## Elevation & Depth

Surfaces are flat tonal layers with structural borders or low-opacity outlines. The interface does not combine a drop shadow and border on a card. The active sidebar item uses an inset 3px marker, not a floating shadow. Images use subtle edge outlines where appropriate. Egg SVGs contain their own illustrative highlights and shadows; those are artwork, not UI elevation.

The hero uses a directional dark overlay over the locally bundled dragon artwork. Native dialogs occupy the browser’s top layer and use a dark, blurred backdrop; the dialog itself has no box shadow. The sidebar is at z-index 20, mobile navigation 30, and the skip link 100. Native dialog modality makes the background inert.

## Shapes

`--radius-sm: 6px` is for buttons and fields; `--radius: 10px` is for cards; `--radius-lg: 14px` is for the hero and modal. The implementation also uses 4–5px badge corners and 8px image corners. Status dots, selected checks, and avatars are round. The practice-rank emblem uses a clipped shield silhouette.

Clipping is reserved for illustration frames, progress fills, and the hero’s decorative art. Critical text is not ellipsized. At enlarged text sizes, headings and labels wrap.

## Components

| Component / pattern                 | Location                     | Behavior and reuse                                                                                                                                                                                   |
| ----------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                            | `src/App.tsx`                | `primary`, `secondary`, `quiet`, `danger`; native button semantics, disabled handling, explicit hover/focus/active states. Use one primary emphasis per task region.                                 |
| `Icon`, `BrandMark`                 | `src/icons.tsx`              | Consistent outline SVG icons with `currentColor`; decorative icons are hidden from assistive technology. Icon-only controls receive accessible labels.                                               |
| Sidebar, top bar, mobile navigation | `src/App.tsx`                | Hash navigation with `aria-current`; sidebar collapses into persistent bottom navigation; help/profile remain available on mobile.                                                                   |
| `EggCard`, `EggArt`                 | `src/App.tsx`, `src/art.tsx` | Element and rarity are named; labelled plus button opens a hatch confirmation; result dialog reveals the new dragon. Hatching removes exactly one egg.                                               |
| `DragonCard`, `DragonArt`           | `src/App.tsx`, `src/art.tsx` | Native button opens details; checkmark identifies the selected champion. Portrait treatments reuse the same local artwork.                                                                           |
| `Modal`                             | `src/App.tsx`                | Native `dialog.showModal()`, title association, explicit keyboard wrap, Escape/backdrop/close button, and focus restoration. Used for guide, hatch/reveal, details, profile, and reset confirmation. |
| Filters and fields                  | `src/App.tsx`                | Egg buttons use `aria-pressed`; dragon search has a label; element/rival selectors are native selects; empty states offer a clear recovery action.                                                   |
| `ProfileForm`                       | `src/App.tsx`                | Labelled 2–20 character nickname, inline announced validation errors, actual JSON download, and a separate reset confirmation.                                                                       |
| `BattleBoard`, `HealthBar`          | `src/App.tsx`                | Visible health numbers and labelled progressbars, incoming-heavy-strike cue, charge-gated burst, readable battle log, victory/defeat/retry states.                                                   |
| `DuelBoard`                         | `src/DuelBoard.tsx`          | Two local players alternate; active player and guarding state are named. Result names the winner. Rematch resets both dragons.                                                                       |
| Storage notice and live region      | `src/App.tsx`                | Unavailable storage is explained; a stable polite region announces routine state changes without replacing focused controls.                                                                         |

Motion is limited to explicit property transitions of 150ms for buttons, hover feedback, and health fills. Press scales to .96. There is no page entrance or endless animation. `prefers-reduced-motion` removes transitions and scaling; forced-color focus uses system Highlight. Disabled charged attacks explain “Needs 3 charge” in visible text.

## Do’s and Don’ts

- Start another view with the existing shell, `.page-heading`, and semantic `h1`; keep the main task near the top.
- Reuse the color/type tokens, `Button`, `Icon`, and card patterns. Keep section headings at the existing 22px display step.
- Keep artwork behind readable dark overlays. Measure contrast again when changing a crop, overlay, or foreground color.
- Label local data and battle modes accurately. Do not imply an online opponent, shared ranking, purchase, or account without a real service.
- Use native labelled controls and preserve focus behavior. Keep disabled explanations and error recovery adjacent to the action.
- Let grids collapse and text wrap. Do not add clipped names, ticker text, oversized tracked labels, or decorative animation to fill space.

Design-guidance and documentation-method attribution is preserved in `NOTICE.md` and `licenses/design-guidance.txt`.
