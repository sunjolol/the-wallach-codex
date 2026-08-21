# 2026-08-20 — Crediting chloride / germanium / sulfur / silica to the plant-derived meter

**Status: CLOSED 2026-08-20 (evening) — see "RESOLVED" at the foot of this file.**
**The body below is the ORIGINAL evidence trail and is kept verbatim, including the parts it got
wrong. Read the resolution before acting on anything here: three of the four questions turned out
to need NO source-rule override, and germanium's "presence-only" finding was backwards.**
**Superseded tag: `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]` — turn 1 of the three-turn protocol.
The override was never needed; the rulings implement Wallach rather than overriding him.**

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

---

# RESOLVED 2026-08-20 (evening). All four questions answered by the owner. Do not re-litigate.

**Status: CLOSED.** Everything above this line is the evidence trail that led here; it stands as
written, including the parts that turned out to be wrong. Below is what was actually ruled and
shipped in commit `972ade59`.

## The correction that changed the shape of the whole question

The file above concluded these were all one question. **They were four different questions**, and
three of them needed no source-rule override at all. What settled it was reading Wallach's *own
assay of the vehicle*, and then the *role* of each stated number, rather than arguing about
presence.

### The assay — measured, and it kills the "optimal amounts" premise outright

The owner's stated premise was that the liquid PDM products "contain them in optimal amounts."
Wallach's own spark-source mass-spec of humic shale — printed TWICE, byte-identical between the
Epigenetics ch.18 printing and Rare Earths Table 10-5 — gives:

| element | ppm in the table | delivered at his own dose (1.54 fl oz/day, 154 lb) | his target | coverage |
|---|---|---|---|---|
| silver | 0.2 | 9.1 mcg | 400 mcg | **2.3%** |
| tin | 0.03 | 1.4 mcg | 500 mcg | **0.27%** |
| germanium | **<0.01** | <0.46 mcg | 30 mg | **0.0015%** |

Reading ppm as mg/kg of solids instead of mg/L of liquid makes every figure ~50x WORSE, not better.
Both readings agree. Germanium's own entry is *below detection*. So "the formula contains them in
optimal amounts" is contradicted by Wallach's own book, and crediting the vehicle on that premise
would have been the unfalsifiable green this file warned about.

## TIN — VEHICLE-SUPPLIED. Not an override; this IMPLEMENTS him.

The file above already found the key fact and under-weighted it. A sweep of all 7 books finds **no
food source for tin anywhere**, while the vehicle is named as its route in **two books sixteen years
apart** — `WAL-CLM-LETS-000451` (1995) and `WAL-CLM-DDDL-000406/465/466` (2011) — plus
`WAL-CLM-DDDL-000287`, where he records his own hair regrowth *using plant-derived liquid colloidal
tin*. That is a supply instruction, not presence on a roster.

**This REVERSES the 2026-08-19 dual-status ruling**, at the owner's direction. Tin keeps its own
500 mcg dose and still covers numerically; the vehicle is an ADDITIONAL route and `classify()` takes
the better of the two verdicts. Membership + citations live in `trace-mineral-vehicles.json`
(`vehicle_supplied`), and `targets_derive._vehicle_supplied` refuses to build on a citation that
does not resolve to a sealed claim — the gate this file said was missing.

## SILVER — the 400 mcg was never a requirement. A defect of ROLE, not of value.

The board had been demanding 400 mcg/day, so the best product in the catalogue looked like it needed
ten servings. Three findings:

1. His only sentence is a **tolerance**: *"Humans can consume 400 mcg of silver per day"*
   (`WAL-CLM-DDDL-000013`; identical in Immortality 2008 as `IMMORT-000027`). "Can consume", never
   "requires" — and he puts his own following "deficiency" in scare quotes.
2. **Silver has NO ROW in the Base Line Nutritional Supplement Program** — the True Supplement Need
   table that IS the source of tin's 500 mcg, sulphur's 500 mg, sodium's 3,300 mg. Not an OCR drop:
   `WAL-CLM-LETS-000064` prints RIBOFLAVIN and SELENIUM adjacent, so nothing sits between them.
3. The **newest** book denies the requirement outright: silver *"is not required by any known
   biological system"* (`WAL-CLM-EPIGEN-000064`, Epigenetics 2014).

Shipped as `CEILING_NOT_TARGET` — the target carries `ceiling` with no `low`, so it covers on a
genuine source (Colloidal Silver at 40 mcg now covers it) and the page shows the figure labelled as
the upper limit it is. **Silver is NOT vehicle-supplied** and a PDM bottle does not cover it.

## GERMANIUM — diet-routed, and the file above had this backwards too

"PRESENCE-ONLY with active COUNTER-evidence" was the wrong frame. Wallach names germanium foods
explicitly: *"found in significant amounts in a variety of plants including mushrooms, ginseng,
garlic"* (`WAL-CLM-LETS-000183`), with `EPIGEN-000309` / `RARE-000013` putting the
germanium-accumulating plants at **100 to 2,000 ppm** against traces in ordinary food. It got a diet
note like the other diet-routed essentials. No product carries germanium, so the sources block was
taught to render on a note alone.

## CHLORIDE / SULFUR / SILICA — unchanged, and the reasoning above still holds

None of these are vehicle-supplied. They carry diet notes naming real food sources.

## The gate hole this created, recorded because it proves the file's own warning

Moving silver's number from `low` to `ceiling` **removed it from §00.A audit and the board stayed
94/94** — green *because of* the change. `amounts_wallach_only` now audits a ceiling identically and
requires a short kebab `ceiling_reason`; 4 new negative controls, 17/17.

## What is STILL open

The 90/90 composition gap for **silver and germanium**. Neither has a product row in the pillar
(germanium has zero occurrences in the whole file). That is a COMPOSITION-DATA question needing the
owner's Youngevity label figures and a USER-ONLY seal — not a doctrine question, and not answered
here.
