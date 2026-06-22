/**
 * views/knowledge.ts — Knowledge drawer (overlay)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Slide-in-from-left overlay drawer, 420px starting width, EXPAND grows to
 * fill the workspace area. Renders 4 tabs: Corpus / Essentials / Products /
 * Doctrine. Reads from the extracted .json + .md data files via getElementById
 * (data still inline in dashboard.html for Round 5 — Round 6 polish pass
 * migrates to fetch('./assets/data/*.json')).
 *
 * §00 Zod boundary: data reads pass through schemas defined in
 * core/schemas/knowledge before any field access enters typed-land.
 *
 * Visual contract: drawer-knowledge-v3-PROPOSAL.html.
 *
 * Keyboard: rail "K" item toggles. Esc closes (handler installed in main.ts).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { on as onEvent } from '../core/events.js';
import {
  type Essential,
  EssentialsDataSchema,
  type ProductEntry,
  ProductEntrySchema,
  ProductsLookupSchema,
} from '../core/schemas/index.js';

export interface DrawerHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleExpanded: () => void;
  isOpen: () => boolean;
}

type Tab = 'corpus' | 'essentials' | 'products' | 'doctrine';

// ─── Data readers — Zod-validated at the parse boundary ───────────────────

function readEssentials(): Essential[] {
  const el = document.getElementById('essentials-targets-data');
  if (el === null) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(el.textContent ?? '{}');
  }
  catch {
    return [];
  }
  const result = EssentialsDataSchema.safeParse(parsed);
  return result.success ? result.data.essentials : [];
}

function readProducts(): ProductEntry[] {
  const el = document.getElementById('regimen-label-lookup');
  if (el === null) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(el.textContent ?? '{}');
  }
  catch {
    return [];
  }
  // Mirror state regimen's readVault: the embed may wrap the map under a
  // `products` key, and the vault keys its display name as `canonical_name`
  // (not always `name`). Walk every value, resolve canonical_name ?? name,
  // and dedup by lowercased name so the same product never lists twice.
  let root: unknown = parsed;
  if (parsed !== null && typeof parsed === 'object' && 'products' in parsed) {
    root = parsed.products;
  }
  const lookup = ProductsLookupSchema.safeParse(root);
  if (!lookup.success) {
    return [];
  }
  const byName = new Map<string, ProductEntry>();
  for (const value of Object.values(lookup.data)) {
    const candidates = Array.isArray(value) ? value : [value];
    for (const candidate of candidates) {
      const r = ProductEntrySchema.safeParse(candidate);
      if (!r.success) {
        continue;
      }
      const nm = r.data.canonical_name ?? r.data.name;
      if (typeof nm === 'string' && nm.length > 0) {
        byName.set(nm.toLowerCase(), r.data);
      }
    }
  }
  return [...byName.values()];
}

// Hard-coded books + doctrines — small, stable, doesn't warrant LS or a fetch.
// Round 6 polish: move into knowledge/corpus/ as actual file refs.
const BOOKS = [
  { id: 'DDDL', title: 'Dead Doctors Don\'t Lie', chapters: 12, cites: 286, author: 'Wallach' },
  { id: 'RBS', title: 'Rare Earths: Forbidden Cures', chapters: 16, cites: 412, author: 'Wallach' },
  { id: 'EPS', title: 'Epigenetics: The Death of the Genetic Theory', chapters: 9, cites: 188, author: 'Wallach' },
  { id: 'YGY', title: 'YGY Product Compendium', chapters: 0, cites: 59, author: 'Secondary · label data only' },
];

const DOCTRINES = [
  { id: 'DOCT·01', title: 'Source-Rule · Wallach Primary Only', featured: true, body: 'Every numeric target, dose recommendation, deficiency indicator, or health claim displayed by this system must cite a primary source from the Wallach corpus or the YGY product allowlist. No exceptions, including the user.', cite: 'ENFORCED BY check_no_unsourced_claims · invariant tier · critical' },
  { id: 'DOCT·02', title: 'Aggregate-Vehicle Coverage (PDM)', featured: false, body: 'Plant-derived minerals are defined by sourcing, not by amounts. If a plant-derived mineral aggregate is present in a product, every trace mineral in that aggregate is considered covered — binary, not graduated.', cite: 'CITED · Dead Doctors Don\'t Lie · ch. 4' },
  { id: 'DOCT·03', title: 'BTT Layering Order', featured: false, body: 'Beyond Tangy Tangerine is the foundational morning layer — vitamins, aminos, foundational minerals. Stack PDM on top for the rare-trace closure. Add EFA Plus for fatty acids. Order matters for absorption.', cite: 'CITED · Wallach lecture corpus · YGY protocol guide' },
  { id: 'DOCT·04', title: 'Trace Minerals: Source-Not-Quantity', featured: false, body: 'For the 35 rare trace minerals, presence in a plant-derived vehicle is the qualifying criterion. Mass-spec verification of every trace amount is unnecessary if the source is doctrinally sound.', cite: 'CITED · Rare Earths · ch. 9' },
  { id: 'DOCT·05', title: 'Atomic LS Write Discipline (§17)', featured: false, body: 'Every regimen LS write goes through a verified round-trip set → re-read → reject-on-mismatch loop. Silent truncations from the Edit tool taught us this. Writes that cannot confirm fail loudly.', cite: 'PROVED · Round 73 lessons + 9 truncation incidents' },
  { id: 'DOCT·06', title: '§31 Chokepoint Discipline (Cross-Surface Sync)', featured: false, body: 'Every regimen mutation flows through one of 5 named chokepoint helpers. Each fires triggerRegimenRerender so all subscribed surfaces re-render. State drift is structurally impossible by module design, not vigilance.', cite: 'CITED · Round 150 doctrine · enforced by check_regimen_state_mutation_routing' },
  { id: 'DOCT·07', title: 'Eden Sealed-Canonical (User-Only-Writer)', featured: false, body: 'Sealed canonical files (design-system.css, eden corpus) carry hash anchors. Agent reads freely, never writes after sealing time. Drift is detected at startup; reads from drifted files fail loudly.', cite: 'CITED · Round 157 · enforced by eden_hash_integrity + write_protection invariants' },
];

// ─── Render helpers ────────────────────────────────────────────────────────

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

function hexSerial(seed: number): string {
  return ((seed * 0x9E3779B9) >>> 0).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
}

// ─── Tab renderers ─────────────────────────────────────────────────────────

function renderCorpusTab(): string {
  const booksHTML = BOOKS.map(b => `
    <div class="book-row">
      <div class="book-row__spine"><span>${escHTML(b.id)}</span></div>
      <div class="book-row__body">
        <h4 class="book-row__title">${escHTML(b.title)}</h4>
        <div class="book-row__meta">${escHTML(b.author)}${b.chapters > 0 ? ` · ${b.chapters} CHAPTERS` : ''} · ${b.cites} CITES</div>
      </div>
      <div class="book-row__count">${b.cites}<small>cites</small></div>
    </div>`).join('');

  return `
    <div class="featured-citation">
      <div class="featured-citation__eyebrow"><span class="pulse-dot"></span>SOURCE-RULE CORNERSTONE</div>
      <p class="featured-citation__quote">The body needs 60 minerals, 16 vitamins, 12 amino acids, and 3 essential fatty acids — 91 essentials total. Plant-derived minerals are the only delivery vehicle that the body absorbs as nature intended.</p>
      <div class="featured-citation__attr"><strong>Wallach</strong> · Dead Doctors Don\'t Lie · ch. 1 · paraphrase per primary corpus</div>
    </div>
    <div class="section-head">PRIMARY CORPUS · WALLACH</div>
    ${booksHTML}`;
}

function renderEssentialsTab(): string {
  const essentials = readEssentials();
  if (essentials.length === 0) {
    return '<div class="kd-empty">— essentials data not loaded —</div>';
  }

  const tilesHTML = essentials.slice(0, 60).map(e => `
    <div class="essential-tile" data-essential="${escHTML(e.name)}">
      <div class="essential-tile__sym">${escHTML(e.name.charAt(0).toUpperCase())}</div>
      <div class="essential-tile__name">${escHTML(e.name)}</div>
      <div class="essential-tile__meta">${escHTML(e.category)}</div>
    </div>`).join('');

  return `
    <div class="section-head">ALL ${essentials.length} ESSENTIALS · CLICK TO DEEP-DIVE</div>
    <div class="kd-essentials-grid">${tilesHTML}</div>
    ${essentials.length > 60 ? `<div class="kd-more">— + ${essentials.length - 60} more · scroll filter wired in polish pass —</div>` : ''}`;
}

function renderProductsTab(): string {
  const products = readProducts();
  if (products.length === 0) {
    return '<div class="kd-empty">— vault data not loaded · 59 known products live in regimen-label-lookup —</div>';
  }

  const productsHTML = products.slice(0, 30).map(p => `
    <div class="product-row">
      <div class="product-row__icon">${escHTML((p.canonical_name ?? p.name ?? '?').charAt(0).toUpperCase())}</div>
      <div class="product-row__body">
        <h4 class="product-row__name">${escHTML(p.canonical_name ?? p.name ?? '(unnamed)')}</h4>
        <div class="product-row__meta">${escHTML(p.brand ?? 'YGY')} · ${(p.nutrients?.length ?? 0)} NUTRIENTS LISTED</div>
      </div>
      <span class="product-row__verdict product-row__verdict--ok">VAULT</span>
    </div>`).join('');

  return `
    <div class="section-head">PRODUCTS VAULT · ${products.length} ENTRIES</div>
    ${productsHTML}
    ${products.length > 30 ? `<div class="kd-more">— + ${products.length - 30} more · scroll wired in polish pass —</div>` : ''}`;
}

function renderDoctrineTab(): string {
  return DOCTRINES.map(d => `
    <div class="doctrine-card${d.featured ? ' featured' : ''}">
      <div class="doctrine-card__id">${escHTML(d.id)}${d.featured ? ' · CORNERSTONE' : ''}</div>
      <h4 class="doctrine-card__title">${escHTML(d.title)}</h4>
      <p class="doctrine-card__body">${escHTML(d.body)}</p>
      <div class="doctrine-card__cite">${escHTML(d.cite)}</div>
    </div>`).join('');
}

function renderTab(tab: Tab): string {
  switch (tab) {
    case 'corpus': return renderCorpusTab();
    case 'essentials': return renderEssentialsTab();
    case 'products': return renderProductsTab();
    case 'doctrine': return renderDoctrineTab();
  }
}

function renderShell(activeTab: Tab): string {
  const essentialsCount = readEssentials().length;
  const productsCount = readProducts().length;
  const tabs = [
    { id: 'corpus' as Tab, label: 'Corpus', count: `${BOOKS.length} BOOKS` },
    { id: 'essentials' as Tab, label: 'Essentials', count: `${essentialsCount} TILES` },
    { id: 'products' as Tab, label: 'Products', count: `${productsCount > 0 ? productsCount : 59} KNOWN` },
    { id: 'doctrine' as Tab, label: 'Doctrine', count: `${DOCTRINES.length} RULES` },
  ];
  const tabsHTML = tabs.map(t => `
    <button class="kd-tab${t.id === activeTab ? ' active' : ''}" data-kd-tab="${t.id}">
      <span>${escHTML(t.label)}</span>
      <span class="kd-tab__count">${escHTML(t.count)}</span>
    </button>`).join('');

  return `
    <span class="ds-scan-line" aria-hidden="true"></span>
    <header class="kd-head">
      <div>
        <div class="kd-eyebrow"><span class="pulse-dot"></span>DRAWER · <span class="ds-cipher" data-cipher-set="hexa">KN·${hexSerial(activeTab.length * 7)}</span></div>
        <h2 class="kd-title">Knowledge</h2>
        <div class="kd-sub">// the corpus, the essentials, the products, the doctrine</div>
      </div>
      <button class="kd-close" data-kd-action="close" title="Close (Esc)">×</button>
    </header>
    <div class="kd-tabs">${tabsHTML}</div>
    <div class="kd-search">
      <span class="kd-search-icon">⌕</span>
      <input class="kd-search-input" type="text" placeholder="SEARCH ${activeTab.toUpperCase()}…" />
      <span class="kd-search-kbd">/</span>
    </div>
    <div class="kd-body">${renderTab(activeTab)}</div>
    <footer class="kd-footer">
      <button class="kd-action" data-kd-action="pin"><span class="kd-action__glyph">⊕</span>PIN</button>
      <button class="kd-action" data-kd-action="share"><span class="kd-action__glyph">↗</span>SHARE</button>
      <button class="kd-action" data-kd-action="cite"><span class="kd-action__glyph">⌑</span>CITE</button>
      <span class="kd-action__spacer"></span>
      <button class="kd-action kd-action--expand" data-kd-action="expand"><span class="kd-action__glyph">⤢</span>EXPAND</button>
    </footer>`;
}

// ─── Mount ─────────────────────────────────────────────────────────────────

export function mount(container: HTMLElement): DrawerHandle {
  let isOpen = false;
  let isExpanded = false;
  let activeTab: Tab = 'corpus';

  const render = (): void => {
    container.innerHTML = renderShell(activeTab);
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
    isExpanded = false;
    container.classList.remove('kd-open', 'kd-expanded');
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
  const toggleExpanded = (): void => {
    isExpanded = !isExpanded;
    container.classList.toggle('kd-expanded', isExpanded);
  };

  const clickHandler = (ev: Event): void => {
    const target = ev.target as HTMLElement | null;
    if (target === null) {
      return;
    }
    const tabBtn = target.closest<HTMLElement>('[data-kd-tab]');
    if (tabBtn !== null) {
      const next = tabBtn.getAttribute('data-kd-tab') as Tab | null;
      if (next !== null && next !== activeTab) {
        activeTab = next;
        render();
      }
      return;
    }
    const actionEl = target.closest<HTMLElement>('[data-kd-action]');
    if (actionEl !== null) {
      const action = actionEl.getAttribute('data-kd-action');
      if (action === 'close') {
        close();
      }
      else if (action === 'expand') {
        toggleExpanded();
      }
      else {
        console.warn('[views/knowledge] action stub:', action);
      }
    }
  };
  container.addEventListener('click', clickHandler);

  // Re-render if regimen changes (Products tab might show different items)
  onEvent('regimen:changed', () => {
    if (isOpen) {
      render();
    }
  });

  return {
    open,
    close,
    toggle,
    toggleExpanded,
    isOpen: () => isOpen,
  };
}
