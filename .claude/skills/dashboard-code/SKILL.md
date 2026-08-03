---
name: dashboard-code
description: Read before touching anything under dashboard/assets/js/src - views, state, or core. Covers the enforced layer boundaries, the localStorage chokepoint and its single writer, the anti-fakery rule for missing data, and the TypeScript conventions.
---

# Writing dashboard code

## Layers -- enforced by eslint-plugin-boundaries
```
views/  ->  state/  ->  core/          (one way, never the reverse)
```
- `core/` imports only `zod`.
- `state/` imports `core/`. Never `views/`.
- `views/` imports both. **Never writes localStorage directly.**
- Aliases `@core/*`, `@state/*`, `@views/*`. Cross-layer relative imports are lint-banned.

## Data flow
`eden/ -> eden/tools/ -> assets/data/*.json -> core/ -> state/ -> views/`

No view holds a canonical value as a literal. Untyped data crosses into typed-land in exactly one
place: a Zod schema in `core/schemas/`.

**Anti-fakery.** If a render needs data that does not exist yet, add it to a pillar or to
`assets/data/` behind a schema. Never fake it, never stub it, never copy literals from a mockup. If
you are about to write `// TODO: load from real source`, that is the moment to add the real source.
A previous session shipped 91 hardcoded tile specs after being warned twice; that is why this rule
has a gate.

No literal array or object over 10 elements inside `views/` or `state/`.

**Roughly half of `assets/data/` is derived and byte-gated; the rest is hand-authored** and gated only
for *registration* in `eden/derived/MANIFEST.json`. A hand-authored artifact being registered does
not mean it is correct.

## The state chokepoint (section 31)
Regimen state is ONE atomic localStorage document, `rgSlots_v1`, holding
`{version, slots[1..4], activeSlot, trash[<=20]}`. Why one key: localStorage has no cross-key
transaction, so a slot switch, delete, or restore must be all-or-nothing.

`writeSlotDoc(doc)` is **private and the only writer**, via `setValidated`. It emits
`regimen:changed`. Everything delegates to it: the five legacy chokepoints (`persistRegimen`,
`saveRgOverride`, `saveRgManual`, `saveRgRemoved`, `saveRgUserGoals`) and the slot ops (`addSlot`,
`duplicateSlot`, `deleteSlot`, `renameSlot`, `setActiveSlot`, `restoreFromTrash`). Slot ops return
`{ok} | {ok:false, reason}` -- a refusal is never a silent drop.

Adding a mutation? Add a named op that **delegates to `writeSlotDoc`**. Never an ad-hoc write.
Reads go through `core/storage.ts::getValidated`. `localStorage` is touched in `core/storage.ts`
alone.

## TypeScript
1. Never `any`. `unknown` at boundaries, narrowed with Zod.
2. Validate at the edge -- every untyped input goes through a schema first.
3. Respect `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`.
4. Comments carry the truthful WHY, not WHAT-noise. A drifted comment is a defect worse than none.
5. **No user-facing prose inline.** It lives in the content store and is referenced by id.
6. Pure functions in `state/` and `core/`; side effects in boot wiring and DOM handlers.
7. Never `eslint --fix`. Hand-fix, then route through `safe_write`.

## Enforcement
`views_state_no_inline_data` · `views_no_inline_prose` · `regimen_state_mutation_routing` (critical,
brace-aware so the private writer cannot be swallowed into a neighbour) · `slot_invariants` ·
`entity_render_is_projection` · `views_no_ciphered_data` · eslint boundaries +
`no-restricted-globals` on `localStorage`.

A gate that proves guard code *exists* does not prove it *runs* -- `slot_invariants` is static, and
the runtime behaviour is proven by `tools/render_probe_slots.js`.
