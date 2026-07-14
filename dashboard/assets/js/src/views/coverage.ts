/**
 * views/coverage.ts — Coverage workspace view (v3.2 mockup parity)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Renders the periodic-table-of-essentials workspace per the v3.2 mockup
 * (dashboard/components/workspace-coverage-v3.2-PROPOSAL.html). Subscribes
 * to coverage:recomputed for live updates as regimen mutations cascade.
 *
 * Visual contract:
 *   - .coverage-grid 2-col: coverage-main (essentials + goals) + regimen-rail
 *   - 4 sections: Minerals (60, w/ 3 subsections), Vitamins (16), Aminos (12), Fats (3)
 *   - .ds-cipher cycling glyph engine for tech-readout chrome
 *   - .ds-scan-line + .ds-border-travel ambient animations
 *
 * §17 lesson: corruption recovery for this file is `git checkout HEAD -- ...`.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import coverageLayoutData from '../../../data/coverage-layout-data.json';
import { on } from '../core/events.js';
import { plural } from '../core/format.js';
import { CoverageLayoutSchema, type LayoutSection, type LayoutTile } from '../core/schemas/index.js';
import { ui } from '../state/copy.js';
import { type CoverageSnapshot, type CoverageStatus, type CoverageTile, essentialCount, getOrCompute } from '../state/coverage.js';
import { loadEffectiveRegimen, loadRgUserGoals } from '../state/regimen.js';

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

// ─── Tile layout — the v3.2 periodic-table-of-essentials structure ────────

const LAYOUT = CoverageLayoutSchema.parse(coverageLayoutData);

// ─── Render helpers ───────────────────────────────────────────────────────

/**
 * The snapshot's tile for a layout key. `key` is the canonical essential name and snapshot
 * tiles are keyed the same, so this is a direct join. The snapshot owns the authoritative
 * verdict (state/coverage.ts::classify) — the view renders it, never re-derives it.
 */
function tileFor(key: string, snapshot: CoverageSnapshot | null): CoverageTile | undefined {
  return snapshot?.tiles.find(t => t.name === key);
}

function tileStatusFor(key: string, snapshot: CoverageSnapshot | null): CoverageStatus {
  return tileFor(key, snapshot)?.status ?? '';
}

/**
 * The plate's fill height, as a --fill percentage for the CSS to render.
 *
 * This is REAL data, not decoration: `fillPercent` is delivered ÷ the Wallach target, already
 * computed on every recompute (state/coverage.ts::deliveryRatio) and — until now — thrown away
 * by every consumer. A partial plate whose fill sits at 40% is stating a measured fact.
 *
 * Only `partial` gets a fill: `covered` is expressed by the plate's own lift + rim (a fill bar
 * at 100% would just be noise), and fillPercent can exceed 1 when items stack, so it is clamped
 * — an over-delivered essential is still simply covered.
 */
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

function renderTile(spec: LayoutTile, tileClass: string, snapshot: CoverageSnapshot | null): string {
  const tile = tileFor(spec.key, snapshot);
  const status = tile?.status ?? '';
  const cls = `${tileClass} ${status}`.trim();
  // --fill is a COMPUTED per-tile value (delivered ÷ target), so it cannot live in the
  // stylesheet; it is the one thing the plate needs from the snapshot beyond its status.
  const fill = tileFillPercent(tile);
  const fillAttr = fill === null ? '' : ` style="--fill: ${fill}%"`;
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
  return `<div class="${cls}"${fillAttr}>${inner}</div>`;
}

function renderSection(spec: LayoutSection, snapshot: CoverageSnapshot | null): string {
  let bodyHTML = '';
  let allTiles: LayoutTile[] = [];
  if (spec.subsections !== undefined) {
    bodyHTML = spec.subsections.map(sub => `
      <div class="essentials-subsection">
        <div class="essentials-subsection__label">
          <span class="essentials-subsection__rank">${escHTML(sub.rank)}</span>
          ${escHTML(sub.label)}
          <span class="essentials-subsection__count">· ${sub.tiles.length}</span>
          <span class="essentials-subsection__hint">${escHTML(sub.hint)}</span>
        </div>
        <div class="${spec.gridClass}">
          ${sub.tiles.map(t => renderTile(t, spec.tileClass, snapshot)).join('')}
        </div>
      </div>
    `).join('');
    allTiles = spec.subsections.flatMap(s => s.tiles);
  }
  else if (spec.tiles !== undefined) {
    bodyHTML = `<div class="${spec.gridClass}">${spec.tiles.map(t => renderTile(t, spec.tileClass, snapshot)).join('')}</div>`;
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
 * The hero: the periodic-table field + the headline stat + the legend.
 *
 * The LEGEND states the vocabulary the engine actually speaks. It previously taught TRACE —
 * which state/coverage.ts stopped producing (zero trace returns remain) — and omitted PRESENT,
 * which IS produced (the PDM present-but-unquantified verdict). A legend documenting impossible
 * states teaches the user a fiction, so it now lists exactly the five statuses classify() emits.
 */
function renderHero(snapshot: CoverageSnapshot | null): string {
  const total = snapshot?.totalCount ?? essentialCount();
  const covered = snapshot?.coveredCount ?? 0;
  const sections = LAYOUT.sections.map(s => renderSection(s, snapshot)).join('');
  return `
    <section class="coverage-hero ds-border-travel">
      <header class="coverage-hero__head">
        <div>
          <!-- NO .ds-cipher on essentialCount(): the cipher engine scrambles the glyphs it wraps
               and only restores the true value every 5th tick, so wrapping a REAL canon-derived
               number rendered Wallach's 90 as 30/80/94 four seconds in five (measured 2026-07-14).
               The cipher is decorative chrome and may only ever wrap a static decorative literal;
               gated by views_no_ciphered_data. -->
          <div class="coverage-hero__kicker">Your essentials · ${essentialCount()} minerals + vitamins + amino acids + fats</div>
          <h2 class="coverage-hero__title">THE WHOLE PICTURE</h2>
        </div>
        <div class="coverage-stat">
          <span class="coverage-stat__num">${covered}</span>
          <span class="coverage-stat__den">/ ${total}</span>
          <span class="coverage-stat__label">essentials<br>covered</span>
        </div>
      </header>
      <div class="essentials-host">
        <span class="ds-scan-line" aria-hidden="true"></span>
        ${sections}
      </div>
      <div class="legend">
        <span class="legend__item"><span class="legend__sw covered"></span> COVERED</span>
        <span class="legend__item"><span class="legend__sw partial"></span> PARTIAL</span>
        <span class="legend__item"><span class="legend__sw present"></span> PRESENT · NOT QUANTIFIED</span>
        <span class="legend__item"><span class="legend__sw gap"></span> GAP · ATTENTION</span>
        <span class="legend__item"><span class="legend__sw pending"></span> NO WALLACH TARGET</span>
      </div>
    </section>
  `;
}

/**
 * The console — goals FIRST, and the light's only home.
 *
 * Luneth 2026-07-14: the goals section "is a VERY important section because it's where the
 * user starts, it feels like it should be the first thing you see so the flow is clearer",
 * and the old cards "use a TON of space to list your goals in an unhelpful way". So: chips
 * above the table instead of cards below it.
 *
 * ★ THE CHIPS CARRY NO RATIO, DELIBERATELY. A per-goal "N / M covered" needs real membership
 * — eden/catalog/goals.json (goal -> condition slugs) intersected with each essential's
 * corpus-derived `conditions_treated` — and goals.json does not exist yet. The previous goal
 * cards fabricated BOTH numbers (a hand-typed denominator with no Wallach source, and a
 * numerator that just scaled the GLOBAL ratio, so all three cards showed one number). Typing
 * a plausible ratio in to make this comparison look finished would re-commit exactly that.
 * The ratio ships with the derivation.
 *
 * The stat here is the REAL snapshot (state/coverage.ts) — the same numbers the plates and
 * the drawer read, never re-derived. No .ds-cipher: gated by views_no_ciphered_data.
 */
function renderConsole(snapshot: CoverageSnapshot | null): string {
  const userGoals = loadRgUserGoals() ?? [];
  const active = new Set(userGoals);
  const total = snapshot?.totalCount ?? essentialCount();
  const covered = snapshot?.coveredCount ?? 0;

  const chips = LAYOUT.goals.map((g) => {
    const on = active.has(g.id) ? ' is-active' : '';
    return `<button class="goal-chip${on}" type="button" data-goal-id="${escHTML(g.id)}">${escHTML(g.name)}</button>`;
  }).join('');

  return `
    <section class="coverage-console">
      <div class="coverage-console__body">
        <div class="coverage-console__head">
          <div>
            <div class="coverage-console__kicker">// what you're absorbing, what you're missing</div>
            <h2 class="coverage-console__q">${escHTML(ui('cov_console_q'))}</h2>
          </div>

        </div>
        <div class="console-chips">
          ${chips}
          <button class="goal-chip goal-chip--add" type="button" data-goal-add>+ ADD GOAL</button>
        </div>
        <div class="coverage-console__stat">
          <strong>${covered}</strong> / ${total} essentials covered
        </div>
      </div>
    </section>
  `;
}

/**
 * The regimen rail — every value here is now READ, never asserted (2026-07-14).
 *
 * STRIPPED as fabricated chrome: "CURRENT SLOT · 02·F71D" (a decorative hex literal dressed as
 * a live slot serial), "Slot 2 of 5" (no slot system exists anywhere — regimen.ts holds a single
 * REGIMEN_KEY and never enumerates 5 slots), "Synced" (reflected no sync state and could never
 * say anything else), and the per-item "DAILY" frequency (hardcoded regardless of the item's
 * real schedule). "DAILY PROTOCOL" survives as an honest static HEADING — it names the surface,
 * it does not claim to be read from state.
 *
 * FIXED: the item count reported the .slice(0, 8)-TRUNCATED array length, so a 12-item regimen
 * displayed "8 items". The count now reads the full regimen; the slice is a display cap only.
 */
function renderRail(): string {
  const allItems = loadEffectiveRegimen();
  const RAIL_DISPLAY_CAP = 8;
  const shown = allItems.slice(0, RAIL_DISPLAY_CAP);
  const overflow = allItems.length - shown.length;

  const itemsHTML = shown.map((item) => {
    const labelName = (item.label.name || '?').toString();
    const icon = labelName.charAt(0).toUpperCase();
    const nutrientCount = item.label.nutrients?.length ?? 0;
    return `
      <div class="regimen-item">
        <div class="regimen-item__icon">${escHTML(icon)}</div>
        <div class="regimen-item__body">
          <p class="regimen-item__name">${escHTML(labelName)}</p>
          <span class="regimen-item__meta">${nutrientCount} ${escHTML(plural(nutrientCount, 'nutrient'))}</span>
        </div>
        <span class="regimen-item__count">${nutrientCount}</span>
      </div>
    `;
  }).join('') || `<div class="regimen-item"><div class="regimen-item__body"><p class="regimen-item__name">${escHTML(ui('cov_rail_empty'))}</p></div></div>`;

  const overflowHTML = overflow > 0
    ? `<div class="regimen-rail__overflow">+ ${overflow} more</div>`
    : '';

  return `
    <aside class="regimen-rail">
      <header class="regimen-rail__head">
        <div class="regimen-rail__eyebrow"><span class="pulse-dot"></span>CURRENT REGIMEN</div>
        <h3 class="regimen-rail__slot-name">DAILY PROTOCOL</h3>
        <div class="regimen-rail__slot-meta">
          <span><strong>${allItems.length}</strong> ${escHTML(plural(allItems.length, 'item'))}</span>
        </div>
      </header>
      <div class="regimen-rail__list">${itemsHTML}${overflowHTML}</div>
      <div class="regimen-rail__actions">
        <button class="ds-btn-ghost regimen-rail__manage">MANAGE</button>
        <button class="ds-btn-primary regimen-rail__add">ADD ITEM</button>
      </div>
    </aside>
  `;
}

// ─── Cipher animation engine ──────────────────────────────────────────────

const CIPHER_SETS: Record<string, string> = {
  hexa: '0123456789ABCDEF',
  alphanum: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numfrac: '0123456789',
  time: '0123456789:·DHMS',
};

let cipherInterval: number | null = null;
let cipherTickCount = 0;

function startCipherEngine(container: HTMLElement): void {
  if (cipherInterval !== null) {
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  cipherInterval = window.setInterval(() => {
    cipherTickCount += 1;
    const elements = Array.from(container.querySelectorAll<HTMLElement>('.ds-cipher'));
    for (const el of elements) {
      let original = el.dataset['cipherOriginal'];
      if (original === undefined) {
        original = el.textContent ?? '';
        el.dataset['cipherOriginal'] = original;
        const setKey = el.dataset['cipherSet'] ?? 'alphanum';
        el.dataset['cipherSetResolved'] = CIPHER_SETS[setKey] ?? CIPHER_SETS['alphanum'] ?? '';
      }
      const set = el.dataset['cipherSetResolved'] ?? '';
      if (cipherTickCount % 5 === 0) {
        el.textContent = original;
        continue;
      }
      if (original.length === 0 || set.length === 0) {
        continue;
      }
      const chars = original.split('');
      const i = Math.floor(Math.random() * chars.length);
      const charAt = chars[i];
      if (charAt === undefined) {
        continue;
      }
      if (!/[A-Z0-9·:]/i.test(charAt)) {
        continue;
      }
      const newChar = set[Math.floor(Math.random() * set.length)] ?? charAt;
      chars[i] = newChar;
      el.textContent = chars.join('');
    }
  }, 1000);
}

function stopCipherEngine(): void {
  if (cipherInterval !== null) {
    window.clearInterval(cipherInterval);
    cipherInterval = null;
  }
}

// ─── Mount ────────────────────────────────────────────────────────────────

export function mount(container: HTMLElement): MountHandle {
  const render = (): void => {
    const snapshot = getOrCompute();
    container.innerHTML = `
      <div class="coverage-workspace">
        ${renderConsole(snapshot)}
        <div class="coverage-grid">
          <div class="coverage-main">
            ${renderHero(snapshot)}
          </div>
          ${renderRail()}
        </div>
      </div>
    `;
  };

  render();
  startCipherEngine(container);

  const unsubCoverage = on('coverage:recomputed', () => render());
  const unsubRegimen = on('regimen:changed', () => render());

  return {
    update: render,
    unmount: () => {
      unsubCoverage();
      unsubRegimen();
      stopCipherEngine();
      container.innerHTML = '';
    },
  };
}
