# ★★★ NEXT SESSION — READ THIS FIRST.

**BIG TWEAK LIST — in progress (2026-08-16).** Authority: **`chronicle/tweak-list-master-2026-08-15.md`**.
Board **91/91 throughout.** eden/ untouched — no seal applied.

## ✅ COMMITTED THIS SESSION (2026-08-16) — 1–7 on origin/master; 8 local, PUSH PENDING
1. `add14a5b` **① rotation OCR** — offline 4-way orientation (no OSD model).
2. `fd424c6d` **②a parser PSM 3** — two-column labels read full ingredients.
3. `9da4b9df` **②c suspect-safety** — Confirm never "corrects" a flagged bad term / known nutrient.
4. `2b593902` **②e known-nutrient recognition** — Protein etc. read "recognized·untracked".
5. `0bb16a99` **②d.1 OCR dictionary +176 words** — real food words stop being flagged.
6. `c0c51530` **②d.2 mining batch 1** — +20 ratified bad terms (wheat-family hard-reject; hidden-glutamate/refined-flour serious).
7. `6a017381` **anti-list reconciliation** — sucralose REMOVED (Wallach accepts it, HK); 3 MSG terms DROPPED (zero book hits); push of 1–6.
8. `(this commit)` **②d.2 added-sugar batch** — 2-tier: HFCS/corn syrup/fructose hard-reject, ALL other sugars MINOR (category left seriousAnti); +6 terms (fructose/sucrose/molasses/brown sugar/turbinado/cane juice). Luneth "treat sugar lightly".

Earlier on origin/master: `4087b16e` (Phase 2 + scanner), `12be0627` (regimen+rail).

## 🟢 SCANNER ②d.2 — MINING PROGRESS (toward 200–300, §00.A: propose→ratify→add)
**DONE this session:** sucralose removed · 3 MSG terms dropped · **added-sugar 2-tier overhaul** (+6 terms; only HFCS/corn syrup/fructose reject; rest mild).
- **⚠ Aluminum = §00.A NO** (handoff premise was WRONG). Wallach: ingested aluminum is *"remarkably nontoxic / probably an essential nutrient / no Alzheimer's link"* (Epigenetics 2014, Immortality 2008, DDDL 2011); only 1995 Let's Play Doctor says avoid *metallic* aluminum (cookware/deodorant). Do NOT anti-list aluminum. Mineable instead as a two-sided Ask-Wallach corpus claim.
- **Other "new categories" are weak:** trans-fat ≈ redundant (`hydrogenated` already hard-reject; "0g trans fat" would false-flag); fluoride = water/toothpaste, not a food-label ingredient; aspartame-family/saccharin already listed + Wallach's own stance is soft ("used in moderation ... considered safe").
- **Strong veins still open — instance-expand the well-cited categories:** seed-oils (*"if it has oil in name don't use it"* — CAREFUL: fish/cod-liver/flax + high-oleic are Wallach-*endorsed*); gluten (unconditional). Sugar is DONE-light; honey/maple/agave still HELD for Luneth's call.
- **Severity mechanics** (state/scanner.ts antiFlags/decideVerdict, data-driven): a hit in `hardRejectTerms` → hard flag → REJECT on 1 hit; a category in `seriousAnti` → serious (2+ serious CATEGORIES → REJECT); else MILD (never rejects). One flag per category. Matcher = word-boundary `\bkw\b`; single distinctive words beat multi-word. **Use CORRECT label spellings, not Wallach's OCR typos** (turbinado ≠ turbanado).

## ⬜ STILL UNBUILT from the list (their own chunks / need his live scan)
- **S10** thumbnail lightbox · **S11** per-row (X) delete + name-input −30% · **S12** live "Possible OCR errors" update. (S11 trap: delete must track a `removedRows` set / clear `data-nedit`, else `readCorrectedLabel` re-reads the stored label.)
- **#7 "two result boxes" → REDESIGN** (his 2026-08-16 call): verdict card's 2 stat tiles → full-width hero. **Mockup-first** (4 distinct).
- **#9 goal-picker/veil** (veil everywhere, veil close ×, hide "I'm just browsing" for an existing profile, close orange→green) · **A-sweep** `.ui-close` onto remaining × · dead-CSS verify.
- **WF cheese** under-reads its ingredient block on a hard 180° label (graceful under-flag).

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- Two deferred regimen findings (only after the tweak list closes): `addVaultProduct` dedup dup; unstyled `.ck-undo`. Memory `[[regimen-two-deferred-findings]]`.

## GOTCHAS
- **Per-file endings**: `state/ocr.ts`, `state/scanner.ts`, `views/scanner.ts`, `scanner-corpus-data.json`, `ocr-dict-data.json` are **CRLF**; most chronicle .md + next-chunk are **LF**. `safe_write.py check` FIRST.
- **Multi-file / data edits** via a temp Python script → `safe_write` (JSON: mutate structure or exact-CRLF string replace; validate-all-then-write).
- **Drive/screenshot the real app** headless (Puppeteer, `--allow-file-access-from-files`; seed `localStorage.wallachUserProfile_v1={browsing:true,chosenAt}` to skip onboarding; upload via `waitForFileChooser()`+click `[data-sc-upload]`). Bridges: `lcOcrToLabel`/`lcScanImage`/`lcParseLabel`/`lcScan`.
- The 4 scanner probes do NOT run real image OCR — validate verdict changes via a `window.lcScan` scratchpad probe (see the added-sugar probe pattern) + e2e against the 3 labels in `temporary/scanner-tests/` (gitignored).

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, ask which task to resume. If he
continues: keep mining ②d.2 in ratified batches — strong veins are seed-oils + gluten (sugar/sucralose/
MSG/aluminum all settled). Reconcile against `chronicle/tweak-list-master-2026-08-15.md`, never assume.
