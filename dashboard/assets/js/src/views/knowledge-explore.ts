/**
 * views/knowledge-explore.ts — the Knowledge drawer's Explore tab (Phase H2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The off-path index: every entity that is NOT an essential or a condition
 * (topics, concepts, elements, substances, people), grouped by type — the new
 * front-facing home for what used to live only in the search surface. A pristine
 * re-creation of the signed-off demo's Explore vision, projected from the REAL
 * search entity index (state/search.ts::entityList). A chip opens that entity's
 * faceted page (views/knowledge-topic.ts) via the drawer's data-kd-topic contract;
 * with a selected topic the tab shows that page instead of the grid.
 *
 * PURE PROJECTION (R1): no per-entity literal. Type-group headers come from the
 * view-copy content store (R4) via ui(); entity NAMES are data (escaped).
 *
 * Layer: views/ — reads state/ + a sibling view, never writes localStorage.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ui } from '../state/copy.js';
import { entityList, type EntitySummary } from '../state/search.js';
import { renderTopicPage } from './knowledge-topic.js';

// Hex escapes \x22 \x27 for " and ' (clean-view prose scanner has no regex parser).
function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>\x22\x27]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

/** The Explore type groups, in display order; each label lives in the view-copy store. */
const EXPLORE_TYPES: ReadonlyArray<{ type: string; key: string }> = [
  { type: 'topic', key: 'kt_type_topic' },
  { type: 'concept', key: 'kt_type_concept' },
  { type: 'element', key: 'kt_type_element' },
  { type: 'substance', key: 'kt_type_substance' },
  { type: 'person', key: 'kt_type_person' },
];

/**
 * The Explore projection: entities that are NOT essentials or conditions (those
 * have their own tabs). Their front-facing home is this tab.
 */
export function exploreEntities(): EntitySummary[] {
  return entityList().filter(e => e.type !== 'nutrient' && e.type !== 'condition');
}

/** One chip → opens that entity's page via the drawer's data-kd-topic contract. */
function chip(e: EntitySummary): string {
  return `<button class="kd-explore-chip" type="button" data-kd-topic="${escHTML(e.slug)}">${escHTML(e.display_name)}</button>`;
}

/**
 * The Explore tab. With a selected topic it renders that entity's page; otherwise the
 * off-path index — every non-tier-1 entity as a chip, grouped by type, alphabetical
 * within each group (Home-page philosophy), each chip opening its page in the drawer.
 */
export function renderExploreTab(selectedTopic: string | null): string {
  if (selectedTopic !== null) {
    const page = renderTopicPage(selectedTopic);
    if (page.length > 0) {
      return page;
    }
  }
  const all = exploreEntities();
  const groups = EXPLORE_TYPES.map(({ type, key }) => {
    const inType = all
      .filter(e => e.type === type)
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
    if (inType.length === 0) {
      return '';
    }
    return `<div class="kd-explore-group"><div class="kd-explore-group__head">${escHTML(ui(key))}<span class="kd-explore-group__ct">${inType.length}</span></div><div class="kd-explore-cloud">${inType.map(chip).join('')}</div></div>`;
  }).join('');
  return `<div class="kd-explore">${groups}</div>`;
}
