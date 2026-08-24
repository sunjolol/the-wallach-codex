/**
 * views/foods-block.ts — the FOOD SOURCES block, shared by Regimen and Coverage
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ONE builder for both tabs, because two copies of a card renderer is exactly how the
 * price literal ended up hand-typed in three places (Charter R3). The tabs differ only in
 * WHERE the block sits — above the products on Regimen, below them on Coverage (owner
 * ruling, 2026-08-21) — and in whether the list is capped.
 *
 * ★ THE CARD IS DESIGN F, SIGNED OFF 2026-08-21. The record is
 * chronicle/decisions/2026-08-21-food-tile-F-approved.html and it is the SPEC, not a
 * suggestion: a title bar spanning the full 340px so a long name stops competing with a
 * verdict column, the control aligned to the name's optical centre so it reads as "this
 * row's action", then a body carrying one big lead percentage beside the rest as chips.
 * `render_probe_food_tile.js` holds BOTH the record and this app to the same four rules:
 * at most 7 chips then "+N", never more than 3 chip rows, the "+N" equal to what was
 * actually dropped, and one 28px control shell. Do not "improve" any of it — ask.
 *
 * ★ THE FIT IS MEASURED, NOT GUESSED, AND IT WAITS FOR THE FONT. Chip widths depend on the
 * display face; measuring in fallback metrics under-measures every chip, "fits" three rows,
 * and then spills to a fourth when the real face loads. Two of 190 cards failed exactly
 * that way and the max-height belt hid it. The fit runs on document.fonts.ready.
 *
 * ★ THE SEPARATOR IS THE POINT. Foods and supplements answer the same question in different
 * currencies, and a user skimming a mixed list cannot tell which is which. A dotted rule with
 * the label cut into it costs one line of vertical space and makes the boundary unmissable.
 *
 * ★ WHOSE NUMBERS, ON SCREEN. Every amount is COMPOSITION from a pinned outside source
 * measured against a WALLACH target, and it says so through the dotted-underline gloss on
 * the number itself (owner ruling, 2026-08-21) — the same affordance the app already uses
 * for a scientific term. Not a footnote, not buried in an about page: it sits on the number,
 * on the lead and on every chip, because every one of them is a number.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { FOOD_CATALOG_PROVENANCE } from '../core/provenance.js';
import type { RegimenItem } from '../core/schemas/index.js';
import { ui } from '../state/copy.js';
import { foodById, foodCatalogSize, type FoodHit, type FoodRec } from '../state/foods.js';
import { addOrBumpRegimenItem } from '../state/regimen.js';
import { pagerNode } from './pager.js';

/** The label cut into the dotted rule. Owner's choice of the three offered, 2026-08-21. */
const RULE_LABEL = 'FOOD SOURCES';

/** At most this many CHIPS beside the lead before the "+N" badge. Design F's budget. */
const CHIP_CAP = 7;
/** And never more chip rows than this, whatever the names turn out to be. */
const MAX_CHIP_ROWS = 3;

/** Where the rickroll goes when a user has added literally every food in the catalog. */
const PRIZE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

/** Design F's add control: the app's own 28px shell, differing only by its SVG path. */
const ADD_PATH = 'M12 6v12M6 12h12';


export interface FoodsBlockOptions {
  /**
   * True when the products list has closed the field and the foods list is continuing for
   * education only. Changes the block's sub-label, never its ranking (that is decided in
   * state/foods.ts).
   */
  education?: boolean;
  /** How many foods the user already holds — drives the exhaustion easter egg. */
  ownedCount?: number;
  /** Coverage caps its foods; the Regimen console deliberately does not. */
  capReached?: boolean;
  /**
   * The pager under the grid, if this caller offers one.
   *
   * ★ THE CALLER OWNS THE PAGE, NOT THIS BLOCK. The views already re-render from the
   * regimen:changed cascade, so a page index held here would be a second source of truth
   * that the next repaint silently discarded. The buttons carry `data-food-page` and the
   * view's own delegated click handler moves the page — the same contract `data-food-add`
   * already uses.
   *
   * `kind` picks the shape, not the behaviour: `arrows` on Coverage, whose list is short
   * and bounded by what may still be added, `numbers` in the Regimen console, where the
   * reader can jump straight to a page (owner's choice, 2026-08-22).
   */
  pager?: { page: number; pages: number; kind: 'arrows' | 'numbers' };
  /**
   * The category + name filter, if this caller offers one. Sits at the RIGHT of the pager's
   * row (owner's layout, 2026-08-22: pager left, filter right).
   *
   * ★ THE CALLER OWNS THE FILTER TOO, for the same reason it owns the page — and it must
   * apply the filter to the POOL it ranks, never to the slice it passes here, or the pager
   * would count pages that no longer exist.
   */
  filter?: {
    categories: readonly string[];
    category: string;
    query: string;
    /** The goal + nutrient pickers, when the caller offers them. Both optional so the
     *  Coverage block can keep its short two-control row. */
    goals?: readonly { id: string; name: string }[];
    goalId?: string;
    nutrients?: readonly { slug: string; label: string }[];
    nutrient?: string;
  };
}

function ruleWithLabel(): HTMLElement {
  const rule = document.createElement('div');
  rule.className = 'fs-rule';
  const label = document.createElement('span');
  label.className = 'fs-rule__label';
  label.textContent = RULE_LABEL;
  rule.appendChild(label);
  return rule;
}

/**
 * The gloss a single number carries. States both halves in one breath: whose measurement the
 * amount is, and whose target it is measured against.
 *
 * ★ THE SOURCE NAMES ITSELF. The words come from the artifact (state/foods.ts reads them out
 * of `_meta.source_display`), never from a literal here — a card that says "USDA" about a
 * number that stopped coming from USDA is the exact failure this app exists to not have.
 */
function glossFor(hit: FoodHit): string {
  const base = `Food composition from ${hit.source}, measured against Dr. Wallach’s daily `
    + 'target for this nutrient.';
  // ★ A FLOOR MUST SAY IT IS A FLOOR. Where the source measured several varieties of what
  // our row calls one food, the curation took the LOWEST — true whichever kind is on the
  // plate. Left unsaid, an understated number reads as a reading of this exact item.
  const floor = hit.conservative
    ? ' It is the lowest of the varieties that source measured, so it holds whichever kind '
      + 'you eat.'
    : '';
  if (hit.tier !== 'APPROXIMATE') {
    return base + floor;
  }
  // ★ SAY WHAT APPROXIMATE ACTUALLY MEANS, in the place the number is read. "Approximate"
  // on its own reads as "roughly", which is not the risk here: the measurement is as good
  // as any, and what is uncertain is whether their food is OUR food.
  return `${base} ≈ That source lists foods by name rather than by the id our catalog uses, `
    + 'so this food was paired with theirs by hand — a close stand-in, not a measurement of '
    + `this exact item.${floor}`;
}

/** The category picker + name box, at the right of the pager's row. */
function filterNode(f: NonNullable<FoodsBlockOptions['filter']>): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'fs-filter';

  const sel = document.createElement('select');
  sel.className = 'fs-filter__cat';
  sel.dataset['foodCat'] = '';
  sel.setAttribute('aria-label', ui('fs_filter_cat_label'));
  const all = document.createElement('option');
  all.value = '';
  all.textContent = ui('fs_filter_all');
  sel.appendChild(all);
  // The options are the catalog's OWN categories, read from state — never a list written
  // down here, which would keep offering a category the day its last food left (R3).
  for (const c of f.categories) {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    sel.appendChild(o);
  }
  sel.value = f.category;

  const q = document.createElement('input');
  q.className = 'fs-filter__q';
  q.type = 'search';
  q.dataset['foodQ'] = '';
  q.maxLength = 40;
  q.placeholder = ui('fs_filter_find');
  q.value = f.query;
  q.setAttribute('aria-label', ui('fs_filter_q_label'));

  const pick = (attr: string, value: string, allLabel: string, opts: { v: string; t: string }[], aria: string): HTMLSelectElement => {
    const el = document.createElement('select');
    el.className = 'fs-filter__cat';
    el.dataset[attr] = '';
    el.setAttribute('aria-label', aria);
    const all = document.createElement('option');
    all.value = '';
    all.textContent = allLabel;
    el.appendChild(all);
    for (const o of opts) {
      const opt = document.createElement('option');
      opt.value = o.v;
      opt.textContent = o.t;
      el.appendChild(opt);
    }
    el.value = value;
    return el;
  };

  wrap.appendChild(sel);
  // The goal + nutrient pickers, only where the caller supplies their options -- the Coverage
  // block deliberately keeps the shorter row.
  if (f.goals !== undefined) {
    wrap.appendChild(pick('foodGoal', f.goalId ?? '', ui('fs_filter_goal_all'),
      f.goals.map(g => ({ v: g.id, t: g.name })), ui('fs_filter_goal_label')));
  }
  if (f.nutrients !== undefined) {
    wrap.appendChild(pick('foodNutrient', f.nutrient ?? '', ui('fs_filter_nutrient_all'),
      f.nutrients.map(n => ({ v: n.slug, t: n.label })), ui('fs_filter_nutrient_label')));
  }
  wrap.appendChild(q);
  return wrap;
}

/**
 * Where the reader's cursor was inside this block, so a repaint can put it back.
 *
 * ★ WHY THIS EXISTS. The filter box lives INSIDE the block, and the block repaints on every
 * keystroke so the pager can recount its pages against the narrowed pool. Without this the
 * input the reader is typing into is destroyed mid-word and the caret lands on <body>.
 * Same class of problem as views/scroll-keep.ts, and the same answer: measure, repaint,
 * restore.
 */
interface FocusMark { attr: string; start: number; end: number }

function markFocus(host: HTMLElement): FocusMark | null {
  const el = document.activeElement;
  if (el === null || !host.contains(el)) {
    return null;
  }
  if (el instanceof HTMLInputElement && el.hasAttribute('data-food-q')) {
    const end = el.value.length;
    return { attr: 'data-food-q', start: el.selectionStart ?? end, end: el.selectionEnd ?? end };
  }
  if (el instanceof HTMLSelectElement && el.hasAttribute('data-food-cat')) {
    return { attr: 'data-food-cat', start: 0, end: 0 };
  }
  return null;
}

function restoreFocus(host: HTMLElement, mark: FocusMark | null): void {
  if (mark === null) {
    return;
  }
  const el = host.querySelector<HTMLElement>(`[${mark.attr}]`);
  if (el === null) {
    return;
  }
  el.focus();
  if (el instanceof HTMLInputElement) {
    el.setSelectionRange(mark.start, mark.end);
  }
}

/** How many distinct rows the chips actually occupy, measured from their laid-out tops. */
function rowCount(host: HTMLElement): number {
  const tops = new Set<number>();
  for (const child of Array.from(host.children)) {
    tops.add(Math.round((child as HTMLElement).offsetTop));
  }
  return tops.size;
}

function chipNode(hit: FoodHit): HTMLElement {
  const chip = document.createElement('span');
  chip.className = hit.tier === 'APPROXIMATE' ? 'fs-chip fs-chip--approx' : 'fs-chip';
  chip.style.setProperty('--c', `var(--fs-cat-${hit.category})`);
  chip.title = glossFor(hit);
  chip.append(document.createTextNode(`${hit.label.toUpperCase()} `));
  const pct = document.createElement('u');
  pct.textContent = `${hit.pct}%`;
  chip.appendChild(pct);
  return chip;
}

/**
 * Paint at most CHIP_CAP chips, then shrink until the rendered rows fit MAX_CHIP_ROWS.
 *
 * The "+N" badge counts what was ACTUALLY dropped, recomputed on every shrink — a truncation
 * that lies about its own size is worse than no truncation at all, and it is the one thing
 * here a reader cannot check for themselves.
 */
function fitChips(host: HTMLElement, chips: readonly FoodHit[]): void {
  const paint = (n: number): void => {
    host.replaceChildren();
    for (const hit of chips.slice(0, n)) {
      host.appendChild(chipNode(hit));
    }
    if (n < chips.length) {
      const more = document.createElement('span');
      more.className = 'fs-more';
      more.textContent = `+${chips.length - n}`;
      host.appendChild(more);
    }
  };
  let n = Math.min(CHIP_CAP, chips.length);
  paint(n);
  while (n > 0 && rowCount(host) > MAX_CHIP_ROWS) {
    n -= 1;
    paint(n);
  }
}

/** Build one design-F tile. Returns its chip host so the caller can fit it after fonts. */
function tileFor(rec: FoodRec): { tile: HTMLElement; chipHost: HTMLElement | null } {
  const lead = rec.hits[0];
  const tile = document.createElement('div');
  tile.className = 'fs-tile';
  // The number of essentials this tile was BUILT from, so a probe can check the "+N" badge
  // against the truth rather than against the meta line it also renders. A truncation that
  // lies about its own size is the one thing on this card a reader cannot check.
  tile.dataset['hits'] = String(rec.hits.length);
  if (lead !== undefined) {
    tile.style.setProperty('--acc', `var(--fs-cat-${lead.category})`);
  }

  // ── title bar: the name gets the whole width, the control sits with it ────
  const bar = document.createElement('div');
  bar.className = 'fs-bar';
  const txt = document.createElement('div');
  txt.className = 'fs-bar__txt';
  const name = document.createElement('div');
  name.className = 'fs-tile__name';
  name.textContent = rec.name; // a text node, never parsed as HTML
  name.title = rec.name;       // the full name, for when the ellipsis bites
  const meta = document.createElement('div');
  meta.className = 'fs-tile__meta';
  // Where a product card shows a price, a food card shows the serving its numbers are for.
  // Without it every percentage is unreadable — 28% of a target, per WHAT?
  meta.append(document.createTextNode(`${rec.portionLabel} · `));
  const breadth = document.createElement('b');
  breadth.textContent = String(rec.breadth);
  meta.appendChild(breadth);
  meta.append(document.createTextNode(' of 90'));
  txt.append(name, meta);

  const act = document.createElement('div');
  act.className = 'fs-a';
  const add = document.createElement('button');
  add.className = 'ui-close ui-close--sm fs-ctl fs-ctl--add';
  add.type = 'button';
  add.dataset['foodAdd'] = rec.foodId;
  add.setAttribute('aria-label', `Add ${rec.name}`);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ADD_PATH);
  svg.appendChild(path);
  add.appendChild(svg);
  act.appendChild(add);
  bar.append(txt, act);

  // ── body: the lead number, then the rest as chips ────────────────────────
  const body = document.createElement('div');
  body.className = 'fs-tile__body';
  let chipHost: HTMLElement | null = null;
  if (lead !== undefined) {
    const leadEl = document.createElement('div');
    leadEl.className = 'fs-lead';
    leadEl.title = glossFor(lead);
    const pct = document.createElement('div');
    pct.className = lead.tier === 'APPROXIMATE' ? 'fs-lead__pct fs-lead__pct--approx'
      : 'fs-lead__pct';
    pct.append(document.createTextNode(String(lead.pct)));
    const sup = document.createElement('sup');
    sup.textContent = '%';
    pct.appendChild(sup);
    const of = document.createElement('div');
    of.className = 'fs-lead__of';
    of.textContent = lead.label;
    leadEl.append(pct, of);

    chipHost = document.createElement('div');
    chipHost.className = 'fs-chips';
    body.append(leadEl, chipHost);
  }
  tile.append(bar, body);
  return { tile, chipHost };
}

/**
 * Mint a RegimenItem for a catalog food.
 *
 * ★ THE ID LIVES ON `label`, NOT ON THE ITEM. `RegimenItemSchema` is a plain `z.object()`, so
 * Zod STRIPS any unknown top-level key — an item-level `food_id` would be silently gone
 * before anything read it. `RegimenLabelSchema` alone is `.passthrough()`, which is why the
 * id rides there and why state/coverage.ts::liveNutrients reads `item.label['food_id']`.
 *
 * ★ NUTRIENTS ARE STORED *AND* HEALED. The snapshot below keeps a saved food readable if the
 * catalog ever loses the id, while `provenance: 'food_catalog'` makes liveNutrients re-read
 * the live catalog on every paint — so a corrected portion reaches an existing regimen with
 * no migration. Never mark a food user-supplied: that would freeze the stale snapshot.
 */
export function addCatalogFood(foodId: string): void {
  if (foodId === '') {
    return;
  }
  const food = foodById(foodId);
  if (food === undefined) {
    return; // unresolvable id — do nothing rather than mint an item named after a slug
  }
  const item: RegimenItem = {
    id: Date.now(),
    label: {
      name: food.name,
      food_id: food.id,
      portion_label: food.portion_label,
      nutrients: food.nutrients.map(n => ({ name: n.slug, amount: n.amount, unit: n.unit })),
      servings: 1,
    },
    addedDate: new Date().toISOString().slice(0, 10),
    provenance: FOOD_CATALOG_PROVENANCE,
  };
  addOrBumpRegimenItem(item);
}

/**
 * Render the FOOD SOURCES block into `host`.
 *
 * Returns nothing and owns no state: the caller decides placement, and the view re-renders
 * from the regimen:changed cascade like every other surface here.
 */
export function buildFoodsBlock(
  host: HTMLElement, recs: FoodRec[], opts: FoodsBlockOptions = {},
): void {
  const mark = markFocus(host);
  host.replaceChildren();
  host.appendChild(ruleWithLabel());

  const filter = opts.filter;
  const filterActive = filter !== undefined && (filter.category !== '' || filter.query !== '');

  /**
   * The pager and the filter share one row — pager left, filter right (owner's layout,
   * 2026-08-22). The row is painted whenever EITHER exists, and in particular whenever the
   * filter does: a filter that narrows the list to nothing must still be on screen, or the
   * reader is stranded with no way to undo it.
   */
  const appendControls = (): void => {
    const nav = opts.pager !== undefined
      ? pagerNode({ ...opts.pager, dataAttr: 'foodPage' })
      : null;
    if (filter === undefined) {
      if (nav !== null) {
        host.appendChild(nav);
      }
      return;
    }
    const row = document.createElement('div');
    row.className = 'fs-controls';
    if (nav !== null) {
      row.appendChild(nav);
    }
    row.appendChild(filterNode(filter));
    host.appendChild(row);
  };

  // ── the exhaustion easter egg ──────────────────────────────────────────────
  // Only reachable by adding EVERY food in the catalog, which no ordinary use will ever do.
  // No controls under it: the pool is empty because the user owns all of it, and neither a
  // page nor a filter can change that.
  if (recs.length === 0 && (opts.ownedCount ?? 0) >= foodCatalogSize()) {
    const egg = document.createElement('p');
    egg.className = 'fs-note fs-note--egg';
    egg.append(document.createTextNode(
      'Well, for some reason you added ALL of the foods in our database, not sure why you '
      + 'did that but… ',
    ));
    const link = document.createElement('a');
    link.className = 'fs-prize';
    link.href = PRIZE_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'click here';
    egg.appendChild(link);
    egg.append(document.createTextNode(' to collect your prize!'));
    host.appendChild(egg);
    return;
  }

  if (recs.length === 0) {
    const note = document.createElement('p');
    note.className = 'fs-note';
    // THREE different endings, and conflating any two would lie in one direction or another:
    // a filter matching nothing is not the tab's cap, and neither of those is the catalog
    // having nothing left that moves a gap.
    note.textContent = filterActive
      ? ui('fs_filter_none')
      : (opts.capReached === true
          ? 'That’s the last food this tab will suggest — the rest live on your Regimen.'
          : 'No food moves a remaining gap — what’s left needs a supplement.');
    host.appendChild(note);
    appendControls();
    restoreFocus(host, mark);
    return;
  }

  if (opts.education === true) {
    const note = document.createElement('p');
    note.className = 'fs-note';
    note.textContent = 'Your 90 are covered — these are simply the most nutritious foods.';
    host.appendChild(note);
  }

  const grid = document.createElement('div');
  grid.className = 'fs-grid';
  const pending: { host: HTMLElement; chips: readonly FoodHit[] }[] = [];
  for (const rec of recs) {
    const { tile, chipHost } = tileFor(rec);
    grid.appendChild(tile);
    if (chipHost !== null) {
      pending.push({ host: chipHost, chips: rec.hits.slice(1) });
    }
  }
  host.appendChild(grid);

  appendControls();
  restoreFocus(host, mark);

  // ★ MEASURE AFTER THE DISPLAY FACE LOADS, never before — see the header. `fonts.ready`
  // resolves immediately once the face is in, so this costs nothing on later paints.
  const fit = (): void => {
    for (const p of pending) {
      fitChips(p.host, p.chips);
    }
  };
  if (document.fonts !== undefined) {
    void document.fonts.ready.then(fit);
  } else {
    fit();
  }
}
