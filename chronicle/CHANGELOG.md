# Brain Changelog

Every change to the active brain (`current.md`) is logged here. Newest at top.

---

## v3.27 — 2026-06-21 — Total dashboard overhaul (Rounds 160-161)
**File:** `versions/v3.27-2026-06-21-total-dashboard-overhaul.md`

Largest single architectural shift in the project's life. Dashboard moves from 3.1MB / 22k-line monolith with embedded teal CSS + IIFE-style JS to a strangler-fig-migrated modular system with sealed design vocabulary, native ES-modules-via-TS-source, and zero external runtime dependencies after Tesseract in-housing. **All 6 dashboard surfaces** migrated to new design system: Coverage workspace (periodic table with 92 tiles + per-tile detail flyout), Regimen workspace (5-slot cart UI + §31 chokepoint discipline now architectural), Scanner workspace (drop/paste/upload + 4-stage OCR pipeline visual + verdict slab), Knowledge drawer (4 tabs: Corpus + Essentials + Products + Doctrine with live search), Journey drawer (4 tabs: Timeline + Goals + Check-ins + Milestones with inline LOG EVENT form), Command Palette ⌘K (JUMP TO + LOOKUP + ASK WALLACH with stopwords-filtered fuzzy match). Tesseract.js v5 + eng.traineddata vendored to `dashboard/assets/vendor/tesseract/` (~22MB) via one-shot `tools/vendor-tesseract.js` Node script — 4-year-portability promise restored, scanner works offline from file://. CSP extended for blob worker + WASM. New TS + esbuild build pipeline; dist/main.js is committed runtime contract. Five pre-existing invariant failures addressed in sealing pass. User-flagged operating-mode shift captured verbatim in `memory/preferences.md` "Division of labor (2026-06-21)" — division of trust between human-defines-excellence and Claude-engineers-execution.

---

## v3.26 — 2026-06-20 — §32 whack-a-mole rebuild trigger + Vision/Aegis design proposal recorded (Round 159)
**File:** `versions/v3.26-2026-06-20-round-159-whack-a-mole.md`

Round 159 — user-recognized structural pattern lands as project protocol. User reflected after Round 158: when patches stop landing cleanly, the bug is in the architecture, not the code (two same-day clusters observed: Rounds 148-152 LS/chokepoint + Round 157 Eden; both rebuilds ended bug streams within 1-2 rounds). Shipped Part A only — lightweight in-session trigger. Three layers: (1) §32 doctrine in `memory/operating-protocols.md` — full trigger conditions, STOP-and-propose protocol, what-it-is-NOT framing; (2) brain prompt directive #6 in `brain/current.md` — inline self-check before bug-fix code; (3) cross-session detector `check_whack_a_mole_clusters` in `tools/invariants.py` (warning severity, always-PASS, scans saga.md last 14 rounds with noise filter excluding always-touched artifacts) — first fire surfaced 2 plausible candidates. Registration row added to `memory/paired-write-catalog.md`. Manifest 55 → 56 daily (1 new warning, no critical). **NOT shipped this round (recorded verbatim at `tacitus/notebook/2026-06.md` for dedicated design session):** Vision `vision_rebuild_proposal` operating mode (additive, 5 pre-condition gates, 0-100 scoring rubric, required "Why this might be wrong" counter-argument paragraph, no-vibes-based-rebuilds discipline) + Aegis patch-fatigue detector (user-correct: this is Aegis's natural domain) + Vision/Aegis simulate-before-ship discipline (Cura EXEMPT — `tools/vision_simulate.py` + `tools/aegis_simulate.py` against historical inputs gates all future prompt/rule changes). Pre-condition for design session: trace minerals brainstorm wraps first per Round 158 user direction. Dashboard NOT touched this round. Eden hash 8e594a01... unchanged; eden_write_protection clean.

---

## v3.25 — 2026-06-20 — Round 158 wrap — dose UX + card restructure + HBSP restore (Eden-aware)
**File:** `versions/v3.25-2026-06-20-round-158-wrap.md`

Round 158 — Saturday evening close, first user-driven Eden polish round. Six-chunk session shipped via 11 safe_write replaces + 3 Edits + 2 truncation recoveries via dashboard_integrity restore. Dashboard v1.102 → v1.106 (4 minor bumps, each chunk shipped+verified+bumped per build-test discipline). Chunks: (A) Dose split — single dose field → Dose × Per Day number inputs with derived scaling_factor + live preview + change-event persist; (B) Scaling alignment — getItemEssentialContributions + renderNutrientList now honor scaling_factor; (C) Card UX restructure — inline Dose+Per Day row on every card body, action row simplified to 2 primary buttons per kind (Recommended: `[Details] [Add to Regimen]`; Regimen: `[Details] [Remove]`), Quick edit + Full edit retired entirely, new rg-btn-primary CSS, renderRegimenTabPreservingState() wrapper preserves expansion+scroll+focus across re-renders; (C+) Null-ref cascade cure — null-guard .rg-edit + .rg-remove + per-card try/catch in bindRegimenCardActions forEach (forEach exception propagation was killing handlers on every card past the first); (D) Remove semantics — adopted recommendations get Unadopt behavior (clear kind override + _adopted_at + _adopted_snapshot, modal copy "Move back to Recommended?"); (E) HBSP restore button — rewritten Eden-aware (dynamic HBSP IDs from REGIMEN_BASE_DATA.recommended + override-layer detection for adopted HBSP + click clears both rgRemoved and kind overrides). 2 new lessons (forEach exception propagation; dynamic-vs-hardcoded ID allowlists after migrations). 2 new decisions (per-card try/catch as render discipline / Pattern E candidate; additive-not-replacive UX moves). No invariant manifest changes. Eden hash 8e594a01... unchanged; all 3 Eden invariants OK; eden_write_protection clean. Trace-minerals brainstorm task filed for next session per user request.

---

## v3.24 — 2026-06-20 — Eden — sealed catalog architecture (Round 157)
**File:** `versions/v3.24-2026-06-20-eden-sealed-catalog.md`

Round 157 — Saturday evening. Introduces Eden, a sealed cryptographically-anchored catalog as the single source of truth for every product recommendation surface in the dashboard. Cures the namespace-conflation root cause behind the late-Round-156 bug cluster (three overlapping ID namespaces: `stk_*`, `scan_*`, ad-hoc embedded). New top-level `eden/` directory: `eden-catalog.json` (USER-WRITTEN, 201 products + 18 goals + HBSP tiers + exception rules), `eden-catalog.golden.sha256` (SHA-256 truth anchor, USER-WRITTEN only via `eden_seal.py`), `SCHEMA.md`, `README.md`, and 4 tools (`eden_verify.py`, `eden_seal.py`, `eden_build.py`, `eden_bootstrap_from_existing.py`). Dashboard refactored: 3 Eden-derived embeds with `eden_version` stamp + boot-time integrity check + Scanner severance (Eden items can never enter Recent scans) + one-time full-reset migration with guard flag + additive recommendation engine (HBSP base + goal-driven candidates + per-goal floor 3 + total floor 6 + soft cap 30) + sealed/disabled edit buttons on Eden items. 3 new critical invariants (manifest +3): `check_eden_hash_integrity` (byte-for-byte SHA-256 anchor), `check_eden_embeds_match_canonical` (eden_version stamp consistency), `check_eden_write_protection` (cross-session enforcement of user-only-writer rule via memory-change-log scan). Dashboard size budget 3.0 MB → 3.5 MB. LS_SCHEMAS gains `edenResetCompleted_v1`. Bootstrap-exception: Claude copied draft→canonical once this session with explicit Path 1 approval, recorded in memory-change-log with `(USER-WRITTEN — bootstrap migration ...)` marker so the write-protection invariant correctly identifies it. From this round forward: user is sole writer of Eden canonical files.

---

## v3.23 — 2026-06-20 — Saturday afternoon close (Round 156)
**File:** `versions/v3.23-2026-06-20-saturday-afternoon-close.md`

Round 156 — Saturday afternoon continuation. Real Item 3 fix (dose_text + has_nutrient_data + load-time syncActiveSlotBundle) + 10 more items shipped. Net invariant manifest delta: removed 5 marker-truthful invariants (folded into one umbrella `check_round_markers_truthful`); added 4 deferred-candidate invariants (`check_deferred_candidate_invariant_drift`, `check_no_native_dialogs`, `check_log_surface_mtimes`, `check_tacitus_dashboard_no_real_data_fetches`); net daily manifest -1 row, same protection. Verified-patterns catalog 12 → 13 (Pattern D — Chokepoint helper + window-exposed trigger primitive + paired routing invariant, promoted per user-confirmed recurrence expectation for future LS-backed multi-surface state surfaces). Cura prompt extended to 6 sub-checks (new: Security, gated on `cura_security_subcheck` flag, cap 1 LAND/night unless CRIT_OVERRIDE). New rotation cursor `tacitus/security-audit-cursor.json`. `tools/version_bump.py` snapshot+rollback atomicity (closes the Round 114 silent-overwrite family at the tool-orchestration layer). `tools/dashboard_integrity.py` budgets bumped to 3.0 MB / 512 KB. Brain prompt `current.md` unchanged; bump reflects discipline/tool-surface additions. Vision Survivor B expansion DEFERRED — paired with V-A as side-by-side experiment to attribute changes per entity (V-B affects Vision, V-A affects Aegis).

---

## v3.22 — 2026-06-20 — Saturday filed work cleared (Round 155)
**File:** `versions/v3.22-2026-06-20-saturday-filed-work-cleared.md`

Round 155 consolidated Saturday close — 5 filed items + (B) cleanup, one round. Net invariant manifest delta: removed `open_threads_status_consistency` (warning); added `cross_iife_bare_refs_reverse_scan` (warning, daily — reverse-direction widening of the Round 135 forward check; catches NEW cross-IIFE bare-reference instances against any IIFE-private symbol); added `best_practices_refresh_status` (warning, weekly — reads docs.claude.com snapshot freshness, no fetch in invariant). New tool surface: `tools/best_practices_refresh.py` (Sunday-conditional fetch + SHA-256 hash + jsonl-append, invoked by `tools/system_audit.py` weekly path; NO new scheduled task). Verified-patterns catalog 9 → 12 entries (Closing-move record + paired-truthfulness invariant; Accept-all-shapes alternation parser regex; Catalog-as-visible-enumeration + closing-move-atomic row-add). Dashboard runtime change: `buildGoalDrivenRecommendedItems` now wires to `getRegimenLabelLookup()` — all synthetic regimen items carry full Youngevity-label nutrient profiles; Round 154's `isGoalDriven` Adopt-modal branch retired. Brain prompt `current.md` unchanged; bump reflects support-layer additions.

---

## v3.20 — 2026-06-19 — Closing the logging loop (Round 148)
**File:** `versions/v3.20-2026-06-19-closing-the-logging-loop.md`

Round 148. Closes the §24/Round 120 logging-discipline failure family at FOUR paired-write surfaces. New operating-protocols §30 (Closing-move record discipline) + `memory/paired-write-catalog.md` enumerating 14 paired-write surfaces. 7 new invariants (manifest 44 → 51): 3 for implementations (marker truthful + reverse survivor check + dashboard source purity); 3 for the generalized markers (lessons / decisions / memory-writes); 1 for catalog coverage. Tacitus dashboard renders loud `unknown_unlogged` ⚠ badge for survivors past 1-day grace; build itself fails for survivors past 3 days without `IMPL_LOG_UNGATED=1`. Compounding bug fix: `latest_status()` now skips entries with `source_session=null` rather than crashing (silent-fail since 2026-06-18 17:15 EDT was dropping ALL impl badges).

## v3.19 — 2026-06-19 — (skipped — version_bump jumped 3.18 → 3.20 directly; v3.19 reserved, no content drift)

## v3.18 — 2026-06-19 — Verified Patterns System (Round 140)
**File:** `versions/v3.18-2026-06-19-verified-patterns-system.md`

Round 140. Generalizes the verified-formula + parameter-tuning workflow from design (Round 139 v6/v7) to all project domains. New: `memory/verified-patterns.md` catalog (9 seed entries); operating-protocols §27 (verified-pattern-search) + §28 (rollback-recipe-in-saga); `tacitus/feature-flags.json` for user-controlled toggles; Cura Architectural sub-check + Vision Phase 1 scan extensions via rubric questions (NOT new sub-checks — preserves Round 137 parser-compatibility lesson); 3 new invariants (manifest 36 → 39). Vision's pattern-seed candidate is hard-capped at one per night with mandatory seed-not-propagate framing because Vision cannot verify rendered output.

## v3.17 — 2026-06-19 — Within-session enforcement + Cura translation-quality (Round 136)
**File:** `versions/v3.17-2026-06-19-within-session-enforcement.md`

Round 136. Round 135 codified discipline invariants but enforcement was across-session only. v3.17 closes the within-session loop via three cures: (A) safe_write auto-rollback on discipline-invariant failure, (B) catch-up trigger runs full invariant manifest at session start, (C) Cura translation-quality sub-check audits documented disciplines against `memory/claude-best-practices.md` reference standard.

## v3.16 — 2026-06-19 — (skipped — Round 135 already at v3.15; v3.16 was reserved)

## v3.15 — 2026-06-17 — Each finding's fate, visible (Round 108)
**File:** `versions/v3.15-2026-06-17-implementation-crystals.md`

Round 108. The user proposed an implementation-indicator system for the Tacitus dashboard, then immediately added the structural accuracy concern that fixed the architecture: *"GREAT multi-purpose system if it ACCURATELY shows what is ACTUALLY approved/rejected and doesn't have disconnection issues like what we've faced already."* That concern upgraded the design from convenience UI to drift-defense surface.

The six-piece structural fix: (1) `memory/system/implementations.jsonl` — canonical append-only persistent log; (2) `tools/implementation_log.py` — helper tool with library API + CLI; (3) new invariant `check_implementations_log_well_formed` in `tools/invariants.py` — truth-anchored to notebook session headers; (4) build script `_attach_implementations()` joins log entries to deepen survivors; (5) dashboard `renderImplBadge()` emits mode-tinted FF save-crystal icons keyed by status; (6) operating-protocols §24 codifies the closing-move discipline — agent never writes implementation status without user direction.

Status enum: `implemented` / `in_progress` / `rejected` / `deferred`. Round 107's three Cura implementations backfilled on Day 1 (open-threads cross-section staleness, v1 task verifiability gap, cl-data-notebook architectural tension — all recorded as `implemented` in Round 107). The dashboard now shows gold crystal + checkmark next to those Cura survivors; Vision's two LANDed survivors (Aegis trend sparkline, Phase 0 pre-flight) sit pristine awaiting user decision.

The principle: same family as Rounds 45 / 104 / 105 / 106 / 107 — shared mutable state across system boundaries drifts; the cure is canonical-source-per-surface + verifier + closing-move discipline. Round 108 closes the SKILL-finding-execution surface. Six rounds of progressively-tightening drift defenses, each instantiating the same principle for a different surface.

The agent's authority boundary, named explicitly in §24: the agent is the SCRIBE of user decisions, not the DECIDER. Even when work is clearly done, the agent waits for the user's explicit approval signal before recording. This protects against "wait... I never approved that" — the failure family the user named when approving the round.

---

## v3.14 — 2026-06-17 — Cura's findings executed (Round 107)
**File:** `versions/v3.14-2026-06-17-cura-findings-executed.md`

Round 107. The user-approved execution of Cura session #1's three findings from 2026-06-17 03:48 AM + 03:55 AM addendum — the first end-to-end proof of the Round 100 cross-mode collaboration loop working as intended.

The three-piece execution: (1) Survivor A — extended `operating-protocols §1` with a new bullet point #6 codifying the downstream-sweep discipline at round close (sweep Active / Deferred / Standing / For-next-session sections of long-lived markdown files for items the close just touched; reconcile version refs; move completed Deferreds; dedup duplicates); (2) Survivor B — new invariant `check_tacitus_v1_task_no_resurrection` in `tools/invariants.py` (today's notebook session headers must all match canonical {Cura, Vision, Aegis} allowlist; severity warning, daily cadence; pins the v1 task deletion claim to file structure rather than prose); (3) Cura addendum — new `operating-protocols §23` codifying markdown embed auto-restore at catch-up (when audit-sentinel shows cl-data-* size mismatch, the agent's routine first action is `dashboard_integrity.py restore`; surface the action per always-surface-all-logs).

The audit-then-execute pattern caught one substantive nuance per finding before shipping. Cura's discipline-only preference for Survivor A was structurally right (file-hygiene invariants are too brittle for the cross-section sweep pattern). Cura's option (c) for the addendum (morning re-sync workflow) was structurally right — NOT a patch job — because alternatives all break Tacitus's clean boundary or train the user to ignore signals or are blocked by offline-first. Round 107 codifies the canonical workflow rather than introducing automation that hasn't earned its place yet.

The cross-mode collaboration loop demonstrated end-to-end: Cura raised it → Vision shaped it (where applicable) → Aegis scored it → user reviewed and approved → co-work executed with audit-then-execute. Now 25 daily invariants total.

---

## v3.13 — 2026-06-17 — Stdin payloads, no shared tempfiles (Round 106)
**File:** `versions/v3.13-2026-06-17-stdin-payloads.md`

Round 106. Triggered by the cross-run tempfile collision the vitality-check task itself surfaced at 2:02 PM: the morning audit's `/tmp/sentinel.json` content silently bled into the afternoon vitality task's write to `tacitus/sentinel.json`. safe_write's verify-read caught it; the agent restored via a PID-scoped tempfile and flagged the SKILL design as the upstream cause.

The three-piece structural fix: (1) `tools/safe_write.py` now accepts `--payload-stdin` — Python subprocess pattern (`subprocess.run(..., input=payload, text=True, encoding='utf-8', check=True)`) eliminates filesystem state from the write path entirely; (2) `logging-vitality-check` SKILL prompt updated via the scheduled-tasks MCP to use stdin pipe for both write paths (lapse + no-lapse); (3) operating-protocols §22 codifies the anti-pattern — bans hardcoded `/tmp/<bare-name>.<ext>` literals in SKILLs, documents stdin as preferred and `tempfile.mkstemp()` as fallback, cross-platform note covers Windows + Linux + Mac.

Full-scope audit completed: ONLY `logging-vitality-check` had the bare-name pattern. Tacitus mode SKILLs say "safe_write OR bash heredoc" without pinning a path; audit tasks call safe_write at Python library layer (no CLI tempfile); tools directory has zero runtime `/tmp/sentinel*` usage. The fix is targeted at the one SKILL that exhibited the anti-pattern + protocol-layer guidance preventing future SKILLs from reintroducing it.

The principle: same family as Rounds 45 / 104 / 105 — shared mutable state across system boundaries drifts; the cure is one canonical source per surface plus a verifier or eliminator of the redundant state. Each round names a specific instantiation. New meta-discipline (drift-surface audit at subsystem-addition time) codified.

Defense in depth held: safe_write's verify-read caught the cross-run collision. Round 106 closes the upstream surface so verify-read continues to exist as the safety net for unforeseen failures, not as the primary mechanism for known ones.

---

## v3.12 — 2026-06-17 — Persistent vitality lapse log + in-session re-check (Round 105)
**File:** `versions/v3.12-2026-06-17-vitality-persistent-log.md`

Round 105. Triggered by the user surfacing a 9 AM EDT vitality-check banner ~5 hours after it fired — the agent had no in-session awareness of the lapse because subsequent clean `system_audit.py` runs had overwritten the shared sentinel's `last_lapse_*` fields. Diagnosis: vitality check and audit both wrote to `memory/system/audit-sentinel.json`'s same fields but answered different questions; clean audit silently clobbered pending vitality lapse.

The four-piece structural fix: (1) `memory/system/vitality-findings.jsonl` — append-only canonical persistent log for vitality findings; audit runs do NOT write here, the surface is owned by the vitality task; (2) `tools/vitality_log.py` — helper tool with library API + CLI (`append` / `resolve` / `status` / `unresolved`); (3) new invariant `check_no_unresolved_vitality_findings` in `tools/invariants.py` (severity warning, 6-hour threshold for active findings); (4) operating-protocols §21 codifies the in-session re-check discipline — every closing-move-atomic re-reads both audit-sentinel.json AND vitality-findings.jsonl before declaring complete.

The principle: **scheduled tasks producing findings each get their own append-only persistent log; shared sentinels are convenience projections of latest state, NOT canonical records.** Same family as Round 104 (canonical vs projection) applied to a new emerging surface. The Roman record's reach extends to scheduled-task findings; the drift family is bounded by the new invariant + §21 discipline.

---

## v3.11 — 2026-06-17 — Round numbers from the saga (Round 104)
**File:** `versions/v3.11-2026-06-17-round-numbers-from-saga.md`

Round 104. Triggered by the user's observation that the main dashboard's journey timeline had silently fallen behind the saga — most-recent history entry showed `round:101 — Honest dietary baseline` (which was actually Round 102's work), and Round 103 was missing entirely. Two root causes named: (a) `tools/version_bump.py` used `max(history.round) + 1` to invent round numbers, which produced off-by-one labels whenever a saga round happened without a versions.json bump; (b) Tacitus-only rounds (Round 101 standalone, Round 103 live observation surface) didn't invoke `version_bump.py` at all because no brain or dashboard version changed.

The four-piece structural fix: (1) `version_bump.py` reads the latest `Round N` heading from `saga.md` via new `latest_saga_round()` rather than inventing a number; (2) new `narrative-only` CLI form for rounds that don't bump brain/dashboard but still need a journey-timeline entry (with optional `--tacitus-bump v2.X` flag); (3) new invariant `check_saga_versions_history_match` in `tools/invariants.py` catches forward drift within 24 hours via contiguous-tail bounding; (4) operating-protocols §20 codifies the closing-move-atomic discipline for the saga↔versions surface. Plus one-time backfill: Round 101 (Tacitus standalone, narrative-only, tacitus v2.0→v2.1), Round 102 (relabeled the off-by-one entry), Round 103 (Tacitus live observation surface, narrative-only, tacitus v2.1→v2.2), Round 104 (this round, brain v3.10→v3.11).

The principle: same as Round 45's single-source-of-truth + propagator, extended to a new structural surface that emerged when Tacitus became a sibling subsystem with its own changelog in Round 100. Saga.md is the canonical source of round numbers; versions.json history is a derived projection. The Roman ideal (thorough faithful records reconstructible from the canonical scroll) is now structurally enforced at the journey-timeline layer.

Companion lesson codified by user articulation: every log surface in the system surfaces its mtime + content summary in regular integrity checks, regardless of whether its content seems intentionally quiet. The user ran a three-day silent test on `memory/memory-change-log.md` that the system did not catch autonomously. Filed as candidate future invariant `check_log_surface_mtimes`.

---

## v3.10 — 2026-06-16 — Catch-up response ordering + Tacitus surface priority (Round 98)
**File:** `versions/v3.10-2026-06-16-catchup-response-ordering.md`

Round 98. Triggered by user spot-check after Round 97's close: *"I'd like to ensure that Tacitus' report is ALWAYS the first thing that is discussed after all checks pass to ensure everything is functioning properly (our major engineering update), THEN if there's ever a situation like this where we want to be reminded of a bigger concept for the next session we keep that as an open thread to be addressed AFTER Tacitus' report."* Plus the size-aware refinement: *"if a Tacitus report is too large it just condenses the 'catch up' response portion and points to the file with the full report as a suggested first move."*

Catch-up trigger now reads `memory/tacitus/YYYY-MM.md` (current-month notebook) in addition to the sentinel. New Phase C / Risk 11 protocol in `brain/current.md` mandates response order: integrity briefing → Tacitus surface (size-aware: short inline, long condensed + file pointer) → open-threads as one-line reminders → "what do you want to do?" close. Principle: catch-up is a briefing room, not a recap. `tools/catchup_seal.py` extended to seal the tacitus notebook dynamically (month-rollover safe); catchup_freshness invariant now guards 16 files. Confirm-or-deny discipline codified for architectural-gap reports.

---

## v3.9 — 2026-06-15 — Invariant manifest + system audit + Tacitus folder + meta-auditor (Round 74)
**File:** `versions/v3.9-2026-06-15-invariant-manifest.md`

Round 74. Triggered by the user directive after Round 73's truncation audit: *"build a system to THINK about and DETECT what could be going wrong, test the hypothesis/search for it, audit, simulate files, every single angle that makes sense/is wise to ensure that we're catching these things before they become a major issue."* The five-piece structural response.

**The new tooling:**
- `tools/invariants.py` — declarative manifest of 13 invariants (11 daily + 2 weekly). Each has truth_anchor, severity, lesson_ref, cadence. Manifest-driven; adding an invariant is appending an entry.
- `tools/system_audit.py` — the runner. Walks the manifest, writes structured reports to `memory/system/audit-YYYY-MM.md`, updates `audit-sentinel.json`. All writes via safe_write.
- `tools/canaries/safe-write-probe.txt` + README — round-trip self-test of the write primitive itself.
- `memory/system/` — audit's own folder. Owns audit-sentinel.json + known-good-hashes.json + monthly audit logs.

**Folder migration:** `memory/notebook/` → `memory/tacitus/`. Shared `.status.json` split into `tacitus/sentinel.json` (Tacitus' fields) + `system/audit-sentinel.json` (audit's fields). Old paths tombstoned per §11. Clean entity ownership.

**Tacitus as meta-auditor (Round 74 expansion):** Reads previous day's `memory/system/audit-YYYY-MM.md` during his 5:05 AM session. Proposes new invariants in his notebook (tag `[invariant-proposal]`). User reviews proposals during co-work and promotes them to `tools/invariants.py` themselves. Tacitus' write boundary unchanged — `memory/tacitus/` only. The loyalty covenant from Round 69 stays intact.

**Doctrine principle 11 — Truth-anchored invariants.** Every check pins to an external truth source that can't itself drift. Stale-to-stale equality is not truth. Each invariant declares its truth_anchor explicitly.

**Operating-protocols §18 — Lesson → invariant promotion + sentinel-pair requirement.** Two-part rule: (a) every new lessons.md pitfall adds a corresponding invariant in the same patch; (b) every new sentinel file adds its paired cross-check in the same patch. Structural enforcement of the audit's coverage growth.

**Five real issues the audit caught on day one:**
1. `brain_version_sync` drift — versions.json bumped to v3.8 in Round 73 but dashboard embed never re-synced.
2. cp1252 encoding crash on Windows — `tools/dashboard_integrity.py` had 3 text-mode open() calls without encoding='utf-8'. Plus 2 more in `tools/version_bump.py`. Fixed all 5; cross-platform Python discipline codified.
3. `%-I` strftime format crash on Windows — glibc-only specifier. Fixed via manual hour-formatting.
4. Missing `#citation-popup` HTML element — present in CSS + JS but not in DOM. Caught only by puppeteer smoke test on user-side.
5. Missing `id="cp-eyebrow"` attribute — my own reconstruction bug in fix #4. Caught on next audit run.

**Brain pitfalls +3 (Round 73):** writer ≠ verifier, agreement ≠ truth when surfaces share cache, known failure modes need detectors. **Brain pitfalls +3 more (Round 74):** cross-platform Python discipline, the audit pays for itself on day one, self-referential parse confusion.

**Pre-Answer Checklist, substance discipline, presentation discipline, source rule:** unchanged from v3.8. v3.9 is pure structural hardening at the audit + write-primitive layer.

---

## v3.8 — 2026-06-15 — Tacitus write integrity
**File:** `versions/v3.8-2026-06-15-tacitus-write-integrity.md`

Round 73. Triggered by the 2026-06-15 Tacitus session #4 silent failure: `.status.json` sentinel updated to `last_reflection_time: 5:15 AM` but the notebook write did not persist; the substance (a real architectural observation about the Label Check coverage pipeline using stale `CURRENT_COVERAGE`) evaporated. User directive after the failure: *"This failure can NEVER happen again. Tacitus NEEDS to work flawlessly and not be stifled by simple oversight issues."*

**Five-layer defense-in-depth response (doctrine §2 applied to autonomous writes):**

- **Layer 1 — Tacitus SKILL.md WRITE ORDER section** rewritten via `mcp__scheduled-tasks__update_scheduled_task`. Notebook entry FIRST via bash heredoc (Edit tool forbidden — known silent-truncation pattern). Read-back verify via grep for the session header. On verification failure: `[FAILURE]` notebook entry; sentinel stays unmoved. Sentinel + `.status.json` update LAST, only after readback succeeds. Final cross-check confirms all three (notebook header today, sentinel = today, last_reflection_date = today). The `[quiet]` path follows the same order — skipping the write isn't an option.

- **Layer 2 — operating-protocols.md §16** added: "Tacitus write integrity — content-before-status, verified, never silent (Round 73)." Codifies the write order as project-wide protocol so it survives skill-file edits. Principle: **content lands before status; status is verified against content; mismatch is loud, never silent.**

- **Layer 3 — daily-audit-morning-briefing** moved from 8:30 AM → 6:40 AM EDT (cron `40 6 * * *`) per user direction. New highest-priority Check 2 — Tacitus sentinel-vs-content drift detection: if sentinel says today but notebook has no session header for today, set `last_lapse_detected` and surface as the first item in the audit output.

- **Layer 4 — brain/current.md `On every session start` step #4** added: read `.status.json` + current-month notebook BEFORE acknowledging the user's first message; if drift detected, hard-wrap the session (same shape as the open-threads stale-state hard-wrap) until user resolves or overrides.

- **Layer 5 — lessons.md** new pitfall entry: "Sentinel-without-content is a real failure family." A status-of-X file is never authoritative on its own — must be cross-checked against the artifact. Generalizable beyond Tacitus.

**Pitfalls library:** +1 entry (sentinel-without-content failure family).

**Substance, presentation, source rule, doctrine, tool surface, pre-answer checklist:** all unchanged from v3.7. v3.8 is pure operational-discipline hardening — the kind of brain bump that makes existing principles structurally enforceable rather than vigilance-dependent.

---

## v3.6 — 2026-06-14 — Tacitus scheduling + manual override (Round 69)
**File:** `versions/v3.6-2026-06-14-tacitus-scheduling.md`

Tacitus' scheduled-task architecture simplified: 30-min polling with 3 gates → single daily fire at 5:05 AM EDT (cron `5 5 * * *`). No activity gates, no calendar window checks; the schedule IS the gate. Up to 1-hour budget, self-paced.

**Manual override phrase codified:** `Tacitus, contemplate` (exact, comma included, case as written). When the user types this exact phrase, schedule a one-shot Tacitus reflection ~1 hour from receipt. Near-misses get the specific push-back response "do you want me to contemplate? If so please say the correct full command" — intentional friction to prevent misfiring.

**Brain change:** new subsection "Schedule + manual override (Round 69)" under the existing Tacitus section. References operating-protocols.md §13 as the full discipline source. No other brain changes.

**Companion changes (not brain content):**
- `operating-protocols.md §13` codifying the manual override + push-back behavior
- `tacitus-autonomous-reflection` scheduled task updated: new cron, new prompt with no-gate framing + 1-hour budget + reaffirmed write boundaries with Luneth's covenant quote
- `logging-vitality-check` scheduled task reduced from hourly to twice daily (9 AM + 9 PM EDT) as belt-and-braces failsafe (closing-move-atomic + integrity tool drift detection have superseded its original purpose)

**Substance + presentation discipline unchanged.** Tool surface unchanged. Pre-Answer Checklist unchanged. v3.6 is the smallest possible brain bump that gets the Tacitus manual override into fresh-reload context.

---

## v3.5 — 2026-06-14 — Specialized-units-with-index pattern (P3.7 → Round 52)
**File:** `versions/v3.5-2026-06-14-specialized-units.md`

Triggered by Round 52's refactor of `memory/user-preferences-and-boundaries.md` into `memory/user-prefs/` (an index hub + 3 cross-cutting files + 14 body-system files matching the canonical `GOAL_DISPLAY_NAMES` taxonomy). The refactor is the first concrete instance of a generalizable pattern the user articulated: when a single file bloats, split it into specialized units linked through an explicit highway — not by archiving content away. Each file does one thing well; the index maps the network; cross-references between siblings make the pieces function as one whole. Codified in `operating-protocols.md` §10 ("The Specialized-Units-with-Index Pattern") with explicit guidance on when to apply, when not to, and how the pattern recurses (a specialized file can itself bloat into a sub-directory). §11 promotes the tombstone-over-delete workaround for sandbox-blocked `rm` from a one-line lessons entry to a first-class protocol.

**Two brain changes:**

- **Catch-up trigger list expanded** to read `memory/user-prefs/index.md` and the three cross-cutting files (`communication.md`, `lifestyle.md`, `aesthetic.md`). Body-system files (`hormones-strength.md`, `cognition.md`, etc.) are read on-demand when their goal is the conversational topic — not on every catch-up, because reading 14 sparse files every reload is overhead the index avoids.

- **Dashboard-gen trigger list updated** to read the `memory/user-prefs/` directory entirely (start at `index.md`, follow into every file). For dashboard generation the full state matters because the dashboard composes all preferences into one personalized view.

**No new pre-answer checklist items, no new tools, no new pitfalls.** The pattern itself is the contribution. Substance + presentation discipline unchanged.

**Companion ships:**
- Operating-protocols.md §10 (Specialized-units-with-index pattern, ~70 lines of doctrine).
- Operating-protocols.md §11 (Tombstone-over-delete, ~15 lines).
- `memory/user-prefs/` (18 files: index + 3 cross-cutting + 14 body-system).
- `memory/user-preferences-and-boundaries.md` → tombstone pointing at the new directory.
- `dashboard/README.md` source-of-truth table updated to reference the new directory.

---

## v3.4 — 2026-06-14 — Consolidation (v2.9 through v3.3 + v3.4 doctrine)
**File:** `versions/v3.4-2026-06-14-consolidation.md`

Triggered by user check-in 2026-06-14 PM: the version *number* in `memory/versions.json` had been tracking correctly (v2.8 → v3.3 across Rounds 22-46) but `brain/current.md` had not been updated since June 13 at 18:30. A real discipline lapse — version bumps were happening as bookkeeping while the brain content stayed at v2.8. v3.4 fixes this by synthesizing v2.9-v3.3 into a coherent brain document and adopting a new rule for the discipline going forward (the brain version bump is the same patch as the brain document write).

**What v3.4 absorbs from v2.9 → v3.3:**

- **v2.9 — Tacitus + scheduled tasks.** New Tacitus section in the brain documenting the autonomous-reflection persona, its hard write boundary (`memory/notebook/` only), the morning briefing protocol (pre-flight digest of notebook entries), and the promotion cadence (notebook → essence requires user approval). Pass 7's `dietary_with_clinical_lever` cited as proof-of-concept: Tacitus session #2 surfaced the tile-kind need that build-mode never had time to notice.
- **v3.0 — Wallach-only source rule + dietary_with_clinical_lever architecture.** New Cornerstone section at the top of the brain (after Role & Source) formalizing the rule as immutable. Allowlist enumerated (Wallach corpus primary, Youngevity primary, pack-extrapolation derived). What's explicitly NOT allowed. Three-confirm override protocol with `[WALLACH-SOURCE-RULE: PROPOSED VIOLATION]` flag and `APPROVE SOURCE-RULE OVERRIDE` as the literal Step-3 phrase. Symmetric application (covers user-initiated proposals too). Audit log location.
- **v3.1 — Integrity tool + closing-move-atomic + escape-on-embed.** Closing-move-atomic added as Operating Principle. `tools/dashboard_integrity.py` documented in the tool surface. Pitfall: "the literal close-script tag inside a script block" — the 2026-06-14 Creator's Log handler bug captured.
- **v3.2 — Tacitus + source-rule combined.** Mostly bookkeeping (label compaction); content already absorbed via v2.9 + v3.0.
- **v3.3 — Engineering doctrine + source-rule cornerstone + integrity firewall.** New Engineering Doctrine section in the brain (after Cornerstone) listing the ten principles. Source-rule details deepened. Integrity tool widened from 4 to 11 checks (parser-breaking content, JS parse, innerHTML scan, JSON schemas, valid kinds, stale version strings, source rule). JSON schemas in `schemas/`. The version bump itself (v3.3 in versions.json) was correctly logged at the time; the corresponding brain document didn't get written until this round.

**What v3.4 adds beyond v2.9-v3.3 absorption:**

- **New pitfall codified.** "Stale brain content while bumping version numbers" — directly addresses the discipline lapse that triggered this round. The version IS the document. Brain 