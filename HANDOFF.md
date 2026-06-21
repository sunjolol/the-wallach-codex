# HANDOFF — Wallach Dashboard Revamp · Claude Code transition

_This document is the bootstrap context for the first Claude Code session on this project. It supersedes anything stale in CLAUDE.md. Read this file in full before any tool call. Then read CLAUDE.md, chronicle/build-log.md (last 20 entries), and chronicle/contradictions/ in full._

---

## §0 — The non-negotiable

**Do not cheat. Do not lie. Do not hard-code demo content into views and call it "done."**

This is not rhetoric. It is the literal reason this handoff exists. The previous session (Round 26) shipped a Coverage view containing 91 tile specs baked into `views/coverage.ts` as TypeScript literals — `MINERALS_FOUNDATIONAL`, `MINERALS_MAJOR_TRACE`, `MINERALS_RARE_TRACE`, `VITAMINS_TILES`, `AMINOS_TILES`, `FATS_TILES`, plus four `SECTION_SPECS`. That is the canonical Wallach 92-essential list. It belongs in `assets/data/` (Eden corpus), behind a Zod schema, loaded once at boot. The view is supposed to be a pure renderer over a `CoverageSnapshot` computed from real regimen state. The smoking-gun proof was on screen: the stat pill said `0 / 0 essentials covered` (the live computation), the section header said `0 / 60 covered` (the hardcoded count). Two divergent totals = two sources of truth = the view was lying about its own data lineage.

Luneth issued an explicit, capitalized warning before that round. The agent acknowledged. The agent then shipped two more rounds (#25, #26) without auditing the existing view code for the violation. The pattern this enforces from now on:

- If you cannot wire the view to real data right now, **say so**. File the gap in `chronicle/build-log.md` and stop. Do not stub with literals.
- If you copy markup from a mockup, copy the **markup structure** only. Every piece of data inside the markup must be parameterized and sourced from `core/` or `state/` via a Zod-validated load.
- If your render needs data that doesn't exist yet, the next step is "add it to `assets/data/` with a schema" — not "fake it in the view."
- Every chunk close re-runs `python3 tools/invariants.py`. If it goes red, **stop and surface the failure as your only response.** Do not work around it. Do not ship more code on top.

You will be tempted to "finish the chunk" by stubbing data. Don't. The lint rule that should have caught this (`no-restricted-syntax` for literal arrays > 10 elements outside `assets/data/`) was advisory and got skipped during the close ritual. The recommended stack below makes this rule blocking via a PreToolUse hook so the temptation is structurally removed.

---

## §1 — Who, why, what

**Luneth** is the sole developer. **Wallach** is Dr. Joel Wallach — the framework's source-of-truth voice. The dashboard is a single-HTML offline-first health-coverage tracker built around the Wallach 90-essentials framework (60 minerals + 16 vitamins + 12 aminos + 3 fats + adjuncts). It opens directly from `file://`. No server. No internet at runtime. No analytics. No external CDN. The user's own regimen, scanned via local OCR (vendored Tesseract.js, ~22 MB under `assets/vendor/tesseract/`), drives every number on every surface.

There are six visible surfaces plus a profile panel:

- **Coverage (⌘1)** — Periodic-table grid of all 92 essentials with per-tile coverage status drawn from the user's current regimen.
- **Regimen (⌘2)** — The user's saved supplement stack with dose/per-day, scaling, override, manual entry, and HBSP restore.
- **Scanner (⌘3)** — Drop/paste/upload a supplement-facts label, OCR + parse, verdict against Wallach rules.
- **Knowledge drawer (K)** — Wallach corpus excerpts (dddl, rbs, eps, ygy, wallach-lecture allowlist).
- **Journey drawer (J)** — User's progression and saved milestones.
- **Command palette (⌘K)** — Universal navigation.
- **Profile panel** — Click "Luneth" in the header. Surfaces Creator's Log + invariant scoreboard + build status.

The work that remains is **the dashboard revamp**: migrating every surface onto the v3 design system (already sealed at `dashboard/assets/styles/design-system.css`, golden-hash anchored), wired to real state, with the layer architecture (`views/ → state/ → core/`) intact. The design language is done. The reference mockups are done. The data primitives in `core/` and the chokepoints in `state/regimen.ts` are done. **What is missing is the view code that wires the real state into the design vocabulary** — and that is the work to be completed without faking it.

---

## §2 — What exists today (orient before touching anything)

The repo root is currently `C:\Users\Light\Desktop\claude\health expert` on a Windows host, mounted into a Linux sandbox at `/sessions/.../mnt/health expert/`. The cross-mount layer is itself a source of corruption — see §4.

These are the load-bearing surfaces:

- **`CLAUDE.md`** — Operating contract. Some sections are stale post the brain→chronicle rename; trust this HANDOFF over CLAUDE.md where they disagree.
- **`chronicle/`** — Discipline ledger. `chronicle/build-log.md` is the pre-write contract (every dashboard write logged one line first). `chronicle/CHANGELOG.md` is version narrative. `chronicle/contradictions/` is the audit channel for prime-directive conflicts and §17 corruption incidents.
- **`tools/invariants.py`** — 60 gate checks across source rule, write protection, regimen-state routing, sealed-canonical hash integrity, etc. This is the single source of truth for "is the project in a sane state right now." Two checks are currently red and need to be fixed in the first cleanup pass (see §5).
- **`tools/safe_write.py`** — The atomic-rename-with-readback-verify write primitive. The `chronicle/contradictions/*` reports document why every project-file write must route through this. Six §17 incidents in one day are why this rule exists.
- **`dashboard/assets/styles/design-system.css`** — SEALED canonical. Hash-anchored. User-only writer. Already shipped (Round 160) with 5 self-hosted typefaces (Playfair Display, Merriweather, Crimson Pro, Space Grotesk, JetBrains Mono) and a full `--ds-*` token vocabulary. Do not edit. Read it as the design contract.
- **`dashboard/assets/styles/workspace-coverage.css`** — Extracted from the v3.2 Coverage mockup (Round 26 close). Visual fidelity layer. The view code references its classes.
- **`dashboard/components/`** — Mockup reference HTML files. Read these to understand the visual target. **Do not copy data from them into TypeScript.** Copy structure only.
- **`dashboard/assets/js/src/{core,state,views}/`** — The TypeScript source. Layer rules enforced by `eslint-plugin-boundaries`: views imports state imports core; never the reverse.
- **`dashboard/assets/js/dist/main.js`** — The bundled IIFE the HTML loads. Generated by `tools/build.mjs` or `tools/build-dashboard.sh`. Never hand-edit.
- **`assets/data/` (and the `eden/` Eden corpus)** — The canonical data layer. The Wallach essentials, the catalog, the seal manifests. Anything a view renders must come from here through a Zod schema in `core/schemas/`.

Hooks that already exist at the git-history layer (from the Cowork-era install): `dashboard/.git/hooks/pre-commit` and `pre-push`. These run typecheck, lint, vitest, size-limit, knip, madge. They worked when invoked. They are scoped to the dashboard subdirectory only — there is no git anchor at the repo root, which is one of the reasons mass corruption (incident #5) was unrecoverable.

---

## §3 — Architecture in one paragraph

A single-HTML offline-first dashboard. TypeScript source under `dashboard/assets/js/src/` compiles via `tsc --noEmit` (type-check only) + `esbuild` (bundle) to one IIFE at `dashboard/assets/js/dist/main.js`. Three module layers enforced by ESLint boundaries: `core/` holds primitives (only imports `zod`), `state/` holds reactive state plus the five named chokepoint mutations in `state/regimen.ts` (`persistRegimen`, `saveRgOverride`, `saveRgManual`, `saveRgRemoved`, `saveRgUserGoals`), and `views/` holds render functions and DOM event handlers (may read state, may not write LocalStorage). The five chokepoints are the **only** allowed writers to regimen LocalStorage keys; this is the §31 discipline. Sealed canonicals (`design-system.css`, eden manifest) have golden SHA-256 anchors; the user is the only allowed writer. All cross-layer imports use path aliases (`@core/*`, `@state/*`, `@views/*`). Bundle budget: 250 KB gzipped for `dist/main.js`, 150 KB combined gzipped for CSS, 350 MB shipped total. State persists to LocalStorage through the chokepoint in `core/storage.ts` only; bare `localStorage.` references elsewhere fail lint.

---

## §4 — What went wrong (so you do not repeat it)

Six §17 corruption incidents in one day, plus one prime-directive violation. Full forensic reports in `chronicle/contradictions/`. The summary you need to internalize before writing any file:

**The §17 family — silent file corruption** across four distinct write surfaces:

1. **Bash `mv` + heredoc** on the Windows mount produced a file containing 1 KB of intended content followed by 52 KB of null bytes (mass file corruption when both `mv` and `cat > path` hit the same path).
2. **The Edit tool** silently truncated `dashboard/package.json` at 506 bytes mid-string during a routine expansion. The Read tool then **lied** about the disk state by returning the intended content from cache. The downstream JSON parser caught it.
3. **`eslint --fix`** appended 155 null bytes to `creators-log-handler.js` after the final `})();`.
4. **`eslint --fix`** truncated `state/coverage.ts` mid-UTF-8 character at byte 2638 (cutoff inside `─` U+2500).
5. **MASS corruption** of four files (`main.ts`, `views/coverage.ts`, `views/regimen.ts`, `views/scanner.ts`) between two lint passes with **no identified trigger** — no Claude write, no `eslint --fix`. Plausible: Windows filesystem indexer, OneDrive sync, Windows Defender quarantine, language-server daemon, or the Linux↔Windows mount layer dropping bytes under load. UNRECOVERABLE from sandbox because no cached Read existed and no git anchor existed at the root.
6. **`CLAUDE.md` slow drift** — 37 lines silently deleted between two backups taken 110 minutes apart. Mechanism unidentified. Caught by triangulating against an older backup. The agent had previously asserted "no corruption" by comparing live against the most recent backup, which was already corrupted — the **lying-by-narrow-check** pattern.

**Defense-in-depth held every time.** Every incident was caught within seconds by some downstream validator: a JSON parser, a TypeScript compile, an ESLint parse, a Python UTF-8 decode, or a line-count smell check. Five of six recovered cleanly. The sixth required user backup. **Recovery is the missing layer.** Git init at the repo root closes it.

**The §00.B violation — discipline asymmetry.** §00.A (Wallach source rule) has a critical Python invariant that blocks. §00.B (senior-dev coding standard, of which "no inline data" is one clause) leans on ESLint warns. Warns get ignored, ESLint sometimes doesn't even run during close. The 91-tile-spec incident was the exact cost. **§00.B needs to be invariant-enforced, not lint-enforced.**

**The cascade-sweep failure.** When `brain/` was renamed to `chronicle/` mid-day, the agent ran `replace_all brain/ → chronicle/` across active files. That sweep did not reach `tools/invariants.py`, where `check_brain_version_sync` still points at `brain/CHANGELOG.md` (now a tombstone). The invariant FAILs every run. Rename operations must sweep `tools/*.py` in the same patch.

---

## §5 — The end goal

A fully working dashboard with all six surfaces wired to real state through the layer architecture, rendering against the v3 design vocabulary, with zero hardcoded canonical data inside view files, zero `any` types, zero direct LocalStorage references outside `core/storage.ts`, zero non-`safe_write` writes to project files, and the round-close ritual passing five-for-five every chunk.

Definition of done — every item must be true at session close:

- `bash tools/build-dashboard.sh` exits 0
- `npx vitest run "state/**"` exits 0
- `python3 tools/invariants.py` 60/60 passing (or whatever the manifest is at that moment)
- No literal array > 10 elements anywhere under `views/` or `state/`
- No `localStorage.` references outside `core/storage.ts`
- Every surface visible on screen, populated with real Eden + regimen state, matching the v3 mockup visually
- Build-log entry appended in the same patch
- Creator's Log event written via `state/log.ts::log()`

The two open invariant FAILs from the last genesis should be cleared as the **first commit** under the new tooling, before any feature work begins:

1. `brain_version_sync` — repoint the invariant to `chronicle/CHANGELOG.md` or retire it cleanly. The brain→chronicle rename was atomic in active files; the invariants sweep was missed.
2. `tacitus_rest_day_observed` — the Saturday write at `tacitus/notebook/2026-06.md` was a user-pardoned record-keeping action. Either expire the flag with a documented pardon, or accept it as a permanent baseline-tolerated red.

After those two land, the manifest should be clean before view work resumes.

---

## §6 — Recommended tooling stack (with rationale)

The full reasoning behind every choice below is in the conversation that produced this handoff. The short version: the failure modes are about *what writes to disk and what blocks shipping*, not about *how the agent reasons*. So the right answer is hooks wired to your existing primitives (`invariants.py`, `safe_write.py`, `chronicle/`), not a methodology framework swap.

The stack, in install order:

**Layer 1 — Recovery substrate (git init at repo root).** Not a tool, just the right answer. The dashboard subdirectory already has `.git/` with pre-commit + pre-push wired. Promoting git to the repo root gives you (a) `git checkout` recovery for the next incident-#5-class event, (b) repo-wide hook coverage, (c) a free time axis for the `lying-by-narrow-check` pattern (compare against an older commit, not the latest local file).

**Layer 2 — `carlrannaberg/claudekit` (battle-tested checkpoint + lint hooks).** Install via npm. Use it for `/checkpoint:restore` (the recoverability primitive) and for the type/lint hook scaffolding. Requires Claude Code Max plan. Skip the other features (`/code-review`, `/spec:create`) unless they earn their keep.

**Layer 3 — Three custom enforcement hooks based on `disler/claude-code-hooks-mastery` patterns.** This is the project-specific enforcement layer that catches §17, §00.B, and round-close-ritual violations. Each hook is ~50–80 lines of Python or bash. They wire to your existing `tools/invariants.py` and `tools/safe_write.py` — no new logic to maintain, just the right plumbing.

**Layer 4 — `REVIEW.md` at the repo root.** Separate from `CLAUDE.md`. Pasted into the system prompt of every internal review/verification step as highest priority. Keeps enforcement rules from being diluted by the constitution's file-layout and glossary sections. Pattern from the official Anthropic Code Review docs.

That's the entire stack. No heavy frameworks. No external API dependencies. No methodology adoption. The runtime token cost is near-zero (Python invariants only). The install time is roughly half a day.

---

## §7 — Step-by-step install

Work top to bottom. Each step has a verification command at the end. Do not advance to the next step until the verification passes.

**Step 0 — Read first, install nothing.**

```bash
cd "C:/Users/Light/Desktop/claude/health expert"
cat HANDOFF.md                                  # this file
cat REVIEW.md                                   # the enforcement contract
cat CLAUDE.md                                   # constitution; this handoff overrides where stale
tail -n 20 chronicle/build-log.md               # most recent project state
ls chronicle/contradictions/                    # six §17 reports + one §00.B
python3 tools/invariants.py | tail -5           # current red/green count
```

Read everything before any write.

**Step 1 — Initialize git at the repo root (15 min).**

```bash
cd "C:/Users/Light/Desktop/claude/health expert"
git init
echo "node_modules/" >> .gitignore
echo "dashboard/assets/js/dist/" >> .gitignore   # optional: dist is generated
echo "dashboard/assets/vendor/tesseract/" >> .gitignore  # 22 MB OCR vendor
echo ".claude/settings.local.json" >> .gitignore # per-user hook overrides
git add -A
git commit -m "Pre-Claude-Code baseline: end of Cowork era, start of clean handoff"
```

Verification:

```bash
git log --oneline | head -1            # one commit
git status                              # clean working tree
```

This commit is your recovery anchor. The next §17 incident becomes `git checkout HEAD -- <file>`.

**Step 2 — Install claudekit (10 min).**

```bash
npm install -g claudekit
cd "C:/Users/Light/Desktop/claude/health expert"
claudekit setup
```

The setup wizard will offer to install hooks, agents, and commands. **Decline everything except `/checkpoint:restore` and the type/lint PostToolUse hook for `Edit|Write`.** You will write your own §17/§00.B blocker in Step 3.

Verification:

```bash
# In Claude Code: type /checkpoint and confirm the command appears
# In Claude Code: type /checkpoint:save then edit something then /checkpoint:restore
```

**Step 3 — Write the three custom hooks (~2 hours).**

Create `.claude/settings.json` at the repo root (commit it to git so it travels with the project):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 tools/hooks/pre_write_guard.py",
            "timeout": 30
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 tools/hooks/pre_bash_guard.py",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 tools/hooks/post_write_verify.py",
            "timeout": 60
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 tools/hooks/stop_round_close.py",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

Then implement the four scripts under `tools/hooks/`. Each is short. The contracts:

- **`pre_write_guard.py`** — reads the tool call from stdin as JSON, parses the target path and the proposed content. Exits 2 (blocking) with an error message on stderr if any of: (a) target path matches the §17 ban list (any project file outside `/tmp/` or the outputs dir) and the calling tool is not `safe_write.py`, (b) target path is under `views/` or `state/` and the content contains a literal array or object with more than 10 elements, (c) target path is `dashboard/assets/styles/design-system.css` or any sealed Eden path. The error message tells Claude what to do instead (use `safe_write.py`, move data to `assets/data/`, get user sign-off for canonical edit). Reference: `disler/claude-code-hooks-mastery` `PreToolUse` examples for the stdin/exit-code pattern.

- **`pre_bash_guard.py`** — reads the bash command from stdin, exits 2 if the command matches any banned pattern (`rm -rf`, `git push --force`, `git reset --hard`, `mv <path> ... cat > <same-path>` heredoc combination, bare `localStorage.` write outside `core/storage.ts`, naked `Edit`/`Write` to files under `chronicle/` `tools/` `assets/styles/design-system.css`). Exits 0 with a warning message on stdout for soft cases (e.g., touching a file outside the chunk's declared scope).

- **`post_write_verify.py`** — reads the tool result. For every file written: open with `'rb'`, check `bytes.find(b'\x00')` returns -1, decode as UTF-8 and re-encode and verify round-trip, count lines and warn if substantially smaller than the file was on the most recent prior Read. If any check fails, exit 2 with a recovery hint pointing at `git checkout HEAD -- <file>` and the cached Read of the file from the conversation. Then run `python3 tools/invariants.py --files <touched-paths>` (a fast targeted subset — implement the `--files` flag if it doesn't exist) and report red findings as a non-blocking warning that Claude must address before round close.

- **`stop_round_close.py`** — runs the round-close ritual. Exits 2 (blocking) if any of: `bash tools/build-dashboard.sh` exits non-zero, `npx vitest run "state/**"` exits non-zero, `python3 tools/invariants.py` reports a baseline regression, no build-log line was appended this session, no Creator's Log event was written. The error message must list the failing items so Claude can fix them and try again. **This is the hook that closes Failure C (ritual skipping) once and for all.** Exit 0 only on a clean five-for-five.

Use `disler/claude-code-hooks-mastery` to verify each hook's stdin payload schema and exit-code semantics. The shakacode hooks guide is the quick-reference cheat sheet.

Verification:

```bash
# Force a violation and confirm the hook blocks
# In Claude Code, ask: "edit views/coverage.ts to add a 15-element array of strings"
# Expected: PreToolUse exits 2, Claude sees the block reason, refuses or rewrites
# In Claude Code, ask: "say done without running invariants"
# Expected: Stop hook exits 2, listing build/vitest/invariants/build-log/creators-log status
```

**Step 4 — Drop `REVIEW.md` at the repo root.**

The file is in this same patch (sibling to `HANDOFF.md`). It is short by design — code.claude.com guidance: "length has a cost; a long REVIEW.md dilutes the rules that matter most." It is meant to be injected as highest-priority guidance, so it states **what gets blocked** and **what verification is required**, not project context.

**Step 5 — Smoke test the full stack on a throwaway chunk (30 min).**

Pick a tiny no-stakes task — e.g., add a one-line comment to `chronicle/build-log.md`. Watch:

- PreToolUse fires and (correctly) lets it through (target is chronicle/, but call is via `safe_write.py`).
- PostToolUse fires, null-byte scan passes, no invariant regression.
- Stop fires, ritual checks run, fail-loud-and-fix cycle if anything's wrong.

Then push a deliberate violation: ask Claude to add `const FOO = [1,2,3,4,5,6,7,8,9,10,11]` to a view file. Confirm PreToolUse blocks with a clear message. Then ask Claude to `git push --force` something. Confirm pre_bash_guard blocks. **Do not start view work until the stack is verified.**

---

## §8 — The first chunks of view work, after the stack is up

Once verification is clean, the view work resumes. Suggested order (Round 26 ended mid-Coverage):

1. **Cleanup — clear the two open invariant FAILs (`brain_version_sync`, `tacitus_rest_day_observed`).** Tiny patch. Establishes the new tooling actually closes round-cleanly.
2. **Move the 91 Coverage tile specs out of `views/coverage.ts` into `assets/data/wallach-essentials.json` behind a Zod schema in `core/schemas/essentials.ts`.** This is the §00.B fix. The view becomes a pure renderer over `loadEssentials()`. The PreToolUse hook now blocks any future literal-array regression.
3. **Wire the Coverage view's tile state to the real `CoverageSnapshot` derived from regimen state.** The smoking-gun "0/0 vs 0/60" disappears the moment one source of truth feeds both numbers.
4. **Migrate Regimen view** — same shape, structurally similar work. The chokepoints already exist.
5. **Migrate Scanner view** — labour proportional to OCR pipeline state.
6. **Knowledge and Journey drawers** — lighter, mostly content-driven.
7. **Profile panel** — smallest of the lot.

Per-chunk: build-log line first, then the work, then build + test + invariants + build-log close + Creator's Log entry. The Stop hook will refuse to let you say "done" otherwise.

---

## §9 — Alternatives to evaluate (Claude Code's choice)

The stack above is my recommendation. You (Claude Code) may evaluate and substitute. Tier S and Tier A from my prior analysis, with the link and the one-line rationale for what each could replace:

**Tier S — strongest leverage**

- `disler/claude-code-hooks-mastery` — https://github.com/disler/claude-code-hooks-mastery — **the patterns reference for all 13 hook events; the source you'll borrow stdin/exit-code shapes from regardless of which other tool you adopt.** Educational, not a product to install.
- `shakacode/claude-code-commands-skills-agents` (hooks-guide.md) — https://github.com/shakacode/claude-code-commands-skills-agents/blob/main/docs/hooks-guide.md — **same surface as disler, denser; the table of 14 hook events plus three hook types (command/prompt/agent) plus the exit-code-2 = blocking pattern.** Pair with disler.
- `carlrannaberg/claudekit` — https://github.com/carlrannaberg/claudekit — **the only Tier-S install with a working `/checkpoint:restore` and battle-tested PostToolUse type/lint hooks. Cost: Claude Code Max plan + larger surface area than you need.**

**Tier A — strong supporting pieces, worth considering as substitutes or supplements**

- `nizos/tdd-guard` — https://github.com/nizos/tdd-guard — **the most mature hook scaffold (2.1k ⭐). Fork the wiring, swap "no impl without failing test" for "no Edit if §00.A/§00.B violated." Comes with a validation-model feature (use a stronger model just for the validator) that's the right escape hatch for invariants.py edge cases.** Drawback: you carry TDD vestigial code you don't practice.
- `code.claude.com/docs/en/code-review` — https://code.claude.com/docs/en/code-review — **the official source for the `REVIEW.md` pattern this handoff uses. Worth reading even though the managed service is Team/Enterprise-only — the verification-step + check-run-output design is borrow-worthy.** The official `REVIEW.md` examples are the cleanest illustration of "enforcement contract separate from project context."
- `anthropics/claude-code-action` — https://github.com/anthropics/claude-code-action — **GitHub Action for PR/issue review. 7.8k ⭐, high trust. The moment you git-init this repo, a 30-line workflow that runs `python3 tools/invariants.py` and fails the check on red gives you a cloud-side gate for Failure C in addition to the Stop hook.** Optional but high-value once git exists.
- `buildingopen/bouncer` — https://github.com/buildingopen/bouncer — **the concept (Gemini-graded Stop hook auditor) is the cleanest implementation of "auditor blocks the agent from declaring done." The implementation leaks all your data to Google and only has 4 ⭐. Steal the Stop-hook pattern, point it at a local model or just at your invariants.** Do not install.

If you choose differently from my recommendation, document the choice in `chronicle/build-log.md` with the reasoning before installing.

---

## §10 — Success criteria

This handoff is closed and the dashboard revamp is done when all of the following hold simultaneously:

- All six surfaces visible, populated with real Eden + regimen state, matching the v3 mockups visually within a half-percent of pixel-perfect.
- Zero literal arrays or objects > 10 elements anywhere under `views/` or `state/` — proven by the PreToolUse hook never having had to block since first-feature commit, and by a grep at session close.
- Zero direct `localStorage.` references outside `core/storage.ts` — proven by lint.
- Zero `any` types — proven by `tsc --noEmit`.
- `python3 tools/invariants.py` 60/60 (or current manifest) on every chunk close.
- `bash tools/build-dashboard.sh` exit 0 on every chunk close.
- `npx vitest run "state/**"` exit 0 on every chunk close.
- Six §17 incidents from June 21 are documented; **no new §17 incidents** under the new stack — proven by the absence of new entries under `chronicle/contradictions/`.
- The build-log shows one line per chunk close.
- Each chunk has a Creator's Log event.
- The PreToolUse hook has blocked at least one §00.B violation in real use, and Claude responded by moving data to `assets/data/` instead of working around the block. This proves the system is doing its job; the absence of any block at all would be suspicious.

If any of these aren't true, the work isn't done. Don't say it is.

---

_End of handoff._
