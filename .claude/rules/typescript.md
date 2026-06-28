# TypeScript conventions

_Read before touching anything under `dashboard/assets/js/src/`._

## Layer architecture (enforced by `eslint-plugin-boundaries`)

```
views/ → state/ → core/   (one-way, never the reverse)
```

- `core/` imports only `zod`. Nothing of ours.
- `state/` imports `core/`. May not import `views/`.
- `views/` imports `state/` and `core/`. May not write `localStorage` directly.
- Cross-layer imports use path aliases `@core/*`, `@state/*`, `@views/*`. Relative `../../` across layers is banned.

## Type discipline
1. Never `any`. `unknown` at boundaries; narrow with Zod.
2. Validate at the edge: every untyped input (`localStorage`, JSON.parse, network responses if ever) goes through a Zod schema first.
3. `tsconfig.json` enables `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`. Respect them.

## Code style
1. **Comments = the truthful WHY/decision audit-trail for future human + AI reviewers.** Comment non-obvious logic, trade-offs, and gotchas with WHY the solution is correct — not WHAT the code literally does (that is noise). A comment that lies or has drifted out of sync with the code is a defect *worse than no comment* (it deceives a less-expert reader and wastes an auditor's time): fix or delete it whenever you touch that code. JSDoc starred-blocks (`/** ... */`) for exported/API surfaces; inline `//` is fine for local rationale + section dividers. Flag uncertainty LOUDLY (`// NOTE:` / `// FIXME:`), never silent over-confidence.
2. **No user-facing educational prose inline** — it lives in the segregated content store (Eden corpus / `assets/data`) and is referenced by views (enforced for content blobs by the `views_state_no_inline_data` invariant). Session narrative belongs in commits + build-log, not code. (Comment *truthfulness* is not machine-checkable — it is review discipline, kept cheap by this structure + the round-close logging audit-trail.)
3. Single source of truth — if a value appears in two places, one is wrong.
4. Pure functions in `state/` and `core/` where possible. Side effects live in `main.ts` boot wiring and `views/*` DOM handlers.

## Lint
- **Never `eslint --fix`** on source files. See `.claude/rules/write-discipline.md`.
- Fix lint by hand, write via `safe_write`.
- Lint one file at a time during iteration: `(cd dashboard && node_modules/.bin/eslint <path>)`.
