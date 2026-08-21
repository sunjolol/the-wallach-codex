/**
 * core/schemas/dose-defaults.ts — per-product starting-quantity schema
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates dashboard/assets/data/dose-defaults.json — the products whose dose stepper should
 * NOT open at one label serving. Consumed via state/dose-defaults.ts.
 *
 * ★ THE PROVENANCE FIELD IS THE POINT, and it is required rather than optional. §00.A governs
 * every recommended amount the app displays, and a pre-filled quantity is displayed. A default
 * that is not a Wallach number must SAY where it came from, in a closed vocabulary, so it can
 * never quietly drift into looking like a corpus dose. `dose_defaults_are_not_wallach` proves
 * the vocabulary stays closed and that no entry ever carries a claim id.
 *
 * Products absent from the file start at exactly one label serving — Youngevity's own stated
 * serving, which introduces no number at all.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/**
 * Where a starting quantity came from. CLOSED on purpose: adding a kind is a deliberate act,
 * and there is deliberately no 'wallach' member — a Wallach amount belongs in the corpus and
 * reaches the app as a TARGET, never as a pre-filled quantity in someone's regimen.
 */
const DoseProvenanceSchema = z.enum(['container_life']);

const DoseDefaultEntrySchema = z.object({
  /** Canon product id — MUST resolve against the sealed pillar. */
  product_id: z.string().min(1),
  /**
   * Starting quantity in the product's OWN units (tablets, capsules, softgels) — or in
   * servings where the product has no discrete unit. A positive integer; the stepper floors
   * at one unit, so zero would mean "removed", which has its own control.
   */
  units_per_day: z.number().int().positive(),
  /** Required. See the note above — this is what keeps the number honest. */
  provenance: DoseProvenanceSchema,
  /** Human reasoning, including what the quantity does and does not reach. */
  note: z.string().min(1),
});

export const DoseDefaultsSchema = z.object({
  defaults: z.array(DoseDefaultEntrySchema).min(1),
});
export type DoseDefaults = z.infer<typeof DoseDefaultsSchema>;
