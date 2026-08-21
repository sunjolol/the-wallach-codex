/**
 * state/orac.ts — read boundary for the ORAC knowledge tab's canonical numbers
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/orac-data.json to views/knowledge-orac.ts: every Wallach
 * number the ORAC narrative displays — the decades mirror and stolen-years blocks, the §03
 * daily target, the §06 field chart and the §08 pieces — each parsed by the generator from a
 * sealed claim's byte-faithful verbatim (§00.A — the numbers have one home, this file
 * hands them to the view, which never authors one).
 *
 * The offline file:// app cannot fetch(), so the artifact is inlined at build via esbuild
 * JSON import and validated ONCE through the Zod boundary. A bad/absent artifact reads as
 * null so the caller can DEGRADE GRACEFULLY: the ORAC tab still renders its hero
 * + live claims record, and the numbered narrative sections are simply omitted rather than
 * rendering `undefined`. In practice the artifact is present + valid (byte-gated by
 * derived_artifacts_fresh), so null is the defensive path, not the expected one.
 *
 * Pure reads only. These are Wallach's own numbers re-surfaced from the corpus, never a new
 * amount authored here, so no §00.A obligation is introduced.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import oracRaw from '../../../data/orac-data.json';
import { type OracData, OracDataSchema } from '../core/schemas/index.js';

let cached: OracData | null | undefined;

/**
 * The validated ORAC numbers, or null if the artifact is absent/malformed. Parsed + cached
 * once; the view guards on null and omits the numbered sections when it is.
 */
export function oracData(): OracData | null {
  if (cached === undefined) {
    const parsed = OracDataSchema.safeParse(oracRaw);
    cached = parsed.success ? parsed.data : null;
  }
  return cached;
}
