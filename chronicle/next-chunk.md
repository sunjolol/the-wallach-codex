# Next chunk — operating system CLEANED → continue **Phase 2** surfaces

## LATEST (2026-06-23) — Journey J2 drawer view + Creator's Log system complete + Genesis boot
- **Audit done (Opus 4.8):** the Creator's Log works; its sacred guarantees are STRUCTURAL, re-proven live. Board is now **25/25**: `creators_log_well_formed` + `creators_log_append_only` (critical, git-anchored) + `creators_log_digest_synced` + `creators_log_embed_synced` + `creators_log_archive_synced`.
- **Canonical path is `chronicle/creators-log/log.jsonl`** (+ generated `LOG.md` + `README.md`). The old flat `chronicle/creators-log.jsonl` path is GONE — ignore any older mention of it below.
- **Chunk H shipped (commit 5c63212)** — 3 audit fixes: (4a) digest-spoof closed — `validate_entry` rejects newline summaries + `render_digest` escapes a leading #/> and flattens newlines so the human view can't show a forged entry; (5a) delete-guard now covers the whole `chronicle/creators-log/` dir + `rm -rf chronicle` + a dir `mv`; (5b) a COMMITTED deletion is a hard RED ('SACRED LEDGER REMOVED FROM HEAD') + git-unavailable is a loud fail-open ('⚠ UNVERIFIED').
- **README audit (54be426)** — all 16 READMEs verified accurate; 0 retired-system tokens (tacitus/cura/aegis/vision/brain) in any README. **Glossary fix (a07e164)** — CLAUDE.md dropped Cura/Aegis + slimmed the Tacitus guard; also fixed a pre_bash_guard regex that spanned a separator into an unrelated short-flag.
- **L2 SHIPPED (99215fe) — DASHBOARD Creator's Log.** The CLI ledger is inlined at build (`creators_log.py write_embed()` → `dashboard/assets/data/creators-log-embed.json`; esbuild JSON import in `state/log.ts`) and boot-merged with the LS `wallachCreatorsLog_v1` entries (dedup by id) so the Profile panel shows BOTH. Probe: `tools/render_probe_profile.js`; invariant `creators_log_embed_synced`. The req-3 VISUAL truth-verification layer is LIVE.
- **Chunk N SHIPPED (088ab1c) — navigability archive-tree.** `INDEX.md` (month-by-month map: count + kind tally + digest link) + `digests/YYYY-MM.md` (full history per month) generated over `log.jsonl`; `LOG.md` is now a recent-window view (cap `DIGEST_RECENT=200`). New invariant `creators_log_archive_synced`. `log.jsonl` stays the unsharded canonical spine. The Creator's Log system is now COMPLETE: L1 (CLI mirror) + hardening (4a/5a/5b) + L2 (dashboard boot-merge) + N (navigability). Deferred: cap the L2 embed to recent-N once it grows large.
- **Journey J1 SHIPPED (bb08e5f) — state engine.** `core/schemas/journey.ts` (Zod) + a real `state/journey.ts`: `logEvent`/`listEvents`/`logCheckin`/`listCheckins` (§31 chokepoints to `wallachJourneyEvents_v1`/`wallachJourneyCheckins_v1`, emit `journey:changed`, FIFO cap 5000), `crossRefForCheckin` (±7-day walker), all Zod-validated; `journey:event-logged` → `journey:changed`. `state/journey.ts` (J1) and `views/journey.ts` (J2) are both real now. No fake seed (reads empty; fills from real activity). Functionally smoke-tested.
- **Genesis boot system SHIPPED** — type **`genesis`** → `tools/genesis.py` prints the boot report (banner + invariants/build-parity/Creator's-Log/build-log scoreboard + THIS live pass-off) and Claude ends with the action question (never flair-only). `sunjo/` was renamed → `genesis/` (boot-system home + archived original pass-off); the LIVE rolling pass-off stays `chronicle/next-chunk.md`. CLAUDE.md "Genesis" documents it.
- **Journey J2 SHIPPED — `views/journey.ts` drawer view.** Replaced the throwing scaffold with a real 4-tab renderer (Timeline / Goals / Check-ins / Milestones) using self-namespaced `jd-*` classes (parallel to Knowledge's `kd-*`; the v3-proposal's generic `.timeline`/`.goal-card`/`.milestone` collide with `legacy-dashboard.css` — `jd-*` CSS styling is the Round-6 polish pass). Reads ONLY via the state layer; zero inline literals (day-stamp uses `toLocaleDateString`, not a 12-elem month array). Two mutation hooks: the footer LOG EVENT + the Check-ins quick-entry → inline forms calling `journey.logEvent()`/`logCheckin()` (bounded inputs per §00.B #8: maxlength + slice + clampSeverity + `EventKindSchema.safeParse`). ALSO implemented the READ side of the `state/goals.ts` scaffold (new `core/schemas/goals.ts` with GoalSchema/MilestoneSchema using `.optional()` not `.default()` so input==output types; Zod-validated `listGoals`/`listMilestones` → bad LS empties; `evaluateMilestoneTriggers` stays a deferred throw). tsc strict + eslint clean on all 4 files; invariants 25/25; coverage + knowledge probes green. The view COMPILES but is tree-shaken from the runtime bundle until J3 calls `mount()` (its `jd-`/"LOG EVENT" markers are absent from dist BY DESIGN; tsc is the compile gate).
- **NEXT ORDER (Luneth):** (1) **J3** — generalize the K-drawer mount/toggle/keys (`mountKnowledgeDrawer`/`toggleKnowledgeDrawer`/`wireKnowledgeKeys` in `main.ts`) into ONE shared K+J helper; mount `journeyView` into `#drawer-journey-mount` + J rail toggle + Esc + bare-J; AND wire the auto-derive: subscribe journey to the existing `regimen:changed`/`scanner:scan-complete`/`coverage:recomputed`/`goals:updated` events → `journey.logEvent` (no chokepoint surgery needed). (2) **J4** — `tools/render_probe_journey.js` (the journey drawer's first real runtime/visual test). (3) Command palette (⌘K).
- Older notes below are superseded where they conflict ('older loses').

**Status (2026-06-22, HEAD after file-audit cleanup A-C4):** The operating contract was
restructured (Cowork) and the entire OLD discipline system was decommissioned.
There is now **ONE instruction surface**: `CLAUDE.md` + `.claude/rules/` (11
files). `memory/` is gone (70 files). `invariants.py` is pruned to **20 checks
that protect the live app / code / eden / §17** — board **21/21 GREEN** (+creators_log_well_formed), baseline
empty (any red now is a real regression). Phase 1 is done + tagged
`v0.1.0-cleanup-complete`; Phase 2 has started (Coverage/Regimen/Scanner live;
**Knowledge drawer wired in 2A**). The FILE-AUDIT cleanup is now COMPLETE (A: invariants.py dead-helper reachability sweep -151 lines; B: sunjo plan de-staled; C/C2/C3/C4: repo-wide deleted-reference fixes + the 8-file `.claude/rules/` instruction surface now git-TRACKED + orphaned *.payload.tmp / products-db-audit artifacts removed; the stale out-of-repo `C:\Users\Light\Desktop\CLAUDE.md` duplicate deleted by Luneth). Board 21/21. SINCE THEN: the LOGGING MANDATE was codified (`.claude/rules/logging-doctrine.md` — the 3rd "why" doctrine, historical memory) + **Phase-2 L1** shipped — the Creator's-Log file-mirror (`chronicle/creators-log.jsonl` + `tools/creators_log.py`) makes round-close step 5 CLI-fireable. **Do NOT resurrect memory/, brain/, tacitus,
saga/lessons/decisions, or the old invariant paperwork — it was deleted on purpose.**

## First commands (catch-up)
```
PYTHONUTF8=1 python tools/invariants.py | tail -1     # expect: 25/25 passed (0 failed)
PYTHONUTF8=1 python tools/creators_log.py verify      # Creator's Log: N entries, 0 problems
git -C "C:/Users/Light/Desktop/claude/health expert" log --oneline -8
node tools/build.mjs                                  # Build OK (~309 KB raw / ~66 KB gzip)
node tools/render_probe.js                            # coverage 20/92, 0 errors
node tools/render_probe_knowledge.js                  # Knowledge drawer + 201-product vault → PASS
```
Read order: `CLAUDE.md` → the matching `.claude/rules/*.md` for your domain →
`genesis/02-clarifications-and-plan.md` → `REVIEW.md` → `tail -20 chronicle/build-log.md` → this file.

## The new instruction surface (memorize)
- `CLAUDE.md` — orientation + §00 prime directives + Disciplines + the Behavioral-rules table.
- `.claude/rules/`: write-discipline · chokepoint-discipline · data-flow · typescript · testing ·
  commits-and-rounds · windows-host · wild-west-mode · **source-rule (§00.A)** · **engineering-doctrine (§00.B)** ·
  **logging-doctrine** (the §00 historical-memory why — build>test>log>repeat, repo-as-teaching-tool, never-poison-the-future).
  (source-rule + engineering-doctrine folded in from the deleted memory/ during cleanup; logging-doctrine codified 2026-06-23.)

## What's DONE
- **Phase 1** (1A–1G) tagged `v0.1.0-cleanup-complete` — tacitus/brain/tmp_jscheck excised; invariants tacitus-free.
- **Phase 2 · Chunk 2A** — Knowledge drawer (K) wired (rail + bare-K + Esc); `readProducts` fixed to read the
  vault by `canonical_name` (201 real entries). Probe: `tools/render_probe_knowledge.js`.
- **Cleanup C1–C5** — folded heart/soul canon into `.claude/rules/`; pruned invariants 47→20 (board 20/20);
  deleted 11 orphaned tools + 4 trap docs (HANDOFF, dashboard SUMMARY/README/ARCHITECTURE); deleted all of
  `memory/` + conflict_detector; neutralized `eslint --fix` in dashboard lint-staged; logged §17 incident #6
  (Cowork Write NUL-padding) in `chronicle/contradictions/`.
- **File-audit cleanup A–C4** (2026-06-22/23) — invariants dead-helper sweep (−151 lines) · sunjo plan de-staled ·
  repo-wide deleted-ref fixes · `.claude/rules/` instruction surface git-tracked · orphaned artifacts removed.
- **Logging doctrine codified** — `.claude/rules/logging-doctrine.md` (3rd "why" doctrine: historical memory); wired into CLAUDE.md.
- **Phase 2 · L1 — Creator's-Log file-mirror** — `chronicle/creators-log.jsonl` + `tools/creators_log.py {append,verify,list}`
  make round-close step 5 CLI-fireable; the §00 audit trail now lives in the repo. Invariant `creators_log_well_formed` (board 20→21).
  L2 (the in-app boot-merge into the Profile panel) is the remaining display half — see Phase-2 item 2.

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
2. **Profile panel + Creator's-Log boot-merge (L2)** — the CLI half is DONE (L1: `chronicle/creators-log.jsonl` +
   `tools/creators_log.py`; step 5 CLI-fireable). REMAINING: build the Profile panel (`showProfilePanel`) + the
   app-side boot-merge. The offline file:// app CAN'T fetch() local files at runtime, so embed the jsonl at BUILD
   time (mirror the existing HTML-embedded-JSON / esbuild-JSON-import pattern) and merge it with the LS
   `wallachCreatorsLog_v1` entries in `state/log.ts` (dedup by id) so Profile shows BOTH CLI- and in-app-fired entries.
3. **Command palette (⌘K)** — `views/palette.ts` exists; universal nav.
Per-surface: data flows `eden/* → schemas/* → core/* → state/* → views/*`; no literal >10-elem array in
views/state; visual-match the v3 mockups in `dashboard/components/` (VISUALS ONLY — that demo code is slop).

## Flags (Luneth's call — not auto-actioned)
- **Old-agent CLI reasoning tools — DELETED** (cleanup C6: label_scorer, trace_verify, symptom_lookup,
  lab_interpreter, stack_coverage, catalog_index). `tools/` is now 10 purposeful files: build_*/extract_*
  (data pipeline) + corpus_search (pipeline dep) + invariants.py + safe_write.py.
- **`genesis/02-clarifications-and-plan.md`** is the captured plan but has stale file refs (HANDOFF.md, a
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
- **Round-close:** build OK + invariants 25/25 + render probe + build-log line + **Creator's Log entry** + commit + push.
  Creator's Log is now CLI-fireable (L1): `PYTHONUTF8=1 python tools/creators_log.py append --surface <s> --kind
  <round-close|milestone|incident|design-decision|…> --summary <≤280> [--detail …]` (validated by `creators_log_well_formed`).
  Co-author trailer: `Claude Opus 4.8`.
- **GitHub:** `origin` = https://github.com/sunjolol/the-wallach-codex (PRIVATE, `master`). Push after each chunk.
  ~95MB copyrighted Wallach PDFs under `knowledge/wallach-books/` — no public repo without the Phase-4 scrub.

## Working commands (verified, Windows host)
- Build `node tools/build.mjs` · Invariants `PYTHONUTF8=1 python tools/invariants.py`
- Lint one file `(cd dashboard && node_modules/.bin/eslint assets/js/src/views/X.ts)` — SUBSHELL, never bare cd
- size-limit `(cd dashboard && node_modules/.bin/size-limit)` · madge `(cd dashboard && node_modules/.bin/madge --circular --extensions ts assets/js/src)`
- Probes: `render_probe.js` · `_seeded` · `_scan` · `_scanner` · `_ocr` · `_adopt` · `_knowledge`
