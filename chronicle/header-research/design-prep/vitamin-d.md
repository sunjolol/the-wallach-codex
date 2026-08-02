# Vitamin D — design-prep build sheet
> Source materials for chronicle/header-research/vitamin-d.md. Byte-verified from sealed claims (pack: `_packs/vitamin-d.json`). NOT a design — concept choice + layout stay open for Luneth.
>
> Every guillemet «…» below is a BYTE-EXACT, single-line, contiguous substring of the cited claim's `verbatim` (no substring spans a verbatim line break, so every quote is copy-paste safe). Where a fact is claim_text-only (absent from all verbatims), it is FLAGGED and must NOT be shown as a quote.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "vitamin-d")
- **lede** (PROPOSAL): "The vitamin your body builds from cholesterol when sunlight hits your skin — it drives calcium and phosphorus into your bones and teeth, which is why Wallach ties a shortage to childhood rickets and reads today's near-universal deficiency as a disease modern medicine created."  [grounded: WAL-CLM-DDDL-000068 (cholesterol = raw material for vitamin D), WAL-CLM-LETS-000086 (UV stimulates vitamin D production), WAL-CLM-EPIGEN-000032 (deposition of calcium + phosphorus in bone/teeth — CLAIM_TEXT only, see trap), WAL-CLM-EPIGEN-000170 (rickets resurgence / "physician-caused disease" — the phrase is CLAIM_TEXT only)]
  - Alternate (PROPOSAL, pairs best if the lead is NOT Concept A): "Less a food than something your skin makes from cholesterol in the sun — and the one vitamin Wallach warns cuts both ways: too little softens bone into rickets, too much calcifies the arteries."  [grounded: WAL-CLM-DDDL-000068, WAL-CLM-LETS-000040, WAL-CLM-DDDL-000083, WAL-CLM-EPIGEN-000032]
  - Note: lede is shipped gloss, not a quote, so grounding to claim_text is acceptable — but the two facts it leans on that are claim_text-only ("drives calcium/phosphorus into bone/teeth"; "physician-caused disease") are NOT available as displayable quotes. Keep them in the gloss, never in guillemets.
- **why** (PROPOSAL): "Wallach's *Epigenetics* daily-multiple program lists vitamin D at 1,000–2,000 IU per day. The app takes the top of that range — 2,000 IU — and converts to metric at the standard 40 IU per microgram (×0.025), landing at 50 mcg/day. No body-weight scaling applies; the IU→mcg conversion is the only factor. Worth knowing: this maintenance figure is not a condition cap — Wallach uses 400–1,000 IU in rickets protocols and, for cerebrovascular disease specifically, warns to hold total vitamin D under 400 IU/day."  [source_claim_id: WAL-CLM-EPIGEN-000119 · factor 0.025 (factor_source "1 mcg vitamin D = 40 IU") · original range 1,000–2,000 IU · upper_taken 2,000 → 2,000 × 0.025 = 50 mcg. Condition figures: WAL-CLM-LETS-000413, WAL-CLM-LETS-000420, WAL-CLM-DDDL-000106.]
  - target.kind = "wallach", numeric (low = 50.0 mcg) — a real number, no honest-gap needed.

## Per-concept build materials

### Concept A — "The Goldilocks vitamin" (too little softens bone · too much hardens arteries) — RECOMMENDED LEAD
- **Exact quotes available**
  - Deficiency / soft-bone end:
    - WAL-CLM-EPIGEN-000032 — «Childhood rickets (rachitic rosary), bowed legs, knock-knees, pigeon chest,»
    - WAL-CLM-RARE-000230 — «Rickets, rachitic rosary, bow-legs, knock-knees, osteomalacia,»
    - WAL-CLM-RARE-000230 — «delayed or poor tooth development.»
    - WAL-CLM-LETS-000039 — «osteomalacia»
    - WAL-CLM-LETS-000039 — «rickets»
  - Toxicity / hard-artery end:
    - WAL-CLM-LETS-000040 — «angiotoxicity (calcification)»
    - WAL-CLM-LETS-000040 — «arteriosclerosis (angiotoxicity)»
    - WAL-CLM-LETS-000040 — «liver dysfunction»
    - WAL-CLM-LETS-000040 — «"malignant" calcification»
    - WAL-CLM-DDDL-000083 — «The target tissue of vitamin D toxicity is the»
    - WAL-CLM-DDDL-000083 — «calcification of the blood vessel wall»
  - The window (target) + the condition cap:
    - WAL-CLM-EPIGEN-000119 — «Vitamin D 1,000 - 2,000 IU»
    - WAL-CLM-DDDL-000106 — «Reduce the amount of vitamin D intake to a maximum of 400 IU/day»
- **Numbers**
  - 1,000–2,000 IU/day (the healthy window) · IU · verbatim-backed by WAL-CLM-EPIGEN-000119 (note verbatim renders it "1,000 - 2,000 IU", spaces around the dash).
  - 400 IU/day (cap) · IU · verbatim-backed by WAL-CLM-DDDL-000106. ★ SCOPE TRAP: this cap is condition-specific (cerebrovascular disease), NOT a general toxic ceiling — see dossier §5 and the Trap section. Render the toxic end DIRECTIONALLY ("excess → calcification"), never as a hard "safe-above-X-toxic" IU line. The pack gives NO numeric toxic threshold for a healthy adult.
- **Figure label text** (exact display strings, each tied to its claim)
  - deficient-end label: "rickets · bowed legs · soft bone" [WAL-CLM-EPIGEN-000032 / WAL-CLM-RARE-000230 / WAL-CLM-LETS-000039]
  - window label: "1,000–2,000 IU" [WAL-CLM-EPIGEN-000119]
  - toxic-end label: "angiotoxicity — calcified arteries" [WAL-CLM-LETS-000040 / WAL-CLM-DDDL-000083]
  - unifying caption idea (gloss, NOT a quote): "the same calcium — kept out of bone when D is low, forced into artery walls when D is high" [synthesis of WAL-CLM-EPIGEN-000032 deposition + WAL-CLM-DDDL-000083 vessel-wall calcification; the "deposition into bone" half is claim_text-only, so keep as gloss]
- **Structure notes** — one horizontal dose axis, three zones (deficient / window / toxic), window as the visual focus; text sits beside the band, never crossed by a stroke. Two opposing motifs at the ends (soft/bowing bone ↔ hardening/calcifying artery) reading off a shared axis so the "balance" idea lands by construction.

### Concept B — "The disease medicine made" (the 400% number)
- **Exact quotes available**
  - WAL-CLM-EPIGEN-000170 — «reported increase of 400 percent between 1995 and 2011.»
  - WAL-CLM-EPIGEN-000170 — «widespread use of sun screens, fear of cholesterol in egg yolks (a good source»
  - WAL-CLM-EPIGEN-000170 — «of vitamin D), and instructions from pediatricians to avoit»  (note: "avoit" is the source's own OCR/typo for "avoid" — verbatim-faithful; do NOT display this raw substring as a reader-facing quote without flagging the typo)
  - (deficiency backdrop, if the concept wants a rickets image) WAL-CLM-EPIGEN-000032 — «Childhood rickets (rachitic rosary), bowed legs, knock-knees, pigeon chest,»
- **Numbers**
  - 400 percent rise · % · verbatim-backed by WAL-CLM-EPIGEN-000170 ("reported increase of 400 percent").
  - 1995 / 2011 (the window) · years · verbatim-backed by WAL-CLM-EPIGEN-000170 ("between 1995 and 2011").
- **Figure label text** (four inputs → one outcome; each tied to its claim)
  - The four "medical advice" inputs — three are verbatim-backed in WAL-CLM-EPIGEN-000170, the fourth is claim_text-only:
    - "sunscreen / avoid the sun" [WAL-CLM-EPIGEN-000170 verbatim "widespread use of sun screens"]
    - "fear of cholesterol in egg yolks" [WAL-CLM-EPIGEN-000170 verbatim "fear of cholesterol in egg yolks (a good source of vitamin D)"]
    - "pediatricians say skip children's supplements" [WAL-CLM-EPIGEN-000170 verbatim "instructions from pediatricians to avoit … supplementation"]
    - "avoid dietary cholesterol / covering clothing" — ★ CLAIM_TEXT-ONLY: the clean four-part "avoid the sun, sunblock, avoid cholesterol, skip supplements" list lives in WAL-CLM-EPIGEN-000032's claim_text; its VERBATIM is only the deficiency-sign list. Use the three verbatim-backed causes from 000170 as the quotable set; the fourth "cover up / avoid saturated fat" framing is gloss.
  - the hero outcome number: "400%" and "1995 → 2011" [WAL-CLM-EPIGEN-000170]
  - the outcome node caption (gloss): "childhood rickets came back" [WAL-CLM-EPIGEN-000170]
- **Structure notes** — convergence-to-a-stat: several small "advice" inputs feeding one dominant 400% figure; keep to ≤4 inputs + one result, no busier. The big number anchors the eye; the causes read as the small print.
- ★ **"physician-caused disease" is NOT quotable.** The phrase appears in the claim_text of BOTH WAL-CLM-EPIGEN-000032 and WAL-CLM-EPIGEN-000170 but in NEITHER verbatim. It may headline the concept as Wallach's thesis (gloss/attribution), but must never sit in guillemets as his exact words.

### Concept C — "Made from cholesterol, by sunlight" (the sunshine-vitamin identity)
- **Exact quotes available**
  - WAL-CLM-DDDL-000068 — «material for the production of vitamin D in the human body, bile acids,»  (the tight identity phrase; note "raw material" splits across a verbatim line break, so the contiguous substring starts at "material")
  - WAL-CLM-LETS-000086 — «Ultra violet light is germicidal, stimulates»
  - WAL-CLM-LETS-000086 — «the production of vitamin D and has "healing"»
  - WAL-CLM-LETS-000084 — «stimulate vitamin D production, stimulate the»
  - WAL-CLM-LETS-000084 — «Light therapy uses ultra violet light to»
  - (optional richer UV-band annotation) WAL-CLM-LETS-000087 — «between 500 and 3100 Angstrom units - 2537»
- **Numbers**
  - UV peak 2537 Ångström · Å · verbatim-backed by WAL-CLM-LETS-000087. ★ COMMA TRAP: the verbatim spells it "2537" and "500 and 3100" (NO commas); the dossier/claim_text form "2,537" and "3,100" is claim_text styling. If a figure shows the number as a quote it must read "2537" / "3100"; the comma'd form is a gloss, not verbatim.
  - UV spectrum range 500–3100 Å · Å · verbatim-backed by WAL-CLM-LETS-000087.
  - visible light "five percent" of a UV lamp's output · % · verbatim-backed by WAL-CLM-LETS-000087 (spelled "five percent", not "5%").
- **Figure label text** (transformation line: sun → cholesterol-in-skin → vitamin D → payoff)
  - step 1 "sunlight (UV)" [WAL-CLM-LETS-000086 / WAL-CLM-LETS-000084 — UV "stimulates the production of vitamin D"]
  - step 2 "cholesterol in skin" [WAL-CLM-DDDL-000068 — cholesterol = raw material for vitamin D]
  - step 3 "vitamin D" [WAL-CLM-DDDL-000068 / WAL-CLM-LETS-000086]
  - payoff "→ calcium + phosphorus into bone & teeth" — ★ CLAIM_TEXT-ONLY: this deposition fact is in WAL-CLM-EPIGEN-000032's claim_text ("required for the absorption, metabolism, and proper deposition of calcium and phosphorus in the bones and teeth… works hand-in-hand with parathyroid hormone"), but its VERBATIM is only the deficiency-sign list. The payoff arrow's LABEL is fine as a gloss; do NOT render it as a Wallach quote.
  - optional annotation "2537 Å = the light that makes D" [WAL-CLM-LETS-000087, using the verbatim "2537" form]
- **Structure notes** — left-to-right transformation, 3 steps generously spaced, ~4 elements; one sunbeam meeting skin, cholesterol becoming D, payoff arrow to bone/teeth. The optional UV-band annotation risks clutter — dossier prefers the plain transformation.

### Concept D — "Trousseau's three cures" (the did-you-know curio)
- **Exact quotes available**
  - WAL-CLM-EPIGEN-000165 — «treated his rickets patients with cod liver oil, sunshine, and»  (the three cures; "and butter" continues on the next verbatim line, so the contiguous quote ends at "and")
  - WAL-CLM-EPIGEN-000165 — «butter—proving to himself that diet and sunshine played a vital role in the cause,»
  - WAL-CLM-EPIGEN-000165 — «prevention, and cure of rickets.»
  - (rickets = D deficiency backing) WAL-CLM-LETS-000039 — «rickets» · WAL-CLM-EPIGEN-000032 — «Childhood rickets (rachitic rosary), bowed legs, knock-knees, pigeon chest,»
- **Numbers** — none. (Pure curio; no figures to trap.)
- **Figure label text** (three remedy icons → one nutrient)
  - "cod liver oil" [WAL-CLM-EPIGEN-000165]
  - "sunshine" [WAL-CLM-EPIGEN-000165]
  - "butter" [WAL-CLM-EPIGEN-000165]
  - the one-nutrient payoff label "= vitamin D" [WAL-CLM-EPIGEN-000165 (Trousseau/rickets) + WAL-CLM-LETS-000420 / WAL-CLM-EPIGEN-000032 (rickets = vitamin D deficiency)]
- **Structure notes** — three small remedy icons side by side, each a short arrow to one "vitamin D" label; labels beside icons, no strokes through text; fewest elements. Weakest depth (rests on one medium-confidence claim, WAL-CLM-EPIGEN-000165) — a fourth-option palate-cleanser, not a lead.

## Trap resolutions (claim_text > verbatim)
- **"physician-caused disease"** -> NOT verbatim-backed anywhere. Appears in claim_text of WAL-CLM-EPIGEN-000032 AND WAL-CLM-EPIGEN-000170; present in NO verbatim. Usable as attributed thesis/gloss, never as a quote.
- **"absorption, metabolism, and proper deposition of calcium and phosphorus in bones and teeth" + "works hand-in-hand with parathyroid hormone"** -> claim_text of WAL-CLM-EPIGEN-000032 ONLY; its verbatim is just the deficiency-sign list. Do NOT display as a quote (affects Concept C payoff + the lede).
- **2,537 / 3,100 Ångström (comma'd)** -> cite WAL-CLM-LETS-000087 with the VERBATIM forms "2537" / "3100" (no commas). The comma'd styling is claim_text; a quote must use "2537" / "3100".
- **"10 times" (numeral) the fat-soluble vitamins** -> WAL-CLM-EPIGEN-000162 verbatim spells "ten times" (words); the "10×" numeral is claim_text. Also this verbatim does NOT name vitamin D or "A and D" or "catalysts" — those are claim_text; the verbatim only says "fat-soluble vitamins from animal foods such as butter…". (Butter/food-source vein is background, not a listed concept.)
- **"reduce vitamin D intake" inside the angina protocol** -> claim_text of WAL-CLM-LETS-000139 ONLY. Its verbatim is only the hawthorn/"reverse cardiovascular disease" sentence and never mentions vitamin D. Do NOT quote this claim for anything vitamin-D-dose-related.
- **The four-part "medical advice" list as a clean set** -> the tidy four-item enumeration is claim_text (WAL-CLM-EPIGEN-000032). Only three causes are verbatim-backed, in WAL-CLM-EPIGEN-000170 (sun screens · egg-yolk cholesterol fear · pediatricians skip supplements).
- **"avoit" OCR typo** -> WAL-CLM-EPIGEN-000170's verbatim reads "to avoit … supplementation". Byte-faithful but a source typo for "avoid"; flag before any reader-facing use.
- **No claim_text number INFLATION found in the dose figures.** WAL-CLM-LETS-000074's row "400 IU 275 IU 1,000 IU" matches its claim_text (RDA / true-need / pharmacologic); Wallach reprints the 400 IU RDA only to argue against it — never his recommendation, so a header must not cite 400 IU here as a maintenance target. (The 400-IU figure a header CAN use honestly is the cerebrovascular cap in WAL-CLM-DDDL-000106.)
- **Two live dose figures, no formal supersession** (dossier §5): WAL-CLM-EPIGEN-000119 (1,000–2,000 IU, 2014) vs WAL-CLM-LETS-000074 (275 IU true need, 1995) differ ~10×; `superseded_by` is null on both. Target correctly uses the newer Epigenetics claim (favor-the-newest). A header/lede should NOT cite 275 IU as "the" number.

## Category / width / background (from element-headers.md)
- **Category accent:** vitamin -> **orange** (`data-category` vitamin tint on `.kd-ep-fam`).
- **Width:** header block matches the element detail screen exactly; a FIGURE picks its width from the closed set — `mech` 600px · `fork` 700px · `rail` 660px (a `figure` block names its own `width`, required). Real figure ceiling inside `.kd-ep-fam` is ~817px (865px box − 24px padding each side), but prefer the exact shipped slots (700 / 660) over authoring to the ceiling. Author every figure at scale 1 (viewBox width == CSS max-width) so a declared px is a screen px; override figure width at ID specificity (`#drawer-knowledge-mount .kd-ep-fam__figure.<modifier>`) or it silently renders at the 560px base.
- **Background:** tan `--ds-paper-deep` main content box (category-tinted); it leads directly into the Best-Youngevity-sources block below, so the header's closing edge must hand off cleanly to that block.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier §6 recommends A, with B as the high-"wow" runner-up).
- Chassis-vs-composed layout (`blocks[]`).
- Final layout, coordinates, figure geometry, number of sections, whether there are beats/stat/quote at all, and their order.
- Final display copy + tone (the ledes/labels above are PROPOSALS/materials, not final strings).
- Visual sign-off (the STOP-for-verification gate).
