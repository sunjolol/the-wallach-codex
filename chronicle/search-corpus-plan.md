# The Search Corpus — Doctrine + Fill-Out Plan

_Proposal for Luneth's review (2026-07-09). Once approved, folds into `.claude/rules/` as mining doctrine. Interprets Luneth's intent (2026-07-09): "the search claims should FAR outweigh tier-1 BY DESIGN — search is a catch-all meant to grab almost every conceivable question someone could ask, with REAL valuable info; robust, complete, massive; the wow-factor is accurately spitting back genuinely-helpful Wallach info from a plain-language question. Treat search with the same RESPECT as tier-1." Not the letter — the engineering intent._

## 1. The reframe (what search actually is)

The corpus serves **two consumers**, and I have been building for the wrong one as the default:

- **Tier-1 (operational)** — the structured Conditions / Essentials / Coverage tabs. High-precision, condition→deficiency→dose. A **small, curated slice**. Correctness-gated (`amounts_wallach_only`, `verbatim_names`…).
- **Search / Ask-Wallach** — the offline plain-language helper (eventually an offline LLM). Its job: answer **any** question a user could plausibly ask about Wallach's world, in his voice, with real info. This is the **near-complete knowledge base** — it should approach *everything informative Wallach actually wrote.*

**The correct mental model:** mine for **maximum search coverage first**; tier-1 is the subset that *additionally* maps to an operational condition/essential (a promotion, not the goal). Search is the whole; tier-1 is a carved-out slice. Today the ratio is inverted (186 search / 1060 operational ≈ 15% search); by design it should flip — **because most of what Wallach wrote is educational/narrative/stance content, not operational-mappable.** The ratio is an *outcome* of honest capture, never a padding target.

**Evidence this is the real standard (not a new invention):** the already-mined elements prove it. Mercury = **13 claims** (7 search: what-it-is, how-it-poisons, Chinese alchemists, sources, methyl-mercury-in-fish, dental→antibiotic-resistance, "do vaccines cause autism"; 6 tier-1). Hydrogen = **9 claims** (6 search: what-it-is, Cavendish's discovery, Hindenburg/lifting-power, acid-base role, acid clearance, hydrogen-in-molecules; 3 tier-1). My La/Li/Lu/Mg batches captured only the tier-1 half (~1 search-only across all four). **The standard already existed; I regressed from it.** This plan restores and systematizes it.

## 2. What "search-worthy" means (the inclusion test)

**A statement is search-worthy iff it carries REAL, DISTINCT information that answers a plausible user question about Wallach's world.** Two gates, both required:
1. **Real info** — it teaches something (a fact, stance, mechanism, story, use, warning), not a bare slogan or a raw number with no interpretive value.
2. **Query-plausible** — a real person could ask a question this answers. Think as the user, not the cataloguer.

Both must hold. This is deliberately **broad (catch-all) but not padding** — the "real info" gate is what stops padding.

## 3. The search-worthy claim-type taxonomy (grounded in Wallach's books)

Derived from what the well-mined elements + narrative chapters already capture. In any vein, capture a claim for each distinct instance of:

1. **Basics / definition** — what a substance/element/concept *is*, its key properties ("mercury is the only metal liquid at room temp"; "hydrogen is the simplest atom").
2. **Discovery / etymology / naming** — who found it, when, why it's named that ("magnesium from Magnesia, isolated by Davy 1808"; "lithium from Greek *lithos*, stone, 1817").
3. **Notable uses / cultural references** — real uses + the colorful hooks ("Epsom salts = magnesium sulfate, a wound disinfectant"; "milk of magnesia"; the Hindenburg; "mad as a hatter"; Chinese alchemists' immortality quest).
4. **Biological role / mechanism** — how it works in the body, biochemistry ("hydrogen and acid-base balance"; "magnesium activates numerous enzymes / is in all chlorophyll").
5. **Sources / exposure / abundance in nature** — where it comes from ("7th most abundant element; oceans an unlimited supply"; environmental mercury sources). *Raw ppm tables → ONE summarized "distribution in nature" claim, not a claim per number.*
6. **Stances / "is X good or bad" / "X causes Y"** — Wallach's positions, especially vs. the establishment ("cholesterol is essential"; "carbs are not essential"; "magnesium deficiency, not cholesterol, hardens arteries").
7. **The big questions** — the topics people most search: vaccines↔autism, cholesterol, fluoride, specific diseases. **Deliberately captured** — these are the wow-factor moments.
8. **Anecdote / biography / credentials / vindication** — the 20,000 autopsies, the FDA omega-3 win, patient stories that reveal his reasoning.
9. **Warnings / toxicity / contraindications / interactions** — even when also tier-1 (dual-home).
10. **Body content / physiology facts** — normal levels, distribution ("adult body holds 20-28 g magnesium, 60% in bone").

Anything mapping to an operational condition/essential is **dual-homed**: it stays searchable AND gets tier-1 treatment (conditions/essentials populated, no `search-only` tag). Everything else searchable is tagged `search-only`.

## 4. Exclusions (kept deliberately narrow)

Skip ONLY:
- **Raw reference tables** with no interpretive value (bare geology ppm lists) — replaced by one summarized distribution claim, never dropped wholesale.
- **Navigational / structural** text — TOC, index, page numbers, the references list.
- **True verbatim duplication** already captured — dedupe, favor the newest book for placement, keep the older (per existing doctrine).
- **Non-Wallach filler** — e.g. the iaiyh "General Overview" industry boilerplate (not his words).
- **Contentless slogans** — a repeated assertion that informs nothing new ("everyone dies of a deficiency" for the Nth time).

When unsure whether something clears the bar → **capture it** (over-capture is recoverable; a dropped answer is a hole in the wow-factor). Escalate genuinely charged/editorial content per the fringe rules.

## 5. Granularity + quality (search gets the SAME respect as tier-1)

- **Granularity:** ~one claim per distinct informative statement / paragraph-idea (the mercury/hydrogen cadence). Not one-claim-per-sentence padding; not one-claim-per-page under-capture.
- **Same schema + rigor:** summary-then-verbatim, byte-faithful verbatim, jargon glossed, routed through `corpus_extract → seal`, same round-close gates + render probe. A search claim is a first-class claim that happens to carry `search-only`.
- **Front-facing quality:** the summary reads in clean modern voice (a real answer), never internal refs; display names human.

## 6. Retrieval quality (what makes it actually answer questions)

Capture is half; **retrieval** is the wow-factor. Every search-worthy claim carries routing metadata so a plain-language query finds it:
- **`search-topic:<topic>` tags** — the question-space handles (`search-topic:vaccines-autism`, `search-topic:cholesterol`, `search-topic:epsom-salts`). Already in use (homosexuality/intersex cross-tagging). Standardize a growing controlled vocabulary.
- **Substance / concept tags** — the element/nutrient/concept the claim is about.
- These feed the current hidden `data-search` blob and the future offline-LLM index. **Good tagging is not optional** — an un-findable claim is a hole even if captured.

## 7. Completeness enforcement — treating search with the same RESPECT (the hard part)

Tier-1 *proves* its correctness with gates. Search must *prove* its completeness. Full semantic completeness can't be a single machine check — so a **layered** system, honest about what is gated vs. disciplined:

**Layer 1 — no page silently skipped (LIVE today).** `mining_coverage_accounted` + the vein-map already ensure every page is claim-bearing OR reviewed-empty+reason. Keep.

**Layer 2 — no page silently UNDER-mined (NEW, machine signal).** Add a `search_density_report`: per mined page/section, compute claim density (claims per ~1k words) and **flag outliers far below the corpus median** (calibrated from the well-mined elements: ~8-13 claims/element, ~1 per 150-250 words). **Informational, not a hard fail** — a hard floor would breed padding (the same reason rule-7 has no length floor). It surfaces "these pages look thin, re-review" at round-close. Catches gross regressions like La/Li/Lu automatically.

**Layer 3 — the question-inventory (NEW, structured discipline).** For each mined region, enumerate the **questions it can answer** (a short list — the concrete form of "catch-all"), and verify each maps to ≥1 claim before the region is "done." This turns "did we get everything?" from a vibe into a checklist. The inventory is authored as we mine and stored alongside the vein-map. It doubles as the G-7 test battery.

**Layer 4 — Search-as-harness (G-7, the ultimate validator — Luneth's own sequencing).** Once Search exists, run the accumulated question-inventories (+ freely-invented plausible questions) against it. **Any question the book demonstrably addresses but Search answers poorly = a gap → backfill.** This is the real completeness proof: the corpus is "complete enough" when Search stops surfacing answerable-but-unanswered questions. Seal the books only after this converges.

**Honesty:** Layers 3-4 are review/harness discipline, not pure machine gates (labeled WISH per R7) — the semantic "is every valuable claim captured" judgment stays human + harness-validated, exactly as the fringe/editorial calls do. Layer 2 is the machine tripwire that makes silent under-capture visible.

## 8. Codification (§00.B — codify, don't promise)

| Mechanism | Type | Status |
|---|---|---|
| `mining_coverage_accounted` (no page skipped) | machine gate | LIVE |
| `search_density_report` (under-mine outliers) | machine signal at round-close | NEW — build |
| `search_topic_tag_hygiene` (every `search-only` claim has >=1 routing tag) | machine gate | NEW — build |
| Question-inventory per region | structured discipline | NEW — adopt |
| Search-as-harness gap-loop (G-7) | harness validation | WISH until Search exists |
| Search-worthiness + inventory judgment | review discipline | WISH (semantic; harness-validated) |

## 9. Rollout

1. **Approve + codify** this doctrine → fold into `.claude/rules/mining-veins.md` (or a sibling `search-corpus.md`), update the vein-map schema to hold a per-region question-inventory.
2. **Backfill the regression:** re-mine La / Li / Lu / Mg to the element standard — add the missing search-only claims (basics, discovery/etymology, uses, biological role, sources, big-questions). ~+6-8 claims per element. One seal.
3. **Search-first from Mn onward:** every vein captures the full taxonomy; tier-1 is the promotion. Author the question-inventory as we go.
4. **Build `search_density_report` + `search_topic_tag_hygiene`** (Layer 2 + tag hygiene) so under-capture and un-findable claims are visible immediately.
5. **G-7 Search-harness** validates the whole corpus; its gap-loop drives final backfill before seal.

## 10. The one-line standard

> **Mine so that if a user could plausibly ask Wallach about it and his books answer it, our search has that answer — captured faithfully, tagged findably, and held to the same standard as tier-1.** Skip only raw tables, navigation, exact duplication, and non-Wallach filler.

---

### Open questions for Luneth
1. **Backfill scope:** re-mine La/Li/Lu/Mg to the full standard now (recommended — closes the regression), or only apply going-forward from Mn?
2. **Density signal:** OK to build `search_density_report` as an informational outlier-flag (not a hard fail), to avoid breeding padding?
3. **Question-inventory:** do you want the per-region question list authored + stored (feeds G-7), or is that overhead you'd rather skip until Search exists?
4. **Where to draw the "raw table" line:** confirm the split — summarize distribution/abundance into one claim, skip the bare ppm rows. Agree?
