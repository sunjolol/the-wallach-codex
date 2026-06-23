/**
 * core/events.ts — typed pub/sub for the §31 cross-surface state sync system
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The mechanism behind the chokepoint cascade. When state/regimen.ts mutates
 * regimen LS, it fires a `regimen:changed` event here. Every view that cares
 * subscribes and re-renders.
 *
 * Why this matters architecturally:
 *   Before: `window.triggerRegimenRerender()` called from inside chokepoints,
 *           with comments reminding the author to remember to call it.
 *   After:  `emit('regimen:changed', payload)` is the chokepoint's last line.
 *           Subscribers register their interest declaratively.
 *
 * Cross-tab sync (Round 150): core/storage subscribes to native `storage`
 * events and re-fires the corresponding typed event so views in tab B see a
 * write from tab A with zero extra plumbing.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** All event names the system can fire. Add here, then add the payload below. */
export type EventName =
  | 'regimen:changed'
  | 'coverage:recomputed'
  | 'scanner:scan-complete'
  | 'scanner:scan-cleared'
  | 'goals:updated'
  | 'journey:changed'
  | 'eden:hash-mismatch'
  | 'storage:pressure-warn'
  | 'rail:navigate'
  | 'log:entry-added';

/** Payload shape per event name. Add a case here when adding an event. */
export interface EventPayloads {
  'regimen:changed': { slotId: string; reason: 'dose-edit' | 'add' | 'remove' | 'restore' };
  'coverage:recomputed': { coveredCount: number; totalCount: number };
  'scanner:scan-complete': { captureId: string; verdict: 'aligns' | 'partial' | 'out' };
  'scanner:scan-cleared': { captureId: string };
  'goals:updated': { goalId: string };
  'journey:changed': { reason: 'event-logged' | 'checkin-logged' };
  'eden:hash-mismatch': { file: string; expected: string; actual: string };
  'storage:pressure-warn': { bytesUsed: number; bytesLimit: number };
  'rail:navigate': { target: 'coverage' | 'regimen' | 'scanner' | 'knowledge' | 'journey' };
  'log:entry-added': { id: string; kind: string };
}

export type EventHandler<E extends EventName> = (payload: EventPayloads[E]) => void;

/*
 * Type-erased handler used for internal storage. The Map's invariant —
 * "key === event === handler's payload type" — is preserved by the casts
 * at the API boundaries (ensureSet / emit). This is the standard
 * typed-event-bus pattern in TS.
 */
type AnyHandler = (payload: never) => void;

const subscribers = new Map<EventName, Set<AnyHandler>>();

function ensureSet<E extends EventName>(event: E): Set<EventHandler<E>> {
  let set = subscribers.get(event);
  if (!set) {
    set = new Set<AnyHandler>();
    subscribers.set(event, set);
  }
  return set as unknown as Set<EventHandler<E>>;
}

/**
 * Subscribe to a typed event. Returns an unsubscribe function.
 * Views typically register in their mount() and unsubscribe in unmount().
 */
export function on<E extends EventName>(event: E, handler: EventHandler<E>): () => void {
  const set = ensureSet(event);
  set.add(handler);
  return () => {
    set.delete(handler);
  };
}

/** Fire an event to all subscribers. Handlers that throw are isolated. */
export function emit<E extends EventName>(event: E, payload: EventPayloads[E]): void {
  const set = subscribers.get(event);
  if (!set) {
    return;
  }
  for (const handler of set) {
    try {
      (handler as unknown as EventHandler<E>)(payload);
    }
    catch (e) {
      console.warn(`[events] ${event} handler error:`, e);
    }
  }
}

/** Count of subscribers for an event (useful for debugging + tests). */
export function subscriberCount(event: EventName): number {
  return subscribers.get(event)?.size ?? 0;
}
