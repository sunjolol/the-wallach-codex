# Canary probes

Files in this directory are **overwritten on every `tools/invariants.py` run** (the `safe_write_canary` check). They
exist to verify that the write surfaces (`safe_write`, etc.) actually persist
content to disk byte-equal to intent.

Each canary contains a fresh timestamp + nonce on each audit. After write,
the audit reads the file back via low-level `os.read` (bypassing any Python
or tool-level caching) and verifies the content matches what was written.

If any canary fails its round-trip, the corresponding invariant in
`tools/invariants.py` flags critical. The audit refuses to declare the rest
of the invariants meaningful if the write surface itself can't be trusted.

**Don't edit these by hand.** They have no semantic content beyond their
audit value. If you need to clear them, `safe_write` rewrites them on the
next audit anyway.
