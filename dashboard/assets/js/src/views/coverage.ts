/**
 * views/coverage.ts — the Coverage workspace
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The field (every essential Wallach named) + the rail (the CAUSATION behind every lit
 * tile). Built against real data and real state from an approved static design mockup.
 *
 * WHAT IS ADAPTED, NOT COPIED — a mockup is DESIGN TRUTH, not a code donor:
 *   · A mockup's dose stepper is INERT (its prototype data has no per-serving amounts).
 *     LIVE IT MUST MOVE THE COUNTS. It routes saveRgOverride(id, {scaling_factor}) →
 *     writeSlotDoc → 'regimen:changed' → recompute;
 *     state/coverage.ts::readScale already multiplies every delivered mg by that factor.
 *     No dose→coverage curve is invented here: the live math already exists.
 *   · A mockup's status model is BINARY (a product "supplies" a tile → covered). The live
 *     classifier is amount-based and lands on partial/present too. The binary rule is NOT
 *     ported; every verdict is read from the snapshot.
 *   · A mockup interpolates product names into innerHTML. Here every NAME is written with
 *     .textContent — escape at the sink, never with a filter.
 *   · A mockup's `+ ADD` chip has no handler at all. An inert button labelled "+ ADD" would
 *     be a label promising something it cannot do, so here it opens the arrival veil as a
 *     goal picker.
 *
 * THE GOAL RULE, inherited and unbreakable: a goal may change what you LOOK AT, or what
 * you're RECOMMENDED. It may NEVER change what you're MEASURED AGAINST. The denominator is
 * always 90 — the ledger is byte-identical before goals, after goals, and during hover.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import coverageLayoutData from '../../../data/coverage-layout-data.json';
import { emit, on } from '../core/events.js';
import { atMinimumDose, doseCount, doseUnitLabel, doseUnitsOf, stepDose } from '../core/dose-units.js';
import { plural } from '../core/format.js';
import { GOAL_HUES, MAX_GOALS } from '../core/goal-display.js';
import { isUserSupplied } from '../core/provenance.js';
import { CoverageLayoutSchema, type LayoutGoal, type LayoutSection, type LayoutSubsection, type LayoutTile, type RegimenItem } from '../core/schemas/index.js';
import { ui } from '../state/copy.js';
import { defaultServingsFor } from '../state/dose-defaults.js';
import { type CoverageSnapshot, type CoverageStatus, type CoverageTile, essentialCount, getOrCompute } from '../state/coverage.js';
import { rankFoodsForCoverage } from '../state/foods.js';
import { type CoverageRec, productIdsForNames, rankProductsForCoverage, vaultEntry } from '../state/recommender.js';
import { addCatalogFood, buildFoodsBlock } from './foods-block.js';
import { addOrBumpRegimenItem, loadEffectiveRegimen, loadRgUserGoals, loadSlots, saveRgOverride, saveRgRemoved, saveRgUserGoals } from '../state/regimen.js';
import { starterPackIds, starterPackSize } from '../state/starter-pack.js';

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

const LAYOUT = CoverageLayoutSchema.parse(coverageLayoutData);

/**
 * How many rec cards the aside shows. Three, because the aside's vertical budget at 1440×900
 * was measured at four cards and a foods block is planned directly beneath this one — so the
 * products block can no longer spend the whole column.
 *
 * ★ THERE IS NO "SHOW MORE". The list does not need paging because it ADVANCES: add one of
 * the three and it leaves the list (owned products are filtered out), so the next surfaces in
 * its place. A pager on top of that was two ways to see the same nine products.
 */
const REC_PAGE = 3;

/**
 * How many SCORED cards may follow the curated starter pack. The owner's cap (2026-08-21):
 * "a max of 4 more products that best fill the MOST remaining gaps".
 */
const REC_GAP_FILL = 4;

/**
 * How many Youngevity products Coverage will EVER put in a regimen: the whole starter pack,
 * then the gap-fills. The owner's cap (2026-08-21) — "it can only ever recommend 9 total
 * youngevity products from the coverage tab, once 9 youngevity supplements/products are in
 * your regimen, it no longer recommends more."
 *
 * ★ IT COUNTS WHAT YOU OWN, NOT WHAT THE RAIL HAS SHOWN. The budget below is this number
 * minus the vault products already in the active slot, so browsing costs nothing and only
 * ADDING spends it. Nothing about the cap is persisted — `owned` is derived from the regimen
 * on every paint, which is what keeps `recommendations_not_stored` true: remove a product and
 * both the budget and the product itself come straight back.
 *
 * DERIVED, never written down — a hand-typed 9 would silently disagree the day a sixth
 * product is pinned. Coverage-only; the Regimen console deliberately keeps producing until
 * the field is closed.
 */
const REC_MAX = starterPackSize() + REC_GAP_FILL;

/** How many FOOD cards the aside shows at once. Three, matching REC_PAGE, so the two
 *  blocks read as one list split by a labelled rule. */
const FOOD_PAGE = 3;

/**
 * How many foods Coverage will EVER put in a regimen. The owner's cap (2026-08-21):
 * "on the coverage tab a foods section below products, 3 at a time, 12 max".
 *
 * ★ COVERAGE-ONLY. The Regimen console deliberately never exhausts its foods list — once
 * the field is closed it switches to education ranking and keeps going. Do not "make these
 * consistent": the difference is the ruling.
 */
const FOOD_MAX = 12;

// ─── Read helpers ─────────────────────────────────────────────────────────

function tileFor(key: string, snapshot: CoverageSnapshot | null): CoverageTile | undefined {
  return snapshot?.tiles.find(t => t.name === key);
}

function tileStatusFor(key: string, snapshot: CoverageSnapshot | null): CoverageStatus {
  return tileFor(key, snapshot)?.status ?? '';
}

function tileFillPercent(tile: CoverageTile | undefined): number | null {
  if (tile === undefined || tile.status !== 'partial') {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(tile.fillPercent * 100)));
}

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }[c] as string));
}

/**
 * The user's chosen goals, resolved against the layout and capped at MAX_GOALS.
 *
 * Resolved (not trusted): a stored goal id that no longer exists in the layout is DROPPED,
 * because the goal list is re-authored in the layout data and a stale id must degrade to
 * "not selected" rather than render a chip with no members. Order follows the user's pick
 * order, which is what indexes the hue.
 */
function activeGoals(): LayoutGoal[] {
  const chosen = loadRgUserGoals() ?? [];
  const byId = new Map(LAYOUT.goals.map(g => [g.id, g]));
  const out: LayoutGoal[] = [];
  for (const id of chosen) {
    const g = byId.get(id);
    if (g !== undefined && !out.some(o => o.id === g.id)) {
      out.push(g);
    }
    if (out.length >= MAX_GOALS) {
      break;
    }
  }
  return out;
}

/** canon slug → the layout label the tiles are keyed by (tiles carry the display name). */
function layoutTiles(): { slug?: string; name: string; key: string }[] {
  const out: { slug?: string; name: string; key: string }[] = [];
  for (const sec of LAYOUT.sections) {
    const tiles = sec.subsections !== undefined ? sec.subsections.flatMap(s => s.tiles) : (sec.tiles ?? []);
    out.push(...tiles);
  }
  return out;
}

/**
 * slug -> the tile's DISPLAY name. This is what `data-tile` carries (see renderTile), so it is
 * the map for anything matching against the DOM: the tile click-through and the goal hover.
 *
 * ⚠ NOT interchangeable with slugToTargetKey below. 16 of the 91 tiles display something other
 * than their canonical key ('RETINOL' vs 'Vitamin A (Retinol / beta-carotene)'), so using the
 * wrong one silently matches nothing for exactly those 16 -- all 12 vitamins, folate, flavonoids
 * and the 3 omegas. Both directions of that mistake have shipped; both are pinned by
 * tools/tests/test_nogoal_wanted_join.py.
 */
function slugToTileName(): Map<string, string> {
  const m = new Map<string, string>();
  for (const t of layoutTiles()) {
    if (t.slug !== undefined) {
      m.set(t.slug, t.name);
    }
  }
  return m;
}

/**
 * slug -> the tile's canonical `key`. A CoverageSnapshot tile carries this as its `name`
 * (state/coverage.ts buildTiles), so this is the map for anything matching against SNAPSHOT
 * data. See the warning on slugToTileName.
 */
function slugToTargetKey(): Map<string, string> {
  const m = new Map<string, string>();
  for (const t of layoutTiles()) {
    if (t.slug !== undefined) {
      m.set(t.slug, t.key);
    }
  }
  return m;
}

// ─── The field ────────────────────────────────────────────────────────────

/**
 * One tile. `data-tile` carries the layout key so the goal-hover pass can find it without
 * re-deriving anything, and the RING IS A REAL CHILD ELEMENT (`.tile__ring`) — never
 * ::after.
 *
 * ★ WHY THE RING IS ITS OWN ELEMENT (do not collapse it back into a pseudo-element):
 * `.tile.covered::after` is ALREADY the status tick. An element has exactly ONE ::after, and
 * `.tile.covered::after` and `.tile[data-goals]::after` are both specificity (0,2,1) — so the
 * cascade MERGES them per-property instead of one winning, and the ring renders at the tick's
 * 14×5px. Goals own the EDGE, status owns the INTERIOR: two channels, no collision.
 *
 * ★ COVERED TAKES NO RING — enforced in CSS
 * (`.tile.covered > .tile__ring { display: none }`), NOT by skipping the element here, so
 * `data-goals` survives on covered tiles and goal-HOVER still highlights them. The ring
 * marks a goal nutrient you have NOT covered: a to-do marker, not a badge.
 */
function renderTile(spec: LayoutTile, tileClass: string, snapshot: CoverageSnapshot | null, goals: LayoutGoal[]): string {
  const tile = tileFor(spec.key, snapshot);
  const status = tile?.status ?? '';
  const hitIdx = goals
    .map((g, i) => (spec.slug !== undefined && g.members.includes(spec.slug) ? i : -1))
    .filter(i => i >= 0);

  const cls = [tileClass, status, hitIdx.length > 1 ? 'tile--blend' : ''].filter(Boolean).join(' ');
  const fill = tileFillPercent(tile);

  const styles: string[] = [];
  if (fill !== null) {
    styles.push(`--fill: ${fill}%`);
  }
  if (hitIdx.length > 0) {
    const cols = hitIdx.map(i => GOAL_HUES[i] ?? GOAL_HUES[0]);
    // ONE geometry: a single goal is a gradient with one colour, so single and multi are
    // identical in weight and offset — only the paint differs.
    const paint = cols.length === 1
      ? `linear-gradient(${cols[0]}, ${cols[0]})`
      : `linear-gradient(115deg, ${cols.join(', ')})`;
    styles.push(`--ringPaint: ${paint}`);
    // A gradient cannot cast a gradient shadow and an averaged one reads grey, so the glow
    // takes the FIRST goal's hue.
    styles.push(`--ringGlow: ${String(cols[0])}aa`);
  }
  const styleAttr = styles.length > 0 ? ` style="${escHTML(styles.join('; '))}"` : '';
  const goalsAttr = hitIdx.length > 0 ? ` data-goals="${hitIdx.length}"` : '';

  let inner = '';
  if (spec.num !== undefined) {
    inner += `<span class="tile__num">${spec.num}</span>`;
  }
  if (spec.code !== undefined) {
    inner += `<span class="tile__code">${escHTML(spec.code)}</span>`;
  }
  if (spec.sym !== undefined) {
    inner += `<span class="tile__sym">${escHTML(spec.sym)}</span>`;
  }
  if (spec.letter !== undefined) {
    inner += `<span class="tile__letter">${escHTML(spec.letter)}</span>`;
  }
  if (spec.abbr !== undefined) {
    inner += `<span class="tile__abbr">${escHTML(spec.abbr)}</span>`;
  }
  inner += `<span class="tile__name">${escHTML(spec.name)}</span>`;
  if (spec.hint !== undefined) {
    inner += `<span class="tile__hint">${escHTML(spec.hint)}</span>`;
  }
  if (hitIdx.length > 0) {
    inner += '<span class="tile__ring" aria-hidden="true"></span>';
  }
  return `<div class="${cls}" data-tile="${escHTML(spec.name)}"${goalsAttr}${styleAttr}>${inner}</div>`;
}

/**
 * Is this whole subsection covered? Drives the `covered` class that hides the group dots, the
 * same rule tiles follow ("covered takes no ring" — a goal mark is a to-do, not a badge).
 *
 * EVERY tile must be covered, not most: for the plant-derived 34 that is exactly right and not
 * a strict-by-accident choice — they share ONE verdict off the colloidal-mineral bottle, so
 * they flip together and "all" is the only state that ever occurs. `every` on an empty list is
 * vacuously true, hence the length guard: an empty run is not a covered run.
 */
function subCovered(sub: LayoutSubsection, snapshot: CoverageSnapshot | null): boolean {
  return sub.tiles.length > 0
    && sub.tiles.every(t => tileStatusFor(t.key, snapshot) === 'covered');
}

/**
 * A subsection's GROUP goal-dots: ONE DOT PER GOAL that names the run — never a ring per tile.
 *
 * ★ WHY THE GROUP AND NOT 34 RINGS: the plant-derived 34 share ONE verdict off the
 * colloidal-mineral bottle, so the group IS the unit — there is exactly one thing to do about
 * all 34. Ringing them individually would light 34 of the 91 tiles on the 20 of 30 goals that
 * name the group — roughly 37% of the field on two goals out of every three — and a goal system
 * where nearly everything lights on nearly every goal reads as cheap and means nothing. The dots
 * ride the LABEL, which already reads "PLANT DERIVED · 34", so they read as a property of the
 * run.
 *
 * ★ WHY DOTS AND NOT ONE GRADIENT BAR: a gradient MERGES N goals into one blob that cannot be
 * decomposed, so it can never answer "which goal is this for?" and needs a legend to mean
 * anything. Separable dots can: each carries `data-goal`, so hovering a goal chip isolates ITS
 * dot (see onHover) and the hover TEACHES what the indicator means instead of documenting it.
 *
 * ★ AND WHY THIS IS NOT THE SAME AS THE REC-CARD GOAL DOTS, which were removed — the distinction
 * is MEASURED, not aesthetic, so do not "unify" the two: the rec dots lit almost every time (a
 * broad product touches every goal), so they never varied and encoded nothing. These VARY — 20
 * of the 30 goals name the group, so on a 5-goal pick all five dots light only ~11% of the time
 * and the modal case is 3 of 5. A dot here is a fact about YOUR goals; a dot there was a
 * constant.
 *
 * Hues come from GOAL_HUES by PICK order — the same index the tile ring uses, so one colour
 * means one goal everywhere on the field.
 */
function renderGroupDots(sub: LayoutSubsection, goals: LayoutGoal[]): string {
  if (sub.id === undefined) {
    return '';
  }
  const hits = goals
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => (g.groups ?? []).includes(sub.id as string));
  if (hits.length === 0) {
    return '';
  }
  const dots = hits.map(({ g, i }) =>
    `<span class="essentials-subsection__goaldot" data-goal="${escHTML(g.id)}"`
    + ` style="--dotPaint: ${escHTML(GOAL_HUES[i] ?? GOAL_HUES[0])}"`
    + ` title="${escHTML(g.name)}"></span>`).join('');
  return `<span class="essentials-subsection__goaldots" data-goals="${hits.length}">${dots}</span>`;
}

function renderSection(spec: LayoutSection, snapshot: CoverageSnapshot | null, goals: LayoutGoal[]): string {
  let bodyHTML = '';
  let allTiles: LayoutTile[] = [];
  if (spec.subsections !== undefined) {
    bodyHTML = spec.subsections.map(sub => `
      <div class="essentials-subsection${subCovered(sub, snapshot) ? ' covered' : ''}"${sub.id !== undefined ? ` data-sub="${escHTML(sub.id)}"` : ''}>
        <div class="essentials-subsection__label">
          <span class="essentials-subsection__rank">${escHTML(sub.rank)}</span>
          ${escHTML(sub.label)}
          <span class="essentials-subsection__count">· ${sub.tiles.length}</span>
          ${renderGroupDots(sub, goals)}
          <span class="essentials-subsection__hint">${escHTML(sub.hint)}</span>
        </div>
        <div class="${spec.gridClass}">
          ${sub.tiles.map(t => renderTile(t, spec.tileClass, snapshot, goals)).join('')}
        </div>
      </div>
    `).join('');
    allTiles = spec.subsections.flatMap(s => s.tiles);
  }
  else if (spec.tiles !== undefined) {
    bodyHTML = `<div class="${spec.gridClass}">${spec.tiles.map(t => renderTile(t, spec.tileClass, snapshot, goals)).join('')}</div>`;
    allTiles = spec.tiles;
  }

  const counted = allTiles.filter(t => t.essential !== false);
  const total = counted.length;
  const covered = counted.filter((t) => {
    const s = tileStatusFor(t.key, snapshot);
    return s === 'covered' || s === 'trace';
  }).length;

  return `
    <section class="essentials-section">
      <header class="essentials-section__head">
        <div class="essentials-section__num">${escHTML(spec.num)}</div>
        <h3 class="essentials-section__title">${escHTML(spec.title)}</h3>
        <div class="essentials-section__sub">${escHTML(spec.sub)}</div>
        <div class="essentials-section__stat"><strong>${covered}</strong> / ${total} covered</div>
      </header>
      <div class="essentials-section__divider"></div>
      ${bodyHTML}
    </section>
  `;
}

/**
 * The ledger — the colour key, with a live count per status and the reconciliation line.
 *
 * ★ THIS IS THE DENOMINATOR'S ONLY HOME, and it must be byte-identical before goals, after
 * goals, and during a goal hover. It counts the WHOLE field, never the goal subset. A per-goal
 * denominator ("Stronger bones 3/16") would assert that bone health IS those 16 things, which
 * inverts Wallach's thesis — a goal may never shrink what you are measured against.
 *
 * Wording note: the gap row reads "NOT COVERED", not "GAP" — a gap reads as a hole in OUR data,
 * when it actually means Wallach gave a number and you are under it. The empty row reads "NO
 * WALLACH NUMBER YET" for the same reason: the silence is his, not a failed lookup.
 */
function renderLedger(snapshot: CoverageSnapshot | null): string {
  const layoutTiles = LAYOUT.sections.flatMap(sec =>
    (sec.subsections !== undefined ? sec.subsections.flatMap(s => s.tiles) : (sec.tiles ?? [])));
  // ★ THE LEDGER COUNTS THE COUNTED, NOT THE SHOWN. omega-9 is `essential: false` — it is on
  // the board for presentation only (the fatty-acid row reads better as three), and Wallach
  // names only two EFAs, so it can never carry a verdict. Counting all 91 here made the five
  // numbers sum to 91 while the reconciliation line beside them read "90 counted" — a ledger
  // contradicting itself two inches apart. essentialCount() has always filtered it; this must
  // agree, or the two disagree on screen.
  const countedKeys = new Set(layoutTiles.filter(t => t.essential !== false).map(t => t.key));
  const tiles = (snapshot?.tiles ?? []).filter(t => countedKeys.has(t.name));
  const n = (s: CoverageStatus): number => tiles.filter(t => t.status === s).length;
  const counted = snapshot?.totalCount ?? essentialCount();
  const shown = layoutTiles.length;
  const rows: [string, string, number][] = [
    ['covered', ui('cov_ledger_covered'), n('covered')],
    ['partial', ui('cov_ledger_partial'), n('partial')],
    ['present', ui('cov_ledger_present'), n('present')],
    ['gap', ui('cov_ledger_gap'), n('gap')],
    ['pending', ui('cov_ledger_pending'), tiles.filter(t => t.status === '').length],
  ];
  return `
    <div class="ledger-bar">
      <span class="ledger-bar__eyebrow">${escHTML(ui('cov_ledger_eyebrow'))}</span>
      <div class="ledger">
        ${rows.map(([sw, label, count]) => `
          <span class="ledger__item${count === 0 ? ' is-dark' : ''}">
            <span class="legend__sw ${sw}"></span>
            <span class="ledger__label">${escHTML(label)}</span>
            <span class="ledger__n">${count}</span>
          </span>`).join('')}
        <span class="ledger__recon"><b>${counted}</b> counted · <b>${shown}</b> shown</span>
      </div>
    </div>
  `;
}

function renderField(snapshot: CoverageSnapshot | null, goals: LayoutGoal[]): string {
  const sections = LAYOUT.sections.map(s => renderSection(s, snapshot, goals)).join('');
  return `
    <section class="essentials-host ds-border-travel">
      ${sections}
      ${renderLedger(snapshot)}
    </section>
  `;
}

// ─── The goal strip ───────────────────────────────────────────────────────

/**
 * The strip REPORTS your goals; it never asks. Hover a chip = TRANSIENT focus (fade the
 * others) — it cannot teach that anything is unimportant, because it lasts exactly as long
 * as the cursor does. The X is revealed on hover with ZERO layout shift (the space is always
 * reserved); a confirm-delete mode was rejected — the action is one click to undo.
 */
function renderGoalStrip(goals: LayoutGoal[]): string {
  if (goals.length === 0) {
    return `
      <div class="goalstrip">
        <span class="goalstrip__eyebrow">${escHTML(ui('cov_goals_eyebrow'))}</span>
        <button class="gchip gchip--add" type="button" data-goal-add>${escHTML(ui('cov_goals_add'))}</button>
        <span class="goalstrip__eyebrow goalstrip__eyebrow--end">${escHTML(ui('cov_goals_none'))}</span>
      </div>
    `;
  }
  const chips = goals.map((g, i) => `
    <span class="gchip" data-goal="${escHTML(g.id)}" style="--gc: ${escHTML(GOAL_HUES[i] ?? GOAL_HUES[0])}">
      <span class="gchip__dot"></span><span class="gchip__label">${escHTML(g.name)}</span>
      <button class="ui-close ui-close--sm gchip__x" type="button" data-goal-remove="${escHTML(g.id)}" aria-label="Remove ${escHTML(g.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </span>`).join('');
  const addChip = goals.length < MAX_GOALS
    ? `<button class="gchip gchip--add" type="button" data-goal-add>${escHTML(ui('cov_goals_add'))}</button>`
    : '';
  return `
    <div class="goalstrip">
      <span class="goalstrip__eyebrow">${escHTML(ui('cov_goals_eyebrow'))}</span>
      ${chips}${addChip}
      <span class="goalstrip__eyebrow goalstrip__eyebrow--end">${escHTML(ui('cov_goals_hint'))}</span>
    </div>
  `;
}

// ─── The aside: recommendations, then the protocol ────────────────────────

/**
 * What the recommender should target.
 *
 * ★ EVERY ESSENTIAL STILL OUTSTANDING — and deliberately NOT the goal's members.
 * The owner's ruling (2026-08-21): the gap-fill cards should target "the MOST remaining
 * gaps, whether they are goals or not". Scoping the want-set to goal members meant the rail
 * kept offering products for essentials the user had already covered, while real holes
 * outside the goal went unmentioned. Goals still tint the cards (`goalIds` → the coloured
 * ring) — they no longer decide WHAT is offered. This does not touch the goal rule in this
 * file's header: the denominator is still 90, before goals, after goals and during hover.
 *
 * ★ OUTSTANDING IS "NOT COVERED", not "gap". Those differ: `gap` excludes `partial`,
 * `present` and the blank status, all three of which are still genuinely unfinished. Using
 * `gap` alone hid every partially-filled essential from the recommender.
 */
function wantedSlugs(snapshot: CoverageSnapshot | null, goals: LayoutGoal[]): string[] {
  void goals;
  // Join outstanding tiles back to slugs. Both sides key on the layout tile's `key` (the
  // canonical target name), which is what CoverageSnapshot tiles carry as `name`. Do NOT map to
  // the tile's DISPLAY name here: 16 of the 91 tiles show something different from their key
  // (vitamin-c displays 'ASCORBIC ACID' against the key 'Vitamin C (Ascorbic Acid)'), and a
  // display-name join silently dropped every one of them — all 12 vitamins, folate, flavonoids
  // and the 3 omegas — so no vitamin gap could ever pull a recommendation in no-goal mode.
  // The lower-casing is belt-and-braces; the keys already match exactly.
  // Negative control: tools/tests/test_nogoal_wanted_join.py (plants the old display-name
  // join and asserts it still loses exactly those 16).
  const keyToSlug = new Map([...slugToTargetKey()].map(([slug, key]) => [key.toLowerCase(), slug]));
  return (snapshot?.tiles ?? [])
    .filter(t => t.status !== 'covered')
    .map(t => keyToSlug.get(t.name.toLowerCase()))
    .filter((s): s is string => s !== undefined);
}

/** The rec cards, built as DOM (names via textContent, never innerHTML). */
function buildRecs(
  host: HTMLElement, recs: CoverageRec[], goals: LayoutGoal[], capReached: boolean,
): void {
  host.replaceChildren();
  const head = document.createElement('div');
  head.className = 'recs__head';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'recs__eyebrow';
  eyebrow.textContent = ui('cov_recs_eyebrow');
  head.appendChild(eyebrow);
  host.appendChild(head);

  if (recs.length === 0) {
    const note = document.createElement('p');
    note.className = 'recs__note';
    // Two DIFFERENT endings, and conflating them would lie in one direction or the other:
    // hitting the cap does not mean the field is closed, and closing the field is not the cap.
    note.textContent = ui(capReached ? 'cov_recs_cap_reached' : 'cov_recs_done_field');
    host.appendChild(note);
    return;
  }

  const page = recs.slice(0, REC_PAGE);

  const hueOf = (id: string): string => {
    const i = goals.findIndex(g => g.id === id);
    return GOAL_HUES[i] ?? GOAL_HUES[0];
  };

  /**
   * `cols` paints the card's BORDER only. There are no per-goal dots on a rec card.
   *
   * ★ WHY, measured rather than argued: the dots were a dead channel. `goalIds` (state/
   * recommender.ts) lights a goal when the product delivers ANY ONE of its members — measured
   * against the shipped data, 29 of the 155 recommender products light ALL 30 goals and 64 light
   * 29 or more, so every top-ranked card lit every picked goal. Identical rows carry no
   * information.
   *
   * ★ AND THE OBVIOUS FIX DOES NOT WORK — do not re-propose it: a %-of-target threshold was
   * measured at 10 / 25 / 50 AND 100 % of the Wallach target, and all four top cards still lit
   * every picked goal at every level. The ranker rewards breadth, so the products that REACH
   * this list are broad multis, and a broad multi genuinely delivers a full target of SOMETHING
   * in every goal. Weighting by contribution was measured too and landed the broad multis in one
   * narrow band across every goal — near-identical dots again. The fact does not vary, so no
   * encoding can show variation.
   *
   * The border stays exactly as it works today: any recommendation is good for almost any goal,
   * so a decorative, mostly-true tint earns its keep where five identical dots did not.
   * `goalIds`' ANY-member rule is therefore deliberately UNCHANGED: it is a border tint, not a
   * claim.
   */
  for (const r of page) {
    const cols = r.goalIds.map(hueOf);
    const ring = cols.length === 0
      ? 'linear-gradient(var(--ds-rule), var(--ds-rule))'
      : cols.length === 1
        ? `linear-gradient(${cols[0]}, ${cols[0]})`
        : `linear-gradient(140deg, ${cols.join(', ')})`;

    const card = document.createElement('button');
    card.className = 'rec';
    card.type = 'button';
    card.dataset['recAdd'] = r.productId;
    card.style.setProperty('--recRing', ring);

    const name = document.createElement('div');
    name.className = 'rec__name';
    name.textContent = r.name; // the product name — a text node, never parsed as HTML
    card.appendChild(name);

    const meta = document.createElement('div');
    meta.className = 'rec__meta';
    const price = document.createElement('span');
    price.className = 'rec__price';
    price.textContent = `$${r.price.toFixed(2)}`;
    const supplies = document.createElement('span');
    supplies.className = 'rec__q';
    supplies.textContent = `adds ${r.supplies}`;
    const val = document.createElement('span');
    val.className = 'rec__val rec__q';
    val.textContent = `${r.perTenDollars.toFixed(1)} / $10`;
    // The explainer is a TWO-STAGE HOVER (card → dotted underline; numbers → the text), so the
    // card carries no standing paragraph of its own.
    const tip = document.createElement('span');
    tip.className = 'rec__tip';
    tip.textContent = ui('cov_rec_tip');
    meta.append(price, supplies, val, tip);
    card.appendChild(meta);

    const add = document.createElement('span');
    add.className = 'rec__add';
    add.textContent = '+';
    card.appendChild(add);
    host.appendChild(card);
  }
}

/**
 * The protocol rows. Name truncated FROM THE END (names back-load packaging — measured: 33%
 * exceed 30 chars, longest 69), a YOURS mark on the user's own scans, an inline dose
 * stepper counting the product's own units, 1-click
 * remove.
 *
 * ★ NO "this item covers N tiles" claim. The field is six inches away and would contradict
 * any fabricated count.
 */
function buildRailRows(host: HTMLElement, items: ReturnType<typeof loadEffectiveRegimen>): void {
  host.replaceChildren();
  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'rail-empty';
    const p = document.createElement('p');
    p.textContent = ui('cov_rail_empty');
    const small = document.createElement('small');
    small.textContent = ui('cov_rail_empty_sub');
    empty.append(p, small);
    host.appendChild(empty);
    return;
  }

  for (const item of items) {
    const id = String(item.id);
    const label = typeof item.label.name === 'string' ? item.label.name : '?';
    const dose = readItemDose(item);

    const row = document.createElement('div');
    row.className = 'rl-row';
    row.dataset['rowId'] = id;

    const nameEl = document.createElement('div');
    nameEl.className = 'rl-row__name';
    nameEl.textContent = label; // text node — the product name is never parsed as HTML
    nameEl.title = label;
    row.appendChild(nameEl);

    const x = document.createElement('button');
    // The same control the Regimen rail and the goal chips already use, so "remove" looks
    // like one thing across the app. Unlike the goal chip's, it is NOT hover-revealed: a
    // regimen row is a thing you remove, and a control that only exists on hover cannot be
    // found on a touch surface at all.
    x.className = 'ui-close ui-close--sm rl-row__x';
    x.type = 'button';
    x.dataset['rowRemove'] = id;
    x.setAttribute('aria-label', `Remove ${label}`);
    x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    row.appendChild(x);

    const foot = document.createElement('div');
    foot.className = 'rl-row__foot';
    // ONLY the user's own items are marked. "EDEN" was inside baseball — it named an
    // internal pillar to someone who has no reason to know one exists, and it appeared on
    // nearly every row, so it carried no information either. YOURS stays: that one IS worth
    // knowing, because such an item's numbers came off a label the user photographed or typed
    // in themselves, rather than from the product database.
    if (isUserSupplied(item.provenance)) {
      const src = document.createElement('span');
      src.className = 'rl-src is-own';
      src.textContent = 'YOURS';
      foot.appendChild(src);
    }

    const doseEl = document.createElement('span');
    doseEl.className = 'rl-dose';
    const minus = document.createElement('button');
    minus.className = 'rl-dose__b';
    minus.type = 'button';
    minus.dataset['doseDown'] = id;
    minus.setAttribute('aria-label', 'Fewer');
    minus.textContent = '−';
    // `dose` is SERVINGS; the stepper speaks the product's own units. For a liquid or powder
    // the two are the same number and every line below is a no-op.
    const units = doseUnitsOf(item.label);
    minus.disabled = atMinimumDose(dose, units);
    const nEl = document.createElement('span');
    nEl.className = 'rl-dose__n';
    nEl.textContent = formatDose(doseCount(dose, units));
    const plus = document.createElement('button');
    plus.className = 'rl-dose__b';
    plus.type = 'button';
    plus.dataset['doseUp'] = id;
    plus.setAttribute('aria-label', 'More');
    plus.textContent = '+';
    const unit = document.createElement('span');
    unit.className = 'rl-dose__u';
    unit.textContent = doseUnitLabel(doseCount(dose, units), units);
    doseEl.append(minus, nEl, plus, unit);
    foot.appendChild(doseEl);

    row.appendChild(foot);
    host.appendChild(row);
  }
}

/**
 * The item's current servings/day. Mirrors state/coverage.ts::readScale's resolution order
 * (override → label.servings → 1) so the number the stepper SHOWS is the number the coverage
 * math USES — if these two ever disagree, the rail is lying about the field.
 *
 * ⚠ Deliberately does NOT read `item.scaling_factor`: RegimenItemSchema is a plain z.object()
 * so Zod STRIPS it before any reader sees it. readScale documents the same dead branch. Do
 * not "restore" it here without opting the schema in first.
 */
function readItemDose(item: ReturnType<typeof loadEffectiveRegimen>[number]): number {
  const slots = loadSlots();
  const active = slots.slots.find(s => s.id === slots.activeSlot);
  const ov = active?.overrides[String(item.id)] as { scaling_factor?: unknown } | undefined;
  const candidates: unknown[] = [ov?.scaling_factor, (item.label as Record<string, unknown>)['servings']];
  for (const c of candidates) {
    const n = typeof c === 'number' ? c : typeof c === 'string' ? Number.parseFloat(c) : Number.NaN;
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return 1;
}

/**
 * Servings/day for display. INTEGER STEPS, but a SOURCED FRACTIONAL DEFAULT is allowed —
 * Plant Derived Minerals is the ONE product Wallach doses by name
 * (1 fl oz/100 lb = 1.54 servings at 154 lb), and a pure-integer control could not express
 * his own number for it. So 1.54 shows as "1.54"; 2 shows as "2", not "2.00".
 */
function formatDose(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

function renderRail(items: ReturnType<typeof loadEffectiveRegimen>): string {
  const slots = loadSlots();
  const active = slots.slots.find(s => s.id === slots.activeSlot);
  // The ACTIVE SLOT'S NAME, read-only. No switcher — switching lives in Regimen. It is here so
  // a user with four saves can never wonder which one they just changed, and it is READ from
  // state rather than hardcoded: a fixed title would assert a fact the view does not know.
  const slotName = (active?.name ?? 'Default').toUpperCase();
  return `
    <div class="rail-panel">
      <div class="rail-panel__head">
        <div class="rail-panel__eyebrow">${escHTML(ui('cov_rail_eyebrow'))}</div>
        <h3 class="rail-panel__title">${escHTML(ui('cov_rail_title'))}</h3>
        <div class="rail-panel__meta">
          <span class="rail-panel__slot">${escHTML(slotName)}</span> · ${items.length} ${escHTML(plural(items.length, 'ITEM').toUpperCase())}
        </div>
      </div>
      <div class="rail-list" data-rail-list></div>
      <div class="rail-panel__actions">
        <button class="ds-btn-primary rail-panel__full" type="button" data-full-regimen>${escHTML(ui('cov_rail_full'))}</button>
      </div>
    </div>
  `;
}

// ─── Mount ────────────────────────────────────────────────────────────────

/**
 * Re-render without throwing the reader back to the top of the page.
 *
 * Both workspaces repaint by replacing `container.innerHTML`, and every dose step fires a
 * recompute, so a `+` halfway down a 91-tile field used to scroll the page to the top and make
 * the user find their place again. The three workspaces share ONE scroller (`.app-workspace`,
 * dashboard.css), which is the element whose scrollTop has to survive the swap.
 *
 * Restored synchronously: the replacement content is the same shape as what it replaced, so the
 * scroll height is already correct by the time this runs and the browser clamps nothing. A
 * rAF here would paint the top of the page for one frame first -- which is the flash itself.
 */
function withScrollPreserved(container: HTMLElement, paint: () => void): void {
  const scroller = container.closest<HTMLElement>('.app-workspace');
  const keep = scroller !== null ? scroller.scrollTop : 0;
  paint();
  if (scroller !== null && keep > 0 && scroller.scrollTop !== keep) {
    scroller.scrollTop = keep;
  }
}

export function mount(container: HTMLElement): MountHandle {
  const render = (): void => { withScrollPreserved(container, paint); };

  const paint = (): void => {
    // A stationary cursor over a just-removed goal x fires no mouseout, so a stale
    // body.focusing (the goal-hover dim) would otherwise stick through this rebuild. Clear it
    // first.
    document.body.classList.remove('focusing');
    const snapshot = getOrCompute();
    const goals = activeGoals();
    const items = loadEffectiveRegimen();

    container.innerHTML = `
      <div class="coverage-workspace">
        ${renderGoalStrip(goals)}
        <div class="cov-d">
          <div class="coverage-grid">
            ${renderField(snapshot, goals)}
            <aside class="cov-aside">
              <div class="recs" data-recs></div>
              <div class="fs-block" data-foodsblock></div>
              ${renderRail(items)}
            </aside>
          </div>
        </div>
      </div>
    `;

    // The two name-bearing regions are built as DOM, not markup, so every product name is a text
    // node and can never be parsed as HTML. They are filled AFTER the shell so the shell can stay
    // a template.
    const railList = container.querySelector<HTMLElement>('[data-rail-list]');
    if (railList !== null) {
      buildRailRows(railList, items);
    }
    const recsHost = container.querySelector<HTMLElement>('[data-recs]');
    if (recsHost !== null) {
      // A RegimenItem has no product_id — its identity is label.name (see
      // recommender.ts::productIdsForNames). Reading a product_id here silently owned
      // nothing.
      const owned = productIdsForNames(
        items.map(i => (typeof i.label.name === 'string' ? i.label.name : '')).filter(Boolean),
      );
      // What is LEFT of the cap. `owned` is the regimen resolved to vault product ids, so
      // its length IS the count of Youngevity products the user holds. At zero the rail stops
      // offering entirely and says why — silently rendering nothing would read as a bug.
      const budget = Math.max(0, REC_MAX - owned.length);
      const recs = budget === 0 ? [] : rankProductsForCoverage({
        want: wantedSlugs(snapshot, goals),
        owned,
        goals: goals.map(g => ({ id: g.id, members: g.members })),
        limit: budget,
        pinned: starterPackIds(),
        greedy: true,
      });
      buildRecs(recsHost, recs, goals, budget === 0);
    }
    const foodsHost = container.querySelector<HTMLElement>('[data-foodsblock]');
    if (foodsHost !== null) {
      // Coverage's foods are CAPPED where the Regimen console's are not — the owner's
      // rule (2026-08-21): "a foods section BELOW products, 3 at a time, 12 max". Same
      // shape as REC_MAX above and counted the same way: it counts what you OWN, not what
      // the rail has shown, so browsing costs nothing and only ADDING spends it.
      const ownedFoods = items
        .map(i => i.label['food_id'])
        .filter((v): v is string => typeof v === 'string');
      const foodBudget = Math.max(0, FOOD_MAX - ownedFoods.length);
      const foodRecs = foodBudget === 0 ? [] : rankFoodsForCoverage({
        want: wantedSlugs(snapshot, goals),
        owned: ownedFoods,
        goals: goals.map(g => ({ id: g.id, members: g.members })),
        limit: Math.min(FOOD_PAGE, foodBudget),
        greedy: true,
      });
      buildFoodsBlock(foodsHost, foodRecs, {
        ownedCount: ownedFoods.length,
        capReached: foodBudget === 0,
      });
    }
  };

  // ONE delegated listener on the container — the view re-renders by replacing innerHTML, so
  // per-element handlers would be destroyed on every cascade (and re-binding them on each
  // render is how listener leaks start).
  const onClick = (ev: Event): void => {
    const t = ev.target as HTMLElement | null;
    if (t === null) {
      return;
    }
    const remove = t.closest<HTMLElement>('[data-goal-remove]');
    if (remove !== null) {
      const id = remove.dataset['goalRemove'] ?? '';
      saveRgUserGoals((loadRgUserGoals() ?? []).filter(g => g !== id));
      return;
    }
    if (t.closest('[data-goal-add]') !== null) {
      // The veil IS the goal picker — an inert "+ ADD" would be a label that lies.
      window.dispatchEvent(new CustomEvent('wallach:open-welcome'));
      return;
    }
    const rowRemove = t.closest<HTMLElement>('[data-row-remove]');
    if (rowRemove !== null) {
      // saveRgRemoved takes NUMERIC ids (the slot's items are numbered); the dataset is
      // always a string, so the parse is the boundary. A non-numeric id is dropped rather
      // than sent as NaN, which would match nothing and silently no-op.
      const n = Number.parseInt(rowRemove.dataset['rowRemove'] ?? '', 10);
      if (Number.isFinite(n)) {
        saveRgRemoved(new Set([n]));
      }
      return;
    }
    const up = t.closest<HTMLElement>('[data-dose-up]');
    const down = t.closest<HTMLElement>('[data-dose-down]');
    if (up !== null || down !== null) {
      bumpDose((up ?? down)?.dataset[up !== null ? 'doseUp' : 'doseDown'] ?? '', up !== null ? 1 : -1);
      return;
    }
    const rec = t.closest<HTMLElement>('[data-rec-add]');
    if (rec !== null) {
      addVaultProduct(rec.dataset['recAdd'] ?? '');
      return;
    }
    const foodCard = t.closest<HTMLElement>('[data-food-add]');
    if (foodCard !== null) {
      addCatalogFood(foodCard.dataset['foodAdd'] ?? '');
      return;
    }
    if (t.closest('[data-full-regimen]') !== null) {
      window.dispatchEvent(new CustomEvent('wallach:navigate', { detail: { to: 'regimen' } }));
      return;
    }
    // A tile opens that element's Knowledge page. This is the ONLY entrance to the essential
    // detail view, so it has to work for every card — `data-tile` carries the LAYOUT key, which
    // is exactly what the detail page is keyed by, but the event contract speaks slugs, so
    // resolve it here rather than leaning on openEntity's fallback. Checked LAST so every action
    // control above (goal add, row remove, dose steppers, recommendations) still wins inside a
    // tile.
    const tileEl = t.closest<HTMLElement>('[data-tile]');
    if (tileEl !== null) {
      const key = tileEl.dataset['tile'] ?? '';
      const slug = [...slugToTileName()].find(([, n]) => n === key)?.[0];
      if (slug !== undefined) {
        emit('knowledge:open-entity', { kind: 'essential', slug });
      }
    }
  };

  /**
   * Goal HOVER = transient focus. Delegated on the container for the same reason as click.
   * It only ever adds/removes a class — it never touches state, so it cannot change a
   * verdict or a count.
   */
  const onHover = (ev: Event): void => {
    const t = ev.target as HTMLElement | null;
    const chip = t?.closest<HTMLElement>('.gchip[data-goal]') ?? null;
    const body = document.body;
    const tiles = container.querySelectorAll<HTMLElement>('.tile, .tile--vitamin, .tile--amino, .tile--fat');
    // The group dots focus on the SAME hover as the tiles. This is what earns dots over one
    // gradient bar: hovering a goal isolates ITS dot, so the hover TEACHES what the mark means.
    // A merged gradient could never do this — there is no per-goal element in it to isolate.
    const dots = container.querySelectorAll<HTMLElement>('.essentials-subsection__goaldot');
    if (chip === null) {
      body.classList.remove('focusing');
      tiles.forEach(x => x.classList.remove('is-focus'));
      dots.forEach(x => x.classList.remove('is-focus'));
      return;
    }
    const goal = LAYOUT.goals.find(g => g.id === chip.dataset['goal']);
    if (goal === undefined) {
      return;
    }
    const names = new Set(goal.members.map(s => slugToTileName().get(s)).filter(Boolean));
    body.classList.add('focusing');
    tiles.forEach(x => x.classList.toggle('is-focus', names.has(x.dataset['tile'] ?? '')));
    // A goal Wallach never names the complex for has NO dot here, so nothing focuses — which is
    // itself the honest answer ("this group does nothing for that goal"), not a missing state.
    dots.forEach(x => x.classList.toggle('is-focus', x.dataset['goal'] === goal.id));
  };

  render();

  container.addEventListener('click', onClick);
  container.addEventListener('mouseover', onHover);
  container.addEventListener('mouseout', onHover);

  const unsubCoverage = on('coverage:recomputed', () => render());
  const unsubRegimen = on('regimen:changed', () => render());

  return {
    update: render,
    unmount: () => {
      unsubCoverage();
      unsubRegimen();
      container.removeEventListener('click', onClick);
      container.removeEventListener('mouseover', onHover);
      container.removeEventListener('mouseout', onHover);
      document.body.classList.remove('focusing');
      container.innerHTML = '';
    },
  };
}

/**
 * The rec card's `+` — 1-click add. Discoverability is solved by a `+` on each card, not by a
 * second button whose label promises something else.
 *
 * Resolves the vault id, mints the SAME RegimenItem shape as views/regimen.ts's vault picker
 * — provenance 'user_manual', because a vault-matched add IS an Eden product, not the user's
 * own scanned item (that distinction is what the YOURS mark reads) — then delegates to
 * state/regimen.ts::addOrBumpRegimenItem, the ONE home of the add-or-bump rule: a same-named
 * item already in the slot has its dose raised instead of a duplicate row (two rows for one
 * product would double-count it on the field). That helper routes through the regimen write
 * chokepoint (saveRgManual / saveRgOverride → writeSlotDoc → 'regimen:changed'), which cascades
 * the recompute; the view re-renders off the event, so the field relights and the product leaves
 * its own recommendation list.
 */
function addVaultProduct(productId: string): void {
  if (productId === '') {
    return;
  }
  const entry = vaultEntry(productId);
  if (entry === null) {
    return; // unresolvable id — do nothing rather than mint an item with a slug for a name
  }
  const item: RegimenItem = {
    id: Date.now(),
    label: {
      name: entry.name,
      nutrients: entry.nutrients,
      // The unit facts live on the LABEL, not looked up from the vault at render time: a
      // scanned item has a label and no vault entry, so the stepper must read one place.
      ...(entry.servingUnits !== null
        ? { serving_units: entry.servingUnits, serving_unit: entry.servingUnit }
        : {}),
      // `servings` is the dose in SERVINGS — the unit readScale and the coverage math speak.
      // One label serving unless the product is curated otherwise; see state/dose-defaults.
      servings: defaultServingsFor(productId, entry.servingUnits),
    },
    addedDate: new Date().toISOString().slice(0, 10),
    provenance: 'user_manual',
  };
  addOrBumpRegimenItem(item);
}

/**
 * The dose stepper — this is what makes increasing a dose move the counts.
 *
 * Whole-serving steps, floored at 1. It writes through the single regimen write chokepoint
 * (saveRgOverride → writeSlotDoc → 'regimen:changed'), which cascades a recompute; the view
 * re-renders off the event, so the counts MOVE. Nothing here computes coverage — the scale
 * is handed to the engine and the engine decides.
 *
 * ★ Stepping from a sourced fractional default (Plant Derived Minerals' 1.54) yields 2.54, not
 * 2: the step is relative, so the user's Wallach-sourced starting point is preserved rather than
 * silently rounded away. Floor is 1 because a 0/day item is a REMOVED item, and removal has its
 * own one-click control that routes to the trash (an item at 0 would be invisible on the field
 * but still in the slot — a state with no honest rendering).
 */
function bumpDose(id: string, delta: number): void {
  if (id === '') {
    return;
  }
  const item = loadEffectiveRegimen().find(i => String(i.id) === id);
  if (item === undefined) {
    return;
  }
  // Step by ONE UNIT, not one serving: on a 4-tablet serving the old floor trapped the user
  // at four tablets when they may want one. Still stored as servings — the coverage math is
  // untouched by any of this.
  const next = stepDose(readItemDose(item), delta, doseUnitsOf(item.label));
  saveRgOverride(id, { scaling_factor: next });
}
