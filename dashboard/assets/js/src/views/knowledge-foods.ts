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
 * paper -- and the design-system primitives from the retired trace-mineral-tile-
 * detail mockup (the corner SCAN·NNN / WALLACH-CORP lockup, .ds-pull-stat, mono readouts,
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
import { type FoodCard, foodsConditional, foodsEat, foodsEnzymeClaims, foodsRemove, foodsSec04Quote, foodsThesisClaims, foodsVilliQuote } from '../state/foods-curation.js';
import { renderSearchCard } from './entity-page.js';
import { getProduct } from './knowledge-products.js';

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
  return escHTML(raw).replace(/\bvilli\b/gi, m =>
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
const DOT_X = [0.05, 0.22, 0.39, 0.55, 0.72, 0.9]; // shared fractional x (both panels)
const DOT_JY = [-4, 3, -2, 4, -3, 2]; // shared per-dot y jitter

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
 * Coerce the schema's AmountLike (number | string) to a number, or null. Product composition
 * amounts + serving counts are typed number|string at the Zod boundary; coerce before any math.
 */
function num(x: number | string | null | undefined): number | null {
  if (typeof x === 'number') {
    return Number.isFinite(x) ? x : null;
  }
  if (typeof x === 'string') {
    const n = Number.parseFloat(x);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Escape `raw`, THEN wrap the first occurrence of `sub` (also escaped) in the author-controlled
 * open/close markup. XSS-safe: the injected tags are constants and every text run is escaped once
 * (the same escape-then-inject pattern as withVilliGloss). Empty/absent `sub` -> escaped `raw`.
 */
function emphasize(raw: string, sub: string, open: string, close: string): string {
  const e = escHTML(raw);
  if (sub.length === 0) {
    return e;
  }
  const s = escHTML(sub);
  const i = e.indexOf(s);
  if (i < 0) {
    return e;
  }
  return `${e.slice(0, i)}${open}${s}${close}${e.slice(i + s.length)}`;
}

// The pH ladder plots three sealed Wallach values -- WAL-CLM-DDDL-000134: "the pH of secretions and
// excretions ... range from 1.0 in stomach acid to 8.2 in pancreatic juice" plus the blood band
// 7.36-7.44 from the same claim. Positions are pure geometry (pH -> y on a 0..14 scale); the numbers
// and labels are prose from the content store. Decorative chrome -- no user data, stable render.
const PH_H = 500;
const PH_PAD = 12;
function phY(ph: number): number {
  return (PH_H - PH_PAD) - (ph / 14) * (PH_H - 2 * PH_PAD);
}

/**
 * The pH-ladder figure (inner HTML of .sxb-scale): axis ticks, the acid->alkaline gradient track,
 * the defended blood band, and the two Wallach anchor cards (stomach 1.0 / pancreatic 8.2).
 */
function phLadder(): string {
  let out = '';
  for (let t = 0; t <= 14; t += 2) {
    out += `<span class="sxb-axis__t" style="top:${phY(t).toFixed(1)}px">${t}</span>`;
  }
  out += `<span class="sxb-cap" style="top:${phY(13.3).toFixed(1)}px">${escHTML(ui('kd_foods_sec04_ladder_alk'))}</span>`;
  out += `<span class="sxb-cap" style="top:${phY(0.7).toFixed(1)}px">${escHTML(ui('kd_foods_sec04_ladder_acid'))}</span>`;
  out += '<div class="sxb-track"></div>';
  out += `<div class="sxb-band" style="top:${phY(7.4).toFixed(1)}px"></div>`;
  out += `<div class="sxb-bandlbl" style="top:${phY(7.4).toFixed(1)}px">${escHTML(ui('kd_foods_sec04_ladder_blood'))}<small>${escHTML(ui('kd_foods_sec04_ladder_blood_s'))}</small></div>`;
  out += `<div class="sxb-dot" style="top:${phY(8.2).toFixed(1)}px;background:#5a8ca8"></div>`;
  out += `<div class="sxb-card sxb-card--panc" style="top:${phY(10.2).toFixed(1)}px"><div class="sxb-card__ph">${escHTML(ui('kd_foods_sec04_ladder_panc_ph'))}</div><div class="sxb-card__nm">${escHTML(ui('kd_foods_sec04_ladder_panc_nm'))}</div><div class="sxb-card__d">${escHTML(ui('kd_foods_sec04_ladder_panc_d'))}</div></div>`;
  out += `<div class="sxb-dot" style="top:${phY(1.0).toFixed(1)}px;background:#ff6420"></div>`;
  out += `<div class="sxb-card sxb-card--stomach" style="top:${phY(2.0).toFixed(1)}px"><div class="sxb-card__ph">${escHTML(ui('kd_foods_sec04_ladder_stom_ph'))}</div><div class="sxb-card__nm">${escHTML(ui('kd_foods_sec04_ladder_stom_nm'))}</div><div class="sxb-card__d">${escHTML(ui('kd_foods_sec04_ladder_stom_d'))}</div></div>`;
  return out;
}

// Fortress cutaway coordinates -- all arrays <= 10 elements (under the inline-data gate), fixed (no
// Math.random) so the render is stable for the probe. Colours are baked hex: var() does not resolve
// in SVG presentation attributes. aria-hidden: this is a decorative teaching figure, not data.
const FRT_FOOD_X = [95, 140, 185, 225];
const FRT_INVADERS = [[96, 138], [120, 120], [150, 132], [182, 116], [210, 134], [135, 150], [172, 148]];
const FRT_BUBBLES = [[110, 64, 7], [150, 50, 9], [196, 66, 6], [168, 80, 5]];

/**
 * One fortress cutaway: the stomach body over the gut wall + bloodstream. 'ok' (full acid) = food
 * dissolved into particles crossing the wall, a sterile seal, no invaders. 'bad' (acid fallen) =
 * invaders climbing up, fermentation bubbles, an unbroken food lump that never crosses. The gauge
 * is the ladder; this is peering inside. Decorative (aria-hidden); built as a string like villiArt.
 */
function fortressFig(state: 'ok' | 'bad'): string {
  const W = 300;
  const H = 190;
  const wallY = 150;
  const body = '<path d="M40 30 Q150 6 262 34 Q276 78 236 128 Q210 168 150 176 Q90 168 66 128 Q28 82 40 30 Z" fill="#ffffff" stroke="#d8b48c" stroke-width="2"/>';
  const blood = `<rect x="14" y="${wallY + 6}" width="${W - 28}" height="26" rx="5" fill="#e7eef2" stroke="#cddbe2" stroke-width="1"/><text x="${W - 20}" y="${wallY + 22}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="8" letter-spacing="1" fill="#7a8f9a">BLOOD</text>`;
  let g = '';
  if (state === 'ok') {
    g += '<path d="M52 58 Q150 40 250 60 Q262 96 230 128 Q206 160 150 166 Q94 160 72 128 Q44 96 52 58 Z" fill="rgba(255,126,60,.20)"/>';
    for (let i = 0; i < FRT_FOOD_X.length; i += 1) {
      const x = FRT_FOOD_X[i]!;
      const yo = 96 + (i % 2 ? 8 : -6);
      g += `<circle cx="${x}" cy="${yo}" r="5" fill="#e39a4e" opacity=".85"/>`;
      g += `<circle cx="${x - 4}" cy="${wallY + 16}" r="3.4" fill="#5a8ca8"/>`;
      g += `<circle cx="${x + 7}" cy="${wallY + 24}" r="2.6" fill="#5a8ca8" opacity=".8"/>`;
      g += `<line x1="${x}" y1="${112 + (i % 2 ? 8 : -6)}" x2="${x - 2}" y2="${wallY - 2}" stroke="#c8552a" stroke-width="1" opacity=".35"/>`;
    }
    g += '<circle cx="70" cy="52" r="12" fill="none" stroke="#c8552a" stroke-width="1.4" opacity=".8"/>';
    g += '<text x="70" y="55" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="7" font-weight="700" fill="#c8552a">STER</text>';
  }
  else {
    g += '<path d="M62 118 Q150 106 238 118 Q214 156 150 164 Q92 158 62 118 Z" fill="rgba(255,126,60,.14)"/>';
    for (const p of FRT_INVADERS) {
      g += `<g transform="translate(${p[0]},${p[1]})"><circle r="4.5" fill="#8a2f2f"/><line x1="-6" y1="0" x2="6" y2="0" stroke="#8a2f2f" stroke-width="1.4"/><line x1="0" y1="-6" x2="0" y2="6" stroke="#8a2f2f" stroke-width="1.4"/></g>`;
    }
    for (const b of FRT_BUBBLES) {
      g += `<circle cx="${b[0]}" cy="${b[1]}" r="${b[2]}" fill="none" stroke="#9b8e7c" stroke-width="1.4"/>`;
    }
    g += '<rect x="126" y="96" width="48" height="30" rx="10" fill="#c9a05a" stroke="#a07d3a" stroke-width="1.5"/>';
    g += '<text x="150" y="115" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="7" fill="#5c4a26">UNBROKEN</text>';
  }
  const wall = `<line x1="30" y1="${wallY}" x2="${W - 30}" y2="${wallY}" stroke="#d8b48c" stroke-width="2" stroke-dasharray="5 4"/>`;
  return `<svg style="width:100%;height:auto;display:block" viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true">${body}${wall}${blood}${g}</svg>`;
}

// The five Ultimate Enzymes tiles. `comp` names match the product's component rows (nutrients or the
// pancreatin blend) so each amount is read LIVE from the Product DB, never hand-typed (R1 / S00.A:
// Youngevity composition originates in the pillar). Editorial stage/name/blurb come from the content
// store; `prov` marks the dot -- 'w' Wallach-backed, 'p' a plant enzyme. Array of 5 (inline-data ok).
const ENZ_TILES: { comp: string[]; nm: string; stage: string; blurb: string; prov: 'w' | 'p' }[] = [
  { comp: ['Betaine Hydrochloride'], nm: 'kd_foods_sec04_enz1_nm', stage: 'kd_foods_sec04_enz1_stage', blurb: 'kd_foods_sec04_enz1_blurb', prov: 'w' },
  { comp: ['Pepsin'], nm: 'kd_foods_sec04_enz2_nm', stage: 'kd_foods_sec04_enz2_stage', blurb: 'kd_foods_sec04_enz2_blurb', prov: 'w' },
  { comp: ['Pancreatin 11X'], nm: 'kd_foods_sec04_enz3_nm', stage: 'kd_foods_sec04_enz3_stage', blurb: 'kd_foods_sec04_enz3_blurb', prov: 'w' },
  { comp: ['Papain', 'Bromelain'], nm: 'kd_foods_sec04_enz4_nm', stage: 'kd_foods_sec04_enz4_stage', blurb: 'kd_foods_sec04_enz4_blurb', prov: 'p' },
  { comp: ['Ox Bile'], nm: 'kd_foods_sec04_enz5_nm', stage: 'kd_foods_sec04_enz5_stage', blurb: 'kd_foods_sec04_enz5_blurb', prov: 'w' },
];

/**
 * The Ultimate Enzymes coverage strip: five tiles whose per-serving amounts are read LIVE from the
 * Youngevity Product DB (betaine HCl / pepsin / pancreatin / papain+bromelain / ox bile).
 */
function enzStrip(): string {
  const comp = getProduct('ultimate-enzymes')?.components?.[0];
  const amountOf = (names: string[]): string => {
    if (comp === undefined) {
      return '';
    }
    let total = 0;
    let unit = 'mg';
    let found = false;
    for (const name of names) {
      const n = comp.nutrients?.find(x => x.name === name);
      const na = n !== undefined ? num(n.amount) : null;
      if (na !== null) {
        total += na;
        unit = n?.unit ?? unit;
        found = true;
        continue;
      }
      const b = comp.blends?.find(x => x.name === name);
      const ba = (b !== undefined && b.total !== undefined && b.total !== null) ? num(b.total.amount) : null;
      if (ba !== null) {
        total += ba;
        unit = b?.total?.unit ?? unit;
        found = true;
      }
    }
    return found ? `${Math.round(total * 10) / 10} ${unit}` : '';
  };
  return ENZ_TILES.map((t) => {
    const amt = amountOf(t.comp);
    const provLabel = t.prov === 'p' ? ui('kd_foods_sec04_prov_p') : ui('kd_foods_sec04_prov_w');
    const dot = `<span class="ue-dot ue-dot--${t.prov}"></span> ${escHTML(provLabel)}`;
    return `<div class="ue-tile"><div class="ue-tile__stage">${escHTML(ui(t.stage))}</div><div class="ue-tile__c">${escHTML(ui(t.nm))}</div><div class="ue-tile__amt">${escHTML(amt)}</div><div class="ue-tile__d">${escHTML(ui(t.blurb))}</div><div class="ue-tile__prov">${dot}</div></div>`;
  }).join('');
}

/**
 * The Ultimate Enzymes CTA bar -> opens the product's detail page through the shared Knowledge
 * product route (data-kd-product, handled in knowledge.ts). Price is DERIVED live from the product
 * DB (wholesale / servings), never hand-typed; the per-day figure assumes Wallach's t.i.d. (one
 * capsule, three times a day). A missing price simply renders no number rather than a fabricated one.
 */
function ctaBar(): string {
  const prod = getProduct('ultimate-enzymes');
  const comp = prod?.components?.[0];
  const spc = num(comp?.servings_per_container ?? null);
  const whole = num(prod?.price?.wholesale ?? null);
  const perServe = (whole !== null && spc !== null && spc > 0) ? whole / spc : null;
  const perServeStr = perServe !== null ? `$${perServe.toFixed(2)}` : '';
  const perDayStr = perServe !== null ? `$${(perServe * 3).toFixed(2)}` : '';
  const capsStr = spc !== null ? String(spc) : '';
  const foot = `Wholesale &middot; ${escHTML(capsStr)} capsules &middot; &asymp; ${escHTML(perDayStr)} a day &middot; ${escHTML(ui('kd_foods_sec04_cta_foot_tail'))}`;
  return `<button class="ue-bar" type="button" data-kd-product="ultimate-enzymes">
        <span>
          <span class="ue-bar__nm">${escHTML(ui('kd_foods_sec04_cta_nm'))}</span>
          <span class="ue-bar__sub">${escHTML(ui('kd_foods_sec04_cta_sub'))}</span>
        </span>
        <span class="ue-bar__r">
          <span class="ue-bar__price"><span class="ue-bar__pn">${escHTML(perServeStr)}</span><span class="ue-bar__pl">${escHTML(ui('kd_foods_sec04_cta_price_l'))}</span></span>
          <span class="ue-bar__chev">&rsaquo;</span>
        </span>
      </button>
      <div class="ue-foot">${foot}</div>`;
}

/**
 * The section-04 pull-quote: a faithful CONTIGUOUS excerpt of WAL-CLM-DDDL-000132's sealed verbatim
 * (excerpt boundaries are pointers into the sealed text, never hand-typed) with "sterile" highlighted.
 * Reuses the .kd-foods-pq Playfair carve-out. '' if the claim/excerpt does not resolve.
 */
function sec04PullQuote(): string {
  const q = foodsSec04Quote();
  if (q === null) {
    return '';
  }
  const text = collapseWS(q.claim.verbatim);
  const i0 = text.indexOf(q.excerptFrom);
  const i1 = text.indexOf(q.excerptTo);
  const excerpt = (i0 >= 0 && i1 >= 0) ? text.slice(i0, i1 + q.excerptTo.length) : text;
  const body = emphasize(excerpt, q.mark, '<mark class="ds-mark">', '</mark>');
  return `<div class="ds-pull-quote-wrap kd-foods-pq sxbeat">
      <blockquote class="ds-pull-quote">
        <p>${body}</p>
        <footer>&mdash; ${escHTML(ui('kd_foods_sec04_pq_cite'))}</footer>
      </blockquote>
    </div>`;
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

    <section class="kd-foods-enz">
      ${sectionHeader('04', ui('kd_foods_sec04_kicker'), `<h2 class="ds-h-section">${escHTML(ui('kd_foods_sec04_hd'))}</h2>`, '')}
      <p class="sx-p">${emphasize(ui('kd_foods_sec04_lead'), 'pH 1.0', '<strong>', '</strong>')}</p>

      <div class="sxb-wrap">
        <div class="sxb-scale">${phLadder()}</div>
        <div class="sxb-side">
          <div class="ds-kicker" style="margin-bottom:12px">${escHTML(ui('kd_foods_sec04_ladder_kicker'))}</div>
          <div class="sxb-triad">
            <div class="sxb-triad__i"><span class="sxb-triad__n">01</span><span class="sxb-triad__t"><b>${escHTML(ui('kd_foods_sec04_ladder_t1_b'))}</b> ${escHTML(ui('kd_foods_sec04_ladder_t1'))}</span></div>
            <div class="sxb-triad__i"><span class="sxb-triad__n">02</span><span class="sxb-triad__t"><b>${escHTML(ui('kd_foods_sec04_ladder_t2_b'))}</b> ${escHTML(ui('kd_foods_sec04_ladder_t2'))}</span></div>
            <div class="sxb-triad__i"><span class="sxb-triad__n">03</span><span class="sxb-triad__t"><b>${escHTML(ui('kd_foods_sec04_ladder_t3_b'))}</b> ${escHTML(ui('kd_foods_sec04_ladder_t3'))}</span></div>
          </div>
          <p class="sx-note">${escHTML(ui('kd_foods_sec04_ladder_note'))}</p>
          <div class="sx-cite">${escHTML(ui('kd_foods_sec04_ladder_cite'))}</div>
        </div>
      </div>

      <div class="sxbeat">
        <div class="ds-kicker" style="margin-bottom:12px">${escHTML(ui('kd_foods_sec04_frt_kicker'))}</div>
        <p class="sx-p">${emphasize(ui('kd_foods_sec04_frt_lede'), 'pH 1.0', '<strong>', '</strong>')}</p>
        <div class="frt-scene">
          <div class="frt-cell frt-cell--ok">
            <div class="frt-cell__hd"><span class="frt-cell__k">${escHTML(ui('kd_foods_sec04_frt_ok_k'))}</span><span class="frt-cell__ph">${escHTML(ui('kd_foods_sec04_frt_ok_ph'))}</span></div>
            <div class="frt-cell__t">${escHTML(ui('kd_foods_sec04_frt_ok_t'))}</div>
            ${fortressFig('ok')}
            <p class="frt-cap">${escHTML(ui('kd_foods_sec04_frt_ok_cap'))}</p>
          </div>
          <div class="frt-cell frt-cell--bad">
            <div class="frt-cell__hd"><span class="frt-cell__k">${escHTML(ui('kd_foods_sec04_frt_bad_k'))}</span><span class="frt-cell__ph">${escHTML(ui('kd_foods_sec04_frt_bad_ph'))}</span></div>
            <div class="frt-cell__t">${escHTML(ui('kd_foods_sec04_frt_bad_t'))}</div>
            ${fortressFig('bad')}
            <p class="frt-cap">${escHTML(ui('kd_foods_sec04_frt_bad_cap'))}</p>
          </div>
        </div>
        <div class="frt-legend">
          <span class="frt-legend__i"><span class="frt-legend__sw" style="background:var(--ds-accent)"></span> ${escHTML(ui('kd_foods_sec04_frt_leg_moat'))}</span>
          <span class="frt-legend__i"><span class="frt-legend__sw" style="background:var(--sev-calm)"></span> ${escHTML(ui('kd_foods_sec04_frt_leg_nutrient'))}</span>
          <span class="frt-legend__i"><span class="frt-legend__sw" style="background:var(--sev-crit)"></span> ${escHTML(ui('kd_foods_sec04_frt_leg_invader'))}</span>
          <span class="frt-legend__i"><span class="frt-legend__sw" style="border:1px solid var(--ds-ink-faint);background:transparent"></span> ${escHTML(ui('kd_foods_sec04_frt_leg_gas'))}</span>
        </div>
      </div>

      <div class="sxbeat">
        <div class="sx-callout">
          <div class="sx-callout__k">${escHTML(ui('kd_foods_sec04_inv_k'))}</div>
          <div class="sx-callout__t">${emphasize(ui('kd_foods_sec04_inv_t'), ui('kd_foods_sec04_inv_t_em'), '<em>', '</em>')}</div>
          <p class="sx-callout__b">${emphasize(ui('kd_foods_sec04_inv_b'), ui('kd_foods_sec04_inv_b_mark'), '<mark class="ds-mark rose">', '</mark>')}</p>
        </div>
      </div>

      <div class="ds-pull-stat sxbeat">
        <span class="ds-pull-stat__readout">${escHTML(ui('kd_foods_sec04_stat_readout'))}</span>
        <div class="ds-pull-stat__num">${escHTML(ui('kd_foods_sec04_stat_num'))}</div>
        <div class="ds-pull-stat__body">${escHTML(ui('kd_foods_sec04_stat_body'))}<small>${escHTML(ui('kd_foods_sec04_stat_small'))}</small></div>
      </div>

      ${sec04PullQuote()}

      <section class="sxbeat">
        <div class="ds-kicker" style="margin-bottom:10px">${escHTML(ui('kd_foods_sec04_cta_kicker'))}</div>
        <h3 style="font-family:var(--ds-font-display);font-size:2rem;font-weight:800;line-height:1.4;letter-spacing:-.01em;color:var(--ds-ink);margin:0 0 10px">${emphasize(ui('kd_foods_sec04_cta_h'), ui('kd_foods_sec04_cta_h_em'), '<em style="color:var(--ds-accent-deep);font-style:italic">', '</em>')}</h3>
        <p class="sx-p">${emphasize(ui('kd_foods_sec04_cta_p'), ui('kd_foods_sec04_cta_p_strong'), '<br><strong>', '</strong>')}</p>
        <div class="ue-strip">${enzStrip()}</div>
        <div class="ue-proof">
          <span class="ue-proof__q">&ldquo;</span>
          <div class="ue-proof__t">${emphasize(ui('kd_foods_sec04_proof'), ui('kd_foods_sec04_proof_bold'), '<b>', '</b>')}
            <span class="ue-proof__cite">${escHTML(ui('kd_foods_sec04_proof_cite'))}</span>
          </div>
        </div>
        ${ctaBar()}
      </section>

      <div class="sxr-wrap">
        <div class="sxr-lead">${emphasize(ui('kd_foods_sec04_rec_lead'), ui('kd_foods_sec04_rec_lead_b'), '<b>', '</b>')}</div>
        <h3 class="sxr-h">${escHTML(ui('kd_foods_sec04_rec_h'))}</h3>
        <p class="sxr-sub">${escHTML(ui('kd_foods_sec04_rec_sub'))}</p>
        ${facetSections([...foodsThesisClaims(), ...foodsEnzymeClaims()])}
      </div>
    </section>
  </div>`;
}
