/**
 * views/knowledge-explore.ts — the Knowledge drawer's Explore tab (Phase H2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The off-path index: every entity that is NOT an essential or a condition
 * (topics, concepts, elements, substances, people), grouped by type — the new
 * front-facing home for what used to live only in the search surface. A pristine
 * re-creation of the signed-off demo's Explore vision, projected from the REAL
 * search entity index (state/search.ts::entityList). This chunk lands the tab
 * shell + the entity projection (used by the tab count); the grouped chip render
 * arrives in a later chunk.
 *
 * Layer: views/ — reads state/, never writes localStorage.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { entityList, type EntitySummary } from '../state/search.js';

/**
 * The Explore projection: entities that are NOT essentials or conditions (those
 * have their own tabs). Their front-facing home is this tab.
 */
export function exploreEntities(): EntitySummary[] {
  return entityList().filter(e => e.type !== 'nutrient' && e.type !== 'condition');
}

/** The Explore tab. Grouped chip render lands in a later chunk. */
export function renderExploreTab(): string {
  return '<div class="kd-explore"></div>';
}
