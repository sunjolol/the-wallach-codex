# ★ NEXT SESSION — the twin-card class is DEAD (gated + green); read first

The recurring duplicate-cards problem that ate three days is **fixed for good**. Nothing is pending
or broken.

## What shipped
- **`search_no_twin_questions`** — a permanent gate (the missing fence). For every entity page it REDs
  if two cards ask the same question after synonym-folding (signs=symptoms, dangerous=harmful,
  deficiency=low). It reads the authored questions in `search-enrichment.json`, grouped by subject.
  Deterministic fold-equality, **empty allowlist**, negative test
  `tools/test_search_no_twin_questions.py` (ENFORCE_GREEN on). This is the CROSS-BOOK sibling of
  `no_duplicate_claims` (which was blind to cross-book synonym twins — see
  [[duplicate-gate-blind-three-ways]]). It is the successful redo of the Aug-6 `no_duplicate_questions`
  gate that was deleted for overreach.
- **All 19 twins resolved** under Luneth's per-pair review — 2 on vitamin-D, then 17 (14 signs/symptoms
  merges + selenium + mercury + a germanium-dose delete). MODEL: keep the fuller book's card, fold the
  other book's unique signs into its answer_short, un-enrich the twin. **Both claims stay sealed; no
  claim was deleted — only redundant search cards collapsed.**

## State of the world
- **`master`** = campaign tip, board **90/90**, gate GREEN (0 twins across 513 subjects).
  `search-enrichment.json` 2159 → **2140 entries** (19 twin cards removed). Corpus claims UNCHANGED
  (kv unchanged — enrichment is unsealed).
- Commits: `cb970149` (gate) · `6dcadad2` (vitamin-D) · `dda1414e` (the 17). Creator's Log
  `lg_msjferz1_y165ah`. Branch `twin-question-gate` was ff-merged and can be deleted (local-only).

## If you want to go further (optional, not pending)
The gate catches fold-EQUAL twins only. ~130 **borderline** pairs (question-similarity 0.5–0.99 but not
fold-equal — e.g. "what does deficiency do to your bones?" vs "signs of deficiency") were measured but
are NOT gated: they need human judgment (merge vs keep-as-distinct-subquery), which a machine can't make
without guessing a threshold. That's a labeled WISH in the gate's block comment. Raise it only if Luneth
asks.

# ⚠ DELIBERATELY NOT RESTORED — HIS DECISION (still binding)
The 18 claims deleted Aug 3–5 and the 88 deleted in the dedup STAY DELETED — each his own ruling.
