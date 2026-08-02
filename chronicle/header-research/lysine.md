# Lysine — header research dossier
> status: RESEARCH (concepts only — NOT designed). 4 sealed claims · amino acid · target: no Wallach maintenance amount stated (honest gap; dietary_with_clinical_lever) · solo-header: marginal.

## 1. The material (grounded, by angle)

Four sealed claims, two books. Two of them carry a genuinely lysine-specific idea; two are stack appearances where lysine is one line in a longer protocol.

**Angle A — Collagen/elastin crosslinking → vessel-wall integrity** (`WAL-CLM-EPIGEN-000051`, epigenetics ch18, p.636).
The claim_text describes a mechanism: lysine → its derivative **allysine** → the enzyme **lysyl oxidase** (which needs a **copper** cofactor) forms the **crosslinks** that stabilize collagen and elastin. The stated outcome: lysine consumption contributes to prevention and repair of **spider veins, varicose veins, hemorrhoids, and aneurysms**.
- ★ **VERBATIM MISMATCH — flag.** The sealed verbatim only supports the *outcome*: "Lysine consumption contributes to the prevention and repair of spider veins, varicose veins, hemorrhoids, and aneurysms." The whole mechanism chain (allysine, lysyl oxidase, copper cofactor, crosslinks) is in `claim_text` but is **NOT in the verbatim**. Per the grounding rule (trust the verbatim), the safe, quotable fact is the outcome list; the mechanism is unverified against the source and must not be presented as a Wallach quote or a load-bearing anchor.

**Angle B — The lysine/arginine antagonism for herpes & cold sores** (`WAL-CLM-LETS-000299`, Let's Play Doctor ch10).
The most lysine-distinctive claim, and the only one with a lysine-specific dose AND a dietary lever:
- **Eat high-lysine foods:** meat, potatoes, milk, yeast, fish, chicken, beans, eggs.
- **Avoid high-arginine foods:** chocolate, peanuts, nuts, seeds, grains.
- **L-lysine at 1–6 g/day to effect, then 500 mg/day maintenance.**
- Verbatim confirms "1-Lysine at 1-6 gm/day to effect, then 500 mg/day maintenance" alongside bioflavonoids 200 mg t.i.d., zinc 75 mg t.i.d., ribavirin, isoprinosine, and a black-walnut compress. Covers Type I (cold sores) and Type II; "once infected, always infected," goal is long-term remission.

**Angle C — Supporting role in condition stacks** (two claims, lysine is one line):
- Canker sores (`WAL-CLM-LETS-000202`): **lysine at 1,500 mg/day** inside a stack (zinc 50 mg t.i.d., vitamin E 800–1,200 IU, B-complex 50 mg each t.i.d., vitamin A 300,000 IU as beta carotene).
- Kidney disease/stones (`WAL-CLM-LETS-000332`): "lysine and glutamic acid" named with **no lysine dose**, inside a large calcium/magnesium/A/B-6/herb protocol.

**Cross-cutting:** every lysine appearance is therapeutic (a lever pulled against a named condition), never a daily-maintenance essential with a stated target. There are no `deficiency_signs` in the pack and no `target` number. Conditions treated span the two real angles: vascular (varicose_veins, hemorrhoids, aneurysm) and viral/oral (herpes_simplex, cold_sores, canker_sores), plus kidney_stones.

## 2. Header concepts (2 the material honestly supports)

### Concept 1 — "The amino acid arginine fears" (lysine vs arginine)
- **The hook:** herpes and cold sores feed on arginine and starve on lysine. Wallach's lever is a two-sided food swap plus a dose that ramps to effect then settles to maintenance — the clearest, most human "do this / not that" in the whole pack.
- **Layout shape:** a two-column food split — a **LYSINE (eat)** side vs an **ARGININE (avoid)** side — with the dose ramp as a small caption strip beneath, not a chart. No beats-1-2-3, no pull quote required.
- **Illustration (one idea):** two facing food-list panels. Left, green/eat: meat · potatoes · milk · yeast · fish · chicken · beans · eggs. Right, muted/avoid: chocolate · peanuts · nuts · seeds · grains. One divider line between them; nothing crosses a label. Beneath: a single quiet line "1–6 g to effect → 500 mg to hold." That is the entire figure.
- **Anchored by:** `WAL-CLM-LETS-000299` — high-lysine foods list, high-arginine avoid list, "1–6 gm/day to effect, then 500 mg/day maintenance" (all present in the verbatim).
- **Why it wows / best UX:** it is instantly actionable, needs zero mechanism the verbatim can't back, and the eat/avoid split is a genuinely bespoke shape (not the chassis). A reader learns something usable in three seconds.

### Concept 2 — "The thread that holds vessels together" (collagen crosslinking)
- **The hook:** the same amino acid that Wallach ties to repairing spider veins, varicose veins, hemorrhoids, and aneurysms — four failures of the vessel wall, one building block.
- **Layout shape:** an outcome-led block — a single annotated figure of a vessel/vein wall with the four named repair targets, and the lede carrying the "building block" idea. NO mechanism diagram (the mechanism is verbatim-unsupported).
- **Illustration (one idea):** a simple cross-section or run of a vein wall, with four small labels pointing to the conditions lysine is credited with helping (spider veins, varicose veins, hemorrhoids, aneurysms). One figure, four labels routed clear of any stroke.
- **Anchored by:** `WAL-CLM-EPIGEN-000051` — outcome list ONLY (the verbatim-safe part). ★ Do NOT anchor the allysine/lysyl-oxidase/copper mechanism here; it is claim_text-only and fails the verbatim test.
- **Why it wows / best UX:** it unifies four scattered conditions under one cause, which is the satisfying "aha." Weaker than Concept 1 because the interesting part (the mechanism) is exactly the part we can't quote, so the figure risks being a bare list of conditions.

*(Not proposed as concepts: the canker-sores and kidney-stones claims — lysine is one supporting line in a multi-nutrient stack there, with no distinct lysine idea. They belong in "The Full Record," not the header.)*

## 3. Proposed lede (PROPOSAL — Luneth ratifies)

Leaning into Concept 1 (the stronger, more bespoke angle), in the shipped voice:

1. "The amino acid the herpes and cold-sore virus starves on — Wallach's lever is a food swap: load up on lysine, cut the arginine, and dose to effect." *(anchor: `WAL-CLM-LETS-000299`)*

2. (Concept 2 flavour) "A building block of collagen and elastin — the same amino acid Wallach credits with repairing spider veins, varicose veins, hemorrhoids, and even aneurysms." *(anchor: `WAL-CLM-EPIGEN-000051`, outcome only)*

Honest note: lysine is presented as a **therapeutic lever**, not a daily essential, so the lede should read as "what it treats," not "what you're deficient in."

## 4. Proposed "why this number" (PROPOSAL)

**No Wallach maintenance amount stated — honest gap.** `target.kind` is `dietary_with_clinical_lever`; the pack carries no daily maintenance target for lysine. The only numbers in the pack are condition-specific therapeutic doses, not a daily floor:
- herpes/cold sores: 1–6 g/day to effect, then 500 mg/day maintenance (`WAL-CLM-LETS-000299`)
- canker sores: 1,500 mg/day (`WAL-CLM-LETS-000202`)
- kidney stones: named, no dose (`WAL-CLM-LETS-000332`)

The "why this number" slot should honestly say there is no Wallach daily target for lysine — it is a clinical lever, dosed against a condition — and, if a number is shown at all, it should be labelled as the herpes-protocol therapeutic dose, not a maintenance amount. Do NOT fabricate a daily target.

## 5. Gaps / flags + SOLO-vs-GROUP verdict

**Flags:**
- ★ **Verbatim mismatch on `WAL-CLM-EPIGEN-000051`:** the allysine → lysyl oxidase → copper → crosslink mechanism is claim_text-only, absent from the verbatim. The verbatim supports only the outcome list. This guts Concept 2's most interesting content — the mechanism can't be quoted or made load-bearing.
- **No target, no deficiency signs:** lysine is a lever, not a maintenance essential in this pack. There is no "daily number" story to tell.
- **Half the pack is stack-appearances:** 2 of 4 claims (canker sores, kidney stones) have no distinct lysine idea; lysine is one line among many nutrients.

**Verdict: MARGINAL solo header.** There is exactly ONE genuinely compelling, fully verbatim-backed bespoke concept (Concept 1, lysine/arginine food swap). Concept 2 is real but weakened by the verbatim mismatch. Two of four claims are filler-for-a-header. That is enough for a *minimal* bespoke header built entirely around the lysine/arginine swap — but not enough for a rich multi-section header, and forcing one would require padding the mechanism we cannot quote (a defect).

**If not solo:** fold into an **amino-acids concept page** (with arginine, tryptophan, glutamic-acid, etc. — the canon amino-acid essentials). Lysine's arginine antagonism and its collagen role both sit naturally in a shared amino-acid group, and grouping avoids stretching 1.5 concepts into a full solo screen.

## 6. Recommended lead concept

**Concept 1 — the lysine-vs-arginine food swap.** It is the only lysine idea that is distinctive, immediately actionable, fully backed by the verbatim, and carries its own dose — the single strongest thing the pack offers. Build the header (minimal, one eat/avoid figure) around it, or make it the lysine section of an amino-acids group page.
