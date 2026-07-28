# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-27 · ENTITY-FILL + RECURRENCE-GATE SESSION)

# ★★★★★ READ FIRST (plain language)
Two doctrines still bind:
1. **"search-only" is DEAD.** Every claim lives in ONE of three homes — the 90 essentials, conditions,
   or Explore — and Search is a retrieval layer over all three. NEVER reintroduce a search-only tag/split.
2. **Wallach's supplement thesis:** essential nutrients come from the **DIET (food OR supplements)**, never
   "from food" alone — the soil is depleted, so food no longer suffices. Never write "must get X from food."

**Corpus: kv420 · 2195 claims · board 76/76 green.** (This session was ENRICHMENT-ONLY — no reseal, kv unchanged.)

## ★ WHAT THIS SESSION DID (all committed + pushed to master)
1. **Entity-fill campaign — COMPLETE.** All 15 newly-mined entities filled by surfacing already-approved
   sealed claims (also_about links) + a few enrich-existing entries — NO new claims, NO corpus_seal.
   - **protein** 1→12 (`5e535cd2`) · **nitrates** 1→8 (`be3f5054`) · **8-entity tail** (`d10a5d2b`:
     nitrites/coenzyme-a/acetylcholine/ornithine/nitric-oxide/GLA/silver-nitrate/berylliosis).
   - 5 entities were already complete (tuna, citrulline, melatonin, DHA, arsenic-trioxide). Several honestly
     top out at ~2 claims — real thinness, the corpus says no more. Mechanics: [[entity-fill-enrichment-mechanics]].
   - Curation lesson: the inventory (`temporary/entity-fill/inventory.md`) is a TOKEN-HIT superset — don't
     over-link tangential claims (a sulfur-mechanism claim isn't a protein-page claim just because it says "protein").
2. **Recurrence gate — SHIPPED** (`94333c94`). Built the **lowercase-question gate** into
   `search_index_derive.validate()` — blocks at BOTH the derive (build raises) and the `search_index_wellformed`
   invariant; `LOWERCASE_OK_PREFIXES` allowlist; negative-tested 16/16 (`tools/test_search_index_wellformed.py`).
   **Deliberately did NOT gate** from-food (26 hits are the CORRECT thesis) or says-nothing (padding-incentive) —
   recorded as evidence-based non-gates in `.claude/rules/search-corpus.md` so they aren't blindly re-attempted.
3. **Memory consolidation — safe part done.** Shortened all index hooks (24.2→20.4KB, under the read-limit),
   retired 3 done-milestone orphans, added [[entity-fill-enrichment-mechanics]], corrected the stale
   [[memory-consolidation-threshold]] (real trigger = BYTE size, not line count; shorten hooks before deleting).

## DEFERRED / FOLLOW-UPS
- **Ask-Wallach enrichment continues** per [[mining-serves-ask-wallach]] — biggest/most-searched entities first.
  The 15 newly-mined entities are done; the broader campaign (the 90 essentials + big condition/topic pages) is
  the ongoing wow-factor work. Enrichment-only where a sealed claim already exists; mine-fresh (needs YOUR seal)
  only when none does.
- **Memory deeper cull** — Luneth ruled LEAVE IT at ~178 lines/20.4KB (under both hard read-limits) and revisit
  at ~195. The PostToolUse hooks nag for <140 lines / <17.1KB but that needs retiring ~35 memories; deferred.
  The deferred mining-mechanics memory merge ([[consolidate-mining-mechanics-before-phase-g]]) rides along.
- **Charged-claims ruling** (3 fetal-testosterone→homosexuality/intersex claims) stays RESOLVED — keep on the
  condition pages; do not re-surface.
