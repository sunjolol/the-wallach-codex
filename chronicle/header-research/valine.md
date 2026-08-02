# Valine — header research dossier
> status: RESEARCH (concepts only — NOT designed). 2 sealed claims (1 mechanism · 1 protocol) · amino acid (green) · target: no Wallach maintenance amount — a clinical lever dosed per condition (honest gap) · solo-header: **too-thin — group it**.

Valine is a genuinely thin element, and the thinness is worse than the raw count of two claims suggests.
Only ONE claim carries any valine-specific description, and its single most striking fact (the sickle-cell
substitution) lives in the claim_text but **not** in the verbatim. The second claim is a long inflammation
protocol in which valine is one line item — and the supplied verbatim is truncated *before* valine is ever
named. So the verbatim-grounded palette for valine is one sentence about muscle and cognition. This dossier
says so plainly and recommends a group, not a solo header.

---

## 1. The material (grounded, by angle)

### Angle A — what valine DOES (the only verbatim-grounded material)
`WAL-CLM-EPIGEN-000058` (mechanism, epigenetics ch18, p.642). The **verbatim** covers exactly this and only this:
> "It functions in the nervous system to support cognitive function, function and maintenance of muscle, and the muscle tissue recovery and metabolism post-exercise and for increasing exercise endurance."

So the grounded function set is: **cognitive support (nervous system)** · **muscle function + maintenance** · **muscle-tissue recovery + metabolism after exercise** · **increased exercise endurance**. That is the whole verbatim palette. It reads as the classic "workout / recovery" amino acid.

### Angle B — the claim_text extras (attributed to Wallach, but NOT in the verbatim — flagged)
The same claim's `claim_text` adds three things the verbatim does **not** contain:
- **branched-chain amino acid** (the BCAA label);
- **"named for the plant valerian"** (etymology);
- the **sickle-cell mechanism**: in sickle-cell disease valine substitutes for the water-loving glutamic acid in hemoglobin, and because valine is water-repelling (hydrophobic) the hemoglobin is then more likely to aggregate.

The sickle-cell story is by far the most "wow" fact in the pack — but it is claim_text-only. At render, no matching Wallach **quote** exists for it in this pack (R3/verbatim contract). It cannot anchor a header beat until a fuller verbatim is mined. See §5.

### Angle C — inflammation (valine as a bit-part in a long protocol)
`WAL-CLM-LETS-000320` (protocol, lets-play-doctor ch10 materia medica). Inflammation treatment lists ~a dozen agents; the claim_text places **DL-valine at 1.5 g/day** alongside D-phenylalanine and L-tryptophan (each 1.5 g/day). BUT the supplied `verbatim` is **truncated at "zinc at 50 mg t.i.d"** — it never reaches valine at all. So neither valine's name nor its dose is verbatim-grounded here. Valine is a minor co-ingredient in someone else's protocol, not a valine story. (Every `interacts_with` entry — flavonoids, omega-3, phenylalanine, tryptophan, vitamin-c, vitamin-e, zinc — is simply a co-ingredient from this one inflammation list, not an independent interaction.)

### No deficiency signs
`deficiency_signs` is empty. There is nothing in the pack to build a "signs of shortage" beat from. Do not invent any.

---

## 2. Header concepts (1 honest minimal concept — the material supports no more)

### Concept 1 — "The recovery amino acid" ★ (and the only defensible one)
- **The hook.** Valine is the amino acid your muscles lean on to rebuild — it maintains muscle, drives recovery and metabolism after exercise, extends endurance, and supports the mind alongside it. One clean job, stated in one Wallach sentence.
- **Layout shape.** A single annotated figure, no beats-and-quote chassis. A muscle/effort motif with the four grounded functions as short labels radiating off it — or even simpler, one bold statement line + the verbatim beneath. Minimal by design; there is not enough material for sections.
- **Illustration (one idea).** One simple figure of effort-then-recovery (e.g. a single exertion curve that dips and returns), with four labels placed in the gaps — **maintains muscle · recovery after exercise · endurance · cognitive support**. Fewest elements; no stroke crosses any label.
- **Anchored by.** `WAL-CLM-EPIGEN-000058` **verbatim only** (cognitive support, muscle function + maintenance, post-exercise recovery + metabolism, exercise endurance). Nothing else.
- **Why it wows / best UX.** Honestly, it does not "wow" — it competently answers "what is this amino acid for?" from a single grounded sentence. That is the ceiling of what the pack supports. Its virtue is that it is 100% verbatim-true.

**Possible Worth-Knowing beat (NOT a header concept, flagged):** the sickle-cell substitution (`WAL-CLM-EPIGEN-000058` claim_text) is the most memorable fact valine has — but it is unverbatim'd here, so it cannot be a header beat with a quote until re-mined. If the header ever ships, park sickle-cell in Worth-Knowing *only* once a supporting verbatim exists.

*(No second, third, or fourth concept. Building them would mean inventing structure the two claims do not support, or leaning on unverbatim'd claim_text — both are the padding this exercise exists to avoid.)*

---

## 3. Proposed lede (PROPOSAL — Luneth ratifies)

Shipped selenium/copper cadence, but kept honest to the one grounded sentence:

1. *(lead — verbatim-safe)*
   > "The muscle-and-recovery amino acid — Wallach has it maintaining muscle, rebuilding tissue and restoring metabolism after exercise, and extending endurance, while supporting the nervous system's cognitive work alongside."
   Grounds: `WAL-CLM-EPIGEN-000058` verbatim (every clause is in the quote).

2. *(shorter)*
   > "One of the branched-chain amino acids — the one Wallach ties to muscle maintenance, post-exercise recovery, and staying-power under exertion."
   ⚠ Grounds "branched-chain" on `WAL-CLM-EPIGEN-000058` **claim_text**, which the verbatim omits. Use lede 1 unless the BCAA label is acceptable from claim_text.

---

## 4. Proposed "why this number" (PROPOSAL)

**There is no Wallach maintenance number for valine — an honest gap, not a value to paper over.**
`target.kind = dietary_with_clinical_lever`; `target.source` = "Wallach framework — no maintenance amount stated (honest gap; blueprint §7.1)."

Honest "why this number" copy:
> "Wallach states no daily maintenance amount for valine — the diet supplies it. The only dose he attaches to it is a therapeutic lever inside an inflammation protocol (DL-valine, part of a combined amino-acid dose), not a standalone daily target."

⚠ **Do not print the 1.5 g/day figure as valine's number.** It is claim_text-only in `WAL-CLM-LETS-000320`; the supplied verbatim is truncated before valine appears. Treat it as unverified until re-mined.

---

## 5. Gaps / flags + SOLO-vs-GROUP verdict

**Flags:**
- ⚠ **Best fact is unverbatim'd.** The sickle-cell substitution (`WAL-CLM-EPIGEN-000058`) — valine's one memorable, header-worthy fact — is in claim_text but not in the verbatim. So does the BCAA label and the valerian etymology. A header cannot quote them. This is the single biggest reason valine is thin: strip the unverbatim'd claim_text and one grounded sentence remains.
- ⚠ **Inflammation verbatim truncated before valine** (`WAL-CLM-LETS-000320`). Neither valine's name nor its 1.5 g/day dose is in the verbatim. The dose is unusable; the condition mapping rests on claim_text only.
- **No deficiency signs**, **no page/chapter on the protocol claim** (`null`), **`dose` null on both claims** (all figures live inside claim_text/verbatim → pull by claim ID at render, never hand-typed).

**SOLO-vs-GROUP verdict: TOO THIN — group it.**
Valine does **not** merit a bespoke solo header. Verbatim-grounded, it is one sentence about muscle, recovery, endurance, and cognition — a single minimal concept with no second angle, no deficiency material, no usable dose, and its most striking fact (sickle-cell) locked behind a missing verbatim. Forcing four concepts here would require inventing structure or promoting unverbatim'd claim_text — the exact defect this pass guards against.

**Recommended home:** fold valine into a **branched-chain / amino-acids group page** with its natural neighbours (the other BCAAs, and the other diet-supplied aminos that share the "no maintenance amount — clinical lever" situation, e.g. phenylalanine `WAL-CLM-LETS-000320`, tryptophan). On that group page valine carries exactly one honest line (its EPIGEN-000058 functions), and the sickle-cell fact can wait for a fuller verbatim. If a solo minimal header is nonetheless wanted, ship **Concept 1 only**, at minimal size, and label it minimal.

---

## 6. Recommended lead concept

**None strong enough for a solo header — group it.** If forced solo, use **Concept 1 "The recovery amino acid"** at minimal size, anchored entirely on the `WAL-CLM-EPIGEN-000058` verbatim (muscle maintenance · post-exercise recovery · endurance · cognitive support). One grounded sentence is the honest ceiling; the sickle-cell "wow" stays out until it has a verbatim.
