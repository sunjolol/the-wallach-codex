# ★★★ NEXT SESSION — READ THIS FIRST.

**NEXT TASK (Luneth’s call): ENRICH the 69 vision-verified unverified-book claims so they FRONT-FACE.**
Everything is staged. Board 92/92 green, corpus **kv=476**. Campaign: the 452 ruled claims → Search.

## ▶ START HERE — the enrichment worklist is committed
`chronicle/frontface-ocr/ruled-2026-08-18/enrich-worklist.json` — the 69 claims to front-face, each with:
`{id, book, kind, essentials, conditions, verbatim, recovered_question, recovered_answer_short,
proposed_subject, needs_new_topic, was_corrected}`.
- **69 verified** (already in `verified.json::claims_verified`, so the `enriched_book_is_verified` gate
  will ALLOW their enrichment).
- **61 questions recovered** from the ruling dashboard (8 need authoring — `recovered_question:null`).
- **41 subject-resolvable** (`proposed_subject` = a canon essential or registered condition — enrich
  these like the dose claims: subject/facet/question/answer_short/also_about/topics → merge
  search-enrichment → `search_index_derive` → `build_embeds` → `build.mjs`).
- **28 `needs_new_topic:true`** — no resolving subject → **NEW topic entities**, which is Luneth’s
  curation (the “53 new topics”). Author topic names/structure WITH him, register in search-entities
  (catalog_seal), then enrich.
- **Footguns** (proven this session): non-resolving subjects (lecithin/dietary-fiber route on the
  condition), keep-both dups (same-span/same-subject), the dose gates. See
  [[condition-dose-claim-sealing-gotchas]].

## ✅ DONE THIS CAMPAIGN
- **Engine 1 — DDDL dose audit: LIVE.** 24 dose claims (`582..605`), search 2402→2426, 19 pills, 2
  conflicts favor-newest, 3 keep-both. `chronicle/dose-audit-2026-08-18/`.
- **Engine 2 — vision sweep + corrections + verify.** All 70 page-read (12 agents + 2 hand). 14 source
  corrections applied → resnap → sync_drafts → re-seal (kv 475→476; dropped text restored, B6 subscript,
  etc.; kept correct “Isoniazid” — LOG as a ratified divergence in
  `eden/tools/ratified-divergences.json`). 69 moved into `claims_verified` (642→711).
  RARE-000403 UNVERIFIABLE (deficiency list not in the PDF text layer; needs a targeted manual locate).
  Findings: `chronicle/frontface-ocr/ruled-2026-08-18/` (VISION-SWEEP-FINDINGS.md, sweep-corrections.json,
  enrich-worklist.json, vision_findings.json).

## AFTER THE 69
The **92 UNSEALED** unverified ruled claims: recover from `temporary/claim-ruling-dashboard.html`
([[ruling-dashboard-is-recovery-source]]), seal, vision-verify, enrich — same pipeline.

## GENESIS
`genesis` → run genesis.py, report the board, then resume **Engine 2 enrichment** (front-face the 69 via
`enrich-worklist.json`) unless redirected. New invariant red = the only response.
