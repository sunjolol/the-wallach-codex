/**
 * state/home-curation.ts — read boundary for the Home-tab curation config
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces dashboard/assets/data/home-curation.json to the Home view: the SPECIAL
 * curated selections (the home-page-curation philosophy — Home is the hand-tuned
 * front door, every other tab is pure formula). Today that is the Explore-preview
 * topic pick; the view imports the resolved entities here, never the raw slugs.
 *
 * The offline file:// app cannot fetch(), so the store is inlined at build via
 * esbuild JSON import and validated ONCE through the Zod boundary; a bad/absent
 * store reads as empty and the preview renders nothing (graceful, never `undefined`).
 *
 * Pure reads only. This is editorial UI config, not a Wallach claim/number, so this
 * module carries no §00.A obligation.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import curationData from '../../../data/home-curation.json';
import { type HomeCuration, HomeCurationSchema } from '../core/schemas/index.js';
import { entityList, type EntitySummary } from './search.js';

const EMPTY: HomeCuration = { explore_preview: [] };

let cached: HomeCuration | null = null;

/** Parse + cache once (bad/absent data → empty; the preview then renders nothing). */
function data(): HomeCuration {
  if (cached === null) {
    const parsed = HomeCurationSchema.safeParse(curationData);
    cached = parsed.success ? parsed.data : EMPTY;
  }
  return cached;
}

/**
 * The curated Home "Explore" preview — the hand-picked topic/concept entities
 * (home-curation.json), each resolved against the search entity index and returned
 * A-Z by display name (the SELECTION is curated; the ORDER is a formula, so a
 * hand-edit needn't keep the list sorted). A slug that resolves to nothing (a later
 * typo) is silently skipped — graceful degradation, never a broken chip.
 */
export function homeExploreTopics(): EntitySummary[] {
  const bySlug = new Map(entityList().map((e): [string, EntitySummary] => [e.slug, e]));
  const out: EntitySummary[] = [];
  for (const slug of data().explore_preview) {
    const e = bySlug.get(slug);
    if (e !== undefined) {
      out.push(e);
    }
  }
  return out.sort((a, b) => a.display_name.localeCompare(b.display_name));
}
