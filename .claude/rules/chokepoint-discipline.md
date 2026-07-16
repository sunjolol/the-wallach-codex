# Chokepoint discipline (§31)

_Read before touching anything under `state/`._

## Pattern
All mutations of a sensitive state surface flow through a small fixed set of named paths that end at ONE writer. Each mutation emits a typed event so subscribers cascade re-renders. Direct mutation paths are lint-blocked.

## Instance (regimen state) — P3 slot model (2026-07-16)
Regimen state lives in ONE atomic localStorage document, `rgSlots_v1`:
`{ version, slots:[{id,name,items[],overrides{},createdAt,editedAt}]×1–4, activeSlot, trash:[{item,slotId,removedAt}]×≤20 }`.

**The single writer.** `writeSlotDoc(doc, opts?)` — PRIVATE, non-exported — is the ONLY code that writes `rgSlots_v1`, via `setValidated` (the Zod write boundary). It emits `regimen:changed`. Every mutation below ends here. WHY one key: localStorage has no cross-key transaction, so holding `{slots, activeSlot, trash}` in one JSON value makes a slot switch / delete / remove / restore all-or-nothing.

**The public mutation API** (all delegate to `writeSlotDoc`; also exposed on `window.*` — the bridge, reached by DOM handlers + headless probes, installed once by `main.ts::bootstrap → installBridges`):

- The five LEGACY chokepoints, kept by name + signature so the burning views (`views/regimen.ts`, `views/scanner.ts`) still compile:
  - `persistRegimen(r)` — replace the active slot's items
  - `saveRgOverride(id, patch)` — per-item dose / scaling override on the active slot
  - `saveRgManual(items)` — the manual / vault / scanned add path (active slot)
  - `saveRgRemoved(ids)` — remove-to-trash adapter (moves active-slot items into the trash ring)
  - `saveRgUserGoals(goals)` — goal state (the one GLOBAL key, `rgUserGoals_v1`, not per-slot)
- The P3 slot ops: `addSlot` · `duplicateSlot` · `deleteSlot` · `renameSlot` · `setActiveSlot` · `restoreFromTrash`. Each returns `{ok} | {ok:false, reason}` — a refusal is never a silent drop. (`importSlot` is deferred to §7, where the untrusted-JSON import UI lands.)

Each mutation emits `regimen:changed` (typed). Subscribers in `core/events.ts` cascade re-renders.

**Migration.** The first read with no `rgSlots_v1` rebuilds a Default slot from the four LEGACY keys (`lcRegimen_v1`, `rgOverrides_v1`, `rgManualItems_v1`, `rgRemoved_v1`), recovers any hidden items INTO the trash, and leaves the legacy keys inert on disk (rollback safety). Those keys are READ once at migration and never written again.

## Rules
1. `writeSlotDoc` is the **only** writer of `rgSlots_v1`; `saveRgUserGoals` is the only writer of `rgUserGoals_v1`. Every mutation routes through one of these — no ad-hoc write.
2. Direct `localStorage.setItem(…)` outside `core/storage.ts` fails lint AND the routing invariant.
3. Adding a new mutation? Add a new named op that **delegates to `writeSlotDoc`**, not an ad-hoc write site.
4. Reads go through `core/storage.ts::getValidated` (Zod boundary); bare `localStorage.getItem` outside `core/storage.ts` is banned.
5. The four legacy keys are retired — read once by the migration, never written. Re-writing one means the migration is no longer one-way.

## Enforcement
- **Lint (live):** `no-restricted-globals` on `localStorage` (ESLint, `dashboard/eslint.config.js`) flags any direct `localStorage` access outside `core/storage.ts` — the one file that turns the rule off for itself. Currently a WARN.
- **Invariant (LIVE — re-codified for the slot model 2026-07-16):** `regimen_state_mutation_routing` (critical) verifies: the slot doc has exactly ONE writer (`setValidated(RG_SLOTS_KEY)`); that writer EMITS `regimen:changed`; the five legacy chokepoints survive as exports and the four slot-backed ones DELEGATE to it; `saveRgUserGoals` writes its own global key + emits; the four retired keys are never written; and `localStorage` is touched only in `core/storage.ts` — never by a view. It uses BRACE-AWARE body matching (R9) so the private writer can't be swallowed into a neighbouring export. Negative test: `tools/test_regimen_state_mutation_routing.py` (16 cases, incl. the swallow guard + the prose over-fire pin).
- **Invariant (LIVE — new, P3):** `slot_invariants` (critical, static) proves the slot guards EXIST — `SlotDocSchema` enforces ≥1/≤4 slots + ≤20 trash + activeSlot-resolves at the Zod boundary (read AND write); `writeSlotDoc` re-validates on write; `addSlot` refuses the 5th with a reason; `deleteSlot` refuses the last + reassigns `activeSlot`. The runtime BEHAVIOUR (the 5th actually refused, active-delete actually promotes) is proven by `tools/render_probe_slots.js` (R7: a static gate proves the guard code exists, NOT that it runs — the mineral-tiers lesson). Negative test: `tools/test_slot_invariants.py` (10 cases).
  - **Neither gate restores the old `LS_SCHEMAS` check.** That registry died with the legacy dashboard; re-asserting it would gate a structure that no longer exists. The gates check the contract that is true today, and say so.
  - **The 10-day gap, recorded so it is not repeated:** `regimen_state_mutation_routing` was removed 2026-07-05 (`fca48c9d`) and slated to "return in Phase C". Phase C landed the SAME DAY; Phase F finished; it never came back. This rule file was honest about the gap (labeled WISH per R7) — but `CLAUDE.md` went on asserting §31 flatly and unqualified, so the operating contract oversold what the rule file admitted. **A gate promised "next phase" is a gate nobody re-checks:** the phase passes and the promise stays. (Restored 2026-07-15; re-codified for slots + joined by `slot_invariants` in P3, 2026-07-16.)
