# Eden Catalog — Schema Specification

_Strict spec for `eden/eden-catalog.json`. Any deviation = build failure._

## Top-level shape

```json
{
  "schema_version": 1,
  "_doctrine": "Eden — sealed catalog. Source of truth for all recommendation surfaces. User is sole writer. See eden/README.md.",
  "eden_version": "<integer; monotonically increases on each user-approved seal>",
  "sealed_at": "<ISO 8601 timestamp of last seal>",
  "products": {
    "<EDEN-LOCKED-slug>": { product object },
    ...
  },
  "goals": {
    "<goal_key>": { goal object },
    ...
  },
  "tiers": {
    "hbsp_default": [ "<EDEN-LOCKED-slug>", ... ],
    "wallach_exception_mainline": [ "<EDEN-LOCKED-slug>", ... ]
  }
}
```

## Product object

Every product entry MUST include:

| Field | Type | Required | Description |
|---|---|---|---|
| `canonical_name` | string | yes | Full canonical product name (e.g. "Beyond Tangy Tangerine 2.5", not "BTT 2.5 Canister") |
| `display_short` | string | optional | Optional shorter display variant (e.g. "Tangy Tangerine 2.5") |
| `brand` | string | yes | Canonical brand name (e.g. "Youngevity", "Tai Wellness", "Biometics", "ProJoba", "Good Herbs") |
| `brand_tier` | integer | yes | 1 = mainline Youngevity OR Wallach-approved collab (ranking-preferred); 2 = sub-brand (ranking-deprioritized). |
| `source_citations` | array of objects | yes | Per source-rule cornerstone. At least one entry. Each: `{ "kind": "wallach_book\|youngevity_label\|pack_extrapolation", "ref": "<verbatim citation>" }` |
| `nutrients` | array of nutrient objects | yes | Each: `{ "name", "amount", "unit", "form", "alignment" ("aligned" \| "partial" \| "unknown") }`. Empty array PERMITTED only if `nutrients_explicit_empty: true` and a `nutrients_empty_reason` field is provided. |
| `non_essentials` | array of nutrient objects | optional | Same shape as nutrients. Default: empty array. |
| `category_label` | string | yes | Display label for the category (e.g. "YGY foundational mineral multi (powder form)") |
| `serving_size` | string | yes | e.g. "1 scoop (12.8 g)", "1 fl oz (30 mL)", "3 softgels" |
| `servings_per_container` | integer | yes | e.g. 30 |
| `dose_text` | string | yes | The display dose text (e.g. "2 scoops/day", "1 scoop (12.8 g)/day") |
| `pricing` | object | yes | `{ "retail": number, "daily_cost_at_1_serving": number }` |
| `goals` | array of strings | yes | Goal keys this product is relevant for (e.g. `["cognition", "longevity_anti_aging"]`). Empty if foundation-only. |
| `features` | array of strings | optional | Display feature bullets from the Youngevity product page. |
| `what_it_does` | string | optional | One-sentence summary. |
| `tagline` | string | optional | Marketing tagline (used as fallback for "what_it_does"). |
| `notes` | string | optional | Long-form product description (Youngevity product page text) |
| `eden_metadata` | object | yes | `{ "added_at": "<ISO>", "last_modified_at": "<ISO>", "added_by": "<user signature>", "eden_id_version": 1 }` |

## Goal object

```json
"cognition": {
  "display_name": "Cognition",
  "symbol": "◍",
  "category": "mind_energy",
  "description": "Mental performance, memory, focus.",
  "wallach_anchor": "Cr+V, B-complex, choline 4 g/day, taurine, lecithin, Cu, Zn, Vit E, EFA (DHA)",
  "education": {
    "framing": "<plain-language framing of what this goal addresses + why nutrient deficiency is often the root>",
    "wallach_citations": [ { "ref": "<source>", "passage": "<verbatim>" } ]
  }
}
```

## ID scheme

- Pattern: `EDEN-LOCKED-<slug>` where `<slug>` is the product's canonical name, lowercased, with non-alphanumeric chars replaced by `-`, collapsed runs of `-`, trimmed.
- Examples:
  - "Beyond Tangy Tangerine 2.5" → `EDEN-LOCKED-beyond-tangy-tangerine-2-5`
  - "Beyond Osteo FX Powder" → `EDEN-LOCKED-beyond-osteo-fx-powder`
  - "ReVERSE!®" → `EDEN-LOCKED-reverse`
  - "ProJoba Omega (Fish Oil)" → `EDEN-LOCKED-projoba-omega-fish-oil`
- The `EDEN-LOCKED-` prefix is improbable in user-typed input or chat — collisions vanishingly unlikely.
- Slugs are stable. A product renaming requires a deliberate user-approved rename + migration (slug versioning via `eden_id_version`).

## Strict-validation rules (enforced at build + verify time)

1. Every product ID matches `^EDEN-LOCKED-[a-z0-9-]+$`. No other characters permitted.
2. Every product has `source_citations` with at least one entry from the source-rule allowlist.
3. Every product's `nutrients` field is present. Empty array is only allowed if `nutrients_explicit_empty: true` AND a `nutrients_empty_reason` field is provided.
4. Every product's `brand_tier` is 1 or 2.
5. Every product's `goals` entries are valid goal keys from the catalog's `goals` map.
6. Every goal in `goals` has at least one product that lists it.
7. Every product in `tiers.hbsp_default` exists in `products` AND has `brand_tier: 1`.
8. Top-level `schema_version`, `eden_version`, `sealed_at`, `products`, `goals`, `tiers` fields are all present.

Violations at build time → loud failure, no embed update. Violations at verify time → boot-time refusal to render recommendations.

## What's NOT in the catalog

- User stack data (lcRegimen_v1, rgManualItems_v1, etc.) — separate user namespace
- Scanner-scanned items — separate user namespace
- Saved-slot regimens — separate user namespace
- User-stated goals — user state, layered on top of Eden's goal taxonomy
- Recommendation history — derived; not source data

## Versioning

`eden_version` is a monotonically-increasing integer. Increments on every user-approved seal (every time you run `eden_seal.py` after a catalog edit). Embedded in all three dashboard embeds; verifier checks they all match.
