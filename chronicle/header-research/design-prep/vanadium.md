# Vanadium — design-prep build sheet
> Source materials for chronicle/header-research/vanadium.md. Byte-verified from sealed claims in the vanadium pack. NOT a design — concept choice + layout stay open for Luneth.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "vanadium")

- **lede** (PROPOSAL): "A trace mineral needed in micrograms and best known as chromium's partner against blood sugar — Wallach ties its shortage to type-2 diabetes, high cholesterol, and the craving that reaches for a soft drink before water."
  - [grounded: WAL-CLM-RARE-000257 (diseases of deficiency incl. diabetes + elevated cholesterol), WAL-CLM-RARE-000256 (inhibits cholesterol synthesis), WAL-CLM-IMMORT-000467 / WAL-CLM-RARE-000313 (soft drink first, water last)]
  - Note: this is the partnership-led lede (dossier §3 candidate 1). Pair it with an insulin-opening concept (A) so the lede doesn't pre-spend the insulin hook. If the chosen concept does NOT open on insulin, dossier §3 candidate 2 (insulin-led) is the alternative — but it leans on "1971," which is a claim_text-only number (see traps below): keep 1971 out of shipped copy unless design confirms it against the source image.

- **why** (PROPOSAL): "Wallach's daily mineral program in *Epigenetics* lists vanadium at 50–100 mcg per 100 lb of body weight (WAL-CLM-EPIGEN-000138). The target takes the upper end of that range (100 mcg), scales from per-100-lb to a 154-lb / 70-kg reference body (×1.54 → 154 mcg), and rounds to two significant figures — 150 mcg a day. Worth surfacing honestly: an older *Let's Play Doctor* row lists a larger 500 mcg 'True Supplement Need' (WAL-CLM-LETS-000070). The app uses the newer, body-weight-scaled figure as the maintenance target; both remain on record, neither is superseded."
  - [source_claim_id: WAL-CLM-EPIGEN-000138 · original range 50–100 mcg per 100 lb · upper_taken 100 · scale_factor 1.54 → 154 · rounding 2 sig figs → 150 mcg · second live figure: WAL-CLM-LETS-000070 = 500 mcg]
  - target.kind = "wallach" (numeric), so the provenance paragraph applies — no honest-gap fallback needed.

## Per-concept build materials

### Concept A — "The insulin stand-in"
- **Exact quotes available** (each is a byte-exact contiguous substring of the cited claim's verbatim):
  - WAL-CLM-DDDL-000034 — «insulin by altering cell membrane function for ion transport.»
  - WAL-CLM-DDDL-000034 — «by altering cell membrane function for ion transport»
    - (The fuller phrase "function like insulin" spans a line break in the verbatim — "function\nlike insulin" — so it is NOT a clean single-line substring; use one of the two above, or quote across the break deliberately.)
  - WAL-CLM-DDDL-000035 — «reducing or even eliminating most cases of adult onset»
    - (verbatim runs "…adult onset\ndiabetes"; the word "diabetes" sits after a line break. Dossier §1 paraphrased this as "reduce or even eliminate…" — the verbatim is the -ing form "reducing or even eliminating." Use the verbatim wording.)
  - WAL-CLM-DDDL-000047 — «University of Vancouver, BC, Canada stated that»
  - WAL-CLM-DDDL-000047 — «insulin for adult onset diabetics.»
    - (The full prediction "vanadium will replace\ninsulin for adult onset diabetics." spans a line break — "replace\ninsulin"; and the sentence is wrapped in curly quotes “ ” in the source. To show the whole line, quote across the break; for a clean single-line pull use «insulin for adult onset diabetics.»)
  - WAL-CLM-RARE-000255 (optional cardiovascular closer, "underrated second job") — «Vanadium initiates an increase in the contractile force of heart muscle known as the “inotropic effect.”»
  - WAL-CLM-RARE-000256 (optional) — «Vanadium inhibits cholesterol synthesis in animals and humans»
- **Numbers**:
  - "1971" (proven essential) — ⚠ TRAP: appears ONLY in the claim_text of WAL-CLM-RARE-000253; its verbatim (the absorption sentence) contains no "1971." No verbatim in the entire pack contains "1971." Do NOT display 1971 as a quote or a sourced figure without design confirming against the source image. Flag as "claim_text-only."
  - "1985" (Univ. of Vancouver prediction date) — ⚠ TRAP: the year 1985 is in the claim_text of WAL-CLM-DDDL-000047 and the dossier prose, but NOT in that claim's verbatim (which starts "the medical school at the University of Vancouver…"). Do not display "1985" as a quote; the quote itself is datable only in prose, not verbatim.
- **Figure label text** (exact display-ready strings, each tied to a verbatim-backed claim):
  - `insulin by altering cell membrane function for ion transport` — WAL-CLM-DDDL-000034
  - `vanadium will replace insulin for adult onset diabetics` — WAL-CLM-DDDL-000047 (note: source wraps this in curly quotes and breaks the line at "replace\ninsulin"; strip the break for a label)
  - Dossier's proposed two-word labels "V sensitizes the receptor" / "glucose gets in" are DESIGN COPY, not quotes — the pack has no verbatim for "sensitizes the receptor" or "glucose gets in" as phrases. Author them as chrome (R4 view prose), do not present as Wallach's words.
- **Structure notes**: dossier proposes a single mechanism figure carrying the block, one framing line above, the 1985 prediction as the closing beat below, no beat-list. Materials support: one mechanism quote (DDDL-000034) + one prediction quote (DDDL-000047) + one prognosis line (DDDL-000035). The "sharpen the receptor" focus/tuning motif is illustrative invention grounded in the mechanism claim, not a quoted image.

### Concept B — "Same mineral, 1000× the difference" (absorption trade-off)
- **Exact quotes available** (all from the single source WAL-CLM-RARE-000253):
  - WAL-CLM-RARE-000253 — «Metallic vanadium (vanadyl sulfate) is absorbed from the intestinal tract very poorly at only 0.1 to 1.0 %»
  - WAL-CLM-RARE-000253 — «vanadium chelates at 40 % and plant derived colloidals at up to 98 %»
  - WAL-CLM-RARE-000253 — «plant derived colloidals at up to 98 %»
- **Numbers** (all three verbatim-backed in WAL-CLM-RARE-000253 — no trap):
  - 0.1 to 1.0 · % · WAL-CLM-RARE-000253 (verbatim reads "0.1 to 1.0 %" — space before %)
  - 40 · % · WAL-CLM-RARE-000253 (verbatim "40 %")
  - 98 · % · WAL-CLM-RARE-000253 (verbatim "98 %", i.e. "up to 98 %")
- **Figure label text** (exact substrings / display strings tied to WAL-CLM-RARE-000253):
  - `Metallic vanadium (vanadyl sulfate)` — the low rung
  - `0.1 to 1.0 %` — its figure
  - `vanadium chelates` — the middle rung
  - `40 %` — its figure
  - `plant derived colloidals` — the top rung
  - `98 %` — its figure (verbatim qualifies it "up to 98 %")
- **Structure notes**: three comparison rungs/vials/fill-bars ascending, one per form, the percentage as the hero figure per rung. A single self-contained claim yields all three tiers — no cross-claim assembly, no connecting stroke through any label. Ties into the Best-Youngevity-sources block that follows (colloidal form is the top rung). NB the spread is ~1% → 98%, i.e. up to ~1000× more of the swallowed dose absorbed depending on form; "1000×" is a design framing derived from the range, not a Wallach phrase.

### Concept C — "The soft drink you reach for before water" (everyday reframe)
- **Exact quotes available**:
  - WAL-CLM-RARE-000313 — «soft drinks being the usual first choice and water the last» (clean, single-line; preferred over IMMORT-000467 whose equivalent phrase breaks across a line: "…water the last for\nminerally deficient humans")
  - WAL-CLM-IMMORT-000467 — «soft drinks being the usual first choice and water the last for» (same idea, ends "…the last for" before a line break — use only if the "for minerally deficient humans" continuation is wanted)
  - WAL-CLM-RARE-000039 — «The “munchies”, cravings for alcohol and candy cravings (especially chocolate) are sure signs of a chromium and vanadium deficiency.»
  - WAL-CLM-RARE-000313 — «The “munchies”, cravings for alcohol and candy cravings (especially chocolate) are sure signs of a chromium and vanadium deficiency.» (identical sentence also present here)
  - WAL-CLM-RARE-000042 — «“Allergic shiners” indicate food allergies (including sugar problems) and deficiencies of Cr, V and Li.»
  - WAL-CLM-RARE-000042 — «deficiencies of Cr, V and Li.»
  - WAL-CLM-LETS-000043 — «VANADIUM DEFICIENCY» · «diabetes» · «hypoglycemia» (the table rows, each a byte-exact line)
- **Numbers**: none. This concept is qualitative (behaviour + visible signs); no figure to number-check.
- **Figure label text** (exact, tied to claim):
  - `soft drinks being the usual first choice and water the last` — WAL-CLM-RARE-000313 (the ordering)
  - `Allergic shiners` — WAL-CLM-RARE-000042 (the visible tell; source wraps it in curly quotes “Allergic shiners”)
  - `Cr, V and Li` — WAL-CLM-RARE-000042 (what the shiners flag)
  - Note: the two-word framing "first choice" / "reached-for last" the dossier sketches are display chrome built from the quote above, not separate verbatims.
- **Structure notes**: a reframe — everyday reading vs. what Wallach says it means — flanking one small object (soft-drink cup reached for FIRST, water glass LAST; an ordering, not a diagram). "Allergic shiners" available as an optional tiny second read (dark under-eye circles). Keep to one clear object; do not build a symptom chart. This is the only concept that is unavoidably Cr+Va (every craving quote names both minerals) — copy must keep vanadium foreground.

### Concept D — "A dog's life" (the infant-formula curio)
- **Exact quotes available** (all from WAL-CLM-RARE-000043):
  - WAL-CLM-RARE-000043 — «Science Diet dog food has 40 minerals in it»
  - WAL-CLM-RARE-000043 — «Purina rat pellets have 28 minerals»
  - WAL-CLM-RARE-000043 — «not one human infant formula has more than 12 minerals»
  - WAL-CLM-RARE-000043 — «chromium, vanadium and lithium are totally absent»
  - WAL-CLM-RARE-000043 — «a dog's life may not be so bad» (the payoff line; straight apostrophe in "dog's")
  - Optional supporting caption (NOT the figure) — WAL-CLM-DDDL-000008 — «died of diabetes, a chromium and vanadium deficiency.»
- **Numbers** (all three verbatim-backed in WAL-CLM-RARE-000043 — no trap):
  - 40 · minerals · WAL-CLM-RARE-000043 (Science Diet dog food)
  - 28 · minerals · WAL-CLM-RARE-000043 (Purina rat pellets)
  - 12 · minerals · WAL-CLM-RARE-000043 (human infant formula — verbatim qualifies "more than 12", i.e. an upper bound; dossier renders it "≤12")
- **Figure label text** (exact, tied to WAL-CLM-RARE-000043):
  - `Science Diet dog food` — `40`
  - `Purina rat pellets` — `28`
  - `human infant formula` — `12` (verbatim: "more than 12 minerals" — the ≤12 framing is a reading of "not one … has more than 12")
  - `chromium, vanadium and lithium are totally absent` — the ABSENT flag on the formula tally
  - `a dog's life may not be so bad` — the wry payoff
- **Structure notes**: three labelled tallies (40 / 28 / 12), one small "absent" flag on the last, one wry one-line payoff. The three counts are the whole figure; no crossing strokes. Weaker on *what vanadium does* than A–C (teaches the absence, not the action) — best if character is wanted over mechanism.

## Trap resolutions (claim_text > verbatim)
Every number/fact where the naive citing id differs from a verbatim-backed source:
- "1971" (proven essential trace mineral) -> NO verbatim in the pack contains it. It lives only in the claim_text of WAL-CLM-RARE-000253 (and the dossier attributes it to RARE-000253 + DDDL-000035; neither verbatim carries it). FLAG: claim_text-only, do NOT display as a quote or sourced date. If design wants "1971," confirm against the source image first.
- "1985" (Univ. of Vancouver prediction) -> claim_text of WAL-CLM-DDDL-000047 + dossier prose only; the verbatim of DDDL-000047 has no year. FLAG: the QUOTE ("vanadium will replace insulin for adult onset diabetics") is verbatim-backed, but its DATE is claim_text-only — quote the sentence, do not stamp "1985" on it as if quoted.
- "25 µg / 25 micrograms per gram" (anticarcinogenic dose) -> WAL-CLM-DDDL-000036 verbatim reads "Feeding 25 |ng of vanadium per gram of diet" — an OCR artifact ("|ng"), NOT "µg". The clean unit "micrograms" is claim_text-only. FLAG: the number 25 is present but the unit is corrupted in the verbatim; do not hand-type "25 µg" as a quote — pull by ID and let design confirm µg against the source image. (Not used by any of the four concepts, but the dossier §1 mentions it.)
- "500 mcg" (Let's Play Doctor True Supplement Need) -> VERBATIM-BACKED in WAL-CLM-LETS-000070 ("VANADIUM ? 500 mcg 2 - 5 mg"). Quotable by ID. The interpretation that the leading "?" column = the government RDA Wallach argues against is claim_text-only — do not present that reading as quoted.
- "150 mcg" (the maintenance target) -> DERIVED, in no verbatim. It comes from WAL-CLM-EPIGEN-000138's verbatim "Vanadium 50 - 100 mcg" via the ×1.54 / round-2sf chain. Display it as the computed target with the provenance chain, never as a quote.

## Category / width / background (from element-headers.md)
- **Category accent**: mineral = **blue** (vanadium's category is "mineral", symbol V).
- **Width**: the header renders inside the tan `.kd-ep-fam` box; a FIGURE's real ceiling is ~817px (not the ~867px outer screen). Prefer the two exact shipped slots — `--fork` = 700px or `--rail` = 660px — which need no new CSS. Author every figure at scale 1 (viewBox width == CSS max-width) and declare the width at ID-scoped specificity, or every label silently shrinks (element-headers.md Rule 1/2).
- **Background**: the `.kd-ep-fam` tan box (`--ds-paper-deep`), tinted by the mineral (blue) accent. It leads directly into the Best-Youngevity-sources block, so the bottom of the header should hand off cleanly to that (Concept B's colloidal top rung ties in naturally).

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier §6 recommends A; B is the clean quantitative fallback).
- Chassis-vs-composed layout (legacy skeleton vs. composed `blocks[]`).
- Final figure layout + coordinates.
- Final display copy / tone (the lede + why above are PROPOSALS to ratify, not final).
- Visual sign-off — every header is demo-only until Luneth approves.
