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
4. Source rule (§00.A): every Wallach-attributable claim cites an allowlist primary — Wallach BOOKS only (`dddl · rbs · eps · lets-play-doctor · immortality · iaiyh`), plus `ygy` for Youngevity composition. No lectures/transcripts (Luneth 2026-07-05).

## Enforcement
- Invariant `views_state_no_inline_data` — blocks literal arrays/objects > 10 elements in `views/` and `state/`.
- Invariant `amounts_wallach_only` — every numeric coverage target in `essentials-targets-data.json` traces to a sealed Wallach dose claim via `source_claim_id` (R2 poison gate; replaced the retired `wallach_stance_source_rule` in Phase C2).
- Invariant `citations_reference_registry` (R3) — book refs = `book_id`, no hand-typed citation on the clean Charter surface (the overhaul-trigger anti-drift gate).
- Invariant `prose_contained` (R4) — no prose-shaped text in a fact field on the clean Charter surface (prose stays in its designated homes).
- Invariant `no_hand_duplicated_canonical` (R3) — no canonical essential name re-stored outside `essentials-canon` (derived copies exempt, gated by `derived_artifacts_fresh`).
- Invariant `eden_hash_integrity` + `eden_write_protection` — sealed corpus integrity.
