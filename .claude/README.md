# .claude/

Claude Code configuration for this repository. None of it ships in the app — it is the
agent-side workflow and enforcement setup.

- **`settings.json`** — the harness wiring, most importantly the enforcement **hooks**
  (`tools/hooks/*.py`): the write-guard that forces every project write through `safe_write`,
  the bash guard, the post-write verifier, and the round-close stop-gate.
- **`skills/`** — on-demand domain guidance, one folder per skill (charter, corpus-mining,
  dashboard-code, design-language, element-headers, engineering-doctrine, round-close,
  testing-probes, visual-verification, wallach-source-rule, write-discipline). Each loads only
  when the work matches; together they are the project's operating doctrine in depth.
- **`invariant-baseline.json`** — the (deliberately empty) invariant-scoped tolerance file.
  A tolerated case belongs *in* its gate with a reason and a test, never here.

The one-page operating contract is the repository's top-level `CLAUDE.md`.
