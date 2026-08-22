/**
 * core/events.ts — the typed pub/sub behind cross-surface state sync
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The mechanism behind the chokepoint cascade. When state/regimen.ts mutates
 * regimen LS, it fires a `regimen:changed` event here. Every view that cares
 * subscribes and re-renders.
 *
 * Why it is an event bus and not direct calls: a chokepoint's last line is
 * `emit('regimen:changed', payload)`, and subscribers register their interest
 * declaratively — so no mutation site has to remember which surfaces need to
 * re-render. (state/coverage.ts and state/regimen.ts still wrap the older
 * `window.triggerRegimenRerender` global as a compatibility shim, so that name
 * is not gone — it is simply no longer how state reaches the views.)
 *
 * Cross-tab sync: core/storage subscribes to native `storage`
 * events and re-fires the corresponding typed event so views in tab B see a
 * write from tab A with zero extra plumbing.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Every event name the bus knows. Add here, then add the payload below.
 *  Some names are declared ahead of a producer — nothing currently emits
 *  'scanner:scan-cleared', 'eden:hash-mismatch' or 'storage:pressure-warn', so a
 *  subscriber to any of those would wait forever. */
export type EventName =
  | 'regimen:changed'
  | 'coverage:recomputed'
  | 'scanner:scan-complete'
  | 'scanner:scan-cleared'
  | 'eden:hash-mismatch'
  | 'storage:pressure-warn'
  | 'rail:navigate'
  | 'log:entry-added'
  | 'corpus:hydrated'
  | 'profile:changed'
  | 'knowledge:open-entity'
  | 'knowledge:open-tab'
  | 'drawer:toggled';

/** Payload shape per event name. Add a case here when adding an event. */
export interface EventPayloads {
  'regimen:changed': { slotId: string; reason: 'dose-edit' | 'add' | 'remove' | 'restore' };
  'coverage:recomputed': { coveredCount: number; totalCount: number };
  'scanner:scan-complete': { captureId: string; verdict: 'aligns' | 'partial' | 'out' };
  'scanner:scan-cleared': { captureId: string };
  'eden:hash-mismatch': { file: string; expected: string; actual: string };
  'storage:pressure-warn': { bytesUsed: number; bytesLimit: number };
  /** Reserved extension point: main.ts::navigateTo emits this on every workspace
   *  switch, but nothing subscribes today. */
  'rail:navigate': { target: 'coverage' | 'regimen' | 'scanner' | 'search' | 'knowledge' };
  'log:entry-added': { id: string; kind: string };
  /** The web build's corpus arrived over the wire. Anything that renders a number
   *  DERIVED from the corpus must repaint here, because before this fires the count is
   *  unknown rather than zero. Never fires in the file build — the embed is inlined. */
  'corpus:hydrated': { claimCount: number };
  /** The user named themselves, or chose to browse. Fired by the state/profile.ts
   *  chokepoint; main.ts::wireProfileIdentity repaints four places from it — the
   *  document title, the rail brand slot, the rail profile name and the avatar initial
   *  — so a silent write would leave the rest stale. The topbar is NOT one of them: it
   *  carries the workspace name/deck, painted from a different source. */
  'profile:changed': { name: string | null; browsing: boolean };
  /** Ask-Wallach → open the Knowledge drawer at an entity's page. 'condition'/'essential'/'product'
   *  open a detail page (openDetail); 'topic' opens the Explore topic overlay. Fired by views/search.ts
   *  "Learn More" — now for basically any resolved entity (the catch-all); main.ts does the
   *  single-drawer swap (close search, open Knowledge, select the entity). */
  'knowledge:open-entity': { kind: 'essential' | 'condition' | 'product' | 'topic'; slug: string };
  /** Open the Knowledge drawer at a whole TAB rather than at one entity. Fired by the
   *  Regimen console's "all 90 covered" completion state, whose button sends the user to
   *  Products to keep browsing. Distinct from knowledge:open-entity because there is no
   *  entity to select — `wallach:navigate` cannot serve here, since it only reaches the
   *  three WORKSPACES and Products is a drawer tab. */
  'knowledge:open-tab': { tab: 'home' | 'foods' | 'orac' | 'essentials' | 'conditions' | 'explore' | 'products' };
  /** An overlay drawer opened or closed, from ANY path — the rail button, the bare
   *  key, Esc, or the drawer's own [X]. The rail's active highlight is derived state:
   *  before this event the shell re-synced it only on the paths IT drove, so closing
   *  from inside left the button lit for a drawer that was already gone. Views emit;
   *  main.ts::syncDrawerRail is the single subscriber. */
  'drawer:toggled': { target: 'search' | 'knowledge'; open: boolean };
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

/** Count of subscribers for an event. No caller today: it exists as an
 *  introspection hook for debugging a missed re-render. */
export function subscriberCount(event: EventName): number {
  return subscribers.get(event)?.size ?? 0;
}
