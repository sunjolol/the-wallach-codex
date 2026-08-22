/**
 * views/knowledge-food-sheet.ts — catalog FOODS on the Knowledge drawer's Products tab
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A food row for the Products grid, and the nutrient sheet it opens (owner ruling,
 * 2026-08-22: "include foods in the products tab, mixed in with the actual YGY products and
 * given their own distinct colour"). Not to be confused with views/knowledge-foods.ts, which
 * is the ABSORPTION tab — a curated editorial landing about Wallach's diet teaching. This
 * file is the catalog: 192 foods, each with a label.
 *
 * ★ THE ROW IS THE PRODUCT ROW, DELIBERATELY. Same markup, same ghost number, same three
 * lines — because the reader is scanning ONE grid and two card designs would read as two
 * lists that happen to be adjacent. Only two things differ, and both say the same thing: the
 * category chip reads FOOD, and `--form` takes the rust hue no product uses.
 *
 * ★ WHAT THE SHEET MAY SAY, AND WHAT IT MAY NOT. Every amount is COMPOSITION from a pinned
 * outside source; every percentage is that amount over a WALLACH daily target (§00.A) — the
 * same arithmetic the FOOD SOURCES tile performs, so a nutrient reads the same on both
 * surfaces. It is emphatically NOT a complete nutrition label: the generator keeps only rows
 * at or above the artifact's qualify fraction, and no macro or calorie source is pinned at
 * all. The sheet says so in its own note rather than letting the reader assume.
 *
 * ★ %DV HAS NO PLACE HERE. A product's label column is the FDA's Daily Value because that is
 * what the manufacturer printed. A food's is Wallach's own target, and the column header says
 * which — swapping one in for the other would be the quietest §00.A breach on any surface.
 *
 * Layer: views/ — reads state/ + core/, holds no state, escapes every string.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Food } from '../core/schemas/index.js';
import { getEssentialBySlug } from '../state/corpus.js';
import { essentialCount } from '../state/coverage.js';
import { getEssentialPage } from '../state/entity-page.js';
import { foodById, type FoodHit, foodHits, foodQualifyPct, listFoods } from '../state/foods.js';

// Hex escapes \x22 \x27 for " and ' — the clean-view prose scanner has no regex parser, and a
// bare quote inside the char class reads to it as a string start (see knowledge-topic.ts).
function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>\x22\x27]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

/**
 * The one hue a food card wears — rust, and the reason is arithmetic rather than taste.
 *
 * The seven delivery-form colours occupy cyan, amber, green, indigo, pink, olive and grey;
 * red is the only family none of them sits in, so it is the only choice that cannot be
 * mistaken for a product at a glance in a mixed grid. Mirrored in drawer-knowledge.css on
 * `.kd-product-row--food`; the value lives HERE too because the drawer scrollbar bridge can
 * only read a hex from JS (a scrollbar pseudo reads root-level custom properties alone),
 * exactly as FORM_COLORS does for products.
 */
export const FOOD_COLOR = '#b0442e';

/** The drawer-scrollbar tint for a selected food, or '' when the id does not resolve. */
export function foodScrollTint(id: string): string {
  return foodById(id) !== undefined ? FOOD_COLOR : '';
}

/** A food's display name, for the breadcrumb. '' when the id does not resolve. */
export function foodName(id: string): string {
  return foodById(id)?.name ?? '';
}

/**
 * A number as a label prints it: enough places to stay true, never more.
 *
 * Two decimals is right for nearly every row, but a trace mineral stated in mg can be small
 * enough to round to a flat zero — and "0 mg" beside "9% of target" is a contradiction the
 * reader cannot resolve. Those fall back to three significant figures.
 */
function fmtAmount(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  if (rounded === 0 && n > 0) {
    return n.toPrecision(3);
  }
  return String(rounded);
}

/**
 * The hidden keyword blob the Products-tab search reads (data-search).
 *
 * Everything a person might type at a food: its name, its catalog category, the source's own
 * description of it, the serving, and every essential it delivers — by label AND by spaced
 * slug, so "b12" and "vitamin b12" both answer.
 */
function foodSearchBlob(food: Food, hits: readonly FoodHit[]): string {
  const parts: string[] = [food.name, food.category, food.usda_description, food.portion_label];
  for (const h of hits) {
    parts.push(h.label, h.slug, h.slug.replace(/-/g, ' '));
  }
  return parts.join(' ');
}

/** One food, shaped for the mixed grid: what it is called and how much of the 90 it reaches. */
export interface FoodGridItem {
  id: string;
  name: string;
  /** How many of the 90 one serving delivers — the ghost number, and the grid's sort key. */
  supplied: number;
}

/**
 * Every food, with the count the grid sorts on.
 *
 * `supplied` is hits.length — the SAME number the FOOD SOURCES tile prints as "N of 90",
 * counting the EFA group as one line. A different count here would have the same food
 * claiming two different breadths on two surfaces.
 */
export function foodGridItems(): FoodGridItem[] {
  return listFoods().map(f => ({ id: f.id, name: f.name, supplied: foodHits(f.id).length }));
}

/** One food card — the product row's design, in the food hue, with the serving where a
 *  product prints its price and servings-per-container. */
export function renderFoodRow(id: string, selected: string | null): string {
  const food = foodById(id);
  if (food === undefined) {
    return '';
  }
  const hits = foodHits(id);
  const cls = `kd-product-row kd-product-row--food${id === selected ? ' is-selected' : ''}`;
  const lead = `<b>of ${essentialCount()}</b> essentials`;
  const foot = [lead, food.portion_label].filter(s => s.length > 0).join(' · ');
  const ghost = hits.length > 0
    ? `<div class="kd-product-row__ghost" aria-hidden="true">${hits.length}</div>`
    : '';
  return `
    <div class="${cls}" data-kd-food="${escHTML(id)}" data-search="${escHTML(foodSearchBlob(food, hits))}" role="button" tabindex="0">
      ${ghost}
      <div class="kd-product-row__cat"><i></i>FOOD</div>
      <h4 class="kd-product-row__name">${escHTML(food.name)}</h4>
      <div class="kd-product-row__foot">${foot}</div>
    </div>`;
}

// ─── The nutrient sheet ─────────────────────────────────────────────────────

/** The identity glyph for a food — a leaf, tinted --form in the hero (cf. the product cube). */
const FOOD_GLYPH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20c0-8 5-13 15-14 1 10-4 15-11 15H4z"/><path d="M4 20c3-5 7-8 11-9.5"/></svg>';

/**
 * The gloss a single number carries — whose measurement the amount is, and whose target it
 * is measured against.
 *
 * ★ THE SAME SENTENCE THE TILE USES, for the same reason: the source NAMES ITSELF out of the
 * artifact, so a row cannot go on saying "USDA" about a number that stopped coming from USDA.
 * It is duplicated rather than imported from views/foods-block.ts because that module reaches
 * into state/regimen.ts to mint an item, and the drawer has no business importing a writer.
 */
function glossFor(hit: FoodHit): string {
  const base = `Food composition from ${hit.source}, measured against Dr. Wallach’s daily `
    + 'target for this nutrient.';
  const floor = hit.conservative
    ? ' It is the lowest of the varieties that source measured, so it holds whichever '
    + 'kind you eat.'
    : '';
  if (hit.tier !== 'APPROXIMATE') {
    return base + floor;
  }
  return `${base} ≈ That source lists foods by name rather than by the id our catalog uses, `
    + 'so this food was paired with theirs by hand — a close stand-in, not a measurement of '
    + `this exact item.${floor}`;
}

/**
 * One label line: the essential, what a serving holds, and what share of Wallach's target
 * that is.
 *
 * The name LINKS to the essential's own page wherever the canon has one — the same
 * data-kd-essential contract a product's label row uses. The EFA group has no page and gets
 * no link and no category tint: it is not one of the 90, it is a meter two of them share,
 * and colouring it as a fatty acid would be that group quietly credited to omega-3.
 */
function labelRow(hit: FoodHit): string {
  const page = getEssentialPage(hit.slug);
  const layoutKey = getEssentialBySlug(hit.slug)?.layout_key ?? '';
  const linked = page !== null && layoutKey.length > 0;
  const cat = (page?.category ?? '');
  const nav = linked
    ? `${cat.length > 0 ? ` data-cat="${escHTML(cat)}"` : ''} data-kd-essential="${escHTML(layoutKey)}" role="button" tabindex="0"`
    : '';
  const go = linked ? '<span class="kd-pf-nrow__go">›</span>' : '';
  const approx = hit.tier === 'APPROXIMATE' ? '<span class="kd-pf-nrow__ex">≈</span>' : '';
  const floor = hit.conservative ? '<span class="kd-pf-nrow__ex">floor</span>' : '';
  return `<div class="kd-pf-nrow${linked ? ' kd-pf-nrow--link' : ''}"${nav} title="${escHTML(glossFor(hit))}">
      <span class="kd-pf-nrow__nm">${escHTML(hit.label)}${go}${approx}${floor}</span>
      <span class="kd-pf-nrow__amt">${escHTML(fmtAmount(hit.amount))} ${escHTML(hit.unit)}</span>
      <span class="kd-pf-nrow__dv">${hit.pct}%</span>
    </div>`;
}

/** The publications behind this food's numbers, each named once, most-used first. */
function sourceLine(hits: readonly FoodHit[]): string {
  const counts = new Map<string, number>();
  for (const h of hits) {
    counts.set(h.source, (counts.get(h.source) ?? 0) + 1);
  }
  const approx = hits.filter(h => h.tier === 'APPROXIMATE').length;
  const named = [...counts.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .map(([name, n]) => `${name} (${n} value${n === 1 ? '' : 's'})`)
    .join(' · ');
  const pairNote = approx > 0
    ? ` · ${approx} paired by name rather than by id (≈)`
    : '';
  return `SOURCE · ${named}${pairNote} — composition measured against Dr. Wallach’s own daily targets (§00.A · a food never sets a target)`;
}

/** The high-impact "At a glance": how much of the 90 this serving reaches, beside the facts. */
function foodGlance(food: Food, hits: readonly FoodHit[]): string {
  const lead = hits[0];
  const sources = new Set(hits.map(h => h.source)).size;
  const metric = (k: string, v: string, sub: string): string =>
    `<div class="kd-pf-metric"><div class="kd-pf-metric__k">${escHTML(k)}</div><div class="kd-pf-metric__v">${escHTML(v)}</div>${sub.length > 0 ? `<div class="kd-pf-metric__sub">${escHTML(sub)}</div>` : ''}</div>`;

  const hero = hits.length > 0
    ? `<div class="kd-pf-glance__num">${hits.length}</div>
        <div class="kd-pf-glance__cap"><b>of ${essentialCount()}</b> Wallach essentials<br>one serving reaches</div>`
    : `<div class="kd-pf-glance__kill">No<br>numbers</div>
        <div class="kd-pf-glance__cap">nothing our pinned sources measure<br>clears the floor for this food</div>`;

  const metrics = [
    metric('Serving', food.portion_label, `${food.grams} g`),
    metric('Strongest', lead !== undefined ? `${lead.pct}%` : '—', lead !== undefined ? lead.label : ''),
    metric('Measured by', String(sources), sources === 1 ? 'pinned source' : 'pinned sources'),
  ].join('');

  return `<div class="kd-ep-seclabel">At a glance <span class="kd-ep-seclabel__hint">what one serving delivers</span></div>
    <div class="kd-pf-glance">
      <div class="kd-pf-glance__hero">${hero}</div>
      <div class="kd-pf-glance__metrics">${metrics}</div>
    </div>
    <div class="kd-pf-note">Composition from a pinned outside table, measured against Dr. Wallach’s own daily target for each nutrient — what the food contains, never a target it sets (§00.A).</div>`;
}

/**
 * The full food page: hero, glance, the nutrient label, and the provenance it rests on.
 *
 * Returns '' for an unresolvable id — the tab then renders its grid alone, which is what an
 * absent detail should look like.
 */
export function renderFoodDeep(id: string, fromProductsTab = true): string {
  const food = foodById(id);
  if (food === undefined) {
    return '';
  }
  const hits = foodHits(id);
  const floorPct = foodQualifyPct();
  const rows = hits.map(labelRow).join('');
  const lede = `One serving is ${escHTML(food.portion_label)} (${food.grams} g). This label `
    + `carries ${hits.length} of Dr. Wallach’s ${essentialCount()} essentials, each measured `
    + 'against his own daily target.';

  return `<div class="kd-essential-deep kd-ep kd-ep--food" style="--form:${FOOD_COLOR}">
    <div class="kd-ep-hero">
      <div class="kd-ep-hero__sym kd-ep-hero__sym--form">${FOOD_GLYPH}</div>
      <div class="kd-ep-hero__idblock">
        <h1 class="kd-ep-hero__name">${escHTML(food.name)}</h1>
        <div class="kd-ep-hero__subline">
          <div class="kd-ep-hero__form"><i></i>FOOD</div>
          <span class="kd-ep-hero__sep">·</span>
          <span class="kd-ep-hero__meta">${escHTML(food.category)} · FDC ${escHTML(food.fdc_id)}</span>
        </div>
      </div>
      <div class="kd-ep-actions">
        <button class="kd-ep-back" data-kd-action="food-close" type="button">${fromProductsTab ? '‹ All products' : '‹ Go back'}</button>
        <button class="kd-ep-add-regimen" data-kd-action="add-regimen" data-add-food="${escHTML(id)}" type="button">Add to regimen ›</button>
      </div>
    </div>
    <p class="kd-ep-lede">${lede}</p>
    ${foodGlance(food, hits)}
    <div class="kd-ep-seclabel">Nutrition facts <span class="kd-ep-seclabel__hint">per serving</span></div>
    <div class="kd-pf-comp">
      <div class="kd-pf-comp__head"><span class="kd-pf-comp__title">${escHTML(food.portion_label)}</span><span class="kd-pf-comp__meta">${food.grams} g · ${hits.length} nutrient${hits.length === 1 ? '' : 's'}</span></div>
      <div class="kd-pf-nhead"><span>Nutrient</span><span>Amount</span><span>% of target</span></div>
      ${rows}
      <div class="kd-pf-sub">As the source describes it</div>
      <div class="kd-pf-other">${escHTML(food.usda_description)}</div>
    </div>
    <div class="kd-pf-note">Every nutrient a pinned source measures at ${floorPct}% or more of one of Wallach’s daily targets. Not a complete nutrition label: anything under that floor never entered the catalog, and no calorie or macronutrient source is pinned at all — so their absence here is a gap in what we hold, not a claim about the food.</div>
    <div class="kd-corpus__foot">${escHTML(sourceLine(hits))}</div>
  </div>`;
}
