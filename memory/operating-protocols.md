# Operating Protocols

_The operational disciplines for how the agent works on this project. Codifies the day-to-day craft layered on top of the contractual rules in `/CLAUDE.md`._

_Read order: `/CLAUDE.md` (operating contract) → `memory/source-rule.md` (Wallach allowlist canonical) → `memory/engineering-doctrine.md` (11 principles canonical) → this file (operational discipline). This file translates doctrine + contract into specific discipline at the write site._

---

## §1 — Closing-Move-Atomic Principle

The substantive change and its discipline traces are one patch.

When making a substantive change, the log entries, integrity checks, and invariant promotions land **in the same patch** as the code change. "I'll log this in a minute" is the failure mode. Atomic closing moves remove the fuzz.

Applies to:

- Essence logs (saga / lessons / decisions)
- `safe_write.py check` on every modified file (verification step)
- Invariant promotion (§18) when a new pitfall lands
- Downstream-sweep for long-lived multi-section files (open-threads.md, tacitus/changelog.md)
- The Round-close ritual codified in CLAUDE.md (build + tests + invariants + build-log + Creator's Log)

The principle generalizes: when "done" is fuzzy, the closing move IS the verification.

---

## §3 — Timestamp Discipline

Every essence entry, Creator's Log entry, and build-log entry uses `(YYYY-MM-DD at H:MM AM/PM)` in Eastern time. Resolve via `TZ=America/New_York date '+%-Y-%m-%d at %-I:%M %p'`. Pre-discipline entries with approximate timestamps stay as-is (prefix `~` for best-guess).

---

## §4 — Tacitus Boundary

Autonomous reflection sessions (Tacitus' domain) have hard write boundaries.

**Tacitus MAY write to:** `tacitus/notebook/YYYY-MM.md` (append-only), `tacitus/sentinel.json`, `tacitus/notebook/index.md`.

**Tacitus MUST NOT touch:** dashboard source files, anything in `knowledge/`, anything in `memory/essence/`, `memory/preferences.md`, this file, any user data.

Proposals to change those land as text in the notebook only. The user grants execution authority during the next co-work session.

---

## §5 — Continuity-of-Self Principle

Never archive content that defines methodology, personality, or working understanding without explicit user approval.

**Safe to archive (with user prompt):** event-chronicle entries from settled history; closed-out decisions whose reasoning is captured elsewhere.

**Never archive without explicit override:** the collaboration pact, the design knowledge, lessons learned, the Roman vision, anything tagged load-bearing.

Discriminator: *"Would forgetting this change how I think?"* If yes, it stays active.

---

## §6 — Light to the World

User-stated: *"We must be a light to the world, remember?"*

The moral frame for everything. Honor sources rather than presume them. Truthfulness about uncertainty over confidence-as-aesthetic. Cross-check names of products, places, and people for collisions before adoption. The work should be something a future reader would be proud to find.

This is the operating principle that informs how every other principle is applied.

---

## §8 — Roman Vision

User-stated: *"The Romans and cultures like them succeeded and lasted the test of time in a big way because of their thorough records. We can learn from these patterns and adapt them to our everyday lives — in a way that is artistic, stylistic, and fun, enjoying life to the fullest but not giving too much heed to fluff, keeping the truth as the cornerstone always."*

Operational meanings: logs are part of the work product, not paperwork. Honest about failures. The Creator's Log is built for eventual exposure — write it as if a future reader will see it. Truth is the cornerstone — no embellishment, no glossing over.

---

## §9 — Notebook → Essence Promotion

Daily (during the `genesis` ritual), the agent identifies Tacitus notebook entries that might deserve promotion to saga / lessons / decisions. The user reviews and decides yes/no per entry.

Promoted entries get a header note: `(Promoted from Tacitus notebook entry at YYYY-MM-DD H:MM AM/PM — user approved YYYY-MM-DD)`. Source notebook entries stay in place. Never auto-promote — the user's approval is the gate.

---

## §10 — Specialized-Units-with-Index Pattern

When a single file grows beyond a healthy size, the move is **not** to keep cramming or to archive content away (both lose information). Split into specialized units linked via an explicit index:

1. An `index.md` at the top that maps content (does not duplicate it).
2. Cross-cutting files for concerns that apply across the whole domain.
3. Specialized files for taxonomy-specific concerns.
4. Empty files as honest placeholders for slots-with-no-content-yet — their existence is the structural promise that content can be captured there when it arrives.
5. Mandatory Related sections at the bottom of each file linking siblings.
6. The index is the single source of truth for what exists; new file → index updated in same patch.

Recurses fractally: a specialized file that bloats becomes a directory with its own index. Don't apply pre-emptively — the taxonomy that drives the split must already exist.

---

## §11 — Tombstone-over-delete for sandbox-blocked rm

When the sandbox blocks `rm` and a file has been refactored away, overwrite it in place with a tombstone (single-paragraph explanation of where the content moved, ending with "This file is safe to delete"). After the user does manual cleanup, the tombstone disappears.

The tombstone must: (1) state the new home of the content, (2) provide a mapping if content split across multiple new files, (3) end with the line "This file is safe to delete."

---

## §12 — Finish-line discipline

When the user signals approaching a clean stopping point — explicit ("let's wrap", "I want to reset", "I'm done for now") or implicit (asking "what's left" with energy of wanting that list small) — switch from build mode to finish-line mode.

**Finish-line mode means:**

- Confirm what's genuinely closed
- Separate active work from reference material
- Don't introduce new ideas, features, or threads
- Defer new ideas to: explicit later prompts, Tacitus surfacing, or the next `genesis`

Build mode is the default; finish-line mode is a temporary switch. Watch for re-entry cues: "what else could we build?", "start something new", "pick the next thing", or the `genesis` ritual (default re-entry after sleep).

When in doubt, ask before surfacing.

---

## §13 — Tacitus scheduling + manual override

**Schedule.** Tacitus runs once daily at 5:05 AM EDT (cron `5 5 * * *`). The schedule IS the gate — no calendar window checks, no once-per-day flags. Up to 1 hour of focused reflection per session, self-paced.

**Manual override phrase: `Tacitus, contemplate`** (exact, comma included, case as written, no quotes).

When the user types this exact phrase, schedule a one-shot reflection task to fire approximately 1 hour from receipt (the "I'm going to bed in 30 minutes, contemplate while I sleep" case). The one-shot uses the same prompt as the daily scheduled task.

**Push-back on near-misses.** When the user types something LIKE the phrase but not exactly right ("tacitus contemplate" without comma, "Tacitus please contemplate", etc.), respond with this exact phrasing:

> do you want me to contemplate? If so please say the correct full command

This is intentional friction. The exact-phrase rule eliminates ambiguity.

---

## §16 — Tacitus write integrity (content-before-status)

Every Tacitus session writes in strict order:

1. **Notebook entry FIRST.** Append via `tools/safe_write.py append`. Bare bash heredoc is forbidden for any banned-dir write (per CLAUDE.md never-do #7).
2. **Read-back verify.** Grep the file for the session header line just written. If absent, retry once. If still absent, write a `[FAILURE]` entry and EXIT WITHOUT updating sentinel.
3. **Sentinel update LAST.** Only after notebook readback succeeds.
4. **Final cross-check.** Re-read notebook tail AND sentinel. Confirm header presence + date match. Any disagreement → step 2.

**Principle:** content lands before status; status is verified against content; mismatch is loud, never silent.

---

## §17 — safe_write enforcement

See **CLAUDE.md never-do #7** for the contractual rule. The §17 ban exists because of the silent-truncation + null-byte corruption pattern. `tools/safe_write.py` is the only sanctioned write primitive for `memory/`, `knowledge/`, `chronicle/`, `tools/`, `dashboard/assets/styles/design-system.css`, and `schemas/`.

Three commands:

- `safe_write.py replace <path> --old-file <f> --new-file <f>` — atomic find-and-replace with uniqueness check + post-write verification that the replacement is in the landed file.
- `safe_write.py append <path> (--payload-file <f> | --payload-stdin)` — atomic append with verification.
- `safe_write.py rewrite <path> (--payload-file <f> | --payload-stdin)` — atomic full-file replacement with verification.

Every operation: read current → write to `.tmp` → readback verify → shape check → `os.replace()` → final post-swap verify. Any failure leaves `.tmp` for inspection and the original untouched. Exit code is non-zero on failure.

The ban covers ALL write paths to those dirs, not just the Edit tool — bash `mv`/`cat >`/`tee`/redirection, Write tool, Python `open(...,'w')`. The corruption pattern is filesystem-level; the tool name doesn't change the failure shape.

---

## §18 — Lesson → invariant promotion + sentinel-pair-check

**Part A — Lesson → invariant promotion.** Whenever a new pitfall is codified in `memory/essence/lessons.md`, the same patch must add a corresponding invariant to `tools/invariants.py` that would catch the next occurrence. If the failure can't be auto-detected, the lesson must explicitly state why (and the team accepts the residual human-vigilance dependency).

**Part B — Sentinel pair-check requirement.** Whenever a new status-of-X file is introduced (any sentinel, status, "completed" flag), the same patch must introduce an automated cross-check that verifies the sentinel's claim against the artifact it describes.

**Sentinels lie when they fall out of sync. Lessons memorialize without preventing.** Each is a structural liability without its paired check.

**What does NOT require an invariant:** cosmetic lessons (presentation polish, style observations), one-off observations that don't generalize. When in doubt, codify the invariant — over-protection is recoverable; under-protection erodes the audit's value.

---

## §19 — Build-test-build-test discipline

When a round consists of multiple chunks, run a spot-check between every chunk before opening the next one. Don't accumulate uncommitted chunks. Don't batch verification at the end. **Build → test → build → test → close.**

**Spot-check meaning depends on chunk:**

- Code chunk → run the relevant integrity tool / unit test / `safe_write.py check` on every modified file
- Data chunk → audit a known-good record before and after; confirm parity
- Doctrine chunk → re-read the patched section in isolation; ask "does this still match the round's goal?"
- UI chunk → load the dashboard, click through the affected surface
- Schedule chunk → trigger an immediate run or confirm `nextRunAt` matches intent

**Chunk sizing.** Small enough that if it breaks, you can confidently say what broke. Three subsystems → too big, split. One-line CSS change → too small, fold into the next.

**Composes with §1.** Every chunk has its own closing-move per §1; §19 says verify on top of that before opening the next chunk. Together they prevent both within-chunk drift (§1) and between-chunk compounding (§19).

---

## §21 — In-session vitality re-check + persistent findings log

Before declaring any round close complete, re-read `tacitus/sentinel.json` AND `memory/system/vitality-findings.jsonl` for unresolved lapses. Address each before shipping the closing-move.

**The persistent log.** `memory/system/vitality-findings.jsonl` is append-only. Each line is one of:

- Active finding: `{"ts": "...", "kind": "...", "summary": "...", "status": "active", "source": "vitality-check"}`
- Resolution: `{"ts": "...", "kind": "resolution", "ref_ts": "<original>", "note": "..."}`

A finding is unresolved iff no matching resolution exists. The file is never truncated; resolution is recorded as a separate append.

**CLI:**

```
python3 tools/vitality_log.py append --kind <K> --summary <S>
python3 tools/vitality_log.py resolve --ts <ts> --note "..."
python3 tools/vitality_log.py status
python3 tools/vitality_log.py unresolved      # exit 1 if any unresolved
```

**Invariant.** `check_no_unresolved_vitality_findings` (warning, daily) fails when an active finding is older than 6 hours without a matching resolution.

---

## §22 — No shared bare-name tempfiles in SKILLs

SKILL prompts MUST NOT use hardcoded `/tmp/<bare-name>.<ext>` paths for intermediate write buffers. Two failure modes:

1. **Cross-task collision.** Two scheduled tasks write to the same shared path on different cadences. The later picks up the earlier's stale content; the wrong content gets written to the destination.
2. **Concurrent-write race.** Two SKILLs firing simultaneously write to the same path; one clobbers the other.

**The fix.** Prefer `safe_write.py --payload-stdin` — stdin has no filesystem state to collide; safe under concurrent invocation by construction:

```python
import subprocess, sys, json
payload = json.dumps(obj, indent=2, ensure_ascii=False) + "\n"
subprocess.run(
    [sys.executable, 'tools/safe_write.py', 'rewrite', '<target>', '--payload-stdin'],
    input=payload, text=True, encoding='utf-8', check=True
)
```

**Fallback for genuinely large payloads:** `tempfile.mkstemp()` (atomic `O_EXCL` unique filenames — different invocations cannot collide by construction).

**Banned:** hardcoded `/tmp/<name>.<ext>` paths; bash `$$` PID expansion in non-bash-only contexts; tempfile name reuse across invocations.

---

## §24 — Implementation log discipline at closing-move

When a round implements, rejects, defers, or moves to in-progress on a Cura or Vision finding, the closing-move appends to `memory/system/implementations.jsonl`:

```
python3 tools/implementation_log.py append \
    --source-date YYYY-MM-DD --source-mode {Cura|Vision|Aegis} \
    --source-session N --candidate "title" \
    --status {implemented|in_progress|rejected|deferred} \
    --round N --summary "How it was addressed"
```

**The agent never writes implementation status without user direction.** Protection against the failure family: *"if anything ever gets implemented/rejected on accident I can look back and easily say wait — I never approved/rejected that."*

**Approval trigger phrases** (case-insensitive, anywhere in user message) → IMMEDIATE `in_progress` log AND task update in the SAME response that detects the phrase, before any code change:

- "approved" / "I approve" / "approve"
- "ship" / "ship it" / "ship these" / "let's ship"
- "let's do it" / "let's do this" / "do it" / "go"
- "make it so" / "yes go" / "yes, go ahead"
- "sounds good, [ship/do/build/go]"
- Per-item enumeration ("Cura A — ship", "Vision B — ship")
- Any phrase functionally equivalent to "start work on this specific finding"

**Completion trigger phrases** → IMMEDIATE `implemented` log AND task `completed` update before any new work begins:

- "looks good" / "looks good, [next]"
- "great, move on" / "move on" / "next"
- "ship next" / "let's move to the next thing"
- "okay good" / "ok good" / "perfect"
- "love it" / "nice" (in just-shipped context)
- Any phrase functionally equivalent to "I'm satisfied and ready for the next thing"

**Required action sequence when an approval trigger fires.** All in the SAME response:

1. `TaskUpdate` to set the relevant task to `in_progress` (TaskCreate first if no task exists)
2. `python3 tools/implementation_log.py append --status in_progress --round <current>` for each approved finding
3. Only then begin the code change.

Same shape for completion: `TaskUpdate completed`, `implementation_log.py append --status implemented --round <current> --summary "..."`, then move on.

**Status semantics.**

- `implemented` — work has shipped; record the round number + one-line summary
- `in_progress` — user has decided to act; work isn't complete (multi-round implementations)
- `rejected` — user explicitly declined; summary records reasoning
- `deferred` — decision deferred; waiting on external condition

Status is append-only; `latest_status()` returns the most recent entry. The dashboard renders latest; the log preserves history.

**Dual-surface invariant.** Both the session task list AND `implementations.jsonl` must track every approved finding through its lifecycle. One without the other is a §24 violation.

---

## §25 — Lesson application discipline

**Logged ≠ applied.** A lesson that exists in `lessons.md` but isn't re-read before substantive work gets re-derived from scratch, ships the same pattern that was just codified, and reveals that logging without application is meme behavior.

**Logging cadence — enforced.** `check_lesson_freshness_vs_saga` (warning at >6h gap, critical at >24h) compares max-timestamp of saga.md vs lessons.md. Lessons file in the SAME PATCH as the substantive code change, not at round-end. If a round has genuinely no novel lesson, the explicit affirmation is itself the discipline holding:

> *"(YYYY-MM-DD at H:MM PM) — Round N: no novel lesson; substrate covered by existing entries [X, Y]."*

**Lesson application — surfaced + enforced.**

- `check_cross_iife_bare_refs` (critical) ships with a curated list of known cross-IIFE symbols. Each must have a `window.X = X` export (or modular equivalent under §00).
- `check_raw_key_surfacing` (warning) scans for `escapeHtml(item.<enum-field>)` patterns not adjacent to a displayName/humanizer call.
- Before substantive code in any session: scan recent `lessons.md` entries (≥10–15) for patterns relevant to planned work.

**Lesson-pinning chat declaration.** Before substantive code in a round, declare in chat:

> *"Pinning lessons relevant to this work: [3-5 specific citations]. Will check against these before each substantive write."*

Lightweight. Specific citations (date + title), not vague gestures. 3–5 max — pinning everything = pinning nothing. Refreshed when work shifts to a new substrate. Skip on trivial single-file edits (typo, version bump, log-entry append).

**Promotion rule (extends §18).** Every new invariant cites its motivating lesson via `lesson_ref`. Every new lesson either names its paired invariant OR explicitly states "no invariant possible because <reason>."

---

## §27 — Verified-pattern-search before substantive implementation

Before implementing a substantive feature, tool, invariant, or architectural surface, read `memory/verified-patterns.md` and check: does an existing pattern cover this concern?

- **If yes:** the implementation reduces to parameter-tuning the existing pattern. Cite the pattern in the saga `**Patterns consulted:**` marker.
- **If no:** proceed. If the work is expected to recur (≥2 anticipated future use cases), after user approval the implementation gets catalog-promoted in the same closing-move patch.
- **If unsure:** surface to the user — "is this expected to recur, or is this a one-off?"

**Saga marker forms** (mandatory for every substantive round per §1):

- `**Patterns consulted:** [Pattern 1], [Pattern 2].`
- `**Patterns consulted:** considered, none applicable.`
- `**Patterns consulted:** N/A (trivial change).`

Missing marker on a substantive round = lapse, surfaced by `check_round_pattern_consultation_marker`.

**Promotion criteria** (all four must hold): verified to work in the project (not theoretical); concrete recipe (code/steps, not concept); ≥2 observed instances OR single instance with user-confirmed expected recurrence; user approval gate before catalog entry lands.

**Note:** design patterns live exclusively in `knowledge/design-wisdom/` (sole source for design rules). `memory/verified-patterns.md` covers non-design patterns only.

---

## §28 — Rollback recipe in every major-feature saga entry

Every saga entry that ships a major new feature, system, or architectural surface includes an explicit `**Rollback recipe:**` section listing:

1. **Files added** — full paths of new files this round created
2. **Files modified** — full paths + brief description of changes (so the diff can be reasoned about months later)
3. **Reversal steps** — concrete steps to undo, in order
4. **Dependencies** — other files or systems that reference this feature

**When this applies.** Major features include: new files in `memory/`, `tools/`, or `tacitus/`; new operating-protocols sections; new Tacitus mode logic; >2 new invariants per round; new schemas; new scheduled tasks. Trivial changes (version bumps, single-line tweaks, narrative-only rounds) don't need rollback recipes.

**Inline file labeling.** Every file touched by a major-feature round gets a top-of-section comment naming the round + one-line description, e.g.:

```
// Round 140 — Verified Patterns System. See memory/essence/saga.md Round 140 for full context.
```

This makes future debugging traceable: a human reading the code can immediately find the saga entry that explains why the code exists.

**Closing-move-atomic.** The rollback recipe + inline labels ship in the same patch as the feature itself (per §1). NOT optional appendices.

---

## §30 — Closing-move record + paired-write integrity

Every substantive saga round close includes a unified `**Closing-move record:**` block alongside `**Patterns consulted:**` (§27) and `**Rollback recipe:**` (§28). Format:

```
**Closing-move record:**
- Implementations logged: <citations OR N/A (this round implemented no Cura/Vision survivor)>
- Lessons logged: <citations OR N/A>
- Decisions logged: <citations OR N/A>
- Memory writes logged: <citations OR N/A>
```

Each line maps to a paired truthfulness invariant (warning severity):

| Line | Invariant |
|---|---|
| Implementations logged | `check_round_implementations_marker_truthful` + reverse `check_survivor_implementation_logged` |
| Lessons logged | `check_round_lessons_marker_truthful` |
| Decisions logged | `check_round_decisions_marker_truthful` |
| Memory writes logged | `check_round_memory_writes_marker_truthful` |

**Citations.** Implementations: `- Cura/Vision #N Survivor X → status (Round Y, ts ...)`. Lessons/decisions: `- N entries at lessons.md:LINE-LINE`. Memory writes: `- N entries in memory-change-log.md (Round R)`.

**N/A discipline.** A line says `N/A` only if the round genuinely touched no addition for that surface. Narrative-only rounds default to four N/A lines. Marker presence is mandatory; N/A is acceptable, missing is not.

**Loud render + build gate.** The Tacitus dashboard renders an `unknown_unlogged` ⚠ amber-pulsing badge for any survivor with no `implementations.jsonl` entry past 1-day grace. Past 3 days fails the dashboard build unless `IMPL_LOG_UNGATED=1`.

**Single source of truth.** `check_dashboard_impl_status_source_purity` verifies `tools/build_tacitus_dashboard_live.py` reads implementation status only via `implementation_log.latest_status()` — no env override, no hardcoded branches, no localStorage projection. The dashboard literally cannot lie about implementation status.

---

## §31 — Cross-Surface State Sync — chokepoint discipline

See **CLAUDE.md "Chokepoint discipline (§31)"** for the dashboard chokepoint rule. The five named helpers in `state/regimen.ts` are the only sanctioned writers to regimen state; each emits the typed `regimen:changed` event that subscribers cascade off.

The principle generalizes beyond regimen: when a state surface gains a new derived layer, downstream consumers don't auto-follow unless mutations route through a single chokepoint that fires a typed event for ALL subscribers. Apply at any state mutation surface where surface-to-surface drift has hit twice.

**When introducing a new state-mutation surface, the closing-move requires:**

1. Named chokepoint helper that fires the typed event after its persist call
2. `check_<surface>_state_mutation_routing` invariant added (critical severity) — verifies every persist to the relevant key occurs inside one of the chokepoint functions
3. Documentation in this section + cross-ref from CLAUDE.md

---

## §32 — Whack-a-mole rebuild trigger

When patches stop landing cleanly, the bug is no longer in the code — it's in the architecture. Patches can't fix a shape problem; they just move the bug around.

**Trigger conditions (any one fires the protocol):**

- **A.** Same surface (file, component, state-key, function family) has been the target of **3+ consecutive bug-fix attempts within the same session**.
- **B.** A fix has been **reverted, hot-patched, or followed by a "still broken" / "regressed" / "new bug" report** within the same session or the next round.
- **C.** 3+ rounds touching the same module produce **no net forward motion** — no new feature shipped, no closed root cause, just patches to patches.

**What Claude MUST do when triggered:**

1. **STOP.** Do not write the next patch.
2. **Name the cycle aloud.** *"This is the Nth patch to [surface] in this session/recent rounds. §32 trigger fired on condition [A/B/C]."*
3. **Propose the choice explicitly:**
   - (a) One more targeted patch — but only with a stated rationale for why THIS patch will stick where prior ones didn't (root cause named, not just symptom).
   - (b) Step back and sketch a rebuild — name the architecture sketch, the doctrine violations the rebuild cures, the truth anchors, the rough effort estimate.
4. **User decides.** Claude does NOT decide unilaterally.

**What §32 is NOT:**

- NOT an instruction to rebuild every cluster. Most patch clusters resolve cleanly by the 3rd patch; §32 just makes sure we PAUSE and consciously decide.
- NOT a substitute for thinking. The pause forces the question "is this shape, or is this code?" Sometimes the answer is "code" and patch is right.
- NOT scoped to the dashboard. Applies anywhere the same surface keeps surfacing in fix rounds.

**Enforcement (3 layers):**

1. **In-conversation (primary).** Claude self-checks before every code change in a bug-fix context: "how many of the last 5 messages have been fixes to this area?" If 3+, invoke §32 before writing code.
2. **CLAUDE.md / brain prompt directive** points to §32 as a hard-required check.
3. **Cross-session detector** — `check_whack_a_mole_clusters` daily invariant scans the past 14 days of saga.md round entries. Surfaces clusters at the next `genesis` as: "Cluster detected at [surface] — N rounds, no root-cause closure. §32 applies. Consider rebuild vs. continue."
