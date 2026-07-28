# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-28 · NIGHT3 REVIEWED, APPLIED, SEALED, PUSHED)

# ★★★★★ READ FIRST (plain language)
The Night3 enrichment is **DONE and LIVE.** Luneth reviewed the before/after page, gave notes on every claim,
gave 2 corrections, and authorized the push. Everything was applied, the corpus was re-sealed
(**kv424, 2263 claims**), the board is **76/76 green**, and it is **committed + pushed**. This session is a clean
starting point — nothing is mid-flight.

## WHAT SHIPPED (2026-07-28)
- **All 18 of Luneth's review notes** on the staged Night3 enrichment (8 existing-claim + 10 new-claim).
- **67 WS2 claims** finalized + sealed; **3 claims PURGED** entirely from the corpus (teething→aspirin
  LETS-000447, dup-copper RARE-000302, homosexuality-cause IMMORT-000020); **3 claim_text edits**
  (EPIGEN-000005 hard MD stance, RARE-000178 manganese, RARE-000165 lithium).
- **761 search enrichments** wired (694 WS1 + 67 WS2); **+469 search-entities** (new `see_food_diet`, `hawthorn`).
- **3 glossary hovers** (See Food Diet, Mediterranean diet, anastomosis) + a new "What is Dr. Wallach's See Food
  Diet?" claim/entity.
- An **independent 13-agent adversarial fact-check** caught 2 of Claude's own edits before they shipped
  (see build-log + Creator's Log `lg_ms501m1r_02y6ev`).
- **6 latent night3-batch defects** found + fixed (the batch had never been run through finalize/seal/invariants):
  invalid kinds, string doses, unregistered substances, unfounded condition-mappings, term-gloss, a falsely-clean
  validation_report. Full detail in the build-log line + Creator's Log.

## NEXT-ORDER TASK (Luneth's stated next task)
**The nuance / begs-the-question FULL scan across all 2263 claims.** Luneth asked for this explicitly AFTER the
push. Two passes he named, over every claim (especially anything framed as "what does Wallach think of X"):
1. **Begs-the-question / cliffhanger:** a claim that raises a question or states a bad-form without resolving it
   (e.g. an unexplained term, a "rude awakening"-style dangle, "so is it good or bad?"). He hit ~2 back-to-back in
   Night3 despite a prior "already fixed" claim, so a real systematic sweep is warranted.
2. **Good-forms-vs-bad-forms nuance:** when a claim warns against a BAD form of something, it must not read as
   "avoid the whole thing" — it must name the good form too (the honey/yogurt pattern: "avoid low-fat yogurt"
   must not imply "avoid yogurt"). He estimates maybe 30-40 claims need this nuance added.
   RULE: never fabricate the good-form — it must be Wallach's own (search his books), or surface the gap.

Recommended shape: an Ask-Wallach-harness + adversarial-verify workflow over the enriched claims (the exact
pattern used this session caught real defects). Present findings for Luneth's review before editing — same
propose→ratify discipline. Small batches, his review each time [[small-batch-build-test-log-mandate]].

## OTHER DEFERRALS (lower priority, not blocking)
- **Task 3 — antioxidant-FOOD routing fix.** Staged in `temporary/enrichment-queue/night3/` but NOT reviewed or
  applied this session (Luneth's notes never covered it). `render_probe_search_routing` is still 2/6 (pre-existing).
  Needs Luneth's OK before applying (`scripts/apply_task3.py` + widen FOODS in the routing probe).
- **mangosteen / pomegranate catalog registration.** Dropped from `other_substances` on 3 noni/ORAC claims this
  session to keep the seal valid without touching the catalog pillar (`catalog_seal` is user-only). They're real
  antioxidant fruits Wallach discusses; register them in `eden/catalog/nutrients.json` + `catalog_seal` if wanted.

## STANDING DOCTRINES (unchanged, still bind)
1. **"search-only" is DEAD** — every claim lives in ONE of three homes (90 essentials / conditions / Explore);
   Search is a retrieval layer over all three.
2. **Wallach's supplement thesis** — essential nutrients come from the DIET (food OR supplements), never
   "from food" alone.
3. **NEVER GUESS / NEVER FABRICATE when mining** — verbatim ⊆ the sealed book, or honestly skip. Surface every
   judgment call. This session proved its worth twice (mediterranean-diet reprint, microwave no-stance).
4. **corpus_seal + catalog_seal are USER-ONLY** — sealing is the human's act of ratifying canon.

**Corpus: kv424 · 2263 sealed claims · board 76/76 green · repo clean + pushed.**
