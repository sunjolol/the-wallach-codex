# Canary probe

This directory holds one canary, `safe-write-probe.txt`, **overwritten on every
`tools/invariants.py` run** by the `safe_write_canary` gate. It exists to verify that
the write primitive actually persists content to disk byte-equal to intent.

The payload carries a fresh timestamp and nonce, all three newline forms (LF, CRLF and
a lone CR) and a non-ASCII character. After the write, the gate reads the file back via
low-level `os.read` — bypassing any Python or tool-level caching — and compares the raw
bytes to what was written. Each element of the payload guards a way this primitive has
actually failed: translated newlines rewriting every LF file to CRLF while the write's
own verify passed, a lone CR reading back as LF at the same length, and a size counted
in characters but reported as bytes.

If the round-trip fails, that invariant flags critical. The rest of the board is not
meaningful if the write surface itself cannot be trusted.

**Don't edit it by hand.** It has no semantic content beyond its audit value; the next
audit rewrites it.
