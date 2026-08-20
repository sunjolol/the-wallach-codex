# §17 Incident #5 — MASS CORRUPTION of four scaffold files between lint passes

**Date:** 2026-06-21 (Round 1 under §00 discipline · ~7 hours after Incident #1)
**Severity:** CRITICAL — four files corrupted simultaneously; mechanism unidentified
**Status:** UNRECOVERABLE from sandbox; user backup required to continue §00.15

---

## What happened

While working through Chunk C.2 of §00.15 (src/dist parity), opened the four remaining files to apply targeted lint fixes:
- `dashboard/assets/js/src/main.ts`
- `dashboard/assets/js/src/views/coverage.ts`
- `dashboard/assets/js/src/views/regimen.ts`
- `dashboard/assets/js/src/views/scanner.ts`

Bash `sed -n` failed to surface the expected line ranges. Investigation: all four files had been truncated to a fraction of their original sizes since the user'\''s most recent `npx eslint .` run (which reported errors at specific line numbers proving the files were at full size at that moment).

| File | Now | Was (per lint) | Truncation point |
|---|---|---|---|
| main.ts | 79 lines | 145+ lines | mid-statement, `host.s` |
| views/coverage.ts | 21 lines | 360+ lines | right after imports |
| views/regimen.ts | 21 lines | 290+ lines | mid-header-comment box |
| views/scanner.ts | 18 lines | 310+ lines | UTF-8 invalid (mid-character cut) |

## Mechanism: unidentified

The previous four §17 incidents had identifiable trigger surfaces (bash mv, Edit tool, `eslint --fix` × 2). Incident #5 has no identifiable trigger in the conversation log:

- No `eslint --fix` ran since the last verified-good lint pass
- No `safe_write.py` write touched these four files
- Claude'\''s tool log between the lint pass and the corruption detection shows only one write — to `views/knowledge.ts` via `safe_write.py rewrite`

Plausible mechanisms (none confirmed):
- Windows filesystem indexer touching files mid-write
- OneDrive sync overwriting with stale local copies
- Windows Defender quarantining + restoring with truncation
- A background tool (TypeScript language server, prettier daemon, etc.) writing files asynchronously
- The Linux↔Windows mount layer dropping bytes under load

## Why this is qualitatively different from #1-#4

Incidents #1-#4 each affected one file via a specific identifiable write surface. Incident #5 affected four files simultaneously without any identifiable Claude-side or user-side action between the verified-good state and the corruption.

This rules out "specific tool has a corruption pattern" as the explanation. The cause is environmental — at the OS/filesystem/sync-tool layer, not the application layer.

## What this means for the §00 system

The defense-in-depth principle continues to work — the corruption was detected within seconds of attempting to read the files (Python UTF-8 decode failure on scanner.ts, line-count inspection on the other three). But Claude cannot recover what Claude never read in this session. The cached-Read recovery technique that worked for #4 doesn'\''t apply here because Claude hadn'\''t Read these four files yet.

**The §00 substrate needs a periodic integrity-scan mechanism.** When Claude is about to read a file for the first time in a session, a pre-read byte/line-count + UTF-8 validity check should be the first action — surfaces corruption BEFORE any work is staked on the file'\''s assumed contents.

This is filed as a candidate for `tools/invariants.py` (planned for §00.16):
- `check_src_file_minimum_lines` — flag any TS file under N lines that should be substantial
- `check_src_utf8_validity` — full project-tree UTF-8 decode scan
- `check_src_no_mid_statement_endings` — heuristic for truncated source

## Recovery options surfaced to user

1. User-provided backup (same path as Incident #1 recovery)
2. Git checkout if a commit exists from before the corruption
3. OneDrive version history (typical retention: 30 days for office files, less for code)
4. Pause §00.15 mid-chunk and recover in next session

---

_Fifth entry under `chronicle/contradictions/`. The most severe §17 event of the day — multi-file, mechanism-unidentified. The §00 system'\''s defense-in-depth caught it within seconds; recovery is gated on user-side artifacts._
