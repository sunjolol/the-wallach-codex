# ★★★ NEXT SESSION — READ THIS FIRST.

## THE MASTER LIST lives in `chronicle/qol-audit-2026-08-14.md`. Read it before anything.
That ledger is the single source of truth for the QOL/UX final-ship pass: 5 LOCKED decisions, 23 items
DONE (verified), and **30 remaining — each with its disposition already decided**. The next session
EXECUTES the remaining 30; it does not re-decide. Do not lose a single one.

## WHAT THIS PASS IS
Luneth ordered the final pre-ship QOL/UX sweep: *"find every last QOL / user-experience / logic-loop /
dead-end failure and fix it."* A 13-finder adversarially-verified audit found 50 issues; his 3 named ones
fold in. This round shipped 23 (board 91/91 throughout); the rest are queued in the ledger with order.

## JUST SHIPPED THIS ROUND (on master, all verified: build + tsc + eslint-vs-HEAD + probes + board 91/91)
- **Coverage recommender bug (COV-01)** — a fresh empty-regimen user was told "everything covered" (a
  case-mismatch killed the no-goal recommender). Fixed in coverage + regimen; **now gated** (the coverage
  probe runs the no-goal branch, which is why it shipped broken before). Plus COV-02.
- **The 3 named issues:** NAMED-2 regimen readout squares (grouped green→gap→beige + per-element hover) and
  NAMED-3 avatar (Upload-first) — **Luneth confirmed both look right**. NAMED-1 = the scanner cluster below.
- **Scanner redesign (his #1)** — persistent **Recent + Saved** rail visible in every state (saved items
  survive a refresh), clickable rows re-open a verdict, "Save for later" actually persists, editable
  product name (`humanizeName`, no more `aluminum_can`), neutral "couldn't read" state instead of a false
  REJECT, + SCAN-03/06/07 fixes. **NEEDS LUNETH'S EYES on layout** — the Confirm step now shares the left
  column with the rail; verify it isn't cramped, then tune the grid if needed. (SCAN-08 count-refresh
  deferred.)
- **Logic sweep:** ASK-01/03, PROD-01/02, NAV-04, NAV-02, KNOW-02/05/06, REG-07, PROF-02.
- **Correction:** the Creator's Log was never broken — `render_probe_profile.js` was stale after the
  console rebuild (class renames). Fixed the probe; it validates 843 embedded entries render.

## NEXT — work the ledger in this order (details + dispositions IN the ledger)
1. Regimen correctness/undo (REG-01, REG-03 ×2 sites, REG-02, REG-08, then REG-09 — §31 gate, careful).
2. Profile (PROF-04/07 clear, PROF-01/03 confirms, PROF-05/06/08/09).
3. Goal-picker/veil (NAV-01 + NAV-06 + NAV-05 together — shared veil system; decided: veil everywhere + cancel).
4. Fake-controls (NAV-03, KNOW-03, ASK-02 — decided: wire them).
5. Copy/nav cleanup (REG-04/05/06/10/11, COV-03, KNOW-01/04, ASK-04, FOOD-01, SCAN-08).
6. Final board + all probes + Luneth's scanner-layout pass.

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
- **Pre-existing eslint debt** (main.ts/search.ts/entity-page.ts=18/knowledge.ts=1) — NOT from this pass
  (verified vs HEAD); a separate hand-fix cleanup (`eslint --fix` is banned).

## STANDING WORKFLOW
All repo writes via `safe_write`. Small batches, build+board each. Verify with your eyes (his refresh).
Cream default.
