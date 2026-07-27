# Next chunk — ★ AUTHORITATIVE HANDOFF (updated 2026-07-27 · SEARCH-ONLY DOCTRINE KILLED)

# ★★★★★ READ FIRST (plain language)
The "search-only" concept is **DEAD** as of this session. For weeks a tag silently hid ~1,000 Wallach
claims from the tabs where they belong. Luneth caught it. **Search is NOT a separate silo — it pulls
from the same three homes as every tab: the 90 essentials, conditions, and Explore.** Every claim now
lives in one of those three homes. NEVER reintroduce a "search-only" tag or the tier-1/tier-2 split.

**Corpus: kv417 · 2195 claims · board 76/76 green.**

## ★ THE NEW MODEL (how mining works now)
- A claim's HOME = its subject's entity type: `nutrient`→Essentials tab, `condition`→Conditions tab,
  everything else (`topic/concept/element/substance/person`)→Explore tab.
- On each essential/condition page: **Worth Knowing = enriched claims** (by subject, from search-enrichment.json);
  **The Full Record = every operationally-mapped claim** (by `essentials[]`/`conditions[]`, by kind).
- To home a claim: give it an enrichment `subject` (→ Worth Knowing + Explore/tab) AND/OR an operational
  `essentials[]`/`conditions[]`/`symptoms[]` mapping (→ The Full Record). A claim can be BOTH (dual-home).
- **There is no `search-only` tag, no `search_only_indices_excluded` gate, no corpus_derive tier-2 strip.**
  All removed 2026-07-27. Doctrine lives in `.claude/rules/search-corpus.md` (§ "The three homes").

## ★★★ PENDING DECISION FOR LUNETH (do not act unilaterally)
Removing search-only exposed **3 CHARGED claims** to the operational Conditions tab:
- `WAL-CLM-EPIGEN-000008` → homosexuality · `WAL-CLM-EPIGEN-000021` → intersex/homosexuality · `WAL-CLM-EPIGEN-000025` → intersex
These are Wallach's fetal-testosterone→homosexuality/intersex "congenital defect" thesis. They were
search-only (hidden from browse); now they map those catalog conditions operationally. Per
[[charged-content-2026-07-26-update]] they stay included + LISTED for you. **Luneth: keep on the condition
pages / drop the condition mapping / hide them?** (The 33 mundane verbatim-name violations were baselined
— same class as the 183 already tolerated.)

## What shipped this session (kv410 → kv417)
- **Entity-fill batch 1** (a868eeea, kv416): serotonin 1→5, testosterone 1→6, korsakoff 1→8. 5 new claims
  + 3 dual-homes + 8 cross-links.
- **Search-only rip-out + 64-orphan homing + memory-loss family** (kv417, THIS commit): killed the doctrine
  (strip + gate + 1,060 tags + docs); homed 64 orphans into 15 NEW Explore pages (minerals, soil-depletion,
  longevity, genetic-potential, iatrogenic-medicine, rda-critique, hair-analysis, centenarian-cultures; lead,
  radon, thallium, xenon; antidepressants, pelvic-floor-exercises, cranial-nerves); shipped memory_loss +
  alzheimers as catalog_ref entities (four-dementias overview, vascular folded in, 3 fresh DDDL claims).
  Board 76/76; live-verified Explore 88→103 chips.

## DEFERRED / FOLLOW-UPS
- ★ The 3 charged claims above — Luneth's ruling.
- **Entity-fill campaign continues:** the other ~13 of the original 18 newly-mined entities still need filling
  to their full unique-claim set (ornithine, citrulline, nitric-oxide, melatonin, coenzyme-a, acetylcholine,
  GLA, DHA, nitrates, nitrites, tuna, berylliosis, silver-nitrate, arsenic-trioxide, protein[44 candidates]).
  See `temporary/entity-fill/inventory.md`. Now: home each claim (subject + operational mapping), NO search-only.
- Cosmetic: inert `tier` labels remain in corpus_embed.py / coverage_layout_derive.py / search_index_derive.py
  (vacuous after the tag strip — all claims are tier-1 now). Safe to clean up anytime.
- Broader: keep making Ask-Wallach magical ([[mining-serves-ask-wallach]]); every mined claim gets a home.
- Memory index ~24KB — consolidate at a natural break ([[memory-consolidation-threshold]]).
