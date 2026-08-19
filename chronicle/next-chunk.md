# ★★★ NEXT SESSION — READ THIS FIRST.

**Board 94/94 green.** Corpus **kv=480** (Hell's Kitchen landed 2026-08-19). Active campaign: land the 99 ruled unverified-book claims per-book — see NEXT TASK.

## ✅ DONE 2026-08-19 — Scanner 9-item refinement + post-review tweaks [SIGNED OFF + PUSHED]
Luneth reviewed the REJECT / NEUTRAL / ADD result cards and approved (commit `396f7232` + a follow-up commit).
- **Engine (locked by `tools/render_probe_scan_verdicts.js`, 20 scenarios):** gluten grains + oats are a HARD reject; a "gluten free oats" declaration now HIDES the oats warning entirely (like buckwheat), while a real gluten grain (wheat) on the same label still flags on its own; seed/fried oils REJECT unless ≥3 meaningful essentials OFFSET them to neutral (never ADD); ALL synthetic food dyes HARD reject — 181 exact-match terms, misfire-guarded, §00.A-clean via WAL-CLM-LETS-000305 (Feingold "avoid … food colors").
- **Layout fix (regression I caused, now GATED):** removing the hint had let the ingredients box jump beside the upload zone (`.vd-paste` had no flex-basis; the hint’s width was holding it on its own row) — pinned `.vd-paste { flex: 1 1 100% }`; `render_probe_scanner.js` now asserts the box renders full-width BELOW the upload zone. Also trimmed the drop-zone text + dropped "slow by design".
- **Card copy:** removed the "Cited Wallach corpus" line, the "Worth considering" neutral sub, the "Never merged…" foot line, the "…a real start" caption tail, and the obsolete `.vd-paste__hint` note; every flag now shows `category — "matched term"` on its own bordered line; unredeemed vs offset seed-oil are distinct legible reasons.

## ✅ DONE 2026-08-19 — lede backlog fully DRAINED (136 → 0) [8c15c7e3]
All 136 explore-topic ledes authored + verified; gate `explore_entity_lede_authored` fully enforcing. Artifact: https://claude.ai/code/artifact/50f61990-652f-433d-88c2-072299920ec1

## ▶ NEXT TASK — land the remaining 4 books (pipeline PROVEN on Hell's Kitchen)
**★ READ FIRST — the full runbook (exact commands, every decision, every gotcha): `chronicle/ratify-unverified-2026-08-19/RUNBOOK.md`.** All at-risk data is committed there (Luneth's rulings, the 99 approved answers, candidates, scripts). Nothing lives only in scratchpad.
Luneth ruled **approve all + push live** on the 99 rewritten `answer_full`s. Landing is per-book, end-to-end.
**Hell's Kitchen DONE + LIVE** (below). Remaining: immortality (33), epigenetics (18), rare-earths (13), let's-play-doctor (15).
All approved answers: `chronicle/ratify-unverified-2026-08-19/answer-fulls.json`; per-book slices in scratchpad recoverable from `author-input.json`.

### The proven per-book pipeline (ran clean on HK):
1. **Vision-verify** each quote vs its page image — `render.py` (PDF→PNG) + a general-purpose fleet Reading the PNGs; PDF books map in `tools/frontface/pdf_corroborate.py`.
2. **Fix OCR** in the book `.txt` (`corpus_resnap --fix`) + **de-hyphenate** front-facing spans (`tools/frontface/fix_hk_hyphens.py` pattern) → resnap.
3. **Simulate `verbatim_names_mapped_conditions` on the draft** (`verbatim_audit.names`) BEFORE sealing — extend the verbatim / drop the mapping / add a defensible catalog synonym (Luneth ratifies pillar edits) for each failure.
4. finalize → corpus_seal → resnap(heal) → reseal → `claims_verified += ids` → merge enrichment → `search_index_derive` + `build_embeds` + `build.mjs`.
5. Clear post-build gates: frontface hyphens, jargon gloss, **no_duplicate_claims (dedup needs Luneth's per-pair ruling)**, subject-must-resolve-to-registry/essentials.
6. Verify surfacing (`entity_page_enriched_matches_search` green) + board 94/94.

### ✅ HELL'S KITCHEN — LANDED 2026-08-19 (kv 476→480)
23 of 24 claims live (116 dropped as an Accutane near-dup; 101+102 keep-both allowlisted). **2 conditions-pillar synonyms sealed** (cholesterol→high_cholesterol, beri beri→beriberi). 3 OCR verbatim fixes + 34 hyphen de-splits. 17 surface on condition/essential pages + Explore + search; 7 search-only (dropped stretch mappings: thyroid×2, obesity×3, constipation, exercise/bone). Board 94/94. Artifacts: `chronicle/ratify-unverified-2026-08-19/hells-kitchen/`.

## ✓ RESOLVED 2026-08-19 — the 8 `recovered_question:null` are NOT dangling
All 8 (EPIGEN-000465/469/479, IMMORT-000479/487/495/513/522) carry complete live entries in
`eden/corpus/search-enrichment.json` — subject + facet + question + answer_short + answer_full + topics.
The null was a pre-front-face worklist flag, resolved when their questions were authored in
`ce00d468` + `6df95308`. Nothing to seal or fix.

## GENESIS
`genesis` → run genesis.py, report the board, then ask which to resume. New invariant red = the only response.
