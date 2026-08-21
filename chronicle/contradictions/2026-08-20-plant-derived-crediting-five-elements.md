# 2026-08-20 — Crediting chloride / germanium / sulfur / silica to the plant-derived meter

**Status: SURFACED, NOT ACTIONED. Awaiting the owner's ruling.**
**Tag: `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]` — turn 1 of the three-turn protocol.**

## The instruction
> "Chloride, Germanium, Sulfur, Silica, and Tin have NO product sources. They should be treated
> like plant derived minerals since they are legitimately sourced from plant derived mineral
> products like ultimate classic … It should be possible for the user to achieve 90/90 on the
> regimen tab when it's currently not possible, this should fix it"

## Why this is a source-rule question, not a plumbing one
Crediting these four on the plant-derived meter would make the board read **covered** — i.e. assert
the user is meeting Wallach's own stated targets (chloride 2,500 mg/day, sulfur 500 mg/day,
germanium 20–30 mg/day, silica 38 mg/day) — on the strength of a 924 mg bottle of mixed plant
solids. Wallach states these elements are **present** in humic shale. He nowhere states **how much**.
Scoring an element as covered off a meter that cannot see it is a fabricated mapping.

## The evidence, gathered over all 2,611 sealed claims in all 7 shards
1. **Presence is not supply.** The shared anchor is `WAL-CLM-HELLS-000069`, Wallach's table
   *"Essential Minerals Found in a High Quality Humic Shale"*. Read in full it also lists calcium,
   sodium, potassium, magnesium, phosphorus, iron, zinc, hydrogen, carbon and oxygen. Presence on
   that roster cannot be the criterion for plant-derived crediting, because it would credit calcium.
2. **Exactly one element gets a Wallach SUPPLY instruction naming the vehicle — tin.**
   A whole-corpus regex for `from\s+(the\s+)?plant\s*-?\s*derived|from\s+(the\s+)?colloidal`
   returns tin (`WAL-CLM-LETS-000451`, `WAL-CLM-DDDL-000406/465/466`, and "plant derived liquid
   colloidal tin" `WAL-CLM-DDDL-000287`) and, as a form preference only, calcium. Germanium,
   chloride, sulfur and silica get no such sentence anywhere.
3. **Wallach rules against it directly.** `WAL-CLM-DDDL-000120`: *"The colloidal minerals were all
   present in trace amounts. They required an additional source of the major minerals and
   electrolytes such as calcium, magnesium, manganese, zinc, and potassium to even come close to
   the published RDAs."* Chloride at 2,500 mg and sulfur at 500 mg are major-mineral magnitude.
4. **The arithmetic agrees.** `pdm-coverage-data.json` `goal.maintenance_mg` = 924 mg of TOTAL
   plant-derived solids across 60-plus elements. Chloride's target alone is **2.7× the entire
   bottle**; sulfur's is **54%** of it.
5. **Wallach's own answer for chloride points elsewhere.** `WAL-CLM-RARE-000377`: *"Sodium chloride
   or salt is the universal source of chloride ions."* Corroborated in four other books.

## Why it would also be unfalsifiable
Crediting these turns four tiles green whenever any plant-derived vehicle is in the stack, and **no
gate could ever catch that being wrong** — there is no per-element number to compare against. Only
the 23 externally-anchored gates can catch a value that is wrong but self-consistent, and none of
them touches this. The board would get greener and quieter at once: the exact shape of the
mineral-tier failure, which was mockup-derived, sealed, and green for three weeks.

## On 90/90
Not honestly reachable today. Four of the ninety cannot pass 10% of Wallach's own target from the
entire Youngevity catalog, and germanium and tin have no product source at all. The honest move is
for the board to say Wallach's framework does not route these through a supplement — not to move
the denominator until the number goes green.

## The ppm table — CORRECTED 2026-08-20, later the same day

**The formula this file originally proposed was wrong. Recording that rather than editing it away.**

Originally written here: the table "would convert 'present in the shale' into a derivable mg/serving
via **ppm × 600 mg solids**." That is **wrong by a factor of 49.3**.

What the pages actually show, read directly:
- The table **is** printed and **is** fully legible — 53 element/concentration pairs at
  `epigenetics.txt` char_offset 1414717, no OCR mangling. It is printed a **second** time as
  **Rare Earths Table 10-5**, and after whitespace normalisation the two printings' data rows are
  **byte-identical**. So it is disclosed twice and cross-corroborates itself.
- Epigenetics prints the table **stripped of its basis**. Rare Earths carries the basis:
  `Suspended Solids 38 gm/L.` and `Concentration in PPM (unless otherwise specified)`, with six
  elements given as that exception — `Calcium 1gm/L`, `Potassium 1gm/L`, `Sulfur 1gm/L`,
  `Silicon 1gm/L`, `Magnesium 1gm/L`, `Sodium 1gm/L`.
- Every non-ppm unit in that column is **per litre of liquid**, and the solids figure is per litre
  too. So the ppm column is **mg/L of the liquid extract**, not mg/kg of solids. The original
  formula treated it as solids, understating every element ~49x, and it cannot express
  silicon/calcium/sulfur/magnesium/sodium/potassium at all, because `1gm/L` is not a ppm.

**Caveat, stated because it matters:** the per-litre basis is an INFERENCE from internal
consistency, not a Wallach sentence. He never writes "ppm means mg per litre." The competing reading
is that "SPARK SOURCE MASS SPECTROGRAPHIC ANALYSIS OF HUMIC SHALE" assays a SOLID, where ppm
conventionally means mg/kg — but that reading cannot explain `Calcium 1gm/L` sitting in the same
column. Any derivation from this table rests on that inference and must say so.

Mining these rows is still USER-ONLY and has not been done.

## Silver, germanium and silica — evidence gathered 2026-08-20, and it runs AGAINST crediting
Checked after the owner asked for silver, germanium, silica and tin to be credited when a
plant-derived vehicle is present. Whole-corpus search carrying a working positive control (tin fired
in every sweep; these three did not), so the absence is measured, not assumed.

- **Silver — PRESENCE-ONLY.** "Colloidal silver" is a DIFFERENT PRODUCT: a standalone silver
  preparation. Wallach lists the two side by side in one sentence — *"Topical applications can
  include zinc oxide ointment, colloidal silver, plant derived colloidal minerals, aloe vera
  ointment…"* — and naming both would be redundant if the vehicle supplied silver.
- **Germanium — PRESENCE-ONLY, with active COUNTER-evidence.** He prescribes germanium as its own
  line item in the SAME list that separately names the vehicle: *"germanium at 50 mg orally or IM
  daily, acupuncture, homeopathy, herbs to include ginseng (Panax ginseng), selenium at 1,000
  mcg/day and plant derived colloidal minerals."* Dosing it alongside the vehicle is evidence
  against the vehicle supplying it.
- **Silica — PRESENCE-ONLY.** His stated sources are dietary: high-fibre diets and beer.

Tin remains the only element in this family with vehicle-supply language.

## Tin is a separate question
Tin's evidence is genuinely stronger — Wallach names the vehicle as its route in two books. But tin
was **already ratified the other way on 2026-08-19** (dual status: plant-derived *and* its own dose,
filed under INDIVIDUALLY DOSED where it scores). Nothing new has been found since. Reversing that is
a deliberate re-open, and `pdm_coverage_derive.py`'s own docstring currently states the opposite rule
and would have to change in the same patch.

## Mechanism note, if overruled
Flipping `coverage_kind` in the canon alone would change **nothing**: `targets_derive.py` takes the
dose branch whenever a sealed dose claim exists and only falls through to canon's `coverage_kind`
when none does. All five carry doses. Moving them to the group meter needs a code change giving
canon precedence over the dose branch — not a one-field data edit.
