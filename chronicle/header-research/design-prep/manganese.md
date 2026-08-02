# Manganese — design-prep build sheet
> Source materials for chronicle/header-research/manganese.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "manganese")
- **lede** (PROPOSAL): "A trace metal that builds the three tiniest bones in your ear and the cartilage in every joint — which is why Wallach reads congenital deafness as a shortage in the womb, not a genetic fate."  [grounded: WAL-CLM-DDDL-000027 (ear bones + cartilage), WAL-CLM-EPIGEN-000010 (maternal-deficiency reframe), WAL-CLM-RARE-000174 (essential to all living organisms)]
  - ⚠ Deliberately DROPS the "10–20 mg total body" number the dossier's proposed lede used: that figure is claim_text-only (see Trap resolutions), so it must not be written as if quoted. If Luneth wants it in the lede it can stay as OUR gloss, but it can never be shown as a Wallach quote.
- **why** (PROPOSAL): "The daily target, 7.7 mg, comes from Wallach's Epigenetics (2014) daily mineral program, which gives manganese 3–5 mg per 100 lb of body weight. The build takes the upper of that range (5 mg), scales it to a 154 lb / 70 kg reference body (× 1.54), and rounds to two significant figures: 5 × 1.54 = 7.7 mg/day. His earlier Base Line program (Let's Play Doctor, 1995) lists a matching 5 mg maintenance need; the newer figure is preferred. No RDI is used — the 2.5 mg government RDA printed beside his number is one Wallach reprints only to argue against."  [source_claim_id: WAL-CLM-EPIGEN-000134 · original_low 3.0 / original_high 5.0 mg · upper_taken 5.0 · scale_factor 1.54 · rounding 2sf · corroborating: WAL-CLM-LETS-000057]
  - target.kind = "wallach" (numeric, low 7.7 mg, period daily) — the numeric provenance chain applies; no honest-gap fallback needed.

## Per-concept build materials

### Concept A — The three-bone builder ("Built into the smallest bones you own.")
- **Exact quotes available**
  - WAL-CLM-DDDL-000027 — «the three fragile ear bones and joint cartilage» (single-line substring)
  - WAL-CLM-DDDL-000027 — «Manganese is part of the developmental process and the structure» (single-line; the clause before the line break — pair with the phrase above if the full sentence is wanted, but note the two are separated by a newline in the source)
  - WAL-CLM-EPIGEN-000010 — «congenital deafness is produced by a maternal manganese deficiency.» (single-line substring)
  - WAL-CLM-EPIGEN-000010 — «the “genetics of deafness.”» (single-line; note CURLY quotes “ ” — copy exactly, straight quotes will fail the byte-check)
  - WAL-CLM-RARE-000174 — «Manganese is essential to all known living organisms» (single-line substring)
  - WAL-CLM-EPIGEN-000099 — «Congenital Deafness (malformation, hypoplasia, or aplasia of otolithes)» (single-line; note source spelling "otolithes")
- **Numbers** — none required by this concept. (Do NOT pull the 10–20 mg body figure here; claim_text-only.)
- **Figure label text** (exact display strings, each tied to its claim)
  - "the three fragile ear bones" — from WAL-CLM-DDDL-000027 (his exact words are "the three fragile ear bones and joint cartilage")
  - "joint cartilage" — from WAL-CLM-DDDL-000027
  - "malformation of the otoliths" — grounded in WAL-CLM-RARE-000176 ("deafness (malformation of otoliths)") and WAL-CLM-EPIGEN-000099 ("aplasia of otolithes"); use "otoliths" (RARE spelling) for a label, not the OCR "otolithes", OR quote EPIGEN-000099 verbatim if shown as a quote
  - "a maternal manganese deficiency" — from WAL-CLM-EPIGEN-000010
- **Structure notes** — one annotated anatomical figure (ossicle chain, ~3 linked bones) as the body; two short call-out lines reading down one side: the structural fact, then the Bell reframe. No beats row, no big-stat block. Keep every label OFF the bone strokes (element-headers Rule 2 stroke-through trap).

### Concept B — Millions in Velcro braces ("The epidemic nobody calls a deficiency.")
- **Exact quotes available**
  - WAL-CLM-RARE-000178 — «literally millions of people at work with Velcro wrist, neck, elbow, finger, knee, back and hip supports - all for manganese deficiencies» (single-line; note single hyphen "supports - all", NOT an em-dash)
  - WAL-CLM-RARE-000178 — «all for manganese deficiencies!!!» (single-line; the three exclamation marks are in the source)
  - WAL-CLM-RARE-000178 — «would still prefer to spend your money than to admit that the human flesh needs Mn.» (single-line substring)
  - WAL-CLM-RARE-000177 — «costs corporate America $20 billion dollars per year and accounts for 56% of the 331,600 gradual onset work related illnesses.» (single-line substring)
  - WAL-CLM-EPIGEN-000099 — «Carpal Tunnel Syndrome» · «Repetitive Motion Syndrome» · «TMJ» (each a single-line token in the deficiency list)
- **Numbers**
  - $20 billion / year · unit: US dollars/year · WAL-CLM-RARE-000177 (verbatim: "$20 billion dollars per year") ✓ verbatim-backed
  - 56% · WAL-CLM-RARE-000177 (verbatim) ✓ verbatim-backed
  - 331,600 · count of gradual-onset work-related illnesses · WAL-CLM-RARE-000177 (verbatim) ✓ verbatim-backed
  - 1717 (Ramazzini, scribe-monks) · ⚠ claim_text-only in WAL-CLM-RARE-000178 — NOT in any verbatim. Do NOT display as a quote or a dated tick sourced to Wallach's words. Usable only as OUR narration if Luneth accepts claim_text grounding.
  - 1936 (poultry "slipped tendon" / "angel wing" / perosis) · ⚠ claim_text-only in WAL-CLM-RARE-000178 — NOT in any verbatim. Same restriction.
  - 100,000 carpal-tunnel operations · $4,000 each · >$29,000 per case · ⚠ claim_text-only in WAL-CLM-RARE-000177 — NOT in the verbatim. Do NOT surface.
- **Figure label text** (exact display strings)
  - "Velcro wrist, neck, elbow, finger, knee, back and hip supports" — from WAL-CLM-RARE-000178 (exact list)
  - "all for manganese deficiencies" — from WAL-CLM-RARE-000178
  - "$20 billion a year" — number verbatim-backed (WAL-CLM-RARE-000177); "a year" paraphrases source "per year" — if shown as a QUOTE use "$20 billion dollars per year"
  - "56% of the 331,600" — verbatim-backed (WAL-CLM-RARE-000177)
  - "the human flesh needs Mn" — from WAL-CLM-RARE-000178
- **Structure notes** — bold thesis statement on top; a short evidence strip beneath. ⚠ Because the 1717/1936 dates are claim_text-only, a "three dated anchors" cross-era TIMELINE cannot be built as Wallach-quoted history — if Luneth wants the timeline the dates must be framed as our editorial context, not his words. The safer verbatim-clean body is: thesis → the Velcro-brace image/line → the $20B / 56% / 331,600 cost figure. Close on the economic cost. The single Velcro brace is the fewer-elements illustration; route no stroke through any label.

### Concept C — The Goldilocks metal ("Both edges cut.")
- **Exact quotes available**
  - LEFT (deficiency):
    - WAL-CLM-RARE-000176 — «Convulsions» · «Congenital ataxia» (single-line tokens in the deficiency table)
    - WAL-CLM-LETS-000017 — «ataxia» · «dizziness» · «hearing loss» (single-line tokens; NOTE: "convulsions" is NOT in LETS-000017 — it lives in RARE-000176. The dossier's "convulsions-adjacent" phrasing for LETS-000017 is loose; cite convulsions to RARE-000176 only.)
  - RIGHT (excess):
    - WAL-CLM-RARE-000175 — «a Parkinsonian syndrome or a psychiatric disorder (locura manganica) resembling schizophrenia» (single-line substring)
    - WAL-CLM-RARE-000175 — «locura manganica» (single-line substring)
    - WAL-CLM-LETS-000018 — «Parkinsonism» · «memory loss» · «impaired judgement» · «anorexia» (single-line tokens in the toxicity list)
  - CENTRE (safe band):
    - WAL-CLM-EPIGEN-000134 — «Manganese 3 - 5 mg» (single-line; NOTE spaces around the dash: "3 - 5 mg")
- **Numbers**
  - 3–5 mg (per 100 lb) · unit: mg · WAL-CLM-EPIGEN-000134 verbatim contains "Manganese 3 - 5 mg" ✓ — but ⚠ the "per 100 lb" qualifier is NOT in this verbatim (it lives in the dose metadata / claim_text). If a centre-band label needs "per 100 lb" it is grounded but NOT quotable; show just "3–5 mg" as the quoted figure.
  - 7.7 mg/day (the derived target) · DERIVED value, appears in NO verbatim — it is the build's computed number (see the why-provenance). Never present it as a Wallach quote.
- **Figure label text** (exact display strings)
  - DEFICIENCY side: "convulsions" (RARE-000176) · "ataxia" (RARE-000176 "Congenital ataxia" / LETS-000017 "ataxia")
  - EXCESS side: "Parkinsonian syndrome" (RARE-000175) · "locura manganica" (RARE-000175) · "resembling schizophrenia" (RARE-000175) · "Parkinsonism" / "memory loss" / "impaired judgement" (LETS-000018)
  - CENTRE: "3–5 mg" (EPIGEN-000134) — the safe band
- **Structure notes** — symmetric two-lane: DEFICIENCY column vs EXCESS column meeting at a centre "just right" band. One axis, two end-labels, one centre marker. Both edges converge on movement + mind (convulsions/ataxia ↔ Parkinsonism/psychiatric), which is the concept's payoff. Route no stroke through the words (Rule 2).

### Concept D — A pinch of metal, enormous work ("Ten to twenty milligrams, doing all of this.")
- **Exact quotes available**
  - WAL-CLM-RARE-000174 — «Manganese is essential to all known living organisms; it activates numerous enzyme systems including those involved with glucose metabolism, energy production and superoxide dismutase» (single-line substring)
  - WAL-CLM-RARE-000174 — «a major constituent of several metalloenzymes, hormones, and proteins of humans» (single-line substring)
  - WAL-CLM-DDDL-000027 — «the three fragile ear bones and joint cartilage» (single-line substring)
- **Numbers**
  - 10–20 mg total body content · ⚠⚠ THE CONCEPT'S ENTIRE HOOK IS NOT VERBATIM-BACKED. "10 to 20 mg" appears ONLY in WAL-CLM-RARE-000174's claim_text; its verbatim ends "...proteins of humans." with no body-content figure, and NO other verbatim in the pack contains it. It CANNOT be displayed as a quote. This materially weakens Concept D — flag to Luneth: the arresting quantity that anchors the whole concept can only appear as OUR gloss, never as Wallach's quoted words.
- **Figure label text** (exact display strings)
  - "10–20 mg" — ⚠ claim_text-only (RARE-000174); if used, it is our editorial figure, not a quote
  - "superoxide dismutase" — from WAL-CLM-RARE-000174 (verbatim) ✓
  - "glucose metabolism" · "energy production" — from WAL-CLM-RARE-000174 (verbatim) ✓
  - "ear bones and joint cartilage" — from WAL-CLM-DDDL-000027 (verbatim) ✓
- **Structure notes** — one arresting quantity on top (the tiny total-body figure), then a compact "what that speck does" split: enzyme/antioxidant role vs structural role. Smallness is the figure (a grain to scale). ⚠ Two caveats from the research: (1) the anchor number is claim_text-only (above); (2) the SOD/antioxidant lane OVERLAPS selenium's owned "most efficient antioxidant" — keep SOD as supporting detail, not the headline. Positioned by the dossier as a fallback/B-side, not the lead.

## Trap resolutions (claim_text > verbatim)
Every number/fact whose naive claim_text source is NOT verbatim-backed:
- **10 to 20 mg (total body content)** -> claim_text-only in WAL-CLM-RARE-000174; verbatim contains NO body-content figure and no other verbatim carries it. DO NOT display as a quote. (Affects Concept D's core hook and the dossier's proposed lede 1.)
- **1717 / Bernardo Ramazzini / scribe-monks** -> claim_text-only in WAL-CLM-RARE-000178; verbatim omits it. NOT a Wallach-quoted dated anchor. (Affects Concept B timeline.)
- **1936 / poultry "slipped tendon" / "angel wing" / perosis** -> claim_text-only in WAL-CLM-RARE-000178; verbatim omits it. (Affects Concept B timeline.)
- **100,000 carpal-tunnel operations · $4,000 each · >$29,000 per case** -> claim_text-only in WAL-CLM-RARE-000177; verbatim carries ONLY "$20 billion dollars per year" and "56% of the 331,600". Use only those two. (Confirmed in dossier §5.)
- **"per 100 lb of body weight"** -> not in WAL-CLM-EPIGEN-000134's verbatim (verbatim is only "Manganese 3 - 5 mg"); the per-100 lb basis lives in the dose metadata / claim_text. The "3 - 5 mg" figure IS verbatim; the "per 100 lb" qualifier is NOT quotable.
- **7.7 mg/day (the daily target)** -> DERIVED (build computation), present in NO verbatim. Never a quote; it is the app's computed number with a documented chain.
- **"muscle therapy" (WAL-CLM-LETS-000017)** -> printed thus in the source, an apparent misprint mapped to muscle atrophy. Verbatim really says "muscle therapy". Do NOT display "muscle therapy" as a real deficiency sign; if the atrophy sign is used, source wording is defective (dossier §5).

## Category / width / background (from element-headers.md)
- **Category accent:** mineral = BLUE (`data-category` mineral tint on the `.kd-ep-fam` box).
- **Width:** must match the element detail screen exactly. Figure ceiling inside `.kd-ep-fam` is 817px (NOT the 867px outer screen). Prefer the two exact shipped figure slots — `--fork` = 700px or `--rail` = 660px — over a hand-picked width; a `figure` block names its width from the closed set (`mech` 600 · `fork` 700 · `rail` 660) and it is required.
- **Background:** the tan `--ds-paper-deep` main content box, blue-tinted by the mineral accent — it leads DOWN into the Best-Youngevity-sources block, so the header's bottom edge must hand off cleanly to that block. Best-Youngevity-sources always sits at the very bottom.

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept (or a mix) — dossier §6 recommends B (Velcro braces), with A (three-bone builder) as strong runner-up; both are live options and the trap-flags above may shift the call (B's timeline and D's hook both lean on claim_text-only material).
- Chassis-vs-composed layout shape.
- Final layout, coordinates, figure geometry.
- Final display copy + tone (the ledes/labels above are PROPOSALS/exact-source strings, not ratified copy).
- Visual sign-off (the STOP-for-verification gate).
