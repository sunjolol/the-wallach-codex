/**
 * core/schemas/scanner.ts — Zod schemas for scanner LS keys
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Covers the `lcRecentScans_v1` shape (scan history FIFO).
 * Verdict / label / gap-fill / alignment shapes all derive from Zod schemas
 * here so types and runtime validation share one source of truth.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** Verdict enum — the three outcomes the scan verdict engine can return. */
export const VerdictSchema = z.enum(['ADD', 'SAVE', 'REJECT']);

/**
 * A product label as captured by the OCR pipeline — or typed in by hand.
 *
 * `entry` records WHICH, because every surface downstream tells the user where the numbers
 * came from and would otherwise have to guess: the Confirm step's copy ("what we read" vs
 * "what you entered"), the Saved/Recent rail's mark, and the regimen provenance the adopt
 * path mints. ABSENT means 'scanned' — the reading every label stored before hand-entry
 * existed, so old localStorage keeps its true meaning with no migration.
 */
export const ScanLabelSchema = z.object({
  name: z.string().max(200),
  brand: z.string().max(200).optional(),
  servings: z.union([z.string(), z.number()]).optional(),
  entry: z.enum(['scanned', 'typed']).optional(),
  nutrients: z.array(z.object({
    name: z.string().max(120),
    amount: z.number().optional(),
    unit: z.string().optional(),
  })).optional(),
  ingredients: z.string().max(10000).optional(),
});

/** Per-essential gap-fill contribution from one scanned product. */
export const GapFillSchema = z.object({
  essential: z.string(),
  gapFillPct: z.number(),
  amountClaimed: z.number().optional(),
  unit: z.string().optional(),
});

/** Alignment summary (aligned / total / misaligned counts + score). */
export const AlignmentSchema = z.object({
  score: z.number(),
  aligned: z.number(),
  total: z.number(),
  misaligned: z.number(),
});

/** One entry in the scan history. */
export const HistoryEntrySchema = z.object({
  id: z.number(),
  ts: z.string(), // ISO timestamp
  /**
   * Scan-order ordinal, minted ONCE when the capture is written and never recomputed.
   *
   * It exists because a capture with no legible product name displays as 'Scanned label' —
   * and three of those in the Recent shelf are indistinguishable. The number is what tells
   * them apart, so it has to be STABLE: 'Scanned label 5' must still be 5 after the FIFO
   * evicts everything above it. A position-derived index cannot do that; a stored one can.
   *
   * Optional because history written before this field existed carries none. Such an entry
   * shows the bare 'Scanned label' it always showed, which is honest — we genuinely do not
   * know where it fell in the scan order.
   */
  seq: z.number().int().positive().optional(),
  label: ScanLabelSchema,
  verdict: VerdictSchema,
  alignment: AlignmentSchema,
  goals: z.array(z.string()),
  gapFills: z.array(GapFillSchema),
});

/** Shape stored under `lcRecentScans_v1` — FIFO scan history. */
export const HistoryShapeSchema = z.object({
  items: z.array(HistoryEntrySchema),
});

// Inferred types — single source of truth shared between runtime + static
export type Verdict = z.infer<typeof VerdictSchema>;
export type ScanLabel = z.infer<typeof ScanLabelSchema>;
export type GapFill = z.infer<typeof GapFillSchema>;
export type Alignment = z.infer<typeof AlignmentSchema>;
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;
export type HistoryShape = z.infer<typeof HistoryShapeSchema>;
