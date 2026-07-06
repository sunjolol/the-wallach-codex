# The Catalog pillar (`eden/catalog/`)

Pillar 3 of the three sealed, hand-edited data pillars (blueprint §2.2) — the canonical ID
registries every other pillar and every surface references. Promoted 2026-07-05 (Phase B)
from the emergent claim slugs + the scattered helper files (`condition-taxonomy.json`,
`condition-synonyms.json`, `corpus_derive` `DISPLAY_OVERRIDES` — all retired).

## The registries
- **`conditions.json`** — every condition slug → `{display_name, synonyms?, umbrella_of?}`.
  `umbrella_of` carries the umbrella→subtype structure (cancer → leukemia, …); `synonyms`
  carries Wallach's alternate phrasings for the verbatim-naming rule.
- **`symptoms.json`** — every symptom slug → `{display_name}`.
- **essentials** — the immutable 90/91 essential nutrients live in
  `eden/corpus/essentials-canon.json` (sealed there since Phase α). The corpus's own gate
  (`corpus_verify` #3) keeps every claim essential ⊆ canon.

## The nutrient/ingredient vocabulary — deferred to Phase F
`nutrients.json` was built in Phase B but **DELETED 2026-07-05 (D-c)** as too-basic
duplication: its 91 canonical entries only re-copied `essentials-canon` names (Charter R3),
and its 408 non-essential substance display names were byte-identical to the auto-humanized
slug (so the derived indices are unchanged without it). The real nutrient/ingredient registry
is rebuilt from scratch — richer, product-shaped — alongside the Youngevity Product DB in
**Phase F**. Until then the substance (`other_substances`) half of `references_resolve` is
dormant, and `catalog.py`'s `nutrient_*` accessors degrade to empty (the Phase-F seam).

## Enforcement
- **`references_resolve`** (invariant) — every claim condition/symptom slug must be
  registered here; an unregistered slug is RED (closes the phantom-slug hole). The substance
  half is dormant until Phase F (see above).
- **`catalog_integrity`** (invariant → `eden/tools/catalog_verify.py`) — internal structure
  (counts, well-formed slugs, umbrella children resolve) and, once sealed, the golden hashes.
- Sealed via **`eden/tools/catalog_seal.py`** (USER-ONLY). Each file carries a
  `*.golden.sha256` sibling; edits then require user sign-off (sealed-canonical rule).

## Workflow
Register a NEW condition / symptom **here first** (unseal → add → reseal via
`catalog_seal.py`) BEFORE mining a claim that references it. The catalog is the
pre-registration gate that makes a typo'd slug impossible to ship.
