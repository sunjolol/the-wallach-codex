# ★★★ NEXT SESSION — READ THIS FIRST. Active task: REGIMEN TAB REDESIGN. Headers are PARKED.

Everything you need is below — **nothing needs to be re-derived.** Do not re-explore the codebase,
do not rebuild the demos from scratch, do not re-run the research fleet.

## RESUME POINT (2026-08-13) — REGIMEN REFINEMENTS
The active task is unchanged: **refine the 4-demo regimen shortlist to Luneth's per-demo tweaks.**
He will hand over the detailed tweaks; wait for them, then REFINE (do not rebuild). See the demo +
pipeline sections below — all still on disk and current.

### 2026-08-13 corpus diversion — DONE, PARKED (do not re-do)
A brief 3-category corpus **expansion** was completed this session and parked; it does NOT block the
regimen work. Summary so the next session doesn't repeat it:
- Luneth asked to expand **Chronic Fatigue**, **Seizures** (umbrella over convulsions/epilepsy/
  absence, his own grouping), and **Eye health** — and to add findings to his **claim-ruling
  dashboard**, ranked the same way, visually distinct from the pending 907.
- Delivered: `claim-ruling-dashboard-final.html` (in the OTHER session scratchpad
  `…/603b1e2d-…/scratchpad/`) now has **936 rows** = original 907 (untouched, rulings preserved via
  stable nkeys) **+ 29 new byte-exact-verified claims**. New rows carry a category chip + NEW pill +
  colored right-edge; added a Category filter, ★priority / NEW-only buttons, priority sort, per-cat
  tallies. **112** already-pending category claims were tagged too. Original backed up to `.bak`.
- **18 true near-dups were dropped** (verbatim contained in a sealed claim). Build/verify scripts +
  the recon live in THIS session's scratchpad (`…/02cbd614-…/scratchpad/`: `recon.json`,
  `assemble_expansion.py`, `build_dashboard_v2.py`, `dashboard-shell-v2.html`).
- **FLOATERS: Wallach is silent** — verified 2× across all 7 books; NO floaters claim/page was
  added, per Luneth (if he doesn't cover it, it doesn't appear). Recorded in memory
  `wallach-silent-on-floaters`.
- **Nothing was sealed into the corpus** — the 29 await Luneth's introduce/merge/reject rulings in
  the dashboard. Only after he rules do any land in `eden/` (a separate future task).

## WHERE WE ARE (regimen, 2026-08-11, end of day)
Luneth reviewed **6 fresh regimen-tab demos**. Verdict, verbatim: *"This is a step in the right
direction. 1, 2, 4, and 5 are best but all of them will require a lot of small tweaks and changes."*
He was out of time; **the next working session = he gives detailed per-demo tweaks so we finally nail it.**
- **SHORTLIST (refine these): 1 Cockpit · 2 Save States · 4 Mission Control · 5 Studio.**
- **OUT: 3 Almanac · 6 Bloom.** (Kept on disk for reference, not the direction.)
- **Do NOT rebuild — REFINE the shortlist to his tweaks.** Wait for his tweaks before editing.

### The 6 demos — `temporary/awaiting-refinement/` (gitignored, on disk; `.png` screenshot beside each)
- `regimen-demo-1-cockpit.html` — **SHORTLIST** — premium health-tech: SVG donut gauge (47/90) + category bars, horizontal slot switcher on top, dose-stepper stack rail, scan hand-off.
- `regimen-demo-2-save-states.html` — **SHORTLIST** — playful/game: big collectible "save" cards, goals→quests, recs→power-ups, game-board 90-grid. Refined paper, not childish.
- `regimen-demo-3-almanac.html` — OUT — warm editorial (Playfair masthead, circular dot-grid coverage).
- `regimen-demo-4-mission-control.html` — **SHORTLIST** — bold/vivid: dark `--ds-ink` hero band, 115px 47/90, glowing green constellation grid; paper below.
- `regimen-demo-5-studio.html` — **SHORTLIST** — premium search/add-led: unified product+food search hero, results ranked by goals, whole slot compacted into the rail.
- `regimen-demo-6-bloom.html` — OUT — coverage as a radial 90-dot sunburst.

### Build pipeline — PRESERVED in `temporary/regimen-build/` (this session's scratchpad is gone; these persist)
- `rg-base.html` — shared scaffold: real app chrome + the 9 dashboard stylesheet `<link>`s + scroll-unlock + shared 90-cell generator + the food-reference banner. Insertion markers: `RG:CONCEPT_TITLE` / `RG:DECK` / `/* RG:SCOPED_STYLE */` / `<!-- RG:WORKSPACE -->`.
- `rg-spec.md` — THE spec: hard rules, full token palette, reusable class vocabulary, the **LOCKED sample dataset** (slots/goals/coverage 47·6·37/recs/stack/foods), and the 6 concept briefs. Read this to tweak with zero re-derivation.
- `rg-demos.json` — the 6 builders' raw `{conceptTitle,deck,scopedStyle,workspaceHtml}` (source to re-assemble).
- `rg-assemble.py` — assembles `rg-demos.json` + `rg-base.html` → the 6 full `.html` files.
- `rg-shot.js` — puppeteer full-page screenshotter; proves the page scrolls + reports 404s/console errors.
  Run: `NODE_PATH="<repo>/node_modules" node temporary/regimen-build/rg-shot.js temporary/awaiting-refinement/regimen-demo-N-*.html`
- **To edit a demo:** they are hand-authored full pages — `safe_write` the HTML directly, then re-screenshot and **STOP for his eyes** (a DOM probe is not a visual check).

### DESIGN DISCIPLINE that made these land — do NOT regress
1. **Reuse the real Coverage/design-system vocabulary; NEVER invent a palette.** (Last round r2 was scrapped for a fresh-blue palette + 16px radii + bespoke buttons.) All tokens/classes are in `rg-spec.md`.
2. **Coverage cells are JS-generated** (`data-field` → 90 = 47 covered · 6 goal-gap · 37 not) so the count can't drift from the headline.
3. **Foods are labeled `FOOD · REFERENCE`** (USDA FoodData Central via NIH ODS), never Wallach. §00.A-clean: food composition is an INPUT to the coverage math; Wallach still owns every target.
4. His answers this round: slots are **flexible named configs**; **all four vibes** wanted (one per demo); foods **first-class, labeled reference**; **6 full-tab directions**.

### FEATURE SET every demo carries (his brief)
save slots (flexible names, max 4) · per-slot goals (max 5, from the 14-goal catalog) · 90-coverage at a glance (aesthetic) · goal-ranked recommendations (products + foods together) · dose-editable stack · unified add + **"scan a new item → Scanner ↗"** button. Must feel **fun/inviting yet powerful, never overwhelming**; every tab stays in sync via the active slot.

## WHAT EXISTS vs NET-NEW (researched 2026-08-11 — do NOT re-explore)
- **Save slots: EXIST** in state — `rgSlots_v1` (1–4 slots, active pointer, trash) + full ops in `state/regimen.ts` (`addSlot`/`duplicateSlot`/`renameSlot`/`deleteSlot`/`setActiveSlot`/`restoreFromTrash`). The VIEW `views/regimen.ts` is **fabricated scaffold not wired to them** — that's the net-new UI.
- **90-coverage engine: EXISTS** — `state/coverage.ts` → `CoverageSnapshot` (per-essential status + fillPercent, `coveredCount/90`, recompute on `regimen:changed`). Coverage tab is current default landing.
- **Goals: EXIST but GLOBAL** — `rgUserGoals_v1` + 14-goal catalog in `coverage-layout-data.json` (max 5; hues in `core/goal-display.ts`). Invariant: a goal changes what you look at / are recommended, **never the /90 denominator**. **Per-slot goals = NET-NEW** (extend `SlotSchema` in `core/schemas/regimen.ts`).
- **Recommender: EXISTS + goal-aware** — `state/recommender.ts::rankProductsForCoverage({want,owned,goals})`, score 0.6·adequacy + 0.3·breadth + 0.1·value, wholesale price, kids excluded. Live in Coverage/entity; **NET-NEW to wire into Regimen** (which today shows fabricated recs).
- **Scanner: EXISTS** — `views/scanner.ts` with an "ADD TO REGIMEN" adopt bridge into the active slot. The "scan a new item" button just `navigateTo('scanner')`.
- **Product DB: EXISTS** — `eden/products/products.json` (215, composition), `eden/products/prices.json` (wholesale), rollups `product-recommender-data.json`.
- **Foods: NET-NEW** — no USDA/NIH data in repo; the source-rule forbids non-Wallach numbers, so a foods DB needs the labeled-reference decision (**Luneth: YES, first-class labeled reference**). Build live later via a derived artifact (the ORAC pattern), never hand-typed. Precedent: potassium foods table + ORAC.
- **Layers**: `views→state→core`. New regimen UI in `views/regimen.ts` onto `loadSlots`/slot-ops; per-slot goals in `core/schemas/regimen.ts`; anti-fakery gate forbids faked data or literals >10 in views/state.

## HEADERS — PARKED until everything else is done (Luneth, 2026-08-11). DO NOT build headers.
Phosphorus r2, germanium r1, cobalt r2, manganese r4 are all CLOSED/approved; sodium r1's refinement is unnamed (ASK when headers resume); the sourcing-ladder is verified (kv469). All of it lives in git history + `.claude/skills/element-headers` + `chronicle/header-research/`. **Revisit at the very end.**

## STILL-OPEN CORPUS THREADS (non-header — carry forward)
- **3-category expansion (2026-08-13): 29 new claims await rulings** in `claim-ruling-dashboard-final.html` (session 603b1e2d scratchpad). Only after Luneth rules introduce/merge do any land in `eden/`. Not started as a corpus write.
- **Seizures umbrella slug does NOT exist yet** in `conditions.json` — creating it (over convulsions/epilepsy/absence_attacks) is part of introducing the seizure claims Luneth rules "introduce."
- **Findability gaps (2026-08-13):** ~5 seizure facts are already SEALED but under a different question (e.g. "low magnesium causes seizures" lives in the claim about why magnesium tastes bad). Fix by ENRICHING the existing claim with a seizure-phrased question — not a duplicate claim.
- `WAL-CLM-IMMORT-000023` claim_text says **pre-WWI**; all four books say **WWII**.
- `WAL-CLM-RARE-000072` verbatim doesn't carry its own "five to 12 per cent" headline (widening).
- Tag hygiene: `colloidal-minerals`(17)/`colloidal minerals`(4)/`colloidal_minerals`(1)/`colloidal`(3); `chelated`(4)/`chelated-minerals`(2)/`chelation`(2).
- All **66 form/absorption claims** are `review_state: draft`.
- `HELLS-000029` / `HELLS-000064` duplicate needs per-claim approval.
- Germanium `RARE-000011`/`012` not search-enriched; `EPIGEN-000309` herb list contains "sushi" (flagged, byte-exact).
- Potassium `other_claims` cites dead `WAL-CLM-LETS-000062` (5,500 mg survives in a live TSN table — repoint).

## STANDING WORKFLOW (unchanged)
Demos park in `temporary/awaiting-refinement/` → graduate to `ready-to-be-ported/` → port live only with explicit approval + STOP-for-sign-off. All repo writes via `safe_write`. Verify with your eyes (screenshot), not the code. Genesis = Luneth opens a new session and types `genesis` himself.
