/**
 * state/goals.ts — active goals + Wallach milestone ledger (reads)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owns the user's active goals (goalsManifest) and the milestone ledger.
 * Milestones are NEVER user-claimable — they're stamped by a doctrine-trigger
 * algorithm (evaluateMilestoneTriggers, deferred) computed off coverage /
 * regimen / scanner state. The source-rule point: achievements are earned
 * algorithmically, not declared.
 *
 * J2 status: the READ side is live — listGoals / listMilestones are Zod-
 * validated LS readers (mirror state/journey.ts). Bad LS data → empty array,
 * never enters typed-land. The write side (goal create/edit chokepoints) and
 * the milestone trigger algorithm land in a later Journey chunk.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  type Goal,
  GoalsShapeSchema,
  type Milestone,
  MilestonesShapeSchema,
} from '../core/schemas/index.js';
import { getValidated } from '../core/storage.js';

export type { Goal, Milestone };
export type GoalId = string;
export type MilestoneId = string;

export const GOALS_KEY = 'wallachGoals_v1';
export const MILESTONES_KEY = 'wallachMilestones_v1';

/**
 * Active goals. Featured first, then highest progress first. Bad LS data →
 * empty array (never enters typed-land).
 */
export function listGoals(): Goal[] {
  const shape = getValidated(GOALS_KEY, GoalsShapeSchema);
  const goals = shape?.goals ?? [];
  return [...goals].sort((a, b) => {
    const af = a.featured ?? false;
    const bf = b.featured ?? false;
    if (af !== bf) {
      return af ? -1 : 1;
    }
    return b.progress - a.progress;
  });
}

/**
 * Milestone ledger. Earned (newest first) before locked. Bad LS data → empty.
 */
export function listMilestones(): Milestone[] {
  const shape = getValidated(MILESTONES_KEY, MilestonesShapeSchema);
  const milestones = shape?.milestones ?? [];
  return [...milestones].sort((a, b) => {
    const aLocked = a.earnedAt === null;
    const bLocked = b.earnedAt === null;
    if (aLocked !== bLocked) {
      return aLocked ? 1 : -1;
    }
    if (a.earnedAt !== null && b.earnedAt !== null) {
      return a.earnedAt < b.earnedAt ? 1 : a.earnedAt > b.earnedAt ? -1 : 0;
    }
    return 0;
  });
}

/**
 * Run all doctrine checks; fire any milestone that now passes and wasn't earned
 * before. Deferred — the doctrine-trigger algorithm (coverage/regimen checks +
 * the §31 write chokepoint) lands in a later Journey chunk.
 */
export function evaluateMilestoneTriggers(): MilestoneId[] {
  throw new Error('state/goals.evaluateMilestoneTriggers — deferred to a later Journey chunk');
}
