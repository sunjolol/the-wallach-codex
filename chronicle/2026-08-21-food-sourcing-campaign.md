# Gap-source ledger — the 13 essentials no food could reach

Campaign opened 2026-08-21. Phase 1 = ACQUIRE + measure. Nothing here has entered the app.
Nothing is committed. Every number was read out of a source, not recalled.

## Owner rulings this campaign runs under (2026-08-21)

1. **Branch out beyond USDA.** Gather loosely from many reputable sources, THEN verify, THEN
   build the display demos.
2. **Gap champions may be ADDED** — *"BUT, we MUST source actual numbers - without the numbers
   we have no ground to stand on."* No number, no entry.
3. **Two match tiers, both labelled.** EXACT = joined by ID, byte-exact, gate-provable.
   APPROXIMATE = curated name match, one human decision per pair, recorded with its reasoning.
4. **Salt is relabelled "Iodized salt."**
5. **Vanadium covers off a PDM bottle** — SHIPPED 2026-08-21, board 100/100. Tin model
   (keeps its 150 mcg target, vehicle is additional), `"hero": false` so no plant-derived
   header and no explainer text.

## The bridge: NDB number

`sr_legacy_food.csv` maps `fdc_id -> NDB_number`; **all 190 catalog foods carry one.**

⚠ **Zero-padding trap, bit once.** Ours are unpadded (`1009`), published tables use five digits
(`01009`). Unpadded found 15 foods; padded finds 38. **Always `.zfill(5)` both sides.**

## SCOREBOARD — 13 of 13 RESOLVED. Phase 1 complete.

8 gaps are food-coverable. 3 are closed by owner ruling as supplement-covered (chromium,
vanadium, inositol) — each VERIFIED against the sealed product pillar, not taken on assertion.
2 have no food data anywhere and were already closed (tin, germanium).

### ✅ COVERABLE (8)

| gap | target | best food | evidence |
|---|---|---|---|
| **iodine** | 230 mcg | ricotta **36%**, yogurt 34%, cottage cheese 23%, Swiss 17%, egg 13% | USDA/FDA/ODS-NIH Iodine DB R4, joined by NDB; **10 foods qualify** |
| **molybdenum** | 38 mcg | chickpeas **410%** | FDA TDS FY18-20; 181 of 307 foods clear 7% at 150 g |
| **biotin** | 300 mcg | chicken liver **61%** | CoFID 2021; peanuts 130, hazelnuts 76 µg/100 g |
| **chloride** | 2500 mg | salt **144%** (1 tsp) | CoFID 2021; anchovies 9,100 mg/100 g |
| **silica** | 38 mg | green beans **28.7%** (already in catalog) | Powell 2005, 207 foods; dates 20%, banana 13%, spinach 11% |
| **flavonoids** | 1000 mg | blackberries **21%**; green tea would be ~78% | USDA Flavonoid R3.3, 510 foods / 3,592 compound rows, joined by NDB |
| **boron** | 9.2 mg | prune juice **15.5%**, avocado 11.6%, raisins 10.3% | NIH ODS table; **6 of 32 foods clear 7%** |
| **sulfur** | 500 mg | chicken breast **48.7%**, cod 44.6%, ground beef 37.9%, broccoli 26.5%, kale 23.8%, egg 19.6% | Doleman 2017, converted dry→fresh via USDA moisture; 21 of 32 foods converted, **11 clear 7%** |

**Sulfur conversion, in full (owner-ruled 2026-08-21: "convert, show the working"):**
`mg S / 100 g fresh = µmol_per_g_dry × 32.06 µg/µmol × dry_matter_fraction × 0.1`, where
`dry_matter_fraction = 1 − USDA water g/100 g ÷ 100`. Script: `convert_sulfur.py`; every row
stores the µmol/g dry, the moisture, its USDA source and the arithmetic. **APPROXIMATE tier by
construction** — the µmol/g is Doleman's sample, the moisture is a USDA sample of a nominally
similar food, and no ID joins them. TOTAL sulphur is converted, not SAA: for garlic the amino-acid
fraction is only 10.5%, which is exactly why the old methionine+cystine shortcut failed.

### ❌ MEASURED SHUT (2) — findings, not data gaps

**chromium (620 mcg).** Four independent authorities agree no food comes close:
1. **FDA TDS**, 307 foods: median **0.00** µg/100 g. Shrimp 0.67, cod 0.32, salmon 0.00,
   tuna 0.00. The only foods clearing 7% are baking powder, cocoa powder, chocolate syrup,
   sandwich cookies, candy bar, baby-food pouch, processed American cheese, protein powder —
   every one a reject or a condiment, and several almost certainly stainless-steel
   processing contamination.
2. **IOM DRI panel**: *"chromium in foods cannot be analyzed from existing databases"*;
   meats, poultry and fish give **1-2 µg per serving**.
3. **Chromium-composition reliability review (PMC3467697)**: pre-1980 data is unreliable;
   lab contamination persists; reported shrimp values span **0.4-26 µg/100 g**.
4. **NIH ODS table**: the richest food listed is **grape juice, 7.5 mcg per cup**. Brewer's
   yeast 3.3/tbsp. **No mussels or shellfish appear at all.** NIH's own caveat: the values
   *"should only serve as a guide."*
   ⇒ The widely-repeated **"mussels 128 mcg/100 g" is not supported by any of the four** and is
   17x the richest food NIH lists. Do not use it.
   ⇒ **CLOSED BY OWNER RULING 2026-08-21: chromium does not need a food source.** Verified:
   **30 products declare chromium**, eleven of them at 200 mcg (Ultimate Classic, BTT 2.0,
   Ultimate Tangy Tangerine, Ultra Body Toddy, ReVERSE!, …). **Top 4 combined = 800 mcg = 129%
   of the 620 mcg target.** Supplementing alone covers it.

**vanadium (150 mcg).** Only 6 of 307 TDS foods clear 7%: cocoa powder, baking powder,
processed American cheese, red wine, white wine, hard candy. Now covered by the PDM ruling
above, plus Glucogenix 200 mcg and Slender FX Sweet Eze 200 mcg.

### ✅ CLOSED BY OWNER RULING — no food source needed (1)

**inositol (90 mg). CLOSED 2026-08-21: covered by supplementing, like chromium.** Verified:
**27 products declare inositol.** Excluding duplicate Pollen Burst flavours, the top four
DISTINCT products — Pollen Burst 50 mg, Ultimate Daily 30, Ultimate Classic 30, Synaptiv 30 —
give **140 mg = 156% of target**. Two products alone clear it.

The food-side hunt is recorded below only so nobody repeats it: Clements & Darnell 1980
(487 foods, GLC) is paywalled at every route tried — AJCN, ScienceDirect, Ovid, Semantic
Scholar, CORE, Progress in Nutrition.

⚠ **The obvious proxy is a TRAP.** Papers that look like inositol food tables are usually
**phytic acid** tables (inositol hexakisphosphate) — e.g. the Progress in Nutrition diet paper,
whose Table 1 is `g/100 g dry matter` of phytate. Phytate-bound inositol is poorly absorbed in
humans, which is *why* Clements & Darnell measured the FREE form. Never substitute one for the
other.

Not blocking: **Ultimate Classic declares Inositol 30 mg** = 33% of the 90 mg target, so the
tile is product-reachable regardless.

### — NON-ISSUES (2)

**tin** — no food data exists anywhere; TDS never measured it. Already vehicle-supplied.
**germanium** — no data exists; ruled and closed.

## Acquired, on disk (`eden/foods/sources/`, ~27 MB)

| dir | file |
|---|---|
| `iodine-usda-ods/` | Iodine DB Release 4 per-100g PDF — **extracted, 478 rows, 293 carry BOTH NDB and TDS numbers (a published crosswalk)** |
| `cofid-uk/` | CoFID 2021 xlsx, 2,887 foods |
| `flavonoid-usda/` | Flav_R03-3.zip (accdb + doc PDF) — **extracted from the PDF, 510 foods** |
| `fda-tds/` | FY18-20 results + supplement + key; Elements 1991-2002, 2003-2017 |
| `silicon-powell2005/` | Powell 2005 BJN PDF — **extracted, 181 rows** |

Extractors (scratchpad): `extract_iodine.py`, `extract_silicon.py`, `extract_flavonoids.py`,
`xlsx_read.py` (dependency-free), `match_tds.py` (proposes only).

## Corrections made during the campaign

1. **FDA TDS has never measured boron or tin.** All 49 analytes checked, 1991-2020. The old
   handoff named TDS as the boron source; it is not.
2. **Sulfur is partly sourceable** — the 1,222-food DB is authors-only as recorded, but
   Doleman's 32 analysed foods are in the free full text (with the unit caveat above).
3. **The NDB crosswalk removes hand-matching for the whole USDA family.**
4. ⚠ **Earlier in this campaign I quoted "broccoli ~140 mg/100 g, eggs ~125" for sulfur from a
   search summary, not from Doleman.** The paper's own dry-weight values convert to ~95 mg/100 g
   for broccoli. The conclusion (sulfur is reachable) stands; those two numbers do not.

## Traps met and recorded

- **cp1252, not UTF-8.** FDA TDS is served as UTF-8 and is actually cp1252 (`cr\xe8me`).
- **`N` != 0 and `Tr` != 0** in CoFID: 362 chloride and 803 biotin cells are "not measured",
  159 "trace". Reading either as zero invents an absence.
- **Name matchers propose, never decide.** Two live examples: `"Carrots, raw <- BF, carrots"`
  scored 1.00 (**BF = baby food**), and a crude boron match produced `Corn -> Acorn squash`,
  `Tea -> Elk steak`. Every pair needs a human yes.
- **Extraction must be checked against the source's own arithmetic.** Powell prints mg/portion
  AND mg/100 g AND the gram weight; 179 of 181 rows reproduce their own identity, and the 2
  that don't are flagged rather than kept.
- **PDF column extraction by whitespace is unsafe** for all three of these tables; extract by
  x-coordinate. The Cambridge watermark lands a word on every row of Powell's table.

## Gap champions absent from the catalog (need adding, with their numbers)

- **boron**: prune juice, raisins, peaches, grape juice, apples
- **flavonoids**: green tea (brewed), elderberries, black raspberries, chokeberry, bilberry
- **iodine**: kelp/seaweed (by far the richest iodine food)
- **sulfur**: ★ **garlic** and **onions** — the catalog contains NEITHER, and garlic is the
  highest-sulfur food Doleman measured (252.3 µmol/g dry, ~335 mg/100 g fresh). Wallach names
  garlic explicitly as a germanium-accumulating plant on germanium's own page. Also absent:
  arugula/wild rocket (551.5 µmol/g dry — the highest total in the whole table), zucchini, rice.
