# Vitamin B2 (Riboflavin) — design-prep build sheet
> Source materials for chronicle/header-research/vitamin-b2.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "vitamin-b2")
- **lede** (PROPOSAL): "A cofactor that becomes the cell's energy machinery — riboflavin (vitamin B2) also keeps skin, the cornea and nerve sheaths intact, which is why Wallach reads its shortage off a magenta tongue, cracked mouth corners and light-shy eyes."  [grounded: mechanism/cornea/nerve-sheaths = claim_text of `WAL-CLM-EPIGEN-000036` (STATED, not a pull-quote — see traps); magenta tongue = `WAL-CLM-RARE-000234` + `WAL-CLM-EPIGEN-000036` (verbatim); cheilosis/cracked corners = `WAL-CLM-EPIGEN-000036` (verbatim «Chelosis (cracks at the corners of the mouth and nostrils)»); light-shy eyes/photophobia = `WAL-CLM-LETS-000029` + `WAL-CLM-RARE-000234` (verbatim)]
  - Note: this is dossier §3 Candidate 1, preferred if Concept A (tongue) leads so the lede does not restate the header's opening tongue beat. Candidate 2 (sign-forward) is an alternate on the same claim IDs.

- **why** (PROPOSAL): "The daily target is 50 mg — the upper end of the 10–50 mg range Wallach lists for B2 in his Epigenetics daily-multiple supplement program. No IU conversion and no body-weight scale apply: it is a milligram vitamin taken straight at the top of Wallach's own range. It is independently corroborated by his Base Line Nutritional Supplement Program, which lists the identical 50 mg as riboflavin's maintenance 'true supplement need' — on a row that prints the government RDA at just 1.6 mg (reprinted only to argue against it) and a 30-day corrective dose of 200 to 500 mg. So 50 mg is Wallach's maintenance figure: about thirty times the RDA, and well below his short-term therapeutic ceiling."  [source_claim_id `WAL-CLM-EPIGEN-000113`; provenance original_low 10 → original_high 50 → upper_taken 50; NO IU factor, NO ×1.54 weight scale; corroboration `WAL-CLM-LETS-000064` (50 mg / 1.6 mg / 200 to 500 mg — all three verbatim-backed)]
  - target.kind = `wallach` (numeric, 50 mg/day) — no honest-gap needed.

## Per-concept build materials

### Concept A — Read the tongue (the signature first-visible-sign)
- **Exact quotes available** (byte-exact contiguous substrings of the cited claim's verbatim):
  - `WAL-CLM-EPIGEN-000036` — «Geographic tongue, magenta tongue»
  - `WAL-CLM-RARE-000234` — «magenta tongue»
  - `WAL-CLM-RARE-000234` — «erosions and swelling» (clean, no line break)
  - `WAL-CLM-RARE-000234` — «of tongue (“geographic” tongue), magenta tongue» (clean substring after the verbatim's line wrap; note curly quotes “ ” = U+201C/U+201D)
  - `WAL-CLM-RARE-000234` — «Soreness and burning of lips, mouth and tongue»
  - `WAL-CLM-LETS-000029` — «geographic tongue» (lowercase in this verbatim)
  - `WAL-CLM-EPIGEN-000036` — «Soreness and burning of lips, mouth and tongue»
- **Numbers** — none. (Concept A carries no dose figure; the one B-2-solo dose 75 mg belongs to Concept-adjacent cheilosis, `WAL-CLM-LETS-000214`, and is optional footnote material only.)
- **Figure label text** (display-ready strings, each tied to its verbatim-backed source):
  - "magenta tongue" — `WAL-CLM-RARE-000234` / `WAL-CLM-EPIGEN-000036`
  - "geographic tongue" — `WAL-CLM-LETS-000029` (or the parenthetical form «(“geographic” tongue)» from `WAL-CLM-RARE-000234`)
  - "erosions and swelling of tongue" — `WAL-CLM-RARE-000234` (verbatim-backed alternative to the claim_text-only "irregular denuded areas…" phrasing — see traps)
  - ⚠ "irregular denuded areas on the top and sides of the tongue" — CLAIM_TEXT-ONLY (`WAL-CLM-LETS-000284`); may be STATED but NOT shown as a pull-quote. Use "erosions and swelling of tongue" if a quotable figure caption is wanted.
- **Structure notes:** one central organ silhouette + two callout labels routed to empty margin; a one-line "why the tongue" note beneath. No dose, no beats.

### Concept B — The dose gap (government-vs-Wallach)
- **Exact quotes available:**
  - `WAL-CLM-LETS-000064` — «RIBOFLAVIN 1.6 mg 50 mg 200 to 500 mg» (the full three-figure row)
  - `WAL-CLM-LETS-000064` — «1.6 mg 50 mg 200 to 500 mg»
  - `WAL-CLM-LETS-000064` — «200 to 500 mg»
  - `WAL-CLM-EPIGEN-000113` — «Vitamin B2 (riboflavin) 10 - 50 mg» (note the hyphen is spaced: "10 - 50 mg")
  - `WAL-CLM-EPIGEN-000113` — «10 - 50 mg»
- **Numbers** (each: value · unit · verbatim-containing claim id · trap note):
  - 1.6 · mg · `WAL-CLM-LETS-000064` (verbatim «1.6 mg») · the ROLE "government RDA" is claim_text-only — see traps.
  - 50 · mg · `WAL-CLM-LETS-000064` (verbatim «50 mg») AND `WAL-CLM-EPIGEN-000113` (verbatim «10 - 50 mg» contains "50 mg") · the ROLE "true supplement need / maintenance" is claim_text-only.
  - 200 to 500 · mg · `WAL-CLM-LETS-000064` (verbatim «200 to 500 mg») · the ROLE "30-day pharmacologic / corrective" is claim_text-only.
  - 10–50 · mg · `WAL-CLM-EPIGEN-000113` (verbatim «10 - 50 mg») · the daily-multiple range; low end 10 mg appears ONLY here.
- **Figure label text:**
  - Numeric tier labels: "1.6 mg", "50 mg", "200 to 500 mg" — all verbatim-backed (`WAL-CLM-LETS-000064`).
  - Role/tier names: "government RDA", "true supplement need", "30-day dose" — ⚠ CLAIM_TEXT-ONLY (`WAL-CLM-LETS-000064`); the verbatim lists the three numbers WITHOUT role labels. State the roles (sealed claim), do not present them inside a « »quote. See traps.
- **Structure notes:** three magnitude tiers sized to their numbers so the 1.6 mg tier reads as a sliver; labels sit inside each tier, not crossed by any rule. This concept doubles as the "why this number" visual.

### Concept C — What it becomes (riboflavin → the cell's energy coenzymes)
- **Exact quotes available:**
  - ⚠ NONE for the mechanism. `WAL-CLM-EPIGEN-000036`'s quotable verbatim is ONLY the deficiency list — the FMN/FAD cofactor role, oxidation-reduction/energy, tryptophan→niacin, and "maintains skin/mucous membranes/cornea/nerve sheaths" all live in the claim_text, with NO verbatim span. A designer cannot pull a mechanism quote by ID. (This is the single most important flag on the whole element — dossier §5.)
  - The only mechanism-KIND claim with a quotable verbatim is the cystic-fibrosis curio, a different subject: `WAL-CLM-RARE-000010` — «a deficiency of selenium, zinc, and» + (line break) «riboflavin»; clean spans: «an acquired environmental disease», «riboflavin and exacerbated by diets also low in vitamin E».
- **Numbers** — none.
- **Figure label text** (all STATED facts from `WAL-CLM-EPIGEN-000036` claim_text — usable as diagram labels, NOT as pull-quotes; none is in any verbatim):
  - "riboflavin", "FMN (flavin mononucleotide)", "FAD (flavin adenine dinucleotide)", "oxidation-reduction / energy", "tryptophan → niacin". ⚠ ALL claim_text-only.
- **Structure notes:** left-to-right transformation with one side branch (tryptophan→niacin); few nodes; arrows routed clear of labels. Weakness: no mechanism verbatim to anchor a quote — strong as a stated-mechanism figure, weak if the design wants a mechanism pull-quote.

### Concept D — Light hurts (the cornea / eyes angle)
- **Exact quotes available:**
  - `WAL-CLM-RARE-000234` — «photophobia» · «lacrimation (tearing)» · «capillary “injection” of cornea» (curly quotes) · «cheilosis, angular stomatitis»
  - `WAL-CLM-EPIGEN-000036` — «Photophobia» · «Lacrimation (tearing)» · «Capillary “injection” of cornea» (capitalized forms; curly quotes)
  - `WAL-CLM-LETS-000029` — «blurred vision» · «cataracts» · «photophobia» · «eyes (itching, burning, red)»
- **Numbers** — none.
- **Figure label text:**
  - "photophobia" — `WAL-CLM-RARE-000234` / `WAL-CLM-LETS-000029` / `WAL-CLM-EPIGEN-000036` (verbatim)
  - "lacrimation (tearing)" — `WAL-CLM-RARE-000234` / `WAL-CLM-EPIGEN-000036` (verbatim)
  - "capillary 'injection' of cornea" — `WAL-CLM-RARE-000234` / `WAL-CLM-EPIGEN-000036` (verbatim; note the source uses CURLY quotes “injection”)
  - "blurred vision" — `WAL-CLM-LETS-000029` (verbatim)
  - "cataracts" — `WAL-CLM-LETS-000029` (verbatim)
  - ⚠ "bloodshot cornea" — CLAIM_TEXT-ONLY gloss (`WAL-CLM-RARE-000234` claim_text); the verbatim-backed label is "capillary 'injection' of cornea". Use the verbatim form for a quote.
  - ⚠ Cataract long-run stake ("clouding of the eye's lens", "most common cause of blindness in older people") — CLAIM_TEXT-ONLY (`WAL-CLM-LETS-000207`); its verbatim is the cataract TREATMENT list only. State it, do not quote it. See traps.
- **Structure notes:** one eye figure + a small signs cluster + a closing line naming the long-run stake; light rays routed to the eye, never through labels.

## Trap resolutions (claim_text > verbatim — every fact/number whose naive source is NOT verbatim-backed)
- **Mechanism facts (FMN/FAD, oxidation-reduction/energy, tryptophan→niacin, "maintains skin/mucous membranes/cornea/nerve sheaths")** -> STATE from `WAL-CLM-EPIGEN-000036` claim_text; there is NO verbatim span for any of them (its verbatim is the deficiency list only). Do NOT display as a quote. (Affects Concept C entirely and the lede's mechanism clause.)
- **"irregular denuded areas on the top and sides of the tongue"** -> claim_text-only in `WAL-CLM-LETS-000284` (its verbatim is the geographic-tongue TREATMENT list). For a quotable tongue caption use `WAL-CLM-RARE-000234` «erosions and swelling» / «of tongue (“geographic” tongue)». Do NOT quote the "denuded areas" phrasing. (Affects Concept A.)
- **Cataract definition + "most common cause of blindness in older people"** -> claim_text-only in `WAL-CLM-LETS-000207` (its verbatim is the cataract TREATMENT list). State it, do not quote it. (Affects Concept D.)
- **"Cheilosis (angular stomatitis) is the result of a vitamin B-2 (riboflavin) deficiency"** -> claim_text-only in `WAL-CLM-LETS-000214`; its verbatim is the TREATMENT only («Treatment of cheilosis includes identification / of food allergies and supplementation with B- / 2 at 75 mg t.i.d.»). Note "B-2" is split across a line break ("B-\n2"), so «B-2 at 75 mg» is NOT a contiguous substring — a quotable dose fragment is «75 mg t.i.d.». Cheilosis as a verbatim deficiency SIGN is available instead via `WAL-CLM-EPIGEN-000036` «Chelosis (cracks at the corners of the mouth and nostrils)» (note the source misspelling "Chelosis") and `WAL-CLM-RARE-000234` «cheilosis, angular stomatitis».
- **Dose-tier ROLE labels (which of 1.6 / 50 / 200 to 500 is RDA vs maintenance vs corrective)** -> the numbers ARE verbatim-backed (`WAL-CLM-LETS-000064` «RIBOFLAVIN 1.6 mg 50 mg 200 to 500 mg»), but the column-order INTERPRETATION (RDA → true supplement need → 30-day dose) lives in the claim_text. State the roles; keep them out of a « »quote. (Affects Concept B.)
- **NUMBER-MISMATCH check: CLEAN.** Every DISPLAYABLE number (1.6, 50, 200–500, 10–50) is present in a verbatim (`WAL-CLM-LETS-000064` and `WAL-CLM-EPIGEN-000113`). Dossier §5 confirms no number mismatch anywhere in the pack; all traps above are FACT/interpretation traps, not number-value discrepancies. No superseded claims (all `superseded_by: null`).
- **Absent-fact flag (do NOT inject):** the pack never states riboflavin's own colour ("yellow"/"flavus") — world knowledge, not in the corpus. Do not add it to strengthen the magenta-tongue concept. (Dossier §5.)

## Category / width / background (from element-headers.md)
- **Category accent:** vitamin = ORANGE (category color-coding: minerals=blue · vitamins=orange · aminos=green · fatty-acid=purple).
- **Width:** must match the element detail screen exactly. Author any figure at scale 1 in a `figure` block with a named width from the closed set — `mech` 600px · `fork` 700px · `rail` 660px (per element-headers.md; the real figure ceiling inside `.kd-ep-fam` is ~817px, not the 867px outer screen).
- **Background:** the tan `.kd-ep-fam` box (`--ds-paper-deep`), tinted by the vitamin (orange) accent — the header's main content box leads directly into the Best-Youngevity-sources block, which always sits at the bottom.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier recommends A "Read the tongue"; B is the strongest alternate and doubles as the "why this number" visual).
- Chassis-vs-composed layout.
- Final figure layout + coordinates.
- Final display copy / tone (the lede + why above are PROPOSALS to ratify).
- Visual sign-off (STOP for his eyes before logging/committing).
