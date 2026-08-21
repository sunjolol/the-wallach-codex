# The Youngevity Product DB (`eden/products/`) — Pillar 2

Sealed, hand-built COMPOSITION source for every Youngevity product. Pure label facts.
Built from the authoritative Youngevity label images and the saved product listing, both
kept as working files outside the repo. Every record here was read off its label image.

## §00.A boundary — why the pillar is split the way it is
- **Composition is the ONLY thing here.** An `amount` is what a product CONTAINS,
  never a recommended amount or target. Wallach defines targets; YGY defines composition;
  the coverage math sums composition against Wallach targets.
- **No prose, no Wallach claims, no YGY marketing** in `products.json`. The single long
  free-text token allowed anywhere in the pillar is a blend's bounded `as_labeled`.
- Prices live in `prices.json` (`source: ygy`), quarantined from composition. The YGY
  marketing description was stripped out and a gate blocks the price join from re-importing
  it. Prices feed product display, offline search, and the cost-per-nutrient recommender's
  value term — **never the coverage math**, which is price-blind by construction.

## Files
- `products.json` — composition, keyed by `product_id`. SEALED at completion (`*.golden.sha256`).
- `prices.json` — VOLATILE sidecar (retail/wholesale + BV/QV), keyed by `ygy_id`.
  Generated from the saved listing manifest; NOT sealed (prices drift). Joins to `products.json` by `ygy_id`.
- `warnings.json` — VOLATILE sidecar: label warnings (contraindications / cautions)
  hand-extracted from the label images, keyed by `ygy_id`. NOT sealed, and **not consumed by
  any surface, generator, or gate today** — it is captured label data held for a future
  product-safety surface.

## Record schema (`products.json`)
```
product_id · name · sku · ygy_id · variants[]? · additional_labels[]? · components[]
  variant: sku · ygy_id · name · form · source_label  ← a SIBLING sku sharing this EXACT formula
           (30-count box, 4-pack, …). ONE record per formula, not per sku; a sku whose formula
           DIFFERS gets its OWN record, not a variant (e.g. BTT 2.0 CPF canister vs box).
  additional_labels[]: label filenames for the SAME sku (older/regional) kept for provenance, not re-extracted
  component: role? · form · serving_size · servings_per_container · directions?
             · macros{} · nutrients[] · blends[] · other_ingredients[] · source_label
    nutrient (quantified): name · form? · amount · unit · unit_detail?(RAE/NE/DFE)
             · label_iu? · pct_dv          ← pct_dv is an FDA Daily Value, NOT a target
    blend: name · total{amount,unit}|null · total_cfu{amount,unit}? · pct_dv? · as_labeled(bounded fidelity) · ingredients[]
      ingredient: pos · name · part? · form? · latin? · standardization? · amount? · unit?
             · sub_ingredients[]           ← array ORDER = label order = descending amount (FDA)
```
Probiotic potency (CFU) is a quantified amount so items are comparable: per-strain CFU lives in an
ingredient `amount`+`unit` (`billion CFU` / `million CFU`); a blend's stated total lives in `total_cfu`.
Strain/culture codes stay in `standardization`; the full label wording stays in `as_labeled`.

## Registry
Every ingredient/nutrient resolves to the Catalog nutrient/botanical registry
(`catalog/nutrients.json`). Essentials map to the 91 (feed the cost-per-nutrient
coverage math for ALL 91); botanicals/actives get their own entries (power blend/ingredient
search). Backs the substance half of `references_resolve` (live).

## Enforcement

A rule with a machine gate is named LIVE here; a rule without one is named WISH. Nothing in
between.

**LIVE**
- `products_verify` (`eden/tools/products_verify.py`) — record structure + PROSE CONTAINMENT.
- `products_hash_integrity` + golden sha256 — Eden's wall; the scanner and the user can never
  write this pillar.
- `prose_contained`, extended to cover this pillar.
- `references_resolve` — every ingredient/nutrient slug must be registered in the Catalog.
- `derived_artifacts_fresh` — the MANIFEST freshness gate re-runs every product generator over
  this pillar and byte-compares the result to disk.

**WISH (named honestly, not enforced)**
- `product_labels_accounted` — every label image should map to a product or to an explicit,
  reasoned gap. This cannot be a portable gate: the label images live outside the repo, so a
  clone has nothing to check against. The accounting was done by hand at the end of the build.
- `product_amounts_not_targets` — the §00.A boundary (a composition `amount` must never be read
  as a target) is not codified on this side. Today it is held by `amounts_wallach_only` on the
  corpus side and by the shape of the coverage math, not by a gate here.

## How this pillar was built
Every record was read off its label image and checked with `products_verify` before the next
batch, with a human spot-check of the rendered result in between. The modeling rules that came
out of that pass still hold: bundles and packs (combos of base products) are modeled as
references, never re-extracted; a single product whose label carries multiple panels
(tablet + softgel) becomes multiple `components`. The pillar was sealed once at completion,
user-signed, via `eden/tools/products_seal.py`.
