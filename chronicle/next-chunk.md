# ★★★ NEXT SESSION — READ THIS FIRST.

**BIG TWEAK LIST — in progress (2026-08-16).** Authority: **`chronicle/tweak-list-master-2026-08-15.md`**.
Board **91/91 throughout.** eden/ untouched — no seal applied.

## ✅ COMMITTED THIS SESSION (2026-08-16) — 1–12 on origin/master; 13 local, PUSH PENDING
1. `add14a5b` **① rotation OCR** — offline 4-way orientation (no OSD model).
2. `fd424c6d` **②a parser PSM 3** — two-column labels read full ingredients.
3. `9da4b9df` **②c suspect-safety** — Confirm never "corrects" a flagged bad term / known nutrient.
4. `2b593902` **②e known-nutrient recognition** — Protein etc. read "recognized·untracked".
5. `0bb16a99` **②d.1 OCR dictionary +176 words** — real food words stop being flagged.
6. `c0c51530` **②d.2 mining batch 1** — +20 ratified bad terms (wheat-family hard-reject; hidden-glutamate/refined-flour serious).
7. `6a017381` **anti-list reconciliation** — sucralose REMOVED (Wallach accepts it, HK); 3 MSG terms DROPPED (zero book hits); push of 1–6.
8. `ecaafa3e` **②d.2 added-sugar batch** — 2-tier: HFCS/corn syrup/fructose hard-reject, ALL other sugars MINOR (category left seriousAnti); +6 terms (fructose/sucrose/molasses/brown sugar/turbinado/cane juice). Luneth "treat sugar lightly".
9. `1231e4f6` **②d.2 gluten batch 2** — +7 hard-reject wheat instances (emmer/freekeh/panko/orzo/matzo/maida/atta); udon skipped (Wallach's buckwheat udon).
10. `(this commit)` **②d.2 seed-oil batch + BACK-CHECK** — +4 serious (margarine/peanut oil/palm oil/palm kernel oil); DROPPED grapeseed/rice bran/shortening (Wallach positive/silent); fixed the fried-oils citation (lecture line → book verbatim) AND restored the sugar-note 'Rare Earths 300% for 12 hours' citation I'd wrongly dropped.
11. `3cf167fd` **existing seed-oil audit** — doc-only: audited the pre-existing seed-oil terms with the grapeseed-test (all clean).
12. `91e64acd` **msg Wallach-only + NEW preservatives category** — msg 8→2; new preservatives/additives category (nitrite/nitrate/sulfite +plurals).
13. `(this commit)` **audit sweep** — artificial-sweeteners category DROPPED (aspartame/acesulfame/saccharin: Wallach 'considered safe in moderation'); modified/processed + caffeine audited CLEAN.

Earlier on origin/master: `4087b16e` (Phase 2 + scanner), `12be0627` (regimen+rail).

## 🟢 SCANNER ②d.2 — MINING PROGRESS (toward 200–300, §00.A: propose→ratify→add)
**DONE this session:** sucralose removed · 3 MSG terms dropped · **added-sugar 2-tier** (+6) · **gluten batch 2** (+7) · **seed-oil batch** (+4 serious: margarine/peanut oil/palm oil/palm kernel oil; DROPPED grapeseed/rice bran/shortening as Wallach-positive) · **session-wide BACK-CHECK** (all adds re-verified vs the grapeseed failure mode; sugar-note citation restored). Strong veins now EXPANDED.
- **⚠ Aluminum = §00.A NO** (handoff premise was WRONG). Wallach: ingested aluminum is *"remarkably nontoxic / probably an essential nutrient / no Alzheimer's link"* (Epigenetics 2014, Immortality 2008, DDDL 2011); only 1995 Let's Play Doctor says avoid *metallic* aluminum (cookware/deodorant). Do NOT anti-list aluminum. Mineable instead as a two-sided Ask-Wallach corpus claim.
- **Other "new categories" are weak:** trans-fat ≈ redundant (`hydrogenated` already hard-reject; "0g trans fat" would false-flag); fluoride = water/toothpaste, not a food-label ingredient; aspartame-family/saccharin already listed + Wallach's own stance is soft ("used in moderation ... considered safe").
- **②d.2 + ANTI-LIST AUDIT COMPLETE.** All 8 categories grapeseed-tested; the list was riddled with mainstream assumptions mislabeled as Wallach (grapeseed, oil lecture-line, hidden-MSG, glutamic acid, artificial sweeteners) — all corrected + traced to real verbatims. Final categories (7): fried-oils, added-sugar, gluten, msg (Wallach-only), modified/processed, caffeine, preservatives. Deferred: sulfur dioxide / metabisulfite micro-batch. LESSON (grapeseed): NEVER infer 'bad' from a general stance — grep each term for Wallach's ACTUAL words incl. any POSITIVE mention before adding. Remaining/optional: caffeine instances (nuanced — Wallach not anti-coffee-absolute); further msg/modified instances (diminishing). honey/maple/agave still HELD for Luneth's call. Existing seed-oil terms AUDITED clean (2026-08-16): vegetable oil/corn oil/hydrogenated Wallach-named; canola/rapeseed/soybean/sunflower/safflower/cottonseed oil = clean instances (none endorsed).
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
continues: ②d.2 is substantially complete (sugar/gluten/seed-oils/msg/modified expanded; sucralose/
aluminum settled). ②d.2 + FULL ANTI-LIST AUDIT DONE. Every category grapeseed-tested. Corrections: sucralose removed, 3 held-MSG dropped, aluminum blocked, sugar 2-tier, msg->Wallach-only (glutamic acid + hidden-MSG removed), artificial-sweeteners category DROPPED. Additions: gluten ×2, seed-oils, added-sugar, NEW preservatives category. Clean: modified/processed, caffeine. Deferred micro-batch: sulfur dioxide / metabisulfite (sulfite variants \bkw\b misses). Reconcile against `chronicle/tweak-list-master-2026-08-15.md`, never assume.
