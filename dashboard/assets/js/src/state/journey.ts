/**
 * state/journey.ts — events ledger + check-ins (private wellness log)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owns the timeline of meaningful events (scans, regimen edits, coverage jumps,
 * symptoms, milestones) and the user's check-in log. Check-ins are PRIVATE —
 * they never leave LS, never sync, never appear in any export unless the user
 * explicitly requests them.
 *
 * §31 chokepoint discipline: `logEvent` and `logCheckin` are the ONLY writers to
 * the two journey LS keys; each emits `journey:changed` so the drawer re-renders.
 * Reads go through the Zod boundary (`getValidated`).
 *
 * Cross-reference layer: `crossRefForCheckin` walks ±CROSS_REF_WINDOW_DAYS days
 * around a check-in and surfaces related events (regimen changes, scans). This is
 * what makes "started PDM → cravings dropped" patterns discoverable locally,
 * without sending anything outbound.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { emit } from '../core/events.js';
import {
  type Checkin,
  type EventKind,
  type JourneyEvent,
  CheckinsShapeSchema,
  JourneyEventsShapeSchema,
} from '../core/schemas/index.js';
import { getValidated, set } from '../core/storage.js';

export type { Checkin, EventKind, JourneyEvent };
export type EventId = string;
export type CheckinId = string;

export const JOURNEY_EVENTS_KEY = 'wallachJourneyEvents_v1';
export const JOURNEY_CHECKINS_KEY = 'wallachJourneyCheckins_v1';

/** ±N-day window for the check-in <-> event cross-reference walker. */
export const CROSS_REF_WINDOW_DAYS = 7;

/** Retention cap per key (FIFO; newest kept). Bounds LS growth over years. */
export const JOURNEY_RETENTION = 5000;

const DAY_MS = 24 * 60 * 60 * 1000;

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function byTsDesc(aTs: string, bTs: string): number {
  return aTs < bTs ? 1 : aTs > bTs ? -1 : 0;
}

// ─── Reads — Zod-validated boundary ───────────────────────────────────────

/**
 * Timeline events, newest first. Optional `sinceISO` filters to events at or
 * after that timestamp. Bad LS data → empty array (never enters typed-land).
 */
export function listEvents(sinceISO?: string): JourneyEvent[] {
  const shape = getValidated(JOURNEY_EVENTS_KEY, JourneyEventsShapeSchema);
  let events = shape?.events ?? [];
  if (sinceISO !== undefined) {
    events = events.filter(e => e.occurredAt >= sinceISO);
  }
  return [...events].sort((a, b) => byTsDesc(a.occurredAt, b.occurredAt));
}

/** Private check-ins, newest first. */
export function listCheckins(): Checkin[] {
  const shape = getValidated(JOURNEY_CHECKINS_KEY, CheckinsShapeSchema);
  return [...(shape?.checkins ?? [])].sort((a, b) => byTsDesc(a.loggedAt, b.loggedAt));
}

// ─── Write chokepoints (§31) ──────────────────────────────────────────────

/**
 * Append a timeline event. Auto-stamps eventId, prunes to JOURNEY_RETENTION,
 * emits `journey:changed`. The ONLY sanctioned writer to JOURNEY_EVENTS_KEY.
 */
export function logEvent(event: Omit<JourneyEvent, 'eventId'>): EventId {
  const eventId = genId('ev');
  const full: JourneyEvent = { ...event, eventId };
  const shape = getValidated(JOURNEY_EVENTS_KEY, JourneyEventsShapeSchema);
  const all = [...(shape?.events ?? []), full];
  const pruned = all.length > JOURNEY_RETENTION ? all.slice(all.length - JOURNEY_RETENTION) : all;
  set(JOURNEY_EVENTS_KEY, { events: pruned });
  emit('journey:changed', { reason: 'event-logged' });
  return eventId;
}

/**
 * Append a private check-in. Auto-stamps checkinId, prunes to JOURNEY_RETENTION,
 * emits `journey:changed`. The ONLY sanctioned writer to JOURNEY_CHECKINS_KEY.
 */
export function logCheckin(checkin: Omit<Checkin, 'checkinId'>): CheckinId {
  const checkinId = genId('ci');
  const full: Checkin = { ...checkin, checkinId };
  const shape = getValidated(JOURNEY_CHECKINS_KEY, CheckinsShapeSchema);
  const all = [...(shape?.checkins ?? []), full];
  const pruned = all.length > JOURNEY_RETENTION ? all.slice(all.length - JOURNEY_RETENTION) : all;
  set(JOURNEY_CHECKINS_KEY, { checkins: pruned });
  emit('journey:changed', { reason: 'checkin-logged' });
  return checkinId;
}

// ─── Cross-reference walker ───────────────────────────────────────────────

/**
 * Events within ±CROSS_REF_WINDOW_DAYS of a check-in, newest first. The local,
 * outbound-free correlation layer ("started X -> felt Y"). Returns [] if the
 * check-in timestamp can't be parsed.
 */
export function crossRefForCheckin(checkin: Checkin): JourneyEvent[] {
  const center = Date.parse(checkin.loggedAt);
  if (Number.isNaN(center)) {
    return [];
  }
  const windowMs = CROSS_REF_WINDOW_DAYS * DAY_MS;
  return listEvents().filter(e => {
    const t = Date.parse(e.occurredAt);
    return !Number.isNaN(t) && Math.abs(t - center) <= windowMs;
  });
}
