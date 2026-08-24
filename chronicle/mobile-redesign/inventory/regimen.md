# Regimen — feature inventory

_Read from source, then verified by driving the real `file://` app headless (puppeteer, 1440×1000
and 375×812). Sources: `dashboard/assets/js/src/views/regimen.ts` (1803 lines),
`dashboard/assets/styles/workspace-regimen.css` (592 lines), plus the shared pieces the surface
cannot be rebuilt without: `views/foods-block.ts` (597), the `.fs-*` block in `dashboard.css`
(lines 404–640), the shared `.coverage-grid / .rail-panel / .recs / .rec / .goalstrip / .gchip /
.ui-close` rules in `workspace-coverage.css`, `state/recommender.ts`, `state/foods.ts`,
`state/regimen.ts`, `core/dose-units.ts`, `state/starter-pack.ts`, `state/dose-defaults.ts`,
`core/goal-display.ts`, `views/gloss-tooltip.ts`._

**This surface is internally called "the Cockpit."** It is `.ck`-scoped and was ported verbatim
from an approved static desktop mockup. Nothing below is a placeholder — every number on screen
is live.

---

## Destinations & states

The Regimen workspace is ONE scrolling page (`#workspace-regimen-mount` → `.ck`), never a route.
Its state space is the product of six independent axes. All of them must survive the rebuild.

### A. Page-level structure (always all five, in this order)

| # | Block | Element | Notes |
|---|---|---|---|
| 1 | Save-slot switcher | `.ck-slots` (`role="tablist"`) | 4 tiles, ALWAYS 4 (filled + empty padding) |
| 2 | Hero console | `.ck-console` | status bar, gauge, category cluster, 90-cell readout |
| 3 | Goals strip | `.goalstrip.ck-goals` | per-slot, 0–5 chips + "＋ Add goal" |
| 4 | FOOD SOURCES block | `.fs-block[data-foodsblock]` | dotted rule + 3 tiles + pager + filter |
| 5 | Best next moves (products) | `.recs.ck-recs` → `.ck-recgrid` | 3 product cards |
| — | Active stack rail | `.ck-rail` | 2-col grid sibling of 2–5 on desktop |

Blocks 2–5 live in `.coverage-main.ck-main`; the rail is the second column of `.coverage-grid`.
On desktop the grid is 2 columns; measured at 375px it collapses to a single 283px column and
the rail simply falls to the bottom of a ~2284px-tall page.

### B. Slot-tile states (per tile, 4 tiles)

1. **Filled + active** — `.ck-slot--filled.ck-slot--active`. Full-saturation hue block.
2. **Filled + saved (inactive)** — `.ck-slot--saved`. Same hue, `opacity: .39` (`.58` on hover).
3. **Filled + delete confirm overlay** — `.ck-slot__confirm` covers the whole tile.
4. **Empty** — `.ck-slot--empty`, dashed, shows the padded index (`01`…`04`) as a `::before`.
5. **Renaming** — `.ck-slot__name[contenteditable="true"]`, caret in the coloured block.
6. **Delete button hidden** — when `doc.slots.length === 1` the trash icon is not rendered at all
   (the last save cannot be deleted).

### C. Console states

- **Normal** — gauge shows `covered / 90`; the covered arc + the accent goal-gap arc.
- **First paint only** — the centre numeral counts up 0→covered over 1150 ms (cubic ease-out);
  `animated` is a mount-scoped latch so it never replays on a re-render.
  Reduced motion → the number is set instantly.
- **Category row empty** — `.ck-cat--empty` greys the meter when `covered === 0` for that bucket.
- **Readout** — exactly 90 `<i>` cells, re-sorted `covered → goalgap → open`.

### D. Goals strip states

- **No goals** (default) — eyebrow + "＋ Add goal" only.
- **1–4 goals** — chips + "＋ Add goal".
- **5 goals (MAX_GOALS)** — the add chip is **not rendered**; the strip is full.

### E. FOOD SOURCES states (from `buildFoodsBlock`)

1. **Normal** — 3 tiles (`FOOD_LIMIT`), numbered pager, category select + name box.
2. **Education / all-90-covered** — leading note: _"Your 90 are covered — these are simply the
   most nutritious foods."_ Ranking unchanged.
3. **Filter matches nothing** — _"No food in the catalog matches that filter."_ + controls kept
   on screen (deliberate: a filter that hides itself strands the reader).
4. **Nothing left that moves a gap** — _"No food moves a remaining gap — what's left needs a
   supplement."_
5. **Coverage-cap variant** (`capReached`) — Regimen never sets it; string exists in the shared
   builder.
6. **Exhaustion easter egg** — user owns every food in the catalog: a sentence + a link
   ("click here") to a YouTube URL. **This is the only outbound network link in the surface and
   it is a rickroll.** No controls painted under it.
7. **Pager absent** — `pagerNode` returns null when `pages < 2`.

### F. Recommendations states (`buildRecs`)

1. **Normal** — up to 3 cards (`REC_LIMIT`).
2. **No product fits** — _"No product fills a gap right now — your stack already reaches these."_
3. **THE END STATE (all 90 covered)** — _"All 90 essentials are now covered — no more
   recommendations needed."_ **plus** a quiet dashed button, _"Explore the Products tab"_, which
   emits `knowledge:open-tab {tab:'products'}` (NOT `wallach:navigate` — Products is a tab inside
   the Knowledge drawer, so navigate cannot reach it). Both are grid items spanning `1 / -1`.
   The all-covered test is `field.covered >= essentialCount()`, deliberately **not**
   `wantedSlugs().length === 0` — omega-9 is `essential:false` and capped at `present`, so the
   latter could never fire and the finish line would be unreachable.

### G. Active-stack rail states

1. **Empty** — `.rail-empty`: _"Nothing in this save yet."_ / _"Add a product below, or scan a
   label."_
2. **Populated** — one `.rr-row` per item.
3. **Row in remove-confirm** — the row is REPLACED in place by `.rr-row--confirm` (warn-tinted).
4. **Row flash** — `.rr-row--flash` pulses once, 1.15 s, when a product added from the Knowledge
   Products tab navigates here (name-keyed via `data-rr-name`).
5. **Typeahead closed / open / no-match** — `.rr-results[hidden]`, up to 3 rows, or
   _"No product matches "X"."_
6. **Recycle-bin trigger present / absent** — rendered only when
   `slotTrash.length + trash.length > 0`.

### H. Recycle bin (modal, `role="dialog" aria-modal="true"`)

1. **Closed** (default).
2. **List view** — "Restore deleted": a horizontally scrolling gallery of deleted SAVES
   (`.rc-gal`, `.rc-gtile` 152px each) + a vertical list of removed ITEMS.
3. **Saves empty** / **items empty** — _"No deleted saves."_ / _"No removed items."_
4. **Item whose origin save is gone** — meta shows a red `"<name> · deleted"` then _"· will
   restore to active save slot · <when>"_.
5. **Replace-a-save step** — reached when Restore is hit on a deleted save while all 4 slots are
   full. Back arrow, radio group of the 4 current saves, a `→ bin` marker on the selected row, a
   sticky footer with a summary line, Cancel and "Replace & restore".
6. Escape backs out of the replace step to the list first, then closes.

### I. Toast

`.ck-toast`, fixed, bottom-centre, max 340px, auto-hides after **8000 ms**. Refusal-only — there
is no undo action button any more.

### J. Themes

Cream default; `:root[data-theme="dark"]` overrides live in `theme.css` (`.fs-grid` category
hues, `.ui-close`, `.fs-ctl--add:hover`). Both must be redesigned.

---

## Controls

| Control | What it does | Where it lives | Touch-hostile? |
|---|---|---|---|
| Slot tile body | `setActiveSlot(id)` — switches the whole app's live regimen | `.ck-slot[data-slot]` | **40.3 × 144.6 px at 375px** — four tiles in a `flex:1 1 0` row. Unusable. |
| Slot rename pencil | Turns `.ck-slot__name` contenteditable, selects all | `[data-slot-rename]` | **24 × 24 px.** Also: contenteditable + virtual keyboard. |
| Slot export | Downloads `wallach-regimen-<slug>-<date>.json` via Blob + `a.click()` | `[data-slot-export]` | **24 × 24.** Programmatic download is unreliable on mobile. |
| Slot delete (trash) | Step 1: overlays the inline confirm | `[data-slot-delete]` | **24 × 24.** Hidden when only 1 slot. |
| Confirm Cancel / Delete | Step 2 of the destructive delete | `[data-slot-confirm-cancel]` / `[data-slot-confirm-do]` | `.rr-btn` at ~26px tall |
| Colour swatch × **14** | `setSlotColour(id, hue)` | `.ck-swatch[data-swatch]` | **10 × 10 px, 14 of them, 7px apart, inside a 40px tile at 375px.** The single worst control in the app. |
| Empty-slot tile | `addSlot()` then `setActiveSlot()` | `.ck-slot--empty` | large-ish but 40px wide at 375 |
| Empty-slot Import | Opens an OS file picker, reads JSON, `importSlot()` | `[data-slot-import]` | ~22px tall pill inside a 40px tile |
| Goal remove ✕ | `saveRgUserGoals(filtered)` | `.gchip__x[data-goal-remove]` | **`opacity: 0` at rest — revealed ONLY by `.gchip:hover`. Verified computed opacity `0` in the live app. On touch this control is INVISIBLE.** 20 × 20 px. |
| ＋ Add goal | `window.dispatchEvent('wallach:open-welcome')` — reopens the full arrival veil as a goal picker | `[data-goal-add]` | 102 × 30 px |
| Readout cell (90×) | Not a control — a `[data-tip]` hint routed through `gloss-tooltip.ts` (which DOES handle tap) | `.ck-readout__field i` | **Measured 9.5 × 9.5 px at 1440 and 0 × 0 px at 375px.** The whole readout collapses to a 5px-tall strip. |
| Food tile add ＋ | `addCatalogFood(foodId)` | `.fs-ctl--add[data-food-add]` | 28 × 28 (below 44) |
| Food lead % / chips | `title=` provenance gloss | `.fs-lead`, `.fs-chip` | **Native `title` tooltips — they never appear on touch. The entire provenance story disappears on a phone.** |
| Food pager ‹ 1 2 3 4 5 … 64 › | `foodPage = n; paintFoods()` | `.fs-pager__b[data-food-page]` | **22 × 22 px, 4px gaps, 8 buttons in one row.** Measured overflowing to `x = -41` at 375px. |
| Food category select | `foodCategory = value; foodPage = 0` | `.fs-filter__cat[data-food-cat]` | **22px tall**, 163px wide, overflows to `x = -33` at 375 |
| Food name search | `foodQuery = value; foodPage = 0` | `.fs-filter__q[data-food-q]` | **22px tall, fixed `width: 225px`** in a 283px row |
| Product rec card | Whole card is one `<button>`; `addItem(name)` | `.rec[data-rec-add]` | 300px min-width in a 283px grid → overflow |
| Rec ＋ badge | Decoration only (the card is the button) | `.rec__add` | fills only on `.rec:hover` |
| "Explore the Products tab" | `emit('knowledge:open-tab', {tab:'products'})` | `.ck-recs__go[data-open-products]` | end state only |
| Dose − / + | `saveRgOverride(id, {scaling_factor})` | `[data-dose-down]` / `[data-dose-up]` | **24 × 24 px.** And see the defect below. |
| Row remove ✕ | Swaps the row to a Keep/Remove confirm | `.ui-close--sm[data-row-remove]` | 28 × 28 |
| Keep / Remove | Backs out / `saveRgRemoved(new Set([id]))` → Trash | `[data-row-keep]` / `[data-row-confirm-remove]` | `.rr-btn` |
| Add-a-product input | Typeahead; top-3 vault matches by substring | `.ck-addfield__input[data-add-input]` | 41px tall; carries a `<kbd>/</kbd>` hint that is meaningless on a phone |
| Typeahead Add | `addItem(name)` | `.rr-results__add[data-ta-add]` | ~28px tall pill |
| "Scan your own item →" | `wallach:navigate {to:'scanner'}` | `.rr-scan__link[data-scan-new]` | inline text link |
| "Restore Deleted Slots & Items" | `openRecycle()` | `.rc-trigger[data-rc-open]` | full-width dashed, ~36px |
| Bin close ✕ / backdrop | `closeRecycle()` | `[data-rc-close]`, `[data-rc-backdrop]` | 34px |
| Bin: Restore (save) | `restoreDeletedSlot(key)` or opens the replace step | `[data-rc-restore-slot]` | inside a horizontally scrolling gallery |
| Bin: Restore (item) | `restoreDeletedItem(id)` | `[data-rc-restore-item]` | ~28px pill |
| Replace step: pick | Selects which save goes to the bin | `.rc-rep-row[data-rc-pick]` (`role="radio"`, `tabIndex 0`) | full-width row, OK |
| Replace step: back / cancel | Returns to the list | `[data-rc-back]` | 30px circle |
| Replace & restore | `restoreDeletedSlot(key, pickId)` | `[data-rc-replace]` | sticky footer button |

### Keyboard-only controls (must be replaced, not ported)

| Key | Effect | Source |
|---|---|---|
| `/` | Focuses the add-a-product field when Regimen is visible (`container.offsetParent !== null`) | `slashFocus` |
| `Enter` in the add field | Adds the FIRST typeahead match, else the raw typed text | `keyHandler` |
| `Enter` while renaming | Blurs → commits the name | `beginRename` |
| `Escape` | Replace step → list; list → closed | `escHandler` |
| `2` | Global rail shortcut into this workspace | `main.ts` |

---

## Data points rendered

### Save-slot tile

| Datum | Source field | Format/unit | Why it matters |
|---|---|---|---|
| Slot name | `slot.name` | text, ellipsised, `title=` full | identity of the save |
| Covered count | active: `snapshot.coveredCount`; others: `coveredCountForItems(slot.items, slot.overrides)` | `47` big + `/90` small | **Same engine both ways — a saved slot's number equals what it reads once active.** |
| Denominator | `essentialCount()` = **90** | integer | never a goal-narrowed number |
| Item count | `slot.items.length` | `N items` / `1 item` | |
| Edited-at | `slot.editedAt` (ISO date) via `relEdited()` | "edited today" / "1 day ago" / "N days ago" / "1 week ago" / "N weeks ago"; falls back to the raw ISO on a parse failure | |
| Meter fill | `round(covered/90*100)` | `width:N%` | |
| Slot hue | `slot.colour`, validated against the 14-hue palette; default `#ff7e3c` | CSS `--sc` | |
| Empty index | tile position | `01`…`04`, zero-padded | |
| aria-label | composed: name, active/saved, `N of 90 covered`, item count, edited | | the only screen-reader summary |

### Hero console

| Datum | Source field | Format/unit | Why it matters |
|---|---|---|---|
| Active slot name | `active.name` | `Coverage · <name>` | |
| Slot ordinal | index in `doc.slots` + 1 | `Slot 01` | |
| Item count + edited | as above | `Slot 01 · 0 items · edited today` | |
| Gauge covered | `field.covered` | animated integer | the headline number |
| Gauge denominator | `essentialCount()` | `of 90 covered` | fixed, always |
| Covered arc | `covered/90*100` | `stroke-dasharray:N 100` on `pathLength=100` | |
| Goal-gap arc | `goalGap/90*100`, rotated to start where the covered arc ends | accent stroke | |
| Category rows ×4 | `snapshot.byCategory[bucket]` | `covered/total` + % meter | |
| Category buckets | `other`→**Minerals** (60), `vitamins`→**Vitamins** (16), `aminos`→**Amino acids** (12), `fatty-acids`→**Fatty acids** (2) | | **Surprising: the minerals bucket key is literally `other`.** |
| Category hues | hard-coded in `CATEGORY_ROWS` | `#2b6fb0` / `#c8781a` / `#5aa82c` / `#8a4fae` | the fixed house coding |
| Legend | `field.covered / goalGap / open` | "5 covered · 0 goal-gap · 85 open" | |
| Readout label | same three | "90-essential readout · 5 covered · 0 goal-gap · 85 open" | |
| 90 cells | `snapshot.tiles` filtered `noTargetReason !== 'non_essential'` | one `<i>` each, class `covered` / `goalgap` / `''`, sorted into three blocks (stable sort, so canon order survives inside each) | **the map of gaps** |
| Cell hint | `data-tip="<Element> · covered\|goal-gap\|open"` | e.g. `"Sodium · goal-gap"` | the only per-element identification |

**goal-gap** = an UNCOVERED essential that is a member of an active goal. Verified live: 3 goals
(bones + heart + thyroid) turned 33 open cells into goal-gap. **The denominator never moves.**

### Goal chip

`g.name` from `coverage-layout-data.json` (30 goals available), hue = `GOAL_HUES[pickIndex]`
(`#7c5cff #12a594 #d6409f #3e63dd #f76b15`), capped at `MAX_GOALS = 5` (derived from the palette
length — the palette IS the cap).

### Food tile (design F, signed off 2026-08-21 — `render_probe_food_tile.js` gates it)

| Datum | Source field | Format/unit | Why it matters |
|---|---|---|---|
| Food name | `rec.name` | text, ellipsised, `title=` full | |
| Portion | `rec.portionLabel` | `"3 oz"`, `"1 cup"` | **without it every percentage is unreadable — % of a target, per what?** |
| Breadth | `rec.breadth` (= `hits.length`) | `9 of 90` | NOT the artifact's `breadth` (which counts nutrient rows and omits the EFA group) |
| Lead % | `hits[0].pct` | `392` + `<sup>%</sup>` | percentage of **Wallach's** daily target one serving delivers |
| Lead nutrient | `hits[0].label` | `Copper` | dotted underline |
| Chips | `hits[1..]` | `CHOLINE 362%` | up to `CHIP_CAP = 7`, then shrunk until ≤ `MAX_CHIP_ROWS = 3` rows |
| "+N" badge | actual dropped count, recomputed on every shrink | `+8` | a truncation that lies about its own size is the one thing the reader cannot check |
| Accent hue | `--fs-cat-<lead.category>`: minerals `#2b6fb0`, vitamins `#ff7e3c`, fatty_acids `#7d4a86` | | **amino acids have NO entry on purpose — a food can never credit one (presence-covered, no numeric target)** |
| APPROXIMATE mark | `hit.tier === 'APPROXIMATE'` | `≈` on chip and lead | |
| Provenance gloss | `glossFor(hit)` → `title=` | "Food composition from USDA FoodData Central, measured against Dr. Wallach's daily target for this nutrient." (+ a conservative-floor sentence, + an APPROXIMATE explanation) | **the §00.A honesty of the whole block — and it is hover-only today** |
| `data-hits` | `rec.hits.length` | probe hook | |
| Pager page count | `ceil(pool.length / 3)` — **64 pages** on the shipped catalog | `1 2 3 4 5 … 64` | derived from `foodCatalogSize()`, never stored |
| Categories | `foodCategories()` | Beef, Dairy & eggs, Fish & shellfish, Fruits, Lamb/veal/game, Legumes, Nuts & seeds, Pork, Poultry, Spices & herbs, Vegetables (+ "All foods") | read from the catalog, never a written-down list |

Not rendered but present on `FoodHit` and needed by any richer mobile card: `amount` + `unit`
(the numerator behind `pct`, in **Wallach's own unit** for that essential), `slug`, `conservative`.

### Product rec card (`CoverageRec`)

| Datum | Source field | Format/unit | Why it matters |
|---|---|---|---|
| Name | `productName(productId)` from the generated vault | `.textContent` (escape at the sink) | never hand-typed |
| **Price** | `agg.price` — **wholesale** | `$48.95` (`toFixed(2)`) | **wholesale is the featured price everywhere in this app** |
| Supplies | count of still-OUTSTANDING essentials this product reaches | `+26 essentials` / `+1 essential` | under greedy this means "N you do not have yet" |
| Goal tags | `goalIds` → goal names | `.ck-tag`, tinted by pick-order hue | |
| Ring | 0 goals → neutral gradient; 1 goal → hue→transparent; 2+ → multi-hue gradient | `--recRing` | |
| Computed, NOT shown | `breadth`, `score`, `perTenDollars` (supplies per $10) | — | **`perTenDollars` is computed and thrown away here; Coverage shows it.** |

Ranking inputs: `want` = every tile whose `status !== 'covered'` (deliberately broader than
`gap` — `partial`, `present` and blank are all still unfinished); `owned` = product ids already
in the slot (which is what makes the list terminate, with no stored list to drift);
`goals` (tint only); `limit = REC_LIMIT = 3`; `pinned = starterPackIds()`; `greedy = true`.
Score shape: `0.6·adequacy + 0.3·breadth + 0.1·value`, breadth saturating as `n/(n+5)`.
Pinned cards carry a synthetic score above the whole scored band (`PIN_SCORE_BASE = 2`).
Kids products (`kids-exclusion`) and superseded products are filtered BEFORE the yardsticks are
derived, so an excluded product cannot skew a survivor's score.

### Active-stack row

| Datum | Source field | Format/unit | Why it matters |
|---|---|---|---|
| Item name | `item.label.name` | `.textContent`, ellipsised, `title=` full | |
| Provenance | `isUserSupplied(item.provenance)` | **"Your own"** (tech blue) or **"Eden"** (faint) | says whether the app or the user vouched for the composition |
| Dose count | `doseCount(readItemDose(item), doseUnitsOf(item.label))` | integer, or 2-dp when fractional (PDM's sourced 1.54) | |
| Dose unit | `doseUnitLabel(count, units)` | `capsules/day`, `tablet/day`, `serving/day` — singular at exactly 1 | reading "1" as one tablet when the serving is 2 is the ambiguity this fixed |
| Minus disabled | `atMinimumDose(dose, units)` | at one UNIT | see the defect in Open questions |
| `data-rr-name` | lowercased name | the flash hook from Knowledge | |

Dose resolution order (`readItemDose`, mirroring `state/coverage.readScale`):
`override.scaling_factor` → `label.servings` → `1`. Starting quantities come from
`dose-defaults.json` via `defaultServingsFor(productId, servingUnits)`; every product not listed
starts at exactly one Youngevity label serving. **These are not Wallach doses and structurally
cannot become one** (the schema has no `wallach` provenance member).

### Typeahead row

Name + either `covers N of 90 essentials` (from `productSupplies()`, counting distinct
`matchEssential()` hits over the product's nutrients) or `single-ingredient product`.

### Recycle bin

Save tile: name, `covered/90`, `N items`, hue, `relAge(deletedAt)` ("just now" / "Nm ago" /
"Nh ago" / "yesterday" / "N days ago" / "N weeks ago"). Item row: name, origin save name,
`relAge(removedAt)`, and the origin-deleted warning. Caps: **`MAX_SLOT_TRASH = 7`** saves,
**`MAX_ITEM_TRASH = 4`** items, newest-first, no expiry.

---

## Copy

Every user-visible string on the surface. `<x>` marks an interpolation.

### Topbar (set by `main.ts`, not by the view)
- name: `Regimen`
- deck: `Design your own protocols based on your goals + Import and export regimens for yourself or others`
- rail item: `Regimen` (icon `▤`, kbd `2`)

### Save slots
- `Empty Slot`
- `Add a save`
- `Import`
- `<N>/<90>`  ·  `<N> items` / `1 item`
- `edited today` · `1 day ago` · `<N> days ago` · `1 week ago` · `<N> weeks ago`
- aria/title: `Rename this save` · `Rename` · `Export this save to a file` · `Export this save` ·
  `Delete this save` · `Delete` · `Empty save slot <N>, add a new regimen` ·
  `Import a saved regimen from a file` · `Import a saved regimen (.json)` · `Slot colour` ·
  `Save slots` · `<N> of 90 covered` ·
  `<name>, active save slot|saved slot, <N> of 90 covered, <N> items, <edited>`
- Slot delete confirm: `Delete this save?` / `<N> items → Trash` / `Cancel` / `Delete`
- Default new-slot name: `Slot <n>`

### Console
- `Coverage · <slot name>`
- `Slot <NN> · <N> items · <edited>`
- `of <90> covered`
- `By category` · `Minerals` · `Vitamins` · `Amino acids` · `Fatty acids`
- `<N> covered` · `<N> goal-gap` · `<N> open`
- `90-essential readout · <N> covered · <N> goal-gap · <N> open`
- cell hint: `<Element> · covered` / `· goal-gap` / `· open`
- aria: `Coverage gauge` · `<N> of 90 essentials covered`

### Goals
- `Your Goals`
- `＋ Add goal`
- aria: `Remove <goal name>`
- (30 goal names live in `coverage-layout-data.json`: Stronger bones, Healthy joints,
  Muscle & strength, Sharper thinking, Better mood, Better sleep, Focus & attention,
  "Nerves, Seizures, MS & ALS", Heart health, Circulation, Blood-sugar balance, Thyroid support,
  More energy, A healthy weight, Better digestion, Liver support, Stronger immunity,
  Allergy relief, Easier breathing, "Healthy skin, hair & nails", Healthy eyes & vision,
  Healthy gums & teeth, Hearing & balance, Hormones & fertility, Healthy pregnancy,
  Prostate & men's health, Women's health & cycle, Kidney & urinary health, Calm inflammation,
  Cancer support.)

### Food sources
- rule label: `FOOD SOURCES`
- `<portion> · <N> of 90`
- `+<N>` (chip truncation)
- `Your 90 are covered — these are simply the most nutritious foods.`
- `No food moves a remaining gap — what's left needs a supplement.`
- `That's the last food this tab will suggest — the rest live on your Regimen.` (shared builder; Regimen does not set it)
- `No food in the catalog matches that filter.` (`fs_filter_none`)
- easter egg: `Well, for some reason you added ALL of the foods in our database, not sure why you did that but… ` + `click here` + ` to collect your prize!`
- gloss (on every number): `Food composition from <source>, measured against Dr. Wallach's daily target for this nutrient.`
  - conservative suffix: ` It is the lowest of the varieties that source measured, so it holds whichever kind you eat.`
  - APPROXIMATE suffix: ` ≈ That source lists foods by name rather than by the id our catalog uses, so this food was paired with theirs by hand — a close stand-in, not a measurement of this exact item.`
- filter: `All foods` · `Find a food…` · aria `Filter foods by category` / `Find a food by name`
- pager aria: `More foods` (nav + next) · `Previous foods` · `Foods, page <n> of <of>`
- pager glyphs: `‹` `›` `…` · arrows-variant readout `<n> / <N>`
- aria on add: `Add <food name>`

### Recommendations
- eyebrow: `Best next moves`
- note: `Products, ranked by your goals`
- `$<price>` · `+<N> essentials` / `+<N> essential`
- `No product fills a gap right now — your stack already reaches these.`
- `All 90 essentials are now covered — no more recommendations needed.`
- `Explore the Products tab`
- `＋` (the add badge glyph)

### Active stack
- `Active stack`
- `<slot name>`
- `Slot <NN> · <N> items · <edited>`
- `Nothing in this save yet.` / `Add a product below, or scan a label.`
- `Your own` / `Eden`
- `<N>` + `capsules/day` · `tablets/day` · `softgels/day` · `gummies/day` · `servings/day` (singular at 1)
- aria: `Fewer` · `More` · `Remove <item name>` · `Add a product`
- placeholder: `Add a product…`; kbd hint `/`
- typeahead: `covers <N> of 90 essentials` · `single-ingredient product` · `Add` ·
  `No product matches "<query>".`
- remove confirm: `Remove <name>? It moves to Trash — you can restore it.` / `Keep` / `Remove`
- `Not in the catalog? ` + `Scan your own item →`

### Recycle bin
- trigger: `Restore Deleted Slots & Items`
- title: `Restore deleted`
- sub: `The 7 most recent deleted save slots and 4 most recent items are stored here.`
- `Deleted saves` `<n> / 7` · `Removed items` `<n> / 4`
- `No deleted saves.` · `No removed items.`
- `<N> items` · `Restore`
- `from <save name> · <when>` · `<save name> · deleted` + ` · will restore to active save slot · <when>`
- `just now` · `<N>m ago` · `<N>h ago` · `yesterday` · `<N> days ago` · `1 week ago` · `<N> weeks ago`
- aria: `Restore deleted saves and items` · `Close` · `Back to the list`
- Replace step: `Replace a save` · `Your 4 saves are full. To bring back "<name>", choose a current save to move to the bin — you can restore it again later.` · `Your saves` `<n> / 4` · `→ bin` · `"<chosen>" → bin · "<reviving>" restored` · `Cancel` · `Replace & restore` · aria `Replace a save to restore this one` / `Choose a save to move to the recycle bin`

### Toast / refusal strings (all reach the user through `showToast`)
- `That save no longer exists.`
- `That file is not valid JSON.`
- `That is not a Codex regimen file.`
- `That file could not be read.`
- `You can have at most 4 regimen slots. Delete one first.`
- `You have 4 saves. Delete one first to import.`
- `You have 4 saves. Choose one to move to the recycle bin first.`
- `This is your only regimen slot — it can't be deleted.`
- `That slot no longer exists.` · `That slot could not be deleted.` · `That slot could not be saved to this device.` · `That slot could not be activated.`
- `That save is not in the recycle bin.` · `That item is not in the recycle bin.` · `That save could not be restored.` · `That item could not be restored.` · `The save to replace no longer exists.`
- `That file is not a valid saved regimen.` · `That save has too many items to import.` · `That save could not be imported to this device.`
- `That colour is not in the slot palette.` · `That colour could not be saved.` · `That name could not be saved.`
- name validation: `A slot name needs at least one visible character.` · `A slot name can be at most 40 characters.` · `A slot name cannot contain control characters.`

### Export filename
`wallach-regimen-<slug-of-name, ≤30 chars>-<YYYY-MM-DD>.json`, falling back to `regimen`.

---

## Interaction dependencies

**Flagged loudly — these CANNOT survive a touch screen as built.**

1. **⚠ THE GOAL-REMOVE ✕ IS INVISIBLE WITHOUT HOVER.** `.gchip__x { opacity: 0 }` +
   `.gchip:hover .gchip__x { opacity: 1 }` (`workspace-coverage.css:1018-1019`). Verified live:
   computed opacity `0`. On a phone there is no hover, so **removing a goal is an undiscoverable
   affordance**. The rebuild must give it a persistent control.
2. **⚠ ALL FOOD PROVENANCE IS DELIVERED BY NATIVE `title=`.** `chip.title = glossFor(hit)` and
   `leadEl.title = glossFor(lead)`. `title` tooltips do not fire on touch. **On mobile, every
   food number is a bare percentage with no statement of whose measurement it is or what it is
   measured against.** Given §00.A this is the most important loss on the surface. The readout
   cells use `[data-tip]`, which `gloss-tooltip.ts` DOES handle on tap — so the pattern exists;
   the food block simply does not use it.
3. **⚠ EVERY ELLIPSISED NAME'S FULL TEXT IS `title=` ONLY** — slot name, rail row name, typeahead
   name, food tile name, bin tile name, bin replace-row name. All hover-only. Names in this
   catalog are long ("Bone Building Formula™ - 150 capsules", "Beyond Tangy Tangerine® (BTT) 2.5
   Canister"), so the ellipsis bites constantly.
4. **The 90-cell readout is pointer-scale.** 9.5px squares at 1440; **0 × 0 px measured at
   375px** (45 columns + 5px gaps in a 201px box). The block renders as a 5px empty strip. Its
   `:hover { transform: scale(1.4) }` pop is the only way to aim at a cell.
5. **`.rec:hover .rec__add`** — the ＋ badge only fills on hover; the card is the button, so this
   is decoration, but it is the card's only "this is tappable" signal.
6. **Hover lift on slot tiles** (`translate: 0 -5px` + coloured glow) is the primary
   active/inactive depth cue after saturation; saved tiles also lift from `opacity .39` to `.58`
   on hover, so an inactive save is nearly invisible at rest on a device that cannot hover.
7. **Every affordance-state in the surface is a hover state**: `.ck-swatch:hover { scale(1.26) }`,
   `.ck-slot--empty:hover` (which also rotates the ＋ 90° and fills it), `.rr-btn:hover`,
   `.fs-pager__b:hover`, `.fs-filter__*:hover`, `.rc-btn-*:hover`, `.rr-results__row:hover`,
   `.rr-scan__link:hover`, `.ck-slot__pencil:hover`, `.rc-pop__back:hover`.
8. **`/` keyboard shortcut** for the add field, and the `<kbd>/</kbd>` chip that advertises it —
   meaningless on a phone and actively confusing.
9. **`Enter` in the add field adds the first typeahead match.** A physical-keyboard idiom. Also:
   with no match it tries to add the raw typed text, `addItem` returns `null`, and **nothing
   happens and the field is not cleared** — the absence of feedback is the only feedback.
10. **Inline `contenteditable` rename** with `document.createRange()` / `getSelection()` and a
    blur-commit. On mobile the virtual keyboard resizes the viewport, blur fires on any tap
    elsewhere, and the caret re-collapse after the 17-char truncation is a known source of
    dropped characters on iOS.
11. **`.rc-gal` is a horizontal scroller** with a styled `-webkit-scrollbar` — its overflow is
    only discoverable by dragging, with no visible affordance on touch.
12. **`.ck-rail .rail-list` is an internal scroller** with a custom orange scrollbar. A nested
    scroll region inside a page scroll is a classic mobile trap.
13. **`Escape`** is the only key-out of the bin's replace step (there is also a Back arrow and a
    Cancel button, so this one is survivable).
14. **Blob download via `a.click()`** (slot export) and **`<input type=file>.click()`** (import).
    Both are desktop file-system idioms; on a phone the first often does nothing visible and the
    second opens a photo picker unless the MIME filter holds.
15. **A native `<select>`** for the food category filter — on mobile it becomes an OS wheel/sheet.
    Workable, but the 22px shell is not, and the CSS comment warns that shrinking its content box
    renders the select **empty**.

---

## Desktop-only assumptions

1. **Four save slots in one row.** `.ck-slots` is `display:flex` with `flex: 1 1 0` on each tile
   and NO wrap. Measured **40.3px per tile** at 375px. The slot switcher is the first thing on the
   page and it is the first thing that breaks.
2. **The 2-column `.coverage-grid`** — a main column plus a persistent right rail with the active
   stack always visible beside the console. On mobile the stack falls ~1800px below the fold, so
   the thing the user is editing is nowhere near the number it changes.
3. **A 200px circular gauge beside a 250px-min category cluster.** `.ck-hero` is
   `flex-wrap: wrap` with `flex: 1 1 280px; min-width: 250px`, so it survives by wrapping — but
   the composition (dial ↔ list, read together) is gone.
4. **A 45-column square grid for 90 cells.** Only legible on a wide canvas; mathematically
   collapses to zero-width tracks on a narrow one.
5. **`.ck-cat` is `grid-template-columns: 128px 1fr auto`** — a fixed 128px label column that
   eats 45% of a 283px row.
6. **`.fs-grid` and `.ck-recgrid` are `repeat(auto-fill, minmax(300px, 1fr))`** — a hard 300px
   floor. Measured producing 300px tiles inside a 283px column at 375px (silent overflow).
7. **`.fs-filter__q { width: 225px }`** — a fixed width sized for "canned salmon with bones",
   plus a 163px `<select>` and an 8-button pager on the same 283px row. Measured overflow to
   `x = -41` (the pager is pushed off-screen left).
8. **A 700px-wide modal** (`.rc-pop { width: 700px; max-width: 100% }`) with a sticky head and a
   sticky footer, sized for a desktop dialog and a 24px backdrop inset.
9. **`.ck` padding is `--ds-space-7`** horizontally; the only responsive rule in the entire
   592-line sheet is a 3-line `@media (max-width: 640px)` that reduces two paddings and nothing
   else.
10. **Fourteen 10px colour swatches** as an always-visible tray on each tile — a desktop
    precision-pointer palette.
11. **The 60px left app-rail is always present** — measured content width **315px of a 375px
    viewport** before any block does anything.
12. **`syncStackHeight()` is a live no-op** kept only so the render/resize wiring stays valid; the
    comment records that reading `.ck-console`'s height collapsed the rail to 0px when the tab was
    hidden. Do not reintroduce a measured height cap.
13. **The staggered entrance** (`data-rise="1".."5"` with 0.02–0.30s delays, plus a per-tile
    `ck-slotrise`) assumes the whole page is above the fold at once.
14. **The toast is fixed bottom-centre at 340px max-width** — on a phone it will collide with the
    home indicator and any bottom navigation.

---

## Feature-preservation contract

A rebuilt mobile Regimen must satisfy every line. Numbered so a review can cite them.

**Saves**
1. Exactly `MAX_SLOTS = 4` save slots, no more; a 5th attempt is refused **with its reason shown**.
2. Every slot shows: name, `covered/90`, item count, relative edited-at, its hue, and a progress
   meter.
3. A non-active slot's covered count is computed with the SAME engine as the active one
   (`coveredCountForItems`) — no drift is permitted between a tile and the live gauge.
4. Switching the active slot changes the whole app's live regimen.
5. Rename, with the 40-char schema limit and its three validation messages.
6. Recolour from the **14**-hue palette (`slot-colours-data.json`), default `#ff7e3c`.
7. Export one save to a JSON envelope (`app`, `kind`, `version`, `exportedAt`, `slot`) with the
   dated filename.
8. Import a save from a JSON file, Zod-validated, with all four failure messages.
9. Delete a save **only behind a second, deliberate confirm** that states how many items go to
   Trash.
10. The last remaining save cannot be deleted, and its trash control is not rendered.
11. Create a new save from an empty slot.

**Console**
12. A gauge reading `covered` of **90**, with a distinct goal-gap arc.
13. The count-up animation on first paint only, disabled under `prefers-reduced-motion`.
14. Four category rows with fixed hues — minerals blue, vitamins orange, aminos green, omegas
    purple — each `covered/total` plus a meter, and an explicit empty state.
15. A per-essential readout of all 90, three-way classed and grouped covered → goal-gap → open,
    with each cell naming itself and its state **on tap**, not on hover.
16. A legend naming all three counts.
17. Slot name, ordinal, item count and edited-at in the console header.
18. **Coverage is a MAP OF GAPS.** No score, no streak, no points, no celebration for a high
    number. The open cells are the subject.

**Goals**
19. Goals are **per save slot** (`loadRgUserGoals` / `saveRgUserGoals` read the active slot), so
    each save steers its own recommendations.
20. Up to `MAX_GOALS = 5`, hues by pick order; the add control disappears at 5.
21. Adding a goal opens the shared arrival veil as a goal picker (`wallach:open-welcome`).
22. Removing a goal must be a **visible, persistent** control.
23. **A goal changes what you LOOK AT and are RECOMMENDED, never what you are MEASURED AGAINST.**
    The denominator stays 90 in every state.
24. Goals re-colour open cells into goal-gap, tint the rec cards' ring and add name tags — and
    verified live, **they DO reorder the FOODS list** while the PRODUCT order is unchanged.

**Foods**
25. `FOOD_LIMIT = 3` food cards, presented **above** the products (owner ruling 2026-08-21), with
    the labelled dotted separator between them — the separator IS the point.
26. Every food card: name, portion label, `N of 90`, one lead percentage with its nutrient, the
    rest as chips, and an honest `+N` for what was dropped.
27. Chip budget: ≤ 7 chips, ≤ 3 rows, `+N` equal to what was ACTUALLY dropped, measured after
    `document.fonts.ready` — never in fallback metrics.
28. The `≈` APPROXIMATE mark on both chip and lead.
29. **Every number carries its provenance gloss, reachable on TOUCH** — the source names itself
    from the artifact, and the gloss states both halves (whose measurement, whose target). It may
    not become a footnote or an about page. §00.A.
30. Category tint from `--fs-cat-<category>`; amino acids deliberately have no colour.
31. A pager over the **whole catalog** (64 pages today), page count derived from
    `foodCatalogSize()` and never stored; never painted over a single page; page clamped when the
    pool shrinks.
32. A category filter (options read from the catalog) + a name filter; both reset to page 1; both
    session-only, never persisted; the filter row stays on screen when it matches nothing.
33. The caret/selection inside the filter box survives the repaint every keystroke causes.
34. Adding a food mints a `food_catalog`-provenance item with `food_id` on `label` (Zod strips
    unknown top-level keys) and heals from the live catalog on every paint — never marked
    user-supplied, which would freeze a stale snapshot.
35. All four foods-block terminal states, kept distinct: education, no-gap-mover, filter-empty,
    and the exhaustion easter egg.

**Products**
36. `REC_LIMIT = 3` product cards.
37. Each card: name, **wholesale** price, `+N essentials`, goal tags, goal ring.
38. The curated starter pack is offered first, in order, and drains as it is owned.
39. Greedy re-scoring: each card answers "what does the card above leave behind?"
40. Owned products leave the list — that is what makes it terminate.
41. Kids products and superseded products are never recommended.
42. `want` is every tile whose status is not `covered` (not just `gap`).
43. The two distinct empty endings, never conflated: "no product fits" vs the all-90 finish line.
44. The all-90 end state offers a way onward to the Products tab.
45. Recommendation lists are never persisted (`recommendations_not_stored`).

**Active stack**
46. One row per item: name, `Your own` / `Eden` provenance, dose stepper, remove.
47. The dose stepper counts in the **product's own units** with a singular/plural noun, and shows
    a fractional default rather than rounding it away.
48. Minus is disabled at one unit; zero is impossible (a 0/day item is a removed item).
49. Removing is never silent — an inline Keep/Remove confirm naming the item and saying it goes
    to Trash.
50. A recycle bin holding the **7** most recent deleted saves and **4** most recent removed items,
    newest-first, no expiry, both restorable.
51. Restoring an item whose origin save is gone says so and states it will land in the active save.
52. Restoring a save while all 4 slots are full offers the Replace step rather than refusing.
53. Add a product by search, with the top-3 matches each showing what the product IS
    (`covers N of 90` / `single-ingredient product`), not just its name.
54. Adding a product already in the slot **bumps its dose** rather than appending a duplicate row
    (a second row would double-count in `coverage.accumulate`).
55. A hand-off to the Scanner for anything not in the catalog.
56. The add-confirmation flash when an item arrives from the Knowledge Products tab.
57. The empty state.

**Cross-surface**
58. Re-render on `regimen:changed` and `coverage:recomputed`; all writes go through the state
    chokepoints (`saveRgOverride` / `saveRgManual` / `saveRgRemoved` / `saveRgUserGoals` / the
    slot ops) — never an ad-hoc localStorage write.
59. Scroll position preserved across re-renders (`withScrollPreserved`), including the partial
    rebuild after backing out of a row delete.
60. Every refusal surfaces its reason; nothing is ever dropped silently.
61. Both themes.
62. `prefers-reduced-motion` honoured for the gauge count-up, the slot rise, the entrance rises,
    the live-dot pulse, the confirm fade, the modal rise and the row flash.
63. All ARIA roles preserved: `tablist`/`tab` on slots, `dialog`+`aria-modal` on the bin,
    `radiogroup`/`radio` on the replace step, `img`+label on the gauge and meters,
    `aria-current="page"` on the pager, and a label on every icon-only control.
64. **No emojis.** All icons are inline SVG or typographic marks (`＋`, `−`, `‹`, `›`, `…`, `→`,
    `≈`, `▤`).
65. Product names are written with `.textContent` — escape at the sink, never a filter.

---

## Open questions

1. **⚠ CONFIRMED DEFECT — the Regimen dose stepper steps by SERVINGS while displaying UNITS.**
   `views/regimen.ts` (the `data-dose-up` / `data-dose-down` handler) does
   `Math.max(1, readItemDose(item) ± 1)` — a raw ±1 **serving** — while the row displays
   `doseCount(...)` in units. `views/coverage.ts:1052` uses `stepDose()`, which steps by one
   **unit**. The two surfaces render the same control and disagree about what it does. Driven live
   on *Bone Building Formula™ - 150 capsules* (5 capsules per serving):

   | action | shown |
   |---|---|
   | start | `5 capsules/day` |
   | `+` | **`10 capsules/day`** (Coverage would show 6) |
   | `−` | `5 capsules/day` |
   | `−` again | **`5 capsules/day` — the button is enabled and does nothing** |

   `atMinimumDose` disables minus at one UNIT, but the handler floors at one SERVING, so on any
   multi-unit product the minus button is live-but-dead at the default. **45 of 215 products carry
   `serving_units > 1`** (Bone Building 5, BTT 2.0 Tablets 4, and 43 more at 2–3). This is a dose
   control: it does not fabricate a Wallach number, but it changes what the user asks their body
   to take. The fix is a one-line swap to `stepDose`. **I did not fix it — flagging for the
   owner's call**, because it changes shipped behaviour and a rebuild should not silently inherit
   either version.

2. **⚠ COPY/BEHAVIOUR MISMATCH — "Products, ranked by your goals."** Verified live: setting three
   goals left the product list byte-identical (same three starter-pack pins, same order); only the
   ring and the name tags changed. `wantedSlugs()` explicitly discards `goals` (`void goals`) per
   the 2026-08-21 ruling that gap-fills target "the MOST remaining gaps, whether they are goals or
   not". The note is therefore a claim the list does not honour. Reword during the redesign
   (e.g. "ranked by your remaining gaps"), or is the wording deliberate? **Owner's call — this is
   copy about how a recommendation was made.**

3. **Rename length divergence.** `beginRename` truncates keystrokes at **17** characters;
   `SlotNameSchema` allows **40** and its refusal message says 40. An imported or bridge-set name
   of 30 characters is legal but cannot be typed, and the user is never told why typing stops.
   Which is the intended cap?

4. **The category bucket key for minerals is `other`.** `CATEGORY_ROWS` maps
   `{ label: 'Minerals', bucket: 'other' }` against `snapshot.byCategory`. Legacy, or worth
   naming honestly during the rebuild? (Display-only; no data moves.)

5. **`perTenDollars` is computed on every rec card and never rendered here.** Coverage shows a
   value figure; the Regimen card shows only price and `+N essentials`. Should the mobile card
   surface value-per-dollar, given that wholesale is the featured price and cost is a real
   decision input on a phone?

6. **The easter-egg link is the only outbound URL in an offline-first app** (a YouTube rickroll,
   reachable only by adding every food in the catalog). Keep it? Flagged because "no network at
   runtime" is a hard constraint and this is a literal exception living inside a shared builder.

7. **`FOOD_LIMIT` and `REC_LIMIT` are both 3 deliberately** so the two blocks read as one
   six-card row split by a labelled rule — that pairing is written down as intent, not accident.
   A mobile layout showing one card at a time destroys the reading. Is the six-card pairing part
   of the spec, or an artifact of the desktop grid?

8. **64 pages of foods.** The windowed numbered pager (`1 2 3 4 5 … 64`) was the owner's explicit
   shape on 2026-08-22 for the desktop console, chosen over listing all pages. On a phone an
   8-button 22px row is not viable. Is a different browse model (a sheet, search-first, infinite
   scroll) acceptable, or must jump-to-page survive?

9. **The recycle bin's deleted-saves gallery is a horizontal scroller.** Acceptable on mobile, or
   must it become vertical?

10. **Could not determine: the all-90-covered end state was never reached in a live run.** Its
    two strings, the "Explore the Products tab" button and the foods `education` note are read
    from source and are certain, but the assembled visual state has not been observed. A rebuild
    should force it (a fixture slot) before signing off. The same applies to the "No product fills
    a gap right now" branch.

11. **Could not determine: `capReached`.** The Regimen console never passes it, so
    `"That's the last food this tab will suggest — the rest live on your Regimen."` is unreachable
    from this surface. Recorded because the shared builder owns it and a rebuild of the block must
    not delete it (Coverage uses it).

12. **Could not determine: the "Replace a save" step was not exercised end-to-end.** Its markup,
    copy and handlers are read from source; reaching it needs 4 full slots plus a deleted save in
    the bin. Verify before the rebuild signs off, especially the sticky-footer summary line.

13. **The 8-second toast** is the only channel for 20+ refusal strings, and it is `position: fixed`
    bottom-centre. On mobile it will sit on top of whatever bottom navigation the redesign
    introduces. Does the rebuild keep a toast, or promote refusals into the surface that caused
    them?
