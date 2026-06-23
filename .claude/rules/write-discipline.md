# Write discipline (§17)

_Read before any project-file write._

## Pattern
Every project-file write routes through one atomic-verify primitive. Direct write tools are hook-blocked at the boundary so the agent cannot bypass.

## Instance
- Primitive: `tools/safe_write.py {replace | append | rewrite | check}`.
- Guards: `tools/hooks/pre_write_guard.py` (PreToolUse Edit / Write / MultiEdit), `tools/hooks/pre_bash_guard.py` (PreToolUse Bash), `tools/hooks/post_write_verify.py` (PostToolUse Bash).
- Wired in `.claude/settings.json`.

## Rules
1. Never use `Edit`, `Write`, or `MultiEdit` on a project file. Use `safe_write`.
2. Never `eslint --fix`. Hand-fix the lint, then route the corrected content through `safe_write`.
3. Never write to a project file from bash (`cat >`, `>>`, `tee`, `sed -i`, `cp`, `mv` into a target path). Use `safe_write`.
4. `replace` payloads must be **LF**-terminated. CRLF flips silently break the diff.
5. For multi-edit mechanical changes, write a temp Python script that computes new content and calls `safe_write.safe_rewrite` for each file (validate-all-then-write transactional shape).
6. Sealed canonicals (`*.golden.sha256` siblings) require explicit user sign-off in the same patch.

## Commands

```bash
# Stage payload to a temp file under outputs, then:
PYTHONUTF8=1 python tools/safe_write.py rewrite <path> --payload-file <staged-file>
PYTHONUTF8=1 python tools/safe_write.py replace <path> --old-file <old> --new-file <new>
PYTHONUTF8=1 python tools/safe_write.py append  <path> --payload-stdin   <<< "…"
PYTHONUTF8=1 python tools/safe_write.py check   <path>
```

## Verify after every write
`post_write_verify` scans for NUL bytes + UTF-8 round-trip + emptiness. If it fires, the recovery hint is `git checkout HEAD -- <file>`.
