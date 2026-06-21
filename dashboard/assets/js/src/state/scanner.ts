/**
 * state/scanner.ts — scan history + OCR pipeline bridge
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Bridges to the legacy scan engine (window.lcScan + Tesseract pipeline) and
 * exposes a typed read API for views/scanner.ts. The OCR + parse + verdict
 * pipeline lives in legacy-dashboard.js — re-implementing it would risk
 * doctrine drift in scoring. Round 4 wraps; future rounds can replace.
 *
 * LS keys:
 *   'lcRecentScans_v1' — scan history (FIFO list, dedup by label.name)
 *
 * §00 Zod boundary: getHistory() reads through `getValidated` against
 * HistoryShapeSchema; bad LS data → empty array, never enters typed-land.
 *
 * Legacy verdicts (preserved verbatim):
 *   'ADD'    — strong fit, recommend adopting into regimen
 *   'SAVE'   — worth considering, with caveats; goes to wishlist
 *   'REJECT' — has flags; don't adopt
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { emit } from '../core/events.js';
import {
  type Alignment,
  type GapFill,
  type HistoryEntry,
  HistoryShapeSchema,
  type ScanLabel,
  type Verdict,
} from '../core/schemas/index.js';
import { getValidated } from '../core/storage.js';

export const RECENT_SCANS_KEY = 'lcRecentScans_v1';

// ─── Re-export inferred types so callers can import from @state/scanner ───
export type { Alignment, GapFill, HistoryEntry, ScanLabel, Verdict };

// ─── Runtime-only types (not stored in LS, no Zod needed) ─────────────────

export interface AntiFlag {
  category: string;
  severity: 'hard' | 'serious' | 'softened' | 'mild';
  term?: string;
}

export interface ScanResult {
  label: ScanLabel;
  alignment: Alignment;
  gapFills: GapFill[];
  goals: string[];
  anti: AntiFlag[];
  conflicts?: unknown;
  verdict: Verdict;
  reasonsFor: Array<{ label: string; items?: string[] }>;
  reasonsAgainst: Array<{ label: string; items?: string[] }>;
  sparseNutrients?: boolean;
  sparseIngredients?: boolean;
}

// ─── Read API — Zod-validated boundary ────────────────────────────────────

export function getHistory(): HistoryEntry[] {
  return getValidated(RECENT_SCANS_KEY, HistoryShapeSchema)?.items ?? [];
}

/** Last scan, if any — useful for "show the most recent verdict" view. */
export function getLastScan(): HistoryEntry | null {
  return getHistory()[0] ?? null;
}

// ─── Scan bridge ───────────────────────────────────────────────────────────

interface LegacyWindow extends Window {
  lcScan?: (label: ScanLabel, opts?: { logToRecent?: boolean }) => ScanResult;
}

/**
 * Run a scan through the legacy engine. Always logs to history. Emits
 * `scanner:scan-complete` so subscribers re-render.
 */
export function runScan(label: ScanLabel): ScanResult | null {
  const w = window as LegacyWindow;
  if (typeof w.lcScan !== 'function') {
    console.warn('[state/scanner] window.lcScan not available — legacy not loaded?');
    return null;
  }
  try {
    const result = w.lcScan(label, { logToRecent: true });
    emit('scanner:scan-complete', {
      captureId: String(Date.now()),
      verdict: mapVerdict(result.verdict),
    });
    return result;
  }
  catch (e) {
    console.warn('[state/scanner] legacy lcScan threw:', e);
    return null;
  }
}

/** Map legacy ADD/SAVE/REJECT → the simpler aligns/partial/out event payload. */
function mapVerdict(v: Verdict): 'aligns' | 'partial' | 'out' {
  if (v === 'ADD') {
    return 'aligns';
  }
  if (v === 'SAVE') {
    return 'partial';
  }
  return 'out';
}
