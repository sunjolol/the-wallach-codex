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
import { matchEssential } from '../state/coverage.js';

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

/**
 * The raw products map (unknown-typed) — used only by productsForEssential to
 * walk EVERY nutrient/ingredient/sub-ingredient name (levels the display schema
 * intentionally doesn't type). Display uses the validated ProductDetail above.
 */
const RAW_PRODUCTS: Record<string, unknown> = (() => {
  const root: unknown = productDetailData;
  if (root !== null && typeof root === 'object' && 'products' in root) {
    const p: unknown = root.products;
    if (p !== null && typeof p === 'object') {
      return p as Record<string, unknown>;
    }
  }
  return {};
})();

// ─── Formatting helpers ────────────────────────────────────────────────────

function fmtAmt(a: number | string | null | undefined): string {
  return a === undefined || a === null ? '' : String(a);
}

function fmtMoney(n: number): string {
  return n.toFixed(2);
}

/** Count of quantified nutrient rows across a product's components (list meta). */
function countNutrients(p: ProductDetail): number {
  return p.components.reduce((s, c) => s + (c.nutrients?.length ?? 0), 0);
}

// ─── Products tab (list ALL + deep-dive above when selected) ───────────────

function renderProductRow(p: ProductDetail, selected: string | null): string {
  const cls = `kd-product-row${p.product_id === selected ? ' is-selected' : ''}`;
  const n = countNutrients(p);
  const price = (p.price != null && p.price.retail != null) ? `$${fmtMoney(p.price.retail)}` : '';
  const meta = [`${n} NUTRIENT${n === 1 ? '' : 'S'}`, price].filter(s => s.length > 0).join(' · ');
  return `
    <div class="${cls}" data-kd-product="${escHTML(p.product_id)}" role="button" tabindex="0">
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
  if (price.retail !== null && price.retail !== undefined) {
    items.push(`<span class="kd-product-deep__price-item"><span class="kd-product-deep__price-label">RETAIL</span> $${fmtMoney(price.retail)}</span>`);
  }
  if (price.wholesale !== null && price.wholesale !== undefined) {
    items.push(`<span class="kd-product-deep__price-item"><span class="kd-product-deep__price-label">WHOLESALE</span> $${fmtMoney(price.wholesale)}</span>`);
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

// ─── Essentials deep-dive chips (products that carry an essential) ──────────

/**
 * Recursively collect every `name` string in a product subtree (nutrients, blend
 * ingredients, sub-ingredients) — the full set to resolve against.
 */
function collectNames(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    for (const el of node) {
      collectNames(el, out);
    }
    return;
  }
  if (node !== null && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'name' && typeof v === 'string') {
        out.add(v);
      }
      else {
        collectNames(v, out);
      }
    }
  }
}

/**
 * Products whose composition delivers `key` (a coverage essential name), resolved
 * via the SAME matcher the coverage classifier uses (state/coverage.matchEssential)
 * so the chips agree with the coverage math. Returns {id, name} so the chip can
 * link to the product detail panel. Capped at 12.
 */
export function productsForEssential(key: string): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = [];
  for (const p of listProducts()) {
    const names = new Set<string>();
    collectNames(RAW_PRODUCTS[p.product_id], names);
    let carries = false;
    for (const nm of names) {
      if (matchEssential(nm)?.name === key) {
        carries = true;
        break;
      }
    }
    if (carries) {
      out.push({ id: p.product_id, name: p.name });
    }
    if (out.length >= 12) {
      break;
    }
  }
  return out;
}
