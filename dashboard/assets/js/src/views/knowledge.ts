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
import { on as onEvent } from '../core/events.js';
import { plural } from '../core/format.js';
import {
  CoverageLayoutSchema,
  type LayoutSection,
  type LayoutTile,
} from '../core/schemas/index.js';
import { ui } from '../state/copy.js';
import {
  getEssentialBySlug,
  listConditions,
} from '../state/corpus.js';
import {
  type CoverageSnapshot,
  type CoverageStatus,
  essentialGlyph,
  getOrCompute,
} from '../state/coverage.js';
import { listEssentialPages } from '../state/entity-page.js';
import { applyRecordFilter, renderEssentialPage } from './entity-page.js';
import { renderConditionsTab } from './knowledge-corpus.js';
import { exploreEntities, renderExploreTab } from './knowledge-explore.js';
import { renderHomeSuggestions, renderHomeTab } from './knowledge-home.js';
import { productCount, renderProductsTab } from './knowledge-products.js';
import { clearSearchHighlights, highlightMatchesIn } from './search-highlight.js';

export interface DrawerHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

type Tab = 'home' | 'essentials' | 'conditions' | 'explore' | 'products';

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
      m.set(lk, { name: e.name, claimCount: e.claim_count });
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
/** The 90 — count of essential tiles (Omega-9 and any other non-essential excluded). */
const ESS_ESSENTIAL_COUNT = ESS_SUBSECTIONS.reduce((n, g) => n + g.items.filter(i => i.essential).length, 0);

// ─── Status → presentation ─────────────────────────────────────────────────

function statusOf(snapshot: CoverageSnapshot | null, key: string): CoverageStatus {
  if (snapshot === null) {
    return '';
  }
  return snapshot.tiles.find(t => t.name === key)?.status ?? '';
}

// The 4 organic building blocks (hydrogen, carbon, nitrogen, oxygen) are present in
// air/water/food by default (Luneth) — a '' (no-dose) status reads covered, not absent.
const FOUNDATIONAL_PRESENT: ReadonlySet<string> = new Set(['H', 'C', 'N', 'O']);

/**
 * The tile's coverage-dot state. green covered · yellow partial · red uncovered/absent ·
 * hollow-blue present-but-unquantified. A no-dose foundational element (H/C/N/O) with no
 * numeric status reads covered (present by default); everything else with no delivery is absent.
 */
function dotState(status: CoverageStatus, symbol: string): string {
  if (status === 'covered' || status === 'trace') {
    return 'covered';
  }
  if (status === 'partial') {
    return 'partial';
  }
  if (status === 'present') {
    return 'present';
  }
  if (status === '' && FOUNDATIONAL_PRESENT.has(symbol)) {
    return 'covered';
  }
  return 'uncovered';
}

// ─── Render helpers ────────────────────────────────────────────────────────

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
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
  'FOUNDATIONAL': 'kd_esssec_structural',
  'MAJOR TRACE': 'kd_esssec_electrolytes',
  'RARE TRACE': 'kd_esssec_trace',
  'VITAMINS': 'kd_esssec_vitamins',
  'AMINO ACIDS': 'kd_esssec_amino',
  'FATTY ACIDS': 'kd_esssec_fatty',
};

/** The 4 coverage-dot states, in legend order. */
const COV_STATES = ['covered', 'partial', 'uncovered', 'present'] as const;

function renderEssentialsTab(snapshot: CoverageSnapshot | null, selectedKey: string | null): string {
  const deepHTML = selectedKey !== null ? renderEssentialDeep(selectedKey, snapshot) : '';
  const legendHTML = `<div class="ep-legend kd-cov-legend"><span class="ep-legend__lbl">${escHTML(ui('kd_covlegend_label'))}</span>${COV_STATES.map(s => `<span class="ep-legend__item"><span class="kd-cov-dot kd-cov-dot--${s}"></span>${escHTML(ui(`kd_covlegend_${s}`))}</span>`).join('')}</div>`;
  const groupsHTML = ESS_SUBSECTIONS.map((group) => {
    const tilesHTML = group.items.map((e) => {
      const dot = dotState(statusOf(snapshot, e.key), e.symbol);
      const sel = e.key === selectedKey ? ' is-selected' : '';
      return `<button type="button" class="sh-tile${sel}" data-cat="${escHTML(e.category)}" data-kd-essential="${escHTML(e.key)}" title="${escHTML(e.name)}"><span class="kd-cov-dot kd-cov-dot--${dot}"></span><span class="sh-tile__sym">${escHTML(e.symbol)}</span><span class="sh-tile__nm">${escHTML(e.name)}</span><span class="sh-tile__ct">${e.claimCount} ${escHTML(plural(e.claimCount, 'claim'))}</span></button>`;
    }).join('');
    const key = SEC_LABEL_KEY[group.label];
    const label = key !== undefined ? ui(key) : group.label;
    return `<div class="sh-subhead">${escHTML(label)}</div><div class="sh-grid${group.wide ? ' sh-grid--wide' : ''}">${tilesHTML}</div>`;
  }).join('');
  return `${deepHTML}${legendHTML}${groupsHTML}`;
}

function renderTab(tab: Tab, snapshot: CoverageSnapshot | null, selectedKey: string | null, selectedCondition: string | null, selectedProduct: string | null, selectedTopic: string | null): string {
  switch (tab) {
    case 'home': return renderHomeTab();
    case 'essentials': return renderEssentialsTab(snapshot, selectedKey);
    case 'conditions': return renderConditionsTab(selectedCondition);
    case 'explore': return renderExploreTab(selectedTopic);
    case 'products': return renderProductsTab(selectedProduct);
  }
}

function renderShell(activeTab: Tab, selectedKey: string | null, selectedCondition: string | null, selectedProduct: string | null, selectedTopic: string | null): string {
  const snapshot = getOrCompute();
  const productsCount = productCount();
  const tabs = [
    { id: 'home' as Tab, label: ui('kd_tab_home'), count: '' },
    { id: 'essentials' as Tab, label: ui('kd_tab_essentials'), count: `${ESS_ESSENTIAL_COUNT} ESSENTIAL` },
    { id: 'conditions' as Tab, label: ui('kd_tab_conditions'), count: `${listConditions().length} INDEXED` },
    { id: 'explore' as Tab, label: ui('kd_tab_explore'), count: `${exploreEntities().length} TOPICS` },
    { id: 'products' as Tab, label: ui('kd_tab_products'), count: `${productsCount} KNOWN` },
  ];
  const tabsHTML = tabs.map(t => `<button class="kd-knh__tab${t.id === activeTab ? ' active' : ''}" data-kd-tab="${t.id}">${escHTML(t.label)}</button>`).join('');

  return `
    <span class="ds-scan-line" aria-hidden="true"></span>
    <header class="kd-knh">
      <div class="kd-knh__mark"><span class="kd-knh__g">❡</span><b>${escHTML(ui('kd_mark'))}</b></div>
      <nav class="kd-knh__tabs">${tabsHTML}</nav>
      <div class="kd-knh__end"><button class="kd-knh__close" data-kd-action="close" title="Close (Esc)">×</button></div>
    </header>
    ${activeTab === 'essentials' || activeTab === 'conditions' || activeTab === 'products'
      ? `<div class="kd-search">
      <span class="kd-search-icon">⌕</span>
      <input class="kd-search-input" type="text" placeholder="SEARCH ${activeTab.toUpperCase()}…" />
      <button class="kd-search-clear" data-kd-action="search-clear" type="button" aria-label="Clear search" title="Clear search">×</button>
      <span class="kd-search-kbd">/</span>
    </div>`
      : ''}
    <div class="kd-body">${renderTab(activeTab, snapshot, selectedKey, selectedCondition, selectedProduct, selectedTopic)}</div>`;
}

// ─── Search (per-tab DOM filter) ──────────────────────────────

/**
 * Per active tab, the selector for the list items the search box filters. The
 * tabs render different item shapes (book rows / essential tiles / condition
 * rows / product rows / doctrine cards), so the query targets each by class.
 */
const KD_SEARCH_ITEM_SELECTOR: Record<Tab, string> = {
  home: '.kd-home',
  essentials: '.sh-tile',
  conditions: '.kd-condition-row',
  explore: '.kd-explore-chip',
  products: '.kd-product-row',
};

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

  // Heads + items walked in document order (querySelectorAll flattens the
  // essentials grid wrapper) so each head reflects only its own items' state.
  let visible = 0;
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
    // Match visible text OR the row's hidden `data-search` keyword blob (condition
    // rows carry synonyms/symptoms/claim text there, so content queries like
    // "smell" -> Anosmia work; rows without the attr fall back to textContent only).
    const hay = `${node.textContent ?? ''} ${node.dataset['search'] ?? ''}`;
    const match = !active || hay.toLowerCase().includes(query);
    node.classList.toggle('kd-hidden', !match);
    if (match) {
      visible += 1;
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
  let searchQuery = '';

  const render = (): void => {
    container.innerHTML = renderShell(activeTab, selectedEssential, selectedCondition, selectedProduct, selectedTopic);
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
  };

  const open = (): void => {
    if (isOpen) {
      return;
    }
    isOpen = true;
    container.classList.add('kd-open');
    render();
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
    container.classList.remove('kd-open');
    container.innerHTML = '';
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
        searchQuery = '';
        render();
      }
      return;
    }
    const essEl = target.closest<HTMLElement>('[data-kd-essential]');
    if (essEl !== null) {
      const k = essEl.getAttribute('data-kd-essential');
      selectedEssential = (k !== null && k === selectedEssential) ? null : k;
      // Opening an essential surfaces it on the Essentials tab, so a click from the
      // Home hero or a cross-link pill lands on the page (mirrors the product branch).
      if (selectedEssential !== null) {
        activeTab = 'essentials';
      }
      render();
      return;
    }
    const condEl = target.closest<HTMLElement>('[data-kd-condition]');
    if (condEl !== null) {
      const k = condEl.getAttribute('data-kd-condition');
      selectedCondition = (k !== null && k === selectedCondition) ? null : k;
      // Same as essentials: land the condition on its own tab (Home hero / cross-links).
      if (selectedCondition !== null) {
        activeTab = 'conditions';
      }
      render();
      return;
    }
    const topicEl = target.closest<HTMLElement>('[data-kd-topic]');
    if (topicEl !== null) {
      const k = topicEl.getAttribute('data-kd-topic');
      selectedTopic = (k !== null && k === selectedTopic) ? null : k;
      // A topic opens on the Explore tab (chip grid <-> topic page), mirroring conditions.
      if (selectedTopic !== null) {
        activeTab = 'explore';
      }
      render();
      return;
    }
    const prodEl = target.closest<HTMLElement>('[data-kd-product]');
    if (prodEl !== null) {
      // A product is clickable from the Products list OR an essentials-deep-dive
      // chip: toggle its detail panel and switch to the Products tab so product
      // detail always has one home.
      const k = prodEl.getAttribute('data-kd-product');
      selectedProduct = (k !== null && k === selectedProduct) ? null : k;
      if (selectedProduct !== null) {
        activeTab = 'products';
      }
      render();
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
        render();
      }
      else if (action === 'condition-close') {
        selectedCondition = null;
        render();
      }
      else if (action === 'product-close') {
        selectedProduct = null;
        render();
      }
      else if (action === 'topic-close') {
        selectedTopic = null;
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
    isOpen: () => isOpen,
  };
}
