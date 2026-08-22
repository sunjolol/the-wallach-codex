/**
 * views/regimen.ts — the Regimen workspace (the Cockpit + the save-slot switcher)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Built against real data and real state from an approved static design mockup. A
 * mockup is DESIGN truth, not a code donor: nothing on this screen is a placeholder,
 * and no number here is hand-authored.
 *
 * WHAT IS REAL (no fabrication, anti-fakery):
 *   · Slots come from loadSlots() (rgSlots_v1). Each save-slot's coverage is the
 *     SAME engine the gauge uses — coveredCountForItems(slot.items, slot.overrides) —
 *     so a saved slot's number equals what it reads once active (no drift).
 *   · The gauge / category cluster / 90-cell readout read the live CoverageSnapshot.
 *   · Goals are PER-SLOT: loadRgUserGoals/saveRgUserGoals read/write the active
 *     slot's goals, so each save steers its own recommendations.
 *   · Recommendations are rankProductsForCoverage — PRODUCTS ONLY. Foods are a
 *     deferred sourced artifact; the layout is kept ready but no food row or
 *     number is invented here.
 *   · Dose steppers route saveRgOverride(id, {scaling_factor}) → writeSlotDoc →
 *     'regimen:changed' → recompute; the counts move because the live math already
 *     multiplies delivered mg by that factor (no dose→coverage curve invented).
 *   · Product NAMES are written with .textContent (escape at the sink, never a filter).
 *
 * THE GOAL RULE (inherited, unbreakable): a goal changes what you LOOK AT / are
 * RECOMMENDED, never what you are MEASURED AGAINST. The denominator is always 90.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import coverageLayoutData from '../../../data/coverage-layout-data.json';
import regimenLabelLookup from '../../../data/regimen-label-lookup.json';
import { emit, on } from '../core/events.js';
import { GOAL_HUES, MAX_GOALS } from '../core/goal-display.js';
import { isUserSupplied } from '../core/provenance.js';
import { BACKUP_APP_ID } from '../core/schemas/backup.js';
import {
  CoverageLayoutSchema,
  type LayoutGoal,
  ProductsLookupSchema,
  REGIMEN_SLOT_EXPORT_KIND,
  type RegimenItem,
  type RegimenVaultEntry,
  RegimenVaultEntrySchema,
  SlotExportEnvelopeSchema,
} from '../core/schemas/index.js';
import { coveredCountForItems, essentialCount, getOrCompute, matchEssential } from '../state/coverage.js';
import { atMinimumDose, doseCount, doseUnitLabel, doseUnitsOf } from '../core/dose-units.js';
import { defaultServingsFor } from '../state/dose-defaults.js';
import { rankFoodsForCoverage } from '../state/foods.js';
import { type CoverageRec, productIdsForNames, rankProductsForCoverage } from '../state/recommender.js';
import { addCatalogFood, buildFoodsBlock } from './foods-block.js';
import { starterPackIds } from '../state/starter-pack.js';
import {
  addOrBumpRegimenItem,
  type AddOutcome,
  addSlot,
  DEFAULT_SLOT_COLOUR,
  deleteSlot,
  importSlot,
  isSlotColour,
  loadEffectiveRegimen,
  loadRgUserGoals,
  loadSlots,
  MAX_ITEM_TRASH,
  MAX_SLOT_TRASH,
  MAX_SLOTS,
  renameSlot,
  restoreDeletedItem,
  restoreDeletedSlot,
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

/**
 * How many product recs the main column's "Best next moves" row shows: the whole curated
 * starter pack, then the scored gap-fills behind it.
 *
 * DERIVED from the pack rather than written down — a hand-typed number here would
 * disagree with the pack the day a sixth product is pinned.
 *
 * ★ NOT the Coverage cap. Coverage's 9 is a CEILING on how many products that tab will ever
 * put in a regimen; this is just how many cards the row shows at once. The console is meant
 * to keep producing until the field is closed, which is the next pass.
 *
 * ★ THREE, leaving room for three FOOD cards above them — six recommendations visible, foods
 * first. The foods half is not built yet (it waits on a source-rule ruling), so today the row
 * shows three products and nothing above them.
 */
const REC_LIMIT = 3;
/** How many FOOD cards sit above the products. Three, so the row shows six in total —
 *  foods first (owner ruling, 2026-08-21). Matched to REC_LIMIT deliberately: the two
 *  blocks are meant to read as one six-card row split by a labelled rule, not as a big
 *  block and a small one. */
const FOOD_LIMIT = 3;
/** How many slot tiles the switcher paints. MUST equal state/regimen.ts's MAX_SLOTS — the state
 *  layer refuses a fifth save, so a mismatch here paints an empty tile that can never be filled. */
const SLOT_CAP = 4;

/** The four category rows, in board order, with the house category hues (minerals blue, vitamins
 *  orange, amino acids green, fatty acids purple). */
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

/** Relative time from a full ISO timestamp — "just now" / "Nm ago" / "Nh ago" / "yesterday" / "N days ago". */
function relAge(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) {
    return iso;
  }
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 45) {
    return 'just now';
  }
  const mins = Math.round(secs / 60);
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hrs = Math.round(mins / 60);
  if (hrs < 24) {
    return `${hrs}h ago`;
  }
  const days = Math.round(hrs / 24);
  if (days === 1) {
    return 'yesterday';
  }
  if (days < 7) {
    return `${days} days ago`;
  }
  const weeks = Math.round(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

/** The active slot's chosen goals, resolved against the layout and capped at MAX_GOALS. */
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
 * beyond case for 16 of the 91 tiles, e.g. vitamin-c renders "ASCORBIC ACID"). Using
 * `key` makes the goal-gap + no-goals recommender joins resolve for every tile, not
 * just the 75 whose display name matches.
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
 * an UNCOVERED essential that is a member of an active goal (the goals × coverage
 * intersection). The denominator stays 90 — a goal only re-colours the open cells,
 * never changes what is measured.
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
  // Interleaved by canon order the readout is illegible, so group it covered (green) -> goal-gap
  // -> open (beige); the stable sort keeps canon order inside each block.
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

/** Build a RegimenItem from a vault product (matched by name) + persist via the regimen write
 *  chokepoint. */
function addItem(rawName: string): AddOutcome | null {
  const product = readVault().get(rawName.trim().toLowerCase());
  if (product === undefined) {
    return null;
  }
  // This path matches the vault by NAME, so recover the id the way every other surface
  // does. Without it the two add paths mint DIFFERENT items for the same product — which is
  // precisely how this one silently missed the curated starting quantities.
  const productId = productIdsForNames([rawName])[0] ?? '';
  const servingUnits = typeof product.serving_units === 'number' ? product.serving_units : null;
  const item: RegimenItem = {
    id: Date.now(),
    label: {
      name: product.canonical_name ?? product.name ?? rawName,
      nutrients: product.nutrients ?? [],
      ...(servingUnits !== null
        ? { serving_units: servingUnits, serving_unit: product.serving_unit }
        : {}),
      servings: defaultServingsFor(productId, servingUnits),
    },
    addedDate: new Date().toISOString().slice(0, 10),
    provenance: 'user_manual',
  };
  return addOrBumpRegimenItem(item);
}

// ─── Slot switcher ───────────────────────────────────────────────────────────

const PENCIL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
const TRASH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6"/></svg>';
const PLUS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const EXPORT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';
const IMPORT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 9l5-5 5 5"/><path d="M12 4v12"/></svg>';

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
        <button type="button" class="ck-slot__pencil ck-slot__export" data-slot-export="${escHTML(slot.id)}" aria-label="Export this save to a file" title="Export this save">${EXPORT_SVG}</button>
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
  <div class="ck-slot ck-slot--empty" data-index="${idx}">
    <button type="button" class="ck-slot__addcore" data-slot-add aria-label="Empty save slot ${index}, add a new regimen">
      <span class="ck-slot__plus" aria-hidden="true">${PLUS_SVG}</span>
      <span class="ck-slot__emptylabel">Empty Slot</span>
      <span class="ck-slot__emptysub">Add a save</span>
    </button>
    <button type="button" class="ck-slot__import" data-slot-import aria-label="Import a saved regimen from a file" title="Import a saved regimen (.json)">${IMPORT_SVG}<span>Import</span></button>
  </div>`;
}

/** Download one save as an app-marked JSON envelope (the user owns 100% of their data). */
function exportSlot(slotId: string, toast: (message: string) => void): void {
  const slot = loadSlots().slots.find(s => s.id === slotId);
  if (slot === undefined) {
    toast('That save no longer exists.');
    return;
  }
  const env = {
    app: BACKUP_APP_ID,
    kind: REGIMEN_SLOT_EXPORT_KIND,
    version: 1,
    exportedAt: new Date().toISOString(),
    slot,
  };
  const blob = new Blob([JSON.stringify(env, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safe = slot.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 30) || 'regimen';
  a.download = `wallach-regimen-${safe}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Read a user-picked .json file, validate the envelope, hand the save to the sanitizing state op. */
function importSlotFromFile(file: File, toast: (message: string) => void): void {
  const reader = new FileReader();
  reader.onload = (): void => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(reader.result)); // no reviver — file content is never executed
    }
    catch {
      toast('That file is not valid JSON.');
      return;
    }
    const env = SlotExportEnvelopeSchema.safeParse(parsed);
    if (!env.success) {
      toast('That is not a Codex regimen file.');
      return;
    }
    const res = importSlot(env.data.slot);
    if (!res.ok) {
      toast(res.reason);
    }
    // On success writeSlotDoc emits 'regimen:changed' → the view re-renders with the new save active.
  };
  reader.onerror = (): void => toast('That file could not be read.');
  reader.readAsText(file);
}

/** Open the OS file picker for a regimen import (transient input; nothing persists in the DOM). */
function triggerImport(toast: (message: string) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file !== undefined) {
      importSlotFromFile(file, toast);
    }
  });
  input.click();
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
  const cells = field.cells.map(c => `<i class="${c.cls}" data-tip="${escHTML(c.name)} · ${c.cls === 'covered' ? 'covered' : c.cls === 'goalgap' ? 'goal-gap' : 'open'}"></i>`).join('');
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
    <span class="gchip" style="--gc:${escHTML(GOAL_HUES[i] ?? GOAL_HUES[0])}"><span class="gchip__dot"></span><span class="gchip__label">${escHTML(g.name)}</span><button class="ui-close ui-close--sm gchip__x" type="button" data-goal-remove="${escHTML(g.id)}" aria-label="Remove ${escHTML(g.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span>`).join('');
  const add = goals.length < MAX_GOALS
    ? '<span class="gchip gchip--add" data-goal-add><span class="gchip__label">＋ Add goal</span></span>'
    : '';
  return `
    <div class="goalstrip ck-goals" data-rise="3">
      <span class="goalstrip__eyebrow">Your Goals</span>
      ${chips}${add}
    </div>`;
}

// ─── Recommendations (products only) + active stack + add card (DOM) ──────────

function wantedSlugs(goals: LayoutGoal[]): string[] {
  // Goals no longer decide WHAT is offered — only how the cards are tinted. The owner's
  // ruling (2026-08-21): the gap-fills target "the MOST remaining gaps, whether they are
  // goals or not". Mirrors views/coverage.ts::wantedSlugs; the two must not diverge.
  void goals;
  const snapshot = getOrCompute();
  // Normalise case on the join: layout tiles are keyed UPPERCASE ('HYDROGEN'), the snapshot
  // carries the Title-case target name ('Hydrogen'). Without this every gap misses -> want [].
  const keyToSlug = new Map([...slugToTileKey()].map(([slug, key]) => [key.toLowerCase(), slug]));
  // OUTSTANDING is "not covered", not "gap": `gap` excludes `partial`, `present` and the
  // blank status, all three of which are still genuinely unfinished. Matches views/coverage.ts.
  return snapshot.tiles.filter(t => t.status !== 'covered').map(t => keyToSlug.get(t.name.toLowerCase())).filter((s): s is string => s !== undefined);
}

function buildRecs(
  host: HTMLElement, recs: CoverageRec[], goals: LayoutGoal[], allCovered: boolean,
): void {
  host.replaceChildren();
  const hueOf = (id: string): string => {
    const i = goals.findIndex(g => g.id === id);
    return GOAL_HUES[i] ?? GOAL_HUES[0];
  };
  if (recs.length === 0) {
    const note = document.createElement('p');
    note.className = 'ck-recs__note';
    // TWO different endings, and conflating them would lie in one direction or the other.
    // "No product fits" happens all the time with an unfinished field; "all 90 covered" is
    // the actual finish line and it earns a different sentence AND a way onward.
    note.textContent = allCovered
      ? 'All 90 essentials are now covered — no more recommendations needed.'
      : 'No product fills a gap right now — your stack already reaches these.';
    host.appendChild(note);
    if (allCovered) {
      const go = document.createElement('button');
      go.className = 'ck-recs__go';
      go.type = 'button';
      go.dataset['openProducts'] = '1';
      go.textContent = 'Explore the Products tab';
      host.appendChild(go);
    }
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
    const own = isUserSupplied(item.provenance);
    const row = document.createElement('div');
    row.className = 'rr-row';
    row.dataset['rowId'] = id;
    row.dataset['rrName'] = label.toLowerCase();

    const main = document.createElement('div');
    main.className = 'rr-row__main';
    const nameEl = document.createElement('div');
    nameEl.className = 'rr-row__name';
    nameEl.textContent = label;
    nameEl.title = label;
    const srcEl = document.createElement('div');
    srcEl.className = `rr-row__src ${own ? 'is-own' : 'is-eden'}`;
    srcEl.textContent = own ? 'Your own' : 'Eden';
    main.append(nameEl, srcEl);
    row.appendChild(main);

    const doseEl = document.createElement('div');
    doseEl.className = 'rr-dose';
    const minus = document.createElement('button');
    minus.className = 'rr-dose__b';
    minus.type = 'button';
    minus.dataset['doseDown'] = id;
    minus.setAttribute('aria-label', 'Fewer');
    minus.textContent = '−';
    // `dose` is SERVINGS; the stepper speaks the product's own units. Mirrors views/coverage.ts
    // — the two render the same control and must not disagree about what the number means.
    const units = doseUnitsOf(item.label);
    minus.disabled = atMinimumDose(dose, units);
    const nEl = document.createElement('span');
    nEl.className = 'rr-dose__n';
    nEl.textContent = formatDose(doseCount(dose, units));
    const plus = document.createElement('button');
    plus.className = 'rr-dose__b';
    plus.type = 'button';
    plus.dataset['doseUp'] = id;
    plus.setAttribute('aria-label', 'More');
    plus.textContent = '+';
    const unit = document.createElement('span');
    unit.className = 'rr-dose__u';
    unit.textContent = doseUnitLabel(doseCount(dose, units), units);
    doseEl.append(minus, nEl, plus, unit);
    row.appendChild(doseEl);

    const x = document.createElement('button');
    x.className = 'ui-close ui-close--sm';
    x.type = 'button';
    x.dataset['rowRemove'] = id;
    x.setAttribute('aria-label', `Remove ${label}`);
    x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    row.appendChild(x);

    host.appendChild(row);
  }
}

/** Intrinsic essentials a product supplies — how many of the 90 its composition covers, so the
 *  typeahead tells a layman what a product IS, not just its name. */
function productSupplies(entry: RegimenVaultEntry): number {
  const ess = new Set<string>();
  for (const n of entry.nutrients ?? []) {
    const nm = (n as { name?: unknown }).name;
    if (typeof nm === 'string') {
      const m = matchEssential(nm);
      if (m !== null) {
        ess.add(m.name);
      }
    }
  }
  return ess.size;
}

/**
 * The add-a-product typeahead: show the top 3 vault matches ONLY after the user types, each an
 * explicit row with its own Add button — a native datalist of every product gave the user nothing
 * to judge a match by.
 */
function renderTypeahead(container: HTMLElement, query: string): void {
  const results = container.querySelector<HTMLElement>('[data-ta-results]');
  if (results === null) {
    return;
  }
  const q = query.trim().toLowerCase();
  results.replaceChildren();
  if (q.length === 0) {
    results.hidden = true;
    return;
  }
  const matches = [...readVault().values()]
    .map(p => ({ name: p.canonical_name ?? p.name, entry: p }))
    .filter((x): x is { name: string; entry: RegimenVaultEntry } => typeof x.name === 'string' && x.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const ai = a.name.toLowerCase().indexOf(q);
      const bi = b.name.toLowerCase().indexOf(q);
      return ai !== bi ? ai - bi : a.name.localeCompare(b.name);
    })
    .slice(0, 3);
  if (matches.length === 0) {
    const none = document.createElement('div');
    none.className = 'rr-results__none';
    none.textContent = `No product matches “${query.trim()}”.`;
    results.appendChild(none);
    results.hidden = false;
    return;
  }
  const total = essentialCount();
  for (const { name, entry } of matches) {
    const supplies = productSupplies(entry);
    const row = document.createElement('div');
    row.className = 'rr-results__row';
    const info = document.createElement('span');
    info.className = 'rr-results__info';
    const nm = document.createElement('span');
    nm.className = 'rr-results__name';
    nm.textContent = name;
    nm.title = name;
    const meta = document.createElement('span');
    meta.className = 'rr-results__meta';
    meta.textContent = supplies > 0 ? `covers ${supplies} of ${total} essentials` : 'single-ingredient product';
    info.append(nm, meta);
    const add = document.createElement('button');
    add.className = 'rr-results__add';
    add.type = 'button';
    add.dataset['taAdd'] = name;
    add.textContent = 'Add';
    row.append(info, add);
    results.appendChild(row);
  }
  results.hidden = false;
}

function renderRail(): string {
  const doc = loadSlots();
  const active = doc.slots.find(s => s.id === doc.activeSlot);
  const items = active?.items.length ?? 0;
  const ordinal = String(Math.max(0, doc.slots.findIndex(s => s.id === doc.activeSlot)) + 1).padStart(2, '0');
  const binCount = (doc.slotTrash?.length ?? 0) + doc.trash.length;
  return `
    <aside class="ck-rail" data-rise="5">
      <section class="rail-panel">
        <div class="rail-panel__head">
          <div class="rail-panel__eyebrow">Active stack</div>
          <div class="rail-panel__title">${escHTML(active?.name ?? 'Regimen')}</div>
          <div class="rail-panel__meta">Slot ${ordinal} · ${items} ${items === 1 ? 'item' : 'items'} · ${escHTML(relEdited(active?.editedAt ?? new Date().toISOString().slice(0, 10)))}</div>
        </div>
        <div class="rail-list" data-rail-list></div>
        <div class="rr-add">
          <label class="ck-addfield rr-field">
            <span class="ck-addfield__plus">+</span>
            <input class="ck-addfield__input" maxlength="80" placeholder="Add a product…" aria-label="Add a product" data-add-input autocomplete="off">
            <kbd class="ck-addfield__kbd" aria-hidden="true">/</kbd>
          </label>
          <div class="rr-results" data-ta-results hidden></div>
        </div>
      </section>
      <div class="rr-scan">Not in the catalog? <button class="rr-scan__link" type="button" data-scan-new>Scan your own item &rarr;</button></div>
      ${binCount > 0
        ? `<button class="rc-trigger" type="button" data-rc-open aria-haspopup="dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6"/></svg> Restore Deleted Slots &amp; Items</button>`
        : ''}
    </aside>`;
}

/**
 * The inline "Delete this save?" confirm overlaid on a slot tile. A slot delete is destructive —
 * the save is gone and its items go to the trash — so it takes a deliberate second confirm; a
 * single click on a small trash icon is too cheap for it.
 */
function buildSlotDeleteConfirm(id: string, itemCount: number): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'ck-slot__confirm';
  wrap.dataset['slotConfirm'] = '1';
  const q = document.createElement('div');
  q.className = 'ck-slot__confirm-q';
  q.textContent = 'Delete this save?';
  wrap.appendChild(q);
  if (itemCount > 0) {
    const sub = document.createElement('div');
    sub.className = 'ck-slot__confirm-sub';
    sub.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'items'} → Trash`;
    wrap.appendChild(sub);
  }
  const btns = document.createElement('div');
  btns.className = 'ck-slot__confirm-btns';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'rr-btn';
  cancel.dataset['slotConfirmCancel'] = '1';
  cancel.textContent = 'Cancel';
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'rr-btn rr-btn--danger';
  del.dataset['slotConfirmDo'] = id;
  del.textContent = 'Delete';
  btns.append(cancel, del);
  wrap.appendChild(btns);
  return wrap;
}

// ─── Mount ────────────────────────────────────────────────────────────────────

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
  let animated = false;
  let toastTimer: number | null = null;
  let recycleOpen = false;
  // The "Replace a save" step: while all four slots are full, this holds the deletedAt key of the
  // save being restored; recyclePick is the current save chosen to move to the bin.
  let recycleReplaceKey: string | null = null;
  let recyclePick: string | null = null;

  /** No-op that clears any stale max-height on the active-stack panel; the panel grows with its
   *  content and scrolls with the page. Kept so the render/resize wiring stays valid. */
  const syncStackHeight = (): void => {
    // Do NOT reintroduce a height cap read off `.ck-console`: that element measures 0 while the
    // Regimen tab is hidden, so a re-render fired from another tab (adopting an item from the
    // Scanner, or dismissing the goal veil with "I'm just browsing") collapsed this panel to 0px.
    // The panel grows with its content and scrolls with the page instead.
    const stack = container.querySelector<HTMLElement>('.ck-rail .rail-panel');
    if (stack !== null) {
      stack.style.maxHeight = '';
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

  /** Build the recycle-bin list view from the live save + item bins, then show it. */
  const populateList = (): void => {
    const host = container.querySelector<HTMLElement>('[data-rc-host]');
    if (host === null) {
      return;
    }
    const doc = loadSlots();
    const saves = doc.slotTrash ?? [];
    const removed = doc.trash;
    const total = essentialCount();

    const backdrop = document.createElement('div');
    backdrop.className = 'rc-backdrop';
    backdrop.dataset['rcBackdrop'] = '1';
    const pop = document.createElement('div');
    pop.className = 'rc-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');
    pop.setAttribute('aria-label', 'Restore deleted saves and items');
    pop.innerHTML = `
      <div class="rc-pop__head">
        <span class="rc-pop__ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6"/></svg></span>
        <span class="rc-pop__title">Restore deleted</span>
        <button class="ui-close rc-pop__x" type="button" data-rc-close aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <div class="rc-pop__sub">The ${MAX_SLOT_TRASH} most recent deleted save slots and ${MAX_ITEM_TRASH} most recent items are stored here.</div>
      <div class="rc-pop__body" data-rc-body></div>`;
    const body = pop.querySelector<HTMLElement>('[data-rc-body]');
    if (body === null) {
      return;
    }

    const savesHead = document.createElement('div');
    savesHead.className = 'rc-sec';
    savesHead.innerHTML = `Deleted saves <span class="rc-sec__cap">${saves.length} / ${MAX_SLOT_TRASH}</span>`;
    body.appendChild(savesHead);
    if (saves.length === 0) {
      const e = document.createElement('div');
      e.className = 'rc-empty';
      e.textContent = 'No deleted saves.';
      body.appendChild(e);
    }
    else {
      const gal = document.createElement('div');
      gal.className = 'rc-gal';
      for (const entry of saves) {
        const covered = coveredCountForItems(entry.slot.items, entry.slot.overrides);
        const hue = isSlotColour(entry.slot.colour ?? '') ? String(entry.slot.colour) : DEFAULT_SLOT_COLOUR;
        const n = entry.slot.items.length;
        const tile = document.createElement('div');
        tile.className = 'rc-gtile';
        tile.style.setProperty('--sc', hue);
        const top = document.createElement('div');
        top.className = 'rc-gtile__top';
        const nm = document.createElement('div');
        nm.className = 'rc-gtile__name';
        nm.textContent = entry.slot.name;
        nm.title = entry.slot.name;
        const cov = document.createElement('div');
        cov.className = 'rc-gtile__cov';
        cov.innerHTML = `${covered}<small>/${total}</small>`;
        const sub = document.createElement('div');
        sub.className = 'rc-gtile__sub';
        sub.textContent = `${n} ${n === 1 ? 'item' : 'items'}`;
        top.append(nm, cov, sub);
        const tray = document.createElement('div');
        tray.className = 'rc-gtile__tray';
        const when = document.createElement('span');
        when.className = 'rc-gtile__when';
        when.textContent = relAge(entry.deletedAt);
        const btn = document.createElement('button');
        btn.className = 'rc-btn-restore';
        btn.type = 'button';
        btn.dataset['rcRestoreSlot'] = entry.deletedAt;
        btn.textContent = 'Restore';
        tray.append(when, btn);
        tile.append(top, tray);
        gal.appendChild(tile);
      }
      body.appendChild(gal);
    }

    const divider = document.createElement('div');
    divider.className = 'rc-divider';
    body.appendChild(divider);
    const itemsHead = document.createElement('div');
    itemsHead.className = 'rc-sec';
    itemsHead.innerHTML = `Removed items <span class="rc-sec__cap">${removed.length} / ${MAX_ITEM_TRASH}</span>`;
    body.appendChild(itemsHead);
    if (removed.length === 0) {
      const e = document.createElement('div');
      e.className = 'rc-empty';
      e.textContent = 'No removed items.';
      body.appendChild(e);
    }
    else {
      for (const entry of removed) {
        const originExists = doc.slots.some(s => s.id === entry.slotId);
        const nm = typeof entry.item.label.name === 'string' ? entry.item.label.name : '?';
        const row = document.createElement('div');
        row.className = 'rc-item';
        const info = document.createElement('div');
        const nameEl = document.createElement('div');
        nameEl.className = 'rc-item__name';
        nameEl.textContent = nm;
        const meta = document.createElement('div');
        meta.className = 'rc-item__meta';
        const when = relAge(entry.removedAt);
        if (originExists) {
          meta.textContent = `from ${entry.slotName ?? 'a save'} · ${when}`;
        }
        else {
          const gone = document.createElement('span');
          gone.className = 'rc-gone';
          gone.textContent = `${entry.slotName ?? 'a save'} · deleted`;
          meta.append(gone, document.createTextNode(` · will restore to active save slot · ${when}`));
        }
        info.append(nameEl, meta);
        const btn = document.createElement('button');
        btn.className = 'rc-btn-ghost';
        btn.type = 'button';
        btn.dataset['rcRestoreItem'] = String(entry.item.id);
        btn.textContent = 'Restore';
        row.append(info, btn);
        body.appendChild(row);
      }
    }

    backdrop.appendChild(pop);
    host.replaceChildren(backdrop);
    host.hidden = false;
  };

  /**
   * The "Replace a save" step — reached when the user hits Restore on a deleted save while all
   * four slots are full. Lists the four current saves as a radio group; picking one and confirming
   * swaps it into the bin as the restored save takes its place (restoreDeletedSlot with a
   * replaceSlotId). UI-only — the swap itself is the state op's job.
   */
  const populateReplace = (key: string): void => {
    const host = container.querySelector<HTMLElement>('[data-rc-host]');
    if (host === null) {
      return;
    }
    const doc = loadSlots();
    const entry = (doc.slotTrash ?? []).find(e => e.deletedAt === key);
    // The bin or the slot count changed under us (a parallel restore/delete) — fall back to the
    // list.
    if (entry === undefined || doc.slots.length < MAX_SLOTS) {
      recycleReplaceKey = null;
      recyclePick = null;
      populateList();
      return;
    }
    // Keep the chosen save valid across rebuilds; default to the first.
    const pick = (doc.slots.find(s => s.id === recyclePick) ?? doc.slots[0])?.id;
    if (pick === undefined) {
      recycleReplaceKey = null;
      recyclePick = null;
      populateList();
      return;
    }
    recyclePick = pick;
    const total = essentialCount();
    const reviving = entry.slot.name;
    const chosen = doc.slots.find(s => s.id === pick);

    const backdrop = document.createElement('div');
    backdrop.className = 'rc-backdrop';
    backdrop.dataset['rcBackdrop'] = '1';
    const pop = document.createElement('div');
    pop.className = 'rc-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');
    pop.setAttribute('aria-label', 'Replace a save to restore this one');
    pop.innerHTML = `
      <div class="rc-pop__head">
        <button class="rc-pop__back" type="button" data-rc-back aria-label="Back to the list"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>
        <span class="rc-pop__title">Replace a save</span>
        <button class="ui-close rc-pop__x" type="button" data-rc-close aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <div class="rc-pop__body" data-rc-body></div>
      <div class="rc-pop__foot" data-rc-foot></div>`;
    const body = pop.querySelector<HTMLElement>('[data-rc-body]');
    const foot = pop.querySelector<HTMLElement>('[data-rc-foot]');
    if (body === null || foot === null) {
      return;
    }

    const note = document.createElement('div');
    note.className = 'rc-rep-note';
    const strong = document.createElement('b');
    strong.textContent = `“${reviving}”`;
    note.append(
      document.createTextNode(`Your ${MAX_SLOTS} saves are full. To bring back `),
      strong,
      document.createTextNode(', choose a current save to move to the bin — you can restore it again later.'),
    );
    body.appendChild(note);

    const head = document.createElement('div');
    head.className = 'rc-sec';
    head.innerHTML = `Your saves <span class="rc-sec__cap">${doc.slots.length} / ${MAX_SLOTS}</span>`;
    body.appendChild(head);

    const group = document.createElement('div');
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', 'Choose a save to move to the recycle bin');
    for (const s of doc.slots) {
      const selected = s.id === pick;
      const hue = isSlotColour(s.colour ?? '') ? String(s.colour) : DEFAULT_SLOT_COLOUR;
      const covered = coveredCountForItems(s.items, s.overrides);
      const n = s.items.length;
      const row = document.createElement('div');
      row.className = selected ? 'rc-rep-row is-sel' : 'rc-rep-row';
      row.style.setProperty('--sc', hue);
      row.dataset['rcPick'] = s.id;
      row.setAttribute('role', 'radio');
      row.setAttribute('aria-checked', selected ? 'true' : 'false');
      row.tabIndex = 0;
      const radio = document.createElement('span');
      radio.className = 'rc-rep-radio';
      const bar = document.createElement('span');
      bar.className = 'rc-rep-bar';
      const rbody = document.createElement('div');
      rbody.className = 'rc-rep-body';
      const nm = document.createElement('div');
      nm.className = 'rc-rep-name';
      nm.textContent = s.name;
      nm.title = s.name;
      const meta = document.createElement('div');
      meta.className = 'rc-rep-meta';
      meta.textContent = `${covered}/${total} · ${n} ${n === 1 ? 'item' : 'items'} · ${relEdited(s.editedAt)}`;
      rbody.append(nm, meta);
      const tobin = document.createElement('span');
      tobin.className = 'rc-rep-tobin';
      tobin.textContent = '→ bin';
      row.append(radio, bar, rbody, tobin);
      group.appendChild(row);
    }
    body.appendChild(group);

    const summary = document.createElement('span');
    summary.className = 'rc-rep-summary';
    summary.textContent = chosen !== undefined ? `“${chosen.name}” → bin · “${reviving}” restored` : '';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'rc-btn-cancel';
    cancel.dataset['rcBack'] = '1';
    cancel.textContent = 'Cancel';
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'rc-btn-primary';
    confirmBtn.dataset['rcReplace'] = '1';
    confirmBtn.textContent = 'Replace & restore';
    foot.append(summary, cancel, confirmBtn);

    backdrop.appendChild(pop);
    host.replaceChildren(backdrop);
    host.hidden = false;
  };

  /** Show whichever recycle view is active — the replace step, else the list. */
  const populateRecycle = (): void => {
    if (recycleReplaceKey !== null) {
      populateReplace(recycleReplaceKey);
    }
    else {
      populateList();
    }
  };

  const openRecycle = (): void => {
    recycleOpen = true;
    populateRecycle();
  };

  const closeRecycle = (): void => {
    recycleOpen = false;
    recycleReplaceKey = null;
    recyclePick = null;
    const host = container.querySelector<HTMLElement>('[data-rc-host]');
    if (host !== null) {
      host.hidden = true;
      host.replaceChildren();
    }
  };

  const render = (): void => { withScrollPreserved(container, paint); };

  const paint = (): void => {
    const goals = activeGoals();
    const field = fieldInfo(goals);
    // ★ NOT `wantedSlugs(goals).length === 0`. That filters EVERY layout tile, and omega-9
    // is flagged `essential: false` and capped at 'present' — it can never read covered, so
    // that test would never fire and the finish line would be unreachable. fieldInfo already
    // drops non-essential tiles, so its count is the true 90 and it agrees with the readout
    // the user is looking at.
    const allCovered = field.covered >= essentialCount();
    container.innerHTML = `
      <div class="ck">
        ${renderSlots()}
        <div class="coverage-grid ck-grid">
          <div class="coverage-main ck-main">
            ${renderConsole(field)}
            ${renderGoals(goals)}
            <div class="fs-block" data-foodsblock></div>
            <div class="recs ck-recs" data-rise="4">
              <div class="recs__head"><span class="recs__eyebrow">Best next moves</span><span class="ck-recs__note">Products, ranked by your goals</span></div>
              <div class="ck-recgrid" data-recgrid></div>
            </div>
          </div>
          ${renderRail()}
        </div>
        <div class="ck-toast" data-toast hidden></div>
        <div class="rc-host" data-rc-host hidden></div>
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
        pinned: starterPackIds(),
        greedy: true,
      });
      buildRecs(recGrid, recs, goals, allCovered);
    }
    const foodsHost = container.querySelector<HTMLElement>('[data-foodsblock]');
    if (foodsHost !== null) {
      // The console's foods list DELIBERATELY never exhausts. Once the wanted set is
      // closed it switches to education ranking (most nutritious first) and keeps going
      // until the catalog itself runs out — owner ruling, 2026-08-21. Seeing the catalog
      // IS the point, so `want` being empty is a MODE CHANGE here, not a stop.
      const ownedFoods = items
        .map(i => i.label['food_id'])
        .filter((v): v is string => typeof v === 'string');
      const foodRecs = rankFoodsForCoverage({
        want: wantedSlugs(goals),
        owned: ownedFoods,
        goals: goals.map(g => ({ id: g.id, members: g.members })),
        limit: FOOD_LIMIT,
        greedy: true,
        education: allCovered,
      });
      buildFoodsBlock(foodsHost, foodRecs, {
        education: allCovered,
        ownedCount: ownedFoods.length,
      });
    }
    if (recycleOpen) {
      populateRecycle();
    }
    syncStackHeight();
    if (!animated) {
      animated = true;
      animateGauge(field.covered);
    }
  };

  // A transient notice pill (styled fixed in the toast corner). Refusal-only now: the
  // slot-delete undo path was removed, so no caller passes an action — it shows a message and
  // auto-hides. If an actionable toast is ever wanted again, route it through the design-system
  // .ds-slot-toast region instead of re-growing an undo button here.
  const showToast = (message: string): void => {
    const bar = container.querySelector<HTMLElement>('[data-toast]');
    if (bar === null) {
      return;
    }
    bar.replaceChildren();
    const msg = document.createElement('span');
    msg.textContent = message;
    bar.appendChild(msg);
    bar.hidden = false;
    if (toastTimer !== null) {
      window.clearTimeout(toastTimer);
    }
    toastTimer = window.setTimeout(() => {
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
    // — recycle bin: open / close / restore —
    if (target.closest('[data-rc-open]') !== null) {
      ev.stopPropagation();
      openRecycle();
      return;
    }
    if (target.closest('[data-rc-close]') !== null || target.matches('[data-rc-backdrop]')) {
      ev.stopPropagation();
      closeRecycle();
      return;
    }
    const rcItem = target.closest<HTMLElement>('[data-rc-restore-item]');
    if (rcItem !== null) {
      ev.stopPropagation();
      const rid = Number(rcItem.dataset['rcRestoreItem']);
      if (Number.isFinite(rid)) {
        restoreDeletedItem(rid); // regimen:changed re-renders + re-populates the open popup
      }
      return;
    }
    const rcSlot = target.closest<HTMLElement>('[data-rc-restore-slot]');
    if (rcSlot !== null) {
      ev.stopPropagation();
      const key = rcSlot.dataset['rcRestoreSlot'];
      if (key !== undefined) {
        if (loadSlots().slots.length >= MAX_SLOTS) {
          // All four saves are full — open the replace step instead of refusing.
          recycleReplaceKey = key;
          recyclePick = null;
          populateRecycle();
        }
        else {
          const res = restoreDeletedSlot(key);
          if (!res.ok) {
            showToast(res.reason);
          }
        }
      }
      return;
    }
    // — replace step: back to the list (the head back-arrow or the footer Cancel) —
    if (target.closest('[data-rc-back]') !== null) {
      ev.stopPropagation();
      recycleReplaceKey = null;
      recyclePick = null;
      populateRecycle();
      return;
    }
    // — replace step: pick which current save moves to the bin —
    const rcPick = target.closest<HTMLElement>('[data-rc-pick]');
    if (rcPick !== null) {
      ev.stopPropagation();
      const pid = rcPick.dataset['rcPick'];
      if (pid !== undefined) {
        recyclePick = pid;
        populateRecycle();
      }
      return;
    }
    // — replace step: confirm the swap (move the chosen save to the bin, restore this one) —
    if (target.closest('[data-rc-replace]') !== null) {
      ev.stopPropagation();
      if (recycleReplaceKey !== null && recyclePick !== null) {
        const res = restoreDeletedSlot(recycleReplaceKey, recyclePick);
        if (res.ok) {
          // The swap landed → regimen:changed re-renders and repopulates the list.
          recycleReplaceKey = null;
          recyclePick = null;
        }
        else {
          // Rare (the chosen save vanished under us) — surface it and refresh against reality.
          showToast(res.reason);
          populateRecycle();
        }
      }
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
    // — export a save to a JSON file —
    const exportBtn = target.closest<HTMLElement>('[data-slot-export]');
    if (exportBtn !== null) {
      ev.stopPropagation();
      const sid = exportBtn.getAttribute('data-slot-export');
      if (sid !== null) {
        exportSlot(sid, showToast);
      }
      return;
    }
    // — slot delete: step 1 — show an inline confirm on the tile (never delete on first click) —
    const del = target.closest<HTMLElement>('[data-slot-delete]');
    if (del !== null) {
      ev.stopPropagation();
      const tile = del.closest<HTMLElement>('[data-slot]');
      const id = tile?.dataset['slot'];
      if (tile != null && id !== undefined && tile.querySelector('[data-slot-confirm]') === null) {
        const slot = loadSlots().slots.find(s => s.id === id);
        if (slot !== undefined) {
          tile.appendChild(buildSlotDeleteConfirm(id, slot.items.length));
        }
      }
      return;
    }
    // — slot delete: cancel — dismiss the confirm, keep the save —
    const delCancel = target.closest<HTMLElement>('[data-slot-confirm-cancel]');
    if (delCancel !== null) {
      ev.stopPropagation();
      delCancel.closest<HTMLElement>('[data-slot-confirm]')?.remove();
      return;
    }
    // — slot delete: step 2 — confirmed; the whole save is snapshotted into the recycle bin —
    const delDo = target.closest<HTMLElement>('[data-slot-confirm-do]');
    if (delDo !== null) {
      ev.stopPropagation();
      const id = delDo.dataset['slotConfirmDo'];
      if (id !== undefined) {
        const res = deleteSlot(id);
        if (!res.ok) {
          showToast(res.reason); // on success the save moves to the recycle bin (restore via the bin)
        }
      }
      return;
    }
    // — import a save from a JSON file (empty-slot affordance) —
    const importBtn = target.closest<HTMLElement>('[data-slot-import]');
    if (importBtn !== null) {
      ev.stopPropagation();
      triggerImport(showToast);
      return;
    }
    // — empty slot: a click anywhere on the tile creates a blank save; Import is caught above and returns first —
    const emptySlot = target.closest<HTMLElement>('.ck-slot--empty');
    if (emptySlot !== null) {
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
    // — add a goal: opens the same full arrival veil Coverage uses, as a goal picker —
    if (target.closest('[data-goal-add]') !== null) {
      window.dispatchEvent(new CustomEvent('wallach:open-welcome'));
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
    // — all-90-covered → the Products tab —
    // `wallach:navigate` cannot serve this: it reaches only the three WORKSPACES, and
    // Products is a tab inside the Knowledge drawer. Hence 'knowledge:open-tab'.
    const openProducts = target.closest<HTMLElement>('[data-open-products]');
    if (openProducts !== null) {
      emit('knowledge:open-tab', { tab: 'products' });
      return;
    }
    // — food add —
    const foodAdd = target.closest<HTMLElement>('[data-food-add]');
    if (foodAdd !== null) {
      addCatalogFood(foodAdd.dataset['foodAdd'] ?? '');
      return;
    }
    // — typeahead add —
    const taAdd = target.closest<HTMLElement>('[data-ta-add]');
    if (taAdd !== null) {
      const name = taAdd.dataset['taAdd'];
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
      // Never a silent delete. Swap the row to an inline Keep/Remove confirm; Remove routes
      // through saveRgRemoved, which moves the item to the restorable Trash.
      const row = rowRemove.closest<HTMLElement>('.rr-row');
      const id = rowRemove.dataset['rowRemove'];
      if (row !== null && id !== undefined) {
        const nm = row.querySelector('.rr-row__name')?.textContent ?? 'this item';
        row.className = 'rr-row rr-row--confirm';
        const q = document.createElement('div');
        q.className = 'rr-confirm__q';
        q.textContent = `Remove ${nm}? It moves to Trash — you can restore it.`;
        const btns = document.createElement('div');
        btns.className = 'rr-confirm__btns';
        const keep = document.createElement('button');
        keep.className = 'rr-btn';
        keep.type = 'button';
        keep.dataset['rowKeep'] = '1';
        keep.textContent = 'Keep';
        const rm = document.createElement('button');
        rm.className = 'rr-btn rr-btn--danger';
        rm.type = 'button';
        rm.dataset['rowConfirmRemove'] = id;
        rm.textContent = 'Remove';
        btns.append(keep, rm);
        row.replaceChildren(q, btns);
      }
      return;
    }
    if (target.closest('[data-row-keep]') !== null) {
      const list = container.querySelector<HTMLElement>('[data-rail-list]');
      if (list !== null) {
        buildRailRows(list, loadEffectiveRegimen());
      }
      return;
    }
    const rowConfirmRemove = target.closest<HTMLElement>('[data-row-confirm-remove]');
    if (rowConfirmRemove !== null) {
      const id = Number(rowConfirmRemove.dataset['rowConfirmRemove']);
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
    // — a click on the delete-confirm backdrop (not a button) must not fall through to activate —
    if (target.closest('[data-slot-confirm]') !== null) {
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
      const firstAdd = container.querySelector<HTMLElement>('[data-ta-add]');
      const name = firstAdd?.dataset['taAdd'] ?? field.value;
      if (name.trim().length > 0 && addItem(name) !== null) {
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

  const inputHandler = (ev: Event): void => {
    const it = ev.target as HTMLElement | null;
    if (it !== null && it.matches('[data-add-input]')) {
      renderTypeahead(container, (it as HTMLInputElement).value);
    }
  };

  const escHandler = (ev: KeyboardEvent): void => {
    if (ev.key === 'Escape' && recycleOpen) {
      if (recycleReplaceKey !== null) {
        // In the replace step, Escape backs out to the list first (not straight to closed).
        recycleReplaceKey = null;
        recyclePick = null;
        populateRecycle();
      }
      else {
        closeRecycle();
      }
    }
  };

  render();
  container.addEventListener('click', clickHandler);
  container.addEventListener('input', inputHandler);
  container.addEventListener('keydown', keyHandler);
  document.addEventListener('keydown', slashFocus);
  document.addEventListener('keydown', escHandler);
  window.addEventListener('resize', syncStackHeight);

  const unsubReg = on('regimen:changed', render);
  const unsubCov = on('coverage:recomputed', render);

  return {
    update: render,
    unmount: () => {
      unsubReg();
      unsubCov();
      if (toastTimer !== null) {
        window.clearTimeout(toastTimer);
      }
      container.removeEventListener('click', clickHandler);
      container.removeEventListener('input', inputHandler);
      container.removeEventListener('keydown', keyHandler);
      document.removeEventListener('keydown', slashFocus);
      document.removeEventListener('keydown', escHandler);
      window.removeEventListener('resize', syncStackHeight);
      container.innerHTML = '';
    },
  };
}
