# ★★★ NEXT SESSION — READ THIS FIRST.

**BIG TWEAK LIST — in progress (2026-08-16).** The full original away-time list is reconstructed +
reconciled in **`chronicle/tweak-list-master-2026-08-15.md` — that file is the authority.** Board
**91/91 throughout.** eden/ untouched — no seal applied.

## ✅ COMMITTED + PUSHED THIS SESSION (2026-08-16) — now on origin/master (Luneth approved the push)
1. `add14a5b` **① rotation OCR** — offline brute-force 4-way orientation (no OSD model). Sideways/upside-down labels scan.
2. `fd424c6d` **②a parser PSM 3** — auto-layout; two-column labels read full ingredients (Rudi's REJECTs on modified+canola).
3. `9da4b9df` **②c suspect-safety** — Confirm "OCR errors" never offers to "correct" a flagged bad term or known nutrient.
4. `2b593902` **②e known-nutrient recognition** (orig-list S1) — Protein etc. read "recognized·untracked", not an error.
5. `0bb16a99` **②d.1 OCR dictionary +176 words** — real food words (sourdough/vinegar/cultured/mozzarella) stop being flagged.
6. `c0c51530` **②d.2 mining batch 1** — +20 Wallach-ratified bad terms (wheat-family grains hard-reject; hidden-glutamate + refined-flour serious); HARD_GLUTEN set refactored to data-driven.
7. `(this commit)` **anti-list reconciliation** — the 3 parked decisions cleared (see next section).

Earlier commits already on origin/master: `4087b16e` (Phase 2 + scanner), `12be0627` (regimen+rail).

## ✅ THE 3 PARKED DECISIONS — RESOLVED (Luneth 2026-08-16)
1. **Sucralose** — REMOVED from antiList['artificial sweeteners']. Wallach accepts it (Hell's Kitchen: 'Splenda
   (also known as Sucralose)... used in moderation ... considered safe', + it sweetens dozens of his own recipes;
   a sealed HK corpus claim exists). Flagging it violated §00.A. Array now aspartame/acesulfame/saccharin/neotame;
   antiListNotes updated to document the deliberate exclusion.
2. **3 held MSG terms** (textured vegetable protein / caseinate / torula yeast) — DROPPED. Deterministic grep,
   all 7 books: ZERO hits each (only bare 'casein', cited neutrally; Wallach speaks POSITIVELY of vegetable
   protein). Glutamate-bearing hydrolyzed forms already covered. antiListNotes['msg / glutamate'] HELD-line
   replaced with the reviewed-and-dropped record. Hold closed.
3. **Push** — DONE. All 6 + this reconciliation on origin/master.

## 🟢 SCANNER BATCH ②d.2 — MINING REMAINING (toward 200–300, §00.A: propose→ratify→add)
Approach: instance-expansion of the 7 already-cited categories (bulk) + new categories from book search.
- **Seed-oil instances** — CAREFUL: high-oleic variants are framework-adjacent, and fish/cod-liver/flax
  oils are Wallach-*endorsed* EFA sources — never blanket-add "oil".
- **Sugar instances** — Luneth's call on honey / maple / agave (Wallach nuance); stevia is Wallach-friendly (exclude).
- **NEW categories needing real book verbatims** (deterministic grep, not agent-extracted): aluminum
  additives (142 book hits), trans-fat (40), fluoride (64), aspartame-family (7), saccharin (5).
  Relevance filter: only substances that appear as INGREDIENTS on labels.
- Matcher is word-boundary `\bkw\b` (state/scanner.ts matchKeyword) — single distinctive words beat
  fragile multi-word phrases; a word inside another (buckwheat⊃wheat) does NOT match. hardRejectTerms =
  unconditional; a category in seriousAnti needs 2 hits to REJECT.

## ⬜ STILL UNBUILT from the list (their own chunks / need his live scan)
- **S10** clickable thumbnail lightbox · **S11** per-row (X) delete + name-input −30% · **S12** live
  "Possible OCR errors" update. (Confirm-state QOL; S11 trap: delete must track a `removedRows` set /
  clear `data-nedit`, else `readCorrectedLabel` re-reads the stored label.)
- **#7 "two result boxes" → REDESIGN** (his 2026-08-16 call): verdict card's 2 stat tiles → full-width
  hero. **Mockup-first** (4 distinct).
- **#9 goal-picker/veil** (veil everywhere, veil close ×, hide "I'm just browsing" for an existing
  profile, close orange→green) · **A-sweep** `.ui-close` onto remaining × · dead-CSS verify.
- **WF cheese** still under-reads its ingredient block on a hard 180° label (graceful under-flag).

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- Two deferred regimen findings (only after the tweak list closes): `addVaultProduct` dedup dup;
  unstyled `.ck-undo`. Memory `[[regimen-two-deferred-findings]]`.

## GOTCHAS
- **Per-file endings**: `state/ocr.ts`, `state/scanner.ts`, `views/scanner.ts`, `scanner-corpus-data.json`,
  `ocr-dict-data.json` are **CRLF**; most chronicle .md + next-chunk are **LF**. `safe_write.py check` FIRST.
- **Multi-file / data edits** via a temp Python script → `safe_write.py rewrite` (JSON: regen indent=2, replace \n→\r\n).
- **Drive/screenshot the real app** headless (Puppeteer, `--allow-file-access-from-files`; seed
  `localStorage.wallachUserProfile_v1={browsing:true,chosenAt}` to skip onboarding; upload via
  `waitForFileChooser()`+click `[data-sc-upload]`). Bridges: `lcOcrToLabel`/`lcScanImage`/`lcParseLabel`/`lcScan`.
- The 4 scanner probes do NOT run real image OCR — validate OCR/verdict changes by e2e against the 3
  labels in `temporary/scanner-tests/` (gitignored) + the scratchpad verdict tests.

## GENESIS
`genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, ask which task to resume. If he
continues: keep mining ②d.2 in ratified batches (the 3 awaiting decisions are RESOLVED 2026-08-16) —
reconcile against `chronicle/tweak-list-master-2026-08-15.md`, never assume.
