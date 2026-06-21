# chronicle/

The project's discipline ledger + audit trail + historical record. Active discipline surfaces plus historical version artifacts.

The active operating contract is **`/CLAUDE.md`** at the repo root — auto-loaded at every session start.

## Layout

```
chronicle/
  build-log.md         ← active · pre-write contract surface (every dashboard/ write logged here)
  CHANGELOG.md         ← active · version-by-version narrative
  versions/            ← historical · every prior system-prompt version, archived in full
  contradictions/      ← active · prime-directive conflict reports + §17 incident logs
  evals/               ← historical · prompt-vs-prompt answer comparisons
  README.md            ← this file
```

## How CLAUDE.md uses chronicle/

- **Session start:** `CLAUDE.md` auto-loads. Type `genesis` to trigger the five-step catch-up, which includes reading the last 5 entries of `build-log.md` and the most recent Creator's Log entry.
- **Round close:** every closed round appends one line to `build-log.md` (timestamp · surface · concern · files · rationale) and one event to the Creator's Log.
- **Prime-directive conflict:** Claude writes a report to `chronicle/contradictions/<date>-<slug>.md` and surfaces with `⚠ PRIME DIRECTIVE CONFLICT` prefix. User resolves manually.
- **§17 corruption:** any silent-truncation or null-byte incident is logged to `chronicle/contradictions/` (the same surface — discipline failures and rule conflicts share an audit channel).

## Historical iteration

The `versions/` and `evals/` directories date from the iteration-era pattern: agent-prompt-as-versioned-software with A/B testing of system prompts. That pattern is paused — the `CLAUDE.md` contract supersedes the "swap-the-prompt" workflow. Historical artifacts preserved.
