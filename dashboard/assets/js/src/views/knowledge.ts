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
import { on as onEvent } from '../core/events.js';
import {
  type CorpusBook,
  type CorpusClaim,
  type CorpusEssential,
  type CorpusPlannedBook,
  CoverageLayoutSchema,
  type LayoutSection,
  type LayoutTile,
  type ProductEntry,
  ProductEntrySchema,
  ProductsLookupSchema,
} from '../core/schemas/index.js';
import {
  conditionDisplayName,
  essentialDisplayName,
  getBookLabel,
  getEssentialByLayoutKey,
  listBooks,
  listPlannedBooks,
  resolveClaims,
} from '../state/corpus.js';
import {
  type CoverageSnapshot,
  type CoverageStatus,
  getOrCompute,
  getTargets,
  matchEssential,
} from '../state/coverage.js';

export interface DrawerHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleExpanded: () => void;
  isOpen: () => boolean;
}

type Tab = 'corpus' | 'essentials' | 'products' | 'doctrine';

// ─── Data readers — Zod-validated at the parse boundary ───────────────────

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

// Doctrines — small, stable curated cards; doesn't warrant LS or a fetch.
// (Books are NOT hard-coded: the Corpus tab is driven by the sealed corpus via
//  state/corpus.ts — listBooks() = in-housed books-meta + REAL per-book claim
//  counts; listPlannedBooks() = the books-roadmap 'coming soon' set. No fabricated
//  cite totals ever — §00.A/anti-fakery.)
const DOCTRINES = [
  { id: 'DOCT·01', title: 'Source-Rule · Wallach Primary Only', featured: true, body: 'Every numeric target, dose recommendation, deficiency indicator, or health claim displayed by this system must cite a primary source from the Wallach corpus or the YGY product allowlist. No exceptions, including the user.', cite: 'ENFORCED BY check_no_unsourced_claims · invariant tier · critical' },
  { id: 'DOCT·02', title: 'Aggregate-Vehicle Coverage (PDM)', featured: false, body: 'Plant-derived minerals are defined by sourcing, not by amounts. If a plant-derived mineral aggregate is present in a product, every trace mineral in that aggregate is considered covered — binary, not graduated.', cite: 'CITED · Dead Doctors Don\'t Lie · ch. 4' },
  { id: 'DOCT·03', title: 'BTT Layering Order', featured: false, body: 'Beyond Tangy Tangerine is the foundational morning layer — vitamins, aminos, foundational minerals. Stack PDM on top for the rare-trace closure. Add EFA Plus for fatty acids. Order matters for absorption.', cite: 'CITED · Wallach lecture corpus · YGY protocol guide' },
  { id: 'DOCT·04', title: 'Trace Minerals: Source-Not-Quantity', featured: false, body: 'For the 35 rare trace minerals, presence in a plant-derived vehicle is the qualifying criterion. Mass-spec verification of every trace amount is unnecessary if the source is doctrinally sound.', cite: 'CITED · Rare Earths · ch. 9' },
  { id: 'DOCT·05', title: 'Atomic LS Write Discipline (§17)', featured: false, body: 'Every regimen LS write goes through a verified round-trip set → re-read → reject-on-mismatch loop. Silent truncations from the Edit tool taught us this. Writes that cannot confirm fail loudly.', cite: 'PROVED · Round 73 lessons + 9 truncation incidents' },
  { id: 'DOCT·06', title: '§31 Chokepoint Discipline (Cross-Surface Sync)', featured: false, body: 'Every regimen mutation flows through one of 5 named chokepoint helpers. Each fires triggerRegimenRerender so all subscribed surfaces re-render. State drift is structurally impossible by module design, not vigilance.', cite: 'CITED · Round 150 doctrine · enforced by check_regimen_state_mutation_routing' },
  { id: 'DOCT·07', title: 'Eden Sealed-Canonical (User-Only-Writer)', featured: false, body: 'Sealed canonical files (design-system.css, eden corpus) carry hash anchors. Agent reads freely, never writes after sealing time. Drift is detected at startup; reads from drifted files fail loudly.', cite: 'CITED · Round 157 · enforced by eden_hash_integrity + write_protection invariants' },
];

// ─── Essentials layout (shared with the Coverage periodic table) ───────────

const LAYOUT = CoverageLayoutSchema.parse(coverageLayoutData);

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

/** Vault products that carry this essential — resolved via the canonical matcher. */
function vaultProductsFor(key: string): string[] {
  const out: string[] = [];
  for (const p of readProducts()) {
    const nutrients = p.nutrients ?? [];
    const carries = nutrients.some((n) => {
      if (typeof n !== 'object' || n === null) {
        return false;
      }
      const nm = (n as { name?: unknown }).name;
      return typeof nm === 'string' && matchEssential(nm)?.name === key;
    });
    if (carries) {
      const nm = p.canonical_name ?? p.name;
      if (typeof nm === 'string' && nm.length > 0) {
        out.push(nm);
      }
    }
    if (out.length >= 8) {
      break;
    }
  }
  return out;
}

// ─── Render helpers ────────────────────────────────────────────────────────

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

function hexSerial(seed: number): string {
  return ((seed * 0x9E3779B9) >>> 0).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
}

// ─── Tab renderers ─────────────────────────────────────────────────────────

/** "WALLACH" / "WALLACH ET AL" — primary author surname + et-al marker. */
function authorLabel(authors: string[] | undefined): string {
  if (authors === undefined || authors.length === 0) {
    return 'WALLACH';
  }
  const first = authors[0] ?? '';
  const parts = first.trim().split(/\s+/);
  const surname = parts.length > 0 ? (parts[parts.length - 1] ?? first) : first;
  return authors.length > 1 ? `${surname.toUpperCase()} ET AL` : surname.toUpperCase();
}

/** The count cell: real claim total, or a muted 'queued' for un-mined in-housed books. */
function bookCountHTML(n: number): string {
  if (n > 0) {
    return `${n}<small>claims</small>`;
  }
  return '<span class="kd-book-row__count--queued">⋯</span><small>queued</small>';
}

/** One in-housed book row — driven by books-meta + REAL per-book claim_count. */
function renderBookRow(b: CorpusBook): string {
  const ed = (b.edition !== undefined && b.edition !== null && b.edition.length > 0) ? `${escHTML(b.edition)} ED · ` : '';
  const yr = (b.year !== undefined && b.year !== null) ? escHTML(String(b.year)) : '';
  return `
    <div class="kd-book-row">
      <div class="kd-book-row__spine"><span>${escHTML(b.code ?? '')}</span></div>
      <div class="kd-book-row__body">
        <h4 class="kd-book-row__title">${escHTML(b.title)}</h4>
        <div class="kd-book-row__meta">${escHTML(authorLabel(b.authors))} · ${ed}${yr}</div>
      </div>
      <div class="kd-book-row__count">${bookCountHTML(b.claim_count ?? 0)}</div>
    </div>`;
}

/** One planned ('coming soon') book row — grayed/dashed, not yet in-housed. */
function renderPlannedRow(b: CorpusPlannedBook): string {
  return `
    <div class="kd-book-row kd-book-row--planned">
      <div class="kd-book-row__spine"><span>${escHTML(b.code ?? '')}</span></div>
      <div class="kd-book-row__body">
        <h4 class="kd-book-row__title">${escHTML(b.title)}</h4>
        <div class="kd-book-row__meta">${escHTML(authorLabel(b.authors))} · COMING SOON</div>
      </div>
      <div class="kd-book-row__count kd-book-row__count--soon">—<small>soon</small></div>
    </div>`;
}

function renderCorpusTab(): string {
  const books = listBooks();
  const planned = listPlannedBooks();
  const totalClaims = books.reduce((s, b) => s + (b.claim_count ?? 0), 0);
  const booksHTML = books.map(b => renderBookRow(b)).join('');
  const plannedHTML = planned.length > 0
    ? `<div class="kd-section-head">COMING SOON · ACQUIRING</div>${planned.map(p => renderPlannedRow(p)).join('')}`
    : '';

  return `
    <div class="kd-featured-citation">
      <div class="kd-featured-citation__eyebrow"><span class="pulse-dot"></span>SOURCE-RULE CORNERSTONE</div>
      <p class="kd-featured-citation__quote">The body needs 60 minerals, 16 vitamins, 12 amino acids, and 2 essential fatty acids — 90 essentials total. Plant-derived minerals are the only delivery vehicle that the body absorbs as nature intended.</p>
      <div class="kd-featured-citation__attr"><strong>Wallach</strong> · Dead Doctors Don\'t Lie · ch. 1 · paraphrase per primary corpus</div>
    </div>
    <div class="kd-section-head">PRIMARY CORPUS · WALLACH · ${books.length} BOOKS · ${totalClaims} CLAIMS</div>
    ${booksHTML}
    ${plannedHTML}`;
}

// ─── Corpus deep-dive (the sealed Wallach claim graph) ─────────────────────

/** Most-salient claim kinds first; the rest fall after, alphabetically. */
const CORPUS_KIND_PRIORITY = ['deficiency_sign', 'dose', 'protocol', 'mechanism', 'prognosis'];

/** A claim kind slug → an uppercase human label (no literal map — §00.B). */
function corpusKindLabel(kind: string): string {
  return kind.replace(/[_-]+/g, ' ').toUpperCase();
}

/** Priority-then-alphabetical ordering for the claim-kind groups. */
function corpusKindOrder(a: string, b: string): number {
  const ia = CORPUS_KIND_PRIORITY.indexOf(a);
  const ib = CORPUS_KIND_PRIORITY.indexOf(b);
  const ra = ia === -1 ? CORPUS_KIND_PRIORITY.length : ia;
  const rb = ib === -1 ? CORPUS_KIND_PRIORITY.length : ib;
  return ra !== rb ? ra - rb : (a < b ? -1 : a > b ? 1 : 0);
}

/** Collapse a book verbatim's hard line-wraps into one clean line. */
function collapseWS(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** A short "50 mg / daily" dose label, or '' when no structured dose. */
function formatDose(dose: CorpusClaim['dose']): string {
  if (dose === null || dose === undefined) {
    return '';
  }
  const amount = (typeof dose.amount === 'number' || typeof dose.amount === 'string') ? String(dose.amount) : '';
  const unit = typeof dose.unit === 'string' ? dose.unit : '';
  const period = typeof dose.period === 'string' ? dose.period : '';
  const head = [amount, unit].filter(s => s.length > 0).join(' ');
  if (head.length === 0) {
    return '';
  }
  return period.length > 0 ? `${head} / ${period}` : head;
}

/** One corpus claim: paraphrase + optional dose + verbatim source + citation. */
function renderCorpusClaim(claim: CorpusClaim): string {
  const dose = formatDose(claim.dose);
  return `
    <div class="kd-claim">
      <p class="kd-claim__text">${escHTML(claim.claim_text)}</p>
      ${dose.length > 0 ? `<div class="kd-claim__dose">${escHTML(dose)}</div>` : ''}
      <blockquote class="kd-claim__verbatim">${escHTML(collapseWS(claim.verbatim))}</blockquote>
      <div class="kd-claim__cite">CITED · ${escHTML(getBookLabel(claim.book))}</div>
    </div>`;
}

/** The full "FROM THE CORPUS" block for one essential. */
function renderCorpusForEssential(c: CorpusEssential): string {
  if (c.claim_count === 0) {
    return `
      <div class="kd-corpus">
        <div class="kd-corpus__head"><span class="kd-corpus__eyebrow"><span class="pulse-dot"></span>FROM THE WALLACH CORPUS</span></div>
        <p class="kd-corpus__empty">— no sealed claims extracted for this essential yet · the corpus is still being built out —</p>
      </div>`;
  }
  const groupsHTML = Object.keys(c.claims_by_kind).sort(corpusKindOrder).map((kind) => {
    const ids = c.claims_by_kind[kind] ?? [];
    const claimsHTML = resolveClaims(ids).map(renderCorpusClaim).join('');
    return `
      <div class="kd-corpus__group">
        <div class="kd-corpus__group-label">${escHTML(corpusKindLabel(kind))}</div>
        ${claimsHTML}
      </div>`;
  }).join('');

  const condChips = c.conditions_treated
    .map(s => `<span class="kd-corpus__chip">${escHTML(conditionDisplayName(s))}</span>`)
    .join('');
  const interactChips = c.interacts_with
    .map(s => `<span class="kd-corpus__chip kd-corpus__chip--ess">${escHTML(essentialDisplayName(s))}</span>`)
    .join('');
  const books = c.books_cited.map(b => getBookLabel(b)).join(' · ');

  return `
    <div class="kd-corpus">
      <div class="kd-corpus__head">
        <span class="kd-corpus__eyebrow"><span class="pulse-dot"></span>FROM THE WALLACH CORPUS</span>
        <span class="kd-corpus__count">${c.claim_count} CLAIM${c.claim_count === 1 ? '' : 'S'}</span>
      </div>
      ${condChips.length > 0 ? `<div class="kd-corpus__sub">IMPLICATED CONDITIONS</div><div class="kd-corpus__chips">${condChips}</div>` : ''}
      ${interactChips.length > 0 ? `<div class="kd-corpus__sub">WORKS ALONGSIDE</div><div class="kd-corpus__chips">${interactChips}</div>` : ''}
      ${groupsHTML}
      <div class="kd-corpus__foot">SOURCE · ${escHTML(books)}</div>
    </div>`;
}

function renderEssentialDeep(key: string, snapshot: CoverageSnapshot | null): string {
  const e = ESS_BY_KEY.get(key);
  if (e === undefined) {
    return '';
  }
  const corpusEss = getEssentialByLayoutKey(key);
  const corpusHTML = corpusEss !== null ? renderCorpusForEssential(corpusEss) : '';
  const status = statusOf(snapshot, key);
  const target = getTargets().find(t => t.name === key);
  const stance = target?.wallach_stance;
  const quote = stance?.quote ?? stance?.stance;
  const citation = stance?.citation;
  const products = vaultProductsFor(key);

  const wallachHTML = (quote !== undefined && quote.length > 0)
    ? `
      <div class="kd-essential-deep__sub">WALLACH SAYS</div>
      <p class="kd-essential-deep__body">${escHTML(quote)}</p>
      ${citation !== undefined ? `<div class="kd-essential-deep__source">CITED · <strong>${escHTML(citation)}</strong></div>` : ''}`
    : '<div class="kd-essential-deep__sub">WALLACH SAYS</div><p class="kd-essential-deep__body">— no stance on file for this essential —</p>';

  const productsHTML = products.length > 0
    ? `
      <div class="kd-essential-deep__sub">FOUND IN YGY VAULT</div>
      <div class="kd-essential-deep__products">
        ${products.map(p => `<span class="kd-essential-deep__product-chip">${escHTML(p)}</span>`).join('')}
      </div>`
    : '';

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
        <span class="kd-essential-deep__status-pill ${statusPillClass(status)}">● ${statusLabel(status)}</span>
      </header>
      ${e.essential ? '' : '<div class="kd-essential-deep__flag"><strong>NON-ESSENTIAL</strong> · the body can synthesize this, so it is not one of the 90. Shown for completeness — Youngevity includes it (Ultimate EFA Plus) for cardiovascular balance + optimal absorption.</div>'}
      ${wallachHTML}
      ${corpusHTML}
      ${productsHTML}
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

function renderProductsTab(): string {
  const products = readProducts();
  if (products.length === 0) {
    return '<div class="kd-empty">— vault data not loaded · 59 known products live in regimen-label-lookup —</div>';
  }

  const productsHTML = products.slice(0, 30).map(p => `
    <div class="kd-product-row">
      <div class="kd-product-row__icon">${escHTML((p.canonical_name ?? p.name ?? '?').charAt(0).toUpperCase())}</div>
      <div class="kd-product-row__body">
        <h4 class="kd-product-row__name">${escHTML(p.canonical_name ?? p.name ?? '(unnamed)')}</h4>
        <div class="kd-product-row__meta">${escHTML(p.brand ?? 'YGY')} · ${(p.nutrients?.length ?? 0)} NUTRIENTS LISTED</div>
      </div>
      <span class="kd-product-row__verdict kd-product-row__verdict--ok">VAULT</span>
    </div>`).join('');

  return `
    <div class="kd-section-head">PRODUCTS VAULT · ${products.length} ENTRIES</div>
    ${productsHTML}
    ${products.length > 30 ? `<div class="kd-more">— + ${products.length - 30} more · scroll wired in polish pass —</div>` : ''}`;
}

function renderDoctrineTab(): string {
  return DOCTRINES.map(d => `
    <div class="kd-doctrine-card${d.featured ? ' featured' : ''}">
      <div class="kd-doctrine-card__id">${escHTML(d.id)}${d.featured ? ' · CORNERSTONE' : ''}</div>
      <h4 class="kd-doctrine-card__title">${escHTML(d.title)}</h4>
      <p class="kd-doctrine-card__body">${escHTML(d.body)}</p>
      <div class="kd-doctrine-card__cite">${escHTML(d.cite)}</div>
    </div>`).join('');
}

function renderTab(tab: Tab, snapshot: CoverageSnapshot | null, selectedKey: string | null): string {
  switch (tab) {
    case 'corpus': return renderCorpusTab();
    case 'essentials': return renderEssentialsTab(snapshot, selectedKey);
    case 'products': return renderProductsTab();
    case 'doctrine': return renderDoctrineTab();
  }
}

function renderShell(activeTab: Tab, selectedKey: string | null): string {
  const snapshot = getOrCompute();
  const productsCount = readProducts().length;
  const tabs = [
    { id: 'corpus' as Tab, label: 'Corpus', count: `${listBooks().length} BOOKS` },
    { id: 'essentials' as Tab, label: 'Essentials', count: `${ESS_ESSENTIAL_COUNT} ESSENTIAL` },
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
    <div class="kd-body">${renderTab(activeTab, snapshot, selectedKey)}</div>
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
  let selectedEssential: string | null = null;

  const render = (): void => {
    container.innerHTML = renderShell(activeTab, selectedEssential);
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
      else {
        console.warn('[views/knowledge] action stub:', action);
      }
    }
  };
  container.addEventListener('click', clickHandler);

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
