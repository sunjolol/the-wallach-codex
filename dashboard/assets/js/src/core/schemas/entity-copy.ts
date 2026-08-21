/**
 * core/schemas/entity-copy.ts — the per-entity APPROVED-copy store schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/entity-copy.json — the hand-authored, user-approved
 * lede + short "why this number" copy, keyed by canon slug (essentials) and search-entity
 * slug (topics). The `conditions` map is reserved and currently empty — no accessor reads it.
 * A designated prose home: this text is NEVER auto-derived (a lede must
 * faithfully summarize the corpus; a why must faithfully explain the target), so each is
 * written one at a time and approved. Read via state/entity-copy.ts; a bad/absent store
 * degrades to empty and the entity page shows no lede/why rather than a guess.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { z } from 'zod';

/** One entity's approved copy — every field optional (an entity may have none yet). */
export const EntityCopyEntrySchema = z.object({
  lede: z.string().optional(),
  why: z.string().optional(),
  /**
   * A short note rendered under "Best Youngevity sources", for essentials Wallach routes mainly
   * through the diet. Without it a user reading chloride's 2,500 mg target against a best product
   * of 72 mg concludes the app is broken, when the honest answer is that Wallach names salt as the
   * source. Hand-authored and approved like the other two, and grounded in his own sealed words —
   * never a generic "eat well" line, and never carrying an amount he did not state.
   */
  sourcesNote: z.string().optional(),
}).passthrough();

/** The whole store — essentials + conditions + explore-topic maps of slug → approved copy. */
export const EntityCopySchema = z.object({
  essentials: z.record(z.string(), EntityCopyEntrySchema),
  conditions: z.record(z.string(), EntityCopyEntrySchema),
  // Explore-page entities (concept/substance/topic/element/person/event) — their hand-authored
  // hero lede. Optional so the store parses before any is written; the explore_entity_lede_authored
  // gate is what actually requires one per non-grandfathered explore entity.
  topics: z.record(z.string(), EntityCopyEntrySchema).optional(),
}).passthrough();

export type EntityCopyEntry = z.infer<typeof EntityCopyEntrySchema>;
export type EntityCopy = z.infer<typeof EntityCopySchema>;
