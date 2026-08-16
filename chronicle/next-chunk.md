# ★★★ NEXT SESSION — READ THIS FIRST.

**BIG TWEAK LIST — in progress (2026-08-15).** Luneth handed over a large away-time tweak list; this
session executed most of it. He was present intermittently (a mid-session computer shutdown; work
survived intact on disk). Board **91/91 throughout.** eden/ untouched — no seal applied.

## ✅ COMMITTED
- `12be0627` **regimen+rail (tweak #1)** — micro-label legibility bump (0.6→0.7rem/700), copy
  (`Your Goals`, new deck), and working bare **1/2/3** rail hotkeys (the dead ⌘1/2/3 replaced).
  Round-closed (build-log + Creator's Log). **Push DEFERRED** (public GitHub; his review pending).

## 🟡 HELD FOR SIGN-OFF — built + verified, UNCOMMITTED (per "commit mechanical, hold visual")
All in the working tree (18 files ` M`); board 91/91; each screenshot-verified where reachable.
1. **Dark theme** (theme.css): search close-hover→dark, search-popup glow→dark, scanner pills→
   translucent color-mix tints, coverage grid removed in dark, covered tiles→dark-green plate.
2. **Shadows-follow-primary** (theme.css + 6 non-sealed CSS): `--ds-glow-accent[-sm]` redefined off
   `--ds-accent`; ~20 hardcoded ember `rgba(255,126,60)`/`(200,85,42)` literals → accent color-mix.
   Proven with amethyst (purple button now has a purple glow).
3. **Coverage-square fast tooltip**: generalized `gloss-tooltip.ts` to also serve `[data-tip]`; the
   90 readout cells now use the instant `.gloss-tip` box instead of the slow native `title`.
4. **Add-to-regimen + flash** (knowledge-products.ts / knowledge.ts / regimen.ts): button below
   `‹ All products`, colored by supplement-type `--form`; add via `vaultEntry`+`addOrBumpRegimenItem`
   → navigate to Regimen → the row flashes (`.rr-row--flash`, keyed by new `data-rr-name`). NOTE the
   add button uses **`data-add-product`** (not `data-kd-product`) so the product-nav branch skips it.
5. **Import / Export per slot** (new `importSlot` state op + `SlotExportEnvelopeSchema`): export icon
   on filled slots, import on empty (empty tile restructured div+2 buttons). Import is **bulletproof**
   — probe proved: no `__proto__` pollution, provenance forced to `user_manual`, unknown label keys
   stripped, overrides remapped, bogus colour replaced, items capped 500, foreign/invalid/at-max
   refused. Envelope reuses `BACKUP_APP_ID`.
6. **Scanner** (demo-first bucket — his selection):
   - Engine: **gluten (wheat/barley/rye/malt/spelt) → hardRejectTerms** = unconditional REJECT (fixes
     the Tangy-Tangerine-with-wheat SAVE bug); oats stay serious + keep the GF-shutoff. **did-you-mean**
     self-suggestion fixed (ocr.ts findNutrientCandidates early-return + scorer self-skip).
     **neutral-default** (decideVerdict terminal REJECT→SAVE) so "nothing bad" reads NEUTRAL.
     **`modified / processed`** antiList category added, severity **SERIOUS — LUNETH-RATIFIED** this
     session (no direct Wallach "modified" claim; basis is his anti-processed/refined stance, cited in
     the note). Verified via verdict_test: wheat→REJECT, Rudi's(modified+canola)→REJECT, GF-oats→ADD,
     water→NEUTRAL.
   - Copy: new intro deck, **WORTH IT → NEUTRAL** (tier chip), removed 3 redundant strings, hero-step
     **close box** (reuses `data-sc-clear`).
   - **Paste-ingredients checker** (the centerpiece): idle-state textarea + `data-sc-paste-check` →
     builds `{ingredients, nutrients:[]}` → runScan → straight to a verdict. Single ingredient works;
     guidance copy steers foods→paste, supplements→image. Verified: wheat→REJECT, clean→NEUTRAL.
   - Typography bump: `.vd { --ds-text-micro: var(--ds-text-mini) }` + weight-700 on mono labels, tight
     grid inputs/pills held at 0.6rem. Verified idle+result; **confirm-state unverified** (see below).

## ⬜ REMAINING TWEAK-LIST ITEMS (not built — need his real-scan eyes or a file)
**⚠ LUNETH SAYS A LOT MORE REMAINS THAN LISTED HERE.** At session start, RE-READ his original
tweak-list message in full and reconcile item-by-item; do NOT assume this list is complete. One he
named explicitly: **remove "the two boxes from the results" he asked to remove — CLARIFY WHICH two**
(likely result stat tiles, e.g. FORM-NOT-ON-A-LABEL / NUTRIENTS-REACH-THE-90 — confirm with him).

The CONFIRM state (post-image-OCR) is **not reachable headlessly** (needs a real label image + OCR),
so these were NOT built blind — they want his live scan to verify:
- Scanner QOL: **clickable thumbnail lightbox**; **per-row (X) delete + name input −30%** (recon's
  CRITICAL gotcha: readCorrectedLabel falls back to the stored label, so delete must track a
  `removedRows` set or clear `data-nedit`, never just remove the node); **live "Possible OCR errors"
  update** (debounced input listener → refreshSuspects, and populate the `dismissed` set on idismiss).
- **Rotation OCR** (sideways/upside-down labels): Tesseract is pinned PSM-6, no OSD model. Needs
  vendoring `osd.traineddata` + a multi-orientation pass. His Rudi's example is transcribed as a
  fixture but final test needs the real image dropped in a folder.
- Copy nuances to confirm: the SAVE **headline** still says "Worth considering" (I changed only the
  chip per his exact "WORTH IT" ask); the paste **result reuses the scanned/confirmed step-chrome +
  `user-scanned` provenance**, slightly off for a typed paste.

## DEFERRED — raise ONLY AFTER the tweak list closes (his explicit timing instruction)
Two parked regimen findings (also in memory [[regimen-two-deferred-findings]]):
- **#1** `coverage.ts::addVaultProduct` still duplicates the add-or-bump dedup rule now in
  `state/regimen.ts::addOrBumpRegimenItem`. Behavior-identical if consolidated.
- **#2** `.ck-undo` / `.ck-undo__btn` have ZERO CSS (now only the `showToast` refusal text).

## STANDING / PARKED (do NOT raise unprompted)
- **CORPUS SEAL held.** eden/ untouched; 7 unreviewed draft books in `eden/corpus/drafts/`.
- `design-system.css` SEALED — every tweak above overrides it from the NON-sealed theme.css layer.
- Rest of §1 after the tweak list: C (#9 goal-picker/veil) → D (#7 result redesign) → A-sweep
  (`.ui-close` onto remaining ×). Then the §6 QOL remainder. Ledgers: `chronicle/ux-pass-2026-08-15.md`,
  `scanner-review-r2.md`, `qol-audit-2026-08-14.md`.

## GOTCHAS THAT SAVE HOURS
- **Per-file line endings.** `state/regimen.ts`, `views/regimen.ts`, `core/schemas/regimen.ts`,
  `main.ts`, `dashboard.html` are **LF**; `views/scanner.ts`, `state/scanner.ts`, `state/ocr.ts`,
  `gloss-tooltip.ts`, `scanner-corpus-data.json`, and the workspace CSS are **CRLF**. `check` FIRST.
- Multi-file edits went through a temp Python script → `safe_write.safe_rewrite` (read `newline=''`
  to preserve endings). Scripts are in the session scratchpad.
- Drive/screenshot the REAL app with the headless Puppeteer helper (`scratchpad/shot.js`, dismisses
  onboarding); the in-app Claude_Browser renders file:// as a STATIC snapshot.
- Scanner verdict data is `dashboard/assets/data/scanner-corpus-data.json` (hand-authored, unsealed).
  `hardRejectTerms`→REJECT, `seriousAnti` (a category)→needs 2 to reject, GF-oats shutoff in code.

## GENESIS
Luneth types `genesis` → run `PYTHONUTF8=1 python tools/genesis.py`, report, then ask which task to
resume. If he opens with the tweak list still going, pick up the REMAINING items above (or commit the
HELD work once he signs off).
