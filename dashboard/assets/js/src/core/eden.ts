/**
 * core/eden.ts — sealed-canonical-data pattern (Round 157 + Round 161)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Eden is the read-only canonical-truth layer: bundled essentials, vault
 * products, doctrines, Wallach corpus index. Each Eden file is hash-anchored
 * via a golden .sha256 sibling. At startup we verify the hash matches; on
 * mismatch we surface a critical alert and refuse to derive state from the
 * drifted source.
 *
 * The write-protection invariant (Round 161) enforces user-only-writer rule:
 * the agent reads Eden freely but never edits sealed files. This module
 * provides the read API; mutations are blocked at the storage layer.
 *
 * The Zod schema parameter on `loadSealed` is the §00 boundary: even when
 * the hash matches, the parsed JSON gets schema-validated before entering
 * typed-land. Bad sealed content (extremely rare but not impossible during
 * a re-seal) fails the load instead of poisoning downstream state.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { z } from 'zod';
import { emit } from './events.js';

export interface EdenManifest {
  /** Path-relative-to-dashboard of the sealed file. */
  path: string;
  /** SHA-256 hex digest expected for this file'\''s contents. */
  goldenHash: string;
  /** ISO timestamp this file was sealed. */
  sealedAt: string;
}

export interface EdenLoadResult<T> {
  ok: boolean;
  data: T | null;
  hashMatch: boolean;
  actualHash?: string;
}

/**
 * Compute the SHA-256 hex digest of a string using SubtleCrypto. Used both
 * for Eden hash checks and for the design-system.css hash integrity check.
 */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Fetch + parse + hash-verify + Zod-validate a sealed Eden file. Returns the
 * data only if the hash matches the manifest AND the schema validates. On
 * hash mismatch, fires `eden:hash-mismatch` so higher layers can refuse to
 * derive state from the drifted source.
 */
export async function loadSealed<T>(
  manifest: EdenManifest,
  schema: z.ZodType<T>,
): Promise<EdenLoadResult<T>> {
  let text: string;
  try {
    const response = await fetch(manifest.path);
    if (!response.ok) {
      return { ok: false, data: null, hashMatch: false };
    }
    text = await response.text();
  }
  catch {
    return { ok: false, data: null, hashMatch: false };
  }

  const actualHash = await sha256Hex(text);
  const hashMatch = actualHash === manifest.goldenHash;

  if (!hashMatch) {
    emit('eden:hash-mismatch', {
      file: manifest.path,
      expected: manifest.goldenHash,
      actual: actualHash,
    });
    return { ok: false, data: null, hashMatch: false, actualHash };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  }
  catch {
    return { ok: false, data: null, hashMatch: true, actualHash };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, data: null, hashMatch: true, actualHash };
  }

  return { ok: true, data: result.data, hashMatch: true, actualHash };
}
