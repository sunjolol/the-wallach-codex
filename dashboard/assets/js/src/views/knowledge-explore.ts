/**
 * views/knowledge-explore.ts — the Knowledge drawer's Explore tab
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The off-path index: every entity that is NOT an essential or a condition
 * (topics, concepts, elements, substances, people), grouped by type — the new
 * front-facing home for what used to live only in the search surface, projected
 * from the REAL search entity index (state/search.ts::entityList). A chip opens that entity's
 * faceted page (views/knowledge-topic.ts), rendered as a shell-level overlay
 * (views/knowledge.ts) on top of whatever tab opened it, via the data-kd-topic contract.
 *
 * PURE PROJECTION: no per-entity literal. Type-group headers come from the
 * view-copy content store via ui(); entity NAMES are data (escaped).
 *
 * Layer: views/ — reads state/ + a sibling view, never writes localStorage.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ui } from '../state/copy.js';
import { claimsForSubject, entityList, getEntity, type EntitySummary } from '../state/search.js';

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
 * have their own tabs). NOTE: renderExploreTab only draws the five types in EXPLORE_TYPES,
 * so any other type (today the single 'event' entity) is counted here — including in the
 * tab's "N TOPICS" badge in knowledge.ts — but never rendered. Add the type to EXPLORE_TYPES
 * or filter it out here; do not leave the count and the grid disagreeing.
 */
export function exploreEntities(): EntitySummary[] {
  return entityList().filter(e => e.type !== 'nutrient' && e.type !== 'condition');
}

/**
 * The hidden keyword blob the Explore filter matches against, so the tab searches CONTENT and not
 * just chip labels. Mirrors what condition rows already carry in `data-search`.
 *
 * Contents, in descending signal: the entity's lay SYNONYMS (how a person actually names the thing),
 * its claims' TOPIC tags, and its claims' QUESTION text — questions are phrased the way people
 * search, which is exactly why they earn their place here. Answer/verbatim bodies are deliberately
 * EXCLUDED: they would multiply the attribute's weight across every chip and make a topic match on
 * one incidental word, which reads as a false positive. The chip's own label is matched from its
 * textContent by the filter, so it is not duplicated into the blob.
 */
function searchBlob(slug: string): string {
  const ent = getEntity(slug);
  const parts = new Set<string>();
  for (const s of ent?.synonyms ?? []) {
    parts.add(s);
  }
  for (const c of claimsForSubject(slug)) {
    parts.add(c.question);
    for (const t of c.topics) {
      parts.add(t);
    }
  }
  return [...parts].join(' ');
}

/** One chip → opens that entity's page via the drawer's data-kd-topic contract. */
function chip(e: EntitySummary): string {
  return `<button class="kd-explore-chip" type="button" data-kd-topic="${escHTML(e.slug)}" data-search="${escHTML(searchBlob(e.slug))}">${escHTML(e.display_name)}</button>`;
}

/**
 * The Explore tab GRID: the off-path index — every non-tier-1 entity as a chip, grouped by type,
 * alphabetical within each group (Home-page philosophy), each chip opening its faceted page (a
 * shell-level overlay in views/knowledge.ts) via the drawer's data-kd-topic contract.
 */
export function renderExploreTab(): string {
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
