# Oxygen — design-prep build sheet
> Source materials for chronicle/header-research/oxygen.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

Single-sourced: all 10 claims from `rare-earths` (Rare Earths: Forbidden Cures, 1994), Chapter 11 (one protocol from Chapter 9). Category: mineral (accent blue). Target: NONE — honest gap (`target.kind: unspecified`); oxygen carries no maintenance dose.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "oxygen")

- **lede** (PROPOSAL): "The element you breathe, not swallow — there is no daily dose to hit, yet Wallach's whole oxygen story runs from the air thinning around us to the cancer cell that dies the moment oxygen reaches it."  [grounded: WAL-CLM-RARE-000196 (atmospheric decline), WAL-CLM-RARE-000198 (Warburg / cancer dies in oxygen); honestly flags the no-target gap up front]
  - Rule-6 note: this lede is concept-agnostic and does NOT restate Concept A's four-minute opening beat, so it stays safe whichever concept is built. If a NON-A concept is chosen, an identity-first alternative also works: "The most critical element of all — the atom built into water and every organic compound in you, and the one thing Wallach says you cannot survive four minutes without."  [grounded: WAL-CLM-RARE-000195]. Do NOT use this second option if Concept A is built (it would restate A's beat).

- **why** (PROPOSAL — honest-gap form, because `target.kind` is non-numeric): "There is no daily number for oxygen, and that is the correct, honest state: you do not dose oxygen in milligrams — you breathe it. Every number in Wallach's oxygen material is either environmental (the atmosphere is ~19% oxygen today, down from 21% in the 1950s) or therapeutic and clinician-administered (the ozone therapeutic window of 20 to 100 u/ml of blood), never a personal daily target."  [source: `target.kind: unspecified`; environmental number from WAL-CLM-RARE-000196, therapeutic number from WAL-CLM-RARE-000203. No transform chain / factors exist because there is no numeric target — do NOT fabricate a per-day figure.]

## Per-concept build materials

### Concept A — The Four-Minute Element (Survival ladder)
- **Exact quotes available**
  - WAL-CLM-RARE-000195 — «We can live for 30 days without food, 3 to 7 days without water»
  - WAL-CLM-RARE-000195 — «but only four minutes without gaseous Oxygen»
  - WAL-CLM-RARE-000195 — «oxygen is the most critical of all elemental factors for the maintenance of human life»
  - WAL-CLM-RARE-000195 (full spine, exact) — «We can live for 30 days without food, 3 to 7 days without water under ideal circumstances, but only four minutes without gaseous Oxygen - oxygen is the most critical of all elemental factors for the maintenance of human life.»
- **Numbers**
  - 30 days (without food) · unit: days · WAL-CLM-RARE-000195 verbatim ✓
  - 3 to 7 days (without water) · unit: days · WAL-CLM-RARE-000195 verbatim ✓
  - four minutes (without oxygen) · unit: minutes · WAL-CLM-RARE-000195 verbatim ✓ — note the verbatim spells it "four minutes" (word), NOT "~4 min"; use the word if quoting.
- **Figure label text** (each grounded in WAL-CLM-RARE-000195 verbatim words)
  - "30 days" / "without food"
  - "3 to 7 days" / "without water"
  - "four minutes" / "without oxygen"
  - emphasis line: "the most critical of all elemental factors"
- **Structure notes** — three ranked markers on one shared scale (food → water → oxygen), the last visually collapsed to a sliver to dramatize the cliff. Three elements, one idea. Labels sit beside each marker, never a stroke routed through a label. Safest-grounded concept: rests on the pack's ONE high-confidence definition claim with no verbatim caveats.

### Concept B — The Thinning Air (Falling oxygen line)
- **Exact quotes available**
  - WAL-CLM-RARE-000196 — «dropped to 21 % and today only 19 %»
  - WAL-CLM-RARE-000196 — «19 % of our gaseous atmosphere is oxygen»
  - WAL-CLM-RARE-000196 (full, exact) — «During the 1950's the percentage of oxygen in our atmosphere dropped to 21 % and today only 19 % of our gaseous atmosphere is oxygen!»
  - Bridge quote (falling oxygen → disease), WAL-CLM-RARE-000197 — «flourish and reproduce with more vigor in the absence of oxygen»
- **Numbers**
  - 21% (atmospheric oxygen, 1950s) · unit: % · WAL-CLM-RARE-000196 verbatim ✓ — note the verbatim renders it "21 %" (space before %).
  - 19% (atmospheric oxygen, today) · unit: % · WAL-CLM-RARE-000196 verbatim ✓ — renders "19 %".
  - 50% (75 million years ago) · **TRAP: claim_text-only, do NOT display as a quote.** Present in WAL-CLM-RARE-000196 claim_text, NOT in its verbatim nor any verbatim in the pack.
  - 38% (dinosaur-extinction level) · **TRAP: claim_text-only, do NOT display as a quote.** Same claim, claim_text only.
  - 75 million years · **TRAP: claim_text-only, do NOT display as a quote.**
- **Figure label text**
  - "21%" / "1950s"  (grounded WAL-CLM-RARE-000196)
  - "19%" / "today"  (grounded WAL-CLM-RARE-000196)
  - optional "so what" bridge caption: "low oxygen lets anaerobic organisms flourish"  (grounded WAL-CLM-RARE-000197 verbatim category)
  - IF the designer wants the dino arc, it may appear ONLY as a clearly-separated "did-you-know" caption and MUST NOT be styled as a Wallach quote: "~50% oxygen 75M years ago → 38% (dinosaur era)". Label these as claim_text framing, not quoted words.
- **Structure notes** — a downward line across the block through time, two verbatim-safe anchor points (21% then 19%), today's figure emphasized. Keep the core line to the two safe points; the dino arc is optional decorative caption only. No stroke crossing a label. Best paired with a one-line bridge to the anaerobic-disease idea (000197).

### Concept C — Dies in the Presence of Oxygen (Aerobic vs anaerobic two-state)
- **Exact quotes available**
  - WAL-CLM-RARE-000198 — «die in the presence of oxygen»  (shortest safe substring, no special chars)
  - WAL-CLM-RARE-000198 — «cancer cell’s ferment sugar under anaerobic conditions and die in the presence of oxygen»  (note: "cell’s" carries a curly apostrophe ’ U+2019 — copied exactly)
  - WAL-CLM-RARE-000198 — «Warburg was able to demonstrate clearly»
  - Support, WAL-CLM-RARE-000197 — «flourish and reproduce with more vigor in the absence of oxygen»
  - Support, WAL-CLM-RARE-000197 — «gangrene organisms, type A Streptococcus»
  - Support, WAL-CLM-RARE-000197 — «viruses, yeast, fungus, cancer»
- **Numbers** — none in this concept's claims.
- **Figure label text**
  - LEFT cell: "normal cell — aerobic"  (grounded WAL-CLM-RARE-000198; "aerobic" is claim_text framing of the normal cell — the verbatim only states the cancer side; if a strict quote is wanted the verbatim covers only the cancer cell, so keep "normal cell — aerobic" as a designer gloss, not a quote)
  - RIGHT cell: "cancer cell — ferments sugar, dies in oxygen"  (grounded WAL-CLM-RARE-000198 verbatim words "ferment sugar" + "die in the presence of oxygen")
  - attribution chip: "Warburg"  (grounded WAL-CLM-RARE-000198 verbatim)
- **Numbers / attribution TRAP** — "two-time Nobel laureate" and "Max Planck Institute" are **claim_text-only** (WAL-CLM-RARE-000198 verbatim names only "Warburg"). Attribute as "Warburg" from the quote; the Nobel / Max Planck detail may be used as designer prose but NOT as a quoted phrase.
- **Structure notes** — two-state contrast: normal aerobic cell vs fermentative cancer cell collapsing as oxygen arrives. One pivot idea, minimal marks, labels beside not through. Attribute Warburg by name for authority. Highest emotional charge; most quotable line in the pack.

### Concept D — The Therapeutic Window (the oxygen Goldilocks band)
- **Exact quotes available**
  - WAL-CLM-RARE-000203 — «the optimal dosage of ozone (20 to 100 u/ml of blood)»  (safe substring, no curly quotes)
  - WAL-CLM-RARE-000203 — «anything less is ineffective - anything more can be damaging to normal cells»
  - WAL-CLM-RARE-000203 (full window line, exact) — «There does appear to be a bell shaped curve or "therapeutic window" for the optimal dosage of ozone (20 to 100 u/ml of blood); anything less is ineffective - anything more can be damaging to normal cells.»  (note: curly quotes " " around "therapeutic window" copied exactly)
  - Heritage support, WAL-CLM-RARE-000202 — «used topically, intravenously and orally since the Civil War»
  - Heritage support, WAL-CLM-RARE-000202 — «widely in Europe for over 50 years»
  - Heritage support, WAL-CLM-RARE-000202 — «circulatory disease, arteriosclerosis, emphysema, asthma, gangrene»
  - Therapy mechanism, WAL-CLM-RARE-000201 — «food grade hydrogen peroxide is readily absorbed through the stomach and duodenal walls directly into the blood stream»
- **Numbers**
  - 20 to 100 (ozone therapeutic window) · unit: **u/ml of blood** (verbatim renders "u/ml", NOT "µg/ml") · WAL-CLM-RARE-000203 verbatim ✓ — **UNIT TRAP: the "µg/ml" in the dossier + claim_text is a conversion; the verbatim unit is "u/ml of blood". Any displayed quote MUST use "20 to 100 u/ml of blood", not µg/ml.**
  - 50 years (Europe, alternative therapy) · unit: years · WAL-CLM-RARE-000202 verbatim ✓ ("over 50 years")
  - 22 (peer-reviewed articles, Viebahn) · **TRAP: claim_text-only, do NOT display as a quote.** In WAL-CLM-RARE-000203 claim_text only; the verbatim omits it.
- **Figure label text**
  - band label: "20 to 100 u/ml of blood"  (grounded WAL-CLM-RARE-000203 verbatim — use "u/ml", not µg/ml)
  - left shoulder: "less = ineffective"  (grounded WAL-CLM-RARE-000203 "anything less is ineffective")
  - right shoulder: "more = damages normal cells"  (grounded WAL-CLM-RARE-000203 "anything more can be damaging to normal cells")
  - optional heritage caption: "oxygen therapy since the Civil War"  (grounded WAL-CLM-RARE-000202)
- **Attribution TRAP** — "Dr. Renate Viebahn", "The Use of Ozone in Medicine", "22 peer-reviewed articles", and "Ed McCabe" / the mineral-deficiency caveat are **claim_text-only** for the window claim (WAL-CLM-RARE-000203 verbatim covers only the bell-curve + range + ineffective/damaging shoulders). The "sleeping beauty" / hyperbaric / "several atmospheres" stroke detail is **claim_text-only** for WAL-CLM-RARE-000202 (its verbatim ends at "long time stroke"). Use these as designer prose if desired, never as quoted Wallach phrases.
- **Structure notes** — one bell curve, highlighted middle band, "too little / too much" shaded shoulders. The band is the whole point. The only concept the corpus can back with a real precise numeric range — valuable precisely because oxygen has no daily target. Optional secondary beat: the Civil-War / hyperbaric heritage as a caption line, NOT a second figure.

## Trap resolutions (claim_text > verbatim)
- 50% (75M years ago) -> **claim_text-only, no verbatim-backed id anywhere; do NOT display as a quote.** Naive source WAL-CLM-RARE-000196 claim_text; its verbatim omits it.
- 38% (dinosaur-era level) -> **claim_text-only; do NOT display as a quote.** WAL-CLM-RARE-000196 claim_text only.
- 75 million years -> **claim_text-only; do NOT display as a quote.** WAL-CLM-RARE-000196 claim_text only.
- Disease roster (HIV, Epstein-Barr, CMV, Herpes II, Hanta, Candida, E. coli toxic shock, flesh-eating Type A Strep) + phrase "oxygen counter revolution" -> **claim_text-only** (WAL-CLM-RARE-000197). The verbatim names only "gangrene organisms, type A Streptococcus" and the category "viruses, yeast, fungus, cancer". Use the verbatim category in any headline text, not the specific disease list. (Note: 000197 is the pack's only MEDIUM-confidence claim.)
- Ozone window unit "µg/ml" -> the verbatim unit is **"u/ml of blood"** (WAL-CLM-RARE-000203). The 20–100 VALUE is verbatim-backed; the µg/ml UNIT is a claim_text/dossier conversion. Cite "20 to 100 u/ml of blood" when quoting, NOT µg/ml.
- "22 peer-reviewed articles" -> **claim_text-only** (WAL-CLM-RARE-000203); verbatim omits it. Do NOT display as a quote.
- "two-time Nobel laureate" / "Max Planck Institute" (Warburg) -> **claim_text-only** (WAL-CLM-RARE-000198); verbatim names only "Warburg". Do NOT display as a quote.
- "become O₂ / O2" (singlet oxygen recombining) -> the verbatim reads **"become an O, - the required stuff of respiration!"** (WAL-CLM-RARE-000200) — an "O," (comma), likely an OCR/print rendering of O₂. Do NOT display "O₂" as a quote; if quoting, use the exact verbatim "become an O, - the required stuff of respiration!".

## Category / width / background (from element-headers.md)
- **Category accent:** mineral = **blue** (oxygen is categorized `mineral`).
- **Width:** match the element detail screen exactly. The `.kd-ep-fam` box `clientWidth` is ~865px with `--ds-space-5` padding a side, so the real FIGURE ceiling is ~817px; prefer the two exact shipped slots — `--fork` = 700px or `--rail` = 660px — which need no new CSS. Author every figure at scale 1 (viewBox width == CSS max-width) and declare the width override at ID specificity (`#drawer-knowledge-mount .kd-ep-fam__figure.<modifier>`) or it silently renders at the 560px base.
- **Background:** the tan `.kd-ep-fam` main content box (`--ds-paper-deep`), tinted by the mineral (blue) accent, because the header leads into the Best-Youngevity-sources block beneath it.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier §6 recommends A — Four-Minute Element; D — Therapeutic Window is the runner-up and the only precise-number option).
- Chassis-vs-composed layout.
- Final layout + coordinates.
- Final display copy / tone (the ledes + why above are PROPOSALS, not final).
- Visual sign-off (the STOP-for-verification gate).
