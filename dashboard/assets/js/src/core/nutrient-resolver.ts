/**
 * core/nutrient-resolver.ts — the ONE runtime identity resolver (label name → canon slug)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A faithful TypeScript port of eden/tools/nutrient_resolve.py::resolve(). Both consult the
 * SAME tables — this module reads them from the generated `nutrient-resolver-data.json`
 * (registry essential_aliases + canon mineral/amino display names + fatty-acid patterns +
 * stereo prefixes), which is itself GENERATED FROM the Python resolver, so the two cannot
 * drift. The nutrient_resolver_parity invariant proves artifact ≡ resolve() over every pillar
 * substance name, and nutrient-resolver.test.ts proves THIS code ≡ that fixture — together
 * TS ≡ Python.
 *
 * state/coverage.ts once held a hand-rolled string matcher independent of the registry
 * (two resolution truths — e.g. "Thiamin" resolved to vitamin-b1 in the registry but silently
 * dropped in Coverage). This is now the single home (§00.B #3). Composition-only (§00.A):
 * identity resolution never defines a Wallach amount — units + targets live elsewhere.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import resolverData from '../../../data/nutrient-resolver-data.json';
import { NutrientResolverSchema } from './schemas/index.js';

const MAP = NutrientResolverSchema.parse(resolverData);

// Precompile once. Python fa_of lowercases the probe string and the patterns are lowercase
// (no IGNORECASE), so we lowercase + use no flag — a faithful mirror, not an 'i' shortcut.
const FA_PATTERNS: ReadonlyArray<readonly [string, RegExp]>
  = MAP.fatty_acid_patterns.map(([slug, src]) => [slug, new RegExp(src)] as const);
// An explicit "omega N" label token (capture group = 3/6/9) wins over the keywords above.
const OMEGA_DIGIT = new RegExp(MAP.omega_digit_pattern);

/** Mirror of nutrient_resolve._clean: strip trademark marks, collapse whitespace, trim. */
function clean(name: string): string {
  let n = name;
  for (const ch of ['™', '®', '©']) {
    n = n.split(ch).join('');
  }
  return n.replace(/\s+/g, ' ').trim();
}

/** Mirror of fa_of: fatty-acid family by keyword over `${name} ${form}` lowercased. */
function faOf(name: string, form?: string | null): string | null {
  const s = `${name} ${form ?? ''}`.toLowerCase();
  const om = OMEGA_DIGIT.exec(s)?.[1];
  if (om !== undefined) {
    return `omega-${om}`;
  }
  for (const [slug, re] of FA_PATTERNS) {
    if (re.test(s)) {
      return slug;
    }
  }
  return null;
}

/** Mirror of strip_stereo: drop a leading L-/D-/DL- prefix. */
function stripStereo(n: string): string {
  for (const p of MAP.stereo_prefixes) {
    if (n.startsWith(p)) {
      return n.slice(p.length);
    }
  }
  return n;
}

/**
 * Resolve a nutrient/ingredient label name (+ optional form) to a canon essential slug, or
 * null if it is a botanical/active. Faithful port of nutrient_resolve.resolve(): fatty-acid
 * family → vitamin alias → mineral display-name → mineral alias → amino (stereo-stripped
 * first word). Order matters and mirrors the Python exactly.
 */
export function resolveSlug(name: string | null | undefined, form?: string | null): string | null {
  if (name === undefined || name === null || name === '') {
    return null;
  }
  // Strip a parenthetical qualifier before the alias lookup (mirrors
  // nutrient_resolve.PAREN_QUALIFIER): 'Vitamin B1 (Thiamine)' -> 'vitamin b1'.
  const n = clean(name).toLowerCase().replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const fa = faOf(name, form);
  if (fa !== null) {
    return fa;
  }
  const v = MAP.vitamin_aliases[n];
  if (v !== undefined) {
    return v;
  }
  const m = MAP.mineral_names[n];
  if (m !== undefined) {
    return m;
  }
  const ma = MAP.mineral_aliases[n];
  if (ma !== undefined) {
    return ma;
  }
  const a = (stripStereo(n).split(' ')[0] ?? '').trim();
  const am = MAP.amino_names[a];
  if (am !== undefined) {
    return am;
  }
  return null;
}
