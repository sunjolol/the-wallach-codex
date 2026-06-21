/**
 * core/schemas/log.ts — Creator's Log entry schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Schema for the Wallach Creator's Log: the §00-mandated audit trail of
 * every round close, invariant pass/fail, incident, milestone, and note.
 *
 * The Round-close ritual (CLAUDE.md) requires one log entry per closed
 * round via `state/log.log()`. The Profile panel reads these entries to
 * surface the discipline audit trail back to Luneth.
 *
 * LS key: 'wallachCreatorsLog_v1' (auto-mirrored from state/log.ts)
 * Storage shape: { entries: LogEntry[] } — wrapping in an object so we
 * can add top-level metadata (last-prune, version, etc) without a
 * breaking schema change.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** Kinds of log events. Open list — add to this enum as new ones arise. */
export const LogKindSchema = z.enum([
  'session-start',
  'session-end',
  'round-close',
  'build',
  'invariant-pass',
  'invariant-fail',
  'incident',
  'milestone',
  'design-decision',
  'note',
]);

export type LogKind = z.infer<typeof LogKindSchema>;

/** A single log entry. */
export const LogEntrySchema = z.object({
  /** Unique id — typically a ULID-ish string. */
  id: z.string().min(1),
  /** ISO-8601 timestamp the event was recorded. */
  ts: z.string().min(1),
  /** Surface or module the event came from ("coverage", "scanner", "tools", "main", etc). */
  surface: z.string().min(1),
  /** Kind tag (drives the chip color in the profile panel). */
  kind: LogKindSchema,
  /** Short headline — twitter-length. */
  summary: z.string().min(1).max(280),
  /** Optional longer body. */
  detail: z.string().optional(),
  /** Optional structured payload (cite paths, file lists, scores, etc). */
  metadata: z.record(z.unknown()).optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

/** LS storage shape: { entries: LogEntry[] }. */
export const LogShapeSchema = z.object({
  entries: z.array(LogEntrySchema).default([]),
});

export type LogShape = z.infer<typeof LogShapeSchema>;
