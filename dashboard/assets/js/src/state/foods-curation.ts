/**
 * state/foods-curation.ts -- read boundary for the Foods & Absorption curation config
 * ===========================================================================
 *
 * Surfaces dashboard/assets/data/foods-curation.json to the Foods & Absorption view:
 * the SPECIAL curated selections (the home-page-curation philosophy -- a hand-tuned
 * persuasive landing, every other tab pure formula). Today that is the crown-jewel
 * thesis claims; the view imports the RESOLVED claims here, never the raw IDs.
 *
 * The offline file:// app cannot fetch(), so the store is inlined at build via
 * esbuild JSON import and validated ONCE through the Zod boundary; a bad/absent
 * store reads as empty and the thesis renders nothing (graceful, never throws).
 *
 * Pure reads only. Editorial UI config, not a Wallach claim/number -- no source-rule
 * obligation.
 * ===========================================================================
 */

import curationData from '../../../data/foods-curation.json';
import { type FoodsCuration, FoodsCurationSchema, type SearchClaim } from '../core/schemas/index.js';
import { getSearchClaim } from './search.js';

const EMPTY: FoodsCuration = { hero_claims: [] };

let cached: FoodsCuration | null = null;

/** Parse + cache once (bad/absent data -> empty; the thesis then renders nothing). */
function data(): FoodsCuration {
  if (cached === null) {
    const parsed = FoodsCurationSchema.safeParse(curationData);
    cached = parsed.success ? parsed.data : EMPTY;
  }
  return cached;
}

/**
 * The curated crown-jewel claims that anchor the Foods landing's two-pronged thesis,
 * in curated order (mantra -> prevalence -> fix). Each id is resolved against the search
 * index; an id that resolves to nothing (a typo, or a claim not in the search index) is
 * silently skipped -- graceful degradation, never a broken card.
 */
export function foodsThesisClaims(): SearchClaim[] {
  const out: SearchClaim[] = [];
  for (const id of data().hero_claims) {
    const c = getSearchClaim(id);
    if (c !== null) {
      out.push(c);
    }
  }
  return out;
}
