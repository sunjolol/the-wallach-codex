# Phosphorus — header research dossier

> ## ⚠⚠ CORRECTED 2026-08-10 — READ THIS BLOCK BEFORE ANYTHING BELOW IT
>
> The body of this dossier was written against **13 claims**. The sealed corpus holds **34**
> (`PYTHONUTF8=1 python tools/claim_review.py --entity phosphorus`). Everything below is a head
> start only; three of its §5 "not verbatim-safe" flags are **FALSE**, and it never reached the
> best material in the entity. Design off `claim_review.py`, never off this file.
>
> **Flags below that are wrong:**
> - §5 says the **15–20:1 inversion** is claim_text-only and appears in no verbatim. It is
>   **verbatim** in `WAL-CLM-DDDL-000253`: *"The correct calcium/phosphorus ratio is 2 calcium/1
>   phosphorus (most American diets are 15-20 phosphorus/ 1 calcium)"*. Usable as a hard figure.
> - §5 says the **B-complex/phosphorus coenzyme tie** is claim_text-only. It is **verbatim** in
>   `WAL-CLM-DDDL-000248`, which also carries **the blood's major buffer system** verbatim — the
>   other thing §5 says not to put on a label. (§5 is right that neither is in `RARE-000204/205`;
>   it is wrong that neither is anywhere.)
> - §5 says "nutritionists ignore it" is not verbatim-safe. It is **verbatim** in
>   `WAL-CLM-DDDL-000246`.
>
> **Material the dossier never found, all verbatim, all stronger than what it recommends:**
> - `DDDL-000250` — **his food ratio table**: grain 1:8 · red meat 1:12 · organ meat (liver,
>   kidney) **1:44** · fish 1:12 · carbonated drinks 1:8, closing *"the more meat you eat, the
>   more calcium supplementation you need."* This is the best data figure the element has.
> - `DDDL-000180` — **"You would have to eat 25 pounds of broccoli every time you ate a 16 oz.
>   steak!"** The most quotable line in the entity.
> - `EPIGEN-000337` + `IMMORT-000378` — **the 1669 naming**: Hennig Brand(t), boiled-down urine
>   (+ beach sand), the residue that *glowed in a dark room*, named for Greek **"I bear light"**,
>   bursting into flames in warm air. ⚠ **Epigenetics spells him Brandt and calls him an
>   alchemist; Immortality spells him Brand and calls him a physician.** Flag it, never pick one
>   silently.
> - `DDDL-000254` — **osteophagia**: LeVaillant (1796), cattle in phosphate-deficient South
>   African pastures hunting discarded bones, chewing wood and each other's horns; reported in
>   reindeer, caribou, red deer, camels, giraffe, elephant, wildebeest.
> - `HELLS-000064` / `HELLS-000029` — **iron + phosphorus deficiency together** producing *"an
>   almost psychotic binge eating and soft drink consumption rampage that results in morbid
>   obesity."* Obesity as a mineral-deficiency disease.
> - `IMMORT-000070` — **doubling phosphate intake raises urinary calcium output by 50%**
>   (and salt: 96 → 148 mg/day). Hard mechanistic numbers.
> - `DDDL-000252` — his **livestock** deficiency signs (pica, cribbing, fractures), which pair
>   against the 13 human signs in `LETS-000023`. `pica` is the only word on both lists.
>
> **⚠ Possible duplicate, needs per-claim approval — not touched.** `HELLS-000029` and
> `HELLS-000064` carry the **same verbatim from the same book**, differing only in `subject`
> (iron vs phosphorus). Neither is superseded. Route through the duplicate-review process.
>
> **Target verified 2026-08-10** against `essentials-targets-data.json` provenance, not this
> file: `kind: wallach`, `low: 0.0`, unit mg, daily, `source_claim_id: WAL-CLM-LETS-000061`.
> The dossier's §4 "why this number" is sound and survives.
>
> **Demos built and APPROVED 2026-08-10:** `temporary/awaiting-refinement/phosphorus-demos-r2.html`
> (6 concepts, reader-driven), built by `temporary/build-scripts/phosphorus-r2-build.py`. Luneth:
> *"This is good enough."* It designs off the corrected material above, not the four concepts in §2.
>
> **⚠ r1 was REJECTED outright** — *"absolutely hideously ugly and childish illustration ... the rest
> are just boring walls of text"* — and now sits in
> `temporary/recycling-bin/_superseded/2026-08-10-phosphorus-rejected-r1/`. **Do not rebuild from it.**
> Its two causes are recorded in `chronicle/next-chunk.md` and in the `element-headers` skill:
> (1) it drew the noun from its own headline as cartoon canvas blobs, and (2) it set every headline
> with `.kd-ep-fam__kill`, which an ID rule pins to 1.14rem, so four panels read as documents.

> status: RESEARCH (concepts only — NOT designed). **34** sealed claims (this file was written against 13) · mineral · target: 0.0 mg/day — the one essential Wallach tells you NOT to supplement.
Phosphorus is the outlier of the 90. Almost every element's header is built around a positive daily target the user should reach. Phosphorus's Wallach target is an affirmative **zero** (WAL-CLM-LETS-000061): you already get a large excess, and the excess is the problem. That inversion is the single most distinctive thing the corpus supports, and it is unlike any of the six shipped headers.

## 1. The material (grounded, by angle)

**Core identity — the busiest mineral you must not add.**
Wallach calls phosphorus a major structural mineral of bone and teeth that "has more functions in the human than any other mineral" — a constituent of nucleic acids (DNA/RNA), an enzyme activator, a driver of several steps of the ATP energy cycle, and part of red-blood-cell metabolism (WAL-CLM-RARE-000204). Yet in his Base Line Nutritional Supplement Program the phosphorus row is `0.0 0.0` — no supplemental need at all (WAL-CLM-LETS-000061). The paradox (most jobs / zero supplement) is the spine of the whole entry.

**Abundance — second only to calcium, and bonded to it.**
Phosphorus is "second in abundance only to calcium," making up **22 percent** of the body's total mineral content, ~**800 grams** ("just short of two pounds"), of which **700 grams** sits in bones and teeth as insoluble calcium phosphate — apatite crystals (WAL-CLM-RARE-000205). Note the bond: bone mineral *is* calcium + phosphorus fused together (apatite). They are structural partners in the skeleton.

**The ratio — partners in bone, rivals in the bloodstream (THE signature mechanism).**
The ideal dietary calcium-to-phosphorus ratio is **2:1**, but that ratio "is not found naturally in the human diet without proper supplementation and avoidance of high-P junk food such as soft drinks" (WAL-CLM-EPIGEN-000147); Wallach flatly calls 2:1 "impossible to attain in an unsupplemented diet" (WAL-CLM-DDDL-000052). Excess phosphorus raises the body's calcium requirement and aggravates osteoporosis, arthritis, high blood pressure and loose teeth (WAL-CLM-RARE-000206). His toxicity list runs: calcium malabsorption, loose teeth, osteoporosis/arthritis, secondary hyperparathyroidism, tooth loss, weight loss (WAL-CLM-LETS-000024). The through-line: it is the phosphorus-to-calcium *balance*, not calcium intake alone, that governs bone health.

**Absorption — same element, wildly different uptake by form.**
Average dietary intake is 1,000–1,500 mg/day; absorption depends heavily on form — metallic P only **3–5%** in adults (8–12% in infants), chelated forms **40–50%**, and colloidal P up to **98%** — with optimal absorption of metallic/chelated P at a Ca:P ratio of 1:1 (WAL-CLM-RARE-000207).

**Deficiency — rare, but when it comes, it is an energy blackout.**
Deficiency is "widespread, universal and ultimately fatal," driven chiefly by a drop in ATP synthesis — "complete metabolic energy failure" — with neuromuscular, skeletal, blood and kidney disease (WAL-CLM-RARE-000208). The clinical sign list: anorexia, anxiety, apprehension, bone pain, dyspnea, fatigue, irritability, numbness, paresthesias, pica, tremulousness, weakness, weight loss (WAL-CLM-LETS-000023). Clinical depletion / hypophosphatemia comes from IV glucose or TPN without P, excess antacids, hyperparathyroidism, mistreated diabetic acidosis, diuretics, sweating in exercise, and alcoholism (WAL-CLM-RARE-000209).

**Curios / surprising facts.**
- **Pica has a phosphorus form.** Wallach frames pica (craving and eating bizarre non-food substances) as a mineral-deficiency behavior, and ties the phosphate-deficiency form of pica specifically to **South Africa** — one entry in his atlas of regional mineral-deficiency diseases alongside Keshan (selenium) and enzootic ataxia (copper) (WAL-CLM-IMMORT-000213).
- **Vegetarians rarely go short of it** — but their high phytic-acid intake means they "always have other mineral deficiencies" including Ca, Cu, Cr, V, Li and Zn (WAL-CLM-RARE-000210). Phosphorus is the one mineral a plant-heavy diet does *not* strip.

## 2. Four header concepts (genuinely distinct)

### A. "The one you already have too much of" — the tilted scale *(recommended lead)*
- **The hook** — Every other essential, you're chasing a number. Phosphorus, you're drowning in it — and the surplus is quietly stealing your calcium.
- **Layout shape** — A single dominant balance-beam figure across the top, with a short "ideal vs. modern diet" caption pair beneath it, closing on the payoff line that this is why the daily target is zero. No beats-roster.
- **Illustration** — One balance/scale, two states shown as a before→after tilt. The ideal beam sits at **Ca 2 : P 1** (WAL-CLM-EPIGEN-000147 / WAL-CLM-DDDL-000052); the modern beam is slammed down on the phosphorus side, with a small calcium block sliding *off a bone* toward the heavy pan — Wallach's "excess P pulls calcium out of the bone" made literal (WAL-CLM-LETS-000061 stance; WAL-CLM-RARE-000206). Keep it to the beam + two pans + one bone; route the "2:1 / soft drinks, red meat, grain" labels *beside* the pans, never across the beam.
- **Anchored by** — 2:1 ideal (WAL-CLM-EPIGEN-000147, WAL-CLM-DDDL-000052); excess raises Ca requirement → osteoporosis/arthritis/BP/loose teeth (WAL-CLM-RARE-000206); target 0.0 + "diet already supplies a large excess" (WAL-CLM-LETS-000061); toxicity = calcium malabsorption + bone loss (WAL-CLM-LETS-000024).
- **Why it wows / best UX** — It resolves the "why is the target zero?" question *visually and immediately*, turning what looks like missing data into the most memorable fact about the element. It is the only header in the set whose whole point is subtraction, not a number to hit. Uniquely phosphorus.

### B. "More jobs than any mineral — zero on the supplement list" — the paradox
- **The hook** — The mineral that does the most is the mineral you add the least.
- **Layout shape** — Left side: a compact stack of phosphorus's roles. Right side (or below): one oversized `0.0`. The tension between a long capability list and a zero recommendation *is* the composition — the list earns the punchline.
- **Illustration** — Minimal, typographic. The list of roles set small and dense, resolving into a single large `0.0 mg / day` with a one-line gloss ("because your diet already floods you with it"). No station-diagram — the roster is text, the figure is the zero.
- **Anchored by** — "more functions in the human than any other mineral," nucleic acids / enzyme activation / ATP energy cycle / RBC metabolism / bone-and-teeth structure (WAL-CLM-RARE-000204); the ATP-failure stakes if it *does* run short (WAL-CLM-RARE-000208); the `0.0 0.0` supplement row (WAL-CLM-LETS-000061).
- **Why it wows / best UX** — Turns a "boring" ubiquitous mineral into a curiosity: the reader expects a nutrient's importance to track how much you should take, and phosphorus breaks that expectation. Fast to skim, one idea.
- **Caution** — Do not hard-anchor the "B-complex vitamins act as coenzymes only when combined with phosphorus" or "nutritionists ignore it" lines to a figure label; those are in the claim_text of WAL-CLM-RARE-000204 but **not in its verbatim** (see §5). "More functions than any other mineral," DNA/nucleic acids, enzymes, ATP and RBC *are* verbatim-safe.

### C. "3% to 98% — it all depends on the form" — the absorption ladder
- **The hook** — The same mineral can be nearly useless or almost fully absorbed, decided entirely by its form.
- **Layout shape** — A three-rung vertical climb, one rung per form, lowest to highest, with the intake figure as a framing caption. Reads as a staircase of uptake.
- **Illustration** — Three stacked bars / steps sized to the percentages: metallic **3–5%** (a sliver), chelated **40–50%** (mid), colloidal **98%** (nearly full) — one figure, three elements, labels to the right of each bar so no stroke crosses text (WAL-CLM-RARE-000207).
- **Anchored by** — metallic 3–5% (infants 8–12%), chelated 40–50%, colloidal 98%, optimal at Ca:P 1:1, intake 1,000–1,500 mg/day (all WAL-CLM-RARE-000207).
- **Why it wows / best UX** — A clean, honest data figure with a big spread (a 20-to-30× swing) that teaches bioavailability at a glance, and quietly makes the case for colloidal delivery. Distinct figure type from A, B, D.
- **Caution** — This is a strong *figure* but a weaker *identity* for phosphorus specifically: since the target is 0.0, absorption is less "how to hit your number" than "how the balance works." Best as a lead only if Luneth wants the data-figure register; otherwise a strong supporting/secondary block.

### D. "Locked in bone, loose in the blood" — the two-state
- **The hook** — Calcium and phosphorus are welded together in your skeleton and at war everywhere else.
- **Layout shape** — Two panels, one story: PANEL 1 the skeleton as the alliance (apatite), PANEL 2 the bloodstream as the rivalry (excess P leaching Ca). A connective sentence carries the turn, not a divider.
- **Illustration** — Panel 1: a bone cross-section labelled *calcium phosphate / apatite*, with the "700 g of 800 g lives here" figure (WAL-CLM-RARE-000205). Panel 2: the same two minerals now opposed — phosphorus up, calcium being drawn out of the bone (WAL-CLM-RARE-000206, WAL-CLM-LETS-000024). Two clean vignettes, one mineral pair.
- **Anchored by** — second in abundance / 22% / ~800 g / 700 g as apatite (WAL-CLM-RARE-000205); more functions than any mineral / structural in bone (WAL-CLM-RARE-000204); excess P → osteoporosis/arthritis/loose teeth (WAL-CLM-RARE-000206); toxicity/hyperparathyroidism (WAL-CLM-LETS-000024).
- **Why it wows / best UX** — Gives the calcium relationship a *narrative arc* (partners → rivals) rather than a single scale, and grounds the whole entry in a concrete body location. Complements calcium's shipped "where it lives" header without copying it (calcium's is an abundance map; this is a relationship story).
- **Overlap note** — Shares the calcium-ratio material with A. If A is the lead, D would restage the same antagonism; pick one of {A, D} as the calcium-relationship header and let the other slot go to B or C.

## 3. Proposed lede (PROPOSAL — Luneth ratifies)

Both in the shipped voice; both sit above "At a glance" and avoid restating a concept's opening beat.

1. *(identity-forward — pairs best with lead A or C, keeps the paradox for the header body)*
   "Second in abundance only to calcium — nearly two pounds of you, most of it fused with calcium in the hard mineral of bone and teeth — phosphorus runs more of the body's chemistry than any other mineral, from your DNA to the ATP that powers every cell." (WAL-CLM-RARE-000205; WAL-CLM-RARE-000204)

2. *(paradox-forward — do NOT use if concept B leads, it would pre-empt B's beat)*
   "The mineral second only to calcium in your body, and its partner in the mineral of bone — yet the one Wallach says never to add, because the modern diet already delivers a heavy surplus that works against your calcium." (WAL-CLM-RARE-000205; WAL-CLM-LETS-000061; WAL-CLM-RARE-000206)

## 4. Proposed "why this number" (PROPOSAL)

The number is not a gap — it is an **affirmative zero**. `target.kind` is `wallach`, `low` is `0.0`, and it comes straight from the dose row `PHOSPHORUS 800 mg 0.0 0.0` in Wallach's Base Line Nutritional Supplement Program (WAL-CLM-LETS-000061); the `800 mg` in that row is the government RDA he reprints only to argue against, and both his own figures — True Supplement Need and 30-day pharmacologic dose — are 0.0. There is no range, IU factor, body-weight scale or rounding to walk through: Wallach recommends *no supplemental phosphorus at all*, because the ordinary diet already supplies a large excess (he puts the ideal calcium-to-phosphorus ratio at 2:1 — WAL-CLM-EPIGEN-000147, WAL-CLM-DDDL-000052 — and warns the excess pulls calcium out of the bones). So the daily target reads 0 mg: the work with phosphorus is not adding more, it is restoring the balance by supplementing calcium.

## 5. Gaps / flags

- **claim_text-beyond-verbatim (WAL-CLM-RARE-000205).** The claim_text adds "the remainder is biologically active phosphorus combined with carbohydrates, lipids, and proteins, and it forms the blood's major buffering system." That buffering-system / biologically-active-remainder detail is **not in this claim's verbatim** (verbatim covers only: second in abundance, 22%, 800 g, 700 g as apatite). Do not put "blood buffer" on a figure label — it is not verbatim-grounded here.
- **claim_text-beyond-verbatim (WAL-CLM-RARE-000204).** "B-complex vitamins act as coenzymes only when combined with phosphorus" and "nutritionists largely ignore it" are in the claim_text but **not the verbatim**. Safe to anchor: "more functions than any other mineral," nucleic acids, enzyme activation, ATP energy cycle, RBC metabolism, structural in bone/teeth.
- **The dramatic "15–20:1 inverted ratio" figure is claim_text-only.** It appears in the interpretive claim_text of WAL-CLM-LETS-000061 (and the red-meat/grains/soft-drinks attribution) but is **not in any verbatim in the pack**. The **2:1 ideal** IS verbatim-backed (WAL-CLM-EPIGEN-000147, WAL-CLM-DDDL-000052) and the "soft drinks" driver is verbatim in WAL-CLM-EPIGEN-000147. If concept A wants a hard number on the "modern" pan, prefer showing the 2:1 ideal being *violated* qualitatively rather than printing "15–20:1" as a verbatim Wallach figure. Flag for Luneth if the punchier number is wanted.
- **Two ratio contexts, don't conflate.** Ca:P **2:1** is the *dietary* ideal (052, 147). Ca:P **1:1** is the *absorption-optimum* for metallic/chelated P (207). A figure that mixes them will mislead — keep them in separate concepts (2:1 → A/D, 1:1 → C).
- **Confidence.** The two mechanism claims carrying the 2:1 ratio (WAL-CLM-DDDL-000052, WAL-CLM-EPIGEN-000147) are `confidence: medium`; every other claim used is `high`. The ratio is corroborated across both books, so it is safe, but note the medium tag.
- **No superseded claims** in the pack (`_missing_ids` empty; all `superseded_by` null). Prefer the newest for numbers if a conflict ever arises — none does here.
- **Thin-for-a-figure angles:** the pica/South Africa curio (WAL-CLM-IMMORT-000213) and the vegetarian note (WAL-CLM-RARE-000210) are each single, isolated facts — good as a one-line "did you know" beat inside another concept, not strong enough to carry a whole header alone.
- **Solo header? Yes — clearly.** The "essential you must NOT supplement / target 0.0 / your surplus steals calcium" story is genuinely unique among the 90 and does not fold cleanly into any other element. It should get its own bespoke header. (It is *adjacent* to calcium's story but tells the opposite half — calcium is the one to add, phosphorus is the one to restrain.)
- **Concept you might wish for but the corpus does not support:** a quantified "how bad is the modern diet" figure with a real verbatim number — the only number available for that is the claim_text-only 15–20:1 (see above). Don't fabricate one.

## 6. Recommended lead concept

**A — "the one you already have too much of" (the tilted scale).** It is the only angle that turns phosphorus's strange 0.0 target into the *point* of the header rather than an apparent gap, it is unlike all six shipped headers, and every factual element is verbatim-anchored (2:1 ideal, excess-steals-calcium toxicity, zero supplement). Pair with lede #1; hold concept B or C in reserve as the distinct-figure alternate.
