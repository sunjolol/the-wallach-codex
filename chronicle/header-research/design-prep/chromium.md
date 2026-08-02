# Chromium — design-prep build sheet
> Source materials for chronicle/header-research/chromium.md. Byte-verified from sealed claims (pack: _packs/chromium.json). NOT a design — concept choice + layout stay open for Luneth.
>
> ★ Every «guillemet» quote below is a byte-exact contiguous substring of the cited claim's `verbatim`. Where a verbatim uses a curly quote (U+201C `“` / U+201D `”`) or curly apostrophe (U+2019 `’`), it is reproduced literally in the quote and noted. Substrings were kept WITHIN a single line-segment of the verbatim (no crossing an internal newline) unless explicitly marked, so each is clean and byte-safe.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "chromium")

- **lede** (PROPOSAL — primary): "The trace mineral at the core of glucose tolerance factor — the compound that lets insulin move sugar out of your blood — yet the one sugar itself flushes out, which is why Wallach reads a craving for sweets as the body asking for chromium."  [grounded: GTF core WAL-CLM-IMMORT-000087; sugar raises urinary loss WAL-CLM-IMMORT-000091; craving = deficiency signal WAL-CLM-RARE-000039]
- **lede** (PROPOSAL — alternate): "A trace mineral the whole body holds barely 1.5 mg of, yet the working core of glucose tolerance factor — what insulin needs to control blood sugar — and the one Wallach says 90% of Americans run short of."  [grounded: GTF core WAL-CLM-IMMORT-000087; 90% deficient WAL-CLM-DDDL-000015]  ⚠ NUMBER-TRAP: the "1.5 mg" here is **claim_text-only** in WAL-CLM-IMMORT-000087 (its verbatim never states it). Fine as our-voice lede prose sourced to that claim, but it can NEVER be shown as a quotation.
- Both ledes deliberately avoid restating any concept's opening beat (the loop / the 33% / the 1:100 / the keystone stay held back for the figure). Luneth ratifies the pick.
- **why** (PROPOSAL): "The daily target is 620 mcg. Wallach's *Epigenetics* daily mineral program lists chromium at 200–400 mcg per 100 lb of body weight; the build takes the upper end (400 mcg) and scales it from the per-100-lb basis to the app's 154 lb (70 kg) reference (×1.54), giving 400 × 1.54 = 616, rounded to two significant figures → 620 mcg. It sits in the same range as his *Let's Play Doctor* Base-Line program, which lists a 200 mcg daily true supplement need and a 300–600 mcg 30-day pharmacologic dose — so the number is Wallach-sourced end to end. And because ordinary food delivers only a fraction of chromium in usable form, the figure reflects what must be *supplied*, not merely eaten."  [source_claim_id WAL-CLM-EPIGEN-000129 · upper_taken 400 · scale_factor 1.54 · round 2 sig figs → 620; neighbour dose WAL-CLM-LETS-000049; absorption context WAL-CLM-IMMORT-000091]
  - target.kind = **wallach (numeric)** — this is an honest Wallach-sourced number, NOT a gap. Pack: `target.low = 620`, `source_claim_id = WAL-CLM-EPIGEN-000129`, `provenance.upper_taken = 400`, `scale_factor = 1.54`, `original_low/high = 200/400 mcg`, `rounding = 2 significant figures`.

## Per-concept build materials

### Concept A — The Sugar Loop
_Sugar washes chromium out; low chromium drives a craving for sugar — a self-reinforcing loop._

- **Exact quotes available**
  - WAL-CLM-IMMORT-000091 — «by 300% for 12 hours.»
  - WAL-CLM-IMMORT-000091 — «increase the natural rate of urinary Cr loss»
  - WAL-CLM-RARE-000039 — «cravings for alcohol and candy cravings (especially chocolate) are sure signs of a chromium and vanadium deficiency.»  (curly-free, safest)
  - WAL-CLM-RARE-000039 — «The “munchies”, cravings for alcohol and candy cravings (especially chocolate) are sure signs of a chromium and vanadium deficiency.»  (full sentence; opens/closes with curly U+201C `“` … U+201D `”` around munchies — copy those exactly)
  - WAL-CLM-IMMORT-000467 — «an intense thirst for liquid (high fructose corn syrup laden»
  - WAL-CLM-IMMORT-000467 — «soft drinks being the usual first choice and water the last for»  (the phrase "…water the last for minerally deficient humans" crosses an internal newline after "for"; stop the quote at "for" or take the next segment separately)
  - WAL-CLM-RARE-000313 — «soft drinks being the usual first choice and water the last»
- **Numbers**
  - 300% · (rate of urinary chromium loss) · verbatim-backed by **WAL-CLM-IMMORT-000091** ("by 300% for 12 hours"). ⚠ TRAP: NOT WAL-CLM-RARE-000117 (its verbatim omits 300% — claim_text-only there) and NOT WAL-CLM-EPIGEN-000062 (claim_text-only).
  - 12 hours · (duration of the elevated loss) · verbatim-backed by **WAL-CLM-IMMORT-000091** only (same trap as above).
- **Figure label text** (exact display strings, each tied to its source claim)
  - Node 1: "SUGAR"  [framing term; sugar-load list in WAL-CLM-IMMORT-000091 verbatim: colas, apple juice, grape juice, honey, candy, table sugar, fructose]
  - Node 2: "CHROMIUM FLUSHED OUT"  [WAL-CLM-IMMORT-000091 — «increase the natural rate of urinary Cr loss»]
  - Arrow A caption: "urinary loss up 300% for 12 hrs"  [number from WAL-CLM-IMMORT-000091 — «by 300% for 12 hours.»]
  - Arrow B caption: "low chromium → crave sweets"  [WAL-CLM-RARE-000039 — «are sure signs of a chromium and vanadium deficiency.»]
- **Structure notes** — Two nodes + two curved arrows closing a circle; both captions routed OUTSIDE the arrows, never across them. Keep vanadium out of the figure (chromium-first) — the craving quote names "chromium and vanadium" but the loop should read as chromium's story; vanadium is at most a supporting mention in surrounding copy.

### Concept B — A Third More Life
_A single trace mineral extended animal lifespan ~33%, overturning the "only calorie restriction" belief._

- **Exact quotes available**
  - WAL-CLM-RARE-000124 — «Gary Evans, Bemidji State University, Minnesota, very clearly showed an increased life span in laboratory animals by 33.3 per cent when they were supplemented with chromium.»  (entire verbatim, single line, curly-free)
  - WAL-CLM-DDDL-000016 — «by 33.3 percent»
  - WAL-CLM-DDDL-000016 — «felt a severe restriction of calories was the only way to extend life»
  - WAL-CLM-DDDL-000016 — «gerontologists, led by Roy»  ("…led by Roy Walford" crosses an internal newline after "Roy"; take "Walford, felt a severe restriction…" as the next segment if the name is needed)
  - WAL-CLM-IMMORT-000090 — «by 33.3%, when they were supplemented, with chromium.»
  - WAL-CLM-IMMORT-000090 — «led by Dr. Roy Walford,»
  - WAL-CLM-IMMORT-000090 — «felt a Calorie Restricted diet was the only way to extend life»
- **Numbers**
  - 33.3% · (increase in laboratory-animal lifespan) · verbatim-backed THREE ways, with three DIFFERENT literal spellings — match the literal to the claim you cite:
    - WAL-CLM-RARE-000124 → literal is «33.3 per cent» (two words)
    - WAL-CLM-DDDL-000016 → literal is «33.3 percent» (one word)
    - WAL-CLM-IMMORT-000090 → literal is «33.3%» (symbol)
    - ⚠ TRAP: do NOT source this number to WAL-CLM-EPIGEN-000062 (its claim_text says "33% longer" but the verbatim is only the deficiency-disease list).
- **Figure label text**
  - Baseline bar label: "baseline lifespan"  [contrast implied by all three lifespan claims]
  - Extended bar label: "+33.3%"  [pick the exact literal from whichever claim is cited above; e.g. WAL-CLM-IMMORT-000090 for "33.3%"]
  - Attribution caption: "Gary Evans, Bemidji State University"  [WAL-CLM-RARE-000124 / WAL-CLM-DDDL-000016 / WAL-CLM-IMMORT-000090 — all three verbatims name "Gary Evans, Bemidji State University, Minnesota"]
  - Optional reversal caption: "before this, only calorie restriction was believed to work — Roy Walford"  [WAL-CLM-DDDL-000016 / WAL-CLM-IMMORT-000090 verbatims name Roy Walford + calorie restriction]
- **Structure notes** — Two horizontal bars sharing one left origin so the extension reads by construction; the extra one-third segment tinted + labelled. Fewest possible marks — the concept leans on one finding, so surrounding copy must not pad.

### Concept C — The 1-in-100 Mineral
_Chromium is the trace mineral you keep almost none of — absorbed form is the whole game._

- **Exact quotes available**
  - WAL-CLM-RARE-000074 — «For the metallic form of iodine the ratio is almost 1:1;»  (curly-free)
  - WAL-CLM-RARE-000074 — «1:10 and for chromium »  (curly-free fragment; note trailing space)
  - WAL-CLM-RARE-000074 — «1:100.»
  - WAL-CLM-RARE-000074 — «For the metallic form of iodine the ratio is almost 1:1; for iron it’s 1:10 and for chromium it’s 1:100.»  (full sentence; both apostrophes are curly U+2019 `’` — copy exactly, NOT a straight ')
  - WAL-CLM-IMMORT-000091 — «The average intake of 50 to 100 ug of»
  - WAL-CLM-IMMORT-000091 — «inorganic chromium from food and water supplies only 0.25»  ("0.25 to 5 ug…" crosses an internal newline after "0.25"; next segment is the quote below)
  - WAL-CLM-IMMORT-000091 — «to 5 ug of usable and retainable chromium.»
  - WAL-CLM-IMMORT-000091 — «By contrast, 25%»
  - WAL-CLM-IMMORT-000091 — «of chelated chromium is absorbed and up to 98% of colloidal»  (verbatim then has blank lines before "chromium is absorbed."; stop at "colloidal")
  - WAL-CLM-RARE-000117 — «The average intake of 50 to 100 ug of inorganic chromium from food and water supplies only 0.25 to 0.5 ug of usable chromium, by contrast 25 % of chelated chromium is absorbed.»  (entire verbatim, single line, curly-free)
- **Numbers**
  - 1:1 (iodine) · 1:10 (iron) · 1:100 (chromium) — absolute-vs-dietary requirement ratios, metallic form · verbatim-backed by **WAL-CLM-RARE-000074**.
  - 50–100 ug (typical inorganic intake) · verbatim-backed by WAL-CLM-IMMORT-000091 AND WAL-CLM-RARE-000117.
  - 0.25–5 ug retained · verbatim-backed by **WAL-CLM-IMMORT-000091** ("only 0.25 / to 5 ug").
  - 0.25–0.5 ug usable · verbatim-backed by **WAL-CLM-RARE-000117**. ⚠ DISCREPANCY (not a trap — both are real, different books): Immortality says the retained fraction is 0.25–**5** ug; Rare Earths says 0.25–**0.5** ug. Pick ONE and cite the matching claim; do not blend them.
  - 25% chelated absorbed · verbatim-backed by WAL-CLM-IMMORT-000091 ("25%") AND WAL-CLM-RARE-000117 ("25 %" — note the space in the Rare Earths literal).
  - up to 98% colloidal absorbed · verbatim-backed by **WAL-CLM-IMMORT-000091** only.
  - (RDA "50 to 200 ug" appears in both absorption verbatims but is the government figure Wallach cites to argue against — never present as his recommendation.)
- **Figure label text**
  - Rung/bar 1: "iodine ≈ 1:1"  [WAL-CLM-RARE-000074]
  - Rung/bar 2: "iron 1:10"  [WAL-CLM-RARE-000074]
  - Rung/bar 3: "chromium 1:100"  [WAL-CLM-RARE-000074] — the shortest bar by far
  - Optional single form-lever caption (text, not a second figure): "25% chelated → up to 98% colloidal"  [WAL-CLM-IMMORT-000091]
- **Structure notes** — Three-bar / three-rung comparison, one idea and three marks, chromium's the shortest. Keep the form-lever line as text to avoid a second competing figure.

### Concept D — The Insulin Keystone
_Chromium is the small metal core of GTF — a three-piece molecule blood-sugar control is built on._

- **Exact quotes available**
  - WAL-CLM-IMMORT-000087 — «Chromium activates phosphoglucomutase and other»
  - WAL-CLM-IMMORT-000087 — «enzymes and is closely associated with glucose tolerance factor»
  - WAL-CLM-IMMORT-000087 — «Glucose tolerance factor is a combination of chromium»  ("…combination of chromium III, dinicotinic acid and glutathione" crosses an internal newline after "chromium"; take the next segment for the parts)
  - WAL-CLM-IMMORT-000087 — «III, dinicotinic acid and glutathione.»
  - WAL-CLM-DDDL-000046 — «a whole specialty of medicine»
  - WAL-CLM-DDDL-000046 — «which could be wiped out by universal chromium supplementation»
- **Numbers**
  - (none verbatim-backed for this concept.) ⚠ TRAP: "1.5 mg" whole-body chromium and the "hair ~10× higher than blood" fact are BOTH **claim_text-only** in WAL-CLM-IMMORT-000087 — its verbatim states neither. Do NOT display either as a quote. No verbatim anywhere in the pack contains "1.5 mg" or the hair-concentration ratio.
- **Figure label text** (an assembled 3-part emblem)
  - Centre stone: "Cr³⁺"  [WAL-CLM-IMMORT-000087 — verbatim says "chromium III"]
  - Flank part 1: "dinicotinic acid (a B3 relative)"  [WAL-CLM-IMMORT-000087 — verbatim "dinicotinic acid"; "a B3 relative" is our gloss, not a quote]
  - Flank part 2: "glutathione"  [WAL-CLM-IMMORT-000087 — verbatim "glutathione"]
  - Assembly caption: "= glucose tolerance factor"  [WAL-CLM-IMMORT-000087 — verbatim "glucose tolerance factor (GTF)"]
  - Optional consequence line: "a whole specialty of medicine could be wiped out by chromium"  [WAL-CLM-DDDL-000046 — quotable as «a whole specialty of medicine» + «which could be wiped out by universal chromium supplementation»]
- **Structure notes** — One assembled object (badge/keystone), three labelled parts, no wiring/arrows through labels. GTF composition wording must come from WAL-CLM-IMMORT-000087 only (see trap #6 below) — WAL-CLM-RARE-000116 asserts GTF in its claim_text but its verbatim is a deficiency-disease list, not the composition.

## Trap resolutions (claim_text > verbatim — every number whose citing id differs from the naive claim_text source)

- **300% (12-hour urinary loss)** -> cite **WAL-CLM-IMMORT-000091** (verbatim: "by 300% for 12 hours"), NOT WAL-CLM-RARE-000117 (verbatim omits it — 300% is only in that claim's claim_text) and NOT WAL-CLM-EPIGEN-000062 (claim_text only; its verbatim is the deficiency list).
- **90% of Americans deficient** -> cite **WAL-CLM-DDDL-000015** («…“Ninety percent of»/«all Americans are deficient in chromium.») or **WAL-CLM-IMMORT-000089** (same "Ninety percent" wording) or **WAL-CLM-RARE-000118** («"90 percent of Americans are deficient in chromium."» — straight ASCII quotes, numeral "90"), NOT WAL-CLM-EPIGEN-000062 (claim_text only).
- **33% / 33.3% lifespan increase** -> cite **WAL-CLM-RARE-000124** ("33.3 per cent") / **WAL-CLM-DDDL-000016** ("33.3 percent") / **WAL-CLM-IMMORT-000090** ("33.3%"), NOT WAL-CLM-EPIGEN-000062 (claim_text only).
- **1.5 mg whole-body chromium** -> **NO verbatim source anywhere** — claim_text-only in WAL-CLM-IMMORT-000087. Do NOT display as a quote (our-voice prose only, sourced to that claim).
- **hair concentrates chromium ~10× higher than blood / hair analysis beats a blood test** -> **NO verbatim source** — claim_text-only in WAL-CLM-IMMORT-000087. Do NOT display as a quote. (Hair-analysis diagnostic patterns exist — WAL-CLM-RARE-000081, WAL-CLM-RARE-000129 — but they list mineral signatures, not the 10× concentration fact.)
- **GTF = chromium III + dinicotinic acid + glutathione** -> cite **WAL-CLM-IMMORT-000087** only (verbatim). NOT WAL-CLM-RARE-000116 — its claim_text names GTF but its verbatim is the deficiency-disease list.
- **Serum-chromium decline series (28 / 1000 in 1948 → … → 0.13 by 1985)** -> **NO verbatim source** — claim_text-only in WAL-CLM-IMMORT-000092 (its verbatim states only the qualitative "steady decline … since 1948," no numeric table). Do NOT display any of those figures as a quote. (Curio only; not one of the four concepts.)
- **50 mcg "RDA" figures** (in WAL-CLM-LETS-000049 and the absorption verbatims) -> these are the government RDA/RDI Wallach reprints to argue AGAINST; never present as his recommendation.

## Category / width / background (from element-headers.md)

- **Category accent** — chromium is a **mineral → blue** accent (minerals=blue · vitamins=orange · aminos=green · fatty-acids=purple).
- **Width** — must match the element detail screen exactly. Real FIGURE ceiling inside the tan `.kd-ep-fam` box is **817px** (not the ~865–867px outer screen); prefer a shipped slot: **`--fork` = 700px** or **`--rail` = 660px** (exact, no new CSS). Author figures at scale 1 (viewBox width == CSS max-width). Any `kd-ep-fam__*` width/size override needs ID-scoped specificity or the cascade silently shrinks it.
- **Background** — the `.kd-ep-fam` tan box (`--ds-paper-deep`), tinted by the mineral (blue) category accent; the block leads directly into the Best-Youngevity-sources section below, so keep the base surface + accent consistent with that hand-off.

## Still OPEN for Luneth (do NOT pre-decide)

- Which concept, or a mix (dossier §6 recommends **A — The Sugar Loop**, with **B — A Third More Life** as the number-led runner-up — Luneth's call).
- Chassis (legacy fixed skeleton) vs composed `blocks[]` shape.
- Final layout, coordinates, figure geometry, and label placement.
- Final display copy + tone (the ledes/labels above are proposals/materials, not shipped copy).
- Visual sign-off before any live build (headers are demo-only until Luneth approves).
