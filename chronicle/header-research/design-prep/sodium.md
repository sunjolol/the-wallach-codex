# Sodium — design-prep build sheet
> Source materials for chronicle/header-research/sodium.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

Every quote below is a byte-exact contiguous substring of the cited claim's `verbatim` in the sealed pack (curly quotes “ ” and apostrophes ’ preserved exactly). Numbers are tagged with the claim id whose *verbatim* actually carries them; claim_text-only numbers are flagged as non-quotable.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "sodium")
- **lede** (PROPOSAL): "One of the three indispensable electrolytes — and the mineral Wallach says modern medicine was dead wrong to tell you to fear."  [grounded: WAL-CLM-RARE-000187 (electrolyte trio) + WAL-CLM-RARE-000026 (anti-low-salt stance); does not restate any concept's opening beat]
  - Alt lede (PROPOSAL): "One of three indispensable electrolytes that runs your body's water balance, pH and nerves — the one your doctor told you to cut."  [grounded: WAL-CLM-RARE-000187 + WAL-CLM-RARE-000153 (functions) + WAL-CLM-RARE-000026]
- **why** (PROPOSAL): "The 3,300 mg/day target is Wallach's own 'True Supplement Need' for an adult, taken straight from the Base Line Nutritional Supplement Program table in *Let's Play Doctor*. That row prints three figures in column order — the government RDA (1,100 mg), then Wallach's True Supplement Need (3,300 mg), then his 30-day pharmacologic dose (300–3,000 mg). We use the middle figure: 3,300 mg, roughly three times the RDA Wallach reprints only to argue against. There is no range to take an upper of, no IU conversion, and no body-weight scaling — the number ports 1:1 from his stated maintenance target, no rounding."  [source_claim_id: WAL-CLM-LETS-000066 · factors: none — direct port of the "True Supplement Need" column value; 1,100 / 3,300 / 300 / 3,000 all present in the verbatim, no mismatch]
  - target.kind = `wallach`, numeric (3,300 mg daily). Not a gap.

## Per-concept build materials

### Concept A — "The mineral they told you to fear" (the low-salt indictment)
- **Exact quotes available**
  - WAL-CLM-RARE-000026 — «Physicians would have you believe that you need little or no salt»
  - WAL-CLM-RARE-000026 — «the first food item a good husbandryman puts out for his livestock is a salt block»
  - WAL-CLM-RARE-000026 — «the multibillion dollar a year snack food industry is well aware of your need and craving for salt»
  - WAL-CLM-RARE-000003 — «a simple salt or sodium deficiency»
  - WAL-CLM-RARE-000003 — «any boy scout could diagnose and recognize and remedy with water and salt»
  - WAL-CLM-RARE-000027 — «a salt deficiency caused by the allopathic paranoia of salt»
  - WAL-CLM-RARE-000027 — «The human tragedy of the heat wave of ’93 was a direct result of the allopathic doctors who put their charges (their patients) on reduced or salt free diets for high blood pressure or heart disease»
  - WAL-CLM-RARE-000189 — «“Water intoxication” occurred in infants fed low Na formulas»
  - WAL-CLM-RARE-000189 — «their brains swelled causing death from a simple Na deficiency»
  - WAL-CLM-RARE-000188 — «Addison's Disease, a loss of function of the adrenal cortex, results in the loss of Na and K retention»
  - WAL-CLM-RARE-000188 — «a marked “salt hunger.”»
  - WAL-CLM-RARE-000190 — «The treatment for Na deficiency is water and salt either orally or IV (saline 0.9 %).»
- **Numbers**
  - 0.9 (% saline) · unit "%" · verbatim-backed in WAL-CLM-RARE-000190 («saline 0.9 %») — note the space in "0.9 %".
  - 1993 (year) · verbatim-backed as contiguous "1993" only in WAL-CLM-EPIGEN-000102, but there "July" and "1993" are separated by newlines, so «July 1993» is NOT a contiguous substring anywhere. WAL-CLM-RARE-000027 verbatim carries «’93». WAL-CLM-RARE-000003's claim_text says "July 1993" but its verbatim has no date. TRAP — see Trap resolutions.
- **Figure label text** (each string = the exact words a label/tag would show, tied to its verbatim source)
  - "little or no salt" — WAL-CLM-RARE-000026
  - "a salt block" — WAL-CLM-RARE-000026
  - "heat stroke" — WAL-CLM-RARE-000003 (the word appears in verbatim «...your basic heat stroke...»)
  - "water and salt" — WAL-CLM-RARE-000003 / WAL-CLM-RARE-000190
  - "infants fed low Na formulas" — WAL-CLM-RARE-000189
  - "the adrenal cortex" — WAL-CLM-RARE-000188
  - "0.9 % saline" — WAL-CLM-RARE-000190 (verbatim «saline 0.9 %»)
  - For the year tag: use "’93" (WAL-CLM-RARE-000027) if a verbatim-faithful string is wanted; "July 1993" would be a claim_text paraphrase, not a quote.
- **Structure notes** — one thesis anchor (the low-salt stance / salt block) + three self-contained case items (heat wave, infants, Addison's), each pointing back to the shared remedy line. Three cases, one cause; keep any connective stroke clear of every label. The remedy («water and salt … saline 0.9 %») is the single resolving element all three cases lead to.

### Concept B — Too little / too much (the narrow window)
- **Exact quotes available**
  - Deficiency side (all from WAL-CLM-LETS-000032, exact single-token substrings of the list): «hallucinations» · «illusions» · «hypotension» · «crying jags» · «memory loss» · «ataxia» · «seizures» · «anorexia» · «depression» · «muscular weakness» · «weight loss»
  - Toxicity side (all from WAL-CLM-LETS-000033): «hypertension» · «congestive heart failure» · «renal failure» · «hypertonia» · «polydipsia» · «polyuria» · «tremors» · «seizures» · «anorexia» · «weight gain»
  - Column headers (exact): WAL-CLM-LETS-000032 — «SODIUM DEFICIENCY» ; WAL-CLM-LETS-000033 — «SODIUM TOXICITY»
- **Numbers** — none. (This concept is qualitative; no numeric label.)
- **Figure label text**
  - Deficiency-pan header: "SODIUM DEFICIENCY" — WAL-CLM-LETS-000032
  - Toxicity-pan header: "SODIUM TOXICITY" — WAL-CLM-LETS-000033
  - Shared-on-the-pivot labels — ONLY the two tokens that appear byte-for-byte in BOTH lists: "anorexia" and "seizures" (deficiency = WAL-CLM-LETS-000032, toxicity = WAL-CLM-LETS-000033). Do NOT call "weight loss"/"weight gain" or "hypotension"/"hypertension" a shared term — those are opposite tokens, not the same word.
  - The psychiatric jolt labels (deficiency only): "hallucinations", "illusions" — WAL-CLM-LETS-000032.
  - Note "edema (especially low\nprotein diets)" carries an internal newline in the verbatim; for a clean label use the single token «edema» (WAL-CLM-LETS-000033).
- **Structure notes** — two opposing sign lists sharing one centre axis; the two literally-shared terms (anorexia, seizures) sit on the axis. Symmetry reads by construction if both lists hang from the same centre line. No stroke through any sign label.

### Concept C — Salt hunger (the oldest craving)
- **Exact quotes available**
  - WAL-CLM-RARE-000186 — «The average sodium dietary intake per day in western cultures is five to 12 G/day»
  - WAL-CLM-RARE-000186 — «the Japanese who on the average out live Americans by four years consume an average of 28 G/day»
  - WAL-CLM-RARE-000026 — «the first food item a good husbandryman puts out for his livestock is a salt block»
  - WAL-CLM-RARE-000188 — «a marked “salt hunger.”» (the phrase "salt hunger" appears in verbatim ONLY in the Addison's context, not the craving-hierarchy context)
- **Numbers**
  - "five to 12" (western intake low–high) · unit "G/day" (grams per day) · verbatim-backed in WAL-CLM-RARE-000186. NOTE: the low bound is spelled «five», not "5" — the digit "5" is NOT in the verbatim. If displaying "5–12", that "5" is a normalization, not a quote. Confidence: MEDIUM (this is the pack's only medium-confidence claim).
  - "28" (Japanese intake) · unit "G/day" · verbatim-backed in WAL-CLM-RARE-000186 («28 G/day»). Confidence: MEDIUM.
  - "four years" (US–Japan longevity gap) · verbatim-backed in WAL-CLM-RARE-000186 («out live Americans by four years»). Confidence: MEDIUM.
- **Figure label text**
  - "five to 12 G/day" (western) vs "28 G/day" (Japanese) — WAL-CLM-RARE-000186 (verbatim-exact for both; keep "G/day" or gloss to "g/day" as display — the digit "28" is exact, the "five" is spelled out)
  - "+ four years" / "outlive Americans by four years" — WAL-CLM-RARE-000186
  - "a salt block" — WAL-CLM-RARE-000026
  - carnivore vs herbivore / vegetarian craving contrast: NO verbatim carries this — it is claim_text only (WAL-CLM-EPIGEN-000102). Any such label is a paraphrase of claim_text, NOT a Wallach quote. TRAP — see Trap resolutions.
- **Structure notes** — a single lead statement (salt hunger as a basic craving — note: claim_text-grounded, not quotable) + a two-value intake contrast (12 vs 28) + the longevity tag. The intake bars are the only hard numbers and they are medium-confidence; do not rest the header's credibility solely on the 28 g figure. The carnivore/herbivore lanes, if used, are claim_text facts, not quotes.

### Concept D — The extracellular trio (where sodium lives and what it runs)
- **Exact quotes available**
  - WAL-CLM-RARE-000187 — «three indispensable “electrolytes”»
  - WAL-CLM-RARE-000187 — «so intimately associated in the body that they can be presented together»
  - WAL-CLM-RARE-000187 — «Sodium makes up two percent, K five percent and Cl three percent of the total mineral content of the human body»
  - WAL-CLM-RARE-000153 — «With sodium, the other “electrolyte,”»
  - WAL-CLM-RARE-000153 — «normal water balance, osmotic equilibrium and acid-base balance»
  - WAL-CLM-RARE-000153 — «the regulation of neuromuscular activity»
  - WAL-CLM-RARE-000188 — «a loss of function of the adrenal cortex» (for the hormonal-control note; see pituitary trap)
- **Numbers**
  - 2 / 5 / 3 (% of body mineral content: Na / K / Cl) · unit "%" · the DIGIT form is claim_text only (WAL-CLM-RARE-000187 claim_text). The verbatim SPELLS them: «two percent, K five percent and Cl three percent». TRAP — the "2% · 5% · 3%" proportion strip is a fact grounded in claim_text, quotable only in the spelled-out form. See Trap resolutions.
- **Figure label text**
  - Proportion strip: as a QUOTE use "two percent / five percent / three percent" (WAL-CLM-RARE-000187 verbatim). As display digits ("Na 2% · K 5% · Cl 3%") it is a claim_text-grounded fact, not a quote — acceptable as a fact label, NOT presentable as Wallach's exact words.
  - Trio names: "Sodium" · "K" (potassium) · "Cl" (chloride) — WAL-CLM-RARE-000187 (verbatim uses the symbols "Cl" and "K").
  - Function set: "water balance" · "osmotic equilibrium" · "acid-base balance" — all verbatim-exact in WAL-CLM-RARE-000153. For the nerve/muscle function use "neuromuscular activity" (WAL-CLM-RARE-000153) — NOT "muscular irritability" / "nerve excitability" (those are claim_text only). TRAP.
  - Hormonal controller: "adrenal cortex" is verbatim-backed (WAL-CLM-RARE-000188). "pituitary" is NOT in any verbatim (claim_text only) — do NOT label a pituitary controller as a quote. TRAP.
  - Extracellular / intracellular split: "extracellular" and "intracellular" appear in NO verbatim (claim_text only, WAL-CLM-RARE-000187 + WAL-CLM-EPIGEN-000102). The inside/outside-the-cell diagram is a claim_text-grounded fact, NOT quotable. TRAP.
- **Structure notes** — an identity/where-it-lives map: a proportion element (Na/K/Cl) + a location split (Na+Cl outside, K inside) + a short function list + the hormonal-control note. Per dossier §5, keep the cell diagram at the location level and do NOT depict an active sodium-potassium pump — that mechanism is absent from the pack. The proportion strip and the location split are both claim_text-grounded facts; the function names and the electrolyte-trio identity are the verbatim-quotable parts.

## Trap resolutions (claim_text > verbatim — every number/term where the naive source is NOT verbatim-backed)
- **"2% / 5% / 3%" (Na/K/Cl mineral fraction)** -> the DIGIT form is claim_text only (WAL-CLM-RARE-000187 claim_text). Verbatim spells «two percent, K five percent and Cl three percent». Display as a fact OK; quote only the spelled-out form. Do NOT present "2%" as Wallach's exact words.
- **"extracellular" / "intracellular"** -> appears in NO verbatim (claim_text only: WAL-CLM-RARE-000187, WAL-CLM-EPIGEN-000102). Concept D's inside/outside split is a claim_text-grounded fact — do NOT display as a quote.
- **"pituitary" (hormonal controller)** -> NO verbatim (claim_text only: WAL-CLM-RARE-000188, WAL-CLM-EPIGEN-000102). "adrenal cortex" IS verbatim-backed (WAL-CLM-RARE-000188). Do NOT quote a pituitary controller.
- **"salt hunger is one of the most basic cravings" + carnivore-vs-herbivore/vegetarian craving hierarchy** -> NO verbatim (claim_text only: WAL-CLM-EPIGEN-000102). The phrase "salt hunger" is verbatim ONLY in the Addison's context (WAL-CLM-RARE-000188 / WAL-CLM-EPIGEN-000102). Concept C's core narrative is a claim_text fact, not quotable.
- **"muscular irritability" / "muscular and nerve excitability"** -> claim_text only (WAL-CLM-RARE-000187 / WAL-CLM-EPIGEN-000102). The verbatim-backed term is «neuromuscular activity» (WAL-CLM-RARE-000153). Use that for the nerve/muscle function label.
- **"July 1993"** -> not a contiguous verbatim substring anywhere. WAL-CLM-RARE-000003 claim_text says "July 1993" but its verbatim has no date. Contiguous "1993" exists in WAL-CLM-EPIGEN-000102 but split from "July" by newlines; WAL-CLM-RARE-000027 verbatim has «’93». Cite «’93» (WAL-CLM-RARE-000027) for a verbatim-faithful year; "July 1993" is claim_text.
- **"5–12 g/day" low bound "5"** -> verbatim spells «five to 12 G/day» (WAL-CLM-RARE-000186); the digit "5" is not in the verbatim, and the unit is "G/day". Display "5–12" is a normalization; the exact quote is «five to 12 G/day». Also flag MEDIUM confidence on this whole claim.
- **Target numbers (3,300 / 1,100 / 300 / 3,000 mg)** -> NO trap. All four are verbatim-present in WAL-CLM-LETS-000066 («SODIUM 1,100 mg 3,300 mg 300 to 3,000 mg»). Cite LETS-000066 for any of them.

## Category / width / background (from element-headers.md)
- **Category accent** — mineral = BLUE (`data-category` mineral tint on the `.kd-ep-fam` box). Sodium is a mineral (symbol Na, pack `category: "mineral"`).
- **Width** — must match the element detail screen exactly. Real figure ceiling inside `.kd-ep-fam` is ~817px (865px box − 24px padding each side); prefer a shipped slot to avoid new CSS: `--fork` = 700px or `--rail` = 660px. Author any figure at scale 1 (viewBox width == CSS max-width) and override the ID-scoped base rule at matching specificity.
- **Background** — the tan `.kd-ep-fam` box (`--ds-paper-deep`) tinted by the mineral (blue) accent. The main content box leads directly into the Best-Youngevity-sources block, which stays at the bottom.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept (A / B / C / D) or a mix — the recommended lead is A ("the mineral they told you to fear"), with B as the calmer fallback; final call is his.
- Chassis (legacy skeleton) vs composed `blocks[]` shape.
- Final layout, coordinates, figure geometry, and label placement.
- Final display copy + tone (the ledes/why above are PROPOSALS).
- Visual sign-off before anything is built live or logged.
