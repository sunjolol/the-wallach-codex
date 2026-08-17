/**
 * state/scanner.ts — scan history + native OCR/verdict pipeline
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owns the Scanner surface's state: the scan-history FIFO + the native scoring
 * engine (Chunk 6b). The OCR → parse → verdict pipeline used to live in
 * the pre-TS inline dashboard (window.lcScan), but the page no longer loads it, so
 * the math lives here now — a faithful port. Every NUMBER + every doctrine
 * string still comes from Luneth's corpus (scanner-corpus-data.json, migrated
 * verbatim) and the Wallach targets DB; §00.A holds, nothing is invented.
 *
 * Pipeline (scan):
 *   alignmentScore (form-alignment tally) · gapFillFor (per-nutrient gap-fill %
 *   vs the EFFECTIVE coverage the Coverage surface shows — same matcher +
 *   delivery, so the two surfaces line up) · matchGoals (keyword + meaningful-
 *   nutrient goal inclusion) · antiFlags (anti-list with gluten/oat/high-oleic
 *   nuance) · decideVerdict (ADD/SAVE/REJECT ladder).
 *
 * gapFill's "current" = the assumed dietary baseline (corpus.dietaryBaseline,
 * verbatim) + the live regimen delivery from state/coverage.currentDelivery() —
 * i.e. legacy getEffectiveCoverage with the dead window.computeLiveCoverage
 * swapped for the migrated regimen state.
 *
 * Deliberate deviations from the legacy runtime (documented for Luneth's
 * end-pass): (1) matchGoals reads ess.target.low (the Round-99 shape) — legacy
 * matchGoalsRich read the pre-shape ess.low (then undefined → pctOfTarget never
 * fired), so goal-matching here actually evaluates nutrient meaningfulness;
 * (2) container conflicts are inert (OCR labels carry no container metadata);
 * (3) the Eden-severance guard is omitted (scanned product labels are never
 * Eden corpus items by construction).
 *
 * LS keys:
 *   'lcRecentScans_v1' — scan history (FIFO list, dedup by label.name, ≤5)
 *
 * §00 Zod boundary: getHistory() reads through getValidated against
 * HistoryShapeSchema; writes go through setValidated. Bad LS data → empty
 * array, never enters typed-land.
 *
 * The bridge: window.lcScan = scan (legacy-style callers + the regimen adopt
 * path + headless probes route through the native engine); window.lcLastResult
 * holds the most recent UI scan for views/scanner.ts.
 *
 * Legacy verdicts (preserved verbatim):
 *   'ADD'    — strong fit, recommend adopting into regimen
 *   'SAVE'   — worth considering, with caveats; goes to wishlist
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
import {
  currentDelivery,
  getOrCompute,
  getTargets,
  matchEssential,
} from './coverage.js';

export const RECENT_SCANS_KEY = 'lcRecentScans_v1';

/** The durable Saved shelf (SCAN-04) — items the user explicitly "Save for later". Separate
 *  from the auto RECENT_SCANS FIFO: no eviction on new scans, only removed by the user. */
export const SAVED_SCANS_KEY = 'lcSavedScans_v1';

/** Faithful to legacy MAX_RECENT — the history is capped at 5 entries. */
const MAX_RECENT = 5;

/** Cap the durable Saved shelf generously; it is user-curated, not auto-churned. */
const MAX_SAVED = 100;

/** Container-hint tokens the OCR parser emits when no product name is legible — humanised for
 *  display so a raw 'aluminum_can' never surfaces as a product name (SCAN-02). */
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
  /** #7-hits (Luneth 2026-08-16): essentials this label delivers a meaningful amount of
   *  (>= HIT_THRESHOLD of the WALLACH daily target -- never RDV; only the ~38 dosed
   *  essentials are eligible). A food-quality signal, distinct from coverage (full targets). */
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

/** Last scan, if any — useful for "show the most recent verdict" view. */
export function getLastScan(): HistoryEntry | null {
  return getHistory()[0] ?? null;
}

/** The durable Saved shelf, newest first (SCAN-04). Bad LS data → empty. */
export function getSaved(): HistoryEntry[] {
  return getValidated(SAVED_SCANS_KEY, HistoryShapeSchema)?.items ?? [];
}

let lastResult: ScanResult | null = null;

/** The most recent scan result (in-memory) — views/scanner.ts renders from this. */
export function getLastResult(): ScanResult | null {
  return lastResult;
}

// ─── Unit math (legacy normalize / formatAmt / unitConv ports) ─────────────

/** Normalize an amount to a comparison family: mass→mcg base, IU→iu. */
function normalize(amount: number, unit: string | undefined): Norm | null {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return null;
  }
  const u = (unit ?? '').toLowerCase().trim();
  if (u === 'mcg') {
    return { family: 'mass_mcg', value: amount };
  }
  if (u === 'mg') {
    return { family: 'mass_mcg', value: amount * 1000 };
  }
  if (u === 'g') {
    return { family: 'mass_mcg', value: amount * 1000000 };
  }
  if (u === 'iu') {
    return { family: 'iu', value: amount };
  }
  return null;
}

/** Convert a value between mass units / IU. Returns null for incompatible pairs. */
function unitConv(value: number, fromUnit: string | undefined, toUnit: string | undefined): number | null {
  const f = (fromUnit ?? '').toLowerCase();
  const tu = (toUnit ?? '').toLowerCase();
  if (f === tu) {
    return value;
  }
  if (f === 'iu' || tu === 'iu') {
    return null;
  }
  let mg: number;
  if (f === 'mg') {
    mg = value;
  }
  else if (f === 'mcg') {
    mg = value / 1000;
  }
  else if (f === 'g') {
    mg = value * 1000;
  }
  else {
    return null;
  }
  if (tu === 'mg') {
    return mg;
  }
  if (tu === 'mcg') {
    return mg * 1000;
  }
  if (tu === 'g') {
    return mg / 1000;
  }
  return null;
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

/** Tally per-nutrient form alignment into a 0..2 score (legacy alignmentScore). */
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

/** Effective current coverage = dietary baseline (verbatim) + live regimen delivery. */
function getEffectiveCoverage(): EffectiveCov {
  const corpus = loadScanCorpus();
  const targets = getTargets();
  const live = currentDelivery();

  const dbByTargetName: EffectiveCov = {};
  for (const [dbKey, dbEntry] of Object.entries(corpus.dietaryBaseline)) {
    const matched = matchEssential(dbKey);
    if (matched !== null) {
      dbByTargetName[matched.name] = { amount: dbEntry.amount, unit: dbEntry.unit };
    }
  }

  const base: EffectiveCov = {};
  for (const t of targets) {
    const tgt = essTarget(t);
    if (tgt === null || tgt.low === undefined || tgt.low === null) {
      continue;
    }
    const targetUnit = (tgt.unit ?? 'mg').toLowerCase();
    let amount = 0;
    const dbEntry = dbByTargetName[t.name];
    if (dbEntry !== undefined) {
      const conv = unitConv(dbEntry.amount, dbEntry.unit, targetUnit);
      if (conv !== null) {
        amount += conv;
      }
    }
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

/** #7-hits: >= this fraction of the WALLACH daily target counts as a meaningful "hit"
 *  (Luneth 2026-08-16, grounded on real pumpkin-seed numbers). A DISPLAY threshold, always
 *  measured against the Wallach target (section 00.A) -- never an RDV/DV. */
const HIT_THRESHOLD = 0.03;
/** #7-hits: >= this fraction of the Wallach target is a STRONG hit (matches the 'Meaningful
 *  gap-fill' reason's >=10% cut). A depth signal atop the breadth count. */
const HIT_STRONG = 0.10;

/** Essentials this label delivers a meaningful amount of: >= HIT_THRESHOLD of the Wallach
 *  target, per serving, UNCAPPED by current coverage (a stable property of the food, not of
 *  your regimen). Only the ~38 essentials with a Wallach dose are eligible; where Wallach is
 *  silent there is no target to measure against, so it cannot be a hit (an honest gap). */
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

// ─── Projected coverage delta (the Scan → Result "47 → 55" readout) ──────────

/**
 * The projected coverage delta if this label's confirmed reads were adopted, in the
 * Coverage tab's OWN frame so the numbers agree across surfaces: `before` is the live
 * snapshot coveredCount (the 47/90 the user sees everywhere), and an essential counts
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

// ─── Anti-list flags (legacy antiFlags port, nuance preserved) ─────────────

const OAT_DERIVED = new Set(['oats', 'oat', 'oatmeal', 'oat flour', 'oat syrup', 'oat groats', 'oat bran']);

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

    if (cat === 'gluten sources') {
      // Hard gluten proteins = the gluten-category hits that sit on the unconditional hardRejectTerms
      // list (data-driven; includes the ratified wheat-derivative grains). Oats are never on that list.
      const hardHits = hits.filter(h => hardReject.has(h));
      const oatHits = hits.filter(h => OAT_DERIVED.has(h));
      const oatGfPre = /gluten[-\s]+free[^,]+\b(?:oats|oat|oatmeal|oat\s+flour|oat\s+groats|oat\s+bran|oat\s+syrup)\b/i;
      const oatGfPost = /\b(?:oats|oat|oatmeal|oat\s+flour|oat\s+groats|oat\s+bran|oat\s+syrup)\b[^,]+gluten[-\s]+free/i;
      const hasGFOatsAnchor = oatGfPre.test(text) || oatGfPost.test(text);

      if (hardHits.length > 0) {
        flag.nuance = `Hard gluten proteins detected: ${hardHits.map(t => `"${t}"`).join(', ')}. Wallach-direct: wheat / barley / rye / malt / spelt are the actual gluten proteins. No softening — a gluten free oats declaration cannot shut off the trigger for actual gluten elsewhere on the label.`;
      }
      else if (oatHits.length > 0) {
        if (hasGFOatsAnchor) {
          flag.nuance = `Oat-anchored gluten-free declaration detected on the label. Per the operational rule: once a brand certifies ANY oat ingredient as GF, they are operating in a GF-aware supply chain across all oat ingredients in that product. All oat hits (${oatHits.map(t => `"${t}"`).join(', ')}) are presumed gluten-free. Flag softened.`;
          flag.softened = true;
        }
        else {
          flag.nuance = `Oat ingredients detected (${oatHits.map(t => `"${t}"`).join(', ')}) with no gluten free oats declaration on the label. Standard commercial oats carry real cross-contamination risk from shared supply chains. A gluten-free claim attached to a non-oat ingredient (e.g., gluten-free pasta) does NOT certify the oats. Flag stays serious until brand certifies oat GF status.`;
        }
      }
    }

    let severity: AntiFlag['severity'] = 'mild';
    for (const term of hits) {
      if (hardReject.has(term)) {
        severity = 'hard';
        break;
      }
    }
    if (severity !== 'hard') {
      if (corpus.seriousAnti.includes(cat) && flag.softened !== true) {
        severity = 'serious';
      }
      else if (flag.softened === true) {
        severity = 'softened';
      }
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

// ─── Verdict ladder (legacy decideVerdict port) ────────────────────────────

function decideVerdict(
  alignment: Alignment,
  gapFills: GapFill[],
  anti: AntiFlag[],
  conflicts: Conflict[],
  goals: string[],
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

  const hardHits = anti.filter(f => f.severity === 'hard');
  const seriousHits = anti.filter(f => f.severity === 'serious');
  const softHits = anti.filter(f => f.severity === 'softened' || f.severity === 'mild');
  if (hardHits.length > 0) {
    reasonsAgainst.push({ label: 'Hard-reject ingredients', items: hardHits.map(f => f.category) });
  }
  if (seriousHits.length > 0) {
    reasonsAgainst.push({ label: 'Serious anti-list flags', items: seriousHits.map(f => f.category) });
  }
  if (softHits.length > 0) {
    reasonsAgainst.push({ label: 'Mild / softened flags (nuance applied)', items: softHits.map(f => f.category) });
  }
  const high = conflicts.filter(c => c.severity === 'high');
  if (high.length > 0) {
    reasonsAgainst.push({ label: 'High-severity conflicts', items: high.map(c => c.rule) });
  }

  // R2-4 (Luneth-ratified 'neutral', section 00.A): a scanned label carries NO form_alignment
  // (a photo cannot state chemical form), so alignmentScore is 0 for every real scan. The ADD
  // gate must therefore NOT require form when form is unassessed -- else no scanned product could
  // ever earn ADD. When form IS assessed (a future product-DB-backed scan), score>=1.0 still holds.
  // No form judgment is fabricated; an unreadable dimension simply stops penalising the verdict.
  let verdict: Verdict;
  if (high.length > 0 || hardHits.length > 0 || seriousHits.length >= 2) {
    verdict = 'REJECT';
  }
  else if (meaningful.length > 0 && seriousHits.length === 0 && !((alignment.aligned > 0 || alignment.misaligned > 0 || alignment.score > 0) && alignment.score < 1.0)) {
    verdict = 'ADD';
  }
  else if (meaningful.length > 0 || alignment.score >= 0.5 || goals.length > 0 || seriousHits.length > 0 || softHits.length > 0) {
    verdict = 'SAVE';
  }
  else {
    // Ingredient-checker default (Luneth-ratified): "nothing bad found" reads NEUTRAL,
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
 *  resolve to the WRONG entry (R2-7), so adopting the second saved scan silently re-added the
 *  first. Strictly-increasing ids remove the collision at the source. */
let _lastScanId = 0;
function nextScanId(): number {
  _lastScanId = Math.max(Date.now(), _lastScanId + 1);
  return _lastScanId;
}

/**
 * Persist a scan to the auto FIFO history, newest first, cap MAX_RECENT.
 * SCAN-03: no name-dedup — scanned labels share a few low-cardinality container names
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

/** Add a scan to the durable Saved shelf (SCAN-04). Newest first, cap MAX_SAVED. Returns the
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

/** Remove one saved scan by id (the shelf × affordance, SCAN-04). */
export function removeSaved(id: number): void {
  const shape = getValidated(SAVED_SCANS_KEY, HistoryShapeSchema) ?? { items: [] };
  setValidated(SAVED_SCANS_KEY, { items: shape.items.filter(i => i.id !== id) }, HistoryShapeSchema);
}

/**
 * Score a label through the native engine. logToRecent (default true) logs to
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
  const { verdict, reasonsFor, reasonsAgainst } = decideVerdict(alignment, gapFills, anti, conflicts, goals, corpus);
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
    lastResult = result;
    (window as LegacyWindow).lcLastResult = result;
    emit('scanner:scan-complete', { captureId: String(Date.now()), verdict: mapVerdict(verdict) });
  }
  return result;
}

/**
 * Run a scan through the native engine. Always logs to history. Emits
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

/** Map legacy ADD/SAVE/REJECT → the simpler aligns/partial/out event payload. */
function mapVerdict(v: Verdict): 'aligns' | 'partial' | 'out' {
  if (v === 'ADD') {
    return 'aligns';
  }
  if (v === 'SAVE') {
    return 'partial';
  }
  return 'out';
}

// ─── The bridge — expose the native engine for legacy-style callers + probes ──

if (typeof window !== 'undefined') {
  (window as LegacyWindow).lcScan = scan;
}
