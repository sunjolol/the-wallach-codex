# Tacitus Brain — README

## What this folder is

This is the bootstrap layer for **The Tacitus System** when used as a standalone project framework. The `tacitus/` parent folder is designed to be portable: copy it to a new directory, treat that directory as a fresh Claude Cowork project root, and load `tacitus/brain/current.md` to "boot up" the discipline.

The brain file (`current.md`) is the always-loaded instruction set. Companion files in `templates/` are seeds the user copies and customizes for the new project's domain.

## How to port Tacitus to a new project

### Step 1 — Copy the folder

Copy the entire `tacitus/` folder to your new project's root directory. Rename the new root to your project's name. The folder structure inside is unchanged.

```
<new-project-root>/
├── tacitus/
│   ├── brain/
│   │   ├── current.md        ← the boot file
│   │   ├── CHANGELOG.md
│   │   ├── README.md         ← (this file)
│   │   ├── templates/        ← seeds for memory/ files
│   │   └── versions/
│   ├── identity.md
│   ├── portability.md
│   ├── changelog.md
│   ├── prompts/{cura,vision,aegis}.md
│   ├── sentinel.json
│   ├── audit-history.json
│   ├── feature-flags.json
│   ├── notebook/             ← starts empty
│   └── dashboard/
└── (everything else gets created during first-run setup)
```

### Step 2 — Open Cowork on the new directory

Point Claude Cowork at the new project root. The very first message you send should be: `catch up`. Claude reads `tacitus/brain/current.md` and runs the first-run bootstrap (§17 of current.md).

### Step 3 — Bootstrap dialogue

Claude will walk you through:

1. Naming the project + populating `memory/identity.md`.
2. Capturing your working preferences in `memory/preferences.md`.
3. Copying companion-file templates from `tacitus/brain/templates/` to `memory/`.
4. Re-programming the Tacitus prompts (`tacitus/prompts/{cura,vision,aegis}.md`) for the new domain. The current prompts carry parent-project (Wallach health framework) assumptions and need to be reworked for your domain.
5. Setting up scheduled tasks (nightly Tacitus modes + daily audit + Sabbath rest window).
6. Closing Round 1 with full closing-move-atomic discipline (§5 of current.md).

### Step 4 — Project starts

After Round 1 closes, you're operating with the full discipline: closed-loop logging (§30 paired-write), chokepoint enforcement (§31 cross-surface state sync), Living the Logos (every codified rule first applied to itself), build > test > build > test cadence.

## What "Tacitus" carries with it

The Tacitus parent folder includes:

- **The brain** (`brain/current.md`) — binding discipline, action-language, trigger/action/verify format.
- **Templates** (`brain/templates/`) — `engineering-doctrine.md`, `operating-protocols.md` (with §1, §27, §28, §30, §31 pre-filled), `paired-write-catalog.md`, `state-mutation-catalog.md`, empty `essence/{saga,lessons,decisions}.md`.
- **Tacitus operating layer** (`prompts/`, `identity.md`, `portability.md`) — Cura / Vision / Aegis modes, six-phase ponder loop, voice register specs, write-boundary discipline.
- **The audit + integrity tooling** (`tacitus/sentinel.json`, `tacitus/audit-history.json`, `tacitus/dashboard/` if used) — sentinel-content cross-check infrastructure.

The parent project's specific tools (`tools/invariants.py`, `tools/safe_write.py`, `tools/dashboard_integrity.py`, etc.) are NOT inside the tacitus folder; they live at the project root. When porting, you'll need to either copy these tool files separately OR rebuild them following the patterns documented in the brain file.

**Decision point for v1.x:** Should the tooling (`tools/safe_write.py`, `tools/invariants.py`, `tools/catchup_seal.py`) be moved INTO `tacitus/tools/` so they port together? Currently they live at parent-project root. Filed for user direction on first port.

## What "Tacitus" does NOT carry

- Any domain-specific data from the parent project (Wallach corpus, Youngevity products, health frameworks).
- Parent-project memory (`memory/essence/saga.md`, `memory/identity.md`, `memory/preferences.md`).
- The parent project's `dashboard/` (the Wallach dashboard).
- The parent project's `knowledge/` directory.

The new project starts with a clean memory layer. The discipline carries over; the substance does not.

## How to refine the brain over time

The brain is versioned. Updates go through saga-logged rounds with closing-move-atomic discipline:

1. Identify a refinement opportunity (e.g., a section was vague, a rule didn't translate to action).
2. Edit `tacitus/brain/current.md` via `safe_write` (the brain file is itself a project file under the §17 ban on Edit).
3. Append a new version notes file: `tacitus/brain/versions/v<N.M>-<date>-<slug>.md`.
4. Log the change in `tacitus/brain/CHANGELOG.md`.
5. File a saga round entry per §10.

The brain file itself is the audit trail of what discipline a project was built under.

## Questions during first port

If you (the user) hit ambiguity during first port, the brain file's §16 (Asking-the-user discipline) governs how Claude asks. Expect one question at a time with the WHY included. If a section of the brain doesn't translate to action in your domain, flag it — that's a bug in the brain, fixable through a saga round.
