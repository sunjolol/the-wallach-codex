# Leucine — header research dossier

> status: RESEARCH (concepts only — NOT designed). 2 sealed claims · amino acid · target: no Wallach maintenance amount stated (honest gap; dietary_with_clinical_lever). · solo-header: marginal.

## 1. The material (grounded, by angle)

Only two sealed claims map here, and they are lopsided: one rich mechanism claim carries almost everything, one protocol claim contributes a single dose line.

**Angle A — the sole muscle-builder, double-edged (WAL-CLM-EPIGEN-000050, mechanism).**
- Leucine is a **branched-chain amino acid** with roles in liver, adipose tissue, and muscle; in muscle and adipose it is used to **synthesize sterols**.
- Wallach's headline claim — and the sealed verbatim — is that leucine is **"solely responsible for the synthesis of muscle proteins."** He calls it a catalyst for muscle growth that **activates the mTOR (mammalian target of rapamycin) kinase** regulating cell growth.
- The same claim carries the dark edge: **leucine toxicity** (as in decompensated **Maple Syrup Urine Disease**) produces **delirium, neurologic compromise, and can be life-threatening**; and **excessive leucine intake can produce a clinical pellagra** — the **"four Ds": diarrhea, dermatitis, dementia, and death.**
- So one amino acid, one claim: the sole on-switch for muscle protein, and a poison in excess.

**Angle B — an instrument in the drug-induced Parkinsonism protocol (WAL-CLM-LETS-000396, protocol).**
- For **drug-induced Parkinsonism** (after eliminating the offending drug — phenothiazines, haloperidol, reserpine, etc.), Wallach's regimen includes **leucine 10 grams a day**, alongside octacosanol 300 mcg t.i.d., Neuro-Gen, L-methionine 5 g/day, essential fatty acids, L-tyrosine, DL-phenylalanine, B-1, B-6, betaine HCl + pancreatic enzymes, and the baseline program.
- Leucine here is **one of ~11 components** — not the star. The 10 g/day is a **clinical treatment dose for Parkinsonism**, not a maintenance target.

_Note on numbers: the only number attached to leucine in the pack is the **10 g/day Parkinsonism dose (000396)**. Claim 000050 states no dose. Both claims are current (no `superseded_by`). No deficiency signs are recorded for this element._

## 2. Header concepts (as many as the material honestly supports)

The material honestly supports **one** compelling bespoke concept, plus one **marginal** fallback. I am not going to invent a third or fourth — there is nothing in the pack to anchor them.

### Concept 1 — "The one switch that builds — and, past a line, poisons" (STRONG of the two)
- **The hook.** Wallach's own words: leucine is *solely* responsible for making muscle protein — a single, non-redundant on-switch. But the very same amino acid, in excess, drives a clinical pellagra: the four Ds — diarrhea, dermatitis, dementia, death. Build on one side of a line, collapse on the other. That tension is the whole story and it's all in one sealed claim.
- **Layout shape.** A single left-to-right progression with a threshold marked partway across: the "builds muscle" region, a line, then the "excess → four Ds" region. Not a 1-2-3-beat chassis — one continuous axis with a turning point, the turning point being the point.
- **Illustration (one idea).** A single horizontal track for leucine intake. Left third labelled with the muscle-synthesis payoff; a clear vertical threshold line; the right region opening into the four Ds. Keep it to the track, the line, and four short terminal labels — route no stroke through any label (element-headers Rule 2). One image, fewest elements.
- **Anchored by.** WAL-CLM-EPIGEN-000050 — verbatim "Leucine is solely responsible for the synthesis of muscle proteins"; mTOR activation; "clinical pellagra" / four Ds (diarrhea, dermatitis, dementia, death); MSUD toxicity → delirium, life-threatening.
- **Why it wows / best UX.** It's genuinely surprising: a muscle amino acid that most people think of as harmless has a Wallach-stated poison ceiling. The double edge reads instantly as an illustration and rewards the reader with a real, cited fact rather than a slogan. It stands on a single rich claim — which is also its risk (see §5).

### Concept 2 — "10 grams a day, in the Parkinson's toolkit" (MARGINAL — fallback only)
- **The hook.** Leucine shows up in Wallach's drug-induced Parkinsonism protocol at 10 g/day, shoulder to shoulder with octacosanol, methionine, tyrosine, and the B-vitamins.
- **Layout shape.** A named-instrument roster with leucine highlighted — the one amino acid among the protocol's supporting cast.
- **Illustration (one idea).** A compact regimen line-up with leucine's 10 g/day pulled forward.
- **Anchored by.** WAL-CLM-LETS-000396 — "leucine 10 gm/day" within the drug-induced Parkinsonism regimen.
- **Why it's marginal.** Leucine is one of eleven items here and not the protagonist; the header would be teaching the *protocol*, not the *element*. It also risks reading the 10 g/day as a general target when it is a specific clinical dose. Use only if Concept 1 is judged too thin to carry alone — and even then, better folded in as a small secondary note under Concept 1 than as its own header.

## 3. Proposed lede (PROPOSAL — Luneth ratifies)

Primary (matches selenium/copper voice, grounds on 000050):
> "The amino acid Wallach calls *solely* responsible for building muscle — the single switch that flips protein synthesis on, yet in excess tips the body into pellagra's four Ds: diarrhea, dermatitis, dementia, death."

Alternate (shorter):
> "A branched-chain amino acid Wallach reads as the sole builder of muscle protein — and, past a line, a poison that mimics pellagra."

Both anchor entirely to WAL-CLM-EPIGEN-000050. The lede must not restate Concept 1's opening beat (element-headers Rule 6).

## 4. Proposed "why this number" (PROPOSAL)

**No Wallach maintenance amount stated — honest gap.** `target.kind` is `dietary_with_clinical_lever`; the pack's `target.source` says plainly "no maintenance amount stated (honest gap; blueprint §7.1)."

The only number in the pack is **10 g/day (WAL-CLM-LETS-000396)**, and that is a **clinical treatment dose for drug-induced Parkinsonism**, not a daily target — it must not be dressed up as a maintenance number. Honest "why this number" copy: *Wallach states no daily leucine target; leucine is covered through diet. The 10 g/day figure he gives is a treatment dose inside his Parkinsonism protocol, not an everyday amount.* Fabricating a maintenance number here would violate §00.A / R2.

## 5. Gaps / flags + SOLO-vs-GROUP verdict

- **Thinness.** Two claims, and effectively **one** load-bearing claim (000050). Concept 1 rests on a single sealed mechanism claim. That is the honest ceiling.
- **No deficiency signs, no maintenance target.** Nothing to build a "why this number" figure or a deficiency-sign panel from.
- **claim_text vs verbatim.** The verbatim seals only the muscle-protein sentence; the mTOR / four Ds / MSUD content lives in `claim_text` on the sealed claim (000050, confidence high) but is **not** in the short verbatim. Treat the four-Ds and mTOR material as claim-level (cited to 000050) — do not present it as a highlighted verbatim pull-quote, since the sealed quote doesn't contain those words.
- **The 10 g/day trap.** Repeatedly flag: 10 g/day is a Parkinsonism treatment dose (000396), never a target.

**VERDICT: MARGINAL solo header.** Concept 1 is a real, surprising, fully-cited idea and *could* carry a bespoke solo header — the double-edge is a strong single image. But it stands on one claim, with no target and no deficiency data, so the header would be a single illustrated concept with little depth behind it. Acceptable as a lean solo header **if** Luneth wants leucine to have its own page; otherwise the cleaner call is to **fold leucine into an amino-acids / branched-chain group concept** (with methionine, tyrosine, phenylalanine — all of which co-appear in the same Parkinsonism protocol 000396), where the "sole muscle-builder, double-edged" fact becomes leucine's standout line. Given the co-occurrence in 000396, a grouped amino-acid page is the natural home. Recommend **marginal-solo OR group** — Luneth's call.

## 6. Recommended lead concept

**Concept 1 — "the one switch that builds, and past a line poisons."** It is the only concept the pack strongly supports, it wows on a single cited fact, and it renders as one clean image. If leucine gets a solo header, this is it; if not, this same fact is leucine's headline line inside a grouped amino-acid concept.
