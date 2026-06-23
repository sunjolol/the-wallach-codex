# Data flow + anti-fakery

_Read before any work that touches canonical data or a view render._

## Pattern
Canonical data has exactly one home (the sealed corpus). Views never hold it as a literal. Every render reads through a typed boundary.

## Instance
Flow for every surface:

```
eden/* → schemas/* → core/* → state/* → views/*
```

- `eden/` — sealed canonical source (Wallach + Youngevity primaries).
- `dashboard/assets/data/*.json` — Zod-validated derived/presentation data, loaded via esbuild JSON import or HTML-embedded `<script type="application/json" id="…">`.
- `core/schemas/*.ts` — Zod schemas; the only place untyped data crosses into typed-land.
- `state/*` — pure functions over the loaded data + user state.
- `views/*` — render functions; read state, never write LocalStorage, never hold canonical values as literals.

## Rules
1. **Anti-fakery.** If a render needs data that does not exist yet, add it to `eden/` or `dashboard/assets/data/` behind a Zod schema. Never fake or stub a literal in the view.
2. No literal array or object > 10 elements inside `views/` or `state/`. Move it to `assets/data/`.
3. Numbers migrate verbatim. If a legacy literal disagrees with a target, port the literal faithfully — the user's end-pass corrects the data.
4. Source rule (§00.A): every Wallach-attributable claim cites an allowlist primary (`dddl · rbs · eps · ygy · wallach-lecture`).

## Enforcement
- Invariant `views_state_no_inline_data` — blocks literal arrays/objects > 10 elements in `views/` and `state/`.
- Invariant `check_wallach_stance_source_rule` — every `wallach_stance` citation must reference an allowlisted primary.
- Invariant `eden_hash_integrity` + `eden_write_protection` — sealed corpus integrity.
