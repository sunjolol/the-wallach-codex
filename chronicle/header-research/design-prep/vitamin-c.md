# Vitamin C (Ascorbic Acid) — design-prep build sheet
> Source materials for chronicle/header-research/vitamin-c.md. Byte-verified from sealed claims (scratchpad `_packs/vitamin-c.json`). NOT a design — concept choice + layout stay open for Luneth.
>
> Convention: every «guillemet» string is a byte-exact contiguous substring of the cited claim's `verbatim`, newline-free unless a "(spans line break)" note says otherwise. A downstream validator byte-checks each one, so copy them as-is.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "vitamin-c")
- **lede** (PROPOSAL): "Vitamin C — ascorbic acid, the nutrient the body needs to build and hold together its connective tissue and to defend itself, and whose classic deficiency disease is scurvy."  [grounded: WAL-CLM-EPIGEN-000043 (cofactor/collagen/immune — claim_text, NOT verbatim; safe in a shipped lede which is our voice, not a quote); WAL-CLM-RARE-000241 + WAL-CLM-LETS-000428 (scurvy named in verbatim)]
  - Alt lede if the chosen header opens on the scurvy/deficiency beat (avoid restating it), dose-forward: "Vitamin C — ascorbic acid, the vitamin the government caps at 60 mg to prevent scurvy and Wallach sets at 1,000 mg to keep the body built."  [grounded: WAL-CLM-LETS-000073, WAL-CLM-EPIGEN-000118]
- **why** (PROPOSAL): "Wallach's Epigenetics daily-multiple program lists vitamin C at 250–1,000 mg; the target takes the upper bound, 1,000 mg. The figure is already in milligrams, so there is no IU conversion and no body-weight scaling, and 1,000 is already at two significant figures — nothing to round. It is the same number his Let's Play Doctor 'Base Line' program calls the True Supplement Need, set against the government's 60-mg RDA."  [source_claim_id = WAL-CLM-EPIGEN-000118 · provenance.upper_taken = 1000 · original_low 250 / original_high 1000 mg · IU factor = none · ×1.54 = none · round = none (already 2sf) · corroborated by WAL-CLM-LETS-000073]
  - target.kind = "wallach" (a plain numeric mg target) — no honest-gap needed.
  - ⚠ Do NOT surface the 10,000 mg from the same LETS-000073 row as the daily "why" number: it is the 30-day *pharmacologic* column, not the maintenance target.

## Per-concept build materials

### Concept A — The Number War (60 vs 1,000 vs 10,000)
- **Exact quotes available**
  - WAL-CLM-LETS-000073 — «VITAMIN C 60 mg 1,000 mg 10,000 mg»  (the whole three-figure row; column order = government RDA · Wallach True Supplement Need · 30-day pharmacologic dose)
  - WAL-CLM-EPIGEN-000118 — «Vitamin C (ascorbic acid) 250 - 1,000 mg»  (the daily-multiple range; note spaces around the hyphen "250 - 1,000")
- **Numbers**
  - 60 · mg · WAL-CLM-LETS-000073 (verbatim) — the RDA column; Wallach "reprints the RDA only to argue against it" (that framing lives in the claim_text, not the verbatim — do not quote it, paraphrase it in our voice).
  - 1,000 · mg · WAL-CLM-LETS-000073 (verbatim) AND WAL-CLM-EPIGEN-000118 (verbatim) — the maintenance target, agreed across two books.
  - 10,000 · mg · WAL-CLM-LETS-000073 (verbatim) — ⚠ 30-day *pharmacologic* dose, NOT a daily maintenance figure; must be captioned therapeutic.
  - 250 · mg · WAL-CLM-EPIGEN-000118 (verbatim) — lower bound of the daily range.
  - Ratio "~17× above RDA / ~167×" — dossier arithmetic, NOT a Wallach-stated number. Frame as our observation, never as a quote.
- **Figure label text** (display strings, each tied to its verbatim-backed number)
  - `60 mg` / caption `government RDA` — LETS-000073
  - `1,000 mg` / caption `Wallach's daily target` — LETS-000073 + EPIGEN-000118
  - `10,000 mg` / caption `30-day therapeutic dose` — LETS-000073 (caption discipline: therapeutic, not daily)
- **Structure notes** — three quantities on ONE shared scale so the eye reads the gap by construction; the 10,000 bar running off the comfortable width IS the message. Label each measure at its end, off the fill. No crossing strokes. Fully verbatim-safe.

### Concept B — Come Apart at the Seams (the deficiency cascade)  [dossier's recommended lead]
- **Exact quotes available** — the deficiency SIGNS are all verbatim (the unifying word "collagen/connective tissue" is NOT — see traps):
  - WAL-CLM-RARE-000241 — «Scurvy, bleeding gums, anemia, poor appetite, poor growth, high risk for infection, high risk for cancer, loosened teeth, skin hemorrhages, swollen wrist and ankle joints, rib/cartilage fractures.»  (the full scurvy list, one line)
    - shorter pulls from the same claim: «bleeding gums» · «loosened teeth» · «skin hemorrhages» · «swollen wrist and ankle joints» · «rib/cartilage fractures.» · «high risk for infection, high risk for cancer»
  - WAL-CLM-EPIGEN-000043 — «Vitamin C deficiency can result in:»  then individual lines: «Bleeding gums» · «Loose teeth» · «Skin hemorrhages» · «Slow wound healing» · «Elevated cancer risk» · «Swollen joints (particularly wrist and ankles)» · «Rib and cartilage fractures»  (note capitalized line-items in this claim)
  - WAL-CLM-LETS-000038 — «bleeding gums/loose teeth» · «easy bruising» · «impaired wound healing» · «irritability» · «joint pain» · «depression/malaise/tiredness»  (the everyday sub-scurvy face)
- **Numbers** — none. This concept carries no dose figures; it is a sign cascade.
- **Figure label text** (short tags, each a verbatim-backed sign — pick 4–5, keep to five max)
  - `bleeding gums` — RARE-000241 / EPIGEN-000043 (`Bleeding gums`) / LETS-000038
  - `loose teeth` — LETS-000038 / EPIGEN-000043 (`Loose teeth`); or `loosened teeth` — RARE-000241
  - `skin hemorrhages` — RARE-000241 / EPIGEN-000043 (`Skin hemorrhages`)
  - `swollen joints` — EPIGEN-000043 (`Swollen joints (particularly wrist and ankles)`) / RARE-000241 (`swollen wrist and ankle joints`)
  - `rib & cartilage fractures` — RARE-000241 (`rib/cartilage fractures.`) / EPIGEN-000043 (`Rib and cartilage fractures`)
  - the signature recurring triad across all three tables: bleeding gums + loose/loosened teeth + skin hemorrhages
- **Framing word** — "collagen / connective tissue" may NAME the unifying idea but is cited to claim_text (WAL-CLM-EPIGEN-000043 / -LETS-000038 / -RARE-000241), NOT pulled as a quote. Pull-quote, if wanted, = one of the deficiency lists above.
- **Structure notes** — one central illustration (connective tissue fraying at a corner) with 4–5 verbatim signs read off it as short tags; the signs ARE the content, no 1-2-3 beats. Each tag set OFF the fibre lines (no strand crossing a word). Do not grow into a many-station body map.

### Concept C — The Dose That Rises (dose scales with the emergency)
- **Exact quotes available**
  - WAL-CLM-EPIGEN-000118 — «Vitamin C (ascorbic acid) 250 - 1,000 mg»  (daily maintenance)
  - WAL-CLM-LETS-000417 — «Vitamin C IV at 5-10 gms per day»  (Reye's syndrome, IV crisis dose — one line, clean pull)
  - WAL-CLM-LETS-000225 — «vitamin C to bowel tolerance»  (the cold, contiguous single-line pull of the signature phrase)
  - WAL-CLM-LETS-000163 — «C at 1,000 mg t.i.d. as time release tablets»  (bleeding bowels, a numbered non-crisis step)
  - abrasion figure (LETS-000118): the numeral is verbatim but "grams" wraps a line — see Numbers.
- **Numbers**
  - 1,000 · mg (daily) · WAL-CLM-EPIGEN-000118 (verbatim, upper of 250–1,000) or WAL-CLM-LETS-000073 (verbatim).
  - 1-5 · grams (abrasions, oral) · WAL-CLM-LETS-000118 — ⚠ the numeral «1-5» is verbatim, but the word "grams" is on the NEXT line («1-5\ngrams»), so "1-5 grams" is NOT a clean single-line pull; display the value, quote only «1-5» if a quote is needed.
  - 5-10 · grams/day IV (Reye's) · WAL-CLM-LETS-000417 (verbatim «5-10 gms per day»).
  - 1,000 · mg t.i.d. time-release (bleeding bowels) · WAL-CLM-LETS-000163 (verbatim).
  - ⚠ TRAP — flu "1,000-mg time-release tablets hourly": appears ONLY in WAL-CLM-LETS-000279's claim_text; its verbatim is cut off before that clause and contains NO "1,000" / "hourly" / "time-release". Do NOT display as a quote, and do NOT use it as a step number.
- **Figure label text** (one dose per tread; labels sit on the treads, no stroke through text)
  - `daily maintenance` / `1,000 mg` — EPIGEN-000118
  - `scrape / abrasion` / `1–5 g oral` — LETS-000118
  - `common cold` / `to bowel tolerance` — LETS-000225 (or DDDL-000094)
  - `Reye's syndrome` / `5–10 g/day IV` — LETS-000417
- **Structure notes** — an ascending ladder read left-to-right (or bottom-to-top), each step a situation with its dose; distinct from A (A = three fixed institutional figures side-by-side; C = dose climbing WITH severity). ⚠ Frame as "dose rises with need," NOT "escalate until diarrhea" — the *meaning* of "bowel tolerance" is nowhere in any verbatim in this pack (outside knowledge; do not explain the method). Overlaps A thematically — ship only one of A/C as lead.

### Concept D — On Every Page (the universal supplement)
- **Exact quotes available**
  - featured cold protocol — WAL-CLM-DDDL-000094 — «bioflavonoids at 150 mg t.i.d.»  and WAL-CLM-LETS-000225 — «vitamin C to bowel tolerance» · «bioflavonoids at 150 mg t.i.d.» · «chicken rice soup» · «bed rest, avoid chills»
    - ⚠ "proven by Harvard to be best cold therapy" and "mucus is protein similar to egg white" and "especially potassium" each SPAN a line break in LETS-000225's verbatim («proven by\nHarvard», «mucus\nis protein», «electrolytes\n(especially potassium)») — not clean single-line pulls; paraphrase in our voice or quote only the newline-free fragment «chicken rice soup».
  - the one verbatim biochemical mechanism (optional worked fact) — WAL-CLM-DDDL-000021 — «Ascorbic acid increases the absorption of iron»
- **Numbers**
  - 150 · mg t.i.d. (bioflavonoids in the cold protocol) · WAL-CLM-DDDL-000094 (verbatim) / WAL-CLM-LETS-000225 (verbatim). (This is the bioflavonoid dose, not vitamin C's.)
  - The breadth "count" (~67 conditions) is an observation about THIS pack's contents, NOT a Wallach-stated figure — frame as "he reaches for it in almost everything," never as a quoted number.
- **Figure label text** (halo of ~8 named conditions — names only, no radiating spokes; each grounded by a real protocol claim)
  - `common cold` — WAL-CLM-DDDL-000094 / WAL-CLM-LETS-000225
  - `cancer` (melanoma / leukemia) — WAL-CLM-LETS-000342 / WAL-CLM-LETS-000344
  - `scurvy` — WAL-CLM-LETS-000428
  - `bleeding gums` — WAL-CLM-LETS-000164
  - `bruises` — WAL-CLM-LETS-000173
  - `arthritis` — WAL-CLM-LETS-000146
  - `hepatitis` — WAL-CLM-LETS-000298
  - `allergies` — WAL-CLM-LETS-000128
  - central node label: `C` (or `Vitamin C`)
  - featured callout (the worked example): cold protocol = vitamin C to bowel tolerance + bioflavonoids 150 mg t.i.d. + garlic + chicken-rice soup (DDDL-000094 + LETS-000225)
- **Structure notes** — a hub-with-halo: a central "C" node ringed by ~8 condition names as an even halo, NO connecting lines (spokes are the rejected cluttered-diagram trap). One featured cold-protocol callout beside/below. Keep the ring clean — the moment it grows spokes or labels-on-lines it becomes the many-station diagram.

## Trap resolutions (claim_text > verbatim — cite the verbatim-backed id)
- **1,000-mg hourly (flu)** -> there is NO verbatim source; it lives ONLY in WAL-CLM-LETS-000279's claim_text (verbatim is truncated before the clause). Do NOT display as a quote or a step number. "claim_text-only, do not display as a quote."
- **18 mg iron RDA** -> claim_text-only in WAL-CLM-DDDL-000021 (verbatim has only the HCl/ascorbic-acid/clays sentence, no "18"). Not used by any concept above; flagged so it is never pulled as a quote.
- **"collagen / connective tissue / immunity cofactor" (vitamin C's identity mechanism)** -> claim_text-only across WAL-CLM-EPIGEN-000043, WAL-CLM-LETS-000038, WAL-CLM-RARE-000241; every matching verbatim is a bare deficiency LIST. Usable as a framing WORD (cite claim_text), never as a pulled quote. The ONLY mechanism present in a verbatim is iron absorption (WAL-CLM-DDDL-000021).
- **"bowel tolerance" method** -> the phrase «vitamin C to bowel tolerance» is verbatim and ubiquitous, but its MEANING (raise dose until the bowel loosens, then back off) is in NO verbatim in this pack — outside knowledge. Present dose-rises-with-severity only; do not explain the escalate-to-diarrhea mechanism.
- **10,000 mg (LETS-000073)** -> IS verbatim (not a claim_text-only trap), but it is the 30-day pharmacologic column, not the daily target. Must be captioned therapeutic wherever shown, or it misreads as an everyday dose.
- **~17× / ~167× RDA ratios** and **~67-condition breadth count** -> dossier/pack arithmetic and observation, NOT Wallach-stated numbers. Frame as our observation, never as quotes.
- **1-5 grams (abrasions, LETS-000118)** -> numeral «1-5» is verbatim; the word "grams" wraps to the next line («1-5\ngrams»), so "1-5 grams" is not a clean single-line quote. Value is verbatim-backed; quote only the newline-free fragment if a quote is required.

## Category / width / background (from .claude/rules/element-headers.md)
- **Category accent** — VITAMIN → **orange** (minerals=blue · vitamins=orange · aminos=green · fatty-acid=purple). Category comes from canon, never hardcoded in a view.
- **Width** — the figure renders inside the tan `.kd-ep-fam` box at the element detail width; the real FIGURE ceiling is **817px** (the `.kd-ep-fam` clientWidth 865px minus `--ds-space-5` padding a side), NOT the 867px outer screen. Prefer the two shipped exact slots that need no new CSS: `--fork` = **700px** or `--rail` = **660px**. Author every figure at scale 1 (viewBox width == CSS max-width). Any `kd-ep-fam__*` width/size override must be written at ID specificity (`#drawer-knowledge-mount .kd-ep-fam__figure.<modifier>`) or it loses the cascade and silently mis-scales every label. Figure-type labels: selenium standard ~12.0px, element glyph ≤17.6px CEILING (not a floor).
- **Background** — the tan main content box (`--ds-paper-deep`) tinted by the orange vitamin accent, because the header leads directly into the Best-Youngevity-sources block beneath it. Best-Youngevity-sources always sits at the bottom.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or which mix (A/C are one "dose" slot — ship only one as lead; B and D are the mechanism/breadth slots).
- Chassis (legacy fixed skeleton) vs composed `blocks[]` shape — a design-time call; new headers should be composed, but that is his decision.
- Final layout, coordinates, illustration drawing, section count, whether there are beats/a stat/a pull-quote at all, and their order.
- Final display copy + tone (the ledes/why above are PROPOSALS to ratify, not final).
- Visual sign-off — STOP for his eyes before building live (every header is demo-only until he approves).
