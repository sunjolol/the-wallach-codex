# eden/corpus — the sealed Wallach knowledge corpus

_**Pillar 1** of the three-pillar Eden model. The proposal of record is
`chronicle/proposals/wallach-knowledge-revamp.md`._

## What this is

`eden/corpus/` is the sealed, hash-anchored home for everything that is *direct
Wallach truth*: his books, and the claim graph extracted from them. It is one of the
three sealed pillars (Corpus · Products · Catalog — see `eden/README.md`), alongside
`eden/graphics/` (the sacred hand-made graphics) under one sealing discipline. The
corpus is the model the other pillars copy.

## Fully sealed — working + excluded material lives elsewhere

Everything under `eden/corpus/` is Tier-1 canonical: sealed, hash-anchored,
user-only-writer, loud-fail on drift. Non-canonical material is kept deliberately
*outside* the corpus so it can never poison the canon; material held out of the app is
recorded in a local, unpublished folder rather than here. Anything that must be true lives
in this sealed pillar.

(There is no hidden tier inside the corpus. Every claim with an operational
essentials/conditions/symptoms mapping feeds the indices; the authored Search layer is
added on top of a claim, never subtracted from it.)

## Layout

```
eden/corpus/
├── books/                       sealed book text — NOT distributed (copyrighted; see below)
├── books-meta.json              per-book metadata + content_sha256 anchor      [seals: .golden.sha256]
├── books-roadmap.json           Wallach books not yet in-housed ("coming soon"); NOT sealed
├── essentials-canon.json        the immutable 90/91 — every slug used anywhere [seals: .golden.sha256]
├── knowledge-version.json       monotonic seal stamp                           [seals: .golden.sha256]
├── search-enrichment.json       the authored Search layer, one entry per enriched claim; NOT sealed
├── seal-history.log             append-only record of user-approved seals (gitignored)
├── SCHEMA.md                    the authoritative claim + canon schema spec
├── claims/                      THE SPINE — one sealed shard per book           [each: .golden.sha256]
│   └── claims-<book_id>.json
└── indices/                     DERIVED from claims/* (never hand-edited)       [each: .golden.sha256]
    ├── essentials.json · other-substances.json · conditions.json
    ├── symptoms.json · consistency.json
```

During a mining round the extractor writes `drafts/claims-<book>.draft.json` (plus
`drafts/reports/<book>.report.md`). That directory exists only while a round is open, holds
no golden siblings, and `corpus_seal.py` promotes its contents into `claims/` and clears it —
so a clean tree has no `drafts/`.

**The book texts are not in this repo.** `eden/corpus/books/*.txt` are copyrighted Wallach
OCR and are gitignored, so a fresh clone has no `books/`. That clone still runs: the derive
pipeline reads the sealed claim shards, and every gate that reads book bytes reports a
skip with its reason instead of a false green. `corpus_verify.py` itself still needs the
books — it fails loudly without them, by design — so run it after placing the sources back
in `eden/corpus/books/`. The corpus was sealed and integrity-verified with the books
present; nothing in this repo can re-prove that without them.

## The spine principle

`claims/*` is the single mutable source of truth at extraction time. Every file in
`indices/` is a **pure derivation** — `corpus_derive.py` regenerates them and
`corpus_verify.py` byte-compares the result against what's sealed (check #8). No two
surfaces can disagree, because they are all views of one graph.

## The durable anchor: verbatim, not page numbers

Each claim carries a **required `verbatim`** (an EXACT substring of its source book).
The PDF-extracted books carry no reliable page markers, so the verbatim is the
load-bearing locator: `corpus_verify` proves every claim's verbatim is a real
substring of its book (in LF-normalized space). The structured `locator` (chapter
where detectable, always a `char_offset`) is best-effort convenience — verify never
fails on a missing page, only on a verbatim that isn't there. This is what survives a
4-year-unattended re-OCR.

## The books (seven sealed)

`dddl-3e-2011` · `rare-earths` · `lets-play-doctor` · `epigenetics` · `immortality` ·
`iaiyh` · `hells-kitchen` — the seven in-housed Wallach books, each a sealed claim shard
under `claims/`. `books-meta.json` is the registry of record: read the book list off it,
never off a hand-typed list like this one.
Book citations reference these by `book_id` → `books-meta.json` (composed display,
never hand-typed — `citations_reference_registry`).

## Tools (under `eden/tools/`, one roof with the derive + catalog + products tooling)

| Tool | Who may run it | Does |
|---|---|---|
| `corpus_extract.py` | tooling | deterministic draft scaffolding (chunking, dose regex, char_offset) → `drafts/` |
| `corpus_derive.py` | tooling | `claims/*` → `indices/*` (pure; every claim with an operational mapping feeds the indices — no claim is hidden by a tag) |
| `corpus_resnap.py` | tooling | after a sealed book `.txt` is corrected, relocate every claim's `char_offset` + recompute the book `content_sha256` (locator-only; no claim-content change) |
| `corpus_embed.py` | tooling | build the dashboard's embedded corpus JSON from the sealed shards (Zod-validated at load) |
| `build_embeds.py` | tooling | the **unified derive pipeline** — walks `eden/derived/MANIFEST.json` and runs every registered generator into `eden/derived/` + `dashboard/assets/data/`; freshness-gated by `derived_artifacts_fresh`, which re-runs the same registry and byte-compares |
| `corpus_verify.py` | tooling (read-only) | the integrity checks; truth-anchored on book bytes; cannot lie |
| `corpus_seal.py` | **user only** | promote drafts → claims, derive indices, recompute golden hashes, bump version |
| `graphics_seal.py` / `graphics_verify.py` | user / tooling | seal + read-only-verify the graphics manifest |

Mining + purification helpers also live here (`mine_batch.py`, `mined_page_audit.py`,
`book_purity.py` / `book_purify_apply.py`, `anomaly_scan.py`, `verbatim_audit.py`,
`vb_*`). Extraction fills `drafts/`; the owner reviews chunk-by-chunk; **only `*_seal.py`
(user-run)** promotes and re-anchors. The LLM is never on the source-rule allowlist —
it sorts passages; the *book* is always the source.

## Sealing posture (shared across the pillars)

Every sealed canonical file has a `*.golden.sha256` sibling. The `pre_write_guard` hook
auto-blocks any path with a golden sibling, so sealed files are user-only-writer for
free; `pre_bash_guard` already bans bash writes into `eden/`. Integrity is enforced at
every round-close by `corpus_integrity`, `corpus_runtime_purity` (the dashboard makes
no LLM/network call), and `graphics_integrity`.

**Bootstrap:** until `corpus_seal.py` runs, there are no golden hashes and
`corpus_verify` reports BOOTSTRAP — the invariants pass green, exactly as the other
pillar seal gates do before their first seal.
