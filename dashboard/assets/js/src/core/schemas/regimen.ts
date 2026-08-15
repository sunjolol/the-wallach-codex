/**
 * core/schemas/regimen.ts — Zod schemas for §31 chokepoint LS keys
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Every regimen LS key has a Zod schema here. Reads go through `getValidated`
 * (in core/storage.ts) so bad data never enters typed-land. Writes can go
 * through `setValidated` for the same guarantee at the write boundary.
 *
 * Schemas are the single source of truth for BOTH runtime validation AND
 * static types — `z.infer<typeof RegimenSchema>` gives you the TS type for
 * free, no parallel interface definitions to drift.
 *
 * P3 (2026-07-16) added the SLOT DOCUMENT (`SlotDocSchema`, LS key rgSlots_v1):
 * the single-key, single-writer home for the 1–4 named regimen slots, the
 * active-slot pointer, and the trash ring buffer. The legacy per-key schemas
 * below are KEPT — the P3 migration reads them once to build the Default slot,
 * and they remain the shape a rollback re-reads. See state/regimen.ts.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** A single product/item label as stored in localStorage. */
export const RegimenLabelSchema = z.object({
  name: z.string(),
  brand: z.string().optional(),
  nutrients: z.array(z.unknown()).optional(),
}).passthrough(); // allow additional fields per the legacy [k: string]: unknown

/** A regimen item — what one saved supplement looks like in LS. */
export const RegimenItemSchema = z.object({
  id: z.number(),
  label: RegimenLabelSchema,
  addedDate: z.string(), // ISO YYYY-MM-DD
  provenance: z.string(), // user_scanned | user_manual | wishlist_promoted (USER). Gated by scanner_user_items_marked (§5.4 wall). The wallach_hbsp_default token retired with the base-seed removal (2026-07-14) — nothing mints it now.
});

/** The full regimen as stored in 'lcRegimen_v1'. */
export const RegimenSchema = z.object({
  items: z.array(RegimenItemSchema),
});

/** Per-item dose overrides as stored in 'rgOverrides_v1'. */
export const OverridesMapSchema = z.record(z.string(), z.record(z.string(), z.unknown()));

/** Manually-added items as stored in 'rgManualItems_v1'. */
export const RgManualSchema = z.array(RegimenItemSchema);

/** Hidden item IDs as stored in 'rgRemoved_v1'. */
export const RgRemovedSchema = z.array(z.number());

/** User-selected goal keys as stored in 'rgUserGoals_v1'. */
export const RgUserGoalsSchema = z.array(z.string());

// ─── Slot document (P3, LS key 'rgSlots_v1') ──────────────────────────────────

/**
 * Hard ceiling for a slot's display name.
 *
 * A slot name is a user free-text field painted into chrome, so it carries the
 * SAME real risks as the profile name (unbounded paste → LS-quota DoS that
 * corrupts the user's regimen; control chars + bidi overrides that make a
 * rendered name read differently from its bytes; newlines breaking a one-line
 * slot). Escape-by-default at the render sink (`textContent`) is still the first
 * defence against script injection; this is the second layer — a bound with a
 * rejection PATH, never a silent truncation (engineering-doctrine #1, #8).
 *
 * NOTE: intentionally mirrors core/schemas/profile.ts's name safety rather than
 * importing it — the rename UI is out of P3 scope (the Regimen view burns at §7),
 * so P3 does not yet earn a shared text-safety module. If §7 grows a second
 * free-text surface, consolidate the two into one core primitive then. The
 * near-duplication is flagged here so it is fixed by intent, not discovered by drift.
 */
export const SLOT_NAME_MAX = 40;

/** C0/C1 controls (newlines included) + Unicode bidi overrides. */
// eslint-disable-next-line no-control-regex
const SLOT_NAME_FORBIDDEN = /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/;
/** Whitespace + zero-width padding: invisible, so it cannot be consented to. */
const SLOT_NAME_INVISIBLE_ONLY = /^[\s\u200B-\u200D\u2060]*$/;

/**
 * A slot's display name. Rejects (never silently repairs): empty/whitespace/
 * invisible-only, over SLOT_NAME_MAX, any control char or bidi override.
 */
export const SlotNameSchema = z
  .string()
  .transform(s => s.trim())
  .refine(s => !SLOT_NAME_INVISIBLE_ONLY.test(s), {
    message: 'A slot name needs at least one visible character.',
  })
  .refine(s => s.length <= SLOT_NAME_MAX, {
    message: `A slot name can be at most ${SLOT_NAME_MAX} characters.`,
  })
  .refine(s => !SLOT_NAME_FORBIDDEN.test(s), {
    message: 'A slot name cannot contain control characters.',
  });

// ─── Slot colour palette (P4 — per-slot personal colour) ──────────────────────

/**
 * Shape of dashboard/assets/data/slot-colours-data.json — the 14-hue slot palette
 * (the ONE sanctioned exception to "no invented hues": a personal save-slot colour
 * is chrome, not a category token). The array lives in assets/data (a 14-element
 * inline literal is banned in code) and is loaded + exposed by state/regimen.ts
 * (SLOT_COLOURS / DEFAULT_SLOT_COLOUR / isSlotColour); this schema only narrows it.
 */
export const SlotColoursDataSchema = z.object({
  colours: z.array(z.string()).min(1),
});

// The slot's `colour` field (below) is a PLAIN `z.string().optional()`: colour is
// cosmetic, so the schema stays permissive (an off-palette or absent value never
// fails the document → never triggers an auto-heal wipe). Palette membership is
// enforced at the write boundary by the `setSlotColour` op, and the render falls
// back to the default for anything off-palette. A refine/catch/enum here would
// diverge the field's input vs output types (the default-divergence goals.ts
// documents) and break SlotDoc assignability.

/**
 * One regimen slot — the §3 state model. `items` + `overrides` are the SAME
 * shapes the legacy per-key stores used, reused verbatim so the coverage
 * consumers (which read only the return TYPES of the loaders) are untouched.
 *
 * P4 fields `colour` + `goals` are OPTIONAL: a pre-P4 stored slot lacks them and
 * must still validate (else auto-heal would wipe the user's regimen). The state
 * layer backfills them in place on first read (colour → a palette hue, goals →
 * the legacy global goals) so downstream reads see them populated.
 */
export const SlotSchema = z.object({
  id: z.string(),
  name: SlotNameSchema,
  items: z.array(RegimenItemSchema),
  overrides: OverridesMapSchema,
  createdAt: z.string(), // ISO YYYY-MM-DD
  editedAt: z.string(), // ISO YYYY-MM-DD
  colour: z.string().optional(), // P4 — personal hue (palette enforced by setSlotColour, not here); absent on pre-P4 docs
  goals: z.array(z.string()).optional(), // P4 — per-slot steering goals; absent on pre-P4 docs
});

/**
 * A trashed regimen ITEM (individually removed from a slot). Deleted whole SAVES are a
 * SEPARATE bin (SlotTrashEntrySchema below); an item removed on its own restores to its
 * origin save if it still exists, else the active save (P5 recycle bin).
 */
export const TrashEntrySchema = z.object({
  item: RegimenItemSchema,
  slotId: z.string(),
  slotName: z.string().optional(), // origin save's name at removal — for display; survives its later deletion
  removedAt: z.string(), // ISO timestamp (full — a unique key is not needed here, but enables relative-time)
});

/**
 * A trashed whole SAVE (P5 recycle bin). deleteSlot snapshots the ENTIRE slot — items,
 * overrides, colour, goals, timestamps — so a restore reproduces the exact pre-delete
 * state, not just the loose items. Capped at MAX_SLOT_TRASH (7), newest-first.
 */
export const SlotTrashEntrySchema = z.object({
  slot: SlotSchema,
  deletedAt: z.string(), // ISO timestamp (full — the restore key + relative-time display)
});

/**
 * THE SLOT DOCUMENT — the whole of regimen state in ONE atomic LS value.
 *
 * WHY ONE KEY. localStorage has no cross-key transaction (core/storage.ts::set
 * is atomic-verify per SINGLE key only). Holding {slots, activeSlot, trash} in
 * one JSON value means a slot switch, delete, remove-to-trash, or restore is one
 * verified setItem — all-or-nothing. A second key for trash would put a torn-write
 * data-loss window on the live remove path (doctrine #4 atomic ops, #9 reversibility).
 *
 * The runtime invariants are enforced HERE, at both read (getValidated) and write
 * (setValidated): ≥1 slot (.min(1)), ≤4 (.max(4)), ≤20 trash (.max(20)), ≤7 slotTrash (.max(7)), and
 * activeSlot always resolves (the superRefine). A torn or hand-edited document
 * cannot be read back as valid — a null read re-synthesizes a clean Default (auto-heal).
 */
export const SlotDocSchema = z
  .object({
    version: z.literal(1),
    slots: z.array(SlotSchema).min(1).max(4),
    activeSlot: z.string(),
    trash: z.array(TrashEntrySchema).max(20),
    slotTrash: z.array(SlotTrashEntrySchema).max(7).optional(),
  })
  .superRefine((doc, ctx) => {
    if (!doc.slots.some(s => s.id === doc.activeSlot)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `activeSlot '${doc.activeSlot}' does not resolve to any slot`,
        path: ['activeSlot'],
      });
    }
  });

// Inferred types (so consumers can `import type { Regimen } from '@core/schemas/regimen'`)
export type RegimenLabel = z.infer<typeof RegimenLabelSchema>;
export type RegimenItem = z.infer<typeof RegimenItemSchema>;
export type Regimen = z.infer<typeof RegimenSchema>;
export type OverridesMap = z.infer<typeof OverridesMapSchema>;
export type RgManual = z.infer<typeof RgManualSchema>;
export type RgRemoved = z.infer<typeof RgRemovedSchema>;
export type RgUserGoals = z.infer<typeof RgUserGoalsSchema>;
export type Slot = z.infer<typeof SlotSchema>;
export type SlotTrashEntry = z.infer<typeof SlotTrashEntrySchema>;
export type SlotDoc = z.infer<typeof SlotDocSchema>;
