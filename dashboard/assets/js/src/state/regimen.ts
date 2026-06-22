/**
 * state/regimen.ts — regimen state + the §31 chokepoint discipline
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * THE ONLY MODULE that mutates regimen LS keys (when consumers go through
 * the public API). Every other module imports the chokepoints from here.
 *
 * Round 150 §31 doctrine: every write fires the typed `regimen:changed`
 * event so subscribers (views) re-render. Cross-IIFE legacy callers via
 * window.persistRegimen etc. route through this module after main.ts
 * installs the bridges.
 *
 * §00 Zod boundaries: every read goes through `getValidated` so bad LS
 * data never enters typed-land. Schemas live in core/schemas/regimen
 * (single source of truth — `type Regimen = z.infer<typeof RegimenSchema>`).
 *
 * LS keys this module owns:
 *   'lcRegimen_v1'       — the committed regimen items array
 *   'rgOverrides_v1'     — per-item dose overrides (id → patch)
 *   'rgManualItems_v1'   — manually-added items array
 *   'rgRemoved_v1'       — hidden item id set (serialized as array)
 *   'rgUserGoals_v1'     — user-selected goal keys array
 * ═══════════════════════════════════════════════════════════════════════════
 */

import regimenBaseData from '../../../data/regimen-base-data.json';
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
} from '../core/schemas/index.js';
import { getValidated, set } from '../core/storage.js';

// ─── LS key constants ─────────────────────────────────────────────────────
export const REGIMEN_KEY = 'lcRegimen_v1';
export const RG_OVERRIDES_KEY = 'rgOverrides_v1';
export const RG_MANUAL_KEY = 'rgManualItems_v1';
export const RG_REMOVED_KEY = 'rgRemoved_v1';
export const RG_USER_GOALS_KEY = 'rgUserGoals_v1';

// ─── Re-export inferred types so callers can `import type { Regimen } from '@state/regimen'` ─
export type { OverridesMap, Regimen, RegimenItem };
export type OverridePatch = Record<string, unknown>;

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

// ─── Read helpers — every read passes through a Zod boundary ──────────────

export function loadRegimen(): Regimen {
  return getValidated(REGIMEN_KEY, RegimenSchema) ?? { items: [] };
}

export function loadRgOverrides(): OverridesMap {
  return getValidated(RG_OVERRIDES_KEY, OverridesMapSchema) ?? {};
}

export function loadRgManual(): RegimenItem[] {
  return getValidated(RG_MANUAL_KEY, RgManualSchema) ?? [];
}

export function loadRgRemoved(): Set<number> {
  const arr = getValidated(RG_REMOVED_KEY, RgRemovedSchema);
  return new Set(arr ?? []);
}

export function loadRgUserGoals(): string[] | null {
  return getValidated(RG_USER_GOALS_KEY, RgUserGoalsSchema);
}

// ─── Effective regimen (base foundation + user stack) ──────────────────────

let cachedBase: RegimenItem[] | null = null;

/**
 * The default HBSP foundation stack (BTT 2.5 + Beyond Osteo FX + Ultimate EFA
 * Plus), migrated verbatim from legacy REGIMEN_BASE_DATA (YGY label data). Always
 * present so a fresh dashboard demos real coverage; users hide entries via the
 * §31 removed-set (the base items carry negative synthetic ids). Validated once
 * at the Zod boundary, then cached.
 */
export function loadBaseRegimen(): RegimenItem[] {
  if (cachedBase === null) {
    const parsed = RegimenSchema.safeParse(regimenBaseData);
    cachedBase = parsed.success ? parsed.data.items : [];
  }
  return cachedBase;
}

/**
 * The effective stack coverage + rails read from: base foundation + committed +
 * manual, deduped by id, minus the removed-set. The migrated, slimmed successor
 * to legacy getUnifiedRegimenItems (its recommendations / wishlist / adopted
 * machinery is the Regimen-surface migration's concern, not this).
 */
export function loadEffectiveRegimen(): RegimenItem[] {
  const removed = loadRgRemoved();
  const byId = new Map<number, RegimenItem>();
  for (const item of [...loadBaseRegimen(), ...loadRegimen().items, ...loadRgManual()]) {
    if (removed.has(item.id)) {
      continue;
    }
    byId.set(item.id, item);
  }
  return [...byId.values()];
}

// ─── Chokepoints (THE 5 §31-protected mutation paths) ──────────────────────

/** Atomically save the regimen + fire the §31 cascade. */
export function persistRegimen(r: Regimen, sourceLabel = 'persistRegimen'): void {
  set(REGIMEN_KEY, r);
  fireLegacyTrigger(sourceLabel);
  emit('regimen:changed', { slotId: REGIMEN_KEY, reason: 'restore' });
}

/** Update an item-specific override (dose, scaling, etc.) by item ID. */
export function saveRgOverride(id: number | string, patch: OverridePatch): void {
  const all = loadRgOverrides();
  const key = String(id);
  all[key] = { ...(all[key] ?? {}), ...patch };
  set(RG_OVERRIDES_KEY, all);
  fireLegacyTrigger(`saveRgOverride:${id}`);
  emit('regimen:changed', { slotId: RG_OVERRIDES_KEY, reason: 'dose-edit' });
}

/** Save the manual-items list (items added by user, not from scanner/wishlist). */
export function saveRgManual(items: RegimenItem[]): void {
  set(RG_MANUAL_KEY, items);
  fireLegacyTrigger('saveRgManual');
  emit('regimen:changed', { slotId: RG_MANUAL_KEY, reason: 'add' });
}

/** Save the removed-items hide set (serialized as array). */
export function saveRgRemoved(setOfIds: Set<number>): void {
  set(RG_REMOVED_KEY, [...setOfIds]);
  fireLegacyTrigger('saveRgRemoved');
  emit('regimen:changed', { slotId: RG_REMOVED_KEY, reason: 'remove' });
}

/** Save user-selected goals (cleaned of non-string entries per legacy). */
export function saveRgUserGoals(goalsArray: unknown): void {
  const cleaned = Array.isArray(goalsArray)
    ? goalsArray.filter((g): g is string => typeof g === 'string' && g.length > 0)
    : [];
  set(RG_USER_GOALS_KEY, cleaned);
  fireLegacyTrigger('saveRgUserGoals');
  emit('regimen:changed', { slotId: RG_USER_GOALS_KEY, reason: 'add' });
}

// ─── Bridge installation (cross-IIFE legacy compat) ───────────────────────

declare global {
  interface Window {
    persistRegimen?: typeof persistRegimen;
    saveRgOverride?: typeof saveRgOverride;
    saveRgManual?: typeof saveRgManual;
    saveRgRemoved?: typeof saveRgRemoved;
    saveRgUserGoals?: typeof saveRgUserGoals;
  }
}

/**
 * Install window.* bridges so cross-IIFE legacy callers route through the
 * native implementations. Called from main.ts AFTER legacy-dashboard.js has
 * run (which sets up its own definitions). Our exposures OVERWRITE legacy.
 *
 * Bare-name calls inside legacy IIFEs still hit the IIFE-local legacy
 * definitions — intentional, preserves "re-theme don't rewrite logic".
 */
export function installBridges(): void {
  window.persistRegimen = persistRegimen;
  window.saveRgOverride = saveRgOverride;
  window.saveRgManual = saveRgManual;
  window.saveRgRemoved = saveRgRemoved;
  window.saveRgUserGoals = saveRgUserGoals;
}
