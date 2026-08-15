/**
 * views/regimen.ts — the Regimen workspace (the Cockpit + the save-slot switcher)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * RE-CREATED 2026-08-13 from the design-approved demo
 * temporary/ready-to-be-ported/regimen-cockpit-slots-tray-v6.html — on real data
 * + real state, ADAPTED not transplanted (the demo is design truth, not a code
 * donor). The prior view was a fabricated scaffold (hand-authored SLOT_PLACEHOLDERS
 * / RECOMMENDATIONS / WISHLIST, no-op cart bridges); nothing of it survives.
 *
 * WHAT IS REAL (no fabrication, anti-fakery):
 *   · Slots come from loadSlots() (rgSlots_v1). Each save-slot's coverage is the
 *     SAME engine the gauge uses — coveredCountForItems(slot.items, slot.overrides) —
 *     so a saved slot's number equals what it reads once active (no drift).
 *   · The gauge / category cluster / 90-cell readout read the live CoverageSnapshot.
 *   · Goals are PER-SLOT (P4): loadRgUserGoals/saveRgUserGoals now read/write the
 *     active slot's goals, so each save steers its own recommendations.
 *   · Recommendations are rankProductsForCoverage — PRODUCTS ONLY. Foods are a
 *     deferred sourced artifact (Luneth 2026-08-13); the layout is kept ready but
 *     no food row/number is invented here.
 *   · Dose steppers route saveRgOverride(id, {scaling_factor}) → writeSlotDoc →
 *     'regimen:changed' → recompute; the counts move because the live math already
 *     multiplies delivered mg by that factor (no dose→coverage curve invented).
 *   · Product NAMES are written with .textContent (§00.B #5, escape at the sink).
 *
 * THE GOAL RULE (inherited, unbreakable): a goal changes what you LOOK AT / are
 * RECOMMENDED, never what you are MEASURED AGAINST. The denominator is always 90.
 *
 * §17 recovery: `git checkout HEAD -- dashboard/assets/js/src/views/regimen.ts`.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import coverageLayoutData from '../../../data/coverage-layout-data.json';
import regimenLabelLookup from '../../../data/regimen-label-lookup.json';
import { on } from '../core/events.js';
import { GOAL_HUES, MAX_GOALS } from '../core/goal-display.js';
import {
  CoverageLayoutSchema,
  type LayoutGoal,
  ProductsLookupSchema,
  type RegimenItem,
  type RegimenVaultEntry,
  RegimenVaultEntrySchema,
} from '../core/schemas/index.js';
import { coveredCountForItems, essentialCount, getOrCompute } from '../state/coverage.js';
import { type CoverageRec, productIdsForNames, rankProductsForCoverage } from '../state/recommender.js';
import {
  addSlot,
  DEFAULT_SLOT_COLOUR,
  deleteSlot,
  isSlotColour,
  loadEffectiveRegimen,
  loadRgManual,
  loadRgUserGoals,
  loadSlots,
  renameSlot,
  restoreFromTrash,
  saveRgManual,
  saveRgOverride,
  saveRgRemoved,
  saveRgUserGoals,
  setActiveSlot,
  setSlotColour,
  type Slot,
  SLOT_COLOURS,
} from '../state/regimen.js';

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

const LAYOUT = CoverageLayoutSchema.parse(coverageLayoutData);

/** How many product recs the rail shows (measured against the aside budget). */
const REC_LIMIT = 6;
/** The switcher holds up to four save slots (MAX_SLOTS); Luneth: "4, not 5". */
const SLOT_CAP = 4;

/** The four category dots, in the demo's order + the sanctioned category hues. */
const CATEGORY_ROWS = [
  { label: 'Minerals', bucket: 'other', hue: '#2b6fb0' },
  { label: 'Vitamins', bucket: 'vitamins', hue: '#c8781a' },
  { label: 'Amino acids', bucket: 'aminos', hue: '#5aa82c' },
  { label: 'Fatty acids', bucket: 'fatty-acids', hue: '#8a4fae' },
] as const;

// ─── Small helpers ──────────────────────────────────────────────────────────

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }[c] as string));
}

/** "edited today" / "N days ago" from an ISO YYYY-MM-DD, degrading to the raw date. */
function relEdited(iso: string): string {
  const then = Date.parse(`${iso}T00:00:00`);
  if (Number.isNaN(then)) {
    return escHTML(iso);
  }
  const today = new Date();
  const start = Date.parse(`${today.toISOString().slice(0, 10)}T00:00:00`);
  const days = Math.round((start - then) / 86_400_000);
  if (days <= 0) {
    return 'edited today';
  }
  if (days === 1) {
    return '1 day ago';
  }
  if (days < 7) {
    return `${days} days ago`;
  }
  const weeks = Math.round(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

/** The active slot's chosen goals, resolved against the layout + capped (per-slot, P4). */
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

/**
 * canon slug → the tile KEY the CoverageSnapshot is keyed by (snapshot tile.name ===
 * the layout tile's `key`, the canonical name — NOT its display `name`, which diverges
 * for 16 of 90, e.g. vitamin-c renders "ASCORBIC ACID"). Using `key` makes the
 * goal-gap + no-goals recommender joins resolve for all 90, not just the 74 that match.
 */
function slugToTileKey(): Map<string, string> {
  const m = new Map<string, string>();
  for (const sec of LAYOUT.sections) {
    const tiles = sec.subsections !== undefined ? sec.subsections.flatMap(s => s.tiles) : (sec.tiles ?? []);
    for (const t of tiles) {
      if (t.slug !== undefined) {
        m.set(t.slug, t.key);
      }
    }
  }
  return m;
}

/** Servings/day for one item — mirrors state/coverage readScale (override → servings → 1). */
function readItemDose(item: RegimenItem): number {
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

/** Integer steps, but a sourced fractional default is allowed (PDM 1.54). */
function formatDose(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

// ─── The coverage read (covered · goal-gap · open over the 90) ───────────────

interface FieldInfo {
  covered: number;
  goalGap: number;
  open: number;
  /**
   * One entry per counted essential, ordered covered -> goal-gap -> open; each carries its
   * element name so the readout square names itself on hover.
   */
  cells: { cls: string; name: string }[];
}

/**
 * Split the 90 counted essentials into covered · goal-gap · open. goal-gap =
 * an UNCOVERED essential that is a member of an active goal (the goals×coverage
 * intersection the demo's "6 goal-gap" shows). The denominator stays 90 — a goal
 * only re-colours the open cells, never changes what is measured.
 */
function fieldInfo(goals: LayoutGoal[]): FieldInfo {
  const snapshot = getOrCompute();
  const goalSlugs = new Set(goals.flatMap(g => g.members));
  const nameToSlug = new Map([...slugToTileKey()].map(([slug, name]) => [name, slug]));
  const counted = snapshot.tiles.filter(t => t.noTargetReason !== 'non_essential');
  let covered = 0;
  let goalGap = 0;
  const cells: { cls: string; name: string }[] = [];
  for (const t of counted) {
    if (t.covered) {
      covered++;
      cells.push({ cls: 'covered', name: t.name });
      continue;
    }
    const slug = nameToSlug.get(t.name);
    if (slug !== undefined && goalSlugs.has(slug)) {
      goalGap++;
      cells.push({ cls: 'goalgap', name: t.name });
    }
    else {
      cells.push({ cls: '', name: t.name });
    }
  }
  // Luneth 2026-08-14: the readout was interleaved by canon order and illegible. Group it
  // covered (green) -> goal-gap -> open (beige); the stable sort keeps canon order per block.
  const rank = (c: string): number => (c === 'covered' ? 0 : c === 'goalgap' ? 1 : 2);
  cells.sort((a, b) => rank(a.cls) - rank(b.cls));
  return { covered, goalGap, open: counted.length - covered - goalGap, cells };
}

// ─── Add-item vault (products only) ──────────────────────────────────────────

let cachedVault: Map<string, RegimenVaultEntry> | null = null;

/** The embedded product vault, Zod-validated, keyed by lowercased canonical name. */
function readVault(): Map<string, RegimenVaultEntry> {
  if (cachedVault !== null) {
    return cachedVault;
  }
  const m = new Map<string, RegimenVaultEntry>();
  const parsed: unknown = regimenLabelLookup;
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
  cachedVault = m;
  return m;
}

/** Build a RegimenItem from a vault product (matched by name) + persist via §31. */
function addItem(rawName: string): boolean {
  const product = readVault().get(rawName.trim().toLowerCase());
  if (product === undefined) {
    return false;
  }
  const item: RegimenItem = {
    id: Date.now(),
    label: { name: product.canonical_name ?? product.name ?? rawName, nutrients: product.nutrients ?? [] },
    addedDate: new Date().toISOString().slice(0, 10),
    provenance: 'user_manual',
  };
  saveRgManual([...loadRgManual(), item]);
  return true;
}

// ─── Slot switcher ───────────────────────────────────────────────────────────

const PENCIL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
const TRASH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6"/></svg>';
const PLUS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

function slotColour(slot: Slot): string {
  return isSlotColour(slot.colour ?? '') ? String(slot.colour) : DEFAULT_SLOT_COLOUR;
}

function renderSwatches(selected: string): string {
  return SLOT_COLOURS.map((h) => {
    const on = h === selected ? ' is-on' : '';
    return `<button type="button" class="ck-swatch${on}" style="--h:${escHTML(h)}" data-swatch="${escHTML(h)}" aria-pressed="${h === selected ? 'true' : 'false'}" aria-label="${escHTML(h)}"></button>`;
  }).join('');
}

function renderFilledSlot(slot: Slot, active: boolean, covered: number, showDelete: boolean): string {
  const hue = slotColour(slot);
  const pct = Math.round((covered / Math.max(1, essentialCount())) * 100);
  const state = active ? 'ck-slot--active' : 'ck-slot--saved';
  const items = slot.items.length;
  return `
  <div class="ck-slot ck-slot--filled ${state}" role="tab" aria-selected="${active ? 'true' : 'false'}" tabindex="0" data-slot="${escHTML(slot.id)}" style="--sc:${escHTML(hue)}" aria-label="${escHTML(slot.name)}, ${active ? 'active save slot' : 'saved slot'}, ${covered} of ${essentialCount()} covered, ${items} ${items === 1 ? 'item' : 'items'}, ${escHTML(relEdited(slot.editedAt))}">
    <div class="ck-slot__top">
      <div class="ck-slot__head">
        <span class="ck-slot__name" data-slot-name title="${escHTML(slot.name)}">${escHTML(slot.name)}</span>
        <button type="button" class="ck-slot__pencil" data-slot-rename aria-label="Rename this save" title="Rename">${PENCIL_SVG}</button>
        ${showDelete ? `<button type="button" class="ck-slot__pencil ck-slot__trash" data-slot-delete aria-label="Delete this save" title="Delete">${TRASH_SVG}</button>` : ''}
      </div>
      <div class="ck-slot__body">
        <span class="ck-slot__cov"><span class="ck-slot__num">${covered}</span><span class="ck-slot__den">/${essentialCount()}</span></span>
        <span class="ck-slot__meta">${items} ${items === 1 ? 'item' : 'items'} · ${escHTML(relEdited(slot.editedAt))}</span>
      </div>
    </div>
    <div class="ck-slot__tray">
      <div class="ck-slot__meter" role="img" aria-label="${covered} of ${essentialCount()} covered"><span class="ck-slot__meter-fill" style="width:${pct}%"></span></div>
      <div class="ck-slot__swatches" role="group" aria-label="Slot colour">${renderSwatches(hue)}</div>
    </div>
  </div>`;
}

function renderEmptySlot(index: number): string {
  const idx = String(index).padStart(2, '0');
  return `
  <button type="button" class="ck-slot ck-slot--empty" role="tab" aria-selected="false" data-slot-add data-index="${idx}" aria-label="Empty save slot ${index}, add a new regimen">
    <span class="ck-slot__plus" aria-hidden="true">${PLUS_SVG}</span>
    <span class="ck-slot__emptylabel">Empty Slot</span>
    <span class="ck-slot__emptysub">Add a save</span>
  </button>`;
}

function renderSlots(): string {
  const doc = loadSlots();
  const activeSnapshot = getOrCompute();
  const tiles = doc.slots.map((slot) => {
    const covered = slot.id === doc.activeSlot
      ? activeSnapshot.coveredCount
      : coveredCountForItems(slot.items, slot.overrides);
    return renderFilledSlot(slot, slot.id === doc.activeSlot, covered, doc.slots.length > 1);
  });
  for (let i = doc.slots.length; i < SLOT_CAP; i++) {
    tiles.push(renderEmptySlot(i + 1));
  }
  return `<div class="ck-slots" data-rise="1" role="tablist" aria-label="Save slots">${tiles.join('')}</div>`;
}

// ─── Hero console (gauge · category cluster · 90-cell readout) ────────────────

function renderGauge(covered: number, goalGap: number): string {
  const total = essentialCount();
  const covPct = (covered / Math.max(1, total)) * 100;
  const gapPct = (goalGap / Math.max(1, total)) * 100;
  const gapRotate = (-90 + covPct * 3.6).toFixed(3);
  return `
    <div class="ck-gauge">
      <svg class="ck-gauge__svg" viewBox="0 0 240 240" role="img" aria-label="${covered} of ${total} essentials covered">
        <defs><linearGradient id="ck-cov-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3d6129"/><stop offset="1" stop-color="#7cb356"/></linearGradient></defs>
        <circle class="ck-gauge__face" cx="120" cy="120" r="91"/>
        <circle class="ck-gauge__facering" cx="120" cy="120" r="84"/>
        <circle class="ck-gauge__ticks" cx="120" cy="120" r="115" pathLength="100" transform="rotate(-90 120 120)"/>
        <circle class="ck-gauge__track" cx="120" cy="120" r="100" pathLength="100"/>
        <circle class="ck-gauge__arc ck-gauge__arc--cov" cx="120" cy="120" r="100" pathLength="100" transform="rotate(-90 120 120)" style="stroke-dasharray:${covPct.toFixed(3)} 100"/>
        <circle class="ck-gauge__arc ck-gauge__arc--gap" cx="120" cy="120" r="100" pathLength="100" transform="rotate(${gapRotate} 120 120)" style="stroke-dasharray:${gapPct.toFixed(3)} 100"/>
      </svg>
      <div class="ck-gauge__center">
        <div class="ck-gauge__num" data-gauge-num>${covered}</div>
        <div class="ck-gauge__den">of <b>${total}</b> covered</div>
      </div>
    </div>`;
}

function renderCategories(): string {
  const snapshot = getOrCompute();
  const rows = CATEGORY_ROWS.map((row) => {
    const bucket = snapshot.byCategory[row.bucket] ?? { total: 0, covered: 0 };
    const pct = bucket.total > 0 ? (bucket.covered / bucket.total) * 100 : 0;
    const emptyCls = bucket.covered === 0 ? ' ck-cat--empty' : '';
    return `
      <div class="ck-cat${emptyCls}">
        <span class="ck-cat__id"><span class="ck-cat__dot" style="--cc:${row.hue}"></span><span class="ck-cat__name">${escHTML(row.label)}</span></span>
        <span class="ck-cat__meter"><i style="width:${pct.toFixed(1)}%"></i></span>
        <span class="ck-cat__frac"><b>${bucket.covered}</b>/${bucket.total}</span>
      </div>`;
  }).join('');
  return rows;
}

function renderConsole(field: FieldInfo): string {
  const doc = loadSlots();
  const active = doc.slots.find(s => s.id === doc.activeSlot);
  const ordinal = String(Math.max(0, doc.slots.findIndex(s => s.id === doc.activeSlot)) + 1).padStart(2, '0');
  const total = essentialCount();
  const items = active?.items.length ?? 0;
  const cells = field.cells.map(c => `<i class="${c.cls}" title="${escHTML(c.name)} · ${c.cls === 'covered' ? 'covered' : c.cls === 'goalgap' ? 'goal-gap' : 'open'}"></i>`).join('');
  return `
    <section class="ck-console" data-rise="2" aria-label="Coverage gauge">
      <div class="ck-console__bar">
        <span class="ck-console__live"></span>
        <span class="ck-console__label">Coverage · <b>${escHTML(active?.name ?? 'Regimen')}</b></span>
        <span class="ck-console__tag">Slot ${ordinal} · ${items} ${items === 1 ? 'item' : 'items'} · ${escHTML(relEdited(active?.editedAt ?? new Date().toISOString().slice(0, 10)))}</span>
      </div>
      <div class="ck-hero">
        ${renderGauge(field.covered, field.goalGap)}
        <div class="ck-cluster">
          <div class="ck-cluster__head">By category</div>
          ${renderCategories()}
          <div class="ck-legend">
            <span class="ck-legend__item"><span class="ck-legend__sw ck-legend__sw--cov"></span>${field.covered} covered</span>
            <span class="ck-legend__item"><span class="ck-legend__sw ck-legend__sw--gap"></span>${field.goalGap} goal-gap</span>
            <span class="ck-legend__item"><span class="ck-legend__sw ck-legend__sw--not"></span>${field.open} open</span>
          </div>
        </div>
      </div>
      <div class="ck-readout">
        <div class="ck-readout__label">${total}-essential readout · <b>${field.covered} covered</b> · ${field.goalGap} goal-gap · ${field.open} open</div>
        <div class="ck-readout__field">${cells}</div>
      </div>
    </section>`;
}

// ─── Goals strip (per-slot) ──────────────────────────────────────────────────

function renderGoals(goals: LayoutGoal[]): string {
  const chips = goals.map((g, i) => `
    <span class="gchip" style="--gc:${escHTML(GOAL_HUES[i] ?? GOAL_HUES[0])}"><span class="gchip__dot"></span><span class="gchip__label">${escHTML(g.name)}</span><button class="gchip__x" type="button" data-goal-remove="${escHTML(g.id)}" aria-label="Remove ${escHTML(g.name)}">×</button></span>`).join('');
  const add = goals.length < MAX_GOALS
    ? '<span class="gchip gchip--add" data-goal-add><span class="gchip__label">＋ Add goal</span></span>'
    : '';
  return `
    <div class="goalstrip ck-goals" data-rise="3">
      <span class="goalstrip__eyebrow">Steering goals · ${escHTML(loadSlots().slots.find(s => s.id === loadSlots().activeSlot)?.name ?? 'Regimen')}</span>
      ${chips}${add}
    </div>`;
}

/** The inline "add a goal" menu — the unpicked layout goals, click to add. */
function renderGoalMenu(goals: LayoutGoal[]): string {
  const picked = new Set(goals.map(g => g.id));
  const options = LAYOUT.goals.filter(g => !picked.has(g.id)).map(g =>
    `<button type="button" class="ck-goalmenu__opt" data-goal-pick="${escHTML(g.id)}">${escHTML(g.name)}</button>`).join('');
  return `<div class="ck-goalmenu" data-goal-menu hidden>${options}</div>`;
}

// ─── Recommendations (products only) + active stack + add card (DOM) ──────────

function wantedSlugs(goals: LayoutGoal[]): string[] {
  if (goals.length > 0) {
    return [...new Set(goals.flatMap(g => g.members))];
  }
  const snapshot = getOrCompute();
  // Normalise case on the join: layout tiles are keyed UPPERCASE ('HYDROGEN'), the snapshot
  // carries the Title-case target name ('Hydrogen'). Without this every gap misses -> want [].
  const keyToSlug = new Map([...slugToTileKey()].map(([slug, key]) => [key.toLowerCase(), slug]));
  return snapshot.tiles.filter(t => t.status === 'gap').map(t => keyToSlug.get(t.name.toLowerCase())).filter((s): s is string => s !== undefined);
}

function buildRecs(host: HTMLElement, recs: CoverageRec[], goals: LayoutGoal[]): void {
  host.replaceChildren();
  const hueOf = (id: string): string => {
    const i = goals.findIndex(g => g.id === id);
    return GOAL_HUES[i] ?? GOAL_HUES[0];
  };
  if (recs.length === 0) {
    const note = document.createElement('p');
    note.className = 'ck-recs__note';
    note.textContent = 'No product fills a gap right now — your stack already reaches these.';
    host.appendChild(note);
    return;
  }
  for (const r of recs) {
    const cols = r.goalIds.map(hueOf);
    const ring = cols.length === 0
      ? 'linear-gradient(var(--ds-rule-bright), var(--ds-rule-soft))'
      : cols.length === 1 ? `linear-gradient(150deg, ${cols[0]}, color-mix(in srgb, ${cols[0]} 22%, transparent))` : `linear-gradient(150deg, ${cols.join(', ')})`;
    const card = document.createElement('button');
    card.className = 'rec';
    card.type = 'button';
    card.dataset['recAdd'] = r.name;
    card.style.setProperty('--recRing', ring);
    const name = document.createElement('div');
    name.className = 'rec__name';
    name.textContent = r.name;
    card.appendChild(name);
    const meta = document.createElement('div');
    meta.className = 'rec__meta';
    const price = document.createElement('span');
    price.className = 'rec__price';
    price.textContent = `$${r.price.toFixed(2)}`;
    const val = document.createElement('span');
    val.className = 'rec__val';
    val.textContent = `+${r.supplies} ${r.supplies === 1 ? 'essential' : 'essentials'}`;
    meta.append(price, val);
    for (const gid of r.goalIds) {
      const g = goals.find(x => x.id === gid);
      if (g === undefined) {
        continue;
      }
      const tag = document.createElement('span');
      tag.className = 'ck-tag';
      tag.style.setProperty('--tc', hueOf(gid));
      tag.textContent = g.name;
      meta.appendChild(tag);
    }
    card.appendChild(meta);
    const add = document.createElement('span');
    add.className = 'rec__add';
    add.textContent = '＋';
    card.appendChild(add);
    host.appendChild(card);
  }
}

function buildRailRows(host: HTMLElement, items: RegimenItem[]): void {
  host.replaceChildren();
  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'rail-empty';
    const p = document.createElement('p');
    p.textContent = 'Nothing in this save yet.';
    const small = document.createElement('small');
    small.textContent = 'Add a product below, or scan a label.';
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
    nameEl.textContent = label;
    nameEl.title = label;
    row.appendChild(nameEl);
    const x = document.createElement('button');
    x.className = 'rl-row__x';
    x.type = 'button';
    x.dataset['rowRemove'] = id;
    x.setAttribute('aria-label', `Remove ${label}`);
    x.textContent = '×';
    row.appendChild(x);
    const foot = document.createElement('div');
    foot.className = 'rl-row__foot';
    const src = document.createElement('span');
    const own = item.provenance === 'user_scanned';
    src.className = `rl-src${own ? ' is-own' : ''}`;
    src.textContent = own ? 'YOUR OWN' : 'EDEN';
    foot.appendChild(src);
    const doseEl = document.createElement('div');
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

function renderRail(): string {
  const doc = loadSlots();
  const active = doc.slots.find(s => s.id === doc.activeSlot);
  const items = active?.items.length ?? 0;
  const ordinal = String(Math.max(0, doc.slots.findIndex(s => s.id === doc.activeSlot)) + 1).padStart(2, '0');
  const names = [...readVault().values()].map(p => p.canonical_name ?? p.name).filter((n): n is string => typeof n === 'string').sort((a, b) => a.localeCompare(b));
  const options = names.map(n => `<option value="${escHTML(n)}"></option>`).join('');
  return `
    <aside class="ck-rail" data-rise="5">
      <section class="rail-panel">
        <div class="rail-panel__head">
          <div class="rail-panel__eyebrow">Active stack</div>
          <div class="rail-panel__title">${escHTML(active?.name ?? 'Regimen')}</div>
          <div class="rail-panel__meta">Slot ${ordinal} · ${items} ${items === 1 ? 'item' : 'items'} · ${escHTML(relEdited(active?.editedAt ?? new Date().toISOString().slice(0, 10)))}</div>
        </div>
        <div class="rail-list" data-rail-list></div>
      </section>
      <section class="ck-addcard">
        <div class="ck-addcard__head">
          <span class="ck-addcard__eyebrow">Add to ${escHTML(active?.name ?? 'Regimen')}</span>
          <span class="ck-addcard__sub">products</span>
        </div>
        <label class="ck-addfield">
          <span class="ck-addfield__plus">＋</span>
          <input class="ck-addfield__input" list="ck-vault-list" placeholder="Add a product…" aria-label="Add a product" data-add-input>
          <kbd class="ck-addfield__kbd" aria-hidden="true">/</kbd>
        </label>
        <datalist id="ck-vault-list">${options}</datalist>
      </section>
      <button class="ds-btn-primary ck-scan" type="button" data-scan-new><b class="ck-scan__plus" aria-hidden="true">+</b>Scan a new item</button>
    </aside>`;
}

// ─── Delete-with-undo ────────────────────────────────────────────────────────

interface DeletedSlot {
  name: string;
  colour: string;
  goals: string[];
  items: RegimenItem[];
  overrides: Record<string, Record<string, unknown>>;
}

/** Reconstruct a just-deleted slot from the capture (items come back out of the trash). */
function undoDelete(cap: DeletedSlot): { ok: boolean; reason?: string } {
  const res = addSlot(cap.name);
  if (!res.ok || res.slotId === undefined) {
    // REG-07: the cap may have been refilled during the undo window — surface the refusal
    // instead of a silent no-op that strands the captured items in trash.
    return { ok: false, reason: res.ok ? 'Could not undo — you are at the slot limit.' : res.reason };
  }
  setActiveSlot(res.slotId);
  for (const item of cap.items) {
    restoreFromTrash(item.id);
  }
  if (isSlotColour(cap.colour)) {
    setSlotColour(res.slotId, cap.colour);
  }
  saveRgUserGoals(cap.goals);
  for (const [id, patch] of Object.entries(cap.overrides)) {
    saveRgOverride(id, patch);
  }
  return { ok: true };
}

// ─── Mount ────────────────────────────────────────────────────────────────────

export function mount(container: HTMLElement): MountHandle {
  let animated = false;
  let undoTimer: number | null = null;

  /** Cap the active-stack panel to the console's height (measured, tracks any width). */
  const syncStackHeight = (): void => {
    const consoleEl = container.querySelector<HTMLElement>('.ck-console');
    const stack = container.querySelector<HTMLElement>('.ck-rail .rail-panel');
    if (consoleEl !== null && stack !== null) {
      stack.style.maxHeight = `${Math.round(consoleEl.getBoundingClientRect().height)}px`;
    }
  };

  const animateGauge = (target: number): void => {
    const el = container.querySelector<HTMLElement>('[data-gauge-num]');
    if (el === null) {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = String(target);
      return;
    }
    let start: number | null = null;
    const step = (ts: number): void => {
      start ??= ts;
      const p = Math.min((ts - start) / 1150, 1);
      el.textContent = String(Math.round((1 - (1 - p) ** 3) * target));
      if (p < 1) {
        requestAnimationFrame(step);
      }
      else {
        el.textContent = String(target);
      }
    };
    requestAnimationFrame(step);
  };

  const render = (): void => {
    const goals = activeGoals();
    const field = fieldInfo(goals);
    container.innerHTML = `
      <div class="ck">
        ${renderSlots()}
        <div class="coverage-grid ck-grid">
          <div class="coverage-main ck-main">
            ${renderConsole(field)}
            ${renderGoals(goals)}
            ${renderGoalMenu(goals)}
            <div class="recs ck-recs" data-rise="4">
              <div class="recs__head"><span class="recs__eyebrow">Best next moves</span><span class="ck-recs__note">Products, ranked by your goals</span></div>
              <div class="ck-recgrid" data-recgrid></div>
            </div>
          </div>
          ${renderRail()}
        </div>
        <div class="ck-undo" data-undo hidden></div>
      </div>`;

    const items = loadEffectiveRegimen();
    const railList = container.querySelector<HTMLElement>('[data-rail-list]');
    if (railList !== null) {
      buildRailRows(railList, items);
    }
    const recGrid = container.querySelector<HTMLElement>('[data-recgrid]');
    if (recGrid !== null) {
      const recs = rankProductsForCoverage({
        want: wantedSlugs(goals),
        owned: productIdsForNames(items.map(i => (typeof i.label.name === 'string' ? i.label.name : ''))),
        goals: goals.map(g => ({ id: g.id, members: g.members })),
        limit: REC_LIMIT,
      });
      buildRecs(recGrid, recs, goals);
    }
    syncStackHeight();
    if (!animated) {
      animated = true;
      animateGauge(field.covered);
    }
  };

  const showToast = (message: string, undo?: () => void): void => {
    const bar = container.querySelector<HTMLElement>('[data-undo]');
    if (bar === null) {
      return;
    }
    bar.replaceChildren();
    const msg = document.createElement('span');
    msg.textContent = message;
    bar.appendChild(msg);
    if (undo !== undefined) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ck-undo__btn';
      btn.textContent = 'Undo';
      btn.addEventListener('click', () => {
        if (undoTimer !== null) {
          window.clearTimeout(undoTimer);
          undoTimer = null;
        }
        undo();
      });
      bar.appendChild(btn);
    }
    bar.hidden = false;
    if (undoTimer !== null) {
      window.clearTimeout(undoTimer);
    }
    undoTimer = window.setTimeout(() => {
      bar.hidden = true;
    }, 8000);
  };

  const beginRename = (nameEl: HTMLElement, slotId: string): void => {
    nameEl.setAttribute('contenteditable', 'true');
    nameEl.focus();
    const range = document.createRange();
    range.selectNodeContents(nameEl);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        nameEl.blur();
      }
    };
    const onInput = (): void => {
      const v = nameEl.textContent ?? '';
      if (v.length > 17) {
        nameEl.textContent = v.slice(0, 17);
        const r = document.createRange();
        r.selectNodeContents(nameEl);
        r.collapse(false);
        const s = window.getSelection();
        s?.removeAllRanges();
        s?.addRange(r);
      }
    };
    const onBlur = (): void => {
      nameEl.removeAttribute('contenteditable');
      nameEl.removeEventListener('keydown', onKey);
      nameEl.removeEventListener('input', onInput);
      nameEl.removeEventListener('blur', onBlur);
      const next = (nameEl.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (next.length > 0) {
        renameSlot(slotId, next); // emits regimen:changed → re-render
      }
      else {
        render();
      }
    };
    nameEl.addEventListener('keydown', onKey);
    nameEl.addEventListener('input', onInput);
    nameEl.addEventListener('blur', onBlur);
  };

  const clickHandler = (ev: Event): void => {
    const target = ev.target as HTMLElement | null;
    if (target === null) {
      return;
    }
    // — slot swatch (recolour) —
    const swatch = target.closest<HTMLElement>('[data-swatch]');
    if (swatch !== null) {
      ev.stopPropagation();
      const tile = swatch.closest<HTMLElement>('[data-slot]');
      const hue = swatch.dataset['swatch'];
      if (tile?.dataset['slot'] !== undefined && hue !== undefined) {
        setSlotColour(tile.dataset['slot'], hue);
      }
      return;
    }
    // — rename —
    const rename = target.closest<HTMLElement>('[data-slot-rename]');
    if (rename !== null) {
      ev.stopPropagation();
      const tile = rename.closest<HTMLElement>('[data-slot]');
      const nameEl = tile?.querySelector<HTMLElement>('[data-slot-name]');
      if (tile?.dataset['slot'] !== undefined && nameEl != null) {
        beginRename(nameEl, tile.dataset['slot']);
      }
      return;
    }
    // — delete (with undo) —
    const del = target.closest<HTMLElement>('[data-slot-delete]');
    if (del !== null) {
      ev.stopPropagation();
      const tile = del.closest<HTMLElement>('[data-slot]');
      const id = tile?.dataset['slot'];
      if (id === undefined) {
        return;
      }
      const doc = loadSlots();
      const slot = doc.slots.find(s => s.id === id);
      if (slot === undefined) {
        return;
      }
      const cap: DeletedSlot = {
        name: slot.name,
        colour: slotColour(slot),
        goals: [...(slot.goals ?? [])],
        items: slot.items.map(i => ({ ...i })),
        overrides: JSON.parse(JSON.stringify(slot.overrides)) as DeletedSlot['overrides'],
      };
      const res = deleteSlot(id);
      if (res.ok) {
        showToast(`Deleted "${cap.name}".`, () => {
          const r = undoDelete(cap);
          if (!r.ok) {
            showToast(r.reason ?? 'Could not undo.');
          }
        }); // re-render fires from the delete's regimen:changed; then the bar shows on the fresh DOM
      }
      else {
        showToast(res.reason);
      }
      return;
    }
    // — empty slot: create a blank save —
    const addSlotBtn = target.closest<HTMLElement>('[data-slot-add]');
    if (addSlotBtn !== null) {
      ev.stopPropagation();
      const res = addSlot();
      if (res.ok && res.slotId !== undefined) {
        setActiveSlot(res.slotId);
      }
      else if (!res.ok) {
        showToast(res.reason);
      }
      return;
    }
    // — goal add menu toggle —
    if (target.closest('[data-goal-add]') !== null) {
      ev.stopPropagation();
      const menu = container.querySelector<HTMLElement>('[data-goal-menu]');
      if (menu !== null) {
        menu.hidden = !menu.hidden;
      }
      return;
    }
    // — goal pick —
    const pick = target.closest<HTMLElement>('[data-goal-pick]');
    if (pick !== null) {
      const id = pick.dataset['goalPick'];
      if (id !== undefined) {
        saveRgUserGoals([...(loadRgUserGoals() ?? []), id]);
      }
      return;
    }
    // — goal remove —
    const goalRemove = target.closest<HTMLElement>('[data-goal-remove]');
    if (goalRemove !== null) {
      const id = goalRemove.dataset['goalRemove'];
      if (id !== undefined) {
        saveRgUserGoals((loadRgUserGoals() ?? []).filter(g => g !== id));
      }
      return;
    }
    // — rec add —
    const recAdd = target.closest<HTMLElement>('[data-rec-add]');
    if (recAdd !== null) {
      const name = recAdd.dataset['recAdd'];
      if (name !== undefined) {
        addItem(name);
      }
      return;
    }
    // — dose steppers —
    const up = target.closest<HTMLElement>('[data-dose-up]');
    const down = target.closest<HTMLElement>('[data-dose-down]');
    if (up !== null || down !== null) {
      const idStr = (up ?? down)?.dataset[up !== null ? 'doseUp' : 'doseDown'];
      const id = Number(idStr);
      if (Number.isFinite(id)) {
        const item = loadEffectiveRegimen().find(i => i.id === id);
        if (item !== undefined) {
          const next = Math.max(1, readItemDose(item) + (up !== null ? 1 : -1));
          saveRgOverride(id, { scaling_factor: next });
        }
      }
      return;
    }
    // — remove item —
    const rowRemove = target.closest<HTMLElement>('[data-row-remove]');
    if (rowRemove !== null) {
      const id = Number(rowRemove.dataset['rowRemove']);
      if (Number.isFinite(id)) {
        saveRgRemoved(new Set([id]));
      }
      return;
    }
    // — scan hand-off —
    if (target.closest('[data-scan-new]') !== null) {
      window.dispatchEvent(new CustomEvent('wallach:navigate', { detail: { to: 'scanner' } }));
      return;
    }
    // — activate a slot (last: the tile background) —
    const slotTile = target.closest<HTMLElement>('[data-slot]');
    if (slotTile?.dataset['slot'] !== undefined) {
      setActiveSlot(slotTile.dataset['slot']);
    }
  };

  const keyHandler = (ev: KeyboardEvent): void => {
    if (ev.key !== 'Enter') {
      return;
    }
    const input = ev.target as HTMLElement | null;
    if (input?.matches('[data-add-input]') === true) {
      ev.preventDefault();
      const field = input as HTMLInputElement;
      if (field.value.trim().length > 0 && addItem(field.value)) {
        field.value = '';
      }
    }
  };

  /** "/" focuses the add-a-product field when the Regimen workspace is visible. */
  const slashFocus = (ev: KeyboardEvent): void => {
    if (ev.key !== '/' || ev.metaKey || ev.ctrlKey || ev.altKey) {
      return;
    }
    if (container.offsetParent === null) {
      return;
    }
    const t = ev.target as HTMLElement | null;
    if (t !== null && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
      return;
    }
    const input = container.querySelector<HTMLInputElement>('[data-add-input]');
    if (input !== null) {
      ev.preventDefault();
      input.focus();
    }
  };

  render();
  container.addEventListener('click', clickHandler);
  container.addEventListener('keydown', keyHandler);
  document.addEventListener('keydown', slashFocus);
  window.addEventListener('resize', syncStackHeight);

  const unsubReg = on('regimen:changed', render);
  const unsubCov = on('coverage:recomputed', render);

  return {
    update: render,
    unmount: () => {
      unsubReg();
      unsubCov();
      if (undoTimer !== null) {
        window.clearTimeout(undoTimer);
      }
      container.removeEventListener('click', clickHandler);
      container.removeEventListener('keydown', keyHandler);
      document.removeEventListener('keydown', slashFocus);
      window.removeEventListener('resize', syncStackHeight);
      container.innerHTML = '';
    },
  };
}
