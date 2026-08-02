# Isoleucine — header research dossier
> status: RESEARCH (concepts only — NOT designed). 1 sealed claim (1 mechanism) · amino acid (green) · target: no Wallach maintenance amount stated (honest gap) · solo-header: **too-thin — group it**.

**Read this first: isoleucine is a one-claim element, and the one claim is pure biochemistry.** There is a single sealed mechanism claim (`WAL-CLM-EPIGEN-000049`) describing how isoleucine's carbon skeleton is metabolized. There is no dose, no condition, no deficiency sign, no protocol, no second book — nothing that gives a reader a reason to care or a designer an image to build around. This dossier's most important output is §5's verdict: **isoleucine cannot carry a bespoke solo header and should fold into a branched-chain / amino-acid-metabolism group.** Everything below is honest about that.

---

## 1. The material (grounded, by angle)

There is exactly **one** angle because there is exactly one claim.

### Angle A — the metabolic fate (the only content)
`WAL-CLM-EPIGEN-000049` (mechanism, epigenetics, ch18, p.636) states that isoleucine is **both a glucogenic and ketogenic amino acid**. The verbatim covers only the glucogenic half:

> "Isoleucine is both a glucogenic and ketogenic amino acid. Following transamination with alphaketogluterate, the carbon skeleton can be converted into Succinyl CoA, and then fed into the TCA cycle for oxidation, or converted into oxaloacetate for gluconeogenesis (ie, glucogenic)."

So the grounded palette is a single metabolic branch: **isoleucine → (transamination) → succinyl CoA → TCA/Krebs cycle for oxidation, OR → oxaloacetate → gluconeogenesis (glucose production).** The claim also asserts, in one word, that it is "ketogenic" — but the ketogenic pathway detail (acetyl CoA → ketone bodies / fatty acids) lives ONLY in the elaborated `claim_text`, **not** in the verbatim (see §5). Trust the verbatim: the header may say "both glucogenic and ketogenic" (those words are in the quote), but must not draw an acetyl-CoA-to-ketones pathway as if it were sourced.

That is the entire pack. No conditions treated, no symptoms, no deficiency signs, no interactions, no dose, no second claim.

---

## 2. Header concepts (1 — and it is thin)

The material honestly supports **one** concept, and even that is a biochemistry diagram with no human stakes attached. Presented as the single best minimal idea, with the thinness stated plainly.

### Concept 1 — "The fork in metabolism" (glucogenic ⇄ ketogenic) — minimal, only if a solo header is forced
- **The hook.** Isoleucine is a two-way fuel: the body can burn its carbon skeleton for energy or turn it into new glucose. Wallach files it among the amino acids that are *both* glucogenic and ketogenic.
- **Layout shape.** A single labelled node splitting once into two labelled destinations — a fork, not beats, not a quote chassis. The whole figure IS the one claim.
- **Illustration (one idea).** One node **isoleucine**, a transamination step, then a two-way fork: one arm to **succinyl CoA → Krebs cycle (burn for energy)**, one arm to **oxaloacetate → new glucose (gluconeogenesis)**. Fewest elements; route both arms so no stroke crosses a label. The word "ketogenic" can appear as a small tag on the node ("also ketogenic"), NOT as a third drawn pathway — because that pathway is not in the verbatim.
- **Anchored by.** `WAL-CLM-EPIGEN-000049` — every node/arm is a term in this one claim's verbatim (transamination, succinyl CoA, TCA cycle, oxaloacetate, gluconeogenesis).
- **Why it wows / best UX — honestly, it doesn't.** This is a clean diagram of an enzyme pathway with no consequence a reader can feel: no deficiency, no symptom, no "so what." It teaches a biochemistry fact, not a health decision. On the Coverage-as-a-map-of-gaps philosophy, isoleucine's page has no gap to surface and no lever to pull. As a solo header it would be the weakest on the board.

*(No second, third, or fourth concept exists. Inventing one would require pulling isoleucine facts from outside the pack — the exact cardinal-sin injection this system forbids. One claim = at most one honest concept.)*

---

## 3. Proposed lede (PROPOSAL — Luneth ratifies)

Only if isoleucine keeps a page at all, a single honest lede in the shipped voice, grounded strictly in the one claim:

> "A branched-chain amino acid the body can run two ways — burning its carbon skeleton for energy through the Krebs cycle, or rebuilding it into new glucose — which is why Wallach files it as both glucogenic and ketogenic."

Grounds: `WAL-CLM-EPIGEN-000049` (glucogenic + ketogenic; succinyl CoA → TCA cycle; oxaloacetate → gluconeogenesis). Note: "branched-chain" is a standard descriptor but is **not** stated in the verbatim — if that phrasing is not acceptable as generic category framing, replace with "an amino acid the body can run two ways." Do not add any biochemical claim beyond the one verbatim.

---

## 4. Proposed "why this number" (PROPOSAL)

**There is no number.** `target.kind = dietary_with_clinical_lever`; `target.source` = "Wallach framework — no maintenance amount stated (honest gap; blueprint §7.1)." The one claim is a mechanism claim and carries `dose: null`.

Honest "why this number" copy:

> "Wallach states no daily amount for isoleucine — the diet supplies it, and the corpus records only its metabolism, not a target dose. No maintenance figure is shown because none exists in the books (honest gap)."

**Do not fabricate a maintenance figure.** There is no dose anywhere in the pack.

---

## 5. Gaps / flags + SOLO-vs-GROUP verdict

**Flags:**
- ⚠ **`WAL-CLM-EPIGEN-000049` — claim_text extends past its verbatim.** The `claim_text` describes the ketogenic pathway ("its acetyl coenzyme A portion — which mammals cannot convert back to carbohydrate — is used to make ketone bodies or fatty acids") and calls isoleucine "hydrophobic." **None of that is in the verbatim**, which stops after the glucogenic branch. The verbatim DOES say "both a glucogenic and ketogenic amino acid," so the label is fair — but the acetyl-CoA/ketone-body/fatty-acid mechanism and "hydrophobic" must NOT be drawn or asserted as sourced. Trust the verbatim; flag the gap.
- **No dose, no condition, no symptom, no deficiency sign, no interaction, no protocol.** The pack is a single mechanism claim from a single book. A "signs of shortage," "conditions treated," or "daily target" beat has nothing to stand on. Do not invent any of them.
- `dose: null`; page/chapter present (epigenetics, ch18, p.636) — citation composes from `book_id` as usual.

**SOLO-vs-GROUP verdict: TOO THIN — group it.**
Isoleucine does not clear the bar for a bespoke solo header. It has one claim, no human stakes, and its single concept is an enzyme-pathway diagram with no deficiency, condition, or dose to make it matter to a reader. A solo header here would be padding by construction — the exact defect this research is meant to prevent.

**Recommended home:** fold isoleucine into a **branched-chain / amino-acid-metabolism concept page** alongside its natural neighbours. The tightest grouping is the other amino acids classified by metabolic fate in the same epigenetics ch18 material (glucogenic / ketogenic amino acids) — isoleucine becomes one labelled entry in a shared "how the body burns or rebuilds amino acids" figure, where the glucogenic/ketogenic fork is a *category* pattern rather than a lonely one-element diagram. If a leucine/valine (branched-chain) grouping exists or is planned, that is an even more natural home. Either way, the metabolic-fate fork earns its place as one node in a group figure, never as a standalone header.

---

## 6. Recommended lead concept

**None — too thin for a solo header. Group it.** Fold isoleucine into a branched-chain / amino-acid-metabolism concept page; its one grounded idea (the glucogenic ⇄ ketogenic fork, `WAL-CLM-EPIGEN-000049`) becomes a single labelled entry in that group's shared figure, not a bespoke header of its own.
