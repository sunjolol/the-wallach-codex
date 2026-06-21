/**
 * state/coverage.ts — periodic-table coverage state + live classifier
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owns the answer to "which of the 92 essentials does the active regimen
 * cover, and how heavily." Builds a typed CoverageSnapshot keyed by the
 * canonical essential name — the single source of the live numbers consumed by
 * views/coverage.ts (hero count + per-section counts + per-tile status). The
 * layout (coverage-layout-data.json) joins to this snapshot via each tile's
 * `key` field, which equals the essential `name` here.
 *
 * DATA SOURCE:
 *   The 92 essentials come from the embedded `essentials-targets-data` block —
 *   the Wallach targets DB, owned by Luneth. Read via getElementById +
 *   JSON.parse + Zod (same boundary discipline as views/knowledge.ts).
 *
 * LIVE CLASSIFIER (Chunk 2.2 — native reimpl of the legacy engine):
 *   A faithful port of legacy-dashboard.js `computeLiveCoverage()` +
 *   `classifyLive()` + `toMg()` + `matchToEssential()`. The page no longer
 *   loads legacy-dashboard.js, so the math lives here now — but every NUMBER
 *   still comes from Luneth's data (target.low/unit from the targets DB; nutrient
 *   amounts from regimen item labels). Nothing is invented; §00.A holds.
 *
 *   Pipeline: collect the active regimen (the migrated §31 state — committed +
 *   manual items, minus removed, with override scaling) → sum each item's label
 *   nutrients into per-essential mg/IU totals (unit-convert + scale, match each
 *   nutrient name to an essential) → classify each essential against its Wallach
 *   target. The PDM aggregate-vehicle rule (DOCT·02): a trace_pdm mineral is
 *   `trace` (covered by presence) iff a plant-derived-mineral vehicle is in the
 *   stack — binary, not graduated.
 *
 *   Faithful to legacy thresholds (numeric: ok ≥ 0.95·low, warn ≥ 0.30·low,
 *   else gap) with ONE deliberate deviation: a numeric target with low ≤ 0 and
 *   zero delivery reports '' (pending) rather than legacy's 'ok' — legacy would
 *   mark it covered with nothing delivered, an §00.A overclaim.
 *
 *   Status buckets map legacy → view: ok→covered (numeric) / trace (trace_pdm),
 *   warn→partial, gap→gap, diet→covered, mute→'' (pending, rendered grey).
 *   Empty regimen ⇒ numeric targets are `gap`, the rest pending — the truthful
 *   bare state. recompute() re-runs on every `regimen:changed`.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { emit, on } from '../core/events.js';
import {
  type CoverageTarget,
  CoverageTargetSchema,
  type Essential,
  EssentialsDataSchema,
  RegimenNutrientSchema,
} from '../core/schemas/index.js';
import { onChange } from '../core/storage.js';
import {
  loadRegimen,
  loadRgManual,
  loadRgOverrides,
  loadRgRemoved,
  type OverridesMap,
  type RegimenItem,
} from './regimen.js';

export type TileId = string;

export type TileCategory =
  | 'foundational'
  | 'major-trace'
  | 'rare-trace'
  | 'vitamins'
  | 'aminos'
  | 'fatty-acids'
  | 'other';

/** Live status bucket for one essential. '' = pending / no target (rendered grey). */
export type CoverageStatus = 'covered' | 'partial' | 'trace' | 'gap' | '';

export interface CoverageTile {
  tileId: TileId;
  category: TileCategory;
  symbol: string;
  name: string;
  /** Authoritative live bucket — views render this directly (no re-derivation). */
  status: CoverageStatus;
  /** Convenience flag: status is `covered` or `trace` (covered-by-presence). */
  covered: boolean;
  /** Ratio of Wallach target met (0..>1, can exceed 1 with stacking; 1 for trace/dietary). */
  fillPercent: number;
  /** Regimen item display names contributing to this tile. */
  coveredBy: string[];
  /** Whether this tile is closed via the PDM aggregate-vehicle rule. */
  aggregateVehicle: boolean;
}

export interface CoverageSnapshot {
  tiles: CoverageTile[];
  coveredCount: number;
  totalCount: number;
  computedAt: string;
  /** Counts by category for the workspace section heads. */
  byCategory: { [K in TileCategory]?: { total: number; covered: number } };
}

// ─── Category + id helpers ─────────────────────────────────────────────────

/**
 * Map the targets-DB coarse category to our TileCategory. Mineral subsection
 * granularity (foundational / major-trace / rare-trace) lives in the layout,
 * not the targets DB, so minerals collapse to `other` here — `byCategory` is a
 * tally aid, not a render source (views read the layout for section grouping).
 */
function catFromTarget(raw: string): TileCategory {
  switch (raw) {
    case 'vitamins':
      return 'vitamins';
    case 'amino_acids':
      return 'aminos';
    case 'fatty_acids':
      return 'fatty-acids';
    default:
      return 'other';
  }
}

function buildTileId(name: string): TileId {
  return `tile_${name.toLowerCase().replace(/\W+/g, '_')}`;
}

// ─── Targets DB read (Zod-validated at the boundary) ───────────────────────

/** Read + Zod-validate the embedded Wallach targets DB (`{ essentials: [...] }`). */
function readTargets(): Essential[] {
  const el = typeof document === 'undefined'
    ? null
    : document.getElementById('essentials-targets-data');
  if (el === null) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(el.textContent ?? '{}');
  }
  catch {
    return [];
  }
  const result = EssentialsDataSchema.safeParse(parsed);
  return result.success ? result.data.essentials : [];
}

// ─── Unit conversion + nutrient→essential matching (legacy port) ───────────

/** Strip parentheticals, lowercase, trim — the legacy nutrient/target normalizer. */
function cleanName(s: string): string {
  return s.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
}

/** Convert an amount to a common unit. Faithful legacy `toMg`: IU stays IU. */
function toMg(value: number, unit: string | undefined): { v: number; u: 'mg' | 'iu' } {
  const u = (unit ?? 'mg').toLowerCase();
  if (u === 'g') {
    return { v: value * 1000, u: 'mg' };
  }
  if (u === 'mcg' || u === 'μg' || u === 'µg') {
    return { v: value / 1000, u: 'mg' };
  }
  if (u === 'iu') {
    return { v: value, u: 'iu' };
  }
  return { v: value, u: 'mg' };
}

function buildByName(targets: Essential[]): Map<string, Essential> {
  const m = new Map<string, Essential>();
  for (const t of targets) {
    m.set(cleanName(t.name), t);
  }
  return m;
}

/**
 * Match a nutrient label name to an essential. Faithful port of legacy
 * `matchToEssential`: direct cleaned-name hit, then vitamin shortform (3 tiers),
 * omega digit match, folate/folic.
 */
function matchToEssential(
  nutrientName: string,
  targets: Essential[],
  byName: Map<string, Essential>,
): Essential | null {
  if (nutrientName === '') {
    return null;
  }
  const nn = cleanName(nutrientName);
  const direct = byName.get(nn);
  if (direct !== undefined) {
    return direct;
  }
  for (const t of targets) {
    const tn = cleanName(t.name);
    if (tn === nn) {
      return t;
    }
    if (nn.startsWith('vitamin ') && tn.startsWith('vitamin ')) {
      const nv = nn.replace('vitamin ', '').split(/[\s(+]/)[0] ?? '';
      const tv = tn.replace('vitamin ', '').split(/[\s(+]/)[0] ?? '';
      if (nv !== '' && nv === tv) {
        return t;
      }
      const nvBase = nv.replace(/\d+$/, '');
      const tvBase = tv.replace(/\d+$/, '');
      // Tier 2: bare ↔ digit-suffix (XOR) — "vitamin d" ↔ "vitamin d2".
      if (nvBase !== '' && nvBase === tvBase && (nv === nvBase) !== (tv === tvBase)) {
        return t;
      }
      // Tier 3: both have digits — word-bounded token ("d3" in "d2 + d3").
      if (nv !== nvBase && tv !== tvBase) {
        const esc = nv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(`\\b${esc}\\b`).test(tn)) {
          return t;
        }
      }
    }
    if (nn.includes('omega') && tn.includes('omega')) {
      const nm = (nn.match(/omega[-\s]?(\d)/) ?? [])[1];
      const tm = (tn.match(/omega[-\s]?(\d)/) ?? [])[1];
      if (nm !== undefined && tm !== undefined && nm === tm) {
        return t;
      }
    }
    if ((nn.includes('folate') || nn.includes('folic')) && tn.includes('folic')) {
      return t;
    }
  }
  return null;
}

// ─── Regimen delivery accumulation ─────────────────────────────────────────

interface Delivery {
  totalMg: number;
  totalIU: number;
  /** Display names of regimen items contributing (for hasSrc + PDM detection). */
  sources: string[];
}

const EMPTY_DELIVERY: Delivery = { totalMg: 0, totalIU: 0, sources: [] };

/** Active stack: committed + manual items, deduped by id, minus removed ids. */
function collectRegimenItems(): RegimenItem[] {
  const removed = loadRgRemoved();
  const byId = new Map<number, RegimenItem>();
  for (const it of [...loadRegimen().items, ...loadRgManual()]) {
    if (removed.has(it.id)) {
      continue;
    }
    byId.set(it.id, it);
  }
  return [...byId.values()];
}

/** Resolve an item's serving/dose scaling factor (override → item → label.servings → 1). */
function readScale(item: RegimenItem, overrides: OverridesMap): number {
  const ov = overrides[String(item.id)];
  const candidates: unknown[] = [
    ov?.['scaling_factor'],
    (item as Record<string, unknown>)['scaling_factor'],
    (item.label as Record<string, unknown>)['servings'],
  ];
  for (const c of candidates) {
    const n = typeof c === 'number' ? c : typeof c === 'string' ? Number.parseFloat(c) : Number.NaN;
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return 1;
}

/** Sum every regimen item's label nutrients into per-essential mg/IU totals. */
function accumulate(
  items: RegimenItem[],
  overrides: OverridesMap,
  targets: Essential[],
  byName: Map<string, Essential>,
): Map<string, Delivery> {
  const out = new Map<string, Delivery>();
  for (const t of targets) {
    out.set(t.name, { totalMg: 0, totalIU: 0, sources: [] });
  }
  for (const item of items) {
    const scale = readScale(item, overrides);
    const displayName = typeof item.label.name === 'string' && item.label.name !== ''
      ? item.label.name
      : 'Unknown';
    const rawNutrients = Array.isArray(item.label.nutrients) ? item.label.nutrients : [];
    for (const raw of rawNutrients) {
      const parsed = RegimenNutrientSchema.safeParse(raw);
      if (!parsed.success) {
        continue;
      }
      const n = parsed.data;
      if (!(n.amount > 0)) {
        continue;
      }
      const matched = matchToEssential(n.name, targets, byName);
      if (matched === null) {
        continue;
      }
      const d = out.get(matched.name);
      if (d === undefined) {
        continue;
      }
      const conv = toMg(n.amount * scale, n.unit);
      if (conv.u === 'iu') {
        d.totalIU += conv.v;
      }
      else {
        d.totalMg += conv.v;
      }
      if (!d.sources.includes(displayName)) {
        d.sources.push(displayName);
      }
    }
  }
  return out;
}

// ─── Classification (legacy classifyLive port) ─────────────────────────────

const PDM_TRACE = /\bbtt\b|tangerine|plant.derived|humic|colloidal|utt/;
const PDM_COLLECTIVE = /\bbtt\b|tangerine|utt|amino/;

function numericStatus(target: CoverageTarget, d: Delivery): CoverageStatus {
  const isIU = (target.unit ?? '').toLowerCase() === 'iu';
  const current = isIU ? d.totalIU : d.totalMg;
  const lowRaw = target.low ?? 0;
  const low = isIU ? lowRaw : toMg(lowRaw, target.unit).v;
  if (low <= 0) {
    // Deliberate §00.A deviation from legacy (which returned 'ok'): no defined
    // floor + nothing delivered ⇒ pending, never a free "covered".
    return current > 0 ? 'covered' : '';
  }
  if (current >= low * 0.95) {
    return 'covered';
  }
  if (current >= low * 0.30) {
    return 'partial';
  }
  return 'gap';
}

function classify(target: CoverageTarget | null, d: Delivery): CoverageStatus {
  const hasSrc = d.sources.length > 0;
  const kind = target?.kind;
  if (target === null || kind === undefined || kind === 'unspecified') {
    return hasSrc ? 'covered' : '';
  }
  if (kind === 'dietary') {
    return hasSrc ? 'covered' : '';
  }
  if (kind === 'trace_pdm' || kind === 'wallach_collective') {
    const stack = d.sources.join(' | ').toLowerCase();
    const re = kind === 'trace_pdm' ? PDM_TRACE : PDM_COLLECTIVE;
    return re.test(stack) ? 'trace' : '';
  }
  if (kind === 'dietary_with_clinical_lever') {
    if (target.low !== undefined && target.low > 0) {
      return numericStatus(target, d);
    }
    return hasSrc ? 'covered' : '';
  }
  // Numeric: hbsp · wallach · wallach_clinical · any kind carrying low/unit.
  return numericStatus(target, d);
}

function deliveryRatio(target: CoverageTarget | null, status: CoverageStatus, d: Delivery): number {
  if (target === null) {
    return status === 'covered' || status === 'trace' ? 1 : 0;
  }
  const isIU = (target.unit ?? '').toLowerCase() === 'iu';
  const current = isIU ? d.totalIU : d.totalMg;
  const lowRaw = target.low ?? 0;
  const low = isIU ? lowRaw : toMg(lowRaw, target.unit).v;
  if (low > 0) {
    return current / low;
  }
  return status === 'covered' || status === 'trace' ? 1 : 0;
}

// ─── Cache + recompute ─────────────────────────────────────────────────────

let cachedSnapshot: CoverageSnapshot | null = null;

/** Recompute coverage from the targets DB + the active regimen. */
export function recompute(): CoverageSnapshot {
  const targets = readTargets();
  const byName = buildByName(targets);
  const overrides = loadRgOverrides();
  const delivery = accumulate(collectRegimenItems(), overrides, targets, byName);

  const tiles: CoverageTile[] = targets.map((entry) => {
    const target = CoverageTargetSchema.safeParse(entry.target);
    const t = target.success ? target.data : null;
    const d = delivery.get(entry.name) ?? EMPTY_DELIVERY;
    const status = classify(t, d);
    return {
      tileId: buildTileId(entry.name),
      category: catFromTarget(entry.category),
      symbol: '',
      name: entry.name,
      status,
      covered: status === 'covered' || status === 'trace',
      fillPercent: deliveryRatio(t, status, d),
      coveredBy: d.sources,
      aggregateVehicle: status === 'trace',
    };
  });

  // Tally by category.
  const byCategory: CoverageSnapshot['byCategory'] = {};
  for (const tile of tiles) {
    const bucket = byCategory[tile.category] ?? { total: 0, covered: 0 };
    bucket.total += 1;
    if (tile.covered) {
      bucket.covered += 1;
    }
    byCategory[tile.category] = bucket;
  }

  const coveredCount = tiles.filter(t => t.covered).length;
  cachedSnapshot = {
    tiles,
    coveredCount,
    totalCount: tiles.length,
    computedAt: new Date().toISOString(),
    byCategory,
  };

  emit('coverage:recomputed', { coveredCount, totalCount: tiles.length });
  return cachedSnapshot;
}

/** Last cached snapshot. Returns null if recompute() hasn't run yet. */
export function getSnapshot(): CoverageSnapshot | null {
  return cachedSnapshot;
}

/** Get a snapshot, computing if needed. Useful for first-render. */
export function getOrCompute(): CoverageSnapshot {
  return cachedSnapshot ?? recompute();
}

// ─── Wire to regimen changes ───────────────────────────────────────────────

let wireInstalled = false;

/**
 * Install the recompute trigger: regimen changes → coverage recomputes.
 * Idempotent — main.ts calls this once at boot.
 */
export function installRecomputeTrigger(): void {
  if (wireInstalled) {
    return;
  }
  wireInstalled = true;

  on('regimen:changed', () => recompute());

  // Also listen to native storage events for cross-tab sync of regimen LS keys.
  onChange((key) => {
    if (key.startsWith('rgSlot') || key === 'lcRegimen_v1') {
      recompute();
    }
  });

  /*
   * Round 150 §31 hook for legacy code: when legacy fires its
   * window.triggerRegimenRerender, also trigger our recompute. Backward
   * compatibility with the legacy event-cascade discipline.
   */
  const w = window as Window & { triggerRegimenRerender?: () => void };
  const original = w.triggerRegimenRerender;
  if (typeof original === 'function') {
    w.triggerRegimenRerender = () => {
      try {
        original();
      }
      finally {
        recompute();
      }
    };
  }
}
