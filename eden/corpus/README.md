# eden/corpus — the sealed Wallach knowledge corpus

_Created 2026-06-24 (Phase α of the Wallach Knowledge Revamp). Proposal of record:
`chronicle/proposals/wallach-knowledge-revamp.md`._

## What this is

`eden/corpus/` is **Wing 2 of Eden** — the sealed, hash-anchored home for everything
that is *direct Wallach truth*: his books, and the claim graph extracted from them.
It joins Wing 1 (`eden/eden-catalog.json`, the Youngevity product catalog) and Wing 3
(`eden/graphics/`, the sacred hand-made graphics) under one sealing discipline.

## The two tiers (why this exists)

| Tier | Home | Posture | Contents |
|---|---|---|---|
| **Tier 1 — canonical** | `eden/` | Sealed · hash-anchored · user-only-writer · loud-fail on drift | books + claim graph + graphics + YGY catalog |
| **Tier 2 — working** | `knowledge/` | Unsealed · agent-writable · advisory | `transcripts-clean/` (Sunday YouTube-scan feed), `design-wisdom/` |

Tier 2 is kept *out* of Eden precisely so it can never poison the canon. Anything that
must be true lives here, in Tier 1.

## Layout

```
eden/corpus/
├── books/                       sealed book text (LF-normalized; anchored via books-meta)
├── books-meta.json              per-book metadata + content_sha256 anchor      [seals: .golden.sha256]
├── essentials-canon.json        the immutable 90 — every slug used anywhere    [seals: .golden.sha256]
├── knowledge-version.json       monotonic seal stamp (mirrors eden_version)    [seals: .golden.sha256]
├── claims/                      THE SPINE — one sealed shard per book          [each: .golden.sha256]
│   └── claims-<book_id>.json
├── indices/                     DERIVED from claims/* (never hand-edited)      [each: .golden.sha256]
│   ├── essentials.json · other-substances.json · conditions.json
│   ├── symptoms.json · consistency.json
└── drafts/                      AGENT WRITES ONLY HERE (no golden siblings)
    ├── claims-<book>.draft.json
    └── reports/<book>.report.md
```

## The spine principle

`claims/*` is the single mutable source of truth at extraction time. Every file in
`indices/` is a **pure derivation** — `corpus_derive.py` regenerates them and
`corpus_verify.py` byte-compares the result against what's sealed (check #8). No two
surfaces can disagree, because they are all views of one graph.

## The durable anchor: verbatim, not page numbers

Each claim carries a **required `verbatim`** (60–500 chars, an EXACT substring of its
source book). The PDF-extracted books carry no reliable page markers, so the verbatim
is the load-bearing locator: `corpus_verify` proves every claim's verbatim is a real
substring of its book (in LF-normalized space). The structured `locator` (screenshot +
location for the OCR books, chapter where detectable, always a `char_offset`) is
best-effort convenience — verify never fails on a missing page, only on a verbatim that
isn't there. This is what survives a 4-year-unattended re-OCR.

## Tools (under `eden/tools/`, one roof with the catalog tools)

| Tool | Who | Does |
|---|---|---|
| `corpus_extract.py` | agent | deterministic draft scaffolding (chunking, dose regex, char_offset) → `drafts/` |
| `corpus_derive.py` | agent | `claims/*` → `indices/*` (pure, deterministic) |
| `corpus_verify.py` | agent (read-only) | the 10 integrity checks; truth-anchored on book bytes; cannot lie |
| `corpus_seal.py` | **user only** | promote drafts → claims, derive indices, recompute golden hashes, bump version |
| `graphics_seal.py` | **user only** | seal the graphics manifest |
| `graphics_verify.py` | agent (read-only) | each graphic's bytes match its manifest hash |

The agent fills `drafts/`; Luneth reviews chunk-by-chunk; **only `*_seal.py` (user-run)**
promotes and re-anchors. The LLM (the session agent) is never on the source-rule
allowlist — it sorts passages; the *book* is always the source.

## Sealing posture (mirrors `eden/eden-catalog.json`)

Every canonical file has a `*.golden.sha256` sibling. The §17 `pre_write_guard` hook
auto-blocks any path with a golden sibling, so sealed files are user-only-writer for
free; `drafts/` (no siblings) stays agent-writable. `pre_bash_guard` already bans bash
writes into `eden/`. Three invariants enforce integrity at every round-close:
`corpus_integrity`, `corpus_runtime_purity` (dashboard makes no LLM/network call),
`graphics_integrity`.

**Bootstrap:** until `corpus_seal.py` runs, there are no golden hashes and
`corpus_verify` reports BOOTSTRAP (the invariants pass green, mirroring `eden_hash_integrity`).
