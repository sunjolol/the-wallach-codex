# Next chunk — Phase 1 (Cleanup) ~COMPLETE → finish **1F-3 + 1G**, then start **Phase 2**

**Status (2026-06-22, HEAD = `1c89ab9`):** The sunjo Phase-1 cleanup is substantively done.
`brain/`, `tacitus/`, and `tmp_jscheck.js` are gone; operating-language docs + enforcement
hooks are in; `invariants.py` is swept of active brain/tacitus refs. Board **43/44** (the one
red, `dashboard_integrity`, is a *pre-existing* stale headless smoke test — NOT a regression).
This file + `chronicle/build-log.md` (read the last ~12 entries: chunks 1B → 1F-2) are the
fast-orient pointers. **Do NOT re-investigate what's below — it's already mapped.**

---

## First commands of the next session (catch-up)
```
PYTHONUTF8=1 python tools/invariants.py | tail -1     # expect: 43/44 passed (1 failed)
git -C "C:/Users/Light/Desktop/claude/health expert" log --oneline -10   # HEAD = 1c89ab9 (1F-2)
node tools/build.mjs                                  # expect: Build OK
node tools/render_probe.js                            # coveredStat ~20, /92, 0 errors
```
Read order (per CLAUDE.md First-5-min): `CLAUDE.md` → `sunjo/02-clarifications-and-plan.md`
→ `REVIEW.md` → `tail -20 chronicle/build-log.md` → `python tools/invariants.py`.

---

## What Phase 1 finished (chunks 1A–1F-2, all committed + pushed)
- **1A** `v0.0.0-pre-cleanup` recovery tag.
- **1B** CLAUDE.md "First 5 minutes" block · root README "Directory glossary" ·
  `chronicle/domain-glossary.md` + `worked-example-chunk.md` · `labels/` + `transcripts/` READMEs.
- **1C** deleted root `tmp_jscheck.js` (was a partial copy of `dashboard/assets/js/legacy-dashboard.js`).
- **1D** built the last two enforcement hooks: `tools/hooks/post_write_verify.py` (PostToolUse/Bash —
  re-scans safe_write'd files for NUL/UTF-8/empty) + `stop_round_close.py` (Stop — blocks only on a
  NEW invariant regression vs `.claude/invariant-baseline.json`; build/log/Creator's-Log are reminders).
  **Both go live next session (settings.json hot-reload).**
- **1E** deleted the retired `brain/` folder (was a dead duplicate of `chronicle/`).
- **1E-sweep** purged stale `brain/` folder-path refs from `invariants.py`.
- **1F-1** retired the 16 Tacitus invariant checks (filter in `list_invariants` via `_RETIRED_TACITUS`).
- **1F-2** de-coupled the catch-up / impl-log / dashboard-embed checks from tacitus, re-sealed
  `last-catchup.json`, then deleted `tacitus/` + `build_tacitus_dashboard_live.py` + `tacitus_simulate.py`.

## Phase 1 REMAINING (do these first next session)
1. **1F-3 — dead-code tidy (optional but wanted; makes `invariants.py` truly tacitus-free).**
   The 16+1 retired checks are *filtered* but their code still exists. Remove:
   - The ~17 dead `def check_tacitus_*` / `check_aegis_history_well_formed` / `check_feature_flags_present`
     / `check_prompt_enum_consumer_sync` / `check_vision_pattern_seed_compliance` /
     `check_dashboard_impl_status_source_purity` / `check_tacitus_prompts_portable_shape` function
     defs (scattered: lines ~102, 827, 858, 898, 962, 1017, 1047, 1256, 1284, 1346, 2014, 2159, 2267,
     2350, 2481, 2769, 3273 — verify with `grep -nE '^def check_(tacitus|aegis_history|feature_flags|prompt_enum|vision_pattern|dashboard_impl)'`).
   - Their `InvariantSpec(...)` registrations (the `name="tacitus_..."` blocks, ~lines 3891, 4055–4405).
   - Once registrations are gone you can also drop the `_RETIRED_TACITUS` frozenset + filter (no longer needed).
   - `tools/catchup_seal.py::_current_tacitus_notebook()` (now-dead) + its docstring tacitus mentions.
   - Historical/incidental tacitus refs in `tools/version_bump.py` (a `tacitus` version key bump —
     versions.json `current{}` only has brain+dashboard, so it's dead), `tools/round74_essence_entries.py`,
     `tools/round73_recovery.py` (a one-time historical recovery script — fine to leave).
   - **Method:** each removal via `safe_write replace` (ast.parse-validated). After each batch,
     `PYTHONUTF8=1 python tools/invariants.py | tail -1` must stay **43/44**.
   - **Leave intact:** the versions.json `"brain"` version KEY + `check_brain_version_sync` (data contract,
     not a folder ref); historical PROSE mentions of tacitus in logs/docs/versions-data (Luneth: keep as history).
2. **1G — tag Phase 1 complete:** `git -C "<root>" tag -a v0.1.0-cleanup-complete -m "Phase 1 cleanup complete"`.

---

## Phase 2 — the real feature work (after 1F-3 + 1G)
Per `sunjo/02-clarifications-and-plan.md` §3. **Coverage (⌘1), Regimen (⌘2), Scanner (⌘3) are ALREADY
live + data-driven** (done pre-sunjo). Remaining surfaces:
- **Knowledge drawer (K)** — `views/knowledge.ts`; its product tab filters on `name` but the vault uses
  `canonical_name` (mirror `readVault`/`RegimenVaultEntrySchema` from the regimen view). Wire the K-key drawer.
- **Journey drawer (J)** — `views/journey.ts` + `state/journey.ts`; Creator's-Log / history timeline.
- **Profile panel** — already mounts (click "Luneth"); extend content. **Natural pairing: the user-approved
  Creator's-Log file-mirror** (`state/log.ts::log()` is localStorage-only → round-close step 5 is
  CLI-unfireable; build `chronicle/creators-log.jsonl` + a `main.ts` boot-merge → makes the Profile log
  live AND lets `stop_round_close.py` see Creator's-Log events).
- **Command palette (⌘K)** — universal nav.
Per-surface: data flows `eden/* → schemas/* → core/* → state/* → views/*`; no literal >10-elem array in
views/state; visual-match the v3 mockups in `dashboard/components/`.

---

## Discipline / gotchas (carry every session)
- **ALL repo writes via `python tools/safe_write.py {replace|append|rewrite|check}`** — direct
  Edit/Write is hook-blocked. Stage payloads in `C:/Users/Light/AppData/Local/Temp` via the Write tool
  (fresh unique names). `replace` payloads must be **LF**. (Memory: `safe-write-crlf-flip`.)
- **CWD trap:** never bare `cd subdir` (drifts the shared Bash+PS cwd, blocks everything). Use
  `(cd dir && …)` subshells; recover via PowerShell `Set-Location "<root>"`. (Memory: `hooks-cwd-relative-trap`.)
- **`PYTHONUTF8=1` prefix** for python on this Windows host (cp1252 stdout crashes on em-dashes).
- **NEVER `eslint --fix`** (§17 corruption surface); fix lint via safe_write.
- **Numbers are placeholder-faithful** — migrate verbatim, never invent, don't chase number-only oddities
  (Luneth batch-corrects at the end). (Memory: `numbers-corrected-at-end`.)
- **Wild West Mode (Phases 1–3):** no TOS/privacy/disclaimers/copyright headers; don't refuse Wallach corpus.
- **Baseline:** `.claude/invariant-baseline.json` tolerates `dashboard_integrity` only. To clear it for real,
  re-base `tools/dashboard_smoke.js` to the new `.tile`/`.regimen-item-row`/`.scanner-grid` markup.
- **GitHub:** `origin` = https://github.com/sunjolol/the-wallach-codex (PRIVATE, branch `master`). Push
  after each chunk: `git -C "C:/Users/Light/Desktop/claude/health expert" push`. Repo holds ~95MB
  copyrighted Wallach PDFs under `knowledge/wallach-books/` — do NOT make the repo public without stripping
  those from history first (Phase 4 copyright scrub, sunjo §8.4).

## Working commands (verified, Windows host)
- Build: `node tools/build.mjs` · Invariants: `PYTHONUTF8=1 python tools/invariants.py`
- Lint one file: `(cd dashboard && node_modules/.bin/eslint assets/js/src/views/X.ts)` — SUBSHELL, never bare cd
- Probes: `node tools/render_probe.js` (coverage) · `render_probe_seeded.js` · `render_probe_scan.js` ·
  `render_probe_ocr.js` · `render_probe_adopt.js` (scanner)
- madge: `(cd dashboard && node_modules/.bin/madge --circular --extensions ts assets/js/src)`
