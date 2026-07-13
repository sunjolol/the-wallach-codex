/**
 * views/knowledge-foods.ts -- the Knowledge drawer's Absorption ("second prong") tab
 * ===========================================================================
 *
 * A curated, PERSUASIVE landing for Wallach's diet / absorption teaching -- the half of
 * his model that says the 90 essential nutrients only work if the gut can absorb them.
 * Designed to feel special and pull the reader in (Luneth 2026-07-13): an editorial hero
 * with alien-tech chrome (a pulsing corpus readout + an accent-notch eyebrow rule), a
 * .ds-pull-stat kill-shot (the 115M prevalence beat), an illustrated villi "scan" (damaged
 * left, healthy right -- thin square bars on a faint tech-grid, pulsing nutrient dots) that
 * shows WHY absorption fails, then a REMOVE <-> EAT good/bad-foods contrast (+ a "form, not
 * the food" strip), then the sealed crown-jewel claims "in his own words". Restraint governs
 * the TONE (persuade through Wallach's own evidence, never nag); the richness is visual.
 *
 * Reference for the visual language: dashboard/components/trace-mineral-tile-detail.html
 * (design-system.css primitives -- .ds-pull-stat / .ds-pulse / mono readouts / accent-notch
 * rules), translated to clean code -- NOT copied. The "L-corner crosshair" flourishes there
 * are deliberately omitted (Luneth: they read as messy).
 *
 * PURE PROJECTION (R1): no canonical value or per-topic literal. Thesis claims + food cards
 * come from the curation config (state/foods-curation.ts) resolved against the search index;
 * each food's "why" is a sealed claim's answer (never hand-authored). Prose is contained (R4):
 * framing strings come from view-copy via ui()/the facet label; Wallach's words are data
 * (escaped). The villi figure is a decorative SVG. Food cards route via data-kd-topic.
 *
 * Layer: views/ -- reads state/ + a sibling view's card renderer, never localStorage.
 * ===========================================================================
 */

import { SEARCH_FACETS, type SearchClaim } from '../core/schemas/index.js';
import { facetLabel, ui } from '../state/copy.js';
import { type FoodCard, foodsConditional, foodsEat, foodsRemove, foodsThesisClaims } from '../state/foods-curation.js';
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

/**
 * The villi "scan" figure: healthy = tall dense square bars (large surface area, nutrients
 * pulled in among them); damaged = short stubs (nutrients drift high above, unabsorbed). A
 * faint tech-grid + baseline ticks fill the negative space; nutrient dots pulse (staggered).
 * Decorative (aria-hidden); colours come from CSS classes (var() does not resolve in SVG
 * presentation attributes).
 */
function villiArt(healthy: boolean): string {
  const W = 220;
  const baseY = 108;
  const marginX = 16;
  const n = 9;
  const usable = W - marginX * 2;
  const barW = 12;
  const gap = (usable - barW) / (n - 1);
  const h = healthy ? 74 : 13;
  let grid = '';
  for (let x = marginX; x <= W - marginX; x += 22) {
    grid += `<line class="kd-foods-villi__gridline" x1="${x}" y1="20" x2="${x}" y2="${baseY}" />`;
  }
  for (let y = 20; y < baseY; y += 22) {
    grid += `<line class="kd-foods-villi__gridline" x1="${marginX}" y1="${y}" x2="${W - marginX}" y2="${y}" />`;
  }
  let vs = '';
  for (let i = 0; i < n; i += 1) {
    const x = (marginX + i * gap).toFixed(1);
    vs += `<rect class="kd-foods-villi__v" x="${x}" y="${baseY - h}" width="${barW}" height="${h}" />`;
  }
  const wall = `<line class="kd-foods-villi__wall" x1="${marginX}" y1="${baseY}" x2="${W - marginX}" y2="${baseY}" />`;
  let ticks = '';
  for (let x = marginX; x <= W - marginX; x += 11) {
    ticks += `<line class="kd-foods-villi__tick" x1="${x}" y1="${baseY}" x2="${x}" y2="${baseY + 4}" />`;
  }
  const dotY = healthy ? 64 : 28;
  let dots = '';
  for (let i = 0; i < 6; i += 1) {
    const cx = (30 + i * ((usable - 28) / 5)).toFixed(1);
    dots += `<circle class="kd-foods-villi__dot" cx="${cx}" cy="${dotY}" r="4.5" style="animation-delay:${(i * 0.25).toFixed(2)}s" />`;
  }
  return `<svg class="kd-foods-villi__art" viewBox="0 0 ${W} 132" role="img" aria-hidden="true">${grid}${vs}${wall}${ticks}${dots}</svg>`;
}

/** One healthy/damaged villi panel (title + metric readout + the scan figure + caption). */
function villiPanel(healthy: boolean): string {
  const kind = healthy ? 'ok' : 'bad';
  const title = healthy ? ui('kd_foods_villi_ok_title') : ui('kd_foods_villi_bad_title');
  const metric = healthy ? ui('kd_foods_villi_ok_metric') : ui('kd_foods_villi_bad_metric');
  const cap = healthy ? ui('kd_foods_villi_ok_cap') : ui('kd_foods_villi_bad_cap');
  return `<div class="kd-foods-villi__panel kd-foods-villi__panel--${kind}">
      <div class="kd-foods-villi__top">
        <div class="kd-foods-villi__t">${escHTML(title)}</div>
        <div class="kd-foods-villi__metric">${escHTML(metric)}</div>
      </div>
      ${villiArt(healthy)}
      <div class="kd-foods-villi__cap">${escHTML(cap)}</div>
    </div>`;
}

/** One good/bad-food card -> opens that food's topic page (shared data-kd-topic contract). */
function foodItem(c: FoodCard, kind: string): string {
  return `<button class="kd-foods-item kd-foods-item--${escHTML(kind)}" type="button" data-kd-topic="${escHTML(c.slug)}">
      <span class="kd-foods-item__nm">${escHTML(c.name)}</span>
      <span class="kd-foods-item__why">${escHTML(c.why)}</span>
      <span class="kd-foods-item__go" aria-hidden="true">→</span>
    </button>`;
}

/**
 * The Absorption landing: alien-tech hero -> the .ds-pull-stat prevalence kill-shot -> the
 * villi "scan" (damaged left, healthy right) -> the REMOVE <-> EAT good/bad-foods contrast
 * (+ the "form, not the food" strip) -> the three sealed crown-jewel claims "in his own words".
 */
export function renderFoodsTab(): string {
  const remove = foodsRemove();
  const eat = foodsEat();
  const conditional = foodsConditional();
  return `<div class="kt-page kd-ep kd-foods">
    <header class="kd-foods-hero">
      <div class="kd-foods-readout">
        <span><span class="ds-pulse tech live"></span>${escHTML(ui('kd_foods_readout_1'))}</span>
        <span>${escHTML(ui('kd_foods_readout_2'))}</span>
      </div>
      <div class="kd-foods-eyebrow">
        <span class="kd-foods-eyebrow__l">${escHTML(ui('kd_foods_eyebrow_l'))}</span>
        <span class="kd-foods-eyebrow__rule"></span>
      </div>
      <h1 class="kd-foods-hero__h"><span class="l1">${escHTML(ui('kd_foods_hl1'))}</span><span class="l2">${escHTML(ui('kd_foods_hl2'))}</span></h1>
      <p class="kd-foods-hero__deck">${escHTML(ui('kd_foods_deck'))}</p>
    </header>

    <div class="ds-pull-stat kd-foods-stat">
      <span class="ds-pull-stat__readout">${escHTML(ui('kd_foods_stat_readout'))}</span>
      <div class="ds-pull-stat__num">${escHTML(ui('kd_foods_stat_num'))}</div>
      <div class="ds-pull-stat__body">${escHTML(ui('kd_foods_stat_body'))}<small>${escHTML(ui('kd_foods_stat_small'))}</small></div>
    </div>

    <section class="kd-foods-villi">
      <h2 class="kd-foods-hd">${escHTML(ui('kd_foods_villi_title'))}</h2>
      <div class="kd-foods-villi__grid">
        ${villiPanel(false)}
        ${villiPanel(true)}
      </div>
      <p class="kd-foods-villi__note">${escHTML(ui('kd_foods_villi_note'))}<cite>${escHTML(ui('kd_foods_villi_cite'))}</cite></p>
    </section>

    <section class="kd-foods-contrast">
      <h2 class="kd-foods-hd">${escHTML(ui('kd_foods_contrast_hd'))}</h2>
      <div class="kd-foods-contrast__grid">
        <div class="kd-foods-col kd-foods-col--remove">
          <div class="kd-foods-col__hd">${escHTML(ui('kd_foods_col_remove'))}</div>
          ${remove.map(c => foodItem(c, 'remove')).join('')}
        </div>
        <div class="kd-foods-col kd-foods-col--eat">
          <div class="kd-foods-col__hd">${escHTML(ui('kd_foods_col_eat'))}</div>
          ${eat.map(c => foodItem(c, 'eat')).join('')}
        </div>
      </div>
      <div class="kd-foods-form">
        <div class="kd-foods-col__hd kd-foods-form__hd">${escHTML(ui('kd_foods_form_hd'))}</div>
        <div class="kd-foods-form__grid">
          ${conditional.map(c => foodItem(c, 'form')).join('')}
        </div>
      </div>
    </section>

    <div class="kd-ep-seclabel">${escHTML(ui('kd_foods_words_label'))}</div>
    ${facetSections(foodsThesisClaims())}
  </div>`;
}
