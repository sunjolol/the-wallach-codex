# ★★★ NEXT SESSION — READ THIS FIRST.

**Board 94/94 green.** Corpus **kv=484** (Rare-earths landed 2026-08-19). Active campaign: land the ruled unverified-book claims per-book — **3 of 5 books done (HK, Immortality, Rare-earths); 2 left.** See NEXT TASK.

## ✅ DONE 2026-08-19 — RARE-EARTHS LANDED (kv 482→484) [SEAL SEQUENCE COMPLETE]
**13 claims live + searchable** (sealed ids **WAL-CLM-RARE-000406..000418**). Worked record + template scripts in `chronicle/ratify-unverified-2026-08-19/rare-earths/`. Ran clean, board 94/94 on the FIRST post-build pass (no gloss/dup reds).
- **Dedup:** clean — question AND claim_text dedup both empty (claim_text dedup is the check that caught immortality's 4; ran it here, nothing).
- **Vision-verify (13 vs PDF page renders):** PDF path via `tools/frontface/pdf_corroborate.py` (locate) + `render.py` (fitz PDF→PNG). Key lesson: **the PDF's own text layer is often WORSE than our purified `.txt`** — 3 claims (443/447/457) are cases where the printed page has the typo (HYPOTHYROISM, Jykell/disesase/Hyperirratability, icluding) and OUR text is already correct; HELD ours, logged as divergences, did NOT restore the page error.
- **Source `.txt` fixes (7 claims, vision-confirmed, logged `batch_2026-08-19-rare-earths-landing`):** B,,→B12 (442/406), tibers→fibers (448/410), stray quote (449/411), stray bracket (458/414), Armond→Armand + dispepsia→dyspepsia (470/417), Roboxin→Robaxin + Orphenidrine→Orphenadrine (471/418), plus de-hyphenating justified-column line-splits (front-facing spans). 466 answer_short reworded "90 minutes"→"an hour and a half" (§00.A; source says "one and a half hours").
- **1 synonym sealed** (Luneth-ratified): haemorrhoids→hemorrhoids (British spelling; with_synonyms 143→144). 448 "Schuessler cell salts" framing confirmed page-sourced (Table 11-1 caption).
- **Condition-mapping:** 15 live; 7 → search-only (446 drop low_back_pain, 447 drop ED, 453 drop allergies/food_allergy, 466 drop hyperactivity, +449 acne / 457 osteoporosis fully search-only).

## ✅ DONE 2026-08-19 — IMMORTALITY LANDED (kv 480→482)
25 claims live (**WAL-CLM-IMMORT-000523..000547**). 4 dropped as byte-identical claim_text dups; 2 twin-card collisions re-subjected (812→allergies, 814→hypertension); 12 OCR fixes; 5 catalog synonyms; 4 remaps; 7 search-only. 811 "high" HELD (Luneth: figure of speech). Worked record in `chronicle/ratify-unverified-2026-08-19/immortality/`.

## ✅ DONE 2026-08-19 — Hell's Kitchen landed (kv 476→480); scanner refinement; lede backlog drained (136→0)
HK: 23 live, 116 dropped (Accutane dup). Scanner REJECT/NEUTRAL/ADD cards signed off. All 136 explore ledes authored.

## ▶ NEXT TASK — land the remaining 2 books (pipeline PROVEN on HK + Immortality + Rare-earths)
**★ RUNBOOK: `chronicle/ratify-unverified-2026-08-19/RUNBOOK.md`.** Remaining keeps (with approved `answer_full`s):
- **let's-play-doctor (15) — PDF-clean**, easiest. Reuse the **rare-earths** template exactly: `pdf_corroborate.run("lets-play-doctor", entries)` + `render.py lets-play-doctor <page> <png>` (PDF mapped in both tools). The `chronicle/ratify-unverified-2026-08-19/rare-earths/` scripts (re_assemble / re_render_group / re_vision_workflow / re_corrections / re_build_bundle) are the drop-in template.
- **epigenetics (~18) — screenshot-spread** (like immortality). Screenshots in `temporary/Epigenetics…/`, OCR cache `tools/frontface/ocr-cache/ocr-epig-*.json`, `corr_shots.py` ShotBook (BOOKS map already has "epigenetics"). Reuse the **immortality** template.
- **Per book:** assemble keeps → **question AND claim_text dedup vs sealed** → vision-verify (page image is arbiter; our .txt is often cleaner than raw OCR — KEEP ours on page-typos, log divergence) → condition remediation (extend/drop-to-search-only/defensible synonym/remap) → build finalize-raw+enrichment (subject MUST resolve; unregistered topic→resolving fallback) → seal sequence → clear post-build reds → board 94/94.

## GENESIS
`genesis` → run genesis.py, report the board, then ask which to resume. New invariant red = the only response.
