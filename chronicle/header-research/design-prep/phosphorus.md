# Phosphorus — design-prep build sheet
> Source materials for chronicle/header-research/phosphorus.md. Byte-verified from sealed claims (scratchpad/_packs/phosphorus.json). NOT a design — concept choice + layout stay open for Luneth.

Reading key: every «…» string below is a BYTE-EXACT contiguous substring of the named claim's `verbatim`. Where a substring would cross a line-break inside a verbatim, a single-line fragment was chosen instead so nothing has to carry a `\n`. Numbers are tagged with the claim id whose VERBATIM actually contains them; claim_text-only numbers are flagged, never offered as quotes.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "phosphorus")

- **lede** (PROPOSAL): "Second in abundance only to calcium — nearly two pounds of you, most of it fused with calcium in the hard mineral of bone and teeth — phosphorus runs more of the body's chemistry than any other mineral, from your DNA to the ATP that powers every cell."  [grounded: WAL-CLM-RARE-000205 (abundance / ~two pounds / bone-and-teeth) + WAL-CLM-RARE-000204 (more functions than any mineral / nucleic acids / ATP)]
  - Prose-gloss notes (not quotes, so free-voice is fine): verbatim says «just short of two pounds» (lede softens to "nearly two pounds"); verbatim says «nucleic acids» (lede glosses to "DNA"). Both are legitimate lede glosses, NOT figure labels.
  - This is the dossier's identity-forward lede #1; it pairs with lead A or C and deliberately does NOT restate a concept's opening beat. Do NOT ship the paradox-forward alternate (dossier lede #2) if concept B leads — it would pre-empt B's punchline.

- **why** (PROPOSAL): "Phosphorus is the one essential whose daily target is an affirmative zero. In Wallach's Base Line Nutritional Supplement Program the phosphorus row reads `PHOSPHORUS 800 mg 0.0 0.0` — and both of his own figures (True Supplement Need, then 30-day pharmacologic dose) are 0.0. The 800 mg is the government RDA he reprints only to argue against; it is never his recommendation. There is no range, IU factor, body-weight scale or rounding to walk through — Wallach recommends no supplemental phosphorus at all, because the ordinary diet already delivers a heavy surplus (he puts the ideal calcium-to-phosphorus ratio at 2:1 and warns the excess pulls calcium out of the bones). So the target reads 0 mg: the work here is not adding phosphorus, it is restoring the balance by supplementing calcium."  [source_claim_id: WAL-CLM-LETS-000061 · no factors — affirmative zero, target.kind=`wallach`, low=0.0. Supporting: 2:1 ideal WAL-CLM-EPIGEN-000147 / WAL-CLM-DDDL-000052; excess-steals-calcium WAL-CLM-RARE-000206]
  - target.kind is numeric (`wallach`, low `0.0`) — this is NOT a "no target stated" gap. It is a real, sourced zero. State it as the affirmative zero above, never as missing data.

## Per-concept build materials

### Concept A — "The one you already have too much of" (the tilted scale) — *dossier's recommended lead*
- **Exact quotes available**
  - WAL-CLM-DDDL-000052 — «A dietary calcium/phosphorus ratio of 2:1 is ideal»
  - WAL-CLM-DDDL-000052 — «impossible to attain in» *(line 1 tail; next word "an unsupplemented diet" is after a `\n` — take the fragment or the whole clause across the break only if the renderer tolerates the newline)*
  - WAL-CLM-EPIGEN-000147 — «be 2:1; however, this ideal ratio is not found naturally in the human diet without»
  - WAL-CLM-EPIGEN-000147 — «proper supplementation and avoidance of high P junk food (such as soft drinks,»
  - WAL-CLM-EPIGEN-000147 — «soft drinks»
  - WAL-CLM-RARE-000206 — «elevated P intake increases Ca requirements»
  - WAL-CLM-RARE-000206 — «aggravating osteoporosis, arthritis, high blood pressure, loose teeth»
  - WAL-CLM-LETS-000061 — «PHOSPHORUS 800 mg 0.0 0.0»
  - WAL-CLM-LETS-000024 — «calcium malabsorption»
  - WAL-CLM-LETS-000024 — «osteoporosis / arthritis»
  - WAL-CLM-LETS-000024 — «secondary hyperparathyroidism»
- **Numbers**
  - `2:1` (ideal Ca:P) · ratio · WAL-CLM-DDDL-000052 (verbatim «ratio of 2:1») AND WAL-CLM-EPIGEN-000147 (verbatim «be 2:1»). Both verbatim-backed; both `confidence: medium` (see traps).
  - `0.0` (supplement target) · mg/day · WAL-CLM-LETS-000061 (verbatim «PHOSPHORUS 800 mg 0.0 0.0» — the two 0.0s are True-Supplement-Need + 30-day dose).
  - `800` mg · WAL-CLM-LETS-000061 verbatim — **but this is the government RDA**, reprinted to argue against. Do NOT label it as Wallach's amount; if shown at all, mark it as the RDA being rejected.
  - `15–20:1` (inverted "modern diet" ratio) — **claim_text-only in WAL-CLM-LETS-000061; NOT in any verbatim in the pack. Do NOT display as a quote or a hard figure number.** For the "modern" pan, show the 2:1 ideal being violated qualitatively, not a printed "15–20:1".
- **Figure label text** (display-ready strings, each tied to its source)
  - "Ca 2 : P 1" or "2 : 1" (the ideal beam) — traces to the `2:1` ratio in WAL-CLM-DDDL-000052 / WAL-CLM-EPIGEN-000147. Note: «Ca:P» is verbatim in EPIGEN («the Ca:P ratio»); "2 parts calcium, 1 part phosphorus" is our unpacking of "2:1", fine as a label but it is a gloss, not a quote.
  - "soft drinks" — WAL-CLM-EPIGEN-000147 (verbatim «soft drinks»). Safe modern-diet driver.
  - "0.0" / "0 supplement" (payoff) — WAL-CLM-LETS-000061.
  - "excess pulls calcium out" style caption — grounded by WAL-CLM-RARE-000206 «elevated P intake increases Ca requirements» + toxicity list WAL-CLM-LETS-000024 «calcium malabsorption». Keep the caption a paraphrase OR use the exact «calcium malabsorption».
  - Do NOT route "red meat / grains" onto a label as Wallach words — that attribution lives only in claim_text of WAL-CLM-LETS-000061, not verbatim. "soft drinks" is the only verbatim-safe junk-food driver.
- **Structure notes** — one dominant balance-beam; two states (ideal 2:1 → modern tilt); a small calcium block sliding off a bone toward the heavy phosphorus pan (RARE-000206 excess-steals-Ca made literal). Keep it to beam + two pans + one bone. Route all ratio/driver labels beside the pans, never across the beam (stroke-through-text is the #1 rejection cause). Close on the "why the target is 0.0" payoff. No beats-roster.

### Concept B — "More jobs than any mineral — zero on the supplement list" (the paradox)
- **Exact quotes available**
  - WAL-CLM-RARE-000204 — «Phosphorus is a major structural mineral for bones and teeth»
  - WAL-CLM-RARE-000204 — «it has more functions in the human than any other mineral»
  - WAL-CLM-RARE-000204 — «a vital constituent of nucleic acids»
  - WAL-CLM-RARE-000204 — «activates enzymes»
  - WAL-CLM-RARE-000204 — «for several steps of the ATP energy cycle»
  - WAL-CLM-RARE-000204 — «RBC metabolism»
  - WAL-CLM-RARE-000208 — «a decrease in ATP synthesis (complete metabolic energy failure)»
  - WAL-CLM-RARE-000208 — «complete metabolic energy failure»
  - WAL-CLM-RARE-000208 — «widespread, universal and ultimately fatal»
  - WAL-CLM-LETS-000061 — «PHOSPHORUS 800 mg 0.0 0.0»
- **Numbers**
  - `0.0` (the punchline zero) · mg/day · WAL-CLM-LETS-000061 verbatim.
  - No other numbers needed; B's tension is a text roster vs the single zero.
- **Figure label text** (the roles roster — all verbatim-safe from WAL-CLM-RARE-000204)
  - "bones and teeth" · "more functions than any other mineral" · "nucleic acids" · "enzymes" · "ATP energy cycle" · "RBC metabolism"
  - The oversized figure: "0.0 mg / day" — "0.0" + "mg" are verbatim in WAL-CLM-LETS-000061; "day" is the target period (period=daily), a gloss, fine on a label.
  - One-line gloss under the zero ("because your diet already floods you with it") is PROSE, not a quote — keep it in the prose store, not asserted as Wallach's words.
- **Structure notes** — typographic, not a station-diagram: dense small roles list resolving into one large `0.0`. The list earns the punchline. One idea, fast to skim.
- **CAUTION (verbatim boundary)** — «B-complex vitamins act as coenzymes only when combined with phosphorus» and "nutritionists largely ignore it" are in WAL-CLM-RARE-000204's **claim_text but NOT its verbatim**. Do NOT put either on a figure label or quote them. Verbatim-safe roles are the six listed above only.

### Concept C — "3% to 98% — it all depends on the form" (the absorption ladder)
- **Exact quotes available** (all one claim: WAL-CLM-RARE-000207)
  - «The average adult human dietary intake of P is 1,000 to 1,500 mg/day»
  - «the absorption of metallic P is limited to about three to five percent»
  - «as high as eight to 12 percent in infants»
  - «Mixed dietary sources of P (chelated forms) may be absorbed at the rate of 40 to 50 %»
  - «Colloidal P is absorbed up to 98 %»
  - «Optimal absorption of metallic and chelated P occurs when the Ca:P ratio is 1:1»
- **Numbers** (all verbatim-backed in WAL-CLM-RARE-000207)
  - metallic `3–5%` — verbatim spells it «three to five percent» (WORDS, not digits). A "3–5%" label is a digit-rendering of a verbatim-spelled number — legitimate, but the exact QUOTE form is the spelled words.
  - infants `8–12%` — verbatim «eight to 12 percent» (mixed: "eight" word + "12" digit).
  - chelated `40–50%` — verbatim «40 to 50 %» (digits).
  - colloidal `98%` — verbatim «98 %» (digits).
  - intake `1,000–1,500 mg/day` — verbatim «1,000 to 1,500 mg/day» (digits).
  - absorption-optimum `Ca:P 1:1` — verbatim «Ca:P ratio is 1:1» (digits).
- **Figure label text**
  - "metallic 3–5%" · "chelated 40–50%" · "colloidal 98%" — the three rungs (sourced above; metallic is spelled-out in verbatim, render as digits if wanted).
  - framing caption "1,000–1,500 mg/day intake" — verbatim-safe.
  - optional footnote "optimal at Ca:P 1:1" — verbatim-safe.
- **Structure notes** — three stacked bars/steps sized to the percentages (metallic sliver → chelated mid → colloidal near-full), labels to the RIGHT of each bar so no stroke crosses text. One figure, three elements. Distinct figure type from A, B, D.
- **CAUTION (ratio conflation)** — C's ratio is `1:1` (absorption-optimum). A/D's ratio is `2:1` (dietary ideal). They are DIFFERENT contexts from DIFFERENT claims — never mix them in one figure. Keep `1:1` inside C only.
- **Fit note (from dossier)** — strong FIGURE, weaker IDENTITY for phosphorus (target is 0.0, so absorption is "how the balance works," not "how to hit your number"). Best as a lead only if Luneth wants the data-figure register; otherwise a strong supporting block.

### Concept D — "Locked in bone, loose in the blood" (the two-state)
- **Exact quotes available**
  - WAL-CLM-RARE-000205 — «Second in abundance only to calcium in the human body»
  - WAL-CLM-RARE-000205 — «it comprises 22 percent of the bodies total mineral content»
  - WAL-CLM-RARE-000205 — «about 800 grams of P (just short of two pounds)»
  - WAL-CLM-RARE-000205 — «700 grams is found in bones and teeth as insoluble calcium phosphate (apatite crystals)»
  - WAL-CLM-RARE-000205 — «insoluble calcium phosphate (apatite crystals)»
  - WAL-CLM-RARE-000204 — «Phosphorus is a major structural mineral for bones and teeth»
  - WAL-CLM-RARE-000206 — «aggravating osteoporosis, arthritis, high blood pressure, loose teeth»
  - WAL-CLM-LETS-000024 — «secondary hyperparathyroidism»
  - WAL-CLM-LETS-000024 — «osteoporosis / arthritis»
- **Numbers** (all verbatim-backed in WAL-CLM-RARE-000205)
  - `22%` of total mineral content — verbatim «22 percent» (22 digit, "percent" spelled).
  - `~800 grams` total (`just short of two pounds`) — verbatim «800 grams of P (just short of two pounds)». Note verbatim is "just short of", NOT the dossier's casual "just under".
  - `700 grams` in bone/teeth as apatite — verbatim «700 grams».
- **Figure label text**
  - Panel 1 (alliance): "calcium phosphate" · "apatite crystals" · "700 g of 800 g lives here" — all traced to WAL-CLM-RARE-000205 (grams are verbatim; "of 800 g" framing is our composition of two verbatim numbers). "second in abundance only to calcium" — verbatim.
  - Panel 2 (rivalry): "osteoporosis" · "arthritis" · "loose teeth" (WAL-CLM-RARE-000206) · "secondary hyperparathyroidism" (WAL-CLM-LETS-000024). Excess-P-draws-Ca-out caption grounded by RARE-000206 «elevated P intake increases Ca requirements».
- **Structure notes** — two panels, one story: PANEL 1 skeleton = apatite alliance; PANEL 2 bloodstream = the rivalry (excess P leaching Ca). Carry the turn with a connective sentence, NOT a divider. Two clean vignettes, one mineral pair.
- **CAUTION (verbatim boundary)** — the "blood's major buffering system" / "biologically active remainder combined with carbohydrates, lipids, proteins" detail is in WAL-CLM-RARE-000205's **claim_text but NOT its verbatim**. Do NOT put "blood buffer" on any Panel-2 label.
- **Overlap note (from dossier)** — D shares the calcium-antagonism material with A. Pick ONE of {A, D} as the calcium-relationship header; let the other slot go to B or C. Do not run both.

## Trap resolutions (claim_text > verbatim — every number where the naive source is NOT verbatim-backed)
- **`15–20:1` inverted modern-diet ratio** -> the number, plus the "red meat / grains / phosphate soft drinks" attribution, is **claim_text-only in WAL-CLM-LETS-000061; it is in NO verbatim in the pack.** Do NOT print it as a Wallach figure. The verbatim-safe substitute is the `2:1` ideal (WAL-CLM-EPIGEN-000147 / WAL-CLM-DDDL-000052) shown being violated, with "soft drinks" (verbatim in EPIGEN) as the one safe named driver.
- **`800 mg` = the government RDA, not a recommendation** -> verbatim-present in WAL-CLM-LETS-000061 («PHOSPHORUS 800 mg 0.0 0.0») but it is the RDA Wallach reprints to argue against. If shown, it must read as the rejected RDA, never as Wallach's amount. His figures are the two `0.0`s.
- **"blood's major buffering system" / biologically-active remainder** -> claim_text of WAL-CLM-RARE-000205 only; NOT verbatim. Do not label a figure with "blood buffer."
- **"B-complex vitamins act as coenzymes only when combined with phosphorus" / "nutritionists largely ignore it"** -> claim_text of WAL-CLM-RARE-000204 only; NOT verbatim. Do not quote or label with either. Verbatim-safe roles: more functions than any mineral, nucleic acids, enzymes, ATP energy cycle, RBC metabolism, structural in bone/teeth.
- **Spelled-vs-digit numbers (not a claim_text trap, but a quote-form note):** metallic absorption is «three to five percent» (WORDS) in WAL-CLM-RARE-000207; `22 percent`, `eight to 12 percent` are mixed. These ARE verbatim-backed — a digit label ("3–5%", "22%") is a rendering, but a QUOTE must reproduce the spelled form exactly.
- **Two ratio contexts — never conflate:** `2:1` = DIETARY ideal (WAL-CLM-DDDL-000052, WAL-CLM-EPIGEN-000147). `1:1` = ABSORPTION optimum for metallic/chelated P (WAL-CLM-RARE-000207). Different claims, different meanings; keep 2:1 in A/D and 1:1 in C.
- **Confidence flag:** both 2:1-ratio claims (WAL-CLM-DDDL-000052, WAL-CLM-EPIGEN-000147) are `confidence: medium`; every other claim used is `high`. The ratio is corroborated across two books, so it is safe to use, but the medium tag is noted.

## Category / width / background (from .claude/rules/element-headers.md)
- **Category accent:** phosphorus = **mineral → blue** (minerals=blue, vitamins=orange, aminos=green, fatty-acids=purple; `data-category="mineral"` on `.kd-ep`).
- **Width:** the header renders inside the tan `.kd-ep-fam` box; the FIGURE ceiling is ~817px (NOT the 867px outer screen). Prefer the two exact shipped slots — `--fork` 700px or `--rail` 660px — which need no new CSS. Author every figure at scale 1 (viewBox width == CSS max-width). Figure width override must be ID-scoped (`#drawer-knowledge-mount .kd-ep-fam__figure.<modifier>`) or it silently shrinks 30%.
- **Background:** the element-category-tinted `--ds-paper-deep` main content box; it LEADS INTO the Best-Youngevity-sources block, so keep the bottom edge clean for that hand-off. Best-Youngevity-sources always sits at the bottom.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier recommends A; holds B or C as the distinct-figure alternate; {A,D} are mutually-exclusive calcium-relationship stagings).
- Chassis (legacy) vs composed `blocks[]` shape.
- Final layout, coordinates, figure geometry, number of sections, whether there are beats/a big stat/a pull quote at all, and their order.
- Final display copy + tone (the lede/why above are PROPOSALS).
- Visual sign-off — every header is demo-only until Luneth approves.
