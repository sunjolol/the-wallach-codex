# The Youngevity Product DB (`eden/products/`) — Pillar 2

Sealed, hand-built COMPOSITION source for every Youngevity product. Pure label facts.
Built in Phase F from the authoritative label images (`temporary/labels/`) + the saved
listing manifest; replaces the transitional `eden/eden-catalog.json`.

## §00.A boundary — why the pillar is split the way it is
- **Composition is the ONLY thing here.** An `amount` is what a product CONTAINS,
  never a recommended amount or target. Wallach defines targets; YGY defines composition;
  the coverage math sums composition against Wallach targets.
- **No prose, no Wallach claims, no YGY marketing** in `products.json`. The single long
  free-text token allowed anywhere in the pillar is a blend's bounded `as_labeled`.
- Prices + the YGY marketing description live in `prices.json` (`source: ygy`), quarantined —
  they feed product display + offline search, NEVER the coverage/recommendation math.

## Files
- `products.json` — composition, keyed by `product_id`. SEALED at completion (`*.golden.sha256`).
- `prices.json` — VOLATILE sidecar (retail/wholesale + YGY description), keyed by `ygy_id`.
  Generated from the saved listing manifest; NOT sealed (prices drift). Joins to `products.json` by `ygy_id`.

## Record schema (`products.json`)
```
product_id · name · sku · ygy_id · variants[]? · additional_labels[]? · components[]
  variant: sku · ygy_id · name · form · source_label  ← a SIBLING sku sharing this EXACT formula
           (30-count box, 4-pack, …). ONE record per formula, not per sku (Luneth 2026-07-06); a
           sku whose formula DIFFERS gets its OWN record, not a variant (e.g. BTT 2.0 CPF canister vs box).
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
Every ingredient/nutrient resolves to the rebuilt Catalog nutrient/botanical registry
(`catalog/nutrients.json`, Phase F). Essentials map to the 91 (feed the cost-per-nutrient
coverage math for ALL 91); botanicals/actives get their own entries (power blend/ingredient
search). Re-lights the dormant substance half of `references_resolve`.

## Enforcement (each LIVE + negative-tested in the same patch, R7)
- `products_verify` (`eden/tools/products_verify.py`) — record structure + PROSE CONTAINMENT (R4).
- `products_hash_integrity` + golden sha256 (seal at completion) — Eden's wall (scanner/user can never write it).
- `prose_contained` extended here · `references_resolve` (registry) · `product_labels_accounted`
  (every one of the 204 label files → a product OR an explicit exclusion/gap, each with reason)
  · `products_derived_fresh` (MANIFEST) · `product_amounts_not_targets` (§00.A boundary).

## Build workflow
Extract `temporary/labels/` alphabetically in batches → `products_verify` → user visual
spot-check → next batch. Bundles/packs (combos of base products) are modeled as references,
not re-extracted. Multi-panel single products (tablet+softgel) become multiple `components`.
Seal ONCE at completion (USER-signed via `products_seal.py`); unsealed during construction.
