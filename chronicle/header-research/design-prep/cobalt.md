# Cobalt — design-prep build sheet
> Source materials for chronicle/header-research/cobalt.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

**One thing to read first (the reason this sheet exists):** every headline NUMBER the dossier hangs a figure on is `claim_text`-only and appears in NO verbatim anywhere in the pack — the soil thresholds `0.07 / 0.11 ppm`, the absorption `20–26.2 %`, the gate `pH 2.0`, the excess `20–30 mg`, `1948`, and `30 % cooking loss`. Only the DOSE numbers `3 to 4 mcg` / `250 to 400 mcg` survive as verbatim quotes. This directly constrains Concepts C and D (their signature figures rest on unquotable numbers). Full list in *Trap resolutions* below. Every quote in this sheet was byte-checked as a contiguous substring of its cited verbatim.

**Quote convention:** every guillemet span is a within-a-single-physical-line substring, so it is byte-exact with no embedded newline. Where the natural phrase spans a line break in the source, the safe within-line piece is given and the break is noted — do NOT silently join two of these across the gap or the byte-check fails.

---

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "cobalt")

- **lede** (PROPOSAL): "The single metal atom locked at the center of vitamin B12 — which is why Wallach says the body doesn't need cobalt itself so much as the finished vitamin built around it."
  [grounded: WAL-CLM-IMMORT-000079 (single central atom) · WAL-CLM-IMMORT-000233 (requirement is the cobalt complex, not the metal) · WAL-CLM-DDDL-000044 (the vitamin's red is the cobalt)]

- **why** (PROPOSAL — target.kind is NON-NUMERIC, so this states the honest gap, not a derivation):
  "Cobalt has no daily target of its own. In Wallach's framework it isn't required as a free metal at all — the requirement is for the *cobalt complex*, the finished molecule vitamin B12 — so cobalt simply carries B12's coverage verdict: it is covered exactly when B12 is covered. There is no cobalt-specific range, IU factor, or body-weight scaling to derive. For the B12 amount it points to, Wallach sets the bar well above the conventional allowance of 3 to 4 mcg a day, preferring 250 to 400 mcg for a respectable safety margin, especially when preparing for pregnancy and while nursing."
  [source: `target.kind = "mirrors"`, `mirrors_slug = "vitamin-b12"` (pack) · the 3–4 / 250–400 mcg numbers are verbatim-backed in WAL-CLM-IMMORT-000084 and WAL-CLM-RARE-000014 · NO IU/weight/round factors exist for cobalt — do not invent a chain]

---

## Per-concept build materials

### Concept A — "One atom, the whole vitamin" (The Atom at the Center)
The recommended lead (dossier §6). The whole header is one molecule reveal: red B12 ring, one glowing cobalt atom at center, one label in, one label out.

- **Exact quotes available**
  - WAL-CLM-IMMORT-000079 — «cobalt atom is the central metal component of vitamin B12»  *(full line reads "…and a single\ncobalt atom is the central metal component of vitamin B12," — "a single" sits on the previous physical line, so quote from "cobalt atom" for a clean byte-match, or take the two pieces separately)*
  - WAL-CLM-RARE-000114 — «single cobalt atom is the central metal»  *(corroborating second book; "component of vitamin B12" continues on the next line — see next)*
  - WAL-CLM-RARE-000114 — «component of vitamin B12 which itself is a»
  - WAL-CLM-IMMORT-000233 — «of cobalt is unusual in that the requirement is for a cobalt»  *(the phrase "the requirement is for a cobalt complex" spans a DOUBLE newline "cobalt\n\ncomplex"; the next line is a separate quote)*
  - WAL-CLM-IMMORT-000233 — «complex known as cyanocobalamine or vitamin B12. A pure»
  - WAL-CLM-DDDL-000044 — «Vitamin B12 is a red crystalline substance that is water soluble.»
  - WAL-CLM-DDDL-000044 — «the cobalt in the molecule.»  *(the fuller "the red color is due to the cobalt in the molecule" spans "The red\ncolor"; within-line safe pieces are «Vitamin B12 is a red crystalline substance that is water soluble. The red» and «color is due to the cobalt in the molecule.»)*
- **Numbers** — none. "One atom" and "B12" are words/name, not display numbers. Nothing to trap here.
- **Figure label text** (display-ready short strings, each tied to its source)
  - "one cobalt atom" → the in-pointing label · WAL-CLM-IMMORT-000079 / WAL-CLM-RARE-000114
  - "→ the whole vitamin B12" → the out-pointing label · WAL-CLM-IMMORT-000079 / WAL-CLM-IMMORT-000233
  - "the red is the cobalt" → optional caption on the crystal · WAL-CLM-DDDL-000044
- **Structure notes** — one central ring figure + one centre dot + exactly two labels (one in, one out) + one connective line beneath; no beats, no big-number block. The colour of the crystal carries the DDDL red-is-cobalt fact without a separate element.

### Concept B — "Three metals, three rings" (The Ring Family)
Three-lane comparison: iron in hemoglobin, magnesium in chlorophyll, cobalt in B12 — same tetrapyrrole/porphyrin architecture, cobalt as protagonist ("you are here").

- **Exact quotes available**
  - WAL-CLM-IMMORT-000085 — «B12 cobalt is chelated in a large tetrapyrrole ring»
  - WAL-CLM-IMMORT-000085 — «similar to the porphyrin ring found in hemoglobin (iron) and»
  - WAL-CLM-IMMORT-000085 — «chlorophyll (magnesium).»  *(the whole comparison "the porphyrin ring found in hemoglobin (iron) and chlorophyll (magnesium)" spans the line break "and\nchlorophyll"; use the two within-line pieces above, do not join)*
  - WAL-CLM-DDDL-000044 — «the cobalt in the molecule.»  *(supports cobalt-lane = red)*
- **Numbers** — none. This concept is purely comparative; no numeric traps.
- **Figure label text** (three lanes; label = metal · carrier · colour/role)
  - Lane 1: "iron" / "hemoglobin" / "blood (red)" · WAL-CLM-IMMORT-000085
  - Lane 2: "magnesium" / "chlorophyll" / "leaves (green)" · WAL-CLM-IMMORT-000085
  - Lane 3 (protagonist): "cobalt" / "vitamin B12" / "the red crystal" · WAL-CLM-IMMORT-000085 (ring) + WAL-CLM-DDDL-000044 (red)
  - shared axis label: "the same ring" or "tetrapyrrole / porphyrin ring" · WAL-CLM-IMMORT-000085
- **Structure notes** — three equal parallel panels, one ring glyph each, differently-coloured metal at each centre; cobalt's panel visually emphasised as subject. NOTE the dossier caveat: keep it a three-way FAMILY with cobalt as the subject so it does not read as a rerun of the shipped magnesium/chlorophyll ("cycle of life") header — the other two lanes are context, not co-stars.

### Concept C — "Bush sickness" (How We Found Out)
Discovery-curio / origin card: the veterinary story leading into the soil threshold, then the human echo. Narrative register.

- **Exact quotes available** (the STORY is fully verbatim-backed)
  - WAL-CLM-IMMORT-000082 — «The discovery of the essentiality of cobalt came from»
  - WAL-CLM-IMMORT-000082 — «sheep from Australia and New Zealand. It was observed that»
  - WAL-CLM-IMMORT-000082 — «“bush sickness” could be successfully treated and prevented»  *(curly quotes “ ” are literal in the source — keep them exact)*
  - WAL-CLM-IMMORT-000082 — «by cobalt supplements. Bush sickness was characterized by»
  - WAL-CLM-IMMORT-000082 — «emaciation (unsupplemented vegans), dull stare, listless»
  - WAL-CLM-IMMORT-000082 — «pernicious anemia (macrocytic/hypochromic).»
  - WAL-CLM-EPIGEN-000077 — (secondary corroboration of the Australia/NZ livestock origin) verbatim is only a tiny fragment «parasites (tapeworm), celiac disease, gluten intolerance, and other malabsorption» + «diseases. Pernicious anemia» — it does NOT carry the bush-sickness words; cite IMMORT-000082 for the story, not this claim's verbatim.
- **Numbers** — ★ THE SIGNATURE FIGURE IS UNQUOTABLE. The soil thresholds the concept is built on:
  - `0.07 ppm` (deficient) → **claim_text-only** in WAL-CLM-IMMORT-000084; appears in NO verbatim anywhere. DO NOT display as a quote.
  - `0.11 ppm` (prevents/cures) → **claim_text-only** in WAL-CLM-IMMORT-000084; in NO verbatim. DO NOT display as a quote.
  So a "soil-threshold gauge" reading 0.07→0.11 ppm cannot be sourced to Wallach's own words in the pack. Options for Luneth (all open): (a) drop the number figure and run the bush-sickness story on the verbatim-backed signs alone; (b) present 0.07/0.11 as our editorial paraphrase clearly NOT in quote styling; (c) get the number re-mined into a verbatim before use. Not a decision to make here — just flagged loudly.
- **Figure label text**
  - narrative beat words (from verbatim): "bush sickness", "Australia and New Zealand", "cattle and sheep", "cured by cobalt" · WAL-CLM-IMMORT-000082
  - deficiency-sign words (from verbatim): "emaciation", "dull stare", "listless and starved look", "anorexia", "pernicious anemia" · WAL-CLM-IMMORT-000082
  - IF a soil gauge is used, its numeric ticks "0.07 ppm" / "0.11 ppm" are NOT quote-backed — see Numbers above.
- **Structure notes** — a short narrative beat → one small figure → a human echo (dossier's shape). The story elements are safe; the number figure is the exposed part. Keep any strokes/ticks off the labels (dossier + element-headers.md rule).

### Concept D — "The lock" (The Absorption Gate)
Mechanism-as-header: two required conditions to admit cobalt, with the failure branch (hypochlorhydria → B12 shots) as the consequence. Reframes deficiency as plumbing, not diet.

- **Exact quotes available** (only the FAILURE branch is verbatim-backed)
  - WAL-CLM-IMMORT-000081 — «the intrinsic factor will not work and B12 cobalt is»
  - WAL-CLM-IMMORT-000081 — «not absorbed - this is why doctors frequently give B12 shots»  *(hyphen "- " is literal, single ASCII hyphen with spaces as in source)*
  - WAL-CLM-IMMORT-000081 — «very bioavailable; however, because of low salt diets and cobalt»
  - WAL-CLM-IMMORT-000081 — «depleted soils, vegetarians frequently have B12 deficiencies.»
- **Numbers** — ★ THE GATE CONDITIONS ARE UNQUOTABLE. Everything on the "admit" side of the gate is `claim_text`-only:
  - `pH 2.0` (the acid threshold) → **claim_text-only** in WAL-CLM-IMMORT-000081; in NO verbatim. DO NOT display as a quote.
  - `20–26.2 %` (metallic-cobalt absorption fraction) → **claim_text-only** in WAL-CLM-IMMORT-000081; in NO verbatim. DO NOT display as a quote.
  - "Castle's factor" (name for intrinsic factor) → **claim_text-only**; NO verbatim. The generic words "intrinsic factor" ARE in verbatim (IMMORT-000081, IMMORT-000083), but only in the FAILURE phrasing ("the intrinsic factor will not work"), never as a stated "present + pH 2.0" admit-condition.
  So the gate's two locks (`acid pH ≤ 2.0`, quantified `20–26.2 %` throughput) have no Wallach verbatim behind them. What IS quotable: intrinsic factor failing → not absorbed → B12 shots; low salt / depleted soils → vegetarians deficient. The concept can be built entirely on the FAILURE side; the quantified admit-gate cannot be quoted. Flagged, not decided.
- **Figure label text**
  - fail-state words (verbatim-backed): "intrinsic factor fails", "not absorbed", "→ B12 shots", "low salt", "depleted soils", "vegetarians deficient" · WAL-CLM-IMMORT-000081
  - gate-condition labels "acid pH ≤ 2.0" and "20–26.2%" — NOT quote-backed (see Numbers). If shown, they are our paraphrase of claim_text, not Wallach's words.
- **Structure notes** — a gate/checkpoint with a fail branch; few elements, no stroke routed through any label (element-headers.md #1 rejection cause). Given the number trap, the mechanistically safest build leans on the failure narrative (hypochlorhydria → shots) rather than the quantified two-lock admit-gate.

---

## Trap resolutions (claim_text > verbatim) — every number where the naive source is NOT verbatim-backed
Verified by scanning all 13 verbatims (none of these tokens is present in any verbatim):

- **0.07 ppm** (soil deficient) -> **claim_text-only in WAL-CLM-IMMORT-000084; NO verbatim anywhere.** Do not display as a quote. (Concept C figure.)
- **0.11 ppm** (soil prevents/cures) -> **claim_text-only in WAL-CLM-IMMORT-000084; NO verbatim.** Do not display as a quote. (Concept C figure.)
- **20–26.2 %** (absorption fraction) -> **claim_text-only in WAL-CLM-IMMORT-000081; NO verbatim.** Do not display as a quote. (Concept D gate.)
- **pH 2.0** (acid threshold) -> **claim_text-only in WAL-CLM-IMMORT-000081; NO verbatim.** Do not display as a quote. (Concept D gate.)
- **20–30 mg/day** (cobalt excess → erythropoiesis) -> **claim_text-only in WAL-CLM-IMMORT-000084 and WAL-CLM-EPIGEN-000077; NO verbatim.** Do not display as a quote. (Dossier §1/§4 context only.)
- **1948** (B12 isolated from liver extract) -> **claim_text-only in WAL-CLM-RARE-000115 / WAL-CLM-IMMORT-000085; NO verbatim.** Do not display as a quote.
- **30 %** (activity lost in cooking) -> **claim_text-only in WAL-CLM-IMMORT-000085; NO verbatim.** Do not display as a quote.
- **"Castle's factor"** (name for intrinsic factor) -> **claim_text-only in WAL-CLM-IMMORT-000081; NO verbatim.** Generic "intrinsic factor" IS verbatim-backed (IMMORT-000081, IMMORT-000083) — but the proper-noun "Castle's factor" is not.

**Numbers that ARE verbatim-backed and safe to quote:**
- **3 to 4 mcg** (RDA) -> WAL-CLM-IMMORT-000084 verbatim «The human RDA for B12/cobalt is 3 to 4 mcg per day».
- **250 to 400 mcg** (Wallach's preferred) -> WAL-CLM-IMMORT-000084 verbatim «however 250 to 400 mcg gives a respectable safety margin.» AND WAL-CLM-RARE-000014 verbatim «250 to 400 mcg per day».

**Also note (source-quality flags, not number traps):**
- WAL-CLM-RARE-000115 verbatim carries an OCR garble: …«are classic for B, /cobalt deficiency.» — the "B, /cobalt" is a scanning artifact for "B12/cobalt". A cleaner verbatim for the same demyelination/pernicious-anemia fact is in WAL-CLM-IMMORT-000083. Prefer IMMORT-000083 for any displayed quote of this fact.
- WAL-CLM-EPIGEN-000077 verbatim is a tiny fragment while its claim_text is a large multi-number summary — this is the [[claim-text-numbers-unguarded]] pattern; never pull any number by this claim's verbatim.

---

## Category / width / background (from element-headers.md)
- **Category accent:** cobalt is a **mineral → BLUE** accent (`data-category` on `.kd-ep`). Note the content irony worth flagging to Luneth: cobalt's story is "the red crystal" (B12's colour), but its *category chrome* stays mineral-blue — the red lives inside the figure, not in the frame.
- **Width:** the header renders inside the tan `.kd-ep-fam` box; the `.kd-ep` detail screen is ~865px but the real FIGURE ceiling inside the padded box is **817px**. Prefer the two exact shipped figure slots that need no new CSS: `--fork` = **700px** or `--rail` = **660px**. Author any figure at scale 1 (viewBox width == CSS max-width) and write the width override at matching ID specificity (`#drawer-knowledge-mount .kd-ep-fam__figure.<modifier>`) or it silently renders at the 560px base.
- **Background:** the tan `--ds-paper-deep` main content box, tinted by the mineral (blue) category accent, leads directly into the **Best Youngevity sources** block — so the header's bottom edge must hand off cleanly to that block (do not close on a full-bleed dark panel).

---

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier recommends A, with B as a possible second act).
- Chassis-vs-composed layout (`MechanismSchema` legacy vs the composed `blocks[]` shape).
- Final figure layout, coordinates, and CSS.
- Final display copy and tone (the lede/why above are PROPOSALS to ratify, not final).
- **How to handle Concepts C and D given their unquotable signature numbers** — drop the number figure, paraphrase-not-quote, or re-mine a verbatim. His call.
- Visual sign-off before anything ships (STOP-for-verification gate).
