/**
 * views/knowledge.ts — Knowledge drawer (overlay)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Slide-in-from-left overlay drawer, 950px wide. Renders 5 tabs: Home /
 * Essentials / Conditions / Explore / Products.
 *
 * The Essentials tab is layout-driven: it walks the SAME presentation layout
 * the Coverage periodic table uses (coverage-layout-data.json) for symbols +
 * category grouping, and joins the AUTHORITATIVE per-essential status from the
 * CoverageSnapshot (state/coverage.ts) — one source of truth for "covered". A
 * tile click expands an in-place deep-dive: Wallach's stance (quote + citation,
 * §00.A educational layer) + the YGY vault products that carry the essential
 * (resolved via the canonical matchEssential — no matcher drift).
 *
 * §00 Zod boundary: data reads pass through schemas defined in
 * core/schemas/knowledge + core/schemas/coverage-layout before field access.
 *
 * Visual contract: drawer-knowledge-v3-PROPOSAL.html. Styling: drawer-shared.css
 * (chrome) + drawer-knowledge.css (kd-* content). Keyboard: rail "K" toggles;
 * Esc closes (handler in main.ts).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import coverageLayoutData from '../../../data/coverage-layout-data.json';
import { emit, on as onEvent } from '../core/events.js';
import { plural } from '../core/format.js';
import {
  CoverageLayoutSchema,
  type LayoutSection,
  type LayoutTile,
} from '../core/schemas/index.js';
import { conditionCategory } from '../state/condition-categories.js';
import { ui } from '../state/copy.js';
import {
  getCondition,
  getEssentialByLayoutKey,
  getEssentialBySlug,
  listConditions,
} from '../state/corpus.js';
import {
  type CoverageSnapshot,
  essentialGlyph,
  getOrCompute,
} from '../state/coverage.js';
import { listEssentialPages } from '../state/entity-page.js';
import { vaultEntry } from '../state/recommender.js';
import { applyRecordFilter, renderConditionPage, renderEssentialPage } from './entity-page.js';
import { renderConditionsTab } from './knowledge-corpus.js';
import { exploreEntities, renderExploreTab } from './knowledge-explore.js';
import { renderFoodsTab } from './knowledge-foods.js';
import { renderHomeSuggestions, renderHomeTab } from './knowledge-home.js';
import { renderOracTab } from './knowledge-orac.js';
import { productCount, productScrollTint, renderProductsTab } from './knowledge-products.js';
import { renderTopicPage } from './knowledge-topic.js';
import { clearSearchHighlights, highlightMatchesIn } from './search-highlight.js';

export interface DrawerHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Open the drawer directly at an entity's page — the Ask-Wallach "Learn More" entry point.
   *  condition/essential/product open a detail page; 'topic' opens the Explore topic overlay. */
  openEntity: (kind: 'essential' | 'condition' | 'product' | 'topic', slug: string) => void;
  isOpen: () => boolean;
}

type Tab = 'home' | 'foods' | 'orac' | 'essentials' | 'conditions' | 'explore' | 'products';

// ─── Essentials layout (shared with the Coverage periodic table) ───────────

const LAYOUT = CoverageLayoutSchema.parse(coverageLayoutData);

/** Category the sh-tile uses for its edge colour (data-cat, CSS-driven). */
function sectionCat(section: LayoutSection): 'mineral' | 'vitamin' | 'amino_acid' | 'fatty_acid' {
  switch (section.tileClass) {
    case 'tile--vitamin': return 'vitamin';
    case 'tile--amino': return 'amino_acid';
    case 'tile--fat': return 'fatty_acid';
    case 'tile': return 'mineral';
  }
}

function tileSymbol(t: LayoutTile): string {
  return t.sym ?? t.letter ?? t.abbr ?? t.code ?? t.name.charAt(0).toUpperCase();
}

/** One tile as the demo's sh-tile grid renders it (symbol + name + claim count + coverage dot). */
interface EssentialTile {
  /** Canonical name — join key into the CoverageSnapshot. */
  key: string;
  /** Display name (uppercase, from the layout). */
  name: string;
  /** Chemical symbol / vitamin letter / amino abbr. */
  symbol: string;
  /** Nutrient family — drives the sh-tile edge colour via data-cat (CSS). */
  category: 'mineral' | 'vitamin' | 'amino_acid' | 'fatty_acid';
  /** Sealed claim count, joined from the per-essential entity pages. */
  claimCount: number;
  /** False for the shown-not-counted non-essential (Omega-9). */
  essential: boolean;
}

/** One subsection = a demo sh-subhead + its sh-tile grid (the 6 the demo shows). */
interface EssentialSubsection {
  label: string;
  /** vitamins/aminos/fats use the wider tile grid (demo). */
  wide: boolean;
  items: EssentialTile[];
}

/** layout_key → friendly common_name + sealed claim count (the per-essential entity pages). */
interface EssMeta {
  name: string;
  claimCount: number;
}
const ESS_META: Map<string, EssMeta> = (() => {
  const m = new Map<string, EssMeta>();
  for (const e of listEssentialPages()) {
    const lk = getEssentialBySlug(e.slug)?.layout_key;
    if (lk !== undefined) {
      m.set(lk, { name: e.name, claimCount: e.distinct_claim_count });
    }
  }
  return m;
})();

/** Flatten the layout into the demo's 6 subsections (minerals split 3 ways + vitamins/aminos/fats). */
function buildSubsections(): EssentialSubsection[] {
  const out: EssentialSubsection[] = [];
  const toTile = (t: LayoutTile, cat: EssentialTile['category']): EssentialTile => {
    const meta = ESS_META.get(t.key);
    return {
      key: t.key,
      name: meta?.name ?? t.name,
      symbol: essentialGlyph(t.key) || tileSymbol(t),
      category: cat,
      claimCount: meta?.claimCount ?? 0,
      essential: t.essential !== false,
    };
  };
  for (const section of LAYOUT.sections) {
    const cat = sectionCat(section);
    const wide = cat !== 'mineral';
    if (section.subsections !== undefined) {
      for (const sub of section.subsections) {
        out.push({ label: sub.label, wide, items: sub.tiles.map(t => toTile(t, cat)) });
      }
    }
    else if (section.tiles !== undefined) {
      out.push({ label: section.title, wide, items: section.tiles.map(t => toTile(t, cat)) });
    }
  }
  return out;
}

const ESS_SUBSECTIONS = buildSubsections();
// The "90 ESSENTIAL" count that used to sit under this line was the Essentials TAB's subtitle.
// The tab left the menu on 2026-07-23 and nothing else read the constant, so it went with it
// rather than lingering as dead code. Coverage still owns and displays the count.

// ─── Render helpers ────────────────────────────────────────────────────────

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

// ── breadcrumb trail (ported from the signed-off demo; safeguards Luneth 2026-07-11) ──
// A BOUNDED, LOOP-FREE back-history, not an append-forever log:
//  (1) trail[0] is always the ORIGIN-tab anchor — an unbreakable fallback to exit the detail;
//  (2) re-visiting an entity already in the trail JUMPS BACK to it (openDetail/goCrumb truncate)
//      instead of appending — kills the Calcium <-> Osteoporosis back-and-forth that grew forever;
//  (3) capped at CRUMB_MAX (oldest recent crumb dropped, the anchor kept).
type EntityCrumbType = 'essential' | 'condition' | 'product';
interface Crumb {
  type: EntityCrumbType | 'tab';
  val: string;
  label: string;
}
const CRUMB_MAX = 6;
function crumbKey(c: Crumb): string {
  return `${c.type}:${c.val}`;
}
function capTrail(trail: Crumb[]): void {
  while (trail.length > CRUMB_MAX && trail.length > 2) {
    trail.splice(1, 1);
  }
}
function tabLabel(tab: Tab): string {
  return ui(`kd_tab_${tab}`) || tab.toUpperCase();
}
/** The display label for an entity crumb — resolved from state, never scraped from the clicked DOM. */
function crumbLabel(type: EntityCrumbType, val: string): string {
  if (type === 'essential') {
    return getEssentialByLayoutKey(val)?.common_name ?? val;
  }
  if (type === 'condition') {
    return getCondition(val)?.display_name ?? val;
  }
  return vaultEntry(val)?.name ?? val;
}
/** The breadcrumb rail at the top of the drawer body — shown only inside a detail (trail non-empty). */
function renderCrumbs(trail: Crumb[]): string {
  if (trail.length === 0) {
    return '';
  }
  const items = trail.map((c, i) => i === trail.length - 1
    ? `<span class="kd-crumb kd-crumb--here">${escHTML(c.label)}</span>`
    : `<button class="kd-crumb" type="button" data-kd-crumb="${i}">${escHTML(c.label)}</button>`,
  ).join('<span class="kd-crumb__sep" aria-hidden="true">\u203A</span>');
  return `<nav class="kd-crumbs" aria-label="Breadcrumb">${items}</nav>`;
}

// ─── Tab renderers ─────────────────────────────────────────────────────────

function renderEssentialDeep(key: string, snapshot: CoverageSnapshot | null): string {
  // The essential deep-view IS the data-driven entity page now (H2). Its lede + the short
  // "why this number" hover come from the user-approved entity-copy store inside
  // entity-page.ts; there is nothing to compute here.
  return renderEssentialPage(key, snapshot);
}

/** The demo's friendly sh-subhead wording (view-copy), keyed by the layout's own label. */
const SEC_LABEL_KEY: Record<string, string> = {
  'FOUNDATIONAL': 'kd_esssec_foundational',
  'INDIVIDUALLY DOSED': 'kd_esssec_dosed',
  'PLANT DERIVED': 'kd_esssec_plantderived',
  'VITAMINS': 'kd_esssec_vitamins',
  'AMINO ACIDS': 'kd_esssec_amino',
  'FATTY ACIDS': 'kd_esssec_fatty',
};

const ESSENTIAL_CAT_SCROLL: Record<string, string> = { mineral: '#2b6fb0', vitamin: '#ff7e3c', amino_acid: '#5aa82c', fatty_acid: '#8a52d6' };

function renderEssentialsTab(snapshot: CoverageSnapshot | null, selectedKey: string | null): string {
  const deepHTML = selectedKey !== null ? renderEssentialDeep(selectedKey, snapshot) : '';
  const groupsHTML = ESS_SUBSECTIONS.map((group) => {
    const tilesHTML = group.items.map((e) => {
      const sel = e.key === selectedKey ? ' is-selected' : '';
      return `<button type="button" class="sh-tile${sel}" data-cat="${escHTML(e.category)}" data-kd-essential="${escHTML(e.key)}" title="${escHTML(e.name)}"><span class="sh-tile__sym">${escHTML(e.symbol)}</span><span class="sh-tile__nm">${escHTML(e.name)}</span><span class="sh-tile__ct">${e.claimCount} ${escHTML(plural(e.claimCount, 'claim'))}</span></button>`;
    }).join('');
    const key = SEC_LABEL_KEY[group.label];
    const label = key !== undefined ? ui(key) : group.label;
    return `<div class="sh-subhead">${escHTML(label)}</div><div class="sh-grid${group.wide ? ' sh-grid--wide' : ''}">${tilesHTML}</div>`;
  }).join('');
  return `${deepHTML}${groupsHTML}`;
}

function renderTab(tab: Tab, snapshot: CoverageSnapshot | null, selectedKey: string | null, selectedCondition: string | null, selectedProduct: string | null, selectedTopic: string | null, fromProductsTab: boolean): string {
  // A selected topic is an OVERLAY page on top of whatever tab opened it: the topic renders
  // full-body while the origin tab stays active, so the back button (top-right) returns you there
  // — foods → the Absorption grid, explore → the all-topics grid. An unknown slug degrades to the
  // origin tab's own content. `tab === 'explore'` is the only "you're already in the topics index"
  // origin, so it alone gets the "All topics" back label; every other origin gets "Go back".
  if (selectedTopic !== null) {
    const page = renderTopicPage(selectedTopic, tab === 'explore');
    if (page.length > 0) {
      return page;
    }
  }
  switch (tab) {
    case 'home': return renderHomeTab();
    case 'foods': return renderFoodsTab();
    case 'orac': return renderOracTab();
    case 'essentials': return renderEssentialsTab(snapshot, selectedKey);
    case 'conditions': return (selectedCondition !== null ? renderConditionPage(selectedCondition) : '') + renderConditionsTab(selectedCondition);
    case 'explore': return renderExploreTab();
    case 'products': return renderProductsTab(selectedProduct, fromProductsTab);
  }
}

function renderShell(activeTab: Tab, selectedKey: string | null, selectedCondition: string | null, selectedProduct: string | null, selectedTopic: string | null, trail: Crumb[]): string {
  const snapshot = getOrCompute();
  const productsCount = productCount();
  // The 'essentials' TAB IS DELIBERATELY ABSENT FROM THIS LIST while remaining a live route
  // (Luneth 2026-07-23). It duplicated Coverage, which is where the user already starts, so the
  // menu item went and the surface stayed. It keeps exactly three doors: the Home tab's "open the
  // full table →", the breadcrumb trail, and the "‹ All essentials" button on an essential's own
  // page. Do NOT "restore" it here — its absence is the feature; renderTab still serves it.
  const tabs = [
    { id: 'home' as Tab, label: ui('kd_tab_home'), count: '' },
    { id: 'foods' as Tab, label: ui('kd_tab_foods'), count: '' },
    { id: 'orac' as Tab, label: ui('kd_tab_orac'), count: '' },
    { id: 'conditions' as Tab, label: ui('kd_tab_conditions'), count: `${listConditions().length} INDEXED` },
    { id: 'explore' as Tab, label: ui('kd_tab_explore'), count: `${exploreEntities().length} TOPICS` },
    { id: 'products' as Tab, label: ui('kd_tab_products'), count: `${productsCount} KNOWN` },
  ];
  const tabsHTML = tabs.map(t => `<button class="kd-knh__tab${t.id === activeTab ? ' active' : ''}" data-kd-tab="${t.id}">${escHTML(t.label)}</button>`).join('');
  // A product opened from a NON-products tab (e.g. the ORAC supplement list) gets an origin-aware
  // back button ("Go back" -> that tab); a normal Products-tab open keeps "All products".
  const fromProductsTab = trail.length === 0 || (trail[0]?.type === 'tab' && trail[0].val === 'products');

  return `
    <header class="kd-knh">
      <div class="kd-knh__mark"><span class="kd-knh__g">❡</span><b>${escHTML(ui('kd_mark'))}</b></div>
      <nav class="kd-knh__tabs">${tabsHTML}</nav>
      <div class="kd-knh__end"><button class="kd-knh__close" data-kd-action="close" title="Close (Esc)">×</button></div>
    </header>
    ${(activeTab === 'essentials' || activeTab === 'conditions' || activeTab === 'products' || activeTab === 'explore') && selectedTopic === null
      ? `<div class="kd-search">
      <span class="kd-search-icon">⌕</span>
      <input class="kd-search-input" type="text" placeholder="SEARCH ${activeTab.toUpperCase()}…" />
      <button class="kd-search-clear" data-kd-action="search-clear" type="button" aria-label="Clear search" title="Clear search">×</button>
      <span class="kd-search-kbd">/</span>
    </div>`
      : ''}
    <div class="kd-body">${renderCrumbs(trail)}${renderTab(activeTab, snapshot, selectedKey, selectedCondition, selectedProduct, selectedTopic, fromProductsTab)}</div>`;
}

// ─── Search (per-tab DOM filter) ──────────────────────────────

/**
 * Per active tab, the selector for the list items the search box filters. The
 * tabs render different item shapes (book rows / essential tiles / condition
 * rows / product rows / doctrine cards), so the query targets each by class.
 */
const KD_SEARCH_ITEM_SELECTOR: Record<Tab, string> = {
  home: '.kd-home',
  foods: '.kd-foods-topic',
  orac: '.kd-orac-claim',
  essentials: '.sh-tile',
  conditions: '.kd-condition-row',
  explore: '.kd-explore-chip',
  products: '.kd-product-row',
};

/**
 * Where each tab's item keeps its TITLE. The blob in `data-search` deliberately makes a row match on
 * content, which is what buries an exact title hit — searching "acne" matched every condition whose
 * claims mention acne and ranked them by claim count, so the Acne row itself sat far down the page
 * (Luneth 2026-07-23). Ranking needs the title alone, so it is read from here. `null` = the item's
 * own textContent IS the title (an Explore chip is just its label).
 */
const KD_TITLE_SELECTOR: Record<Tab, string | null> = {
  home: null,
  foods: null,
  orac: null,
  essentials: '.sh-tile__nm',
  conditions: '.kd-condition-row__name',
  explore: null,
  products: '.kd-product-row__name',
};

/** Rows currently lifted into the Best-match block, with where to put each one back. */
interface HoistedRow { node: HTMLElement; parent: Node; next: Node | null; }
let kdHoisted: HoistedRow[] = [];

/**
 * Return every hoisted row to exactly where it came from. Restores in REVERSE hoist order so a run
 * of adjacent siblings lands back in its original sequence (each row's recorded `next` is still a
 * valid sibling because only hoisted rows ever moved).
 */
function restoreHoisted(): void {
  for (const h of [...kdHoisted].reverse()) {
    h.parent.insertBefore(h.node, h.next);
  }
  kdHoisted = [];
}

/** Max rows pinned at the top — 1 exact + up to 11 more (Luneth 2026-07-23). */
const BEST_MATCH_MAX = 12;

/**
 * Lift the rows whose TITLE matches the query to a pinned block at the top of the body, most-exact
 * first. Returns the number lifted.
 *
 * Matching is AND-over-terms on the title, which is what makes multi-word queries narrow instead of
 * widen: "cancer" pins Cancer + Breast/Colon/… , while "breast cancer" pins only Breast Cancer,
 * because no other title carries both terms. Rank 0 = the title IS the query (this slot is reserved
 * so the perfect match can never be outranked), 1 = title starts with it, 2 = merely contains it;
 * ties break on the shorter title, so "Cancer" precedes "Cancer, Breast". Hoisted rows are MOVED,
 * not cloned — they vanish from their section below, so nothing renders twice and the delegated
 * click handlers keep working because the nodes themselves are preserved.
 */
function applyBestMatch(body: HTMLElement, tab: Tab, query: string): number {
  const sel = KD_SEARCH_ITEM_SELECTOR[tab];
  const titleSel = KD_TITLE_SELECTOR[tab];
  const terms = query.split(/\s+/).filter(t => t.length > 0);
  if (terms.length === 0) {
    return 0;
  }
  const scored: { node: HTMLElement; rank: number; len: number }[] = [];
  body.querySelectorAll<HTMLElement>(`${sel}:not(.kd-hidden)`).forEach((node) => {
    const el = titleSel !== null ? node.querySelector(titleSel) : node;
    const title = (el?.textContent ?? '').trim().toLowerCase();
    if (title.length === 0 || !terms.every(t => title.includes(t))) {
      return;
    }
    const rank = title === query ? 0 : title.startsWith(query) ? 1 : 2;
    scored.push({ node, rank, len: title.length });
  });
  if (scored.length === 0) {
    return 0;
  }
  scored.sort((a, b) => (a.rank - b.rank) || (a.len - b.len));
  const take = scored.slice(0, BEST_MATCH_MAX);

  let block = body.querySelector<HTMLElement>('.kd-bestmatch');
  if (block === null) {
    block = document.createElement('div');
    block.className = 'kd-bestmatch';
    body.insertBefore(block, body.firstChild);
  }
  block.textContent = '';
  const label = document.createElement('div');
  label.className = 'kd-bestmatch__label';
  label.textContent = ui('kd_best_match');
  block.appendChild(label);
  const rows = document.createElement('div');
  rows.className = 'kd-bestmatch__rows';
  block.appendChild(rows);
  for (const s of take) {
    kdHoisted.push({ node: s.node, parent: s.node.parentNode as Node, next: s.node.nextSibling });
    rows.appendChild(s.node);
  }
  return take.length;
}

/**
 * Filter the active tab's rendered rows in-place against a query string.
 *
 * DOM-filter (toggle `.kd-hidden`) rather than re-render so an open deep-dive
 * and the scroll position survive each keystroke. Match = case-insensitive
 * substring over each item's visible textContent. A section head hides when
 * every item beneath it (up to the next head) is filtered out; the cornerstone
 * intro block hides while a query is active so only matches remain. A
 * "no matches" line is injected when nothing survives. Returns the visible count.
 */
function applyKnowledgeSearch(body: HTMLElement, tab: Tab, rawQuery: string): number {
  const query = rawQuery.trim().toLowerCase();
  const active = query.length > 0;
  const selector = KD_SEARCH_ITEM_SELECTOR[tab];

  // Cornerstone/intro blocks are noise during an active search.
  body.querySelectorAll<HTMLElement>('.kd-featured-citation').forEach((intro) => {
    intro.classList.toggle('kd-hidden', active);
  });

  // Any rows pinned by the PREVIOUS keystroke go home first, so every pass starts from the
  // canonical document order and ranking never compounds on itself.
  restoreHoisted();
  const oldBlock = body.querySelector('.kd-bestmatch');
  if (oldBlock !== null) {
    oldBlock.remove();
  }

  // Pass 1 — mark each item hidden or not. Match visible text OR the row's hidden `data-search`
  // keyword blob (condition rows carry synonyms/symptoms/claim text, Explore chips carry synonyms/
  // topics/claim questions, so content queries like "smell" -> Anosmia work; rows without the attr
  // fall back to textContent only).
  let visible = 0;
  body.querySelectorAll<HTMLElement>(selector).forEach((node) => {
    const hay = `${node.textContent ?? ''} ${node.dataset['search'] ?? ''}`;
    const match = !active || hay.toLowerCase().includes(query);
    node.classList.toggle('kd-hidden', !match);
    if (match) {
      visible += 1;
    }
  });

  // Pass 2 — lift the title matches to the top, BEFORE the head pass, so a section whose every
  // row got hoisted correctly reports itself empty instead of showing a head over nothing.
  if (active) {
    applyBestMatch(body, tab, query);
  }

  // Pass 3 — heads walked in document order (querySelectorAll flattens the essentials grid
  // wrapper) so each head reflects only the items that remain beneath it.
  let head: HTMLElement | null = null;
  let headHasMatch = false;
  const commitHead = (): void => {
    if (head !== null) {
      head.classList.toggle('kd-hidden', active && !headHasMatch);
    }
  };
  body.querySelectorAll<HTMLElement>(`.kd-section-head, .sh-subhead, ${selector}`).forEach((node) => {
    if (node.classList.contains('kd-section-head') || node.classList.contains('sh-subhead')) {
      commitHead();
      head = node;
      headHasMatch = false;
      return;
    }
    if (!node.classList.contains('kd-hidden')) {
      headHasMatch = true;
    }
  });
  commitHead();

  // "No matches" affordance — injected/removed, never a re-render.
  let empty = body.querySelector<HTMLElement>('.kd-search-empty');
  if (active && visible === 0) {
    if (empty === null) {
      empty = document.createElement('div');
      empty.className = 'kd-empty kd-search-empty';
      body.appendChild(empty);
    }
    empty.textContent = `— nothing in ${tab} matches "${query}" —`;
  }
  else if (empty !== null) {
    empty.remove();
  }

  // Live search-term highlight — a warm swipe on matches within what's ON SCREEN
  // (the visible rows + any open deep-view), never the hidden rows; gated to >=2
  // chars so single letters don't paint the list. Pure text-wrap, no re-render.
  clearSearchHighlights(body);
  if (query.length >= 2) {
    body.querySelectorAll<HTMLElement>(`${selector}:not(.kd-hidden), .kd-essential-deep, .kd-book-deep`)
      .forEach(el => highlightMatchesIn(el, query));
  }

  return visible;
}

// ─── Mount ─────────────────────────────────────────────────────────────────

export function mount(container: HTMLElement): DrawerHandle {
  let isOpen = false;
  let activeTab: Tab = 'home';
  let selectedEssential: string | null = null;
  let selectedCondition: string | null = null;
  let selectedProduct: string | null = null;
  let selectedTopic: string | null = null;
  let trail: Crumb[] = [];
  let searchQuery = '';

  const render = (): void => {
    container.innerHTML = renderShell(activeTab, selectedEssential, selectedCondition, selectedProduct, selectedTopic, trail);
    // Re-apply the live query so a re-render (deep-dive open, regimen:changed)
    // doesn't silently drop an in-progress filter.
    if (searchQuery.length > 0) {
      const input = container.querySelector<HTMLInputElement>('.kd-search-input');
      if (input !== null) {
        input.value = searchQuery;
      }
      container.querySelector('.kd-search')?.classList.toggle('has-query', searchQuery.trim().length > 0);
      const body = container.querySelector<HTMLElement>('.kd-body');
      if (body !== null) {
        applyKnowledgeSearch(body, activeTab, searchQuery);
      }
    }
    // Scrollbar tint (cross-browser). A WebKit scrollbar pseudo reads ONLY root-level custom props
    // (an element-level --cat/--form on .kd-body can't reach it), and Firefox uses standard
    // scrollbar-color — so publish the SELECTED detail's colour on <html> as --kd-detail-scroll: a
    // condition's body-system category colour, OR a product's delivery-form colour (both validated
    // hex); the .kd-body scrollbar CSS reads it, app-orange when unset.
    const scrollTint = (activeTab === 'conditions' && selectedCondition !== null)
      ? conditionCategory(selectedCondition)?.color ?? ''
      : (activeTab === 'products' && selectedProduct !== null)
          ? productScrollTint(selectedProduct)
          : (activeTab === 'essentials' && selectedEssential !== null)
              ? (ESSENTIAL_CAT_SCROLL[getEssentialByLayoutKey(selectedEssential)?.category ?? ''] ?? '')
              : '';
    if (/^#[0-9a-f]{3,8}$/i.test(scrollTint)) {
      document.documentElement.style.setProperty('--kd-detail-scroll', scrollTint);
    }
    else {
      document.documentElement.style.removeProperty('--kd-detail-scroll');
    }
  };

  // Opening an entity extends the trail; toggling the same entity off, or a tab switch, clears it.
  const openDetail = (type: EntityCrumbType, val: string): void => {
    const cur = type === 'essential' ? selectedEssential : type === 'condition' ? selectedCondition : selectedProduct;
    const originTab = activeTab;
    selectedEssential = null;
    selectedCondition = null;
    selectedProduct = null;
    selectedTopic = null;
    if (cur === val) {
      // toggle off — close the detail, drop the trail
      trail = [];
      render();
      return;
    }
    if (type === 'essential') {
      selectedEssential = val;
      activeTab = 'essentials';
    }
    else if (type === 'condition') {
      selectedCondition = val;
      activeTab = 'conditions';
    }
    else {
      selectedProduct = val;
      activeTab = 'products';
    }
    const crumb: Crumb = { type, val, label: crumbLabel(type, val) };
    if (trail.length === 0) {
      trail = [{ type: 'tab', val: originTab, label: tabLabel(originTab) }, crumb];
    }
    else {
      const dup = trail.findIndex(c => crumbKey(c) === crumbKey(crumb));
      if (dup >= 0) {
        // loop guard: jump back to the existing crumb, never grow
        trail = trail.slice(0, dup + 1);
      }
      else {
        trail.push(crumb);
        capTrail(trail);
      }
    }
    render();
  };
  const goCrumb = (i: number): void => {
    const c = trail[i];
    selectedEssential = null;
    selectedCondition = null;
    selectedProduct = null;
    selectedTopic = null;
    // the origin anchor (or an invalid index) exits the detail
    if (i < 0 || c === undefined || c.type === 'tab') {
      trail = [];
      if (c !== undefined && c.type === 'tab') {
        activeTab = c.val as Tab;
      }
      render();
      return;
    }
    trail = trail.slice(0, i + 1);
    if (c.type === 'essential') {
      selectedEssential = c.val;
      activeTab = 'essentials';
    }
    else if (c.type === 'condition') {
      selectedCondition = c.val;
      activeTab = 'conditions';
    }
    else if (c.type === 'product') {
      selectedProduct = c.val;
      activeTab = 'products';
    }
    render();
  };

  const open = (): void => {
    if (isOpen) {
      return;
    }
    isOpen = true;
    container.classList.add('kd-open');
    render();
    emit('drawer:toggled', { target: 'knowledge', open: true });
  };
  const close = (): void => {
    if (!isOpen) {
      return;
    }
    isOpen = false;
    activeTab = 'home';
    selectedEssential = null;
    selectedCondition = null;
    selectedProduct = null;
    selectedTopic = null;
    trail = [];
    // Reset the per-tab filter too. Without this, a re-open renders Home while searchQuery still holds
    // the prior tab's term; render() then re-applies it and paints "nothing in home matches X" with no
    // search box to clear it. (The tab-switch handler already resets searchQuery, which is why switching
    // tabs 'fixed' it — this makes close() consistent so a plain re-open starts clean.)
    searchQuery = '';
    document.documentElement.style.removeProperty('--kd-detail-scroll');
    container.classList.remove('kd-open');
    container.innerHTML = '';
    emit('drawer:toggled', { target: 'knowledge', open: false });
  };
  const toggle = (): void => {
    if (isOpen) {
      close();
    }
    else {
      open();
    }
  };

  const clickHandler = (ev: Event): void => {
    const target = ev.target as HTMLElement | null;
    if (target === null) {
      return;
    }
    // Home live-suggest: any click outside the hero search box dismisses its dropdown
    // (the box lives only on the Home tab, so this is a harmless no-op elsewhere).
    if (target.closest('.sh-search') === null) {
      container.querySelector('.sh-search__results')?.classList.remove('open');
    }
    const tabBtn = target.closest<HTMLElement>('[data-kd-tab]');
    if (tabBtn !== null) {
      const next = tabBtn.getAttribute('data-kd-tab') as Tab | null;
      if (next !== null && next !== activeTab) {
        activeTab = next;
        selectedEssential = null;
        selectedCondition = null;
        selectedProduct = null;
        selectedTopic = null;
        trail = [];
        searchQuery = '';
        render();
      }
      return;
    }
    const crumbEl = target.closest<HTMLElement>('[data-kd-crumb]');
    if (crumbEl !== null) {
      goCrumb(Number(crumbEl.getAttribute('data-kd-crumb')));
      return;
    }
    const essEl = target.closest<HTMLElement>('[data-kd-essential]');
    if (essEl !== null) {
      const k = essEl.getAttribute('data-kd-essential');
      if (k !== null) {
        openDetail('essential', k);
      }
      return;
    }
    const condEl = target.closest<HTMLElement>('[data-kd-condition]');
    if (condEl !== null) {
      const k = condEl.getAttribute('data-kd-condition');
      if (k !== null) {
        openDetail('condition', k);
      }
      return;
    }
    const topicEl = target.closest<HTMLElement>('[data-kd-topic]');
    if (topicEl !== null) {
      const k = topicEl.getAttribute('data-kd-topic');
      selectedTopic = (k !== null && k === selectedTopic) ? null : k;
      // A topic renders as a full-body OVERLAY on top of whatever tab opened it (activeTab is left
      // untouched) so the back button returns you there — an Absorption card → back to Absorption,
      // an Explore chip → back to the all-topics grid (renderTab picks the label from the origin tab).
      // topics are their own overlay with their own back — not part of the entity trail
      trail = [];
      render();
      return;
    }
    const prodEl = target.closest<HTMLElement>('[data-kd-product]');
    if (prodEl !== null) {
      const k = prodEl.getAttribute('data-kd-product');
      if (k !== null) {
        openDetail('product', k);
      }
      return;
    }
    const actionEl = target.closest<HTMLElement>('[data-kd-action]');
    if (actionEl !== null) {
      const action = actionEl.getAttribute('data-kd-action');
      if (action === 'close') {
        close();
      }
      else if (action === 'essential-close') {
        selectedEssential = null;
        trail = [];
        render();
      }
      else if (action === 'condition-close') {
        selectedCondition = null;
        trail = [];
        render();
      }
      else if (action === 'product-close') {
        // Origin-aware back (mirrors the topic page): a product opened from a NON-products tab (the
        // ORAC "Best Supplement Sources" list) returns to that origin tab via its crumb; a normal
        // Products-tab open clears the detail and lands on the product list.
        if (trail[0] !== undefined && trail[0].type === 'tab' && trail[0].val !== 'products') {
          goCrumb(0);
        }
        else {
          selectedProduct = null;
          trail = [];
          render();
        }
      }
      else if (action === 'topic-close') {
        selectedTopic = null;
        trail = [];
        render();
      }
      else if (action === 'explore-home') {
        // The kicker "Explore" link — a general "jump to the all-topics grid" affordance, independent
        // of how you reached the topic (unlike the origin-aware back button). Clears every selection.
        activeTab = 'explore';
        selectedTopic = null;
        selectedEssential = null;
        selectedCondition = null;
        selectedProduct = null;
        trail = [];
        searchQuery = '';
        render();
      }
      else if (action === 'sources-more') {
        // In-place reveal of the overflow BEST SOURCES rows — a pure DOM class toggle,
        // no re-render, so the scroll position + open deep-dive are untouched.
        const list = actionEl.closest('.kd-essential-deep')?.querySelector<HTMLElement>('.kd-sources');
        if (list !== null && list !== undefined) {
          const expanded = list.classList.toggle('is-expanded');
          actionEl.setAttribute('aria-expanded', String(expanded));
          actionEl.classList.toggle('is-expanded', expanded);
          const label = actionEl.querySelector('.kd-source-more__label');
          if (label !== null) {
            const count = actionEl.getAttribute('data-count') ?? '';
            label.textContent = expanded
              ? 'Show fewer sources'
              : `Show ${count} more source${count === '1' ? '' : 's'} in the vault`;
          }
        }
      }
      else if (action === 'search-clear') {
        // Reset the active tab's filter in place (no re-render) + refocus for fast re-typing.
        searchQuery = '';
        const input = container.querySelector<HTMLInputElement>('.kd-search-input');
        if (input !== null) {
          input.value = '';
          input.focus();
        }
        container.querySelector('.kd-search')?.classList.remove('has-query');
        const body = container.querySelector<HTMLElement>('.kd-body');
        if (body !== null) {
          applyKnowledgeSearch(body, activeTab, '');
        }
      }
      else {
        console.warn('[views/knowledge] action stub:', action);
      }
    }
  };
  container.addEventListener('click', clickHandler);

  // Live search — delegated so it survives the innerHTML re-render. Filters the
  // active tab's rows in place (the box was rendered but unwired before).
  const inputHandler = (ev: Event): void => {
    const t = ev.target as HTMLElement | null;
    if (t === null) {
      return;
    }
    // Home hero live-suggest: repaint ONLY the results panel (not a full drawer
    // re-render) so the input keeps focus mid-type. Empty query closes the panel.
    if (t.classList.contains('kh-search')) {
      const panel = container.querySelector<HTMLElement>('.sh-search__results');
      if (panel !== null) {
        const q = (t as HTMLInputElement).value;
        if (q.trim().length === 0) {
          panel.innerHTML = '';
          panel.classList.remove('open');
        }
        else {
          panel.innerHTML = renderHomeSuggestions(q);
          panel.classList.add('open');
        }
      }
      return;
    }
    // The entity page's full-record filter is a separate box; filter in place.
    if (t.classList.contains('kd-ep-filter')) {
      const recordBody = container.querySelector<HTMLElement>('.kd-body');
      if (recordBody !== null) {
        applyRecordFilter(recordBody, (t as HTMLInputElement).value);
      }
      return;
    }
    if (!t.classList.contains('kd-search-input')) {
      return;
    }
    searchQuery = (t as HTMLInputElement).value;
    container.querySelector('.kd-search')?.classList.toggle('has-query', searchQuery.trim().length > 0);
    const body = container.querySelector<HTMLElement>('.kd-body');
    if (body !== null) {
      applyKnowledgeSearch(body, activeTab, searchQuery);
    }
  };
  container.addEventListener('input', inputHandler);

  // Home hero live-suggest keyboard control: arrows move the highlight, Enter opens
  // the highlighted entity, Escape dismisses. Delegated so it survives re-renders;
  // acts only when the hero search input is focused AND its dropdown is open, so it
  // never swallows the drawer's global Escape-to-close.
  const keydownHandler = (ev: Event): void => {
    const t = ev.target as HTMLElement | null;
    if (t === null || !t.classList.contains('kh-search')) {
      return;
    }
    const key = (ev as KeyboardEvent).key;
    const panel = container.querySelector<HTMLElement>('.sh-search__results');
    if (panel === null || !panel.classList.contains('open')) {
      return;
    }
    const items = Array.from(panel.querySelectorAll<HTMLElement>('.sh-res'));
    if (items.length === 0) {
      if (key === 'Escape') {
        panel.classList.remove('open');
      }
      return;
    }
    const cur = items.findIndex(el => el.classList.contains('active'));
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      ev.preventDefault();
      const nextIdx = key === 'ArrowDown'
        ? Math.min((cur < 0 ? -1 : cur) + 1, items.length - 1)
        : Math.max((cur < 0 ? items.length : cur) - 1, 0);
      items.forEach(el => el.classList.remove('active'));
      const chosen = items[nextIdx];
      if (chosen !== undefined) {
        chosen.classList.add('active');
        chosen.scrollIntoView({ block: 'nearest' });
      }
    }
    else if (key === 'Enter') {
      ev.preventDefault();
      (cur >= 0 ? items[cur] : items[0])?.click();
    }
    else if (key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      panel.classList.remove('open');
      (t as HTMLInputElement).blur();
    }
  };
  container.addEventListener('keydown', keydownHandler);

  // Re-render if regimen changes (Products tab + Essentials status reflect it).
  onEvent('regimen:changed', () => {
    if (isOpen) {
      render();
    }
  });

  return {
    open,
    close,
    toggle,
    openEntity: (kind: 'essential' | 'condition' | 'product' | 'topic', slug: string): void => {
      open();
      if (kind === 'topic') {
        // A topic is NOT a crumb entity — it renders as a full-body overlay (mirrors the data-kd-topic
        // click branch): clear any open detail, set the topic, anchor "back" to the all-topics grid
        // (activeTab='explore'), and drop the trail.
        selectedEssential = null;
        selectedCondition = null;
        selectedProduct = null;
        selectedTopic = slug;
        trail = [];
        activeTab = 'explore';
        render();
        return;
      }
      if (kind === 'essential') {
        // openDetail('essential', ...) keys by the COVERAGE LAYOUT KEY ('Calcium', 'Vitamin A
        // (Retinol / beta-carotene)'), NOT the corpus slug ('calcium') — getEssentialByLayoutKey
        // is an exact map lookup, so a slug silently missed and renderEssentialPage fell to its
        // "no sealed page record" fallback: an empty page titled with the raw slug. That is what
        // Ask-Wallach's "Learn More" did for every essential from the day it shipped (measured
        // 2026-07-23; the render probe only ever covered the condition + topic paths). Resolve
        // here so EVERY caller — Learn More, related pills, Coverage cards — is fixed at once.
        const lk = getEssentialBySlug(slug)?.layout_key;
        openDetail('essential', lk ?? slug);
        return;
      }
      openDetail(kind, slug);
    },
    isOpen: () => isOpen,
  };
}
