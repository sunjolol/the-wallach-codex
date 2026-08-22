/**
 * state/scanner.ts — scan history + the label scoring engine
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owns the Scanner surface's state: the scan-history FIFO, the durable Saved
 * shelf, and the engine that turns a parsed label into a verdict. Every NUMBER
 * and every doctrine string comes from the sealed corpus
 * (scanner-corpus-data.json) and the Wallach targets DB; §00.A holds, nothing
 * here invents an amount.
 *
 * Pipeline (scan):
 *   alignmentScore (form-alignment tally) · gapFillFor (per-nutrient gap-fill %
 *   vs the EFFECTIVE coverage the Coverage surface shows — same matcher +
 *   delivery, so the two surfaces line up) · matchGoals (keyword + meaningful-
 *   nutrient goal inclusion) · antiFlags (anti-list with gluten/oat/high-oleic
 *   nuance) · decideVerdict (ADD/SAVE/REJECT ladder).
 *
 * gapFill's "current" = the live regimen delivery from
 * state/coverage.currentDelivery(), so a label is always scored against what the
 * user already takes. The 26-entry ASSUMED DIETARY BASELINE that used to be added
 * on top was retired on 2026-08-21 (owner ruling) when the real food catalog
 * landed — see getEffectiveCoverage for why.
 *
 * Known limits, deliberate: container conflicts are inert — an OCR'd label
 * carries no container metadata, so containerFlag() always returns none. Goal
 * matching reads ess.target.low, so a goal counts as served only when the
 * nutrient is present in a meaningful fraction of the Wallach target.
 *
 * LS keys:
 *   'lcRecentScans_v1' — auto scan history (FIFO, newest first, cap 5). NO
 *                        name-dedup: container names are low-cardinality
 *                        ('capsule', 'powder'), so deduping by name collapsed
 *                        genuinely distinct products.
 *   'lcSavedScans_v1'  — the durable Saved shelf (user-curated, never
 *                        auto-evicted).
 *
 * Both keys are read through getValidated and written through setValidated, so
 * corrupted localStorage degrades to an empty list instead of entering
 * typed-land unvalidated.
 *
 * The bridge: window.lcScan = scan, so a headless probe can drive the scoring
 * engine without importing the module; window.lcLastResult mirrors the most
 * recent logged result for the same inspection purpose. In-app callers import
 * runScan / scoreLabel directly.
 *
 * Verdicts:
 *   'ADD'    — strong fit, recommend adopting into regimen
 *   'SAVE'   — worth considering, with caveats; can be kept on the Saved shelf
 *   'REJECT' — has flags; don't adopt
 * ═══════════════════════════════════════════════════════════════════════════
 */

import scanCorpusData from '../../../data/scanner-corpus-data.json';
import { emit } from '../core/events.js';
import {
  type Alignment,
  type CoverageTarget,
  CoverageTargetSchema,
  type Essential,
  type GapFill,
  type HistoryEntry,
  HistoryShapeSchema,
  type ScanCorpus,
  ScanCorpusSchema,
  type ScanLabel,
  type Verdict,
} from '../core/schemas/index.js';
import { getValidated, setValidated } from '../core/storage.js';
import { canonicalUnit, massToMcg, massToMg, mgToMass } from '../core/units.js';
import {
  currentDelivery,
  getOrCompute,
  getTargets,
  matchEssential,
} from './coverage.js';

export const RECENT_SCANS_KEY = 'lcRecentScans_v1';

/** The durable Saved shelf — items the user explicitly "Save for later". Separate
 *  from the auto RECENT_SCANS FIFO: no eviction on new scans, only removed by the user. */
export const SAVED_SCANS_KEY = 'lcSavedScans_v1';

/** The auto history is capped at 5 entries. */
const MAX_RECENT = 5;

/** Cap the durable Saved shelf generously; it is user-curated, not auto-churned. */
const MAX_SAVED = 100;

/** Container-hint tokens the OCR parser emits when no product name is legible — humanised for
 *  display so a raw 'aluminum_can' never surfaces as a product name. */
const CONTAINER_LABELS = new Map<string, string>([
  ['aluminum_can', 'Canned drink'],
  ['can', 'Canned drink'],
  ['capsule', 'Capsules'],
  ['tablet', 'Tablets'],
  ['softgel', 'Softgels'],
  ['powder', 'Powder'],
  ['liquid', 'Liquid'],
  ['bottle', 'Bottled product'],
]);

/** A human product name for display: humanise a known container token, keep a real name as-is,
 *  else fall back to 'Scanned label' — never show the raw parser token to the user. */
export function humanizeName(raw: string | undefined): string {
  const s = (raw ?? '').trim();
  if (s === '' || s.toLowerCase() === 'scanned label') {
    return 'Scanned label';
  }
  const mapped = CONTAINER_LABELS.get(s.toLowerCase().replace(/\s+/g, '_'));
  if (mapped !== undefined) {
    return mapped;
  }
  // A real name (already has a space or a capital) passes through; a bare token gets its
  // underscores opened and each word capitalised.
  if (/[A-Z ]/.test(s)) {
    return s;
  }
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Re-export inferred types so callers can import from @state/scanner ───
export type { Alignment, GapFill, HistoryEntry, ScanLabel, Verdict };

// ─── Runtime-only types (not stored in LS, no Zod needed) ─────────────────

export interface AntiFlag {
  category: string;
  severity: 'hard' | 'serious' | 'softened' | 'mild';
  terms?: string[];
  nuance?: string;
  softened?: boolean;
}

interface Conflict {
  rule: string;
  severity: string;
  framing?: string;
}

interface Reason {
  label: string;
  items?: string[];
}

export interface ScanResult {
  label: ScanLabel;
  alignment: Alignment;
  gapFills: GapFill[];
  goals: string[];
  anti: AntiFlag[];
  conflicts?: Conflict[];
  verdict: Verdict;
  reasonsFor: Reason[];
  reasonsAgainst: Reason[];
  sparseNutrients?: boolean;
  sparseIngredients?: boolean;
  /** Essentials this label delivers a meaningful amount of (>= HIT_THRESHOLD of the WALLACH
   *  daily target -- never an RDV; only the essentials that carry a Wallach dose are
   *  eligible). A food-quality signal, distinct from coverage, which needs the full target. */
  hits: number;
  hitEssentials: string[];
  hitsStrong: number;
}

type ScanNutrient = NonNullable<ScanLabel['nutrients']>[number];

interface Norm {
  family: 'mass_mcg' | 'iu';
  value: number;
}

type EffectiveCov = Record<string, { amount: number; unit: string }>;

interface LegacyWindow extends Window {
  lcScan?: (label: ScanLabel, opts?: { logToRecent?: boolean }) => ScanResult;
  lcLastResult?: ScanResult;
}

// ─── Corpus load (esbuild JSON import + Zod, cached) ────────────────────────

let cachedCorpus: ScanCorpus | null = null;

/** The Wallach scan corpus, validated once at the Zod boundary then cached. */
function loadScanCorpus(): ScanCorpus {
  if (cachedCorpus === null) {
    cachedCorpus = ScanCorpusSchema.parse(scanCorpusData);
  }
  return cachedCorpus;
}

let cachedAntiWords: ReadonlySet<string> | null = null;

/**
 * Lowercased single words (>=3 chars) that appear in any anti-list term or hard-reject term. The
 * Confirm-step "Possible OCR errors" walker skips these so it never offers to "correct" a flagged
 * bad ingredient away -- suggesting `modified` -> `certified` would silently erase the flag that
 * makes a modified-starch product REJECT. Derived from the corpus, cached. Pure.
 */
export function getAntiIngredientWords(): ReadonlySet<string> {
  if (cachedAntiWords === null) {
    const corpus = loadScanCorpus();
    const words = new Set<string>();
    const add = (term: string): void => {
      for (const w of term.toLowerCase().split(/[^a-z]+/)) {
        if (w.length >= 3) {
          words.add(w);
        }
      }
    };
    for (const terms of Object.values(corpus.antiList)) {
      for (const term of terms) {
        add(term);
      }
    }
    for (const term of corpus.hardRejectTerms) {
      add(term);
    }
    cachedAntiWords = words;
  }
  return cachedAntiWords;
}

// ─── Read API — Zod-validated boundary ────────────────────────────────────

export function getHistory(): HistoryEntry[] {
  return getValidated(RECENT_SCANS_KEY, HistoryShapeSchema)?.items ?? [];
}

/** The durable Saved shelf, newest first. Bad LS data → empty. */
export function getSaved(): HistoryEntry[] {
  return getValidated(SAVED_SCANS_KEY, HistoryShapeSchema)?.items ?? [];
}

// ─── Unit math (normalize · unit conversion) ─────────────────────────

/**
 * Normalize an amount to a comparison family: mass→mcg base, IU→iu.
 *
 * The unit SPELLING is core/units' job, not this function's. It used to be an exact-string
 * ladder over 'mcg' | 'mg' | 'g' | 'iu', which meant a hand-typed "milligrams" returned null
 * and the nutrient silently vanished from meaningfulHits, gapFillFor and the Confirm row's
 * +1 — mapped to an essential on screen, contributing nothing, with no error anywhere.
 * Null still means "not a comparable quantity" (probiotic CFU counts, mL); it no longer
 * means "spelled it out".
 */
function normalize(amount: number, unit: string | undefined): Norm | null {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return null;
  }
  const canon = canonicalUnit(unit);
  if (canon === null) {
    return null;
  }
  if (canon === 'iu') {
    return { family: 'iu', value: amount };
  }
  return { family: 'mass_mcg', value: massToMcg(amount, canon) };
}

/** Convert a value between mass units / IU. Returns null for incompatible pairs. */
function unitConv(value: number, fromUnit: string | undefined, toUnit: string | undefined): number | null {
  const f = canonicalUnit(fromUnit);
  const t = canonicalUnit(toUnit);
  if (f === null || t === null) {
    // Two identical UNRECOGNIZED units still convert to themselves — "million CFU" to
    // "million CFU" is the identity, which is what the raw-string compare here always did.
    return (fromUnit ?? '').toLowerCase().trim() === (toUnit ?? '').toLowerCase().trim() ? value : null;
  }
  if (f === t) {
    return value;
  }
  if (f === 'iu' || t === 'iu') {
    return null;
  }
  return mgToMass(massToMg(value, f), t);
}

/** Word-boundary keyword match — prevents "buckwheat" matching "wheat". */
function matchKeyword(text: string, kw: string): boolean {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

/** Narrow an essential's loosely-typed target to the fields the engine reads. */
function essTarget(ess: Essential): CoverageTarget | null {
  const r = CoverageTargetSchema.safeParse(ess.target);
  return r.success ? r.data : null;
}

// ─── Alignment ──────────────────────────────────────────────────────────────

/** Tally per-nutrient form alignment into a 0..2 score. */
function alignmentScore(nutrients: ScanNutrient[]): Alignment {
  let a = 0;
  let p = 0;
  let m = 0;
  let u = 0;
  for (const n of nutrients) {
    const raw = (n as Record<string, unknown>)['form_alignment'];
    const al = typeof raw === 'string' ? raw : 'unknown';
    if (al === 'aligned') {
      a += 1;
    }
    else if (al === 'partial') {
      p += 1;
    }
    else if (al === 'misaligned') {
      m += 1;
    }
    else {
      u += 1;
    }
  }
  const total = a + p + m + u;
  const score = total ? Math.round(((a * 2 + p - m) / total) * 100) / 100 : 0;
  return { score, aligned: a, total, misaligned: m };
}

// ─── Gap-fill ────────────────────────────────────────────────────────────────

/**
 * Effective current coverage = what the user's REGIMEN actually delivers. Nothing else.
 *
 * ★ THE ASSUMED DIETARY BASELINE WAS RETIRED HERE (2026-08-21, owner ruling). This function
 * used to ADD a 26-entry table of assumed daily dietary intake before measuring the gap, and
 * then subtract the total from a Wallach target. Those 26 numbers were not Wallach's, not
 * USDA's, and carried no provenance field at all — `chronicle/build-log.md` records only that
 * they were migrated byte-for-byte out of a legacy JS literal, never where they came from.
 * No gate could see them, and they made every gap look smaller than it was.
 *
 * It was removed in the same patch that landed the real food catalog, because the two are
 * two hand-maintained homes for one fact — "how much of X a normal diet supplies" — which is
 * Charter R3's exact prohibition. The food catalog answers that question with a byte-exact
 * join into a pinned source and a gate that can prove it; the baseline answered it with
 * numbers nobody could source. Keeping both would have meant shipping the ungated one anyway.
 *
 * EXPECTED EFFECT: gap-fill percentages go DOWN (gaps are now shown at full size) and the
 * scanner's ADD verdicts become slightly more generous at the >= 10% gate. Both are the
 * honest readings. If you want a diet credited here, add the FOOD to the regimen — that
 * path is now real.
 */
function getEffectiveCoverage(): EffectiveCov {
  const targets = getTargets();
  const live = currentDelivery();

  const base: EffectiveCov = {};
  for (const t of targets) {
    const tgt = essTarget(t);
    if (tgt === null || tgt.low === undefined || tgt.low === null) {
      continue;
    }
    const targetUnit = (tgt.unit ?? 'mg').toLowerCase();
    let amount = 0;
    const liveEntry = live.get(t.name);
    if (liveEntry !== undefined) {
      if (targetUnit === 'iu') {
        amount += liveEntry.totalIU;
      }
      else {
        const conv = unitConv(liveEntry.totalMg, 'mg', targetUnit);
        if (conv !== null) {
          amount += conv;
        }
      }
    }
    if (amount > 0) {
      base[t.name] = { amount: Math.round(amount * 100) / 100, unit: targetUnit };
    }
  }
  return base;
}

/** >= this fraction of the WALLACH daily target counts as a meaningful "hit". A DISPLAY
 *  threshold, always measured against the Wallach target -- never an RDV/DV. */
const HIT_THRESHOLD = 0.03;
/** >= this fraction of the Wallach target is a STRONG hit (matches the 'Meaningful
 *  gap-fill' reason's >=10% cut). A depth signal atop the breadth count. */
const HIT_STRONG = 0.10;

/** Essentials this label delivers a meaningful amount of: >= HIT_THRESHOLD of the Wallach
 *  target, per serving, UNCAPPED by current coverage (a stable property of the food, not of
 *  your regimen). Only the essentials that carry a Wallach dose are eligible; where Wallach
 *  is silent there is no target to measure against, so it cannot be a hit (an honest gap). */
function meaningfulHits(nutrients: ScanNutrient[], dailyServings: number): { hits: string[]; strong: number } {
  const hit = new Set<string>();
  const strong = new Set<string>();
  for (const n of nutrients) {
    const ess = matchEssential(n.name);
    if (ess === null) {
      continue;
    }
    const tgt = essTarget(ess);
    if (tgt === null || tgt.low === undefined || tgt.low === null) {
      continue;
    }
    const norm = normalize(Number(n.amount), n.unit);
    const targetNorm = normalize(tgt.low, tgt.unit);
    if (norm === null || targetNorm === null || norm.family !== targetNorm.family || targetNorm.value <= 0) {
      continue;
    }
    const pct = (norm.value * dailyServings) / targetNorm.value;
    if (pct >= HIT_THRESHOLD) {
      hit.add(ess.name);
      if (pct >= HIT_STRONG) {
        strong.add(ess.name);
      }
    }
  }
  return { hits: [...hit], strong: strong.size };
}

/** Per-nutrient gap-fill %: how much this nutrient closes of the remaining gap. */
function gapFillFor(n: ScanNutrient, dailyServings: number, effectiveCov: EffectiveCov): GapFill | null {
  const ess = matchEssential(n.name);
  if (ess === null) {
    return null;
  }
  const tgt = essTarget(ess);
  if (tgt === null || tgt.low === undefined || tgt.low === null) {
    return null;
  }
  const norm = normalize(Number(n.amount), n.unit);
  if (norm === null) {
    return null;
  }
  const targetNorm = normalize(tgt.low, tgt.unit);
  if (targetNorm === null || norm.family !== targetNorm.family) {
    return null;
  }
  const addedPerDay = norm.value * dailyServings;
  const cov = effectiveCov[ess.name];
  const curr = cov !== undefined ? (normalize(cov.amount, cov.unit)?.value ?? 0) : 0;
  const gap = Math.max(0, targetNorm.value - curr);
  const pct = targetNorm.value > 0 ? Math.round(1000 * Math.min(addedPerDay, gap) / targetNorm.value) / 10 : 0;
  return {
    essential: ess.name,
    gapFillPct: pct,
    amountClaimed: addedPerDay,
    unit: norm.family === 'iu' ? 'iu' : 'mcg',
  };
}

// ─── Projected coverage delta (the Scan → Result before/after readout) ──────

/**
 * The projected coverage delta if this label's confirmed reads were adopted, in the
 * Coverage tab's OWN frame so the numbers agree across surfaces: `before` is the live
 * snapshot coveredCount (the covered-of-90 figure the user sees everywhere), and an essential counts
 * as ADDED only when the scan's own amount actually crosses its Wallach targetLow on a
 * tile that is not already covered. No fabrication — every number is the live coverage
 * snapshot plus the label's user-provided amounts. Conservative by design: a nutrient
 * that does not resolve to a tile or whose unit cannot convert simply does not add, so
 * this never OVER-claims coverage (it can only under-count on an imperfect join).
 */
export function coverageDeltaForLabel(label: ScanLabel): { before: number; after: number; addedEssentials: string[] } {
  const snapshot = getOrCompute();
  const before = snapshot.coveredCount;
  const dailyServings = Number.parseFloat(String(label.servings)) || 1;

  // Sum the scan's contribution per canonical essential name (matchEssential's join key).
  const scanned: Array<{ name: string; amount: number; unit: string | undefined }> = [];
  for (const n of label.nutrients ?? []) {
    const ess = matchEssential(n.name);
    if (ess === null) {
      continue;
    }
    scanned.push({ name: ess.name, amount: Number(n.amount) * dailyServings, unit: n.unit });
  }

  const addedEssentials: string[] = [];
  for (const tile of snapshot.tiles) {
    if (tile.covered || tile.intakeVsTarget === null) {
      continue;
    }
    const { deliveredAmount, targetLow, unit } = tile.intakeVsTarget;
    if (targetLow <= 0) {
      continue;
    }
    let scanAmount = 0;
    for (const s of scanned) {
      if (s.name !== tile.name) {
        continue;
      }
      const conv = unitConv(s.amount, s.unit, unit);
      if (conv !== null) {
        scanAmount += conv;
      }
    }
    if (scanAmount > 0 && deliveredAmount + scanAmount >= targetLow) {
      addedEssentials.push(tile.name);
    }
  }
  return { before, after: before + addedEssentials.length, addedEssentials };
}

// ─── Goal matching ───────────────────────────────────────────────────────────

/** Goals the product serves — strong keyword OR a meaningful (≥10% target) nutrient. */
function matchGoals(label: ScanLabel, corpus: ScanCorpus): string[] {
  const nameTxt = `${label.name ?? ''} ${label.brand ?? ''}`.toLowerCase();
  const labelNutrients: ScanNutrient[] = label.nutrients ?? [];
  const dailyServings = Number.parseFloat(String(label.servings)) || 1;
  const MEANINGFUL_PCT = 10;

  const stats: Record<string, { pct: number | null; has: boolean }> = {};
  for (const ln of labelNutrients) {
    const key = (ln.name ?? '').toLowerCase().trim();
    const ess = matchEssential(ln.name);
    let pct: number | null = null;
    if (ess !== null) {
      const tgt = essTarget(ess);
      const norm = normalize(Number(ln.amount), ln.unit);
      const targetNorm = tgt !== null && tgt.low !== undefined && tgt.low !== null
        ? normalize(tgt.low, tgt.unit)
        : null;
      if (norm !== null && targetNorm !== null && norm.family === targetNorm.family && targetNorm.value > 0) {
        pct = Math.round(1000 * (norm.value * dailyServings) / targetNorm.value) / 10;
      }
    }
    stats[key] = { pct, has: ess !== null };
  }

  const goals: string[] = [];
  for (const [goal, kws] of Object.entries(corpus.goalKeywords)) {
    const strong = kws.filter(kw => nameTxt.includes(kw));
    const goalNutMap = corpus.nutrientToGoalMap[goal] ?? [];
    const seen = new Set<string>();
    const matched: Array<{ pct: number | null; has: boolean }> = [];
    for (const gn of goalNutMap) {
      const b = gn.nutrient.toLowerCase().trim();
      const hit = labelNutrients.find((ln) => {
        const a = (ln.name ?? '').toLowerCase().trim();
        return a === b || a.includes(b) || b.includes(a);
      });
      if (hit !== undefined && !seen.has(b)) {
        seen.add(b);
        const key = (hit.name ?? '').toLowerCase().trim();
        matched.push(stats[key] ?? { pct: null, has: false });
      }
    }
    const meaningful = matched.filter(s => (s.has ? (s.pct !== null && s.pct >= MEANINGFUL_PCT) : strong.length > 0));
    if (strong.length > 0 || meaningful.length > 0) {
      goals.push(goal);
    }
  }
  return goals;
}

// ─── Anti-list flags (with the gluten / oat / high-oleic nuance) ───────────

const OAT_DERIVED = new Set(['oats', 'oat', 'oatmeal', 'oat flour', 'oat syrup', 'oat groats', 'oat bran']);

/** Seed / fried oils are a REJECT on their own (Wallach's vegetable-oil stance)
 *  UNLESS the whole label still delivers >= REDEEM_MIN_HITS essentials in a meaningful amount -- then
 *  the flag is OFFSET to neutral (never recommended). A redeemable tier between hard and plain serious. */
const REDEEMABLE_REJECT = new Set<string>(['fried oils / seed oils']);
const REDEEM_MIN_HITS = 3;

function antiFlags(label: ScanLabel, corpus: ScanCorpus): AntiFlag[] {
  const text = (label.ingredients ?? '').toLowerCase();
  const hardReject = new Set(corpus.hardRejectTerms);
  const flags: AntiFlag[] = [];

  for (const [cat, kws] of Object.entries(corpus.antiList)) {
    const hits = kws.filter(kw => matchKeyword(text, kw));
    if (hits.length === 0) {
      continue;
    }
    const flag: AntiFlag = { category: cat, terms: hits, severity: 'mild' };

    if (cat === 'fried oils / seed oils') {
      const variants = ['sunflower oil', 'safflower oil', 'canola oil'];
      const variantHits = hits.filter(h => variants.includes(h));
      const otherHits = hits.filter(h => !variants.includes(h));
      if (variantHits.length > 0 && otherHits.length === 0) {
        const isHighOleic = /high oleic[^,.]*(?:sunflower|safflower|canola)/i.test(text);
        if (isHighOleic) {
          flag.nuance = 'High-oleic variant detected — significantly more oxidation-stable than standard seed oil (>80% oleic acid, low omega-6). Wallach\'s broad rule still applies but severity is softened.';
          flag.softened = true;
        }
      }
    }

    // effTerms = the terms that actually count against the product. Defaults to every hit; the gluten
    // block below drops oats that a gluten-free-oats declaration has cleared.
    let effTerms = hits;

    if (cat === 'gluten sources') {
      // A gluten-free-oats declaration CLEARS the oats entirely -- no warning at all, exactly like
      // buckwheat never matching. Any NON-oat gluten grain (wheat / barley / rye /
      // malt / spelt) still flags on its own; oats WITHOUT a GF declaration are a HARD reject.
      const oatGfPre = /gluten[-\s]+free[^,]+\b(?:oats|oat|oatmeal|oat\s+flour|oat\s+groats|oat\s+bran|oat\s+syrup)\b/i;
      const oatGfPost = /\b(?:oats|oat|oatmeal|oat\s+flour|oat\s+groats|oat\s+bran|oat\s+syrup)\b[^,]+gluten[-\s]+free/i;
      const hasGFOatsAnchor = oatGfPre.test(text) || oatGfPost.test(text);
      if (hasGFOatsAnchor && hits.some(h => OAT_DERIVED.has(h))) {
        const remaining = hits.filter(h => !OAT_DERIVED.has(h));
        if (remaining.length === 0) {
          continue; // oats-only + a GF-oats declaration => not a gluten source; show nothing at all
        }
        effTerms = remaining; // keep only the real gluten proteins (e.g. wheat) the GF claim can't clear
        flag.terms = remaining;
      }
      const hardHits = effTerms.filter(h => hardReject.has(h));
      if (hardHits.length > 0) {
        flag.nuance = `Hard gluten proteins detected: ${hardHits.map(t => `"${t}"`).join(', ')}. Wallach-direct: wheat / barley / rye / malt / spelt are the actual gluten proteins. A gluten free oats declaration cannot shut off the trigger for actual gluten elsewhere on the label.`;
      }
      else {
        flag.nuance = `Oat ingredients detected (${effTerms.map(t => `"${t}"`).join(', ')}) with no gluten free oats declaration on the label. Standard commercial oats carry real cross-contamination risk from shared supply chains. A gluten-free claim attached to a non-oat ingredient (e.g., gluten-free pasta) does NOT certify the oats. HARD REJECT until the brand certifies oat GF status.`;
      }
    }

    // Oats WITHOUT a GF declaration are a HARD reject; GF-cleared oats were already dropped
    // from effTerms above, so this only fires on oats that genuinely remain.
    const oatHardReject = cat === 'gluten sources' && effTerms.some(h => OAT_DERIVED.has(h));

    let severity: AntiFlag['severity'] = 'mild';
    if (oatHardReject || effTerms.some(term => hardReject.has(term))) {
      severity = 'hard';
    }
    else if (flag.softened === true) {
      severity = 'softened';
    }
    else if (corpus.seriousAnti.includes(cat)) {
      severity = 'serious';
    }
    flag.severity = severity;
    flags.push(flag);
  }
  return flags;
}

/** Container conflicts — inert for OCR labels (no container metadata). */
function containerFlag(): Conflict[] {
  return [];
}

// ─── Verdict ladder ──────────────────────────────────────────────

function decideVerdict(
  alignment: Alignment,
  gapFills: GapFill[],
  anti: AntiFlag[],
  conflicts: Conflict[],
  goals: string[],
  hits: number,
  corpus: ScanCorpus,
): { verdict: Verdict; reasonsFor: Reason[]; reasonsAgainst: Reason[] } {
  const reasonsFor: Reason[] = [];
  const reasonsAgainst: Reason[] = [];
  if (alignment.score >= 1.5) {
    reasonsFor.push({ label: `High form alignment (${alignment.score}/2.0, ${alignment.aligned}/${alignment.total} aligned)` });
  }
  else if (alignment.score >= 0.5) {
    reasonsFor.push({ label: `Moderate form alignment (${alignment.score}/2.0)` });
  }
  if (alignment.misaligned > 0) {
    reasonsAgainst.push({ label: `${alignment.misaligned} misaligned form${alignment.misaligned > 1 ? 's' : ''} — non-Wallach-preferred` });
  }

  const meaningful = gapFills.filter(g => g.gapFillPct >= 10);
  if (meaningful.length > 0) {
    const top = [...meaningful].sort((a, b) => b.gapFillPct - a.gapFillPct).slice(0, 3);
    reasonsFor.push({ label: 'Meaningful gap-fill', items: top.map(g => `${g.essential} (+${g.gapFillPct}%)`) });
  }
  else if (gapFills.length > 0) {
    reasonsAgainst.push({ label: 'No nutrient closes >10% of a current gap' });
  }
  if (goals.length > 0) {
    reasonsFor.push({
      label: 'Goal coverage',
      items: goals.slice(0, 4).map(g => corpus.goalDisplayNames[g] ?? g),
    });
  }

  // Each anti-flag shows its CATEGORY and the exact matched term(s) so a mis-fire stays legible and the
  // user can overrule it: "Serious anti-list flags -- fried oils / seed oils -- \"canola oil\"".
  const fmtFlag = (f: AntiFlag): string => {
    const terms = f.terms ?? [];
    if (terms.length === 0) {
      return f.category;
    }
    const shown = terms.slice(0, 2).map(t => `"${t}"`).join(', ');
    const more = terms.length > 2 ? ` +${terms.length - 2} more` : '';
    return `${f.category} \u2014 ${shown}${more}`;
  };

  const hardHits = anti.filter(f => f.severity === 'hard');
  const seriousHits = anti.filter(f => f.severity === 'serious');
  const softHits = anti.filter(f => f.severity === 'softened' || f.severity === 'mild');

  // A seed / fried oil rejects on its own UNLESS the whole label still delivers
  // >= REDEEM_MIN_HITS essentials in a meaningful amount -- then it is OFFSET to neutral (never
  // recommended). Redemption clears the seed-oil flag from the reject tally but a serious flag still
  // remains, so ADD stays blocked and the ceiling is neutral.
  const redeemed = hits >= REDEEM_MIN_HITS;
  const seedOilHits = seriousHits.filter(f => REDEEMABLE_REJECT.has(f.category));
  const nonSeedSerious = seriousHits.filter(f => !REDEEMABLE_REJECT.has(f.category));
  const unredeemedSeedOil = seedOilHits.length > 0 && !redeemed;
  const offsetSeedOil = redeemed ? seedOilHits : [];

  if (hardHits.length > 0) {
    reasonsAgainst.push({ label: 'Hard-reject ingredients', items: hardHits.map(fmtFlag) });
  }
  if (nonSeedSerious.length > 0) {
    reasonsAgainst.push({ label: 'Serious anti-list flags', items: nonSeedSerious.map(fmtFlag) });
  }
  // The seed / fried oil rule, made legible in BOTH directions: a lone seed oil
  // rejects, but 3+ meaningful essentials offset it to neutral. The user sees which case fired and why.
  if (unredeemedSeedOil) {
    reasonsAgainst.push({
      label: 'Seed / fried oil \u2014 rejected',
      items: seedOilHits.map(f => `${fmtFlag(f)} \u00b7 needs 3+ essentials in a meaningful amount to be neutral (has ${hits})`),
    });
  }
  if (offsetSeedOil.length > 0) {
    reasonsAgainst.push({
      label: 'Seed / fried oil \u2014 offset to neutral',
      items: offsetSeedOil.map(f => `${fmtFlag(f)} \u00b7 offset by ${hits} meaningful essential${hits === 1 ? '' : 's'} \u2014 neutral, never recommended`),
    });
  }
  if (softHits.length > 0) {
    reasonsAgainst.push({ label: 'Mild / softened flags (nuance applied)', items: softHits.map(fmtFlag) });
  }
  const high = conflicts.filter(c => c.severity === 'high');
  if (high.length > 0) {
    reasonsAgainst.push({ label: 'High-severity conflicts', items: high.map(c => c.rule) });
  }

  // Ratified rule (§00.A): a scanned label carries NO form_alignment
  // (a photo cannot state chemical form), so alignmentScore is 0 for every real scan. The ADD
  // gate must therefore NOT require form when form is unassessed -- else no scanned product could
  // ever earn ADD. When form IS assessed (a future product-DB-backed scan), score>=1.0 still holds.
  // No form judgment is fabricated; an unreadable dimension simply stops penalising the verdict.
  let verdict: Verdict;
  if (high.length > 0 || hardHits.length > 0 || unredeemedSeedOil || nonSeedSerious.length >= 2) {
    verdict = 'REJECT';
  }
  else if (meaningful.length > 0 && seriousHits.length === 0 && !((alignment.aligned > 0 || alignment.misaligned > 0 || alignment.score > 0) && alignment.score < 1.0)) {
    verdict = 'ADD';
  }
  else if (meaningful.length > 0 || alignment.score >= 0.5 || goals.length > 0 || seriousHits.length > 0 || softHits.length > 0) {
    verdict = 'SAVE';
  }
  else {
    // Ingredient-checker default: "nothing bad found" reads NEUTRAL,
    // never a bare REJECT. Only a hard flag / 2+ serious / high conflict rejects (above), so
    // a clean paste or a nutrient-less food is NEUTRAL, not "rejected".
    verdict = 'SAVE';
  }
  return { verdict, reasonsFor, reasonsAgainst };
}

// ─── Scan orchestration + history ──────────────────────────────────────────

/** Monotonic id minter for scan-history entries (saved + recent). Date.now() alone collides
 *  when two scans land in the same millisecond, and the retired Date.now()+random(1000) scheme
 *  collided whenever two saves fell within ~1s -- a colliding saved id made a re-opened row
 *  resolve to the WRONG entry, so adopting the second saved scan silently re-added the
 *  first. Strictly-increasing ids remove the collision at the source. */
let _lastScanId = 0;
function nextScanId(): number {
  _lastScanId = Math.max(Date.now(), _lastScanId + 1);
  return _lastScanId;
}

/**
 * Persist a scan to the auto FIFO history, newest first, cap MAX_RECENT.
 * No name-dedup — scanned labels share a few low-cardinality container names
 * ('capsule', 'powder'), so deduping by name collapsed genuinely distinct products. Each
 * capture carries a unique id, so distinct scans each keep a slot up to the cap.
 */
function pushRecentScan(label: ScanLabel, result: ScanResult): void {
  const shape = getValidated(RECENT_SCANS_KEY, HistoryShapeSchema) ?? { items: [] };
  const items = [...shape.items];
  items.unshift({
    id: nextScanId(),
    ts: new Date().toISOString(),
    label,
    verdict: result.verdict,
    alignment: result.alignment,
    goals: result.goals,
    gapFills: result.gapFills,
  });
  setValidated(RECENT_SCANS_KEY, { items: items.slice(0, MAX_RECENT) }, HistoryShapeSchema);
}

/** Add a scan to the durable Saved shelf. Newest first, cap MAX_SAVED. Returns the
 *  new entry's id so the caller can reflect a 'saved' state. */
export function saveScan(label: ScanLabel, result: ScanResult): number {
  const shape = getValidated(SAVED_SCANS_KEY, HistoryShapeSchema) ?? { items: [] };
  const id = nextScanId();
  const items = [
    { id, ts: new Date().toISOString(), label, verdict: result.verdict, alignment: result.alignment, goals: result.goals, gapFills: result.gapFills },
    ...shape.items,
  ];
  setValidated(SAVED_SCANS_KEY, { items: items.slice(0, MAX_SAVED) }, HistoryShapeSchema);
  return id;
}

/** Remove one saved scan by id (the shelf × affordance). */
export function removeSaved(id: number): void {
  const shape = getValidated(SAVED_SCANS_KEY, HistoryShapeSchema) ?? { items: [] };
  setValidated(SAVED_SCANS_KEY, { items: shape.items.filter(i => i.id !== id) }, HistoryShapeSchema);
}

/**
 * Score a label through the scoring engine. logToRecent (default true) logs to
 * history, stashes the UI result, and emits scanner:scan-complete; the regimen
 * adopt path passes false to reuse scoring without polluting the log.
 */
function scan(label: ScanLabel, opts?: { logToRecent?: boolean }): ScanResult {
  const cfg = { logToRecent: true, ...opts };
  const corpus = loadScanCorpus();
  const nutrients: ScanNutrient[] = label.nutrients ?? [];
  const alignment = alignmentScore(nutrients);
  const dailyServings = Number.parseFloat(String(label.servings)) || 1;
  const effectiveCov = getEffectiveCoverage();
  const gapFills = nutrients
    .map(n => gapFillFor(n, dailyServings, effectiveCov))
    .filter((g): g is GapFill => g !== null);
  const hitInfo = meaningfulHits(nutrients, dailyServings);
  const goals = matchGoals(label, corpus);
  const anti = antiFlags(label, corpus);
  const conflicts = containerFlag();
  const { verdict, reasonsFor, reasonsAgainst } = decideVerdict(alignment, gapFills, anti, conflicts, goals, hitInfo.hits.length, corpus);
  const result: ScanResult = {
    label,
    alignment,
    gapFills,
    goals,
    anti,
    conflicts,
    verdict,
    reasonsFor,
    reasonsAgainst,
    hits: hitInfo.hits.length,
    hitEssentials: hitInfo.hits,
    hitsStrong: hitInfo.strong,
  };
  result.sparseNutrients = nutrients.length === 0;
  result.sparseIngredients = (label.ingredients ?? '').trim().length === 0;
  if (cfg.logToRecent) {
    pushRecentScan(label, result);
    (window as LegacyWindow).lcLastResult = result;
    emit('scanner:scan-complete', { captureId: String(Date.now()), verdict: mapVerdict(verdict) });
  }
  return result;
}

/**
 * Run a scan through the scoring engine. Always logs to history. Emits
 * `scanner:scan-complete` so subscribers re-render. Returns null on failure.
 */
export function runScan(label: ScanLabel): ScanResult | null {
  try {
    return scan(label, { logToRecent: true });
  }
  catch (e) {
    console.warn('[state/scanner] scan threw:', e);
    return null;
  }
}

/**
 * Score a label WITHOUT logging to history — the Confirm-step preview (surface the
 * Wallach flags + the mapping on the reads-so-far before the user commits). runScan is
 * the logging commit path; this never touches lcRecentScans_v1 nor fires the cascade.
 */
export function scoreLabel(label: ScanLabel): ScanResult | null {
  try {
    return scan(label, { logToRecent: false });
  }
  catch (e) {
    console.warn('[state/scanner] scoreLabel threw:', e);
    return null;
  }
}

/** Map the ADD/SAVE/REJECT verdict → the simpler aligns/partial/out event payload. */
function mapVerdict(v: Verdict): 'aligns' | 'partial' | 'out' {
  if (v === 'ADD') {
    return 'aligns';
  }
  if (v === 'SAVE') {
    return 'partial';
  }
  return 'out';
}

// ─── The bridge — expose the scoring engine for headless probes ───────────

if (typeof window !== 'undefined') {
  (window as LegacyWindow).lcScan = scan;
}
