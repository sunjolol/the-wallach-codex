# eden/corpus — Schema Specification

_Strict spec for the sealed corpus. The single authoritative schema: `corpus_verify.py`
enforces it at seal time; the Zod mirror (`core/schemas/corpus.ts`, landed Phase ε) is
derived from THIS file (single source — §00.B #3) and validates the build-time embed
(`dashboard/assets/data/corpus-embed.json`; see §7).
Any deviation = verify failure = seal refused._

## 1 · `essentials-canon.json` — the immutable 90

```jsonc
{
  "schema_version": 1,
  "counts": { "minerals": 60, "vitamins": 16, "amino_acids": 12, "fatty_acids": 2, "total": 90 },
  "pending_adjudications": [ { "id", "slot", "question", "status", "resolve_in", "affects_slug" } ],
  "essentials": [
    { "slug": "magnesium", "display_name": "Magnesium", "category": "mineral",
      "subtype": "foundational|major_trace|rare_trace|null",
      "atomic_number": 12, "symbol": "Mg", "layout_key": "Magnesium", "essential": true,
      "provisional": false, "provisional_note": "<only if provisional>" }
  ]
}
```

- `total` MUST equal 90. `slug` is unique, lowercase, `[a-z0-9-]+`.
- Sealed once for life. Every `essentials` slug used in any claim or index MUST appear here.
- `pending_adjudications` records open canon questions (Cysteine↔Taurine, Fluoride) so the
  canon never silently encodes an unverified choice; resolved in the Phase-δ corpus audit.

## 2 · `books-meta.json` — per-book anchor

```jsonc
{
  "schema_version": 1,
  "books": [
    { "book_id": "dddl-3e-2011", "title", "edition", "year", "authors": [...],
      "file": "eden/corpus/books/dddl-third-edition-2011.txt",
      "content_sha256": "<sha256 of LF-normalized UTF-8 text>",
      "content_bytes": 983512, "line_count": 14851, "hash_basis": "lf_normalized_utf8",
      "locator_scheme": "chapter_page | screenshot",
      "ocr_confidence_band": "high|medium|n/a", "notes": "..." }
  ]
}
```

- `content_sha256` is over **LF-normalized** content, not raw disk bytes (clone/CRLF-stable;
  `.gitattributes` pins `eol=lf`). `corpus_verify` recomputes the same way (check #6).

## 3 · Claim atom — `claims/claims-<book_id>.json`

```jsonc
{
  "schema_version": 1, "book_id": "dddl-3e-2011", "knowledge_version": 1,
  "claims": [
    {
      "id": "WAL-CLM-DDDL-000123",     // WAL-CLM-<BOOKSHORT>-<6 digits>, globally unique, immutable once sealed
      "kind": "dose|protocol|deficiency_sign|toxicity_sign|mechanism|food_source|interaction|contraindication|prognosis|diagnostic_pattern|prevalence|quote|definition|personal_anecdote",
      "essentials": ["copper"],         // slugs ∈ essentials-canon.json
      "other_substances": [],           // slugs ∈ indices/other-substances.json keyspace
      "conditions": ["aneurysm"],       // slugs ∈ indices/conditions.json keyspace
      "symptoms": ["premature_gray_hair"],
      "claim_text": "Gray hair is a sign of copper deficiency.",   // normalized paraphrase
      "verbatim": "Premature gray hair is a copper deficiency ...", // REQUIRED, 60–500 chars, EXACT book substring (LF space)
      "locator": {
        "book": "dddl-3e-2011", "scheme": "chapter_page",
        "chapter": null, "page": null,          // best-effort; null when not detectable
        "screenshot": null, "kindle_location": null,  // for scheme=screenshot
        "char_offset": 48213                    // ALWAYS present: start index of verbatim in the LF book text
      },
      "dose": { "amount": 50, "unit": "mg", "period": "daily", "form": null,
                "duration": null, "for_condition": "wound healing" },  // only when kind=dose
      "tags": ["clinical_protocol", "pet_anecdote"],
      "confidence": "high|medium|low",          // user-set during review
      "review_state": "draft|reviewed|sealed|superseded",
      "superseded_by": null,                    // claim id if retired by a later claim
      "extracted_at": "2026-..Z", "reviewed_at": null, "reviewed_by": null
    }
  ]
}
```

**Required:** `id`, `kind`, `claim_text`, `verbatim`, `locator.book`, `locator.scheme`,
`locator.char_offset`, `review_state`. `verbatim` is the durable anchor and is hard-checked.

## 4 · Index entries (`indices/*`) — DERIVED, never hand-edited

Shapes EXACTLY as `corpus_derive.py` emits them (byte-checked by verify #8 — this is the
canonical runtime truth the Zod mirror + the embed follow; an earlier draft of this
section described an aspirational `wallach_stance`/flat-bucket shape that the derive never
produced — corrected Phase ε):

- **`essentials.json`** — `{ "<slug>": { display_name, canon_slug, category, claim_count, claims_by_kind{<kind>:[ids]}, deficiency_signs:[{sign,claim_id,confidence}], conditions_treated:[slugs], interacts_with:[slugs], books_cited:[...] } }`. All 90 canon slugs, in canon order; an essential with no claims carries `claim_count: 0` and empty lists.
- **`other-substances.json`** — `{ "<slug>": { display_name, claim_count, claims_by_kind{}, conditions_treated:[slugs], books_cited:[...] } }`. Slug set **disjoint** from the 90-canon — partition enforced by verify #4.
- **`conditions.json`** — `{ "<slug>": { display_name, claim_count, claims_by_role{<role>:[ids]}, essentials_involved:[slugs], other_substances_involved:[slugs], books_cited:[...] } }`. A claim's kind maps to a role bucket (mechanism→causes, protocol→protocols, dose→doses, deficiency_sign→deficiency_signs, toxicity_sign→toxicity_signs, prognosis→prognosis, personal_anecdote→anecdotes, quote→quotes, definition→definitions, …; unmapped kinds keep their own name).
- **`symptoms.json`** — `{ "<slug>": { display_name, claim_count, likely_deficiencies:[{essential,claim_id,confidence,appears_in_books}], books_cited:[...] } }`
- **`consistency.json`** — `[{ id, essentials:[slugs], conditions:[slugs], kind, repetitions:[{claim_id,book}], books_repeating:int, claim_count:int }]`. Only signatures (essentials+conditions+kind) shared by ≥2 claims are emitted.

## 5 · `graphics-manifest.json` — Wing 3

```jsonc
{ "schema_version": 1,
  "graphics": [ { "file", "file_sha256": "<raw bytes>", "file_bytes", "title",
    "provenance": "user-authored, Wallach-derived", "captured_year", "depicts",
    "related_essentials": [...], "status": "canonical" } ] }
```

## 6 · The 11 verify checks (`corpus_verify.py`)

1. Every claim id referenced by any index exists in some `claims/*` shard.
2. **Every claim `verbatim` is a byte-equal substring of its source book (LF space).** ← load-bearing
3. Every essentials slug used anywhere ∈ `essentials-canon.json`.
4. `essentials-canon` ∩ `other-substances` keyspace = ∅.
5. Every claim id is globally unique across shards.
6. Each book's LF-content sha256 == its `books-meta.json` `content_sha256`.
7. Every `*.json` actual hash == its `*.golden.sha256`.
8. `indices/*` byte-equal a fresh `corpus_derive.py` run over `claims/*`.
9. `locator.char_offset` (when present) points at the verbatim start.
10. No `drafts/*` file is referenced by any sealed index.
11. Every claim `dose` is `null` or an object — never a bare string/number/list (the runtime-break class that empties the Knowledge drawer). The `CorpusDoseSchema` key set is `{amount, unit, period, form, duration, for_condition}`; extra keys pass (Zod `.passthrough()`), so verify enforces only the null-or-object shape.

Bootstrap (no golden hashes yet) → verify reports BOOTSTRAP, the invariant passes green.

## 7 · Dashboard embed — `dashboard/assets/data/corpus-embed.json` (Phase ε)

The offline file:// dashboard cannot `fetch()`, so `eden/tools/corpus_embed.py` projects
the sealed indices + claim shards into ONE slim, view-shaped JSON, inlined into the bundle
at build (esbuild JSON import in `state/corpus.ts`):

```jsonc
{ "knowledge_version": 16,        // the freshness stamp — NO timestamp, so a re-derive is deterministic
  "books":      { "<book_id>": { "title", "edition", "year" } },   // only books a claim actually cites
  "essentials": { "<slug>": { /* essentials.json entry */ , "layout_key", "symbol" } },  // + canon join fields
  "conditions": { "<slug>": { /* conditions.json entry */ } },
  "claims":     { "<id>": { "id","kind","claim_text","verbatim","dose","book",
                            "essentials","other_substances","conditions","symptoms","confidence" } } }
```

Single source of truth stays `claims/*` + `indices/*`; the embed holds no independent
state. The derived index shapes flow through unchanged — essentials/conditions only gain
the canon `layout_key` + `symbol` (the Coverage periodic-table join key), and each claim
is slimmed to the runtime-needed fields (audit metadata dropped). The `derived_artifacts_fresh` (eden/derived/MANIFEST.json)
invariant re-runs `build_embed()` and object-compares it to the on-disk embed, so a stale
build can never let the Knowledge drawer's Essential/Condition deep-dive lie. Regenerate
via `python eden/tools/corpus_embed.py`.
