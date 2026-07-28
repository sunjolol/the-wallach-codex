# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-28, end of the thin-claim session)

# ★★★★★ READ FIRST (plain language)
Board **76/76 green · corpus kv428 · repo clean + pushed** (HEAD `a138e921`). This session did the original 4-task
agenda AND uncovered + started fixing a real quality problem (thin one-line claims). The MAIN unfinished work is
**25 staged thin-claim re-mines** that need a REFINED method — read TASK A below FIRST, it carries a hard-won lesson.

---

## TASK A — ★ THE MAIN JOB: finish the thin-claim re-mine (25 claims staged) — READ THE LESSON
**Context:** Luneth found that many "enriched" claims were thin one-liners saying LESS than their verbatim (worst:
bare-table verbatims like Table 7-8's "Cancer: Se"). His approved method: **answer the question from real Wallach
DOCTRINE across all books; re-source the verbatim to the EXPLANATORY passage; tables are for dosage, not doctrine;
GAP (don't pad) when no doctrine exists.** A 10-agent workflow produced 76 proposals; **51 landed clean** (22 full
re-mines + 29 answer-short-only, kv428). **25 are staged, NOT applied**, in `temporary/enrichment-queue/thin-claims/`:
- `proposals.json` (all 76), `REVIEW.md` (human-readable OLD→NEW), `targets.json` (the 76 with current text), `revert.json` (the 9).

**★ THE LESSON (memory [[remine-verbatim-vs-condition-gate]]) — why the 25 didn't land:**
1. **9 GATE-CONFLICT (reverted):** re-sourcing the verbatim to doctrine prose DROPPED the condition-name or dose the
   gates require → `verbatim_names_mapped_conditions` + `dose_amount_in_verbatim` went RED. Ids: DDDL-022/035/047/053,
   EPIGEN-137, LETS-486, RARE-004/308/311.
2. **13 BROKEN at resnap:** the new verbatim couldn't be relocated in the claim's OWN id-book — because (a) the doctrine
   was CROSS-BOOK (a claim's verbatim MUST come from its id-book; IMMORT-000001's goiter doctrine is in DDDL), (b) table
   clusters, (c) RARE-000306's agent verbatim differs from the anticarcinogenic passage Luneth already approved.
3. **3 GAP (correct, leave):** chromium/niacin/B6 TOXICITY — no doctrine in the books, only a flow-chart table row.

**THE REFINED METHOD for the 22 (13+9; the 3 gaps stay):** the new verbatim must BOTH explain the doctrine AND name
the mapped condition / contain the dose. Where no single in-book passage does both → keep the condition-naming (or
dose-bearing) verbatim and enrich ONLY claim_text+answer_short (which MAY synthesize across books). Cross-book doctrine
→ find an in-book passage OR keep in-book verbatim + cross-book answer. NEVER drop a condition mapping to pass the gate.
**Apply process that worked:** per-book `corpus_resnap --fix` DRY-RUN first (catch BROKEN before writing) → --write →
sync shard→draft → claim_text in draft → answer_short to enrichment → seal → if board reddens, revert offenders from
`git show <green-sha>:<shard>` → re-seal. Mechanically verify every verbatim is real book text (resnap heal = proof).
- RARE-000306 specifically: use the anticarcinogenic passage Luneth approved (Rare Earths p.382 "versatile
  anticarcinogenic agent…"), NOT the agent's "depressed immune system" version.

## Categorization requirement — ✓ VERIFIED MET (Luneth asked; confirmed 0 uncategorized)
All 2255 enriched claims appear in their correct FACET category in the enriched section of their page: essentials +
conditions have a facet-grouped "Worth knowing" section (entity-page-data `page.search[].facet`), and explore-topic
claims render on their subject's faceted page. 0 enriched claims uncategorized/orphaned. Driven by facet + home mapping
(which the re-mine never changes), so it holds. entity-page-data.json is derived + freshness-gated (green board = fresh).

---

## DONE THIS SESSION (all committed + pushed)
- **Task 3 (kv425):** registered noni/mangosteen/pomegranate/wolfberry + attached to the 3 ORAC claims.
- **Task 4 Tier-1 (kv426):** 5 nuance fixes (cruciferous "inordinate amounts", well-done-meat medium-rare, goiter
  goitrogen-cause, rude-awakening resolution). Tier 2/3 SKIPPED per Luneth.
- **Thin-claim re-mine (kv428):** 51/76 applied (above).
- **RARE-000306 investigation:** it renders fine on both pages; Luneth's "no result" was searching the QUESTION while
  the entity-page filter indexes claim_text/verbatim. **STILL OPEN (small): make the entity-page filter also index the
  enrichment question** (Luneth approved; entity-page.ts:1328-1332 matches card.textContent — add the question).
- **Task 1 memory:** hooks trimmed lossless; the merge/retire is WITHDRAWN (Luneth: not needed, bytes are fine).
- **Task 2 routing:** re-verified STALE, corrected ruling staged (`temporary/enrichment-queue/night3/TASK2-reverify-kv424.md`),
  Check-6 cancer-routing is Luneth's reserved call. NOT applied.

## STANDING DOCTRINES (unchanged)
1. Every claim lives in ONE of three homes (essentials/conditions/Explore); search is a retrieval layer. 0 orphans.
2. Diet not food; nutrients from the DIET (food OR supplements).
3. NEVER fabricate — verbatim ⊆ the sealed book, or GAP. (The re-mine upheld this: 0 fabrications; 3 honest gaps.)
4. corpus_seal + catalog_seal are USER-ONLY (this session's were explicit one-time authorizations).

**Corpus kv428 · 2263 sealed claims · board 76/76 green · repo clean + pushed. Fresh-session ready.**
