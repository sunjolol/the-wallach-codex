# Iron — design-prep build sheet
> Source materials for chronicle/header-research/iron.md. Byte-verified from sealed claims (scratchpad/_packs/iron.json). NOT a design — concept choice + layout stay open for Luneth.

Every «quote» below is a byte-exact contiguous substring of the cited claim's `verbatim`. Where a natural phrase crosses a source line-break, the shorter within-line substring is given (safest for the downstream byte-check); the line-break is noted where the fuller phrase would be useful. Curly quotes (“ ” ’) and source typos (e.g. "affects") are preserved exactly.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "iron")

- **lede** (PROPOSAL): "The metal your blood is built around — three to five grams of you, most of it working inside hemoglobin and muscle to move oxygen, the rest held in reserve in your marrow and liver."
  [grounded: WAL-CLM-IMMORT-000128 (3–5 g body content; 60–70% functional / 30–40% storage) · WAL-CLM-IMMORT-000126 (hemoglobin carries oxygen). Deliberately avoids restating any concept's opening beat; does not lean on the chlorophyll image the shipped magnesium header owns.]

- **why** (PROPOSAL): "The 46 mg/day target comes from Wallach's Epigenetics daily mineral program, which recommends 15–30 mg of iron per 100 lb of body weight. We take the upper end (30 mg), scale from the 100 lb basis to a 154 lb / 70 kg reference adult (× 1.54), and round to two significant figures: 30 × 1.54 = 46.2 → 46 mg. It lines up with his Let's Play Doctor Base-Line Program, which lists a 45 mg 'True Supplement Need' for adults — the same ballpark by a different route. Both sit far above the government RDA of 18 mg, which Wallach reprints only to argue against: he holds it is too low for anyone on a high-fibre, high-phytate diet where absorption is poor."
  [source_claim_id: WAL-CLM-EPIGEN-000132 (15–30 mg per 100 lb); factors: upper-of-range = 30 → × 1.54 scale → round 2 s.f. = 46. Corroborated by WAL-CLM-LETS-000055 (45 mg True Supplement Need; RDA 18). RDA-too-low rationale: WAL-CLM-IMMORT-000132.]
  (target.kind = "wallach", numeric low = 46.0 mg — a real number, no honest-gap needed.)

## Per-concept build materials

### Concept A — "The seat oxygen rides" (single mechanism figure, with the CO punch)

- **Exact quotes available**
  - WAL-CLM-IMMORT-000126 — «It is the four iron atoms in each hemoglobin» *(within-line; the sentence continues "molecule that are central to its structure and physiological function" across two line-breaks)*
  - WAL-CLM-IMMORT-000126 — «the four iron atoms in each hemoglobin»
  - WAL-CLM-IMMORT-000126 — «Oxygen actually bonds to the iron atoms in the lung» *(the next word "capillaries" begins the following source line)*
  - WAL-CLM-IMMORT-000126 — «Iron is an essential nutrient for all terrestrial species»
  - WAL-CLM-IMMORT-000127 — «is bound to the hemoglobin iron 200 times more» *(the phrase completes "tightly than oxygen" on the next source line)*
  - WAL-CLM-IMMORT-000127 — «the hemoglobin iron 200 times more»
  - WAL-CLM-IMMORT-000127 — «this phenomenon can lead to “carbon» *(completes "monoxide poisoning!”" on the next line)*
  - WAL-CLM-IMMORT-000128 — «In a healthy adult human there is three to five grams»
  - WAL-CLM-IMMORT-000128 — «three to five grams»
- **Numbers**
  - four (iron atoms per hemoglobin) · count · WAL-CLM-IMMORT-000126 (verbatim: "the four iron atoms in each hemoglobin"; spelled "four", not "4").
  - 200 (× tighter, CO vs O₂) · multiple · WAL-CLM-IMMORT-000127 (verbatim: "200 times more").
  - three to five (grams, body content) · g · WAL-CLM-IMMORT-000128 (verbatim spells "three to five grams"; the digit form "3–5" is claim_text-only — do NOT display "3–5 g" as a quote).
- **Figure label text** (display-ready proposals; grounding id in brackets)
  - "four iron seats" / "4 iron atoms" [IMMORT-000126]
  - "O₂" / "oxygen clicks on" [IMMORT-000126 — "Oxygen actually bonds to the iron atoms"]
  - "in the lungs" [IMMORT-000126 — "in the lung capillaries"]
  - "carbon monoxide" [IMMORT-000127]
  - "200× tighter" [IMMORT-000127 — verbatim phrase is "200 times more tightly than oxygen"; "200×" is a label compression, not a quote]
  - "oxygen shut out" [IMMORT-000127 — "carbon monoxide poisoning"]
- **Structure notes** — one hemoglobin unit shown as four identical seats; two states of the SAME seat (O₂ docked · CO clamped). One idea, two states — not two diagrams. The "200×" number is the climax label. No stroke routed through any label.

### Concept B — "The body screaming for iron" (specific-sign card → clinical proof)

- **Exact quotes available**
  - WAL-CLM-DDDL-000019 — «Experimental evidence shows very clearly that “pica” is a specific sign of» *(completes "iron deficiency." on the next source line)*
  - WAL-CLM-DDDL-000019 — «Pica can drive children and adults to eat ice (pagophagia),»
  - WAL-CLM-DDDL-000019 — «dirt (geophagia), or lead paint.»
  - WAL-CLM-IMMORT-000129 — «“pica” is a specific sign of iron deficiency. The pica behavior»
  - WAL-CLM-IMMORT-000129 — «“pica” is a specific sign of iron deficiency.»
  - WAL-CLM-IMMORT-000129 — «can drive children and adults to eat ice (pagophagia), dirt»
  - WAL-CLM-IMMORT-000129 — «alcohol (alcoholism) and sugar (sweet tooth).»
  - WAL-CLM-RARE-000037 — «McDonald and Marshall (1964) reported on 25 children who ate sand.»
  - WAL-CLM-RARE-000037 — «After three to four months 11 of the 13 children given iron had lost their pica behavior compared with only 3 of the 12 given saline.»
  - WAL-CLM-RARE-000037 — «11 of the 13 children given iron had lost their pica behavior compared with only 3 of the 12 given saline.»
- **Numbers** (all verbatim-backed — RARE-000037 is a single unbroken line, so every figure quotes cleanly)
  - 25 (children in the trial) · count · WAL-CLM-RARE-000037.
  - 11 of 13 (iron group lost pica) · ratio · WAL-CLM-RARE-000037 (verbatim: "11 of the 13").
  - 3 of 12 (saline group lost pica) · ratio · WAL-CLM-RARE-000037 (verbatim: "3 of the 12").
  - three to four (months to effect) · months · WAL-CLM-RARE-000037.
  - 1964 (study year, McDonald & Marshall) · year · WAL-CLM-RARE-000037.
- **Figure label text** (display-ready proposals; grounding id in brackets)
  - "ice" / "pagophagia" [DDDL-000019, IMMORT-000129]
  - "dirt" / "geophagia" [DDDL-000019, IMMORT-000129]
  - "lead paint" [DDDL-000019 — "lead paint"; IMMORT-000129 — "lead paint"]
  - "a specific sign of iron deficiency" [DDDL-000019 / IMMORT-000129 — exact substring available]
  - "11 of 13 lost the craving on iron — 3 of 12 on salt" [RARE-000037 — verbatim says "11 of the 13 … only 3 of the 12 given saline"; the caption is a compression, the underlying figures are quotable]
- **Structure notes** — three canonical craved non-foods (ice · dirt · paint chip), each labelled once; the trial ratio sits beside them as the climax. Fewest possible elements; the number is the payoff, not a quote. The optional wider pica list (munchies/obesity, alcohol, sweet tooth) lives in IMMORT-000129 if a broader spread is wanted — but that broadens past the clean three-item row.

### Concept C — "The metal that built us" (geology/history curio → your blood)

- **Exact quotes available**
  - WAL-CLM-IMMORT-000125 — «Iron is the fourth most abundant element in the earth’s» *(completes "crust" on the next source line)*
  - WAL-CLM-IMMORT-000125 — «crust and is second only to aluminum as the most abundant»
  - WAL-CLM-IMMORT-000125 — «The “core” or interior of the earth is theorized to be»
  - WAL-CLM-IMMORT-000125 — «made up of magnetized, molten iron.»
  - WAL-CLM-IMMORT-000125 — «magnetized, molten iron.»
  - WAL-CLM-IMMORT-000128 — «In a healthy adult human there is three to five grams» *(human tie-back)*
  - WAL-CLM-IMMORT-000128 — «three to five grams»
- **Numbers**
  - fourth (most abundant element in the crust) · rank · WAL-CLM-IMMORT-000125 (verbatim: "fourth most abundant element"; spelled "fourth", not "4th").
  - second (most abundant metal, after aluminum) · rank · WAL-CLM-IMMORT-000125 (verbatim: "second only to aluminum").
  - three to five (grams in the body, tie-back) · g · WAL-CLM-IMMORT-000128.
  - ⚠ ~1100 B.C. (Iron Age) · year · **claim_text-only — do NOT display as a quote.** In WAL-CLM-IMMORT-000125's claim_text but absent from every verbatim in the pack.
  - ⚠ ~90% (of all metal extracted from ore) · percent · **claim_text-only — do NOT display as a quote.** claim_text of WAL-CLM-IMMORT-000125 only; no verbatim carries it.
- **Figure label text** (display-ready proposals; grounding id in brackets)
  - "4th most abundant element" [IMMORT-000125 — verbatim "fourth most abundant element"]
  - "2nd most abundant metal" / "after aluminum" [IMMORT-000125 — "second only to aluminum"]
  - "core: magnetized, molten iron" [IMMORT-000125 — exact substring "magnetized, molten iron."]
  - "3–5 grams inside you" [IMMORT-000128 — verbatim "three to five grams"]
  - ✗ "named an Age (~1100 B.C.)" — NOT verbatim-backed; usable as design copy ONLY if flagged as unquoted paraphrase, never in guillemets.
- **Structure notes** — earth cross-section (crust → molten core) with quiet annotations resolving to a single human-scale line (the 3–5 g). One figure, no clutter. Two of the dossier's four annotation ideas (Iron Age, 90%-of-metal) have NO verbatim home — the figure must lean on the crust-rank, metal-rank, and magnetized-core facts, which do.

### Concept D — "It was never the iron" (myth-vs-mechanism reframe)

- **Exact quotes available**
  - WAL-CLM-IMMORT-000133 — «Excesses of iron can result in cirrhosis of the liver,» *(completes "fibrosis of the pancreas…" on following lines)*
  - WAL-CLM-IMMORT-000133 — «fibrosis of the pancreas, diabetes and heart failure.»
  - WAL-CLM-IMMORT-000133 — «diseases are not the direct result of toxic effects of iron, but»
  - WAL-CLM-IMMORT-000133 — «the increased iron consumption produces an increased»
  - WAL-CLM-IMMORT-000133 — «need for selenium, chromium, vanadium, copper, zinc, etc.»
  - WAL-CLM-DDDL-000022 — «Excesses of iron can cause cirrhosis of the liver, fibrosis of the pancreas,»
  - WAL-CLM-DDDL-000022 — «These diseases are not the direct toxic affects of» *(source typo "affects" preserved; completes "iron, but rather…" next line)*
  - WAL-CLM-DDDL-000022 — «copper, zinc, etc.»
- **Numbers** — none. This concept is qualitative (blamed diseases vs the driven-deficiency mechanism); no figure to number-check.
- **Figure label text** (display-ready proposals; grounding id in brackets)
  - "Blamed: iron is toxic" [framing of IMMORT-000133 / DDDL-000022 — "not the direct… toxic effects of iron"]
  - "cirrhosis · pancreatic fibrosis · diabetes · heart failure" [IMMORT-000133 — verbatim "cirrhosis of the liver, fibrosis of the pancreas, diabetes and heart failure"]
  - "Actual: surplus iron burns through selenium · copper · zinc" [IMMORT-000133 — "increased need for selenium, chromium, vanadium, copper, zinc"]
  - "the driven deficiency does the damage" [IMMORT-000133 — "not the direct result of toxic effects of iron, but rather, the increased iron… produces an increased need"]
- **Structure notes** — two-lane reveal: lane 1 the conventional charge (four diseases) struck through; lane 2 Wallach's mechanism (surplus iron → induced need for Se/Cu/Zn, ± Cr/V). One causation arrow, routed around every word. IMMORT-000133 is the richest single home (names all five minerals + the four diseases); DDDL-000022 is the backup (Se/Cu/Zn only). **Do NOT source the mechanism from WAL-CLM-LETS-000015** — its verbatim is only a toxicity-symptom list (see traps).

## Trap resolutions (claim_text > verbatim)

- **"3–5 g" digit form** → cite WAL-CLM-IMMORT-000128, but quote "three to five grams" (spelled out in the verbatim). The digits "3–5" appear only in claim_text / dossier prose. Also present spelled-out in EPIGEN-000083's claim_text — but EPIGEN-000083's verbatim is a short deficiency-sign fragment that carries none of the big numbers; never anchor body-content numbers to it.
- **"60%" (functional iron)** → cite WAL-CLM-IMMORT-000128, but the verbatim spells it "Sixty" ("Sixty to 70%"). The digit "60" is claim_text-only. "70%" and "30 to 40%" ARE digit-present in the verbatim and quote cleanly.
- **Iron Age "~1100 B.C."** → NOT verbatim-backed anywhere. In WAL-CLM-IMMORT-000125's claim_text only. Do NOT display as a quote.
- **"~90% of extracted metal"** → NOT verbatim-backed anywhere. WAL-CLM-IMMORT-000125 claim_text only. Do NOT display as a quote.
- **Fe/Cu "2.5:1" hair ratio** → NOT verbatim-backed. WAL-CLM-RARE-000083's verbatim is generic ("The ratios of trace minerals… are good barometers"); the 2.5:1 value lives in claim_text only. Do NOT display as a quote. (Not used by concepts A–D; flagged so it isn't reached for.)
- **Excess-iron driven-deficiency mechanism** → cite WAL-CLM-IMMORT-000133 (fullest: names Se/Cr/V/Cu/Zn) or WAL-CLM-DDDL-000022 (Se/Cu/Zn), NOT WAL-CLM-LETS-000015 — LETS-000015's verbatim is only "IRON TOXICITY / anorexia / dizziness / fatigue / headaches", a symptom list that omits the entire mechanism its claim_text describes.
- **"heme 10% / plant 1%"** (absorption; the dossier's flagged 5th concept) → cite WAL-CLM-RARE-000131, whose verbatim carries both figures cleanly ("10 percent"… "one percent"; note "one" is spelled, "10" is a digit). EPIGEN-000083's claim_text also states them but its verbatim does not — cite RARE-000131.

## Category / width / background (from element-headers.md)

- **Category accent:** mineral → **blue** (Fe, symbol Fe). Per the category colour-coding memory (minerals=blue).
- **Width:** must match the element detail screen exactly. Figure width is a REQUIRED key from the closed set — `fork` 700px · `rail` 660px · `mech` 600px (real figure ceiling inside the tan box is ~817px; author the figure at scale 1). Which of the three is a design-time call.
- **Background:** the tan `.kd-ep-fam` box (`--ds-paper-deep`), tinted by the mineral (blue) category accent — because the header leads directly into the Best-Youngevity-sources block beneath it. Do not author on a white / full-width sheet.

## Still OPEN for Luneth (do NOT pre-decide)

- Which concept, or a mix (dossier §6 recommends Concept B / pica, with Concept A / oxygen-seat a close second for collection-level variety).
- Chassis (legacy fixed skeleton) vs composed `blocks[]` shape.
- Final layout, coordinates, figure width choice, illustration form.
- Final display copy and tone (the lede/why above are PROPOSALS to ratify or rewrite).
- Visual sign-off before anything is built live.
