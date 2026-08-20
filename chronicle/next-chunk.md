# ★★★ NEXT SESSION — READ THIS FIRST.

**Board 94/94 green.** Corpus **kv=482** (Immortality landed 2026-08-19). Active campaign: land the ruled unverified-book claims per-book — **2 of 5 books done (HK, Immortality); 3 left.** See NEXT TASK.

## ✅ DONE 2026-08-19 — IMMORTALITY LANDED (kv 480→482) [SEAL SEQUENCE COMPLETE]
**25 claims live + searchable** (sealed ids **WAL-CLM-IMMORT-000523..000547**). Full worked record in `chronicle/ratify-unverified-2026-08-19/immortality/` (idmap, vision-results, finalize-raw, enrichment-by-sealed, condition-remediation, corrected-verbatims, resnap-fix-map).
- **Dedup:** 29 approved → 25. Luneth ruled DROP the 4 that were byte-identical `claim_text` to already-live claims (768=495, 775=513, 822=479, 827=487). 2 post-build twin-card collisions (812⊂772, 814⊂734) resolved by **re-subjecting** the narrower claim to its more-specific page (812→allergies, 814→hypertension), not dropping.
- **Vision-verify (all 25, Kindle screenshots):** 23 clean, 2 defects fixed, every number + proper noun confirmed on the real pages. Fleet = one general-purpose agent per book page reading `temporary/The Age Beaters…/Screenshot (N).png` (dual-monitor, book on LEFT ~48%); locate via `tools/frontface/corr_shots.py` ShotBook.
- **Source `.txt` OCR fixes (12 claims, all vision-confirmed, logged to `ratified-divergences.json` pending_review `batch_2026-08-19-immortality-landing`):** B,,→B12 ×4 (824), (B,)→(B1) (806), charleton→charlatan (757), mono-saturated→mono-unsaturated (777), flavanoids→flavonoids (778), erythematosis→erythematosus + cocoagin→cocoa (Luneth-ruled), dropped "have" restored (771), the 14-Hunza-Practices two-column merge → "Recorded birth defects are" (747, which also restored the birth_defects mapping), plus line-splits. **811 "he was high" HELD byte-exact — Luneth ruled it a figure of speech, NOT a typo; do not "fix" to "hale".**
- **5 catalog synonyms sealed** (Luneth-ratified, `catalog_seal`, with_synonyms 142→143): obese→obesity, diabetic/diabetics→diabetes, allergic reaction(s)→allergies, reduced libido→low_libido.
- **Condition-mapping:** 31 mappings live; 4 remaps (757→CVD, 767→insulin_resistance+CVD+liver, 817 drop alopecia, 824→neuropathy); 7 claims fully search-only (764/773/811/814/815/816/826 — verbatim doesn't name the condition; still surface via subject/topics). Same 7-search-only shape as HK.
- Sequence ran clean: catalog_seal → finalize (523-547) → corpus_seal(481) → .txt fix + resnap --fix(0 BROKEN) → sync draft → reseal(482) → claims_verified +=25 → merge enrichment → derive+embeds+build → board 94/94. `entity_page_enriched_matches_search` green.

## ✅ DONE 2026-08-19 — Hell's Kitchen landed (kv 476→480); scanner 9-item refinement; lede backlog drained (136→0)
HK: 23 live, 116 dropped (Accutane dup). Scanner REJECT/NEUTRAL/ADD cards signed off. All 136 explore ledes authored (`explore_entity_lede_authored` enforcing).

## ▶ NEXT TASK — land the remaining 3 books (pipeline PROVEN on HK + Immortality)
**★ RUNBOOK: `chronicle/ratify-unverified-2026-08-19/RUNBOOK.md`** — exact commands + every gotcha. All at-risk data committed there.
Remaining keeps (with approved `answer_full`s): **epigenetics (~18), rare-earths (13), let's-play-doctor (15)**.
- **rare-earths + let's-play-doctor are PDF-clean** (easy vision path via `tools/frontface/{pdf_corroborate,render}.py`).
- **epigenetics is screenshot-spread** like immortality (screenshots in `temporary/Epigenetics…/`, OCR cache `ocr-cache/ocr-epig-*.json`, purity-status "raw"). Reuse the immortality vision-fleet pattern (`chronicle/ratify-unverified-2026-08-19/immortality/` scripts + workflow are the template).
- Per book: assemble keeps (candidates∩keep∩has-answer) → **claim_text dedup vs sealed** (the 4 immortality dups slipped past question-dedup — check claim_text!) → vision-verify → condition-mapping remediation (extend/drop/synonym) → build finalize-raw+enrichment (subject MUST resolve; unregistered topic → resolving fallback) → seal sequence → clear post-build reds (gloss WARNING, no_duplicate_claims, mined_pages_clean) → board 94/94.

## GENESIS
`genesis` → run genesis.py, report the board, then ask which to resume. New invariant red = the only response.
