# ★★★ NEXT SESSION — READ THIS FIRST.

**BIG TWEAK LIST — in progress.** Authority: **`chronicle/tweak-list-master-2026-08-15.md`**.
Board **91/91.** eden/ untouched — no seal applied. Session closed 2026-08-16 (evening).

## ▶ START HERE — the next unbuilt item (#7 SHIPPED — see below)
- **#9 goal-picker/veil**: veil everywhere · veil close × · hide "I'm just browsing" for an existing profile · close orange→green · **A-sweep** `.ui-close` onto every remaining × (goal chips, veil, knowledge drawers) · dead-CSS verify (`.rl-dose*`/`.ck-addcard*`/`.ck-scan*` vs the `938a407c` purge).

**#9 is the sole remaining START-HERE item — proceed, or ask via AskUserQuestion if he redirects.**

## ✅ DONE (this session, 2026-08-16 late) — committed + pushed to origin/master
- **Scanner result hero reframed → the ITEM's "hits N of 90" (Luneth, live).** The scan result's big number was regimen COVERAGE (full Wallach targets), which is ~always 0 for any real food/single supplement — only the whole Youngevity stack reaches full targets — so it read as a shill funnel. Now it's the item's **"hits N of 90"** = essentials it delivers **≥3% of the Wallach target** (per serving, uncapped; `HIT_THRESHOLD=0.03`; `hitsStrong` at `HIT_STRONG=0.10`). §00.A-clean: Wallach target only, and the ~52 undosed essentials are honest non-hits (e.g. phosphorus). Deck / gauge (green `.vd-cov-arc-hit`) / caption / facts ([N delivered strongly] + [flags]) all reframed; regimen coverage stays on the **Coverage tab**. Also fixed **Copper→"Pepper"** (`ocrFuzzyFix` now skips `known` nutrient labels; `dict.knownLower`). Pumpkin → "Worth adding · delivers 6 of your 90 · 2 delivered strongly · 0 flags". Board **91/91**. **Deferred (Luneth left open):** the /90 gauge reads a bit modest for a food (maybe a strengths-forward visual later); caption/deck/"delivered strongly" wording open to tuning.
- **#7 result verdict-card redesign → SHIPPED (concept B · "Gap Arc").** The card's `.vd-side` (`.vd-impact` delta + 90-dot field + a 4-tile `.vd-stats` grid) → one full-width **"N of 90" coverage hero**: covered count + "N still open" accent pill + a radial semicircle gauge whose big **unlit arc is the gap** (green=covered · accent tick=this scan · "N / of 90" at centre · "N gaps remain" caption) + 2 fact tiles. Mockup-first: 4 genuinely-distinct concepts in `temporary/scanner-verdict-hero-demos.html`, Luneth first built + signed off A (Deficit Rail, commit 06c582e9), then re-ranked **B>D>A>C** after seeing them live and picked **B** — the live hero. Dead code severed: `deltaField`, `.vd-impact/.vd-delta/.vd-field/.vd-lg/.vd-stats/.vd-stat` + `@keyframes vd-ignite` (replaced by a self-contained `.vd-cov-*` block). Alignment **dropped** — `state/scanner.ts:654`: a scan never carries `form_alignment`, so "form not on a label" was always the only case. Board **91/91**. **Deferred (Luneth left open):** soften "+0"/"0 reach the 90" on zero-add scans · maybe drop the "+N reach the 90" fact (dupes the rail legend) · card-wide vs side-column width is a 1-step follow-up. → **NOTE (later same session): the hero's DATA was reframed from coverage to the item's "hits" (see the "hits N of 90" bullet above) — the gauge visual stays, but it now shows the item's meaningful hits, not regimen coverage.**

## ✅ DONE THIS SESSION (2026-08-16 eve) — all committed + pushed to origin/master
Scanner Confirm surface built end-to-end (S10–S18) + matcher/dict:
- **S10/S11/S12** thumbnail lightbox · per-row × delete · live "Possible OCR errors" (`bdd08e0e`).
- **Matcher/dict** plural tolerance (`pluralEq`) · +74 `fuzzyDict` words · nutrient-aware suggestions (`cd865b37`).
- **S15** live nutrient-row feedback (`reevaluateNutrientRow`, 150ms; cursor survives) · "Fat→Oat" mis-snap fixed · +7 panel labels → known (`63a8e6f9`).
- **S16** progress no-bounce on rotated labels (`inOrientationSweep` gates the OCR logger) · **S17** comma-segment parsing for horizontal panels (`35f75445`).
- **S18** WF-cheese ingredient block read — header line-anchored + headerless "run after the last %DV" heuristic; label-test-2 now flags modified/processed (`9313c2e1`).

## KNOWN CEILINGS (not bugs — do NOT "re-fix")
- **label-test-2 (WF cheese tub):** OCR mangles amounts (4.5g→450, mg→ng), minerals show only %DV (no absolute value), and the ingredient head garbles ("PATRRTED PROCESS"). The parser extracts what it can; the Confirm screen + live ✓ feedback are the correction path. Inherent to a small curved label.

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- Two deferred regimen findings (after the tweak list closes): `addVaultProduct` dedup dup; unstyled `.ck-undo`. `[[regimen-two-deferred-findings]]`.

## GOTCHAS
- **Per-file endings**: `state/ocr.ts`, `state/scanner.ts`, `views/scanner.ts`, `scanner-corpus-data.json`, `ocr-dict-data.json` are **CRLF**; chronicle .md are **LF**. `safe_write check` FIRST.
- **Drive the real app** headless (Puppeteer `--allow-file-access-from-files`; seed `localStorage.wallachUserProfile_v1={browsing:true,chosenAt}`; upload via `waitForFileChooser()` + `[data-sc-upload]`). Inspect OCR: `window.lcOcrToLabel(dataUrl)` → {label, rawText}; `window.lcParseLabel(rawText)` re-parses fast (no OCR). Recognition dict vs anti-list: `[[scanner-recognition-dict-architecture]]`.

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then **ask which task to resume (#7 or #9) via AskUserQuestion** — never assume, never a flair-only boot. If a new invariant red appears, that is the only response. Reconcile against `chronicle/tweak-list-master-2026-08-15.md`, never assume.
