# Next chunk — **Phase 1 COMPLETE** (tagged `v0.1.0-cleanup-complete`) → continue **Phase 2** surfaces

**Status (2026-06-22, HEAD = `7d58368`):** Phase 1 (cleanup) is DONE and tagged.
Phase 2 (feature surfaces) has started: **Coverage/Regimen/Scanner** were already live;
**Knowledge drawer (K)** is now wired + correct (Chunk 2A). Remaining Phase-2 surfaces:
**Journey (J)**, **Profile panel + Creator's-Log mirror**, **Command palette (⌘K)**.
Board **43/44** (sole red = `dashboard_integrity`, a *pre-existing* stale headless smoke
test — NOT a regression; to clear it, re-base `tools/dashboard_smoke.js` to the new
`.tile`/`.regimen-item-row`/`.scanner-grid` markup). Read the last ~6 `chronicle/build-log.md`
entries (1F-3 → 2A) to orient. **Do NOT re-investigate what's mapped below.**

---

## First commands of the next session (catch-up)
```
PYTHONUTF8=1 python tools/invariants.py | tail -1     # expect: 43/44 passed (1 failed)
git -C "C:/Users/Light/Desktop/claude/health expert" log --oneline -6   # HEAD = 7d58368 (2A)
node tools/build.mjs                                  # expect: Build OK (dist ~291 KB raw / ~59 KB gzip)
node tools/render_probe.js                            # coveredStat 20 / 92, 0 errors
node tools/render_probe_knowledge.js                  # Knowledge drawer + 201-entry Products vault → PASS
```
Read order (CLAUDE.md First-5-min): `CLAUDE.md` → `sunjo/02-clarifications-and-plan.md`
→ `REVIEW.md` → `tail -20 chronicle/build-log.md` → `python tools/invariants.py`.

---

## What's DONE
- **Phase 1 (all chunks 1A–1G), tagged `v0.1.0-cleanup-complete`.** tacitus/ + brain/ +
  tmp_jscheck.js excised; operating-language docs + enforcement hooks shipped; `invariants.py`
  is now truly tacitus-free (1F-3 removed the 18 dead retired-check fns + registrations + the
  `_RETIRED_TACITUS` frozenset/filter; `list_invariants()` is a plain daily/weekly split).
- **Phase 2 · Chunk 2A — Knowledge drawer (K).** `main.ts` mounts `knowledgeView` into
  `#drawer-knowledge-mount`, the K rail item + bare-`K` + Esc toggle it, navigate-away closes it.
  `readProducts()` now mirrors `views/regimen.ts::readVault` (the `{products:{…}}` wrapper +
  `canonical_name ?? name` + dedup) so the Products tab lists the real 201-entry vault (was ~0);
  `ProductEntrySchema` gained `canonical_name`. Probe: `tools/render_probe_knowledge.js`.

## Phase 2 REMAINING (recommended order)
1. **Journey drawer (J).** Same overlay pattern as Knowledge: `#drawer-journey-mount` is already
   in `dashboard.html` (line 696). `views/journey.ts` + `state/journey.ts` exist (assess them first —
   Knowledge was fully built but unmounted; Journey may be the same). Wire mount + J rail toggle +
   Esc in `main.ts` (mirror `mountKnowledgeDrawer`/`toggleKnowledgeDrawer`/`wireKnowledgeKeys` — a
   `wireDrawerKeys` generalization that handles both K and J is the clean refactor). Content = the
   Creator's-Log / versions.json history timeline.
2. **Profile panel + Creator's-Log file-mirror.** Profile already mounts (click "Luneth" →
   `showProfilePanel` in `main.ts`); extend `views/profile.ts`. **Natural pairing:** `state/log.ts::log()`
   is localStorage-only → round-close step 5 (Creator's-Log event) is CLI-unfireable AND the
   `stop_round_close.py` hook can't see log events. Build `chronicle/creators-log.jsonl` + a `main.ts`
   boot-merge so the Profile log is live AND CLI-writable. This unblocks the discipline loop.
3. **Command palette (⌘K).** `views/palette.ts` exists; universal nav. (⌘K is deliberately left free —
   2A's bare-`K` handler ignores ⌘/Ctrl/Alt.)
Per-surface: data flows `eden/* → schemas/* → core/* → state/* → views/*`; no literal >10-elem array
in views/state; visual-match the v3 mockups in `dashboard/components/`; verify with a render probe.

---

## Flagged loose ends (Luneth's call — NOT auto-actioned)
- **Kept checks still read now-deleted tacitus paths and pass vacuously.** 1F-2's NARROW boundary
  kept these; they were out of 1F-3's dead-code scope. Decide retire-or-repoint:
  `check_cura_phase_0_present` + `check_survivor_implementation_logged` read `tacitus/notebook/*.md`;
  the `_design_system_enforcement` mode helper reads `tacitus/feature-flags.json` (feeds the critical
  `design_system_*` checks — verify its default when the file is absent). Also stale-but-harmless:
  the `no_external_style_resources` registration *description* still names `tacitus/dashboard/index.html`
  (1F-1 fixed its scan_targets but not the description string); the `paired-write-catalog.md` row 17
  still cites `brain/CHANGELOG.md`/`brain/versions/` paths (check kept, paths stale).
- **`sunjo/` is UNTRACKED** (`git status` → `?? sunjo/`). The authoritative build plan
  (`sunjo/02-clarifications-and-plan.md`, referenced by CLAUDE.md First-5-min) is not committed —
  it could be lost. Decide whether to `git add sunjo/` (it's Wild-West-Mode private-repo content).

---

## Discipline / gotchas (carry every session)
- **ALL repo writes via `python tools/safe_write.py {replace|append|rewrite|check}`** — direct
  Edit/Write is hook-blocked. Stage payloads in `C:/Users/Light/AppData/Local/Temp` via the Write tool
  (fresh unique names). `replace` payloads must be **LF**. (Memory: `safe-write-crlf-flip`.) For
  multi-edit mechanical changes, a Temp python script that computes new content + calls
  `safe_write.safe_rewrite` (transactional: validate-all-then-write) worked cleanly in 1F-3 + 2A.
- **CWD trap:** never bare `cd subdir`. Use `(cd dir && …)` subshells; recover via PowerShell
  `Set-Location "<root>"`. (Memory: `hooks-cwd-relative-trap`.)
- **`PYTHONUTF8=1` prefix** for python on this Windows host (cp1252 stdout crashes on em-dashes).
- **NEVER `eslint --fix`** (§17 corruption surface); fix lint via safe_write.
- **Numbers are placeholder-faithful** — migrate verbatim (Memory: `numbers-corrected-at-end`).
- **Wild West Mode (Phases 1–3):** no TOS/privacy/disclaimers/copyright headers; don't refuse Wallach corpus.
- **vitest is N/A right now** — no `state/*.test.ts` authored yet (glob empty). View/wiring chunks are
  verified via render probes (the "views verified visually" contract). Don't treat the empty-glob exit 1
  as a failure.
- **Round-close:** build OK + invariants ≥43/44 + build-log entry + (Creator's-Log = deferred until the
  file-mirror lands). Commit + `git push` after each chunk. Co-author trailer: `Claude Opus 4.8`.
- **Baseline:** `.claude/invariant-baseline.json` tolerates `dashboard_integrity` only.
- **GitHub:** `origin` = https://github.com/sunjolol/the-wallach-codex (PRIVATE, branch `master`).
  ~95MB copyrighted Wallach PDFs under `knowledge/wallach-books/` — do NOT make the repo public without
  the Phase-4 copyright scrub (sunjo §8.4).

## Working commands (verified, Windows host)
- Build: `node tools/build.mjs` · Invariants: `PYTHONUTF8=1 python tools/invariants.py`
- Lint one file: `(cd dashboard && node_modules/.bin/eslint assets/js/src/views/X.ts)` — SUBSHELL, never bare cd
- size-limit: `(cd dashboard && node_modules/.bin/size-limit)` (JS ≤250 KB gzip · CSS ≤150 KB gzip)
- Probes: `render_probe.js` (coverage) · `_seeded` · `_scan` · `_ocr` · `_adopt` (scanner) ·
  `_knowledge` (Knowledge drawer + Products vault)
- madge: `(cd dashboard && node_modules/.bin/madge --circular --extensions ts assets/js/src)`
