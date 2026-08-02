# Vitamin E (Tocopherol) — design-prep build sheet
> Source materials for chronicle/header-research/vitamin-e.md. Byte-verified from sealed claims (scratchpad `_packs/vitamin-e.json`). NOT a design — concept choice + layout stay open for Luneth.

Every «quote» below is a byte-exact **single-line** contiguous substring of the cited claim's `verbatim` (line breaks avoided so nothing spans a `\n`). Two verbatim-vs-claim_text FACT traps drive this element and are called out in full under "Trap resolutions": the identity facts (cell-membrane / RBC / telomere / slows-aging) and the "ceroid pigment / more ominous than freckles" phrasing are **claim_text-only** — grounded, but NOT quotable.

---

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "vitamin-e")

- **lede** (PROPOSAL): "The body's fat-guarding antioxidant — a family of tocopherol oils that shield every cell membrane and keep red blood cells from bursting, and the vitamin Wallach pairs with selenium against muscular dystrophy, cystic fibrosis and a failing heart."
  - [grounded: WAL-CLM-EPIGEN-000033 (claim_text identity + the three "in conjunction with selenium deficiency" diseases)]
  - Note: this is shipped-voice lede prose, NOT a displayed quote — so it may lean on the identity claim_text (which is not verbatim-quotable). Alternate if a design leans anti-aging: "A family of antioxidant oils — the tocopherols — that protect every cell membrane from oxidation and, Wallach says, slow aging itself, even helping preserve the length of your telomeres." (same claim; same claim_text-only caveat).

- **why** (PROPOSAL, target.kind = wallach / numeric, low = 134.0 mg): "The 134 mg/day target comes from Wallach's newest book, Epigenetics (2014), which gives vitamin E (mixed tocopherols) a daily-multiple range of 100–200 IU. The derivation takes the upper end, 200 IU, and converts at the standard 0.67 mg per IU of natural d-alpha-tocopherol: 200 × 0.67 = 134 mg. No body-weight scaling is applied (unlike the mineral targets). It is a maintenance floor — Wallach's own figures climb far higher for illness: 400 IU as the 'true supplement need', and up to 1,200–2,000 IU after a heart attack."
  - [source_claim_id: WAL-CLM-EPIGEN-000120 · original range 100–200 IU · upper_taken 200 IU · factor 0.67 mg/IU ("1 IU natural d-alpha-tocopherol = 0.67 mg") · no weight-scale]
  - Higher-figure references for the "floor" clause: 400 IU = WAL-CLM-LETS-000075; 1,200–2,000 IU = WAL-CLM-LETS-000295.

---

## Per-concept build materials

### Concept A — "The rust of aging" (Rust Spots) — RECOMMENDED LEAD (dossier §6)
The first-visible-sign hook: brown age/liver spots are fat oxidizing ("rusting") in the skin — E's answer to copper's premature grey.

- **Exact quotes available**
  - WAL-CLM-EPIGEN-000033 — «Age spots, liver spots»
  - WAL-CLM-EPIGEN-000033 — «Lipid peroxidation, cellulite»
  - WAL-CLM-RARE-000231 — «lowered immune system»  (context line; the age-spot line in this claim is the mechanism one below)
  - WAL-CLM-RARE-000231 — «age spots (liver spots, lipid»  (single-line; the full mechanism phrase "…lipid peroxidation, free radicals)" continues on the next verbatim line — see structure note)
  - WAL-CLM-LETS-000282 — «selenium at 200-500 mcg t.i.d.»  (from the freckles/liver-spots treatment recipe — the treatment context, NOT the "ceroid pigment" mechanism, which is claim_text-only; see traps)
- **Numbers** — none are needed for this concept's illustration (it is mechanism-visual, not a number). If a treatment dose is wanted as a caption: 800–1,200 IU · WAL-CLM-LETS-000282 verbatim reads «800-1,200 I U/» (OCR splits "I U" — prefer a cleaner-source dose, e.g. WAL-CLM-LETS-000275 «vitamin E at 800-1,200 IU/day»).
- **Figure label text** (exact display strings, each tied to its claim)
  - "Age spots, liver spots" — WAL-CLM-EPIGEN-000033
  - "lipid peroxidation" — WAL-CLM-RARE-000231 (verbatim substring «lipid» + next-line «peroxidation»; the joined phrase is claim-grounded)
  - "free radicals" — WAL-CLM-RARE-000231 (verbatim next-line «free radicals)»)
- **Structure notes** — one skin patch + one forming spot + one caption that lands BESIDE (never through) the word (element-headers Rule 2 stroke ban). No 1-2-3 beats. Mostly-empty field, single idea. The mechanism label "lipid peroxidation → free radicals" is grounded in RARE-000231 but the tidy phrase "ceroid pigment" is claim_text-only — do not set it as a quote (see traps).

### Concept B — "How much depends on how sick" (The Ladder)
A vertical escalating dose scale — daily pinch → post-heart-attack flood. The header's "why this number" tip lives at the bottom rung.

- **Exact quotes available** (one clean single-line dose string per rung)
  - Rung 1 (maintenance) — WAL-CLM-EPIGEN-000120 — «Vitamin E (mixed tocopherols) 100 - 200 IU»
  - Rung 2 (true supplement need + pharmacologic, one row) — WAL-CLM-LETS-000075 — «VITAMIN E 15 IU 400 IU 1,200 IU»
  - Rung 3 (therapeutic, near-universal) — WAL-CLM-LETS-000275 — «vitamin E at 800-1,200 IU/day»
  - Rung 4 (post-heart-attack) — WAL-CLM-LETS-000295 — «vitamin E to 1,200 to 2,000 IU/day»
  - Supporting single-dose therapeutic anchors (if a rung wants a named disease): Alzheimer's 1,200 IU — WAL-CLM-LETS-000130 «vitamin E at 1200 iu daily»; cardiomyopathy 1,200 IU — WAL-CLM-LETS-000204 «E at 1,200 IU/day»; arthritis 1,000 IU — WAL-CLM-LETS-000146 «Vitamin E at 1000 IU/day.»
- **Numbers** (value · unit · verbatim-backed claim id · note)
  - 100–200 IU · IU · WAL-CLM-EPIGEN-000120 (verbatim «100 - 200 IU», spaces around the hyphen) · the daily-multiple range; the target's basis.
  - 15 IU · IU · WAL-CLM-LETS-000075 · the government RDA — Wallach reprints it ONLY to argue against it; label it as such, never as his recommendation.
  - 400 IU · IU · WAL-CLM-LETS-000075 · "true supplement need"; also target.other_claims.
  - 1,200 IU · IU · WAL-CLM-LETS-000075 (also 000130 as «1200 iu», 000204 as «1,200 IU») · 30-day pharmacologic / common therapeutic.
  - 800–1,200 IU · IU · WAL-CLM-LETS-000275 (and ~40 other Ch10 recipes) · therapeutic workhorse dose.
  - 1,200–2,000 IU · IU · WAL-CLM-LETS-000295 (verbatim reads «1,200 to 2,000», not a hyphen) · escalated after a heart attack.
  - 134 mg · mg · **DERIVED, no verbatim** · = 200 IU × 0.67; display only as the target, never as a Wallach quote (see traps).
- **Figure label text**
  - "100–200 IU" / "maintenance" — WAL-CLM-EPIGEN-000120
  - "400 IU" / "true supplement need" — WAL-CLM-LETS-000075
  - "800–1,200 IU" / "therapeutic" — WAL-CLM-LETS-000275
  - "1,200–2,000 IU" / "after a heart attack" — WAL-CLM-LETS-000295
  - (optional) "15 IU" / "the RDA (he rejects)" — WAL-CLM-LETS-000075
- **Structure notes** — one rising element (scale/column), four or five rungs bottom-to-top; each rung = dose + purpose, labels to the SIDE of the riser, never crossed by the riser line. The maintenance rung anchors the fixed "why this number" tip. No pull-quote required.

### Concept C — "Guard within, oil without" (Two Surfaces)
Dual-role identity: inside you it shields membranes + RBCs; outside you it's the oil rubbed straight onto a burn. One continuous figure split by the skin line (NOT comparison cards).

- **Exact quotes available**
  - INSIDE (deficiency evidence for the guard role — the ACTIVE "protects membranes/RBCs" statement is claim_text-only, so anchor the interior via what its absence causes):
    - WAL-CLM-EPIGEN-000033 — «Anemia (hemolytic)»
    - WAL-CLM-RARE-000231 — «anemia»  (single word; verbatim splits "anemia\n(hemolysis)")
    - WAL-CLM-LETS-000041 — «RBC fragility»
  - OUTSIDE (the topical-oil role — genuinely E-specific, richly quotable):
    - WAL-CLM-LETS-000175 (burns) — «aloe vera or vitamin E oil applied locally»
    - WAL-CLM-LETS-000154 (bedsores) — «vitamin E oil and DMSO»
    - WAL-CLM-LETS-000215 (chicken-pox) — «applied directly to each vesicle or papule»
    - WAL-CLM-LETS-000291 (hangnails) — «or aloe vera directly on the hangnail to soften»
    - WAL-CLM-LETS-000123 (acne) — «vitamin E oil may be applied topically to acne»
    - WAL-CLM-LETS-000170 (breast tenderness) — «vitamin E topically»
    - WAL-CLM-LETS-000247 (diaper rash) — verbatim «vitamin\nE oil and/or aloe vera topically» (spans a break; single-line safe fragment: «aloe vera topically»)
- **Numbers** — none required (identity concept). If the oil side wants a burn-care note it carries no dose.
- **Figure label text**
  - interior side: "keeps red blood cells from bursting" is claim_text-grounded (EPIGEN-000033) but NOT quotable — as a LABEL it is grounded, acceptable; if a quote-styled label is wanted use "Anemia (hemolytic)" (EPIGEN-000033) or "RBC fragility" (LETS-000041).
  - exterior side: "vitamin E oil" — LETS-000175/000154/000215/000123; "on a burn" — LETS-000175; "on each chicken-pox vesicle" — LETS-000215.
- **Structure notes** — the dividing line IS the skin; one caption each side, labels in the clear space. Interior: a membrane / intact red blood cell with E as a protective layer. Exterior: one drop of E oil over a healing lesion. Read as one illustration divided, not two panels. WARNING (traps): the crisp "protects cell membranes and keeps RBCs from rupturing" identity line is claim_text-only — build the interior label from grounded fact, not from a displayed «quote».

### Concept D — "The pair that can't work alone" (The Duet) — NOT the lead (selenium-overlap caveat, dossier §5)
Three diseases appear only when BOTH E and selenium run low; giving both fast can reverse the damage.

- **Exact quotes available**
  - The three shared diseases (all one claim, each its own verbatim line):
    - WAL-CLM-EPIGEN-000033 — «Cystic fibrosis (in conjunction with selenium deficiency)»
    - WAL-CLM-EPIGEN-000033 — «Muscular dystrophy (in conjunction with selenium deficiency)»
    - WAL-CLM-EPIGEN-000033 — «Hypertrophic cardiomyopathy (in conjunction with selenium deficiency)»
  - The payoff (arrest/cure):
    - WAL-CLM-DDDL-000072 — «be given IM or IV at the very first onset of symptoms, the disease will be»  (clean single line)
    - WAL-CLM-DDDL-000072 — «arrested or maybe even “cured.”»  (NOTE: uses CURLY quotes U+201C/U+201D around cured — reproduce them exactly)
  - Supporting duet material:
    - WAL-CLM-RARE-000010 (cystic fibrosis) — «an acquired environmental disease» · «exacerbated by diets also low in vitamin E»
    - WAL-CLM-DDDL-000098 (fibromyalgia, multi-deficiency) — «deficiencies of selenium, vitamin E, and sulfur amino acids» · «white muscle disease»
    - WAL-CLM-LETS-000373 (MD/Keshan, injectable) — «at 80 mg per day»  (the unusual 80 mg IM vitamin-E dose)
- **Numbers**
  - 80 mg · mg · WAL-CLM-LETS-000373 (verbatim «vitamin E IM» + «at 80 mg per day») · injectable vitamin-E dose alongside selenium for MD/Keshan — a curio, not the maintenance target.
  - (No other numbers required; the duet is identity/mechanism, not dose.)
- **Figure label text**
  - overlap zone (three words): "Cystic fibrosis", "Muscular dystrophy", "Hypertrophic cardiomyopathy" — all WAL-CLM-EPIGEN-000033
  - two tokens: "Vitamin E" and "Selenium (Se)" — E from this element; the pairing from EPIGEN-000033 + DDDL-000072
  - payoff line: "arrested or even cured" — grounded in DDDL-000072 (exact quote is «arrested or maybe even “cured.”»)
- **Structure notes** — two tokens (E, Se) meeting; overlap holds the three disease labels; one arrow to the payoff. Two shapes + three words + one arrow, no routed strokes through text. Keep E-centric — do not let this read as a selenium re-skin (dossier §5); best as a supporting angle, not the spine.

---

## Trap resolutions (claim_text > verbatim — the reason this prep exists)

These are FACT/identity traps, not number-inflation traps. The dossier §5 confirms no claim_text number exceeds its verbatim; the danger here is quoting a fact that lives only in a claim_text.

1. **Identity line is claim_text-only.** "group of antioxidant compounds (the alpha-tocopherols) that protect cell membranes… red blood cells from rupture… slows aging, preserves telomere length… with selenium lowers the risk of certain cancers" appears in WAL-CLM-EPIGEN-000033's **claim_text ONLY**. The **verbatim** of EPIGEN-000033 is JUST the deficiency list (Alzheimer's / Anemia (hemolytic) / … / Increased risk of cancer). → "protects cell membranes", "keeps RBCs from rupturing", "slows aging", "preserves telomere length" are grounded but **NOT quotable** — use as lede/label fact, never inside guillemets. (Concepts A, C and the lede all touch this.)
2. **"ceroid pigment / a more ominous sign than freckles" is claim_text-only.** The dossier §2A attributes this phrasing to WAL-CLM-LETS-000282, but that claim's **verbatim** is only the freckles/liver-spots TREATMENT recipe ("Treatment of freckles and \"liver spots\" includes the use of vitamin E at 800-1,200 I U/day…"). The "ceroid pigment" mechanism and "more ominous than freckles" line are in the **claim_text ONLY**. → do not display "ceroid pigment" or "more ominous than freckles" as a quote. The quotable mechanism is RARE-000231's «age spots (liver spots, lipid» + next-line «peroxidation, free radicals)».
3. **134 mg is derived, not spoken.** The target 134 mg appears in NO verbatim — it is 200 IU × 0.67. Cite WAL-CLM-EPIGEN-000120 (the 100–200 IU range, «Vitamin E (mixed tocopherols) 100 - 200 IU») + the 0.67 provenance factor. Display 134 mg only as the computed target, never as a Wallach quote.
4. **Chorea "800–12,000 IU" is an OCR typo — never surface it.** WAL-CLM-LETS-000220 verbatim reads «vitamin E at\n800-12,000 IU/day» — almost certainly 800–1,200. Do NOT use 12,000 IU anywhere (dossier §5). For the therapeutic dose use WAL-CLM-LETS-000275's clean «800-1,200 IU/day».
5. **OCR "I U" split in LETS-000282.** Its dose verbatim is literally «800-1,200 I U/» (space inside "IU") — if a dose caption is wanted for Concept A, pull it from a clean source (WAL-CLM-LETS-000275 «vitamin E at 800-1,200 IU/day») rather than this one.
6. **"white muscle disease" — quote from DDDL-000098, not LETS-000373.** The phrase «white muscle disease» is verbatim-present in WAL-CLM-DDDL-000098 (fibromyalgia line); WAL-CLM-LETS-000373's verbatim does NOT contain it (it opens "Treatment of MD and/or Keshan disease…"). Cite DDDL-000098 for that phrase.

Numbers cross-check (each concept number → verbatim-backed id): 100–200 IU → EPIGEN-000120 ✓ · 15/400/1,200 IU → LETS-000075 ✓ · 800–1,200 IU → LETS-000275 ✓ · 1,200–2,000 IU → LETS-000295 ✓ · 600,000 IU (beta-carotene, cancer angle, WAL-CLM-LETS-000196 «600,000 IU vitamin A») ✓ · 80 mg IM → LETS-000373 ✓ · 134 mg → DERIVED (no verbatim, flagged above).

---

## Category / width / background (from .claude/rules/element-headers.md)
- **Category accent: vitamin = ORANGE** (minerals=blue · vitamins=orange · aminos=green · fatty-acids/omegas=purple). Slug `vitamin-e`, display name "Tocopherol", common name "Vitamin E", symbol none, letter E.
- **Width:** the header renders inside the tan `.kd-ep-fam` box and must match the element detail screen exactly (element-headers Rule 1). A FIGURE uses a width from the closed set (`mech` 600px · `fork` 700px · `rail` 660px) — the real figure ceiling inside `.kd-ep-fam` is ~817px, NOT the 867px outer screen. Author every figure at scale 1. (Concept B's vertical scale and Concept A's single skin patch both sit comfortably within a `mech`/`fork` width.)
- **Background:** the element's category tint over `--ds-paper-deep` (tan). The header's background/main box is fixed because it LEADS INTO the Best-Youngevity-sources block, which always sits at the bottom.

---

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier recommends A "Rust Spots"; C is the identity-first alternate; B if the number should carry the header; D only as a supporting angle, never the spine).
- Chassis vs composed `blocks[]` layout.
- Final layout, coordinates, figure widths, illustration drawing.
- Final display copy + tone (the lede/why above are PROPOSALS to ratify).
- Visual sign-off (STOP-for-verification before any live build).
