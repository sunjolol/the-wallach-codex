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
import { getEssentialBySlug } from '../state/corpus.js';
import { essentialCount, getTargets } from '../state/coverage.js';
import { getEssentialPage } from '../state/entity-page.js';
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

export function getProduct(id: string): ProductDetail | null {
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

/**
 * Delivery-form family (bucketed from the ~26 raw label forms) — the Products tab's colour
 * axis, the product-native analog of a condition's body-system. Returns a lowercase key the
 * CSS maps to a colour via [data-form]; 'other' is the neutral fallback (no product hits it
 * today). Reads the FIRST component's form; multi-part products take their primary form.
 * `formFamilyFromForm` is exported so the ORAC "Best Supplement Sources" badges/bars colour-match
 * the product pages from the SAME map (single source, FORM_COLORS below).
 */
export function formFamilyFromForm(rawForm: string): string {
  const f = rawForm.toLowerCase();
  if (f.includes('powder') || f === 'stick') {
    return 'powder';
  }
  if (f.includes('tea')) {
    return 'tea';
  }
  if (f.includes('topical') || f.includes('cream')) {
    return 'topical';
  }
  if (f.includes('gummy') || f.includes('lozenge') || f.includes('chewable')) {
    return 'chewable';
  }
  if (f.includes('tablet') || f.includes('caplet')) {
    return 'tablet';
  }
  if (f.includes('capsule') || f.includes('softgel')) {
    return 'capsule';
  }
  if (f.includes('liquid') || f.includes('spray') || f.includes('shot') || f.includes('syrup') || f.includes('drops')) {
    return 'liquid';
  }
  return 'other';
}

function formFamily(p: ProductDetail): string {
  return formFamilyFromForm(p.components[0]?.form ?? '');
}

/**
 * How many of the 90 canonical essentials a product delivers — the card's ghost number.
 * Reads the recommender's UNfiltered product→essentials index (the same source the search
 * blob uses), so a trace mineral carried through a blend counts even when it never prints on
 * the label. Zero = a targeted formula (a botanical/adaptogen outside the 90), shown as such.
 */
function essentialsSupplied(p: ProductDetail): number {
  return essentialSlugsByProduct().get(p.product_id)?.length ?? 0;
}

/**
 * One product card — the "ghost number" design shared with the Conditions tab (Luneth-approved
 * 2026-07-22), adapted for products: the faded number is essentials-supplied (of 90) in the
 * delivery-form colour, the chip is the FORM, the foot carries wholesale price + servings. A
 * targeted formula (supplies none of the 90) drops the ghost and reads "targeted formula" so the
 * grid never shows a sad "0". Click opens the full label panel (renderProductDeep).
 */
function renderProductRow(p: ProductDetail, selected: string | null): string {
  const cls = `kd-product-row${p.product_id === selected ? ' is-selected' : ''}`;
  const fam = formFamily(p);
  const supplied = essentialsSupplied(p);
  const price = (p.price != null && p.price.wholesale != null)
    ? `$${fmtMoney(p.price.wholesale)}`
    : (p.price != null && p.price.retail != null ? `$${fmtMoney(p.price.retail)}` : '');
  const spc = p.components[0]?.servings_per_container;
  const serv = (spc !== null && spc !== undefined) ? `${spc} serving${spc === 1 ? '' : 's'}` : '';
  const lead = supplied > 0 ? `<b>of ${essentialCount()}</b> essentials` : 'targeted formula';
  const foot = [lead, price, serv].filter(s => s.length > 0).join(' · ');
  const ghost = supplied > 0 ? `<div class="kd-product-row__ghost" aria-hidden="true">${supplied}</div>` : '';
  return `
    <div class="${cls}" data-form="${fam}" data-kd-product="${escHTML(p.product_id)}" data-search="${escHTML(productSearchBlob(p))}" role="button" tabindex="0">
      ${ghost}
      <div class="kd-product-row__cat"><i></i>${escHTML(fam.toUpperCase())}</div>
      <h4 class="kd-product-row__name">${escHTML(p.name)}</h4>
      <div class="kd-product-row__foot">${foot}</div>
    </div>`;
}

/**
 * Products-tab order: most-comprehensive first (essentials supplied desc), targeted formulas
 * after, alphabetical within a tie — the coverage story leads, as the Conditions tab leads
 * with most-written-about. Presentation-only; listProducts stays A–Z for other readers.
 */
function productsByBreadth(products: ProductDetail[]): ProductDetail[] {
  return [...products].sort((a, b) =>
    essentialsSupplied(b) - essentialsSupplied(a)
    || a.name.localeCompare(b.name));
}

export function renderProductsTab(selectedProduct: string | null, fromProductsTab = true): string {
  const products = listProducts();
  if (products.length === 0) {
    return '<div class="kd-empty">— no products loaded —</div>';
  }
  const deepHTML = selectedProduct !== null ? renderProductDeep(selectedProduct, fromProductsTab) : '';
  const rowsHTML = productsByBreadth(products).map(p => renderProductRow(p, selectedProduct)).join('');
  return `
    ${deepHTML}
    <div class="kd-section-head">ALL ${products.length} PRODUCTS · SORTED BY ESSENTIALS SUPPLIED</div>
    <div class="kd-products-grid">${rowsHTML}</div>`;
}

// ─── Product detail panel (kd-ep entity page, delivery-form colour-coded) ────
//
// Rebuilt 2026-07-22 to the CONDITION-detail vocabulary (kd-ep-hero / seclabel /
// lede / pill / back) so a product opens as a full entity page with breadcrumbs —
// the demo's product-detail LAYOUT, restyled to the current type system and colour-
// coded by DELIVERY FORM the way the condition detail is coded by body-system
// category: the icon, the title, the card frame, and the scrollbar all take --form.
// "At a glance" is a high-impact Unbounded hero; the Supplement Facts table ports
// the demo faithfully (3-col label grid, macros, collapsible blends, other ingredients).

/**
 * Delivery-form → accent hex. The JS source of truth for a product's --form colour.
 * Mirrors the CSS card map (drawer-knowledge.css `.kd-product-row[data-form]`), kept in
 * sync by hand — the detail sets --form inline (as the condition detail sets --cat inline),
 * and the drawer scrollbar needs the hex in JS because a WebKit scrollbar pseudo can read
 * ONLY a root-level custom property, never the element-level --form. 'other' is intentionally
 * absent (no product hits it today): unmapped → no inline tint, scrollbar stays app-orange.
 */
export const FORM_COLORS: Record<string, string> = {
  liquid: '#3f8fa8',
  capsule: '#c08a3e',
  powder: '#5f8a4b',
  tablet: '#5a63a8',
  chewable: '#a8517f',
  tea: '#9a7b3c',
  topical: '#6a6f77',
};

/**
 * The drawer-scrollbar tint for a selected product (its delivery-form hex), or '' when the
 * form is unmapped. knowledge.ts publishes it on <html> as --kd-detail-scroll — the WebKit-
 * scrollbar bridge (a scrollbar pseudo reads only root-level custom props).
 */
export function productScrollTint(id: string): string {
  const p = getProduct(id);
  return p !== null ? FORM_COLORS[formFamily(p)] ?? '' : '';
}

/** Normalise a nutrient/essential name for matching a label row back to a canon essential. */
function normNutrientName(s: string): string {
  return s.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * A B-vitamin's number token (b1..b12) from a normalised name, or null. Lets a label row that
 * prints a common name ("Thiamin") match the canon essential that carries the number ("Vitamin B1"):
 * both resolve to "b1". Still grounded — only ever links to an essential the product actually supplies.
 */
function bVitaminToken(norm: string): string | null {
  const m = norm.match(/\bb(12|[1235679])\b/);
  return m !== null ? `b${m[1]}` : null;
}

/**
 * The B-vitamin common-names whose canon home is "Vitamin B<n>" and that carry no unit_detail
 * B-number to bridge on (kept small so it stays a matcher, not a fact field / data literal).
 */
const B_SYNONYM: Record<string, string> = {
  thiamin: 'b1',
  thiamine: 'b1',
  riboflavin: 'b2',
  pantothenic: 'b5',
  pyridoxine: 'b6',
  cobalamin: 'b12',
};

/** The B-vitamin token a label ROW resolves to, from its unit_detail ("B1") or its common name. */
function rowBToken(n: ProductNutrientRow, rowNorm: string): string | null {
  const ud = (n.unit_detail ?? '').trim().match(/^b(12|[1235679])$/i);
  if (ud !== null) {
    return `b${ud[1]}`;
  }
  for (const [key, tok] of Object.entries(B_SYNONYM)) {
    if (rowNorm.includes(key)) {
      return tok;
    }
  }
  return null;
}

/**
 * One canon essential a product actually delivers (per the recommender index), carrying the
 * bits a Supplement-Facts row needs to take its CATEGORY colour + link to the essential page.
 * Grounded in essentialSlugsByProduct — never invented: a nutrient row colours/links only when
 * its name matches an essential the product genuinely supplies, so an unmatched row stays neutral.
 */
interface SuppliedEssential {
  layoutKey: string;
  name: string;
  category: string;
  norm: string;
}

function suppliedEssentials(productId: string): SuppliedEssential[] {
  const out: SuppliedEssential[] = [];
  for (const slug of essentialSlugsByProduct().get(productId) ?? []) {
    const page = getEssentialPage(slug);
    if (page === null) {
      continue;
    }
    out.push({
      layoutKey: getEssentialBySlug(slug)?.layout_key ?? slug,
      name: page.name,
      category: page.category ?? '',
      norm: normNutrientName(page.name),
    });
  }
  return out;
}

/** The box/cube identity glyph shown for every product (tinted --form in the hero). */
const PRODUCT_GLYPH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>';

/** One Supplement-Facts nutrient line: name (+ chemical form, unit_detail, essential link) · amount (+ IU) · %DV. */
function pfNutrientRow(n: ProductNutrientRow, byNorm: Map<string, SuppliedEssential>): string {
  const unit = (n.unit !== null && n.unit !== undefined && n.unit.length > 0) ? ` ${escHTML(n.unit)}` : '';
  const amt = fmtAmt(n.amount);
  const amtHTML = amt.length > 0 ? `${escHTML(amt)}${unit}` : '';
  const iu = (n.label_iu !== null && n.label_iu !== undefined) ? ` · ${escHTML(String(n.label_iu))} IU` : '';
  const detail = (n.unit_detail !== undefined && n.unit_detail.length > 0) ? ` <span class="kd-pf-nrow__ex">(${escHTML(n.unit_detail)})</span>` : '';
  const form = (n.form !== undefined && n.form.length > 0) ? `<span class="kd-pf-nrow__form">${escHTML(n.form)}</span>` : '';
  const dvRaw = n.pct_dv;
  const dv = (dvRaw !== null && dvRaw !== undefined && String(dvRaw).length > 0)
    ? `${escHTML(String(dvRaw))}%`
    : '<span title="Daily Value not established">†</span>';
  const rowNorm = normNutrientName(n.name);
  const bt = rowBToken(n, rowNorm);
  const match = byNorm.get(rowNorm) ?? (bt !== null ? byNorm.get(bt) : undefined);
  const linked = match !== undefined && match.category.length > 0;
  const nav = linked
    ? ` data-cat="${escHTML(match.category)}" data-kd-essential="${escHTML(match.layoutKey)}" role="button" tabindex="0"`
    : (match !== undefined ? ` data-kd-essential="${escHTML(match.layoutKey)}" role="button" tabindex="0"` : '');
  const cls = match !== undefined ? ' kd-pf-nrow--link' : '';
  const go = match !== undefined ? '<span class="kd-pf-nrow__go">›</span>' : '';
  return `<div class="kd-pf-nrow${cls}"${nav}>
      <span class="kd-pf-nrow__nm">${escHTML(n.name)}${detail}${go}${form}</span>
      <span class="kd-pf-nrow__amt">${amtHTML}${iu}</span>
      <span class="kd-pf-nrow__dv">${dv}</span>
    </div>`;
}

/** A collapsible proprietary blend: name + total/CFU + count in the summary, ingredient list in the body. */
function pfBlend(b: ProductBlend): string {
  const name = (b.name !== undefined && b.name.length > 0) ? escHTML(b.name) : 'Proprietary blend';
  const total = (b.total != null && b.total.amount != null)
    ? `${escHTML(fmtAmt(b.total.amount))}${b.total.unit != null ? ` ${escHTML(b.total.unit)}` : ''}`
    : '';
  const cfu = (b.total_cfu != null && b.total_cfu.amount != null)
    ? `${escHTML(fmtAmt(b.total_cfu.amount))}${b.total_cfu.unit != null ? ` ${escHTML(b.total_cfu.unit)}` : ''}`
    : '';
  const ings = b.ingredients ?? [];
  const body = ings.length > 0
    ? ings.map((i) => {
        // The label detail lives in STRUCTURED fields (form / standardization / part / latin), so show
        // them all -- else "Grape seed extract" prints as "Grape seed" (Luneth 2026-07-24). Normalized
        // formatting (not byte-exact label wording); latin stays italic, the rest are faint qualifiers.
        const parts = [escHTML(i.name)];
        if (i.form !== undefined && i.form.length > 0) {
          parts.push(`<span class="kd-pf-ing__q">${escHTML(i.form)}</span>`);
        }
        if (i.part !== undefined && i.part.length > 0) {
          parts.push(`<span class="kd-pf-ing__q">${escHTML(i.part)}</span>`);
        }
        if (i.standardization !== undefined && i.standardization.length > 0) {
          parts.push(`<span class="kd-pf-ing__q">(${escHTML(i.standardization)})</span>`);
        }
        if (i.latin !== undefined && i.latin.length > 0) {
          parts.push(`<i>(${escHTML(i.latin)})</i>`);
        }
        return parts.join(' ');
      }).join(' · ')
    : (b.as_labeled !== undefined ? escHTML(b.as_labeled) : '');
  const count = ings.length > 0 ? `${ings.length} ingredient${ings.length === 1 ? '' : 's'}` : '';
  const meta = [(total.length > 0 ? total : cfu), count].filter(s => s.length > 0).join(' · ');
  return `<details class="kd-pf-blend">
      <summary><span class="kd-pf-blend__nm">${name}</span><span class="kd-pf-blend__meta">${meta}</span></summary>
      <div class="kd-pf-blend__body">${body}</div>
    </details>`;
}

/** The macro chips row (calories / carbs / sugars / protein) — shakes + drink blends carry them. */
function pfMacros(macros: ProductComponent['macros']): string {
  if (macros === undefined || macros === null) {
    return '';
  }
  const chips: string[] = [];
  for (const [key, val] of Object.entries(macros)) {
    if (val === null || typeof val !== 'object') {
      continue;
    }
    const amount = (val as { amount?: unknown }).amount;
    if (amount === null || amount === undefined) {
      continue;
    }
    const unit = (val as { unit?: unknown }).unit;
    const u = typeof unit === 'string' ? escHTML(unit) : '';
    chips.push(`<span class="kd-pf-macro"><b>${escHTML(String(amount))}${u}</b><span>${escHTML(key.replace(/_/g, ' '))}</span></span>`);
  }
  return chips.length > 0 ? `<div class="kd-pf-macros">${chips.join('')}</div>` : '';
}

/** One label component: head (title + serving meta), macros, the nutrient table, blends, other ingredients. */
function pfComponent(c: ProductComponent, multi: boolean, byNorm: Map<string, SuppliedEssential>): string {
  const title = multi ? (c.role ?? c.form ?? 'Component') : 'Supplement facts';
  const metaBits = [
    (multi && c.form !== undefined) ? c.form : '',
    c.serving_size ?? '',
    (c.servings_per_container !== null && c.servings_per_container !== undefined) ? `${String(c.servings_per_container)} serving${String(c.servings_per_container) === '1' ? '' : 's'}` : '',
  ].filter(s => s.length > 0).join(' · ');
  let h = `<div class="kd-pf-comp">
      <div class="kd-pf-comp__head"><span class="kd-pf-comp__title">${escHTML(title)}</span><span class="kd-pf-comp__meta">${escHTML(metaBits)}</span></div>`;
  h += pfMacros(c.macros);
  const nuts = c.nutrients ?? [];
  if (nuts.length > 0) {
    h += '<div class="kd-pf-nhead"><span>Nutrient</span><span>Amount</span><span>%DV</span></div>';
    h += nuts.map(n => pfNutrientRow(n, byNorm)).join('');
  }
  const blends = c.blends ?? [];
  if (blends.length > 0) {
    h += '<div class="kd-pf-sub">Blends <span class="kd-pf-sub__hint">tap to see what’s inside</span></div>';
    h += blends.map(pfBlend).join('');
  }
  if (c.other_ingredients !== undefined && c.other_ingredients.length > 0) {
    h += `<div class="kd-pf-sub">Other ingredients</div><div class="kd-pf-other">${escHTML(c.other_ingredients.join(', '))}</div>`;
  }
  return `${h}</div>`;
}

/** The high-impact "At a glance" hero: a big Unbounded essentials-supplied numeral (in --form) beside the price/serving metrics. */
function pfGlance(p: ProductDetail, supplied: number): string {
  const c0 = p.components[0];
  const price = p.price ?? null;
  const wholesale = (price !== null && price.wholesale !== null && price.wholesale !== undefined) ? price.wholesale : null;
  const retail = (price !== null && price.retail !== null && price.retail !== undefined) ? price.retail : null;
  const spcRaw = c0?.servings_per_container;
  const spc = typeof spcRaw === 'number' ? spcRaw : null;
  const perServe = (wholesale !== null && spc !== null && spc > 0) ? wholesale / spc : null;
  const serving = c0?.serving_size ?? '';

  const hero = supplied > 0
    ? `<div class="kd-pf-glance__num">${supplied}</div>
        <div class="kd-pf-glance__cap"><b>of ${essentialCount()}</b> Wallach essentials<br>delivered on this label</div>`
    : `<div class="kd-pf-glance__kill">Targeted<br>formula</div>
        <div class="kd-pf-glance__cap">a focused botanical outside<br>the 90 core essentials</div>`;

  const metric = (k: string, v: string, sub: string): string =>
    `<div class="kd-pf-metric"><div class="kd-pf-metric__k">${escHTML(k)}</div><div class="kd-pf-metric__v">${v}</div>${sub.length > 0 ? `<div class="kd-pf-metric__sub">${escHTML(sub)}</div>` : ''}</div>`;

  const metrics = [
    metric('Wholesale', wholesale !== null ? `$${fmtMoney(wholesale)}` : '—', retail !== null ? `$${fmtMoney(retail)} retail` : ''),
    metric('Per serving', serving.length > 0 ? escHTML(serving) : '—', spc !== null ? `${spc} per container` : ''),
    metric('Cost / serving', perServe !== null ? `$${fmtMoney(perServe)}` : '—', perServe !== null ? 'wholesale ÷ servings' : ''),
  ].join('');

  return `<div class="kd-ep-seclabel">At a glance <span class="kd-ep-seclabel__hint">what’s on the label</span></div>
    <div class="kd-pf-glance">
      <div class="kd-pf-glance__hero">${hero}</div>
      <div class="kd-pf-glance__metrics">${metrics}</div>
    </div>
    <div class="kd-pf-note">Composition and an indicative Youngevity listing price — what the product contains, never a Wallach target (§00.A). Wholesale is featured (what most buyers pay online); retail is the MSRP.</div>`;
}

export function renderProductDeep(id: string, fromProductsTab = true): string {
  const p = getProduct(id);
  if (p === null) {
    return '';
  }
  const fam = formFamily(p);
  const hex = FORM_COLORS[fam] ?? '';
  const famStyle = hex.length > 0 ? ` style="--form:${hex}"` : '';
  const supplied = essentialsSupplied(p);
  const comps = p.components;
  const multi = comps.length > 1;
  const forms = [...new Set(comps.map(c => c.form).filter((f): f is string => f !== undefined && f.length > 0))].join(' + ');
  const c0 = comps[0];
  const nNut = comps.reduce((s, c) => s + (c.nutrients?.length ?? 0), 0);
  const nBlend = comps.reduce((s, c) => s + (c.blends?.length ?? 0), 0);
  const sku = (p.sku !== undefined && p.sku.length > 0) ? ` · SKU ${escHTML(p.sku)}` : '';

  const supplied_list = suppliedEssentials(p.product_id);
  const byNorm = new Map<string, SuppliedEssential>();
  for (const e of supplied_list) {
    byNorm.set(e.norm, e);
    const bt = bVitaminToken(e.norm); // also key B-vitamins by number, so "Thiamin" finds "Vitamin B1"
    if (bt !== null && !byNorm.has(bt)) {
      byNorm.set(bt, e);
    }
  }

  const servingTxt = (c0?.serving_size !== undefined && c0.serving_size.length > 0) ? c0.serving_size : '—';
  const spcVal = c0?.servings_per_container;
  const spcTxt = (spcVal !== null && spcVal !== undefined) ? `, ${String(spcVal)} serving${String(spcVal) === '1' ? '' : 's'} per container` : '';
  const blendPhrase = nBlend > 0 ? `${nBlend} whole-food blend${nBlend === 1 ? '' : 's'}` : '';
  // Never say "lists 0 nutrients" — a blend-only product still does something; describe it by its blends.
  const labelSentence = nNut > 0
    ? ` The label lists ${nNut} nutrient${nNut === 1 ? '' : 's'}${blendPhrase.length > 0 ? ` across ${blendPhrase}` : ''}.`
    : (blendPhrase.length > 0 ? ` The label is built from ${blendPhrase}.` : '');
  const lede = `A ${escHTML(forms.length > 0 ? forms : 'Youngevity')} supplement — one serving is ${escHTML(servingTxt)}${escHTML(spcTxt)}.${labelSentence}`;

  const factsHead = `<div class="kd-ep-seclabel">Supplement facts${multi ? ` <span class="kd-ep-seclabel__hint">${comps.length} components</span>` : ''}</div>`;
  const factsHTML = comps.map(c => pfComponent(c, multi, byNorm)).join('');

  const dirs = comps.map(c => c.directions).filter((d): d is string => d !== undefined && d.length > 0);
  const dirHTML = dirs.length > 0
    ? `<div class="kd-ep-seclabel">How to use it</div>${dirs.map(d => `<div class="kd-pf-use">${escHTML(d)}</div>`).join('')}`
    : '';

  const pills = [...supplied_list].sort((a, b) => a.name.localeCompare(b.name));
  const pillsHTML = pills.length > 0
    ? `<div class="kd-ep-seclabel">Essentials on this label</div>
      <p class="kd-ep-lead">This product delivers <b>${pills.length}</b> of Wallach’s 90 essentials that have their own page — tap one to read it.</p>
      <div class="kd-ep-cloud">${pills.map(e => `<button class="kd-ep-pill kd-ep-pill--nut" type="button" data-kd-essential="${escHTML(e.layoutKey)}">${escHTML(e.name)}</button>`).join('')}</div>`
    : '';

  return `<div class="kd-essential-deep kd-ep kd-ep--prod"${famStyle}>
    <div class="kd-ep-hero">
      <div class="kd-ep-hero__sym kd-ep-hero__sym--form">${PRODUCT_GLYPH}</div>
      <div class="kd-ep-hero__idblock">
        <h1 class="kd-ep-hero__name">${escHTML(p.name)}</h1>
        <div class="kd-ep-hero__subline">
          <div class="kd-ep-hero__form"><i></i>${escHTML(fam.toUpperCase())}</div>
          <span class="kd-ep-hero__sep">·</span>
          <span class="kd-ep-hero__meta">Youngevity product${sku}</span>
        </div>
      </div>
      <div class="kd-ep-actions">
        <button class="kd-ep-back" data-kd-action="product-close" type="button">${fromProductsTab ? '‹ All products' : '‹ Go back'}</button>
        <button class="kd-ep-add-regimen" data-kd-action="add-regimen" data-add-product="${escHTML(id)}" type="button">Add to regimen ›</button>
      </div>
    </div>
    <p class="kd-ep-lede">${lede}</p>
    ${pfGlance(p, supplied)}
    ${factsHead}
    ${factsHTML}
    ${dirHTML}
    ${pillsHTML}
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
