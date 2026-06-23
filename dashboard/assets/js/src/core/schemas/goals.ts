/**
 * core/schemas/goals.ts — active goals + Wallach milestone ledger
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Zod schemas for the Journey "Goals" + "Milestones" tabs. Goals are the user's
 * active protocols (what they're working toward); milestones are earned Wallach-
 * doctrinal checkpoints. The state layer (state/goals.ts) validates every read
 * through these; the types are inferred so there is one source of truth (mirrors
 * core/schemas/journey.ts).
 *
 * Object fields use `.optional()` (not `.default()`) so the inferred input and
 * output types match — mirrors core/schemas/journey.ts and keeps the readers'
 * return types assignable without fighting Zod's default-divergence.
 *
 * Milestones are NEVER user-claimable — a milestone's `earnedAt` is stamped by
 * the doctrine-trigger algorithm (deferred), not by a user action. A null
 * `earnedAt` means locked.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** A user-set goal — a protocol the user is working toward. */
export const GoalSchema = z.object({
  goalId: z.string().min(1),
  title: z.string().min(1).max(200),
  /** ISO date or short display string for the target ("SEP 01", "2026-09-01"). */
  targetDate: z.string().max(80),
  /** Fractional completion, 0..1 (drives the headline % + the bar fill). */
  progress: z.number().min(0).max(1),
  numerator: z.number().nonnegative(),
  denominator: z.number().positive(),
  /** Count noun for numerator/denominator ("tiles", "essentials", "days"). */
  unit: z.string().max(40).optional(),
  blockers: z.array(z.string().max(120)).max(20).optional(),
  featured: z.boolean().optional(),
});

export type Goal = z.infer<typeof GoalSchema>;

/** An earned (or locked) Wallach-doctrinal checkpoint. */
export const MilestoneSchema = z.object({
  milestoneId: z.string().min(1),
  title: z.string().min(1).max(200),
  /** Wallach doctrine this ties back to, e.g. "DOCT·02". */
  doctrineRef: z.string().max(120),
  /** ISO-8601 timestamp earned, or null when still locked. */
  earnedAt: z.string().min(1).nullable(),
  /** Short text on the badge ("35", "11", "60d"). */
  badge: z.string().max(8),
  /** Progress toward a locked milestone (optional display only). */
  numerator: z.number().nonnegative().optional(),
  denominator: z.number().positive().optional(),
});

export type Milestone = z.infer<typeof MilestoneSchema>;

/** LS storage shape for goals: { goals: Goal[] }. */
export const GoalsShapeSchema = z.object({
  goals: z.array(GoalSchema).default([]),
});

export type GoalsShape = z.infer<typeof GoalsShapeSchema>;

/** LS storage shape for milestones: { milestones: Milestone[] }. */
export const MilestonesShapeSchema = z.object({
  milestones: z.array(MilestoneSchema).default([]),
});

export type MilestonesShape = z.infer<typeof MilestonesShapeSchema>;
