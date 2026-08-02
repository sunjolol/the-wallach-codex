# Boron — design-prep build sheet
> Source materials for chronicle/header-research/boron.md. Byte-verified from sealed claims in the boron pack. NOT a design — concept choice + layout stay open for Luneth.
> Every «quote» below is a byte-exact contiguous substring of the cited claim's `verbatim` (single-line substrings chosen so no embedded newline is smuggled in). Numbers are tagged with the id whose *verbatim* actually contains them.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "boron")
- **lede** (PROPOSAL): "An essential mineral for bone metabolism — boron lets the body use calcium and magnesium efficiently and keeps the ovaries, testes and adrenals producing normal hormones."  [grounded: WAL-CLM-IMMORT-000042, WAL-CLM-RARE-000098]
- **why** (PROPOSAL): "Boron's daily target of 9.2 mg comes from Wallach's Epigenetics daily mineral program (WAL-CLM-EPIGEN-000127), which lists boron at 1–6 mg per 100 lb of body weight. The derivation takes the upper of that range (6 mg), scales it from the per-100-lb basis to the project's 154 lb (70 kg) reference body — a ×1.54 factor — and rounds to two significant figures: 6.0 × 1.54 = 9.24 → 9.2 mg/day. The source is already in mg, so there is no unit conversion; the only transforms are upper-of-range and the body-weight scale. A plain Wallach-sourced number, not a gap or a shared budget."  [source_claim_id: WAL-CLM-EPIGEN-000127 · upper_taken 6.0 · scale_factor 1.54 · round 2 sig figs]
  (target.kind is `wallach`/numeric — low 9.2 mg daily — so a real "why this number" applies; no honest-gap fallback needed.)

## Per-concept build materials

### Concept A — "Eight Days" (before/after two-state) — DOSSIER-RECOMMENDED LEAD
- **Exact quotes available**
  - WAL-CLM-IMMORT-000043 — «eight days of supplementing boron, women lost 40% less»
  - WAL-CLM-IMMORT-000043 — «33% less magnesium, and less phosphorus»
  - WAL-CLM-IMMORT-000043 — «levels of estradiol 17B doubled»
  - WAL-CLM-IMMORT-000043 — «also double in both men and women following boron»
  - WAL-CLM-IMMORT-000043 — «Boron is required for the maintenance of bone density»
  - WAL-CLM-IMMORT-000043 — «normal blood levels of estrogen and testosterone»
  - WAL-CLM-RARE-000099 (corroborates the mineral-retention half only) — «40 percent less calcium» · «33 percent less magnesium»
- **Numbers**
  - 40% (calcium retained/less lost) · % · verbatim-backed in **WAL-CLM-IMMORT-000043** ("40% less") AND WAL-CLM-RARE-000099 ("40 percent less"). Note the two spellings differ ("40%" vs "40 percent") — quote must match whichever id is cited.
  - 33% (magnesium) · % · verbatim-backed in **WAL-CLM-IMMORT-000043** ("33% less") AND WAL-CLM-RARE-000099 ("33 percent less").
  - ×2 / doubled (estradiol 17B) · — · verbatim-backed in **WAL-CLM-IMMORT-000043** ("doubled"). NOT in WAL-CLM-RARE-000099 verbatim (see traps).
  - ×2 / doubled (testosterone, both sexes) · — · verbatim-backed in **WAL-CLM-IMMORT-000043** ("also double"). NOT in WAL-CLM-RARE-000099 verbatim (see traps).
  - eight days (time-box) · days · verbatim-backed in **WAL-CLM-IMMORT-000043** ("eight days") and WAL-CLM-RARE-000099 ("eight days").
  - "less phosphorus" is stated but with NO number in any verbatim — it is a directional, not a magnitude. Do not attach a figure.
- **Figure label text** (each display string tied to its verbatim-backed id)
  - "↓40% calcium" — WAL-CLM-IMMORT-000043
  - "↓33% magnesium" — WAL-CLM-IMMORT-000043
  - "estradiol ×2" — WAL-CLM-IMMORT-000043 (verbatim word "doubled")
  - "testosterone ×2" — WAL-CLM-IMMORT-000043 (verbatim word "also double")
  - "8 days" / "within eight days" — WAL-CLM-IMMORT-000043
  - "DAY 0" / "DAY 8" (state labels) — framing chrome, not a Wallach quote; safe as our own axis labels.
- **Structure notes** — four independent before/after pairs sharing one time axis; the "×2"/"↓40%" magnitudes sit beside the bars, never as a stroke through a label (element-headers Rule 2). All four numbers come from ONE claim (IMMORT-000043), so provenance is single-source and clean.

### Concept B — "The Retainer" (single annotated figure)
- **Exact quotes available**
  - WAL-CLM-IMMORT-000042 — «efficient use of calcium and magnesium»
  - WAL-CLM-IMMORT-000042 — «efficient use of calcium and magnesium and proper function»
  - WAL-CLM-RARE-000098 — «efficient use of calcium and magnesium» (near-duplicate corroboration)
  - WAL-CLM-IMMORT-000043 — «33% less magnesium, and less phosphorus» (retention figures)
  - WAL-CLM-RARE-000099 — «40 percent less calcium» · «33 percent less magnesium»
- **Numbers**
  - 40% less calcium lost · % · verbatim-backed in WAL-CLM-IMMORT-000043 ("40% less") / WAL-CLM-RARE-000099 ("40 percent less").
  - 33% less magnesium lost · % · verbatim-backed in WAL-CLM-IMMORT-000043 / WAL-CLM-RARE-000099.
  - (The "boron holds Ca + Mg in the bone" role itself carries NO number — it is the mechanism statement in IMMORT-000042 / RARE-000098.)
- **Figure label text**
  - "boron" (on the seal/clasp) — WAL-CLM-IMMORT-000042 (subject of the claim)
  - "Ca" and "Mg" (the two retained tokens) — WAL-CLM-IMMORT-000042 ("calcium and magnesium")
  - "40% less lost" (Ca side caption) — WAL-CLM-IMMORT-000043
  - "33% less lost" (Mg side caption) — WAL-CLM-IMMORT-000043
- **Structure notes** — one bone/cross-section, two mineral tokens inside, boron as the clasp at the rim; ~4 elements, no leak-arrows crossing text. The mechanism ("efficient use / retention") is Wallach's stated RESULT — he does not give the pathway, so keep it result-worded, do not imply a "how" (dossier §5 caution).

### Concept C — "Admitted in 1990" (did-you-know curio)
- **★ CRITICAL TRAP — the curio's centerpiece fact is NOT quotable.** The "accepted as an essential nutrient for humans only in 1990" and "shown essential for growing chicks about a decade earlier" statements appear ONLY in the *claim_text* of WAL-CLM-IMMORT-000042 (and the "essential-1990" gloss on WAL-CLM-RARE-000098). **NEITHER verbatim contains "1990", "chicks", "1980", or "essential nutrient".** So the date and the chicks fact CANNOT be shown as a Wallach quote — they may only appear as our own editorial framing that cites the claim, never inside guillemets/quote-marks.
- **Exact quotes available** (the "what it actually does" pay-off only — all verbatim-backed)
  - WAL-CLM-IMMORT-000042 — «Boron is essential for bone metabolism including the»
  - WAL-CLM-IMMORT-000042 — «efficient use of calcium and magnesium and proper function»
  - WAL-CLM-IMMORT-000042 — «ovaries, testes and adrenals»
  - WAL-CLM-RARE-000098 — «boron is essential for bone metabolism»
  - WAL-CLM-RARE-000098 — «proper function of endocrine glands (i.e.- ovaries, testes and adrenals)»
- **Numbers**
  - 1990 (year humans accepted boron essential) · year · **claim_text-only — do NOT display as a quote.** Present, if at all, as our framing citing WAL-CLM-IMMORT-000042.
  - ~1980 / "about a decade earlier" (chicks) · year · **claim_text-only — do NOT display as a quote.** Same treatment.
- **Figure label text**
  - "chicks" / "~1980" and "humans" / "1990" (the two dated dots) — these are the two markers the concept needs, but BOTH are claim_text-derived framing, not Wallach's words. If used, label them as our timeline, not as quoted text.
  - "essential for bone metabolism" (the pay-off line under the marker) — WAL-CLM-IMMORT-000042 (quotable).
- **Structure notes** — two dots on one short axis, labels off the line (element-headers: no stroke through a label). The concept is honest ONLY if the 1990/1980 dates are clearly OUR editorial timeline citing the claim — the surprise fact is real per Wallach's claim_text, but it is not in his sealed verbatim, so it cannot wear quote marks. This is the weakest concept for quotable material.

### Concept D — "One Mineral, Four Diseases" (deficiency / where-it-appears map)
- **★ CRITICAL TRAP — "boron" is not in ANY of the four deficiency verbatims.** WAL-CLM-RARE-000275 (osteoporosis), -000303 (arthritis), -000304 (hypertension), -000305 (bone spurs) each NAME boron as a complicating cofactor in their *claim_text*, but **the word "boron" does not appear in any of those four verbatims.** So you cannot quote Wallach saying "boron" for these diseases. The condition NAMES are quotable; the boron LINK is claim_text/mapping-only. The only verbatims that literally place boron in a cofactor list are the two PROTOCOLS + the anecdote (below) — use those for any "boron in the list" quote.
- **Exact quotes available**
  - Osteoporosis — WAL-CLM-RARE-000275 — «The more common calcium deficiency» · «arthritis (which the allopaths treat» · «to the well known» · «osteoporosis»
  - Arthritis — WAL-CLM-RARE-000303 — «Deficiency of sulfur results in degenerative types of arthritis»
  - Hypertension — WAL-CLM-RARE-000304 — «In 1980, McCarron, et al, theorized that» · «chronic calcium deficiency probably led to» · «calcium deficiency as the cause of» (line 6 reads "hypertension, additionally recent studies")
  - Bone spurs — WAL-CLM-RARE-000305 — «kidney stones (Fig. 11-4), bone spurs» · «Up to 75% of consumed Ca is lost in»
  - Boron-in-cofactor-list (the ONLY verbatim-backed boron quotes for this map):
    - WAL-CLM-LETS-000391 — «magnesium and boron» (osteoporosis treatment)
    - WAL-CLM-RARE-000279 — «Ca, Mg, B, Cu, Se, Li» (arthritis drug→mineral replacement; "B" = boron)
    - WAL-CLM-DDDL-000309 — «calcium, magnesium, manganese, boron, copper, sulfur,» (Ma Lan bone-broth anecdote)
- **Numbers**
  - 1980 (McCarron) · year · verbatim-backed in WAL-CLM-RARE-000304 ("In 1980").
  - "More than 30 subsequent studies" · count · verbatim-backed in WAL-CLM-RARE-000304 ("More than 30 subsequent").
  - 75% (calcium lost in feces) · % · verbatim-backed in WAL-CLM-RARE-000305 ("Up to 75%") — but tangential to boron; a calcium-loss stat, not a boron figure.
  - (No boron-specific number exists for any of the four conditions — boron is a named cofactor, not a dosed quantity, in this map.)
- **Figure label text** (four condition tiles under one "boron" band)
  - "Osteoporosis" — WAL-CLM-RARE-000275 (verbatim "osteoporosis")
  - "Arthritis" — WAL-CLM-RARE-000303 (verbatim "arthritis")
  - "Hypertension" — WAL-CLM-RARE-000304 (verbatim "hypertension")
  - "Bone spurs" — WAL-CLM-RARE-000305 (verbatim "bone spurs")
  - "boron" (the shared header band) — role is asserted in the four claim_texts; verbatim support for boron-as-cofactor comes from WAL-CLM-LETS-000391 / -RARE-000279, NOT the four deficiency claims. Treat the band as our mapping label unless paired with a protocol quote.
- **Structure notes** — strictly tiled (2×2 + one band), no wired hub-and-spoke, no line through any condition label (dossier flags this concept as nearest the rejected many-station clutter). Honesty constraint: the page must not present a quote-marked line that reads as Wallach naming boron under these four diseases — that string does not exist in the verbatims.

## Trap resolutions (claim_text > verbatim)
- **1990 (boron accepted essential for humans)** -> claim_text-only in WAL-CLM-IMMORT-000042 (and RARE-000098's "essential-1990" gloss); appears in NO verbatim. Do NOT display as a quote. If used (Concept C), it is our editorial framing citing the claim.
- **"growing chicks ~a decade earlier" (~1980)** -> claim_text-only in WAL-CLM-IMMORT-000042; not in any verbatim. Do NOT display as a quote.
- **Testosterone doubling** -> cite WAL-CLM-IMMORT-000043 ("also double in both men and women"), NOT WAL-CLM-RARE-000099 (its claim_text mentions testosterone but its verbatim covers only the mineral-retention half). Dossier §5 flags this.
- **Estradiol 17B doubling** -> cite WAL-CLM-IMMORT-000043 ("estradiol 17B doubled"), NOT WAL-CLM-RARE-000099 (verbatim omits it).
- **Boron as cofactor of osteoporosis / arthritis / hypertension / bone spurs** -> named in the claim_texts of WAL-CLM-RARE-000275 / -000303 / -000304 / -000305, but "boron" is in NONE of those four verbatims. For a verbatim-backed boron-in-list quote, cite WAL-CLM-LETS-000391 ("magnesium and boron"), WAL-CLM-RARE-000279 ("Ca, Mg, B, Cu, Se, Li"), or WAL-CLM-DDDL-000309 ("...manganese, boron, copper, sulfur,").
- **Source typo to preserve if quoted** -> WAL-CLM-LETS-000391 verbatim reads "2,000 mg and 1 ,000 mg per day" (stray space in "1 ,000"). A byte-exact quote of that figure must keep the typo: «magnesium at 2,000 mg and 1 ,000 mg per day». Prefer not to quote the raw number; state it in our own copy instead.
- **Non-trap (confirmed clean)** -> 40% / 33% / "eight days" are in the IMMORT-000043 verbatim (and 40%/33%/eight-days in RARE-000099 as "40 percent"/"33 percent"). Dose "1 - 6 mg" is in the EPIGEN-000127 verbatim, matching the 9.2 mg provenance. 1980 and "30 subsequent studies" are in the RARE-000304 verbatim.

## Category / width / background (from element-headers.md)
- **Category accent:** mineral = **blue** (`data-category` mineral tint on `.kd-ep-fam`).
- **Width:** must match the element detail screen exactly — figure ceiling ~817px inside `.kd-ep-fam`; prefer a shipped slot (`--fork` 700px or `--rail` 660px) so no new CSS/scale drift. Final width is a design-time call; noted, not decided.
- **Background:** tan `.kd-ep-fam` / `--ds-paper-deep`, tinted by the mineral accent; the block leads directly into the Best-Youngevity-sources section, so the closing edge must hand off cleanly to it.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (A recommended by the dossier for highest wow-density; C is materially weaker because its centerpiece fact is not verbatim-quotable; D carries a boron-not-in-verbatim honesty constraint).
- Chassis vs composed `blocks[]` layout.
- Final layout, coordinates, figure geometry.
- Final display copy / tone (the lede + why above are PROPOSALS awaiting ratification).
- Visual sign-off (the human test gate) before any live build.
