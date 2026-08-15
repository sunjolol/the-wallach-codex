/**
 * views/coverage.ts — the Coverage workspace
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The field (every essential Wallach named) + the rail (the CAUSATION behind every lit
 * tile). RE-CREATED 2026-07-16 from the signed-off demo `temporary/coverage-E-rail.html`
 * on real data + real state — never transplanted. Luneth: "we still shouldn't blindly copy
 * code since some of it will need to be adapted to work on the live surface (such as
 * increasing dosage changing counts)".
 *
 * WHAT IS ADAPTED, NOT COPIED — the demo is DESIGN TRUTH, not a code donor:
 *   · The demo's dose stepper is INERT (its prototype data has no per-serving amounts).
 *     LIVE IT MUST MOVE THE COUNTS — Luneth's named example. It routes
 *     saveRgOverride(id, {scaling_factor}) → writeSlotDoc → 'regimen:changed' → recompute;
 *     state/coverage.ts::readScale already multiplies every delivered mg by that factor.
 *     No dose→coverage curve is invented here: the live math already exists.
 *   · The demo's status model is BINARY (a product "supplies" a tile → covered). The live
 *     classifier is amount-based and lands on partial/present too. The binary rule is NOT
 *     ported; every verdict is read from the snapshot.
 *   · The demo interpolates product names into innerHTML. Here every NAME is written with
 *     .textContent (§00.B #5, escape by default) — the sink, not a filter, is the defence.
 *   · The demo's `+ ADD` chip has no handler at all. An inert button labelled "+ ADD" is
 *     the PROFILE lesson inverted (a label is a promise), so it opens the arrival veil as
 *     a goal picker.
 *
 * THE GOAL RULE, inherited and unbreakable: a goal may change what you LOOK AT, or what
 * you're RECOMMENDED. It may NEVER change what you're MEASURED AGAINST. The denominator is
 * always 90 — the ledger is byte-identical before goals, after goals, and during hover.
 *
 * §17 lesson: corruption recovery for this file is `git checkout HEAD -- ...`.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import coverageLayoutData from '../../../data/coverage-layout-data.json';
import { emit, on } from '../core/events.js';
import { plural } from '../core/format.js';
import { GOAL_HUES, MAX_GOALS } from '../core/goal-display.js';
import { CoverageLayoutSchema, type LayoutGoal, type LayoutSection, type LayoutSubsection, type LayoutTile, type RegimenItem } from '../core/schemas/index.js';
import { ui } from '../state/copy.js';
import { type CoverageSnapshot, type CoverageStatus, type CoverageTile, essentialCount, getOrCompute } from '../state/coverage.js';
import { type CoverageRec, productIdsForNames, rankProductsForCoverage, vaultEntry } from '../state/recommender.js';
import { loadEffectiveRegimen, loadRgManual, loadRgUserGoals, loadSlots, saveRgManual, saveRgOverride, saveRgRemoved, saveRgUserGoals } from '../state/regimen.js';

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

const LAYOUT = CoverageLayoutSchema.parse(coverageLayoutData);

/** The rail shows 4 recommendation cards (measured: the aside's budget at 1440×900). */
const REC_LIMIT = 4;

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
 * because Luneth re-authors the goal list and a stale id must degrade to "not selected"
 * rather than render a chip with no members. Order follows the user's pick order, which is
 * what indexes the hue.
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
function slugToTileKey(): Map<string, string> {
  const m = new Map<string, string>();
  for (const sec of LAYOUT.sections) {
    const tiles = sec.subsections !== undefined ? sec.subsections.flatMap(s => s.tiles) : (sec.tiles ?? []);
    for (const t of tiles) {
      if (t.slug !== undefined) {
        m.set(t.slug, t.name);
      }
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
 * ★ WHY THE RING IS ITS OWN ELEMENT (the 2026-07-16 bug, do not undo): `.tile.covered::after`
 * is ALREADY the status tick. An element has exactly ONE ::after, and `.tile.covered::after`
 * and `.tile[data-goals]::after` are both specificity (0,2,1) — so the cascade MERGED them
 * per-property instead of one winning, and the ring rendered at the TICK'S 14×5px. Goals own
 * the EDGE, status owns the INTERIOR: two channels, no collision.
 *
 * ★ COVERED TAKES NO RING (Luneth, 2026-07-16) — enforced in CSS
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
 * ★ WHY THE GROUP AND NOT 34 RINGS (Luneth's ruling, 2026-07-16): the plant-derived 34 share
 * ONE verdict off the colloidal-mineral bottle, so the group IS the unit — there is exactly one
 * thing to do about all 34. Ringing them individually would light 34 of 91 tiles on 9 of the 14
 * goals (~37% of the field on nearly every goal), and "having ALL tiles light up on every goal
 * will make the goal system feel cheap and pointless" (his words). The dots ride the LABEL,
 * which already reads "PLANT DERIVED · 34", so they read as a property of the run.
 *
 * ★ WHY DOTS AND NOT ONE GRADIENT BAR (Luneth, 2026-07-16 — this REPLACED a bar I shipped
 * first): a gradient MERGES N goals into one blob that cannot be decomposed, so it can never
 * answer "which goal is this for?" and needs a legend to mean anything. Separable dots can:
 * each carries `data-goal`, so hovering a goal chip isolates ITS dot (see onHover) and the
 * hover TEACHES what the indicator means instead of documenting it.
 *
 * ★ AND WHY THIS IS NOT THE REC-CARD DOTS DELETED THE SAME DAY — the distinction is MEASURED,
 * not aesthetic, so do not "unify" the two: the rec dots lit ~100% of the time (every product
 * touches every goal), so they never varied and encoded nothing. These VARY — 9 of 14 goals
 * name the group, so on a 5-goal pick all five dots light only 6.3% of the time and the modal
 * case is 3 of 5. A dot here is a fact about YOUR goals; a dot there was a constant.
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
 * goals, and during a goal hover. It counts the WHOLE field, never the goal subset. The old
 * goal cards' sin was never the goal, it was the denominator ("bone & skeletal 3/14"
 * asserts bone health IS 14 things, inverting Wallach's thesis).
 *
 * The wording is the signed-off demo's: "GAP · ATTENTION" → "NOT COVERED" (gap read as a
 * hole in OUR data; it means Wallach gave a number and you are under it) and "NO WALLACH
 * TARGET" → "NO WALLACH NUMBER YET".
 */
function renderLedger(snapshot: CoverageSnapshot | null): string {
  const layoutTiles = LAYOUT.sections.flatMap(sec =>
    (sec.subsections !== undefined ? sec.subsections.flatMap(s => s.tiles) : (sec.tiles ?? [])));
  // ★ THE LEDGER COUNTS THE COUNTED, NOT THE SHOWN. omega-9 is `essential: false` — it is on
  // the board for a reason Luneth labelled honestly as aesthetic ("3 is a better number than
  // 2"), and Wallach names only two EFAs, so it can never carry a verdict. Counting all 91
  // here made the five numbers sum to 91 while the reconciliation line beside them read "90
  // counted" — a ledger contradicting itself two inches apart. essentialCount() has always
  // filtered it; this must agree, or the two disagree on screen.
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
      <button class="gchip__x" type="button" data-goal-remove="${escHTML(g.id)}" aria-label="Remove ${escHTML(g.name)}">✕</button>
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
 * With goals: the union of their members (the demo's rule — the card's copy is "your goal
 * nutrients per $10 spent", not "your UNCOVERED goal nutrients"). With none: the field's
 * current gaps, so a goal-less user still gets an honest, useful list ranked by breadth
 * across all 90 (blueprint §5).
 */
function wantedSlugs(snapshot: CoverageSnapshot | null, goals: LayoutGoal[]): string[] {
  if (goals.length > 0) {
    return [...new Set(goals.flatMap(g => g.members))];
  }
  // Join snapshot-gap tiles back to slugs. The layout keys tiles by an UPPERCASE display
  // name ('HYDROGEN') while the snapshot carries the Title-case target name ('Hydrogen'),
  // so the reverse lookup must normalise case or every gap misses and want becomes [].
  const keyToSlug = new Map([...slugToTileKey()].map(([slug, key]) => [key.toLowerCase(), slug]));
  return (snapshot?.tiles ?? [])
    .filter(t => t.status === 'gap')
    .map(t => keyToSlug.get(t.name.toLowerCase()))
    .filter((s): s is string => s !== undefined);
}

/** The rec cards, built as DOM (names via textContent — §00.B #5, never innerHTML). */
function buildRecs(host: HTMLElement, recs: CoverageRec[], goals: LayoutGoal[], goalMode: boolean): void {
  host.replaceChildren();
  const head = document.createElement('div');
  head.className = 'recs__head';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'recs__eyebrow';
  eyebrow.textContent = ui(goalMode ? 'cov_recs_goal_eyebrow' : 'cov_recs_nogoal_eyebrow');
  head.appendChild(eyebrow);
  host.appendChild(head);

  if (recs.length === 0) {
    const note = document.createElement('p');
    note.className = 'recs__note';
    note.textContent = ui(goalMode ? 'cov_recs_done_goals' : 'cov_recs_done_field');
    host.appendChild(note);
    return;
  }

  const hueOf = (id: string): string => {
    const i = goals.findIndex(g => g.id === id);
    return GOAL_HUES[i] ?? GOAL_HUES[0];
  };

  /**
   * `cols` paints the card's BORDER only. The per-goal DOTS were deleted 2026-07-16.
   *
   * ★ WHY, measured rather than argued: the dots were a dead channel. `goalIds` (state/
   * recommender.ts) lights a goal when the product delivers ANY ONE of its members — so 66 of
   * 155 products lit ALL 14 goals, and every top-4 rec card lit all 5 picked goals. Identical
   * rows carry no information.
   *
   * ★ AND THE OBVIOUS FIX DOES NOT WORK — do not re-propose it: a %-of-target threshold was
   * measured at 10 / 25 / 50 AND 100 % of the Wallach target, and all four top cards still lit
   * all five goals at every level. The ranker rewards breadth, so the products that REACH this
   * list are broad multis, and a broad multi genuinely delivers a full target of SOMETHING in
   * every goal. Weighting by contribution was measured too: the three broad multis land at
   * 0.29–0.54 on every goal — five near-identical dots. The fact does not vary, so no encoding
   * can show variation.
   *
   * Luneth's call (2026-07-16): drop the dots, keep the border EXACTLY as it works today —
   * "ANY recommendation is going to be good for ANY goal in 95%+ of cases", so the border is
   * decorative + mostly-true and earns its keep where five identical dots did not. `goalIds`'
   * ANY-member rule is therefore deliberately UNCHANGED: it is a border tint, not a claim.
   */
  for (const r of recs) {
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
    supplies.textContent = `supplies ${r.supplies}`;
    const val = document.createElement('span');
    val.className = 'rec__val rec__q';
    val.textContent = `${r.perTenDollars.toFixed(1)} / $10`;
    // The explainer is a TWO-STAGE HOVER (card → dotted underline; numbers → the text).
    // No standing paragraph — Luneth deleted it.
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
 * exceed 30 chars, longest 69), a quiet EDEN/YOURS mark, an inline dose stepper, 1-click
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
    x.className = 'rl-row__x';
    x.type = 'button';
    x.dataset['rowRemove'] = id;
    x.setAttribute('aria-label', `Remove ${label}`);
    x.textContent = '✕';
    row.appendChild(x);

    const foot = document.createElement('div');
    foot.className = 'rl-row__foot';
    const src = document.createElement('span');
    const own = item.provenance === 'user_scanned';
    src.className = `rl-src${own ? ' is-own' : ''}`;
    src.textContent = own ? 'YOURS' : 'EDEN';
    foot.appendChild(src);

    const doseEl = document.createElement('span');
    doseEl.className = 'rl-dose';
    const minus = document.createElement('button');
    minus.className = 'rl-dose__b';
    minus.type = 'button';
    minus.dataset['doseDown'] = id;
    minus.setAttribute('aria-label', 'Fewer');
    minus.textContent = '−';
    minus.disabled = dose <= 1;
    const nEl = document.createElement('span');
    nEl.className = 'rl-dose__n';
    nEl.textContent = formatDose(dose);
    const plus = document.createElement('button');
    plus.className = 'rl-dose__b';
    plus.type = 'button';
    plus.dataset['doseUp'] = id;
    plus.setAttribute('aria-label', 'More');
    plus.textContent = '+';
    const unit = document.createElement('span');
    unit.className = 'rl-dose__u';
    unit.textContent = '/day';
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
 * Servings/day for display. INTEGER STEPS, but a SOURCED FRACTIONAL DEFAULT is allowed
 * (Luneth, 2026-07-16) — Plant Derived Minerals is the ONE product Wallach doses by name
 * (1 fl oz/100 lb = 1.54 servings at 154 lb), and a pure-integer control could not express
 * his own number for it. So 1.54 shows as "1.54"; 2 shows as "2", not "2.00".
 */
function formatDose(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

function renderRail(items: ReturnType<typeof loadEffectiveRegimen>): string {
  const slots = loadSlots();
  const active = slots.slots.find(s => s.id === slots.activeSlot);
  // D4: the ACTIVE SLOT'S NAME, read-only. No switcher — switching lives in Regimen. It is
  // here so a user with four slots can never wonder which one they just changed. It is READ,
  // never asserted: the old markup hardcoded "DAILY PROTOCOL" as if it were state.
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

export function mount(container: HTMLElement): MountHandle {
  const render = (): void => {
    // COV-02: a stationary cursor over a just-removed goal x fires no mouseout, so a stale
    // body.focusing (goal-hover dim) would otherwise stick through this rebuild. Clear first.
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
              ${renderRail(items)}
            </aside>
          </div>
        </div>
      </div>
    `;

    // The two name-bearing regions are built as DOM, not markup, so every product name is a
    // text node (§00.B #5). They are filled AFTER the shell so the shell can stay a template.
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
      const recs = rankProductsForCoverage({
        want: wantedSlugs(snapshot, goals),
        owned,
        goals: goals.map(g => ({ id: g.id, members: g.members })),
        limit: REC_LIMIT,
      });
      buildRecs(recsHost, recs, goals, goals.length > 0);
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
    if (t.closest('[data-full-regimen]') !== null) {
      window.dispatchEvent(new CustomEvent('wallach:navigate', { detail: { to: 'regimen' } }));
      return;
    }
    // A tile opens that element's Knowledge page. This is the NEW entrance to the essential
    // detail view now that the drawer's Essentials menu item is gone (Luneth 2026-07-23), so it
    // has to work for every card — `data-tile` carries the LAYOUT key, which is exactly what the
    // detail page is keyed by, but the event contract speaks slugs, so resolve it here rather
    // than leaning on openEntity's fallback. Checked LAST so every action control above (goal
    // add, row remove, dose steppers, recommendations) still wins inside a tile.
    const tileEl = t.closest<HTMLElement>('[data-tile]');
    if (tileEl !== null) {
      const key = tileEl.dataset['tile'] ?? '';
      const slug = [...slugToTileKey()].find(([, k]) => k === key)?.[0];
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
    // gradient bar (Luneth, 2026-07-16): hovering a goal isolates ITS dot, so the hover TEACHES
    // what the mark means. A merged gradient could never do this — there is no per-goal element
    // in it to isolate.
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
    const keys = new Set(goal.members.map(s => slugToTileKey().get(s)).filter(Boolean));
    body.classList.add('focusing');
    tiles.forEach(x => x.classList.toggle('is-focus', keys.has(x.dataset['tile'] ?? '')));
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
 * The dose stepper — Luneth's named "increasing dosage changing counts".
 *
 * Whole-serving steps, floored at 1. It writes through the §31 chokepoint
 * (saveRgOverride → writeSlotDoc → 'regimen:changed'), which cascades a recompute; the view
 * re-renders off the event, so the counts MOVE. Nothing here computes coverage — the scale
 * is handed to the engine and the engine decides.
 *
 * ★ Stepping from a sourced fractional default (PDM's 1.54) yields 2.54, not 2: the step is
 * relative, so the user's Wallach-sourced starting point is preserved rather than silently
 * rounded away. Floor is 1 because a 0/day item is a REMOVED item, and removal has its own
 * one-click control that routes to the trash (an item at 0 would be invisible on the field
 * but still in the slot — a state with no honest rendering).
 */
/**
 * The rec card's `+` — 1-click add. Luneth: discoverability of 1-click add is solved by a
 * `+` on each card, not by a second button that lies.
 *
 * Routes through §31 (saveRgManual → writeSlotDoc → 'regimen:changed'), which cascades the
 * recompute; the view re-renders off the event, so the field relights and the product leaves
 * its own recommendation list. It mints the SAME RegimenItem shape as views/regimen.ts's
 * vault picker — provenance 'user_manual', because a vault-matched add IS an Eden product,
 * not the user's own scanned item (that distinction is what the EDEN/YOURS mark reads).
 *
 * §10 edge rule: adding an item ALREADY in the slot raises its dose instead of creating a
 * duplicate row. Two rows for one product would double-count it on the field.
 */
function addVaultProduct(productId: string): void {
  if (productId === '') {
    return;
  }
  const entry = vaultEntry(productId);
  if (entry === null) {
    return; // unresolvable id — do nothing rather than mint an item with a slug for a name
  }
  const current = loadEffectiveRegimen();
  const existing = current.find(i =>
    typeof i.label.name === 'string'
    && i.label.name.trim().toLowerCase() === entry.name.trim().toLowerCase());
  if (existing !== undefined) {
    bumpDose(String(existing.id), 1);
    return;
  }
  const item: RegimenItem = {
    id: Date.now(),
    label: { name: entry.name, nutrients: entry.nutrients },
    addedDate: new Date().toISOString().slice(0, 10),
    provenance: 'user_manual',
  };
  saveRgManual([...loadRgManual(), item]);
}

function bumpDose(id: string, delta: number): void {
  if (id === '') {
    return;
  }
  const item = loadEffectiveRegimen().find(i => String(i.id) === id);
  if (item === undefined) {
    return;
  }
  const next = Math.max(1, readItemDose(item) + delta);
  saveRgOverride(id, { scaling_factor: next });
}
