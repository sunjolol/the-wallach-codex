# Next chunk — Chunk 0.2: Substrate hardening (sidecar sha256 walk)

**Status:** queued. Previous chunk (0.1 CLAUDE.md recovery) closed 2026-06-21 16:00 EDT.
**Session boundary:** START THIS CHUNK IN A FRESH SESSION. Do not continue the previous thread.

## What this chunk does

Adds sha256 sidecar files for every tracked project file. Builds the script that walks them at session-start and detects silent corruption (the §17-incident family) before any further work begins.

## Acceptance criteria

1. `tools/sidecar_sha.py walk` creates `<file>.sha256` next to every file under `dashboard/`, `memory/`, `knowledge/`, `chronicle/`, `tools/`, `schemas/`, `eden/`, `tacitus/`, and the repo root. Sidecars stored with the convention `<filename>.sha256` containing `<hex>  <filename>\n`.
2. `tools/sidecar_sha.py verify` walks all sidecars, recomputes hashes, exits non-zero on any drift, prints a diff list.
3. `tools/sidecar_sha.py update <path>` updates one sidecar after a sanctioned write (called automatically from `safe_write.py` at the end of every operation).
4. `safe_write.py` modified to invoke `sidecar_sha.py update` after a successful write.
5. Build-log entry + Creator's Log event for the chunk close.

## What this chunk explicitly does NOT do

- No view code touched.
- No state code touched.
- No CLAUDE.md edits beyond a possible glossary entry for "sidecar sha256".
- No new prose rules added to operating-protocols.md.

## Why this is the right next chunk

§17 incident #6 (CLAUDE.md silent truncation) was caught only because the user manually surfaced two backups. The sidecar walk would have surfaced it automatically on session-start. The substrate layer is the foundation of every other discipline in the proposed rebuild; nothing above it can be trusted until it holds.

## First commands of the next session

```
bash tools/build-dashboard.sh    # baseline build, prove nothing else broke
cat chronicle/next-chunk.md      # this file
```
