/**
 * views/knowledge-products.ts — Youngevity product render helpers for Knowledge
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The Products surface of the Knowledge drawer: the Products-tab list (ALL
 * products, each clickable), the full product detail panel (renderProductDeep),
 * and the essentials-deep-dive "FOUND IN YGY VAULT" chips (productsForEssential).
 * Split out of views/knowledge.ts the way knowledge-corpus.ts is — the drawer
 * shell/tabs live there, product rendering here. Layer `views`: imports only
 * state/ + core/ (+ the generated data artifact).
 *
 * Reads the GENERATED product-detail-data.json (full label record + indicative
 * YGY listing price, derived from the sealed Products pillar) via esbuild JSON
 * import, Zod-validated at the boundary. DISPLAY ONLY (§00.A): composition is what
 * a product contains, price is a volatile listing — neither is a Wallach target.
 * Pure render, holds no state, escapes all text (escHTML; §00.B escape-by-default).
 * ═══════════════════════════════════════════════════════════════════════════
 */
import productDetailData from '../../../data/product-detail-data.json';
import {
  type ProductBlend,
  type ProductComponent,
  type ProductDetail,
  ProductDetailDataSchema,
  type ProductNutrientRow,
} from '../core/schemas/index.js';
import { getTargets } from '../state/coverage.js';
import { essentialSlugsByProduct, type RankedSource, rankSources } from '../state/recommender.js';

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

// ─── Data read (Zod-validated at the boundary) ─────────────────────────────

let cachedProducts: ProductDetail[] | null = null;
let cachedById: Map<string, ProductDetail> | null = null;

function ensureLoaded(): void {
  if (cachedProducts !== null) {
    return;
  }
  const parsed = ProductDetailDataSchema.safeParse(productDetailData);
  const list: ProductDetail[] = parsed.success ? Object.values(parsed.data.products) : [];
  list.sort((a, b) => a.name.localeCompare(b.name));
  cachedProducts = list;
  cachedById = new Map(list.map(p => [p.product_id, p]));
}

function listProducts(): ProductDetail[] {
  ensureLoaded();
  return cachedProducts ?? [];
}

function getProduct(id: string): ProductDetail | null {
  ensureLoaded();
  return cachedById?.get(id) ?? null;
}

/** Number of products in the vault — the Products-tab count. */
export function productCount(): number {
  return listProducts().length;
}

// ─── Formatting helpers ────────────────────────────────────────────────────

function fmtAmt(a: number | string | null | undefined): string {
  return a === undefined || a === null ? '' : String(a);
}

function fmtMoney(n: number): string {
  return n.toFixed(2);
}

/** Compact amount: drop trailing zeros (200 not 200.0000, 787.5 kept), cap at 2 dp. */
function fmtNum(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** Count of quantified nutrient rows across a product's components (list meta). */
function countNutrients(p: ProductDetail): number {
  return p.components.reduce((s, c) => s + (c.nutrients?.length ?? 0), 0);
}

// ─── Products tab (list ALL + deep-dive above when selected) ───────────────

/**
 * Hidden keyword blob for the Products-tab search (read by applyKnowledgeSearch via the
 * row's data-search). Two unioned sources: (1) the CANONICAL essentials the product
 * delivers — from the recommender index, so trace minerals carried THROUGH a blend
 * (boron, vanadium …) match even though they never print on the label; (2) the raw label
 * ingredients — nutrient rows, blend names + as-labeled botanicals, and other ingredients —
 * so herbs / fruits / probiotics ("reishi", "lactobacillus") match too. Slug hyphens are
 * spaced so "vitamin-b12" also answers "b12" and "vitamin b12".
 */
function productSearchBlob(p: ProductDetail): string {
  const parts: string[] = [p.name];
  for (const slug of essentialSlugsByProduct().get(p.product_id) ?? []) {
    parts.push(slug, slug.replace(/-/g, ' '));
  }
  for (const c of p.components) {
    for (const nut of c.nutrients ?? []) {
      parts.push(nut.name);
    }
    for (const b of c.blends ?? []) {
      if (b.name !== undefined && b.name.length > 0) {
        parts.push(b.name);
      }
      if (b.as_labeled !== undefined && b.as_labeled.length > 0) {
        parts.push(b.as_labeled);
      }
    }
    if (c.other_ingredients !== undefined && c.other_ingredients.length > 0) {
      parts.push(c.other_ingredients.join(' '));
    }
  }
  return parts.join(' ');
}

function renderProductRow(p: ProductDetail, selected: string | null): string {
  const cls = `kd-product-row${p.product_id === selected ? ' is-selected' : ''}`;
  const n = countNutrients(p);
  const price = (p.price != null && p.price.wholesale != null)
    ? `$${fmtMoney(p.price.wholesale)}`
    : (p.price != null && p.price.retail != null ? `$${fmtMoney(p.price.retail)}` : '');
  const meta = [`${n} NUTRIENT${n === 1 ? '' : 'S'}`, price].filter(s => s.length > 0).join(' · ');
  return `
    <div class="${cls}" data-kd-product="${escHTML(p.product_id)}" data-search="${escHTML(productSearchBlob(p))}" role="button" tabindex="0">
      <div class="kd-product-row__icon">${escHTML(p.name.charAt(0).toUpperCase())}</div>
      <div class="kd-product-row__body">
        <h4 class="kd-product-row__name">${escHTML(p.name)}</h4>
        <div class="kd-product-row__meta">${escHTML(meta)}</div>
      </div>
      <span class="kd-product-row__verdict kd-product-row__verdict--ok">VIEW</span>
    </div>`;
}

export function renderProductsTab(selectedProduct: string | null): string {
  const products = listProducts();
  if (products.length === 0) {
    return '<div class="kd-empty">— no products loaded —</div>';
  }
  const deepHTML = selectedProduct !== null ? renderProductDeep(selectedProduct) : '';
  const rowsHTML = products.map(p => renderProductRow(p, selectedProduct)).join('');
  return `
    ${deepHTML}
    <div class="kd-section-head">PRODUCTS · ${products.length} · YOUNGEVITY</div>
    ${rowsHTML}`;
}

// ─── Product detail panel ──────────────────────────────────────────────────

function renderPrice(price: ProductDetail['price']): string {
  if (price === null || price === undefined) {
    return '';
  }
  const items: string[] = [];
  if (price.wholesale !== null && price.wholesale !== undefined) {
    items.push(`<span class="kd-product-deep__price-item"><span class="kd-product-deep__price-label">WHOLESALE</span> $${fmtMoney(price.wholesale)}</span>`);
  }
  if (price.retail !== null && price.retail !== undefined) {
    items.push(`<span class="kd-product-deep__price-item"><span class="kd-product-deep__price-label">RETAIL</span> $${fmtMoney(price.retail)}</span>`);
  }
  if (items.length === 0) {
    return '';
  }
  return `<div class="kd-product-deep__price">${items.join('')}<small class="kd-product-deep__price-note">indicative YGY listing</small></div>`;
}

function renderMacros(macros: ProductComponent['macros']): string {
  if (macros === undefined || macros === null) {
    return '';
  }
  const bits: string[] = [];
  for (const [key, val] of Object.entries(macros)) {
    if (val === null || typeof val !== 'object') {
      continue;
    }
    const amount = (val as { amount?: unknown }).amount;
    const unit = (val as { unit?: unknown }).unit;
    if (amount === null || amount === undefined) {
      continue;
    }
    const u = typeof unit === 'string' ? ` ${unit}` : '';
    bits.push(`${escHTML(key.replace(/_/g, ' '))}: ${escHTML(String(amount))}${escHTML(u)}`);
  }
  return bits.length > 0 ? `<div class="kd-product-comp__macros">${bits.join(' · ')}</div>` : '';
}

function renderNutrients(nutrients: ProductNutrientRow[] | undefined): string {
  if (nutrients === undefined || nutrients.length === 0) {
    return '';
  }
  const rows = nutrients.map((n) => {
    const amt = fmtAmt(n.amount);
    const unit = (n.unit !== null && n.unit !== undefined && n.unit.length > 0) ? ` ${escHTML(n.unit)}` : '';
    const form = (n.form !== undefined && n.form.length > 0) ? ` <span class="kd-product-nut__form">${escHTML(n.form)}</span>` : '';
    const dvRaw = n.pct_dv;
    const dv = (dvRaw !== null && dvRaw !== undefined && String(dvRaw).length > 0)
      ? `<span class="kd-product-nut__dv">${escHTML(String(dvRaw))}% DV</span>`
      : '';
    const amtHTML = amt.length > 0 ? `${escHTML(amt)}${unit}` : '';
    return `
      <div class="kd-product-nut">
        <span class="kd-product-nut__name">${escHTML(n.name)}${form}</span>
        <span class="kd-product-nut__amt">${amtHTML}${dv}</span>
      </div>`;
  }).join('');
  return `<div class="kd-product-comp__sub">SUPPLEMENT FACTS</div><div class="kd-product-nuts">${rows}</div>`;
}

function renderBlends(blends: ProductBlend[] | undefined): string {
  if (blends === undefined || blends.length === 0) {
    return '';
  }
  const items = blends.map((b) => {
    const name = (b.name !== undefined && b.name.length > 0) ? escHTML(b.name) : 'Proprietary Blend';
    const total = (b.total != null && b.total.amount != null)
      ? ` · ${escHTML(fmtAmt(b.total.amount))}${b.total.unit != null ? ` ${escHTML(b.total.unit)}` : ''}`
      : '';
    const cfu = (b.total_cfu != null && b.total_cfu.amount != null)
      ? ` · ${escHTML(fmtAmt(b.total_cfu.amount))}${b.total_cfu.unit != null ? ` ${escHTML(b.total_cfu.unit)}` : ''}`
      : '';
    const labeled = (b.as_labeled !== undefined && b.as_labeled.length > 0)
      ? `<div class="kd-product-blend__labeled">${escHTML(b.as_labeled)}</div>`
      : '';
    return `
      <div class="kd-product-blend">
        <div class="kd-product-blend__head">${name}${total}${cfu}</div>
        ${labeled}
      </div>`;
  }).join('');
  return `<div class="kd-product-comp__sub">BLENDS</div>${items}`;
}

function renderComponent(c: ProductComponent, idx: number, total: number): string {
  const label = total > 1
    ? `<div class="kd-product-comp__label">${escHTML((c.role ?? c.form ?? `Part ${idx + 1}`).toUpperCase())}</div>`
    : '';
  const servingBits: string[] = [];
  if (c.serving_size !== undefined && c.serving_size.length > 0) {
    servingBits.push(`SERVING · ${escHTML(c.serving_size)}`);
  }
  if (c.servings_per_container !== null && c.servings_per_container !== undefined) {
    servingBits.push(`${escHTML(String(c.servings_per_container))} PER CONTAINER`);
  }
  const serving = servingBits.length > 0 ? `<div class="kd-product-comp__meta">${servingBits.join(' · ')}</div>` : '';
  const directions = (c.directions !== undefined && c.directions.length > 0)
    ? `<p class="kd-product-comp__directions"><strong>Directions</strong> · ${escHTML(c.directions)}</p>`
    : '';
  const other = (c.other_ingredients !== undefined && c.other_ingredients.length > 0)
    ? `<div class="kd-product-comp__other"><span class="kd-product-comp__other-label">OTHER INGREDIENTS</span> ${escHTML(c.other_ingredients.join(', '))}</div>`
    : '';
  return `
    <div class="kd-product-comp">
      ${label}${serving}${directions}${renderMacros(c.macros)}${renderNutrients(c.nutrients)}${renderBlends(c.blends)}${other}
    </div>`;
}

export function renderProductDeep(id: string): string {
  const p = getProduct(id);
  if (p === null) {
    return '';
  }
  const sku = (p.sku !== undefined && p.sku.length > 0) ? ` · SKU ${escHTML(p.sku)}` : '';
  const compsHTML = p.components.map((c, i) => renderComponent(c, i, p.components.length)).join('');
  return `
    <div class="kd-essential-deep kd-product-deep">
      <button class="kd-essential-deep__close" data-kd-action="product-close" title="Close (Esc)">×</button>
      <header class="kd-essential-deep__head">
        <div class="kd-essential-deep__name-block">
          <h3 class="kd-essential-deep__name">${escHTML(p.name)}</h3>
          <div class="kd-essential-deep__cat">YOUNGEVITY PRODUCT${sku}</div>
        </div>
      </header>
      ${renderPrice(p.price)}
      ${compsHTML}
      <div class="kd-corpus__foot">SOURCE · Youngevity product label · composition + indicative listing price (§00.A · never a Wallach target)</div>
    </div>`;
}

// ─── Essentials deep-dive: BEST SOURCES (the cost-per-nutrient recommender) ──

export interface RankedSourceRow extends RankedSource {
  /** Product display name, joined from the display record. */
  name: string;
}

/**
 * Numeric Wallach maintenance amount from a target's (unknown-typed) blob, or null.
 * Today every target is an honest gap (no `low`), so this returns null and the ranker
 * uses the amount-potency proxy; the moment dose-mining fills a `low`, adequacy lights up.
 */
function targetLowOf(target: unknown): number | null {
  if (target !== null && typeof target === 'object' && 'low' in target) {
    const low = (target as { low?: unknown }).low;
    if (typeof low === 'number' && low > 0) {
      return low;
    }
  }
  return null;
}

/**
 * `target.low`'s unit. MUST travel with the number into rankSources: the Wallach target's
 * unit and the Youngevity candidates' unit genuinely disagree on boron (mg vs mcg) and
 * silver (mcg vs mg), and passing the amount alone made the ranker divide mg by mcg.
 * Returning null is safe by construction — rankSources then falls back to the potency
 * proxy rather than guessing the units match.
 */
function targetUnitOf(target: unknown): string | null {
  if (target !== null && typeof target === 'object' && 'unit' in target) {
    const unit = (target as { unit?: unknown }).unit;
    if (typeof unit === 'string' && unit.length > 0) {
      return unit;
    }
  }
  return null;
}

/**
 * The vault products that deliver essential `key`, RANKED best-first by the match score
 * (state/recommender.rankSources), with each product's display name joined in. `key` is
 * the deep-dive layout name; its canon slug + any Wallach target come from getTargets.
 */
export function rankedSourcesForEssential(key: string): RankedSourceRow[] {
  const target = getTargets().find(e => e.name === key);
  if (target === undefined) {
    return [];
  }
  return rankSources(target.slug, targetLowOf(target.target), targetUnitOf(target.target))
    .map(r => ({ ...r, name: getProduct(r.productId)?.name ?? r.productId }));
}

/**
 * One ranked source row — clickable (data-kd-product) to the product detail panel.
 * `isExtra` rows (rank > the shown top-N) carry kd-source--extra and stay hidden until
 * the "show more" expander toggles .is-expanded on the list.
 */
function renderSourceRow(s: RankedSourceRow, rank: number, isExtra: boolean): string {
  const amt = `${fmtNum(s.amount)} ${escHTML(s.unit)}`;
  const price = s.price !== null ? `$${fmtMoney(s.price)}` : '—';
  const breadth = `${s.breadth} NUTRIENT${s.breadth === 1 ? '' : 'S'}`;
  const cls = `kd-source${isExtra ? ' kd-source--extra' : ''}`;
  return `
    <div class="${cls}" data-kd-product="${escHTML(s.productId)}" role="button" tabindex="0">
      <span class="kd-source__rank">${rank}</span>
      <span class="kd-source__body">
        <span class="kd-source__name">${escHTML(s.name)}</span>
        <span class="kd-source__meta">${escHTML(breadth)} · ${price}</span>
      </span>
      <span class="kd-source__amt">${escHTML(amt)}</span>
    </div>`;
}

/**
 * The "BEST SOURCES" block for the essentials deep-dive — the ranked vault products that
 * deliver the essential (top-N + an overflow line). Returns '' when nothing delivers it.
 * Shows the honest-gap note until a Wallach target exists (then the keystone is real
 * saturating adequacy, not the amount-potency proxy).
 */
export function renderEssentialSources(key: string): string {
  const sources = rankedSourcesForEssential(key);
  if (sources.length === 0) {
    return '';
  }
  const TOP = 8;
  // Render EVERY ranked source; the overflow rows carry kd-source--extra and stay hidden
  // by CSS until the expander toggles .is-expanded on the list — a pure DOM toggle in
  // views/knowledge.ts, so the open deep-dive + scroll position survive the click.
  const rows = sources.map((s, i) => renderSourceRow(s, i + 1, i >= TOP)).join('');
  const extra = sources.length - TOP;
  const more = extra > 0
    ? `<button class="kd-source-more" data-kd-action="sources-more" data-count="${extra}" aria-expanded="false" type="button">
        <span class="kd-source-more__label">Show ${extra} more source${extra === 1 ? '' : 's'} in the vault</span>
        <span class="kd-source-more__chev" aria-hidden="true">▾</span>
      </button>`
    : '';
  const note = sources[0]?.adequacyIsTarget === true
    ? ''
    : '<div class="kd-source-note">Ranked by amount delivered · breadth · value. The <em>enough-vs-your-target</em> adequacy step activates once Wallach dose targets are mined.</div>';
  return `
    <div class="kd-essential-deep__sub">BEST SOURCES · YGY VAULT</div>
    <div class="kd-sources">${rows}</div>
    ${more}
    ${note}`;
}
