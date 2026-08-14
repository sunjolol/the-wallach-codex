/**
 * core/schemas/backup.ts -- the shape of an exported data backup
 * ===========================================================================
 *
 * The app's whole thesis is that the user owns 100% of their data on their
 * device, and export/import is JSON (CLAUDE.md). This is the envelope that wraps
 * a snapshot() so an import can (a) refuse a file that is not one of ours, and
 * (b) refuse a shape that is not a flat key->string map. It is deliberately
 * permissive about the DATA values (opaque raw strings): each value is
 * re-validated by its own schema on read (getValidated), so the import boundary
 * only needs to guard the envelope, not re-derive every inner schema here.
 * ===========================================================================
 */

import { z } from 'zod';

/** Marker so an import can reject a JSON file that is not one of ours. */
export const BACKUP_APP_ID = 'wallach-codex';

export const BackupEnvelopeSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  version: z.number().int(),
  exportedAt: z.string(),
  data: z.record(z.string(), z.string()),
});
