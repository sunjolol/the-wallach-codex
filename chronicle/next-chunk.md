# ★★★ NEXT SESSION — READ THIS FIRST.

**CAMPAIGN: the 452 ruled claims → Search.** Engine 1 (all DDDL work) is **DONE + LIVE**. Engine 2
(vision-verify the unverified books) is the remaining engine. Board 92/92 green, corpus **kv=475**.

## ✅ ENGINE 1 — DDDL dose audit: SEALED + LIVE (kv 473→475)
All 24 recovered DDDL dose claims are sealed, enriched, and searchable. search-index **2402→2426 (+24)**.
Ids `WAL-CLM-DDDL-000582..000605`. Staged record: `chronicle/dose-audit-2026-08-18/` (finalize-raw,
enrichment, AUDIT-REPORT, sealed-idmap). Recovered from `temporary/claim-ruling-dashboard.html` after
the prior scratchpad `0ce0c20f` was lost — see [[ruling-dashboard-is-recovery-source]].
- **22 clean** sealed (kv=474). **19 carry dose pills** (structured dose object → condition-labelled
  value, e.g. “cataracts / 250 mcg / daily”). **3 are dose:null**: fiber #509 (tbsp unit unsupported),
  vitE/fibroids #624 (source prints “i.u.” dotted — the IU token won’t match), EFA #325 (reclassified
  **kind=protocol**: a collective EFA dose can’t be a 2nd essential-fatty-acids singleton; keeps
  [omega-3,omega-6]). See [[condition-dose-claim-sealing-gotchas]].
- **2 conflicts** sealed (kv=475), favor-newest DDDL, LETS protocols kept intact:
  `604` folic/gout **20-50 mg/day** (vs LETS-000288 10-75), `605` vitE/cataracts **2,000 IU/day**
  (vs LETS-000207 400). Older figures stay only inside the faithful LETS protocol prose.
- **3 keep-both pairs** (lecithin/psoriasis, fiber/constipation, lecithin/gallstones) — lecithin &
  dietary-fiber aren’t registered search subjects, so those facets route on the condition and collide
  with the condition-protocol claim on the same span. Allowlisted in `_DUPLICATE_KEEP_BOTH` + pinned in
  `test_no_duplicate_claims.py` (71→74).

## ⏳ ENGINE 2 — vision-verify unverified-book ruled claims (PILOT done, sweep remains)
`chronicle/frontface-ocr/ruled-2026-08-18/`. Target: **70 sealed unverified ruled claims** (epig 16,
immort 45, hells 3, lets 3, rare 3), blocked from front-facing by `enriched_book_is_verified`.
- Done: 70-claim worklist; corroborated the 9 PDF-book claims; **vision-verified 2** (LETS-000523 p105,
  LETS-000524 p71) = CLEAN (the divergences were PDF text-layer artifacts). RARE-000403 = mislocation
  (cov 0.19), neighbour-search needed.
- **HOLD front-face** (Luneth’s standing instruction): do NOT move ids into
  `verified.json::claims_verified` without his sign-off.
- NEXT: corroborate + vision-read the 61 epig/immort (dual-monitor Screenshot crops, x≈0.028-0.48) +
  the RARE neighbour; fix/resnap real defects; then Luneth moves clean ids into claims_verified.
- The 92 unsealed unverified ruled claims recover from the ruling dashboard, seal, then verify.

## GENESIS
`genesis` → run genesis.py, report the board, then resume **Engine 2** (vision sweep) unless redirected.
If a new invariant red appears, that is the only response.
