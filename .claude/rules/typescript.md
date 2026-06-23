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
1. **No prose-as-comments.** JSDoc only, starred-block (`/** ... */`). Narrative belongs in commits, build-log, contradictions.
2. Single source of truth — if a value appears in two places, one is wrong.
3. Pure functions in `state/` and `core/` where possible. Side effects live in `main.ts` boot wiring and `views/*` DOM handlers.

## Lint
- **Never `eslint --fix`** on source files. See `.claude/rules/write-discipline.md`.
- Fix lint by hand, write via `safe_write`.
- Lint one file at a time during iteration: `(cd dashboard && node_modules/.bin/eslint <path>)`.
