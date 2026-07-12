/**
 * core/schemas/entity-copy.ts — the per-entity APPROVED-copy store schema (Phase H2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/entity-copy.json — the hand-authored, user-approved
 * lede + short "why this number" copy, keyed by canon slug (essentials) / catalog slug
 * (conditions). A designated R4 prose home: this text is NEVER auto-derived (a lede must
 * faithfully summarize the corpus; a why must faithfully explain the target), so each is
 * written one at a time and approved. Read via state/entity-copy.ts; a bad/absent store
 * degrades to empty and the entity page shows no lede/why rather than a guess.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { z } from 'zod';

/** One entity's approved copy — both fields optional (an entity may have neither yet). */
export const EntityCopyEntrySchema = z.object({
  lede: z.string().optional(),
  why: z.string().optional(),
}).passthrough();

/** The whole store — essentials + conditions maps of slug → approved copy. */
export const EntityCopySchema = z.object({
  essentials: z.record(z.string(), EntityCopyEntrySchema),
  conditions: z.record(z.string(), EntityCopyEntrySchema),
}).passthrough();

export type EntityCopyEntry = z.infer<typeof EntityCopyEntrySchema>;
export type EntityCopy = z.infer<typeof EntityCopySchema>;
