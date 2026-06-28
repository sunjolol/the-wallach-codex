# Review instructions

_Injected as highest-priority guidance into every review and verification step. Short by design. For project context, identity, and architecture, read CLAUDE.md and `.claude/rules/`._

## What "Important" means here

Reserve 🔴 **Important** for findings that would break the dashboard, leak the user's data, violate a prime directive, or be unrecoverable. Specifically:

- Any literal array or object with more than 10 elements inside `views/` or `state/`. Canonical data belongs in `assets/data/` behind a Zod schema. No exceptions.
- Any direct `localStorage.` read or write outside `core/storage.ts`. The chokepoint is the chokepoint.
- Any write to a project file via a tool other than `tools/safe_write.py`. Edit, Write, MultiEdit, bash `mv`/`cat >`/`tee`/`>>`, Python `open(...,'w')` — all banned for project files. The `/tmp/` and outputs directories are the only exceptions.
- Any edit to a sealed canonical file (`dashboard/assets/styles/design-system.css`, eden manifest, anything with a `*.golden.sha256` sibling) without explicit user sign-off in the same patch.
- Any change that introduces an external network dependency at runtime. Offline-first. No CDN, no Google Fonts, no remote API.
- Any cross-layer import that pierces the boundary rules (`views → state → core`, never the reverse; `core` imports only `zod`).
- Any `any` type in TypeScript source. Use `unknown` at boundaries and narrow with Zod.
- Any claim of "done" without all five round-close ritual items passing: build, vitest, invariants, build-log entry, Creator's Log event.

## What gets Nit, not Important

Style, naming, formatting, refactoring suggestions, comment wording, JSDoc improvements, optional optimizations, minor accessibility polish. Cap at five Nit findings per review; mention the rest as a count.

## Do not flag

- Anything CI already enforces: prettier formatting, basic lint, type errors.
- Generated files (`dashboard/assets/js/dist/main.js`, `assets/vendor/tesseract/`).
- Historical entries in `chronicle/contradictions/` or `chronicle/CHANGELOG.md`.

## Always check before declaring done

- Was data added to `assets/data/` rather than baked into a view?
- Does every numeric or list visible on screen trace through a Zod-validated load in `core/` or a chokepoint in `state/`?
- Was every project-file write routed through `tools/safe_write.py`?
- Does the affected file pass UTF-8 round-trip and null-byte scan after the write?
- Did `python3 tools/invariants.py` come back clean (or, if a baseline-tolerated red, was it already red before this change)?
- Did a one-line entry get appended to `chronicle/build-log.md` in the same patch as the work?
- Did `state/log.ts::log()` fire a Creator's Log event for this chunk?

## Verification bar

Behavior claims must cite `file:line`. "It works" is not a finding. "Tested by X command, output Y" is. If a verification step in the review pipeline cannot independently reproduce the claim, downgrade the finding from Important to Pre-existing or remove it.

## Re-review convergence

If a chunk has already been reviewed once and the author addressed the Important findings, on the next review post Important findings only. Suppress new Nits unless they introduce a regression. Do not let a one-fix patch reach round seven on style.

## The anti-fakery clause

If a render needs data that doesn't exist yet, the next step is "add it to `assets/data/` with a schema" — not "fake it in the view," not "copy literal values from the mockup," not "stub it until later." If you would feel the need to write a comment like `// TODO: load from real source`, that is the moment to stop and add it to the real source instead. The previous session shipped 91 hardcoded tile specs across two rounds after being explicitly warned not to. That is the failure mode this entire review contract exists to prevent.

## Summary shape

Open the review body with a one-line tally: `N Important, M Nit, plus K similar items not shown`. Lead with "no blocking issues" when that's the case. The author wants to know the shape of the work before the details.
