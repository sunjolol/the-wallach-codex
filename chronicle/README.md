# chronicle/

The project's durable record. Two kinds of thing live here: the **ledger** (a plain-language
history of the work) and the **ratified-decision docs** (the reasoning behind the hardest calls).

- **`build-log.md`** — a chronological, plain-language narrative of every chunk of work: what
  changed, why, and how it was verified.
- **`creators-log/`** — the **sacred, append-only Creator's Log**: `log.jsonl` (the source of
  truth) plus the generated `LOG.md`, `INDEX.md`, and monthly `digests/`. Written only by
  `tools/creators_log.py`; it has no delete path and is never edited or reordered.
- **`contradictions/`** — the §00 conflict record: when the two prime directives collide, the
  call is written up here (cobalt→B12, the omega EFA group dose, …). Cited by the gates as
  provenance.
- **`decisions/`** — ratified design / engineering decisions of record.
- **`proposals/`** — the founding proposals (e.g. the Wallach Knowledge Revamp) the pillars
  were built from.

`chronicle/next-chunk.md`, the rolling per-session hand-off, is **local-only (gitignored)** —
it is regenerated each session and never committed.
