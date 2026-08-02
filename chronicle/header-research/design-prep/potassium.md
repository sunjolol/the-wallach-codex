# Potassium — design-prep build sheet
> Source materials for chronicle/header-research/potassium.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

All quotes below are BYTE-EXACT contiguous substrings of the cited claim's `verbatim` (35/35 verified against the sealed pack). Where a quote spans a source line-break, the newline is preserved literally inside the guillemets and marked `[spans a source line-break]`; the byte-check requires that `\n`, so do not "flatten" it to a space when slotting into a design.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "potassium")
- **lede** (PROPOSAL): "The main electrolyte inside your cells — about 5% of all the mineral in your body — that partners with sodium to hold your water and pH balance and with calcium to fire nerve and muscle, yet is stored so poorly that most of it leaves in the urine each day and must be replaced."  [grounded: WAL-CLM-IMMORT-000192 (inside-cell electrolyte · 5% of body mineral · sodium/calcium partnerships) · WAL-CLM-RARE-000187 (electrolyte trio, K = 5%) · WAL-CLM-RARE-000153 (sodium & calcium partnerships) · WAL-CLM-IMMORT-000193 (no storage → replaced daily)]
- **why** (PROPOSAL): "Wallach's target is a **direct statement, not a computed chain.** He says the body stores essentially none of the potassium you take in — about 90% of it leaves in the urine — so it must be replaced every day, 'requiring a significant daily intake of 5,000 mg' (Immortality, 2008). There is no IU conversion and no body-weight scaling: the 5,000 mg is stated outright as the maintenance intake and the target carries it forward unchanged (provenance: original_low 5,000 mg · upper_taken 5,000 mg). Wallach's earlier Base-Line program (Let's Play Doctor, 1995) lists a slightly higher 5,500 mg True Supplement Need; the target uses the newer 5,000 mg figure (favor-newest)."  [source_claim_id: WAL-CLM-IMMORT-000193 · no factors (direct dose, no transform) · older variant: WAL-CLM-LETS-000062 = 5,500 mg]
  (target.kind = "wallach", numeric 5,000 mg/day — a real number, so the provenance paragraph above applies; this is NOT an honest-gap case.)

## Per-concept build materials

### Concept A — "You can't bank it"
The single most potassium-specific fact in the pack, and it *is* the answer to "why 5,000 mg?"

- **Exact quotes available**
  - WAL-CLM-IMMORT-000193 — «Potassium is easily absorbed.»
  - WAL-CLM-IMMORT-000193 — «Ninety percent of ingested
potassium is excreted through the urine.»  `[spans a source line-break]` — note: spelled **"Ninety percent"** (words), NOT the digit "90".
  - WAL-CLM-IMMORT-000193 — «Essentially there is
no storage of potassium in the human body»  `[spans a source line-break]`
  - WAL-CLM-IMMORT-000193 — «significant daily intake of 5,000 mg.»
  - WAL-CLM-RARE-000154 — «90 % of ingested K is excreted through the urine»  (single-line; this is the ONLY verbatim carrying the digit **"90 %"** — note the space before %, and "K" not "potassium")
  - WAL-CLM-RARE-000154 — «there is essentially no storage of K in the human body»
  - WAL-CLM-RARE-000154 — «requiring significant daily intake of 5,000 mg»
- **Numbers**
  - 90% excreted · unit = percent · verbatim-backed as **words** "Ninety percent" in **WAL-CLM-IMMORT-000193**, and as the **digit** "90 %" in **WAL-CLM-RARE-000154**. (TRAP: NOT quotable from WAL-CLM-EPIGEN-000094 or WAL-CLM-RARE-000155 — see Trap resolutions.)
  - 5,000 mg/day · mg · verbatim-backed in **WAL-CLM-IMMORT-000193** ("5,000 mg") and **WAL-CLM-RARE-000154** ("5,000 mg"). Also the structured `dose.amount` of IMMORT-000193.
  - "essentially no storage" · qualitative, not a number · IMMORT-000193 / RARE-000154.
- **Figure label text** (proposed short display strings, each grounded)
  - "In: easily absorbed" — WAL-CLM-IMMORT-000193 ("Potassium is easily absorbed.")
  - "Out: 90% → urine" — digit form grounded in WAL-CLM-RARE-000154 ("90 %"); if the design wants Wallach's own words use "Ninety percent → urine" (WAL-CLM-IMMORT-000193).
  - "Kept: essentially none" — WAL-CLM-IMMORT-000193 ("Essentially there is no storage")
  - "So: 5,000 mg every day" — WAL-CLM-IMMORT-000193 / WAL-CLM-RARE-000154
- **Structure notes** — one left-to-right through-flow: intake node → cell → urine exit, with a thin retained sliver as the payoff and the daily number as the resolution. No beats-grid, no pull-quote chassis. Every label sits OFF the flow stroke (route the arrow around the text — the "stroke through a label" rejection class).

### Concept B — "99 vs 5,000" (the regulatory-gap two-lane)  ·  *dossier's recommended lead (§6)*
Rests on Concept A's no-storage fact as the one-line explainer for *why* the need is 5,000.

- **Exact quotes available**
  - WAL-CLM-EPIGEN-000463 — «The FDA restricts the amount of potassium in supplements to 99 mg.»
  - WAL-CLM-EPIGEN-000463 — «restricts the amount of potassium in supplements to 99 mg»  (shorter substring)
  - WAL-CLM-IMMORT-000193 — «significant daily intake of 5,000 mg.»
  - WAL-CLM-RARE-000154 — «requiring significant daily intake of 5,000 mg»
  - (explainer beneath, from Concept A) WAL-CLM-RARE-000154 — «there is essentially no storage of K in the human body»
- **Numbers**
  - 99 mg (FDA supplement cap) · mg · verbatim-backed in **WAL-CLM-EPIGEN-000463** only.
  - 5,000 mg (Wallach daily need) · mg · WAL-CLM-IMMORT-000193 / WAL-CLM-RARE-000154.
  - ~50× ratio ("≈ 50 capped pills") · computed · **ARITHMETIC, not a Wallach quote** (5000 ÷ 99 ≈ 50.5). Render as a derived ratio; never as a quotation. See Trap resolutions.
- **Figure label text**
  - "FDA cap: 99 mg" — WAL-CLM-EPIGEN-000463
  - "Wallach: 5,000 mg / day" — WAL-CLM-IMMORT-000193
  - "≈ 50× apart" — computed ratio (label only, no claim id; mark as derived)
  - optional long-bar annotation "≈ 50 capped pills" — computed (5000÷99), mark as derived
- **Structure notes** — two lanes on ONE shared scale: a tiny 99 mg stub beside a 5,000 mg bar ~50× longer; one connecting line of copy naming the gap. One idea, two marks. Shared left origin so the length difference reads by construction.

### Concept C — "Inside vs outside the cell"
Teaches the one structural fact separating potassium from the other electrolytes.

- **Exact quotes available**
  - WAL-CLM-IMMORT-000192 — «It is the major cation of the intracellular fluid»
  - WAL-CLM-IMMORT-000192 — «constitutes five percent of the total mineral content of the
body.»  `[spans a source line-break]`
  - WAL-CLM-IMMORT-000192 — «of normal water balance, osmotic equilibrium and acid-base»
  - WAL-CLM-IMMORT-000192 — «Potassium participates with calcium in the regulation
of neuromuscular activity.»  `[spans a source line-break]`
  - WAL-CLM-RARE-000187 — «Sodium, Cl and K are three indispensable “electrolytes”»  (curly quotes are byte-exact)
  - WAL-CLM-RARE-000187 — «Sodium makes up two percent, K five percent and Cl three percent of the total mineral content of the human body.»
  - WAL-CLM-RARE-000153 — «With sodium, the other “electrolyte,” K participates in the maintenance of normal water balance»
  - WAL-CLM-RARE-000153 — «Potassium participates with Ca in the regulation of neuromuscular activity.»
  - (K = #1 intracellular cation ranking, if wanted) WAL-CLM-RARE-000169 — «it is second to K as an intracellular cation»  (subject is magnesium; usable ONLY for the "K is *the* #1 intracellular cation" ranking, per dossier §5)
- **Numbers**
  - Na 2% / K 5% / Cl 3% (share of total body mineral) · percent · all verbatim-backed as **words** ("two percent", "five percent", "three percent") in **WAL-CLM-RARE-000187** only. K's 5% also as words "five percent" in WAL-CLM-IMMORT-000192. NONE of these is a digit in any verbatim; if the design wants "5%"/"2%"/"3%" glyphs, they are a numeral rendering of the words, not a quote. (TRAP: NOT quotable from WAL-CLM-RARE-000152 — its verbatim omits the 5% figure.)
- **Figure label text**
  - "K⁺ — the inside cation" — WAL-CLM-IMMORT-000192 ("major cation of the intracellular fluid")
  - "Na⁺, Cl⁻ — outside" — WAL-CLM-RARE-000187 (Na & Cl extracellular; note "extracellular" is in the claim_text, and the verbatim states the electrolyte trio + shares — the inside/outside split itself is claim_text in RARE-000187, spelled out in IMMORT-000192's "major cation of the intracellular fluid ... small amount in the extracellular fluid")
  - "5% inside · 2% + 3% outside" — WAL-CLM-RARE-000187 (words → numerals)
  - "with sodium → water & pH balance" — WAL-CLM-RARE-000153 / WAL-CLM-IMMORT-000192
  - "with calcium → nerve & muscle" — WAL-CLM-RARE-000153 / WAL-CLM-IMMORT-000192
- **Structure notes** — one membrane cross-section as centrepiece: labelled interior (K⁺) vs exterior (Na⁺, Cl⁻), a one-line identity statement above, a small paired caption for the two partnerships. ≤4 labels, one divided figure, no strokes through text. NB the extracellular/intracellular *split* is fully carried by IMMORT-000192's verbatim ("major cation of the intracellular fluid ... a small amount in the extracellular fluid") — see full verbatim in the pack; RARE-000187 supplies the three shares.

### Concept D — "Pot-ash" (the etymology curio)
Memorable, low-stakes; weakest tie to the daily number (leans on the separate "why this number" tip).

- **Exact quotes available**
  - WAL-CLM-IMMORT-000190 — «pots to produce a potassium-rich ash (“potash”).»  (curly quotes byte-exact)
  - WAL-CLM-IMMORT-000190 — «The name, potassium, has its origin from the term
potash»  `[spans a source line-break]`
  - (optional saltpeter aside) WAL-CLM-IMMORT-000191 — «commonly called “saltpeter” or “rocksalt.”»
  - (optional gunpowder aside) WAL-CLM-IMMORT-000191 — «Gunpowder is a mixture of saltpeter, charcoal and
sulfur.»  `[spans a source line-break]`
- **Numbers** — none. (This concept carries no figures; the "1700s"/"Liebig" details are claim_text only and not needed.)
- **Figure label text**
  - "wood + plants, burned" — WAL-CLM-IMMORT-000190
  - "potash (K-rich ash)" — WAL-CLM-IMMORT-000190 ("potassium-rich ash (“potash”)")
  - "→ K" — WAL-CLM-IMMORT-000190 (the name's origin)
- **Structure notes** — one small clean vignette: burnt log → pile of pale ash labelled "potash (K-rich)" → "K". Three marks, one caption; no busy scene.
- **Alternate curio (dossier §2 D):** the K-40 radioactivity story — equally grounded, arguably higher wow:
  - WAL-CLM-IMMORT-000189 — «is potassium-40, which has a half-life of 1.25 billion years.»
  - WAL-CLM-IMMORT-000189 — «The human body contains approximately 140 grams of
potassium»  `[spans a source line-break]`
  - WAL-CLM-IMMORT-000189 — «natural and life-long contributor to our background radiation»
  - WAL-CLM-IMMORT-000189 — «method as being 3.8 billion years old.»
  - Numbers (all verbatim-backed in IMMORT-000189): 1.25 billion years (K-40 half-life) · 140 grams (body content) · 0.012 percent (share that is K-40, quote «0.012
percent» spans a line-break) · 3.8 billion years (oldest rocks dated).

## Trap resolutions (claim_text > verbatim)
Every number where the naive claim_text source is NOT verbatim-backed, so the quote must cite a different id:

- **90% excreted** → cite **WAL-CLM-IMMORT-000193** (words "Ninety percent") or **WAL-CLM-RARE-000154** (digit "90 %"), **NOT WAL-CLM-EPIGEN-000094** (claim_text says "about 90 percent" but its verbatim is only the two-features/gravest-event sentence — no number) and **NOT WAL-CLM-RARE-000155** (same: claim_text adds "≈90%… ~5,000 mg", verbatim carries neither).
- **5,000 mg** → cite **WAL-CLM-IMMORT-000193** or **WAL-CLM-RARE-000154**, **NOT WAL-CLM-EPIGEN-000094 / WAL-CLM-RARE-000155** (claim_text-only). Also **beware WAL-CLM-IMMORT-000187 contains "5,000"** — but that is the *marine-animals ppm* value ("marine animals at 5,000 to 30,000 ppm"), NOT the daily dose; never source the 5,000 mg dose from IMMORT-000187.
- **5% (K share of body mineral)** → cite **WAL-CLM-IMMORT-000192** or **WAL-CLM-RARE-000187** (both "five percent"), **NOT WAL-CLM-RARE-000152** (dossier §1 lists it for the 5% cluster, but its verbatim omits the figure entirely).
- **Na 2% / Cl 3%** → cite **WAL-CLM-RARE-000187** only (the sole verbatim with "two percent"/"three percent").
- **~50× ratio / "≈ 50 capped pills"** → **NOT a Wallach quote.** Computed arithmetic from two grounded numbers (5000 ÷ 99 ≈ 50.5); present as a derived ratio, label only, no claim id.
- **K = #1 intracellular cation** → the only supporting text is **WAL-CLM-RARE-000169** ("it is second to K as an intracellular cation"), whose *subject is magnesium*; usable for the ranking only, do not source any other potassium fact from it (dossier §5).
- **All "percent" figures are spelled as WORDS in every verbatim** ("Ninety"/"five"/"two"/"three" percent). The single exception is "90 %" (digit) in WAL-CLM-RARE-000154. Any "5%"/"2%"/"3%" glyph in a figure is a numeral rendering of the words, not a byte-quote.

## Category / width / background (from element-headers.md)
- **Category accent:** mineral → **blue** (category colour-coding: minerals=blue).
- **Width:** must match the element detail screen exactly — the `.kd-ep-fam` box (fixed part #3). A FIGURE ceiling is 817px inside the padded box; prefer the shipped exact slots `--fork` = 700px or `--rail` = 660px rather than authoring a custom width (per element-headers.md Rule 1). Author every figure at scale 1 (viewBox width == CSS max-width).
- **Background:** the tan `.kd-ep-fam` box (`--ds-paper-deep`), tinted by the mineral/blue accent — because the block leads into the Best-Youngevity-sources block (fixed part #4). Best-Youngevity-sources stays at the very bottom.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier recommends B built atop A's one-line explainer; not decided).
- Chassis-vs-composed layout.
- Final figure layout + coordinates.
- Final display copy / tone (the quotes + labels above are source materials, not final header copy).
- Visual sign-off (the STOP gate — nothing ships live without Luneth's approval).
