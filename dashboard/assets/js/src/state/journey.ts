/**
 * state/journey.ts — events ledger + check-ins (private wellness log)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owns the timeline of meaningful events (scans, regimen edits, coverage
 * jumps, milestones, symptoms) and the user's check-in log. Check-ins are
 * PRIVATE — they never leave LS, never sync, never appear in any export
 * unless the user explicitly requests them.
 *
 * Cross-reference layer: when displaying a check-in, the timeline walker
 * looks for related events within ±7 days (regimen changes, scans) and
 * surfaces them as the "CROSS-REF" line in the UI. This is what makes
 * "started PDM → cravings dropped" patterns discoverable without sending
 * anything outbound.
 *
 * SCAFFOLD STATUS (Round 1·A): types declared. Wired in Round 5.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type EventId = string;
export type CheckinId = string;

export type EventKind = 'scan' | 'regimen' | 'coverage' | 'symptom' | 'milestone';

export interface JourneyEvent {
  eventId: EventId;
  kind: EventKind;
  title: string;
  detail?: string;
  delta?: string; // e.g. "+35 trace", "+16 essentials"
  occurredAt: string;
}

export interface Checkin {
  checkinId: CheckinId;
  severity: 1 | 2 | 3 | 4 | 5;
  note: string;
  tags: string[];
  loggedAt: string;
}

export function logEvent(_event: Omit<JourneyEvent, 'eventId'>): EventId {
  throw new Error('state/journey.logEvent — pending Round 5 migration');
}

export function listEvents(_sinceISO?: string): JourneyEvent[] {
  throw new Error('state/journey.listEvents — pending Round 5');
}

export function logCheckin(_checkin: Omit<Checkin, 'checkinId'>): CheckinId {
  throw new Error('state/journey.logCheckin — pending Round 5');
}

export function listCheckins(): Checkin[] {
  throw new Error('state/journey.listCheckins — pending Round 5');
}
