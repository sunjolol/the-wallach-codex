/**
 * views/knowledge-topic.ts — the Explore topic/entity page (Phase H2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A faceted knowledge page for a NON-tier-1 entity (topic / concept / element /
 * substance / person) — the pages the Explore tab opens. A pristine re-creation of
 * the signed-off "topic page" mockup (2026-07-12): a hero (kicker + name + lede +
 * related pills) over the SHARED faceted claim cards. The card renderer is reused
 * from views/entity-page.ts (one source of truth, already gated) so an Explore page
 * and an essential/condition page render Wallach's Q&A identically.
 *
 * PURE PROJECTION (R1): no canonical value or per-entity literal — every field
 * derives from the search index via state/search.ts. Prose is contained (R4): every
 * visible string comes from the view-copy store via ui()/the facet label; entity
 * NAMES + Wallach's words are data (escaped), not prose.
 *
 * Layer: views/ — reads state/ + a sibling view's card renderer, never localStorage.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { plural } from '../core/format.js';
import { ui } from '../state/copy.js';
import { booksForSubject, displayName, facetGroups, getEntity } from '../state/search.js';
import { renderSearchCard } from './entity-page.js';

// Hex escapes \x22 \x27 for " and ' (the clean-view prose scanner has no regex parser;
// a bare quote inside the char class would read to it as a string — see knowledge-home.ts).
function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>\x22\x27]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

/**
 * One related pill. Navigates (opens that topic page) only when the slug resolves to
 * an Explore-type entity; a nutrient/condition/unregistered slug renders as a static
 * chip (cross-routing those to their own pages is a later refinement, not a dead link).
 */
function relPill(slug: string): string {
  const e = getEntity(slug);
  const navigable = e !== null && e.type !== 'nutrient' && e.type !== 'condition';
  const name = displayName(slug);
  return navigable
    ? `<button class="kt-pill" type="button" data-kd-topic="${escHTML(slug)}">${escHTML(name)}</button>`
    : `<span class="kt-pill kt-pill--static">${escHTML(name)}</span>`;
}

/**
 * The Explore entity page for one subject slug. Hero + the faceted claim groups
 * (canonical facet order + labels come from state/search::facetGroups). Returns ''
 * for an unknown slug so the caller degrades to the chip grid.
 */
export function renderTopicPage(slug: string): string {
  const e = getEntity(slug);
  if (e === null) {
    return '';
  }
  const groups = facetGroups(slug);
  // Lede = the "basics" facet's one-line answer — a reviewed, byte-faithful line chosen
  // by FACET (semantic), never by array position, and never a hand-written per-topic string.
  const [ledeClaim] = groups.find(g => g.facet === 'basics')?.claims ?? [];
  const lede = ledeClaim?.answer_short ?? '';
  const sym = e.symbol ?? '';
  const symHTML = sym.length > 0 ? `<span class="kt-sym">${escHTML(sym)}</span>` : '';
  const rels = e.related.map(relPill).join('');
  const relBlock = rels.length > 0
    ? `<div class="kt-rel"><span class="kt-rel__lbl">${escHTML(ui('kt_related'))}</span>${rels}</div>`
    : '';
  const nClaims = groups.reduce((n, g) => n + g.claims.length, 0);
  const books = booksForSubject(slug);
  const noun = plural(nClaims, 'claim');
  const meta = books.length > 0
    ? ui('kt_meta_full').replace('{n}', String(nClaims)).replace('{noun}', noun).replace('{books}', books.join(', '))
    : ui('kt_meta').replace('{n}', String(nClaims)).replace('{noun}', noun);
  const facetsHTML = groups.map(g =>
    `<details class="kd-ep-facet" data-facet="${escHTML(g.facet)}" open>
      <summary class="kd-ep-facet__head"><span class="kd-ep-facet__label">${escHTML(g.label)}</span><span class="kd-ep-facet__count">${g.claims.length}</span></summary>
      <div class="kd-ep-facet__body">${g.claims.map(renderSearchCard).join('')}</div>
    </details>`).join('');
  return `<div class="kt-page kd-ep">
    <button class="kt-back" type="button" data-kd-action="topic-close">${escHTML(ui('kt_back'))}</button>
    <header class="kt-hero">
      <span class="kt-kicker"><span class="kt-kicker__dot"></span>${escHTML(e.type)} · ${escHTML(ui('kt_kicker'))}</span>
      <div class="kt-title">${symHTML}<h1>${escHTML(e.common_name ?? e.display_name)}</h1></div>
      ${lede.length > 0 ? `<p class="kt-lede">${escHTML(lede)}</p>` : ''}
      ${relBlock}
      <div class="kt-meta">${escHTML(meta)}</div>
    </header>
    ${facetsHTML}
  </div>`;
}
