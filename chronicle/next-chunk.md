# ★★★ NEXT SESSION — READ THIS FIRST.

The **live port is DONE and committed.** The Scanner (Scan · Confirm · Result) and Regimen (Cockpit +
save-slot switcher) tabs are ported into the real app on real data + the real engine, reconciled to
Luneth's newest demos (**scanner r4 / regimen v7**), screenshot-reviewed and signed off by Luneth on
2026-08-13. Board 91/91; all scanner + regimen render probes green. Nothing below needs re-derivation.

## WHAT SHIPPED (this port)
- **Scanner → `views/scanner.ts`** on the real engine (`state/scanner.ts` + `state/ocr.ts`):
  Scan → Confirm → Result. The in-content `.vd-flow` "1 2 3" stepper is gone — the flow line lives in
  the topbar. Confirm hero: editable OCR rows, top-4 suggestion chips (nutrients AND ingredients),
  gluten/seed-oil Wallach flags, and the `.vd-cf__ref` "Your uploaded photo" card showing the user's
  REAL image. Verdict fires only after Confirm. Adopt lands `provenance:'user_scanned'`.
- **Regimen → `views/regimen.ts`** on real slot state (`rgSlots_v1`): Cockpit + save-slot switcher
  (active / faded-saved .39 / dashed-empty, 14-swatch user colour, pencil rename, trash visible EXCEPT
  on the last slot per Luneth — matches the engine's delete-refusal guard), gauge/category/90-readout,
  per-slot goals, product recs. Add-field is the real `.ck-addfield` pill (＋ / input / "/" focus).
- **Shell (`main.ts` + `dashboard.html`)**: topbar name/deck switch per workspace (`WORKSPACE_HEADERS`);
  a `wallach:navigate` listener wires the cross-tab jump buttons that were dead.
- **Coverage engine (`state/coverage.ts`)**: `recompute()` byCategory now excludes `NON_ESSENTIAL_NAMES`
  (omega-9), so Fatty acids reads **/2** and the four category totals sum to 90 (was /3 → 91).
- **Regimen "Best next moves"** redesigned for the live surface (real long product names): wider 2-up
  cards, name on top / meta pinned to the bottom, `+` parked in the corner — scoped to `.ck-recgrid`,
  Coverage's `.rec` untouched. Active-stack panel fills its column (`align-self: stretch`, was
  `start` → hugged empty content at 334 vs 380).
- **Render probes** updated to the new scanner architecture: `render_probe_scanner` asserts the `.vd`
  idle shell + **NO `.vd-flow`** (regression guard); `render_probe_scan` drops the stale lcScan→view
  coupling check; `render_probe_adopt` fires the §31 `saveRgManual(user_scanned)` cascade via the
  engine bridge (the new view's adopt is only reachable through the real upload→OCR→confirm flow a
  headless probe can't drive).

## DEFERRED (agreed with Luneth — follow-ups, not blockers)
- **Engine-backed Confirm/Result richness**: the demo's Confirm proprietary-blend row + oxide-form
  warning (`.vd-nrow.is-unknown` + `.vd-nrow__sub`), and the Result "trace-mineral tiles closed" stat
  tile. These need NEW engine metrics (detect a proprietary blend / a poorly-absorbed oxide form /
  count closed trace-mineral tiles), not styling. The CSS hooks already exist in workspace-scanner.css.
- **Swatch colour-name aria-labels**: the 14 slot swatches announce their hex, not "Red/Coral/…". A
  >10-item name map can't live in a view (the `views_state_no_inline_data` gate), so the names must go
  into `assets/data/slot-colours-data.json` (+ MANIFEST re-registration), read like `SLOT_COLOURS`.
- **Kept honest, NOT matched to the demo (by design, §00.A)**: the Confirm unrecognized-row badge says
  "not recognized" (demo: "low confidence" — implies a confidence score we don't compute) and the count
  line says "N mapped · N to check" (demo: "1 unreadable" — a category the live doesn't have).

## STILL PARKED / CARRIED FORWARD
- **HEADERS**: parked until everything else is done. Do not build.
- **The 29 new corpus claims** (chronic fatigue / seizures / eye) await Luneth's rulings in the
  claim-ruling dashboard (session 603b1e2d scratchpad) — not started as a corpus write. Plus the small
  open corpus threads (`WAL-CLM-IMMORT-000023` pre-WWI→WWII, tag hygiene, the 66 draft form/absorption
  claims, potassium dead-cite repoint, germanium enrichment, `HELLS-000029/064` dup).
- A stray **`NUL`** file (Windows reserved-name junk) has sat untracked in the repo root since before
  this session; left out of the port commit. Safe to remove with a `\\?\`-prefixed delete.

## STANDING WORKFLOW (unchanged)
Demos: `temporary/awaiting-refinement/` → `temporary/ready-to-be-ported/` → port live only with
approval + STOP-for-sign-off. All repo writes via `safe_write`. Verify with your eyes (screenshot).
- Screenshot a demo: `NODE_PATH="<repo>/node_modules" node temporary/regimen-build/rg-shot.js <file.html>`.
- Screenshot the LIVE app at a tab: seed a returning-user profile to skip the arrival veil
  (`wallachUserProfile_v1 = {name,browsing:false,chosenAt}`), click `.rail__item[data-rail-nav="<tab>"]`,
  size the viewport to `#workspace-<tab>-mount`'s scrollHeight (the shell scrolls internally).
