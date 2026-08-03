---
name: write-discipline
description: Read before any project-file write, and before running bash or python against this repo. Covers the safe_write primitive that all writes must route through, the hook guards that block direct writes, and the three Windows-host quirks (UTF-8, cwd, line endings) that silently break payloads here.
---

# Write discipline (section 17) + the Windows host

## The primitive
Every project-file write routes through `tools/safe_write.py {replace | append | rewrite | check}`.
Direct write tools are hook-blocked at the boundary, so this is not a preference you can opt out of.

```bash
PYTHONUTF8=1 python tools/safe_write.py rewrite <path> --payload-file <staged-file>
PYTHONUTF8=1 python tools/safe_write.py replace <path> --old-file <old> --new-file <new>
PYTHONUTF8=1 python tools/safe_write.py append  <path> --payload-file <staged-file>
PYTHONUTF8=1 python tools/safe_write.py check   <path>
```

Guards: `tools/hooks/pre_write_guard.py` (Edit/Write/MultiEdit), `pre_bash_guard.py` (Bash),
`post_write_verify.py` (PostToolUse). Wired in `.claude/settings.json`.

## Rules
1. Never `Edit`, `Write`, or `MultiEdit` a project file.
2. Never `eslint --fix`. Hand-fix, then route the corrected content through `safe_write`.
3. Never write a project file from bash -- no `cat >`, `>>`, `tee`, `sed -i`, `cp`, `mv` into a target.
4. `replace` payloads must be LF-terminated. A CRLF flip silently matches nothing.
5. Multi-file mechanical changes: write one temp Python script that computes all new content and
   calls `safe_write.safe_rewrite` per file -- validate-all-then-write.
6. Sealed canonicals (anything with a `*.golden.sha256` sibling) need explicit user sign-off in the
   same patch.

## Known defect in the primitive itself
`safe_write` writes and reads with `newline=` unset, so it operates in Python's translated-newline
space: LF becomes CRLF on write, CRLF becomes LF on read. The symmetry makes its own verify pass
while the disk bytes differ from intent. Consequences you will actually hit:

- **A CRLF -> LF repair is structurally impossible through this path.** The replacement happens in
  LF space and the write re-CRLFs it, producing a byte-identical file and a cheerful `OK`.
- A lone `\r` round-trips to `\n`: same length, different content, hence `intended=N landed=N` on a
  *failing* check.
- Every reported size is `len()` of a **string** (characters) while the message says `B on disk`.
  Do not compare it against a byte count from another tool and conclude "unchanged."

**Verify a write landed by asserting the CORRECTION IS PRESENT, not that the byte count moved.**

## Windows host, three things that bite every session
1. **UTF-8.** Python defaults to cp1252 stdout here and crashes on em-dashes. Prefix every
   `python tools/*.py` with `PYTHONUTF8=1`.
2. **CWD does not carry between bash calls.** Use a subshell: `(cd dashboard && ...)`.
3. **Stage payloads with LF endings**, in the scratchpad, under fresh unique filenames.

Two more that have produced false alarms: PowerShell's `Get-Content` decodes UTF-8 as cp1252, so a
correct `·` displays as mojibake; and `git ls-files` escapes non-ASCII paths, so a correct `§`
displays as `\302\247`. Confirm in the encoding the file actually uses before "repairing" anything.
Also: in PowerShell 5.1, `2>&1` on a native command sets `$?` to false regardless of exit code --
check `$LASTEXITCODE` instead, or your instrument will lie to you.

## Verify after every write
`post_write_verify` scans for NUL bytes, UTF-8 round-trip, and emptiness. Recovery hint if it fires:
`git checkout HEAD -- <file>`.
