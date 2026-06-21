/**
 * state/coverage.ts — periodic-table coverage state
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owns the answer to "which of the 92 essentials does the active regimen
 * cover, and how heavily." Builds a typed CoverageSnapshot keyed by the
 * canonical essential name — the single source of the live numbers consumed by
 * views/coverage.ts (hero count + per-section counts + per-tile status). The
 * layout (coverage-layout-data.json) joins to this snapshot via each tile's
 * `key` field, which equals the essential `name` here.
 *
 * DATA SOURCE (Chunk 2.1):
 *   The 92 essentials come from the embedded `essentials-targets-data` block —
 *   the Wallach targets DB, owned by Luneth. Read via getElementById +
 *   JSON.parse + Zod (same boundary discipline as views/knowledge.ts), so bad
 *   data never enters typed-land. The previous reliance on legacy globals
 *   (`window.TARGETS_DATA` / `window.computeLiveCoverage`) is removed — the page
 *   no longer loads legacy-dashboard.js, so those were undefined and the
 *   snapshot rendered an empty 0/0.
 *
 * LIVE STATUS (pending — Chunk 2.2):
 *   Per-essential covered/partial/trace/gap classification derives from the
 *   active regimen. The canonical Wallach logic (nutrient sums vs target.low
 *   with unit conversion; the PDM aggregate-vehicle rule, DOCT·02 — trace
 *   minerals covered by presence) is the load-bearing math. Until that engine
 *   lands, every essential reports `gap`: the truthful state of an empty
 *   regimen (nothing in the stack covers anything). The wiring below already
 *   recomputes on every `regimen:changed`, so status lights up with no change
 *   to the source or join once the classifier is added.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { emit, on } from '../core/events.js';
import { type Essential, EssentialsDataSchema } from '../core/schemas/index.js';
import { onChange } from '../core/storage.js';

export type TileId = string;

export type TileCategory =
  | 'foundational'
  | 'major-trace'
  | 'rare-trace'
  | 'vitamins'
  | 'aminos'
  | 'fatty-acids'
  | 'other';

export interface CoverageTile {
  tileId: TileId;
  category: TileCategory;
  symbol: string;
  name: string;
  covered: boolean;
  /** Percentage of Wallach target met (0..>1, can exceed 100% with stacking). */
  fillPercent: number;
  /** Product IDs contributing to this tile. */
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

// ─── Helpers ───────────────────────────────────────────────────────────────

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

// ─── Cache + recompute ─────────────────────────────────────────────────────

let cachedSnapshot: CoverageSnapshot | null = null;

/** Recompute coverage from the targets DB + (pending) active regimen. */
export function recompute(): CoverageSnapshot {
  const targets = readTargets();

  const tiles: CoverageTile[] = targets.map(t => ({
    tileId: buildTileId(t.name),
    category: catFromTarget(t.category),
    symbol: '',
    name: t.name,
    // Live regimen→status classification is pending (Chunk 2.2). An empty
    // regimen covers nothing, so every essential is a gap until the classifier
    // lands.
    covered: false,
    fillPercent: 0,
    coveredBy: [],
    aggregateVehicle: false,
  }));

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
