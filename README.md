# Myth Arena

A playable dragon command center: hatch three starter eggs, collect four distinct companions, and battle with strike, guard, and charged elemental attacks. Includes two AI difficulties and **two-player local PvP on one device**.

The finished static site is included in `dist/`. React, TypeScript, and Vite source, exact dependency versions, and `package-lock.json` are included alongside it. No backend, credentials, wallet, or runtime network service is needed.

## Install and run

Use Node.js 22.12+ (or 20.19+) and npm.

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. To check and rebuild:

```sh
npm run typecheck
npm run build
npm run preview
```

Serve the contents of `dist/` on any static host. Vite uses `base: './'`; scripts, styles, fonts, images, and the favicon use relative URLs in the export. Navigation uses hashes, so refreshing `#arena` or `#hatchery` needs no server rewrite. Validation served the actual export beneath `/preview/`, with external requests blocked.

The share image is already bundled. To recreate it from `scripts/share-card.html`:

```sh
npx playwright install chromium
node scripts/render-share.mjs
npm run build
```

## Play

- **Hatchery:** choose an element filter and hatch an egg. Each starter egg reveals its own dragon, once, at no cost.
- **My dragons:** search or filter the collection, inspect stats, and select a champion.
- **AI practice:** choose Scout or Veteran, then start a battle. Strike and Guard build charge. Guard reduces the next AI hit by 70%; Thornmaw attacks heavily every third turn. At three charge, Elemental burst deals 2.25× attack before affinity adjustments. A victory earns 60 XP; defeat earns 20 XP. The next battle starts at full health.
- **Local PvP:** two people select dragons from the local collection, then pass the same device between turns. Guard lasts until the next incoming attack. Fire beats Nature, Nature beats Storm, and Storm beats Fire. Advantage adds 20% damage; disadvantage reduces it by 15%. Local duels do not award practice XP.
- **Profile:** change your keeper name, export a JSON snapshot, or reset progress after confirmation.

Progress uses this browser’s `localStorage` under `myth-arena-v1`. A new profile receives Ashwing and three eggs. The UI reports unavailable or unreadable storage and remains playable in memory. Clearing site data resets progress. Unfinished battles are kept only for the current page visit and end on reload.

## Validation actually performed

| Check                      | Actual result                                                                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vite production build      | Passed; 33 transformed modules, final JS 233.73 kB / CSS 42.72 kB before gzip                                                                                                                       |
| Strict TypeScript check    | Passed with `tsc --noEmit` against the project settings                                                                                                                                             |
| Chromium interaction suite | 18 passed: hatching, filters, selection, persistence, keyboard dialogs, AI victory/defeat/XP, local PvP/rematch, export, recovery, responsive layouts, accessibility, and resource checks           |
| WebKit interaction suite   | Attempted; browser could not launch because required runtime libraries were unavailable. This is recorded as one failed check; the full interaction command exits 1. Safari behavior is unverified. |
| Pinned taste@1, offline    | 16/16 checks passed at 320, 390, and 1440 widths, including reduced motion                                                                                                                          |
| Automated accessibility    | No WCAG A/AA violations reported by axe in the overview, arena setup, active AI battle, guide dialog, or mobile local duel; manual-review cases remain                                              |
| First screen at 390 × 844  | Inspected: Myth Arena, dragon artwork, and “Enter the arena” are visible                                                                                                                            |
| Other responsive checks    | Overview at 320, 390, 620, 760, 900, 1060, 1250, 1440, 1920; all four views at 320, 390, 620, 900, 1440; no horizontal overflow                                                                     |
| Text enlargement           | 200% root text sizing at 390 passed reflow after fixes; this is not native browser zoom                                                                                                             |
| Image-backed hero contrast | Pixel-sampled on the rendered export: mobile body copy minimum 4.94:1; mobile display text minimum 5.68:1 and 7.11:1                                                                                |
| Assets and metadata        | Local fonts loaded; share PNG, dragon WebP, and favicon present; title, description, `og:title`, and `og:image` verified                                                                            |

Commands in this restricted assignment used dependencies installed only in the disposable test directory, without creating root `node_modules/`:

```sh
node test/scratch/build.mjs
test/scratch/toolchain/node_modules/.bin/tsc --noEmit -p test/scratch/tsconfig.json
PLAYWRIGHT_BROWSERS_PATH=./test/scratch/browsers node tests/interactions.mjs
PLAYWRIGHT_BROWSERS_PATH=./test/scratch/browsers IMD_PLAYWRIGHT=./test/scratch/toolchain/node_modules/playwright/index.mjs node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste --offline
```

The first command calls Vite’s production `build()` with the delivered `vite.config.ts` and dependency aliases to the disposable install. The second extends the delivered strict TypeScript settings with the same dependency locations. These disposable files and the pinned probe are assignment inputs/test support and are not required to rebuild the submission. The standard install/build commands above use ordinary package resolution.

To rerun the delivered interaction suite after a normal install:

```sh
npx playwright install chromium webkit
npm test
```

Both browser engines also require their supported platform runtime libraries. The test server and browsers are created and closed within the test command. Tests write their current results to `artifacts/interaction-results.json`; they report failures without calling them passes.

Run `node scripts/check-bundle.mjs` to validate the required files, relative asset references, lockfile, public/export asset parity, and delivery size. Its report is `artifacts/bundle-check.json`.

The explicit delivery path budget is in `artifacts/path-budget.json`. `.gitignore` excludes installed dependencies, disposable tests, and runner caches with a zero-byte delivery budget, and explicitly retains `dist/`. Cleanup encountered a read-only runner cache file; no cache contents are part of the deliverable.

See [DESIGN.md](DESIGN.md) for implemented tokens and components and [artifacts/validation.md](artifacts/validation.md) for the six-domain review, fixed findings, and coverage limits. Retained screenshots are `artifacts/mobile-390.jpg`, `artifacts/desktop-1440.jpg`, `artifacts/local-duel.png`, and `artifacts/mobile-duel.jpg`.

## Scope and remaining limits

This is a complete static game edition with AI practice and same-device PvP. **Online matchmaking is not connected**: no online service, shared accounts, or cross-device synchronization was supplied. The interface names both playable modes and states this limitation. All statistics are computed from local gameplay; there are no fabricated players, live counts, transactions, or verification results. No missing external service is represented by made-up data.

WebKit/Safari, physical devices, screen-reader use, native 200% browser zoom, full RTL behavior, and localized text were not verified. The supplied browser-tool launcher failed with “Socket path too long”; rendered inspection and primary interactions were completed using isolated Playwright Chromium instead. No hosting or publishing was performed.

## Assets and attribution

Dragon artwork was generated for this project and stored locally as `public/assets/verdant-dragon.webp`. Egg and arena illustrations and brand/icon SVGs are in `src/art.tsx`, `src/icons.tsx`, and `public/favicon.svg`. Dragon portraits reuse the artwork with element-specific CSS treatments; they are illustrations, not separate uploaded creatures.

DM Sans and DM Serif Display are bundled locally with their SIL Open Font License texts in `public/assets/`. Better Interface and documentation-method attribution and licenses are preserved in [NOTICE.md](NOTICE.md) and `licenses/design-guidance.txt`.
