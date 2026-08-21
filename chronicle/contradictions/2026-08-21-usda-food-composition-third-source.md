# 2026-08-21 — Admitting an outside food-composition table as a third source

**Status: RAISED, awaiting the turn-gap. Not approved, not implemented.**
Triggered by: Luneth, 2026-08-21, choosing "Quantitative — admit USDA composition" when asked what
shape the foods recommender should take.
Flag tag issued in chat: `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]`.

## In plain terms

Luneth wants the app to recommend foods, not just products — foods ranked by how much of a remaining
gap each one actually closes, so a new user can cover all 90 from a handful of recommendations. That
needs a number for how much of nutrient X is in one serving of food Y.

That number exists nowhere in this project and cannot be produced from the sealed sources. So the
proposal is to bring in an outside food-composition table (USDA FoodData Central or equivalent) and
let it supply those numbers — on the same footing Youngevity composition already occupies.

The reason this stops here: the allowlist is written closed, and its composition clause names
Youngevity specifically. A third composition source is not in it, however reasonable it is.

## The proposal

Admit an outside per-food nutrient-composition table as a **composition-only** source: valid for what
a food *contains*, never for what anyone *should take*. Every target stays Wallach's. The food number
would be a numerator measured against a Wallach denominator — the same arithmetic role a Youngevity
label already plays.

Scope requested: enough foods to close the 90, ranked, appearing beside recommended products on both
the Regimen and Coverage tabs.

## The rule it conflicts with

`.claude/skills/wallach-source-rule/SKILL.md`, **The allowlist**, verbatim:

> A source is valid only if it is one of:
> 1. **A Wallach book**, with year. [...]
> 2. **A Youngevity primary** (label, official product page, official statement) — token `ygy` —
>    **valid for product COMPOSITION only.** What a product contains. Never a recommended amount.

"Valid only if it is one of" is closed. USDA food composition is neither 1 nor 2.

Note what the **Not allowed** list does and does not say. It names *"USDA RDI/DRI/DV"* — reference
**intakes**, i.e. targets. It does not name USDA food **composition**. That asymmetry is the whole
argument for this being inside the existing spirit, and it is exactly why it must not be resolved
quietly: absence from the prohibition is not presence in a closed allowlist.

## Why it is genuinely arguable (the strongest case for it)

1. It adds no target. Composition is a numerator; §00.A's subject is amounts, doses, ranges, daily
   targets, deficiency signs and health claims. None of those would come from USDA.
2. Youngevity composition already occupies precisely this role, and the rule permits it *because*
   composition is not a target.
3. Wallach's own food figures are unusable: of 77 sealed `food_source` claims, **zero** carry a dose
   object; only 13 of the 90 essentials are named by any of them; and a direct regex probe of all
   seven book `.txt` sources (~5.7M chars) found approximately **one** genuine food-to-amount
   datapoint. The honest gap here is total. No mining campaign closes it.
4. The owner has already ruled food-first (2026-08-10 recommendation ladder, step 1), and eight
   essentials already ship user-approved food notes in `entity-copy.json`.

## Why it is still a breach (the strongest case against)

1. The allowlist is closed and names Youngevity by name. Reading a second composition source into it
   is an amendment, not an interpretation.
2. **"Retired and now poison"** in the same skill: deriving a target by summing Youngevity labels at
   a stated serving count. The failure mode was composition quietly acquiring authority it was never
   granted. A food table ranked, sorted and displayed as "this closes your gap" is the same drift
   with a different supplier.
3. **No gate can see it.** `amounts_wallach_only` reads `essentials-targets-data.json` and audits 37
   of 91 targets. A food *numerator* changes a tile's verdict without touching any target, so the
   entire §00.A gate family is structurally blind to a wrong food number. A green board would bless
   it — the mineral-tiers failure mode named in CLAUDE.md, at larger scale.
4. Scale: ~100–300 foods × ~35 quantified fields is roughly 3,500–10,500 numbers, none of them
   Wallach's, shipped under an app whose entire premise is that its numbers are his.
5. Silent-green hazard: 18 tiles cover on the mere **presence** of a source, with no amount compared
   (`state/coverage.ts:751,767`). Foods entering as regimen sources would flip those green without a
   single number being checked — a §00.A-relevant outcome through a non-numeric path.

## Precedent

- **2026-07-19 — government RDA for unlisted nutrients.** Same shape, and the closest match on file.
  It stopped at step 1; the phrase `APPROVE SOURCE-RULE OVERRIDE` was never given, and a
  non-breaching alternative was taken instead. Luneth's own words there: *"This is not permission to
  do it elsewhere, these should be handled on a decision-by-decision basis."*
- **2026-07-24 — digestive-enzymes non-Wallach sentence.** Also withdrawn in favour of a
  non-breaching formulation. The containment gate was deliberately **not** built so that the
  exception would not look available.
- **2026-08-08 — the USDA richest-foods table.** A USDA per-food nutrient table was already built
  once, at Luneth's request. Permitted only as: demo-only, nothing shipped, labelled loud as
  REFERENCE-not-Wallach, anchored to a Wallach target, and never a ranking or coverage input. That is
  the current ceiling of what has been allowed, and this proposal exceeds it on every axis.
- **The project has never completed a source-rule override.** Two proposed, two withdrawn. In both
  cases the winning move was found by looking harder for a formulation that did not breach.

## What would have to be true for this to be safe

Not a decision for Claude; recorded so the ruling can be made with the cost visible.

1. A purpose-built gate, since no existing one can see this. The working model is
   `eden/tools/orac_foods_derive.py`: every number a byte-exact join key into its source, one home
   per value, the curation file numbers-free.
2. A provenance token distinct from `ygy` and from Wallach, surfaced in the UI wherever a food number
   appears — not a footnote.
3. A ruling on whether food delivery **counts toward coverage** or is **display-only**. The
   2026-08-08 precedent was display-only; this proposal is not.
4. A ruling on the 18 presence-covered tiles, which need no number to turn green.
5. Reconciliation with `scanner-corpus-data.json`'s 26-entry `dietaryBaseline` — already a set of
   unsourced non-Wallach dietary numbers subtracted from Wallach targets in shipped code. Two
   hand-maintained homes for "how much of X a normal diet supplies" is Charter R3's exact
   prohibition, and that baseline's own provenance is currently unstated.

## Protocol state

- [x] **Turn 1** — surfaced in chat tagged `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]`, breach and
      precedent named. 2026-08-21.
- [ ] **Turn 2** — a *later* turn: Luneth confirms he understands the rule, the breach and the
      precedent. The turn gap is mandatory and cannot be collapsed.
- [ ] **Turn 3** — Luneth gives the exact phrase `APPROVE SOURCE-RULE OVERRIDE`. Nothing else counts
      — not "yes", not "go ahead", not "approved", and not a menu selection.

Until turn 3, no food composition number is acquired, staged, derived, or rendered. The unblocked
dashboard work (goal merge, recommender pins and caps, scanner manual-add) proceeds independently and
is not gated on this.
