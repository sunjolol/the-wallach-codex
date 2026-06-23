# Next chunk — operating system CLEANED → continue **Phase 2** surfaces

**Status (2026-06-22, HEAD after file-audit cleanup A-C4):** The operating contract was
restructured (Cowork) and the entire OLD discipline system was decommissioned.
There is now **ONE instruction surface**: `CLAUDE.md` + `.claude/rules/` (10
files). `memory/` is gone (70 files). `invariants.py` is pruned to **20 checks
that protect the live app / code / eden / §17** — board **20/20 GREEN**, baseline
empty (any red now is a real regression). Phase 1 is done + tagged
`v0.1.0-cleanup-complete`; Phase 2 has started (Coverage/Regimen/Scanner live;
**Knowledge drawer wired in 2A**). The FILE-AUDIT cleanup is now COMPLETE (A: invariants.py dead-helper reachability sweep -151 lines; B: sunjo plan de-staled; C/C2/C3/C4: repo-wide deleted-reference fixes + the 8-file `.claude/rules/` instruction surface now git-TRACKED + orphaned *.payload.tmp / products-db-audit artifacts removed; the stale out-of-repo `C:\Users\Light\Desktop\CLAUDE.md` duplicate deleted by Luneth). Board 20/20. **Do NOT resurrect memory/, brain/, tacitus,
saga/lessons/decisions, or the old invariant paperwork — it was deleted on purpose.**

## First commands (catch-up)
```
PYTHONUTF8=1 python tools/invariants.py | tail -1     # expect: 20/20 passed (0 failed)
git -C "C:/Users/Light/Desktop/claude/health expert" log --oneline -8
node tools/build.mjs                                  # Build OK (~291 KB raw / ~59 KB gzip)
node tools/render_probe.js                            # coverage 20/92, 0 errors
node tools/render_probe_knowledge.js                  # Knowledge drawer + 201-product vault → PASS
```
Read order: `CLAUDE.md` → the matching `.claude/rules/*.md` for your domain →
`sunjo/02-clarifications-and-plan.md` → `REVIEW.md` → `tail -20 chronicle/build-log.md` → this file.

## The new instruction surface (memorize)
- `CLAUDE.md` — orientation + §00 prime directives + Disciplines + the Behavioral-rules table.
- `.claude/rules/`: write-discipline · chokepoint-discipline · data-flow · typescript · testing ·
  commits-and-rounds · windows-host · wild-west-mode · **source-rule (§00.A)** · **engineering-doctrine (§00.B)**.
  (source-rule + engineering-doctrine were folded in from the deleted memory/ during cleanup.)

## What's DONE
- **Phase 1** (1A–1G) tagged `v0.1.0-cleanup-complete` — tacitus/brain/tmp_jscheck excised; invariants tacitus-free.
- **Phase 2 · Chunk 2A** — Knowledge drawer (K) wired (rail + bare-K + Esc); `readProducts` fixed to read the
  vault by `canonical_name` (201 real entries). Probe: `tools/render_probe_knowledge.js`.
- **Cleanup C1–C5** — folded heart/soul canon into `.claude/rules/`; pruned invariants 47→20 (board 20/20);
  deleted 11 orphaned tools + 4 trap docs (HANDOFF, dashboard SUMMARY/README/ARCHITECTURE); deleted all of
  `memory/` + conflict_detector; neutralized `eslint --fix` in dashboard lint-staged; logged §17 incident #6
  (Cowork Write NUL-padding) in `chronicle/contradictions/`.

## Phase 2 REMAINING (recommended order)
1. **Journey drawer (J)** — ASSESSED 2026-06-22: NOT built-but-unmounted like Knowledge. Both
   `views/journey.ts` AND `state/journey.ts` are throwing SCAFFOLDS (types only; every fn throws
   "pending Round 5"). `#drawer-journey-mount` + the J rail button are in `dashboard.html`; `journeyView`
   is imported + sits in `_refs`. Visual contract: `dashboard/components/drawer-journey-v3-PROPOSAL.html`
   (60KB; 4 tabs: Timeline / Goals / Check-ins / Milestones). DECISION (Luneth, 2026-06-22): NO fake seed
   data — the timeline AUTO-DERIVES from real activity (existing chokepoints log real scan/regimen/coverage
   events); a fresh dashboard shows a clean empty-state; check-ins are PRIVATE (never exported — ties to the
   Phase-3 export design). PLAN (~4 chunks): **J1 state engine** (implement logEvent/listEvents/logCheckin/
   listCheckins via `core/storage.getValidated`/`setValidated` + 2 new Zod LS keys + §31 chokepoint writers
   emitting a new `journey:changed` event in `core/events.ts` + the +/-7-day cross-ref walker) -> **J2 view**
   (4-tab render per the v3 mockup + the LOG EVENT footer form; zero inline literal >10 elems) -> **J3 wiring**
   (generalize `mountKnowledgeDrawer`/`toggleKnowledgeDrawer`/`wireKnowledgeKeys` into ONE shared K+J drawer
   helper; mount + J rail toggle + Esc + bare-J) -> **J4** `tools/render_probe_journey.js`. Template to mirror:
   the implemented `views/knowledge.ts` (336 lines) + its 2A wiring in `main.ts` (lines ~108-212, 287-288).
2. **Profile panel + Creator's-Log file-mirror** — Profile mounts (`showProfilePanel`). `state/log.ts::log()`
   is localStorage-only → round-close step 5 is CLI-unfireable. Build `chronicle/creators-log.jsonl` + a
   boot-merge so the Profile log is live AND CLI-writable, unblocking the discipline loop.
3. **Command palette (⌘K)** — `views/palette.ts` exists; universal nav.
Per-surface: data flows `eden/* → schemas/* → core/* → state/* → views/*`; no literal >10-elem array in
views/state; visual-match the v3 mockups in `dashboard/components/` (VISUALS ONLY — that demo code is slop).

## Flags (Luneth's call — not auto-actioned)
- **Old-agent CLI reasoning tools — DELETED** (cleanup C6: label_scorer, trace_verify, symptom_lookup,
  lab_interpreter, stack_coverage, catalog_index). `tools/` is now 10 purposeful files: build_*/extract_*
  (data pipeline) + corpus_search (pipeline dep) + invariants.py + safe_write.py.
- **`sunjo/02-clarifications-and-plan.md`** is the captured plan but has stale file refs (HANDOFF.md, a
  "do not delete memory/" clause now superseded). It's now git-TRACKED. Refresh or leave as captured history.
- **`dashboard.html` still embeds old versions/saga/lessons/decisions content** (shown in Profile/Journey).
  That's live-app content for the Phase-2 Journey/Profile rebuild — intentionally untouched by the purge.
- **`invariants.py` retains a few dead helper fns** from the removed checks (parse-clean, never called) — an
  optional deep-tidy.

## Discipline / gotchas (carry every session)
- **ALL repo writes via `python tools/safe_write.py {replace|append|rewrite|check}`** (Edit/Write hook-blocked).
  Stage payloads in `C:/Users/Light/AppData/Local/Temp` via the Write tool; `replace` payloads must be **LF**.
  For multi-edit mechanical changes, a Temp python script computing new content + `safe_write.safe_rewrite`
  (transactional: validate-all-then-write) worked cleanly across this whole cleanup.
- **Never run a `safe_write` and `python tools/invariants.py` in the SAME Bash command** — invariants emits
  `OK   [warning] …` lines that the `post_write_verify` hook misreads as safe_write paths (false-positive block).
- **CWD trap:** never bare `cd subdir`; use `(cd dir && …)` subshells; recover via PowerShell `Set-Location`.
- **`PYTHONUTF8=1`** prefix for python (Windows cp1252). **NEVER `eslint --fix`** (corruption surface; lint-staged
  is now read-only). **Numbers placeholder-faithful** (migrate verbatim).
- **Round-close:** build OK + invariants 20/20 + render probe + build-log line + commit + push. Creator's-Log
  is deferred until the file-mirror lands (Phase-2 item 2). Co-author trailer: `Claude Opus 4.8`.
- **GitHub:** `origin` = https://github.com/sunjolol/the-wallach-codex (PRIVATE, `master`). Push after each chunk.
  ~95MB copyrighted Wallach PDFs under `knowledge/wallach-books/` — no public repo without the Phase-4 scrub.

## Working commands (verified, Windows host)
- Build `node tools/build.mjs` · Invariants `PYTHONUTF8=1 python tools/invariants.py`
- Lint one file `(cd dashboard && node_modules/.bin/eslint assets/js/src/views/X.ts)` — SUBSHELL, never bare cd
- size-limit `(cd dashboard && node_modules/.bin/size-limit)` · madge `(cd dashboard && node_modules/.bin/madge --circular --extensions ts assets/js/src)`
- Probes: `render_probe.js` · `_seeded` · `_scan` · `_scanner` · `_ocr` · `_adopt` · `_knowledge`
