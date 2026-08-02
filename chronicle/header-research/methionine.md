# Methionine — header research dossier
> status: RESEARCH (concepts only — NOT designed). 4 sealed claims · amino acid · target: no Wallach maintenance amount stated (honest gap) — the only number is a clinical-lever dose, L-methionine 5 g/day for drug-induced Parkinsonism · solo-header: **marginal**.

## 1. The material (grounded, by angle)

Four claims map to methionine, but they thin out fast once you separate what the **verbatim** actually says from what the claim_text asserts around it. Read honestly, the pack gives **one vivid experiment, one clean mechanism line, and two protocols where methionine is a listed ingredient (one of them not even named in its own verbatim).**

**Angle A — The subtraction experiment (the one strong image).** `WAL-CLM-EPIGEN-000052`. Verbatim, exact: laboratory rats fed a **methionine-free diet** developed **steatohepatitis (fatty liver disease), anemia, and lost two-thirds of their body weight over five weeks** — and **supplementation with methionine resolved all of the disease problems.** This is the whole grounded story of the claim: remove it → three failures + wasting; restore it → reversal. Vivid, self-contained, single idea.
- ⚠ FLAG: the claim_text wraps this in a mechanistic preamble — "S-adenosyl methionine serves as a methyl donor… intermediate in the biosynthesis of cysteine, carnitine, taurine, lecithin, and phosphatidylcholine." **None of that is in the verbatim.** Per the grounding rule (trust the verbatim), I cannot build a header on SAMe / methyl-donor / precursor-of-five-things. The verbatim is the rat experiment and nothing more.

**Angle B — The builder (verbatim-clean, small).** `WAL-CLM-DDDL-000067`. From his table of classic essential amino acids, verbatim: "**Methionine — formation of choline and creatine phosphate.**" Two named products, no dose, no elaboration. Clean but small — a single line in a table.

**Angle C — Clinical lever: the 5-gram Parkinsonism dose.** `WAL-CLM-LETS-000396`. Verbatim-solid: in the drug-induced Parkinsonism protocol, "**l-methionine at 5 gm/day**," alongside octacosanol, leucine 10 g/day, EFAs, tyrosine, phenylalanine, B-1, B-6, betaine HCl + pancreatic enzymes. Methionine is one ingredient in a stack — this is the only real NUMBER attached to methionine in the whole pack.

**Angle D — Peripheral: the MD / Keshan stack.** `WAL-CLM-LETS-000373`. This is fundamentally a **selenium** claim (muscular dystrophy as a selenium-deficiency disease). Methionine enters only via claim_text — "sulfur amino acids (a complete amino-acid infusion… plus free amino acids orally)." ⚠ FLAG: **the verbatim excerpt does not name methionine or sulfur amino acids at all** — it cuts off after "vitamin E 800-1,200 orally." Methionine's presence here is an editorial mapping, not a quotable fact. Do not build on this.

Net: one experiment (A), one mechanism line (B), one dose-in-a-stack (C), one near-empty peripheral (D). That is a thin palette.

## 2. Header concepts (honestly supported: 2)

### Concept 1 — "Take it away" (the subtraction experiment) — STRONGEST
- **The hook:** You don't need a mechanism diagram to prove methionine matters — Wallach just removed it. Rats on a methionine-free diet fell apart in five weeks; adding it back fixed everything.
- **Layout shape:** A **before → absence → after** triptych, driven by the animal, not a chassis. Left: a healthy baseline. Middle (the dominant panel): the methionine-free collapse, with its three consequences called out as plain tags. Right: the reversal. No eyebrow-kill-beats-quote skeleton — three states of one subject, read left to right, with the middle panel visually heaviest (it's where the damage is).
- **Illustration (one idea):** A single simple rat silhouette shown at two sizes — full-bodied at baseline, shrunk to ~one-third at the five-week mark — with the loss stated as a number, not drawn as clutter. Three short labels float **beside** (never through) the shrunken figure: `fatty liver`, `anemia`, `lost ⅔ of body weight`. Then one restore arrow to a recovered figure. Fewest elements: two rats + one arrow + three labels + one big number. Route every label off the figure outline (no stroke-through-text).
- **Anchored by:** `WAL-CLM-EPIGEN-000052` — "steatohepatitis (fatty liver disease), anemia, and lost two thirds of their body weight over five weeks… Supplementation with methionine resolved all."
- **Why it wows / best UX:** It's the rare deficiency claim that is a controlled experiment with a clean reversal — the most persuasive shape there is (remove the variable, watch the system fail, restore it, watch it recover). The "⅔ of body weight in 5 weeks" figure is a genuine gut-punch stat that needs no embellishment. One subject, one story.

### Concept 2 — "What it builds" (the precursor line) — SUPPORTING / thinner
- **The hook:** Methionine isn't just protein filler — it's raw material the body spends to make other essential chemistry.
- **Layout shape:** A compact **source → two products** fork. Methionine on the left, two clean output nodes on the right (choline; creatine phosphate). No beats, no quote — just a labeled conversion.
- **Illustration (one idea):** A minimal two-branch fork, methionine → { choline, creatine phosphate }. Two branches only — resist adding the claim_text's five other products (cysteine/carnitine/taurine/lecithin/phosphatidylcholine), because **those are not in the verbatim** and would be an ungrounded embellishment.
- **Anchored by:** `WAL-CLM-DDDL-000067` — "Methionine formation of choline and creatine phosphate."
- **Why it wows / best UX:** Honest and clean, but it's a two-node diagram off a single table row — informative, not wow. Best used as a small secondary block UNDER Concept 1, not as the header's centerpiece.

*(No third or fourth concept is proposed. Concept C, the 5 g/day Parkinsonism dose, is a stack ingredient with no standalone story; Concept D, the MD/Keshan stack, isn't even named in its verbatim. Inventing headers from them would be padding.)*

## 3. Proposed lede (PROPOSAL — Luneth ratifies)

Candidate A (leads with the experiment — matches the selenium/copper "here's the striking Wallach fact" voice):
> "A sulfur-containing essential amino acid the body can't make for itself — Wallach's proof of how much it matters is a rat: strip methionine from the diet and it develops fatty liver, anemia, and loses two-thirds of its body weight in five weeks; put it back and all of it reverses." *(anchors: `WAL-CLM-EPIGEN-000052`; "essential amino acid the body cannot make" is from `WAL-CLM-DDDL-000067`'s table framing.)*

Candidate B (shorter, builder-first):
> "An essential amino acid the body spends to build choline and creatine phosphate — and one Wallach showed is load-bearing by removing it: a methionine-free diet gave rats fatty liver, anemia, and two-thirds body-weight loss in five weeks, all reversed by putting it back." *(anchors: `WAL-CLM-DDDL-000067`, `WAL-CLM-EPIGEN-000052`.)*

Recommend A — the reversal is the strongest single fact in the pack and the lede should carry it.

## 4. Proposed "why this number" (PROPOSAL)

**There is no Wallach daily maintenance amount for methionine — an honest gap (blueprint §7.1).** The pack's `target.kind` is `dietary_with_clinical_lever`. The only number attached to methionine anywhere in the pack is a **clinical-lever therapeutic dose, not a daily target**: L-methionine **5 g/day** as one component of the drug-induced Parkinsonism protocol (`WAL-CLM-LETS-000396`).

Proposed "why this number" copy:
> "Wallach states no everyday maintenance amount for methionine — you get it from dietary protein. The only dose he puts a number on is therapeutic: 5 grams a day of L-methionine inside his drug-induced Parkinsonism protocol (`WAL-CLM-LETS-000396`), one ingredient in a larger stack — a clinical lever, not a daily target."

Do NOT print a maintenance number. If the header uses the "why this number" slot at all, it should honestly explain the gap + surface the one clinical dose with its context.

## 5. Gaps / flags + SOLO-vs-GROUP verdict

**Flags:**
- **claim_text > verbatim on the anchor claim.** `WAL-CLM-EPIGEN-000052`'s claim_text asserts SAMe / methyl-donor / precursor-of-five-metabolites; **none is in the verbatim.** Any header must stay on the rat experiment and must NOT render the SAMe/precursor mechanism. This is the single biggest trap for this element.
- **MD/Keshan is a selenium claim, not a methionine claim.** `WAL-CLM-LETS-000373`'s verbatim never names methionine; its mapping here is via claim_text's "sulfur amino acids." Unusable as header material.
- **The one grounded product line is just two nodes** (choline + creatine phosphate) — do not expand it to the claim_text's five extra products.
- **Only one real number** (5 g/day), and it's a stack ingredient for one drug-induced condition, not a target.

**Verdict: MARGINAL solo header.** Methionine has exactly ONE genuinely bespoke, wow-worthy image — the subtraction experiment (Concept 1) — plus one thin supporting line (Concept 2). That's enough to build a *real* header that isn't padded, because Concept 1 is vivid and self-contained on its own. It is NOT enough for a rich multi-block header, and it should not be forced into one. If Luneth would rather not spend a bespoke session on a two-concept element, the clean fallback is to **fold methionine into an essential-amino-acids group page** (with tryptophan, phenylalanine, leucine, tyrosine — all of which co-occur in `WAL-CLM-DDDL-000067`'s table and `WAL-CLM-LETS-000396`'s Parkinsonism stack), where the shared "precursor table" mechanism and the shared protocol stack become the group's spine and each amino acid contributes its one strong fact. Methionine's contribution to that group would be the rat experiment.

Recommendation: build a **lean solo header** around Concept 1 if a solo is wanted; otherwise **group it** with the essential amino acids. Both are honest; do not build a heavy solo.

## 6. Recommended lead concept

**Concept 1 — "Take it away" (the subtraction experiment).** It's the one place methionine has a striking, single-idea, verbatim-solid story — remove it and a rat loses two-thirds of its body weight to fatty liver and anemia in five weeks, restore it and all of it reverses. Everything else in the pack is a supporting note. If it ships solo, this carries it; if it groups, this is methionine's contributed fact.
