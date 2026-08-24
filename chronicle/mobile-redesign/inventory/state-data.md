# State & data model — feature inventory

_Scope: everything under `dashboard/assets/js/src/` that is NOT `views/` — `main.ts`, `core/` (10
modules + 33 Zod schema files), `state/` (28 modules) — plus every file in
`dashboard/assets/data/`. Read from source, not summarised from names. This is the CONTRACT: a
mobile rebuild may re-present any datum listed here, and must not silently drop one._

**Absolute paths of the layer**
- `C:\Users\Light\Desktop\claude\health expert\dashboard\assets\js\src\main.ts`
- `C:\Users\Light\Desktop\claude\health expert\dashboard\assets\js\src\core\`
- `C:\Users\Light\Desktop\claude\health expert\dashboard\assets\js\src\state\`
- `C:\Users\Light\Desktop\claude\health expert\dashboard\assets\data\`

**The one-paragraph shape.** Three enforced layers — `views/ -> state/ -> core/`, a lower layer may
never import a higher one (`eslint-plugin-boundaries`, `boundaries/element-types: error`;
`core` allows `[]`, `state` allows `core`, `views` and `main` allow `core, state, views`). `core/`
holds the localStorage chokepoint, the typed event bus, the unit converter, the identity resolver,
and every Zod schema. `state/` holds one module per data source: each imports its JSON at build
(esbuild JSON import), parses it ONCE through a Zod boundary, caches, and exposes pure reads. Only
FIVE state modules ever write: `regimen`, `profile`, `scanner`, `log`, and `core/storage` itself
(which is the only file allowed to touch `localStorage`). Everything else is read-only projection of
sealed data.

---

## Destinations & states

There are no screens in this layer. "States" here = the persisted stores, the derived snapshots, and
the state machines a rebuild must reproduce.

### 1. Persisted stores (localStorage) — the complete key list

| Key | Owner module | Schema | Shape | Cap / limits | Status |
|---|---|---|---|---|---|
| `rgSlots_v1` | `state/regimen.ts` | `SlotDocSchema` | `{version:1, slots[1..4], activeSlot, trash[<=20 schema / 4 enforced], slotTrash[<=7]}` | 4 slots, 4 item-trash, 7 slot-trash | **LIVE — the only regimen write target** |
| `wallachUserProfile_v1` | `state/profile.ts` | `UserProfileSchema` | `{name?, browsing, chosenAt, avatar?, theme?, accent?}` | name 40 chars, avatar 900 000 chars | **LIVE** |
| `lcRecentScans_v1` | `state/scanner.ts` | `HistoryShapeSchema` | `{items: HistoryEntry[]}` | 5, FIFO newest-first, no name-dedup | **LIVE** |
| `lcSavedScans_v1` | `state/scanner.ts` | `HistoryShapeSchema` | `{items: HistoryEntry[]}` | 100, user-curated, never auto-evicted | **LIVE** |
| `wallachCreatorsLog_v1` | `state/log.ts` | `LogShapeSchema` | `{entries: LogEntry[]}` | 2000 (FIFO prune) | LIVE but **no in-app writer today** — `log()` has zero callers |
| `lcRegimen_v1` | `state/regimen.ts` | `RegimenSchema` | `{items: RegimenItem[]}` | — | **LEGACY** — read once at migration, then inert |
| `rgOverrides_v1` | `state/regimen.ts` | `OverridesMapSchema` | `Record<itemId, Record<string, unknown>>` | — | **LEGACY** |
| `rgManualItems_v1` | `state/regimen.ts` | `RgManualSchema` | `RegimenItem[]` | — | **LEGACY** |
| `rgRemoved_v1` | `state/regimen.ts` | `RgRemovedSchema` | `number[]` (hidden ids) | — | **LEGACY** |
| `rgUserGoals_v1` | `state/regimen.ts` | `RgUserGoalsSchema` | `string[]` (goal ids) | — | **LEGACY** — goals moved INTO the slot; read once by migration/backfill |

No `sessionStorage`, no IndexedDB, no cookies, no Cache API anywhere in the tree. Backup scope is the
key prefixes `wallach`, `rg`, `lc` (`core/storage.ts::APP_KEY_PREFIXES`).

### 2. Profile tri-state (`state/profile.ts`) — subtle, easy to break

- `null` = **never asked** -> the arrival veil mounts (`views/welcome.ts::shouldShowWelcome()`
  returns `loadUserProfile() === null`).
- `{browsing:true}` = the user chose "I'm just browsing". **Anonymous is a CHOICE, not an absence** —
  never re-prompt.
- `{name:'...'}` = named. Never re-prompt.
- A profile that fails Zod validation degrades to `null` -> the user is asked once more (safe
  direction).
- `resetIdentity()` returns to guest but **keeps theme + accent** and keeps the regimen (different key).

### 3. Regimen slot-document state machine (`state/regimen.ts`)

- Boot: if `rgSlots_v1` absent -> `migrateFromLegacy()` builds a `Default` slot from the five legacy
  keys (committed ∪ manual, deduped by id, hidden ids recovered INTO the trash rather than dropped),
  persisted **without emitting** (a read must not fire the render cascade).
- If present but invalid -> **loud** console warn + rebuild from legacy (auto-heal).
- Two in-place backfills run on read and self-persist silently: `backfillP4` (per-slot `colour` +
  `goals`) and `backfillRecycle` (`slotTrash: []`, cap item trash to 4, backfill `slotName`).
- Slots: 1..4. `activeSlot` always resolves (schema `superRefine`). Deleting the last slot is refused.
- Item trash: newest-first ring, cap 4, no expiry. Restores to its ORIGIN save if it still exists,
  else the active save.
- Slot trash ("recycle bin" for whole saves): newest-first ring, cap 7. Restore with room -> reuses
  the original id when free, becomes active. **At 4 saves, restore REQUIRES a `replaceSlotId`** and
  performs a swap (the replaced save goes back into the bin).

### 4. Coverage snapshot states (`state/coverage.ts`)

- `null` before the first `recompute()`; `getOrCompute()` computes on demand.
- Recomputes on every `regimen:changed` event AND on native cross-tab `storage` events for any key
  starting `rgSlot` or equal to `lcRegimen_v1`.
- Per-tile `CoverageStatus` is a **6-value union**: `'covered' | 'partial' | 'trace' | 'gap' |
  'present' | ''`. `''` = pending / no target (renders grey). `'present'` = a trace/rare vehicle is in
  the stack but its mg is not derivable (hollow dot). `'trace'` is retained for back-compat and is
  **no longer produced**.
- `STATUS_RANK` for reconciling two independent routes: `'' 0 < gap 1 < present 2 < partial 3 <
  trace 4 < covered 5`. Two routes take the BETTER, never the sum.
- Empty regimen = numeric targets read `gap`, the rest pending. That is the truthful bare state.

### 5. Data-hydration states (web build only — `state/data-split.ts`)

- `SPLIT_DATA` is an esbuild `--define`; `false` in the file:// build (everything inlined), `true` in
  the web build. Three artifacts are split: `corpus-embed`, `creators-log-embed`,
  `search/search-index`. Filenames are **content-hashed** via `__SPLIT_MANIFEST__` (a SiteGround proxy
  served a stale corpus for hours before hashing landed).
- Until hydration, `corpus.claimCount()` is **UNKNOWN, not 0** — the rail prints the bare label
  `Corpus` rather than `Corpus · 0 entries`. Repaints on `corpus:hydrated`.
- A failed fetch resolves to `null` and the consumer keeps the empty stub — **silent degradation,
  documented and accepted**. Any surface that becomes load-bearing on a split artifact needs a real
  failure state first.

### 6. Appearance state

- `<html data-theme>` ∈ `{cream, dark}` (default `cream`), `<html data-accent>` ∈ `{ember, sapphire,
  verdant, amethyst, rose, gold, teal, slate}` (default `ember`). Both applied from ONE place
  (`main.ts::wireProfileIdentity`) so every surface flips together.

### 7. Scan result states (`state/scanner.ts`)

Verdict ∈ `ADD | SAVE | REJECT`. Entry provenance ∈ `scanned | typed` (absent means `scanned`).
Result carries `sparseNutrients` / `sparseIngredients` booleans for the empty-ish label case.

---

## Controls

"Controls" in this layer = the mutation operations a UI can call. Every one is a named export; every
one routes through a single writer and ends in a typed emit. **Touch-hostility here is about the
INTERACTION the op implies, not the op itself.**

| Control (op) | What it does | Where it lives | Touch-hostile? |
|---|---|---|---|
| `saveUserProfile({name?, browsing})` | Names the user or sets guest; preserves avatar/theme/accent; returns `{ok:false, reason}` on a bad name | `state/profile.ts` | No — but needs a text field + a visible rejection region |
| `setAvatar(dataUriOrPresetId)` | Preset id (`generic-01`, `men-NN`, `women-NN`) or uploaded data: URI | `state/profile.ts` | **Yes** — today's picker is a 25-thumbnail grid; upload goes through `<input type=file>` + a canvas downscale to 256px PNG |
| `clearAvatar()` | Back to the name initial | `state/profile.ts` | No |
| `setTheme('cream'\|'dark')` | Style only | `state/profile.ts` | No |
| `setAccent(AccentId)` | Style only, 8 hues | `state/profile.ts` | **Warn** — 8 small swatches; each needs >=44px |
| `resetIdentity()` | Guest again; keeps appearance + regimen | `state/profile.ts` | No |
| `addOrBumpRegimenItem(item)` | Adds a product, or **bumps the existing same-named row's servings by 1** instead of appending a duplicate. Returns `{outcome:'added'\|'bumped', name, dose}` | `state/regimen.ts` | No |
| `saveRgManual(items)` | Replace the active slot's item list (the add path) | `state/regimen.ts` | No |
| `saveRgOverride(id, patch)` | Per-item override (`scaling_factor` = servings/day) | `state/regimen.ts` | **Yes** — driven by a +/- stepper; two 44px targets minimum |
| `saveRgRemoved(Set<number>)` | Move matching items to the item trash (idempotent) | `state/regimen.ts` | No |
| `saveRgUserGoals(unknown)` | Save the ACTIVE slot's goals (non-strings dropped) | `state/regimen.ts` | No |
| `persistRegimen(r, label?)` | Atomic replace of items; **no in-app caller**, kept for the routing gate + window bridge | `state/regimen.ts` | n/a |
| `addSlot(name?)` | New empty save. Refused at 4 with a reason | `state/regimen.ts` | No |
| `duplicateSlot(id)` | Copies items + overrides + goals as `"<name> copy"` | `state/regimen.ts` | No |
| `deleteSlot(id)` | Snapshots the WHOLE slot into `slotTrash`, promotes a survivor. Refuses the last slot | `state/regimen.ts` | No |
| `renameSlot(id, name)` | Validated (40 chars, no control/bidi chars); rejects, never truncates | `state/regimen.ts` | No — needs inline text edit |
| `setSlotColour(id, hex)` | Palette-gated; refuses off-palette | `state/regimen.ts` | **Yes** — 14 hex swatches |
| `setActiveSlot(id)` | Switch save | `state/regimen.ts` | No |
| `restoreDeletedItem(itemId)` | Restore from item trash | `state/regimen.ts` | No |
| `restoreDeletedSlot(deletedAt, replaceSlotId?)` | Restore a save; at 4 saves REQUIRES the replace target -> a two-step choice | `state/regimen.ts` | **Warn** — a modal choice flow |
| `importSlot(rawJson)` | THE untrusted-JSON surface. Validates, then **re-mints every field**: fresh slot id, fresh item ids, label narrowed to `{name, brand?, nutrients}`, provenance FORCED to `user_manual`, overrides remapped, timestamps reset. Refuses >500 items or at 4 saves | `state/regimen.ts` | **Yes** — needs an OS file picker |
| `snapshot()` / `restore(data)` | Whole-origin backup. `restore` is a **TRUE REPLACE** (app-owned keys absent from the backup are removed first); an EMPTY backup is a no-op, never a wipe. Returns `{restored, skipped, removed}` | `core/storage.ts` | **Yes** — file download + file picker |
| `runScan(label)` | Score + log to history + emit `scanner:scan-complete` | `state/scanner.ts` | No |
| `scoreLabel(label)` | Score WITHOUT logging — the Confirm-step preview | `state/scanner.ts` | No |
| `saveScan(label, result)` | Push to the durable shelf; returns the new id | `state/scanner.ts` | No |
| `removeSaved(id)` | Remove one shelf row | `state/scanner.ts` | No |
| `scanImage(dataUrl)` / `ocrToLabel(dataUrl)` | Full OCR pipeline (see below) | `state/ocr.ts` | **Yes** — camera/file capture; ~17MB offline worker |
| `log(input)` | The ONLY sanctioned writer to the Creator's Log key; auto-prunes to 2000 | `state/log.ts` | n/a (no caller) |
| `clearLog()` | Reserved for reset/testing; no production caller | `state/log.ts` | n/a |
| `hydrateCorpus/hydrateSearchIndex/hydrateLogEmbed(raw)` | Web build only — accept a fetched artifact and clear the parse cache so it re-validates | `state/corpus/search/log` | n/a |
| `installBridges()` | Publishes 15 `window.*` regimen ops for DOM handlers + headless probes | `state/regimen.ts` | n/a |
| `installRecomputeTrigger()` | Wires `regimen:changed` -> `recompute()`; idempotent | `state/coverage.ts` | n/a |

### Shell controls that live in `main.ts` (not a view)

| Control | What it does | Touch-hostile? |
|---|---|---|
| `.rail__item[data-rail-nav]` click | Workspace navigate OR drawer toggle | No |
| Bare keys `1` / `2` / `3` | Jump to Coverage / Regimen / Scanner | **Yes — no touch equivalent** |
| Bare keys `S` / `K` | Toggle Search / Knowledge drawer | **Yes — no touch equivalent** |
| `Escape` | Close any open drawer | **Yes** |
| `Tab` inside the profile overlay | Focus trap cycling `PF_FOCUSABLE` | **Yes** (must still exist for a11y) |
| `.topbar__ask` click | Opens the Search drawer | No |
| `.rail__profile` click / Enter / Space | Opens the profile modal | No |
| `wallach:navigate` CustomEvent `{to}` | Cross-workspace jump from a view; reaches ONLY the 3 workspaces | n/a |
| `wallach:open-welcome` window event | Re-opens the veil as a GOAL PICKER | n/a |
| `pf:close` event on the overlay | Closes the profile modal | n/a |

**Guard worth preserving:** the bare-key handler refuses to fire when a modal is open (it tests
`#welcomeHost` children > 0 OR `.pf-overlay` present) and when the target is an input/textarea/
contenteditable or any modifier is held.

---

## Data points rendered

Every datum the app has available. Grouped by source module. "Source field" is the exact path.

### A. The 90 essentials — `essentials-targets-data.json` (34 KB, 91 entries)

| Datum | Source field | Format / unit | Why it matters |
|---|---|---|---|
| Canonical name | `essentials[].name` | e.g. `Vitamin A (Retinol / beta-carotene)` | The join key to the layout tile's `key` and to the coverage snapshot |
| Canon slug | `essentials[].slug` | `vitamin-a` | The join key for goals, foods, recommender, corpus |
| Category | `essentials[].category` | `minerals`(60) / `vitamins`(16) / `amino_acids`(12) / `fatty_acids`(3) | Drives the fixed colour code (blue/orange/green/purple) |
| Target kind | `target.kind` | 7 values: `wallach`(35), `trace_pdm`(34), `dietary_with_clinical_lever`(15), `dietary`(3), `wallach_collective`(2), `mirrors`(1), `unspecified`(1) | Routes the whole classifier |
| Target low / high | `target.low`, `target.range.high` | number in `target.unit` | The denominator of every coverage percentage |
| Unit | `target.unit` | `mg` / `mcg` / `g` | Wallach's own unit; NEVER re-expressed silently |
| Period | `target.period` | `daily` | 36 entries carry it |
| Source label | `target.source` | prose, e.g. `Wallach — Let's Play Doctor (Wallach, 1995)` | The "why this target" provenance line |
| Source claim id | `target.source_claim_id` | `WAL-CLM-LETS-000066` (38 entries) | Traces to the sealed corpus claim |
| Other claims | `target.other_claims` | claim-id array (26 entries) | Additional citations |
| Provenance block | `target.provenance` | `{original_low, original_high, original_unit, upper_taken}` | Shows the derive's unit/bound decisions |
| Mirrors slug | `target.mirrors_slug` | 1 entry (cobalt -> vitamin-b12) | The tile carries the mirrored essential's verdict |
| Vehicle supplied | `target.vehicle_supplied` + `vehicle_claim_ids` | boolean + claim ids (3 entries) | Wallach names the plant-derived vehicle as this essential's route |
| Ceiling | `target.ceiling` + `ceiling_reason` | 1 entry — silver, 400 mcg | A stated SAFE INTAKE, not a requirement. **Must never be scored against** |
| Collective group | `target.collective_group` | `essential-fatty-acids` (2 entries) | Routes omega-3/6 to the shared EFA meter |

### B. The periodic layout — `coverage-layout-data.json` (38 KB)

| Datum | Source field | Notes |
|---|---|---|
| 4 sections | `sections[]` | `01 MINERALS // 60 · THE FOUNDATION · ATOMIC SYMBOLS PRESERVED`, `02 VITAMINS // 16 · THE CO-FACTORS · ENZYME ENABLERS`, `03 AMINO ACIDS // 12 · PROTEIN BUILDING BLOCKS · ESSENTIAL + CONDITIONAL`, `04 FATTY ACIDS // 3 · ESSENTIAL LIPIDS · MEMBRANE + SIGNAL` |
| 3 mineral subsections | `sections[0].subsections[]` | `A FOUNDATIONAL` (5), `B INDIVIDUALLY DOSED` (21), `C PLANT DERIVED` (34, `id: plant-derived`) — each with `rank`, `label`, `hint` |
| Per-tile | `key`, `slug`, `num`, `sym`, `letter`, `abbr`, `code`, `name`, `hint`, `essential` | `essential:false` = omega-9, shown but NOT counted. `essentialGlyph()` falls back to `ω3/ω6/ω9` |
| Section chrome | `gridClass`, `tileClass` | `tile` / `tile--vitamin` / `tile--amino` / `tile--fat` |
| 30 goals | `goals[]` | `{id, name, category, conditions[], members[], groups?}` |
| Goal categories (6) | `goals[].category` | Bones joints & muscles (3), Mind & nerves (5), Heart & metabolism (6), Digestion immunity & breathing (5), Skin senses & mouth (4), Reproductive & whole-body (7) |
| Goal names (30) | | Stronger bones · Healthy joints · Muscle & strength · Sharper thinking · Better mood · Better sleep · Focus & attention · Nerves, Seizures, MS & ALS · Heart health · Circulation · Blood-sugar balance · Thyroid support · More energy · A healthy weight · Better digestion · Liver support · Stronger immunity · Allergy relief · Easier breathing · Healthy skin, hair & nails · Healthy eyes & vision · Healthy gums & teeth · Hearing & balance · Hormones & fertility · Healthy pregnancy · Prostate & men's health · Women's health & cycle · Kidney & urinary health · Calm inflammation · Cancer support |
| Goal `groups` | `goals[].groups` | Only `plant-derived`; present on 20 of 30. **OMITTED, never empty**, where Wallach never names the complex |

**Doctrine (schema comment, load-bearing):** `members.length` must **never** be rendered as a
fraction. Membership changes what you LOOK AT; the denominator is always 90. A `total` field once
existed and was deleted as fabricated data.

### C. Live coverage snapshot — `state/coverage.ts::CoverageSnapshot`

| Datum | Field | Format | Why it matters |
|---|---|---|---|
| Covered count | `coveredCount` | int 0..90 | The headline. Excludes non-essentials |
| Total | `totalCount` | 90 | `essentialCount()` derives it from the layout, never a literal |
| Computed at | `computedAt` | ISO timestamp | |
| Per-category tallies | `byCategory[cat] = {total, covered}` | 4 buckets: `vitamins`, `aminos`, `fatty-acids`, `other` (all minerals collapse to `other`) | Section heads |
| Per-tile id | `tiles[].tileId` | `tile_<lowercased name>` | |
| Per-tile status | `tiles[].status` | the 6-value union | The dot / ring |
| Covered flag | `tiles[].covered` | `status === 'covered' \|\| 'trace'` | |
| Fill | `tiles[].fillPercent` | ratio 0..>1 (can exceed 1 on stacking) | The meter |
| Contributors | `tiles[].contributesTo` | display names | **TRAP: this is NOT "products that cover this tile"** — a product supplying 1% of a target appears in a GAP tile's list. Independent design passes have repeatedly built a "covers" join on it and fabricated a status. Derive it if you need it |
| Mirror | `tiles[].mirrorsOf` (display name) + `mirrorsSlug` | | The tile explains whose verdict it carries |
| Aggregate vehicle | `tiles[].aggregateVehicle` | boolean | Closed via the PDM rule |
| Intake vs target | `tiles[].intakeVsTarget = {deliveredAmount, targetLow, targetHigh, unit}` | in the target's OWN unit | The deep-dive meter. `null` for non-numeric targets |
| PDM group flag | `tiles[].pdmGroup` | boolean, 34 tiles | |
| No-target reason | `tiles[].noTargetReason` | `present_stated_zero` \| `present_structural` \| `non_essential` \| `null` | Lets the surface state WHY there is no number instead of the generic "unmined gap" copy |
| Shared rare-earth meter | `pdmGroup = {deliveredMg, goalMg, status, sources[]}` | goal **924 mg** | ONE readout all 34 trace_pdm tiles point at |

**Classifier rules a rebuild must not re-derive:** covered `>= 0.95 * low`; partial `>= 0.30 * low`;
else gap. `low <= 0` with zero delivery reports `''` (pending), never covered. `target.low === 0`
(phosphorus, Wallach's stated supplement need of zero) reports **covered**. H/C/N/O
(`FOUNDATIONAL_PRESENT_SLUGS`) promote `''` to covered. Omega-9 is capped at `'present'` and can
never read covered.

### D. Plant-derived mineral aggregate — `pdm-coverage-data.json` (7 KB)

`goal.maintenance_mg` **924.0**, `goal.unit` mg, `goal.source_claim_id` `WAL-CLM-EPIGEN-000089`.
`goal.provenance` exposes the whole derivation for a "how is this calculated?" surface:
`wallach_dose_amount 1.0`, `wallach_dose_unit 'fl oz'`, `wallach_dose_per_body_weight_lb 100.0`,
`reference_mg_per_fl_oz 600.0`, `body_weight_lb 154`, plus the formula string.
`products{31}` -> `{canonical_name, pdm_mg, present}`. `rankedPdmSources()` returns
`{productId, name, mg}[]` sorted mg-desc (present-only vehicles excluded).

### E. EFA aggregate — `efa-coverage-data.json` (3 KB)

`goal.maintenance_mg` **9000.0** mg, `collective_group` `essential-fatty-acids`,
`members ['omega-3','omega-6']`, `source_claim_id` `WAL-CLM-DDDL-000115`.
`products{7}` -> `{canonical_name, efa_oil_mg, by_member{}}`.
**The measure is OIL mass, not summed acids** — Wallach's 9 g is of flaxseed oil, so 9 one-gram
softgels IS his dose. Omega-9 is deliberately not a member.

### F. Regimen items — `rgSlots_v1` + `regimen-label-lookup.json` (184 KB, 215 products)

| Datum | Field | Notes |
|---|---|---|
| Item id | `slots[].items[].id` | number |
| Label name | `.label.name` | **THE identity** — a regimen item carries NO `product_id`. The vault join, the auto-heal and the "do I own this?" check all match on lowercased name |
| Brand | `.label.brand` | optional |
| Nutrient rows | `.label.nutrients[]` | `{name, amount, unit, form?}` (passthrough, so extra label fields survive) |
| Servings | `.label.servings` | the second dose candidate after the override |
| Serving units | `.label.serving_units` / `.serving_unit` | e.g. `2` / `"tablet"` — 91 of 215 vault products carry them |
| Food id | `.label.food_id` | present on catalog foods; keyed lookup, never by name |
| Added date | `.addedDate` | ISO YYYY-MM-DD |
| Provenance | `.provenance` | `user_scanned` \| `user_typed` \| `user_manual` \| `wishlist_promoted` \| `food_catalog` |
| Override | `slots[].overrides[itemId].scaling_factor` | servings/day |
| Slot identity | `id, name, colour, goals[], createdAt, editedAt` | 14-hue palette in `slot-colours-data.json`; default `#ff7e3c` |
| Trash entry | `{item, slotId, slotName?, removedAt}` | full ISO timestamp, enables relative time |
| Slot trash entry | `{slot, deletedAt}` | full slot snapshot |

**Provenance semantics (`core/provenance.ts`, single home, gated by
`user_supplied_provenance_single_home`):** `user_scanned` and `user_typed` mean THE USER supplied the
numbers -> the item keeps its own snapshot forever and carries the YOURS mark. `food_catalog` is
deliberately NOT user-supplied — a food re-reads the live catalog by `food_id` every paint. Everything
else re-reads the vault by lowercased name (the auto-heal).

**Dose display (`core/dose-units.ts`):** `doseCount(servings, units)` -> the number on screen;
`doseUnitLabel(count, units)` -> `"tablets/day"` / `"softgel/day"` / `"servings/day"` (singular at
exactly 1); `stepDose` floors at ONE UNIT, not one serving; `atMinimumDose` disables the minus button.
Stored amounts stay per-serving — this is display + step size only.

### G. The food catalog — `foods-composition-data.json` (406 KB, 192 foods)

| Datum | Field | Notes |
|---|---|---|
| Id / name / category | `foods[].id/.name/.category` | 11 categories: Vegetables 55, Fruits 25, Fish & shellfish 24, Legumes 16, Dairy & eggs 16, Nuts & seeds 15, Lamb/veal/game 15, Beef 9, Poultry 8, Spices & herbs 5, Pork 4 |
| Portion | `.portion_label` (`1 cup, cubes`), `.grams` | USDA's own words |
| USDA join keys | `.fdc_id`, `.usda_description`, `.portion_id` | any number on screen traces back |
| Per nutrient row | `.nutrients[] = {slug, amount, unit, fraction, strong, per_100g, provenance{...}, usda_unit?, nutrient_id?, source_unit?}` | `amount` in **Wallach's own unit**; `fraction` = amount / Wallach target |
| Provenance | `.provenance = {source_id, tier: EXACT\|APPROXIMATE, join, value_kind: cell\|sum, parts?, why?, conservative?}` | `conservative` means the LOWEST of several varieties was taken — the card must say so |
| EFA group | `.efa = {acid_mg, oil_equivalent_mg, fraction, qualifies, strong}` | **Read `qualifies`, never re-derive it from `fraction`** — 7 of 192 disagree at the rounding boundary |
| Breadth / strength | `.breadth`, `.strength` | `strength` = Σ qualifying fractions incl. the EFA group, uncapped. It is a SORT KEY and is never rendered |
| Thresholds | `_meta.qualify_fraction 0.07`, `strong_fraction 0.20` | `foodQualifyPct()` = 7 — a surface printing a food's whole readout must say where the readout stops |
| Measurable set | `_meta.essentials_measurable` (29) | The only essentials a food can ever move |
| Unbound set | `_meta.essentials_without_composition` | `boron, chromium, germanium, inositol, tin, vanadium` — **"not bound" is not "not measurable"** |
| Display map | `_meta.essential_display[slug] = {label, category}` | short chip labels, never typed in a view |
| Source words | `_meta.source_display[source_id]` | e.g. `the Australian Food Composition Database`, `Doleman 2017 (Food Chemistry)`, `the USDA/FDA/ODS iodine database` |
| Second sources | `_meta.second_sources[slug] = {source_id, tier}` | biotin, chloride, flavonoids, iodine, molybdenum, silica... |
| EFA reference | `_meta.efa_reference = {efa_fraction 0.67695, label 'Omega EFAs', category, fdc_id, linoleic/linolenic per 100 g}` | the acid->oil bridge |

`FoodHit` (the card's chip row) = `{slug, label, category, pct, amount, unit, tier, source,
conservative}`. `FoodRec` = `{foodId, name, category, portionLabel, grams, supplies, breadth,
goalIds[], score, hits[]}` — where `breadth` is `hits.length` (EFA group counted as ONE line), NOT the
artifact's `breadth`.

### H. Products — `product-detail-data.json` (805 KB, 215) + `product-recommender-data.json` (163 KB, 51 essentials)

Detail record: `{product_id, name, sku, ygy_id, price:{retail, wholesale}, components[], variants?}`.
Each component: `{role, form, serving_size, servings_per_container, directions, macros{}, nutrients[],
blends[], other_ingredients[]}`. A nutrient row: `{name, amount, unit, pct_dv, form?, unit_detail?,
label_iu?}`. A blend: `{name, total{amount,unit}, total_cfu?, as_labeled, pct_dv, ingredients[{pos,
name, latin?, part?, form?, standardization?}]}`.

Recommender inputs: `essentials[slug] = {unit, candidates[{product_id, amount, breadth, price}]}`.
Ranker output `RankedSource = {productId, amount, unit, breadth, price, adequacy, adequacyIsTarget,
breadthScore, valueScore, score}`.
Weights: **`W_ADEQ 0.6`, `W_BREADTH 0.3`, `W_VALUE 0.1`; `BREADTH_HALF 5`** (breadth saturates as
`n/(n+5)`). Adequacy is `min(1, delivered/target)` when a Wallach target + unit are supplied,
otherwise the amount-potency proxy `delivered/best-in-set` with `adequacyIsTarget:false`.

`CoverageRec` (the rail card) = `{productId, name, price (wholesale), supplies, breadth, goalIds[],
pinned, score, perTenDollars}`. Pinned starter-pack cards carry a synthetic score >= `PIN_SCORE_BASE
= 2`, above the whole scored band (< 1).

Curation filters: **starter pack** (`starter-pack.json`, 5 pinned, ordered), **kids exclusion**
(`kids-exclusion.json`, 2 products), **superseded** (`superseded-products.json`, 4). All three are
applied at READ time on RECOMMENDATION paths only — the Products database tab deliberately shows
everything. `dose-defaults.json` (1 entry, provenance `container_life`) sets a starting quantity;
never a Wallach dose.

### I. The corpus — `corpus-embed.json` (2.95 MB)

`knowledge_version` **491**. `claims{2601}` — all tier 1; confidence `high 2205 / medium 392 / low 4`.
Kinds: protocol 569, mechanism 556, definition 558, deficiency_sign 258, dose 116, quote 110,
food_source 77, prognosis 66, diagnostic_pattern 63, prevalence 60, toxicity_sign 60,
personal_anecdote 49, interaction 39, contraindication 20.
Claim fields: `{id, kind, claim_text, verbatim, dose{amount, unit, period, form, duration,
for_condition, applies_to}, book, essentials[], other_substances[], conditions[], symptoms[],
confidence, tier, source_table?, base_line_table?, about[]}`.
`books{7}`: Dead Doctors Don't Lie (2011, DDDL, 576 claims) · Epigenetics (2014, EDGT, 478) ·
Hell's Kitchen (2015, HKCP, 118) · It's All In Your Head (2020, IAYH, 21) · Immortality (2008, IMMO,
515) · Let's Play Doctor (1995, LPD, 518) · Rare Earths: Forbidden Cures (1994, REFC, 375).
`planned_books[4]`: Let's Play Herbal Doctor, Hell's Kitchen, Energy Crisis, Passport to Aromatherapy.
`essentials{91}` -> `{slug, display_name, common_name, layout_key, category, symbol, claim_count,
claims_by_kind{}, deficiency_signs[{sign, claim_id, confidence}], conditions_treated[],
interacts_with[], books_cited[]}`.
`conditions{510}` -> `{slug, display_name, claim_count, claims_by_role{}, essentials_involved[],
other_substances_involved[], books_cited[]}`. `umbrellas{7}` -> child display names, most-cited first.

### J. Search / Ask Wallach — `search/search-index.json` (4.23 MB — the single heaviest artifact)

`entities{547}` by type: condition 314, nutrient 91, concept 52, substance 39, topic 38, element 10,
person 2, event 1. Each: `{display_name, common_name?, type, symbol?, synonyms[], related[],
claim_count, intro_claim?}`.
`claims[2579]`: `{id, subject, also_about[], facet, question, answer_short (<=160 ch), answer,
verbatim, page, book_id, topics[], tier1_link?{essentials,conditions,symptoms}, see_also?{phrase,
target}}`.
13 facets, counts: protocol 610, mechanism 419, physiology 289, basics 224, warning 209, stance 201,
uses 172, history 142, sources 120, discovery 76, etymology 56, big_question 42, biography 19.
5 colour families partitioning them: `science` (mechanism, basics, sources, physiology), `action`
(protocol, uses), `stance` (stance, big_question), `signs` (warning), `story` (history, discovery,
biography, etymology).
Display order: `SEARCH_FACETS` default; conditions override via `FACET_ORDER_BY_TYPE` (stance-first).
Lede priority: `INTRO_ORDER_DEFAULT` (sinks biography + warning); `person` inverts it.
**Warning deliberately stays at position 2 in `SEARCH_FACETS`** — clustering it with its family was
rejected because it would push a health caution below four sections.

Retrieval API: `resolveQuery(q) -> {mode: 'landing'|'entity'|'ask', subject, claim, claims[], query,
noMatch}`; `askRanked(q, limit=6)`; `entityFamilies(subject) -> EntityFamily[{familyId, count,
answers: EntityAnswer[{id, quality 0|1, familyId, pill, title, prev, short, body, verbatim}]}]`;
`familyCounts()`, `familyTopics(familyId) -> {subject, count, facet, peek}[]`, `relatedSlugs`,
`composeCite` / `composeShortCite`, `entityLede`, `subjectFacetHints`, `indexTotals()`,
`defaultSubject()`.

**Charged-search gate:** `homosexuality` and `intersex` surface in search results ONLY when the query
explicitly names them (their slug/name/synonym or one of 17 explicit terms). The Explore tab keeps
them (a full index); this gate is search-results only.

### K. Entity pages — `entity-page-data.json` (1.04 MB)

`essentials{91}` -> `{type, name, scientific_name, symbol, category, is_essential, claim_count,
distinct_claim_count, books[], synonyms[], record[{kind, claim_ids}], record_claim_count,
search[{facet, claim_ids}], conditions[], works_with[], related[], group_record?}`.
`conditions{510}` -> `{type, name, claim_count, books[], synonyms[], protocol_claim_ids[], restore[],
record[], record_claim_count, search[], related_conditions[], related[]}`.
Lean summaries: `EssentialSummary` (adds `distinct_claim_count` — the number browse tiles show) and
`ConditionSummary` (`nutrient_count` = `restore.length`).

### L. Scanner corpus — `scanner-corpus-data.json` (30 KB)

`goalKeywords{14}`, `nutrientToGoalMap{14}` (each `{nutrient, why}`), `goalDisplayNames{19}`
(Cognition, Hormones / strength, Longevity / anti-aging, Joints / collagen, Energy / metabolism,
Immunity, Gut / digestion, Cardiovascular, Bone / skeletal, Thyroid / endocrine, Skin / hair / nails,
Blood sugar, Sleep / stress, Hydration / electrolyte, Essential baseline, Detox / cleanse,
Prostate / urinary, Weight management, Eye / vision).
`antiList{8}` categories with term counts: artificial dyes 181, added sugar 35, gluten sources 30,
fried oils / seed oils 13, preservatives / additives 9, modified / processed 6, caffeine 4,
msg / glutamate 2. `antiListNotes{8}` (the nuance prose). `hardRejectTerms[210]`.
`seriousAnti[5]`: fried oils / seed oils, gluten sources, msg / glutamate, modified / processed,
preservatives / additives.

Scanner-derived data points: `Alignment {score (0..2, 2dp), aligned, total, misaligned}`;
`GapFill {essential, gapFillPct, amountClaimed, unit}`; `AntiFlag {category, severity: hard|serious|
softened|mild, terms[], nuance?, softened?}`; `ScanResult {label, alignment, gapFills, goals[], anti[],
conflicts[], verdict, reasonsFor[], reasonsAgainst[], sparseNutrients, sparseIngredients, hits,
hitEssentials[], hitsStrong}`; `coverageDeltaForLabel -> {before, after, addedEssentials[]}`.
Thresholds: `HIT_THRESHOLD 0.03`, `HIT_STRONG 0.10`, `REDEEM_MIN_HITS 3`, meaningful gap-fill `>=10%`.
`getAntiIngredientWords()` returns every >=3-char word in the anti-list — the OCR corrector skips them
so it can never "correct" a flagged bad ingredient away.

### M. ORAC — three artifacts

`orac-data.json`: `decades{rows[{age, pct}]}`, `stolen_years{low, high, display, should_low,
should_high, actual}`, `rankings{points[{year, rank}]}`, `target{low, high, low_display, high_display,
base_age}`, `disease_target{min, display, min_display}`, `calories{low, high, display}`,
`payoff{years_low/high/display, weight_low/high/display}`, `ceiling{base, ceiling, gap,
base_claim_id}`. Every block carries `source_claim_id`.
`orac-foods-data.json`: `reach{target, target_display, cite, rows[{name, color, pct, over}]}`,
`scale{max_display, rows[]}`, `tables{categories[{key, label, color, basis, rows[{name,
value_display, bar}]}]}` (9 categories), `wine{rows[]}`.
`orac-products-data.json`: `{source, cite, untested_note, leader, rows[7 -> 6+leader]}` where each row
is `{product_id, name, form, orac, orac_display, price_wholesale, price_display, value, value_display,
bar}`.

### N. Glossary — `glossary.json` (251 KB, 1260 terms)

`terms[] = {term, plain, category, aliases?, number_exempt?{reason, claim_ids, approved}}`.
Categories: medical 410, biology 345, chemistry 207, nutrition 147, geology 45, anatomy 35, general 25,
physics 21, product-history 6, science 5, physiology 5, unit 4, abbreviation 3, supplement 2.
`glossaryRegex()` returns one longest-first regex; `glossaryDef(key)` looks up the normalised key
(lowercase, curly apostrophes folded, whitespace/hyphen runs collapsed to one space) so `Age-Beater`,
`Age  Beater` and `age beater` all resolve. **The gate forbids digits in a definition.**

### O. Condition categories — `condition-categories.json` (24 KB)

`categories{12}` -> `{label, color, icon?}`; `conditions{502}` -> category id.
The 12 with their hexes: bones-joints-muscles `#4f76a3`, mind-nerves `#7b62a3`,
heart-blood-circulation `#a83f48`, skin-hair-nails `#bd7b34`, digestion-liver `#6b8a43`,
hormones-metabolism `#2c8a7e`, reproductive-urinary `#a25490`, respiratory `#3f8fa8`,
immunity-infection `#c9a13b`, eyes-ears-mouth `#5860a8`, cellular-systemic `#5f636b`,
general-other `#8a8a86`.

### P. Profile — `wallachUserProfile_v1` + assets

`{name?, browsing, chosenAt, avatar?, theme?, accent?}`. Derived display values, all single-sourced in
`state/profile.ts`: `displayName(p, 'profile')` -> the name or **"You"**; `displayName(p, 'brand')` ->
the name or **"Codex"**; `displayInitial(p)`; `displayTitle(p)` -> `"<Name>'s Health Journey"` or
`"Your Health Journey"` (the browser tab title); `themeOf` / `accentOf`; `avatarSrcOf`.
Avatars on disk: **25 presets** — `assets/avatars/Generic.png` + `Men/01..12.png` + `Women/01..12.png`.
`presetSrc(id)` maps `generic-01` -> `Generic.png` and `men-NN`/`women-NN` -> `Men|Women/NN.png`. An
unknown/retired preset id degrades to the initial, never a broken image.

### Q. Creator's Log — `creators-log-embed.json` (2.67 MB, 931 entries)

`LogEntry {id, ts, surface, kind, summary (<=280), detail?, metadata?}`.
`LogKind` ∈ session-start, session-end, round-close, build, invariant-pass, invariant-fail, incident,
milestone, design-decision, note. `getEntries()` merges the build-time embed with this device's LS,
**embed wins on an id collision**, sorted newest-first. `getEntryCount()`.

### R. Misc data points

- `nutrient-resolver-data.json`: `vitamin_aliases{36}`, `mineral_names{60}`, `mineral_aliases{3}`,
  `amino_names{12}`, `fatty_acid_patterns[3]`, `omega_digit_pattern`, `stereo_prefixes[3]`.
- `ocr-dict-data.json`: `fuzzyDict[522]`, `knownNutrientNames[57]`.
- `slot-colours-data.json`: 14 hexes (`#e2352a` .. `#f15bb5`).
- `mechanism-clarity-data.json` (23 KB, 6 mechanisms) — **read by `views/entity-page.ts`, NOT by
  state**: `{slug, facet, eyebrow, kill, hook{figure,text,pivot}, figure, figure_alt, figure_labels,
  split{left,right{head,text,evidence_caption,quote_claim,quote_trim,field{total,columns,bands}}},
  bridge, figure_pre_beats, beats[{n,title,text,hook,traces[],turn,cta{label,tab}}], beats_layout,
  figure_post_beats, coda, quote_claim, highlight, stat{value,readout,label,claim}}`.
- `fatty-acid-clarity-data.json` — also view-owned: `{disclaimer, omegas[3]{family,label,acids[{abbr,
  name,primary,description,source}], experience, quote_claim, highlight, crosslink}}`.
- `home-curation.json`: `explore_preview[14]` slugs.
- `foods-curation.json`: `hero_claims[3]`, `remove[5]`, `eat[6]`, `conditional[4]`, `enzyme_claims[5]`,
  `villi_quote{id, highlight_from}`, `sec04_quote{id, excerpt_from, excerpt_to, mark}`.
- `entity-copy.json`: `essentials{36}` and `topics{143}` -> `{lede?, why?, sourcesNote?}`;
  `conditions{}` is EMPTY today.

### Data files present on disk but NOT imported by the app

`coverage-layout-skeleton.json`, `foods-catalog-curation.json`, `trace-mineral-vehicles.json`,
`orac-foods-curation.json`, `orac-products-curation.json`. These are derive INPUTS that ship in
`assets/data/` (accounted for by the `data_artifacts_accounted` gate) but no TS module imports them, so
they are not in the bundle. A rebuild must not assume they are available at runtime.

---

## Copy

Copy in this layer falls into four buckets.

### 1. The prose store — `view-copy.json` (35 KB), read via `state/copy.ts`

- `kind_labels{14}`: PROTOCOL, MECHANISM, DEFINITION, DEFICIENCY SIGN, DOSE, PREVALENCE, TOXICITY
  SIGN, PROGNOSIS, INTERACTION, DIAGNOSTIC PATTERN, QUOTE, PERSONAL ANECDOTE, CONTRAINDICATION,
  FOOD SOURCE.
- `kind_categories{14}` (colour token per kind): protocol/dose -> green; mechanism, definition,
  diagnostic_pattern, interaction, food_source -> teal; deficiency_sign, toxicity_sign -> amber;
  prevalence, prognosis, quote -> orange; personal_anecdote -> violet; contraindication -> red.
- `facet_labels{13}`: BASICS, DISCOVERY, ETYMOLOGY, IN THE BODY, HOW IT WORKS, SOURCES & EXPOSURE,
  USES, WALLACH'S STANCE, WHAT TO DO, WARNINGS, HISTORY & LORE, BIG QUESTIONS, BIOGRAPHY.
- `ui{401}` strings, namespaced by prefix: `kd_` 300 (Knowledge drawer), `kh_` 25 (Knowledge home),
  `cov_` 19 (Coverage), `search_` 18, `ep_` 11 (entity page), `kt_` 11 (Knowledge topic), `fs_` 9
  (food sheet), `wc_` 8 (welcome). Accessed as `ui(id)`; an unmapped id returns `''` (never
  `undefined`), an unmapped kind/facet falls back to the slug uppercased-and-spaced.

**Contract:** a view imports a label by id here; it never inlines prose. Gated by `views_no_inline_prose`.

### 2. Strings authored in `main.ts` (workspace headers)

- Coverage — "Every essential Wallach named, measured against what you take."
- Regimen — "Design your own protocols based on your goals + Import and export regimens for yourself
  or others"
- Scanner — "Scan a label to see how your favorite supplements stack up against your goals, or
  type/paste ingredients to see if it's safe"
- Boot console line: `[wallach·sys v3.27] dashboard module graph loaded · Round 2 (Coverage migrated)`

### 3. Rejection / failure reasons (state-authored, all user-visible)

Profile / storage:
- "There is not enough room left on this device to save that."
- "That change could not be saved to this device."
- "A name needs at least one visible character." / "A name can be at most 40 characters." /
  "A name cannot contain control characters." / "A name must be text." / "That name cannot be used."
- "An avatar must be a preset or an uploaded image." / "That image is too large to store on this
  device." / "That avatar cannot be used."
- "That image could not be read." / "That file could not be read." / "That file is not valid JSON." /
  "That is not a Codex backup file."
- "Import incomplete — N item(s) could not be saved; this device may be out of room. N restored."

Regimen slot ops:
- "You can have at most 4 regimen slots. Delete one first."
- "This is your only regimen slot — it can't be deleted."
- "That slot no longer exists." / "That slot could not be saved to this device." / "That slot could
  not be deleted." / "That slot could not be activated."
- "A slot name needs at least one visible character." / "A slot name can be at most 40 characters." /
  "A slot name cannot contain control characters." / "That slot name cannot be used." / "That name
  could not be saved."
- "That colour is not in the slot palette." / "That colour could not be saved."
- "That item is not in the recycle bin." / "That item could not be restored."
- "That save is not in the recycle bin." / "You have 4 saves. Choose one to move to the recycle bin
  first." / "The save to replace no longer exists." / "That save could not be restored."
- "You have 4 saves. Delete one first to import." / "That file is not a valid saved regimen." /
  "That save has too many items to import." / "That save could not be imported to this device."
- "That is not a Codex regimen file."
- Default new-slot name: `Slot N`; duplicate name: `<name> copy` (sliced to 40).

Scanner verdict reasons (composed at runtime, so they must survive verbatim):
- "High form alignment (S/2.0, A/T aligned)" / "Moderate form alignment (S/2.0)"
- "N misaligned form(s) — non-Wallach-preferred"
- "Meaningful gap-fill" with items `"<Essential> (+P%)"` (top 3)
- "No nutrient closes >10% of a current gap"
- "Goal coverage" with up to 4 goal display names
- "Hard-reject ingredients" / "Serious anti-list flags" / "Mild / softened flags (nuance applied)" /
  "High-severity conflicts"
- 'Seed / fried oil — rejected' + `<category> — "term", "term" +N more · needs 3+ essentials in a
  meaningful amount to be neutral (has N)`
- 'Seed / fried oil — offset to neutral' + `... · offset by N meaningful essential(s) — neutral,
  never recommended`
- Container-name humanisation: `aluminum_can`/`can` -> "Canned drink", `capsule` -> "Capsules",
  `tablet` -> "Tablets", `softgel` -> "Softgels", `powder` -> "Powder", `liquid` -> "Liquid",
  `bottle` -> "Bottled product"; unknown -> "Scanned label".

Export filenames: `wallach-codex-backup-YYYY-MM-DD.json`, `wallach-regimen-<safe-name>-YYYY-MM-DD.json`.

### 4. Prose inside the data artifacts

`entity-copy.json` ledes/whys, `foods-curation.json` classifications, `scanner-corpus` antiListNotes
and `why` snippets, every claim's `question` / `answer_short` / `answer` / `verbatim`, every
glossary `plain` definition, `orac-*` `cite` / `untested_note` strings, targets' `target.source`
provenance lines. **All of it is data, none of it is authored in code.**

---

## Interaction dependencies

Things in this layer that cannot survive a touch screen as they stand. Each is flagged.

1. **BARE KEYBOARD SHORTCUTS ARE THE PRIMARY NAV FOR TWO SURFACES.** `1`/`2`/`3` jump workspaces and
   `S`/`K` toggle the Search and Knowledge drawers (`main.ts::wireDrawerKeys`). On a phone there is no
   keyboard — every one of these needs a real touch affordance or the drawer becomes unreachable by
   any path other than the rail button and the topbar Ask button. **LOUD: verify Knowledge has a
   touch entry point at all in the rebuild.**
2. **`Escape` is the only universal drawer-close.** `closeAllDrawers()` on Esc. A phone needs a
   swipe-down / back-gesture / explicit X on every overlay, and each of those must emit
   `drawer:toggled` or the rail highlight desyncs (that bug already happened once — the highlight is
   DERIVED state).
3. **Tab focus trap in the profile modal** (`PF_FOCUSABLE`, shift-Tab wrap). Keep for a11y; it is not
   the touch path.
4. **`hideProfilePanel()` restores focus to the opening trigger.** A touch rebuild must still do this
   for screen-reader users.
5. **File pickers, three of them** — backup import (`profile.ts`), regimen-slot import
   (`regimen.ts::triggerImport` creates a transient `<input type=file accept=.json>`), avatar upload.
   `<input type=file>` works on mobile, but the flow is an OS sheet — design for the interruption
   (the page may be backgrounded and re-entered).
6. **Downloads via `a.click()` + `URL.createObjectURL`** — backup export and slot export. On iOS
   Safari this opens rather than downloads; the copy must not promise "downloaded to your Downloads
   folder". **FLAG: verify on-device before shipping.**
7. **Camera / image capture for OCR.** `state/ocr.ts` takes a data URL and runs vendored Tesseract.js
   (PSM 3, local worker/core/lang, zero network). The payload is a ~4-5 MB WASM core plus a ~13 MB
   compressed language model over http, or a **~17 MB self-contained offline worker on file://**,
   loaded lazily on first scan. On a phone that is a very visible wait and a real memory load —
   the progress reporter (`{stage: 0|1|2, message, determinate, fraction}`) exists and must be used.
   `preprocessImage` does a canvas upscale + grayscale + contrast pass; large phone photos will hit
   canvas memory limits. **FLAG for device testing.**
8. **Cross-tab sync via the native `storage` event.** `core/storage.ts::onChange` re-fires
   `regimen:changed` for any `rgSlot*` key. Mobile browsers rarely have two tabs of a file:// page —
   the mechanism is harmless but do not build a feature on it.
9. **`window.*` bridges** (15 regimen ops, `lcScan`, `lcLastResult`, `lcParseLabel`, `lcScanImage`,
   `lcOcrToLabel`). These are how headless render-probes drive the app. **They must stay wired from
   bootstrap** — a bridge defined but never invoked reads as a passing probe that tested nothing.
10. **No hover dependency exists in this layer** — but two data points are designed FOR a hover
    surface and need a tap equivalent: `pdmGoalProvenance()` (the "how is this calculated?" popover)
    and the glossary tooltip (`glossaryRegex` + `views/gloss-tooltip.ts`). A dotted-underline term
    that only reveals on hover is dead on a phone.
11. **`window.location.reload()` after a backup import.** Deliberate (many keys change at once), but
    on a phone a full reload of a 13 MB bundle is a long blank screen. Consider a progress state.

---

## Desktop-only assumptions

1. **One shared `.app-workspace` scroller for all three workspaces**, with per-view `scrollTop`
   memorised in a `main.ts` map. A mobile IA with independent screens/routes needs a different
   scroll-restoration model entirely.
2. **`withScrollPreserved`** (views/scroll-keep.ts) hard-codes exactly two scrollers — `.app-workspace`
   (an ancestor that survives) and `[data-rail-list]` (a descendant that does not). Any new mobile
   scroller silently loses its position on every repaint until it is added here. This exact gap
   already shipped once.
3. **Repaint-by-`innerHTML`-replacement.** Coverage and Regimen rebuild their whole subtree on every
   dose step. On a phone that is a visible flash and kills any in-progress touch gesture, text
   selection, or open native control.
4. **Only one overlay open at a time**, enforced in `main.ts::toggleDrawer` by closing all others.
   Fine on mobile, but "drawer" is a desktop metaphor — these are full screens on a phone.
5. **The rail is the only navigation surface** and it is a left vertical column with a profile chip
   footer. There is no bottom-bar concept anywhere in the shell.
6. **Topbar breadcrumb = `{name, deck}`** where the deck is a full sentence (the Regimen deck is 100+
   characters). A phone topbar cannot hold these; the deck copy must find a new home rather than being
   deleted.
7. **The 91-tile periodic table is a wide grid** with per-section `gridClass`. It is the primary
   Coverage surface and it assumes horizontal room.
8. **The bundle is one ~13 MB file** (file:// build) with a 2.95 MB corpus, 4.23 MB search index and
   2.67 MB log inlined. The web build splits three artifacts; the local build cannot. First paint on a
   phone is the constraint nobody has measured. **FLAG.**
9. **Modal-detection by DOM probe** — the bare-key guard tests `#welcomeHost` children and
   `.pf-overlay` existence. Any new mobile overlay must register itself the same way or bare keys
   (if kept for tablet keyboards) fire behind it.

---

## Feature-preservation contract

A rebuild must satisfy every numbered item.

1. **`core/storage.ts` remains the only file that touches `localStorage`.** Gated by
   `regimen_state_mutation_routing` (RED board, not a lint warning). Every write is try-set ->
   verify-read -> reject-on-mismatch, and a failed write returns `{ok:false, reason}` — never a silent
   drop.
2. **Every read goes through `getValidated(key, schema)`.** Bad LS data must degrade to `null`, never
   enter typed-land.
3. **`writeSlotDoc` stays the SOLE writer of regimen state**, and all five legacy chokepoints
   (`persistRegimen`, `saveRgOverride`, `saveRgManual`, `saveRgRemoved`, `saveRgUserGoals`) keep their
   name, signature, emit, and delegation — the gate checks each by name.
4. **All regimen state stays in ONE key.** localStorage has no cross-key transaction; splitting trash
   or the active pointer into a second key puts a torn-write data-loss window on the live remove path.
5. **The 10 localStorage keys above are preserved**, including the five legacy read-only ones — a
   pre-migration backup restored into the rebuilt app must still migrate.
6. **The profile tri-state survives**: `null` = ask, `{browsing:true}` = a made choice, named = named.
   Never re-prompt a guest.
7. **Both bounded free-text fields keep their bound AND their rejection path**: display name (40) and
   slot name (40), both rejecting control chars and bidi overrides, both rejecting rather than
   truncating. Names render through `textContent`, never `innerHTML`.
8. **`importSlot` keeps re-minting every field** of an imported save (fresh ids, narrowed label,
   provenance forced to `user_manual`, overrides remapped, 500-item cap).
9. **`restore()` keeps its no-op-on-empty guard** and keeps returning `{restored, skipped, removed}`
   so a partial restore can never be reported as clean.
10. **The typed event bus survives with all 13 event names**, and `regimen:changed`,
    `coverage:recomputed`, `scanner:scan-complete`, `profile:changed`, `corpus:hydrated`,
    `knowledge:open-entity`, `knowledge:open-tab`, `drawer:toggled` keep their exact payloads. Four
    names (`scanner:scan-cleared`, `eden:hash-mismatch`, `storage:pressure-warn`, `rail:navigate`)
    have no producer or no subscriber today — keep them declared, do not build on them silently.
11. **`installRecomputeTrigger()` and `installBridges()` are still called once at boot.**
12. **`resolveSlug` stays the ONE identity resolver.** Its order (fatty-acid family -> vitamin alias
    -> mineral display name -> mineral alias -> stereo-stripped amino) is a faithful port of the
    Python and is proven equal by `nutrient_resolver_parity` + a vitest. Do not add a second matcher.
13. **`core/units.ts` stays the ONE converter.** Micro is tested before milli before grams; a fluid
    ounce is refused outright. `toMg`'s unknown-unit fallback to the mg family is documented legacy —
    do not "fix" it.
14. **Coverage thresholds and every special-case rule are preserved verbatim:** 0.95 / 0.30; `low<=0`
    + nothing delivered -> pending; `low===0` -> covered; H/C/N/O -> covered; omega-9 capped at
    `present`; mirrors resolved in a SECOND pass that fails CLOSED; `trace_pdm` presence floor
    (`'present'`, never `'covered'`); `vehicle_supplied` takes the BETTER of vehicle and numeric;
    `wallach_collective` routes per group and returns `''` for an unknown group.
15. **The three aggregate meters keep their goals and their provenance:** PDM 924 mg (with the full
    `pdmGoalProvenance()` derivation), EFA 9000 mg counted in OIL mass, and the per-essential numeric
    targets. No goal may be re-derived in a view.
16. **`contributesTo` is never rendered as "products that cover this tile."**
17. **The auto-heal fork survives**: user-supplied items keep their own numbers forever; catalog foods
    re-read by `food_id`; catalog products re-read by lowercased name. `core/provenance.ts` remains
    the single home of the user-supplied test (gated).
18. **`coveredCountForItems(items, overrides)` stays pure** so a non-active save's count equals what it
    would read once active.
19. **Both scan stores survive with their distinct semantics**: recent = auto FIFO cap 5 with NO
    name-dedup; saved = user-curated cap 100, never auto-evicted. Scan ids stay strictly increasing
    (`nextScanId`) — the old `Date.now()+random` scheme collided and re-opened the wrong entry.
20. **`scoreLabel` (preview, no logging) and `runScan` (commit, logs + emits) stay separate.**
21. **The scanner's anti-list severity tiers survive** (hard / serious / softened / mild) plus the
    seed-oil redemption rule at `REDEEM_MIN_HITS = 3`, and the "clean paste reads NEUTRAL, never
    REJECT" default.
22. **`getAntiIngredientWords()` keeps gating the OCR corrector** so a suggestion can never erase a
    flag.
23. **The gap-fill baseline stays retired.** `getEffectiveCoverage()` = the regimen and nothing else.
    Never re-introduce an assumed dietary table.
24. **All 401 `ui` copy ids, 14 kind labels, 14 kind categories and 13 facet labels stay reachable**
    through `state/copy.ts`; no view inlines prose (gated by `views_no_inline_prose` and
    `views_state_no_inline_data`).
25. **The colour-category mapping stays in data**, never a TS colour literal (gated by
    `view_category_not_hardcoded`): facet families via `data-family`, claim kinds via
    `kind_categories`, condition categories via their own hexes, food/essential categories via the
    canon's own `category` field.
26. **Goal state stays PER-SLOT**, capped at `MAX_GOALS = 5` derived from `GOAL_HUES.length`, hues
    indexed by PICK ORDER not by goal id. A goal never changes the denominator.
27. **Theme + accent stay style-only** and stay applied from one place to `<html>`.
28. **The 25 preset avatars + the upload path survive**, with the 256px downscale before storage and
    the 900 KB backstop.
29. **The Creator's Log embed/LS merge survives** (embed wins on id collision), and `log()` remains the
    only sanctioned writer even while it has no caller.
30. **Search retrieval stays deterministic and offline** — field-weighted, no LLM. The charged-topic
    gate stays: `homosexuality` / `intersex` only on an explicit name.
31. **The facet display orders survive**, including `warning` at position 2 and the condition
    stance-first override.
32. **The three curation filters stay READ-time and stay off the Products database path**: kids
    exclusion, superseded products, starter pack.
33. **Recommendations are never persisted** (gated by `recommendations_not_stored`).
34. **`SPLIT_DATA` + the content-hashed manifest survive for the web build**, and the file build keeps
    everything inlined. `split_data_manifest_agrees` gates the two lists.
35. **The layer boundaries stay enforced**: `views -> state -> core`, `core` imports nothing local.
    Anything two views need goes to `core/` (that is why `units.ts`, `dose-units.ts`,
    `goal-display.ts`, `provenance.ts`, `format.ts` live there).
36. **Every JSON artifact stays Zod-validated once at its boundary**, cached, with a documented
    degrade path — empty for optional surfaces, `.parse()` (throw) for `foods-composition`,
    `dose-defaults`, `starter-pack`, `nutrient-resolver`, `pdm-coverage`, `efa-coverage`,
    `scanner-corpus`, `coverage-layout` where an empty read would be a silently vanished feature.
37. **`data_artifacts_accounted` still passes** — every `assets/data/*.json` is in the MANIFEST as
    derived or accounted.
38. **Wallach numbers keep their provenance visible.** Every target carries `source`,
    `source_claim_id`, `provenance` and often `other_claims`; every food row carries
    `provenance{source_id, tier, join, value_kind, why?, conservative?}`. A redesign that shows an
    amount without a path to its citation breaks §00.A's spirit even if no number changed.

---

## Open questions

1. **Bundle weight on a phone is unmeasured.** The file:// build inlines ~13 MB (corpus 2.95 MB,
   search index 4.23 MB, log 2.67 MB, product detail 0.80 MB, entity pages 1.04 MB). Nobody has
   recorded a cold-open time on a real device. If it is bad, the local build has no split mechanism —
   `data-split.ts` is web-only by design. **Needs a decision, not an assumption.**
2. **Does the mobile app keep the Creator's Log surface at all?** It is 2.67 MB of the bundle for a
   read-only audit trail whose in-app writer has no caller. Not my call — flagging the cost.
3. **`entity-copy.json` `conditions{}` is empty.** 510 condition pages have no approved lede. Is that a
   known gap or did something not land? A mobile condition page that leads with nothing will read
   cheap.
4. **`ScanLabel.entry` ('scanned' | 'typed') is absent on old entries and means 'scanned'.** A rebuilt
   history UI must honour the absent case or it will mislabel every pre-existing scan.
5. **Container conflicts are inert** — `containerFlag()` returns `[]` always, because an OCR'd label
   carries no container metadata. The `conflicts` field, the "High-severity conflicts" reason and the
   whole `Conflict` type are dead paths today. Keep or cut is a product call.
6. **`window.triggerRegimenRerender` compatibility shims** exist in two modules for a global nothing in
   this bundle defines. Inert, but they are two places a future bug can hide.
7. **`trace` status is retained for back-compat but never produced.** Readers treat it as covered. Can
   the rebuild drop it from the union, or does a stored artifact still carry it?
8. **The `intakeVsTarget` residual:** no target is IU-family any more, so a product still listing A/D/E
   in IU lands in the unused `totalIU` accumulator and does NOT count toward its metric target —
   **7 products today**. Documented, not fixed. A mobile Coverage surface will show those seven as
   contributing nothing.
9. **`IU_TO_MG` in `core/units.ts` is NOT gated** — the Python side is pinned by `amounts_wallach_only`,
   this TS copy is a WISH. A typo here leaves the board green.
10. **`SLOT_NAME_MAX` duplicates the profile name safety rather than importing it.** Both are live; the
    file says any change to one must be mirrored in the other. A rebuild is the natural moment to
    consolidate into one core text-safety primitive — but that is a change, so it needs approval.
11. **Item trash schema allows 20, code caps at 4.** `SlotDocSchema.trash` is `.max(20)` while
    `MAX_ITEM_TRASH` is 4 and `backfillRecycle` repairs over-cap documents down to 4. Harmless today;
    confusing to anyone reading the schema as the contract.
12. **No storage-pressure signal exists.** `storage:pressure-warn` is declared and never emitted. The
    only quota feedback is a failed write's reason string, surfaced after the fact. On a phone with a
    tight origin quota and a 900 KB avatar allowance, that may not be enough.
