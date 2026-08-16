/**
 * state/regimen.ts — regimen state + the §31 chokepoint discipline
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * THE ONLY MODULE that mutates regimen state. Every write of regimen
 * localStorage flows through the single private writer `writeSlotDoc`; the
 * public §31 chokepoints (and the new slot ops) delegate to it. Every other
 * module imports the chokepoints from here.
 *
 * P3 (2026-07-16) — SLOTS. Regimen state moved from five independent legacy
 * keys into ONE atomic slot document (`rgSlots_v1`):
 *
 *     { version:1, slots:[{id,name,items[],overrides{},createdAt,editedAt}]×1–4,
 *       activeSlot, trash:[{item,slotId,removedAt}]×≤20 }
 *
 * WHY ONE KEY (the load-bearing decision): localStorage has no cross-key
 * transaction — core/storage.ts::set is atomic-verify per SINGLE key only. With
 * the whole of regimen state in one JSON value, a slot switch / delete / remove
 * / restore is one verified setItem: all-or-nothing. Splitting trash (or the
 * active pointer) into a second key would put a torn-write data-loss window on
 * the live remove path (engineering-doctrine #4 atomic ops, #9 reversibility).
 *
 * THE FIVE LEGACY CHOKEPOINTS SURVIVE by name + signature + emit (blueprint §3
 * invariant 4: "extends the existing five; does not replace them"), so the views
 * that still import them (views/regimen.ts, views/scanner.ts) compile unchanged
 * even though they burn at §7/§8. Only their STORAGE moved into the active slot.
 * `saveRgRemoved` is now a trash adapter; `persistRegimen`
 * (0 callers) is kept for the gate + bridge. These shims are transitional — they
 * retire when those views burn, at which point the slot ops become the only API.
 *
 * MIGRATION is lazy, read-time, non-destructive: the first read with no
 * rgSlots_v1 rebuilds a Default slot from the legacy keys (reproducing the old
 * effective-stack math exactly), recovers any currently-hidden items INTO the
 * trash (never dropped), and leaves the legacy keys inert on disk (rollback +
 * one render probe asserts they survive).
 *
 * §00 Zod boundaries: every read passes through getValidated; every write
 * through setValidated (SlotDocSchema enforces ≥1 slot · ≤4 · ≤20 trash ·
 * activeSlot resolves, at BOTH boundaries). Bad LS data never enters typed-land.
 *
 * LS keys this module owns / touches:
 *   'rgSlots_v1'         — THE slot document (the only regimen write target)
 *   'rgUserGoals_v1'     — user-selected goal keys (GLOBAL, not per-slot; own key)
 *   'lcRegimen_v1'       — LEGACY, read once at migration, then inert
 *   'rgOverrides_v1'     — LEGACY, read once at migration, then inert
 *   'rgManualItems_v1'   — LEGACY, read once at migration, then inert
 *   'rgRemoved_v1'       — LEGACY, read once at migration, then inert
 * ═══════════════════════════════════════════════════════════════════════════
 */

import slotColoursData from '../../../data/slot-colours-data.json';
import { emit } from '../core/events.js';
import {
  type OverridesMap,
  OverridesMapSchema,
  type Regimen,
  type RegimenItem,
  RegimenSchema,
  RgManualSchema,
  RgRemovedSchema,
  RgUserGoalsSchema,
  type Slot,
  SlotColoursDataSchema,
  type SlotDoc,
  SlotDocSchema,
  SlotNameSchema,
  SlotSchema,
  type SlotTrashEntry,
} from '../core/schemas/index.js';
import { getRaw, getValidated, setValidated, type WriteResult } from '../core/storage.js';

// ─── LS key constants ─────────────────────────────────────────────────────
export const RG_SLOTS_KEY = 'rgSlots_v1';
export const RG_USER_GOALS_KEY = 'rgUserGoals_v1';
// Legacy keys — read once by the migration, never written again. Kept as
// exported constants so the migration + the §31 gate can name them.
export const REGIMEN_KEY = 'lcRegimen_v1';
export const RG_OVERRIDES_KEY = 'rgOverrides_v1';
export const RG_MANUAL_KEY = 'rgManualItems_v1';
export const RG_REMOVED_KEY = 'rgRemoved_v1';

// ─── Slot limits (the §3 invariants, as constants the gate can find) ───────
export const MAX_SLOTS = 4;
/** The recycle bin (P5): at most 4 removed items + 7 deleted saves, newest-first, no expiry. */
export const MAX_ITEM_TRASH = 4;
export const MAX_SLOT_TRASH = 7;
export const DEFAULT_SLOT_ID = 'default';

// ─── Slot colour palette (P4) — loaded from assets/data, validated once ────────
// The 14 hues live in slot-colours-data.json (a 14-element inline array is banned
// in code — anti-fakery >10 rule). A bad/absent file degrades to an empty palette;
// DEFAULT_SLOT_COLOUR always resolves. isSlotColour is the palette gate setSlotColour
// enforces; the view imports SLOT_COLOURS for its swatches + DEFAULT for its fallback.
const _slotColours = SlotColoursDataSchema.safeParse(slotColoursData);
export const SLOT_COLOURS: readonly string[] = _slotColours.success ? _slotColours.data.colours : [];
/** The default active-slot hue (orange — matches the Scanner's New Scan button). */
export const DEFAULT_SLOT_COLOUR = '#ff7e3c';
/** True when `c` is one of the palette hues. */
export function isSlotColour(c: string): boolean {
  return SLOT_COLOURS.includes(c);
}

// ─── Re-export inferred types so callers can `import type { Regimen } from '@state/regimen'` ─
export type { OverridesMap, Regimen, RegimenItem, Slot, SlotDoc, SlotTrashEntry };
export type OverridePatch = Record<string, unknown>;

/** Result of a refusable slot operation — never a silent drop (doctrine #1, #8). */
export type SlotOpResult = { ok: true; slotId?: string } | { ok: false; reason: string };

/** The typed `regimen:changed` reasons (mirror core/events EventPayloads). */
type RegimenChangeReason = 'dose-edit' | 'add' | 'remove' | 'restore';

// ─── Helper: invoke legacy's triggerRegimenRerender if present ────────────
function fireLegacyTrigger(label: string): void {
  const w = window as Window & { triggerRegimenRerender?: (label: string) => void };
  if (typeof w.triggerRegimenRerender === 'function') {
    try {
      w.triggerRegimenRerender(label);
    }
    catch (e) {
      console.warn('[state/regimen] legacy triggerRegimenRerender threw:', e);
    }
  }
}

// ─── Small pure helpers ────────────────────────────────────────────────────

/** Today as ISO YYYY-MM-DD (date-only; slot edit stamps). */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** A full ISO timestamp — the recycle-bin deletedAt/removedAt: a unique restore key + a real relative-time. */
function nowStamp(): string {
  return new Date().toISOString();
}

/** A fresh unique slot id. Date+random so two creations in the same ms differ. */
function newSlotId(): string {
  return `slot_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}

/** Newest-first ring cap for the item bin (P5: at most MAX_ITEM_TRASH). */
function capTrash(entries: SlotDoc['trash']): SlotDoc['trash'] {
  return entries.slice(0, MAX_ITEM_TRASH);
}

/** Newest-first ring cap for the save bin (P5: at most MAX_SLOT_TRASH). */
function capSlotTrash(entries: SlotTrashEntry[]): SlotTrashEntry[] {
  return entries.slice(0, MAX_SLOT_TRASH);
}

/**
 * The next slot colour to assign: the first palette hue not already used by a
 * slot, else the default. Deterministic (no random) so a re-render is stable and
 * two slots created back-to-back get distinct hues (P4).
 */
function pickSlotColour(used: readonly (string | undefined)[]): string {
  return SLOT_COLOURS.find(h => !used.includes(h)) ?? DEFAULT_SLOT_COLOUR;
}

/**
 * The active slot. SlotDocSchema's superRefine guarantees `activeSlot` resolves
 * and `.min(1)` guarantees a slot exists, but TS can't see those runtime facts,
 * so this stays total and fails LOUD on the impossible (doctrine #1).
 */
function getActiveSlot(doc: SlotDoc): Slot {
  const found = doc.slots.find(s => s.id === doc.activeSlot);
  if (found !== undefined) {
    return found;
  }
  const first = doc.slots[0];
  if (first !== undefined) {
    return first;
  }
  throw new Error('[state/regimen] slot document has no slots — schema invariant violated');
}

/** Return a NEW doc with the active slot replaced by `fn(activeSlot)`. Pure. */
function withActiveSlot(doc: SlotDoc, fn: (slot: Slot) => Slot): SlotDoc {
  return { ...doc, slots: doc.slots.map(s => (s.id === doc.activeSlot ? fn(s) : s)) };
}

// ─── Legacy readers (migration only — never the public read path) ──────────
// These read the retired per-key stores through their own Zod schemas. They are
// SEPARATE from the public loaders below (which read the active slot) so the
// migration can rebuild the Default slot without recursing into itself.

function readLegacyRegimen(): Regimen {
  return getValidated(REGIMEN_KEY, RegimenSchema) ?? { items: [] };
}
function readLegacyManual(): RegimenItem[] {
  return getValidated(RG_MANUAL_KEY, RgManualSchema) ?? [];
}
function readLegacyOverrides(): OverridesMap {
  return getValidated(RG_OVERRIDES_KEY, OverridesMapSchema) ?? {};
}
function readLegacyRemoved(): Set<number> {
  return new Set(getValidated(RG_REMOVED_KEY, RgRemovedSchema) ?? []);
}
/** The retired GLOBAL goals key — read ONCE by the P4 per-slot migration/backfill. */
function readLegacyUserGoals(): string[] {
  return getValidated(RG_USER_GOALS_KEY, RgUserGoalsSchema) ?? [];
}

/**
 * Build a Default slot from the legacy keys, reproducing the OLD
 * loadEffectiveRegimen exactly (committed ∪ manual, deduped by id, minus the
 * hidden set) — except the hidden items are recovered INTO the trash rather
 * than dropped (data preservation: the user can restore them).
 */
function migrateFromLegacy(): SlotDoc {
  const hidden = readLegacyRemoved();
  const byId = new Map<number, RegimenItem>();
  for (const item of [...readLegacyRegimen().items, ...readLegacyManual()]) {
    byId.set(item.id, item);
  }
  const all = [...byId.values()];
  const live = all.filter(i => !hidden.has(i.id));
  const now = today();
  const trash = capTrash(
    all.filter(i => hidden.has(i.id)).map(item => ({ item, slotId: DEFAULT_SLOT_ID, removedAt: now })),
  );
  return {
    version: 1,
    slots: [{
      id: DEFAULT_SLOT_ID,
      name: 'Default',
      items: live,
      overrides: readLegacyOverrides(),
      createdAt: now,
      editedAt: now,
      colour: DEFAULT_SLOT_COLOUR,
      goals: readLegacyUserGoals(),
    }],
    activeSlot: DEFAULT_SLOT_ID,
    trash,
    slotTrash: [],
  };
}

// ─── The slot document: the ONE reader + the ONE writer ────────────────────

/**
 * P4 in-place upgrade: a pre-P4 slot document validates (colour + goals are
 * optional) but reads with those fields undefined. Fill them ONCE — colour → a
 * distinct palette hue (first slot orange), goals → the legacy global goals (they
 * were shared before P4). Persisted WITHOUT emitting (a read must not fire the
 * render cascade); a no-op once every slot has both fields.
 */
function backfillP4(doc: SlotDoc): SlotDoc {
  if (doc.slots.every(s => s.colour !== undefined && s.goals !== undefined)) {
    return doc;
  }
  const legacyGoals = readLegacyUserGoals();
  const used: (string | undefined)[] = [];
  const slots = doc.slots.map((s) => {
    const colour = s.colour ?? (used.length === 0 ? DEFAULT_SLOT_COLOUR : pickSlotColour(used));
    used.push(colour);
    const goals = s.goals ?? [...legacyGoals];
    return { ...s, colour, goals };
  });
  const next: SlotDoc = { ...doc, slots };
  writeSlotDoc(next, { emit: false });
  return next;
}

/**
 * P5 in-place upgrade: a pre-recycle doc has no `slotTrash` and an item bin capped at the
 * old 20. Fill/repair ONCE — add `slotTrash: []`, cap the item bin to MAX_ITEM_TRASH (4)
 * newest-first, and backfill each item entry's `slotName` from its `slotId` when that save
 * still exists. Persisted WITHOUT emitting (a read must not fire the render cascade); a
 * no-op once every field is present.
 */
function backfillRecycle(doc: SlotDoc): SlotDoc {
  const hasSlotTrash = doc.slotTrash !== undefined;
  const overCap = doc.trash.length > MAX_ITEM_TRASH;
  const needsName = doc.trash.some(e => e.slotName === undefined && doc.slots.some(s => s.id === e.slotId));
  if (hasSlotTrash && !overCap && !needsName) {
    return doc;
  }
  const nameById = new Map(doc.slots.map(s => [s.id, s.name]));
  const trash = capTrash(doc.trash.map((e) => {
    if (e.slotName !== undefined) {
      return e;
    }
    const nm = nameById.get(e.slotId);
    return nm !== undefined ? { ...e, slotName: nm } : e;
  }));
  const next: SlotDoc = { ...doc, trash, slotTrash: doc.slotTrash ?? [] };
  writeSlotDoc(next, { emit: false });
  return next;
}

/**
 * Load the slot document, migrating from the legacy keys on first read.
 *
 * A present-but-invalid document (corruption / hand-edit) is treated as absent
 * and rebuilt from the legacy keys (auto-heal, graceful degradation #7) — but
 * LOUDLY, so a real corruption is not silent. Absent (normal first boot) is silent.
 */
function loadSlotDoc(): SlotDoc {
  if (getRaw(RG_SLOTS_KEY) !== null) {
    const doc = getValidated(RG_SLOTS_KEY, SlotDocSchema);
    if (doc !== null) {
      return backfillRecycle(backfillP4(doc));
    }
    console.warn('[state/regimen] rgSlots_v1 present but failed validation — '
      + 'rebuilding a Default slot from the legacy keys (auto-heal).');
  }
  const migrated = migrateFromLegacy();
  // Persist once WITHOUT emitting: a read must not fire the render cascade.
  writeSlotDoc(migrated, { emit: false });
  return migrated;
}

/**
 * THE SOLE WRITER of regimen state. Every chokepoint and slot op ends here.
 *
 * setValidated re-checks SlotDocSchema at the write boundary (defense in depth
 * #2), so a bug that produced a >4-slot or dangling-activeSlot document fails
 * LOUD instead of persisting. On success, fires the typed cascade (§31) — unless
 * the caller opts out (the migration, which persists during a read).
 */
function writeSlotDoc(doc: SlotDoc, opts?: { emit?: boolean; reason?: RegimenChangeReason }): WriteResult {
  const res = setValidated(RG_SLOTS_KEY, doc, SlotDocSchema);
  if (!res.ok) {
    // Never report success on an unverified/invalid write (#1: no silent failures).
    console.warn(`[state/regimen] slot document write failed (${res.reason ?? 'unknown'}).`);
    return res;
  }
  if (opts?.emit !== false) {
    fireLegacyTrigger('slotDoc');
    emit('regimen:changed', { slotId: RG_SLOTS_KEY, reason: opts?.reason ?? 'restore' });
  }
  return res;
}

// ─── Read helpers — every read goes through the active slot ────────────────

export function loadRgOverrides(): OverridesMap {
  return getActiveSlot(loadSlotDoc()).overrides;
}

export function loadRgManual(): RegimenItem[] {
  return getActiveSlot(loadSlotDoc()).items;
}

/**
 * The active slot's steering goals (P4 — per-slot; goals were a GLOBAL key before,
 * now seeded into each slot by the migration/backfill). Returns null only when the
 * active slot has no goals field at all (pre-backfill), so callers keep their `?? []`.
 */
export function loadRgUserGoals(): string[] | null {
  return getActiveSlot(loadSlotDoc()).goals ?? null;
}

// ─── Effective regimen (the user's own stack = the active slot's items) ────

/**
 * The user's effective stack — the active slot's items.
 *
 * THERE IS NO BASE LAYER, deliberately (2026-07-14): a fresh dashboard is true
 * zero coverage, not a synthetic HBSP pre-fill. Under the slot model the slot's
 * `items[]` IS the effective stack directly — removal moves an item to the trash,
 * so it is no longer in `items`, and there is no separate hide-set to subtract.
 */
export function loadEffectiveRegimen(): RegimenItem[] {
  return getActiveSlot(loadSlotDoc()).items;
}

// ─── The five §31 chokepoints (storage re-pointed into the active slot) ────

/** Atomically replace the active slot's items + fire the §31 cascade. */
export function persistRegimen(r: Regimen, _sourceLabel = 'persistRegimen'): void {
  const doc = loadSlotDoc();
  writeSlotDoc(withActiveSlot(doc, s => ({ ...s, items: r.items, editedAt: today() })), { reason: 'restore' });
}

/** Update an item-specific override (dose, scaling, etc.) by item ID. */
export function saveRgOverride(id: number | string, patch: OverridePatch): void {
  const doc = loadSlotDoc();
  const key = String(id);
  writeSlotDoc(
    withActiveSlot(doc, s => ({
      ...s,
      overrides: { ...s.overrides, [key]: { ...(s.overrides[key] ?? {}), ...patch } },
      editedAt: today(),
    })),
    { reason: 'dose-edit' },
  );
}

/** Save the active slot's item list (add/replace — the manual + scanned add path). */
export function saveRgManual(items: RegimenItem[]): void {
  const doc = loadSlotDoc();
  writeSlotDoc(withActiveSlot(doc, s => ({ ...s, items, editedAt: today() })), { reason: 'add' });
}

/**
 * The servings/day currently in effect for an item — mirrors state/coverage
 * readScale (override scaling_factor → label.servings → 1) but WITHOUT importing
 * coverage.ts (which imports THIS module — a cycle). Tiny + kept in sync by intent;
 * coverage.readScale stays the canonical dose read, this only feeds the bump math.
 */
function currentDose(item: RegimenItem, overrideScale: unknown): number {
  const candidates: unknown[] = [overrideScale, (item.label as Record<string, unknown>)['servings']];
  for (const c of candidates) {
    const n = typeof c === 'number' ? c : typeof c === 'string' ? Number.parseFloat(c) : Number.NaN;
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return 1;
}

/** Outcome of an add: a fresh row, or a dose bump on the product already in the slot. */
export interface AddOutcome { outcome: 'added' | 'bumped'; name: string; dose: number }

/**
 * Add a product to the active slot — but NEVER a duplicate row (REG-03). When a
 * case-insensitively same-named item is already in the slot, bump THAT item's
 * servings/day by one (saveRgOverride) instead of appending a second row that
 * coverage.accumulate would sum into a phantom double-count. This matches the rule
 * views/coverage.ts::addVaultProduct already ships; both branches route through the
 * existing §31 chokepoints (saveRgManual / saveRgOverride), so the mutation-routing
 * gate stays satisfied — no ad-hoc write.
 */
export function addOrBumpRegimenItem(item: RegimenItem): AddOutcome {
  const slot = getActiveSlot(loadSlotDoc());
  const rawName = typeof item.label.name === 'string' ? item.label.name : '';
  const key = rawName.trim().toLowerCase();
  const existing = key.length > 0
    ? slot.items.find(i => (typeof i.label.name === 'string' ? i.label.name : '').trim().toLowerCase() === key)
    : undefined;
  if (existing !== undefined) {
    const ov = slot.overrides[String(existing.id)] as { scaling_factor?: unknown } | undefined;
    const next = Math.max(1, currentDose(existing, ov?.scaling_factor) + 1);
    saveRgOverride(existing.id, { scaling_factor: next }); // → writeSlotDoc → 'regimen:changed'
    const name = typeof existing.label.name === 'string' ? existing.label.name : rawName;
    return { outcome: 'bumped', name, dose: next };
  }
  saveRgManual([...slot.items, item]); // append → writeSlotDoc → 'regimen:changed'
  return { outcome: 'added', name: rawName, dose: currentDose(item, undefined) };
}

/**
 * Move the active slot's items whose id ∈ `setOfIds` into the trash.
 *
 * Adapter for the legacy remove path (views/regimen.ts's read-add-write on the
 * hide-set): the id-set BECOMES the trash bin (blueprint §3 "one concept, one
 * store"). Idempotent — an id already in the trash (or a stale/negative seed id
 * that exists in no layer) is a harmless no-op; a re-removal dedupes by item id,
 * newer removal winning (§10).
 */
export function saveRgRemoved(setOfIds: Set<number>): void {
  const doc = loadSlotDoc();
  const slot = getActiveSlot(doc);
  const toTrash = slot.items.filter(i => setOfIds.has(i.id));
  const remaining = slot.items.filter(i => !setOfIds.has(i.id));
  const now = today();
  const newEntries = toTrash.map(item => ({ item, slotId: slot.id, slotName: slot.name, removedAt: nowStamp() }));
  const movedIds = new Set(toTrash.map(i => i.id));
  const keptOld = doc.trash.filter(e => !movedIds.has(e.item.id)); // dedupe: newer removal wins
  const next: SlotDoc = {
    ...doc,
    slots: doc.slots.map(s => (s.id === slot.id ? { ...s, items: remaining, editedAt: now } : s)),
    trash: capTrash([...newEntries, ...keptOld]),
  };
  writeSlotDoc(next, { reason: 'remove' });
}

/**
 * Save the ACTIVE slot's steering goals (P4 — per-slot; delegates to the single
 * writer, which fires the §31 cascade). Non-string entries are dropped per the
 * legacy contract. The NAME is kept so callers (coverage / welcome / regimen) are
 * unchanged, though the store is now the slot document, not the retired global key.
 */
export function saveRgUserGoals(goalsArray: unknown): void {
  const cleaned = Array.isArray(goalsArray)
    ? goalsArray.filter((g): g is string => typeof g === 'string' && g.length > 0)
    : [];
  const doc = loadSlotDoc();
  writeSlotDoc(withActiveSlot(doc, s => ({ ...s, goals: cleaned, editedAt: today() })), { reason: 'add' });
}

// ─── Slot operations (P3 — the new §31 mutation surface) ───────────────────
// Each returns {ok,reason?} where refusable (never a silent drop) and delegates
// to writeSlotDoc (the single writer + cascade). importSlot (below) is the §7
// untrusted-JSON surface: it validates via SlotSchema, then RE-MINTS every field
// (fresh slot + item ids, label narrowed, provenance forced, items capped) and
// routes the write through writeSlotDoc — an imported file can never inject code,
// spoof provenance, or bypass the atomic single-writer.

/** Read the current slot document (for a view/probe to enumerate slots). */
export function loadSlots(): SlotDoc {
  return loadSlotDoc();
}

/** Add a new empty slot. Refused at MAX_SLOTS, with a reason. */
export function addSlot(name?: string): SlotOpResult {
  const doc = loadSlotDoc();
  if (doc.slots.length >= MAX_SLOTS) {
    return { ok: false, reason: `You can have at most ${MAX_SLOTS} regimen slots. Delete one first.` };
  }
  const resolvedName = name ?? `Slot ${doc.slots.length + 1}`;
  const checked = SlotNameSchema.safeParse(resolvedName);
  if (!checked.success) {
    return { ok: false, reason: checked.error.issues[0]?.message ?? 'That slot name cannot be used.' };
  }
  const now = today();
  const slot: Slot = {
    id: newSlotId(),
    name: checked.data,
    items: [],
    overrides: {},
    createdAt: now,
    editedAt: now,
    colour: pickSlotColour(doc.slots.map(s => s.colour)),
    goals: [],
  };
  const res = writeSlotDoc({ ...doc, slots: [...doc.slots, slot] }, { reason: 'add' });
  return res.ok ? { ok: true, slotId: slot.id } : { ok: false, reason: 'That slot could not be saved to this device.' };
}

/** Duplicate a slot (its items + overrides) as a new slot. Refused at MAX_SLOTS. */
export function duplicateSlot(id: string): SlotOpResult {
  const doc = loadSlotDoc();
  if (doc.slots.length >= MAX_SLOTS) {
    return { ok: false, reason: `You can have at most ${MAX_SLOTS} regimen slots. Delete one first.` };
  }
  const src = doc.slots.find(s => s.id === id);
  if (src === undefined) {
    return { ok: false, reason: 'That slot no longer exists.' };
  }
  const resolvedName = `${src.name} copy`.slice(0, 40);
  const checked = SlotNameSchema.safeParse(resolvedName);
  const now = today();
  const slot: Slot = {
    id: newSlotId(),
    name: checked.success ? checked.data : `Slot ${doc.slots.length + 1}`,
    items: src.items.map(i => ({ ...i })),
    overrides: structuredClone(src.overrides),
    createdAt: now,
    editedAt: now,
    colour: pickSlotColour(doc.slots.map(s => s.colour)),
    goals: [...(src.goals ?? [])],
  };
  const res = writeSlotDoc({ ...doc, slots: [...doc.slots, slot] }, { reason: 'add' });
  return res.ok ? { ok: true, slotId: slot.id } : { ok: false, reason: 'That slot could not be saved to this device.' };
}

/**
 * Delete a slot. Refuses the last slot (there is always a regimen, invariant 1).
 * If the active slot is deleted, promotes the lowest-numbered survivor (the first
 * in creation order, invariant 2). The WHOLE slot (its items, overrides, colour,
 * goals) is snapshotted into the save bin (slotTrash, cap 7) so restoreDeletedSlot
 * reproduces its exact pre-delete state (reversibility #9, P5 recycle bin).
 */
export function deleteSlot(id: string): SlotOpResult {
  const doc = loadSlotDoc();
  if (doc.slots.length <= 1) {
    return { ok: false, reason: 'This is your only regimen slot — it can’t be deleted.' };
  }
  const target = doc.slots.find(s => s.id === id);
  if (target === undefined) {
    return { ok: false, reason: 'That slot no longer exists.' };
  }
  const survivors = doc.slots.filter(s => s.id !== id);
  const promoted = survivors[0];
  if (promoted === undefined) {
    return { ok: false, reason: 'That slot could not be deleted.' }; // unreachable (length ≥ 2 above)
  }
  const next: SlotDoc = {
    ...doc,
    slots: survivors,
    activeSlot: doc.activeSlot === id ? promoted.id : doc.activeSlot,
    slotTrash: capSlotTrash([{ slot: target, deletedAt: nowStamp() }, ...(doc.slotTrash ?? [])]),
  };
  const res = writeSlotDoc(next, { reason: 'remove' });
  return res.ok ? { ok: true } : { ok: false, reason: 'That slot could not be deleted.' };
}

/** Rename a slot. Rejects an unsafe name with a reason (never silently repairs). */
export function renameSlot(id: string, name: string): SlotOpResult {
  const doc = loadSlotDoc();
  const target = doc.slots.find(s => s.id === id);
  if (target === undefined) {
    return { ok: false, reason: 'That slot no longer exists.' };
  }
  const checked = SlotNameSchema.safeParse(name);
  if (!checked.success) {
    return { ok: false, reason: checked.error.issues[0]?.message ?? 'That slot name cannot be used.' };
  }
  const next: SlotDoc = {
    ...doc,
    slots: doc.slots.map(s => (s.id === id ? { ...s, name: checked.data, editedAt: today() } : s)),
  };
  const res = writeSlotDoc(next, { reason: 'restore' });
  return res.ok ? { ok: true, slotId: id } : { ok: false, reason: 'That name could not be saved.' };
}

/**
 * Set a slot's personal colour (P4). Refuses an off-palette hue — the palette gate
 * that keeps the cosmetic, permissive schema field on-palette (never a silent drop).
 */
export function setSlotColour(id: string, colour: string): SlotOpResult {
  const doc = loadSlotDoc();
  const target = doc.slots.find(s => s.id === id);
  if (target === undefined) {
    return { ok: false, reason: 'That slot no longer exists.' };
  }
  if (!isSlotColour(colour)) {
    return { ok: false, reason: 'That colour is not in the slot palette.' };
  }
  const next: SlotDoc = {
    ...doc,
    slots: doc.slots.map(s => (s.id === id ? { ...s, colour, editedAt: today() } : s)),
  };
  const res = writeSlotDoc(next, { reason: 'restore' });
  return res.ok ? { ok: true, slotId: id } : { ok: false, reason: 'That colour could not be saved.' };
}

/** Switch the active slot. Refuses an id that does not resolve. */
export function setActiveSlot(id: string): SlotOpResult {
  const doc = loadSlotDoc();
  if (!doc.slots.some(s => s.id === id)) {
    return { ok: false, reason: 'That slot no longer exists.' };
  }
  if (doc.activeSlot === id) {
    return { ok: true, slotId: id };
  }
  const res = writeSlotDoc({ ...doc, activeSlot: id }, { reason: 'restore' });
  return res.ok ? { ok: true, slotId: id } : { ok: false, reason: 'That slot could not be activated.' };
}

/**
 * Restore a removed item (by its item id) from the item bin. Lands in its origin save if
 * that save still exists, else the active save (P5). Removes the first matching bin entry;
 * skips re-adding if the id is already present in the target.
 */
export function restoreDeletedItem(itemId: number): SlotOpResult {
  const doc = loadSlotDoc();
  const entry = doc.trash.find(e => e.item.id === itemId);
  if (entry === undefined) {
    return { ok: false, reason: 'That item is not in the recycle bin.' };
  }
  const targetId = doc.slots.some(s => s.id === entry.slotId) ? entry.slotId : doc.activeSlot;
  const trash = doc.trash.filter(e => e !== entry);
  const now = today();
  const next: SlotDoc = {
    ...doc,
    slots: doc.slots.map((s) => {
      if (s.id !== targetId) {
        return s;
      }
      const already = s.items.some(i => i.id === itemId);
      return already ? s : { ...s, items: [...s.items, entry.item], editedAt: now };
    }),
    trash,
  };
  const res = writeSlotDoc(next, { reason: 'add' });
  return res.ok ? { ok: true } : { ok: false, reason: 'That item could not be restored.' };
}

/**
 * Restore a deleted SAVE from the save bin (keyed by its deletedAt stamp). With room
 * (< MAX_SLOTS) it returns directly — reusing its original id when that id is free (so an
 * orphaned item's origin resolves again), else a fresh id — and becomes active. At
 * MAX_SLOTS, `replaceSlotId` is REQUIRED: that current save is snapshotted back into the
 * bin (the swap) and the restored save takes its place. All via writeSlotDoc (§31). (P5)
 */
export function restoreDeletedSlot(deletedAtKey: string, replaceSlotId?: string): SlotOpResult {
  const doc = loadSlotDoc();
  const bin = doc.slotTrash ?? [];
  const entry = bin.find(e => e.deletedAt === deletedAtKey);
  if (entry === undefined) {
    return { ok: false, reason: 'That save is not in the recycle bin.' };
  }
  const idTaken = doc.slots.some(s => s.id === entry.slot.id);
  const restored: Slot = idTaken ? { ...entry.slot, id: newSlotId() } : entry.slot;

  if (doc.slots.length < MAX_SLOTS) {
    const next: SlotDoc = {
      ...doc,
      slots: [...doc.slots, restored],
      activeSlot: restored.id,
      slotTrash: bin.filter(e => e !== entry),
    };
    const res = writeSlotDoc(next, { reason: 'restore' });
    return res.ok ? { ok: true, slotId: restored.id } : { ok: false, reason: 'That save could not be restored.' };
  }

  if (replaceSlotId === undefined) {
    return { ok: false, reason: `You have ${MAX_SLOTS} saves. Choose one to move to the recycle bin first.` };
  }
  const replaced = doc.slots.find(s => s.id === replaceSlotId);
  if (replaced === undefined) {
    return { ok: false, reason: 'The save to replace no longer exists.' };
  }
  const next: SlotDoc = {
    ...doc,
    slots: doc.slots.map(s => (s.id === replaceSlotId ? restored : s)),
    activeSlot: doc.activeSlot === replaceSlotId ? restored.id : doc.activeSlot,
    slotTrash: capSlotTrash([{ slot: replaced, deletedAt: nowStamp() }, ...bin.filter(e => e !== entry)]),
  };
  const res = writeSlotDoc(next, { reason: 'restore' });
  return res.ok ? { ok: true, slotId: restored.id } : { ok: false, reason: 'That save could not be restored.' };
}

/** Cap on items an imported save may carry — a bound with a rejection path (no silent LS-quota DoS). */
const MAX_IMPORT_ITEMS = 500;

/**
 * Import a save from an already-JSON-parsed value (§7 — the untrusted-JSON surface).
 * SECURITY: validated by SlotSchema, then EVERY field is re-minted — a fresh slot id +
 * fresh item ids, label narrowed to {name,brand?,nutrients}, provenance forced to
 * 'user_manual' (never a file-claimed 'user_scanned'), overrides remapped to the new
 * ids, timestamps reset. Nothing executable and nothing of the file's identity survives.
 * Routes through writeSlotDoc so the atomic single-writer + §31 cascade + SlotDocSchema
 * re-validation all still apply. Refused with a reason at MAX_SLOTS or over MAX_IMPORT_ITEMS.
 */
export function importSlot(raw: unknown): SlotOpResult {
  const doc = loadSlotDoc();
  if (doc.slots.length >= MAX_SLOTS) {
    return { ok: false, reason: `You have ${MAX_SLOTS} saves. Delete one first to import.` };
  }
  const parsed = SlotSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: 'That file is not a valid saved regimen.' };
  }
  const src = parsed.data;
  if (src.items.length > MAX_IMPORT_ITEMS) {
    return { ok: false, reason: 'That save has too many items to import.' };
  }
  const now = today();
  const base = Date.now();
  const idMap = new Map<string, number>();
  const items: RegimenItem[] = src.items.map((it, i) => {
    const newId = base + i;
    idMap.set(String(it.id), newId);
    const label: RegimenItem['label'] = {
      name: typeof it.label.name === 'string' ? it.label.name : '',
      nutrients: Array.isArray(it.label.nutrients) ? it.label.nutrients : [],
    };
    if (typeof it.label.brand === 'string') {
      label.brand = it.label.brand;
    }
    return { id: newId, label, addedDate: now, provenance: 'user_manual' };
  });
  const overrides: OverridesMap = {};
  for (const [oldId, ov] of Object.entries(src.overrides)) {
    const newId = idMap.get(oldId);
    if (newId !== undefined) {
      overrides[String(newId)] = ov;
    }
  }
  const slot: Slot = {
    id: newSlotId(),
    name: src.name,
    items,
    overrides,
    createdAt: now,
    editedAt: now,
    colour: pickSlotColour(doc.slots.map(s => s.colour)),
    goals: (src.goals ?? []).filter((g): g is string => typeof g === 'string'),
  };
  const res = writeSlotDoc({ ...doc, slots: [...doc.slots, slot], activeSlot: slot.id }, { reason: 'add' });
  return res.ok ? { ok: true, slotId: slot.id } : { ok: false, reason: 'That save could not be imported to this device.' };
}

// ─── Bridge installation (cross-IIFE compat + probe/DOM-handler reach) ─────

declare global {
  interface Window {
    persistRegimen?: typeof persistRegimen;
    saveRgOverride?: typeof saveRgOverride;
    saveRgManual?: typeof saveRgManual;
    saveRgRemoved?: typeof saveRgRemoved;
    saveRgUserGoals?: typeof saveRgUserGoals;
    loadSlots?: typeof loadSlots;
    addSlot?: typeof addSlot;
    duplicateSlot?: typeof duplicateSlot;
    deleteSlot?: typeof deleteSlot;
    renameSlot?: typeof renameSlot;
    setActiveSlot?: typeof setActiveSlot;
    setSlotColour?: typeof setSlotColour;
    restoreDeletedItem?: typeof restoreDeletedItem;
    restoreDeletedSlot?: typeof restoreDeletedSlot;
    importSlot?: typeof importSlot;
  }
}

/**
 * Install window.* bridges so DOM handlers and headless render-probes can reach
 * the §31 chokepoints + slot ops. Called once from main.ts::bootstrap.
 *
 * WAS DEAD CODE until P3: defined but never invoked, so window.* was undefined.
 * The runtime slot probe drives these, so bootstrap now installs them.
 */
export function installBridges(): void {
  window.persistRegimen = persistRegimen;
  window.saveRgOverride = saveRgOverride;
  window.saveRgManual = saveRgManual;
  window.saveRgRemoved = saveRgRemoved;
  window.saveRgUserGoals = saveRgUserGoals;
  window.loadSlots = loadSlots;
  window.addSlot = addSlot;
  window.duplicateSlot = duplicateSlot;
  window.deleteSlot = deleteSlot;
  window.renameSlot = renameSlot;
  window.setActiveSlot = setActiveSlot;
  window.setSlotColour = setSlotColour;
  window.restoreDeletedItem = restoreDeletedItem;
  window.restoreDeletedSlot = restoreDeletedSlot;
  window.importSlot = importSlot;
}
