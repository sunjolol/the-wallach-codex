# §17 incident #6 — Cowork Write tool NUL-padding

**Date:** 2026-06-22
**Severity:** §17 corruption surface — new writer identified (caught pre-commit; no data lost)
**Scope:** `CLAUDE.md` (during the operating-contract restructure install)
**Discovered by:** Cowork, on a hexdump verify after the write
**Reported by:** Luneth, who relayed the incident for the corruption-surface ledger

---

## What happened

While installing the rewritten operating contract, the **Cowork Write tool**
staged the new `CLAUDE.md` payload and the on-disk file came back with roughly
**3.2 KB of trailing NUL bytes** appended after the intended content. The
visible text was intact; the corruption was a silent tail of `\x00` padding —
the same shape as §17 incidents #3/#4 (`eslint --fix` appending NULs after the
final byte) but from a different writer.

A **hexdump verify** caught it (the file ended in a run of `00`), the padding
was stripped via Python, and the content was re-written through
`tools/safe_write.py`. The final on-disk `CLAUDE.md` is clean: **12,602 B,
0 NUL bytes, 196 lines.**

## Why it matters

This adds the **Cowork Write tool** to the documented §17 corruption-surface
list. The family now spans five distinct writers, all of which have silently
damaged a file on this Windows-mount host:

1. Bash `mv` + heredoc (incident #1 — mass NUL corruption)
2. The Edit tool (incident #2 — silent mid-string truncation)
3. `eslint --fix` (incidents #3/#4 — NUL append + mid-UTF-8 truncation)
4. An unidentified trigger (incident #5 — mass corruption between lint passes)
5. **The Cowork Write tool (this incident — ~3.2 KB trailing NUL padding)**

The lesson is unchanged and reinforced: **the tool name does not change the
failure shape.** Corruption is a filesystem-level hazard on this mount, so
every project-file write routes through `safe_write` (atomic write → readback
→ NUL/UTF-8/emptiness verify → swap), and the `post_write_verify` hook
re-scans independently after the fact. Defense-in-depth held: the write was
caught and corrected before it reached a commit.

## Disposition

No data lost; `CLAUDE.md` shipped clean. No code change required — this is a
ledger entry. The standing mitigation (route every write through `safe_write`;
treat any non-`safe_write` writer, including Cowork's, as a corruption surface)
already covers this writer. Filed per the round-close honesty rule so the
corruption-surface list stays complete.
