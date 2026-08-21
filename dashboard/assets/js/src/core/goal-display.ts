/**
 * core/goal-display.ts — the goal palette + the goal cap
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Shared by the Coverage field (the tile ring / chip dots), the Regimen view and the
 * arrival veil (the goal picker). It lives in core/ rather than in any one view because
 * all three need it and a views→views import would couple surfaces that should only
 * share data — the same reasoning that promoted the unit converter to core/units.ts when
 * `boundaries` forbade a state→state import.
 *
 * ★ THE PALETTE IS THE CAP, and that is deliberate, not a coincidence: there are exactly as
 * many hues as a user may pick goals. A sixth goal cannot silently reuse a hue and make two
 * goals read as one on a multi-goal tile's gradient. If MAX_GOALS ever rises, the palette
 * must grow WITH it — which is why the cap is derived from the array's length rather than
 * written twice.
 *
 * Display values only: no Wallach number lives here, and a goal is OUR curation, never
 * his claim.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** The goal hues, indexed by the user's PICK order (not by goal id). */
export const GOAL_HUES = ['#7c5cff', '#12a594', '#d6409f', '#3e63dd', '#f76b15'] as const;

/** The most goals a user may hold at once. Derived from the palette — see above. */
export const MAX_GOALS = GOAL_HUES.length;
