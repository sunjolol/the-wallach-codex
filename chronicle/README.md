# chronicle/

The project's discipline ledger + audit trail + historical record. Active
discipline surfaces plus historical version artifacts.

The active operating contract is **`/CLAUDE.md`** at the repo root — auto-loaded
at every session start. The active plan is **`OVERHAUL-BLUEPRINT.md`** (the full
structural overhaul, locked 2026-07-05; temporary + living, pruned as phases land).

## Layout

```
chronicle/
  OVERHAUL-BLUEPRINT.md    ← active · THE PLAN (Charter R1–R9 · data model · pipeline · migration)
  build-log.md             ← active · pre-write contract surface (every chunk close logged here)
  next-chunk.md            ← active · rolling session hand-off pointer (what's done, what's next)
  creators-log/            ← active · the SACRED, append-only Creator's Log (log.jsonl + generated LOG.md/INDEX.md/digests + README)
  CHANGELOG.md             ← active · version-by-version narrative
  domain-glossary.md       ← active · shared vocabulary for the health/framework domain
  contradictions/          ← active · prime-directive conflict reports + §17 incident logs
  proposals/               ← active · design proposals (the Wallach knowledge-revamp — proposal of record)
  finalize-checklist.md    ← reference · the per-surface finalize checklist
  worked-example-chunk.md  ← reference · a fully-worked round-close example
  wallach-fringe-excluded.md ← reference · index of Wallach fringe content excluded from the app
  genesis-origin-plan.md   ← frozen · the archived origin plan (superseded by OVERHAUL-BLUEPRINT.md)
  *-audit-*.md / dose-target-matrix-*.md ← dated · point-in-time audit snapshots
  versions/                ← historical · every prior system-prompt version, archived in full
  evals/                   ← historical · prompt-vs-prompt answer comparisons
  README.md                ← this file
```

## The two logging layers

History lives in two layers by design (see `.claude/rules/logging-doctrine.md`):

1. **The GitHub / public-teaching layer** — commit messages, `build-log.md`, the
   rendered logs. Generous and public, but it *can* fail (takedown, expired logs).
2. **The Creator's Log** (`creators-log/`) — the sacred, local-first ledger that
   survives in every clone even if the GitHub layer vanishes. Append-only, never
   deleted/edited/reordered, always truthful + complete. The canonical source is
   `creators-log/log.jsonl`; `LOG.md` is its generated, newest-first human view.

## How CLAUDE.md uses chronicle/

- **Session start:** `CLAUDE.md` auto-loads. Type `genesis` to trigger the
  boot catch-up, which reads the `build-log.md` tail, the most recent Creator's Log
  entry, and the live `next-chunk.md` hand-off.
- **Round close:** every closed round appends one line to `build-log.md`
  (timestamp · surface · plain-language what+why · files · verifications) AND fires
  one Creator's Log entry via `tools/creators_log.py append`. They are committed
  together; a build-log line with no new Creator's Log entry is blocked at round-close.
- **Prime-directive conflict:** Claude writes a report to
  `chronicle/contradictions/<date>-<slug>.md` and surfaces it with the
  `⚠ PRIME DIRECTIVE CONFLICT` prefix. The user resolves it manually.
- **§17 corruption:** any silent-truncation or null-byte incident is logged to
  `chronicle/contradictions/` (discipline failures and rule conflicts share an
  audit channel).

## Historical iteration

The `versions/` and `evals/` directories date from the iteration-era pattern:
agent-prompt-as-versioned-software with A/B testing of system prompts. That
pattern is paused — the `CLAUDE.md` contract supersedes the "swap-the-prompt"
workflow. The artifacts are preserved as history (never deleted), not as a
current workflow.
