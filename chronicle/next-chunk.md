# ★★★ NEXT SESSION — READ THIS FIRST.

**BIG TWEAK LIST — in progress (2026-08-16).** Authority: **`chronicle/tweak-list-master-2026-08-15.md`**.
Board **91/91 throughout.** eden/ untouched — no seal applied.

## ✅ THIS SESSION (2026-08-16, evening) — scanner Confirm-screen QOL + matcher/dict fix
- **S10/S11/S12** (Confirm-screen QOL) — SHIPPED + Luneth sign-off. Thumbnail/photo **lightbox** (full-size, verify OCR; `.pf-overlay` scrim, Esc/scrim/× via one AbortController, mounts to document.body); **per-row × delete** (`removedRows` Set so `readCorrectedLabel` can't re-read a deleted row; live DOM recount; name col 1.4fr→1fr); **live "Possible OCR errors"** (debounced 250ms `refreshSuspects`; dismiss records to `dismissed`). `views/scanner.ts` + `workspace-scanner.css` only — no state/core change.
- **Matcher + OCR-dict fix** (Luneth caught in review) — SHIPPED + sign-off. (a) **Plural tolerance**: `pluralEq` (exact trailing-'s' only, no unrelated collapse) in `isKnownNutrient` + `findNutrientCandidates` self-skip → "Total Sugar" ≡ "Total Sugars". (b) **74-word `fuzzyDict` batch** (chelate forms, vitamin chem names, excipients, probiotics, botanicals) — recognition vocabulary, NO Wallach claim; closed the correctly-spelled false-flag gap (silicon/titanium/taurine/glycinate…). (c) **`findSuggestionCandidates`** now scores fuzzy ∪ knownNutrientNames → a misspelled nutrient suggests the right nutrient (magnesuim→magnesium, not "minerals"). `state/ocr.ts` + `ocr-dict-data.json`.
- **NOTE (correction)**: correctly-spelled "magnesium" was NEVER actually flagged (it's in `known` → skipped in `findIngredientSuspects`); the review confusion was a deliberately-garbled demo word ("magnesuim"). anti-flag engine (`scoreLabel`) untouched — still fires canola/sorghum/modified.
- Commits: (a) `scanner: S10/S11/S12 ...`; (b) `scanner/ocr: plural + dict + suggestions`. **Push: HELD pending Luneth's OK — confirm before pushing.**

## ⬜ STILL UNBUILT from the list (their own chunks / need his live scan)
- **#7 "two result boxes" → REDESIGN** (his 2026-08-16 call): verdict card's 2 stat tiles → full-width hero. **Mockup-first (4 distinct).**
- **#9 goal-picker/veil** (veil everywhere, veil close ×, hide "I'm just browsing" for an existing profile, close orange→green) · **A-sweep** `.ui-close` onto remaining × · dead-CSS verify.
- **WF cheese** under-reads its ingredient block on a hard 180° label (graceful under-flag).
- (Scanner review-screen S-cluster S10/S11/S12 + matcher/dict fix are DONE.)

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- Two deferred regimen findings (only after the tweak list closes): `addVaultProduct` dedup dup; unstyled `.ck-undo`. Memory `[[regimen-two-deferred-findings]]`.

## GOTCHAS
- **Per-file endings**: `state/ocr.ts`, `state/scanner.ts`, `views/scanner.ts`, `scanner-corpus-data.json`, `ocr-dict-data.json` are **CRLF**; most chronicle .md + next-chunk are **LF**. `safe_write check` FIRST.
- **Drive/screenshot the real app** headless (Puppeteer, `--allow-file-access-from-files`; seed `localStorage.wallachUserProfile_v1={browsing:true,chosenAt}` to skip onboarding; upload via `waitForFileChooser()` + click `[data-sc-upload]`). To reach Confirm there is NO unit shortcut — do a real upload (e2e), then drive the ingredients textarea / rows through the DOM. The `.vd-flags` panel reflects the confirm-time label, not live textarea edits (expected).

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, ask which task to resume. Scanner S-cluster (S10/S11/S12) + matcher/dict fix DONE this session. Next unbuilt: **#7 two-result-boxes REDESIGN (mockup-first)**, **#9 goal-picker/veil**, **WF-cheese**. Reconcile against `chronicle/tweak-list-master-2026-08-15.md`, never assume.
