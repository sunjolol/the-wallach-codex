# ★★★ NEXT SESSION — READ THIS FIRST.

**BIG TWEAK LIST — in progress (2026-08-16).** Authority: **`chronicle/tweak-list-master-2026-08-15.md`**.
Board **91/91 throughout.** eden/ untouched — no seal applied.

## ✅ THIS SESSION (2026-08-16, evening) — all committed + pushed to origin/master
- **S10/S11/S12** — thumbnail lightbox · per-row × delete · live "Possible OCR errors" (`bdd08e0e`).
- **Matcher/dict** — plural tolerance (`pluralEq`) · +74 `fuzzyDict` words · nutrient-aware ingredient suggestions (`cd865b37`).
- **S15 live nutrient-row feedback** — `reevaluateNutrientRow` on 150ms input (glyph flips live, cursor survives); **"Fat→Oat" mis-snap fixed** (fat/saturated/trans → fuzzy, so ocrPostProcess stops snapping "fat"→"oat"); **+7 panel labels → known** (Total Fat, Saturated Fat, Trans Fat, Cholesterol, Calories, Mono/Polyunsaturated Fat).
- **S16 progress no-bounce** — `inOrientationSweep` flag gates the Tesseract logger so the rotation sweep + final re-read run indeterminate (was 4–5× 0→100 resets).
- **S17 comma-segment parsing** — horizontal/linear panels parse (`units` = lines + comma-segments; '.' allowed in names; header-noise guard). Synthetic 10; label-test-2 (WF cheese) 2→4.

## ⬜ STILL UNBUILT (their own chunks / need his live scan)
- **#7 "two result boxes" → REDESIGN**: verdict card's 2 stat tiles → full-width hero. **Mockup-first (4 distinct).**
- **#9 goal-picker/veil** · A-sweep `.ui-close` onto remaining × · dead-CSS verify.
- **WF-cheese INGREDIENT block still under-reads** on this hard tub. S17 improved its NUTRIENTS (comma-parse), but the ingredient-block detection was NOT changed — Luneth scoped S17 to nutrients only. Root cause: the "INGREDIENTS:" header OCR-garbles ("REE PATRRTED...") so the extractor grabs the wrong block ("DISTRIBUTED BY..."). Open.
- **label-test-2 ceiling (not a bug):** OCR mangles amounts (4.5g→450, mg→ng) + %-DV-only minerals have no absolute value → those need Confirm correction (now with live check feedback). Inherent OCR limit on a small curved tub.

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- Two deferred regimen findings (after the tweak list closes): `addVaultProduct` dedup dup; unstyled `.ck-undo`. `[[regimen-two-deferred-findings]]`.

## GOTCHAS
- **Per-file endings**: `state/ocr.ts`, `state/scanner.ts`, `views/scanner.ts`, `scanner-corpus-data.json`, `ocr-dict-data.json` are **CRLF**; chronicle .md are **LF**. `safe_write check` FIRST.
- **Drive the real app** headless (Puppeteer `--allow-file-access-from-files`; seed `localStorage.wallachUserProfile_v1={browsing:true,chosenAt}`; upload via `waitForFileChooser()` + `[data-sc-upload]`). To inspect OCR: `window.lcOcrToLabel(dataUrl)` returns {label, rawText}; `window.lcParseLabel(rawText)` re-parses raw text fast (no OCR). Recognition dict vs anti-list: `[[scanner-recognition-dict-architecture]]`.

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, ask which task to resume. The scanner Confirm surface is now heavily built (S10–S17). Next unbuilt: **#7 two-result-boxes REDESIGN (mockup-first)**, **#9 goal-picker/veil**, **WF-cheese ingredient-block under-read**. Reconcile against `chronicle/tweak-list-master-2026-08-15.md`, never assume.
