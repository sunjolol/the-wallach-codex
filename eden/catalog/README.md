# The Catalog pillar (`eden/catalog/`)

Pillar 3 of the three sealed, hand-edited data pillars — the canonical ID registries every
other pillar and every surface references. The slugs used to be emergent (whatever a claim
happened to spell) and the display names lived in scattered helper files; both are now
registered here first, so a typo'd slug cannot ship.

## The registries
- **`conditions.json`** — every condition slug → `{display_name, synonyms?, umbrella_of?}`.
  `umbrella_of` carries the umbrella→subtype structure (cancer → leukemia, …); `synonyms`
  carries Wallach's alternate phrasings for the verbatim-naming rule.
- **`symptoms.json`** — every symptom slug → `{display_name}`.
- **`search-entities.json`** — the Search entity registry: slug →
  `{type, synonyms[], related[], display_name?, symbol?, canon_ref?, catalog_ref?,
  intro_claim?, hub?}`. Canon entities set `canon_ref: true` and OMIT display_name/symbol —
  the derive pulls those from `essentials-canon.json` so a canonical name is never
  hand-duplicated; `catalog_ref` entities pull their display name from `conditions.json`;
  `hub: true` registers an aggregation page whose claims attach via `also_about`.
  **Not sealed** — it grows one entity at a time, so it is validated by the
  `search_index_wellformed` gate rather than anchored to a golden hash.
- **essentials** — the immutable 90/91 essential nutrients live in
  `eden/corpus/essentials-canon.json`, sealed there. The corpus's own gate
  (`corpus_verify` #3) keeps every claim essential ⊆ canon.

## The nutrient/ingredient vocabulary
`nutrients.json` — the canonical nutrient/ingredient registry, shaped around what a real
product label actually names. Its canonical essentials map to `essentials-canon`; its
non-essential substances (botanicals, actives) back the `other_substances` half of
`references_resolve`.

## Enforcement
- **`references_resolve`** (invariant) — every claim condition/symptom slug must be
  registered here; an unregistered slug is RED (closes the phantom-slug hole). The substance
  half validates against `nutrients.json`. Both halves are live.
- **`catalog_integrity`** (invariant → `eden/tools/catalog_verify.py`) — internal structure
  (counts, well-formed slugs, umbrella children resolve) and, once sealed, the golden hashes.
- Sealed via **`eden/tools/catalog_seal.py`** (USER-ONLY). Each sealed file carries a
  `*.golden.sha256` sibling; edits then require user sign-off (sealed-canonical rule).
  `search-entities.json` is the one file here that is deliberately unsealed.

## Workflow
Register a NEW condition / symptom **here first** (unseal → add → reseal via
`catalog_seal.py`) BEFORE mining a claim that references it. The catalog is the
pre-registration gate that makes a typo'd slug impossible to ship.
