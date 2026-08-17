# ★★★ NEXT SESSION — READ THIS FIRST.

**BIG TWEAK LIST — in progress.** Authority: **`chronicle/tweak-list-master-2026-08-15.md`**.
Board **91/91.** eden/ untouched — no seal applied. Session closed 2026-08-16 (evening).

## ▶ START HERE — the next two unbuilt items
- **#7 "two result boxes" → REDESIGN** (his 2026-08-16 call): the verdict card's two stat tiles → a full-width "N of 90" hero — **REDESIGN, not delete**. **Mockup-first: 4 genuinely-distinct mockups, his pick/mix, THEN build live + sign-off.** Visual/design work — read the `design-language` + `visual-verification` skills first; a DOM probe is not a visual check.
- **#9 goal-picker/veil**: veil everywhere · veil close × · hide "I'm just browsing" for an existing profile · close orange→green · **A-sweep** `.ui-close` onto every remaining × (goal chips, veil, knowledge drawers) · dead-CSS verify (`.rl-dose*`/`.ck-addcard*`/`.ck-scan*` vs the `938a407c` purge).

**Pick one with an AskUserQuestion — do NOT assume which.**

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
