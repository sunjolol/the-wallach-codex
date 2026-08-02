# Vitamin B12 (Cobalamin) — design-prep build sheet
> Source materials for chronicle/header-research/vitamin-b12.md. Byte-verified from the sealed claim pack (37 claims). NOT a design — concept choice + layout stay open for Luneth.
>
> ★ Every «guillemet» string below is a byte-exact contiguous substring of the cited claim's `verbatim` (newlines inside a quote are literal `\n` line breaks in the source and are preserved). A downstream validator byte-checks each one.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "vitamin-b12")

- **lede** (PROPOSAL): "A vitamin built around a single atom of cobalt — the metal that gives it its red colour — and, unusually, one the body cannot make for itself: microbes build it out of raw cobalt, and we require the finished molecule."
  [grounded: WAL-CLM-DDDL-000044 (red colour from cobalt), WAL-CLM-RARE-000114 (single cobalt atom = central metal of B12), WAL-CLM-IMMORT-000233 (microbes manufacture B12 from elemental cobalt; vertebrates require the finished B12)]

- **why** (PROPOSAL): "Wallach's daily target is a plain 400 mcg, taken straight from the vitamin B12 (methylcobalamin) line of his Epigenetics daily-multiple program (2014, his newest book, so it wins on favor-newest). The provenance is clean and un-transformed — original 400 mcg, no IU conversion and no body-weight scaling, because B12 is dosed in micrograms directly. It sits at the top of the 250–400 mcg range he recommends elsewhere for a 'respectable safety margin' and above his earlier 200 mcg base-line 'True Supplement Need.' The whole point of the number is the gap: the government RDA is only 3–4 mcg a day, so 400 mcg is roughly 100× the official figure — deliberately, for a wide margin and for pregnancy and nursing."
  [source_claim_id: WAL-CLM-EPIGEN-000117 · target.kind = "wallach" (numeric), original_low 400, original_unit mcg, upper_taken 400 · NO IU factor · NO ×1.54 weight scale · supporting range WAL-CLM-IMMORT-000084 / WAL-CLM-RARE-000014 (250–400) · earlier need WAL-CLM-LETS-000072 (200) · RDA contrast WAL-CLM-IMMORT-000084 ("3 to 4 mcg") / WAL-CLM-LETS-000072 ("3 mcg")]
  NOTE: target is numeric and un-transformed, so this is a real provenance paragraph, not a gap statement.

## Per-concept build materials

### Concept A — The Red Crystal (the cobalt at the centre)
- **Exact quotes available**
  - WAL-CLM-DDDL-000044 — «Vitamin B12 is a red crystalline substance that is water soluble.»
  - WAL-CLM-DDDL-000044 — «is due to the cobalt in the molecule.»
  - WAL-CLM-DDDL-000044 — «cobalt in the molecule»
  - WAL-CLM-DDDL-000044 — «red crystalline substance»
  - WAL-CLM-RARE-000114 — «single cobalt atom is the central metal»
  - WAL-CLM-RARE-000114 — «component of vitamin B12 which itself is a»
  - WAL-CLM-RARE-000114 — «cofactor and activator»
  - WAL-CLM-IMMORT-000233 — «cyanocobalamine or vitamin B12»
  - WAL-CLM-IMMORT-000233 — «cobalt is unusual in that the requirement is for a cobalt»
- **Numbers** — none. This concept is pure identity; no numeric figures are used.
- **Figure label text** (each tied to the claim it came from — short display strings)
  - "cobalt" — the single centre atom · WAL-CLM-RARE-000114
  - "the central metal of B12" · WAL-CLM-RARE-000114
  - "red because of the cobalt" · WAL-CLM-DDDL-000044
  - "red crystalline · water-soluble" · WAL-CLM-DDDL-000044
  - "cyanocobalamine" (the molecule name) · WAL-CLM-IMMORT-000233
- **Structure notes** — one hero form (crystal or ring-molecule) with ONE highlighted centre atom + a small ring of call-out words radiating out; fewest elements. Route no label-line through the crystal silhouette (element-headers Rule 2 stroke-through ban). CALIBRATION: magnesium already shipped a "metal at the centre" figure — the design must read as a distinct molecule/story (colour + can't-make-it, not chlorophyll/photosynthesis). See dossier §5.

### Concept B — Made By Microbes (a supply chain from soil to you) — RECOMMENDED LEAD (dossier §6)
- **Exact quotes available**
  - WAL-CLM-IMMORT-000233 — «cobalt requirement is only found in some bacteria and algae»
  - WAL-CLM-IMMORT-000233 — «symbiotic relationship between microbes which generate and»
  - WAL-CLM-IMMORT-000233 — «manufacture B12 from elemental cobalt and vertebrates that»
  - WAL-CLM-IMMORT-000233 — «manufacture B12 from elemental cobalt»
  - WAL-CLM-IMMORT-000233 — «require B12»
  - WAL-CLM-RARE-000114 — «single cobalt atom is the central metal» (the raw-cobalt starting material, if the soil node names the atom)
- **Numbers**
  - 0.07 ppm (soil cobalt = deficient) — ★ TRAP: appears ONLY in WAL-CLM-IMMORT-000084's claim_text; its verbatim contains NO ppm figure, and no other verbatim in the pack contains it. → claim_text-only, DO NOT display as a quote. May be used as an authored figure caption ONLY if design accepts an unquoted, non-verbatim number (flag to Luneth).
  - 0.11 ppm (soil cobalt = prevents/cures) — ★ TRAP: same as above, claim_text-only in WAL-CLM-IMMORT-000084, no verbatim backing. → DO NOT display as a quote.
- **Figure label text**
  - "soil / raw cobalt" · WAL-CLM-IMMORT-000233 ("elemental cobalt")
  - "microbes build it" · WAL-CLM-IMMORT-000233 ("microbes which generate and manufacture B12")
  - "only bacteria & algae need pure cobalt" · WAL-CLM-IMMORT-000233
  - "we require the finished molecule" · WAL-CLM-IMMORT-000233 ("vertebrates that require B12")
  - (IF used, as authored non-verbatim captions, NOT quotes) "0.07 ppm = deficient" / "0.11 ppm = cured" · claim_text of WAL-CLM-IMMORT-000084 — flagged non-quotable above.
- **Structure notes** — horizontal left-to-right relay of 3–4 discrete nodes ON one connecting path (soil → microbe → food/animal → person), labels above/below the path, never a stroke through a word. The narrative arc is verbatim-backed end to end via IMMORT-000233; the soil-ppm precision is NOT verbatim-backed, so if the design wants numeric soil thresholds Luneth must accept an authored (non-quoted) figure.

### Concept C — What Survives (the loss meter)
- **Exact quotes available**
  - WAL-CLM-DDDL-000045 — «About 30 percent of B12 activity is lost during cooking»
  - WAL-CLM-DDDL-000045 — «(electric, gas, or microwave).»
  - WAL-CLM-IMMORT-000219 — «and evaporated milk have lost 40 to 90% of vitamin B,,.»  (NOTE: "B,," is the source's exact OCR bytes for "B12"; the quote must carry them verbatim)
  - WAL-CLM-IMMORT-000219 — «liver, kidney, fresh whole milk,»
  - WAL-CLM-IMMORT-000219 — «eggs, cheese and muscle meats are rich sources»
- **Numbers**
  - 30 percent (cooking loss) — value 30 · unit % · verbatim WAL-CLM-DDDL-000045 ✓ ("About 30 percent")
  - 40 to 90% (pasteurized/evaporated milk loss) — value 40–90 · unit % · verbatim WAL-CLM-IMMORT-000219 ✓ ("40 to 90%")
- **Figure label text**
  - "~30% lost in cooking" · WAL-CLM-DDDL-000045
  - "electric · gas · microwave" (the cooking forms) · WAL-CLM-DDDL-000045
  - "40–90% lost in pasteurized milk" · WAL-CLM-IMMORT-000219
  - "rich fresh sources: liver, whole milk, eggs, cheese, meats" · WAL-CLM-IMMORT-000219
- **Structure notes** — two side-by-side "how much is left" readouts (bars/vials), numbers as the headline; the two figures ARE the illustration. ★ TRAP on the culprit line: the fuller list "acid, alkali, light, oxidizing/reducing substances" is claim_text-only in WAL-CLM-DDDL-000045 and NOT in its verbatim — only the cooking forms "(electric, gas, or microwave)" are verbatim-backed. A "heat · acid · alkali · light" culprit strip would NOT be quote-safe beyond the heat forms; keep any quoted culprit text to the cooking forms.

### Concept D — Losing the Insulation (the demyelination mechanism)
- **Exact quotes available (deficiency side — verbatim-backed)**
  - WAL-CLM-RARE-000238 — «Spinal cord demyelination, progressive neuropathy, pernicious» + «anemia.»  (the "classic trio"; the source wraps "pernicious\nanemia", so quote the two byte-exact spans)
  - WAL-CLM-RARE-000238 — «Spinal cord demyelination, progressive neuropathy»
  - WAL-CLM-EPIGEN-000040 — «Brain, spinal cord, optic nerve and peripheral nerve demyelination»
  - WAL-CLM-EPIGEN-000040 — «Pernicious anemia (macrocytic, megaloblastic anemia)»
  - WAL-CLM-EPIGEN-000040 — «Neuropathy»
  - WAL-CLM-RARE-000115 — «demyelination of the spinal cord and large nerve trunks»
  - WAL-CLM-RARE-000115 — «Pernicious anemia and demyelination of the spinal cord and large nerve trunks are classic for B, /cobalt deficiency.»
- **Numbers** — none.
- **Figure label text**
  - "spinal-cord demyelination" · WAL-CLM-RARE-000238 / WAL-CLM-EPIGEN-000040
  - "progressive neuropathy" · WAL-CLM-RARE-000238
  - "pernicious anemia" · WAL-CLM-RARE-000238
  - "optic & peripheral nerves demyelinate" · WAL-CLM-EPIGEN-000040
  - (the healthy "sheathed" state has no verbatim label — see trap; label it neutrally, e.g. "insulated nerve", without attributing a myelin-building quote)
- **Structure notes** — one nerve fibre in two states along its length (sheathed → bare/stripped), three small trio labels kept OFF the fibre line. ★ MAJOR TRAP: the POSITIVE mechanism "B12 builds the myelin that insulates nerves" is claim_text-only — the word "myelin" appears in NO verbatim in the pack. EPIGEN-000040's verbatim is ONLY the deficiency list; RARE-000114's verbatim is ONLY "single cobalt atom is the central metal component of vitamin B12 which itself is a cofactor and activator" (no "myelin formation"). So the header may quote the DEFICIENCY (demyelination) faithfully, but must NOT present "B12 makes myelin / myelin = nerve insulation" as a Wallach quote. The insulation framing can live in the authored lede/gloss (paraphrase), never in guillemets.

## Trap resolutions (claim_text > verbatim — numbers/mechanisms present in claim_text but absent from any verbatim)
The dossier §5 asserts "No claim_text over-states its own verbatim." That is INCORRECT for this element — several claims carry claim_text material with no verbatim backing. Design-prep catch:

1. **0.07 ppm / 0.11 ppm (soil cobalt thresholds)** → present ONLY in the claim_text of WAL-CLM-IMMORT-000084; that claim's verbatim (RDA + 250–400 mcg + pregnancy line) has NO ppm figure, and no other verbatim in the pack does either. → claim_text-only, NOT a displayable quote. (Directly limits Concept B's soil node.)
2. **"acid, alkali, light, oxidizing/reducing substances" (B12 deactivators)** → claim_text-only in WAL-CLM-DDDL-000045; verbatim has only "cooking (electric, gas, or microwave)". → cite the cooking forms only; the broader deactivator list is not quote-safe.
3. **"myelin" / "nerve-fiber insulation" / "B12 supports/forms myelin"** → claim_text-only in BOTH WAL-CLM-EPIGEN-000040 and WAL-CLM-RARE-000114; the word "myelin" is in NO verbatim in the pack. → the myelin-BUILDING mechanism is not quotable; only DEMYELINATION (deficiency) is verbatim-backed (RARE-000238, EPIGEN-000040, RARE-000115).
4. **"works with folate to synthesize DNA/RNA" / "releases folate from its bound form"** → claim_text-only in WAL-CLM-EPIGEN-000040 (verbatim is just the deficiency list). → not quotable; paraphrase-only if used.
5. **RDA "3 to 4 mcg" vs "3 mcg"** → full "3 to 4 mcg" is in WAL-CLM-IMMORT-000084's verbatim; WAL-CLM-LETS-000072's verbatim carries only "3 mcg" (in an unlabeled column row). → cite WAL-CLM-IMMORT-000084 for "3 to 4 mcg"; cite WAL-CLM-LETS-000072 only for "3 mcg".
6. **200 / 1,000 mcg base-line columns** → both are in WAL-CLM-LETS-000072's verbatim ("VITAMIN B-12 3 mcg 200 mcg 1,000 mcg"), but the columns are UNLABELED in the verbatim; their meaning (RDA / True Supplement Need / 30-day pharmacologic) lives in the claim_text. → numbers are quote-safe; their labels are authored context, not verbatim.

## Category / width / background (from element-headers.md)
- **Category accent** — vitamin ⇒ **orange** (minerals=blue · vitamins=orange · aminos=green · fatty-acids=purple). B12 is a water-soluble vitamin.
- **Width** — the header renders inside the tan `.kd-ep-fam` box; the FIGURE ceiling is ~817px (NOT the 867px outer screen). Prefer a shipped slot for exact scale: `fork` = 700px or `rail` = 660px. Match the element detail screen width exactly; do not author a figure wider than the box (silent mis-scale). Layout/width choice stays OPEN for Luneth.
- **Background** — `--ds-paper-deep` tan/paper box tinted by the vitamin (orange) accent; it leads directly into the Best-Youngevity-sources block beneath, so the header's lower edge must hand off cleanly to that section.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept (A / B / C / D) or a mix — dossier recommends B (runner-up D); not decided here.
- Chassis (legacy) vs composed `blocks[]` layout.
- Final figure layout, coordinates, illustration style, and label placement.
- Final display copy and tone (the lede/why above are PROPOSALS for ratification).
- Visual sign-off (the STOP-for-verification gate).
