# Iodine — design-prep build sheet
> Source materials for chronicle/header-research/iodine.md. Byte-verified from sealed claims (pack: _packs/iodine.json). NOT a design — concept choice + layout stay open for Luneth.

Every «quote» below is a byte-exact contiguous substring of the cited claim's `verbatim`. Where a good phrase crossed a line-break in the verbatim, the chosen substring stays within one source line so it copies clean. Numbers are each tied to the claim whose VERBATIM contains the numeral (not a claim_text-only source).

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "iodine")
- **lede** (PROPOSAL): "The thyroid's raw material — a trace mineral needed in mere micrograms, which the gland pairs with the amino acid tyrosine to build thyroxin, the hormone that sets the speed of your whole metabolism."  [grounded: WAL-CLM-DDDL-000023 (tyrosine → thyroxin), WAL-CLM-RARE-000145 (thyroid hormones = metabolic master dial), WAL-CLM-EPIGEN-000131 (50–150 mcg = micrograms). Avoids restating any concept's opening beat: A opens on the two failure directions, C on the ocean→gland journey.]
- **why** (PROPOSAL): "Wallach's Epigenetics daily mineral table lists iodine at 50–150 mcg per 100 lb of body weight. Taking the upper bound (150 mcg) and scaling to a 154 lb reference body (×1.54) gives 231, rounded to two significant figures = 230 mcg/day. That lands squarely inside his other stated figures — his Let's Play Doctor Base Line program independently lists a 250 mcg True Supplement Need, and his goiter and hypothyroid protocols use 250 mcg/day — all far under the 2,000 mcg/day he calls non-toxic."  [source_claim_id: WAL-CLM-EPIGEN-000131; chain: upper-of-range 150 → ×1.54 → round-2sf = 230; corroborators WAL-CLM-LETS-000054 (250 True Supplement Need), WAL-CLM-LETS-000287 (250 goiter dose), safety ceiling WAL-CLM-IMMORT-000178 (2,000). target.kind = "wallach" (plain number, no gap.)]

## Per-concept build materials

### Concept A — The metabolic dial (two-lane hypo ↔ hyper)  [dossier's recommended lead]
- **Exact quotes available**
  - WAL-CLM-RARE-000145 — «control and regulate digestion, heart rate, body temperature, sweat gland activity, nervous and reproductive system, general metabolism and body weight» (the master-regulator list, entirely on one verbatim line — quote any span of it)
  - WAL-CLM-RARE-000145 — «Thyroid hormones control and regulate digestion»
  - WAL-CLM-IMMORT-000181 — «Some one million Americans have either a hypothyroid» (prevalence — see trap: this is the ONLY verbatim-backed prevalence figure; "11 million" is NOT quotable)
  - WAL-CLM-DDDL-000023 — «iodine is manufactured into the thyroid hormone thyroxin.» (the mechanism that makes the dial work)
  - Hypo (slow-lane) mirror labels, each a clean single-token substring:
    - WAL-CLM-IMMORT-000182 — «Fatigue» · «Cold intolerance» · «Weight gain» · «Constipation» · «Hair loss» · «Depression» · «Goiter»
    - WAL-CLM-RARE-000150 — «Fatigue» · «Cold intolerance» · «Weight gain» · «Constipation» · «Hair loss» · «Goiter» (parallel source, same tokens)
  - Hyper (fast-lane) mirror labels, each a clean single-token substring:
    - WAL-CLM-IMMORT-000183 — «Insomnia» · «Heat intolerance» · «Weight loss» · «Frequent bowel movements» · «Increased appetite» · «Goiter»
    - WAL-CLM-RARE-000151 — «Insomnia» · «Heat Intolerance» · «Weight loss» · «Frequent bowel movements» · «Goiter» (note capital "Intolerance" in this source — pick the source that matches the case you display)
- **Numbers**
  - "one million" (Americans with a thyroid condition) · no unit · **WAL-CLM-IMMORT-000181** verbatim («Some one million Americans»). NOTE: "11 million" (dossier §1/§5) is claim_text-only in EPIGEN-000093 AND RARE-000150 — not in either verbatim — so it CANNOT be shown as a quote. See Trap resolutions.
- **Figure label text** (the exact mirror pairs an illustration would print, each byte-exact from a verbatim):
  - Slow ← → Fast pairs (left = hypo, right = hyper):
    - «Cold intolerance» (IMMORT-000182 / RARE-000150) ↔ «Heat intolerance» (IMMORT-000183) / «Heat Intolerance» (RARE-000151)
    - «Weight gain» (IMMORT-000182 / RARE-000150) ↔ «Weight loss» (IMMORT-000183 / RARE-000151)
    - «Constipation» (IMMORT-000182 / RARE-000150) ↔ «Frequent bowel movements» (IMMORT-000183 / RARE-000151)
    - «Fatigue» (IMMORT-000182 / RARE-000150) ↔ «Insomnia» (IMMORT-000183 / RARE-000151)
  - Shared centre / both-ends sign: «Goiter» (present in all four symptom-list verbatims)
  - Optional dial caption source (mechanism, not a label): «control and regulate digestion, heart rate, body temperature, sweat gland activity … general metabolism and body weight» (WAL-CLM-RARE-000145)
- **Structure notes** — one central gauge with a needle; two symmetric outward lanes; three-to-four mirror-paired signs sit one pair per row so the mirror reads by construction; goiter as the sign that lands on both ends. No stroke routed through any label (the paired signs live in clean cells beside each arc). The pairing is the payload — keep the count small.

### Concept B — The copper twist ("Same soil, different fate")
- **Exact quotes available**
  - WAL-CLM-RARE-000149 — «46% of the population of Pisila; 40% of the population of Polje and only 3% of the population of Milahnici» (the three rates AS NUMERALS — this is the only verbatim that carries them numerically)
  - WAL-CLM-RARE-000149 — «there is identical iodine content of the soil in all three locations» (the twist premise)
  - WAL-CLM-RARE-000149 — «copper is required to utilize iodine» (the payoff)
  - WAL-CLM-IMMORT-000180 — «There is an identical iodine content of» / «Forty-six percent of the population of Pisila, 40% of the» (parallel source; note it SPELLS OUT "Forty-six percent" — see trap)
  - WAL-CLM-DDDL-000025 — «copper is a required cofactor to utilize iodine.» (cleanest cofactor statement)
- **Numbers**
  - 46% · percent · **WAL-CLM-RARE-000149** (numeral). TRAP: not IMMORT-000180 (spells "Forty-six percent").
  - 40% · percent · **WAL-CLM-RARE-000149** (also numeral in IMMORT-000180 «40% of the» — either is byte-safe).
  - 3% · percent · **WAL-CLM-RARE-000149** (numeral). TRAP: not IMMORT-000180 (spells "three percent").
- **Figure label text** (each byte-exact from a verbatim):
  - Island names: «Pisila» · «Polje» · «Milahnici» (both RARE-000149 and IMMORT-000180)
  - Goiter rates as dominant numbers: «46%» · «40%» · «3%» (all from RARE-000149)
  - Top band premise: «identical iodine content of the soil in all three locations» (RARE-000149) or «identical iodine content of» (IMMORT-000180)
  - Reveal / key mark: «copper is required to utilize iodine» (RARE-000149) or «copper is a required cofactor to utilize iodine» (DDDL-000025)
- **Structure notes** — three island tiles sharing one "iodine: identical" band across the top; each tile's goiter % is the dominant figure; one caption underneath delivers the twist (variable was copper); a small copper-key/cofactor mark by the low-goiter island (Milahnici / 3%). Numbers do the work — few elements, no body diagram.

### Concept C — Sea to gland (where-it-lives geography)
- **Exact quotes available**
  - WAL-CLM-IMMORT-000173 — «sea water at 0.06 ppm, soil at 5 ppm,» (the abundance drop, sea → land)
  - WAL-CLM-IMMORT-000173 — «marine plants at 30 to 1,500 ppm» (the rich sea end)
  - WAL-CLM-IMMORT-000173 — «plants at 0.42 ppm, marine animals at 1.0 to 150 ppm, and in» (terrestrial-plant figure 0.42)
  - WAL-CLM-IMMORT-000173 — «large areas of earth are known to be» / «devoid of iodine» (the empty-inland idea; both are single-line substrings — do NOT join them across the line-break as one quote)
  - WAL-CLM-IMMORT-000173 — «concentrates in the thyroid» / «gland and hair).» (where the body hoards it — VERBATIM-backed here, NOT in RARE-000144; see trap)
  - WAL-CLM-IMMORT-000001 — «communities living at a distance from the sea» (why deficiency is geographic)
  - WAL-CLM-IMMORT-000001 — «Iodine deficiency (goiter) occurred in»
  - WAL-CLM-RARE-000144 — «Known to be essential to red and brown algae and all vertebrates.» (its FULL verbatim; use only for the essentiality note, NOT for the thyroid-concentration phrase)
- **Numbers**
  - seawater 0.06 ppm · ppm · **WAL-CLM-IMMORT-000173** («sea water at 0.06 ppm»)
  - soil 5 ppm · ppm · **WAL-CLM-IMMORT-000173** («soil at 5 ppm»)
  - terrestrial plants 0.42 ppm · ppm · **WAL-CLM-IMMORT-000173** («plants at 0.42 ppm»)
  - marine plants 30–1,500 ppm · ppm · **WAL-CLM-IMMORT-000173** («marine plants at 30 to 1,500 ppm»)
- **Figure label text** (byte-exact):
  - Sea end (rich): «marine plants at 30 to 1,500 ppm» (IMMORT-000173)
  - Inland (poor): «soil at 5 ppm» + «terrestrial … 0.42 ppm» sources; empty-zone caption «devoid of iodine» (IMMORT-000173)
  - Gland end (concentrated): «concentrates in the thyroid» + «gland and hair)» (IMMORT-000173)
  - Threading idea (middle): «communities living at a distance from the sea» (IMMORT-000001)
- **Structure notes** — one horizontal gradient strip, three anchored stations left→right: OCEAN (rich) → INLAND SOIL (poor) → THE THYROID (concentrated). Dense/blue at sea, fading to near-empty inland, one highlighted thyroid glyph at the terminus. One gradient carries the arc; three labels only; no busy map.

### Concept D — Present but blocked (the goitrogen saboteur)
- **Exact quotes available**
  - WAL-CLM-IMMORT-000179 — «Goiter develops in Japanese living along the sea coast» (the paradox: iodine present, goiter anyway). Its FULL verbatim is only this Japanese-seacoast sentence — the feeding study is NOT in it; see trap.
  - WAL-CLM-RARE-000147 — «Goiter develops in Japanese living along the sea coast despite high daily iodine consumption.» (its FULL verbatim — same paradox, one clean line; feeding study NOT quotable from it either)
  - WAL-CLM-IMMORT-000184 — «nitrates and nitrites (i.e. ham, bacon, sausage, bologna,» (the cured-meat culprits)
  - WAL-CLM-IMMORT-000184 — «salami, pastrami, pepperoni, jerky, deli-meats, etc.) and» (more cured-meat culprits)
  - WAL-CLM-IMMORT-000184 — «cruciferous vegetables (i.e. broccoli, Brussel sprouts, cabbage,» (the veg culprits)
  - WAL-CLM-EPIGEN-000160 — «Cruciferous vegetables (e.g., cabbage, broccoli, cauliflower, Brussel sprouts,» (parallel veg list, adds cauliflower + kale on the next line)
  - WAL-CLM-EPIGEN-000160 — «Dietary nitrates (e.g,, deli slices, sandwich meats, etc.)» (parallel nitrate source)
  - WAL-CLM-RARE-000148 — «nitrates, broccoli, cabbage, Brussels sprouts, etc.» (compact culprit list)
- **Numbers** — NONE displayable as a quote. The feeding study's "2.0 mcg iodine" is claim_text-only (see trap). This concept is quote/label-driven, not number-driven.
- **Figure label text** (byte-exact):
  - Iodine-present premise: «Goiter develops in Japanese living along the sea coast» (IMMORT-000179 / RARE-000147)
  - Blocker foods (cured-meat lane): «ham, bacon, sausage, bologna,» (IMMORT-000184) · «salami, pastrami, pepperoni, jerky, deli-meats» (IMMORT-000184)
  - Blocker foods (cruciferous lane): «broccoli, Brussel sprouts, cabbage,» (IMMORT-000184) or «cabbage, broccoli, cauliflower, Brussel sprouts,» (EPIGEN-000160)
  - The single word for the barrier concept: «goitrogens» appears in IMMORT-000184 / EPIGEN-000160 / RARE-000148 verbatims but is wrapped in straight double-quotes in-source — quote the surrounding phrase rather than the bare word to stay byte-safe.
- **Structure notes** — a gate/barrier motif: iodine arriving on one side, a short row of named culprits (cured meats/nitrates lane · cruciferous lane) forming the block, the thyroid stalled behind it. Handful of icons, no busy pantry. IMPORTANT: the "only seaweed was spared" feeding-study punchline (dossier's proposed twist) is claim_text-only and NOT quotable — if used it must be authored prose, never shown as a Wallach quote. Caveat from dossier §5: B and D both say "iodine present ≠ working"; do not ship both.

## Trap resolutions (claim_text > verbatim — cite the verbatim-backed id)
- **46% -> cite WAL-CLM-RARE-000149 (numeral), NOT WAL-CLM-IMMORT-000180** (its verbatim spells "Forty-six percent").
- **3% -> cite WAL-CLM-RARE-000149 (numeral), NOT WAL-CLM-IMMORT-000180** (its verbatim spells "three percent"). (40% is numeric in both — either is safe.)
- **"11 million" (thyroid prevalence) -> NOT verbatim-backed anywhere.** Claim_text-only in WAL-CLM-EPIGEN-000093 AND WAL-CLM-RARE-000150 (both verbatims are pure symptom lists). The ONLY quotable prevalence figure is «Some one million Americans» in WAL-CLM-IMMORT-000181. Do NOT display "11 million" as a quote; if a header needs it, it is authored prose citing EPIGEN-000093/RARE-000150 by claim_text, not a quotation. (Dossier §5 also warns: never average the two figures.)
- **"50 to 100 times its normal size" (goiter swelling) -> NOT verbatim-backed anywhere.** Claim_text-only in BOTH WAL-CLM-IMMORT-000001 and WAL-CLM-LETS-000287. Do not display as a quote. (Relevant only if the §5 "first visible sign / goiter lump" fifth concept is picked.)
- **Feeding-study details (Chinese cabbage, turnips, buckwheat, noodles, 2.0 mcg iodine, soybean, "only seaweed spared") -> NOT verbatim-backed.** Claim_text-only in BOTH WAL-CLM-IMMORT-000179 and WAL-CLM-RARE-000147; each verbatim is only the one Japanese-seacoast sentence. Do not quote the food list or "2.0 mcg". Concept D's punchline must be authored prose.
- **"concentrates in the thyroid gland and hair" -> cite WAL-CLM-IMMORT-000173, NOT WAL-CLM-RARE-000144.** RARE-000144's full verbatim is only «Known to be essential to red and brown algae and all vertebrates.» — the thyroid-concentration phrase lives only in IMMORT-000173's verbatim. (Dossier §1 and Concept C anchored RARE-000144 for this phrase.)
- **Dose row read (WAL-CLM-LETS-000054): «IODINE 150 mcg 250 mcg 1,000 mcg».** Column order = government RDA · Wallach's True Supplement Need · 30-day pharmacologic. 250 is Wallach's maintenance figure; 150 is the RDA he reprints to argue against and is NEVER his recommendation; 1,000 is a 30-day pharmacologic dose. If quoting «250 mcg», label it as the True Supplement Need, not the RDA.

## Category / width / background (from .claude/rules/element-headers.md)
- **Category accent:** mineral = **blue** (iodine, symbol I, category "mineral").
- **Width:** the header must match the element detail screen exactly. Figure ceiling inside the tan `.kd-ep-fam` box is ~817px (865px clientWidth − 24px padding a side); prefer the two shipped exact slots — **`--fork` 700px** or **`--rail` 660px** — over authoring a bespoke near-ceiling width. Author every figure at scale 1 (viewBox width == CSS max-width) and declare the width override at ID-scoped specificity (`#drawer-knowledge-mount .kd-ep-fam__figure.<modifier>`), or it silently renders at the 560px base.
- **Background:** renders inside the tan `.kd-ep-fam` main content box (`--ds-paper-deep`), tinted by the mineral (blue) accent — this block leads directly into the Best-Youngevity-sources block, so keep the closing edge compatible with that hand-off.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept (A / B / C / D), or a mix; whether to offer the §5 fifth "goiter lump / first visible sign" body-sign concept.
- Chassis (legacy) vs composed `blocks[]` layout.
- Final layout, coordinates, figure widths, illustration geometry.
- Final display copy, tone, and which parallel source to quote where two carry the same token.
- Visual sign-off (STOP-for-verification before any live build).
