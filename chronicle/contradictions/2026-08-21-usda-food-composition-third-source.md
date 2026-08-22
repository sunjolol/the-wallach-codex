# 2026-08-21 — USDA food composition as a composition source

**Status: CLOSED BY OWNER RULING — NOT a source-rule breach. Implemented the same day.**
Raised by Claude, 2026-08-21. Ruled on by Luneth, 2026-08-21, in the same session.
Flag tag issued in chat: `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]` (turns 1 and 2 both fired).

> **The three-turn override was NOT completed, and deliberately so.** It does not apply. The
> owner ruled — with the breach argument in full view — that admitting a per-food composition
> table is not a change to §00.A at all. His reasoning is recorded below and is supported by
> evidence that the original raise had missed. The phrase `APPROVE SOURCE-RULE OVERRIDE` was
> never given and was never needed. **This is not a precedent for skipping the protocol; it is
> a finding that this particular question was outside it.**

## What was raised

Luneth wants the app to recommend foods, not just products — ranked by how much of a remaining
gap each closes, so a new user can cover the 90 from a handful of recommendations. That needs a
number for how much of nutrient X is in one serving of food Y. That number existed nowhere in
this project and cannot be produced from the sealed sources: of 77 sealed `food_source` claims,
**zero** carry a dose object, only 13 of the 90 essentials are named by any of them, and a regex
probe of all seven book `.txt` sources (~5.7M chars) found approximately **one** genuine
food-to-amount datapoint.

The concern was that the allowlist is written closed and its composition clause names Youngevity
specifically, so a third composition source looked like an amendment rather than an
interpretation.

## The ruling, in the owner's words

> "This is not a source rule override, Wallach already suggests foods for the same essentials
> we're suggesting foods for, we're simply quantifying and qualifying what those foods are
> WITHIN the Wallach framework of good foods vs bad foods, his lists are not exhaustive but his
> reasoning is. […] If I said to 'add oats as a source' THAT would be a violation, but I'm not
> saying this […] even Wallach himself references USDA sources for such purposes so again we
> are doing nothing he doesn't do himself."

## The evidence that settles it — verified in the corpus, not asserted

The original raise argued from the shape of the rule. It missed three facts that were sitting in
the sealed corpus the whole time:

1. **Wallach quantifies foods in USDA units himself.** *Hell's Kitchen*: a handful of cashews at
   *20 percent of the USDA recommended daily allowance* of magnesium, 30% copper, 10% iron; a
   handful of pistachios at *twenty five percent of the USDA recommended daily value* for B6;
   24 hazelnuts at *ninety percent* of the USDA daily value for manganese, 20% vitamin E.
2. **He cites USDA food tables by name.** *Immortality* references *"a USDA vitamin-A food
   table"* and a USDA database comparing vitamin and mineral levels in common foods between 1975
   and 2004.
3. **This project already ships a USDA per-food composition table, on his citation.** The USDA's
   277-food ORAC list, which he cites in *Immortality*, is derived into the app today by
   `eden/tools/orac_foods_derive.py`. The original raise cited that file only as a *methodology
   model* and failed to notice it is itself the precedent.

**The app is therefore stricter than Wallach's own text**, not looser: he measures those foods
against the USDA denominator; the app measures them against his.

## Why this is inside §00.A rather than an exception to it

§00.A's subject, verbatim, is *"every recommended amount, dose, range, daily target, deficiency
sign, and health claim."* A food's composition is none of those — it is a **numerator**, the
same arithmetic role a Youngevity label already plays on the product side. Every denominator in
the shipped feature is read from `essentials-targets-data.json`, which `amounts_wallach_only`
already audits. No target, dose, range, deficiency sign or health claim comes from USDA.

The eligibility layer is *purely* Wallach: a food is admitted only after passing his own
remove-list (no gluten grain, no refined sugar, no carbonated drinks, no processed meat, no
refined seed oils), enforced against `foods-curation.json` and the scanner's 210 hard-reject
terms. Foods he endorses — eggs, beef, pork, chicken, organ meats, nuts, seeds, vegetables — are
deliberately well represented, and eggs are pinned first at his instruction.

## The residual risk, and what was built to contain it

The ruling settles the SOURCE question. It does not by itself settle the **verdict** question:
a food number that flips a coverage tile reads to a user as an adequacy claim. Four containments
shipped in the same patch, and none of them are promises:

1. **`food_composition_traces_to_source`** (critical, anchor_class `external`, the board's 24th
   external gate). Every shipped per-food value joins byte-exact into the pinned USDA source by
   `(fdc_id, nutrient_id)`, carries the source's own unparsed string, reproduces its own
   arithmetic, uses a portion belonging to that food, and is measured against a numeric Wallach
   target. Negative test: `tools/tests/test_food_composition_traces_to_source.py`, 11 cases
   including a unit swap, a borrowed portion, a hand-edited extract line and a re-pointed
   archive hash — all verified RED.
2. **The presence-tile hazard is closed at the DATA layer.** The derive emits a row only for an
   essential carrying a numeric Wallach target, so a food *cannot name* silver, any of the twelve
   amino acids, or a trace_pdm mineral. Measured: **13 of the 90 counted tiles** turn green on
   the mere presence of a source, and every protein-bearing food names several aminos — one egg
   entry would have turned a dozen tiles green with zero amount math. Clause 3 of the gate REDs
   if that ever changes, and case 6b of the negative test proves clause 3 fires.
3. **Provenance is on the number, not in a footnote.** Every food amount carries a
   dotted-underline gloss reading "USDA food composition, measured against Dr. Wallach's daily
   target for this nutrient." Provenance token `food_catalog`, added to Eden's wall as a fifth
   USER token (a food is an item the user put in their own regimen); containment re-verified.
4. **`dietaryBaseline` was retired in the same patch.** 26 unsourced non-Wallach numbers were
   being added to assumed intake and subtracted from Wallach targets in shipped code, with no
   provenance and no gate. Two hand-maintained homes for "how much of X a normal diet supplies"
   is Charter R3's exact prohibition; the food catalog now answers that question with a byte-exact
   join and a gate that can prove it.

## The honest gaps, stated rather than filled

- **13 essentials carrying a numeric Wallach target have NO USDA composition at all**: sulfur,
  chloride, boron, chromium, germanium, iodine, molybdenum, silica, vanadium, tin, biotin,
  inositol, flavonoids. They are listed in `eden/foods/usda-source.json` under
  `no_usda_composition`. No food can ever move those tiles. Nothing was filled in from elsewhere.
- **Three more get zero qualifying foods** at the 7% threshold — vitamin B1, B6 and E — because
  Wallach's targets for them (100 mg, 100 mg, 134 mg) are pharmacologic. No food on earth
  delivers 7% of 100 mg of thiamin in one serving. That is a real finding, not a data gap.
- Foods therefore reach **19 of 91** tiles. Products cover the rest; 90/90 is unaffected.
- **EFA-from-foods is PARKED, not decided.** The EFA meter measures oil mass (`total_fat`)
  because Wallach's 9 g is *"essential fatty acids as flaxseed oil"*. Applying total-fat to whole
  foods would credit salmon's ~12 g of fat against a 9 g flaxseed-oil goal and cover both omega
  tiles off one fillet. Routing foods there needs a ruling on what the denominator means.

## What this does NOT license

Per Luneth's own words on the 2026-07-19 government-RDA question, which still stand: *"This is
not permission to do it elsewhere, these should be handled on a decision-by-decision basis."*
This ruling covers **per-food composition, as a numerator, filtered by Wallach's own food
doctrine**. It does not admit USDA RDI/DRI/DV as a target for anything, which the 2026-07-19
ruling refused and which remains refused.

---

## UPDATE — 2026-08-21, later the same day: three of the thirteen gaps closed

Nothing above is retracted; two sentences in it stopped being true within hours of being
written, and a record that quietly keeps them is worse than one that says so.

**What changed.** Luneth ruled, after the gap-source campaign
(`chronicle/2026-08-21-food-sourcing-campaign.md`), that other reputable published sources may
be pinned alongside SR Legacy to reach essentials it does not measure at all, and that two match
tiers ship with **the surface saying which**:

- **EXACT** — the two tables joined by an id both carry (the NDB number, which
  `sr_legacy_food.csv` maps every catalog food to). No human judgment in the join.
- **APPROXIMATE** — joined by the source's own food NAME, one human decision per pair, each
  recorded in `foods-catalog-curation.json` with the reasoning that accepted it.

The tier is **derived from the join**, never typed, and `food_composition_traces_to_source` REDs
an EXACT tier sitting on a name join.

**The two sentences that are now wrong, corrected:**

1. *"13 essentials … have NO USDA composition at all … No food can ever move those tiles.
   Nothing was filled in from elsewhere."*
   The first clause still holds — SR Legacy still measures none of them. The rest does not.
   **Three now have a food source**: iodine (USDA/FDA/ODS iodine database, EXACT, 10 foods),
   flavonoids (USDA flavonoid + proanthocyanidin databases, EXACT, 10 foods) and silica
   (Powell 2005, APPROXIMATE, 9 foods). Ten remain unbound.
   ⚠ And "unbound" is not "unmeasurable": **sulfur, chloride, biotin and molybdenum are
   measured by AFCD**, a source already pinned and on disk that nothing reads yet. They are
   listed as gaps because a piece of work is not done, not because the food world is silent.
   Boron rests on a table that is not pinned at all yet.

2. *"Foods therefore reach 19 of 91 tiles."*
   **22 of 91.** The three measurable-but-unreached tiles are unchanged and unchanged in kind:
   vitamin B1, B6 and E, whose Wallach targets are pharmacologic.

**Also changed since the entry above:** the provenance gloss no longer says "USDA food
composition" — it names the actual source it is glossing, read from the artifact rather than
typed in the view, and an APPROXIMATE amount additionally carries an `≈` mark and a sentence
saying what the hand-pairing does and does not mean.

**Unchanged:** §00.A. Every denominator is still Wallach's, every new number is still
composition (a numerator), and no target, dose, range, deficiency sign or health claim comes
from any of these sources. "What this does NOT license", below, applies to them word for word.

**Still parked:** EFA-from-foods. A denominator was derived during the campaign and approved,
but nothing is wired, and the reasoning in the entry above is still the reasoning.
