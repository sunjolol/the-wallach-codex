# Source-rule review — the 600 mg / 924 mg trace-rare coverage goal (RESOLVED: not a violation)

**Date:** 2026-07-12
**Trigger:** During the trace/rare-mineral coverage build, Claude raised `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]` on the proposed coverage goal, because its headline number (600 mg = 100%) is printed on a Youngevity product label ("Plant Derived Minerals™ = 600 mg per 1 fl oz serving"). §00.A / R2 forbids a Youngevity-derived *amount/target*; Youngevity may contribute *composition* only. An initial evidence sweep found no Wallach mg/day dose for colloidal minerals.

**Review:** Luneth asserted the goal IS Wallach-sourced — Wallach states the product delivers 100% of the daily need per serving. Verification against the sealed corpus confirmed it:
- `WAL-CLM-EPIGEN-000089` (Epigenetics, 2014, Ch.18): Wallach doses liquid plant-derived colloidal minerals at **1 fl oz per 100 lb of body weight per day** — a Wallach *dose* (the recommended amount).
- Corroborated in a second book — Let's Play Doctor (1995): "plant derived colloidal minerals at 1 oz per 100 pounds".
- The reference product's composition (Plant Derived Minerals™ = 600 mg solids per 1 fl oz serving) is read from the sealed Products pillar — **Youngevity composition**, which §00.A explicitly allows to feed the coverage math.

**Resolution — NOT a violation.** The *amount* (how much to take) is Wallach's (1 fl oz / 100 lb / day); the mg figure is that Wallach dose re-expressed in mg via product composition, exactly like the existing IU→mg conversions (Vitamin A/D/E) that re-express a Wallach amount in the product's unit. The goal derives as: Wallach dose (1 oz/100 lb) × reference-product composition (600 mg/serving, pillar) × 154 lb reference adult = **~924 mg/day = 100%**. It cites `WAL-CLM-EPIGEN-000089`. Therapeutic = 2× (Wallach's "double the base line" doctrine, Let's Play Doctor). **No override required** (this is not a Youngevity target; it is a Wallach dose measured via composition).

**Action taken:** `EPIGEN-000089` enriched with a structured `dose {1 fl oz / 100 lb / day}` and re-sealed (knowledge_version 324), so the goal traces to a sealed Wallach dose claim and can be gated by the R2-family recompute (Charter R2). Logged per the source-rule protocol requirement to record every triggered review.
