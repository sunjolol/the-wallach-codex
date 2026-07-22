/**
 * views/knowledge-foods.ts -- the Knowledge drawer's Absorption ("second prong") tab
 * ===========================================================================
 *
 * A curated, PERSUASIVE landing for Wallach's diet / absorption teaching -- the half of
 * his model that says the 90 essential nutrients only work if the gut can absorb them.
 * Designed to feel special and pull the reader in (Luneth 2026-07-13): an editorial hero
 * whose corner type-lockup is a THREE-COLOUR artistic effect (dark scan-id + blue
 * THE FIRST STEP tag + bright-orange subject, calibrated to the "Empower" alien-tech
 * reference), a .ds-pull-stat kill-shot (the 115M prevalence beat), an illustrated villi
 * "scan" (damaged left, healthy right -- ROUNDED finger-shaped bars on a faint tech-grid,
 * organically jittered heights, and nutrient dots x-matched across both panels so the eye
 * reads the difference side-to-side), then a REMOVE <-> EAT good/bad-foods contrast, then
 * the sealed crown-jewel claims "in his own words". The three-colour scan motif anchors the
 * hero corner lockup; the body then breaks into demo-style numbered chapters (01 hero / 02
 * villi / 03 contrast) so the whole tab reads as one instrument, not just the top. Restraint
 * governs the TONE (persuade through Wallach's own evidence, never nag).
 *
 * Reference for the visual language: the "Empower" calibration anchor (design-wisdom/
 * references/futuristic-tech-reference-empower-by-niteangel-depthcore.md) -- orange as a
 * SIGNAL accent, tech precision + surreal-eloquent composition grafted onto warm cream
 * paper -- and the design-system primitives in dashboard/components/trace-mineral-tile-
 * detail.html (the corner SCAN·NNN / WALLACH-CORP lockup, .ds-pull-stat, mono readouts,
 * the accent-notch rule). Translated to clean code -- NOT copied.
 *
 * PURE PROJECTION (R1): no canonical value or per-topic literal. Thesis claims + food cards
 * come from the curation config (state/foods-curation.ts) resolved against the search index;
 * each food's "why" is a sealed claim's answer (never hand-authored). Prose is contained (R4):
 * framing strings come from view-copy via ui()/the facet label; Wallach's words are data
 * (escaped). The villi figure is a decorative SVG (deterministic jitter -- no Math.random, so
 * the render is stable for the probe). "villi" is the one glossary term (reuses the shared
 * .gloss hover-box wiring). Food cards route via data-kd-topic.
 *
 * Layer: views/ -- reads state/ + a sibling view's card renderer, never localStorage.
 * ===========================================================================
 */

import { SEARCH_FACETS, type SearchClaim } from '../core/schemas/index.js';
import { facetLabel, ui } from '../state/copy.js';
import { type FoodCard, foodsConditional, foodsEat, foodsRemove, foodsThesisClaims, foodsVilliQuote } from '../state/foods-curation.js';
import { renderSearchCard } from './entity-page.js';

// Hex escapes \x22 \x27 for " and ' (the clean-view prose scanner has no regex parser;
// a bare quote inside the char class would read to it as a string -- see knowledge-topic.ts).
function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>\x22\x27]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

/**
 * Wrap whole-word "villi" in the shared .gloss hover-box term (document-delegated tooltip in
 * gloss-tooltip.ts) so the reader can learn what villi are on hover/tap. Escapes the raw copy
 * FIRST, then injects the author-controlled span around the (special-char-free) word -- safe
 * because the injected markup is a constant and the definition is escaped once. .kd-foods-term
 * gives it Luneth's louder treatment (bold, bright-orange, solid underline).
 */
function withVilliGloss(raw: string): string {
  const def = escHTML(ui('kd_foods_villi_gloss'));
  return escHTML(raw).replace(/\b(villi)\b/gi, m =>
    `<span class="gloss kd-foods-term" tabindex="0" role="button" aria-label="${m}: ${def}" data-def="${def}">${m}</span>`);
}

/**
 * A demo-style numbered SECTION HEADER (breaks the tab into digestible chapters): a big orange
 * display number, then the heading (with a dash-accented .ds-kicker when `kicker` is non-empty).
 * The heading markup is passed in so the hero keeps its Playfair headline while sections use .ds-h-section.
 */
function sectionHeader(num: string, kicker: string, headingHTML: string, extra: string): string {
  const kickerHTML = kicker.length > 0 ? `<div class="ds-kicker">${escHTML(kicker)}</div>` : '';
  return `<header class="kd-foods-sec${extra}">
      <span class="kd-foods-sec__num">${escHTML(num)}</span>
      <div class="kd-foods-sec__body">
        ${kickerHTML}
        ${headingHTML}
      </div>
    </header>`;
}

/**
 * Group a curated cross-subject claim list into facet sections (canonical SEARCH_FACETS
 * order), rendered with the SAME markup a topic page uses -- so the crown jewels read as
 * one system with the rest of Knowledge (basics -> teal, protocol -> green).
 */
function facetSections(claims: SearchClaim[]): string {
  // Absorption one-off (Luneth 2026-07-22): lead with "What to do" (protocol) — the gluten-free
  // corrective is the most useful thing on this tab, so it sits above Basics; the rest stay canonical.
  const order = ['protocol', ...SEARCH_FACETS.filter(f => f !== 'protocol')];
  return order.map((facet) => {
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

// Deterministic "organic" jitter -- villi are a living tissue, so the bars breathe and the
// nutrient dots scatter. Fixed (not Math.random) so the render is stable + the two panels
// stay comparable. All arrays <= 10 elements (under the inline-data gate).
const BAR_JIT = [1.0, 0.82, 1.13, 0.9, 1.06, 0.78, 1.15, 0.87, 0.98]; // per-villus height x
const DOT_X = [0.05, 0.22, 0.39, 0.55, 0.72, 0.9];                     // shared fractional x (both panels)
const DOT_JY = [-4, 3, -2, 4, -3, 2];                                  // shared per-dot y jitter

/**
 * The villi "scan" figure. Healthy = tall dense ROUNDED fingers (large surface area, nutrients
 * nestled low among them); damaged = short blunted stubs (nutrients drift high above,
 * unabsorbed). Bar heights carry a deterministic organic jitter (living tissue). The nutrient
 * dots share the SAME x columns + jitter pattern across both panels -- only the baseline Y
 * differs -- so damaged-vs-healthy reads at a glance side-to-side. A faint tech-grid + baseline
 * ticks fill the negative space; dots pulse (staggered). Decorative (aria-hidden); colours come
 * from CSS classes (var() does not resolve in SVG presentation attributes).
 */
function villiArt(healthy: boolean): string {
  const W = 220;
  const baseY = 108;
  const marginX = 16;
  const n = 9;
  const usable = W - marginX * 2;
  const barW = 12;
  const gap = (usable - barW) / (n - 1);
  const domeR = barW / 2;
  const baseH = healthy ? 72 : 15;
  let grid = '';
  for (let x = marginX; x <= W - marginX; x += 22) {
    grid += `<line class="kd-foods-villi__gridline" x1="${x}" y1="20" x2="${x}" y2="${baseY}" />`;
  }
  for (let y = 20; y < baseY; y += 22) {
    grid += `<line class="kd-foods-villi__gridline" x1="${marginX}" y1="${y}" x2="${W - marginX}" y2="${y}" />`;
  }
  // Each villus: straight sides rising from the wall to a rounded (semicircular) tip.
  let vs = '';
  for (let i = 0; i < n; i += 1) {
    const x = marginX + i * gap;
    const h = baseH * BAR_JIT[i]!;
    const topStraight = baseY - h + domeR;
    vs += `<path class="kd-foods-villi__v" d="M${x.toFixed(1)} ${baseY} L${x.toFixed(1)} ${topStraight.toFixed(1)} A${domeR} ${domeR} 0 0 1 ${(x + barW).toFixed(1)} ${topStraight.toFixed(1)} L${(x + barW).toFixed(1)} ${baseY} Z" />`;
  }
  const wall = `<line class="kd-foods-villi__wall" x1="${marginX}" y1="${baseY}" x2="${W - marginX}" y2="${baseY}" />`;
  let ticks = '';
  for (let x = marginX; x <= W - marginX; x += 11) {
    ticks += `<line class="kd-foods-villi__tick" x1="${x}" y1="${baseY}" x2="${x}" y2="${baseY + 4}" />`;
  }
  const dotBaseY = 64; // grid centre (20..108): both panels align so the comparison reads clean
  let dots = '';
  for (let i = 0; i < DOT_X.length; i += 1) {
    const cx = (marginX + DOT_X[i]! * usable).toFixed(1);
    const cy = (dotBaseY + DOT_JY[i]!).toFixed(1);
    dots += `<circle class="kd-foods-villi__dot" cx="${cx}" cy="${cy}" r="4.5" style="animation-delay:${(i * 0.25).toFixed(2)}s" />`;
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
      <div class="kd-foods-villi__cap">${withVilliGloss(cap)}</div>
    </div>`;
}

/** Collapse a verbatim's hard line-wraps + trim (book text wraps at the source margin). */
function collapseWS(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Repair the one OCR artifact in EPIGEN-000158's sealed verbatim for DISPLAY: an opening curly
 * quote (U+201C) closed by a straight quote. Normalise the trailing straight double-quote to a
 * right curly quote so the pull-quote reads clean. Words are untouched (byte-faithful) -- only the
 * mismatched quote GLYPH is fixed. FIXME: purify this at the source in the next corpus reseal.
 */
function fixQuoteGlyph(s: string): string {
  return s.replace(/"(\s*)$/, '”$1');
}

/**
 * The featured pull-quote under the villi scan: a REAL sealed Wallach verbatim (EPIGEN-000158,
 * corpus-sourced -> synced, R1) in the design-system .ds-pull-quote (giant orange quote glyph +
 * textured highlighter). The page + citation come from the claim (never hand-typed); the highlight
 * runs from the config phrase to the end (the gluten -> "contact enteritis" mechanism). '' if unresolved.
 */
function villiPullQuote(): string {
  const q = foodsVilliQuote();
  if (q === null) {
    return '';
  }
  const text = fixQuoteGlyph(collapseWS(q.claim.verbatim));
  const idx = text.indexOf(q.highlightFrom);
  const body = idx >= 0
    ? `${escHTML(text.slice(0, idx))}<mark class="ds-mark">${escHTML(text.slice(idx))}</mark>`
    : escHTML(text);
  const page = q.claim.page !== null ? `Page · ${q.claim.page}` : '';
  return `<div class="ds-pull-quote-wrap kd-foods-pq">
      <blockquote class="ds-pull-quote">
        ${page.length > 0 ? `<span class="kd-foods-pq__page">${escHTML(page)}</span>` : ''}
        <p>${body}</p>
        <footer>${escHTML(ui('kd_foods_villi_cite'))}</footer>
      </blockquote>
    </div>`;
}

/** One good/bad-food card -> opens that food's topic page (shared data-kd-topic contract). */
function foodItem(c: FoodCard, kind: string): string {
  return `<button class="kd-foods-item kd-foods-item--${escHTML(kind)}" type="button" data-kd-topic="${escHTML(c.slug)}">
      <span class="kd-foods-item__nm">${escHTML(c.name)}</span>
      <span class="kd-foods-item__why">${escHTML(c.why)}</span>
      <span class="kd-foods-item__go" aria-hidden="true">&rarr;</span>
    </button>`;
}

/**
 * The Absorption landing: editorial hero -> the .ds-pull-stat prevalence kill-shot -> the
 * villi "scan" (damaged left, healthy right) -> the REMOVE <-> EAT good/bad-foods contrast
 * (+ the "form, not the food" strip) -> the three sealed crown-jewel claims "in his own words".
 */
export function renderFoodsTab(): string {
  const remove = foodsRemove();
  const eat = foodsEat();
  const conditional = foodsConditional();
  return `<div class="kt-page kd-ep kd-foods">
    <header class="kd-foods-hero">
      <div class="kd-foods-eyebrow">
        <span class="kd-foods-eyebrow__l">${escHTML(ui('kd_foods_eyebrow_l'))}</span>
        <span class="kd-foods-eyebrow__rule"></span>
        <span class="kd-foods-eyebrow__r">${escHTML(ui('kd_foods_eyebrow_r'))}</span>
      </div>
      <div class="kd-foods-corner">
        <div class="kd-foods-brand">${escHTML(ui('kd_foods_readout_2'))}</div>
        <div class="kd-foods-scan">${escHTML(ui('kd_foods_scan'))}</div>
      </div>
      ${sectionHeader('01', '', `<h1 class="kd-foods-hero__h"><span class="l1">${escHTML(ui('kd_foods_hl1'))}</span><span class="l2">${escHTML(ui('kd_foods_hl2'))}</span></h1>`, ' kd-foods-sec--hero')}
      <p class="kd-foods-hero__deck">${escHTML(ui('kd_foods_deck'))}</p>
    </header>

    <div class="ds-pull-stat kd-foods-stat">
      <span class="ds-pull-stat__readout">${escHTML(ui('kd_foods_stat_readout'))}</span>
      <div class="ds-pull-stat__num">${escHTML(ui('kd_foods_stat_num'))}</div>
      <div class="ds-pull-stat__body">${escHTML(ui('kd_foods_stat_body'))}<small>${escHTML(ui('kd_foods_stat_small'))}</small></div>
    </div>

    <section class="kd-foods-villi">
      ${sectionHeader('02', ui('kd_foods_sec02_kicker'), `<h2 class="ds-h-section">${escHTML(ui('kd_foods_villi_title'))}</h2>`, '')}
      <p class="kd-foods-villi__intro">${withVilliGloss(ui('kd_foods_villi_explain'))}</p>
      <div class="kd-foods-villi__grid">
        ${villiPanel(false)}
        ${villiPanel(true)}
      </div>
      ${villiPullQuote()}
    </section>

    <section class="kd-foods-contrast">
      ${sectionHeader('03', ui('kd_foods_sec03_kicker'), `<h2 class="ds-h-section">${escHTML(ui('kd_foods_contrast_hd'))}</h2>`, '')}
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
