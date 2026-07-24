# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-24 18:14 CDT · orphan-pill campaign 7/8 closed · Foods §04 UNSIGNED · next = §04 redesign, then Epigenetics)

# ★★★★★ READ FIRST: **Foods §04 is NOT approved.** Luneth reviewed three iterations and called the result "still not good enough… a far cry from the type of outputs 4.8 was giving." Do NOT treat it as signed off, do not log it as done, and do not build on top of it until he approves a redesign. Everything else in this session is verified and green.

## ✅ SHIPPED THIS SESSION (2026-07-24, kv 391 → 394)

**The orphan related-pill campaign — 7 of 8 dead chips closed.** Knowledge pages carried 8 `related` slugs that resolved to nothing and rendered as unclickable grey text.

1. **4 slug bugs, zero mining** — `cholesterol.related` silicon → **silica** (the canon name; live essential page). `pork.related` poultry → **chicken** ("poultry" was already a chicken synonym). `gluten.related` **villi + wheat removed** and demoted to retrieval SYNONYMS on gluten itself (villi has 1 sealed claim; wheat's claims *are* gluten claims).
2. **Margarine** topic — 1 primary (IMMORT-000155, previously unenriched) + 6 cross-links whose quotes each name margarine. `"margarine"` pulled off `dietary_oils`' synonyms so the query routes here.
3. **Body pH & Acid-Base Balance** — IMMORT-000151 (intro_claim) · 000096 (cesium high-pH cancer therapy) · 000094 (what cesium IS — the follow-on Luneth required) + cross-links. **HONEST GAP, stated to him:** Wallach gives NO body-alkalizing protocol — 0 hits for alkalize / alkaline-forming / alkaline ash / alkaline diet / alkaline food across all 7 books. The only alkaline instruction is the water one. Do not invent one. Also: no cesium dose or how-to-take exists anywhere in the corpus (only its ppm distribution); do not supply one for a cancer therapy.
4. **Digestion & Stomach Acid** — 15 cards, intro_claim DDDL-000131 ("Should I be taking digestive enzymes?", Luneth's explicit choice of opener).

**Mining — 7 new DDDL claims, sealed kv=394 (1396 claims).** DDDL-000128 achlorhydria prevalence (stress lowers acid *contrary to belief*; 75% of over-50s need supplementation) · 000129 chronic dyspepsia's real cost · 000130 antacids reduce the nutrients you absorb · 000131 who should take digestive aids · 000132 bloating mechanism · 000133 dumping syndrome / enzymes need alkaline · 000134 secretion pH 1.0→8.2. Each shown Q → short → full → quote and approved before extraction.

**Source purification (Luneth-directed) + reseal.** DDDL `t.i.d. 5 minutes` → `15 minutes` (dropped OCR "1"; every other betaine-HCl instruction says 15-20/15-30 and LPD's twin says 15) · DDDL `betaine HQ` → `betaine HC1` · LPD `hemonhage` → `hemorrhage` ×2. `corpus_resnap --write` healed 39 DDDL + 343 LPD offsets; `--fix` re-snapped LETS-000137.

**+18 search enrichments · +14 glossary terms (234) · knowledge-drawer tab font-weight 600→500.**

## 🔒 TWO GATES ADDED (codify, don't promise)

- **`corpus_seal.draft_offset_failures()`** — refuses to promote a draft whose `char_offset`s don't point at their verbatim. The resnap-fixes-SHARD / seal-promotes-stale-DRAFT trap has now hit **4×** (S12, S44, 2026-07-17, and today, 382 failures). The memory documenting the right order existed all four times and prevented none. Negative-controlled.
- **`glossary_wellformed` R9 refinement** — vitamin designations (B12, D3, K2) strip before the digit check exactly as years do, so "intrinsic factor" can be defined in plain language. Narrow: `"B6 100 mg"` still trips on the 100. 6 cases added, 34/34.

## ⚠ SOURCE-RULE EVENT — flagged, granted, then WITHDRAWN. No breach shipped.

Luneth asked for one non-Wallach sentence (enzymes *reduce the bad effects of bad foods*). Flagged under the three-confirm protocol; he granted the override, then withdrew it once it was clear the sentence could be cut without losing the section. **No precedent exists**, and the containment gate proposed for it was deliberately NOT built — a gate for an exception that doesn't exist would imply the exception is available. Full record: `chronicle/contradictions/2026-07-24-digestive-enzymes-nonwallach-sentence.md`.

**Also settled, do not re-litigate:** the corpus does NOT support "digestive enzymes let you handle gluten." Checked all 10 gluten/grain passages within ±600 chars of an enzyme mention — gluten is always a food to ELIMINATE; enzymes are separate digestive support in the same stack. And **betaine HCl is NOT digestive enzymes** — it is supplemental stomach ACID. Two different supplements, two different jobs. Luneth assumed they were the same; they are not, and copy must never conflate them.

## ▶ NEXT, IN ORDER

1. **★ Foods §04 REDESIGN.** Current state: lead → 75% pull-stat → the "gate" figure (deterministic SVG in the villi-scan grammar: food blocked at the wall vs broken apart and crossing into a bloodstream band) → instinct-vs-fix panels → meal timeline → closing note. Header is measured-correct (6px offset, matching §02/§03) and the heading is 1.65rem, one line — **those two are settled, don't redo them.** What Luneth wants that it still isn't: a section that *excites*, that makes him want to read it. His own reference points are the ORAC section and the rest of the Absorption page. His stated dislikes across the iterations: claim-card dumps, "side cards that are easily skippable", "presented in a very basic, barebones way", "feels like a different design style made by an inferior artist". The information he singled out as genuinely good and wanting to be driven home: *"Acid frees minerals from food so they can cross the gut wall"* and the protein point. Vitamin B12 he called a much weaker point (already dropped from §04, still in the foot claims). **ASK him for a reference/direction before rebuilding again** — three blind iterations have not converged.
2. **Epigenetics topic** — the 8th and last dead pill, sitting on Wallach's OWN person page (`wallach.related`). Only 1 sealed claim carries the word (IAIYH-000020) against 509 book hits, so this needs NEW mining from `epigenetics.txt`. Luneth already chose "mine it now, small batches, my review each."
3. **Gloss card SHORT answers** — agreed-good, untouched. Today's 14 glosses only render on a card's EXPANDED answer (`entity-page.ts:207` glossifies `answer`, `:197` escapes `answer_short`). Luneth confirmed expanded-only is fine for claim cards, and asked for loose page prose to be glossed — that IS done in §04. Extending to short answers is a system-wide visual change; its own chunk, its own screenshot.
4. **D1 · Trim 3 claim_texts that outrun their verbatim** — LETS-000122 ("75% of people over age 50"), LETS-000259 ("most common and most costly Western 'disease'"), IMMORT-000081 ("20–26.2%", "pH 2.0 or lower"). Luneth approved shipping as-is for now. NOTE: the DDDL mining may have RESOLVED most of this — DDDL-000128 now states the 75% figure and DDDL-000129 the dyspepsia framing in Wallach's own properly-quoted words. Re-check before editing.
5. **Book-wide `betaine HC1` → `HCl`** — a real OCR artifact, consistent across both books, quoted by sealed verbatims. Its own campaign (resnap + re-quote + reseal), not a side-effect of another chunk.

## 🔧 MECHANICS — load-bearing

- **`corpus_extract finalize` is NOT additive.** It writes `draft = sealed shard + THIS run's claims`. A second finalize before sealing silently DROPS the first batch (hit today: "draft holds N" went 126 → 125). One finalize per seal cycle, or accumulate everything into one raw file.
- **Book-text edit order:** edit `.txt` via safe_write (LF) → `corpus_resnap --write [--fix json]` → **SYNC every draft from its corrected shard** → `corpus_seal`. The new seal guard now blocks the failure, but it does not do the sync for you.
- **Search layer:** hand-author `eden/catalog/search-entities.json` + `eden/corpus/search-enrichment.json` → `build_embeds.py` → `search_index_wellformed` gates. **An entity only exists in the index if ≥1 enriched claim has `subject` = its slug** (`search_index_derive.py` builds entities from subject counts) — an also_about-only entity is invisible and its pill stays dead. `entityLede` likewise requires a subject-owned claim.
- **Screenshots:** open the drawer via `[data-rail-nav="knowledge"]`, and dismiss the first-run onboarding modal ("I'm just browsing") or it blurs everything. Tall viewport (VH=2600) or the lower half of a long section paints blank.
- **Measure, don't eyeball:** §02/§03 sit their kicker exactly 6px below the numeral top. Two attempts failed by reasoning from CSS instead of measuring.

## 🔴🔴 REVIEW PROCESS (unchanged, and reinforced today)
Show EVERY claim in exact final form — **Q → short answer → FULL answer → quote**. The default is BOTH answers; ~90% carry both, and the full answer must ADD context pulled from the surrounding book text so the summary is worth more than the raw quote. Luneth corrected short-only output **three times in 24 hours**; the memory `review-claims-in-exact-form-approve-the-claim` was rewritten to close the "[full if needed]" loophole that kept licensing it. `corpus_seal` is user-authorizable. Visual/UX work ENDS at a STOP for his sign-off — and an unsigned surface is logged as unsigned.
