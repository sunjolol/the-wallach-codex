# Vitamin B1 (Thiamine) — design-prep build sheet
> Source materials for chronicle/header-research/vitamin-b1.md. Byte-verified from sealed claims. NOT a design — concept choice + layout stay open for Luneth.

**★ READ THIS FIRST — the load-bearing prep finding.** Three of the four concepts (A, B, C) draw their most memorable ideas from the claims' **claim_text**, and those exact phrases are **NOT present in any verbatim**. A designer pulling "quotes" straight from the dossier's §2 hooks would fail the byte-check. Specifically: "cofactor / turns food into energy", "reaches from the heart to the mind", "'senility' … simple vitamin cause", "beriberi — Sinhalese for 'I cannot'", "polished white rice with its thiamine-bearing bran removed", "false Alzheimer's", "record new memory", "confabulation" are **all claim_text-only** — usable as our own grounded prose (lede/caption/answer), never as a guillemet quote. What each concept *can* quote byte-exactly is listed per-concept below.

---

## Entity-copy draft (ready to slot into dashboard/assets/data/entity-copy.json under "vitamin-b1")

- **lede** (PROPOSAL): "The 'beri-beri vitamin' — a cofactor your body uses to turn carbohydrate, protein and fat into energy, and the one Wallach says can fail both the heart and the memory from a single shortage."
  [grounded: WAL-CLM-LETS-000377 (the "beri-beri vitamin" framing, claim_text), WAL-CLM-EPIGEN-000035 (cofactor for energy + metabolism of carbohydrates/protein/fat, claim_text), WAL-CLM-RARE-000233 (heart + mind reach)]
  - *Grounding note:* every fact here is supported by the cited claims' **claim_text**; this is our own shipped-voice prose, not a quote, so byte-exactness does not apply. It must NOT restate a chosen concept's opening beat.

- **why** (PROPOSAL): "The 100 mg target is the ceiling of the range Wallach sets in Epigenetics (2014), where his daily multiple lists thiamine at 10–100 mg (WAL-CLM-EPIGEN-000112) — the derive simply takes the upper bound. Thiamine is dosed directly in milligrams, so no IU conversion and no ×1.54 body-weight scaling apply; the posted figure is the range's ceiling, unrounded. For context, his earlier Base-Line program (Let's Play Doctor, 1995) set a maintenance need of 50 mg with a 200–500 mg short-term therapeutic dose, so 100 mg sits at the top of the everyday range and well below the doses he reserves for the heart/mind conditions."
  [source_claim_id: WAL-CLM-EPIGEN-000112 · provenance.original_low 10, original_high 100, upper_taken 100, unit mg · no IU factor, no weight-scale · context: WAL-CLM-LETS-000068 (50 mg TSN / 200–500 mg pharmacologic)]
  - target.kind = `wallach` (numeric, 100 mg/day). No honest-gap fallback needed.

---

## Per-concept build materials

### Concept A — "Heart to the Mind" (Heart ↔ Mind, the two-pole reach) — dossier's recommended lead
- **Exact quotes available** (byte-exact contiguous substrings):
  - WAL-CLM-RARE-000233 — «Congestive heart failure (Beriberi), loss of memory (Wernicke-Korsakoff syndrome), mental confusion, depression, lethargy,
muscular weakness, paralysis, emotional instability, loss of appetite.»
  - WAL-CLM-RARE-000233 — «Congestive heart failure (Beriberi)»  (the heart pole, standalone)
  - WAL-CLM-RARE-000233 — «loss of memory (Wernicke-Korsakoff syndrome)»  (the mind pole, standalone)
  - WAL-CLM-EPIGEN-000035 — «Beriberi (muscle wasting, congestive heart failure, Korsakoff syndrome
[dementia] and Wernicke-Korsakoff syndrome [dementia & MS])»
  - WAL-CLM-EPIGEN-000035 — «congestive heart failure, Korsakoff syndrome
[dementia]»  (the two poles inside one phrase)
- **★ NOT quotable (claim_text-only — do NOT render as a quote):**
  - "reaches from the heart to the mind" — RARE-000233 claim_text only; the verbatim never says this. Use as our own caption/prose if wanted.
  - "'senility' and heart failure can have a simple vitamin cause" — RARE-000233 claim_text only.
  - "cofactor for energy production", "disturbs carbohydrate metabolism in the brain (dementia) and heart (congestive heart failure)" — EPIGEN-000035 claim_text only; the verbatim is just the deficiency list. This is the concept's spine and it is **not a quote** — present it as grounded prose.
- **Numbers** — none required by this concept (it is qualitative). If the header wants the target, it comes from EPIGEN-000112 (see Concept D / the "why").
- **Figure label text** (exact display strings, each tied to its source):
  - Heart pole: `congestive heart failure (beriberi)` [RARE-000233 / EPIGEN-000035 verbatim both carry this]
  - Mind pole: `loss of memory` [RARE-000233 verbatim] · `mental confusion` [RARE-000233 verbatim] · `dementia` [EPIGEN-000035 verbatim "[dementia]"]
  - Optional connecting-thread label: `thiamine` [the substance itself; safe descriptor, not a quote]
  - Optional mind-pole detail: `Wernicke-Korsakoff syndrome` [RARE-000233 + EPIGEN-000035 verbatim]
- **Structure notes:** two anchored poles (HEART, MIND) joined by one central thread; the two poles are the SAME deficiency (single origin), so a single shared spine reads the connection by construction. Keep the connecting line clear of both text labels (route beside, never through). Fewest elements.

### Concept B — "I cannot" (the refined-away vitamin / polished-rice origin story)
- **Exact quotes available** (byte-exact):
  - WAL-CLM-DDDL-000043 — «Beriberi with resultant congestive
heart failure was common, the result of a thiamin or vitamin B1 deficiency.»
  - WAL-CLM-DDDL-000043 — «the result of a thiamin or vitamin B1 deficiency»
  - WAL-CLM-LETS-000377 — «B-l (Beri-Beri)»  (Wallach's own appositive; note OCR "B-l" = lowercase L, and this is the closest verbatim to the "beri-beri vitamin" label)
- **★ NOT quotable (claim_text-only — the ENTIRE story of this concept):** "the classic thiamine deficiency disease", "common disease of the Asian rice cultures", "the name is Sinhalese for 'I cannot'", "weakness in the legs, hands, and arms", "death from pulmonary edema and abdominal 'dropsy'", "polished white rice with its thiamine-bearing bran removed" are **all in DDDL-000043's claim_text and in NO verbatim.** The whole rice-grain / etymology figure rests on claim_text, not on quotable Wallach words. This is the single biggest reason to flag Concept B: it is the most story-rich concept and the least quote-backed. It is still fully *grounded* (claim_text is a sealed claim field) — it just cannot show guillemet quotes for its hook. Design it with our own captions, not pull-quotes.
- **Numbers** — none.
- **Figure label text** (exact display strings — sourced to claim_text, safe as our captions, NOT quotes):
  - whole grain: `bran layer — carries the thiamine` [DDDL-000043 claim_text "thiamine-bearing bran"]
  - polished grain: `bran polished away` [DDDL-000043 claim_text "with its thiamine-bearing bran removed"]
  - etymology callout: `beriberi — Sinhalese for "I cannot"` [DDDL-000043 claim_text]
  - consequence line: `beriberi → congestive heart failure` [supported BOTH by verbatim (DDDL-000043) and claim_text]
- **Structure notes:** one rice-grain cross-section in two states (whole vs polished), same silhouette so the "one layer removed" reads by construction; three labels max. No mill, no plate. The only element that can carry an actual quote is the consequence line; everything else is our caption over claim_text.

### Concept C — "False Alzheimer's" (the reversible diagnosis / reframe)
- **Exact quotes available** (byte-exact):
  - WAL-CLM-EPIGEN-000014 — «The disease can be reversed»
  - WAL-CLM-EPIGEN-000014 — «a special emphasis on the supplementation of thiamine»
  - WAL-CLM-EPIGEN-000014 — «a supplement program that provides all 90 essential
nutrients»
  - WAL-CLM-EPIGEN-000014 — «elimination of sugar, fried foods, processed meats, oils, and gluten from
the diet»
  - WAL-CLM-EPIGEN-000014 — «Korsakoff’s syndrome occurs as part of the Beriberi (thiamine or vitamin

B1 deficiency) collection of diseases.»  (note: curly apostrophe ’ in Korsakoff’s; double blank line before "B1")
  - WAL-CLM-LETS-000333 — «vitamin B-l
at 100 mg t.i.d.»  (the lead treatment dose; OCR "B-l" = lowercase L)
- **★ NOT quotable (claim_text-only — the concept's reframe language):** "false Alzheimer's disease", "recent memory loss", "inability to record new memory", "can still perform detailed tasks learned before onset but cannot learn the simplest new tasks", "confabulation (inventing imaginary experiences to fill the gaps)", "blow to the head", "chronic alcoholism and vitamin B-1 deficiency" are **all in LETS-000333's claim_text and in NO verbatim** (that claim's verbatim is only the treatment list). The "false Alzheimer's" hook — the emotional core — is claim_text, not a quote. Use it as grounded prose; the only quotable Wallach words for this concept are the reversibility line (EPIGEN-000014) and the dose (LETS-000333).
- **Numbers** — 100 (mg) · unit mg · WAL-CLM-LETS-000333 verbatim contains it («at 100 mg t.i.d.»). (The reversal claim EPIGEN-000014 carries no number.)
- **Figure label text** (exact display strings):
  - wrong label (our caption over claim_text): `looks like Alzheimer's` [LETS-000333 claim_text "false Alzheimer's disease"]
  - the turn (quotable): `"The disease can be reversed"` [EPIGEN-000014 verbatim — this one IS a real quote]
  - condition of reversal: `eliminate sugar, fried foods, processed meats, oils, gluten` [EPIGEN-000014 verbatim, lightly compressed — for an exact quote use «elimination of sugar, fried foods, processed meats, oils, and gluten from
the diet»]
  - emphasis tag: `+ all 90 nutrients, thiamine emphasized` [EPIGEN-000014 verbatim «a special emphasis on the supplementation of thiamine»]
- **Structure notes:** a single "mislabel → true cause → reversible" turn carried by one connective idea, not a divider and not a decline/reversal rail (avoid the selenium visual). One metaphor, few elements, no stroke through any label. Present the reversal as Wallach's stated framework (the claims are his position).

### Concept D — "One vitamin, four doses" (the dose ladder ending on a surprise)
- **Exact quotes available** (byte-exact — every rung's number is verbatim-backed):
  - WAL-CLM-LETS-000068 — «THIAMINE 1.4 mg 50 mg 200 to 500 mg»  (the full Base-Line row: RDA / TSN / pharmacologic, in column order)
  - WAL-CLM-LETS-000068 — «200 to 500 mg»  (pharmacologic, 30-day)
  - WAL-CLM-EPIGEN-000112 — «Vitamin B1 (thiamine) 10 - 100 mg»  (the daily-multiple range; note spaced dash "10 - 100")
  - WAL-CLM-EPIGEN-000112 — «10 - 100 mg»
  - WAL-CLM-LETS-000370 — «B-l at 500 mg/day will also "repel"
mosquitoes.»  (the payoff rung; OCR "B-l" lowercase L, literal straight double-quotes around repel)
  - Middle-rung therapeutic examples (all byte-exact):
    - WAL-CLM-LETS-000243 — «Treatment of dementia includes B-l at 100 mg
t.i.d.»
    - WAL-CLM-LETS-000130 — «200
mg vitamin B-l t.i.d.»  (Alzheimer's; the "200" and "mg" straddle a line break)
    - WAL-CLM-LETS-000396 — «B-1 at 200 mg t.i.d.»  (parkinsonism; note here it is "B-1" digit-one)
    - WAL-CLM-LETS-000443 — «B-l at 100 mg t.i.d.»  (tachycardia)
- **Numbers** (value · unit · verbatim-backed claim id · trap notes):
  - 50 · mg · WAL-CLM-LETS-000068 (maintenance "True Supplement Need"). ✔ verbatim.
  - 100 · mg · WAL-CLM-EPIGEN-000112 (daily target = upper of 10–100). ✔ verbatim.
  - 200 to 500 · mg · WAL-CLM-LETS-000068 (30-day pharmacologic). ✔ verbatim.
  - 500 · mg/day · WAL-CLM-LETS-000370 (mosquito rung — the payoff). ✔ verbatim.
  - 10 · mg · WAL-CLM-EPIGEN-000112 (range floor, if shown). ✔ verbatim.
  - 1.4 · mg · WAL-CLM-LETS-000068. ✔ verbatim BUT ★ this is the government **RDA Wallach reprints only to argue against** — do NOT present it as his figure. Show only if explicitly framed as "the RDA he rejects."
  - 200 · mg t.i.d. · WAL-CLM-LETS-000130 (Alzheimer's) AND WAL-CLM-LETS-000396 (parkinsonism) — verbatim-backed therapeutic examples.
  - 100 · mg t.i.d. · WAL-CLM-LETS-000243 / -000443 / -000333 — verbatim-backed therapeutic examples.
- **Figure label text** (exact display strings, low→high):
  - `50 mg — maintenance need` [LETS-000068]
  - `100 mg — daily target` [EPIGEN-000112]
  - `200–500 mg — 30-day therapeutic` [LETS-000068]
  - `500 mg — repels mosquitoes` [LETS-000370] ← the surprise payoff at the top rung
- **Structure notes:** ascending rungs, one number + one short label per rung; the numbers ARE the illustration (no figure clutter). The maintenance-vs-therapeutic gap the "why" explains is visible by construction. Keep 1.4 mg off the ladder unless deliberately framing the rejected RDA.

---

## Trap resolutions (claim_text > verbatim)

**Number traps (dose figures):** none of the displayed doses are claim_text-only — every number a concept would show is present in a verbatim, EXCEPT:
- **Nervous-heart 100 mg t.i.d. — cite nothing verbatim-backed for the DOSE.** WAL-CLM-LETS-000377's "100 mg three times a day" lives in its **claim_text only**; the verbatim stops at "…deficiencies of stomach acid." If a concept wants a nervous-heart dose quote, pull it from WAL-CLM-LETS-000243/-000443 (both 100 mg t.i.d., verbatim-backed), NOT from LETS-000377.
- **1.4 mg RDA — verbatim-backed but must NOT be shown as Wallach's number** (WAL-CLM-LETS-000068). It is the RDA he reprints to rebut. Present only as "the RDA he rejects," never as his recommendation.

**Narrative traps (the big ones — whole concept hooks that are claim_text-only, un-quotable):**
- "reaches from the heart to the mind" → grounded in WAL-CLM-RARE-000233 **claim_text**, NOT verbatim. Use as prose, not a quote.
- "'senility' and heart failure can have a simple vitamin cause" → WAL-CLM-RARE-000233 **claim_text** only.
- "cofactor for energy production / carbohydrate metabolism in the brain and heart" → WAL-CLM-EPIGEN-000035 **claim_text** only (verbatim is the bare deficiency list). Concept A's spine.
- "Sinhalese for 'I cannot'", "polished white rice", "thiamine-bearing bran removed", "pulmonary edema / dropsy" → WAL-CLM-DDDL-000043 **claim_text** only. Concept B's entire story.
- "false Alzheimer's", "inability to record new memory", "confabulation", "blow to the head", "alcoholism + B-1 deficiency" → WAL-CLM-LETS-000333 **claim_text** only. Concept C's entire reframe.
- "the beri-beri vitamin" (as a clean phrase) → WAL-CLM-LETS-000377 **claim_text**; the nearest verbatim is «B-l (Beri-Beri)».

*(These correct/extend the dossier §5, which flagged only that the DOSE numbers match their verbatims — true — but did not note that concepts B and C are almost entirely claim_text-narrated. That is the load-bearing prep finding above.)*

---

## Category / width / background (from element-headers.md)

- **Category accent:** vitamin → **orange** (`data-category` drives the tint; minerals=blue · vitamins=orange · amino=green · fatty-acid=purple).
- **Width:** must match the element detail screen exactly. The header renders inside the tan `.kd-ep-fam` box; the real FIGURE ceiling is ~817px (not the 867px outer screen — `.kd-ep-fam` clientWidth ~865px minus 24px padding a side). Prefer the two shipped exact figure slots so no new CSS is needed: **`fork` = 700px** or **`rail` = 660px** (the closed set is mech 600 / fork 700 / rail 660). Author every figure at scale 1 (viewBox width == CSS max-width) and declare the width override at ID-scoped specificity, or every label silently shrinks. **OPEN for Luneth — do not pre-pick a slot.**
- **Background:** the tan `--ds-paper-deep` main content box, tinted by the vitamin (orange) accent; it leads directly into the **Best Youngevity sources** block beneath, so the header's bottom edge must hand off cleanly to that block.

---

## Still OPEN for Luneth (do NOT pre-decide)
- Which concept, or a mix (dossier recommends A, with B as the tonal-contrast second mockup).
- Chassis vs composed `blocks[]` layout.
- Final layout, coordinates, figure width slot.
- Final display copy, tone, and any label wording (the label strings above are exact-source material, not final copy).
- Visual sign-off — every header is demo-only until Luneth approves.
