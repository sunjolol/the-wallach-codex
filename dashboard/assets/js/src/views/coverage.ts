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

import { on } from '../core/events.js';
import { type CoverageSnapshot, getOrCompute } from '../state/coverage.js';
import { loadRegimen, loadRgUserGoals } from '../state/regimen.js';

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

// ─── Tile layout — the v3.2 periodic-table-of-essentials structure ────────

interface TileSpec {
  num?: number;
  sym?: string;
  letter?: string;
  abbr?: string;
  code?: string;
  name: string;
  hint?: string;
}

interface SubsectionSpec {
  rank: string;
  label: string;
  hint: string;
  tiles: TileSpec[];
}

interface SectionSpec {
  num: string;
  title: string;
  sub: string;
  gridClass: string;
  tileClass: 'tile' | 'tile--vitamin' | 'tile--amino' | 'tile--fat';
  subsections?: SubsectionSpec[];
  tiles?: TileSpec[];
}

/* eslint-disable no-restricted-syntax -- static visual layout for the v3.2 mockup */
const MINERALS_FOUNDATIONAL: TileSpec[] = [
  { num: 1, sym: 'H', name: 'HYDROGEN' },
  { num: 6, sym: 'C', name: 'CARBON' },
  { num: 7, sym: 'N', name: 'NITROGEN' },
  { num: 8, sym: 'O', name: 'OXYGEN' },
  { num: 11, sym: 'Na', name: 'SODIUM' },
  { num: 12, sym: 'Mg', name: 'MAGNES.' },
  { num: 15, sym: 'P', name: 'PHOS.' },
  { num: 16, sym: 'S', name: 'SULFUR' },
  { num: 17, sym: 'Cl', name: 'CHLORIDE' },
  { num: 19, sym: 'K', name: 'POTAS.' },
  { num: 20, sym: 'Ca', name: 'CALCIUM' },
];

const MINERALS_MAJOR_TRACE: TileSpec[] = [
  { num: 5, sym: 'B', name: 'BORON' },
  { num: 27, sym: 'Co', name: 'COBALT' },
  { num: 24, sym: 'Cr', name: 'CHROM.' },
  { num: 29, sym: 'Cu', name: 'COPPER' },
  { num: 9, sym: 'F', name: 'FLUORINE' },
  { num: 26, sym: 'Fe', name: 'IRON' },
  { num: 53, sym: 'I', name: 'IODINE' },
  { num: 25, sym: 'Mn', name: 'MANGAN.' },
  { num: 42, sym: 'Mo', name: 'MOLYB.' },
  { num: 34, sym: 'Se', name: 'SELEN.' },
  { num: 14, sym: 'Si', name: 'SILICON' },
  { num: 38, sym: 'Sr', name: 'STRONT.' },
  { num: 23, sym: 'V', name: 'VANAD.' },
  { num: 30, sym: 'Zn', name: 'ZINC' },
];

const MINERALS_RARE_TRACE: TileSpec[] = [
  { num: 47, sym: 'Ag', name: 'SILVER' },
  { num: 13, sym: 'Al', name: 'ALUMIN.' },
  { num: 33, sym: 'As', name: 'ARSENIC' },
  { num: 79, sym: 'Au', name: 'GOLD' },
  { num: 56, sym: 'Ba', name: 'BARIUM' },
  { num: 4, sym: 'Be', name: 'BERYL' },
  { num: 35, sym: 'Br', name: 'BROMINE' },
  { num: 58, sym: 'Ce', name: 'CERIUM' },
  { num: 55, sym: 'Cs', name: 'CESIUM' },
  { num: 66, sym: 'Dy', name: 'DYSPRO.' },
  { num: 68, sym: 'Er', name: 'ERBIUM' },
  { num: 63, sym: 'Eu', name: 'EUROP.' },
  { num: 31, sym: 'Ga', name: 'GALL.' },
  { num: 64, sym: 'Gd', name: 'GADOL.' },
  { num: 72, sym: 'Hf', name: 'HAFNIUM' },
  { num: 67, sym: 'Ho', name: 'HOLMIUM' },
  { num: 57, sym: 'La', name: 'LANTH.' },
  { num: 3, sym: 'Li', name: 'LITHIUM' },
  { num: 71, sym: 'Lu', name: 'LUTET.' },
  { num: 41, sym: 'Nb', name: 'NIOB.' },
  { num: 60, sym: 'Nd', name: 'NEOD.' },
  { num: 28, sym: 'Ni', name: 'NICKEL' },
  { num: 59, sym: 'Pr', name: 'PRASEO.' },
  { num: 37, sym: 'Rb', name: 'RUBID.' },
  { num: 75, sym: 'Re', name: 'RHENIUM' },
  { num: 21, sym: 'Sc', name: 'SCAND.' },
  { num: 62, sym: 'Sm', name: 'SAMAR.' },
  { num: 50, sym: 'Sn', name: 'TIN' },
  { num: 73, sym: 'Ta', name: 'TANTAL.' },
  { num: 65, sym: 'Tb', name: 'TERBIUM' },
  { num: 22, sym: 'Ti', name: 'TITAN.' },
  { num: 69, sym: 'Tm', name: 'THULIUM' },
  { num: 39, sym: 'Y', name: 'YTTRIUM' },
  { num: 70, sym: 'Yb', name: 'YTTERB.' },
  { num: 40, sym: 'Zr', name: 'ZIRCON.' },
];

const VITAMINS_TILES: TileSpec[] = [
  { code: 'V·01', letter: 'A', name: 'RETINOL' },
  { code: 'V·02', letter: 'B1', name: 'THIAMINE' },
  { code: 'V·03', letter: 'B2', name: 'RIBOFLAVIN' },
  { code: 'V·04', letter: 'B3', name: 'NIACIN' },
  { code: 'V·05', letter: 'B5', name: 'PANTO.' },
  { code: 'V·06', letter: 'B6', name: 'PYRIDOX.' },
  { code: 'V·07', letter: 'B9', name: 'FOLATE' },
  { code: 'V·08', letter: 'B12', name: 'COBALAMIN' },
  { code: 'V·09', letter: 'C', name: 'ASCORBIC' },
  { code: 'V·10', letter: 'D3', name: 'CHOLECAL.' },
  { code: 'V·11', letter: 'E', name: 'TOCOPH.' },
  { code: 'V·12', letter: 'K', name: 'MENAQ.' },
  { code: 'V·13', letter: 'H', name: 'BIOTIN' },
  { code: 'V·14', letter: 'Ch', name: 'CHOLINE' },
  { code: 'V·15', letter: 'In', name: 'INOSITOL' },
  { code: 'V·16', letter: 'Fl', name: 'FLAVON.' },
];

const AMINOS_TILES: TileSpec[] = [
  { code: 'AA·01', abbr: 'Arg', name: 'ARGININE' },
  { code: 'AA·02', abbr: 'Cys', name: 'CYSTEINE' },
  { code: 'AA·03', abbr: 'His', name: 'HISTIDINE' },
  { code: 'AA·04', abbr: 'Ile', name: 'ISOLEUCINE' },
  { code: 'AA·05', abbr: 'Leu', name: 'LEUCINE' },
  { code: 'AA·06', abbr: 'Lys', name: 'LYSINE' },
  { code: 'AA·07', abbr: 'Met', name: 'METHIONINE' },
  { code: 'AA·08', abbr: 'Phe', name: 'PHENYLAL.' },
  { code: 'AA·09', abbr: 'Thr', name: 'THREONINE' },
  { code: 'AA·10', abbr: 'Trp', name: 'TRYPTOPH.' },
  { code: 'AA·11', abbr: 'Tyr', name: 'TYROSINE' },
  { code: 'AA·12', abbr: 'Val', name: 'VALINE' },
];

const FATS_TILES: TileSpec[] = [
  { code: 'F·01', name: 'OMEGA-3', hint: 'n-3 · ALA · EPA · DHA' },
  { code: 'F·02', name: 'OMEGA-6', hint: 'n-6 · linoleic · GLA' },
  { code: 'F·03', name: 'OMEGA-9', hint: 'n-9 · oleic · arachidonic' },
];

const SECTION_SPECS: SectionSpec[] = [
  {
    num: '01',
    title: 'MINERALS',
    sub: '// 60 · THE FOUNDATION · ATOMIC SYMBOLS PRESERVED',
    gridClass: 'essentials-grid--minerals',
    tileClass: 'tile',
    subsections: [
      { rank: 'A', label: 'FOUNDATIONAL', hint: 'structural + macro · atomic order', tiles: MINERALS_FOUNDATIONAL },
      { rank: 'B', label: 'MAJOR TRACE', hint: 'mid-dose essentials · A→Z', tiles: MINERALS_MAJOR_TRACE },
      { rank: 'C', label: 'RARE TRACE', hint: 'PDM aggregate spectrum · A→Z', tiles: MINERALS_RARE_TRACE },
    ],
  },
  {
    num: '02',
    title: 'VITAMINS',
    sub: '// 16 · THE CO-FACTORS · ENZYME ENABLERS',
    gridClass: 'essentials-grid--vitamins',
    tileClass: 'tile--vitamin',
    tiles: VITAMINS_TILES,
  },
  {
    num: '03',
    title: 'AMINO ACIDS',
    sub: '// 12 · PROTEIN BUILDING BLOCKS · ESSENTIAL + CONDITIONAL',
    gridClass: 'essentials-grid--aminos',
    tileClass: 'tile--amino',
    tiles: AMINOS_TILES,
  },
  {
    num: '04',
    title: 'FATTY ACIDS',
    sub: '// 3 · ESSENTIAL LIPIDS · MEMBRANE + SIGNAL',
    gridClass: 'essentials-grid--fats',
    tileClass: 'tile--fat',
    tiles: FATS_TILES,
  },
];

const GOAL_DEFS: Array<{ id: string; name: string; total: number }> = [
  { id: 'bone-skeletal', name: 'BONE & SKELETAL', total: 14 },
  { id: 'energy-metabolism', name: 'ENERGY & METABOLISM', total: 13 },
  { id: 'cognition', name: 'COGNITION', total: 11 },
  { id: 'hormones-strength', name: 'HORMONES & STRENGTH', total: 12 },
  { id: 'longevity-anti-aging', name: 'LONGEVITY & ANTI-AGING', total: 18 },
  { id: 'cardiovascular', name: 'CARDIOVASCULAR', total: 10 },
];
/* eslint-enable no-restricted-syntax */

type CoverageStatus = 'covered' | 'partial' | 'trace' | 'gap' | '';

// ─── Render helpers ───────────────────────────────────────────────────────

function tileStatusFor(name: string, snapshot: CoverageSnapshot | null): CoverageStatus {
  if (snapshot === null) {
    return '';
  }
  const found = snapshot.tiles.find(t => t.name.toLowerCase() === name.toLowerCase());
  if (found === undefined) {
    return '';
  }
  if (found.aggregateVehicle) {
    return 'trace';
  }
  if (found.covered && found.fillPercent >= 1) {
    return 'covered';
  }
  if (found.covered) {
    return 'partial';
  }
  return 'gap';
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

function renderTile(spec: TileSpec, tileClass: string, snapshot: CoverageSnapshot | null): string {
  const status = tileStatusFor(spec.name, snapshot);
  const cls = `${tileClass} ${status}`.trim();
  let inner = '';
  if (spec.num !== undefined) {
    inner += `<span class="tile__num">${spec.num}</span>`;
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
  if (spec.code !== undefined) {
    inner += `<span class="tile__code">${escHTML(spec.code)}</span>`;
  }
  inner += `<span class="tile__name">${escHTML(spec.name)}</span>`;
  if (spec.hint !== undefined) {
    inner += `<span class="tile__hint">${escHTML(spec.hint)}</span>`;
  }
  return `<div class="${cls}">${inner}</div>`;
}

function renderSection(spec: SectionSpec, snapshot: CoverageSnapshot | null): string {
  let bodyHTML = '';
  let allTiles: TileSpec[] = [];
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

  const total = allTiles.length;
  const covered = allTiles.filter(t => tileStatusFor(t.name, snapshot) === 'covered').length;

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

function renderHero(snapshot: CoverageSnapshot | null): string {
  const total = snapshot?.totalCount ?? 92;
  const covered = snapshot?.coveredCount ?? 0;
  const sections = SECTION_SPECS.map(s => renderSection(s, snapshot)).join('');
  return `
    <section class="coverage-hero ds-border-travel">
      <header class="coverage-hero__head">
        <div>
          <div class="coverage-hero__kicker">Your essentials · <span class="ds-cipher" data-cipher-set="numfrac">92</span> minerals + vitamins + amino acids + fats</div>
          <h2 class="coverage-hero__title">
            THE WHOLE PICTURE
            <em>// what you'\''re absorbing, what you'\''re missing</em>
          </h2>
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
        <span class="legend__item"><span class="legend__sw trace"></span> TRACE · VIA AGGREGATE VEHICLE</span>
        <span class="legend__item"><span class="legend__sw gap"></span> GAP · ATTENTION</span>
      </div>
    </section>
  `;
}

function renderGoalsStrip(snapshot: CoverageSnapshot | null): string {
  const userGoals = loadRgUserGoals() ?? [];
  const activeGoals = userGoals.length > 0
    ? GOAL_DEFS.filter(g => userGoals.includes(g.id))
    : GOAL_DEFS.slice(0, 3);

  const cardsHTML = activeGoals.map((g, i) => {
    const num = String(i + 1).padStart(2, '0');
    const covered = snapshot !== null
      ? Math.min(g.total, Math.round((snapshot.coveredCount / snapshot.totalCount) * g.total))
      : 0;
    const pct = Math.round((covered / g.total) * 100);
    return `
      <div class="goal-card">
        <div class="goal-card__kicker">GOAL · ${num}</div>
        <div class="goal-card__name">${escHTML(g.name)}</div>
        <div class="goal-card__bar"><div class="goal-card__bar-fill" style="width: ${pct}%"></div></div>
        <div class="goal-card__progress">${pct}% · ${covered} / ${g.total} essentials covered</div>
      </div>
    `;
  }).join('');

  return `
    <section class="goals-strip">
      <header class="goals-strip__head">
        <h3 class="goals-strip__title">YOUR GOALS</h3>
        <span class="goals-strip__count">${activeGoals.length} ACTIVE · ${GOAL_DEFS.length} AVAILABLE</span>
        <button class="goals-strip__add">+ ADD GOAL</button>
      </header>
      <div class="goals-row">${cardsHTML}</div>
    </section>
  `;
}

function renderRail(): string {
  const regimen = loadRegimen();
  const items = regimen.items.slice(0, 8);
  const itemsHTML = items.map((item) => {
    const labelName = (item.label.name || '?').toString();
    const icon = labelName.charAt(0).toUpperCase();
    return `
      <div class="regimen-item">
        <div class="regimen-item__icon">${escHTML(icon)}</div>
        <div class="regimen-item__body">
          <p class="regimen-item__name">${escHTML(labelName)}</p>
          <span class="regimen-item__meta">DAILY</span>
        </div>
        <span class="regimen-item__count">${(item.label.nutrients?.length ?? 0)}</span>
      </div>
    `;
  }).join('') || '<div class="regimen-item"><div class="regimen-item__body"><p class="regimen-item__name">— no items —</p></div></div>';

  return `
    <aside class="regimen-rail">
      <header class="regimen-rail__head">
        <div class="regimen-rail__eyebrow"><span class="pulse-dot"></span>CURRENT SLOT · <span class="ds-cipher" data-cipher-set="hexa">02·F71D</span></div>
        <h3 class="regimen-rail__slot-name">DAILY PROTOCOL</h3>
        <div class="regimen-rail__slot-meta">
          <span><strong>${items.length}</strong> items</span>
          <span>·</span>
          <span>Slot <strong>2 of 5</strong></span>
          <span>·</span>
          <span>Synced</span>
        </div>
      </header>
      <div class="regimen-rail__list">${itemsHTML}</div>
      <div class="regimen-rail__actions">
        <button class="ds-btn-ghost" style="flex: 1;">MANAGE</button>
        <button class="ds-btn-primary" style="flex: 1;">ADD ITEM</button>
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
      <div class="coverage-grid">
        <div class="coverage-main">
          ${renderHero(snapshot)}
          ${renderGoalsStrip(snapshot)}
        </div>
        ${renderRail()}
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
