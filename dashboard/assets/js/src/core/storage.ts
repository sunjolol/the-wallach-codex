/**
 * core/storage.ts — LocalStorage chokepoint with atomic writes + Zod boundaries
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * THE ONLY PLACE in the codebase that calls `localStorage.{get,set,remove}Item`
 * directly (enforced by lint rule `no-restricted-globals` everywhere else).
 *
 * Two layers of API:
 *
 *   - `get`/`set` — fast path, no schema validation. Used by legacy/scaffold
 *     code being ported over. Returns/accepts T directly. The cast is YOUR
 *     responsibility; bad LS data → bad typed data → bugs.
 *
 *   - `getValidated`/`setValidated` — §00 boundary discipline. Reads pass
 *     through Zod parse; bad data → null (read) or schema-invalid result
 *     (write). New code should always prefer these.
 *
 * Round 73 §17: every write goes through try-set → verify-read →
 * reject-on-mismatch. If storage can't confirm the value round-trips, the
 * write fails LOUDLY instead of silently dropping.
 *
 * Round 150 §31: native `storage` event re-fires via core/events so other
 * surfaces re-render. Cross-tab sync with zero plumbing in receivers.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { z } from 'zod';
import { emit } from './events.js';

/** A storage key, exactly as it appears in LS (no auto-prefix). */
export type StorageKey = string;

/** Result of a write — includes the round-trip verification outcome. */
export interface WriteResult {
  ok: boolean;
  key: StorageKey;
  reason?: 'verify-mismatch' | 'quota-exceeded' | 'serialize-error' | 'schema-invalid' | 'remove-failed';
}

/** Subscriber for raw cross-tab storage changes. */
export type StorageChangeHandler = (key: StorageKey, newValue: string | null) => void;

const subscribers = new Set<StorageChangeHandler>();
let nativeListenerInstalled = false;

function installNativeListener(): void {
  if (nativeListenerInstalled) {
    return;
  }
  nativeListenerInstalled = true;
  window.addEventListener('storage', (ev) => {
    if (ev.key === null) {
      return; // clear() — skip
    }
    for (const handler of subscribers) {
      try {
        handler(ev.key, ev.newValue);
      }
      catch (e) {
        console.warn('[storage] handler error:', e);
      }
    }
    // Route to the typed event bus for known regimen/coverage keys so views
    // don't have to know about LS key naming conventions.
    if (ev.key.startsWith('rgSlot') || ev.key === 'lcRegimen_v1') {
      emit('regimen:changed', { slotId: ev.key, reason: 'restore' });
    }
  });
}

/**
 * Atomically write a JSON-serializable value to LS, then verify by re-reading.
 * @param key  Storage key (no auto-prefix; pass the exact key you want in LS).
 * @param value Anything JSON.stringify can handle.
 */
export function set<T>(key: StorageKey, value: T): WriteResult {
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  }
  catch {
    return { ok: false, key, reason: 'serialize-error' };
  }
  try {
    localStorage.setItem(key, serialized);
  }
  catch {
    return { ok: false, key, reason: 'quota-exceeded' };
  }
  // Verify round-trip (Round 73 §17 atomic-write discipline)
  if (localStorage.getItem(key) !== serialized) {
    return { ok: false, key, reason: 'verify-mismatch' };
  }
  return { ok: true, key };
}

/** Read a typed value back, or `null` if missing/corrupt. */
export function get<T>(key: StorageKey): T | null {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  }
  catch {
    return null;
  }
}

/**
 * Read + Zod-validate at the boundary. Returns the parsed value if both
 * JSON parsing AND schema validation succeed; `null` otherwise.
 *
 * This is the §00 substrate for "bad LS data never enters typed-land."
 * Use this for every new read; the unchecked `get<T>` is kept only for
 * legacy callers being incrementally ported over.
 */
export function getValidated<T>(key: StorageKey, schema: z.ZodType<T>): T | null {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  }
  catch {
    return null;
  }
  const result = schema.safeParse(parsed);
  return result.success ? result.data : null;
}

/**
 * Zod-validate then write. Returns a `WriteResult` with reason
 * `schema-invalid` if the value doesn't match the schema — bad writes are
 * caught at the call site instead of silently corrupting LS.
 */
export function setValidated<T>(key: StorageKey, value: T, schema: z.ZodType<T>): WriteResult {
  const result = schema.safeParse(value);
  if (!result.success) {
    return { ok: false, key, reason: 'schema-invalid' };
  }
  return set(key, result.data);
}

/** Read a raw string (for legacy keys that aren't JSON-encoded). */
export function getRaw(key: StorageKey): string | null {
  return localStorage.getItem(key);
}

/** Remove a key. */
export function remove(key: StorageKey): WriteResult {
  try {
    localStorage.removeItem(key);
    return { ok: true, key };
  }
  catch {
    return { ok: false, key, reason: 'remove-failed' };
  }
}

/** Subscribe to native cross-tab storage events. Returns unsubscribe fn. */
export function onChange(handler: StorageChangeHandler): () => void {
  installNativeListener();
  subscribers.add(handler);
  return () => {
    subscribers.delete(handler);
  };
}

/** Best-effort estimate of LS usage in bytes. */
export function estimateUsage(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k === null) {
      continue;
    }
    const v = localStorage.getItem(k) ?? '';
    total += k.length + v.length;
  }
  return total * 2; // UTF-16 in most engines
}

/* --- BACKUP: whole-origin snapshot / restore (export <-> import) ------------
 * The app's data is 100% on-device; export/import is how the user MOVES or backs
 * it up (CLAUDE.md). Scoped to the app's own key prefixes so an export is clean
 * and a restore cannot write arbitrary keys. Restore writes the raw strings back
 * verbatim; every READ re-validates through getValidated, so a tampered value
 * degrades to null rather than entering typed-land (#7 graceful degradation). */
const APP_KEY_PREFIXES = ['wallach', 'rg', 'lc'] as const;

function isAppKey(k: string): boolean {
  return APP_KEY_PREFIXES.some(p => k.startsWith(p));
}

/** Every app-owned key -> its raw stored string. The shape the exporter serialises. */
export function snapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k === null || !isAppKey(k)) {
      continue;
    }
    const v = localStorage.getItem(k);
    if (v !== null) {
      out[k] = v;
    }
  }
  return out;
}

/** Write a raw string verbatim (no JSON re-encoding), verified. Restore-only. */
function setRaw(key: StorageKey, value: string): WriteResult {
  try {
    localStorage.setItem(key, value);
  }
  catch {
    return { ok: false, key, reason: 'quota-exceeded' };
  }
  if (localStorage.getItem(key) !== value) {
    return { ok: false, key, reason: 'verify-mismatch' };
  }
  return { ok: true, key };
}

/**
 * Restore an exported snapshot as a TRUE REPLACE: app-owned keys ABSENT from the backup are
 * removed first (so the origin returns to the exported state, not a merge that keeps ghosts of
 * keys created after the backup), then the backup's keys are written. The restored / skipped /
 * removed counts are returned so the caller can report honestly rather than claiming a clean
 * import over a partial one. An empty backup is a NO-OP (never a wipe).
 */
export function restore(data: Record<string, string>): { restored: number; skipped: number; removed: number } {
  // TRUE restore, not a merge: drop app-owned keys ABSENT from the backup so a key created
  // after the backup does not linger. Guarded: an empty backup clears nothing (never a wipe).
  const incoming = new Set(Object.keys(data).filter(isAppKey));
  let removed = 0;
  if (incoming.size > 0) {
    for (const k of Object.keys(snapshot())) {
      if (!incoming.has(k)) {
        remove(k);
        removed++;
      }
    }
  }
  let restored = 0;
  let skipped = 0;
  for (const [k, v] of Object.entries(data)) {
    if (!isAppKey(k) || typeof v !== 'string') {
      skipped++;
      continue;
    }
    const res = setRaw(k, v);
    if (res.ok) {
      restored++;
    }
    else {
      skipped++;
    }
  }
  return { restored, skipped, removed };
}
