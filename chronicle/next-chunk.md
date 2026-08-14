# ★★★ NEXT SESSION — READ THIS FIRST.

The **Journey/Journal feature was removed entirely** on 2026-08-13, at Luneth's decision — it was
redundant against the note apps people already keep. What led here: a design round produced four
archaic "logbook" Journal redesign demos (Day-Book / Kept Hand / Specimen Book / Kept Almanack);
Luneth reviewed them and cut the whole surface rather than ship it.

## WHAT WAS REMOVED (complete + verified)
- **Deleted files:** `views/journey.ts`, `state/journey.ts`, `state/goals.ts`, `core/schemas/journey.ts`,
  `core/schemas/goals.ts`, `assets/styles/drawer-journey.css`, `tools/render_probe_journey.js`,
  `components/drawer-journey-v3-PROPOSAL.html`, and the temporary Journal demos.
- **Unwired from:** `main.ts` (imports, DRAWER_SPECS, wireJourneyAutoDerive, WorkspaceTarget union),
  `core/events.ts` (`goals:updated` + `journey:changed` events + target unions), `core/schemas/index.ts`,
  `core/schemas/profile.ts` (comment), `dashboard.html` (rail J item + mount + stylesheet link),
  `dashboard.css` / `drawer-search.css` / `drawer-shared.css` / `drawer-knowledge.css` /
  `workspace-coverage.css` (journey chrome + comments), `render_probe_rail_sync.js`,
  `test_views_no_ciphered_data.py`, `knip-baseline.json`.
- **Two "goals" — do not confuse:** the COVERAGE board's goals (`LayoutGoal` / coverage-layout-data.json /
  `.goalstrip` / `activeGoals()`) are a DIFFERENT, live system and were UNTOUCHED. Only the journey's
  goals/milestones (state/goals.ts) were removed. `drawer-shared.css` now backs the Knowledge drawer only.

## VERIFIED
- Board **91/91** green. knip: **no new dead code** (nothing orphaned). tsc + esbuild build clean.
- `render_probe_rail_sync` PASS (Knowledge + Search drawers + rail highlight, **0 page errors**).
- Live screenshot: rail is **Coverage · Regimen · Scanner · Search · Knowledge** — no Journey; board renders.

## LEFT INTENTIONALLY (NOT "legacy" — flag if you want them gone)
- The app `<title>` "Luneth's Health Journey" in dashboard.html — the app's NAME, not the feature.
- Sibling frozen `*-v3-PROPOSAL.html` mockups that incidentally show a J rail item — historical design
  artifacts, not loaded at runtime.
- `chronicle/creators-log` + `build-log` entries recording that Journey was once built — history, append-only.
- Wallach's word "journey" in the corpus books / OCR caches — his vocabulary.

## STILL PARKED / CARRIED FORWARD (unchanged)
- **HEADERS**: parked until everything else is done. Do not build.
- The **29 new corpus claims** (fatigue / seizures / eye) await Luneth's rulings; plus the small open
  corpus threads (IMMORT-000023 date, tag hygiene, 66 draft form/absorption claims, potassium dead-cite,
  germanium enrichment, HELLS-000029/064 dup). See the pre-removal handoff in git history for detail.

## STANDING WORKFLOW (unchanged)
Demos: `temporary/awaiting-refinement/` → `temporary/ready-to-be-ported/` → port live only with approval
+ STOP-for-sign-off. All repo writes via `safe_write`. Verify with your eyes (screenshot).
