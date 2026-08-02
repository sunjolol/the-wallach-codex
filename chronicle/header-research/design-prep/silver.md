# Silver — design-prep build sheet
> Source materials for chronicle/header-research/silver.md. Byte-verified from sealed claims (all 28 quotes below confirmed as byte-exact contiguous substrings of their cited verbatim; all trap tokens confirmed absent). NOT a design — concept choice + layout stay open for Luneth.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "silver")
- **lede** (PROPOSAL): "An essential mineral that no enzyme needs — Wallach counts silver essential not as a cofactor but as the body's systemic disinfectant, a germ-killer that disables the very enzymes microbes breathe with and reads a shortage as more colds and flu."  [grounded: WAL-CLM-EPIGEN-000064 (not required by any biological system / systemic disinfectant / colds & flu); WAL-CLM-IMMORT-000027 (essential as disinfectant + immune stimulator); WAL-CLM-DDDL-000014 (disables the respiration enzymes)]
- **why** (PROPOSAL): "Wallach names a single safe daily figure — 400 mcg — and the app uses it as written. There is no range to take the top of and no conversion to apply: the number is his, verbatim, carried through unchanged. It is in micrograms because silver works at trace levels."  [source_claim_id = WAL-CLM-DDDL-000013; target.kind = `wallach`; low = 400.0 mcg; provenance original_low 400 / upper_taken 400, no high, no IU factor, no body-weight scale — a flat directly-stated figure, NOT a transform chain. Honest note: unlike calcium/selenium there is no numeric chain to showcase; do not manufacture one.]

## Per-concept build materials

### Concept A — The Outsider Mineral ("The essential no enzyme needs")
- **Exact quotes available**
  - WAL-CLM-IMMORT-000027 — «Humans can consume 400 mcg of silver per day.»
  - WAL-CLM-DDDL-000014 — «Silver is an anti-bacterial, anti-viral, anti-fungal, anti-metabolite»
  - WAL-CLM-DDDL-000014 — «disables specific enzymes that microorganisms use for respiration»
  - WAL-CLM-EPIGEN-000064 — «rate of illness (such as flu, colds, etc.)»
  - (paradox / "not required by any known biological system" + "systemic disinfectant and immune-system stimulator" live in the CLAIM_TEXT of WAL-CLM-EPIGEN-000064 and WAL-CLM-IMMORT-000027, NOT their verbatim — see Trap resolutions. Do not display those exact phrases as a Wallach quote; they are safe to paraphrase in our own composed prose.)
- **Numbers** — 400 · mcg · verbatim-backed in WAL-CLM-IMMORT-000027, WAL-CLM-DDDL-000013 («400 mcg of silver per day»), WAL-CLM-RARE-000090 («Humans can consume 400 mcg of silver»). For the daily-target number cite WAL-CLM-DDDL-000013 (the target's own source_claim_id).
- **Figure label text** (proposed short display strings, grounded — final copy is Luneth's)
  - Element glyph: `Ag` [symbol, pack field]
  - Group-side label idea: "every other mineral: built into an enzyme" [our framing of the cofactor contrast — NOT a verbatim quote; grounded conceptually against WAL-CLM-EPIGEN-000064 / WAL-CLM-IMMORT-000027 claim_text]
  - Silver-side label idea: "silver: earns it by killing germs" [our framing; grounded WAL-CLM-DDDL-000014]
  - Optional pivot micro-line: "no biological system requires it" [claim_text-only fact, EPIGEN-000064 / IMMORT-000027 — paraphrase, do not quote]
- **Structure notes** — the Ag glyph stands APART from a small cluster of generic "cofactor" marks; two groups, one figure, nothing routed through the labels — apartness carries the idea. A single pivot line resolves the paradox. No number-crunching, no metabolic diagram.

### Concept B — The Anti-Metabolite ("It suffocates germs")
- **Exact quotes available**
  - WAL-CLM-DDDL-000014 — «Silver is an anti-bacterial, anti-viral, anti-fungal, anti-metabolite»
  - WAL-CLM-DDDL-000014 — «disables specific enzymes that microorganisms use for respiration»
  - WAL-CLM-IMMORT-000028 — «Silver is an anti-bacterial, anti-viral, anti-fungal, anti-metabolite that disables specific enzymes that microorganisms» (single-line, byte-exact; the word "use for respiration." follows on the next line if the full phrase is wanted — reproduce the newline)
  - WAL-CLM-RARE-000091 — «silver kills over 650 disease» (the phrase continues "causing organisms" on the very next line; to quote the full "silver kills over 650 disease causing organisms" you must reproduce the line break between "disease" and "causing")
  - WAL-CLM-RARE-000091 — «resistant strains fail to» (continues "develop" next line)
  - WAL-CLM-RARE-000091 — «silver is absolutely non-toxic to» (continues "humans at standard rates of consumption" over two more lines)
  - WAL-CLM-IMMORT-000030 — «Silver is absolutely non-toxic to humans at standard rates of consumption.» (the SAME non-toxicity fact on ONE clean line — prefer this claim if you want the sentence without newlines)
- **Numbers**
  - 650 · organisms ("over 650 disease causing organisms") · verbatim-backed in WAL-CLM-RARE-000091. Displayable as a quote. ✔
  - "1978 / Science Digest" — the attribution source is CLAIM_TEXT-ONLY (WAL-CLM-RARE-000091 claim_text); it is NOT in that claim's verbatim or any verbatim. FLAG: do not display "Science Digest (1978)" as a quote; if the year/source is wanted it must be presented as our editorial note, not Wallach's words.
- **Figure label text** (proposed, grounded)
  - Enzyme "off" mark caption: "respiration enzyme — disabled" [grounded WAL-CLM-DDDL-000014 «disables specific enzymes that microorganisms use for respiration»]
  - Hard stat callout: "650+ organisms" [grounded WAL-CLM-RARE-000091 «silver kills over 650 disease»(+"causing organisms")]
  - Resistance line: "resistant strains fail to develop" [byte-exact in WAL-CLM-RARE-000091 only if the line break between "to" and "develop" is reproduced (clean single-line pieces: «resistant strains fail to» + "develop"); or paraphrase "no resistance develops"]
- **Structure notes** — ONE microbe with its respiration machinery visibly switched off (a single "off" mark on the breathing enzyme) + one number + one short line on why resistance never develops. Fewest possible elements; NOT a many-station metabolic diagram (that layout was rejected before).

### Concept C — The Oldest Antimicrobial ("8,000 years in the medicine cabinet")
- **Exact quotes available**
  - WAL-CLM-IMMORT-000028 — «our great-grandmothers put silver dollars into fresh milk to» (the milk-dollar; continues "keep bacterial counts down and to keep it from spoiling at room temperature" over the next lines)
  - WAL-CLM-IMMORT-000028 — «Silver is such an efficient bactericide that» (lead-in to the milk-dollar)
  - WAL-CLM-RARE-000092 — «is used in 70 percent of the» (continues "burn centers in America" on the next line; to quote the full "70 percent of the burn centers in America" reproduce the line break between "the" and "burn")
  - WAL-CLM-RARE-000092 — «burn centers in America; discovered by Dr.»
  - WAL-CLM-RARE-000092 — «Charles Fox, Columbia University,»
  - WAL-CLM-RARE-000092 — «treat syphilis, cholera and malaria»
- **Numbers**
  - 70 · percent (of America's burn centers) · verbatim-backed WAL-CLM-RARE-000092 («is used in 70 percent of the»). Displayable. ✔
  - "8,000 years / Chinese alchemists" — CLAIM_TEXT-ONLY (WAL-CLM-RARE-000090 claim_text). CONFIRMED ABSENT from every verbatim in the pack. FLAG: this is the concept's headline fact and it CANNOT be shown as a Wallach quote. Use only as our own editorial framing, or reconsider leaning the concept on it.
  - "1917–1918 / British Medical Journal / Lancet" — CLAIM_TEXT-ONLY (WAL-CLM-RARE-000092 claim_text). CONFIRMED ABSENT from every verbatim. FLAG: the colloidal-silver-in-the-journals waypoint has NO verbatim backing; present as editorial note only, not a quote.
  - "herpes virus / cold sores / fever blisters" — CLAIM_TEXT-ONLY (WAL-CLM-RARE-000092 claim_text). Absent from verbatim. Not a quote.
- **Figure label text** (proposed waypoint captions, grounded — mind the flags above)
  - Waypoint (ancient): "used since antiquity" [SAFE our framing; the specific "8,000 years / Chinese alchemists" is claim_text-only — do NOT print it as Wallach's words]
  - Waypoint (folk use): "silver dollars in the milk" [grounded WAL-CLM-IMMORT-000028, verbatim ✔]
  - Waypoint (early clinical): "documented in medical journals" [our framing; the exact "1917–1918 / BMJ / Lancet" is claim_text-only — do not quote]
  - Waypoint (today): "70% of U.S. burn centers" [grounded WAL-CLM-RARE-000092, verbatim ✔]
- **Structure notes** — a history lane / timeline (L→R or top→bottom), sparse dated waypoints, closing on the present-day burn-centre fact. Keep captions OFF the connecting line (route the spine around the labels — a stroke through a label is the #1 rejection cause). NOTE: two of the four natural waypoints (antiquity, early journals) are claim_text-only — if kept, they read as our editorial context, not quotes; the two verbatim-anchored waypoints (milk dollar, 70% burn centers) are the quotable spine.

### Concept D — Two Jobs ("Kill and heal")
- **Exact quotes available (kill lane)**
  - WAL-CLM-DDDL-000014 — «disables specific enzymes that microorganisms use for respiration»
  - WAL-CLM-RARE-000091 — «silver kills over 650 disease» (+"causing organisms" next line)
- **Exact quotes available (heal lane)**
  - WAL-CLM-IMMORT-000029 — «Human fibroblast (stem) cells were able to multiply at a» (+"greater rate" next line)
  - WAL-CLM-IMMORT-000029 — «These stem cells are able to differentiate into»
  - WAL-CLM-IMMORT-000029 — «whatever cell types that are necessary to heal the wound or» (+"replace tissue mass" next line)
  - WAL-CLM-IMMORT-000029 — «replace tissue mass.»
- **Numbers** — 650 · organisms · WAL-CLM-RARE-000091 (kill lane, verbatim ✔). No number in the heal lane — the healing claim is mechanism-level, not dosed (no dose-per-wound protocol exists in the pack; do not invent one).
- **Figure label text** (proposed, grounded)
  - Kill-lane caption: "germs disabled" [grounded WAL-CLM-DDDL-000014]
  - Heal-lane caption: "stem cells multiply into fresh tissue" [grounded WAL-CLM-IMMORT-000029 «These stem cells are able to differentiate into» / «whatever cell types that are necessary to heal the wound or»]
  - Shared terminus: "one healed wound" [grounded condition `wounds`, WAL-CLM-IMMORT-000029]
- **Structure notes** — two short parallel lanes over the SAME wound: lane 1 = germs disabled, lane 2 = stem cells → fresh tissue; both terminate at ONE closed wound on a single centre axis (Rule 4 alignment). Two equal-weight ideas, minimal marks, not a beat sequence. Becker's "The Body Electric" attribution for the healing action is claim_text/adjacent-context — the healing FACT is verbatim-backed (IMMORT-000029) but the "Becker / Body Electric" credit is verbatim-backed only in EPIGEN-000064 (which ties Becker to illness rates, not to the fibroblast quote); do not attach the Becker credit to the fibroblast quote as though it were in that verbatim.

## Optional cross-concept inset (available to ANY concept)
- **Argyria — the permanent blue skin** (curio / safety note): WAL-CLM-IMMORT-000030
  - «Silver is absolutely non-toxic to humans at standard rates of consumption.»
  - «chronic overdoses can cause a whole body tattoo that produces»
  - «a permanent dusky blue discoloration of the skin.»
  - Structure note: a one-line safety inset, not a lead concept. Memorable and unique among the minerals (a permanent colour-change). All three quotes verbatim-backed. ✔

## Trap resolutions (claim_text > verbatim — every number/fact whose citing id differs from the naive claim_text source)
- **8,000 years / "Chinese alchemists"** -> claim_text-only in WAL-CLM-RARE-000090. NOT in any verbatim. Do NOT display as a Wallach quote (naive source would be RARE-000090 claim_text; its verbatim omits it entirely). Editorial framing only.
- **1917–1918 / British Medical Journal / Lancet** -> claim_text-only in WAL-CLM-RARE-000092. NOT in any verbatim. Do NOT quote (verbatim of RARE-000092 is only the Silvadene / burn-centers / syphilis-cholera-malaria sentence).
- **Science Digest / 1978** -> claim_text-only in WAL-CLM-RARE-000091. NOT in any verbatim. The "650 organisms" fact IS verbatim-backed (RARE-000091); its Science-Digest-1978 attribution is not. Present the source as our editorial note, not Wallach's words.
- **herpes virus / cold sores / fever blisters** -> claim_text-only in WAL-CLM-RARE-000092. NOT in verbatim. Not a quote.
- **Milk-dollar attribution** -> the milk-dollar sentence is in the verbatim of WAL-CLM-IMMORT-000028 ONLY. The dossier §1 also cites WAL-CLM-DDDL-000014 for it, but DDDL-000014's verbatim is only "Silver is an anti-bacterial...respiration." — the milk mention is DDDL-000014 claim_text, not verbatim. Cite IMMORT-000028 for any milk-dollar quote.
- **400 mcg (no mismatch, recorded for completeness)** -> verbatim-backed in three claims (DDDL-000013, RARE-000090, IMMORT-000027). For the daily target cite the source_claim_id WAL-CLM-DDDL-000013. No claim_text-vs-verbatim conflict on this number.

## Category / width / background (from element-headers.md)
- **Category accent:** mineral = **blue** (category = `mineral`, symbol `Ag`).
- **Width:** must match the element detail screen exactly. Real figure ceiling is ~817px (the `.kd-ep-fam` box is 865px clientWidth minus 24px padding each side); prefer the two exact shipped figure slots — `fork` = 700px or `rail` = 660px — over a bespoke width. A `figure` block names its own `width` from the closed set (`mech` 600 · `fork` 700 · `rail` 660) and it is REQUIRED.
- **Background:** the tan `.kd-ep-fam` box (`--ds-paper-deep`), tinted by the mineral (blue) category accent — because the header leads directly into the Best-Youngevity-sources block beneath it.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier §6 recommends A, with B as the mechanism blend; not decided here).
- Chassis-vs-composed layout (legacy skeleton vs composed `blocks[]`).
- Final layout, coordinates, figure widths, and all visual geometry.
- Final display copy / tone (the lede + why above are PROPOSALS; the figure label strings are proposed grounded copy, not final).
- Visual sign-off — build to done, then STOP for his eyes before logging/committing.
