# Decision: the orphaned Creator's Log entry stays archived — SETTLED, do not re-raise

_2026-08-03 12:40 CDT. The owner's call, asked and answered. This file exists so the question is
never re-opened in a later session._

## The decision
**`lg_ms2ceijb_ae6lys` is NOT reconciled into master's ledger. It stays where it is, archived.**

This is final. It is not a deferral, not a "revisit later", and not an open item. Any future session
that finds a reference to an orphaned log entry should read this file and move on.

## What the entry is
| | |
|---|---|
| id | `lg_ms2ceijb_ae6lys` |
| timestamp | 2026-07-26T17:01:20-05:00 |
| surface / kind | `tooling` · `round-close` |
| summary | Fixed a false-alarm assertion in the entity-page render probe: it checked a nonexistent CSS class, so it always reported the product detail panel as missing |

The work it describes is **already in the codebase** — the probe fix landed. Only the ledger *entry*
was orphaned, never the change it narrates. Nothing is missing from the app.

## How it got orphaned
It was written inside a git worktree that a 2026-08-03 cleanup sweep purged (96.8 MB, stale). That
worktree's ledger copy held 692 entries; master's held 783. The entry existed only in the copy, so
when the worktree went, master's ledger had never contained it.

## Where it lives now
Preserved permanently at tag **`archive/worktree-nervous-shannon-2026-07-26`**.

```bash
git show 42f1ba11:chronicle/creators-log/log.jsonl
```

Its build-log line is preserved alongside it in the same tagged tree.

## Why archived rather than reconciled
The Creator's Log is append-only and ordered by real time. Splicing a 2026-07-26 entry into a ledger
that has since grown past it would mean either writing out of order or rewriting the file — and the
covenant's whole point is that the ledger is never edited or reordered. Preserving the entry in a
tagged, retrievable tree honours the history without touching the sacred file.

**The covenant is not violated by this.** The covenant forbids deleting, editing, reordering or
pruning entries in the ledger. This entry was never in that ledger, and it has not been destroyed —
it is retrievable forever from the tag.

## Consequence
This is no longer an open item. The ledger's canonical entry count is master's, and the archived
entry is deliberately outside it.
