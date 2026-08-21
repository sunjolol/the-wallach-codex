/**
 * views/knowledge-topic.ts — the Explore topic/entity page
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A faceted knowledge page for a NON-tier-1 entity (topic / concept / element /
 * substance / person) — the pages the Explore tab opens: a hero (kicker + name + lede +
 * related pills) over the SHARED faceted claim cards. The card renderer is reused
 * from views/entity-page.ts (one source of truth, already gated) so an Explore page
 * and an essential/condition page render Wallach's Q&A identically.
 *
 * PURE PROJECTION: no canonical value or per-entity literal — every field
 * derives from the search index via state/search.ts. Prose is contained: every
 * visible string comes from the view-copy store via ui()/the facet label; entity
 * NAMES + Wallach's words are data (escaped), not prose.
 *
 * Layer: views/ — reads state/ + a sibling view's card renderer, never localStorage.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { plural } from '../core/format.js';
import { getCondition, getEssentialBySlug } from '../state/corpus.js';
import { ui } from '../state/copy.js';
import { booksForSubject, displayName, entityLede, facetGroups, getEntity } from '../state/search.js';
import { renderSearchCard } from './entity-page.js';

// Hex escapes \x22 \x27 for " and ' (the clean-view prose scanner has no regex parser;
// a bare quote inside the char class would read to it as a string — see knowledge-home.ts).
function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>\x22\x27]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

/**
 * One related pill, routed to whichever page actually owns the slug:
 *   nutrient  → the essential detail page, by its COVERAGE LAYOUT KEY (not the slug — see the
 *               openEntity comment in knowledge.ts for why that distinction is load-bearing)
 *   condition → the condition detail page, by slug
 *   otherwise → the Explore topic overlay, by slug
 * A pill renders STATIC when its target genuinely does not resolve — an unregistered slug, or a
 * nutrient/condition the corpus has no entry for. That is deliberate: a dead button that looks
 * live is worse than an honest static chip. The unroutable remainder is audited out-of-band
 * (search-index.json x corpus-embed.json) so a dead pill is a REPORTED gap, not a silent one.
 */
function relPill(slug: string): string {
  const t = relTarget(slug);
  const name = displayName(slug);
  return t === null
    ? `<span class="kt-pill kt-pill--static">${escHTML(name)}</span>`
    : `<button class="kt-pill" type="button" ${t.attr}="${escHTML(t.val)}">${escHTML(name)}</button>`;
}

/**
 * Resolve a related slug to the page that actually owns it, or null if nothing does.
 *
 * TWO REGISTRIES, and the pill must consult BOTH. The search entity registry and the corpus
 * (essentials + conditions) overlap but neither contains the other. Routing on the search
 * registry alone leaves dozens of pills dead — `selenium`, `zinc`, `vitamin-d`, `cancer`,
 * `osteoporosis`, `arthritis` and friends — every one of which HAS a page, just not a registry
 * entry. Slugs match the corpus RAW, underscores and all (`celiac_disease` IS the corpus
 * condition slug), so no normalisation is involved and none should be added: a normaliser here
 * would silently paper over a genuine slug mismatch instead of surfacing it. The unroutable
 * remainder is audited out-of-band against search-index.json + corpus-embed.json (every related
 * slug, not just the rendered ones), so a dead pill is a reported gap, not a silent one.
 *
 * Registry type wins when present, so an entity that is BOTH a registry element and a corpus
 * essential (gold, hydrogen, potassium...) opens the Explore topic page, not the essential page.
 */
function relTarget(slug: string): { attr: string; val: string } | null {
  const essAttr = (s: string): { attr: string; val: string } | null => {
    // The essential page keys by COVERAGE LAYOUT KEY ('Vitamin D2 (Ergocalciferol) + D3
    // (Cholecalciferol)'), never the slug — see the openEntity comment in knowledge.ts.
    const lk = getEssentialBySlug(s)?.layout_key;
    return lk !== undefined && lk !== '' ? { attr: 'data-kd-essential', val: lk } : null;
  };
  const e = getEntity(slug);
  if (e !== null) {
    if (e.type === 'nutrient') {
      return essAttr(slug);
    }
    if (e.type === 'condition') {
      return getCondition(slug) !== null ? { attr: 'data-kd-condition', val: slug } : null;
    }
    return { attr: 'data-kd-topic', val: slug };
  }
  const ess = essAttr(slug);
  if (ess !== null) {
    return ess;
  }
  return getCondition(slug) !== null ? { attr: 'data-kd-condition', val: slug } : null;
}


/**
 * The Explore entity page for one subject slug. Hero + the faceted claim groups
 * (canonical facet order + labels come from state/search::facetGroups). Returns ''
 * for an unknown slug so the caller degrades to the chip grid.
 */
export function renderTopicPage(slug: string, fromExplore: boolean): string {
  const e = getEntity(slug);
  if (e === null) {
    return '';
  }
  const groups = facetGroups(slug);
  // Lede = the entity's "at a glance" intro — the answer_short of its highest-priority facet
  // (basics-first, else a food's stance / a person's biography), so EVERY topic shows one, not
  // only those with a 'basics' claim. Semantic-priority, byte-faithful, soft-clamped in state.
  const lede = entityLede(slug);
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
    <header class="kt-hero">
      <div class="kt-hero__top">
        <span class="kt-kicker"><span class="kt-kicker__dot"></span>${escHTML(e.type)} · <button type="button" class="kt-kicker__link" data-kd-action="explore-home">${escHTML(ui('kt_kicker'))}</button></span>
        <button class="kd-ep-back" type="button" data-kd-action="topic-close">${escHTML(fromExplore ? ui('kt_back') : ui('kt_back_generic'))}</button>
      </div>
      <div class="kt-title">${symHTML}<h1>${escHTML(e.common_name ?? e.display_name)}</h1></div>
      ${lede.length > 0 ? `<p class="kt-lede">${escHTML(lede)}</p>` : ''}
      ${relBlock}
      <div class="kt-meta">${escHTML(meta)}</div>
    </header>
    ${facetsHTML}
  </div>`;
}
