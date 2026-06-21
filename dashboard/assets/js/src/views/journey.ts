/**
 * views/journey.ts — Journey drawer renderer (overlay)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Visual contract: drawer-journey-v3-PROPOSAL.html (600px wide overlay).
 * 4 tabs: Timeline / Goals / Check-ins / Milestones.
 *
 * Reads from state/journey.ts + state/goals.ts. The LOG EVENT footer action
 * is the one mutation hook — it opens a small inline form that calls
 * state/journey.logEvent() / logCheckin().
 *
 * SCAFFOLD STATUS (Round 1·A): pending Round 5.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface DrawerHandle {
  open: () => void;
  close: () => void;
  toggleExpanded: () => void;
  isOpen: () => boolean;
}

export function mount(_container: HTMLElement): DrawerHandle {
  throw new Error('views/journey.mount — pending Round 5 migration');
}
