# ★★★ NEXT SESSION — READ THIS FIRST.

## THE MASTER LIST lives in `chronicle/qol-audit-2026-08-14.md`. Read it before anything.
That ledger is the single source of truth for the QOL/UX final-ship pass: 5 LOCKED decisions, 23 items
DONE (verified), and **30 remaining — each with its disposition already decided**. Execute them; do not
re-decide. Do not lose a single one.

## ⚠ SCANNER — Luneth flagged SEVERAL issues on the shipped redesign. Address these FIRST.
The scanner redesign shipped and is functionally verified (5 probes PASS), but Luneth reviewed it and said
there are **several issues** (layout AND flow — the Confirm step now shares the left column with the new
persistent Recent+Saved rail, and more he'll enumerate). **Get his specific list at the top of the session,
then fix** — do NOT assume it's just the cramped Confirm column. This is a QOL/visual pass he is owed on
his #1 named feature. (Also still open: SCAN-08, the Confirm live "N to check" count refresh — deferred minor.)

## WHAT THIS PASS IS
Luneth ordered the final pre-ship QOL/UX sweep: *"find every last QOL / user-experience / logic-loop /
dead-end failure and fix it."* A 13-finder adversarially-verified audit found 50 issues; his 3 named ones
fold in. Round 1 shipped 23 (board 91/91 throughout, committed 46eaf77f); the rest are queued in the ledger.

## JUST SHIPPED — ROUND 1 (on master, committed + pushed; verified build+tsc+eslint-vs-HEAD+probes+board 91/91)
- **Coverage recommender (COV-01)** — a fresh empty-regimen user was told "everything covered" (a
  case-mismatch killed the no-goal recommender). Fixed + GATED (the coverage probe now runs the no-goal
  branch). Plus COV-02.
- **The 3 named:** NAMED-2 regimen squares (grouped + hover) and NAMED-3 avatar (Upload-first) — **Luneth
  confirmed both look right**. NAMED-1 = the scanner cluster (see the ⚠ above — several issues remain).
- **Scanner redesign:** persistent Recent+Saved rail in every state (saved items survive refresh),
  clickable re-openable rows, real "Save for later", editable name (humanizeName), neutral "couldn't read"
  vs a false REJECT, + SCAN-03/06/07.
- **Logic sweep:** ASK-01/03, PROD-01/02, NAV-04, NAV-02, KNOW-02/05/06, REG-07, PROF-02.
- **Correction:** the Creator's Log was never broken — render_probe_profile.js was stale after the console
  class-rename; fixed; validates 843 embedded entries.

## NEXT — order (details + LOCKED dispositions IN the ledger)
0. **Scanner: get Luneth's list of the several issues, then fix** (his #1; visual/QOL pass owed). Then:
1. Regimen undo/correctness (REG-01, REG-03 ×2 sites, REG-02, REG-08, then REG-09 — §31 gate, careful).
2. Profile (PROF-04/07 clear, PROF-01/03 confirms, PROF-05/06/08/09).
3. Goal-picker/veil (NAV-01 + NAV-06 + NAV-05 together — shared veil system; decided: veil everywhere + cancel).
4. Fake-controls (NAV-03, KNOW-03, ASK-02 — decided: wire them).
5. Copy/nav cleanup (REG-04/05/06/10/11, COV-03, KNOW-01/04, ASK-04, FOOD-01, SCAN-08).
6. Final board + all probes + Luneth's visual pass.

## CADENCE (Luneth set it this pass)
**Auto on logic, stop for visuals.** Plow through pure-logic / gate-verifiable clear-fixes in surface
batches, reporting each board result; STOP for his eyes on anything visual/taste. The in-app file://
preview is a STATIC snapshot (no live clicks) — his refresh is the visual sign-off.

## STANDING / PARKED (do NOT raise unprompted)
- **Online plan:** Cloudflare + local-GitHub-download; keep new work on BOTH file:// and http, no flag.
- **CORPUS SEAL — held:** `eden/corpus/drafts/` has 7 UNREVIEWED draft books. eden/ was untouched this
  pass. corpus_seal is a dedicated per-claim review session, never a byproduct. Nothing to seal now.
- 29 corpus claims (fatigue/seizures/eye) + small corpus threads still await rulings.
- HEADERS: parked. Do not build.
- **Pre-existing eslint debt** (main.ts 6/search.ts 2/entity-page.ts 18/knowledge.ts 1) — NOT from this
  pass (verified vs HEAD); a separate hand-fix cleanup (`eslint --fix` is banned).

## STANDING WORKFLOW
All repo writes via `safe_write`. Small batches, build+board each. Verify with your eyes (his refresh).
Cream default.
