# Sulfur — design-prep build sheet
> Source materials for chronicle/header-research/sulfur.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

> ★ NOTATION: every «…» string below is a byte-exact contiguous substring of the cited claim's `verbatim`. Where a phrase in the source crosses a line break, that break is shown as `⏎` and the string INCLUDES it (the raw verbatim byte is `\n`). A label marked **AUTHORED (claim_text-only)** is display copy the designer must write fresh — it is grounded in the claim but is NOT a quotable substring, so it must never be shown inside quotation marks.

> ★★ THE HEADLINE TRAP FOR SULFUR: most of the vivid nouns the dossier concepts lean on live ONLY in claim_text, not in any verbatim. Specifically — the `-SH` / `-S-S-` / `disulfide` / `cystine` / `methionine` notation (Concept A), and the constellation chips `hemoglobin` · `insulin` · `adrenal cortical hormones` · `antibodies` · `enzymes` · `thiamine (B1)` · `biotin` (Concept C), and the nail-fix protocol numbers `5 g ×3/day` + `75–200 mg ×3/day` (Concept D) — are ALL claim_text-only. They can be used as designed figure labels (they are faithfully grounded), but they cannot be rendered as Wallach quotes. See **Trap resolutions** below for the full list.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "sulfur")
- **lede** (PROPOSAL): "A structural atom built into most of your proteins — the sulfur amino acids and the glutathione that runs your cells — and the mineral Wallach ties to degenerating cartilage, arthritis, lupus and the 'collagen diseases' when it runs short."  [grounded: WAL-CLM-RARE-000219 (structural atom in proteins / cysteine / glutathione), WAL-CLM-RARE-000223 (arthritis, lupus, collagen diseases), WAL-CLM-RARE-000220 (sulfhydryl group in structural proteins)]
  - *Note:* keep "cystine and methionine" OUT of the lede unless the designer accepts them as authored context — those two names are claim_text-only in WAL-CLM-RARE-000219 (its verbatim names only `cysteine`). Also do NOT restate the header's opening beat (element-headers Rule 6).
- **why** (PROPOSAL): "Wallach's Base Line Nutritional Supplement Program for adults lists sulphur's True Supplement Need — the daily maintenance target — at 500 mg. The header shows that figure taken exactly as printed: no upper-of-range step (the row has no high figure), no IU conversion, no ×1.54 body-weight scale. The same row also carries his 1,000 mg 30-day pharmacologic dose (the short-term therapeutic figure, not shown) and a blank government RDA that Wallach reprints only to argue against."  [source_claim_id WAL-CLM-LETS-000067 · original_low 500 mg == posted 500 mg · upper_taken 500 · no factors applied]

## Per-concept build materials

### Concept A — The Clasp (mechanism, single annotated figure)
- **Exact quotes available**
  - WAL-CLM-RARE-000220 — «sulfhydryl group»
  - WAL-CLM-RARE-000220 — «important for the specific configuration of some structural proteins»
  - WAL-CLM-RARE-000220 — «for the biological activities of some enzymes (proteins that do work).»
  - WAL-CLM-RARE-000220 — «biological activities of some enzymes»
  - WAL-CLM-RARE-000219 — «tripeptide containing cysteine, is essential»
  - WAL-CLM-RARE-000219 — «cysteine»
  - WAL-CLM-RARE-000219 — «Glutathione, a»
- **Numbers** — none in this concept.
- **Figure label text**
  - «sulfhydryl group» — verbatim-exact (WAL-CLM-RARE-000220). The ONE quotable name for sulfur's signature chemistry.
  - `-SH` (reduced form) — **AUTHORED (claim_text-only)**; grounded in WAL-CLM-RARE-000220 claim_text ("the reduced -SH form in cysteine"). NOT in any verbatim.
  - `-S-S-` / `disulfide` — **AUTHORED (claim_text-only)**; grounded in WAL-CLM-RARE-000220 claim_text ("the oxidized disulfide -S-S- form in the double molecule cystine"). NOT in any verbatim.
  - `cystine` — **AUTHORED (claim_text-only)**; in WAL-CLM-RARE-000220 + 000219 claim_text only. `cysteine` (with e) IS verbatim-exact (000219); `cystine` (the double molecule) is NOT.
  - `methionine` — **AUTHORED (claim_text-only)**; WAL-CLM-RARE-000219 claim_text only.
  - "locks a protein into its working shape" — **AUTHORED** gloss; grounded in the «specific configuration of some structural proteins» quote.
- **Structure notes** — two protein strands joined by one bridge at the centre; two terminal groups + one clasp = three marks. If the designer wants the `-SH`/`-S-S-` notation on the marks, those are authored labels, not quotes — the only quotable caption is «sulfhydryl group» + the "specific configuration of some structural proteins" phrase. Route no strand-stroke through the group labels (dossier §2, element-headers Rule 2 stroke-through ban).

### Concept B — The Cartilage Loop (builds it, then breaks it) — *dossier's recommended lead*
- **Exact quotes available**
  - WAL-CLM-RARE-000222 — «and chondroitin sulfate (cartilage, Knox⏎gelatin).»  *(crosses one line break between "Knox" and "gelatin")*
  - WAL-CLM-RARE-000222 — «and chondroitin sulfate (cartilage, Knox»  *(newline-free stopping at "Knox")*
  - WAL-CLM-RARE-000222 — «Sulfur also occurs in carbohydrates»
  - WAL-CLM-RARE-000222 — «heparin, an anticoagulant»
  - WAL-CLM-RARE-000222 — «concentrated in the liver and other tissues,»
  - WAL-CLM-RARE-000223 — «Deficiency of sulfur results in degenerative types of arthritis»
  - WAL-CLM-RARE-000223 — «degeneration of cartilage, ligaments, tendons»
  - WAL-CLM-RARE-000223 — «Systemic Lupus Erythematosus, Sickle-cell anemia»
  - WAL-CLM-RARE-000223 — «various “collagen diseases.”»  *(the quote marks around collagen diseases are the source's smart quotes “ ” — keep them byte-exact)*
  - WAL-CLM-RARE-000223 — «Deficiency of sulfur results in degenerative types of arthritis involving degeneration of cartilage, ligaments, tendons, Systemic Lupus Erythematosus, Sickle-cell anemia and various “collagen diseases.”»  *(the full sentence, single line, no breaks — the strongest single pull)*
- **Numbers** — none in this concept.
- **Figure label text**
  - STATE 1 (present): "chondroitin sulfate" — verbatim-exact (WAL-CLM-RARE-000222). "cartilage" — verbatim-exact (same claim). "Knox gelatin" — the two words straddle a line break in the source (`Knox⏎gelatin`); "Knox" is verbatim on its own line — treat "Knox gelatin" as an AUTHORED join of two verbatim tokens if shown without the break.
  - STATE 2 (short): "degeneration of cartilage, ligaments, tendons" — verbatim-exact (WAL-CLM-RARE-000223). "arthritis" / "lupus" / "'collagen diseases'" — verbatim-exact within 000223 («degenerative types of arthritis», «Systemic Lupus Erythematosus», «collagen diseases»).
  - "builds it → breaks it" framing line — **AUTHORED**; grounded in the pairing of 000222 (sulfur IS cartilage) + 000223 (sulfur short → cartilage degenerates).
- **Structure notes** — one repeated object shown twice with one difference between the two states (dossier §2). Both claims are FULLY verbatim-backed — this is the cleanest, lowest-trap concept in the pack. Cite WAL-CLM-RARE-000223 for the collapse (NOT 000303 — see Trap note on the duplicate verbatim). This is a static two-state comparison, NOT a reversal timeline (dossier §5: no reversal anecdote exists).

### Concept C — Everywhere You Never Look (abundance-of-roles constellation)
- **Exact quotes available**
  - WAL-CLM-RARE-000221 — «Sulfur containing proteins work in indirect ways to maintain life»  *(the whole verbatim — this is the ONLY sentence 000221 carries)*
  - WAL-CLM-RARE-000221 — «work in indirect ways to maintain life»
  - WAL-CLM-RARE-000222 — «heparin, an anticoagulant»
  - WAL-CLM-RARE-000222 — «and chondroitin sulfate (cartilage, Knox»
  - WAL-CLM-RARE-000219 — «Glutathione, a»
- **Numbers** — none in this concept.
- **Figure label text — ⚠ HIGH-TRAP CONCEPT: most chips are claim_text-only**
  - `hemoglobin` — **AUTHORED (claim_text-only)**; WAL-CLM-RARE-000221 claim_text lists it, verbatim does NOT. NOT quotable.
  - `insulin` — **AUTHORED (claim_text-only)**; WAL-CLM-RARE-000221 claim_text only. NOT quotable.
  - `adrenal cortical hormones` — **AUTHORED (claim_text-only)**; WAL-CLM-RARE-000221 claim_text only. NOT quotable.
  - `antibodies` — **AUTHORED (claim_text-only)**; WAL-CLM-RARE-000221 claim_text only. NOT quotable.
  - `enzymes` — **AUTHORED (claim_text-only)** for the 000221 roster; but note `enzymes` DOES appear verbatim in WAL-CLM-RARE-000220 («biological activities of some enzymes») in a different context (protein activity, not the roll-call).
  - `heparin` — verbatim-exact (WAL-CLM-RARE-000222).
  - `chondroitin sulfate` — verbatim-exact (WAL-CLM-RARE-000222).
  - `thiamine (B1)` — **AUTHORED (claim_text-only)**; WAL-CLM-RARE-000222 claim_text names thiamine/biotin as sulfur-bearing vitamins, but the 000222 verbatim STOPS at chondroitin sulfate and never reaches them. (Separately, the literal token "THIAMINE" appears in WAL-CLM-LETS-000067's dose-table verbatim, but that is thiamine's OWN dose row — unrelated to sulfur's roster and must not be repurposed.) NOT quotable as a sulfur-role.
  - `biotin` — **AUTHORED (claim_text-only)**; WAL-CLM-RARE-000222 claim_text only. NOT quotable.
  - `glutathione` — verbatim-exact (WAL-CLM-RARE-000219, «Glutathione»).
  - central caption "all of these contain sulfur" — **AUTHORED**; the quotable anchor sentence is «Sulfur containing proteins work in indirect ways to maintain life».
- **Structure notes** — a central "S" with discrete named chips, no crossing connectors (dossier §2). CRITICAL for the designer: of ~9 candidate chips, only THREE (heparin, chondroitin sulfate, glutathione) are quotable; the other six are AUTHORED labels grounded in claim_text. This is the highest-risk concept for accidental mis-quoting — every chip must be checked against this list before it is set in quotation marks.

### Concept D — The Barometer (read your nails, first-visible-sign)
- **Exact quotes available**
  - WAL-CLM-LETS-000276 — «brittle nails indicates sulfur amino»  *(newline-free; the source continues `⏎acid deficiencies` on the next line — note "indicates" is spelled with a trailing s in the source)*
  - WAL-CLM-LETS-000276 — «brittle nails»
  - WAL-CLM-LETS-000276 — «brittle nails indicates sulfur amino⏎acid deficiencies»  *(full phrase; crosses one line break between "amino" and "acid")*
  - WAL-CLM-LETS-000276 — «white spots indicate zinc deficiency,»  *(the zinc line — useful to show WHY sulfur's nail sign must read as cracking, not spots; the adjacency the dossier §5 flags is literally in this same verbatim)*
  - WAL-CLM-LETS-000276 — «Bluish fingernails indicate chronic lung conditions (i.e., not enough»
  - WAL-CLM-LETS-000276 — «ridges can indicate iron and/or calcium deficiency and brittle nails indicates sulfur amino»
  - WAL-CLM-RARE-000219 — «cysteine»  *(for "sulfur amino acid" grounding on the trunk claim)*
- **Numbers** — the treatment-protocol numbers are ALL claim_text-only (see below); this concept has NO verbatim-backed number.
  - `5 grams three times a day` (essential fatty acids) — **AUTHORED (claim_text-only)**; WAL-CLM-LETS-000276 claim_text only. The 000276 verbatim STOPS at "acid deficiencies" and never reaches the treatment list. NOT quotable.
  - `75–200 milligrams three times a day` (betaine HCl + pancreatic enzymes) — **AUTHORED (claim_text-only)**; WAL-CLM-LETS-000276 claim_text only. NOT quotable.
- **Figure label text**
  - "brittle nails" — verbatim-exact (WAL-CLM-LETS-000276).
  - "brittle nails → sulfur amino-acid shortage" — the arrow gloss is AUTHORED; the two ends ("brittle nails", "sulfur amino acid deficiencies") are grounded in 000276 (the phrase «brittle nails indicates sulfur amino⏎acid deficiencies» is byte-exact WITH the internal line break; a break-free "sulfur amino acid" is NOT byte-exact).
  - fix micro-line naming `gelatin` / `Knox` — **AUTHORED (claim_text-only)** for the treatment context; ("Knox" does appear in WAL-CLM-RARE-000222's cartilage verbatim, a DIFFERENT claim/context — do not cross-cite it here). NOT quotable from 000276.
- **Structure notes** — one large nail figure reading as CRACKING / SPLITTING at the free edge, one call-out line, target/"why" tucked beneath (dossier §2). ★ Zinc already ships a white-spots nail figure and the zinc line sits in this SAME verbatim — the figure MUST read as brittleness, never spots (dossier §5, element-headers Rule 8: change the labels, not just the geometry). No verbatim-backed number here, so keep numbers to the header's 500 mg target only.

## Trap resolutions (claim_text > verbatim)
Every value/name below is present in a claim's `claim_text` (or the dossier prose) but ABSENT from any sealed `verbatim` — so it must be shown as AUTHORED figure copy, never inside quotation marks:

- `-SH` (reduced sulfhydryl form) -> AUTHORED from WAL-CLM-RARE-000220 claim_text; no verbatim contains "-SH". Only «sulfhydryl group» is quotable.
- `-S-S-` / `disulfide` -> AUTHORED from WAL-CLM-RARE-000220 claim_text; no verbatim contains the notation or the word "disulfide".
- `cystine` (the double molecule) -> AUTHORED from WAL-CLM-RARE-000220/000219 claim_text; only `cysteine` (single, with e) is verbatim (000219). Watch the one-letter difference.
- `methionine` -> AUTHORED from WAL-CLM-RARE-000219 claim_text; no verbatim contains it.
- `hemoglobin` -> AUTHORED from WAL-CLM-RARE-000221 claim_text; the 000221 verbatim is only «Sulfur containing proteins work in indirect ways to maintain life».
- `insulin` -> AUTHORED from WAL-CLM-RARE-000221 claim_text; not in any verbatim.
- `adrenal cortical hormones` -> AUTHORED from WAL-CLM-RARE-000221 claim_text; not in any verbatim.
- `antibodies` -> AUTHORED from WAL-CLM-RARE-000221 claim_text; not in any verbatim.
- `thiamine (B1)` -> AUTHORED from WAL-CLM-RARE-000222 claim_text; the 000222 verbatim ends at chondroitin sulfate. (The token "THIAMINE" in WAL-CLM-LETS-000067's verbatim is thiamine's own dose row — NOT sulfur, do not repurpose.)
- `biotin` -> AUTHORED from WAL-CLM-RARE-000222 claim_text; not in any verbatim.
- `arsenic` toxicity via sulfhydryl -> AUTHORED from WAL-CLM-RARE-000222 claim_text; the 000222 verbatim does NOT contain "arsenic" or "sulfhydryl" (that curio is claim_text-only — the dossier §1/§5 sources the arsenic line to 000222's claim_text, which its verbatim does not support). Do NOT display as a quote.
- EFA dose `5 grams three times a day` -> AUTHORED from WAL-CLM-LETS-000276 claim_text; not in that (or any) verbatim.
- betaine-HCl / pancreatic-enzyme dose `75–200 milligrams three times a day` -> AUTHORED from WAL-CLM-LETS-000276 claim_text; not in any verbatim.
- Verbatim-BACKED numbers (safe to quote): `500 mg` and `1,000 mg` BOTH appear in WAL-CLM-LETS-000067's verbatim («SULPHUR ? 500 mg 1,000 mg»). 500 mg is the maintenance target shown; 1,000 mg is the 30-day pharmacologic dose (not shown in the header, but real and quotable if a concept wants it).

### Duplicate-verbatim + weak-claim notes (from dossier §5, verified against pack)
- WAL-CLM-RARE-000223 and WAL-CLM-RARE-000303 carry the IDENTICAL verbatim sentence («Deficiency of sulfur results in degenerative types of arthritis…»), differently mapped (000223 → deficiency panel, Ch11 p377; 000303 → arthritis/calcium cluster, Ch7 p169). Cite ONE for any given block (prefer 000223 for the sulfur-deficiency story); never present them as two independent Wallach statements.
- WAL-CLM-RARE-000275 is calcium/osteoporosis-centric — its VERBATIM does not contain the word "sulfur" at all (sulfur appears only in its claim_text as one named co-factor). Do NOT hang any sulfur label or quote on 000275; usable only as supporting context that sulfur is among the arthritis/osteoporosis co-factor deficiencies.
- WAL-CLM-DDDL-000309 (Ma Lan's vinegar bone soup) — verbatim-backed for sulfur («would leach the calcium, magnesium, manganese, boron, copper, sulfur,» is a byte-exact single-line substring); but sulfur is one name in a mineral list — a thin curio, too weak to carry a header (dossier §5). Available quote if a concept wants a folk-practice micro-beat.

## Category / width / background (from element-headers.md)
- **Category accent:** mineral = **blue** (category colour-coding memory; sulfur `category: "mineral"` in the pack).
- **Width:** the header must match the element detail screen exactly. Real figure ceiling inside the tan `.kd-ep-fam` box is **817px** (NOT 867 — that is the outer screen; element-headers Rule 1). Prefer the two shipped exact slots — `fork` = 700px or `rail` = 660px — over a hand-rolled width; author every figure at scale 1 (viewBox width == CSS max-width) and declare the width modifier at ID-scoped specificity (element-headers Rule 2 cascade trap).
- **Background:** the element's tinted `.kd-ep-fam` box (`--ds-paper-deep`), blue-tinted; the header leads DOWN into the Best-Youngevity-sources block, so the background/main-content box is one of the four fixed things (element-headers Rule 0) and must stay continuous with that block.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier recommends B, runner-up A — his call).
- Chassis vs composed `blocks[]` shape.
- Final layout, coordinates, figure geometry, and illustration style.
- Final display copy + tone (the lede/why above are PROPOSALS to ratify, not shipped copy).
- Visual sign-off — the header stays demo-only until Luneth approves (never build live without permission).
