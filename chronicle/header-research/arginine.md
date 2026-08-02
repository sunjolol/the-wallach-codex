# Arginine — header research dossier

> status: RESEARCH (concepts only — NOT designed). 6 sealed claims (effectively ~4 distinct: the headline stance is stated twice) · amino acid (green) · target: no Wallach maintenance amount — honest gap; appears only as a clinical-lever protocol dose (300–500 mg) · solo-header: **marginal**.

## 1. The material (grounded, by angle)

**Angle A — Wallach's addition to the essential list (the signature stance).** This is the one genuinely arginine-centric, memorable claim, and he makes it twice.
- `WAL-CLM-IMMORT-000058` (definition, *Immortality* p113): "To the classic list of essential amino acids, we would add arginine, taurine, and tyrosine. Over the long haul, these three amino acids help prevent certain specific diseases" — arginine → **cancer and PAD** (peripheral arterial disease, clogged limb arteries), taurine → macular degeneration, tyrosine → goiter.
- `WAL-CLM-DDDL-000066` (quote, *DDDL* 2011): the same stance in the first person — "To the classic list of essential amino acids, I would add arginine, taurine, and tyrosine… Respectively, those diseases are cancer, macular degeneration, and goiter." NOTE: this DDDL version ties arginine to **cancer** only and omits PAD; the *Immortality* version adds PAD. Favor the fuller/newer Immortality reading (cancer **and** PAD) for placement, keep both.

**Angle B — Mechanism / what it does (RESTS ON A VERBATIM MISMATCH — read §5).**
- `WAL-CLM-EPIGEN-000047` (mechanism, *Epigenetics* Ch18 p634): claim_text says arginine is "required for complete cell division, wound healing, the excretion of ammonia, immune support, and the synthesis of nitric oxide," that supplementing makes more ATP available, and that oral arginine "reduces healing time after trauma (especially bone trauma), lowers blood pressure, and increases blood flow through obstructed blood vessels"; also an 8% arginine toothpaste for dental pain, and arginine "with proanthocyanidines or yohimbine for erectile dysfunction." **The sealed verbatim covers ONLY the last item** — "Arginine is commonly employed concurrently with proanthocyanidines or yohimbine for the relief of erectile dysfunction." Everything else in Angle B is claim_text with no supporting verbatim in this pack.

**Angle C — Protocol bit-part (arginine is one ingredient among ~10).** Not arginine-centric, but this is where the only numbers live.
- `WAL-CLM-DDDL-000070` (protocol, infertility): L-arginine **500 mg three times daily** (with EFA, zinc, selenium 250 mcg, vit A, germanium).
- `WAL-CLM-LETS-000319` (protocol, dedicated infertility entry): L-arginine **500 mg three times daily**; Wallach reports "curing several hundred cases" of infertility by supplementation.
- `WAL-CLM-LETS-000207` (protocol, cataracts): L-arginine **300 mg per day** among ~13 ingredients.
- ED use (`WAL-CLM-EPIGEN-000047`, the one verbatim-backed clause): arginine paired with proanthocyanidines or yohimbine.

## 2. Header concepts (2 the material honestly supports)

### Concept 1 — "The one he added to the list"
- **The hook.** The classic essential amino acids are a fixed, textbook set. Wallach appends three of his own — and arginine is the one he ties to the two heaviest diseases on that short list: cancer, and the clogged limb arteries of PAD.
- **Layout shape.** An annotated list/roster, not beats. The canonical essential-amino-acid set rendered as a settled column, then three names added below the line — arginine pulled forward/emphasised, taurine and tyrosine present but quiet — each added name carrying its one tied disease as a tag.
- **Illustration (one idea).** A single ruled "official list" with an added row below the rule; arginine's row is the only one drawn in full weight, its tag reading `cancer · PAD`. No connectors crossing labels — the disease tag sits to the right of its own row, never a line through a name.
- **Anchored by.** `WAL-CLM-IMMORT-000058` (arginine → cancer + PAD; taurine → macular degeneration; tyrosine → goiter) + `WAL-CLM-DDDL-000066` (the stance restated, cancer). Quote candidate: "To the classic list of essential amino acids, we would add arginine, taurine, and tyrosine."
- **Why it wows / best UX.** It is the ONE thing about arginine a reader will remember: a Wallach-specific, contrarian stance ("the textbook list is incomplete"). It also cross-sells taurine and tyrosine, so it doubles as the natural landing block if those three ever share a concept page.

### Concept 2 — "Flow through a blocked vessel"
- **The hook.** Why would an amino acid guard against *clogged* arteries? Because Wallach has it opening blood flow through obstructed vessels — the same PAD it is named against.
- **Layout shape.** A single before/after figure, no beats, one caption. The mechanism (nitric oxide → flow) is the whole point; make it explicit and land on it.
- **Illustration (one idea).** One vessel cross-section: narrowed/obstructed on the left, flow restored on the right, a single labelled arrow of flow. Route the arrow *around* the labels, never through the word "obstructed" or "flow" (the #1 rejection cause).
- **Anchored by.** `WAL-CLM-EPIGEN-000047` — "increases blood flow through obstructed blood vessels," "synthesis of nitric oxide," "lowers blood pressure" — tied to the PAD naming in `WAL-CLM-IMMORT-000058`.
- **Why it wows / best UX.** It turns the abstract "guards against PAD" into a concrete picture and closes the loop with Concept 1. **BUT** it is built on claim_text that this pack's verbatim does not support (§5). Do not build it until the mechanism verbatim is confirmed.

*(No third concept. The protocols — Angle C — are arginine-as-ingredient, not arginine-as-subject; forcing them into a header block would be padding. Their doses belong in "why this number," not a concept.)*

## 3. Proposed lede (PROPOSAL — Luneth ratifies)

- **Primary:** "One of three amino acids Wallach adds to the classic essential list — he ties it to two diseases in particular, cancer and the clogged limb arteries of peripheral arterial disease, the same vessels its nitric-oxide pathway is meant to reopen." *(grounds: `WAL-CLM-IMMORT-000058` for the stance + cancer/PAD; the nitric-oxide/flow clause rests on `WAL-CLM-EPIGEN-000047` — see §5 flag.)*
- **Safer alternative (verbatim-clean, no mechanism claim):** "An amino acid Wallach doesn't think the textbook list is complete without — he adds arginine to the classic essentials and ties it, over the long haul, to cancer and peripheral arterial disease." *(grounds: `WAL-CLM-IMMORT-000058`, `WAL-CLM-DDDL-000066` only.)*

## 4. Proposed "why this number" (PROPOSAL)

**No Wallach maintenance amount is stated — honest gap (target.kind = `dietary_with_clinical_lever`, blueprint §7.1).** There is no daily target to explain. Arginine appears only as a *clinical-lever* dose inside disease protocols, and those should be presented as such, never as a maintenance number:
- Infertility: **L-arginine 500 mg three times daily** (`WAL-CLM-DDDL-000070`, `WAL-CLM-LETS-000319`).
- Cataracts: **L-arginine 300 mg per day** (`WAL-CLM-LETS-000207`).

Honest framing for the tip: "Wallach states no daily maintenance amount for arginine. It surfaces only inside specific protocols — 500 mg three times a day for infertility, 300 mg a day in his cataract formula."

## 5. Gaps / flags + SOLO-vs-GROUP verdict

**FLAG 1 — verbatim mismatch on the mechanism claim (the important one).** `WAL-CLM-EPIGEN-000047`'s claim_text carries a rich mechanism list (cell division, wound/bone healing, ammonia excretion, immune support, nitric oxide, ATP, blood-pressure lowering, blood flow through obstructed vessels, 8% arginine toothpaste). The sealed verbatim in this pack supports **only** the ED clause. Per the grounding rule, trust the verbatim: the mechanism content is not verbatim-anchored here. Concept 2 and the "nitric-oxide" clause of the primary lede depend on it — hold both until the fuller Epigenetics p634 verbatim is confirmed against the source image. This is exactly the claim_text-richer-than-verbatim pattern that must be flagged, not silently used.

**FLAG 2 — DDDL vs Immortality disagreement.** `WAL-CLM-DDDL-000066` ties arginine to cancer + (via taurine/tyrosine) macular degeneration + goiter, omitting PAD; `WAL-CLM-IMMORT-000058` adds PAD to arginine. Use the fuller Immortality reading (cancer **and** PAD), keep both — noted, not silently reconciled.

**FLAG 3 — the numbers live only in protocols.** There is no maintenance target and no deficiency sign in the pack (`deficiency_signs: []`). The header cannot show a "daily target" the way selenium/copper do.

**SOLO-vs-GROUP verdict: MARGINAL.** Only Angle A is genuinely arginine-centric, and it is a strong, distinctive, memorable Wallach stance — enough to carry a *lean* solo header (Concept 1 alone, no beats, no big number). But strip Concept 2 (verbatim-blocked) and the protocols (bit-part), and there is exactly one real idea. Two honest paths:
- **Solo, minimal:** ship Concept 1 as a compact annotated-list header, no invented mechanism, no fabricated number. Legitimate but thin.
- **Group (recommended if taurine + tyrosine are also thin):** the headline claim literally bundles **arginine + taurine + tyrosine** as "the three Wallach adds to the essential list," each with its own tied disease (cancer/PAD · macular degeneration · goiter). That is a natural, fully-grounded concept page — "The three he added" — and it solves all three thin elements at once. Check taurine and tyrosine's packs before deciding; if either can stand alone, keep arginine solo-minimal.

## 6. Recommended lead concept

**Concept 1 — "The one he added to the list."** It is the single distinctive, verbatim-clean, memorable thing about arginine in the corpus, and it degrades gracefully: strong as a solo-minimal header, and it is the exact landing block if arginine instead folds into a shared "three amino acids Wallach added" group with taurine and tyrosine.
