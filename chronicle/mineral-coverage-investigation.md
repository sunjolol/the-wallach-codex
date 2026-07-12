# Trace/Rare Mineral Coverage — Investigation + Fix Plan (SAVED 2026-07-12)

**Status: INVESTIGATION COMPLETE, IMPLEMENTATION NOT STARTED. Read this in full before resuming.**
This began as "add a coverage dot to the Knowledge > Essentials tab" and uncovered a real coverage-engine gap for trace/rare minerals. Luneth-approved decisions + the golden-standard math directive are below. Nothing implemented yet — awaiting the math-system build + his final approvals.

## How this started
Phase-H Essentials-tab polish: align the tab to the demo (small claim-count tiles, 6 subsections) + add a small **coverage dot** (top-right of each tile) + a dot legend. Luneth's dot spec: green=covered, yellow=partial, red=uncovered; for no-goal items green=present/red=absent; foundational H/C/N/O green (present by default, e.g. oxygen). Dot for "present but amount-unknown" = **hollow/blue** (easy pivot back to a simple green/red present/absent system). Build this AFTER the coverage math below is settled, because the dots consume coverage.

## The core discovery
The coverage engine credits a mineral only when a product's label lists it with a numeric amount. The 33 rare-earth minerals (`trace_pdm` kind) are named by NO product label (FDA panels never itemize rare-earths), so the "PDM aggregate-vehicle rule" (engine comment: "a trace_pdm mineral is trace iff a plant-derived-mineral vehicle is in the stack") is **DEAD** — it never fires. So rare-earths are permanently pending/red no matter what the user takes. Wallach's whole thesis is that plant-derived colloidal minerals DELIVER the full 60-77 spectrum incl. rare-earths.

## §00.A evidence (Wallach + Youngevity)
- **`WAL-CLM-RARE-000301`** — Rare Earths: Forbidden Cures, Ch.10, p.261 (Table 10-5). Spark-source mass-spec of Wallach's OWN plant-derived colloidal mineral supplement (Humic Shale): "no less than 60 plant-derived colloidal minerals at ~98% bioavailability… the complete mineral spectrum — including every rare earth." Lists ppm for every rare earth (tantalum, lutetium, ytterbium, thulium, erbium, holmium, dysprosium, terbium, gadolinium, europium, samarium, neodymium, praseodymium, cerium, lanthanum, scandium, yttrium) + trace metals.
- Supporting: `RARE-000214` (p.375, "supplement with 60 colloidal minerals"), `RARE-000069` (p.251, PDM = most critical of the 90), `RARE-000071` (p.252, glacial milk = 60-72 minerals), `RARE-000074` (p.270, colloidal = most absorbable form).
- **Youngevity's own published composition of "Plant Derived Minerals™" (Luneth-supplied from the YGY site) = 77 elements INCLUDING every rare earth** (Cerium, Dysprosium, Erbium, Europium, Gadolinium, Gallium, Germanium, Gold, Hafnium, Holmium, Lanthanum, Lutetium, Neodymium, Niobium, Praseodymium, Rhenium, Rubidium, Samarium, Scandium, Tantalum, Terbium, Thulium, Titanium, Ytterbium, Yttrium, Zirconium, + non-canon Antimony, Bismuth, Cadmium, Fluorine, Indium, Iridium, Lead, Osmium, Palladium, Platinum, Rhodium, Ruthenium, Tellurium, Thallium, Thorium, Tungsten). This is the definitive proof for Group A below.

## THE GOLDEN STANDARD (Luneth) — 100% trace/rare coverage from ONE source
**"Plant Derived Minerals™" (Majestic Earth) — 600 mg per serving (1 fl oz) = 100% daily trace/rare mineral coverage.** The full 77-element colloidal complex.
- Corroboration: YGY says the 32-oz bottle has "19,000 mg colloidal plant mineral solids" → 600 mg × 32 servings ≈ 19,200 mg ✓. And Ultimate Mineral Caps label: "One capsule ≈ 1/2 fl oz of Majestic Earth Plant Derived Minerals" → 1/2 fl oz = 300 mg, and the cap lists "Plant Derived Trace Minerals 300 mg" ✓ (so 1 fl oz = 600 mg).
- **Proposed math:** a single "trace/rare mineral coverage" metric, goal = 600 mg/day plant-derived colloidal mineral solids. Each regimen product contributes its plant-derived-mineral mg toward the 600. Coverage% = Σ(PDM mg)/600. All 33 rare-earth+trace minerals tick GREEN ≥~95% (≥570 mg), YELLOW partial, RED <~30%/absent. Recommendations rank by highest-mg source first. Luneth's phrasing: "make every trace/rare mineral have a 600mg goal, all numerical amounts count toward it, factor recommendations by highest amounts first."
- Products where the vehicle has NO amount (carrier in other_ingredients) → the **hollow/blue "present, amount-unknown"** dot; contributes presence, not math.

## §00.A SPLIT (critical for crediting)
- **Group A — Majestic Earth "Plant Derived Minerals™" / humic-peat**: YGY's published 77-element composition + Wallach's Humic Shale mass-spec BOTH confirm full rare-earth spectrum. §00.A SOLID. Counts 1:1 mg toward the 600 mg goal.
- **Group B — red algae / marine algae / Aquamin (Lithothamnion / algas calcareas)**: a DIFFERENT source. Aquamin markets "72 trace minerals" but the RARE-EARTH content of red algae is NOT established by YGY's PDM list or Wallach. Luneth APPROVED counting all of Group B as trace/rare EXCEPT the 3 calcium-from-seaweed products (Ocutiv, Glucogenix, Ultimate Digest FX — seaweed is just the calcium source, not a trace complex). **OPEN §00.A QUESTION: does red-algae/Aquamin mg count 1:1 toward the 600 mg Majestic-Earth goal, or need its own basis?** Find a red-algae/Aquamin rare-earth citation, or Luneth decides.

## APPROVED PRODUCT LIST (Luneth 2026-07-12)

### TABLE 1 — vehicle has a KNOWN per-serving amount (feeds the math)
GROUP A (Majestic Earth PDM / humic — counts 1:1 to 600 mg goal):
- Plant Derived Minerals™ — **600 mg** (GOLDEN STANDARD = 100%)
- Cheri-Mins™ — 600 mg
- Strawberry Kiwi-Mins — 600 mg
- Ultimate Classic® — 600 mg
- Ultimate Tangy Tangerine® Liquid — 300 mg
- Ultra Body Toddy™ — 300 mg
- Bone Building Formula™ — 300 mg ("Plant Derived Trace Mineral Blend")
- Rebound FX™ (Citrus Punch drink/powder) — 120 mg  [LABEL FIX: powder/packs use rebound-fx-citrus-punch_supp-facts_1225.jpg]
- Majestic Earth® Mineral STX™ — 600 mg ("Trace Mineral Blend")
- Midnight Minerals™ Fulvic Mins™ — 150 mg ("Peat Bog Clay", humic/fulvic)
- Zinc + Immune Support™ — 25 mg (TOO LOW vs 600 goal; include only for technical completeness, not a real recommendation — Luneth)
GROUP B (red algae/Aquamin — amount known, source-equivalence TBD):
- BTT 2.0 Citrus Peach Fusion — 300 mg ("Trace Mineral", marine algae)
- BTT 2.0 Citrus Peach - 30 Count — 300 mg
- BTT 2.0® Tablets — 50 mg ("Trace Minerals", red algae)
- Beyond Tangy Tangerine® 2.5 — 300 mg ("Plant Derived Mineral Complex", red algae)
- Beyond Tangy Tangerine® 450G Original — 300 mg (mineralized seaweed Lithothamnion)
- 3.0 Rise & Restore™ — 50 mg AND 100 mg (TWO records — reconcile which serving)
- Beyond Osteo FX™ Powder — 140 mg ("Trace Mineral Complex from red algae")
- ProJoint FX™ — 75 mg ("Trace Mineral Complex from red algae")
- Ultimate Mineral Caps™ — **300 mg PDM (Group A)** + 280 mg Aquamin Seaweed (Group B) [counts BOTH]
GROUP C (Vilcabamba — Wallach long-lived culture; confirm source):
- ViaViente Whole Food Puree — 25 mg ("Vilcabamba Trace Minerals")
GROUP D (generic trace complex, Luneth-confirmed on label):
- Women's FX™ with Black Cohosh — 250 mg ("Trace Mineral Complex")
- Zinc Fx — 25 mg ("Trace Mineral Blend")

### TABLE 2 — vehicle PRESENT but NO derivable amount (→ hollow/blue "present" dot)
GROUP A (Plant Derived Minerals in other_ingredients, no quantity):
- CAL Toddy™ — "Plant Derived Minerals" (other-ing) [LABEL FIX: stored label was WRONG; use Luneth's Cal_Toddy_Facts.png in temporary/labels/]
- Beyond Osteo FX™ Liquid — "Plant Derived Minerals" (other-ing)
- Ultimate Osteo fx™ — "Plant Derived Minerals" (other-ing)
- Herbal Rainforest™ — "Majestic Earth® Plant Derived Minerals™" (other-ing)
- Oxybody™ Cherry Berry — "plant derived minerals" (other-ing)
INSEPARABLE BLEND (trace portion can't be isolated):
- Ultimate Ocean's Gold™ — trace minerals inside "Proprietary Ocean's Gold Blend 1205 mg" (Luneth APPROVED: counts, YGY page says the seaweed-calcium blend also contains other trace minerals; unlike Digest FX which doesn't state it)
- Rebound FX™ 1-Case (can) — "Trace Mineral Blend" inside "Proprietary Blend 440 mg" [LABEL FIX: drink uses rebound-fx-can-supp-facts_0326_1200x900.jpg]
- Women's Hormonal Balancer™ — "Proprietary Vilcabamba mineral blend (each <2% DV)" (other-ing)

### REJECTED (calcium sourced from seaweed, NOT a trace-mineral complex — Luneth)
- Ocutiv™ (AlgaeCal = calcium source)
- Glucogenix™ (Calcareous Marine Algae / Aquamin TG, small, calcium)
- Ultimate Digest FX™ (Calcium from Aquamin Seaweed; does NOT state other trace minerals)
### FALSE-POSITIVE
- Collagen Peptides ("Fulvic powder 10 mg" — minor additive)

## DATA-INTEGRITY findings
- Structural audit of 215 products: 0 hollow blends, 0 missing components, full source_label traceability. Source is MOSTLY faithful to labels.
- BUT real errors exist: (1) **CAL Toddy stored label was WRONG** — Luneth supplied Cal_Toddy_Facts.png (in temporary/labels/) to reconcile. (2) Label reconciliations owed: Rebound FX drink vs powder/packs (two different labels, above).
- **SCAN-BUG LESSON (important):** my first two sweeps MISSED products because they (a) only scanned `nutrients`+`blends`, not `other_ingredients`, and (b) a recursion bug dropped strings inside list fields. "Plant Derived Minerals" is often an OTHER-INGREDIENT carrier, not a quantified nutrient. The FIXED scan (scratchpad/final_scan.py logic: walk EVERY string in EVERY field incl. list elements) found 35 products vs the buggy 29. ALWAYS scan every field. 6 products were found only after the fix: Osteo FX Liquid, CAL Toddy, Herbal Rainforest, Oxybody, Ultimate Osteo fx, Women's Hormonal Balancer.

## OPEN DECISIONS / NEXT STEPS
1. Build the trace/rare coverage MATH system (600 mg PDM = 100% goal; Σ mg / 600; green/yellow/red). Decide Group B red-algae mg equivalence (1:1 to the PDM goal, or discounted / separate basis) — needs a red-algae rare-earth citation or Luneth's ruling.
2. Reconcile the corrected labels into the pillar: Cal Toddy (Cal_Toddy_Facts.png), Rebound FX drink vs powder/packs. Re-derive + re-seal.
3. Record ALL vehicle amounts into the coverage data (Gap-1 + Gap-2 fix): carry the plant-derived-mineral / trace-mineral amounts (nutrient, blend total, and note other-ingredient carriers) into the coverage embed. Currently products_embed.py drops name-only (no-amount) rows; the coverage vault (regimen-label-lookup.json) does NOT include the mineral blends. Fix so the math can run.
4. THEN build the Essentials-tab dots (hollow/blue for present-unknown; green/yellow/red for math coverage; legend; pivot flag to simple green/red).
5. Gate/test everything (invariant that vehicle amounts reach coverage; probe).

## KEY FILES / TOOLS
- Source pillar: eden/products/products.json (sealed). Derive: eden/tools/products_embed.py (→ regimen-label-lookup.json, the coverage vault — DROPS blends/no-amount) + products_composition_derive.py (reads blends, different file).
- Coverage engine: dashboard/assets/js/src/state/coverage.ts (classify(): trace_pdm rule at ~L455; the dead PDM-vehicle rule).
- Targets: essentials-targets-data.json (kinds: wallach=numeric, trace_pdm=binary rare-earths, dietary/unspecified=foundational).
- Essentials tab render: views/knowledge.ts renderEssentialsTab (~L189); groups from coverage-layout (FOUNDATIONAL/MAJOR TRACE/RARE TRACE/VITAMINS/AMINO/FATTY).
- Corpus claims: eden/corpus/claims/claims-rare-earths.json (the RARE-000301 evidence).
