# Memory Change Log

Every memory-file write logged round-by-round. Append-only. Reverse-chronological by round number (newest at top, but appends go at the bottom of the file and the document reads in append order — a viewer sees Round N entries above Round N+1 entries chronologically).

Each entry uses the format:

```
### Round N (YYYY-MM-DD at H:MM AM/PM) — Short title

- path/to/file ← description of write (e.g., "Round N entry appended", "version bump v1.83 → v1.84")
- path/to/another/file ← description
- ...
```

The log is the audit trail for "what did we write where, and when." It's the per-round summary of file-system mutations, distinct from the saga (which is the narrative arc).

When closing a round, the memory-change-log entry is the LAST log to write (after saga, lessons, decisions). It enumerates everything the round touched, including itself.

---

_Round entries appended below. Newest at bottom._
