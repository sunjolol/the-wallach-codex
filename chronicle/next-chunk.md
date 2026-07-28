# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-27 · QUALITY-REMEDIATION SESSION)

# ★★★★★ READ FIRST (plain language)
Two doctrines still bind from before:
1. **"search-only" is DEAD.** Every claim lives in ONE of three homes — the 90 essentials, conditions,
   or Explore — and Search is a retrieval layer over all three. NEVER reintroduce a search-only tag/split.
2. **Wallach's supplement thesis:** essential nutrients come from the **DIET (food OR supplements)**, never
   "from food" alone — the soil is depleted, so food no longer suffices. Never write "must get X from food."

**Corpus: kv420 · 2195 claims · board 76/76 green.**

## ★ WHAT THIS SESSION FIXED (Luneth-directed quality remediation, all sealed + pushed)
Luneth caught a batch of real defects; every fix was proven mechanically (not asserted):
- **Glossary:** removed **45** too-basic dotted-line terms (kept anemia/antibiotic/antioxidant/thyroid/
  thyroid-hormone); removed the **"WHO" alias** that fired a hover on every pronoun "who" (root cause:
  `state/glossary.ts::normKey` lowercases all keys — a caps-only match would need an engine change);
  fixed **12** "from food"→"the diet" definitions (essential-nutrient uses his exact wording). 1243 terms now.
- **Questions:** capitalized **25** lowercase-first questions (0 remain in built index).
- **"From food" thesis violations:** 5 answer_short + 4 sealed claim_text fixed (kv418). 0 remain.
- **Says-nothing:** rewrote **ALL 100** flagged claim_texts (27 pure-restatement + 73 mirror) into real,
  Wallach-faithful answers grounded in each claim's own source span (kv420). Verbatims untouched.
  Anti-fabrication number-check: 0 fabrications. 0 un-enrichable.
- **Sweep:** 6 also_about cross-links (citrulline/nitric-oxide/melatonin/acetylcholine/DHA).
- `invariants.py`: added "arthritis" to `_JARGON_SKIP` (R9, with reason).

## ★★★ CHARGED-CLAIMS DECISION — RESOLVED (Luneth ruled 2026-07-27)
The 3 fetal-testosterone→homosexuality/intersex claims (`WAL-CLM-EPIGEN-000008/21/25`) exposed to the
Conditions tab when search-only died: **Luneth ruled KEEP them on the condition pages with the mapping.**
No further action; do not re-surface this as a pending decision.

## DEFERRED / FOLLOW-UPS
- ★ **render_probe_search stale baselines:** it asserts cancer=65 and calcium=134, but live is 71 / 145.
  PROVEN pre-existing (identical at HEAD/kv417 — last session's search-only rip-out grew them, probe not
  updated). NOT a regression. Update the two hardcoded counts in `tools/render_probe_search.js` (65→71,
  134→145) after confirming those are the intended "show ALL" totals.
- ★ **Glossary:** Luneth ruled on the ~50 flagged-basic candidates. The FULL 1243-term list
  (`temporary/entity-fill/…` / regenerate via the audit) may still merit a broader pass for other too-basic
  terms he hasn't seen yet — ask before mass-removing.
- **Entity-fill campaign (STILL PENDING, pre-empted by the remediation):** ~13 of the original 18 newly-mined
  entities still need filling — ornithine/citrulline/nitric-oxide were found THIN (corpus supports only 1-2
  claims each; the biochem cluster is genuinely sparse). Richer targets remain: nitrates (11), protein (44),
  tuna, coenzyme-a. Per [[mining-serves-ask-wallach]] do biggest/most-searched first.
- **Consider a machine gate** to prevent says-nothing / lowercase-question / from-food recurrence (§00.B
  codify-don't-promise) — Luneth was open to it. A claim_text≈verbatim similarity gate is the candidate.
- Memory index ~large — consolidate at a natural break ([[memory-consolidation-threshold]]).
