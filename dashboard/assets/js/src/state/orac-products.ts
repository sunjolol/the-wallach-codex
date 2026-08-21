/**
 * state/orac-products.ts — read boundary for the ORAC tab's §07 "Best Supplement Sources"
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/orac-products-data.json to views/knowledge-orac.ts: the Youngevity
 * products ranked by their OFFICIAL per-serving ORAC (source: ygy), with delivery form, wholesale
 * price, and an ORAC-per-dollar value. The generator joins the hand-authored ORAC numbers with the
 * product pillar (name+form) and prices.json (wholesale), so the view authors nothing.
 *
 * The offline file:// app cannot fetch(), so the artifact is inlined at build via esbuild JSON import
 * and validated ONCE through the Zod boundary. A bad/absent artifact reads as null so the caller can
 * DEGRADE GRACEFULLY: the ORAC tab still renders its hero, narrative, food tables, and live
 * claims, and the supplement section is simply omitted rather than rendering `undefined`. In practice
 * the artifact is present + valid (byte-gated by derived_artifacts_fresh), so null is the defensive path.
 *
 * §00.A: these are Youngevity composition/measured-property values, never a Wallach amount authored here.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import oracProductsRaw from '../../../data/orac-products-data.json';
import { type OracProductsData, OracProductsDataSchema } from '../core/schemas/index.js';

let cached: OracProductsData | null | undefined;

/**
 * The validated supplement-ORAC table, or null if the artifact is absent/malformed. Parsed + cached
 * once; the view guards on null and omits the §07 supplement section when it is.
 */
export function oracProductsData(): OracProductsData | null {
  if (cached === undefined) {
    const parsed = OracProductsDataSchema.safeParse(oracProductsRaw);
    cached = parsed.success ? parsed.data : null;
  }
  return cached;
}
