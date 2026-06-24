# eden/corpus/drafts/

**The only place the agent writes corpus content.** No `*.golden.sha256` siblings live
here, so the write-discipline hooks leave it agent-writable via `safe_write`.

- `claims-<book>.draft.json` — in-progress claim records for a book under review
- `reports/<book>.report.md` — per-book extraction report (new claims, numeric extractions,
  ambiguous flags, cross-book repeats) — the chunk-by-chunk review surface

`corpus_seal.py` (user-only) promotes a reviewed draft into `../claims/` and never the reverse.
Nothing here is canonical; nothing here is read by the dashboard.
