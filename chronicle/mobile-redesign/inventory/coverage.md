# Coverage workspace — feature inventory

Source of truth for this document, read in full:
`dashboard/assets/js/src/views/coverage.ts` (1054 lines) ·
`dashboard/assets/styles/workspace-coverage.css` (1290 lines).
Cross-read for data shape / math / shared blocks: `state/coverage.ts`, `state/recommender.ts`,
`state/foods.ts`, `state/starter-pack.ts`, `core/goal-display.ts`, `core/dose-units.ts`,
`views/foods-block.ts`, `views/scroll-keep.ts`, `views/welcome.ts`, `state/copy.ts` +
`assets/data/view-copy.json`, `assets/data/coverage-layout-data.json`, `dashboard.css` (`.fs-*`),
`theme.css` (dark overrides), `main.ts` (navigation/keys).

**Scope note.** The FOOD SOURCES block and the arrival veil are built by other files but they
*render inside / are launched from* Coverage, so they are inventoried here as Coverage surfaces.
Where a behaviour is owned elsewhere it is marked `[shared]`.

---

## Destinations & states

### How you get here
- Left rail button `data-rail-nav="coverage"`, glyph `◉`, label `Coverage`, kbd hint `1`.
- Bare digit key **`1`** anywhere in the app (suppressed while a blocking overlay owns the screen).
- App boot: `main.ts` navigates to `coverage` on startup (`setTimeout(navigateTo('coverage'), 0)`).
- Topbar breadcrumb is set by `main.ts`, not by this view: name **`Coverage`**, deck
  **`Every essential Wallach named, measured against what you take.`**
- Mount host is `#workspace-coverage-mount` inside `main.app-workspace`. **`.app-workspace` is the
  page scroller** — `html, body { height:100%; overflow:hidden }`, so the document never scrolls.

### Structural shell (one paint, `container.innerHTML =`)
```
.coverage-workspace
  .goalstrip                       ← sticky, top:0, z-index 5
  .cov-d                           ← owns the page padding
    .coverage-grid                 ← grid: minmax(0,1fr) / 340px
      .essentials-host.ds-border-travel   ← the field + the ledger
        section.essentials-section  × 4
        .ledger-bar
      aside.cov-aside
        .recs        [data-recs]
        .fs-block    [data-foodsblock]     [shared]
        .rail-panel
```

### D1 — The field (always present, never empty)
Four sections, **91 tiles rendered, 90 counted**:

| # | Section title | `sub` line | Tiles | Grid | Tile class |
|---|---|---|---|---|---|
| 01 | MINERALS | `// 60 · THE FOUNDATION · ATOMIC SYMBOLS PRESERVED` | 60 in 3 subsections | `.essentials-grid--minerals` | `.tile` |
| 02 | VITAMINS | `// 16 · THE CO-FACTORS · ENZYME ENABLERS` | 16 | `.essentials-grid--vitamins` | `.tile--vitamin` |
| 03 | AMINO ACIDS | `// 12 · PROTEIN BUILDING BLOCKS · ESSENTIAL + CONDITIONAL` | 12 | `.essentials-grid--aminos` | `.tile--amino` |
| 04 | FATTY ACIDS | `// 3 · ESSENTIAL LIPIDS · MEMBRANE + SIGNAL` | 3 (2 counted) | `.essentials-grid--fats` | `.tile--fat` |

Mineral subsections (rank glyph · label · `· count` · goal dots · hint):

| rank | label | count | `id` | hint |
|---|---|---|---|---|
| A | FOUNDATIONAL | 5 | — | `air · water · food · nothing to take` |
| B | INDIVIDUALLY DOSED | 21 | — | `Wallach names an amount · A→Z` |
| C | PLANT DERIVED | 34 | `plant-derived` | `no individual amount · one shared verdict` |

### D2 — Tile states (the interior channel)
Six visual states, driven by `CoverageTile.status` straight from the snapshot (never re-derived
in the view):

| state | class | treatment |
|---|---|---|
| pending / no target | `''` (no class) | **DORMANT**: sunk into substrate, `--ds-paper-deep`, inset shadow + `--ds-rule-soft` hairline |
| gap | `.gap` | dormant body **+ one amber leading-edge tick** `inset 3px 0 0 var(--ds-accent-deep)`. Deliberately NOT a red flood |
| present | `.present` | `--ds-paper-light`, `translateY(-1px)`, `--ds-elev-1`, **tech-blue `--ds-status-info` rim**, blue glyph + blue name strip + blue strip border |
| partial | `.partial` | `--ds-paper-light`, `translateY(-1px)`, `--ds-elev-1`, plus the **fill bar** climbing to `--fill` |
| covered | `.covered` | **FULLY LIFTED**: white→`--ds-ok-wash` gradient, `translateY(-2px)`, green `--ds-ok-bright` rim, white top-light, green drop shadow, green glyphs, **green-filled name strip** |
| trace | `.trace` | legacy alias; **no CSS rule and no ledger row exists for it**. `state/coverage.ts` says it is no longer produced, but `subCovered()` and the section stat still count it as covered. If it ever returns, the five ledger numbers stop summing to 90 |

Sub-states layered on top:
- **`--fill` bar** (`::before`, bottom-anchored, green gradient, `transition: height .5s`). Emitted
  **only for `partial`**, clamped/rounded to 0–100 %.
- **Goal ring** (`.tile__ring`, a real child element, `inset: -2.5px`, masked 2.5px band,
  `border-radius: 4px`). Present when the tile's slug is a member of ≥1 active goal.
  - one goal → `linear-gradient(hue, hue)`; multi → `linear-gradient(115deg, …)`.
  - glow `0 0 14px -3px var(--ringGlow)` (first goal's hue + `aa`), `!important`, scoped
    `:not(.covered)`.
  - **`.covered` tiles never show a ring** (`display:none` in CSS, not skipped in JS — so
    `data-goals` survives for the hover pass).
  - `.tile--blend` class is emitted for multi-goal tiles and **has no CSS rule anywhere** — a dead
    hook.
- **Focus mode**: `body.focusing` + per-tile `.is-focus` → all non-members drop to `opacity: .22`.
- **Hover**: `translateY(-3px)` + orange `--ds-accent` rim + white top-light + `--ds-glow-accent-sm`.

### D3 — Subsection group-dot state
Only the `plant-derived` subsection has an `id`, so it is the only run that can carry dots. One
7 px solid dot per active goal whose `groups` includes `plant-derived`. **19 of the 30 goals do**
(the code comment at `renderGroupDots` says *20* — a drift; the data says 19). Dots are hidden
entirely when `subCovered()` is true (all 34 covered).

### D4 — Ledger states
Five rows + one reconciliation line. Any row with count `0` gets `.is-dark` (`opacity .32`,
`saturate(.2)`). The reconciliation reads `<counted> counted · <shown> shown` → **`90 counted ·
91 shown`**, and is `margin-left: auto` (right-flushed).

### D5 — Goal strip states
1. **Zero goals**: eyebrow `Your goals` · `+ ADD` chip · end-eyebrow
   `No goals — the whole field, nothing highlighted`.
2. **1–4 goals**: eyebrow · chips · `+ ADD` · end-eyebrow `Hover a goal to focus it`.
3. **5 goals (= `MAX_GOALS`)**: the `+ ADD` chip is **not rendered**.
4. **Transient hover-focus**: `body.focusing` on, hovered chip's members lit, everything else at .22.

### D6 — Recommendations block states
- **Normal**: eyebrow + up to **3** cards (`REC_PAGE`). No pager, ever — the list *advances*
  because owned products are filtered out.
- **Cap reached** (`budget === 0`, i.e. the user already owns `REC_MAX = 9` vault products):
  note reading `That is the full starting set from here — nine products is as far as this tab goes.
  Browse the rest in the Products tab any time.`
- **Field closed** (ranker returns nothing): `Nothing left to add — every essential a product could
  reach is already covered.`
- These two endings are deliberately distinct and must never be conflated.

### D7 — FOOD SOURCES block states `[shared]`
Coverage passes `pager: {kind:'arrows'}`, **no `filter`**, `education` unset.
- **Normal**: dotted rule labelled `FOOD SOURCES`, then up to **3** design-F tiles, then the
  `‹  n / N  ›` pager. Pager is suppressed when `pages < 2`.
- **Cap reached** (`FOOD_MAX = 12` foods already owned): `That's the last food this tab will
  suggest — the rest live on your Regimen.`
- **Nothing moves a gap**: `No food moves a remaining gap — what's left needs a supplement.`
- **Easter egg** (owns *every* food in the catalog): a paragraph ending in a `click here` link to
  a YouTube URL. **⚠ This is an outbound network link inside an offline-first app** — flag it for
  the rebuild.
- Unreachable from Coverage today because Coverage passes no filter: `fs_filter_none`, the numbered
  pager shape, and the `education` note.

### D8 — Daily Protocol rail states
- **Empty**: dashed box, `Nothing here yet.` + `Add a food or supplement to begin`.
- **Populated**: N rows inside `[data-rail-list]`, which is its **own scroller**
  (`max-height: calc(100vh - 330px)`, `overflow-y:auto`, `overscroll-behavior: contain`).
- Head shows the **active slot name uppercased** (read from state, never hardcoded) + `· N ITEM(S)`.
- Panel is `position: sticky; top: var(--ds-space-5)`.

### D9 — Destinations you can leave to
- **Knowledge drawer, essential detail page** — clicking any tile emits
  `knowledge:open-entity {kind:'essential', slug}`. **This is the ONLY entrance to the essential
  detail view.**
- **Regimen workspace** — `FULL REGIMEN →` dispatches `wallach:navigate {to:'regimen'}`.
- **Arrival veil / goal picker** (`.wc-veil`, z-index 60) — `+ ADD` dispatches
  `wallach:open-welcome`. In *reopen* mode: no name field, no `I'm just browsing →` button; just
  the goal grid, an `n/5 selected` counter, and `Show me my field`.

### D10 — Theme states
Cream (default) and dark. Dark is **not** a token flip for this surface: `theme.css` carries
scoped overrides for the essentials-host grid (removed outright in dark), the covered plate
(green-tinted dark gradient), covered glyphs, the legend `covered` swatch, tile `:hover`
(two rules), `.cov-d .essentials-host`, `.tile--fat .tile__code::before`, every `present`
treatment (glyph, name strip, border, box-shadow, legend swatch), `.rl-src.is-own`, `.rec__tip`,
`.rec__add`, `.rec__val`, and the accent-foreground group
(`.essentials-section__num`, `.essentials-section__stat strong`, `.essentials-subsection__rank`).

### D11 — Author-only state (not user-reachable)
`data-covered-variant='b'` hand-set on `.coverage-grid` re-points `--cov-strip-bg/fg` to give the
covered tile a **restrained** name strip (transparent bg, `--ds-ok-deep` text). No code sets it.

---

## Controls

| Control | What it does | Where it lives | Touch-hostile? |
|---|---|---|---|
| **Tile** (`[data-tile]`, a `<div>`) | Click → resolves display name → slug → `knowledge:open-entity`. Checked **LAST** in the delegate so every action control wins inside it | Field, ×91 | **YES** — a `div`, not a button: no `tabindex`, no `role`, no keyboard, no focus ring, no accessible name. Also a **100 × 80 px** target with a **9 px gap** — meets 44 px but only just, and hover is its only affordance signal |
| **Goal chip** (`.gchip[data-goal]`, a `<span>`) | **Hover only** → transient focus (`body.focusing`, members `.is-focus`) | Goal strip | **YES, fatally** — hover is the *entire* function of the chip. There is no click, tap, or key path to focus a goal |
| **Goal chip X** (`[data-goal-remove]`, `<button>`) | Removes that goal from `loadRgUserGoals()`; repaints | Inside each chip | **YES** — `opacity: 0` until `.gchip:hover`. Invisible and unreachable on touch. 20 px (`--uic-size: 20px`), under 44 |
| **`+ ADD` chip** (`[data-goal-add]`, `<button>`) | Dispatches `wallach:open-welcome` → the veil **is** the goal picker | Goal strip; hidden at 5 goals | Small (5 px / 13 px padding, ~24 px tall) |
| **Group goal-dot** (`.essentials-subsection__goaldot`) | Not clickable. Carries `title="<goal name>"` (native tooltip) and reacts to goal-chip hover by scaling ×1.35 | PLANT DERIVED label | **YES** — 7 px, `title`-only tooltip. Both the label and the highlight are hover-only |
| **Rec card** (`.rec`, `[data-rec-add]`, a `<button>`) | 1-click add: `vaultEntry(id)` → mints a `RegimenItem` (`provenance: 'user_manual'`) → `addOrBumpRegimenItem` → write chokepoint → `regimen:changed` → recompute → repaint | Aside | Card is a real button, full width — fine. But its `+` glyph and dotted-underline explainer are hover-revealed |
| **Rec `+` glyph** (`.rec__add`) | Decorative affordance only; the whole card is the target | Rec card, right | Inverts on `.rec:hover` |
| **Rec `.rec__q` numbers** | Hover → dotted underline appears; hover the text → `.rec__tip` tooltip | Rec card meta row | **YES** — two-stage hover. The *entire* ranking explanation is behind it |
| **Food tile add** (`[data-food-add]`, `<button>` `.ui-close.ui-close--sm.fs-ctl--add`) | `addCatalogFood(foodId)` → mints a food `RegimenItem` (`provenance: 'food_catalog'`, `servings: 1`) → same chokepoint | Food tile title bar | 28 px shell — **under 44** |
| **Food pager `‹` / `›`** (`[data-food-page]`) | Sets `foodPage` (session-only, never persisted) → `render()` | Under the food grid | **18 px tall** — badly under 44 |
| **Food chip / lead `%`** | Not clickable; `title=` carries the provenance gloss (source name, Wallach target, `≈` approximate explanation, conservative-floor note) | Food tile body | **YES** — `title` tooltips do not exist on touch. The *only* place the number's provenance is stated |
| **Rail row X** (`[data-row-remove]`, `<button>`) | `Number.parseInt` the id → `saveRgRemoved(new Set([n]))`. Deliberately **not** hover-revealed | Rail row, col 2, spans both rows | 20 px — under 44 |
| **Dose `−`** (`[data-dose-down]`) | `stepDose(dose, -1, units)` → `saveRgOverride(id, {scaling_factor})`. Disabled at `atMinimumDose` | Rail row foot | **17 × 17 px** — the smallest control on the surface |
| **Dose `+`** (`[data-dose-up]`) | `stepDose(dose, +1, units)` → same write path | Rail row foot | **17 × 17 px** |
| **`FULL REGIMEN →`** (`[data-full-regimen]`, `.ds-btn-primary`) | `wallach:navigate {to:'regimen'}` | Rail panel actions, full width | OK |
| **Rail row name** | Not clickable. `title` = the full name (the row ellipsises) | Rail row | `title`-only |
| **Page scroll** | `.app-workspace` scrolls; the goal strip sticks at `top: 0` | — | — |
| **Rail list scroll** | Second, independent scroller; `withScrollPreserved` restores **both** on every repaint | Rail panel | Nested scroller inside a scroller |

**Delegation model** (must be preserved): exactly **one** `click` listener + **one**
`mouseover`/`mouseout` pair on the container. The view repaints by replacing `innerHTML`, so
per-element handlers would leak. Click precedence order, top to bottom:
`goal-remove` → `goal-add` → `row-remove` → `dose-up`/`dose-down` → `rec-add` → `food-add` →
`food-page` → `full-regimen` → **tile (last)**.

---

## Data points rendered

### Per tile (from `coverage-layout-data.json` + `CoverageSnapshot`)

| Datum | Source field | Format | Why it matters |
|---|---|---|---|
| Atomic number | `tile.num` | integer, 10 px mono | Minerals only; real atomic number from canon |
| Positional code | `tile.code` | `V·01`, `AA·01`, `F·01` | Vitamins / aminos / fats — a positional code, not chemistry |
| Element symbol | `tile.sym` | `H`, `Zn`, 17 px display | Minerals only |
| Vitamin letter | `tile.letter` | `A`, `B12`, `D3`, `Ch`, `In`, `Fl`, `H` | Vitamins only |
| Amino abbreviation | `tile.abbr` | `Arg`, `Tyr` | Aminos only |
| Display name | `tile.name` | 9.5 px uppercase, `overflow-wrap: anywhere` | **16 of 91 differ from the canonical key** (`RETINOL` vs `Vitamin A (Retinol / beta-carotene)`) |
| Hint line | `tile.hint` | `n-3 · alpha-linolenic (ALA)` | Fats only |
| Status | `snapshot.tiles[].status` | CSS class | The whole verdict |
| Fill ratio | `snapshot.tiles[].fillPercent` | `--fill: N%`, clamped 0–100, rounded | **Partial only.** delivered ÷ Wallach target |
| Goal membership | `goal.members` ∋ `tile.slug` | `data-goals="N"` + `--ringPaint` + `--ringGlow` | Edge channel |
| Layout key for click-through | `tile.name` in `data-tile` | string | Resolved back to `slug` on click |
| `essential: false` | `tile.essential` | omega-9 only | Rendered, **not counted** |

### Section header

| Datum | Source | Format |
|---|---|---|
| Section number | `section.num` | `01`–`04`, artifact face, accent, glow text-shadow |
| Title | `section.title` | uppercase display (Unbounded carve-out) |
| Sub | `section.sub` | `// 60 · THE FOUNDATION · ATOMIC SYMBOLS PRESERVED` |
| Stat | computed | `<b>{covered}</b> / {total} covered` — `covered` counts status `covered` **or** `trace`; `total` counts tiles where `essential !== false`, so **Fatty Acids reads `/2`, not `/3`** |

### Subsection label
`rank` glyph (`A`/`B`/`C`) · `label` · `· {tiles.length}` · goal dots · `hint` (right-flushed).

### Ledger

| Row | Copy | Count source |
|---|---|---|
| 1 | `COVERED` | `status === 'covered'` |
| 2 | `PARTIAL` | `status === 'partial'` |
| 3 | `PRESENT` | `status === 'present'` |
| 4 | `NOT COVERED` | `status === 'gap'` |
| 5 | `NO WALLACH NUMBER YET` | `status === ''` |
| recon | `{counted} counted · {shown} shown` | `snapshot.totalCount ?? essentialCount()` = 90 ; `layoutTiles.length` = 91 |

Counted over `countedKeys` (`essential !== false`) only — **the ledger counts the counted, not the
shown**, or the five numbers would sum to 91 against a line reading 90.

### Rec card (`CoverageRec`)

| Datum | Field | Format | Note |
|---|---|---|---|
| Product name | `r.name` | `.textContent`, never innerHTML | From the generated vault |
| Price | `r.price` | `$12.95` (`toFixed(2)`) | **WHOLESALE** — the featured price |
| Supplies | `r.supplies` | `adds 14` | Count of *wanted* essentials it reaches. **No denominator, ever** — that is what stops it becoming a score |
| Value | `r.perTenDollars` | `10.8 / $10` (`toFixed(1)`) | Displayed figure, **not** the sort key |
| Goal tint | `r.goalIds` | `--recRing` border-image gradient | Border only. **No per-goal dots** — measured dead channel |
| (unused on card) | `r.breadth`, `r.pinned`, `r.score`, `r.productId` | — | `productId` rides `data-rec-add` |

### Food tile (`FoodRec` / `FoodHit`) `[shared]`

| Datum | Field | Format |
|---|---|---|
| Food name | `rec.name` | ellipsised, `title` = full |
| Portion | `rec.portionLabel` | `1 cup (240 g) · ` — USDA's own words |
| Breadth | `rec.breadth` | `<b>N</b> of 90` |
| Lead percentage | `hits[0].pct` | big number + `<sup>%</sup>`, `≈` appended when `tier === 'APPROXIMATE'` |
| Lead label | `hits[0].label` | uppercase mono, dotted underline (gloss affordance) |
| Chips | `hits[1…]` | `LABEL 42%`, ≤7 chips, ≤3 rows, then `+N` |
| Category colour | `hit.category` | `--fs-cat-minerals #2b6fb0` · `--fs-cat-vitamins #ff7e3c` · `--fs-cat-fatty_acids #7d4a86`. **Aminos have no entry on purpose** — a food can never credit one |
| Provenance gloss | `hit.source`, `hit.tier`, `hit.conservative` | `title=` string, built by `glossFor()` |
| Page readout | pager | `{page+1} / {pages}` |

### Rail row

| Datum | Source | Format |
|---|---|---|
| Item name | `item.label.name` | `.textContent`; truncated **from the END** (names back-load packaging; 71 of 215 exceed 30 chars) ; `title` = full |
| Provenance mark | `isUserSupplied(item.provenance)` | `YOURS` in `--ds-tech`. **Only** user-supplied items are marked — the old `EDEN` mark was deleted |
| Dose count | `doseCount(readItemDose(item), units)` | integer, or 2-dp when fractional (`1.54`, never `2.00`) |
| Dose unit label | `doseUnitLabel(count, units)` | `tablets/day`, `softgel/day`, `servings/day`; singular at exactly 1 |
| Slot name | `loadSlots()` active slot `.name` | UPPERCASED, read-only. No switcher (switching lives in Regimen) |
| Item count | `items.length` | `· 3 ITEMS` via `plural()` |

### The coverage math — exact inputs (from `state/coverage.ts`)

Delivery accumulation: for each regimen item, `scale = readScale(item, overrides)` — resolution
order **`overrides[id].scaling_factor` → `label.servings` → `1`**. `readItemDose()` in the view
*mirrors this exact order*, so the number the stepper shows is the number the math uses. It
deliberately does **not** read `item.scaling_factor` (Zod strips it).

For each nutrient row: `resolveSlug(name, form)` → match target → `toMg(amount × scale, unit, slug)`
→ accumulate into `totalMg` or `totalIU`. Any nonzero delivery pushes the item's display name onto
`contributesTo` — **which is NOT "the products that cover this tile"** and must never be rendered as
one.

`numericStatus`:
- `low <= 0` → `current > 0 ? 'covered' : ''`
- `current >= low × 0.95` → **covered**
- `current >= low × 0.30` → **partial**
- else → **gap**

`classify` routes by `target.kind`:
- `null` / `undefined` / `'unspecified'` → covered if any source, else `''`
- `'mirrors'` → **always `''`** here; the real status is written by the mirrors pass (safety property: it can never fail green)
- `'dietary'` → covered if any source
- `'trace_pdm'` → the shared PDM verdict; **presence floor**: if PDM status is `''` and a source names the element, → `present` (never `covered`, because no individual Wallach amount exists)
- `'wallach_collective'` + `collective_group === 'essential-fatty-acids'` → `efaStatus`; any other group → `''`
- `'dietary_with_clinical_lever'` → numeric if `low > 0`; else if `vehicle_supplied` → `betterStatus(pdm, presence)` (germanium's unique case); else presence
- `target.low === 0` → **covered** (phosphorus: Wallach says take none; met by taking none)
- `vehicle_supplied === true` → `betterStatus(pdmStatus, numericStatus(...))` — additive, never a replacement
- otherwise → `numericStatus`

Other inputs: `FOUNDATIONAL_PRESENT_SLUGS = {hydrogen, carbon, nitrogen, oxygen}` (present by
default from air/water/food). The PDM aggregate meter is Σ plant-derived-vehicle mg vs the
**924 mg** Wallach maintenance goal, shared by all 34 `trace_pdm` tiles.
`fillPercent = current / low` (can exceed 1 with stacking; `1` for trace/dietary).
`STATUS_RANK` `'' 0 < gap 1 < present 2 < partial 3 < trace 4 < covered 5`.

### Recommender inputs (Coverage's own caps)
- `wantedSlugs()` = **every tile whose status is not `covered`** — deliberately **not** the goal's
  members, and deliberately not just `gap` (that would hide partial/present/pending).
  Joins on the tile's **canonical `key`**, never its display name (a display-name join silently
  drops all 12 vitamins, folate, flavonoids and the 3 omegas — pinned by
  `tools/tests/test_nogoal_wanted_join.py`).
- `owned = productIdsForNames(items.map(label.name))` — a `RegimenItem` has no `product_id`.
- `REC_MAX = starterPackSize() + REC_GAP_FILL = 5 + 4 = 9`. `budget = max(0, REC_MAX - owned.length)`.
- `rankProductsForCoverage({want, owned, goals, limit: budget, pinned: starterPackIds(), greedy: true})`.
- Score = `0.6 × adequacy + 0.3 × breadth + 0.1 × value`; breadth saturates as `n/(n+5)`.
  Pinned cards carry a synthetic score above the scored band.
- `REC_PAGE = 3` cards shown. **Nothing about the cap is persisted** — `owned` is re-derived each
  paint, so removing a product brings both the budget and the product straight back.
- Foods: `ownedFoods = items.map(label['food_id'])`, `FOOD_MAX = 12`,
  `foodBudget = max(0, 12 - ownedFoods.length)`, pool = `rankFoodsForCoverage({… limit:
  foodCatalogSize()})` — **the whole catalog is browsable; only ADDING is capped**.
  `FOOD_PAGE = 3`, `foodPages = max(1, ceil(pool/3))`, `foodPage` clamped down when the pool shrinks.

### Goals data
30 goals in 6 categories (`Bones, joints & muscles` 3 · `Mind & nerves` 5 · `Heart & metabolism` 6 ·
`Digestion, immunity & breathing` 5 · `Skin, senses & mouth` 4 · `Reproductive & whole-body` 7).
Each goal: `id`, `name`, `category`, `conditions[]`, `members[]` (5–27 slugs), `groups[]`.
19 of 30 name `plant-derived`. `GOAL_HUES = ['#7c5cff','#12a594','#d6409f','#3e63dd','#f76b15']`,
indexed by **pick order**, and `MAX_GOALS = GOAL_HUES.length = 5` — the palette **is** the cap.
Stored goal ids that no longer exist in the layout are silently dropped, never rendered as an
empty chip.

---

## Copy

Every user-visible string on this surface. Layout strings come from
`coverage-layout-data.json`; `ui(...)` strings from `view-copy.json`; the rest are literals in
`coverage.ts` / `foods-block.ts`.

**Goal strip**
- `Your goals` (`cov_goals_eyebrow`)
- `+ ADD` (`cov_goals_add`)
- `Hover a goal to focus it` (`cov_goals_hint`) — **describes an interaction that does not exist on touch**
- `No goals — the whole field, nothing highlighted` (`cov_goals_none`)
- `Remove {goal name}` (aria-label on each chip X)

**Section / subsection**
- `01` `MINERALS` `// 60 · THE FOUNDATION · ATOMIC SYMBOLS PRESERVED`
- `02` `VITAMINS` `// 16 · THE CO-FACTORS · ENZYME ENABLERS`
- `03` `AMINO ACIDS` `// 12 · PROTEIN BUILDING BLOCKS · ESSENTIAL + CONDITIONAL`
- `04` `FATTY ACIDS` `// 3 · ESSENTIAL LIPIDS · MEMBRANE + SIGNAL`
- `{n} / {n} covered` (section stat)
- `A FOUNDATIONAL · 5   air · water · food · nothing to take`
- `B INDIVIDUALLY DOSED · 21   Wallach names an amount · A→Z`
- `C PLANT DERIVED · 34   no individual amount · one shared verdict`
- Goal-dot `title` = the goal's own name (e.g. `Stronger bones`)

**Tile labels** — 91 display names, e.g. `HYDROGEN`, `PHOSPHORUS`, `SILVER`, `ZINC`, `ALUMINUM`,
`ZIRCONIUM`, `RETINOL`, `THIAMINE`, `RIBOFLAVIN`, `NIACIN`, `PANTOTHENIC ACID`, `PYRIDOXINE`,
`FOLATE`, `COBALAMIN`, `ASCORBIC ACID`, `CHOLECALCIFEROL`, `TOCOPHEROL`, `PHYLLOQUINONE`, `BIOTIN`,
`CHOLINE`, `INOSITOL`, `FLAVONOIDS`, `ARGININE`…`VALINE`, `OMEGA-3`, `OMEGA-6`, `OMEGA-9`.
Fat hints: `n-3 · alpha-linolenic (ALA)`, `n-6 · linoleic (LA)`, `n-9 · oleic (OA)`.

**Ledger**
- `Colour key` (`cov_ledger_eyebrow`)
- `COVERED` · `PARTIAL` · `PRESENT` · `NOT COVERED` · `NO WALLACH NUMBER YET`
- `{n} counted · {n} shown`
- Wording discipline, recorded in the code and binding on any rewrite: the gap row reads
  **NOT COVERED**, not "GAP" — a gap reads as a hole in *our* data when it means Wallach gave a
  number and you are under it. `NO WALLACH NUMBER YET` for the same reason: **the silence is his,
  not a failed lookup.**

**Recommendations**
- `Supplements — based on your goals` (`cov_recs_eyebrow`)
- `adds {n}` · `$12.95` · `{n.n} / $10`
- `"adds" = essentials you are still missing that this product would newly cover; "/ $10" = those
  per $10 spent. The first few are the same starting set for everyone. Click the card to add it.`
  (`cov_rec_tip` — **hover-only**)
- `That is the full starting set from here — nine products is as far as this tab goes. Browse the
  rest in the Products tab any time.` (`cov_recs_cap_reached`)
- `Nothing left to add — every essential a product could reach is already covered.`
  (`cov_recs_done_field`)
- `+` (the add glyph)

**Food sources** `[shared]`
- `FOOD SOURCES` (the label cut into the dotted rule)
- `{portion} · {n} of 90`
- `{n}%` / `{n}% ≈` · chip `{LABEL} {n}%`, `+{n}`
- `Add {food name}` (aria-label)
- `‹` `›` `{n} / {n}` · aria: `More foods` / `Previous foods` / `More foods` (pager nav label)
- Gloss (title): `Food composition from {source}, measured against Dr. Wallach's daily target for
  this nutrient.` + optionally `It is the lowest of the varieties that source measured, so it holds
  whichever kind you eat.` + for APPROXIMATE: `≈ That source lists foods by name rather than by the
  id our catalog uses, so this food was paired with theirs by hand — a close stand-in, not a
  measurement of this exact item.`
- `That's the last food this tab will suggest — the rest live on your Regimen.`
- `No food moves a remaining gap — what's left needs a supplement.`
- Easter egg: `Well, for some reason you added ALL of the foods in our database, not sure why you
  did that but… ` + `click here` + ` to collect your prize!`

**Daily Protocol rail**
- `Current regimen` (`cov_rail_eyebrow`)
- `DAILY PROTOCOL` (`cov_rail_title`)
- `{SLOT NAME} · {n} ITEM(S)`
- `Nothing here yet.` (`cov_rail_empty`) + `Add a food or supplement to begin` (`cov_rail_empty_sub`)
- `YOURS`
- `Remove {item name}` · `Fewer` · `More` (aria-labels) · `−` · `+`
- `{n} tablets/day` etc.
- `FULL REGIMEN →` (`cov_rail_full`)

**Arrival veil / goal picker (reopen mode)**
- `// Let's get started` · `What do you want to work on?` ·
  `Pick anything that matters to you. Wallach wrote about all of it — this just decides what gets
  highlighted first. You can change it any time, and nothing is hidden either way.` ·
  `Your goals` · `{n}/5 selected` · category headings (the 6 above) · 30 goal names ·
  `Show me my field`. (Name field and `I'm just browsing →` appear only on first arrival.)

**Topbar (set by main.ts, not this view)**
- `Coverage` · `Every essential Wallach named, measured against what you take.`

---

## Interaction dependencies

Everything below **cannot survive a touch screen as built**. Each is flagged with what is actually
lost.

1. **⚠⚠⚠ GOAL FOCUS IS HOVER-ONLY, AND IT IS THE GOAL SYSTEM'S ONLY OUTPUT.** `onHover` is bound to
   `mouseover`/`mouseout`. A goal chip has no click handler at all. On a phone, picking goals
   produces: a chip, a ring on member tiles, and a dot on the plant-derived label — and **no way to
   ever ask "which tiles are this goal's?"** The copy literally instructs `Hover a goal to focus
   it`. The rebuild MUST invent a tap-equivalent (tap-to-latch focus, with a visible off state) and
   rewrite that string.
2. **⚠⚠ THE GOAL-REMOVE X IS `opacity: 0` UNTIL `.gchip:hover`.** On touch there is no hover, so
   removing a goal is impossible from Coverage. (The code comment on the *rail* X explicitly says
   "a control that only exists on hover cannot be found on a touch surface at all" — the goal chip
   was never given the same treatment.)
3. **⚠⚠ THE REC RANKING EXPLAINER IS A TWO-STAGE HOVER.** Stage 1: hovering the card reveals a
   dotted underline. Stage 2: hovering the underlined text shows `.rec__tip`. On touch, neither
   stage fires — the entire explanation of `adds N` and `/ $10` is unreachable, so the two numbers
   on every card are unexplained. This was a *deliberate* de-cluttering decision on desktop; on
   mobile it silently deletes the content.
4. **⚠⚠ EVERY FOOD NUMBER'S PROVENANCE IS A `title=` TOOLTIP.** `glossFor()` on the lead and on
   each chip. Owner ruling was that the gloss sits **on the number**, not in a footnote — on touch
   it sits nowhere. This is a §00.A-adjacent problem: the words that say *whose measurement* and
   *whose target* vanish.
5. **⚠ GROUP GOAL-DOT LABELS ARE `title=` TOOLTIPS**, and their whole justification over a single
   gradient bar is that *hovering a goal isolates its dot*. Both halves are hover.
6. **⚠ RAIL ROW NAME AND FOOD TILE NAME BOTH ELLIPSISE WITH `title=` AS THE ONLY FULL TEXT.**
7. **⚠ NO KEYBOARD PATH TO A TILE.** Tiles are `<div>` with `cursor: pointer`. Not focusable, no
   `role`, no accessible name, no `:focus-visible` rule anywhere in the sheet. **The only entrance
   to the essential detail page is a mouse click on a div.** Screen readers get 91 unlabelled boxes.
8. **⚠ NO FOCUS STYLES AT ALL** on `.tile`, `.gchip`, `.rec`, `.rl-dose__b`, `.fs-pager__b`. The
   only `:focus` rule in the sheet is `.wc__name:focus`.
9. **⚠ HOVER IS THE ONLY "THIS IS INTERACTIVE" SIGNAL** for tiles (`translateY(-3px)` + orange rim)
   and for `.rec__add` (fills on card hover — dark theme partially fixes this by making it visible
   at rest).
10. **⚠ 17 × 17 px DOSE STEPPERS** and **18 px pager arrows** and **20 px close buttons** — all far
    under 44 × 44.
11. **⚠ THE FOOD-CHIP FIT RUNS A SYNCHRONOUS MEASURE LOOP** (`rowCount()` reads `offsetTop`,
    repainting until ≤3 rows), gated on `document.fonts.ready`. It is layout-thrashing by design
    and must be re-validated at phone widths — the chip budget (7 chips / 3 rows) was measured
    against a **300 px min-width** card.
12. **⚠ TWO NESTED SCROLLERS.** `.app-workspace` (page) and `[data-rail-list]`
    (`overscroll-behavior: contain`). `withScrollPreserved` restores both on every repaint. Nested
    scroll on touch is a known trap.
13. **⚠ THE STICKY GOAL STRIP DEPENDS ON `.app-workspace` BEING THE SCROLLER.** `top: 0`,
    `z-index: 5`. The document itself never scrolls (`html, body { overflow: hidden }`), so a
    document-relative sticky is a silent no-op here. z-index 5 is load-bearing: it must clear the
    field (`.coverage-grid` z1, tiles z2, rings z3) and sit **below** the drawers (z10) and the
    veil (z60).
14. **⚠ MOUSE-DRIVEN `title` ATTRIBUTES ARE ALSO USED FOR `.rail-panel` and `.fs-tile` names**, and
    the `.rec__tip` is positioned `top: calc(100% + 9px); left: 0; right: 0` — it assumes a
    340 px-wide column with room below.

---

## Desktop-only assumptions

1. **A two-column grid is the layout.** `.cov-d .coverage-grid` = `minmax(0,1fr) / 340px`. The bare
   `.coverage-grid` rule says `380px`; the `.cov-d` rule wins. The aside is a permanent third of
   the screen.
2. **THE RESPONSIVE FALLBACK IS INERT AND SAYS SO.** The `@media (max-width: 1160px)` and
   `@media (max-width: 640px)` blocks target bare `.coverage-grid` / `.essentials-grid--*`, but the
   live DOM nests as `.cov-d > .coverage-grid`, and the 100 px track rule carries `!important`.
   **Nothing in either media block has any effect today.** Do not treat them as a starting point.
3. **THE 100 px TILE TRACK IS `!important` AND WAS DERIVED FROM A 1905 px LAYOUT VIEWPORT.** The
   whole derivation (11 columns × 100 px + 10 × 9 px gap = 1190 of 1193 content px) is a desktop
   measurement. Its two real constraints are worth carrying: **integer track width AND integer
   track position** (fractional positions make the goal ring rasterise unevenly — `justify-content:
   space-between` was measured and rejected for exactly this), and the tightest label
   (`CHOLECALCIFEROL`, 86.27 px) needs air.
4. **9.5 px TILE NAMES, 10 px CODES, `--ds-text-micro` EYEBROWS.** The entire type scale on this
   surface is sub-11 px. That is a big-canvas density choice and is not portable.
5. **THE RAIL IS `position: sticky` WITH `max-height: calc(100vh - 330px)`** — the 330 px is a
   desktop chrome budget, and the panel is documented to stop sticking if it outgrows the viewport.
6. **THE FIELD IS MEANT TO BE SEEN AT ONCE.** The design argument for group dots over per-tile
   rings ("lighting 34 of 91 tiles reads as free credit") assumes you can see 91 tiles
   simultaneously. On a phone that argument does not hold and must be re-decided, not ported.
7. **`.ds-border-travel`** runs two infinite 8 s pseudo-element sweeps around the field. Ambient
   desktop decoration; a battery cost on phone. (`prefers-reduced-motion` in `design-system.css`
   caps iterations, not just duration.)
8. **STYLIZED `::-webkit-scrollbar`** rules (11 px, accent-gradient thumb) — meaningless on touch.
9. **THE SUBSTRATE REGISTRATION GRID** (`background-size: 26px`, ~3-value delta) is deliberately at
   the edge of perception at desktop DPI. Dark theme removes it entirely.
10. **The `.rec__tip` tooltip, the `.gchip:hover` X reveal, and the two-stage `.rec__q` disclosure**
    are all "the desktop has a cursor" affordances.
11. **The three-card / three-food page sizes** were budgeted against a measured 1440 × 900 aside
    ("four cards fit, but a foods block is planned beneath").
12. **The goal strip is one horizontal `flex-wrap` row** with two eyebrows, up to 5 chips and an add
    chip. At 375 px this wraps to a wall.

---

## Feature-preservation contract

A rebuilt Coverage surface must satisfy every line below. Anything struck from this list is a
deliberate, recorded decision being reversed — which needs the owner, not a designer.

**The field**
1. All **91 tiles** render; exactly **90 count**. Omega-9 shows and is excluded from every total.
2. All four sections and all three mineral subsections survive, with their `num`, `title`, `sub`,
   `rank`, `label`, `· count` and `hint` strings.
3. Every tile shows its family glyph set: `num`+`sym` (minerals), `code`+`letter` (vitamins),
   `code`+`abbr` (aminos), `code`+`hint` (fats), plus the display `name` in every case.
4. All **six** status states remain visually distinct — including `present` (blue/hollow, "here but
   unmeasurable") which had *zero* CSS once and rendered identically to pending. That regression
   must not recur.
5. `partial` tiles show their **real fill ratio** from `fillPercent`, not a binary.
6. `covered` must read as covered without becoming a trophy. **The durable rule outranks any
   experiment: the app is a map of gaps.** Do not add a standing badge to a covered tile.
7. Goal membership stays on a **separate channel** from status. Status owns the interior; goals own
   the edge. Never merge them into one indicator.
8. A `covered` tile carries **no** goal ring and **no** group dot — but must still respond to goal
   focus.
9. Multi-goal tiles show all their hues in one geometry identical in weight to the single-goal case.
10. The **plant-derived 34 are marked as a GROUP, never as 34 individual marks.** One separable,
    per-goal indicator that can be isolated — not a merged gradient.
11. Tapping/activating any tile opens that essential's Knowledge page. **This is the only entrance
    to it.** Resolve display name → slug (16 of 91 differ from their key).

**Numbers and honesty**
12. The **denominator is always 90**, byte-identical before goals, after goals, and during focus. A
    goal may change what you look at and what you are recommended; it may never change what you are
    measured against.
13. The ledger keeps all **five** status rows with their exact wording, the zero-dimming, and the
    `{counted} counted · {shown} shown` reconciliation.
14. The section stat keeps `{covered} / {total} covered` per section, counting `covered|trace` over
    `essential !== false`.
15. `adds N` on a rec card **never gains a denominator**.
16. Every price is **wholesale**.
17. No number in this view is computed in the view. Every verdict is read from
    `CoverageSnapshot`; the dose stepper hands a scale to the engine and the engine decides.
18. `readItemDose()` must keep mirroring `readScale()`'s resolution order exactly
    (override → `label.servings` → 1) or the rail lies about the field.

**Goals**
19. Up to **5** goals, hues by pick order, one colour = one goal everywhere on the surface.
20. Stale goal ids are dropped, never rendered as an empty chip.
21. `+ ADD` opens the real goal picker. **An inert "+ ADD" is a label that lies.**
22. Goal focus must exist and must be reachable **without a pointer**. Its transience was the safety
    property (a fade that lasts as long as a cursor cannot teach that anything is unimportant) — a
    latched mobile equivalent needs a visible, obvious off state.
23. Goal removal must be reachable without hover.

**Recommendations**
24. Up to 3 product cards; **no pager** — the list advances because owned products leave it.
25. The **9-product cap** (5 pinned starter pack + 4 gap-fills), derived, never persisted, counting
    what you OWN not what was shown.
26. The two terminal notes stay distinct (cap reached ≠ field closed).
27. Goal tint on the card **border only** — no per-goal dots (measured dead channel; do not
    re-propose a %-of-target threshold, all four levels were measured).
28. 1-click add from the card itself, routed through `addOrBumpRegimenItem` (same-named item bumps
    its dose rather than duplicating a row).
29. The ranking explanation must be **reachable** on the rebuilt surface, in whatever form.

**Foods**
30. Up to 3 food tiles below the products, behind a labelled `FOOD SOURCES` rule.
31. **12-food cap on adding; the whole catalog stays browsable** via the pager.
32. Design-F card contract holds: name bar spanning full width, control at the name's optical
    centre, one big lead percentage, the rest as chips, **≤7 chips, ≤3 rows, `+N` equal to what was
    actually dropped**, measured after `document.fonts.ready`.
33. The portion label must appear beside every percentage — `28% of a target, per WHAT?`
34. The `≈` approximate mark and the provenance gloss must both survive, **on the number**.
35. Category colours are fixed: minerals blue, vitamins orange, fatty acids purple. Aminos get no
    colour here on purpose.
36. Page index is session-only, held by the caller, clamped when the pool shrinks.

**Daily Protocol rail**
37. Rows for every regimen item, with the honest empty state.
38. Active slot **name** shown read-only; **no slot switcher** (that lives in Regimen).
39. `YOURS` on user-supplied items only.
40. Inline dose stepper counting the product's **own units**, minus disabled at one unit, step
    relative (so PDM's sourced 1.54 → 2.54, never rounded to 2), floor of one unit (0/day is a
    removed item).
41. 1-click remove per row, **not** hover-revealed.
42. Exactly one action button: `FULL REGIMEN →`. `MANAGE` and `ADD ITEM` were deliberately killed.
43. **No "this item covers N tiles" claim anywhere on a row.**

**Mechanics**
44. One delegated click listener; the tile check runs **last** so every action control inside the
    field wins.
45. Scroll position preserved across every repaint, for **both** scrollers (or their mobile
    equivalents).
46. `body.focusing` cleared on every paint (a stationary cursor over a just-removed chip fires no
    mouseout — the mobile analogue is a latched focus surviving a rebuild).
47. Every product / food / item **name** is written with `.textContent`. Escape at the sink.
48. Repaints are driven by `coverage:recomputed` and `regimen:changed` only.
49. Both themes fully designed — dark is not a token flip here; ~15 scoped overrides exist today.
50. `prefers-reduced-motion` respected (the field currently runs two infinite border sweeps and a
    0.5 s fill transition).

---

## Open questions

1. **Goal focus on touch is unsolved and it is the single biggest hole.** Tap-to-latch is the
   obvious answer but changes the *transience* that was the feature's stated safety property. This
   needs an owner decision, not a designer's default.
2. **Does the whole-field-at-once argument survive a phone?** The reason the 34 plant-derived
   minerals get one group mark instead of 34 rings is that lighting ~37 % of a visible field reads
   as free credit. On a 375 px screen you never see 91 tiles at once. The group mark is still
   *correct* (they share one verdict), but the *justification* changes. Recorded, not resolved.
3. **The rec explainer and the food provenance gloss both need a home that is not a tooltip.** A
   sheet? A tap-to-expand row? Whatever it is, the food gloss must stay *on the number* per the
   owner's 2026-08-21 ruling — is a tap target on a chip acceptable as "on the number"?
4. **The 100 px / 9 px integer-track derivation does not transfer.** The transferable constraint is
   *integer track width and integer track position* (for ring crispness) plus label air. What the
   mobile numbers should be is unknown until measured against the real face at 375 px.
5. **Does the aside become a second screen, a bottom sheet, or a section below the field?** The
   recommendations → adopt → tiles light → ledger moves loop is the surface's whole point, and it
   currently depends on seeing the field and the cards at the same time. Not determinable from the
   code.
6. **`trace` status**: dead in the producer, alive in `subCovered()` and the section stat, absent
   from the ledger. Should the rebuild drop it or wire a sixth ledger row? (Today it would break
   the sum.)
7. **Dead code the rebuild should not carry**: `.tile--blend` (emitted, no CSS); `.is-foundation`
   and `.rail__brand-name` (CSS, never emitted here); `.tile.covered::after` (declared, paints
   nothing, comment says it can be deleted outright); both `@media` blocks (inert);
   `data-covered-variant='b'` (author-only switch). Confirm each before deleting.
8. **Drift found while reading**: `renderGroupDots`'s comment claims *20 of the 30* goals name the
   plant-derived group; the shipped data says **19**. Its sibling statistic ("on a 5-goal pick all
   five dots light only ~11 % of the time") is derived from that 20 and should be re-derived.
9. **The food easter egg links to an external YouTube URL** from an app whose contract is *no
   network at runtime*. It is only reachable by adding every food in the catalog, but it exists.
   Keep, cut, or make it offline?
10. **Nothing in this view is focusable except the buttons.** Whether the rebuild makes tiles real
    `<button>`s (91 tab stops) or uses a roving-tabindex grid pattern is an open design decision
    with real screen-reader consequences.
