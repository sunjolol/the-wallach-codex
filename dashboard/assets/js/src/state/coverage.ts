/**
 * state/coverage.ts — periodic-table coverage state + live recompute
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owns the answer to "which of the 92 essentials does the active regimen
 * cover, and how heavily." Pure derivation from regimen state + Eden product
 * vault data. Subscribes to `regimen:changed` and recomputes; emits
 * `coverage:recomputed` so views update.
 *
 * Wallach aggregate-vehicle rule (DOCT·02): when a regimen item is a plant-
 * derived mineral aggregate, every trace mineral in the aggregate is marked
 * covered by presence, not quantity.
 *
 * ROUND 2 — STRANGLER-FIG WRAPPING:
 *   The coverage math (unit conversions, dose scaling, target lookups, the
 *   PDM aggregate-vehicle rule) lives in legacy-dashboard.js as
 *   `computeLiveCoverage()`. This module CALLS that function and shapes the
 *   result into a typed CoverageSnapshot. The math itself stays load-bearing-
 *   correct — we don't rewrite, we wrap.
 *
 *   Later rounds (when regimen state also migrates and we have full type
 *   safety end-to-end) can replace the legacy call with a native impl.
 *   Until then: shape the legacy data; preserve every Wallach behavior.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { emit, on } from '../core/events.js';
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

// ─── Legacy bridge (the strangler-fig wrap) ────────────────────────────────

/*
 * Shape of what the legacy `window.computeLiveCoverage()` returns. We don't
 * fully control this shape, so we type it defensively. Legacy returns a Map
 * of essential-key → contribution data; we adapt.
 */
interface LegacyCoverageEntry {
  essential?: { name?: string; symbol?: string; category?: string; tileId?: string };
  fillPercent?: number;
  covered?: boolean;
  sources?: Array<{ productId?: string; productName?: string; viaAggregate?: boolean }>;
}

interface LegacyWindow extends Window {
  computeLiveCoverage?: () => Map<string, LegacyCoverageEntry> | Record<string, LegacyCoverageEntry>;
  TARGETS_DATA?: Array<{ name: string; symbol?: string; category?: string; tileId?: string }>;
}

// Normalize a legacy category string to our TileCategory enum.
function normCategory(raw: string | undefined): TileCategory {
  const c = (raw ?? '').toLowerCase();
  if (c === 'foundational' || c === 'macro' || c === 'major') {
    return 'foundational';
  }
  if (c === 'major-trace' || c === 'major_trace' || c === 'majortrace') {
    return 'major-trace';
  }
  if (c === 'rare-trace' || c === 'rare_trace' || c === 'raretrace' || c === 'trace') {
    return 'rare-trace';
  }
  if (c === 'vitamin' || c === 'vitamins') {
    return 'vitamins';
  }
  if (c === 'amino' || c === 'aminos' || c === 'amino_acid') {
    return 'aminos';
  }
  if (c === 'fatty-acid' || c === 'fatty_acid' || c === 'fattyacid' || c === 'fatty-acids' || c === 'omega') {
    return 'fatty-acids';
  }
  return 'other';
}

function buildTileId(symbol: string | undefined, name: string): TileId {
  if (symbol !== undefined && symbol.length > 0) {
    return `tile_${symbol.toLowerCase().replace(/\W+/g, '_')}`;
  }
  return `tile_${name.toLowerCase().replace(/\W+/g, '_')}`;
}

// ─── Cache + recompute ─────────────────────────────────────────────────────

let cachedSnapshot: CoverageSnapshot | null = null;

/** Recompute coverage from current regimen + Eden vault data. */
export function recompute(): CoverageSnapshot {
  const w = window as LegacyWindow;
  const tiles: CoverageTile[] = [];
  const seenIds = new Set<TileId>();

  // 1. Read all 92 targets so empty/unmatched tiles still render.
  const targets = w.TARGETS_DATA ?? [];

  // 2. Pull live coverage data from the legacy bridge.
  let legacyData: Record<string, LegacyCoverageEntry> = {};
  if (typeof w.computeLiveCoverage === 'function') {
    try {
      const result = w.computeLiveCoverage();
      if (result instanceof Map) {
        legacyData = Object.fromEntries(result.entries());
      }
      else {
        legacyData = result;
      }
    }
    catch (e) {
      console.warn('[state/coverage] legacy computeLiveCoverage threw:', e);
    }
  }

  // 3. Build tiles from targets, joining legacy coverage data.
  for (const t of targets) {
    const tileId = buildTileId(t.symbol, t.name);
    seenIds.add(tileId);
    const legacy: LegacyCoverageEntry = legacyData[t.name.toLowerCase()] ?? legacyData[tileId] ?? {};
    const sources = legacy.sources ?? [];
    tiles.push({
      tileId,
      category: normCategory(t.category),
      symbol: t.symbol ?? '',
      name: t.name,
      covered: Boolean(legacy.covered) || sources.length > 0,
      fillPercent: typeof legacy.fillPercent === 'number' ? legacy.fillPercent : 0,
      coveredBy: sources.map(s => s.productId ?? s.productName ?? '').filter(Boolean),
      aggregateVehicle: sources.some(s => s.viaAggregate === true),
    });
  }

  // 4. Tally by category.
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
