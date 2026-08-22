/**
 * views/knowledge-home.ts — the Knowledge drawer's Home tab
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The landing tab — the drawer's front door, on REAL data: a hero (headline + live
 * corpus counts + a live-suggest search + curated hint chips) over three browse
 * shelves — the essentials, common conditions, and an Explore topic preview.
 *
 * PURE PROJECTION (§00.B single-source): holds no canonical value as a literal.
 * Counts derive from state accessors; every visible string comes from the contained
 * view-copy store via ui() — never inline prose, never fixture data. Entity NAMES
 * are data (escaped), not prose.
 *
 * The live-suggest searches essentials, conditions and Explore topics — all three have
 * pages that navigate. Charged entities are never surfaced here (see homeMatches).
 * Results/hints emit the drawer's live data-kd-* nav contract and bubble to the
 * container-delegated handlers in knowledge.ts.
 *
 * Layer: views/ — reads state/ + core/, never writes localStorage.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { plural } from '../core/format.js';
import { ui } from '../state/copy.js';
import { conditionDisplayName, getEssentialBySlug, listBooks, listConditions } from '../state/corpus.js';
import { essentialCount, essentialGlyph } from '../state/coverage.js';
import { type ConditionSummary, type EssentialSummary, listConditionPages, listEssentialPages } from '../state/entity-page.js';
import { listFoods } from '../state/foods.js';
import { homeExploreTopics } from '../state/home-curation.js';
import { entityList, getEntity, isChargedEntity } from '../state/search.js';
import { productSuggestItems } from './knowledge-products.js';

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
 * The curated hint chips — Home is a hand-tuned surface, so this is a hand-picked set
 * rather than a formula. Each chip must resolve to a page that navigates; hintChip
 * renders nothing for a slug that does not resolve.
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

// ─── "The essentials" shelf ───────────────────────────────────

// The 4 category families in legend order; the tile + swatch colour
// is driven by data-cat via CSS (no colour literal in TS).
const LEGEND_CATS = ['mineral', 'vitamin', 'amino_acid', 'fatty_acid'] as const;

/** One essential tile: category-coloured edge, compact glyph, friendly name, claim count. */
function shelfTile(e: EssentialSummary): string {
  const layoutKey = getEssentialBySlug(e.slug)?.layout_key ?? e.slug;
  const glyph = essentialGlyph(layoutKey) || e.name.slice(0, 2);
  return `<button class="sh-tile" data-cat="${escHTML(e.category)}" data-kd-essential="${escHTML(layoutKey)}" title="${escHTML(e.name)}"><span class="sh-tile__sym">${escHTML(glyph)}</span><span class="sh-tile__nm">${escHTML(e.name)}</span><span class="sh-tile__ct">${e.distinct_claim_count} ${plural(e.distinct_claim_count, 'claim')}</span></button>`;
}

/**
 * The Home "The essentials" shelf — the top-18 essentials by claim count (pure
 * formula, most-to-least), the tile grid, and the category colour legend. A tile
 * opens the essential's page via the drawer's
 * data-kd-essential contract.
 */
function renderEssentialsShelf(): string {
  const top = listEssentialPages().slice().sort((a, b) => b.distinct_claim_count - a.distinct_claim_count).slice(0, 18);
  const legend = LEGEND_CATS.map(cat =>
    `<span class="ep-legend__item"><span class="ep-legend__sw" data-cat="${cat}"></span>${escHTML(ui(`kh_legend_${cat}`))}</span>`).join('');
  return `<div class="ep-seclabel ep-seclabel--tight">${escHTML(ui('kh_essentials_label'))} <span class="ep-seclabel__hint">${escHTML(ui('kh_essentials_hint'))}</span><a data-kd-tab="essentials">${escHTML(ui('kh_essentials_link'))}</a></div>
    <div class="sh-grid">${top.map(shelfTile).join('')}</div>
    <div class="ep-legend"><span class="ep-legend__lbl">${escHTML(ui('kh_legend_label'))}</span>${legend}</div>`;
}

// ─── "Common conditions" shelf ────────────────────────────

/** One condition row: friendly name + "N claims · M nutrients"; opens the condition's page. */
function condRow(c: ConditionSummary): string {
  return `<button class="sh-condrow" type="button" data-kd-condition="${escHTML(c.slug)}"><span class="sh-condrow__nm">${escHTML(c.name)}</span><span class="sh-condrow__ct">${c.claim_count} ${plural(c.claim_count, 'claim')} · ${c.nutrient_count} ${plural(c.nutrient_count, 'nutrient')}</span></button>`;
}

/**
 * The Home "Common conditions" shelf — the top-8 conditions by claim count (pure
 * formula, most-to-least), the condition-row grid. A row opens the condition's
 * page via the drawer's data-kd-condition
 * contract; the section link jumps to the full Conditions tab.
 */
function renderConditionsShelf(): string {
  const conds = listConditionPages();
  const top = conds.slice().sort((a, b) => b.claim_count - a.claim_count).slice(0, 8);
  const link = ui('kh_conditions_link').replace('{n}', fmt(conds.length));
  return `<div class="ep-seclabel">${escHTML(ui('kh_conditions_label'))} <span class="ep-seclabel__hint">${escHTML(ui('kh_conditions_hint'))}</span><a data-kd-tab="conditions">${escHTML(link)}</a></div>
    <div class="sh-condgrid">${top.map(condRow).join('')}</div>`;
}

// ─── "Explore" preview shelf ─────────────────────────

/** One Explore chip → opens that topic's page on the Explore tab (data-kd-topic; knowledge.ts). */
function exploreChip(e: { slug: string; display_name: string }): string {
  return `<button class="kd-explore-chip" type="button" data-kd-topic="${escHTML(e.slug)}">${escHTML(e.display_name)}</button>`;
}

/**
 * The Home "Explore" preview — the curated topic-chip cloud (Home is the SPECIAL
 * curated surface). The selection is a hand-pick in home-curation.json (currently 14
 * topic/concept entities), rendered
 * A-Z by name; a chip opens that topic's faceted page on the Explore tab, and the header
 * link jumps to the full Explore index. Empty curation renders nothing (graceful).
 */
function renderExploreShelf(): string {
  const topics = homeExploreTopics();
  if (topics.length === 0) {
    return '';
  }
  return `<div class="ep-seclabel">${escHTML(ui('kh_explore_label'))} <span class="ep-seclabel__hint">${escHTML(ui('kh_explore_hint'))}</span><a data-kd-tab="explore">${escHTML(ui('kh_explore_link'))}</a></div>
    <div class="kd-explore-cloud">${topics.map(exploreChip).join('')}</div>`;
}

/** The Home landing tab — hero + the essentials shelf + the conditions shelf + the Explore preview. */
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
          <div class="sh-search__field">${SEARCH_SVG}<input class="kh-search" type="text" maxlength="120" placeholder="${escHTML(ui('kh_hero_placeholder'))}" autocomplete="off"></div>
          <div class="sh-search__results"></div>
        </div>
        <div class="sh-hero__hints">${hints}</div>
      </div>
    </section>
    ${renderEssentialsShelf()}
    ${renderConditionsShelf()}
    ${renderExploreShelf()}
  </div>`;
}

// ─── Live-suggest ───────────────────────────────────────────────────────────

type HomeKind = 'essential' | 'condition' | 'topic' | 'product' | 'food';

interface HomeMatch {
  kind: HomeKind;
  name: string;
  navAttr: string;
  navVal: string;
  claimCount: number;
  /**
   * What the row says on its right, where an essential says "N claims". A product and a
   * food have no claims to count — the corpus is about NUTRIENTS, not about SKUs — so they
   * carry their own readout rather than printing a zero that would read as "nothing has
   * been written about this".
   */
  meta?: string;
  startsWith: boolean;
}

/** Substring match over essentials, conditions and Explore topics (name, synonym, or spaced slug). */
function homeMatches(query: string): HomeMatch[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return [];
  }
  const spaced = (s: string): string => s.replace(/[-_]/g, ' ');
  const out: HomeMatch[] = [];
  // Slugs already surfaced as an essential/condition, so an entity that is BOTH (e.g. potassium is
  // a registry element AND a canon essential) is not listed twice — the essential row wins.
  const taken = new Set<string>();
  for (const e of listEssentialPages()) {
    const nm = e.name.toLowerCase();
    const sci = e.scientific_name.toLowerCase();
    if (nm.includes(q) || sci.includes(q) || spaced(e.slug).includes(q)) {
      const c = getEssentialBySlug(e.slug);
      if (c === null) {
        continue;
      }
      taken.add(e.slug);
      out.push({ kind: 'essential', name: e.name, navAttr: 'data-kd-essential', navVal: c.layout_key, claimCount: e.distinct_claim_count, startsWith: nm.startsWith(q) });
    }
  }
  for (const cnd of listConditionPages()) {
    const nm = cnd.name.toLowerCase();
    if (nm.includes(q) || spaced(cnd.slug).includes(q)) {
      taken.add(cnd.slug);
      out.push({ kind: 'condition', name: cnd.name, navAttr: 'data-kd-condition', navVal: cnd.slug, claimCount: cnd.claim_count, startsWith: nm.startsWith(q) });
    }
  }
  // Explore TOPICS — the search-registry entities that are NOT essentials/conditions (those have
  // their own pages, handled above). Without this branch, typing any Explore topic (e.g.
  // 'testosterone') matched nothing at all. Nav via data-kd-topic — the same contract the Explore
  // chips use — so a hit opens the topic overlay. Charged entities (homosexuality/intersex) are
  // never surfaced in live-suggest (they stay browsable only on the Explore tab) — the same
  // never-ambush rule the main search gate enforces.
  // ── the vault + the food catalog ────────────────────────────────────────────
  // Both are NAME matches only. Their tab already carries a keyword search over label
  // ingredients and nutrients; repeating that here would flood a ten-row panel with every
  // product that happens to contain the thing you typed.
  const suppliedMeta = (n: number): string =>
    (n > 0
      ? ui('kh_meta_supplied').replace('{n}', String(n)).replace('{of}', String(essentialCount()))
      : ui('kh_meta_targeted'));
  for (const p of productSuggestItems()) {
    const nm = p.name.toLowerCase();
    if (nm.includes(q)) {
      out.push({
        kind: 'product',
        name: p.name,
        navAttr: 'data-kd-product',
        navVal: p.id,
        claimCount: 0,
        meta: suppliedMeta(p.supplied),
        startsWith: nm.startsWith(q),
      });
    }
  }
  for (const f of listFoods()) {
    const nm = f.name.toLowerCase();
    // The CATEGORY matches too, so "legume" and "shellfish" answer with the foods in them
    // — the word a person is most likely to reach for that is not a food's own name.
    if (nm.includes(q) || f.category.toLowerCase().includes(q)) {
      out.push({
        kind: 'food',
        name: f.name,
        navAttr: 'data-kd-food',
        navVal: f.id,
        claimCount: 0,
        meta: `${f.portion_label} · ${f.category}`,
        startsWith: nm.startsWith(q),
      });
    }
  }
  for (const t of entityList()) {
    if (t.type === 'nutrient' || t.type === 'condition' || taken.has(t.slug) || isChargedEntity(t.slug)) {
      continue;
    }
    const nm = t.display_name.toLowerCase();
    const full = getEntity(t.slug);
    const synHit = full !== null && full.synonyms.some(s => s.toLowerCase().includes(q));
    if (nm.includes(q) || spaced(t.slug).includes(q) || synHit) {
      out.push({ kind: 'topic', name: t.display_name, navAttr: 'data-kd-topic', navVal: t.slug, claimCount: t.claim_count, startsWith: nm.startsWith(q) });
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
  const meta = m.meta ?? `${m.claimCount} claim${m.claimCount === 1 ? '' : 's'}`;
  return `<button class="sh-res${active ? ' active' : ''}" type="button" ${m.navAttr}="${escHTML(m.navVal)}"><span class="sh-res__dot"></span><span class="sh-res__nm">${escHTML(m.name)}</span><span class="sh-res__meta">${escHTML(meta)}</span></button>`;
}

/** How many rows the panel shows, and the fewest any matching KIND may be cut to. */
const SHOWN_MAX = 10;
const GROUP_FLOOR = 2;

/**
 * Fill the panel in group order without letting an early group starve a later one.
 *
 * ★ WHY NOT A FLAT slice(0, 10). Five kinds now compete for ten rows, and a plain cap taken
 * in group order means a query like "vitamin" — which matches a dozen essentials — pushes
 * every product and food off a panel they legitimately answered. Every group that matched
 * anything keeps at least GROUP_FLOOR rows; the slack goes to the earlier groups, which is
 * what keeps essentials leading.
 */
function pickShown(groups: readonly HomeMatch[][]): HomeMatch[] {
  const out: HomeMatch[] = [];
  for (let i = 0; i < groups.length; i += 1) {
    const g = groups[i] ?? [];
    if (g.length === 0) {
      continue;
    }
    const laterNonEmpty = groups.slice(i + 1).filter(x => x.length > 0).length;
    const room = SHOWN_MAX - out.length - (laterNonEmpty * GROUP_FLOOR);
    out.push(...g.slice(0, Math.min(g.length, Math.max(GROUP_FLOOR, room))));
  }
  return out.slice(0, SHOWN_MAX);
}

/**
 * The live-suggest dropdown body for a query — grouped (Essentials, then Conditions,
 * then Explore topics), best-match-first, capped at 10, the first row pre-highlighted.
 * Called by the drawer's delegated input/keydown handlers (knowledge.ts).
 */
export function renderHomeSuggestions(query: string): string {
  const matches = homeMatches(query);
  if (matches.length === 0) {
    return `<div class="sh-res__empty">${escHTML(ui('kh_search_empty'))}</div>`;
  }
  const shown = pickShown([
    matches.filter(m => m.kind === 'essential').sort(byRelevance),
    matches.filter(m => m.kind === 'condition').sort(byRelevance),
    matches.filter(m => m.kind === 'topic').sort(byRelevance),
    matches.filter(m => m.kind === 'product').sort(byRelevance),
    matches.filter(m => m.kind === 'food').sort(byRelevance),
  ]);
  let html = '';
  let idx = 0;
  const group = (label: string, kind: HomeKind): void => {
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
  group(ui('kh_group_topics'), 'topic');
  group(ui('kh_group_products'), 'product');
  group(ui('kh_group_foods'), 'food');
  return html;
}
