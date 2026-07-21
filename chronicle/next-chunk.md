# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-21)
# ★★★★ 2026-07-21 (SESSION 7) — ★ PLANT-DERIVED "HOW IT WORKS" PAGE FINALIZED + DE-POISONED · board 77/77, committed + pushed

**The plant-derived how-it-works page is done.** The figure readability landed (bigger/bolder/wider boxes, re-centred), the unsourced "30-day therapeutic use" box is gone, and the false 2× therapeutic multiplier was purged from every layer. Luneth ratified "nothing more" on a new 30-day claim. Board green, one commit, pushed. He asked to close + restart with genesis.

## What shipped this session (1 commit)
- **Figure readability** (`views/entity-page.ts::pdmFigure` + `drawer-knowledge.css` `.kd-ep-fam__art--pdm` scope; omega figures untouched): node names 12.5→21px, arrow captions 11→19px, weight 600, `--ds-ink` (was ink-soft); box 60→76h + width 176→209 (**+20 SCREEN px/box** — via viewBox 918→1050 + a scoped figure CSS width 560→640 so gaps/text/height render unchanged). 98%/Colloidal + single-line names re-centred (≤0.23px off).
  - **★ LESSON (do not relearn):** an SVG scales to its CSS width (~0.61 px/unit here) — size PDM-figure changes in SCREEN px, not viewBox units. An early +6-unit box bump was only +3.7 screen px = invisible. Verify with a headless-Chromium measure+screenshot; the in-app preview pane CACHES the 6 MB bundle (a normal reload showed the stale build). [[measured-change-not-extremes]]
- **Removed the unsourced "30-DAY THERAPEUTIC USE" box** — hand-written UI prose (`kd_ep_pdm_thera*` view-copy) rendered only on the 35 trace_pdm pages, the exact elements FIG 8-1 doesn't cover. Gone from render + view-copy + CSS. Group note (`kd_ep_pdm_note`) stays.
- **Purged the false 2× therapeutic (R8 no-poison)** from all 5 layers: `trace-mineral-vehicles.json` (therapeutic_multiplier/_note), `pdm_coverage_derive.py`, regenerated `pdm-coverage-data.json`, `pdm-coverage.ts` schema, and trimmed the therapeutic half of the `pdm_goal_wallach_sourced` gate (Wallach-sourced maintenance anchor intact + green; R9 refinement, not a silent loosening).

## Key finding (for whoever picks up dosing / therapeutic-tier work)
**FIG 8-1 "Base Line Nutritional Supplement Program For Adults" (Let's Play Doctor p.72-73, Luneth verified the table) is ALREADY mined** — 33 dose claims / 32 essentials, each rendering *RDA · True Supplement Need · 30-Day Pharmacologic* per-element (`dose.for_condition == 'base-line supplement program (true supplement need)'`, `isFig81Row` in entity-page.ts + knowledge-corpus.ts). The two-tier maintenance-vs-30-day-therapeutic concept is already surfaced + sourced where it applies. The plant-derived trace minerals have NO individual therapeutic dose (they're the colloidal group, 924 mg shared goal via WAL-CLM-EPIGEN-000089) — which is exactly why the box + the 2× were wrong on those pages.

## NEXT
Open — the PDM how-it-works arc is complete. Pick the next surface/task from `chronicle/OVERHAUL-BLUEPRINT.md`, or ask Luneth what to build next. Board 77/77, tree clean.
