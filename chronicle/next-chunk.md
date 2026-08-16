# ★★★ NEXT SESSION — READ THIS FIRST.

**BIG TWEAK LIST — in progress (2026-08-16).** The full original away-time list is reconstructed and
reconciled item-by-item in **`chronicle/tweak-list-master-2026-08-15.md` — that file is the
authority**; consult it, not memory, for what remains. Board **91/91 throughout.** eden/ untouched.

## ✅ COMMITTED THIS SESSION (2026-08-16) — all local, **NONE PUSHED** (public GitHub; Luneth's OK pending)
- `add14a5b` **① rotation OCR** — offline brute-force 4-way orientation in `state/ocr.ts` (no OSD
  model; offline-first). Sideways/upside-down labels now scan. e2e + screenshot signed off.
- `fd424c6d` **②a parser (PSM 3)** — `tessedit_pageseg_mode 6→3` (auto layout). Two-column labels no
  longer truncate ingredients; Rudi's now correctly REJECTs (modified + canola); cheese false-"wheat"
  reject gone. Signed off.
- `9da4b9df` **②c suspect-engine safety** — the Confirm "Possible OCR errors" panel never offers to
  "correct" a flagged bad term (modified/wheat/canola) or a known nutrient (calcium/iron). Signed off.
- (Earlier, before this session: `4087b16e` Phase-2 + scanner, `12be0627` regimen+rail — already on
  origin/master. The `4087b16e` "held work" the OLD handoff described was committed AND pushed at 03:34.)

## 🟢 SCANNER BATCH ② — where it stands
- **②b GF-logic** ✅ verified (gluten-free-oats not tricked; wheat still rejects regardless of GF claim).
- **②a parser** ✅ committed. **②c suspect safety** ✅ committed.
- **NEXT (Luneth flagged, his original-list S1):** a correctly-read KNOWN nutrient that is NOT one of
  the 90 essentials (Protein, Total Fat, Dietary Fiber, Total Carbohydrate) is still mislabeled
  **"NOT RECOGNIZED · PICK A MATCH OR EDIT"** in the Confirm nutrient rows. Fix = recognize a read
  known-nutrient as *recognized-but-not-tracked*, never an OCR error. (Root: the row marks "recognized"
  only when `matchEssential(name)` hits one of the 90; macronutrients aren't among them. See
  `views/scanner.ts` `nutrientRow` ~215.)
- **②d (the big one) — expand bad-ingredient list toward 200–300, ALL Wallach-sourced (§00.A).**
  Current list ≈40 terms / 7 cited categories (`dashboard/assets/data/scanner-corpus-data.json`,
  hand-authored, UNSEALED). Approach Luneth set: grow instances within the 7 cited categories first,
  book-search for more if short, each entry cites a Wallach book, **he ratifies**, NEVER pad with
  outside-knowledge additives (report the honest number if short). Load `corpus-mining` +
  `wallach-source-rule` skills first. In the SAME pass, expand the OCR ingredient dictionary
  (`ocr-dict-data.json`) so the cosmetic suspect over-flag (psyllium/vinegar/sourdough/cheese names)
  clears.

## ⬜ STILL UNBUILT from the list (need his live scan / are their own chunks)
- **S10** clickable thumbnail lightbox · **S11** per-row (X) delete + name-input −30% · **S12** live
  "Possible OCR errors" update. (Confirm-state QOL; recon trap on S11: delete must track a `removedRows`
  set / clear `data-nedit`, else `readCorrectedLabel` re-reads the stored label.)
- **#7 "two boxes in the results" → REDESIGN** (his call, 2026-08-16): the verdict card's two stat
  tiles (form-not-on-a-label + the +N box) → a full-width hero. **Mockup-first** (4 distinct).
- **#9 goal-picker/veil** (veil everywhere, veil close ×, hide "I'm just browsing" for an existing
  profile, close orange→green) · **A-sweep** `.ui-close` onto remaining × · dead-CSS verify.
- **WF cheese** still under-reads its ingredient block on a hard 180° label (graceful under-flag, not a
  false positive) — deeper OCR-quality edge.

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- `design-system.css` SEALED — surface tweaks override from the non-sealed theme.css layer.
- Two deferred regimen findings (raise only after the tweak list closes): `addVaultProduct` dedup
  duplication; unstyled `.ck-undo`. See memory `[[regimen-two-deferred-findings]]`.

## GOTCHAS THAT SAVE HOURS
- **Per-file line endings.** `state/ocr.ts`, `state/scanner.ts`, `views/scanner.ts`, the workspace CSS,
  `scanner-corpus-data.json` are **CRLF**; most chronicle .md + `main.ts`/`dashboard.html` are **LF**.
  `safe_write.py check <path>` FIRST; stage payloads with matching endings.
- **Multi-file edits** go through a temp Python script → `safe_write.py rewrite` per file (read
  `newline=''` to preserve endings). Scripts live in the session scratchpad.
- **Drive/screenshot the REAL app** with a headless-Puppeteer helper (launch with
  `--allow-file-access-from-files`; seed `localStorage.wallachUserProfile_v1={browsing:true,chosenAt}`
  to skip onboarding; upload via `page.waitForFileChooser()` + click `[data-sc-upload]`). The in-app
  Claude_Browser renders file:// as a STATIC snapshot.
- **`window.lcOcrToLabel` / `lcScanImage` / `lcParseLabel` / `lcScan`** are the headless OCR/verdict
  bridges. Rotated-label OCR ~10–20s; upright ~2–3s.
- The 4 scanner probes (`render_probe_ocr/scan/scanner/scanner_concurrency`) do NOT run real image OCR
  — validate OCR/parser changes with a direct e2e against the 3 labels in `temporary/scanner-tests/`.

## GENESIS
Luneth types `genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, ask which task to resume.
If he continues the tweak list: pick up the Protein/known-nutrient fix, then ②d — reconcile against
`chronicle/tweak-list-master-2026-08-15.md`, never assume.
