/**
 * views/knowledge-home.ts — the Knowledge drawer's Home tab (Phase H2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The landing tab — the drawer's front door. A pristine re-creation of the
 * signed-off demo's Home vision on REAL data: a hero (headline + live corpus
 * counts + a live-suggest search + curated hint chips); the three browse shelves
 * (essentials · conditions · explore) arrive in later chunks.
 *
 * PURE PROJECTION (§00.B single-source / R1): holds no canonical value as a
 * literal. Counts derive from state accessors; every visible string comes from
 * the contained view-copy store via ui() (R4) — never inline prose, never the
 * demo's fixture data. Entity NAMES are data (escaped), not prose.
 *
 * Chunk 2 wires the HERO. The live-suggest searches essentials + conditions
 * (both have entity pages that navigate today); topics join once their pages
 * exist. Results/hints emit the drawer's live data-kd-* nav contract and bubble
 * to the container-delegated handlers in knowledge.ts.
 *
 * Layer: views/ — reads state/ + core/, never writes localStorage.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { plural } from '../core/format.js';
import { ui } from '../state/copy.js';
import { conditionDisplayName, getEssentialBySlug, listBooks, listConditions } from '../state/corpus.js';
import { essentialGlyph } from '../state/coverage.js';
import { type ConditionSummary, type EssentialSummary, listConditionPages, listEssentialPages } from '../state/entity-page.js';

// The char class uses hex escapes \x22 \x27 for " and ' rather than the literal
// quotes: the clean-view prose scanner (views_no_inline_prose) has no regex parser,
// so a bare " inside a regex reads to it as a string start and swallows the map below.
function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>\x22\x27]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

/** en-US grouped integer (1259 → "1,259"); pinned locale keeps the offline render deterministic. */
function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

/** The magnifier glyph — a static inline SVG (no text, no data). */
const SEARCH_SVG = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';

/**
 * The curated placeholder hint chips (Home is a hand-tuned surface — Luneth
 * 2026-07-11). A small NAVIGABLE set for now (essentials + conditions have
 * pages); the eventual vision is the top-5 topics by entry-count, landing once
 * topic pages exist.
 */
const HINTS: ReadonlyArray<{ kind: 'essential' | 'condition'; slug: string }> = [
  { kind: 'essential', slug: 'calcium' },
  { kind: 'condition', slug: 'arthritis' },
  { kind: 'essential', slug: 'vitamin-d' },
  { kind: 'condition', slug: 'depression' },
];

/** One hint chip → its entity page via the drawer's live data-kd-* contract. */
function hintChip(h: { kind: 'essential' | 'condition'; slug: string }): string {
  if (h.kind === 'essential') {
    const e = getEssentialBySlug(h.slug);
    if (e === null) {
      return '';
    }
    return `<button class="sh-hint" type="button" data-kd-essential="${escHTML(e.layout_key)}">${escHTML(e.common_name)}</button>`;
  }
  return `<button class="sh-hint" type="button" data-kd-condition="${escHTML(h.slug)}">${escHTML(conditionDisplayName(h.slug))}</button>`;
}

// ─── "The essentials" shelf (Chunk 3) ──────────────────────────

// The 4 category families in the demo's legend order; the tile + swatch colour
// is driven by data-cat via CSS (no colour literal in TS).
const LEGEND_CATS = ['mineral', 'vitamin', 'amino_acid', 'fatty_acid'] as const;

/** One essential tile: category-coloured edge, compact glyph, friendly name, claim count. */
function shelfTile(e: EssentialSummary): string {
  const layoutKey = getEssentialBySlug(e.slug)?.layout_key ?? e.slug;
  const glyph = essentialGlyph(layoutKey) || e.name.slice(0, 2);
  return `<button class="sh-tile" data-cat="${escHTML(e.category)}" data-kd-essential="${escHTML(layoutKey)}" title="${escHTML(e.name)}"><span class="sh-tile__sym">${escHTML(glyph)}</span><span class="sh-tile__nm">${escHTML(e.name)}</span><span class="sh-tile__ct">${e.claim_count} ${plural(e.claim_count, 'claim')}</span></button>`;
}

/**
 * The Home "The essentials" shelf — the top-18 essentials by claim count (pure
 * formula, most-to-least, per the Home-page philosophy), the demo's tile grid, and
 * the category colour legend. A tile opens the essential's page via the drawer's
 * data-kd-essential contract.
 */
function renderEssentialsShelf(): string {
  const top = listEssentialPages().slice().sort((a, b) => b.claim_count - a.claim_count).slice(0, 18);
  const legend = LEGEND_CATS.map(cat =>
    `<span class="ep-legend__item"><span class="ep-legend__sw" data-cat="${cat}"></span>${escHTML(ui(`kh_legend_${cat}`))}</span>`).join('');
  return `<div class="ep-seclabel ep-seclabel--tight">${escHTML(ui('kh_essentials_label'))} <span class="ep-seclabel__hint">${escHTML(ui('kh_essentials_hint'))}</span><a data-kd-tab="essentials">${escHTML(ui('kh_essentials_link'))}</a></div>
    <div class="sh-grid">${top.map(shelfTile).join('')}</div>
    <div class="ep-legend"><span class="ep-legend__lbl">${escHTML(ui('kh_legend_label'))}</span>${legend}</div>`;
}

// ─── "Common conditions" shelf (Chunk 4) ───────────────────────

/** One condition row: friendly name + "N claims · M nutrients"; opens the condition's page. */
function condRow(c: ConditionSummary): string {
  return `<button class="sh-condrow" type="button" data-kd-condition="${escHTML(c.slug)}"><span class="sh-condrow__nm">${escHTML(c.name)}</span><span class="sh-condrow__ct">${c.claim_count} ${plural(c.claim_count, 'claim')} · ${c.nutrient_count} ${plural(c.nutrient_count, 'nutrient')}</span></button>`;
}

/**
 * The Home "Common conditions" shelf — the top-8 conditions by claim count (pure
 * formula, most-to-least, per the Home-page philosophy), the demo's condition-row
 * grid. A row opens the condition's page via the drawer's data-kd-condition
 * contract; the section link jumps to the full Conditions tab.
 */
function renderConditionsShelf(): string {
  const conds = listConditionPages();
  const top = conds.slice().sort((a, b) => b.claim_count - a.claim_count).slice(0, 8);
  const link = ui('kh_conditions_link').replace('{n}', fmt(conds.length));
  return `<div class="ep-seclabel">${escHTML(ui('kh_conditions_label'))} <span class="ep-seclabel__hint">${escHTML(ui('kh_conditions_hint'))}</span><a data-kd-tab="conditions">${escHTML(link)}</a></div>
    <div class="sh-condgrid">${top.map(condRow).join('')}</div>`;
}

/** The Home landing tab — hero (Chunk 2) + "The essentials" shelf (Chunk 3) + "Common conditions" (Chunk 4). */
export function renderHomeTab(): string {
  const claims = listBooks().reduce((sum, b) => sum + (b.claim_count ?? 0), 0);
  const sub = ui('kh_hero_sub')
    .replace('{claims}', fmt(claims))
    .replace('{books}', fmt(listBooks().length))
    .replace('{conditions}', fmt(listConditions().length));
  const hints = HINTS.map(hintChip).join('');
  return `<div class="kd-home">
    <section class="sh-hero">
      <h1>${escHTML(ui('kh_hero_headline'))}</h1>
      <p>${escHTML(sub).replace('{br}', '<br>')}</p>
      <div class="sh-hero__search">
        <div class="sh-search">
          <div class="sh-search__field">${SEARCH_SVG}<input class="kh-search" type="text" placeholder="${escHTML(ui('kh_hero_placeholder'))}" autocomplete="off"></div>
          <div class="sh-search__results"></div>
        </div>
        <div class="sh-hero__hints">${hints}</div>
      </div>
    </section>
    ${renderEssentialsShelf()}
    ${renderConditionsShelf()}
  </div>`;
}

// ─── Live-suggest ───────────────────────────────────────────────────────────

interface HomeMatch {
  kind: 'essential' | 'condition';
  name: string;
  navAttr: string;
  navVal: string;
  claimCount: number;
  startsWith: boolean;
}

/** Substring match over essentials + conditions (name OR spaced slug) — demo semantics. */
function homeMatches(query: string): HomeMatch[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return [];
  }
  const spaced = (s: string): string => s.replace(/[-_]/g, ' ');
  const out: HomeMatch[] = [];
  for (const e of listEssentialPages()) {
    const nm = e.name.toLowerCase();
    const sci = e.scientific_name.toLowerCase();
    if (nm.includes(q) || sci.includes(q) || spaced(e.slug).includes(q)) {
      const c = getEssentialBySlug(e.slug);
      if (c === null) {
        continue;
      }
      out.push({ kind: 'essential', name: e.name, navAttr: 'data-kd-essential', navVal: c.layout_key, claimCount: e.claim_count, startsWith: nm.startsWith(q) });
    }
  }
  for (const cnd of listConditionPages()) {
    const nm = cnd.name.toLowerCase();
    if (nm.includes(q) || spaced(cnd.slug).includes(q)) {
      out.push({ kind: 'condition', name: cnd.name, navAttr: 'data-kd-condition', navVal: cnd.slug, claimCount: cnd.claim_count, startsWith: nm.startsWith(q) });
    }
  }
  return out;
}

/** startsWith matches first, then alphabetical — the "best match on top" order. */
function byRelevance(a: HomeMatch, b: HomeMatch): number {
  if (a.startsWith !== b.startsWith) {
    return a.startsWith ? -1 : 1;
  }
  return a.name.localeCompare(b.name);
}

/** One suggestion row — the nav attr doubles as the dot-colour key (CSS-driven, no colour literal). */
function resRow(m: HomeMatch, active: boolean): string {
  return `<button class="sh-res${active ? ' active' : ''}" type="button" ${m.navAttr}="${escHTML(m.navVal)}"><span class="sh-res__dot"></span><span class="sh-res__nm">${escHTML(m.name)}</span><span class="sh-res__meta">${m.claimCount} claim${m.claimCount === 1 ? '' : 's'}</span></button>`;
}

/**
 * The live-suggest dropdown body for a query — grouped (Essentials, then
 * Conditions), best-match-first, capped at 10, the first row pre-highlighted.
 * Called by the drawer's delegated input/keydown handlers (knowledge.ts).
 */
export function renderHomeSuggestions(query: string): string {
  const matches = homeMatches(query);
  if (matches.length === 0) {
    return `<div class="sh-res__empty">${escHTML(ui('kh_search_empty'))}</div>`;
  }
  const shown = [
    ...matches.filter(m => m.kind === 'essential').sort(byRelevance),
    ...matches.filter(m => m.kind === 'condition').sort(byRelevance),
  ].slice(0, 10);
  let html = '';
  let idx = 0;
  const group = (label: string, kind: 'essential' | 'condition'): void => {
    const rows = shown.filter(m => m.kind === kind);
    if (rows.length === 0) {
      return;
    }
    html += `<div class="sh-res__group">${escHTML(label)}</div>`;
    for (const m of rows) {
      html += resRow(m, idx === 0);
      idx += 1;
    }
  };
  group(ui('kh_group_essentials'), 'essential');
  group(ui('kh_group_conditions'), 'condition');
  return html;
}
