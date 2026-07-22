# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-22, sub-batch 1 close)
# ★★★★★ 2026-07-22 — Batch-4 sub-batch 1 DONE · board 77/77 · kv 380 · committed+pushed
# ⚠ SUB-BATCH 1 WAS NOT "5 NEW CLAIMS" — a dedup pass proved 4 of the 5 already existed. Read the LESSON before touching the rest of Batch 4.

## 🔴🔴 REVIEW PROCESS — Luneth's hard rule (he does NOT trust silent authoring)
Before sealing ANY claim, show it to Luneth in its EXACT final form and get approval ON THE CLAIM ITSELF:
  QUESTION → SHORT ANSWER → (full answer ONLY if it genuinely adds something — it is NOT always needed; judge per claim, do not template it) → QUOTE.
NEVER put the approval prompt on a side-question (verbatim span, spelling, "which of these already exist") and treat that as content sign-off — that is how trust gets broken. If content was not reviewed, the log says "unreviewed", never "approved". Do NOT pad a claim_text into a longer restatement of the short answer (the search card guards against showing a full answer == the short answer, added 2026-07-22, kv 380). Be efficient: dedup + author + show the exact card, do not spelunk tool source or loop.

## ✅ WHAT LANDED THIS SESSION (1 new claim + 6 retags, NOT 5 new claims)
The handoff said "mine 5 NEW Glacial-Milk claims." Dedup against the FULL sealed corpus (not just DDDL) showed 4 already existed:
- **P3 (irrigate-don't-drink)** = **RARE-072** — already a claim, fully in group. DONE, untouched.
- **P2b (60-72 vs 3-20 minerals)** = **RARE-071** — already a claim (identical verbatim), in the about-group; just gained the `plant-derived-group`+`rare-earths` tags this session.
- **P8 (the "crystalloid" physiology)** = **IMMORT-025** — Wallach reused the passage near-verbatim in Immortality (2008); already mined. Retagged into the group this session.
- **P9 (four forms of colloid)** = **IMMORT-026** — same story; already mined. Retagged into the group.
- **P11b (humic-shale manufacturing)** = **GENUINELY NEW** → authored as **WAL-CLM-RARE-000319**.

So this session = **1 new claim (RARE-000319) + 1 enrichment card + 6 retags** (IMMORT-025/026 gained about+tag; RARE-061/069/070/071 gained tags) + a source-purification of rare-earths.txt lines 20843-20876. corpus_seal kv 378→379 (1345→1346). Board 77/77, all pushed.

## 🔴 THE LESSON (do NOT skip — it changes how you mine the rest of Batch 4)
**The 19-teal-new inventory below came from a rare-earths sweep that deduped ONLY against the 5 mined DDDL claims.** It never checked Immortality or the June rare-earths mining. **Wallach reuses whole passages across books**, so that sweep's "new" candidates include already-mined content. **Before authoring ANY teal-new claim: dedup its proposition against the FULL sealed corpus (all 7 books), not just the sweep's reference set.** Use a keyword scan over `eden/corpus/claims/*.json` (grep the distinctive phrase + the concept). Authoring without this manufactures duplicates — it nearly created 4 this session. Fold a cross-book reuse in by RETAG (bring the existing claim into the group), not a new claim.

Second lesson (source-image mandate earned its keep): verify numbers + spellings against the **rendered PDF page pixels**, NOT the OCR .txt. This batch, the page confirmed the numbers AND revealed "fullfill"/"ones life" are Wallach's own printed spellings (author error, not OCR) — Luneth ruled to normalize author spellings during purification.

## ▶ NEXT ACTION — remaining Batch-4 teal-new, in small sub-batches, AFTER re-dedup
Re-dedup each against the full corpus first (per the lesson). Candidates still plausibly new (verify each — some may already exist):
NEW-01/03 (origin / 6-denominators) · NEW-13 (Hunza ~100/140) · NEW-14 (liquid tones stomach + ups acid) · NEW-15 (thesis: minerals not tech) · NEW-16 (wood→electric fuel turning point) · NEW-19 (obsessive soil care) · NEW-20 (humic shale ~70 minerals — dup-check vs the new RARE-319) · NEW-21 (bee-pollen/algae/kelp can't do it — trim Aztec-cannibalism/kelp-79.9 asides; 400 lb figure) · NEW-23 (humic shale = Carboniferous plants, 77+/84 minerals — brontosaurus typo already fixed) · NEW-30 (culinary-ashes lineage).
**FRINGE (Luneth ruled INCLUDE BOTH, faithfully — memory `never-censor-wallach-for-implausibility`):** NEW-17 (Immortality 2008: rare earths "doubled the expected life span of several species" + supplementation-is-the-only-warranty — his direct stance) · NEW-22 (Epigenetics 2014: the reportedly 256-yr-old Li Chung Yun; capture as Wallach's SPECULATION exactly as framed, labeled+attributed, NEITHER censored NOR inflated).
Full byte-verified passages: `temporary/plant-derived-research-2026-07-17/sweep/book-rare-earths.md`. After the teal-new is exhausted → **item 3: bring the 3 still-to-do demo surfaces live — Ask Wallach, Products tab, Conditions tab** (memory `demo-elements-still-to-do`).

## ⚖ BATCH-4 RULINGS — SETTLED with Luneth (do NOT re-litigate)
1. **Concentration is NOT a cross-book contradiction — two different MEASURES.** RARE (1994) & EPS (2014) both give the humic-shale SG-3.0 extract as 38,000 mg/L = 38 g/L (identical). HK (2015) says 19,000 mg/qt (~20 g/L). The "38" is total SUSPENDED SOLIDS (RARE Table 10-5 header literally: "Suspended Solids 38 gm/L"); the listed minerals sum to only ~6.2 g/L. RULE: use HK's 19,000 mg/qt as the mineral number; wherever a claim quotes 38 g/L, label it "suspended solids (total)", NOT "minerals"; NO "contradiction" note. (RARE-319 applied this.)
2. **Culture count / age / mineral counts:** favor-newer (culture count → "eight" per DDDL-119; humic-shale age = reclassification); mineral counts (77/60/60-72/84/~70) are DIFFERENT REFERENTS (product vs essential vs Glacial-Milk vs ancient-soil), NOT contradictions — keep each with its referent.
3. **FRINGE:** include BOTH NEW-17 + NEW-22 faithfully (see NEXT ACTION). Fringe policy is for CHARGED political/sexual content, NOT implausible claims.
4. **DROP NEW-11** (Todd "reduce" arm) — RARE-088 already carries the full unmask→reduce→time/dose arc.

## 🔧 MECHANICS (proven — reuse)
- **Dedup FIRST:** grep `eden/corpus/claims/*.json` for the distinctive phrase + the concept slug; check `about:["colloidal-minerals"]` group (about-based, ~32 claims now) + the search "Colloidal Minerals" concept (33 entries). Cross-book reuse → retag, not new claim.
- **NEW claim (ADD):** author raw.json `{kind, about:["colloidal-minerals"], conditions:[], claim_text=<plain summary, no book-refs>, verbatim=<byte-exact>, tags, confidence}` → `corpus_extract.py finalize --book <id> --raw <raw>` (snaps verbatim via whitespace/quote-fold norm; stores EXACT book bytes incl. line-breaks — so purify narrow-column source FIRST). Report → drafts/reports/.
- **Retag existing (edit `about`/tags):** transactional safe_write on the DRAFT (mine_batch cannot edit `about`). NOTE ordering: if you also finalize a NEW claim for the same book, finalize REBUILDS that book's draft from the shard — do retags on that draft AFTER finalize.
- **Source purification (narrow-column → single-line):** stage LF old/new via a python script (reflow = `par.replace("-\n","").replace("\n"," ")`); safe_write replace (payloads MUST be LF — safe_write normalizes the CRLF file on read) → `corpus_resnap.py --book <id> --write` (re-hashes books-meta + re-snaps ALL offsets; EXACT/HEAL/BROKEN) → then finalize/seal. Verify no sealed verbatim lives in the block first (resnap dry-run BROKEN=0). rare-earths is a 'raw' book so book_source_clean/mined_pages_clean do NOT hard-block it.
- **Enrichment card** → `search-enrichment.json` `enrichment` dict, keyed by claim id (NOT sealed; JSON round-trip is byte-identical so load+dump+append gives a clean diff). Authored: subject/also_about/facet/question/answer_short/topics (answer/verbatim/cite DERIVE). Facet ∈ 13-set. Dual-home OK (a non-search-only claim CAN have a card — DDDL-116 precedent; the _note's "must be search-only" is stale). Card validates only AFTER seal (derive reads the sealed shard).
- **Seal cycle:** corpus_seal (USER-ONLY — per-invocation OK) → build_embeds (12) → build.mjs → invariants → render_probe knowledge+entity+search → build-log + creators_log → RE-inline build (log bakes at BUILD time) → commit + push.
- **⚠ creators_log gotcha:** NEVER inline a double-quoted `--detail` with a backtick (command-substitutes, silently drops the word). Use `--detail "$(cat file)"` from a backtick-free file. `--kind` from the fixed set (source-purification is NOT valid → use round-close). `--summary` ≤280.
- **PDF page-image verify:** `temporary/rare earths forbidden cures/…pdf`. Render with PyMuPDF: `fitz.open(pdf)[idx].get_pixmap(matrix=fitz.Matrix(3,3)).save(png)` → Read the PNG. fitz idx ≈ printed page + 22 for Ch.10 (calibrate by phrase-search over `d[p].get_text()`). Cross-check the RENDERED pixels, not the PDF text layer (also OCR). (memory `page-images-exist-for-three-books`, `verify-against-source-images`.)

## PLANT-DERIVED GROUP STATE (after this session)
about-based group ≈ 32 claims (was 29: +RARE-319 + IMMORT-025 + IMMORT-026). Search "Colloidal Minerals" concept = 33 entries, 11 facets. Seed voice model = DDDL-116-120.

## COMMITS THIS SESSION
(see git log — sub-batch 1: 1 new claim RARE-000319 + 6 retags + source-purification, kv 379)

---

# ★★★★ 2026-07-21 (SESSION 8) — reusable UX patterns (batches 1+3 done)
- **Glossary separated** (`glossary.json`): atomic "colloidal" (FORM) + "plant derived" (SOURCE); matcher longest-first → multi-word phrases decompose per-concept.
- **"Where to get it" affordance** (`views/entity-page.ts::renderGroupGetIt` + `ACTIONABLE_GROUP_KINDS={dose,protocol}`): product pointer on green dose/protocol group blocks, keyed on claim KIND (NOT a colour literal — `view_category_not_hardcoded` REDs a 'green' string), fed by `rankedPdmSources()`.
- **COLOUR = claim KIND's family** (view-copy `kind_categories`): teal=definition/mechanism/... · green=dose/protocol · amber=deficiency/toxicity · orange=prevalence/prognosis/quote · violet=personal_anecdote · red=contraindication.
- **After plant-derived (item 3):** bring the 3 still-to-do demo surfaces live — Ask Wallach, Products tab, Conditions tab (+ detail views). Everything else in live beats the dated demo (memory `demo-elements-still-to-do`).
