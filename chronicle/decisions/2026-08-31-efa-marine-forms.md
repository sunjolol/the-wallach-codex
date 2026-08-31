# Decision: the EFA meter counts the marine forms, converted against SALMON oil

_2026-08-31. The owner's ruling, prompted by his own question: "Why does none of the fish show up
under EFAs? I know for a fact Salmon has massive amounts as does other fish, EVEN ACCORDING TO
WALLACH."_

★ **HE WAS RIGHT, AND THE BOOKS BACK HIM IN THREE PLACES.** This file records what was wrong, what
his ruling changed, and the one thing a gate still cannot prove.

## The defect

The food EFA aggregate counted exactly two USDA nutrients: **1269** (PUFA 18:2, linoleic) and
**1270** (PUFA 18:3, linolenic), minus **1311** (CLA). **EPA (1278) and DHA (1272) were never
pulled into `eden/foods/extract/` at all** — 0 rows, verified against the extract's own bytes, not
inferred from the config.

Fish carry their omega-3 almost entirely as EPA and DHA. So:

| | before | after |
|---|---|---|
| Canned salmon, 3 oz | **1.5%** of Wallach's 9 g | **37%** |
| Herring, cooked | 4.5% | **69%** |
| Mackerel, cooked | 3.0% | **59%** |
| Sardines w/ bones | 5.2% | **49%** |
| Fish qualifying at the 7% bar | **2 of 25** | **19 of 25** |
| Foods qualifying overall | 64 of 250 | 83 of 250 |

**The two fish that did qualify — catfish and rainbow trout — qualified on their omega-SIX.** There
was no fish on the omega-3 list that was there for omega-3. Ahead of every one of them sat duck at
104%, ground turkey at 37% and **pork ribs at 36%**.

And the asymmetry that makes it indefensible: products feed the same meter in **oil mass read off
the label**, so `Omega™ 120 Softgels` was credited 1,000 mg and `ReVERSE!®` 2,000 mg, while the 3 oz
salmon serving carrying **1,075 mg of actual EPA+DHA** was credited 133 mg. **The app credited the
fish-oil capsule and refused the fish.**

The page argued against itself on one screen: its own hero panel reads *"One from plants. **Two from
the sea**"* and *"DHA — found mostly in seafood"*, and four cards down its own Q&A answered *"What
are the best sources of omega-3?"* with *"flaxseed oil and salmon oil."*

## What Wallach actually says — byte-exact from the sealed corpus

> "The salmon and other cold water fish in their diet provide rich sources of the essential fatty
> acids required by the liver to properly process cholesterol and prevent platelet clumping."
> — _Rare Earths: Forbidden Cures_ (1994), `WAL-CLM-RARE-000414`

> "Essential fatty acids are of great value and may be taken alternately as salmon oil and flaxseed
> oil at the rate of 5 grams t.i.d."
> — _Let's Play Doctor_ (1995), `WAL-CLM-LETS-000150`

> "Pay special attention to EFA, avoid as much of the polyunsaturated fatty acids as you can (other
> than the essentials— i.e. flaxseed oil and/or salmon oil)"
> — _Dead Doctors Don't Lie_ (2011), `WAL-CLM-DDDL-000161`

And in the **newest** of the seven books he still files the marine forms under omega-3:

> "Essential fatty acids include the linoleic, linolenic and arachadonic fatty acids, which are
> further divided into the Omega-3 (DHA and EPA), Omega-6, Omega-9, and cholesterol."
> — _Epigenetics_ (2014)

**There is no Wallach-versus-Wallach contradiction to arbitrate here.** The narrowing was ours.

### The reading that made the old model defensible, recorded so it is not re-litigated blind
_Epigenetics_ also says only two fatty acids are "classically regarded as essential" (ALA and LA),
and puts DHA in a **conditionally essential** group with arachidonic and gamma-linolenic acid. The
essential is titled "Omega-3 (Alpha-Linolenic Acid / ALA)". So counting 18:2/18:3 alone was a
faithful reading of *the two in the 90*. What was never defensible was doing it **silently**, under
a heading that says "Best food sources", on a page that tells the reader two of the three forms come
from the sea.

## The ruling

**Two reference oils, each converting the acids it actually carries, summed.**

```
  18:2 + 18:3 − CLA   →  FLAXSEED oil (fdc 167702, 67.695% LA+ALA)
  20:5 + 22:6         →  SALMON   oil (fdc 172343, 31.255% EPA+DHA)
  oil_equivalent_mg = plant share + marine share
```

Both fractions are **read from the pinned USDA archive at derive time, never typed**.

**Why not one oil.** Flaxseed oil reads **0.000 g of both 20:5 and 22:6** in that same archive, so
"grams of flaxseed oil" is not a currency a fish can be paid in. Wallach names salmon oil in the
same breath as flaxseed oil, at the identical dose, alternately — so a gram of one is a gram of the
other in his protocol, and each food converts against the one that carries its fat.

**Why the amounts are still 100% his.** Nothing here introduces a number of Wallach's. The
denominator is unchanged: 9 g from the sealed `WAL-CLM-DDDL-000115`. USDA supplies **composition**
only — what a food and an oil contain — which is exactly the role ruled admissible on 2026-08-21
(`chronicle/contradictions/2026-08-21-usda-food-composition-third-source.md`). Section 00.A's
subject is amounts, doses, targets and claims; a fatty-acid assay is none of those.

**DPA (22:5 n-3, USDA 1280) is deliberately excluded** from both the numerator and the salmon
denominator. Wallach names EPA and DHA. He never names DPA. Adding a form he does not name to a
meter measured against an amount he does would be widening his claim by inference — the silent guess
§00.A forbids. Salmon oil carries 2.991 g/100 g of it, so including it would move a fish by roughly
a tenth: **the reason to leave it out is the rule, not the size.**

**The approved flax asymmetry is preserved.** CLA is subtracted from a food's 18:2 but not from the
flaxseed reference (67.695%), because that is how the denominator read when it was approved. The
salmon reference carries no such history and is exactly its own 20:5 + 22:6.

## The gate, and its honest limit

`efa_marine_share_converts_against_salmon_oil` — **external**, critical. Board went 108 → **109**,
external 24 → **25**.

Five clauses: both oils recompute from the extract's own cells and may not be equal; every food's
`oil_equivalent_mg` equals its two shares, each reproducing from source at that food's grams; DPA
binds to nothing; and — the clause that matters — **the marine share is proven load-bearing by
existence**, because every other clause is satisfied by a marine share of exactly zero.

**That last clause was verified by re-breaking it, not by reasoning.** Stripping the 346 marine rows
out of the extract and re-deriving produced a **successful** derive (`OK ... 250 foods`) with every
marine term reading 0.0 — and clause (5) was the only thing that went red. Three further breaks
(zeroed shares rebalanced, marine converted against flax, salmon's fraction typed 10% off) were each
caught by clauses (3), (2) and (1).

★ **WHAT THE GATE CANNOT DO.** It proves the marine share exists, reproduces from the pinned source,
and uses salmon oil's own composition as its denominator. **It cannot prove salmon oil is the right
reference for a fish.** That is this ruling, off Wallach's own text — not a fact any gate can
establish.

## The standing lesson

The board was **108/108 green for the entire life of this defect**, and the two gates that recompute
the EFA arithmetic stayed green through the fix as well — because they are consistency gates, and
**a term that is not there is perfectly consistent with itself.** The same shape as the EFA group's
absence from `strength` (2026-08-22). Nothing measured this; a reader who knew fish did.
