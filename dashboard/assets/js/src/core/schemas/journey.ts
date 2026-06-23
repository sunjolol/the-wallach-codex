/**
 * core/schemas/journey.ts — Journey events ledger + private check-ins
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Zod schemas for the Journey surface: the timeline of meaningful events
 * (scans, regimen edits, coverage jumps, symptoms, milestones) and the user's
 * PRIVATE check-in log. The state layer (state/journey.ts) validates every read
 * through these; the types below are inferred so there is one source of truth.
 *
 * Check-ins are private by design — they live only in LS and never enter any
 * export (the Phase-3 export design honors this).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

/** Kinds of timeline event (drives the icon/accent in the Journey drawer). */
export const EventKindSchema = z.enum(['scan', 'regimen', 'coverage', 'symptom', 'milestone']);

export type EventKind = z.infer<typeof EventKindSchema>;

/** A single timeline event — auto-derived from real activity or user-logged. */
export const JourneyEventSchema = z.object({
  eventId: z.string().min(1),
  kind: EventKindSchema,
  title: z.string().min(1).max(200),
  detail: z.string().max(2000).optional(),
  /** Short delta tag, e.g. "+35 trace", "+16 essentials". */
  delta: z.string().max(80).optional(),
  /** ISO-8601 timestamp the event occurred. */
  occurredAt: z.string().min(1),
});

export type JourneyEvent = z.infer<typeof JourneyEventSchema>;

/** A private wellness check-in. Never exported. */
export const CheckinSchema = z.object({
  checkinId: z.string().min(1),
  severity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  note: z.string().max(2000),
  tags: z.array(z.string().max(40)).max(20),
  /** ISO-8601 timestamp the check-in was logged. */
  loggedAt: z.string().min(1),
});

export type Checkin = z.infer<typeof CheckinSchema>;

/** LS storage shape for events: { events: JourneyEvent[] }. */
export const JourneyEventsShapeSchema = z.object({
  events: z.array(JourneyEventSchema).default([]),
});

export type JourneyEventsShape = z.infer<typeof JourneyEventsShapeSchema>;

/** LS storage shape for check-ins: { checkins: Checkin[] }. */
export const CheckinsShapeSchema = z.object({
  checkins: z.array(CheckinSchema).default([]),
});

export type CheckinsShape = z.infer<typeof CheckinsShapeSchema>;
