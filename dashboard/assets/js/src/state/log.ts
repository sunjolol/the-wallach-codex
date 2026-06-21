/**
 * state/log.ts — Creator's Log chokepoint
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The §00-mandated audit trail. Round-close ritual writes one entry here
 * via `log()`. Profile panel reads via `getEntries()`.
 *
 * Discipline:
 *   - Every write goes through `log()` — the single chokepoint.
 *   - Every write fires `log:entry-added` so the profile panel can re-render.
 *   - Every read goes through the Zod boundary (`getValidated`).
 *   - Auto-prune: cap at LOG_RETENTION entries (FIFO). Older entries fall off
 *     when the cap is exceeded so this LS key never grows unboundedly.
 *
 * §00 prime-directive note: this log IS the discipline audit trail. If the
 * cadence of round-close entries drops, that's a §00 violation signal.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { emit } from '../core/events.js';
import {
  type LogEntry,
  type LogKind,
  LogShapeSchema,
} from '../core/schemas/index.js';
import { getValidated, set } from '../core/storage.js';

export type { LogEntry, LogKind };

export const CREATORS_LOG_KEY = 'wallachCreatorsLog_v1';

/** Retention cap. Newest LOG_RETENTION entries are kept; older fall off. */
export const LOG_RETENTION = 2000;

// ─── Read API — Zod-validated boundary ────────────────────────────────────

/**
 * All entries, newest first. Bad LS data → empty array (never enters
 * typed-land unvalidated).
 */
export function getEntries(): LogEntry[] {
  const shape = getValidated(CREATORS_LOG_KEY, LogShapeSchema);
  const entries = shape?.entries ?? [];
  // Newest-first ordering — sort by ts descending so consumers don't need to.
  return [...entries].sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
}

/** Count of total entries on file. */
export function getEntryCount(): number {
  const shape = getValidated(CREATORS_LOG_KEY, LogShapeSchema);
  return (shape?.entries ?? []).length;
}

/** Entries filtered by kind. Useful for the invariant scoreboard. */
export function getEntriesByKind(kind: LogKind): LogEntry[] {
  return getEntries().filter(e => e.kind === kind);
}

// ─── Write chokepoint ─────────────────────────────────────────────────────

export interface LogInput {
  surface: string;
  kind: LogKind;
  summary: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append a Creator's Log entry. Auto-stamps id + ts. Emits
 * `log:entry-added` for the profile panel to re-render. Auto-prunes to
 * LOG_RETENTION entries.
 *
 * This is the ONLY sanctioned writer to wallachCreatorsLog_v1.
 */
export function log(input: LogInput): LogEntry {
  const id = `lg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const entry: LogEntry = {
    id,
    ts: new Date().toISOString(),
    surface: input.surface,
    kind: input.kind,
    summary: input.summary,
    ...(input.detail !== undefined ? { detail: input.detail } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
  };

  // Read existing, append, prune (keep newest LOG_RETENTION).
  const existing = getValidated(CREATORS_LOG_KEY, LogShapeSchema)?.entries ?? [];
  const all = [...existing, entry];
  const pruned = all.length > LOG_RETENTION ? all.slice(all.length - LOG_RETENTION) : all;

  set(CREATORS_LOG_KEY, { entries: pruned });
  emit('log:entry-added', { id, kind: entry.kind });
  return entry;
}

/**
 * Clear all entries. Reserved for testing / user-initiated reset. Not
 * called by any production code path.
 */
export function clearLog(): void {
  set(CREATORS_LOG_KEY, { entries: [] });
  emit('log:entry-added', { id: '__cleared__', kind: 'note' });
}
