# Element Enrichment Blueprint — the 91-card enriched-claim + design build-out

_Active plan. Created 2026-07-25 (Luneth). Temporary + living: pruned as tiers land. The durable rule spine is `.claude/rules/search-corpus.md` + `.claude/rules/mining-veins.md`; this doc is the campaign map for ONE initiative — giving every element detail card the "omega treatment," done right._

## The mission (Luneth's words, distilled)
Give **every** element the special treatment omega-3/6 got — **adapted to the unique attributes of that element, never as memification.** Two layers per element, built in **lockstep** (one element to 100% before the next):

1. **Enriched claims** — ≥7 (ideally 9–12, never padded) faceted search claims surfaced at the top of the element card ("Worth knowing"). Highest-quality, dual-purpose: card wow-factor **and** Ask-Wallach search. **Search enrichment is the FIRST priority** — and because an enriched card-claim *is* a search-index claim, the two are ONE write, not a tradeoff.
2. **Design element** — a unique, data-driven illustrative treatment explaining what the element is / why it matters, in the spirit of the omega, ORAC, and absorption screens — **learned from, never copied.**

## The locked decisions (2026-07-25)
- **Pilot-first, then scale.** Build ONE flagship element fully, lock the repeatable recipe against Luneth's review, then roll tier by tier.
- **Pilot = selenium** (Wallach's signature mineral; 105 claims = deepest wow-factor material).
- **Lockstep** — each element finished fully (enriched claims + its design element) before the next.
- **Budget discipline** — this campaign stays far under Luneth's weekly cap. The real bottleneck is his review throughput, not tokens (see § Cadence). Warn before any large agent fan-out.

## The gap (measured 2026-07-25, not estimated)
Enriched claims live in each essential's `search` field (`eden/corpus/search-enrichment.json` → `search_index_derive.py` → the `search` array in `entity-page-data.json`, rendered as the "Worth knowing" cards by `views/entity-page.ts`).

| Enriched claims today | # of 91 | Which |
|---|---|---|
| 7+ | 1 | calcium (8) |
| 4–6 | 5 | hydrogen, germanium, potassium, iron, iodine |
| 1–3 | 8 | cobalt, chromium, copper, aluminum, gold, gallium, carbon, silver |
| 0 | 77 | everything else — incl. selenium, zinc, magnesium, ALL vitamins, ALL amino acids, omega-3, omega-6 |

- **Total enriched claims that exist: 52.** Target build-out ≈ **550–600 new** enriched claims across the campaign.
- **Omega-3/6 have the DESIGN layer but 0 enriched claims** (`fatty-acid-clarity-data.json` is design-only). Both layers are near-zero everywhere — this is a full build-out, not a top-up.

## Two architecture facts that shape everything
1. **Enriched claim == search claim.** Authoring one `search-enrichment` entry (subject/also_about/facet/question/answer_short/topics over a sealed search-only claim) populates the element card AND Ask-Wallach in the same write. Search-first free-rides the card work.
2. **Design is DATA, never per-element code.** `entity-page.ts` is a pure projection (`entity_render_is_projection`). Omega's screen = `fatty-acid-clarity-data.json` + one reusable render block, chosen by data presence — NOT a per-slug branch. Each element's design element is authored as its own data slot (+ a reusable render block where a new visual form is needed) so the projection invariant stays green.

## The tiers (raw material sets the ceiling — never pad, never force)
Corpus depth per element ranges 1→108 claims. Target scales to what Wallach actually wrote.

- **Tier A — claim-rich (~20, 50+ claims): target 9–12.** selenium(105), zinc(108), magnesium(88), omega-3(83), vitamin-c(73), vitamin-a(69), vitamin-e(68), chromium(61), copper(59), vitamin-b6(49), vitamin-b12(37), vanadium(33), iron(29)*, iodine(26)*, vitamin-b3(25), vitamin-b9(24), vitamin-b1(21), germanium(21)*, manganese(19), flavonoids(17). (*already partly enriched — top up.)
- **Tier B — medium (~30, 10–49 claims): target 7–9.** the remaining vitamins, sodium, oxygen, phosphorus, boron, lithium, cobalt, potassium(top-up), calcium(top-up, already 8), silver, tin, sulfur, choline, phenylalanine, tryptophan, etc.
- **Tier C — thin (~40, <10 claims): as-available, often <7 (honest).** most amino acids, biotin/inositol/vitamin-k, and the ~35 rare-earths. **Lean on the existing shared plant-derived-mineral GROUP treatment** (`group_record`, 32 claims / 10 facets already covers them collectively) rather than forcing thin individual pages. New light mining only where a real question is unanswered.

## The per-element recipe (WORKING draft — the selenium pilot finalizes it)
For each element, in lockstep:
1. **Question inventory (L3).** List the real questions a person types about this element that Wallach's books answer — the exact-words `question` field is the highest-weighted search signal. Ground every one in real book content; never invent to fill a facet.
2. **Candidate claims.** Pull the element's mapped claims (record + also_about + subject) from the sealed corpus. Prefer existing sealed claims; mine NEW from the books only where a real question is unanswered (never-guess; surface every uncertainty; UNREADABLE over a guess).
3. **Author enriched claims (7–12).** Per the enrichment template: `subject` · `also_about[]` · `facet` (closed taxonomy) · `question` (exact user words) · `answer_short` · `topics[]`. Rich LAY synonyms on the entity (the single biggest routing lever). `answer` (modern voice) + `verbatim` (byte-faithful) derive/stay contained (R3/R4).
4. **Colorful spread, never memified.** Aim for ≥1–2 claims across the facet families (what-to-do / how-it-works / Wallach's-stance / history-&-lore / etc.). But **stay liquid**: if the element legitimately has 20 solid claims in one facet, that's what it is — don't force categories, and don't stop at 1-of-each when more real material exists.
5. **Design element.** A data-driven illustrative treatment adapted to THIS element's story (selenium ≠ omega ≠ a rare earth). Authored as a data slot + reusable render block; projection-safe.
6. **Review with Luneth (non-negotiable gate).** Present each batch as Q → answer_short → [full answer if needed] → verbatim quote. He ratifies the CLAIM. Small batches, every time.
7. **Seal + round-close.** `corpus_seal` (user-only) → build → invariants → render probes → build-log → Creator's Log → re-inline build → commit + push.

## Cadence — optimize Luneth's review, not drafting speed
Agents draft dossiers fast + cheap; **his Q→short→full→quote review is the throughput limit**, which makes this multi-week regardless of compute. So: agents pre-curate hard, surface every uncertainty explicitly, and hand him clean, colorful, verified batches. Batch size = whatever he can review well in one focused sitting (calibrate on the selenium pilot). Never seal unreviewed.

## Enforcement (gates that already bind this work)
`search_index_wellformed` (facet ∈ taxonomy · subject/also_about resolve · structured non-blob) · `search_only_indices_excluded` (search claims never feed operational tabs) · the R5 mine-gate family (verbatim ⊆ source · citation ∈ registry · mappings ∈ catalog · prose-contained) · `entity_render_is_projection` (design stays data-driven) · `mining_coverage_accounted` (no silent page drop) · the seal hash gates. Discipline (WISH, R7): never-guess + the manual review gate rest on Luneth's pass — no machine check proves a byte-present number was READ not GUESSED.

## Status
- [x] 2026-07-25 — Scope + gap analysis + tiers + decisions locked.
- [ ] Selenium pilot — full enriched set (9–12) + design element → review → seal → recipe FINALIZED here.
- [ ] Tier A rollout.
- [ ] Tier B rollout.
- [ ] Tier C rollout (+ rely on the PDM group treatment for thin rare-earths).
