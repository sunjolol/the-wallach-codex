/**
 * state/entity-copy.ts — read boundary for the per-entity APPROVED-copy store (Phase H2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/entity-copy.json (hand-authored, user-approved) to the
 * entity page: the lede + short "why this number" text per entity. Inlined at build via
 * esbuild JSON import, validated ONCE through the Zod boundary; a bad/absent store reads
 * as empty so every accessor returns '' and the page renders no lede/why (never a guess).
 *
 * Pure reads. This is approved editorial copy about the corpus, not a Wallach number, so
 * it carries no §00.A obligation — but each string is written + approved to be faithful.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import entityCopyData from '../../../data/entity-copy.json';
import { type EntityCopy, EntityCopySchema } from '../core/schemas/index.js';

const EMPTY: EntityCopy = { essentials: {}, conditions: {} };

let cached: EntityCopy | null = null;

function data(): EntityCopy {
  if (cached === null) {
    const parsed = EntityCopySchema.safeParse(entityCopyData);
    cached = parsed.success ? parsed.data : EMPTY;
  }
  return cached;
}

/** Approved lede for an essential (canon slug), or '' when none is approved yet. */
export function essentialLede(slug: string): string {
  return data().essentials[slug]?.lede ?? '';
}

/** Approved short "why this number" for an essential, or '' when none is approved yet. */
export function essentialWhy(slug: string): string {
  return data().essentials[slug]?.why ?? '';
}
