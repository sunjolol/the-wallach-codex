# Flavonoids — design-prep build sheet
> Source materials for chronicle/header-research/flavonoids.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

**★ Read this first (the headline trap).** The element's single strongest hook — **"vitamin P" / "permeability of the small blood vessels"** — is **CLAIM_TEXT ONLY**. It appears in the verbatim of NO claim in the pack. `WAL-CLM-EPIGEN-000046`'s verbatim is only the deficiency list; `WAL-CLM-RARE-000243`'s verbatim is only `Bioflavonoids - 1936 / capillary hemorrhage, reduced immune function.` Neither contains the string "vitamin P" or "permeability." So "vitamin P" may be used in OUR composed prose (lede) as a fact traced to `EPIGEN-000046` claim_text, but it can **NEVER be shown as a Wallach «quote» on the header.** Only **"1936"** is a verbatim-backed anchor for the naming story (`RARE-000243`). This governs Concepts A and D directly.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "flavonoids")
- **lede** (PROPOSAL): "The plant compounds Wallach ranks as a vitamin — 'vitamin P,' named in 1936 — whose job is to seal the walls of your smallest blood vessels, so a shortage shows first as easy bruising, nosebleeds and capillary bleeding."  [grounded: vitamin P + small-vessel role — `WAL-CLM-EPIGEN-000046` (claim_text, NOT verbatim); 1936 — `WAL-CLM-RARE-000243` (verbatim); bruising / nosebleeds / capillary hemorrhage — `WAL-CLM-EPIGEN-000046` (verbatim). NOTE: "vitamin P" is claim_text-only; fine in our lede prose, never as a quote.]
- **lede** (PROPOSAL, shorter alt): "'Vitamin P' — the antioxidant plant compounds that keep your smallest blood vessels from leaking, and that Wallach reaches for across everything from a common cold to a bleeding ulcer."  [grounded: vitamin P — `WAL-CLM-EPIGEN-000046` claim_text; cold 150 mg — `WAL-CLM-LETS-000225` verbatim; ulcer 1,000 mg q.i.d. — `WAL-CLM-LETS-000458` verbatim.]
- **why** (PROPOSAL): "The daily target is 5,000 mg. It comes straight from Wallach's Epigenetics daily-multiple table, which gives bioflavonoids a range of 1,000-5,000 mg a day; the derive takes the upper end of that range, 5,000 mg. Bioflavonoids are dosed in plain milligrams, so no IU conversion and no body-weight scaling apply — the number is Wallach's own upper figure, unaltered. The per-condition doses in Let's Play Doctor (150 mg for a cold up to 1,000 mg four times a day for a bleeding ulcer) are a separate clinical lever layered on top, not the everyday target."  [source_claim_id `WAL-CLM-EPIGEN-000126`; factors: original_low 1,000 · original_high 5,000 · upper_taken 5,000 · no IU factor · no ×1.54 weight-scale. Range verbatim-backed: «1,000 - 5,000 mg». coverage_kind = dietary_with_clinical_lever — the honest note about the clinical lever belongs in the tip.]

## Per-concept build materials

### Concept A — "Vitamin P: the sealed vessel" (dossier's recommended lead)
- **Exact quotes available** (byte-exact contiguous substrings):
  - `WAL-CLM-RARE-000243` — «Bioflavonoids - 1936»
  - `WAL-CLM-EPIGEN-000046` — «Capillary hemorrhage»
  - `WAL-CLM-EPIGEN-000046` — «Bruising»
  - `WAL-CLM-EPIGEN-000046` — «Nosebleeds»
  - `WAL-CLM-EPIGEN-000046` — «Bioflavonoids deficiency can result in:»
  - `WAL-CLM-EPIGEN-000046` — «Capillary hemorrhage
Reduced immune capacity» (the two lines are contiguous, single `\n` between them)
- **NOT quotable (claim_text only — the hook of this concept):** "vitamin P", "permeability", "small-blood-vessel permeability", "seal / leak". None are in any verbatim. Use them only as OUR heading/gloss prose, never inside guillemets on the page.
- **Numbers** — none required by this concept (it is mechanism + first-visible-sign, not dosed). "1936" is a year, not a dose: value 1936 · (no unit) · verbatim of `WAL-CLM-RARE-000243` («Bioflavonoids - 1936») ✓.
- **Figure label text** (exact, display-ready — each tied to its verbatim source):
  - "1936" — `WAL-CLM-RARE-000243` (verbatim «Bioflavonoids - 1936»)
  - "Capillary hemorrhage" — `WAL-CLM-EPIGEN-000046`
  - "Bruising" — `WAL-CLM-EPIGEN-000046`
  - "Nosebleeds" — `WAL-CLM-EPIGEN-000046`
  - ("vitamin P" as a heading label = OUR gloss from claim_text, mark it as ours, not a quote)
- **Structure notes** — one vessel, one left→right transition (sealed wall → thinning/leaking wall), three sign callouts placed OFF the vessel line (never crossed by it — see element-headers Rule 2 stroke-through trap). Fewest elements: one vessel + one transition + three labels. No dose numbers, no beats row, no big-number stat.

### Concept B — "One compound, a dozen doses" (dossier's runner-up)
- **Exact quotes available** (each dose is a byte-exact contiguous substring of its claim's verbatim):
  - `WAL-CLM-LETS-000225` (common cold) — «bioflavonoids at 150 mg t.i.d.»
  - `WAL-CLM-LETS-000224` (cluster headache) — «bioflavonoids at 150 mg t.i.d.»
  - `WAL-CLM-LETS-000292` (hay fever) — «bioflavonoids at 150 mg q.i.d.»
  - `WAL-CLM-LETS-000280` (food allergy) — «bioflavonoids at 150-300 mg/day»
  - `WAL-CLM-LETS-000246` (diabetes) — «bioflavonoids including quercetin at 150 mg/» (the "day" is on the next line; take the shorter safe substring, or cite the whole «bioflavonoids including quercetin at 150 mg/\nday»)
  - `WAL-CLM-LETS-000364` (migraine) — «bioflavonoids at 200 mg» (verbatim breaks the line before "b.i.d."; full contiguous form is «bioflavonoids at 200 mg\nb.i.d.»)
  - `WAL-CLM-LETS-000299` (herpes simplex) — «bioflavonoids at 200 mg t.i.d.»
  - `WAL-CLM-LETS-000207` (cataracts) — «bioflavonoids at 300 mg»
  - `WAL-CLM-LETS-000460` (varicose veins) — «bioflavonoids at 600 mg t.i.d.»
  - `WAL-CLM-LETS-000176` (bursitis) — «1,200 mg/day» (full: «bioflavonoids\n1,200 mg/day, rutin 50 mg t.i.d.»)
  - `WAL-CLM-LETS-000458` (gastric/peptic ulcer) — «bioflavonoids at 1,000 mg q.i.d.»
- **Numbers** (value · unit · claim id whose VERBATIM contains it · trap note):
  - 150 mg t.i.d. · mg · `WAL-CLM-LETS-000225` (also `-000224`) · verbatim ✓
  - 150 mg q.i.d. · mg · `WAL-CLM-LETS-000292` · verbatim ✓
  - 150-300 mg/day · mg · `WAL-CLM-LETS-000280` · verbatim ✓
  - 150 mg/day (diabetes, quercetin) · mg · `WAL-CLM-LETS-000246` · verbatim ✓ (number on line, "day" wraps)
  - 200 mg b.i.d. · mg · `WAL-CLM-LETS-000364` · verbatim ✓
  - 200 mg t.i.d. · mg · `WAL-CLM-LETS-000299` · verbatim ✓
  - 300 mg · mg · `WAL-CLM-LETS-000207` · verbatim ✓
  - 600 mg t.i.d. · mg · `WAL-CLM-LETS-000460` · verbatim ✓
  - 1,200 mg/day · mg · `WAL-CLM-LETS-000176` · verbatim ✓
  - 1,000 mg q.i.d. · mg · `WAL-CLM-LETS-000458` · verbatim ✓
  - ★ 150-300 mg/day (influenza) · mg · **CLAIM_TEXT ONLY** — `WAL-CLM-LETS-000279`'s verbatim ends at "golden seal (Hydrastis canadensis" and contains NO bioflavonoid dose. Do not display as a quote; omit from the ladder or use the verbatim-backed food-allergy 150-300 mg instead.
  - ★ 150 mg/day + quercetin 100 mg/day (inflammation) · mg · **CLAIM_TEXT ONLY** — `WAL-CLM-LETS-000320`'s verbatim ends at "zinc at 50 mg t.i.d" and contains NO bioflavonoids/quercetin/150/100. Do not display as a quote.
  - ★ 4,000 mg/day (peptic ulcer, dossier's high-end label) · mg · **COMPUTED, NOT verbatim** — the verbatim says «bioflavonoids at 1,000 mg q.i.d.» (1,000 × 4). Display the marker as "1,000 mg q.i.d." (verbatim), NOT "4,000 mg/day."
  - ★ 1,800 mg/day (varicose, dossier §1 high-end) · mg · **COMPUTED, NOT verbatim** — verbatim says «bioflavonoids at 600 mg t.i.d.». Display "600 mg t.i.d.", not "1,800 mg/day."
- **Figure label text** (exact, display-ready — use the verbatim dosing string, never a computed daily total):
  - "cold — 150 mg t.i.d." (`LETS-000225`)
  - "migraine — 200 mg b.i.d." (`LETS-000364`)
  - "cataracts — 300 mg" (`LETS-000207`)
  - "varicose veins — 600 mg t.i.d." (`LETS-000460`)
  - "bursitis — 1,200 mg/day" (`LETS-000176`)
  - "gastric ulcer — 1,000 mg q.i.d." (`LETS-000458`)
  - (condition names above are OUR routing labels; the dose string after the dash is the verbatim-backed part)
- **Structure notes** — one axis line, ~5-6 tick markers (do NOT crowd all 14 conditions). Low rungs (150 mg) group as allergic/viral, high rungs (600-1,000 mg) as vascular/tissue-repair. Each marker label sits BESIDE the axis, never on it (stroke-through trap). If a single-serving-vs-daily-total question comes up, always show the verbatim serving string, not the multiplied total.

### Concept C — "Two faces of a shortage"
- **Exact quotes available** — ALL from `WAL-CLM-EPIGEN-000046` verbatim (this is the ONLY verbatim-safe source for the two lanes; do NOT draw from `RARE-000243`'s claim_text):
  - Vessel lane: «Capillary hemorrhage» · «Hemorrhoids» · «Venous insufficiency» · «Leg ulcers» · «Bruising» · «Nosebleeds»
  - Body/systemic lane: «Reduced immune capacity» · «Widespread free radical injury and inflammation» · «Increased cancer risk»
- **Numbers** — none (this concept is signs, not doses).
- **Figure label text** (exact, display-ready — all verbatim from `EPIGEN-000046`):
  - Vessel lane header (OUR gloss): "In the vessels" — items: "Capillary hemorrhage", "Bruising", "Nosebleeds", "Hemorrhoids", "Venous insufficiency", "Leg ulcers"
  - Body lane header (OUR gloss): "In the body" — items: "Reduced immune capacity", "Widespread free radical injury and inflammation", "Increased cancer risk"
- **Trap for this concept:** the two-bucket FRAMING itself is `RARE-000243` claim_text ("blood-vessel signs" vs "systemic signs"), fine as a structural idea, but every ITEM shown must be a verbatim substring of `EPIGEN-000046`. Do NOT put on the header: "shortened lifespan", "reduced telomere length", "reduced blood pressure", "inhibits clotting/plaque", "improves endothelial function", "lowers cardiovascular risk" — these are in `RARE-000243`/`EPIGEN-000046` claim_text but in NO verbatim (see Trap resolutions).
- **Structure notes** — two lanes / two columns, one paired icon per lane (vessel-drop / body-shield), each heading a short list. Keep each list to 3-4 items so neither reads as a wall (element-headers Rule 8). The split IS the layout; no central figure.

### Concept D — "Vitamin P, 1936"
- **Exact quotes available:**
  - `WAL-CLM-RARE-000243` — «Bioflavonoids - 1936»
  - `WAL-CLM-RARE-000243` — «1936»
  - `WAL-CLM-LETS-000128` — «rutin, catechin, quercetin»
  - `WAL-CLM-LETS-000128` — «bioflavonoids (rutin, catechin, quercetin)»
- **NOT quotable (claim_text only):** "vitamin P", "the P stands for permeability", "family of plant compounds", "16th vitamin". Use as OUR curio prose, never as a quote. The ONLY verbatim anchors this concept has are "1936" and the three named members.
- **Numbers** — 1936 · (year, no unit) · `WAL-CLM-RARE-000243` verbatim «Bioflavonoids - 1936» ✓.
- **Figure label text** (exact, display-ready):
  - "1936" — `WAL-CLM-RARE-000243` (verbatim)
  - "rutin" — `WAL-CLM-LETS-000128` (verbatim substring «rutin, catechin, quercetin»)
  - "catechin" — `WAL-CLM-LETS-000128` (verbatim)
  - "quercetin" — `WAL-CLM-LETS-000128` (verbatim)
  - ("Vitamin P" as the dated headline = OUR gloss from claim_text — mark as ours)
- **Structure notes** — text-forward curio card: a period-styled "1936" as the visual anchor, three named-member chips (rutin · catechin · quercetin) beneath. No diagram, no strokes. Lightest of the four.

## Trap resolutions (claim_text > verbatim — the number/phrase check)
- **"vitamin P" / "permeability"** -> present in NO verbatim; cite as claim_text of `WAL-CLM-EPIGEN-000046` only, use in our prose, NOT as a «quote». (`RARE-000243` verbatim also omits it.)
- **1936** -> cite `WAL-CLM-RARE-000243` (verbatim «Bioflavonoids - 1936») ✓ — the one verbatim-backed anchor of the naming story.
- **influenza 150-300 mg** -> **do not display as a quote**; `WAL-CLM-LETS-000279` verbatim omits it (ends at "golden seal (Hydrastis canadensis"). It is claim_text-only.
- **inflammation bioflavonoids 150 mg / quercetin 100 mg** -> **do not display as a quote**; `WAL-CLM-LETS-000320` verbatim omits both (ends at "zinc at 50 mg t.i.d"). Claim_text-only.
- **peptic ulcer 4,000 mg/day** -> COMPUTED (1,000 × q.i.d.); cite/display `WAL-CLM-LETS-000458` verbatim «bioflavonoids at 1,000 mg q.i.d.», NOT "4,000 mg/day".
- **varicose veins 1,800 mg/day** -> COMPUTED (600 × t.i.d.); cite/display `WAL-CLM-LETS-000460` verbatim «bioflavonoids at 600 mg t.i.d.», NOT "1,800 mg/day".
- **shortened lifespan / reduced telomere length / lowered blood pressure / inhibits clotting & plaque / improves endothelial function / lowers cardiovascular risk** -> all claim_text (`RARE-000243` and/or `EPIGEN-000046` claim_text); in NO verbatim. Keep OFF the visible header. `shortened_lifespan` is in the structured deficiency_signs list (`EPIGEN-000046`) but is NOT in that claim's verbatim — structured-metadata only, not header-quotable.
- **"antioxidant / anti-inflammatory" identity** -> claim_text; the only verbatim support is the deficiency line «Widespread free radical injury and inflammation» (`EPIGEN-000046`). Usable as a lede implication, but there is no standalone mechanistic verbatim.
- **allergies dose** -> `WAL-CLM-LETS-000128` names «rutin, catechin, quercetin» but states NO mg; if used in a dose ladder, show as "named, no dose", never a number.

## Category / width / background (from element-headers.md)
- **Category accent:** flavonoids `category = "vitamin"` in the pack -> **vitamin = orange** accent (memory: category-color-coding).
- **Width:** match the element detail screen exactly; the real FIGURE ceiling inside `.kd-ep-fam` is ~817px (not the 867px outer screen). Prefer a shipped exact slot — `--fork` 700px or `--rail` 660px — over a hand width, to avoid the ID-selector cascade that silently mis-scales labels (Rule 1 + Rule 2).
- **Background:** the tan `.kd-ep-fam` box (`--ds-paper-deep`), tinted by the vitamin/orange category accent. It LEADS INTO the Best-Youngevity-sources block, so the header's bottom edge must hand off cleanly to that block (Rule 0 fixed item #4). Best-Youngevity-sources always sits at the bottom (memory: element-sources-at-bottom).

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier recommends A "the sealed vessel," B "the dose ladder" as runner-up).
- Chassis-vs-composed layout shape.
- Final figure layout + coordinates.
- Final display copy + tone (the ledes/labels above are grounded PROPOSALS, not ratified copy).
- Visual sign-off (mockups in the real container first, per the header workflow).
