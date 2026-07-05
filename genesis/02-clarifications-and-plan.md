# 02 — Build Plan for Claude Code

> **SUPERSEDED 2026-07-05 — archived planning history, NOT a live plan.**
> This is the June-2026 build plan. It was **superseded in full by `chronicle/OVERHAUL-BLUEPRINT.md`** (the active plan, locked 2026-07-05) when the project pivoted from finishing the v3 dashboard to the full structural overhaul — the pillar data model, Wallach-only amounts, and the Charter (R1–R9). It is retained here in `genesis/` as frozen history for the audit trail; for anything LIVE read the blueprint + `CLAUDE.md`. Where this file disagrees with them, they win ("older loses").

**Project:** The Wallach Codex
**Author:** Cowork-Claude, in dialogue with Luneth
**Captured:** 2026-06-22
**Reading order before you start:**

1. `sunjo/01-pre-handoff-conversation.md` — verbatim history that produced this plan
2. **This file** — the plan you execute against
3. `CLAUDE.md` — the operating contract (architecture, layer rules, build/test commands)
4. `.claude/rules/` — the behavioral defaults; read the file matching your work domain
5. `REVIEW.md` — the highest-priority enforcement contract
6. `chronicle/build-log.md` — current project state (last ~20 entries)

This plan **supplements** `CLAUDE.md` + `.claude/rules/` and `REVIEW.md`. Where this file and `CLAUDE.md` disagree, `CLAUDE.md` wins (it is the operating contract — per its own closing line, "older loses"). Where this file is silent, `CLAUDE.md`, `.claude/rules/`, and `REVIEW.md` govern.

> **Execution status (updated 2026-06-22):** Phase 1 is complete and tagged `v0.1.0-cleanup-complete`; Phase 2 has begun. The operating system was since restructured into **ONE instruction surface** — `CLAUDE.md` + `.claude/rules/` (10 files). The original `HANDOFF.md` and the entire `memory/` tree were deleted on purpose; references to them below are preserved as captured plan-history, not live pointers. The invariant board is **20/20 green** (baseline empty — any red is now a real regression). The vision and phases below stand; the Phase-1 task list (§3) and the §4–§5 excision/migration specs describe cleanup work that is now done.

---

## §0 — Mission in three sentences

Finish the Wallach-framework health-coverage dashboard exactly as designed in the v3 mockups, end-to-end, without faking data in views and without re-engineering the architecture mid-build. Deploy it as a static single-HTML app on a CDN-backed host so it can never be attacked into bankruptcy and the user owns 100% of their data on their device. The end state is a permanent gift to society: a tool that preserves Dr. Joel Wallach's framework and "just works" for at least four years with no server, no backend, no accounts, no upkeep.

---

## §1 — Luneth's vision, in his own words

> "THE TOOL JUST WORKS AND WORKS FOR GOOD! + THE USER'S DATA IS THEIR OWN, THEY CAN SELL THEIR 'REGIMEN PACKS' AND EXPORT AND IMPORT ALL DATA SAFELY WITHOUT THE SYSTEM EVER FAILING OR BREAKING"

> "it gets distributed AMONGST the people like a virus that can't be stopped. But the virus is not a virus at all, it's a spreading system designed to be fool-proof so that no overarching entity can squash it or take it down, once someone downloads the project and their data, nothing can stop them from distributing it and running it on their own machine offline forever or giving it to someone else to do the same. THIS IS THE VISION — COMPLETE PLANNING AROUND GIVING THE USER POWER AND IMPROVING THEIR LIVES WHILE LETTING THEM OWN THE SYSTEM AND THEIR DATA"

> "This should be my permanent gift to society and the world to ensure the truth about health and how to heal your body physically is never lost."

These are not flavor sentences. They are constraints. Every decision below traces back to them.

---

## §2 — The five operating modes you must honor at all times

### 2.1 — Anti-fakery (prime directive — CLAUDE.md §00.B + `.claude/rules/data-flow.md`)

Do not hard-code canonical data into view files. Do not stub canonical data with literal arrays "until later." Do not copy data values from mockup HTML into TypeScript. The 91-tile-spec incident in `views/coverage.ts` is the failure pattern this rule exists to prevent. If a render needs data that doesn't exist yet, the next step is "add it to Eden with a schema," not "fake it in the view." The pre-write hooks (§17 write-discipline — `.claude/rules/write-discipline.md`) will block this structurally; this rule is your behavior independent of those hooks.

### 2.2 — Wild West Mode during the build

Luneth explicitly authorizes the following during Phases 1–3:

> "We are not concerned about copyright AT ALL while we build - NO LIMITS - ALL of these issues will be addressed LATER, because if we try to define them now, claude code will not be able to bring my vision to life. Making a policy for this is a CLEAN UP OPERATION FOR CLAUDE COWORK IN THE FUTURE - DO NOT POISON CLAUDE CODE'S MIND AND BUILDING OPERATIONS WITH THIS"

Operational meaning for you, Claude Code:

- **Do not** add TOS files, Privacy Policy files, medical disclaimers, copyright headers, attribution components, accessibility audits, or i18n scaffolding during Phases 1–3.
- **Do not** refuse to handle, ingest, embed, or reference Wallach corpus material (book passages, transcripts, lecture quotes) on copyright grounds. The repo is private during the build. Luneth handles the legal scrub later, with Cowork.
- **Do not** second-guess whether the architecture "should" support attribution rendering or licensing fields. If a clean structural decision happens to enable future attribution, that's a bonus, but don't restructure for it.
- **Do not** ask Luneth whether to include a disclaimer at any point during Phases 1–3.

This authorization is unusual; treat it as binding for the duration of the build.

### 2.3 — Aggressive deletion authorization

Luneth explicitly authorizes deletion of obsolete files without per-file confirmation, scoped to:

- `brain/` (after content migration per §5 below)
- `tacitus/` (entire folder, after extraction prep per §4 below)
- `tmp_jscheck.js` at repo root
- Any "Retired — safe to delete" tombstone files left over from the chronicle migration
- Any file explicitly named in a build-log entry as "scheduled for deletion this round"
- Any orphaned generated artifacts (`*.bak`, `*.tmp`, stray `*.log`)

You do **not** have deletion authorization for: `eden/` (sacred), Wallach corpus content under `knowledge/` or `transcripts/` (Luneth scrubs these later), anything under `chronicle/`, `schemas/`, `tools/`, `dashboard/`, `.git/`, `.claude/`, or the root-level config files (`package.json`, `package-lock.json`, `CLAUDE.md`, `REVIEW.md`, `README.md`, `.gitignore`). (The original list also named `memory/` and `HANDOFF.md`; both were since removed on purpose in the post-Phase-1 operating-system cleanup — there is now one instruction surface, `CLAUDE.md` + `.claude/rules/`.) When in doubt, do not delete — file the candidate in `chronicle/build-log.md` as a question and surface it.

### 2.4 — Vision-first desktop, mobile is deferred

The desktop/laptop/tablet experience is the build target for Phases 1–3. Match the v3 mockups exactly. Build responsive where it does not compromise the vision — that means CSS that doesn't break on smaller viewports, not redesigning layouts for mobile-first. Native iOS/Android wrapping, mobile-specific layouts, and any PWA-as-installable-app polish are Phase 3 work and a future Cowork planning session.

Luneth's direction:

> "BUT from claude's standpoint it's not [hard] if all the concepts are there and concrete, right? It's just a matter of re-arranging. Now of course we can give ourselves a head start by being as responsive as possible but when I have a VISION for something that I want to be EXACT, it MUST BE EXACT (like in the case of our demo pages we made for the new dashboard theme - EXACT placements/styles/everything but the DATA is sacred and we NEVER hard-code data into a dashboard) - so we are DESIGN FIRST, VISUAL FIRST, VISION FIRST > THEN we think about how to make it mobile-ready."

### 2.5 — Eden is the single sealed source of truth

Luneth's definition:

> "eden is the source of all CORRECT info for PRODUCT info including all correct labels, default front-facing details, back end details such as numbers on all nutrients and all ingredients … it is our source of ALL youngevity product info to ensure NO other system can corrupt it … to PRESERVE wallach, that was 90% of the idea of the project and the EDEN system ensures that remains TRUE from an ENGINEERING standpoint so that there is a SINGLE source of truth that protects itself and verifies against its known truth as a self-defense system"

Operational meaning:

- Every numeric nutrient claim, every product label fact, every Wallach-attributable statement traces to a file under `eden/` validated by a Zod schema under `schemas/`. The hash-anchor + golden manifest pattern (already in place) is the integrity gate.
- Builders (you) may read from and write to Eden during the build. Once Eden is sealed for a release, runtime code cannot modify it — only display it.
- If a view needs a value, the only valid source chain is `eden → schemas → core/eden.ts loader → state/* → views/*`. No view ever holds the value as a literal.
- Wallach books, transcripts, and verbatim statements live in Eden so they have one canonical home. The cleanup pass (§5) migrates qualifying brain/ content into Eden.

---

## §3 — The four phases

Execute strictly in order. Do not start Phase 2 until Phase 1's exit criteria are green. Same gate for every phase boundary.

### Phase 1 — Cleanup (start here, ~1–2 days of focused work)

**Goal:** Get the repo into a state where every folder and file has a documented purpose, retired systems are physically gone, and the operating language is sharp enough that a fresh Claude session can orient in under 5 minutes.

**Tasks, in order:**

1. **Excise tacitus/.** See §4 for the specific steps. The user owns `the-tacitus-system` as a separate public repo; this dashboard project should have zero coupling to it.
2. **Migrate brain/ content per §5 rules, then delete brain/.** Health terminology and Wallach-traced content → `eden/`. General educational content → `knowledge/`. Structural/version/system content → delete (it was already ported to `chronicle/` and other systems).
3. **Delete `tmp_jscheck.js`** at repo root.
4. **Sweep `tools/invariants.py` for stale references** to brain/ and tacitus/ paths. The `brain_version_sync` invariant in particular needs to either repoint at `chronicle/CHANGELOG.md` or be retired cleanly. Same for any `tacitus_*` invariants — retire them in this repo (they live in `the-tacitus-system` now).
5. **Document the three undocumented folders** — `labels/`, `transcripts/`, `wallach-refresh/`. Either add a one-line `README.md` inside each explaining what it holds, or add a directory glossary section to the root `README.md` covering all top-level folders. (Recommendation: do both — README inside each folder is read-locally, root README is read at first glance.)
6. **Add a "First 5 Minutes" quickstart block** to the top of `CLAUDE.md`:

   ```
   ## First 5 minutes in this repo
   1. Read CLAUDE.md (this file) in full
   2. Read sunjo/02-clarifications-and-plan.md (the active build plan)
   3. Read REVIEW.md (enforcement contract)
   4. tail -n 20 chronicle/build-log.md (recent project state)
   5. python tools/invariants.py (verify the project is in a sane state)
   ```

7. **Add a Domain Glossary** to the repo. New file at `chronicle/domain-glossary.md`. One-line definitions for the key types and concepts you encounter constantly: `CoverageSnapshot`, `RegimenItem`, `EdenManifest`, `WallachStance`, `LcScan`, the five §31 chokepoints (`persistRegimen`, `saveRgOverride`, `saveRgManual`, `saveRgRemoved`, `saveRgUserGoals`), the six surfaces (Coverage, Regimen, Scanner, Knowledge, Journey, Profile), the layer terms (`core/`, `state/`, `views/`). Keep each entry to one or two sentences.
8. **Add a Worked-Example Chunk** documentation file. New file at `chronicle/worked-example-chunk.md`. Walk through a single past chunk (pick one from `build-log.md`) start-to-finish: the build-log line, what was changed, the chunk-close ritual run, the commit message format. This is the artifact a fresh Claude session reads to learn "what a good chunk looks like here." Five hundred words is plenty.
9. **Initialize the hook infrastructure (§17 — `.claude/rules/write-discipline.md`).** Four custom hooks (pre-write guard, pre-bash guard, post-write verify, stop round-close) wired to `tools/invariants.py` and `tools/safe_write.py`. Smoke-test each before moving on.
10. **Initialize git at the repo root if not already** (it is already, based on the 24 commits visible). Tag `v0.0.0-pre-cleanup` so there's an anchor to return to if cleanup breaks something.

**Phase 1 exit criteria:**

- `tacitus/` folder does not exist
- `brain/` folder does not exist
- `tmp_jscheck.js` does not exist
- Every top-level folder has either a `README.md` inside or an entry in the root README's directory glossary
- `python tools/invariants.py` reports zero red invariants (both `brain_version_sync` and `tacitus_*` checks are either passing or properly retired)
- `chronicle/domain-glossary.md` exists with at least 15 entries
- `chronicle/worked-example-chunk.md` exists
- `CLAUDE.md` has the "First 5 Minutes" block at the top
- All three hooks fire correctly on a smoke test
- `git tag v0.1.0-cleanup-complete` exists
- One build-log entry per task, all dated within Phase 1

### Phase 2 — Core feature build (the actual revamp, ~1–3 weeks)

**Goal:** All six surfaces fully working, wired to real Eden + state data, matching the v3 mockups visually, with zero hardcoded canonical data in any view file.

**Recommended ordering** (you may reorder if you have a reason, but log it):

1. **Coverage view** — finish what Round 26 started. Move the 91 hardcoded tile specs out of `views/coverage.ts` into `eden/wallach-essentials.json` behind a Zod schema in `core/schemas/essentials.ts`. The view becomes a pure renderer over `loadEssentials()` + a computed `CoverageSnapshot`. The "0/0 vs 0/60" smoking-gun resolves the moment one source of truth feeds both numbers.
2. **Regimen view** — migrate to the v3 design vocabulary, wire to the existing §31 chokepoints.
3. **Scanner view** — OCR pipeline already exists (Tesseract.js vendored). Wire the v3 visual layer over it.
4. **Knowledge drawer** — content rendered from `knowledge/` and Wallach quotes from `eden/`.
5. **Journey drawer** — user progression display, sourced from `state/log.ts` Creator's Log.
6. **Profile panel** — surface Creator's Log + invariant scoreboard + build status. Smallest of the six.
7. **Command palette (⌘K)** — universal navigation across the above.

**Per-surface acceptance criteria** (every surface must meet all of these before the next surface starts):

- No literal array or object > 10 elements in the view file
- All data flows: `eden/* → schemas/* → core/* → state/* → views/*`
- Visual match to the corresponding v3 mockup in `dashboard/components/` within ~0.5% pixel-perfect
- TypeScript: zero `any` types, all boundaries typed via Zod
- `bash tools/build-dashboard.sh` exits 0
- `npx vitest run "state/**"` exits 0
- `python tools/invariants.py` reports clean
- A build-log entry summarizes what shipped
- A Creator's Log event fires via `state/log.ts::log()`
- A git commit tagged with the chunk number

**Phase 2 exit criteria:**

- All six surfaces visibly populated with real state, matching mockups
- Zero `localStorage.` references outside `core/storage.ts`
- All §31 chokepoints in use; no direct LocalStorage writes elsewhere
- Bundle: `dist/main.js` ≤ 250 KB gzipped, CSS ≤ 150 KB gzipped
- `git tag v0.2.0-features-complete` exists

### Phase 3 — Pre-launch hardening (~3–5 days)

**Goal:** The repo and the build are ready to be deployed publicly. Distribution path exists. User-data portability is real. Versioning is intentional.

**Tasks:**

1. **Export/import for user regimen state.** Round 138 in saga already added the cart-share primitive with `_export.creator` and `_export.description` fields. Generalize this into a full regimen export: download all LocalStorage keys as a single JSON file with a stable schema (`schemas/export.ts`). Implement import: restore from a JSON file with validation, with conflict resolution if some keys are already populated. This is the feature that operationalizes Luneth's "users own their data" vision — without it, the philosophy is empty.
2. **PWA manifest** — `dashboard/manifest.json` with name, icons (192, 512), theme color, display mode `standalone`, start_url. Registered in `dashboard.html` via `<link rel="manifest">`. This is *not* the "make it a native app" step — that's deferred Phase 4 work. This is the "users can Add to Home Screen on mobile and it feels appy" step.
3. **GitHub Actions CI workflow.** Single `.github/workflows/build.yml` that runs `node tools/build.mjs` + `python tools/invariants.py` on every push. Status badge in the README. ~30 lines.
4. **Cloudflare Pages deployment configuration.** See §6 for the full deployment architecture. Tasks: connect Cloudflare Pages to the GitHub repo, configure build command and output directory, set up the custom domain. Verify the deployed site renders identically to the local `file://` version.
5. **`v1.0.0` GitHub Release** tagged from the deployment-ready commit. Release notes mirror the build-log entries for Phases 1–3.
6. **LocalStorage backup/recovery affordance.** Cheap insurance: auto-trigger an export-to-Downloads weekly (or on every Nth session), so a user who clears their browser still has their data on disk. ~30 lines.
7. **A simple "What's New" mechanism in-app.** A small badge on the Profile panel that surfaces when the bundled-app version is newer than what the user has seen. Stored in LocalStorage. No server check, no telemetry.

**Phase 3 exit criteria:**

- Export → import round-trips a full regimen with zero data loss
- The deployed Cloudflare Pages URL renders identically to local `file://`
- `v1.0.0` tag exists on the repo
- GitHub Actions badge in README is green
- The domain points at the Cloudflare deployment

### Phase 4 — Polish wave + launch (Luneth + Cowork later, not Claude Code)

This phase is explicitly out of scope for Claude Code's autonomous work. Luneth handles it in a future Cowork session. Claude Code's responsibility ends at Phase 3 exit. See §8 for the full deferred-polish scope so the architecture you build during Phases 1–3 doesn't paint into a corner.

---

## §4 — Tacitus excision (specific steps)

Tacitus has its own public repo (`the-tacitus-system`). This repo should have zero traces of it.

**Recommended sequence:**

1. Read the most recent `tacitus/notebook/` entries and the audit-history. Confirm there is no Tacitus-internal state that the dashboard's `chronicle/` needs to inherit. (There shouldn't be — Tacitus was always the standalone audit layer.)
2. `git filter-repo --path tacitus --invert-paths` (after a fresh backup of the repo locally). This rewrites history to remove all `tacitus/` content from every past commit, shrinking the repo and removing the coupling permanently.
3. Sweep all remaining files for `tacitus/` path references: `tools/invariants.py`, `chronicle/build-log.md` mentions, README references, CLAUDE.md mentions, schema imports. Update or remove each.
4. Verify `tacitus/` no longer appears in `git ls-files`.
5. Force-push the rewritten history. (Coordinate with yourself — this is your repo, no collaborators.)
6. Update README to remove tacitus references; clarify that integrity-audit functionality lives in the separate `the-tacitus-system` repo for users who want it.
7. Commit-log entry: "Phase 1 — tacitus excised, see §4 of sunjo/02-clarifications-and-plan.md."

**If filter-repo is not available** (it's a separate `pip install git-filter-repo`), the fallback is `git rm -r tacitus/` + commit + force-push of a `master` rewrite, which leaves tacitus history accessible in old clones but removes it from the active tree. Filter-repo is cleaner; the fallback is fine if filter-repo can't be installed.

---

## §5 — Brain content migration (specific rules)

The `brain/` folder is a remnant of the original system, retired in favor of `chronicle/` + `eden/` + `knowledge/` + other newer systems. Most of brain's contents are already ported. The cleanup pass deletes brain/ entirely after handling residual content per these rules:

**Per-file decision tree:**

For each file under `brain/`:

1. **Is the content health/supplement information that traces to Wallach or Youngevity primary sources?** → Migrate to `eden/` under an appropriate path. Validate via Zod. Sealed once incorporated.
2. **Is the content general health/educational/reference material not directly Wallach-attributable?** → Migrate to `knowledge/` under an appropriate path.
3. **Is the content structural/versioning/system mechanics (brain version pointers, "current.md," version index files, retired CHANGELOG, build-log archive)?** → Delete. The functionality has been ported to `chronicle/`.
4. **Is the content already a "Retired — safe to delete" tombstone?** → Delete.
5. **Is the content unclear or doesn't fit?** → File the file in `chronicle/build-log.md` as a question and ask Luneth before deciding. Default to NOT deleting unclear items.

**One build-log entry per migration.** Cite which destination each file went to and why. This is the audit trail Luneth needs to verify the migration was done correctly.

After all files are migrated or deleted: `rm -r brain/` and commit.

---

## §6 — Hosting architecture (the deployment that delivers the vision)

**Decision: Cloudflare Pages.**

**Why Cloudflare Pages over alternatives:**

- **Free tier covers the entire use case.** 500 builds/month, unlimited requests, unlimited bandwidth, custom domains, automatic HTTPS. Luneth's $50/month ceiling has ~$48/month of headroom for the domain registration only.
- **DDoS protection built in at the CDN layer.** Cloudflare's network absorbs attacks before they reach the origin. There is no origin to attack — the site is purely static files cached at the edge.
- **No compute to run away.** Because it's pure static hosting (no Workers used in this plan), the cost model is literally "$0 + domain." There is no scenario where traffic spikes generate a bill.
- **Edge caching is global** — fast everywhere, no regional fragility.
- **Git-connected deployments.** Push to `master`, Cloudflare detects, runs the build command, deploys. No CI/CD setup beyond pointing Cloudflare at the repo.

**Documented fallback: GitHub Pages.** Also free, also static, same architectural posture. Slightly weaker DDoS posture and bandwidth caps (100 GB/month soft limit), but workable. Use GitHub Pages if Cloudflare Pages turns out to have a friction we didn't predict.

**Deployment configuration:**

- **Build command:** `node tools/build.mjs` (the existing tsc + esbuild pipeline)
- **Output directory:** `dashboard/` (the directory that contains `dashboard.html` and its assets — Cloudflare serves it as the site root)
- **Custom domain:** TBD by Luneth (suggest `thewallachcodex.com` or similar; check availability when ready)
- **No environment variables.** There is no backend; nothing to configure.
- **No build secrets.** Nothing to leak.

**What this architecture cannot do, by design:**

- No server-side user accounts
- No cross-device sync of user regimens (users export/import a JSON file)
- No server-side analytics (zero telemetry)
- No API endpoints
- No database
- No "forgot my password" flow (there are no passwords)

These are not gaps. They are the vision. They are why the site cannot be attacked into bankruptcy and why no entity can take this tool down. Per Luneth: *"once someone downloads the project and their data, nothing can stop them from distributing it and running it on their own machine offline forever or giving it to someone else to do the same."*

---

## §7 — Operating-language deliverables (Phase 1)

These four artifacts are deliverables for Phase 1. They raise the third-perspective grade (operating language for AI + humans) from ~77 toward ~95.

### 7.1 — Root README directory glossary

Add a new section to `README.md` titled "## Directory glossary." One paragraph or one row per top-level folder. Example shape:

```
- chronicle/ — the discipline ledger: build-log, contradictions, domain-glossary, worked-example
- dashboard/ — the actual app (single-HTML, TypeScript src + bundled dist + vendored OCR)
- eden/ — the sealed canonical source: every Wallach/Youngevity claim originates here
- knowledge/ — general health and educational reference content
- labels/ — [Claude Code: read the folder, write a one-liner about what's in it]
- .claude/rules/ — behavioral defaults (write-discipline, chokepoint, data-flow, source-rule, …)
- schemas/ — Zod schemas validating every data load
- tools/ — build, invariants, safe_write, hooks
- transcripts/ — Wallach lecture transcripts (Wild West Mode applies)
- wallach-refresh/ — [Claude Code: read the folder, write a one-liner about what's in it]
```

### 7.2 — CLAUDE.md "First 5 Minutes" block

Insert at the top of `CLAUDE.md`, immediately under the file title. Five numbered steps a fresh Claude Code session runs before any work, mirroring the reading order at the top of this file.

### 7.3 — Domain glossary (`chronicle/domain-glossary.md`)

A single page of one-or-two-sentence definitions for the project's core types and concepts. Categories to cover:

- **Layer terms:** `core/`, `state/`, `views/`, the import direction
- **Surfaces:** Coverage, Regimen, Scanner, Knowledge, Journey, Profile, Command Palette
- **Systems:** Eden, Cura, Aegis, Chronicle (with one-line role descriptions)
- **§31 chokepoints:** `persistRegimen`, `saveRgOverride`, `saveRgManual`, `saveRgRemoved`, `saveRgUserGoals`
- **Key types:** `CoverageSnapshot`, `RegimenItem`, `EdenManifest`, `WallachStance`, `LcScan`, `LcVerdict`
- **Discipline terms:** §00.A (Wallach source rule), §00.B (senior-dev coding standard), §17 (corruption discipline), §31 (chokepoint discipline), "Round-close ritual"

Keep entries short. The point is fast orientation, not exhaustive documentation.

### 7.4 — Worked example chunk (`chronicle/worked-example-chunk.md`)

Pick one chunk from `build-log.md` (Round 138 cart-share is a clean example, or Round 158's six-chunk wrap). Walk through it start-to-finish: what was the goal, what files changed, what the build-log line said, what verification ran, what the Creator's Log event captured, what the commit message looked like. The point is to give a fresh Claude session a concrete template instead of abstract rules.

---

## §8 — Deferred-but-known polish scope

The following are explicitly out of scope for Phases 1–3. They are logged here in full so:

1. Claude Code knows what's coming and can avoid architectural choices that would block these items.
2. Future-Luneth + future-Cowork have a complete reference for the polish wave without re-deriving anything.

For each item: Luneth's literal direction (where given), followed by Cowork's proposed solution. **Do not implement any of these during Phases 1–3.**

### 8.1 — Terms of Service

**Luneth said:** *"Same thing with TOS, privacy policy etc., this is easy polish work that can be done in a single wave, I'm not trying to launch TODAY, I'm trying to make sure that the way we BUILD ensures that WHEN we launch, we have already PLANNED AHEAD with the future in mind."*

**Cowork proposed solution (Phase 4):**

A `TOS.md` at the repo root, rendered as a modal on first-run and accessible from the Profile panel. The user must accept once before the app becomes interactive. Standard sections: definition of service, no warranty, no medical advice, user assumes responsibility for health decisions, intellectual property (Wallach material attributed; tool code under chosen license), limitation of liability, governing law, contact. Drafting baseline: adapt a standard SaaS TOS template, strip out everything related to account management and data processing (we have neither), retain the medical-disclaimer + no-liability + IP sections. Length target: 1,500–2,500 words. Acceptance state persists in LocalStorage; the modal re-appears on major version bumps.

### 8.2 — Privacy Policy

**Cowork proposed solution (Phase 4):**

A `PRIVACY.md` at the repo root, rendered alongside the TOS. The honest privacy policy for this architecture is short and powerful: "We do not collect, transmit, store, or process any of your data. Everything you enter is saved only in your browser's LocalStorage on your device. We have no servers. We have no analytics. We have no cookies beyond what your browser uses to render the page. You own your data completely. You can export it at any time. If you delete your browser data, the app's record of your information is gone." Length target: 400–800 words. This privacy policy is a competitive advantage — most apps wish they could write this honestly.

### 8.3 — Medical disclaimer

**Cowork proposed solution (Phase 4):**

Three placements:

1. **Splash modal on first run** alongside TOS acceptance.
2. **Persistent footer** on every surface: "Not medical advice. This app reflects Dr. Joel Wallach's framework; consult a licensed physician for personal health decisions."
3. **Inline at every claim site** in the Knowledge drawer and Coverage tile detail: small "Source: Wallach, [book/lecture, citation]" pointer. The §00.A source-rule architecture already requires this; the polish wave makes the citation visible to the user.

Text template: "The Wallach Codex is an educational reference tool that organizes and displays the nutritional framework developed by Dr. Joel D. Wallach. It is not medical advice. Statements made in this app about diseases, conditions, treatments, or supplements are attributed to Dr. Wallach's published work and have not been evaluated by the U.S. Food and Drug Administration. Do not use this app to diagnose, treat, cure, or prevent any disease. Consult a licensed healthcare provider for personal medical decisions."

### 8.4 — Copyright scrub

**Luneth said:** *"I completely plan to scrub all copyrighted material at the end and only quote wallach passages within the limits allowed, this is more of a polish thing for me BUT I want to make sure it's clear enough so that the way it's built doesn't need to be re-engineered later, just TUNED so these final touches are easy to make at the end rather than a drastic re-engineering nightmare."*

**Cowork proposed solution (Phase 4):**

Audit pass over `knowledge/` and `eden/`:

- **Full book PDFs** in `knowledge/wallach-books/`: remove from the public repo before public launch. Replace with a "References" page listing each book by title with a buy-link to the official publisher/author site.
- **Long transcript passages** in `transcripts/`: shorten to the minimum needed for the framework citation. Cap individual excerpts at ~150 words. Cite source (lecture title, timestamp, year).
- **Verbatim claims rendered in the app** (e.g., Knowledge drawer entries, Coverage tile context): keep as fair-use illustrations with full attribution. Most claims are statements of fact about nutrition that aren't copyrightable in themselves; only the specific expression is.
- **Framework data** (the 92 essentials, dosage targets, mineral classifications): factual + functional, not copyrightable. Keep.

The architecture you (Claude Code) build during Phases 1–3 already supports this scrub cleanly because Eden is the central data layer: the scrub is a content audit, not a code refactor. The only architectural assumption that helps: every Wallach-traced datum in Eden should have a `source` field so the polish wave can render attribution. This is already the §00.A pattern; just keep it.

### 8.5 — Accessibility

**Cowork proposed solution (Phase 4):**

Audit against WCAG 2.1 AA. Common items: alt text on icons, ARIA labels on interactive elements, semantic HTML (`<button>` not `<div onclick>`), keyboard navigation across all six surfaces, focus indicators, sufficient color contrast (the v3 design system tokens should be checked), screen-reader compatibility for the Periodic Table coverage view (likely needs a tabular fallback view for SR users). Wallach's demographic includes elderly users — this matters more than for a typical app.

### 8.6 — Internationalization

**Cowork proposed solution (Phase 4):**

Wrap all user-facing strings in a `t('key')` function. Strings live in `assets/data/i18n/{locale}.json`. Default locale: `en-US`. Add Spanish (`es-MX` or `es-ES`) as a first translation target given Wallach's Latin American following.

Architectural assumption to bake during Phases 1–3: **no user-facing strings hardcoded in TypeScript expressions**. Use a constant or a string table even if `t()` doesn't exist yet — replacing constants with `t()` calls is mechanical; replacing template-literal-embedded strings is painful. This is one architectural decision worth making during Phase 2.

### 8.7 — Mobile (native wrap)

**Cowork proposed solution (Phase 4 or beyond):**

Decision deferred to a dedicated Cowork session. Options: Capacitor (web → iOS/Android), Tauri (web → desktop apps), full native rewrite (probably never). Phase 3's PWA manifest gives Luneth a no-cost mobile-installable experience that may be sufficient indefinitely.

### 8.8 — Supplements catalog update mechanism

**Cowork proposed solution (Phase 4):**

A `eden/catalog-version.json` file with a semantic version. The app checks (on launch, but only by reading its own bundled file, never a network call) the version. When Luneth ships a new bundle with an updated catalog, users opening the new bundle see a "Catalog updated" badge. Updates flow through the same Cloudflare Pages deploy — no separate update server.

### 8.9 — LICENSE

**Cowork proposed solution (Phase 4):**

Pick at launch. Recommend **Apache 2.0** for the code (permissive + patent grant) and a separate `CONTENT-LICENSE.md` for the Wallach-attributed content (probably "All Rights Reserved — see attribution" since Wallach's material is third-party). The code being permissive means users can fork the tool; the content being restricted means they can't republish Wallach's work without permission.

### 8.10 — SECURITY.md and bug-report channel

**Cowork proposed solution (Phase 4):**

A short `SECURITY.md` pointing at a contact email or GitHub Issues. For a static-only app the security surface is small (XSS via user-input fields is the main concern), but the file establishes a path for reports.

### 8.11 — SEO and discoverability

**Cowork proposed solution (Phase 4):**

A separate static landing page (could be the same repo's `index.html` if the dashboard is at `/app/`) with schema.org markup, OG tags, meta description, sitemap.xml. The landing page does the marketing; the dashboard does the work.

### 8.12 — Pre-ship safety sweep (MANDATORY beta gate)

**Luneth said (2026-06-27):** *"I personally do not know Wallach's teachings inside and out enough, nor do I know proper dosages enough to audit this once we're finished and ready to ship. I will need some help scanning all of the claims to ensure safety. So just like we're doing a legal sweep at the end, we need to do a safety sweep as well to ensure there are no risks of danger happening through the app. And whatever method we use must be 100% fool-proof (the how can be figured out later but it's important we leave no doubt and basically find and manually review every iffy claim at the end)."*

**Why this exists (a hard gate, equal in weight to the legal/TOS/disclaimer sweep §8.1–8.3 and the copyright scrub §8.4):** the app displays Wallach's dosages and health directives. A single OCR/transcription misprint in a dose can be lethal if a user follows it — proven TWICE during the build: Let's Play Doctor Fig 8-1 folic-acid "15 to 20 gm" (grams ≈ 1000× overdose; should be mg) and Dead Doctors Don't Lie "zinc at 15 gm t.i.d." (grams, lethal; should be mg). Both were caught only because a dubious value happened to be noticed and render-verified. Before the beta ships to the public, EVERY such risk must be found and manually reviewed — no doubt left.

**Scope:** every claim the app can display that carries a dose, quantity, toxicity threshold, contraindication, or any directive a user could act on to their harm — not just `kind=dose`, also mechanism/protocol/deficiency/toxicity claims whose text contains numbers+units, and any advice dangerous if mis-stated.

**The 100%-fool-proof requirement (Luneth):** the method must leave NO doubt. Design intent = AUTOMATICALLY FLAG every iffy claim (so none is silently missed) → then MANUALLY REVIEW each flagged claim against the rendered Wallach source. Automation narrows the field; human verification clears each one; nothing ships unreviewed.

**Proposed approach (Phase 4 — the "how" is TBD, refine at sweep time; this is the seed):**
1. **Automated flagging pass** — the seed already exists: the 2026-06-27 dose-safety scan (see chronicle/build-log + the dose-misprint-safety-mandate memory). Flag ALL claims for: (a) ambiguous/garbled OCR units ("meg", "gm"/"grams" near a digit, bare numbers with no unit); (b) dose-object sanity (amount/unit implausible for the nutrient — a trace mineral in grams, an absurd IU); (c) cross-corpus outliers (a nutrient's dose far outside the range of its other claims); (d) any unit outside an allowlist {mg, mcg, IU, g}. Every hit → a review queue.
2. **Source cross-check** — for each flagged claim, render the Wallach source page (the corpus stores `char_offset` + book text, so the §00.A render-verify method used all build long applies) and read the printed value.
3. **Manual review of EVERY flagged claim** (plus a representative check of un-flagged dose claims) by a competent reviewer. Because Luneth cannot self-audit Wallach's dosages, this step needs help — a domain reviewer and/or Claude cross-checking each claim against the rendered source, with Luneth signing off the final list.
4. **Sign-off artifact** — a committed `chronicle/safety-sweep-<date>.md` recording every claim reviewed, its verdict (safe / corrected / removed), and the reviewer, so the sweep is auditable and the beta can be declared safety-cleared.

**Architectural note (keep during the build, so the sweep stays a content audit not a re-engineering job — same principle as §8.4):** every dose stays a structured object `{amount, unit, …}`; every claim keeps its `char_offset` + source book; and dose misprints are corrected the moment they are found, never carried forward (the dose-misprint-safety-mandate already binds this during the build).

---

## §9 — Per-phase exit criteria (consolidated checklist)

**Phase 1 exit:**
- [ ] `tacitus/` removed via filter-repo
- [ ] `brain/` content migrated per §5, folder deleted
- [ ] `tmp_jscheck.js` deleted
- [ ] `tools/invariants.py` swept clean of stale references
- [ ] Three undocumented folders documented
- [ ] `CLAUDE.md` has "First 5 Minutes" block
- [ ] `chronicle/domain-glossary.md` exists
- [ ] `chronicle/worked-example-chunk.md` exists
- [ ] All three hooks fire correctly on smoke test
- [ ] `git tag v0.1.0-cleanup-complete`
- [ ] Build-log entries cover every Phase 1 task

**Phase 2 exit:**
- [ ] All six surfaces visibly populated with real Eden + state data
- [ ] Zero literal arrays > 10 elements in `views/*` or `state/*`
- [ ] Zero `localStorage.` references outside `core/storage.ts`
- [ ] Zero `any` types in TypeScript source
- [ ] Bundle ≤ 250 KB gzipped JS, ≤ 150 KB gzipped CSS
- [ ] All §31 chokepoints in use; no bypass paths
- [ ] `python tools/invariants.py` clean
- [ ] `git tag v0.2.0-features-complete`

**Phase 3 exit:**
- [ ] Export → import round-trips a regimen losslessly
- [ ] PWA manifest in place; "Add to Home Screen" works on iOS Safari + Android Chrome
- [ ] GitHub Actions workflow green; badge in README
- [ ] Cloudflare Pages deployed; custom domain pointed
- [ ] Live URL renders identically to local `file://`
- [ ] `v1.0.0` GitHub Release tagged
- [ ] LocalStorage backup affordance in place

**Phase 4: hand back to Luneth + Cowork.**

---

## §10 — When to come back to Cowork

Claude Code should call Luneth back to Cowork (not handle in-session) when:

- A Phase 4 polish item becomes urgent before Phase 3 is complete
- An architectural decision arises that this plan doesn't cover and can't be inferred
- A `chronicle/contradictions/` event happens that can't be cleanly auto-recovered
- Luneth explicitly asks for it

Otherwise: keep building. The plan is meant to carry Claude Code from start of Phase 1 to end of Phase 3 without needing Cowork back-and-forth. If you find yourself stuck on something not covered, file a build-log entry naming the gap and continue with what you can — Luneth will surface the gap to Cowork on their next session.

---

## §11 — The success state, restated

Four years from now, a person opens a single HTML file from a CDN-served URL. The page loads instantly, with no network calls after that initial load. They scan a supplement label with their phone's camera. The app tells them what's in it, how it scores against the Wallach 92-essential framework, and what they're still missing. They build a regimen, save it locally, export it as JSON, share it with a friend. Nothing about this requires a server, an account, an internet connection beyond the first page load, or any maintenance from Luneth. The tool just works.

Build toward that.

---

_End of plan. Next file in this folder if needed: `03-...` for any follow-up clarifications that arise after Claude Code starts execution._
