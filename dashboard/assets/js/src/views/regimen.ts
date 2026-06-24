/**
 * views/regimen.ts — Regimen workspace view (v3 mockup parity)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Renders the regimen workspace per the v3 mockup
 * (dashboard/components/workspace-regimen-v3-PROPOSAL.html). State-driven
 * by the §31 chokepoints in state/regimen.ts.
 *
 * Visual contract:
 *   - .regimen-grid 2-col: regimen-main (slots + active) + regimen-side (rail)
 *   - 5 slot cartridges (4 saved + 1 empty placeholder)
 *   - Active slot detail: eyebrow + title + stat + item rows + cart actions
 *   - Each item row: icon, name, contrib pips, dose-block, scaling, remove
 *   - Right rail: recommendations panel + wishlist panel
 *   - .ds-cipher + .ds-scan-line + .ds-border-travel ambient chrome
 *
 * Cart actions bridge to legacy window.* helpers (saveCurrentToSlot,
 * loadFromSlot, showSlotInputModal) preserving §31 chokepoint discipline.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { on } from '../core/events.js';
import {
  ProductsLookupSchema,
  type RegimenVaultEntry,
  RegimenVaultEntrySchema,
} from '../core/schemas/index.js';
import { essentialCount, getOrCompute } from '../state/coverage.js';
import {
  loadEffectiveRegimen,
  loadRgManual,
  loadRgOverrides,
  loadRgRemoved,
  loadRgUserGoals,
  type OverridesMap,
  type RegimenItem,
  saveRgManual,
  saveRgOverride,
  saveRgRemoved,
} from '../state/regimen.js';

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

interface SlotMeta {
  id: string;
  num: string;
  serial: string;
  name: string;
  items: number;
  coverage: number;
  total: number;
  stamp: string;
  active?: boolean;
  empty?: boolean;
}

const SLOT_PLACEHOLDERS: SlotMeta[] = [
  { id: 'slot-01', num: '01', serial: '01·A23F', name: 'Travel Pack', items: 6, coverage: 31, total: essentialCount(), stamp: 'SAVED · 2D AGO' },
  { id: 'slot-02', num: '02', serial: '02·F71D', name: 'Daily Protocol', items: 9, coverage: 47, total: essentialCount(), stamp: 'EDIT 0:14 AGO', active: true },
  { id: 'slot-03', num: '03', serial: '03·C8B2', name: 'Sleep Stack', items: 4, coverage: 18, total: essentialCount(), stamp: 'SAVED · 1W AGO' },
  { id: 'slot-04', num: '04', serial: '04·E901', name: 'Recovery Ramp', items: 11, coverage: 54, total: essentialCount(), stamp: 'SAVED · 3W AGO' },
  { id: 'slot-05', num: '05', serial: '', name: '', items: 0, coverage: 0, total: essentialCount(), stamp: '', empty: true },
];

interface RecItem {
  name: string;
  contribution: number;
  heat: 'sm' | 'md' | 'lg' | 'xl';
  reason: string;
}

const RECOMMENDATIONS: RecItem[] = [
  { name: 'CHEWABLE VITAMIN D3', contribution: 12, heat: 'xl', reason: 'Closes 12 trace tiles via the PDM-aggregate vehicle. Single-serve daily, neutral taste.' },
  { name: 'ULTIMATE EFA PLUS', contribution: 2, heat: 'md', reason: 'Adds Omega-6 + Omega-9 coverage. Bone & skeletal goal already at 78%, this raises to 84%.' },
  { name: 'CHEWABLE C·1000', contribution: 1, heat: 'sm', reason: 'Strengthens existing Vitamin C coverage to clinical-dose level per Wallach Rare Earths p. 132.' },
  { name: 'SLENDER FX SHAKE', contribution: 8, heat: 'lg', reason: 'Meal-replacement option; adds 8 essentials at once but high overlap with existing BTT.' },
];

interface WishItem {
  name: string;
  contribution: number;
  heat: 'sm' | 'md' | 'lg' | 'xl';
  reason: string;
}

const WISHLIST: WishItem[] = [
  { name: 'HYDRA DNA COLLAGEN', contribution: 0, heat: 'sm', reason: 'Logged 2026-06-15 · skin & connective tissue goal · pending cost/timing decision.' },
  { name: 'OPTIVIDA HEMP EXTRACT', contribution: 0, heat: 'sm', reason: 'Deferred — overlap with sleep stack already; revisit once sleep goal closes.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }[c] as string));
}

/** Map a contribution count → number of filled pips (0..10). */
function contributionPips(contribution: number): number {
  return Math.max(0, Math.min(10, Math.ceil(contribution / 3)));
}

function renderPips(filled: number): string {
  let html = '';
  for (let i = 0; i < 10; i += 1) {
    const cls = i < filled ? 'contrib-pip fill' : 'contrib-pip';
    html += `<span class="${cls}"></span>`;
  }
  return html;
}

function itemIcon(item: RegimenItem): string {
  const name = (item.label.name ?? '?').toString();
  return name.charAt(0).toUpperCase();
}

function itemContribution(item: RegimenItem): number {
  // Use nutrient count as a proxy for contribution. Real value comes from
  // joining with coverage snapshot when the goal-driven engine wires in.
  return item.label.nutrients?.length ?? 0;
}

// ─── Slot showcase ────────────────────────────────────────────────────────

function renderSlot(slot: SlotMeta): string {
  if (slot.empty === true) {
    return `
      <article class="slot-card empty" data-slot-id="${escHTML(slot.id)}">
        <div class="slot-card__empty-mark">+</div>
        <div class="slot-card__empty-label">EMPTY SLOT</div>
      </article>
    `;
  }
  const activeClass = slot.active === true ? ' active ds-border-travel' : '';
  const scanLine = slot.active === true ? '<span class="ds-scan-line" aria-hidden="true"></span>' : '';
  const serialPrefix = slot.active === true ? '● ' : '';
  const serialSuffix = slot.active === true ? ' · ACTIVE' : '';
  return `
    <article class="slot-card${activeClass}" data-slot-id="${escHTML(slot.id)}" data-slot-num="${escHTML(slot.num)}">
      ${scanLine}
      <div class="slot-card__serial">${serialPrefix}<span class="ds-cipher" data-cipher-set="hexa">${escHTML(slot.serial)}</span>${serialSuffix}</div>
      <div class="slot-card__num">${escHTML(slot.num)}</div>
      <h3 class="slot-card__name">${escHTML(slot.name)}</h3>
      <div class="slot-card__items">${slot.items} items · <span class="slot-card__coverage">${slot.coverage}</span>/${slot.total}</div>
      <div class="slot-card__stamp">${escHTML(slot.stamp)}</div>
    </article>
  `;
}

function renderSlotsShowcase(): string {
  const slotsHTML = SLOT_PLACEHOLDERS.map(renderSlot).join('');
  return `
    <section class="slots-showcase">
      <header class="slots-showcase__head">
        <div>
          <div class="slots-showcase__kicker">YOUR CARTRIDGES · ${SLOT_PLACEHOLDERS.length} SLOTS · <span class="ds-cipher" data-cipher-set="hexa">02·F71D</span> ACTIVE</div>
          <h2 class="slots-showcase__title">
            CARTRIDGES
            <em>// each slot is a standalone protocol — save, switch, share</em>
          </h2>
        </div>
        <button class="slots-showcase__new" data-rg-action="new-cartridge">+ NEW CARTRIDGE</button>
      </header>
      <div class="slots-grid">${slotsHTML}</div>
    </section>
  `;
}

// ─── Active slot ──────────────────────────────────────────────────────────

/** Parse a stored dose factor; defaults to 1, rejects <=0 / NaN. */
function readDose(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number.parseFloat(raw) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function renderItemRow(item: RegimenItem, overrides: OverridesMap): string {
  const contrib = itemContribution(item);
  const pips = renderPips(contributionPips(contrib));
  const icon = itemIcon(item);
  const name = (item.label.name ?? '(unnamed)').toString();
  const ov = overrides[String(item.id)] ?? {};
  const amount = readDose(ov['dose_amount']);
  const freq = readDose(ov['dose_freq']);
  const scaling = amount * freq;
  return `
    <div class="regimen-item-row" data-item-id="${item.id}">
      <div class="regimen-item-row__icon">${escHTML(icon)}</div>
      <div class="regimen-item-row__body">
        <h4 class="regimen-item-row__name">${escHTML(name)}</h4>
        <div class="regimen-item-row__contrib">
          <span class="regimen-item-row__contrib-label">CONTRIBUTES · ${contrib}</span>
          ${pips}
        </div>
      </div>
      <div class="dose-block">
        <input class="dose-input" type="text" value="${amount}" data-rg-dose="amount" data-item-id="${item.id}" />
        <span class="dose-unit dose-unit--label">DOSE</span>
        <span class="dose-sep">×</span>
        <input class="dose-input" type="text" value="${freq}" data-rg-dose="freq" data-item-id="${item.id}" />
        <span class="dose-unit dose-unit--label">PER DAY</span>
      </div>
      <span class="scaling">×${scaling.toFixed(1)}</span>
      <button class="btn-remove" title="Remove" data-rg-action="remove" data-item-id="${item.id}">×</button>
    </div>
  `;
}

function renderActiveSlot(items: RegimenItem[], coverageCount: number, overrides: OverridesMap): string {
  const rowsHTML = items.length > 0
    ? items.map(item => renderItemRow(item, overrides)).join('')
    : '<div class="regimen-item-row regimen-item-row--empty"><div class="regimen-item-row__body"><h4 class="regimen-item-row__name">— no items yet —</h4></div></div>';

  return `
    <section class="active-slot">
      <header class="active-slot__head">
        <div class="active-slot__eyebrow"><span class="pulse-dot"></span>EDITING · SLOT <span class="ds-cipher" data-cipher-set="hexa">02·F71D</span></div>
        <div class="active-slot__title-row">
          <div>
            <h2 class="active-slot__title">Daily Protocol</h2>
            <div class="active-slot__meta">
              <span><strong>${items.length}</strong> items</span>
              <span>·</span>
              <span>EDITED <strong><span class="ds-cipher" data-cipher-set="time">0:14</span> AGO</strong></span>
              <span>·</span>
              <span>SYNCED</span>
            </div>
          </div>
          <div class="active-slot__stat">
            <span class="active-slot__stat-num">${coverageCount}</span>
            <span class="active-slot__stat-den">/ ${essentialCount()}</span>
            <span class="active-slot__stat-label">essentials<br>covered</span>
          </div>
        </div>
      </header>
      <div class="active-slot__items">${rowsHTML}</div>
      <div class="active-slot__actions">
        <button class="cart-action cart-action--primary" data-rg-action="add-item">
          <span class="cart-action__glyph">+</span>ADD ITEM
        </button>
        <span class="cart-action__spacer"></span>
        <button class="cart-action" data-rg-action="save"><span class="cart-action__glyph">▤</span>SAVE</button>
        <button class="cart-action" data-rg-action="duplicate"><span class="cart-action__glyph">↻</span>DUPLICATE</button>
        <button class="cart-action" data-rg-action="import"><span class="cart-action__glyph">↓</span>IMPORT</button>
        <button class="cart-action" data-rg-action="export"><span class="cart-action__glyph">↑</span>EXPORT</button>
        <button class="cart-action" data-rg-action="vault"><span class="cart-action__glyph">⌃</span>VAULT</button>
      </div>
    </section>
  `;
}

// ─── Right rail ───────────────────────────────────────────────────────────

function renderRecItem(item: RecItem | WishItem): string {
  const sign = item.contribution > 0 ? '+' : '';
  const tagText = item.contribution > 0 ? `${sign}${item.contribution}` : '·';
  return `
    <div class="rec-item">
      <div class="rec-item__head">
        <h4 class="rec-item__name">${escHTML(item.name)}</h4>
        <span class="rec-item__tag" data-heat="${escHTML(item.heat)}"><span class="rec-item__tag-sign">${escHTML(sign)}</span>${escHTML(tagText)}</span>
      </div>
      <div class="rec-item__reason">${escHTML(item.reason)}</div>
      <div class="rec-item__actions">
        <button class="rec-item__adopt" data-rg-action="adopt" data-item-name="${escHTML(item.name)}">+ ADOPT</button>
        <button class="rec-item__details" data-rg-action="details" data-item-name="${escHTML(item.name)}">DETAILS</button>
      </div>
    </div>
  `;
}

function renderRail(): string {
  const userGoals = loadRgUserGoals();
  const hasGoals = userGoals !== null && userGoals.length > 0;
  const recsHTML = hasGoals
    ? RECOMMENDATIONS.map(renderRecItem).join('')
    : '<div class="rec-item rec-item--empty"><div class="rec-item__reason">Set a goal to see personalized recommendations.</div></div>';
  const wishHTML = WISHLIST.length > 0
    ? WISHLIST.map(renderRecItem).join('')
    : '<div class="rec-item rec-item--empty"><div class="rec-item__reason">No items saved for later.</div></div>';
  return `
    <aside class="regimen-side">
      <section class="side-panel">
        <header class="side-panel__head">
          <div class="side-panel__eyebrow">RECOMMENDED · GOAL-DRIVEN</div>
          <h3 class="side-panel__title">CLOSES YOUR GAPS</h3>
        </header>
        <div class="side-panel__list">${recsHTML}</div>
      </section>
      <section class="side-panel">
        <header class="side-panel__head">
          <div class="side-panel__eyebrow">WISHLIST · SAVED-FOR-LATER</div>
          <h3 class="side-panel__title">DECISIONS DEFERRED</h3>
        </header>
        <div class="side-panel__list">${wishHTML}</div>
      </section>
    </aside>
  `;
}

// ─── Cipher animation engine (scoped to container) ───────────────────────

const CIPHER_SETS: Record<string, string> = {
  hexa: '0123456789ABCDEF',
  alphanum: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numfrac: '0123456789',
  time: '0123456789:·',
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

// ─── Action dispatch (legacy bridges) ────────────────────────────────────

interface LegacyWindow extends Window {
  saveCurrentToSlot?: (id: string) => void;
  loadFromSlot?: (id: string) => void;
  showSlotInputModal?: () => void;
  showAddItemModal?: () => void;
  exportRegimen?: () => void;
  importRegimen?: () => void;
  showVaultModal?: () => void;
}

function handleAction(action: string, target: HTMLElement): void {
  const w = window as LegacyWindow;
  const slotId = target.closest<HTMLElement>('[data-slot-id]')?.dataset['slotId'];
  switch (action) {
    case 'save':
      if (slotId !== undefined && typeof w.saveCurrentToSlot === 'function') {
        try {
          w.saveCurrentToSlot(slotId);
        }
        catch (e) {
          console.warn('[views/regimen] saveCurrentToSlot threw:', e);
        }
      }
      break;
    case 'new-cartridge':
      if (typeof w.showSlotInputModal === 'function') {
        try {
          w.showSlotInputModal();
        }
        catch (e) {
          console.warn('[views/regimen] showSlotInputModal threw:', e);
        }
      }
      break;
    case 'export':
      if (typeof w.exportRegimen === 'function') {
        try {
          w.exportRegimen();
        }
        catch (e) {
          console.warn('[views/regimen] exportRegimen threw:', e);
        }
      }
      break;
    case 'import':
      if (typeof w.importRegimen === 'function') {
        try {
          w.importRegimen();
        }
        catch (e) {
          console.warn('[views/regimen] importRegimen threw:', e);
        }
      }
      break;
    case 'vault':
      if (typeof w.showVaultModal === 'function') {
        try {
          w.showVaultModal();
        }
        catch (e) {
          console.warn('[views/regimen] showVaultModal threw:', e);
        }
      }
      break;
    case 'remove': {
      // §31 chokepoint: soft-delete via the removed-set. Works for user items
      // AND the negative-id HBSP base foundation (the "power user clears the
      // default" path). Fires regimen:changed → coverage recomputes → re-render.
      const idStr = target.dataset['itemId'];
      const id = idStr === undefined ? Number.NaN : Number(idStr);
      if (Number.isFinite(id)) {
        const removed = loadRgRemoved();
        removed.add(id);
        saveRgRemoved(removed);
      }
      break;
    }
    default:
      // No-op: action types we don't yet handle natively (duplicate, adopt,
      // details) will be wired in a later round.
      break;
  }
}

/**
 * A dose / per-day input changed → recompute the scaling factor and persist via
 * the §31 saveRgOverride chokepoint, which cascades to coverage. Keyed by item
 * id (works for user items AND the negative-id HBSP base foundation).
 */
function handleDoseEdit(input: HTMLInputElement): void {
  const idStr = input.dataset['itemId'];
  const id = idStr === undefined ? Number.NaN : Number(idStr);
  if (!Number.isFinite(id)) {
    return;
  }
  const row = input.closest('.regimen-item-row');
  if (row === null) {
    return;
  }
  const amount = readDose(row.querySelector<HTMLInputElement>('[data-rg-dose="amount"]')?.value);
  const freq = readDose(row.querySelector<HTMLInputElement>('[data-rg-dose="freq"]')?.value);
  saveRgOverride(id, { dose_amount: amount, dose_freq: freq, scaling_factor: amount * freq });
}

// ─── Add-item picker (vault → saveRgManual) ───────────────────────────────

let cachedVault: Map<string, RegimenVaultEntry> | null = null;

/** Read + Zod-validate the embedded product vault (`regimen-label-lookup`), keyed by lowercased name. */
function readVault(): Map<string, RegimenVaultEntry> {
  if (cachedVault !== null) {
    return cachedVault;
  }
  const m = new Map<string, RegimenVaultEntry>();
  const el = typeof document === 'undefined' ? null : document.getElementById('regimen-label-lookup');
  if (el !== null) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(el.textContent ?? '{}');
    }
    catch {
      parsed = {};
    }
    let root: unknown = parsed;
    if (parsed !== null && typeof parsed === 'object' && 'products' in parsed) {
      root = parsed.products;
    }
    const rec = ProductsLookupSchema.safeParse(root);
    if (rec.success) {
      for (const value of Object.values(rec.data)) {
        const candidates = Array.isArray(value) ? value : [value];
        for (const candidate of candidates) {
          const r = RegimenVaultEntrySchema.safeParse(candidate);
          const nm = r.success ? r.data.canonical_name ?? r.data.name : undefined;
          if (typeof nm === 'string' && nm.length > 0 && r.success) {
            m.set(nm.toLowerCase(), r.data);
          }
        }
      }
    }
  }
  cachedVault = m;
  return m;
}

/** Build a RegimenItem from a vault product (matched by name) and persist via §31 saveRgManual. */
function addItem(rawName: string): void {
  const product = readVault().get(rawName.trim().toLowerCase());
  if (product === undefined) {
    return;
  }
  const item: RegimenItem = {
    id: Date.now(),
    label: { name: product.canonical_name ?? product.name ?? rawName, nutrients: product.nutrients ?? [] },
    addedDate: new Date().toISOString().slice(0, 10),
    provenance: 'user_manual',
  };
  saveRgManual([...loadRgManual(), item]);
}

/** The inline add-item panel: a vault-autocomplete search (native datalist) + add/cancel. */
function renderAddRow(): string {
  const names = [...readVault().values()]
    .map(p => p.canonical_name ?? p.name)
    .filter((n): n is string => typeof n === 'string')
    .sort((a, b) => a.localeCompare(b));
  const options = names.map(n => `<option value="${escHTML(n)}"></option>`).join('');
  return `
    <section class="active-slot rg-add-panel">
      <div class="search-wrap">
        <input class="search-input" type="text" list="rg-product-options" data-rg-add-input placeholder="Search the product vault…" autocomplete="off" />
        <datalist id="rg-product-options">${options}</datalist>
      </div>
      <div class="active-slot__actions">
        <button class="cart-action cart-action--primary" data-rg-action="add-confirm"><span class="cart-action__glyph">+</span>ADD TO STACK</button>
        <button class="cart-action" data-rg-action="add-cancel">CANCEL</button>
      </div>
    </section>
  `;
}

// ─── Mount ────────────────────────────────────────────────────────────────

export function mount(container: HTMLElement): MountHandle {
  let pickerOpen = false;

  const render = (): void => {
    // The active slot reflects the effective stack (HBSP base + committed +
    // manual − removed) and the live coverage count from the one snapshot.
    const items = loadEffectiveRegimen();
    const coverageCount = getOrCompute().coveredCount;
    const overrides = loadRgOverrides();
    container.innerHTML = `
      <div class="regimen-grid">
        <div class="regimen-main">
          ${renderSlotsShowcase()}
          ${renderActiveSlot(items, coverageCount, overrides)}
          ${pickerOpen ? renderAddRow() : ''}
        </div>
        ${renderRail()}
      </div>
    `;
  };

  const clickHandler = (ev: Event): void => {
    const target = ev.target as HTMLElement | null;
    if (target === null) {
      return;
    }
    const actionEl = target.closest<HTMLElement>('[data-rg-action]');
    if (actionEl === null) {
      return;
    }
    const action = actionEl.dataset['rgAction'] ?? '';
    if (action === 'add-item') {
      pickerOpen = !pickerOpen;
      render();
      if (pickerOpen) {
        container.querySelector<HTMLInputElement>('[data-rg-add-input]')?.focus();
      }
      return;
    }
    if (action === 'add-cancel') {
      pickerOpen = false;
      render();
      return;
    }
    if (action === 'add-confirm') {
      const input = container.querySelector<HTMLInputElement>('[data-rg-add-input]');
      if (input !== null) {
        addItem(input.value);
      }
      pickerOpen = false;
      render();
      return;
    }
    handleAction(action, actionEl);
  };

  const changeHandler = (ev: Event): void => {
    const target = ev.target as HTMLElement | null;
    const doseEl = target?.closest<HTMLInputElement>('[data-rg-dose]') ?? null;
    if (doseEl !== null) {
      handleDoseEdit(doseEl);
    }
  };

  render();
  startCipherEngine(container);
  container.addEventListener('click', clickHandler);
  container.addEventListener('change', changeHandler);

  const unsubRegimen = on('regimen:changed', () => render());
  const unsubCoverage = on('coverage:recomputed', () => render());

  return {
    update: render,
    unmount: () => {
      unsubRegimen();
      unsubCoverage();
      stopCipherEngine();
      container.removeEventListener('click', clickHandler);
      container.removeEventListener('change', changeHandler);
      container.innerHTML = '';
    },
  };
}
