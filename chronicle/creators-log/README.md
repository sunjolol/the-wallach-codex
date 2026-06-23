# The Creator's Log

The **sacred, append-only audit trail** of this project — the full record of what
we did and why, so the path is never lost. It is named because the whole project
leans on it: the outer GitHub layer (commits, `build-log.md`, rendered logs) is
the public teaching record but it *can* fail — takedown, expired logs, a server
disaster. This local-first ledger is the durable memory that survives in every
clone. See the doctrine: `.claude/rules/logging-doctrine.md` — "The two layers" +
"The sacred covenant".

## Files
- **`log.jsonl`** — THE canonical ledger. One schema-valid JSON entry per line,
  **append-only**, the machine source of truth. Never edited, deleted, reordered,
  or pruned — not even under a broad "delete what you need" authorization.
- **`LOG.md`** — a **generated** human-readable view of `log.jsonl`, newest first.
  Regenerated on every append. **Do not hand-edit** — changes are overwritten and
  would make the human view diverge from the truth (the digest-sync invariant
  catches that).
- **`README.md`** — this file.

## How to read it
- **Humans:** open **`LOG.md`** and scroll / Ctrl-F. Newest entries at the top.
- **Machines / Claude:** read **`log.jsonl`** (one JSON object per line).
- **Either:** `PYTHONUTF8=1 python tools/creators_log.py list [--n N]`.

## How to append (the ONLY sanctioned way)
```
PYTHONUTF8=1 python tools/creators_log.py append \
  --surface <coverage|scanner|tools|meta|…> \
  --kind <round-close|milestone|design-decision|incident|note|…> \
  --summary "<= 280 chars" [--detail "longer body"] [--metadata-json '{...}']
```
The tool auto-stamps a unique id + ISO-8601 UTC timestamp, validates the entry,
appends one line through `safe_write` (§17 atomic-verify), and regenerates
`LOG.md`. It has **no delete path** by design.

## The covenant (enforced, not just promised)
- **Append-only, git-anchored** — `creators_log_append_only` (critical invariant)
  fails if any committed entry is removed, truncated, edited, or reordered: the
  committed ledger must remain a line-prefix of the working file.
- **Always well-formed** — `creators_log_well_formed` validates every line.
- **Human view never lies** — `creators_log_digest_synced` verifies `LOG.md`
  equals the deterministic render of `log.jsonl`.
- **Never skipped** — a chunk that adds a `chronicle/build-log.md` line without a
  new Creator's Log entry is blocked at round-close (`stop_round_close.py`).
- **Never casually deleted** — `pre_bash_guard.py` blocks `rm`/`git rm`/`mv` of
  the ledger at the shell boundary.
- **Sacred** — a broad delete authorization NEVER includes this ledger. If
  removing an entry ever seems necessary: STOP and ask.
