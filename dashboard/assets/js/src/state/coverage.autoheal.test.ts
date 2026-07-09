/**
 * state/coverage.autoheal.test.ts — the regimen snapshot auto-heal (memory: auto-heal-not-user-debug).
 *
 * A catalog-sourced regimen item stores a nutrient SNAPSHOT at add-time; if the sealed
 * Product DB later corrects a value, liveNutrients() re-reads the CURRENT composition
 * from the vault by exact canonical name, so the number self-corrects with no re-adding.
 * User-scanned items (and anything whose name isn't a live product) keep their own data.
 * DOM-free: liveNutrients is pure over the bundled vault + the item (no localStorage).
 */

import type { RegimenItem } from '../core/schemas/index.js';
import { describe, expect, it } from 'vitest';
import { liveNutrients } from './coverage.js';

// "Beyond Osteo FX(TM) Powder" is a live vault product; its calcium is 1200 mg.
const VAULT_NAME = 'Beyond Osteo FX™ Powder';

function item(over: Partial<RegimenItem> & { label: RegimenItem['label'] }): RegimenItem {
  return { id: 1, addedDate: '2026-01-01', provenance: 'user_manual', ...over };
}

const staleCalcium = [{ name: 'Calcium', amount: 1, unit: 'mg' }]; // deliberately wrong snapshot

function calciumOf(nutrients: unknown[]): number | undefined {
  for (const n of nutrients) {
    if (n !== null && typeof n === 'object'
      && (n as { name?: unknown }).name === 'Calcium'
      && typeof (n as { amount?: unknown }).amount === 'number') {
      return (n as { amount: number }).amount;
    }
  }
  return undefined;
}

describe('coverage: regimen snapshot auto-heal (liveNutrients)', () => {
  it('re-reads the LIVE vault composition for a catalog item, overriding a stale snapshot', () => {
    const healed = liveNutrients(item({
      provenance: 'user_manual',
      label: { name: VAULT_NAME, nutrients: staleCalcium },
    }));
    expect(calciumOf(healed)).toBe(1200); // vault value, not the stale 1
    expect(healed.length).toBeGreaterThan(1); // full live nutrient list, not the 1-item snapshot
  });

  it('matches the canonical name case-insensitively', () => {
    const healed = liveNutrients(item({
      provenance: 'wishlist_promoted',
      label: { name: VAULT_NAME.toUpperCase(), nutrients: staleCalcium },
    }));
    expect(calciumOf(healed)).toBe(1200);
  });

  it('never heals a user-scanned item — it keeps its own snapshot even if the name collides', () => {
    const kept = liveNutrients(item({
      provenance: 'user_scanned',
      label: { name: VAULT_NAME, nutrients: staleCalcium },
    }));
    expect(calciumOf(kept)).toBe(1); // untouched
    expect(kept).toBe(staleCalcium);
  });

  it('falls back to the snapshot when the name is not a live product (custom item)', () => {
    const snap = [{ name: 'Vitamin C', amount: 500, unit: 'mg' }];
    const kept = liveNutrients(item({
      provenance: 'user_manual',
      label: { name: 'My Homebrew Blend', nutrients: snap },
    }));
    expect(kept).toBe(snap);
  });

  it('returns an empty list (never throws) for an item with no nutrients + no match', () => {
    const out = liveNutrients(item({ provenance: 'user_manual', label: { name: 'Nothing Here' } }));
    expect(out).toEqual([]);
  });
});
