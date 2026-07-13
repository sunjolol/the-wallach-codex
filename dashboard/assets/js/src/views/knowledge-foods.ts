/**
 * views/knowledge-foods.ts -- the Knowledge drawer's Absorption ("second prong") tab
 * ===========================================================================
 *
 * A curated, PERSUASIVE landing for Wallach's diet / absorption teaching -- the half of
 * his model that says the 90 essential nutrients only work if the gut can absorb them.
 * Designed to feel special and pull the reader in (Luneth 2026-07-13): an editorial hero,
 * a high-contrast prevalence stat, and an illustrated villi diagram (healthy vs
 * gluten-damaged) that shows WHY absorption fails -- then the sealed crown-jewel claims
 * "in his own words". Restraint still governs the TONE (persuade through Wallach's own
 * evidence, never nag); the richness is visual, not a lecture.
 *
 * PURE PROJECTION (R1): no canonical value or per-topic literal. The thesis claims come
 * from the curation config (state/foods-curation.ts) resolved against the search index,
 * rendered with the SHARED faceted claim card (views/entity-page.ts). Prose is contained
 * (R4): every framing string comes from the view-copy store via ui()/the facet label;
 * Wallach's words are data (escaped). The villi figure is a decorative SVG (no data); its
 * caption + the prevalence stat are framing that faithfully surface sealed claims
 * (EPIGEN-000141 prevalence + the gluten->villi mechanism), each attributed on screen.
 *
 * Layer: views/ -- reads state/ + a sibling view's card renderer, never localStorage.
 * ===========================================================================
 */

import { SEARCH_FACETS, type SearchClaim } from '../core/schemas/index.js';
import { facetLabel, ui } from '../state/copy.js';
import { foodsThesisClaims } from '../state/foods-curation.js';
import { renderSearchCard } from './entity-page.js';

// Hex escapes \x22 \x27 for " and ' (the clean-view prose scanner has no regex parser;
// a bare quote inside the char class would read to it as a string -- see knowledge-topic.ts).
function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>\x22\x27]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

/**
 * Group a curated cross-subject claim list into facet sections (canonical SEARCH_FACETS
 * order), rendered with the SAME markup a topic page uses -- so the crown jewels read as
 * one system with the rest of Knowledge (basics -> teal, protocol -> green).
 */
function facetSections(claims: SearchClaim[]): string {
  return SEARCH_FACETS.map((facet) => {
    const inFacet = claims.filter(c => c.facet === facet);
    if (inFacet.length === 0) {
      return '';
    }
    return `<details class="kd-ep-facet" data-facet="${escHTML(facet)}" open>
      <summary class="kd-ep-facet__head"><span class="kd-ep-facet__label">${escHTML(facetLabel(facet))}</span><span class="kd-ep-facet__count">${inFacet.length}</span></summary>
      <div class="kd-ep-facet__body">${inFacet.map(renderSearchCard).join('')}</div>
    </details>`;
  }).join('');
}

/** One villus (intestinal finger) as a rounded-top path from the gut-wall baseline. */
function villus(cx: number, baseY: number, w: number, h: number): string {
  const top = baseY - h;
  const r = w / 2;
  return `M${cx - r} ${baseY} L${cx - r} ${top + r} Q${cx - r} ${top} ${cx} ${top} Q${cx + r} ${top} ${cx + r} ${top + r} L${cx + r} ${baseY} Z`;
}

/**
 * The villi figure: healthy = tall dense fingers (large surface area, nutrients pulled in);
 * damaged = short blunted stubs (nutrients drift past). Decorative (aria-hidden); colours
 * come from CSS classes (var() does not resolve inside SVG presentation attributes).
 */
function villiArt(healthy: boolean): string {
  const baseY = 106;
  const n = 7;
  const startX = 24;
  const gap = 26;
  const w = healthy ? 14 : 17;
  const h = healthy ? 78 : 17;
  let vs = '';
  for (let i = 0; i < n; i += 1) {
    vs += `<path class="kd-foods-villi__v" d="${villus(startX + i * gap, baseY, w, h)}" />`;
  }
  let dots = '';
  for (let i = 0; i < 6; i += 1) {
    const cx = startX + 13 + i * gap;
    const cy = healthy ? 44 + (i % 3) * 16 : 13 + (i % 2) * 9;
    dots += `<circle class="kd-foods-villi__dot" cx="${cx}" cy="${cy}" r="3.1" />`;
  }
  return `<svg class="kd-foods-villi__art" viewBox="0 0 200 116" role="img" aria-hidden="true"><line class="kd-foods-villi__wall" x1="8" y1="${baseY}" x2="192" y2="${baseY}" />${vs}${dots}</svg>`;
}

/**
 * The Absorption landing (chunk 2 -- the elevated visual thesis): editorial hero (mantra
 * headline + two-prong deck) -> the prevalence stat -> the villi mechanism figure -> the
 * three sealed crown-jewel claims "in his own words". The REMOVE <-> EAT good/bad-foods
 * contrast is the next chunk.
 */
export function renderFoodsTab(): string {
  const thesis = foodsThesisClaims();
  return `<div class="kt-page kd-ep kd-foods">
    <header class="kd-foods-hero">
      <span class="kd-foods-hero__kicker">${escHTML(ui('kd_foods_kicker'))}</span>
      <h1 class="kd-foods-hero__h"><span class="l1">${escHTML(ui('kd_foods_hl1'))}</span><span class="l2">${escHTML(ui('kd_foods_hl2'))}</span></h1>
      <p class="kd-foods-hero__deck">${escHTML(ui('kd_foods_deck'))}</p>
    </header>

    <div class="kd-foods-stat">
      <div class="kd-foods-stat__num">${escHTML(ui('kd_foods_stat_num'))}</div>
      <div class="kd-foods-stat__body">
        <div class="kd-foods-stat__lead">${escHTML(ui('kd_foods_stat_lead'))}</div>
        <div class="kd-foods-stat__cite">${escHTML(ui('kd_foods_stat_cite'))}</div>
      </div>
    </div>

    <section class="kd-foods-villi">
      <h2 class="kd-foods-villi__hd">${escHTML(ui('kd_foods_villi_title'))}</h2>
      <div class="kd-foods-villi__grid">
        <div class="kd-foods-villi__panel kd-foods-villi__panel--ok">
          <div class="kd-foods-villi__t">${escHTML(ui('kd_foods_villi_ok_title'))}</div>
          ${villiArt(true)}
          <div class="kd-foods-villi__cap">${escHTML(ui('kd_foods_villi_ok_cap'))}</div>
        </div>
        <div class="kd-foods-villi__panel kd-foods-villi__panel--bad">
          <div class="kd-foods-villi__t">${escHTML(ui('kd_foods_villi_bad_title'))}</div>
          ${villiArt(false)}
          <div class="kd-foods-villi__cap">${escHTML(ui('kd_foods_villi_bad_cap'))}</div>
        </div>
      </div>
      <p class="kd-foods-villi__note">${escHTML(ui('kd_foods_villi_note'))}<cite>${escHTML(ui('kd_foods_villi_cite'))}</cite></p>
    </section>

    <div class="kd-ep-seclabel">${escHTML(ui('kd_foods_words_label'))}</div>
    ${facetSections(thesis)}
  </div>`;
}
