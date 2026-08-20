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

## The nutrient/ingredient vocabulary
`nutrients.json` — the canonical nutrient/ingredient registry, rebuilt (richer,
product-shaped) alongside the Youngevity Product DB in Phase F. Its canonical essentials map
to `essentials-canon`; its non-essential substances (botanicals, actives) back the
`other_substances` half of `references_resolve`. (An earlier, thinner nutrients.json from
Phase B was deleted 2026-07-05 as too-basic duplication; this is the Phase-F rebuild.)

## Enforcement
- **`references_resolve`** (invariant) — every claim condition/symptom slug must be
  registered here; an unregistered slug is RED (closes the phantom-slug hole). The substance
  half validates against `nutrients.json` (live since the Phase-F rebuild).
- **`catalog_integrity`** (invariant → `eden/tools/catalog_verify.py`) — internal structure
  (counts, well-formed slugs, umbrella children resolve) and, once sealed, the golden hashes.
- Sealed via **`eden/tools/catalog_seal.py`** (USER-ONLY). Each file carries a
  `*.golden.sha256` sibling; edits then require user sign-off (sealed-canonical rule).

## Workflow
Register a NEW condition / symptom **here first** (unseal → add → reseal via
`catalog_seal.py`) BEFORE mining a claim that references it. The catalog is the
pre-registration gate that makes a typo'd slug impossible to ship.
