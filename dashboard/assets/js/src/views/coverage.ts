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
import { CoverageLayoutSchema, type LayoutSection, type LayoutTile } from '../core/schemas/index.js';
import { type CoverageSnapshot, getOrCompute } from '../state/coverage.js';
import { loadRegimen, loadRgUserGoals } from '../state/regimen.js';

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

// ─── Tile layout — the v3.2 periodic-table-of-essentials structure ────────

const LAYOUT = CoverageLayoutSchema.parse(coverageLayoutData);

type CoverageStatus = 'covered' | 'partial' | 'trace' | 'gap' | '';

// ─── Render helpers ───────────────────────────────────────────────────────

function tileStatusFor(key: string, snapshot: CoverageSnapshot | null): CoverageStatus {
  if (snapshot === null) {
    return '';
  }
  /* `key` is the canonical essential name; snapshot tiles are keyed the same. */
  const found = snapshot.tiles.find(t => t.name === key);
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

function renderTile(spec: LayoutTile, tileClass: string, snapshot: CoverageSnapshot | null): string {
  const status = tileStatusFor(spec.key, snapshot);
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

  const total = allTiles.length;
  const covered = allTiles.filter(t => tileStatusFor(t.key, snapshot) === 'covered').length;

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
  const sections = LAYOUT.sections.map(s => renderSection(s, snapshot)).join('');
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
    ? LAYOUT.goals.filter(g => userGoals.includes(g.id))
    : LAYOUT.goals.slice(0, 3);

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
        <span class="goals-strip__count">${activeGoals.length} ACTIVE · ${LAYOUT.goals.length} AVAILABLE</span>
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
