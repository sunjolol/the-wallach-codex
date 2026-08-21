# Review instructions

_Highest-priority guidance for any review or verification step. Short by design: the project context
lives in CLAUDE.md, and the domain detail loads on demand from `.claude/skills/`._

## Reserve Important for real damage
A finding is **Important** only if it would break the dashboard, leak the user's data, violate a
prime directive, or be unrecoverable:

- A **non-Wallach number** reaching the user as a recommended amount, dose, or target. This is the
  one that matters most — wrong doses harm real people.
- Canonical data **faked, stubbed, or hardcoded in a view** instead of added to a pillar or
  `assets/data/` behind a schema.
- A direct `localStorage` read or write outside `core/storage.ts`, or a regimen mutation that does
  not route through the single writer.
- A project-file write that bypassed `tools/safe_write.py`.
- An edit to a sealed canonical (any `*.golden.sha256` sibling) without explicit user sign-off in the
  same patch.
- A **network dependency at runtime**. Vendored and pinned is fine and encouraged; a CDN, remote
  font, or live API is not.
- A cross-layer import piercing `views → state → core`, or `any` in TypeScript source.
- A claim of "done" without the round-close actually passing.

## Nit, not Important
Style, naming, formatting, refactors, comment wording, optional optimizations. Cap at five; report
the rest as a count.

## Do not flag
Anything the gates already enforce (formatting, lint, type errors), generated files
(`dist/main.js`, `assets/vendor/`), or historical entries in `chronicle/`.

## Verification bar
Behaviour claims cite `file:line`. "It works" is not a finding; "tested by X, output Y" is. If a
verification step cannot independently reproduce a claim, downgrade or drop it.

**A green board means nothing drifted — not that anything is right.** Only the gates anchored outside
our own files can catch a value that is wrong but self-consistent. Never cite the total as evidence
about a health number.

**A DOM probe is not a visual check.** Do not accept one as proof a surface looks right.

## Re-review convergence
Once Important findings are addressed, post Important only. Do not let a one-fix patch reach round
seven on style.

## Summary shape
Open with a one-line tally: `N Important, M Nit, plus K similar not shown`. Lead with "no blocking
issues" when true.
