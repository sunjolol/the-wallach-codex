/**
 * core/schemas/doctrine.ts — app-doctrine card schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/doctrine-data.json — the designated prose store
 * (blueprint §2.4 prose home #4) for the Knowledge-drawer Doctrine tab. Each card
 * is the reader-facing gloss of one of the app's OWN operating guarantees
 * (source-rule, §17 write discipline, §31 chokepoints, sealed canonicals).
 *
 * These are NOT Wallach health claims: the Wallach health-doctrine cards were
 * dropped in Phase E pending Phase-G mining (see the store's _note). `enforced_by`
 * names the REAL live gates/hooks that prove each doctrine — the view composes the
 * displayed enforcement line from it, so no citation is ever hand-typed (R3). Only
 * `body` carries prose (R4 designated home); everything else stays structured.
 *
 * NEW-data pattern (esbuild JSON import + Schema.parse at load), same as glossary.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** One app-doctrine card. */
export const DoctrineCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  featured: z.boolean(),
  body: z.string(),
  /** Real invariant/hook/lint names that prove this doctrine — displayed, never a hand-typed cite. */
  enforced_by: z.array(z.string()),
  tier: z.string(),
});
export type DoctrineCard = z.infer<typeof DoctrineCardSchema>;

/** Root shape of doctrine-data.json (leading `_`-keyed metadata is ignored by the object schema). */
export const DoctrineSchema = z.object({
  doctrines: z.array(DoctrineCardSchema),
});
export type Doctrine = z.infer<typeof DoctrineSchema>;
