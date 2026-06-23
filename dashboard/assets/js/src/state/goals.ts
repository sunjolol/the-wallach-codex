/**
 * state/goals.ts — active goals + Wallach milestone triggers
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owns the goalsManifest (user's active protocols) and the milestone ledger.
 * Milestones are NEVER user-claimable — they're triggered by doctrine-met
 * invariants computed off coverage / regimen / scanner state. The point of
 * the source-rule discipline is that achievements are earned algorithmically,
 * not declared.
 *
 * Each milestone ties back to a Wallach doctrine ID (DOCT·NN from
 * knowledge/doctrines). When the doctrine-check function returns true for
 * the first time, the milestone fires and a `journey:changed` event
 * goes out so the timeline picks it up.
 *
 * SCAFFOLD STATUS (Round 1·A): types declared. Wired in Round 5.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type GoalId = string;
export type MilestoneId = string;

export interface Goal {
  goalId: GoalId;
  title: string;
  targetDate: string;
  progress: number; // 0..1
  numerator: number;
  denominator: number;
  blockers: string[];
  featured: boolean;
}

export interface Milestone {
  milestoneId: MilestoneId;
  title: string;
  doctrineRef: string; // e.g. "DOCT·02"
  earnedAt: string | null; // null = locked
  badge: string; // text on the badge ("35", "11", "60d", etc.)
}

export function listGoals(): Goal[] {
  throw new Error('state/goals.listGoals — pending Round 5 migration');
}

export function listMilestones(): Milestone[] {
  throw new Error('state/goals.listMilestones — pending Round 5');
}

/** Run all doctrine checks. Any that now pass and weren't passing → fire. */
export function evaluateMilestoneTriggers(): MilestoneId[] {
  throw new Error('state/goals.evaluateMilestoneTriggers — pending Round 5');
}
