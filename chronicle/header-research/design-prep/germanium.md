# Germanium — design-prep build sheet
> Source materials for chronicle/header-research/germanium.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

Every «quote» below is a byte-exact **single-line** substring of the cited claim's `verbatim` (newline-crossing phrases were deliberately avoided so a downstream byte-check is unambiguous). Curly-quote / gamma / em-dash traps are called out where they occur.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "germanium")
- **lede** (PROPOSAL): "The semiconductor metal Wallach casts as an electron-shuttle inside your cells — a cofactor whose job is driving oxygen into your tissues."  [grounded: `WAL-CLM-IMMORT-000138` (semiconductor status), `WAL-CLM-IMMORT-000141` (accepts/transmits electrons; metallic cofactor for oxygen utilization), `WAL-CLM-LETS-000183` (oxygen flow into cells)]
  - Note: keep the lede to verbatim-backed facts. The "early transistors / crystal-radio / micro-computers" framing (the strongest hook for Concept A) lives ONLY in the claim_text of `IMMORT-000138`/`IMMORT-000141` — it is Wallach's own editorial gloss, NOT in either verbatim. Usable as our narrative gloss, but never as a quoted fact. If Luneth wants it in the lede, it stays a paraphrase, never in quotation marks.
- **why** (PROPOSAL): "Wallach's maintenance dose for germanium is 20–30 mg a day; the card shows the upper end, 30 mg. No conversion is involved — it is a plain milligram range and we take the top of it. Immortality states the identical 20–30 mg maintenance range, so two books agree. The higher 50–100 mg/day figure is reserved for serious illness that needs more oxygen driven into the tissues, not daily maintenance, so it stays off the card."  [source_claim_id `WAL-CLM-DDDL-000011`; provenance: original_low 20, original_high 30, unit mg, upper_taken 30 — no IU factor, no ×1.54 weight-scale, no rounding step. Corroborating maintenance range: `WAL-CLM-IMMORT-000140`. Serious-illness dose (correctly excluded): `WAL-CLM-RARE-000012`.]
  - target.kind = `wallach` (numeric). This is a clean plain-mg target — the honest-gap path does NOT apply.

## Per-concept build materials

### Concept A — "The transistor in your cells" (the semiconductor identity carried into the body)
- **Exact quotes available**
  - `WAL-CLM-IMMORT-000138` — «Germanium is a poor conductor of electricity»
  - `WAL-CLM-IMMORT-000138` — «relegated to a semi-conductor status»
  - `WAL-CLM-IMMORT-000138` — «it was not until 1886 that Clemens»
  - `WAL-CLM-IMMORT-000138` — «Winkler, a German scientist, isolated the silicon-like element»
  - `WAL-CLM-IMMORT-000141` — «The germanium atom is structured so it accepts and»
  - `WAL-CLM-IMMORT-000141` — «transmits electrons effectively acting as a semiconductor. It is»
  - `WAL-CLM-IMMORT-000141` — «effectively acting as a semiconductor»
  - `WAL-CLM-IMMORT-000141` — «electrical impulse initiator intracellularly and acts as a metallic»
  - `WAL-CLM-IMMORT-000141` — «cofactor for oxygen utilization»
  - `WAL-CLM-LETS-000183` — «the oxygen flow into cells from the»
- **Numbers**
  - 1871 (Mendeleyev's periodic table prediction) · year · `WAL-CLM-IMMORT-000138` verbatim ("predicted by Mendeleyev in his periodic\ntable in 1871").
  - 1886 (Winkler isolates germanium) · year · `WAL-CLM-IMMORT-000138` verbatim.
- **Figure label text** (each tied to a verbatim-backed source)
  - "SEMICONDUCTOR" — `WAL-CLM-IMMORT-000138` («relegated to a semi-conductor status»).
  - "accepts and transmits electrons" — `WAL-CLM-IMMORT-000141` (this exact phrasing spans a newline in the verbatim: "accepts and\ntransmits electrons"; safe single-line pieces are «accepts and» + «transmits electrons effectively acting as a semiconductor»).
  - "electrical impulse initiator" — `WAL-CLM-IMMORT-000141` («electrical impulse initiator intracellularly and acts as a metallic»).
  - "cofactor for oxygen utilization" — `WAL-CLM-IMMORT-000141`.
  - "Winkler, 1886" — `WAL-CLM-IMMORT-000138`.
- **Structure notes** — a mirrored diptych: one glyph labelled *in the radio*, one labelled *in the cell*, sharing ONE physics caption ("accepts and transmits electrons"). One moving electron/spark rides the empty gutter between the two objects; captions sit above/below, never on the stroke. Two objects, one moving mark — no station clutter.
- **★ TRAP (Concept A leans on this — read before designing):** the "early transistors," "doping with arsenic/gallium/antimony," "micro-computers," and "1940s–50s diode-crystal radio kits" facts that make this concept vivid are **claim_text-only** — they appear in the claim_text of `IMMORT-000138` and `IMMORT-000141` but in NEITHER verbatim. They can shape our narrative gloss but can NEVER be shown as a quotation, and no figure label may present them as a sourced Wallach line. The only verbatim-backed electronics facts are: "semiconductor status," "poor conductor of electricity," "accepts and transmits electrons," and the Winkler-1886 / Mendeleyev-1871 history.

### Concept B — "A trace in food, a hoard in the herbs" (the concentration ladder)
- **Exact quotes available**
  - `WAL-CLM-IMMORT-000145` — «beans - 4.67 ppm, tuna - 2.3 ppm»
  - `WAL-CLM-IMMORT-000145` — «germanium in amounts ranging from 100 to 2,000 ppm»
  - `WAL-CLM-IMMORT-000145` — «garlic, aloe, comfrey, chlorella, ginseng,»
  - `WAL-CLM-IMMORT-000145` — «watercress, Shiitake mushroom, pearl barley, sanzukon,»
  - `WAL-CLM-RARE-000013` — «sanzukon, sushi, waternut, boxthorn»
  - `WAL-CLM-RARE-000013` — «in amounts ranging from 100 to 2,000 ppm»
  - `WAL-CLM-DDDL-000114` — «4.67 ppm, tuna—2.3 ppm» (NOTE: `DDDL-000114` uses an em-dash "tuna—2.3"; `IMMORT-000145` uses a spaced hyphen "tuna - 2.3". Prefer the `IMMORT-000145` version for a clean quote; if quoting `DDDL-000114`, the em-dash U+2014 must be copied exactly.)
- **Numbers**
  - beans 4.67 · ppm · `WAL-CLM-IMMORT-000145` verbatim (also in `WAL-CLM-DDDL-000114` verbatim).
  - tuna 2.3 · ppm · `WAL-CLM-IMMORT-000145` verbatim (also in `WAL-CLM-DDDL-000114` verbatim).
  - healing herbs 100 to 2,000 · ppm · `WAL-CLM-IMMORT-000145` verbatim (also `WAL-CLM-RARE-000013` verbatim). **Do NOT source the 100–2,000 ppm figure to `WAL-CLM-DDDL-000114`** — its claim_text names "100 to 2,000 ppm" but its verbatim carries only the beans/tuna trace.
- **Figure label text**
  - "tuna — 2.3 ppm" — `WAL-CLM-IMMORT-000145`.
  - "beans — 4.67 ppm" — `WAL-CLM-IMMORT-000145`.
  - "healing herbs — 100–2,000 ppm" — `WAL-CLM-IMMORT-000145` / `WAL-CLM-RARE-000013`.
  - herb names for the high band (all verbatim-backed in `IMMORT-000145`): "garlic," "ginseng," "shiitake" (verbatim spelling "Shiitake"), "chlorella," "comfrey," "aloe," "watercress."
- **Structure notes** — one vertical ppm axis: beans + tuna as two low ticks near the floor, one tall "healing herbs" band far above, the empty gap between them carrying the ~40×–870× fold story. One axis, ~4 marks, nothing routed through a label.

### Concept C — "The oxygen key" (the unifying mechanism, shown once)
- **Exact quotes available**
  - `WAL-CLM-IMMORT-000141` — «cofactor for oxygen utilization»
  - `WAL-CLM-IMMORT-000141` — «electrical impulse initiator intracellularly and acts as a metallic»
  - `WAL-CLM-LETS-000183` — «the oxygen flow into cells from the»
  - `WAL-CLM-LETS-000183` — «cancer cells do not like high levels of» (the word "oxygen" follows on the NEXT line — "high levels of\noxygen)" — so a byte-exact single-line quote stops at "of"; to include "oxygen" the quote must cross the newline.)
  - `WAL-CLM-LETS-000201` — «it helps get oxygen into the cells»
  - `WAL-CLM-LETS-000201` — «remember C. albicans doesn't like oxygen» (straight apostrophe in "doesn't")
  - `WAL-CLM-RARE-000011` — «osteoporosis, low energy and cancer»
- **Numbers** — none. The oxygen mechanism is qualitative in every verbatim; there is NO numeric dose-response, antioxidant, or enzyme figure anywhere in the pack. Keep any figure conceptual — do not fabricate a curve.
- **Figure label text**
  - "cofactor for oxygen utilization" — `WAL-CLM-IMMORT-000141`.
  - "oxygen into the cell" — `WAL-CLM-LETS-000183` («the oxygen flow into cells from the») / `WAL-CLM-LETS-000201` («it helps get oxygen into the cells»).
  - "cancer cells dislike high oxygen" — paraphrase of `WAL-CLM-LETS-000183` (verbatim's exact phrase "cancer cells do not like high levels of\noxygen" crosses a newline; use as paraphrase for a label, or quote the single line «cancer cells do not like high levels of»).
  - "C. albicans dislikes oxygen" — `WAL-CLM-LETS-000201` («remember C. albicans doesn't like oxygen»).
- **Structure notes** — one cause→consequence panel: germanium → oxygen arriving from the bloodstream side of ONE cell → a low-oxygen-loving invader loses its foothold. Single inflow arrow that stops short of any word; one quiet annotation. Keep the semiconductor/electron origin visible in the caption so the motif stays germanium-specific (per dossier §2C risk note).

### Concept D — "The healing-waters curio" (a did-you-know discovery vignette)
- **Exact quotes available**
  - `WAL-CLM-IMMORT-000146` — «at Lourdes, France, known world» (NOTE: the verbatim opens `The "Holy Waters"` with curly quotes U+201C/U+201D and splits "world\nwide"; this substring avoids both. To quote "Holy Waters," copy the curly quote chars exactly.)
  - `WAL-CLM-IMMORT-000146` — «contains large amounts of»
  - `WAL-CLM-IMMORT-000146` — «germanium and lithium»
  - `WAL-CLM-IMMORT-000142` — «In 1950, Dr. Kazuhiko Asai, a Japanese chemist, found»
  - `WAL-CLM-IMMORT-000142` — «traces of germanium in fossilized plantlife. Russian researchers»
  - `WAL-CLM-IMMORT-000142` — «quickly attributed anti-cancer activity to germanium»
  - `WAL-CLM-IMMORT-000143` — «Dr. Asai was able to connect the healing properties of»
  - `WAL-CLM-IMMORT-000143` — «these herbs are germanium accumulator plants»
- **Numbers**
  - 1950 (Asai finds germanium in fossilized plant life) · year · `WAL-CLM-IMMORT-000142` verbatim.
- **Figure label text**
  - "Lourdes, France" — `WAL-CLM-IMMORT-000146`.
  - "germanium and lithium" — `WAL-CLM-IMMORT-000146`.
  - "Asai, 1950" — `WAL-CLM-IMMORT-000142`.
  - "germanium accumulator plants" — `WAL-CLM-IMMORT-000143`.
- **Structure notes** — a curio card: one minimal spring / water-drop motif annotated "germanium + lithium," or a lone herb sprig with a one-line caption. One object, one caption, no diagram. Dossier §2D flags this as a weak *lead* but strong as a secondary curio beat inside another concept.

### Supporting beat available for any concept — Ge-132 (the supplement curio)
- **Exact quotes available**
  - `WAL-CLM-IMMORT-000144` — «Asai synthesized Ge-132, carboxyethyl germanium»
  - `WAL-CLM-IMMORT-000144` — «in 1967 by a hydrolysis reaction»
  - `WAL-CLM-IMMORT-000144` — «negative oxygen ions at the base of a cubic triangle»
  - `WAL-CLM-IMMORT-000144` — «at the rate of 30% efficiency and the total intake is completely»
  - `WAL-CLM-IMMORT-000144` — «excreted in one week»
- **Numbers** — 1967 (synthesis) · year · `IMMORT-000144` verbatim. 30% (absorption efficiency) · percent · `IMMORT-000144` verbatim. one week (excretion) · duration · `IMMORT-000144` verbatim. All three verbatim-backed.
- Dossier §5 note: too thin for its own bespoke figure; best as a supporting beat, not a concept.

## Trap resolutions (claim_text > verbatim)
Every number/fact whose naive claim_text source is NOT verbatim-backed, with the correct citation:
- **germanium dose 20–30 mg (and 50–100 mg)** → cite `WAL-CLM-DDDL-000011` or `WAL-CLM-IMMORT-000140` (both verbatim-backed), **NOT `WAL-CLM-EPIGEN-000086`** (claim_text names "20 to 30 mg" and "50 to 100 mg"; its verbatim carries only the deficiency signs) and **NOT `WAL-CLM-RARE-000011`** (claim_text names "20 to 30 mg a day"; its verbatim carries only the deficiency signs).
- **healing herbs 100–2,000 ppm** → cite `WAL-CLM-IMMORT-000145` or `WAL-CLM-RARE-000013` (verbatim-backed), **NOT `WAL-CLM-DDDL-000114`** (claim_text names "100 to 2,000 ppm" + garlic/ginseng/shiitake; its verbatim carries only "beans—4.67 ppm, tuna—2.3 ppm"). The beans 4.67 / tuna 2.3 figures ARE verbatim-backed in `DDDL-000114`, so those alone may cite it.
- **immune roster (NK cells / interferon / macrophages / T-suppressor cells)** → cite `WAL-CLM-IMMORT-000143` and/or `WAL-CLM-LETS-000183` (verbatim-backed), **NOT `WAL-CLM-DDDL-000114`** (its claim_text lists them; verbatim does not).
- **transistors / doping (arsenic, gallium, antimony) / "micro-computers" / 1940s–50s diode-crystal radio kits** → these are **claim_text-only in `WAL-CLM-IMMORT-000138` and `WAL-CLM-IMMORT-000141`; verbatim-backed in NEITHER.** Do not display as a quote and do not label a figure with them as sourced Wallach text. Verbatim supports only "semiconductor status," "poor conductor of electricity," "accepts and transmits electrons," and the 1871/1886 history. (This is the biggest trap on the sheet because it undercuts Concept A's headline hook — flagged for Luneth.)

## Category / width / background (from element-headers.md)
- **Category accent:** mineral → **blue** (symbol Ge).
- **Width:** must match the element detail screen exactly. Figure ceiling inside the tan `.kd-ep-fam` box is ~817px (the 865px `clientWidth` minus 24px padding a side); prefer the two shipped exact figure slots — `--fork` = 700px or `--rail` = 660px — which need no new CSS. Author every figure at scale 1 (viewBox width == CSS max-width) and declare the width override at ID specificity (`#drawer-knowledge-mount .kd-ep-fam__figure.<modifier>`) or the base 560px rule silently shrinks every label.
- **Background:** the tan `.kd-ep-fam` main content box (`--ds-paper-deep`), tinted by the mineral (blue) category accent — because the header leads directly into the Best Youngevity sources block.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (e.g. A's semiconductor hook + C's oxygen payoff; D as a secondary curio beat).
- Chassis (legacy) vs composed `blocks[]` shape.
- Final layout, coordinates, figure geometry, and figure count.
- Final display copy / tone (everything above is source material, not final header copy).
- Whether the transistor framing is worth carrying as a paraphrase given it is claim_text-only.
- Visual sign-off before any live build.
