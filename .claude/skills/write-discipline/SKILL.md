---
name: write-discipline
description: Read before any project-file write, and before running bash or python against this repo. Covers the safe_write primitive that all writes must route through, the hook guards that block direct writes, and the three Windows-host quirks (UTF-8, cwd, line endings) that silently break payloads here.
---

# Write discipline + the Windows host

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
4. `replace` payloads must match the target's line endings **exactly** -- matching is
   byte-exact. Run `check <path>` first; it prints the endings. A mismatch fails loudly
   and names line endings as the cause, but it still fails.
5. Multi-file mechanical changes: write one temp Python script that computes all new content and
   calls `safe_write.safe_rewrite` per file -- validate-all-then-write.
6. Sealed canonicals (anything with a `*.golden.sha256` sibling) need explicit user sign-off in the
   same patch.

## The byte-exact contract (fixed 2026-08-03)
`safe_write` is a transparent pipe: the bytes you stage are the bytes that land. It performs no
newline translation in either direction, its verify compares real disk bytes, and every size it
reports is a true **byte** count.

It was not always, and the wreckage is still visible. Until 2026-08-03 both ends ran in Python's
translated-newline space (LF -> CRLF on write, CRLF -> LF on read). The symmetry made the tool's
own verify a tautology: it passed while the disk differed from intent. If you meet these symptoms
in an older log, this is why:

- It **rewrote every LF file it touched to CRLF** -- the origin of this tree's mixed line endings,
  against a repo that stores LF (`core.autocrlf=input`). Measure the split before trusting any
  count of it; it moves with every batch of files touched.
- A CRLF -> LF repair was **structurally impossible**: the edit happened in LF space and the write
  re-CRLF'd it, yielding a byte-identical file and a cheerful `OK`.
- A lone `\r` round-tripped to `\n` -- same length, different content, hence `intended=N landed=N`
  on a *failing* check.
- Reported sizes were `len()` of a **string** printed as `B on disk`.

`safe_write_canary` now round-trips LF, CRLF and a lone CR and compares true disk bytes via
`os.open(O_BINARY)`. Its old reader omitted that flag, so on Windows it applied the same
translation as the write it was auditing and stayed green through all of the above -- a truth
anchor that shares the defect under test is not a truth anchor. Negative test:
`tools/tests/test_safe_write_byte_exact.py` re-breaks the primitive three ways and asserts the gate
goes red each time.

**Still true regardless:** verify a write landed by asserting the CORRECTION IS PRESENT, not that
a byte count moved.

## Windows host, three things that bite every session
1. **UTF-8.** Python defaults to cp1252 stdout here and crashes on em-dashes. Prefix every
   `python tools/*.py` with `PYTHONUTF8=1`.
2. **CWD does not carry between bash calls.** Use a subshell: `(cd dashboard && ...)`.
3. **Stage payloads in the scratchpad** under fresh unique filenames, with endings that
   MATCH the target. `check <path>` tells you which; most of this tree is CRLF while the
   `Write` tool stages LF, so a conversion step is usually needed.

Two more that have produced false alarms: PowerShell's `Get-Content` decodes UTF-8 as cp1252, so a
correct `·` displays as mojibake; and `git ls-files` escapes non-ASCII paths, so a correct `§`
displays as `\302\247`. Confirm in the encoding the file actually uses before "repairing" anything.
Also: in PowerShell 5.1, `2>&1` on a native command sets `$?` to false regardless of exit code --
check `$LASTEXITCODE` instead, or your instrument will lie to you.

## Verify after every write
`post_write_verify` scans for NUL bytes, UTF-8 round-trip, and emptiness. Recovery hint if it fires:
`git checkout HEAD -- <file>`.
