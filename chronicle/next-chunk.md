# ★★★ NEXT SESSION — READ THIS FIRST.

**ACTIVE CAMPAIGN: the 452 ruled claims → Search.** Engine 1 (DDDL clean+dirty, 262 claims) is LIVE.
This session worked the 2 remaining engines AUTONOMOUSLY (Luneth out ~2h) and **STAGED both for his
ratify — nothing sealed** (a lost scratchpad forced a reconstruction; §00.A says sealing dose amounts
on fresh dispositions is his act). Board 92/92 green, corpus kv=473 UNCHANGED.

## ⚠ THE PRIOR SCRATCHPAD IS GONE — how the data was recovered
Prior session `0ce0c20f` (introduced-claims.json, finalize_raw/, enrich_src.json) is deleted
(scratchpads are session-scoped). BOTH remaining engines drew from it. RECOVERY SOURCE:
`temporary/claim-ruling-dashboard.html` embeds `const DATA = [...]` = all **907 ruled-claim candidates**
with full payloads (claim_text, verbatim, question, answer_short, recommend, verdict). Fidelity proven:
190 already-sealed claims match DATA byte-for-byte. **Lesson: campaign data is committed to chronicle/
now — never leave it only in scratchpad.** See [[ruling-dashboard-is-recovery-source]].

## ENGINE 1 — DDDL dose audit → STAGED (ratify-and-seal ready) · `chronicle/dose-audit-2026-08-18/`
- 24 DDDL dose candidates recovered (recommend=introduce). **All 24 verbatims byte-exact in DDDL source,
  ZERO fabricated.** Luneth's exact 22-of-24 ruling unrecoverable, but the dose-conflict audit
  independently HELDS 2 → lands at 22 (matches the handoff count).
- **2 HELD dose conflicts** (his “favor newest, but prove it” call — both proven by reading both books):
  - `#347` folic acid/gout: DDDL(2011) **20-50 mg/day** vs `LETS-000288`(1995) 10-75 mg/day
  - `#550` vitamin E/cataracts: DDDL(2011) **2,000 IU/day** vs `LETS-000207`(1995) 400 IU/day
  Both values ALREADY coexist in the sealed corpus (protocol claims) — pre-existing divergence, not new.
- **22 clean** staged: `finalize-raw-22.json` (every verbatim snap-validated via corpus_extract),
  `enrichment-22.json` (recovered Q+A + proposed subject/facet/topics), `AUDIT-REPORT.md` (24 in review
  form + the seal plan), `recovered-24-dose-audit.json` (provenance).
- **SEAL PLAN (his ~2-min confirm):** `corpus_extract finalize --book dddl-3e-2011 --raw
  chronicle/dose-audit-2026-08-18/finalize-raw-22.json` → prove draft offsets clean → merge enrichment
  positionally (raw order; verbatim-match COLLIDES on shared spans) → `corpus_seal`+`catalog_seal`
  (USER) → `search_index_derive`+`build.mjs` → on-screen count +22 → keep-both allowlist the
  same-span pairs. Open dispositions listed in AUDIT-REPORT.md (dose:null, #657 reconcile-as-question,
  #325 EFA mapping).

## ENGINE 2 — vision-verify unverified-book ruled claims → PILOT + STAGED · `chronicle/frontface-ocr/ruled-2026-08-18/`
- Target: **70 SEALED unverified ruled claims** (epig 16, immort 45, hells 3, lets 3, rare 3). NEW
  (sealed 2026-08-18) → absent from the 2026-08-02 worklist; correctly blocked by
  `enriched_book_is_verified`. Worklist: `engine2_70_worklist.json`.
- Corroboration (PDF text-layer, 9 claims): 6 agree, 3 diverge. **Vision-verified 2 diverging ones
  against the page image** (`LETS-000523` p105, `LETS-000524` p71/render83) = **CLEAN** — the
  “offood”/“ofan” divergences were PDF-text-layer extraction artifacts; ours matches the page.
  `RARE-000403`: coverage 0.19 = mislocation, neighbour-search needed.
- **HOLD FRONT-FACE** (his instruction): did NOT touch `verified.json` / `enriched_book_is_verified`.
- NEXT: corroborate+vision-read the 61 epig/immort (dual-monitor Screenshot crops, x≈0.028-0.48, retry
  adjacent frame) + the RARE neighbour; fix/resnap real defects; **then Luneth** moves clean ids into
  `verified.json::claims_verified`. The 92 unsealed unverified claims recover from the ruling dashboard,
  seal with the dose tranche, then verify.

## GENESIS
`genesis` → run genesis.py, report the board, then resume: **Engine 1 seal (his confirm)** or **Engine 2
full vision sweep**. If a new invariant red appears, that is the only response.
