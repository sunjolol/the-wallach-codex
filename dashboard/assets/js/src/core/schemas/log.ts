/**
 * core/schemas/log.ts — Creator's Log entry schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Schema for the Wallach Creator's Log: the append-only audit trail of
 * every round close, invariant pass/fail, incident, milestone, and note.
 *
 * The round-close ritual (.claude/skills/round-close) requires one log entry per
 * closed round via `state/log.log()`. The Profile panel reads these entries to
 * surface the discipline audit trail back to the user.
 *
 * LS key: state/log.ts::CREATORS_LOG_KEY — the one declaration; never re-typed here.
 * Storage shape: { entries: LogEntry[] } — wrapping in an object so we
 * can add top-level metadata (last-prune, version, etc) without a
 * breaking schema change.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** Kinds of log events. CLOSED at runtime — an unlisted kind fails the parse and drops the
 *  whole log, so extend the enum here first, then use the new kind. */
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

/**
 * Build-time embed shape: a bare array of entries generated from the canonical
 * file ledger (chronicle/creators-log/log.jsonl) and inlined into the bundle at
 * build. Validated at the state-layer boundary before merging with the
 * localStorage entries (the file:// app cannot fetch() local files at runtime).
 */
export const LogEmbedSchema = z.array(LogEntrySchema);

export type LogEmbed = z.infer<typeof LogEmbedSchema>;
