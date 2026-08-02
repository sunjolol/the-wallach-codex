# Threonine — header research dossier
> status: RESEARCH (concepts only — NOT designed). 1 sealed claim · amino acid · target: no Wallach maintenance amount stated (honest gap). · solo-header: too-thin.

## 1. The material (grounded, by angle)

The pack holds exactly **one** sealed claim, and it is a biochemistry-definition claim, not a health/deficiency/dose claim.

**Angle — what threonine IS, structurally (the only grounded angle):** `WAL-CLM-EPIGEN-000055` (mechanism, epigenetics, ch18, p.640).
- **VERBATIM-backed facts** (trust these): threonine is an **alpha amino acid classified as polar**; its **codons are ACU, ACA, ACC, ACG**; together with **serine**, it is **one of only two proteinogenic amino acids that bear an alcohol group**.
- ★ **CLAIM_TEXT / VERBATIM MISMATCH — flag it.** The `claim_text` adds a whole metabolic cascade — "site for post-translational modification (glycosylation and phosphorylation by threonine kinase)," "converted to pyruvate via threonine dehydrogenase," "acetyl coenzyme A and glycine or alpha-ketobutyrate feeding into the succinyl-coenzyme A pathway." **NONE of that is in the sealed verbatim.** Per the grounding rules (trust the verbatim), those pathway statements are NOT usable as grounded facts for a header. Only the alcohol-group / polar / codon content survives.

**Everything else the pack reports is empty:** `deficiency_signs: []`, `conditions_treated: []`, `interacts_with: []`, `dose: null`, `target.kind: dietary_with_clinical_lever` with "no maintenance amount stated." There is no Wallach health stance, no deficiency picture, no protocol, no "why you need it" — nothing a health-dashboard header is built around.

## 2. Header concepts (honestly: at most ONE, and it is thin)

The material supports exactly one non-fabricated idea, and it is a textbook-fact, not a health story.

### Concept A — "The alcohol-group twin" (the ONLY honest idea, and it is thin)
- **The hook:** Of the twenty amino acids that build every protein, only two carry an alcohol group — threonine and serine. That chemical handle is what lets the cell decorate and switch proteins.
- **Layout shape:** a minimal two-tile pairing (threonine ↔ serine) with the shared —OH handle called out once. Not the chassis; no beats, no big stat, no quote — there is no quote-worthy or number-worthy material to hang them on.
- **Illustration (one idea):** two amino-acid tiles side by side, a single highlighted **—OH** group shared between them, labelled "one of only 2 that bear an alcohol group." Fewest elements; no stroke through any label.
- **Anchored by:** `WAL-CLM-EPIGEN-000055` — "one of only two proteinogenic amino acids that bear an alcohol group" (+ codons ACU/ACA/ACC/ACG if a detail row is wanted). Nothing else is verbatim-grounded.
- **Why it wows / best UX:** honestly, it does **not** wow. It is a true, tidy fact with no consequence attached — no deficiency, no dose, no Wallach clinical claim. It reads as a chemistry footnote, which is the correct read of what the pack contains.

No second, third, or fourth concept exists that is not either (a) a rewording of Concept A or (b) built on the un-verbatim'd metabolic cascade in `claim_text`, which the grounding rules forbid. I am deliberately not inventing them.

## 3. Proposed lede (PROPOSAL — Luneth ratifies)

Grounded, in the shipped voice, but honestly short:
- "One of only two protein-building amino acids that carry an alcohol group — the chemical handle a cell uses to decorate and switch its proteins — paired with serine." (all from `WAL-CLM-EPIGEN-000055`, verbatim portion only)

A more honest single line acknowledging the thinness: "A polar amino acid Wallach names only in passing — one of just two, with serine, bearing an alcohol group; the corpus records no dose, deficiency, or condition for it." (`WAL-CLM-EPIGEN-000055`)

## 4. Proposed "why this number" (PROPOSAL)

**No number exists.** `target.kind` is `dietary_with_clinical_lever` and `target.source` is explicitly "no maintenance amount stated (honest gap; blueprint §7.1)." `dose` on the single claim is `null`. There is nothing to provenance. The "why this number" slot should state the honest gap: **no Wallach maintenance amount stated for threonine.** Do NOT fabricate one.

## 5. Gaps / flags + SOLO-vs-GROUP verdict

- **Thinness: extreme.** One claim, and it is a definitional/biochemistry claim, not a health claim.
- **Verbatim mismatch flagged** (see §1): the entire metabolic-pathway portion of `claim_text` is absent from the sealed verbatim and is therefore unusable — the header cannot lean on pyruvate / threonine dehydrogenase / acetyl-CoA / succinyl-CoA / glycosylation / phosphorylation.
- **No deficiency, no condition, no interaction, no dose.** A bespoke solo header for the 90 essentials is built to answer "why does this matter to me, and how much" — threonine's pack answers neither.
- **VERDICT: TOO THIN for a solo bespoke header.** It should be a **minimal header** at most, or — better — **fold into an amino-acids group / concept page** alongside the other individually-thin proteinogenic amino acids (the "amino acids are canon essentials" set: threonine, lysine, tryptophan, arginine, etc.). The one honest fact (threonine + serine = the two alcohol-group amino acids) is naturally a *shared* fact that belongs in a group treatment, not a solo page. Grouping is the right home precisely because the single grounded fact is about a PAIR.

## 6. Recommended lead concept

**None as a solo header — group it.** If forced to stand alone, Concept A ("the alcohol-group twin," `WAL-CLM-EPIGEN-000055`) is the only non-fabricated option, but the right call is to fold threonine into an **amino-acids group/concept page**, where "one of only two amino acids bearing an alcohol group" becomes a shared threonine↔serine note rather than a strained solo header.
