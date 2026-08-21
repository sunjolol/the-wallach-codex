/**
 * state/log.ts — Creator's Log chokepoint
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The audit trail, read-only in the app. Round-close entries are written by the CLI
 * to chronicle/creators-log/log.jsonl and reach the app through the build-time embed;
 * `log()` below is the in-app writer and currently has no caller. The profile panel
 * reads via `getEntries()`.
 *
 * Discipline:
 *   - Every write goes through `log()` — the single chokepoint.
 *   - Every write fires `log:entry-added` so any subscriber can re-render.
 *   - Every read goes through the Zod boundary (`getValidated`).
 *   - Auto-prune: cap at LOG_RETENTION entries (FIFO). Older entries fall off
 *     when the cap is exceeded so this LS key never grows unboundedly.
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
 * The build-time embed of the canonical file ledger
 * (chronicle/creators-log/log.jsonl) — the CLI-fired entries (round closes,
 * milestones, incidents) that never touched this device's localStorage.
 * Validated once at the boundary; a bad/absent embed reads as empty so it can
 * never throw into the app.
 */
let cachedEmbed: LogEntry[] | null = null;
/**
 * Where the WEB build's fetched copy lands. That build stubs `creatorsLogEmbed` to an empty
 * array and ships the real file for state/data-split.ts to pull after first paint (it is the
 * single heaviest thing in the bundle). Stays null in the file:// build, which never calls
 * hydrateLogEmbed and reads the inlined import directly.
 */
let injectedEmbed: unknown = null;

/**
 * Accept the fetched creator's-log embed. Clearing the parse cache is the point: the next
 * read re-validates through the same Zod boundary the inlined path uses, so a payload that
 * arrived over the wire gets no more trust than one that arrived in the bundle.
 */
export function hydrateLogEmbed(raw: unknown): void {
  injectedEmbed = raw;
  cachedEmbed = null;
}

function embeddedEntries(): LogEntry[] {
  if (cachedEmbed === null) {
    const parsed = LogEmbedSchema.safeParse(injectedEmbed ?? creatorsLogEmbed);
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
 * Append a Creator's Log entry. Auto-stamps id + ts. Emits `log:entry-added` so any
 * subscriber can re-render — nothing subscribes today; it is an extension point.
 * Auto-prunes to LOG_RETENTION entries.
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
