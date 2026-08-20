# ★★★ NEXT SESSION — READ THIS FIRST.

**Board 94/94 green.** Corpus **kv=486** (Let's-Play-Doctor landed 2026-08-19). Active campaign: land the ruled unverified-book claims per-book — **4 of 5 books done (HK, Immortality, Rare-earths, Let's-Play-Doctor); 1 LEFT: epigenetics.** See NEXT TASK.

## ✅ DONE 2026-08-19 — LET'S-PLAY-DOCTOR LANDED (kv 484→486) [SEAL SEQUENCE COMPLETE]
**15 claims live** (sealed ids **WAL-CLM-LETS-000525..000539**). Worked record + template scripts in `chronicle/ratify-unverified-2026-08-19/lets-play-doctor/`. PDF-clean path (same as rare-earths).
- **Dedup:** question + claim_text both clean pre-seal. One POST-build twin caught: 553 (mag→restless legs) quotes the same magnesium-deficiency table as already-live **016**; Luneth ruled **re-facet 553 physiology→mechanism** (its answer leads with the Ca/Mg tug-of-war mechanism) rather than drop — separates the two cards, board green.
- **Vision-verify (15 vs PDF renders, PNGs to scratchpad NOT repo):** every number confirmed (uric 4-8/4.5-5.5, baso 0-2%, temp 97.8, migraine 11:00-12:00, \$1.50, GTT, 90d/100y). 9 source fixes (eveiyone→everyone, memoiy→memory, "1 2:00"→12:00, Jaccuzi→Jacuzzi, fused-word splits ifyou/orJaccuzi/usingeyes + de-hyphenation) logged `batch_2026-08-19-lets-play-doctor-landing`. No page-typo-holds this book.
- **1 synonym sealed** (Luneth-ratified): "urinary infection"→urinary_tract_infection (575). 561 "Nat Mur" confirmed page-sourced (Table 7-2 heading).
- **Catches:** 576 mapped raynauds but page says "poor thyroid function" → subject remapped to hypothyroidism; 559→acne PASSED (B6 deficiency list names acne).
- **Condition-mapping:** 17 live; 6 → search-only; 4 fully search-only (553/557/565/576, each on its subject page via routing).

## ✅ DONE 2026-08-19 — earlier this session
HELL'S KITCHEN (kv 476→480, prior session), IMMORTALITY (`0df7b006`, kv 480→482, 25 live 523-547), RARE-EARTHS (`ea1dff2e`, kv 482→484, 13 live 406-418). Worked records per book in `chronicle/ratify-unverified-2026-08-19/{immortality,rare-earths}/`.
**KEY LESSON (PDF books):** the PDF's own text layer is often WORSE than our purified `.txt` — when the printed PAGE has the typo and OURS is correct, HOLD ours + log the divergence, do NOT restore the page error (rare-earths 443/447/457).

## ▶ NEXT TASK — land the LAST book: epigenetics (~18)
**★ RUNBOOK: `chronicle/ratify-unverified-2026-08-19/RUNBOOK.md`.**
- **epigenetics is screenshot-spread** (like immortality, NOT PDF-clean). Screenshots in `temporary/Epigenetics…/`, Tesseract OCR cache `tools/frontface/ocr-cache/ocr-epig-*.json`, `corr_shots.py` ShotBook (BOOKS map already has "epigenetics"). **Reuse the IMMORTALITY template** (`chronicle/ratify-unverified-2026-08-19/immortality/` scripts: imm_locate → ShotBook locate; imm_vision workflow reads `temporary/Epigenetics…/Screenshot (N).png` dual-monitor). purity-status "raw".
- Pipeline (proven 4×): assemble keeps → **question AND claim_text dedup vs sealed** → vision-verify (page image arbiter; KEEP ours on page-typos + log) → condition remediation (extend/drop-to-search-only/defensible synonym/remap) → build finalize-raw+enrichment (subject MUST resolve; unregistered→resolving fallback) → seal sequence → clear post-build reds (esp. no_duplicate_claims — a NEW claim can twin an EXISTING one, re-facet or per-pair rule) → board 94/94.
- After epigenetics: the campaign is COMPLETE (all 5 unverified books live).

## GENESIS
`genesis` → run genesis.py, report the board, then ask which to resume. New invariant red = the only response.
