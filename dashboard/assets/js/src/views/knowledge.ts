/**
 * views/knowledge.ts — Knowledge drawer (overlay)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Slide-in-from-left overlay drawer, 420px starting width, EXPAND grows to
 * fill the workspace area. Renders 4 tabs: Corpus / Essentials / Products /
 * Doctrine.
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
import doctrineData from '../../../data/doctrine-data.json';
import fattyAcidClarityData from '../../../data/fatty-acid-clarity-data.json';
import { on as onEvent } from '../core/events.js';
import {
  CoverageLayoutSchema,
  type DoctrineCard,
  DoctrineSchema,
  FattyAcidClaritySchema,
  type LayoutSection,
  type LayoutTile,
} from '../core/schemas/index.js';
import {
  getEssentialByLayoutKey,
  listBooks,
  listConditions,
} from '../state/corpus.js';
import {
  type CoverageSnapshot,
  type CoverageStatus,
  getOrCompute,
  getTargets,
} from '../state/coverage.js';
import { renderConditionsTab, renderCorpusForEssential, renderCorpusTab, renderIntakeMeter, tileOf } from './knowledge-corpus.js';
import { productCount, renderEssentialSources, renderProductsTab } from './knowledge-products.js';
import { clearSearchHighlights, highlightMatchesIn } from './search-highlight.js';

export interface DrawerHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleExpanded: () => void;
  isOpen: () => boolean;
}

type Tab = 'corpus' | 'essentials' | 'conditions' | 'products' | 'doctrine';

// Doctrines — the app's OWN operating-guarantee cards (source-rule, §17, §31,
// sealed-canonical), read from the designated prose store (doctrine-data.json,
// blueprint §2.4 prose home #4) + Zod-validated at the boundary. The prose +
// enforcement refs live in the store, never inline here (R4); the view composes
// each card's cite from enforced_by + tier, so no citation is hand-typed (R3). The
// Wallach HEALTH-doctrine cards (former PDM / BTT / trace-mineral) were dropped
// pending Phase-G mining — they must trace to real corpus claim IDs (see the
// store's _note). (Books are NOT hard-coded either: the Corpus tab is driven by the
// sealed corpus via state/corpus.ts — listBooks() = books-meta + REAL per-book
// claim counts; no fabricated cite totals ever — §00.A/anti-fakery.)
const DOCTRINES: DoctrineCard[] = DoctrineSchema.parse(doctrineData).doctrines;

// ─── Essentials layout (shared with the Coverage periodic table) ───────────

const LAYOUT = CoverageLayoutSchema.parse(coverageLayoutData);

// Omega fatty-acid CLARITY explainer (GENERAL reference, NOT a Wallach claim) — shown on each
// omega essential's deep-dive so the naming stays unambiguous (the source 90-nutrients graphic
// mislabeled Omega-9 as "Arachidonic"; it is Oleic Acid). Prose lives in the store (R4).
const FATTY_ACID_CLARITY = FattyAcidClaritySchema.parse(fattyAcidClarityData);
const OMEGA_BY_FAMILY = new Map(FATTY_ACID_CLARITY.omegas.map(o => [o.family, o] as const));

/** One essential as the drawer grid + deep-dive render it. */
interface EssentialView {
  /** Canonical name — join key into the CoverageSnapshot + targets DB. */
  key: string;
  /** Abbreviated display name (uppercase). */
  name: string;
  /** Chemical symbol / vitamin letter / amino abbr / section code. */
  symbol: string;
  /** Granular category label (FOUNDATIONAL / RARE TRACE / VITAMIN / …). */
  catLabel: string;
  /** Reference token (#24 atomic, or V·01 code) for the deep-dive head. */
  ref: string;
  /** Broad section title (MINERALS / VITAMINS / …). */
  section: string;
  /** False for non-essential nutrients shown but not counted in the 90 (Omega-9). */
  essential: boolean;
}

function tileSymbol(t: LayoutTile): string {
  return t.sym ?? t.letter ?? t.abbr ?? t.code ?? t.name.charAt(0).toUpperCase();
}

function tileRef(t: LayoutTile): string {
  if (t.num !== undefined) {
    return `#${t.num}`;
  }
  return t.code ?? '';
}

function sectionCatLabel(section: LayoutSection): string {
  switch (section.tileClass) {
    case 'tile--vitamin':
      return 'VITAMIN';
    case 'tile--amino':
      return 'AMINO ACID';
    case 'tile--fat':
      return 'FATTY ACID';
    case 'tile':
      return 'MINERAL';
    default:
      return 'MINERAL';
  }
}

interface EssentialGroup {
  title: string;
  sub: string;
  items: EssentialView[];
}

/** Flatten the layout into render groups (one per section) + a key→view map. */
function buildEssentialGroups(): EssentialGroup[] {
  return LAYOUT.sections.map((section) => {
    const items: EssentialView[] = [];
    const pushTile = (t: LayoutTile, catLabel: string): void => {
      items.push({ key: t.key, name: t.name, symbol: tileSymbol(t), catLabel, ref: tileRef(t), section: section.title, essential: t.essential !== false });
    };
    if (section.subsections !== undefined) {
      for (const sub of section.subsections) {
        for (const t of sub.tiles) {
          pushTile(t, sub.label);
        }
      }
    }
    else if (section.tiles !== undefined) {
      const label = sectionCatLabel(section);
      for (const t of section.tiles) {
        pushTile(t, label);
      }
    }
    return { title: section.title, sub: section.sub, items };
  });
}

const ESS_GROUPS = buildEssentialGroups();
const ESS_BY_KEY = new Map<string, EssentialView>(
  ESS_GROUPS.flatMap(g => g.items.map(i => [i.key, i] as const)),
);
/** The 90 — count of essential tiles (Omega-9 and any other non-essential excluded). */
const ESS_ESSENTIAL_COUNT = ESS_GROUPS.reduce((n, g) => n + g.items.filter(i => i.essential).length, 0);

// ─── Status → presentation ─────────────────────────────────────────────────

function statusOf(snapshot: CoverageSnapshot | null, key: string): CoverageStatus {
  if (snapshot === null) {
    return '';
  }
  return snapshot.tiles.find(t => t.name === key)?.status ?? '';
}

function statusTileClass(s: CoverageStatus): string {
  if (s === 'covered' || s === 'trace') {
    return 'kd-essential-tile--covered';
  }
  if (s === 'partial' || s === 'gap') {
    return 'kd-essential-tile--partial';
  }
  return '';
}

function statusLabel(s: CoverageStatus): string {
  switch (s) {
    case 'covered':
    case 'trace':
      return 'COVERED';
    case 'partial':
      return 'PARTIAL';
    case 'gap':
      return 'GAP';
    case '':
      return 'PENDING';
    default:
      return 'PENDING';
  }
}

function statusPillClass(s: CoverageStatus): string {
  if (s === 'covered' || s === 'trace') {
    return 'kd-essential-deep__status-pill--ok';
  }
  if (s === 'partial' || s === 'gap') {
    return 'kd-essential-deep__status-pill--warn';
  }
  return 'kd-essential-deep__status-pill--pending';
}

// ─── Render helpers ────────────────────────────────────────────────────────

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

function hexSerial(seed: number): string {
  return ((seed * 0x9E3779B9) >>> 0).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
}

// ─── Tab renderers ─────────────────────────────────────────────────────────

/**
 * Per-omega clarity alert for the deep-dive: lists the family's fatty acids (primary +
 * additional forms) with a plain description. GENERAL reference, explicitly marked NOT a
 * Wallach claim (§00.A: clearly-marked non-Wallach educational context). Empty for non-omegas.
 */
function renderOmegaClarity(key: string): string {
  const m = /^Omega-([369])\b/.exec(key);
  const digit = m?.[1];
  if (digit === undefined) {
    return '';
  }
  const fam = OMEGA_BY_FAMILY.get(`omega-${digit}`);
  if (fam === undefined) {
    return '';
  }
  const rows = fam.acids.map(a => `
      <li class="kd-omega__row">
        <span class="kd-omega__abbr">${escHTML(a.abbr)}</span>
        <div class="kd-omega__body">
          <span class="kd-omega__name">${escHTML(a.name)}${a.primary ? ' <em class="kd-omega__primary">primary</em>' : ''}</span>
          <span class="kd-omega__desc">${escHTML(a.description)}</span>
        </div>
      </li>`).join('');
  return `
    <div class="kd-omega">
      <div class="kd-omega__head">
        <span class="kd-omega__title">${escHTML(fam.label)} · FATTY-ACID FORMS</span>
      </div>
      <ul class="kd-omega__list">${rows}</ul>
      <div class="kd-omega__note">${escHTML(FATTY_ACID_CLARITY.disclaimer)}</div>
    </div>`;
}

// ─── "Why this number?" — the target's provenance, collapsed under the meter ─
// Surfaces Wallach's own stated range (with the explicit "we target the upper end"
// framing Luneth chose), Vitamin A's two-part retinol+beta-carotene breakdown, any
// earlier-book figure, and the "his guidance evolved" gloss. Reads the derived target's
// range/parts/other_claims/provenance fields (targets_derive.py). Content micro-copy is
// inline here (the full R4 prose store is a Phase E/F WISH; matches the kd-source-note pattern).
interface WTNRange { low: number; high: number | null; unit: string }
interface WTNPart { form?: string | null; value: number; unit: string; range?: WTNRange }
interface WTNOther { low: number; high: number | null; unit: string; source?: string }
interface WallachTargetDetail {
  low?: number;
  unit?: string;
  source?: string;
  range?: WTNRange;
  parts?: WTNPart[];
  other_claims?: WTNOther[];
  provenance?: { body_weight_basis?: string; unit_detail?: string };
}

function wtnNum(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// "Wallach \u2014 Epigenetics: The Death of ... (Wallach, 2014)" -> "Epigenetics (2014)"
function wtnBook(src: string | undefined): string {
  if (src === undefined) { return ''; }
  const yr = src.match(/\((?:Wallach,\s*)?(\d{4})\)/);
  const stripped = src
    .replace(/^Wallach\s*[\u2014-]\s*/, '')
    .replace(/\s*\((?:Wallach,\s*)?\d{4}\)/, '');
  const title = (stripped.split(':')[0] ?? stripped).trim();
  return (yr !== null) ? `${title} (${yr[1]})` : title;
}

function wtnAmount(low: number, high: number | null, unit: string): string {
  const val = (high !== null && high !== low) ? `${wtnNum(low)}\u2013${wtnNum(high)}` : wtnNum(low);
  return `${val} ${escHTML(unit)}`;
}

function renderWhyThisNumber(td: WallachTargetDetail | undefined): string {
  if (td === undefined || typeof td.low !== 'number') {
    return '';
  }
  const weightScaled = td.provenance?.body_weight_basis !== undefined;
  const detail = td.provenance?.unit_detail !== undefined ? ` ${escHTML(td.provenance.unit_detail)}` : '';
  const rows: string[] = [];

  rows.push(`<div class="kd-why__posted"><strong>${wtnNum(td.low)} ${escHTML(td.unit ?? '')}${detail}</strong> daily${td.source !== undefined ? ` \u00b7 ${escHTML(wtnBook(td.source))}` : ''}</div>`);

  const parts = td.parts;
  if (Array.isArray(parts) && parts.length > 1) {
    const partsTxt = parts
      .map(p => `${(p.form !== undefined && p.form !== null) ? escHTML(p.form) + ' ' : ''}<strong>${wtnNum(p.value)}</strong>`)
      .join(' + ');
    rows.push(`<div class="kd-why__parts">= ${partsTxt} ${escHTML(td.unit ?? '')}</div>`);
    const rangeTxt = parts
      .map(p => `${(p.form !== undefined && p.form !== null) ? escHTML(p.form) + ' ' : ''}${p.range !== undefined ? wtnAmount(p.range.low, p.range.high, p.range.unit) : ''}`)
      .join(' \u00b7 ');
    rows.push(`<div class="kd-why__range">Wallach's stated ranges: <strong>${rangeTxt}</strong> \u2014 <em>we target the upper of each</em>.</div>`);
  } else if (td.range !== undefined) {
    const scaleNote = weightScaled ? ' per 100 lb \u2192 scaled to 154 lb (70 kg reference)' : '';
    const isRange = td.range.high !== null && td.range.high !== td.range.low;
    if (isRange) {
      rows.push(`<div class="kd-why__range">Wallach's stated range: <strong>${wtnAmount(td.range.low, td.range.high, td.range.unit)}</strong>${scaleNote} \u2014 <em>we target the upper end</em>.</div>`);
    } else {
      rows.push(`<div class="kd-why__range">Wallach states <strong>${wtnAmount(td.range.low, td.range.high, td.range.unit)}</strong>${scaleNote}.</div>`);
    }
  }

  if (Array.isArray(td.other_claims) && td.other_claims.length > 0) {
    for (const o of td.other_claims) {
      rows.push(`<div class="kd-why__older">\u21a9 Earlier: <strong>${wtnAmount(o.low, o.high, o.unit)}</strong>${o.source !== undefined ? ` \u2014 ${escHTML(wtnBook(o.source))}` : ''}</div>`);
    }
    rows.push('<div class="kd-why__gloss">Wallach\u2019s guidance evolved across his books \u2014 we default to his most recent figure and keep the earlier one for context.</div>');
  }

  return `
    <details class="kd-why">
      <summary class="kd-why__summary">why this number?</summary>
      <div class="kd-why__body">${rows.join('')}</div>
    </details>`;
}

function renderEssentialDeep(key: string, snapshot: CoverageSnapshot | null): string {
  const e = ESS_BY_KEY.get(key);
  if (e === undefined) {
    return '';
  }
  const corpusEss = getEssentialByLayoutKey(key);
  const status = statusOf(snapshot, key);
  const target = getTargets().find(t => t.name === key);
  const td = (target as { target?: unknown } | undefined)?.target as WallachTargetDetail | undefined;
  const corpusHTML = corpusEss !== null ? renderCorpusForEssential(corpusEss, renderWhyThisNumber(td)) : renderWhyThisNumber(td);
  const stance = target?.wallach_stance;
  const summary = stance?.summary;
  const citation = stance?.citation;

  // Phase C2 (2026-07-05): the "WALLACH SAYS" stance box is DROPPED for now. Its old
  // data (knowledge/essentials-targets.json) carried lecture citations, Youngevity
  // stances, and hand-typed cites (the poison this overhaul purges), so derived targets
  // no longer ship a wallach_stance. Per Luneth, a per-essential stance is re-authored
  // MANUALLY once every book is mined; this render (styling remembered) lights up the
  // moment a target carries wallach_stance again. Until then it renders nothing — the
  // clean sealed corpus claims below (corpusHTML) are the deep-dive's education.
  const wallachHTML = (summary !== undefined && summary.length > 0)
    ? `
      <div class="kd-essential-deep__sub">WALLACH SAYS</div>
      <p class="kd-essential-deep__body">${escHTML(summary)}</p>
      ${citation !== undefined ? `<div class="kd-essential-deep__source">CITED · <strong>${escHTML(citation)}</strong></div>` : ''}`
    : '';

  const sourcesHTML = renderEssentialSources(key);

  return `
    <div class="kd-essential-deep">
      <button class="kd-essential-deep__close" data-kd-action="essential-close" title="Close (Esc)">×</button>
      <header class="kd-essential-deep__head">
        <div class="kd-essential-deep__sym-row">
          <div class="kd-essential-deep__sym">${escHTML(e.symbol)}</div>
          <div class="kd-essential-deep__name-block">
            <h3 class="kd-essential-deep__name">${escHTML(e.key)}</h3>
            <div class="kd-essential-deep__cat">${escHTML(e.catLabel)}${e.ref !== '' ? ` · ${escHTML(e.ref)}` : ''}</div>
          </div>
        </div>
        <div class="kd-essential-deep__readout">
          <span class="kd-essential-deep__status-pill ${statusPillClass(status)}">● ${statusLabel(status)}</span>
          ${renderIntakeMeter(tileOf(snapshot, key), status)}
        </div>
      </header>
      ${e.essential ? '' : '<div class="kd-essential-deep__flag"><strong>NON-ESSENTIAL</strong> · the body can synthesize this, so it is not one of the 90. Shown for completeness — Youngevity includes it (Ultimate EFA Plus) for cardiovascular balance + optimal absorption.</div>'}
      ${renderOmegaClarity(e.key)}
      ${wallachHTML}
      ${corpusHTML}
      ${sourcesHTML}
    </div>`;
}

function renderEssentialsTab(snapshot: CoverageSnapshot | null, selectedKey: string | null): string {
  const deepHTML = selectedKey !== null ? renderEssentialDeep(selectedKey, snapshot) : '';
  const groupsHTML = ESS_GROUPS.map((group) => {
    const tilesHTML = group.items.map((e) => {
      const status = statusOf(snapshot, e.key);
      const stateClass = e.essential ? statusTileClass(status) : 'kd-essential-tile--bonus';
      const cls = `kd-essential-tile ${stateClass}${e.key === selectedKey ? ' is-selected' : ''}`.trim();
      const meta = e.essential
        ? `${escHTML(e.catLabel)} · ${statusLabel(status)}`
        : `${escHTML(e.catLabel)} · NON-ESSENTIAL`;
      return `
        <div class="${cls}" data-kd-essential="${escHTML(e.key)}" role="button" tabindex="0">
          <div class="kd-essential-tile__sym">${escHTML(e.symbol)}</div>
          <div class="kd-essential-tile__name">${escHTML(e.name)}</div>
          <div class="kd-essential-tile__meta">${meta}</div>
        </div>`;
    }).join('');
    const essentialN = group.items.filter(i => i.essential).length;
    const bonusN = group.items.length - essentialN;
    return `
      <div class="kd-section-head">${escHTML(group.title)} · ${essentialN}${bonusN > 0 ? ` + ${bonusN}` : ''}</div>
      <div class="kd-essentials-grid">${tilesHTML}</div>`;
  }).join('');

  return `${deepHTML}${groupsHTML}`;
}

/**
 * Compose a card's enforcement line from its REAL gate/hook names — never a
 * hand-typed citation (R3): "ENFORCED BY <gate> · <gate> · <tier>". This is the
 * app-doctrine analogue of composing a book cite from book_id.
 */
function doctrineCite(d: DoctrineCard): string {
  return `ENFORCED BY ${[...d.enforced_by, d.tier].join(' · ')}`;
}

function renderDoctrineTab(): string {
  return DOCTRINES.map(d => `
    <div class="kd-doctrine-card${d.featured ? ' featured' : ''}">
      <div class="kd-doctrine-card__id">${escHTML(d.id)}${d.featured ? ' · CORNERSTONE' : ''}</div>
      <h4 class="kd-doctrine-card__title">${escHTML(d.title)}</h4>
      <p class="kd-doctrine-card__body">${escHTML(d.body)}</p>
      <div class="kd-doctrine-card__cite">${escHTML(doctrineCite(d))}</div>
    </div>`).join('');
}

function renderTab(tab: Tab, snapshot: CoverageSnapshot | null, selectedKey: string | null, selectedCondition: string | null, selectedBook: string | null, selectedProduct: string | null): string {
  switch (tab) {
    case 'corpus': return renderCorpusTab(selectedBook);
    case 'essentials': return renderEssentialsTab(snapshot, selectedKey);
    case 'conditions': return renderConditionsTab(selectedCondition);
    case 'products': return renderProductsTab(selectedProduct);
    case 'doctrine': return renderDoctrineTab();
  }
}

function renderShell(activeTab: Tab, selectedKey: string | null, selectedCondition: string | null, selectedBook: string | null, selectedProduct: string | null): string {
  const snapshot = getOrCompute();
  const productsCount = productCount();
  const tabs = [
    { id: 'corpus' as Tab, label: 'Corpus', count: `${listBooks().length} BOOKS` },
    { id: 'essentials' as Tab, label: 'Essentials', count: `${ESS_ESSENTIAL_COUNT} ESSENTIAL` },
    { id: 'conditions' as Tab, label: 'Conditions', count: `${listConditions().length} INDEXED` },
    { id: 'products' as Tab, label: 'Products', count: `${productsCount} KNOWN` },
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
        <div class="kd-sub">// the corpus, the essentials, the conditions, the products, the doctrine</div>
      </div>
      <button class="kd-close" data-kd-action="close" title="Close (Esc)">×</button>
    </header>
    <div class="kd-tabs">${tabsHTML}</div>
    <div class="kd-search">
      <span class="kd-search-icon">⌕</span>
      <input class="kd-search-input" type="text" placeholder="SEARCH ${activeTab.toUpperCase()}…" />
      <button class="kd-search-clear" data-kd-action="search-clear" type="button" aria-label="Clear search" title="Clear search">×</button>
      <span class="kd-search-kbd">/</span>
    </div>
    <div class="kd-body">${renderTab(activeTab, snapshot, selectedKey, selectedCondition, selectedBook, selectedProduct)}</div>
    <footer class="kd-footer">
      <button class="kd-action" data-kd-action="pin"><span class="kd-action__glyph">⊕</span>PIN</button>
      <button class="kd-action" data-kd-action="share"><span class="kd-action__glyph">↗</span>SHARE</button>
      <button class="kd-action" data-kd-action="cite"><span class="kd-action__glyph">⌑</span>CITE</button>
      <span class="kd-action__spacer"></span>
      <button class="kd-action kd-action--expand" data-kd-action="expand"><span class="kd-action__glyph">⤢</span>EXPAND</button>
    </footer>`;
}

// ─── Search (per-tab DOM filter) ──────────────────────────────

/**
 * Per active tab, the selector for the list items the search box filters. The
 * tabs render different item shapes (book rows / essential tiles / condition
 * rows / product rows / doctrine cards), so the query targets each by class.
 */
const KD_SEARCH_ITEM_SELECTOR: Record<Tab, string> = {
  corpus: '.kd-book-row',
  essentials: '.kd-essential-tile',
  conditions: '.kd-condition-row',
  products: '.kd-product-row',
  doctrine: '.kd-doctrine-card',
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
  body.querySelectorAll<HTMLElement>(`.kd-section-head, ${selector}`).forEach((node) => {
    if (node.classList.contains('kd-section-head')) {
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
  let isExpanded = false;
  let activeTab: Tab = 'corpus';
  let selectedEssential: string | null = null;
  let selectedCondition: string | null = null;
  let selectedBook: string | null = null;
  let selectedProduct: string | null = null;
  let searchQuery = '';

  const render = (): void => {
    container.innerHTML = renderShell(activeTab, selectedEssential, selectedCondition, selectedBook, selectedProduct);
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
    isExpanded = false;
    selectedEssential = null;
    selectedCondition = null;
    selectedBook = null;
    selectedProduct = null;
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
        selectedEssential = null;
        selectedCondition = null;
        selectedBook = null;
        selectedProduct = null;
        searchQuery = '';
        render();
      }
      return;
    }
    const essEl = target.closest<HTMLElement>('[data-kd-essential]');
    if (essEl !== null) {
      const k = essEl.getAttribute('data-kd-essential');
      selectedEssential = (k !== null && k === selectedEssential) ? null : k;
      render();
      return;
    }
    const condEl = target.closest<HTMLElement>('[data-kd-condition]');
    if (condEl !== null) {
      const k = condEl.getAttribute('data-kd-condition');
      selectedCondition = (k !== null && k === selectedCondition) ? null : k;
      render();
      return;
    }
    const bookEl = target.closest<HTMLElement>('[data-kd-book]');
    if (bookEl !== null) {
      const k = bookEl.getAttribute('data-kd-book');
      selectedBook = (k !== null && k === selectedBook) ? null : k;
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
      else if (action === 'expand') {
        toggleExpanded();
      }
      else if (action === 'essential-close') {
        selectedEssential = null;
        render();
      }
      else if (action === 'condition-close') {
        selectedCondition = null;
        render();
      }
      else if (action === 'book-close') {
        selectedBook = null;
        render();
      }
      else if (action === 'product-close') {
        selectedProduct = null;
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
    if (t === null || !t.classList.contains('kd-search-input')) {
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
    toggleExpanded,
    isOpen: () => isOpen,
  };
}
