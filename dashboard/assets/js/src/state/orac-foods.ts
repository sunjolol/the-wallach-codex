/**
 * state/orac-foods.ts — read boundary for the ORAC tab's food league-table numbers (Phase 3b)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/orac-foods-data.json to views/knowledge-orac.ts: every ORAC
 * score the sections 04–07 food tables display, each parsed by the generator from a sealed
 * food_source claim's byte-faithful verbatim (R1/R3/§00.A — the scores have one home, this
 * file hands them to the view, which never authors one).
 *
 * The offline file:// app cannot fetch(), so the artifact is inlined at build via esbuild
 * JSON import and validated ONCE through the Zod boundary. A bad/absent artifact reads as
 * null so the caller can DEGRADE GRACEFULLY (§00.B #7): the ORAC tab still renders its hero,
 * §02/§03/§08 narrative, and live claims record, and the food sections are simply omitted
 * rather than rendering `undefined`. In practice the artifact is present + valid (byte-gated
 * by derived_artifacts_fresh), so null is the defensive path, not the expected one.
 *
 * Pure reads only. These are Wallach's own numbers re-surfaced from the corpus, never a new
 * amount authored here, so no §00.A obligation is introduced.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import oracFoodsRaw from '../../../data/orac-foods-data.json';
import { type OracFoodsData, OracFoodsDataSchema } from '../core/schemas/index.js';

let cached: OracFoodsData | null | undefined;

/**
 * The validated ORAC food-table numbers, or null if the artifact is absent/malformed. Parsed
 * + cached once; the view guards on null and omits the food sections when it is.
 */
export function oracFoodsData(): OracFoodsData | null {
  if (cached === undefined) {
    const parsed = OracFoodsDataSchema.safeParse(oracFoodsRaw);
    cached = parsed.success ? parsed.data : null;
  }
  return cached;
}
