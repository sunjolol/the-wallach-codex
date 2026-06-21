# Verified Patterns Catalog

_Round 140 ship (2026-06-19). See `memory/essence/saga.md` Round 140 entry for full context + rollback recipe._

This catalog holds **verified patterns** — structurally complete recipes that solve a specific load-bearing concern, were proven once in the project, and can be reused via parameter-tuning instead of re-derivation. The catalog is read by:

- **Cura** (Architectural sub-check) when `tacitus/feature-flags.json` `cura_pattern_search.enabled` is true. Cura asks "does this candidate map to an existing pattern?" If yes, the LAND reduces to "apply pattern X with parameter changes" rather than full re-architecture.
- **Vision** (Phase 1 scan) when `tacitus/feature-flags.json` `vision_pattern_seed.enabled` is true. Vision asks "is there a design surface that would benefit from a seed-from-pattern proposal?" Vision proposes ONE candidate per night with exact starter code, framed as a SEED — human verifies the rendered output before any propagation.
- **Claude in co-work mode** — before implementing a substantive change, check this catalog for an applicable pattern (per `operating-protocols.md §27`).

## Entry shape

Every pattern entry follows this structure:

```
## Pattern: <name>
**Source:** <round/file where it was proven>
**Domain:** <design | engineering | security | logging | ops | brain | tacitus>
**When to use:** <decision criteria for matching this pattern to a problem>
**Recipe:** <concrete code/steps — copy-pasteable>
**Parameters that can tune:** <values that vary per instance>
**Anti-patterns this avoids:** <what NOT to do instead>
**Instances:** <list of in-project uses, with file:line references>
```

## Promotion criteria

A pattern enters the catalog only after meeting ALL of:
- **Verified to work** — proven in the project, not theoretical
- **Concrete recipe** — code or step-by-step, not concept
- **At least 2 observed instances** OR single instance with user-confirmed expectation that the work WILL recur
- **User approval gate** — same discipline as essence promotion; entries don't appear without explicit user approval

---

## Pattern: Atomic safe_write + byte-verify

**Source:** Round 73 §17 — `tools/safe_write.py` + Edit tool ban (2026-06-15)
**Domain:** engineering

**When to use:** Any write to a project file under `memory/`, `knowledge/`, `chronicle/`, `tools/`, `dashboard/`, `schemas/`, `tacitus/`. The Edit tool silently truncates; this pattern guarantees byte-equality between intent and disk.

**Recipe:**
1. Read current content via Python (disk truth source).
2. Compute new content in memory.
3. Write new content to `<path>.tmp`.
4. Read `<path>.tmp` back from disk via `os.read` (different surface than Python's file cache).
5. Verify on-disk content matches intent byte-equal.
6. Run file-type-specific parse / shape checks (JS via `node --check`, JSON via `json.loads`, MD via line count).
7. `os.replace(<path>.tmp, <path>)` — atomic on POSIX.
8. Read `<path>` back one more time and verify final state.
9. Print verification report.

**Parameters that can tune:**
- File path
- Operation (replace / append / rewrite / check)
- Shape-check function (per file type)
- `expect_count` (for replace operations)

**Anti-patterns this avoids:**
- Edit tool (silent truncation — observed Rounds 22/41/43/54/56/71b/72/73)
- Direct `open(path, 'w')` without verification (no readback discipline)
- Trusting any tool's own success report without an independent byte-readback

**Instances:**
- `tools/safe_write.py` (the primitive itself)
- All catch-up seal writes (`tools/catchup_seal.py` line ~180)
- All version_bump writes (`tools/version_bump.py` line ~170)
- All dashboard writes (`tools/dashboard_integrity.py` `write_dashboard_atomic`)
- All Tacitus dashboard builds (`tools/build_tacitus_dashboard_live.py` main())

**Frequently used with:**
- **Two-layer enforcement** — safe_write is the write-time layer (auto-rollback on invariant failure); the audit-time layer is the daily manifest run.
- **Cron + sentinel + paired invariant** — every sentinel/cadence-state file write goes through safe_write.
- **Sidecar JSON attestation** — sidecars are written atomically via `safe_rewrite`.

---

## Pattern: Cron + sentinel + paired invariant

**Source:** Round 117 — `tacitus-dashboard-build` scheduled task + `check_tacitus_dashboard_freshness` invariant (2026-06-18)
**Domain:** ops

**When to use:** Any scheduled task whose silent failure or skip would degrade the user's morning experience. The pattern catches three failure modes: task didn't fire, task fired but failed silently, task fired but produced stale output.

**Recipe:**
1. Schedule the task via `mcp__scheduled-tasks__create_scheduled_task` with a clear cron expression.
2. The task writes a sentinel (mtime change OR explicit timestamp field in a JSON file) on successful completion.
3. Add a paired invariant to `tools/invariants.py` that reads the sentinel and verifies freshness against the expected cadence.
4. Set severity to `critical` if user-visible morning surfaces depend on the task; `warning` otherwise.
5. Document the pair in the relevant doctrine section (operating-protocols.md or design-knowledge.md).

**Parameters that can tune:**
- Cron expression (when it fires)
- Sentinel location + format
- Freshness threshold (warning vs critical)
- Severity classification

**Anti-patterns this avoids:**
- Scheduled task with no sentinel (silent failure invisible)
- Sentinel without invariant (sentinel-without-content failure family, Round 73 §16)
- Hard-coded freshness threshold without cadence-justification

**Instances:**
- `tacitus-dashboard-build` cron `35 5 * * 1-5` + `check_tacitus_dashboard_freshness` (Round 117)
- Daily system audit + `check_audit_ran_today` (Round 74)
- Tacitus modes + `check_tacitus_modes_fired_today` (Round 100)

**Frequently used with:**
- **Atomic safe_write** — sentinel writes (`sentinel.json`, `audit-sentinel.json`) are atomic via safe_write.
- **Sidecar JSON attestation** — when the scheduled task is a build pipeline, the sidecar IS the sentinel (Round 137 `extraction-health.json` doubled as both).
- **Append-only structured log + resolution invariant** — for tasks that produce multiple findings per run, the log file's mtime/last-append doubles as the freshness sentinel.

---

## Pattern: Cross-boundary allowlist + critical invariant

**Source:** Round 135 — `_CROSS_IIFE_SYMBOLS` + `check_cross_iife_bare_refs` (2026-06-19)
**Domain:** engineering

**When to use:** When a function/const must be referenced across architectural boundaries (IIFEs, modules, namespaces). Bare-name references silently fall back to `undefined`; the silent fallback ships clean integrity with broken behavior.

**Recipe:**
1. In the defining scope, expose the symbol via the canonical cross-boundary mechanism (`window.X = X` for IIFEs; `export` for modules; etc.).
2. Add the symbol name to a curated allowlist in `tools/invariants.py` (e.g., `_CROSS_IIFE_SYMBOLS`).
3. Add a critical-severity invariant that scans for the canonical exposure of each allowlisted symbol.
4. Every time a NEW cross-boundary symbol is identified (i.e., a recurring failure surfaces), add the symbol to the allowlist in the same patch as the fix.

**Parameters that can tune:**
- Symbol list (grows as new cross-boundary surfaces emerge)
- Scope checker (regex for `window.X = X`, AST walk for `export`, etc.)
- Severity (critical for known recurring failure families; warning for first observations)

**Anti-patterns this avoids:**
- Bare-name cross-IIFE references with `typeof X !== 'undefined'` defensive check (silent fallback to undefined)
- Manual checking without a curated allowlist (rot-prone)
- Single-instance detection without recognizing the family (Round 28 → 131 → 135 → recurring family)

**Instances:**
- `_CROSS_IIFE_SYMBOLS` in `tools/invariants.py` line 1813
- `check_cross_iife_bare_refs` in `tools/invariants.py` line 1823 (critical severity)

**Frequently used with:**
- **Two-layer enforcement** — `check_cross_iife_bare_refs` is wired into BOTH safe_write (write-time, auto-rollback) AND daily audit (audit-time). The dual-layer wiring is what makes the bare-name failure family structurally impossible.
- **Reference standard + nightly Cura audit** — the allowlist itself is a reference standard; Cura can audit whether the project's actual cross-boundary uses are all on the allowlist (potential future extension).

---

## Pattern: Sidecar JSON attestation + paired invariant

**Source:** Round 137 — `tacitus/dashboard/extraction-health.json` + `check_tacitus_dashboard_extraction_health` (2026-06-19)
**Domain:** engineering

**When to use:** Any build pipeline that produces parsed output where silent degradation is a risk. The sidecar is the build's atomic attestation of what it extracted; the audit reads the sidecar (not the heavy artifact) to verify expected properties.

**Recipe:**
1. After a successful build, write a structured JSON sidecar to a known location.
2. Sidecar fields: `schema_version`, `built_at`, `session_date` (or equivalent freshness marker), and per-section/per-phase extraction counts or quality metrics.
3. Write the sidecar atomically (via `safe_write.safe_rewrite`).
4. Add a daily-cadence invariant that reads the sidecar, verifies `session_date == today`, and checks that all expected counts/properties meet minimum thresholds.
5. Defense-in-depth: also add a build-time `_assert_extraction_health` guard that fails the build if it would write degenerate output.

**Parameters that can tune:**
- Sidecar location + schema
- Per-section minimum thresholds
- Freshness marker (today date / iso timestamp / round number)
- Severity (critical for high-stakes UI surfaces; warning for non-blocking)

**Anti-patterns this avoids:**
- Build script that silently produces degenerate output (no fail-loud)
- Audit-time check that re-parses the heavy artifact (brittle, slow)
- Sidecar without freshness check (could be from a stale build run)

**Instances:**
- `tacitus/dashboard/extraction-health.json` + `check_tacitus_dashboard_extraction_health` (Round 137)

**Frequently used with:**
- **Cron + sentinel + paired invariant** — the sidecar serves dual purpose as the cron task's freshness sentinel AND the per-section quality attestation.
- **Atomic safe_write** — sidecar is written via `safe_rewrite` to guarantee no torn writes.
- **Two-layer enforcement** — the build-time `_assert_extraction_health` guard + the daily-cadence invariant form a natural write-time + audit-time pairing for build pipelines.

---

## Pattern: Two-layer enforcement (write-time + audit-time)

**Source:** Round 136 Cure A (safe_write auto-rollback) + Cure B (catch-up invariant manifest) (2026-06-19)
**Domain:** engineering

**When to use:** Any high-stakes discipline where silent shipping must be structurally impossible. The pattern enforces the same invariant at TWO points: at the moment of write (immediate blocking) AND at audit time (defense in depth if the write-time enforcement was bypassed).

**Recipe:**
1. Define the invariant in `tools/invariants.py` with clear severity classification.
2. Wire the invariant into `tools/safe_write.py` via `_should_run_discipline_checks(path)` predicate — runs after every write to the relevant surface, rolls back on critical failure.
3. Wire the same invariant into the daily audit manifest (already there if defined in `INVARIANTS = [...]`).
4. Optionally wire into the `genesis` ritual (see `/CLAUDE.md`) so session-start surfaces the live state.
5. Document the discipline in operating-protocols or design-knowledge with the verified-pattern reference.

**Parameters that can tune:**
- Which invariant is dual-layered
- Which write surfaces receive the auto-rollback discipline (the `_should_run_discipline_checks` predicate)
- Override mechanism for emergencies (`SAFE_WRITE_SKIP_DISCIPLINE=1` env var)

**Anti-patterns this avoids:**
- Discipline-only enforcement (relies on Claude reading docs)
- Audit-only enforcement (failures ship for hours before catch)
- Write-only enforcement (silent bypass if write-script skipped)

**Instances:**
- `check_raw_key_surfacing` — wired into safe_write + daily audit (Round 136 Cure A)
- `check_cross_iife_bare_refs` — wired into safe_write + daily audit (Round 136 Cure A)

**Frequently used with:**
- **Atomic safe_write** — safe_write IS the write-time enforcement surface; this pattern is "extend safe_write's discipline hook + add the same invariant to the daily manifest".
- **Cross-boundary allowlist + critical invariant** — the canonical two-layered family member; bare-name detection is the highest-stakes use case to date.
- **Reference standard + nightly Cura audit** — for non-mechanizable rules (judgment, taste), Cura audit is the equivalent of the audit-time layer; the write-time layer is the Cura/Vision prompt's own discipline.

---

## Pattern: Reference standard + nightly Cura audit

**Source:** Round 136 Cure C — `memory/claude-best-practices.md` + Cura translation-quality sub-check (2026-06-19)
**Domain:** tacitus

**When to use:** Non-mechanizable rules (judgment, style, taste, framing) where mechanical detection isn't possible but consistency matters. The pattern: a manually-maintained external truth file + a periodic Cura audit comparing substrate against the standard.

**Recipe:**
1. Create the reference standard as a markdown file in `memory/`.
2. The standard codifies the load-bearing principles for the domain (numbered sections, explicit examples).
3. Add a Cura sub-check (or extend an existing one) that reads the reference standard each night and audits a rotating sample of the substrate (lessons, prompts, decisions, etc.) against the principles.
4. Output of the audit is a proposed REWRITE of each candidate, with per-principle annotations.
5. Cap the sub-check's LAND count per night (1-2) to absorb backlog cleanup without flooding.
6. Use a cursor file (`tacitus/<sub-check>-audit-cursor.json`) to rotate through substrate so each entry gets re-audited periodically.

**Parameters that can tune:**
- Which reference file is the standard
- Audit cadence (each Cura night; or weekly)
- Sample size per audit (3-5 entries; rotate)
- LAND cap per night (1-2)

**Anti-patterns this avoids:**
- Policy-only enforcement (relies on Claude memorizing standards)
- Single-shot manual cleanup (audit must be ongoing to prevent re-drift)

**Instances:**
- `memory/claude-best-practices.md` + Cura translation-quality sub-check + `tacitus/translation-audit-cursor.json` (Round 136 Cure C)

**Frequently used with:**
- **Two-layer enforcement** — the reference standard is the substrate; the Cura nightly audit is the audit-time layer. Pair with a write-time discipline (Cura/Vision prompt's own rules) for full coverage.
- **Append-only structured log + resolution invariant** — Cura audit findings should land as structured log entries (currently inline in notebook; potential future extension via dedicated `audit-findings.jsonl`).
- **Cron + sentinel + paired invariant** — the freshness invariant (`check_claude_best_practices_freshness`, Round 142) ensures the reference standard itself doesn't rot.

---

## Pattern: Append-only structured log + resolution invariant

**Source:** Round 105 — `vitality-findings.jsonl` + `tools/vitality_log.py` (2026-06-17)
**Domain:** logging

**When to use:** Any class of findings that needs cross-session persistence + per-finding resolution tracking. The pattern: append-only JSONL log + helper tool for append + periodic resolution check + daily invariant catches unresolved entries.

**Recipe:**
1. Create the log file `memory/system/<class>-findings.jsonl`.
2. Build a helper tool `tools/<class>_log.py` with subcommands `append`, `list`, `resolve`, `unresolved`.
3. Every finding gets an entry: `{id, observed_at, source, severity, description, resolved_at: null | iso_timestamp, resolution_notes: null | string}`.
4. Add a daily invariant `check_no_unresolved_<class>_findings` that surfaces unresolved entries; warning severity.
5. Resolution discipline: when a finding is resolved, update the entry's `resolved_at` + `resolution_notes` via the helper (NOT by editing the JSONL directly).

**Parameters that can tune:**
- Log location
- Schema fields per finding
- Resolution invariant cadence (daily / weekly)
- Severity classification

**Anti-patterns this avoids:**
- Ephemeral state (in-memory tracking lost across sessions)
- Direct file edits without atomic discipline
- No resolution tracking (findings rot, undetected)

**Instances:**
- `memory/system/vitality-findings.jsonl` + `tools/vitality_log.py` + `check_no_unresolved_vitality_findings` (Round 105)
- `memory/system/implementations.jsonl` + Round 108 closing-move discipline + `check_implementations_log_well_formed` (Round 108)

**Frequently used with:**
- **Cron + sentinel + paired invariant** — the resolution invariant runs at daily cadence; the log's last-append time doubles as freshness signal.
- **Atomic safe_write** — every append goes through `safe_append` to prevent torn writes during interleaved runs.
- **Reference standard + nightly Cura audit** — Cura findings would benefit from this structure (potential future extension via `audit-findings.jsonl`).

---

## Pattern: Grainy Neumorphism Toggle

**Source:** Round 139 v6 — `https://codepen.io/Juxtopposed/pen/PoyWzEq` (Juxtopposed CodePen)
**Domain:** design

**When to use:** Two-state binary toggle (boolean switch, mode selector, category switcher) where the visual quality bar is Dribbble-quality high design. The pattern fits surfaces where the toggle is the focal point of a section and benefits from tactile depth + ambient glow + film grain.

**Recipe:** See `memory/design-knowledge.md` § Verified Patterns > Grainy Neumorphism Toggle for the full byte-for-byte CSS recipe — six-layer track box-shadow + four-layer switch box-shadow + 2-stop offset radial gradient + multi-stage keyframe bounce + real SVG `feTurbulence` filter overlay.

**Parameters that can tune:**
- Dimensions (scale factor — 0.67 used in Round 139 v6, 0.75 of that in v7)
- Colors (ON state green/red/orange — Round 139 v7 demonstrated orange swap; preserve gradient direction and halo shape)
- Position (left default vs right default — v7 flipped from v6)
- Background context (must remain within 12 hex points of toggle body color for neumorphism color identity per design-knowledge.md Rule 2)
- Slide distance (matches dimension scaling)

**Anti-patterns this avoids:**
- Frutiger Aero / clean teal pill (the v1 miss — pattern-uniform with existing dashboard)
- Asymmetric distinct-tag treatment without 3D depth (v2 miss)
- Saturated balls on contrasting backgrounds (violates neumorphism color identity Rule 2)
- Data-URI noise instead of real SVG filter (v4 miss)
- Cubic-bezier bounce (v4 miss — gives one overshoot, not multi-oscillation)
- Separate halo element with `filter: blur` (v4 miss — sync problems with motion)

**Instances:**
- `.lc-kind-control` in `dashboard/dashboard.html` (Round 139 v6/v7)

**Frequently used with (cross-domain):**
- **Source-first reading** (`memory/design-knowledge.md` Rule 1) — this pattern's existence is the direct consequence of fetching the CodePen source instead of interpreting screenshots. Every design pattern in this catalog inherits Rule 1 as precondition.
- **Atomic safe_write** — engineering substrate for the CSS edit itself; design patterns ship via the same write-time discipline as any other code change.
- **Vision pattern-seed candidate (Round 140)** — this pattern is the first to be eligible for Vision's pattern-seed Phase 1 candidate. Vision proposes ONE seed at ONE surface; human verifies rendered output before propagation.

---

## Pattern: Closing-move record + paired-truthfulness invariant

**Source:** Round 140 (Patterns consulted marker) + Round 148 (four-marker generalization) — `memory/operating-protocols.md §30`
**Domain:** logging

**When to use:** Any project memory surface where work-time discipline (writing log entries, citing references, recording decisions) is load-bearing AND silent skip is undetectable from the work artifact alone. The pattern enforces "did the discipline actually happen?" at audit time rather than at intent time.

**Recipe:**
1. Define the marker shape: `**<Surface> logged:**` block at the bottom of the saga round entry, one bullet per surface touched, each bullet citing a specific entry (file:line, jsonl entry id, or `N/A` with justification).
2. Codify the discipline in `memory/operating-protocols.md §30` (or sibling) with the marker shape + valid `N/A` semantics.
3. Add a paired invariant `check_round_<surface>_marker_truthful` that walks the last N saga rounds, parses the marker, and verifies each citation resolves to a real entry in the target file.
4. Bootstrap-guard the floor round so pre-discipline rounds are tolerated.
5. Add a row to `memory/paired-write-catalog.md` in the same patch.

**Parameters that can tune:**
- Surface name (implementations / lessons / decisions / memory-writes / patterns-consulted / future)
- Citation shape (file:line / jsonl id / `Round N` reference / free prose)
- Floor round (when the discipline became binding)
- Severity (warning for editorial; escalates to critical when the surface becomes load-bearing for correctness)

**Anti-patterns this avoids:**
- Discipline-only enforcement that relies on Claude's intent (Round 120's 24-hour lapse)
- Sentinel without paired check (sentinel-without-content family, §16)
- Citation present but unverified — marker says "logged" but the cited entry is absent

**Instances:**
- `**Patterns consulted:**` + `check_round_pattern_consultation_marker` (Round 140 / `tools/invariants.py` ~line 2050)
- `**Implementations logged:**` + `check_round_implementations_marker_truthful` (Round 148 / ~line 2488)
- `**Lessons logged:**` + `check_round_lessons_marker_truthful` (Round 148 / ~line 2644)
- `**Decisions logged:**` + `check_round_decisions_marker_truthful` (Round 148 / ~line 2680)
- `**Memory writes logged:**` + `check_round_memory_writes_marker_truthful` (Round 148 / ~line 2711)

**Frequently used with:**
- **Catalog-as-visible-enumeration** — every paired-write surface gets a row in `paired-write-catalog.md` citing this pattern's marker + invariant pair
- **Atomic safe_write** — log-entry writes for cited surfaces go through safe_write
- **Append-only structured log + resolution invariant** — for jsonl-shaped surfaces, the marker cites the jsonl entry; the invariant verifies the entry exists

---

## Pattern: Accept-all-shapes alternation parser regex

**Source:** Round 137 (Cura phase regex hardening) + Round 142 D-1 (Aegis meta_observation extension) — `tools/build_tacitus_dashboard_live.py`
**Domain:** engineering

**When to use:** Any parser consuming prose substrate you don't fully control — LLM-authored Tacitus reflections, user-supplied OCR, future external feeds. Prose shape drifts as upstream conventions evolve; a parser tuned to one shape silently fails when the next shape arrives.

**Recipe:**
1. When prose-shape drift surfaces (parser returns empty / dashboard renders degenerate / downstream consumer breaks), identify the new shape against the old.
2. Extend the existing regex via named-group alternation: `(?:OLD_SHAPE|NEW_SHAPE)`. Use `?P<name>` groups when downstream code needs to know which shape matched.
3. Never replace the old shape — historical artifacts (past notebook entries, past OCR scans) remain readable.
4. Ship a build-time `_assert_extraction_health()` guard that fails the build if substantive input produces zero output.
5. Pair with `Sidecar JSON attestation + paired invariant` recording per-section extraction counts.
6. When alternation count crosses ~5 alternatives per surface, escalate: push the convention back upstream (revise prompt / OCR-cleanup pipeline) rather than absorbing infinite drift.

**Parameters that can tune:**
- Number of alternatives in the regex (grows linearly with observed shapes)
- Escalation threshold for upstream-revision (default ~5)
- Severity of the paired health-check invariant

**Anti-patterns this avoids:**
- Replace-only regex updates that break historical prose
- Silent zero-output parsing that ships a clean container with empty content (Round 137: three nights of degenerate Tacitus dashboard)
- Per-shape regex tuning without a fail-loud safety net
- Absorbing infinite alternation count without ever pushing back upstream

**Instances:**
- Cura Phase 2 verdict regex: single-line + two-line + `MERGE INTO LAND` variant (Round 137)
- Cura Phase 3 deepen survivor regex: em-dash+divider + parens-no-divider (Round 137)
- Aegis `meta_observation` header: 4-way alternation — "Meta observation.", "Meta observation", "META OBSERVATION", "PHASE 4 — META OBSERVATION" (Round 142 D-1)

**Frequently used with:**
- **Sidecar JSON attestation + paired invariant** — extraction counts verify the parser produced expected output
- **Atomic safe_write** — the parser's build pipeline writes through safe_write
- **Reference standard + nightly Cura audit** — when alternation reaches the escalation threshold, Cura's audit surface is where the prompt-revision proposal lives

---

## Pattern: Catalog-as-visible-enumeration + closing-move-atomic row-add

**Source:** Round 140 (verified-patterns.md) + Round 148 (paired-write-catalog.md) + Round 150 (state-mutation-catalog.md)
**Domain:** ops

**When to use:** When a structural surface starts recurring (paired writes, runtime state mutations, reusable patterns) AND auditing coverage requires a complete list. Without a visible enumeration, "do we cover all of them?" is unanswerable — the failure family is "playing whack-a-mole" (Round 148 user direction).

**Recipe:**
1. Create the catalog file at `memory/<surface>-catalog.md` (one catalog per surface family).
2. Header explains the failure family the catalog cures + the row-add discipline.
3. Markdown table with one row per instance. Columns: instance identifier + trigger + enforcement mechanism (paired invariant / discipline / `(none yet — <reason>)` placeholder).
4. Closing-move-atomic discipline: any new instance MUST add a row in the same patch as the new instance's ship.
5. Add a coverage invariant `check_<surface>_catalog_coverage` that verifies every cited enforcement mechanism resolves to a registered invariant — or is honestly marked `(none yet)`.
6. Document the row-add discipline in `memory/operating-protocols.md` (or sibling section).
7. Cross-link sibling catalogs in a `## Related` section so navigation flows between them.

**Parameters that can tune:**
- Surface family (paired writes / state mutations / patterns / future)
- Row columns (vary per surface family)
- Coverage invariant severity (warning for editorial; critical for load-bearing correctness)

**Anti-patterns this avoids:**
- Invisible surface accumulation — instances exist but no inventory, no audit
- Catalog without row-add discipline (becomes stale archive)
- Catalog without coverage invariant (citations rot silently)
- Spot-fixing recurring failure families without enumerating the family (whack-a-mole)

**Instances:**
- `memory/verified-patterns.md` (this file; Round 140) — the meta-catalog
- `memory/paired-write-catalog.md` + `check_paired_write_catalog_coverage` (Round 148)
- `memory/state-mutation-catalog.md` + `check_regimen_state_mutation_routing` (Round 150 — routing invariant subsumes the coverage role)

**Frequently used with:**
- **Closing-move record + paired-truthfulness invariant** — the row-add discipline IS a closing-move-atomic application; future catalogs can declare a `**<Catalog> rows added:**` marker
- **Two-layer enforcement** — catalog discipline (write-time) + coverage invariant (audit-time) form the canonical pair at the editorial-surface layer
- **Atomic safe_write** — catalog edits go through safe_write to prevent torn rows

---

## Pattern: Chokepoint helper + window-exposed trigger primitive + paired routing invariant

**Source:** Round 150 / §31 — `triggerRegimenRerender` + 4 chokepoint helpers in `dashboard/dashboard.html` + `check_regimen_state_mutation_routing` (2026-06-19). Promoted Round 156 / Saturday Item 16 per user-confirmed recurrence expectation.
**Domain:** engineering

**When to use:** When multiple mutation sites in a UI write to one or more `localStorage` (LS) keys AND multiple screens consume the resulting state. Without the pattern, every mutation site has to remember to refresh every consuming screen — and any miss leaves stale state on some surface until manual reload (the "cross-surface state sync" failure family observed in Rounds 134, 141, 149).

**Recipe:**
1. Define a `triggerRegimenRerender(label)` style primitive (one per state family) that re-renders every subscribed surface AND dispatches a DOM event for external subscribers. Expose via `window.<name>`.
2. Define N "chokepoint" helpers, one per LS key — each helper performs the `lsWrite(...)` then fires the trigger primitive. Expose via `window.<name>` (cross-IIFE per Round 135 allowlist pattern).
3. Refactor every mutation site to route through a chokepoint helper. No direct `lsWrite` to those keys outside the chokepoints.
4. Add a row per chokepoint AND per subscribed surface to a catalog file at `memory/<surface-family>-mutation-catalog.md` (paired-write-catalog sibling).
5. Add a critical invariant `check_<family>_state_mutation_routing` that verifies: (a) every direct `lsWrite` to a tracked LS key occurs inside one of the chokepoint function bodies (truth anchor: brace-counting on the file), (b) every chokepoint contains the trigger call.
6. Document the discipline in `memory/operating-protocols.md` (Round 150 used §31).

**Parameters that can tune:**
- LS key set (grows as new state surfaces emerge)
- Subscribed surface set (each new screen registers via window export + catalog row)
- Trigger primitive name (one per state family)
- Severity of the routing invariant (critical for high-stakes correctness; warning for editorial state)

**Anti-patterns this avoids:**
- Every mutation site calls every consumer's re-render function directly (call-site-bound discipline; rots when N grows)
- Cascade fires AT the consumer, not at the mutation (consumers race; some surfaces miss the update)
- "Silent" lsWrite outside the chokepoints (Round 149 family — the call-site doesn't know it needed to refresh; the consumer doesn't know to refresh)

**Instances:**
- `triggerRegimenRerender` + `persistRegimen` / `saveRgOverride` / `saveRgManual` / `saveRgRemoved` + `check_regimen_state_mutation_routing` (Round 150 / §31). Subscribed surfaces: Regimen Slots showcase, Regimen tab, Wishlist (Scanner tab).

**Frequently used with:**
- **Cross-boundary allowlist + critical invariant** — the chokepoint helpers AND the trigger primitive are all `window.X = X` exports per the Round 135 cross-IIFE pattern.
- **Catalog-as-visible-enumeration + closing-move-atomic row-add** — `memory/state-mutation-catalog.md` is the catalog instance for this state family.
- **Two-layer enforcement (write-time + audit-time)** — chokepoint discipline at the write surface + the routing invariant at the daily audit.

**When to promote a future instance:** when a 2nd LS-backed state family emerges (themes / user-prefs in dashboard / custom slot styling / etc.), apply this recipe with the new family's LS key set + render functions + catalog file. The umbrella pattern is "any LS-backed multi-surface UI state belongs in a chokepoint regime."

---

## How patterns get added

Per `operating-protocols.md §27`:

1. **During or after a substantive implementation**, Claude evaluates whether the work would be reusable.
2. If yes AND the work meets the promotion criteria (verified + concrete + recurrence-eligible), Claude proposes the catalog entry in the same closing-move-atomic patch.
3. User approves the entry before it lands here.
4. The implementing round's saga entry references the new pattern by name.

## How to disable pattern-search behavior

The user controls Cura's and Vision's pattern-search behavior via `tacitus/feature-flags.json`. To disable:

- **Cura's Architectural sub-check pattern question** — set `flags.cura_pattern_search.enabled` to `false`.
- **Vision's Phase 1 pattern-seed candidate** — set `flags.vision_pattern_seed.enabled` to `false`.

Either flag can be flipped via a co-work request ("turn off Cura pattern suggestions") — Claude updates the JSON in chat. No automated UI / dashboard write surface for these flags; manual user control is intentional for safety.
