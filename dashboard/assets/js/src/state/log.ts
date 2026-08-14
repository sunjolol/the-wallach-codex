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
  LogEmbedSchema,
  LogShapeSchema,
} from '../core/schemas/index.js';
import { getValidated, set } from '../core/storage.js';
import creatorsLogEmbed from '../../../data/creators-log-embed.json';

export type { LogEntry, LogKind };

export const CREATORS_LOG_KEY = 'wallachCreatorsLog_v1';

/** Retention cap. Newest LOG_RETENTION entries are kept; older fall off. */
export const LOG_RETENTION = 2000;

// ─── Read API — Zod-validated boundary ────────────────────────────────────

/**
 * All entries, newest first. Bad LS data → empty array (never enters
 * typed-land unvalidated).
 */
/**
 * The build-time embed of the canonical file ledger
 * (chronicle/creators-log/log.jsonl) — the CLI-fired entries (round closes,
 * milestones, incidents) that never touched this device's localStorage.
 * Validated once at the boundary; a bad/absent embed reads as empty so it can
 * never throw into the app.
 */
let cachedEmbed: LogEntry[] | null = null;
function embeddedEntries(): LogEntry[] {
  if (cachedEmbed === null) {
    const parsed = LogEmbedSchema.safeParse(creatorsLogEmbed);
    cachedEmbed = parsed.success ? parsed.data : [];
  }
  return cachedEmbed;
}

/** Concatenate lists, keeping the first entry seen per id. */
function mergeById(...lists: LogEntry[][]): LogEntry[] {
  const seen = new Set<string>();
  const out: LogEntry[] = [];
  for (const list of lists) {
    for (const entry of list) {
      if (seen.has(entry.id)) {
        continue;
      }
      seen.add(entry.id);
      out.push(entry);
    }
  }
  return out;
}

/**
 * All entries, newest first. Boot-merge of the build-time embed (CLI-fired
 * entries from the sacred file ledger) + this device's localStorage entries,
 * deduped by id. The embed is canonical, so it wins on an id collision. Bad LS
 * data → that layer is dropped (never enters typed-land unvalidated).
 */
export function getEntries(): LogEntry[] {
  const shape = getValidated(CREATORS_LOG_KEY, LogShapeSchema);
  const lsEntries = shape?.entries ?? [];
  return mergeById(embeddedEntries(), lsEntries)
    .sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
}

/** Count of total entries (embed + localStorage, deduped). */
export function getEntryCount(): number {
  return getEntries().length;
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
