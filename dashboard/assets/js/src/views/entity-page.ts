/**
 * views/entity-page.ts — the unified ENTITY PAGE render (Phase H2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The single presentation unit for an essential (Phase H2 chunk 1b; conditions +
 * products follow). A PURE PROJECTION of the generated entity-page artifact
 * (state/entity-page) joined with the sealed corpus + search index at render time
 * — this view holds no canonical value as a literal (§00.B single-source, R1) and
 * no per-entity content branch (entity_render_is_projection).
 *
 * Section order: back · hero · lede · "At a glance" (Wallach target + why-this-number
 * + live coverage bar + best sources) · "Worth knowing" (search facet cards) ·
 * "Need help with a condition?" (orange condition pills) · "Works with" (green
 * nutrient pills) · "The full record" (kind groups + keyword filter) · "Keep
 * exploring" (violet pills). Colour is data-driven: record kinds carry the family
 * from state/copy::kindCategory in a data-family attr; search facets map to a family
 * in CSS by data-facet — the family word is NEVER a TS literal (view_category_not_hardcoded).
 *
 * Mounts inside #drawer-knowledge-mount as the essential deep-view (kd-ep-*), so the
 * drawer chrome + the reused kd-claim__dose|legend + kd-omega rules from
 * drawer-knowledge.css apply. The "at a glance" card joins the live coverage tile
 * (tileOf) + the recommender ranking (rankedSourcesForEssential); it imports state/ +
 * knowledge-corpus/products but NEVER views/knowledge.ts (a cycle). The lede + the short
 * "why this number" hover come from the user-approved entity-copy store (state/entity-copy),
 * never auto-derived.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import fattyAcidClarityData from '../../../data/fatty-acid-clarity-data.json';
import mechanismClarityData from '../../../data/mechanism-clarity-data.json';
import { plural } from '../core/format.js';
import {
  type ConditionPage,
  type CorpusClaim,
  type CorpusCondition,
  type EntityKindGroup,
  type EssentialPage,
  FattyAcidClaritySchema,
  type MechField,
  type MechSide,
  MechanismClaritySchema,
  type OmegaFamily,
  SEARCH_FACETS,
  type SearchClaim,
} from '../core/schemas/index.js';
import { conditionCategory } from '../state/condition-categories.js';
import { facetLabel, kindCategory, kindLabel, ui } from '../state/copy.js';
import {
  conditionDisplayName,
  essentialDisplayName,
  getBookLabel,
  getClaim,
  getCondition,
  getEssentialByLayoutKey,
  getEssentialBySlug,
  humanizeSlug,
  resolveClaims,
  umbrellaChildren,
} from '../state/corpus.js';
import { type CoverageSnapshot, type CoverageStatus, type CoverageTile, essentialNameOf, pdmGoalProvenance, type PdmGroupSummary, rankedPdmSources } from '../state/coverage.js';
import { essentialLede, essentialWhy } from '../state/entity-copy.js';
import { getConditionPage, getEssentialPage } from '../state/entity-page.js';
import { glossaryDef } from '../state/glossary.js';
import { type CoverageRec, rankProductsForCoverage } from '../state/recommender.js';
import { composeCite, getSearchClaim } from '../state/search.js';
import { glossify } from './glossify.js';
import { conditionSynopsis, essentialsInRoles, familiarEssentialName, tileOf } from './knowledge-corpus.js';
import { type RankedSourceRow, rankedSourcesForEssential } from './knowledge-products.js';

// The char class uses hex escapes \x22 \x27 for " and ' rather than the literal
// quotes: the clean-view prose scanner (views_no_inline_prose) has no regex parser,
// so a bare " inside a regex reads to it as a string start and swallows the map below.
function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>\x22\x27]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

// ─── Claim primitives (owned copy; the knowledge-corpus originals retire later) ──
// Faithful port of the dose / Fig-8-1 / table-header rendering so a dose claim shows
// a scannable value + column legend instead of an unlabeled run of numbers. The dose
// + legend fragments keep the kd-claim__* class names so the perfected drawer-knowledge.css
// rules apply verbatim (the entity card itself is the new kd-ep-claim namespace).

/** Collapse a book verbatim's hard line-wraps into one clean line. */
function collapseWS(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** A short "50 mg / daily" dose label, or '' when no structured dose. */
function formatDose(dose: CorpusClaim['dose']): string {
  if (dose === null || dose === undefined) {
    return '';
  }
  const amount = (typeof dose.amount === 'number' || typeof dose.amount === 'string') ? String(dose.amount) : '';
  const unit = typeof dose.unit === 'string' ? dose.unit : '';
  const period = typeof dose.period === 'string' ? dose.period : '';
  const head = [amount, unit].filter(s => s.length > 0).join(' ');
  if (head.length === 0) {
    return '';
  }
  return period.length > 0 ? `${head} / ${period}` : head;
}

// A row of Wallach's Fig. 8-1 base-line dose table (Let's Play Doctor, ch. 8), keyed
// off the dose atom's for_condition the derive step projects into the embed.
const FIG_8_1_FOR_CONDITION = 'base-line supplement program (true supplement need)';
function isFig81Row(claim: CorpusClaim): boolean {
  return claim.dose?.for_condition === FIG_8_1_FOR_CONDITION;
}

/** A legend column header wrapped as a glossary tooltip (definition from the lexicon). */
function glossCol(term: string): string {
  const def = glossaryDef(term);
  if (def === null) {
    return escHTML(term);
  }
  return `<span class="gloss" tabindex="0" role="button" aria-label="${escHTML(term)}: ${escHTML(def)}" data-def="${escHTML(def)}">${escHTML(term)}</span>`;
}

/** The column legend for a Fig. 8-1 dose-table row — Wallach's own header names, glossed. */
function renderFig81Legend(): string {
  const cols = ['RDA', 'True Supplement Need', '30-Day Pharmacologic'].map(glossCol).join(' · ');
  return `
      <div class="kd-claim__legend" role="note">
        <span class="kd-claim__legend-eyebrow">Fig. 8-1 columns</span>
        <span class="kd-claim__legend-cols">Nutrient · ${cols}</span>
      </div>`;
}

/** The clicked nutrient's OWN row from a Fig. 8-1 verbatim (drops the bled next row + footnotes). */
function fig81OwnRow(verbatim: string): string {
  const lines = verbatim.split('\n');
  const kept: string[] = [lines[0] ?? ''];
  for (let i = 1; i < lines.length; i++) {
    const t = (lines[i] ?? '').trim();
    if (t.length === 0 || /^[A-Z]/.test(t) || t.startsWith('*')) {
      break;
    }
    kept.push(lines[i] ?? '');
  }
  return kept.join('\n');
}

/** The context label for a dose value — WHAT the number is. Sealed data only (§00.A). */
function doseContextLabel(claim: CorpusClaim): string {
  if (isFig81Row(claim)) {
    return 'True Supplement Need';
  }
  // applies_to WINS over for_condition: when a claim maps several essentials but doses only
  // some, WHOSE number this is outranks what it is for. Without this the card renders a naked
  // "250-400 mcg / daily" on cobalt's page — directly contradicting the alert above it, which
  // says Wallach states no cobalt amount. The target was already gone; the CARD still lied.
  const applies = claim.dose?.applies_to;
  if (Array.isArray(applies) && applies.length > 0) {
    const names = applies.map(sl => essentialNameOf(sl) || sl).join(' + ');
    return fillTokens('kd_claim_dose_appliesto', { name: names });
  }
  const fc = (claim.dose?.for_condition ?? '').trim();
  return fc.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/** The dose card at the head of a dose claim: bold VALUE + a label naming what it is. */
function renderDoseBlock(claim: CorpusClaim): string {
  const value = formatDose(claim.dose);
  if (value.length === 0) {
    return '';
  }
  const label = doseContextLabel(claim);
  const labelHTML = label.length > 0
    ? `<span class="kd-claim__dose-label">${escHTML(label)}</span>`
    : '';
  return `
      <div class="kd-claim__dose">${labelHTML}<span class="kd-claim__dose-value">${escHTML(value)}</span></div>`;
}

/** Attribution header for a claim whose paraphrase named an internal Table/Figure/page. */
function renderRefHeader(label: string): string {
  return `
      <div class="kd-claim__legend" role="note">
        <span class="kd-claim__legend-eyebrow">${escHTML(label)}</span>
        <span class="kd-claim__legend-cols">as printed in Wallach's book</span>
      </div>`;
}

// ─── Two card renderers ─────────────────────────────────────────────────────

/** Truncate a paraphrase for the collapsed summary line, on a word boundary. */
function truncate(s: string, max: number): string {
  if (s.length <= max) {
    return s;
  }
  return s.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

/**
 * A search Q&A card ("?" badge): question → answer_short preview → full answer +
 * Wallach's exact words + the composed citation + topic tags. Resolves a SearchClaim.
 */
export function renderSearchCard(claim: SearchClaim): string {
  const cite = composeCite(claim);
  const tags = claim.topics.map(t => `<span class="kd-ep-tag">#${escHTML(t)}</span>`).join('');
  const preview = claim.answer_short.length > 0 ? `<span class="kd-ep-claim__preview">${escHTML(claim.answer_short)}</span>` : '';
  const short = claim.answer_short.length > 0 ? `<div class="kd-ep-claim__short">${escHTML(claim.answer_short)}</div>` : '';
  return `<details class="kd-ep-claim">
    <summary class="kd-ep-claim__summary">
      <span class="kd-ep-claim__badge">?</span>
      <span class="kd-ep-claim__qblock"><span class="kd-ep-claim__q">${escHTML(claim.question)}</span>${preview}</span>
      <span class="kd-ep-claim__chev">▸</span>
    </summary>
    <div class="kd-ep-claim__body">
      ${short}
      ${claim.answer.trim() === claim.answer_short.trim() ? '' : `<div class="kd-ep-claim__answer">${glossify(claim.answer)}</div>`}
      <blockquote class="kd-ep-claim__verbatim">“${glossify(collapseWS(claim.verbatim))}”</blockquote>
      ${cite.length > 0 ? `<div class="kd-ep-claim__cite">— Dr. Joel Wallach · ${escHTML(cite)}</div>` : ''}
      ${tags.length > 0 ? `<div class="kd-ep-claim__tags">${tags}</div>` : ''}
    </div>
  </details>`;
}

/**
 * A record/statement card (neutral § badge): the truncated paraphrase summary →
 * full paraphrase + optional dose card / table header + Wallach's exact words +
 * citation. Resolves a CorpusClaim.
 */
function renderRecordClaim(claim: CorpusClaim, open = false): string {
  const isTable = isFig81Row(claim);
  const refLabel = (!isTable && typeof claim.source_table === 'string' && claim.source_table.length > 0)
    ? claim.source_table
    : null;
  const shownVerbatim = isTable ? fig81OwnRow(claim.verbatim) : collapseWS(claim.verbatim);
  const verbatimCls = isTable ? 'kd-ep-claim__verbatim kd-ep-claim__verbatim--rows' : 'kd-ep-claim__verbatim';
  // The Full-Record filter (applyRecordFilter) matches the card's rendered TEXT, but a record
  // card never prints the enrichment QUESTION (the words a user would type) — only the paraphrase
  // + verbatim. Carry the question as a data-attr so the filter can match it too, without changing
  // what the card shows (Luneth 2026-07-28; closes the RARE-000306 "no result" finding).
  const enrichQ = getSearchClaim(claim.id)?.question ?? '';
  const qAttr = enrichQ.length > 0 ? ` data-question="${escHTML(enrichQ)}"` : '';
  return `<details class="kd-ep-claim kd-ep-claim--record"${open ? ' open' : ''}${qAttr}>
    <summary class="kd-ep-claim__summary">
      <span class="kd-ep-claim__badge">?</span>
      <span class="kd-ep-claim__qblock"><span class="kd-ep-claim__q">${escHTML(truncate(claim.claim_text, 116))}</span><span class="kd-ep-claim__full">${glossify(claim.claim_text)}</span></span>
      <span class="kd-ep-claim__chev">▸</span>
    </summary>
    <div class="kd-ep-claim__body">
      ${renderDoseBlock(claim)}
      ${isTable ? renderFig81Legend() : ''}
      ${refLabel !== null ? renderRefHeader(refLabel) : ''}
      <blockquote class="${verbatimCls}">${glossify(shownVerbatim)}</blockquote>
      <div class="kd-ep-claim__cite">CITED · ${escHTML(getBookLabel(claim.book))}</div>
    </div>
  </details>`;
}

// ─── Status presentation (small pure mappers; kept local to avoid a knowledge.ts cycle) ──

function statusLabel(s: CoverageStatus): string {
  switch (s) {
    case 'covered':
    case 'trace':
      return 'COVERED';
    case 'partial':
      return 'PARTIAL';
    case 'gap':
      return 'GAP';
    default:
      return 'PENDING';
  }
}

function statusPillClass(s: CoverageStatus): string {
  if (s === 'covered' || s === 'trace') {
    return 'kd-essential-deep__status-pill--ok';
  }
  if (s === 'partial' || s === 'gap') {
    return 'kd-essential-deep__status-pill--warn';
  }
  return 'kd-essential-deep__status-pill--pending';
}

/** Group-thousands a Wallach target number for display (1500 → "1,500"). */
function fmtTarget(n: number): string {
  if (!Number.isFinite(n)) {
    return '0';
  }
  const r = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return r.toLocaleString('en-US');
}

// ─── Section building blocks ────────────────────────────────────────────────

/** A section divider label + optional muted hint (short chrome copy; not prose). */
function seclabel(label: string, hint?: string): string {
  const h = (hint !== undefined && hint.length > 0) ? `<span class="kd-ep-seclabel__hint">${escHTML(hint)}</span>` : '';
  return `<div class="kd-ep-seclabel">${escHTML(label)}${h}</div>`;
}

/** One navigable pill — a data-attr hook the drawer's existing click handler routes on. */
function pill(display: string, attr: string, val: string, cls: string): string {
  return `<button class="kd-ep-pill ${cls}" type="button" ${attr}="${escHTML(val)}">${escHTML(display)}</button>`;
}

/** A cloud of pills: the first `showN` inline, the rest behind a native "show all" toggle. */
function pillCloud(pills: string[], showN: number): string {
  const head = pills.slice(0, showN).join('');
  const rest = pills.slice(showN);
  const more = rest.length > 0
    ? `<details class="kd-ep-more"><summary>Show all ${pills.length}</summary><div class="kd-ep-more__body kd-ep-cloud">${rest.join('')}</div></details>`
    : '';
  return `<div class="kd-ep-cloud">${head}</div>${more}`;
}

/** Replace the {n} token in a store lead with a pluralized count phrase. */
function leadWithCount(id: string, n: number, noun: string): string {
  const raw = ui(id);
  if (raw.length === 0) {
    return '';
  }
  return raw.replace('{n}', `${n} ${noun}${n === 1 ? '' : 's'}`);
}

// ─── "At a glance" — Wallach target + why-this-number + live coverage + best sources ──

/** The lowest cost-per-delivered-unit product among the ranked sources (the "best value" tag). */
function bestValueProductId(sources: RankedSourceRow[]): string | null {
  let best: string | null = null;
  let bestCpu = Infinity;
  for (const s of sources) {
    if (s.price === null || s.amount <= 0) {
      continue;
    }
    const cpu = s.price / s.amount;
    if (cpu < bestCpu) {
      bestCpu = cpu;
      best = s.productId;
    }
  }
  return best;
}

/** One best-source row (the demo's ep-src style) — clickable to the product detail panel. */
function srcRow(s: RankedSourceRow, isBest: boolean): string {
  const price = s.price !== null ? `$${s.price.toFixed(2)}` : '—';
  const tag = isBest ? '<span class="kd-ep-vtag">best value</span>' : '';
  return `<button class="kd-ep-src" type="button" data-kd-product="${escHTML(s.productId)}">
      <span class="kd-ep-src__ico"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="8" width="12" height="13" rx="2"/><path d="M9 8V5.5h6V8"/></svg></span>
      <span class="kd-ep-src__nm">${escHTML(s.name)}${tag}</span>
      <span class="kd-ep-src__amt">${fmtTarget(s.amount)} ${escHTML(s.unit)}</span>
      <span class="kd-ep-src__pr">${price}</span>
      <span class="kd-ep-src__chev">›</span>
    </button>`;
}

function renderAtAGlance(layoutKey: string, slug: string | null, tile: CoverageTile | null, status: CoverageStatus, snapshot: CoverageSnapshot | null, showSources = true): string {
  // Plant-derived GROUP tiles carry no per-element dose — the 34 trace_pdm minerals share ONE
  // meter (Σ plant-derived vehicle mg vs the 924 mg Wallach group goal). Render the group
  // treatment, not the per-element target/pending logic.
  if (tile?.pdmGroup === true && snapshot?.pdmGroup != null) {
    return renderPdmGroupGlance(snapshot.pdmGroup);
  }
  // A MIRROR states no amount of its own — Wallach's requirement for it is met through another
  // essential. Render the explanation IN PLACE of the target box: a tile with no number and no
  // reason is indistinguishable from one we simply have not mined yet, and that ambiguity is
  // what this treatment exists to remove (Luneth 2026-07-15: the special case must be
  // impossible to misread, so nobody supplements against a goal we never stated).
  if (tile?.mirrorsOf != null && tile.mirrorsOf.length > 0) {
    return renderMirrorGlance(tile);
  }
  // Present-by-default / non-essential: the absent number is DELIBERATE, so state WHY in place of
  // the generic "unmined gap" copy - the same ambiguity the mirror treatment above removes.
  if (tile?.noTargetReason === 'present_stated_zero' || tile?.noTargetReason === 'present_structural') {
    return renderPresentGlance(tile);
  }
  if (tile?.noTargetReason === 'non_essential') {
    return renderNonEssentialGlance(layoutKey);
  }
  const ivt = tile?.intakeVsTarget ?? null;
  const why = slug !== null ? essentialWhy(slug) : '';
  const whyHTML = why.length > 0
    ? `<span class="kd-ep-why">why this number?<span class="kd-ep-tip">${escHTML(why)}</span></span>`
    : '';
  const targetHTML = ivt !== null
    ? `<div class="kd-ep-v">${fmtTarget(ivt.targetLow)}${ivt.targetHigh !== ivt.targetLow ? '–' + fmtTarget(ivt.targetHigh) : ''}<small> ${escHTML(ivt.unit)}</small></div>`
    : `<div class="kd-ep-gap">${escHTML(ui('ep_no_target'))}</div>`;
  // Coverage: the demo's ep-bar fed by REAL regimen delivery vs the Wallach target; a
  // trace essential (no numeric target) falls back to the covered/not-covered pill.
  let coverageHTML: string;
  if (ivt !== null) {
    const pct = Math.max(0, Math.round((tile?.fillPercent ?? 0) * 100));
    const barPct = Math.min(100, pct);
    coverageHTML = `<div class="kd-ep-k">Your coverage</div>
        <div class="kd-ep-v">${fmtTarget(ivt.deliveredAmount)}<small> / ${fmtTarget(ivt.targetLow)} ${escHTML(ivt.unit)}</small></div>
        <div class="kd-ep-bar${barFillClass(status)}"><i style="width:${barPct}%"></i></div>
        <div class="kd-ep-sub">${pct}% ${escHTML(ui('ep_coverage_of_target'))}</div>`;
  }
  else {
    coverageHTML = `<div class="kd-ep-k">Your coverage</div>
        <div class="kd-ep-readout"><span class="kd-essential-deep__status-pill ${statusPillClass(status)}">● ${statusLabel(status)}</span></div>`;
  }
  const sourcesHTML = showSources ? renderSourcesBlock(layoutKey) : '';
  return `<div class="kd-ep-op">
    <div class="kd-ep-op__grid">
      <div>
        <div class="kd-ep-k">Wallach daily target</div>
        ${targetHTML}
        ${whyHTML}
      </div>
      <div>
        ${coverageHTML}
      </div>
    </div>
    ${sourcesHTML}
  </div>`;
}

/**
 * The "Best Youngevity sources" list for an essential — the recommender ranking in the demo's
 * ep-src row style. Top 5, but if the best-value product ranks 6th or lower it is swapped into the
 * last visible slot so its "best value" tag is ALWAYS shown, never buried under "Show all". Shared
 * by the standard glance + the non-essential glance (omega-9 lists its label composition too — the
 * mg is what a product CONTAINS, never a target · S00.A). '' when no product carries it.
 */
function renderSourcesBlock(layoutKey: string): string {
  const sources = rankedSourcesForEssential(layoutKey);
  if (sources.length === 0) {
    return '';
  }
  const bestId = bestValueProductId(sources);
  const bestIdx = bestId !== null ? sources.findIndex(s => s.productId === bestId) : -1;
  const TOP = 5;
  const visible = sources.slice(0, TOP);
  if (bestIdx >= TOP) {
    const bestRow = sources[bestIdx];
    if (bestRow !== undefined && visible.length === TOP) {
      visible[TOP - 1] = bestRow;
    }
  }
  const visibleIds = new Set(visible.map(s => s.productId));
  const rest = sources.filter(s => !visibleIds.has(s.productId));
  const head = visible.map(s => srcRow(s, s.productId === bestId)).join('');
  const more = rest.length > 0
    ? `<details class="kd-ep-more"><summary>Show all ${sources.length} sources</summary><div class="kd-ep-more__body">${rest.map(s => srcRow(s, false)).join('')}</div></details>`
    : '';
  return `<hr class="kd-ep-op__div">
      <div class="kd-ep-k kd-ep-op__srclabel">Best Youngevity sources</div>
      ${head}${more}`;
}

// ─── Plant-derived GROUP "at a glance" (the 34 trace_pdm minerals, scored as one) ──

/** Green fill once the goal is met (covered), else the default orange "in progress". */
function barFillClass(s: CoverageStatus): string {
  return (s === 'covered' || s === 'trace') ? ' kd-ep-bar--met' : '';
}

/** Fill {token} placeholders in a copy-store string (the numbers come from data, never the store). */
function fillTokens(id: string, tokens: Record<string, string>): string {
  let raw = ui(id);
  for (const [k, v] of Object.entries(tokens)) {
    raw = raw.replace(`{${k}}`, v);
  }
  return raw;
}

function pdmVerdictWord(s: CoverageStatus): string {
  if (s === 'covered' || s === 'trace') {
    return 'covered';
  }
  if (s === 'partial') {
    return 'partial';
  }
  if (s === 'gap') {
    return 'below goal';
  }
  return 'not covered';
}

function pdmSrcRow(s: { productId: string; name: string; mg: number }): string {
  return `<button class="kd-ep-src" type="button" data-kd-product="${escHTML(s.productId)}">
      <span class="kd-ep-src__ico"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="8" width="12" height="13" rx="2"/><path d="M9 8V5.5h6V8"/></svg></span>
      <span class="kd-ep-src__nm">${escHTML(s.name)}</span>
      <span class="kd-ep-src__amt">${fmtTarget(s.mg)} mg</span>
      <span class="kd-ep-src__chev">›</span>
    </button>`;
}

/**
 * The MIRROR treatment: this essential has no Wallach amount and never will, because his
 * position is that its requirement is met through another essential. Replaces the target box
 * with (a) an explicit "no target, deliberately" statement, (b) the mirrored coverage bar, and
 * (c) the alert + a jump to the essential that actually carries the dose.
 *
 * §00.A: every sentence in the alert is Wallach's position, held single-copy in view-copy.json
 * (R4) — nothing here invents an amount, and the bar reads the mirrored tile's fill, never a
 * cobalt number. Cobalt is the only case today; the treatment keys off target.kind, not a slug.
 */
function renderMirrorGlance(tile: CoverageTile): string {
  const src = tile.mirrorsOf ?? '';
  // The layout key carries the disambiguating parenthetical ("Vitamin B12 (Cobalamin)") because
  // it must be unique across 91 essentials. In running copy that reads as noise, so the short
  // form is used for display only — same essential, same slug, just not shouted twice.
  const short = src.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const pct = Math.max(0, Math.round(tile.fillPercent * 100));
  const barPct = Math.min(100, pct);
  const cta = src.length > 0
    ? `<button class="kd-ep-mirror__cta" type="button" data-kd-essential="${escHTML(src)}">
        <span class="kd-ep-mirror__cta-nm">${escHTML(short)}</span>
        <span class="kd-ep-mirror__cta-go">${escHTML(ui('kd_ep_mirror_cta'))}</span>
        <span class="kd-ep-mirror__cta-chev" aria-hidden="true">›</span>
      </button>`
    : '';
  return `<div class="kd-ep-op">
    <div class="kd-ep-op__grid">
      <div>
        <div class="kd-ep-k">${escHTML(ui('kd_ep_mirror_targetlabel'))}</div>
        <div class="kd-ep-gap">${escHTML(ui('kd_ep_mirror_notarget'))}</div>
      </div>
      <div>
        <div class="kd-ep-k">${escHTML(ui('kd_ep_mirror_covlabel'))} <span class="kd-ep-pdm-tag">${escHTML(fillTokens('kd_ep_mirror_via', { name: short }))}</span></div>
        <div class="kd-ep-v">${pct}<small>%</small></div>
        <div class="kd-ep-bar${barFillClass(tile.status)}"><i style="width:${barPct}%"></i></div>
        <div class="kd-ep-sub">${escHTML(fillTokens('kd_ep_mirror_covof', { name: short }))}</div>
      </div>
    </div>
    <div class="kd-ep-mirror">
      <div class="kd-ep-mirror__lead">${escHTML(ui('kd_ep_mirror_lead'))}</div>
      <div class="kd-ep-mirror__body">${escHTML(ui('kd_ep_mirror_body'))}</div>
      <div class="kd-ep-mirror__foot">${escHTML(ui('kd_ep_mirror_foot'))}</div>
      ${cta}
    </div>
  </div>`;
}

/**
 * The PRESENT-BY-DEFAULT treatment: this essential is covered with no number to hit, because
 * Wallach's own table states a supplement need of zero (phosphorus) or it is a structural element
 * you get by default from air/water/food (H/C/N/O). Replaces the target box with an explicit,
 * honest "none needed" + WHY - never the generic "unmined gap" copy, which would read as "we just
 * have not gotten to it" for a value that is deliberately zero.
 *
 * S00.A: the zero variant cites Wallach's own table (a sealed claim); the structural variant makes
 * NO dose claim - it states the general fact (present from air/water/food) + our no-target design.
 * Both copies live single-copy in view-copy.json (R4).
 */
function renderPresentGlance(tile: CoverageTile): string {
  const body = tile.noTargetReason === 'present_stated_zero'
    ? ui('kd_ep_present_body_zero')
    : ui('kd_ep_present_body_structural');
  return `<div class="kd-ep-op">
    <div class="kd-ep-op__grid">
      <div>
        <div class="kd-ep-k">${escHTML(ui('kd_ep_present_targetlabel'))}</div>
        <div class="kd-ep-gap">${escHTML(ui('kd_ep_present_notarget'))}</div>
      </div>
      <div>
        <div class="kd-ep-k">${escHTML(ui('kd_ep_present_covlabel'))}</div>
        <div class="kd-ep-readout"><span class="kd-essential-deep__status-pill ${statusPillClass(tile.status)}">● ${escHTML(statusLabel(tile.status))}</span></div>
        <div class="kd-ep-sub">${escHTML(ui('kd_ep_present_sub'))}</div>
      </div>
    </div>
    <div class="kd-ep-mirror">
      <div class="kd-ep-mirror__lead">${escHTML(ui('kd_ep_present_lead'))}</div>
      <div class="kd-ep-mirror__body">${escHTML(body)}</div>
    </div>
  </div>`;
}

/**
 * The NON-ESSENTIAL treatment (omega-9 / oleic — the only case today). Omega-9 is NOT one of
 * Wallach's fatty acids at all: he designates two essential (linoleic ω-6 + linolenic ω-3) and, in
 * his broader "3", a CONDITIONAL third — arachidonic (also ω-6), never oleic. We keep the omega-9
 * tile as a deliberate presentation choice ("omega 3-6-9" is how the EFA oils are named + sold), so
 * this treatment (a) OWNS that as our choice, not Wallach's, and (b) hard-separates it from the
 * conditional 3rd via an orange CTA to the Omega-6 page + explicit "what omega-9 is NOT" copy.
 * Rendered as a soft accent --aside callout so it reads as our note, not an essential's verdict.
 *
 * S00.A: every line is Wallach's stance or our stated presentation reason — no outside-world health
 * claim. Copy single-copy in view-copy.json (R4); the source mg below is composition, never a target.
 */
function renderNonEssentialGlance(layoutKey: string): string {
  // The orange CTA points at OMEGA-6, because Wallach's real "third fatty acid" is arachidonic (a
  // form of omega-6), NOT omega-9. Target = omega-6's canon layout_key (stable; render_probe_omega
  // covers the jump). The --aside callout + eyebrow mark this as OUR note, not a Wallach essential.
  const cta = `<button class="kd-ep-mirror__cta" type="button" data-kd-essential="Omega-6 (Linoleic Acid / LA)">
        <span class="kd-ep-mirror__cta-nm">Omega-6</span>
        <span class="kd-ep-mirror__cta-go">${escHTML(ui('kd_ep_noness_cta'))}</span>
        <span class="kd-ep-mirror__cta-chev" aria-hidden="true">›</span>
      </button>`;
  return `<div class="kd-ep-op">
    <div class="kd-ep-op__grid">
      <div>
        <div class="kd-ep-k">${escHTML(ui('kd_ep_noness_targetlabel'))}</div>
        <div class="kd-ep-gap">${escHTML(ui('kd_ep_noness_notarget'))}</div>
      </div>
      <div>
        <div class="kd-ep-k">${escHTML(ui('kd_ep_noness_covlabel'))}</div>
        <div class="kd-ep-readout"><span class="kd-essential-deep__status-pill kd-essential-deep__status-pill--pending">${escHTML(ui('kd_ep_noness_covword'))}</span></div>
      </div>
    </div>
    <div class="kd-ep-mirror kd-ep-mirror--aside">
      <div class="kd-ep-k kd-ep-mirror__eyebrow">${escHTML(ui('kd_ep_noness_eyebrow'))}</div>
      <div class="kd-ep-mirror__lead">${escHTML(ui('kd_ep_noness_lead'))}</div>
      <div class="kd-ep-mirror__body">${escHTML(ui('kd_ep_noness_body'))}</div>
      <div class="kd-ep-mirror__body">${escHTML(ui('kd_ep_noness_body2'))}</div>
      ${cta}
    </div>
    ${renderSourcesBlock(layoutKey)}
  </div>`;
}

/**
 * The plant-derived group treatment: no per-element dose exists, so all 34 trace_pdm minerals
 * show the ONE shared meter (Σ vehicle mg vs the 924 mg group goal) + the group explanation.
 */
function renderPdmGroupGlance(g: PdmGroupSummary): string {
  const prov = pdmGoalProvenance();
  const pct = Math.max(0, Math.round((g.goalMg > 0 ? g.deliveredMg / g.goalMg : 0) * 100));
  const barPct = Math.min(100, pct);
  const tip = fillTokens('kd_ep_pdm_calc_tip', {
    dose: `${fmtTarget(prov.doseAmount)} ${prov.doseUnit}`,
    perbw: `${fmtTarget(prov.perBwLb)} lb`,
    refmg: `${fmtTarget(prov.refMg)} mg`,
    bw: `${fmtTarget(prov.bodyWeightLb)} lb`,
    goal: `${fmtTarget(g.goalMg)} mg`,
  });
  return `<div class="kd-ep-op">
    <div class="kd-ep-op__grid">
      <div>
        <div class="kd-ep-k">${escHTML(ui('kd_ep_pdm_targetlabel'))}</div>
        <div class="kd-ep-v">${fmtTarget(g.goalMg)}<small> mg / day</small></div>
        <span class="kd-ep-why">${escHTML(ui('kd_ep_pdm_calc_q'))}<span class="kd-ep-tip">${escHTML(tip)}</span></span>
      </div>
      <div>
        <div class="kd-ep-k">Your coverage <span class="kd-ep-pdm-tag">${escHTML(ui('kd_ep_pdm_grouptag'))}</span></div>
        <div class="kd-ep-v">${fmtTarget(g.deliveredMg)}<small> / ${fmtTarget(g.goalMg)} mg</small></div>
        <div class="kd-ep-bar${barFillClass(g.status)}"><i style="width:${barPct}%"></i></div>
        <div class="kd-ep-sub">${pct}% ${escHTML(ui('kd_ep_pdm_covof'))} — ${escHTML(pdmVerdictWord(g.status))}</div>
      </div>
    </div>
    <div class="kd-ep-pdm-note">${escHTML(ui('kd_ep_pdm_note'))}</div>
  </div>`;
}

/** The plant-derived group's Best-Youngevity sources — deferred out of the "at a glance" meter to
 *  the BOTTOM of the how-it-works hero (Luneth 2026-07-21: products sit UNDER the enrichment, as on
 *  the omega pages). '' when no product carries a plant-derived vehicle. */
function renderPdmSourcesBlock(): string {
  const src = rankedPdmSources();
  if (src.length === 0) {
    return '';
  }
  const TOP = 5;
  const head = src.slice(0, TOP).map(s => pdmSrcRow(s)).join('');
  const rest = src.slice(TOP);
  const more = rest.length > 0
    ? `<details class="kd-ep-more"><summary>Show all ${src.length} sources</summary><div class="kd-ep-more__body">${rest.map(s => pdmSrcRow(s)).join('')}</div></details>`
    : '';
  return `<hr class="kd-ep-op__div">
      <div class="kd-ep-k kd-ep-op__srclabel">${escHTML(ui('kd_ep_pdm_srclabel'))}</div>
      ${head}${more}`;
}

// ─── "Worth knowing" — the faceted search cards ─────────────────────────────

function renderFacetGroups(page: EssentialPage): string {
  if (page.search.length === 0) {
    return '';
  }
  const order = SEARCH_FACETS as readonly string[];
  const groups = [...page.search].sort((a, b) => order.indexOf(a.facet) - order.indexOf(b.facet));
  const html = groups.map((g) => {
    const cards = g.claim_ids.map((id) => {
      const c = getSearchClaim(id);
      return c !== null ? renderSearchCard(c) : '';
    }).join('');
    if (cards.length === 0) {
      return '';
    }
    return `<details class="kd-ep-facet" data-facet="${escHTML(g.facet)}" open>
      <summary class="kd-ep-facet__head"><span class="kd-ep-facet__label">${escHTML(facetLabel(g.facet))}</span><span class="kd-ep-facet__count">${g.claim_ids.length}</span></summary>
      <div class="kd-ep-facet__body">${cards}</div>
    </details>`;
  }).join('');
  if (html.length === 0) {
    return '';
  }
  return seclabel('Worth knowing', 'tap a question') + html;
}

// ─── "The full record" — every claim, grouped by kind, keyword-filterable ────

// Actionable first (green), then signs (amber), then the science; the rest fall
// after alphabetically. Short list (<= 10) so it stays out of views_state_no_inline_data.
const RECORD_KIND_ORDER = ['dose', 'protocol', 'deficiency_sign', 'toxicity_sign', 'mechanism', 'definition', 'prognosis'];
function recordKindRank(k: string): number {
  const i = RECORD_KIND_ORDER.indexOf(k);
  return i === -1 ? RECORD_KIND_ORDER.length : i;
}

/**
 * GROUP-CLAIM propagation (plant-derived / trace_pdm only). Claims authored
 * `about: [colloidal-minerals]` describe the plant-derived complex AS A WHOLE, not any single
 * element. They render on all 34 plant-derived entity pages, stored ONCE (never copied 34x),
 * in a distinct section clearly labelled as SHARED so a reader does not mistake them for
 * strontium-specific content.
 *
 * ABOVE-THE-FOLD STRUCTURE (Luneth 2026-07-17): "any entry above The Full Record" MUST use
 * the engaging Question → Short Answer → expand for full answer + Wallach quote card — the
 * same shape Calcium's Worth-Knowing uses (renderSearchCard). We prefer the search-card path,
 * which requires the claim to have been enriched (search-enrichment.json entry with question +
 * answer_short + facet). A group claim that lacks enrichment gracefully falls back to the
 * corpus-shape card so a future addition never silently disappears — but the audible signal is
 * "enrich, or the card reads flat." Silent no-op on essentials that carry no group_record
 * (every non-trace_pdm slug).
 */
/** Group claims whose kind is an actionable recommendation to TAKE the liquid (these get the
 * "Where to get it" product pointer). dose + protocol are the colloidal group's green kinds. */
const ACTIONABLE_GROUP_KINDS = new Set<string>(['dose', 'protocol']);

/**
 * "Where to get it" — the actionability pointer under the plant-derived group's dose/protocol
 * (green) block. Wallach's dose ("one ounce of plant-derived colloidal minerals per 100 lb") is
 * inert without a real source, so we surface the Youngevity plant-derived-mineral products
 * (rankedPdmSources — the SAME data the hero's best-sources block reads) right at the recommendation.
 * Green-only by design: a definition/mechanism/quote is not something a reader "gets" (Luneth 2026-07-21).
 */
function renderGroupGetIt(): string {
  const src = rankedPdmSources();
  if (src.length === 0) {
    return '';
  }
  const TOP = 3;
  const rows = src.slice(0, TOP).map(s =>
    `<button class="kd-ep-getit__prod" type="button" data-kd-product="${escHTML(s.productId)}">${escHTML(s.name)}<span class="kd-ep-getit__chev">›</span></button>`
  ).join('');
  const more = src.length > TOP ? `<span class="kd-ep-getit__more">+${src.length - TOP} more above</span>` : '';
  return `<div class="kd-ep-getit">
      <span class="kd-ep-getit__label">Where to get it</span>
      <div class="kd-ep-getit__rows">${rows}${more}</div>
    </div>`;
}

function renderGroupRecord(page: EssentialPage): string {
  const gr = page.group_record;
  if (gr === undefined || gr.length === 0) {
    return '';
  }
  // Grouped by enrichment FACET (HISTORY & LORE, SOURCES, HOW IT WORKS, ...), not claim kind
  // (Luneth 2026-07-22): kind-grouping collapsed 22 of 32 shared cards into two adjacent teal
  // blocks (the "wall of blue"). The facet buckets — the same taxonomy the "Worth knowing"
  // section uses — spread them and give the history claim its own home. The derive owns BOTH the
  // grouping AND the bucket order (entity_page_derive.py GROUP_FACET_ORDER), so the buckets
  // render in artifact order — no re-sort here.
  const groups = gr;
  let total = 0;
  // The "Where to get it" product pointer rides ONE bucket — the first carrying an actionable
  // (dose/protocol KIND) claim — so the same three products don't repeat down the section. Keyed
  // on the claim KIND (via getClaim), never a facet-name literal (R7).
  let getItPlaced = false;
  const facetsHTML = groups.map((g) => {
    let bucketActionable = false;
    // Prefer the search-enriched shape for the above-the-fold card format (question + short
    // answer). Any id without enrichment falls back to the corpus-shape card so a future
    // unenriched addition still renders — never silently vanishes.
    const cards = g.claim_ids.map((id) => {
      const kind = getClaim(id)?.kind ?? '';
      if (kind.length > 0 && ACTIONABLE_GROUP_KINDS.has(kind)) {
        bucketActionable = true;
      }
      const sc = getSearchClaim(id);
      if (sc !== null) {
        total += 1;
        return renderSearchCard(sc);
      }
      const cc = resolveClaims([id])[0];
      if (cc === undefined) {
        return '';
      }
      total += 1;
      return renderRecordClaim(cc);
    }).filter(s => s.length > 0).join('');
    if (cards.length === 0) {
      return '';
    }
    const getIt = (bucketActionable && !getItPlaced) ? renderGroupGetIt() : '';
    if (getIt.length > 0) {
      getItPlaced = true;
    }
    return `<details class="kd-ep-facet" data-facet="${escHTML(g.facet)}" open>
      <summary class="kd-ep-facet__head"><span class="kd-ep-facet__label">${escHTML(facetLabel(g.facet))}</span><span class="kd-ep-facet__count">${g.claim_ids.length}</span></summary>
      <div class="kd-ep-facet__body">${cards}${getIt}</div>
    </details>`;
  }).join('');
  if (total === 0) {
    return '';
  }
  // "shared across the 34" is the single line that makes the propagation legible — without it, a
  // reader on strontium's page could read "Wallach says the complex fixes obesity" as a claim
  // Wallach made specifically about STRONTIUM (the confusion Luneth flagged).
  return seclabel('About the plant-derived group', 'shared across the 34 plant-derived elements')
    + `<details class="kd-ep-record kd-ep-record--group" open>
        <summary class="kd-ep-facet__head"><span class="kd-ep-facet__label">${total} ${plural(total, 'group claim')}</span><span class="kd-ep-facet__count">${total}</span></summary>
        <div class="kd-ep-record__body">
          ${facetsHTML}
        </div>
      </details>`;
}

function renderRecord(record: EntityKindGroup[], claimCount: number, label = 'The full record', hint = 'every claim · advanced'): string {
  if (record.length === 0) {
    return '';
  }
  const groups = [...record].sort((a, b) => {
    const ra = recordKindRank(a.kind);
    const rb = recordKindRank(b.kind);
    return ra !== rb ? ra - rb : (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0);
  });
  const total = claimCount;
  // Few total claims (< 20) => expand every kind group by default; collapsing a 2-claim group
  // is pointless friction (Luneth). Large records stay collapsed so they remain scannable.
  const openKinds = total < 20 ? ' open' : '';
  const kindsHTML = groups.map((g) => {
    const claims = resolveClaims(g.claim_ids);
    if (claims.length === 0) {
      return '';
    }
    const cards = claims.map(cl => renderRecordClaim(cl)).join('');
    return `<details class="kd-ep-kind"${openKinds} data-family="${escHTML(kindCategory(g.kind))}">
      <summary><span class="kd-ep-kind__label">${escHTML(kindLabel(g.kind))}</span><span class="kd-ep-kind__count">${claims.length}</span></summary>
      <div class="kd-ep-kind__body">${cards}</div>
    </details>`;
  }).join('');
  return seclabel(label, hint)
    + `<details class="kd-ep-record" open>
        <summary class="kd-ep-facet__head"><span class="kd-ep-facet__label">All ${total} ${plural(total, 'claim')}</span><span class="kd-ep-facet__count">${total}</span></summary>
        <div class="kd-ep-record__body">
          <div class="kd-ep-filterbar"><span class="kd-ep-filterbar__icon">⌕</span><input class="kd-ep-filter" type="text" placeholder="Filter these ${total} ${plural(total, 'claim')} by keyword…"></div>
          <div class="kd-ep-record-note">${escHTML(ui('ep_record_note'))}</div>
          ${kindsHTML}
        </div>
      </details>`;
}

// ─── Pill sections (conditions · works-with · keep-exploring) ────────────────

function renderConditionSection(page: EssentialPage): string {
  if (page.conditions.length === 0) {
    return '';
  }
  const pills = page.conditions.map(slug => pill(conditionDisplayName(slug), 'data-kd-condition', slug, 'kd-ep-pill--cond'));
  const lead = leadWithCount('ep_conditions_lead', page.conditions.length, 'condition');
  return seclabel('Need help with a condition?')
    + (lead.length > 0 ? `<p class="kd-ep-lead">${escHTML(lead)}</p>` : '')
    + pillCloud(pills, 12);
}

function renderWorksWithSection(page: EssentialPage): string {
  if (page.works_with.length === 0) {
    return '';
  }
  const pills = page.works_with.map((slug) => {
    const lk = getEssentialBySlug(slug)?.layout_key ?? slug;
    return pill(essentialDisplayName(slug), 'data-kd-essential', lk, 'kd-ep-pill--nut');
  });
  const lead = leadWithCount('ep_works_with_lead', page.works_with.length, 'nutrient');
  return seclabel('Works with')
    + (lead.length > 0 ? `<p class="kd-ep-lead">${escHTML(lead)}</p>` : '')
    + pillCloud(pills, 12);
}

function renderRelatedSection(page: EssentialPage): string {
  if (page.related.length === 0) {
    return '';
  }
  const pills = page.related.map((slug) => {
    const ess = getEssentialBySlug(slug);
    if (ess !== null) {
      return pill(essentialDisplayName(slug), 'data-kd-essential', ess.layout_key, 'kd-ep-pill--explore');
    }
    const cond = getCondition(slug);
    if (cond !== null) {
      return pill(cond.display_name, 'data-kd-condition', slug, 'kd-ep-pill--explore');
    }
    return `<span class="kd-ep-pill kd-ep-pill--explore kd-ep-pill--static">${escHTML(humanizeSlug(slug))}</span>`;
  }).join('');
  return seclabel('Keep exploring') + `<div class="kd-ep-cloud">${pills}</div>`;
}

// ─── Omega fatty-acid clarity (general reference, marked NOT a Wallach claim) ──
// Kept from the prior deep-view so an omega essential still names its fatty-acid forms
// (the source graphic mislabeled Omega-9). Only renders for an omega; Calcium etc. skip it.

const FATTY_ACID_CLARITY = FattyAcidClaritySchema.parse(fattyAcidClarityData);
const OMEGA_BY_FAMILY = new Map(FATTY_ACID_CLARITY.omegas.map(o => [o.family, o] as const));

const MECHANISM_CLARITY = MechanismClaritySchema.parse(mechanismClarityData);
const MECH_BY_SLUG = new Map(MECHANISM_CLARITY.mechanisms.map(m => [m.slug, m] as const));

function renderOmegaClarity(name: string): string {
  const m = /^Omega-([369])\b/.exec(name);
  const digit = m?.[1];
  if (digit === undefined) {
    return '';
  }
  const fam = OMEGA_BY_FAMILY.get(`omega-${digit}`);
  if (fam === undefined) {
    return '';
  }
  const rows = fam.acids.map(a => `
      <li class="kd-omega__row">
        <span class="kd-omega__abbr">${escHTML(a.abbr)}</span>
        <div class="kd-omega__body">
          <span class="kd-omega__name">${escHTML(a.name)}${a.primary ? ' <em class="kd-omega__primary">primary</em>' : ''}</span>
          <span class="kd-omega__desc">${escHTML(a.description)}</span>
        </div>
      </li>`).join('');
  return `
    <div class="kd-omega">
      <div class="kd-omega__head">
        <span class="kd-omega__title">${escHTML(fam.label)} · FATTY-ACID FORMS</span>
      </div>
      <ul class="kd-omega__list">${rows}</ul>
      <div class="kd-omega__note">${escHTML(FATTY_ACID_CLARITY.disclaimer)}</div>
    </div>`;
}

/** The omega-3 figure (deterministic, no Math.random): three form nodes ALA / EPA / DHA, the primary
 *  (ALA) solid-accent + tagged "the essential one", EPA + DHA soft/neutral, each with its source
 *  label (PLANT / MARINE) — the "one from plants, two from the sea" story. Data-driven off fam.acids.
 *  §00.A: general reference (the acids + sources are non-Wallach clarity), never a Wallach claim. */
function omega3Figure(fam: OmegaFamily): string {
  const XN = [16, 256, 496];
  const XC = [100, 340, 580];
  const nodes = fam.acids.slice(0, 3).map((a, i) => {
    const solid = a.primary === true;
    const shortName = a.name.replace(/\s+Acid$/i, '');
    const src = (a.source ?? '').toUpperCase();
    return `
      <text class="kd-ep-fam__nfam${solid ? '' : ' kd-ep-fam__nfam--cond'}" x="${XC[i]}" y="24" text-anchor="middle">${escHTML(src)}</text>
      <rect class="kd-ep-fam__node kd-ep-fam__node--${solid ? 'solid' : 'soft'}" x="${XN[i]}" y="38" width="168" height="72" rx="12"/>
      <text class="kd-ep-fam__nabbr${solid ? '' : ' kd-ep-fam__nabbr--cond'}" x="${XC[i]}" y="80" text-anchor="middle">${escHTML(a.abbr)}</text>
      <text class="kd-ep-fam__nname" x="${XC[i]}" y="98" text-anchor="middle">${escHTML(shortName)}</text>
      ${solid ? `<text class="kd-ep-fam__bracketlbl" x="${XC[i]}" y="134" text-anchor="middle">${escHTML(ui('kd_ep_o3_ala_tag'))}</text>` : ''}`;
  }).join('');
  return `<svg class="kd-ep-fam__art" viewBox="0 0 680 150" role="img" aria-label="The three forms of omega-3: ALA from plants, the essential one; EPA and DHA from the sea">${nodes}</svg>`;
}

/** The omega-3 "three forms" experience — the high-impact replacement for the old flat blue clarity
 *  box (Luneth 2026-07-21). Reuses the omega-6 .kd-ep-fam visual system: eyebrow + kill-shot + the
 *  figure + the three forms as rich rows + the general-reference disclaimer. Its OWN Best-Youngevity
 *  sources ride BELOW via fattyAcidBlockFor (deferred from the glance). §00.A: general reference. */
function renderOmega3Rich(fam: OmegaFamily): string {
  const rows = fam.acids.map(a => `
      <div class="kd-ep-fam__step">
        <span class="kd-ep-fam__num">${escHTML(a.abbr)}</span>
        <div class="kd-ep-fam__stepbody">
          <div class="kd-ep-fam__steptitle">${escHTML(a.name)}</div>
          <div class="kd-ep-fam__steptext">${escHTML(a.description)}</div>
        </div>
      </div>`).join('');
  return `<section class="kd-ep-fam">
      <span class="kd-ep-fam__eyebrow">${escHTML(ui('kd_ep_o3_eyebrow'))}</span>
      <h3 class="kd-ep-fam__kill">${escHTML(ui('kd_ep_o3_kill'))}</h3>
      <div class="kd-ep-fam__figure">${omega3Figure(fam)}</div>
      <div class="kd-ep-fam__steps">${rows}</div>
      <div class="kd-ep-fam__note">${escHTML(FATTY_ACID_CLARITY.disclaimer)}</div>
    </section>`;
}

// ─── Omega-6 "fatty-acid family" experience — the 2-vs-3 knot, untied ─────────
// Wallach names 3 fatty acids (linoleic, linolenic, arachidonic) but designates 2 as truly
// essential (linoleic + linolenic); arachidonic is "conditionally essential" — the body builds it
// from linoleic (Epigenetics 2014 / Immortality 2008). This is the one page that tells that whole
// story well: a deterministic triad figure (2 solid essentials + 1 dashed conditional) + numbered
// steps + Wallach's OWN sealed quote (RARE-000109). Destination for the omega-9 CTA + the "3 fatty
// acids" gloss. S00.A: explanatory copy is ours (view-copy R4, clearly framed); the quote is his,
// pulled from the sealed claim (never hand-typed). Luneth 2026-07-20.

/** The triad SVG: ALA (ω-3) + LA (ω-6) solid essentials, AA (ω-6) dashed conditional, LA -> AA
 *  arrow ("makes"), bracket under the two. Deterministic (no Math.random) — stable for probes. */
function fatFamilyFigure(): string {
  const arrow = escHTML(ui('kd_ep_fam_arrow'));
  const bracket = escHTML(ui('kd_ep_fam_bracket'));
  const condtag = escHTML(ui('kd_ep_fam_condtag'));
  return `<svg class="kd-ep-fam__art" viewBox="0 0 680 166" role="img" aria-label="Three fatty acids: two essential (linolenic, linoleic) and one conditional (arachidonic)">
      <defs><marker id="fam-arrow" markerWidth="9" markerHeight="9" refX="5.5" refY="3" orient="auto"><path class="kd-ep-fam__arrowhead" d="M0 0 L6 3 L0 6 Z"/></marker></defs>
      <text class="kd-ep-fam__nfam" x="100" y="26" text-anchor="middle">ω-3</text>
      <text class="kd-ep-fam__nfam" x="340" y="26" text-anchor="middle">ω-6</text>
      <text class="kd-ep-fam__nfam kd-ep-fam__nfam--cond" x="580" y="26" text-anchor="middle">ω-6</text>
      <rect class="kd-ep-fam__node kd-ep-fam__node--solid" x="16" y="36" width="168" height="72" rx="12"/>
      <rect class="kd-ep-fam__node kd-ep-fam__node--solid" x="256" y="36" width="168" height="72" rx="12"/>
      <rect class="kd-ep-fam__node kd-ep-fam__node--dashed" x="496" y="36" width="168" height="72" rx="12"/>
      <text class="kd-ep-fam__nabbr" x="100" y="80" text-anchor="middle">ALA</text>
      <text class="kd-ep-fam__nabbr" x="340" y="80" text-anchor="middle">LA</text>
      <text class="kd-ep-fam__nabbr kd-ep-fam__nabbr--cond" x="580" y="80" text-anchor="middle">AA</text>
      <text class="kd-ep-fam__nname" x="100" y="98" text-anchor="middle">Linolenic</text>
      <text class="kd-ep-fam__nname" x="340" y="98" text-anchor="middle">Linoleic</text>
      <text class="kd-ep-fam__nname" x="580" y="98" text-anchor="middle">Arachidonic</text>
      <path class="kd-ep-fam__arrowline" d="M430 72 L490 72" marker-end="url(#fam-arrow)"/>
      <text class="kd-ep-fam__arrowlbl" x="460" y="62" text-anchor="middle">${arrow}</text>
      <path class="kd-ep-fam__bracket" d="M16 126 L16 134 L424 134 L424 126"/>
      <text class="kd-ep-fam__bracketlbl" x="220" y="152" text-anchor="middle">${bracket}</text>
      <text class="kd-ep-fam__condtag" x="580" y="132" text-anchor="middle">${condtag}</text>
    </svg>`;
}

/** One numbered step (01/02/03). Body glossified so "arachidonic"/"conditionally essential" pick up
 *  the shared gloss hovers once they exist (Piece 3). */
function fatFamilyStep(num: string, tKey: string, bKey: string): string {
  return `<div class="kd-ep-fam__step">
      <span class="kd-ep-fam__num">${escHTML(num)}</span>
      <div class="kd-ep-fam__stepbody">
        <div class="kd-ep-fam__steptitle">${escHTML(ui(tKey))}</div>
        <div class="kd-ep-fam__steptext">${glossify(collapseWS(ui(bKey)))}</div>
      </div>
    </div>`;
}

/** Wallach's OWN designation statement, from the sealed claim DDDL-000063 (it names both the omega-3 and omega-6 acids).
 *  Verbatim + cite come from the claim, never hand-typed (R3). '' if the claim is unresolved. */
function fatFamilyQuote(claimId: string | undefined, highlight: string | undefined): string {
  const c = claimId !== undefined ? getClaim(claimId) : null;
  if (c === null) {
    return '';
  }
  const raw = collapseWS(c.verbatim);
  const at = highlight !== undefined ? raw.indexOf(highlight) : -1;
  const body = at >= 0 && highlight !== undefined
    ? `${glossify(raw.slice(0, at))}<mark class="ds-mark">${glossify(highlight)}</mark>${glossify(raw.slice(at + highlight.length))}`
    : glossify(raw);
  return `<div class="ds-pull-quote-wrap kd-ep-fam__quote">
      <blockquote class="ds-pull-quote">
        <p>${body}</p>
        <footer>— Dr. Joel Wallach · ${escHTML(getBookLabel(c.book))}</footer>
      </blockquote>
    </div>`;
}

/** The whole omega-6 experience section. */
function renderOmega6Experience(quoteClaim: string | undefined, highlight: string | undefined, layoutKey: string): string {
  return `<section class="kd-ep-fam">
      <span class="kd-ep-fam__eyebrow">${escHTML(ui('kd_ep_fam_eyebrow'))}</span>
      <h3 class="kd-ep-fam__kill">${escHTML(ui('kd_ep_fam_kill'))}</h3>
      <div class="kd-ep-fam__figure">${fatFamilyFigure()}</div>
      <div class="kd-ep-fam__steps">
        ${fatFamilyStep('01', 'kd_ep_fam_s1_t', 'kd_ep_fam_s1_b')}
        ${fatFamilyStep('02', 'kd_ep_fam_s2_t', 'kd_ep_fam_s2_b')}
        ${fatFamilyStep('03', 'kd_ep_fam_s3_t', 'kd_ep_fam_s3_b')}
      </div>
      ${fatFamilyQuote(quoteClaim, highlight)}
      <div class="kd-ep-fam__note">${escHTML(ui('kd_ep_fam_note'))}</div>
      ${renderSourcesBlock(layoutKey)}
    </section>`;
}

// ─── Mechanism explainer — the per-element "how it works" hero (selenium's rancidity mechanism is
// the first instance). Data-driven off mechanism-clarity-data.json, keyed by slug via MECH_BY_SLUG
// (a Map built by .map — NO id-keyed literal, NO slug branch), so the entity page stays a pure
// projection (entity_render_is_projection). A plain-language gloss of Wallach's OWN sealed claims:
// eyebrow/kill/beats are our voice (segregated content, R4); his exact words + the stat figure are
// pulled BY CLAIM ID at render. Reuses the .kd-ep-fam experience-hero, recoloured to the mechanism
// facet's science-teal via data-facet (the colour is never a TS literal — view_category_not_hardcoded).

/** The rancidity strip — deterministic (no Math.random, stable for probes): ONE fat bilayer that
 *  loses colour + order left→right (intact → Se guard at centre → rancid), with a grafted brown-gold
 *  ceroid "age spot" in the rancid zone. All state lives in CSS classes (theme-aware). */
function rancidityFigure(alt: string): string {
  const heads: string[] = [];
  for (let i = 0; i < 20; i++) {
    const x = 26 + i * 33;
    const cls = x < 250 ? '' : x > 430 ? ' kd-ep-fam__head--rancid' : ' kd-ep-fam__head--guard';
    heads.push(`<circle class="kd-ep-fam__head${cls}" cx="${x}" cy="58" r="5"/><circle class="kd-ep-fam__head${cls}" cx="${x}" cy="92" r="5"/>`);
  }
  return `<svg class="kd-ep-fam__art kd-ep-fam__art--mech" viewBox="0 0 680 150" role="img" aria-label="${escHTML(alt)}">
      <path class="kd-ep-fam__mem" d="M20 58 L430 58 M20 92 L430 92"/>
      <path class="kd-ep-fam__mem kd-ep-fam__mem--gone" d="M430 58 L660 58 M430 92 L660 92"/>
      ${heads.join('')}
      <path class="kd-ep-fam__shieldarc" d="M300 44 A44 44 0 0 1 380 44"/>
      <rect class="kd-ep-fam__seguard" x="312" y="56" width="56" height="38" rx="10"/>
      <text class="kd-ep-fam__seglyph" x="340" y="82" text-anchor="middle">Se</text>
      <circle class="kd-ep-fam__ceroid" cx="545" cy="72" r="11"/>
      <circle class="kd-ep-fam__spot" cx="600" cy="60" r="5"/>
      <circle class="kd-ep-fam__spot" cx="628" cy="88" r="4"/>
      <text class="kd-ep-fam__flabel" x="130" y="130" text-anchor="middle">INTACT MEMBRANE</text>
      <text class="kd-ep-fam__flabel" x="340" y="130" text-anchor="middle">Se · ON GUARD</text>
      <text class="kd-ep-fam__flabel kd-ep-fam__flabel--rancid" x="560" y="130" text-anchor="middle">RANCID · AGE SPOT</text>
    </svg>`;
}

/** Label lookup for a figure. Absent -> '' (an unlabelled mark, never a guessed default). */
function figLabel(labels: Record<string, string> | undefined, id: string): string {
  return escHTML(labels?.[id] ?? '');
}

/** The cofactor FORK — one element feeding two enzymes, and the two very different things
 *  that fail when it runs short. Deterministic (no Math.random, stable for probes).
 *  Authored at scale 1 (viewBox width == the figure's CSS max-width) so a size in here is a
 *  size on screen; label sizes match the shipped selenium figure's 12px. Every string is a
 *  label from the store. The left outcome shows FOUR natural hair colours converging on one
 *  accented pale swatch — the point is that any starting colour ends in the same place. */
function cofactorForkFigure(alt: string, labels: Record<string, string> | undefined): string {
  const HAIR = ['black', 'brown', 'auburn', 'blond'];
  const swatches = HAIR.map((h, k) =>
    `<rect class="kd-ep-fam__hair kd-ep-fam__hair--${h}" x="${80 + k * 31}" y="222" width="26" height="40" rx="4"/>`).join('');
  return `<svg class="kd-ep-fam__art kd-ep-fam__art--fork" viewBox="0 0 700 322" role="img" aria-label="${escHTML(alt)}">
      <defs><marker id="mech-fork-tip" markerWidth="8" markerHeight="8" refX="4.5" refY="2.6" orient="auto">
        <path class="kd-ep-fam__ghead" d="M0 0 L5.5 2.6 L0 5.2 Z"/></marker></defs>
      <rect class="kd-ep-fam__gnode kd-ep-fam__gnode--el" x="300" y="8" width="100" height="52" rx="10"/>
      <text class="kd-ep-fam__gglyph" x="350" y="43" text-anchor="middle">${figLabel(labels, 'glyph')}</text>
      <path class="kd-ep-fam__gline" d="M350 60 V88 H175 V132" marker-end="url(#mech-fork-tip)"/>
      <path class="kd-ep-fam__gline" d="M350 60 V88 H525 V132" marker-end="url(#mech-fork-tip)"/>
      <rect class="kd-ep-fam__gnode" x="75" y="140" width="200" height="36" rx="8"/>
      <text class="kd-ep-fam__gname" x="175" y="163" text-anchor="middle">${figLabel(labels, 'enzyme_left')}</text>
      <rect class="kd-ep-fam__gnode" x="425" y="140" width="200" height="36" rx="8"/>
      <text class="kd-ep-fam__gname" x="525" y="163" text-anchor="middle">${figLabel(labels, 'enzyme_right')}</text>
      <text class="kd-ep-fam__gsub" x="175" y="198" text-anchor="middle">${figLabel(labels, 'sub_left')}</text>
      <text class="kd-ep-fam__gsub" x="525" y="198" text-anchor="middle">${figLabel(labels, 'sub_right')}</text>
      ${swatches}
      <path class="kd-ep-fam__gline" d="M205 242 H221" marker-end="url(#mech-fork-tip)"/>
      <rect class="kd-ep-fam__hair kd-ep-fam__hair--lost" x="231" y="218" width="40" height="48" rx="5"/>
      <text class="kd-ep-fam__glabel" x="175" y="288" text-anchor="middle">${figLabel(labels, 'outcome_left')}</text>
      <text class="kd-ep-fam__gtag kd-ep-fam__gtag--warn" x="175" y="310" text-anchor="middle">${figLabel(labels, 'tag_left')}</text>
      <path class="kd-ep-fam__lumen" d="M435 228 H495 C513 228 511 214 525 214 C540 214 538 228 555 228 H615
                                        L615 256 H555 C538 256 540 270 525 270 C511 270 513 256 495 256 H435 Z"/>
      <path class="kd-ep-fam__vghost" d="M495 228 H555 M495 256 H555"/>
      <path class="kd-ep-fam__vessel" d="M435 228 H495 C513 228 511 214 525 214 C540 214 538 228 555 228 H615"/>
      <path class="kd-ep-fam__vessel" d="M435 256 H495 C513 256 511 270 525 270 C540 270 538 256 555 256 H615"/>
      <text class="kd-ep-fam__glabel" x="525" y="288" text-anchor="middle">${figLabel(labels, 'outcome_right')}</text>
      <text class="kd-ep-fam__gtag kd-ep-fam__gtag--mute" x="525" y="310" text-anchor="middle">${figLabel(labels, 'tag_right')}</text>
    </svg>`;
}

/** The DECLINE rail — an ordered march of failures ending at a terminal marker, braced as
 *  one long span. The terminal carries no sub-caption, so its baseline sits at 59 to centre
 *  optically on the other stops' two-line blocks (title 48 / sub 70) rather than floating. */
function declineRailFigure(alt: string, labels: Record<string, string> | undefined): string {
  const STOPS = [120, 280, 440];
  const stops = STOPS.map((x, k) => `
      <text class="kd-ep-fam__gstop" x="${x}" y="48" text-anchor="middle">${figLabel(labels, `stop${k + 1}`)}</text>
      <text class="kd-ep-fam__gsub" x="${x}" y="70" text-anchor="middle">${figLabel(labels, `stop${k + 1}_sub`)}</text>
      <circle class="kd-ep-fam__gstopdot" cx="${x}" cy="100" r="7"/>`).join('');
  return `<svg class="kd-ep-fam__art kd-ep-fam__art--rail" viewBox="0 0 660 172" role="img" aria-label="${escHTML(alt)}">
      <defs><marker id="mech-rail-tip" markerWidth="9" markerHeight="9" refX="5" refY="3" orient="auto">
        <path class="kd-ep-fam__ghead" d="M0 0 L6 3 L0 6 Z"/></marker></defs>
      <path class="kd-ep-fam__grail" d="M60 100 H576" marker-end="url(#mech-rail-tip)"/>
      ${stops}
      <rect class="kd-ep-fam__gterm" x="588" y="88" width="24" height="24" rx="4"/>
      <text class="kd-ep-fam__gstop kd-ep-fam__gstop--term" x="600" y="59" text-anchor="middle">${figLabel(labels, 'terminal')}</text>
      <path class="kd-ep-fam__gbrace" d="M60 124 V134 H600 V124"/>
      <text class="kd-ep-fam__glabel" x="330" y="158" text-anchor="middle">${figLabel(labels, 'span')}</text>
    </svg>`;
}

/** The REVERSAL rail — the same 60..600 span run backwards, in the category accent. Renders
 *  BELOW the beats so the turn reads as their consequence; the cause is the bold end label. */
function reversalRailFigure(alt: string, labels: Record<string, string> | undefined): string {
  return `<svg class="kd-ep-fam__art kd-ep-fam__art--rail" viewBox="0 0 660 84" role="img" aria-label="${escHTML(alt)}">
      <defs><marker id="mech-turn-tip" markerWidth="9" markerHeight="9" refX="5" refY="3" orient="auto">
        <path class="kd-ep-fam__ghead kd-ep-fam__ghead--acc" d="M0 0 L6 3 L0 6 Z"/></marker></defs>
      <text class="kd-ep-fam__gsub kd-ep-fam__gsub--acc" x="330" y="22" text-anchor="middle">${figLabel(labels, 'duration')}</text>
      <path class="kd-ep-fam__greturn" d="M600 40 H60" marker-end="url(#mech-turn-tip)"/>
      <circle class="kd-ep-fam__gretdot" cx="600" cy="40" r="7"/>
      <text class="kd-ep-fam__gtag kd-ep-fam__gtag--acc" x="60" y="70" text-anchor="start">${figLabel(labels, 'end')}</text>
      <text class="kd-ep-fam__gtag kd-ep-fam__gtag--acc kd-ep-fam__gtag--cause" x="600" y="70" text-anchor="end">${figLabel(labels, 'start')}</text>
    </svg>`;
}

/** The nail-spots HOOK figure: three fingertips of a hand, two of the nails carrying white
 *  spots. Skin and nail colours are DEPICTIVE literals in CSS — they stand for real skin, so a
 *  themed --ds-* token would drift and stop being skin (same precedent as copper's four hair
 *  swatches). The white tip and the half-moon are CLIPPED to the nail path and the nail OUTLINE
 *  is stroked last, so neither can overshoot the nail bed by construction rather than by
 *  nudging coordinates (Luneth 2026-07-29 — it overshot when the tip was merely inset). */
function nailSpotsFigure(alt: string, labels: Record<string, string> | undefined): string {
  const FINGERS = [{ x: 70, t: 34 }, { x: 133, t: 14 }, { x: 196, t: 26 }];
  const SPOTS = [
    { cx: 155, cy: 40, rx: 6, ry: 4.4 }, { cx: 169, cy: 52, rx: 4.6, ry: 3.4 },
    { cx: 152, cy: 58, rx: 3.8, ry: 2.8 }, { cx: 226, cy: 58, rx: 6.4, ry: 4.8 },
  ];
  const skin = (x: number, t: number): string =>
    `M${x} ${t + 30} C${x} ${t + 13} ${x + 13} ${t} ${x + 30} ${t} C${x + 47} ${t} ${x + 60} ${t + 13} ${x + 60} ${t + 30} V132 H${x} Z`;
  const nail = (x: number, t: number): string =>
    `M${x + 8} ${t + 29} C${x + 8} ${t + 12} ${x + 17} ${t + 5} ${x + 30} ${t + 5} C${x + 43} ${t + 5} ${x + 52} ${t + 12} ${x + 52} ${t + 29} V${t + 61} C${x + 52} ${t + 67} ${x + 43} ${t + 70} ${x + 30} ${t + 70} C${x + 17} ${t + 70} ${x + 8} ${t + 67} ${x + 8} ${t + 61} Z`;
  const tip = (x: number, t: number): string =>
    `M${x + 11} ${t + 17} C${x + 11} ${t + 11} ${x + 18} ${t + 5} ${x + 30} ${t + 5} C${x + 42} ${t + 5} ${x + 49} ${t + 11} ${x + 49} ${t + 17} C${x + 45} ${t + 13} ${x + 39} ${t + 11} ${x + 30} ${t + 11} C${x + 21} ${t + 11} ${x + 15} ${t + 13} ${x + 11} ${t + 17} Z`;
  const lun = (x: number, t: number): string =>
    `M${x + 13} ${t + 61} C${x + 19} ${t + 52} ${x + 41} ${t + 52} ${x + 47} ${t + 61} C${x + 41} ${t + 67} ${x + 19} ${t + 67} ${x + 13} ${t + 61} Z`;
  const clips = FINGERS.map((f, k) =>
    `<clipPath id="mech-nail-${k}"><path d="${nail(f.x, f.t)}"/></clipPath>`).join('');
  const skins = FINGERS.map(f => `<path class="kd-ep-fam__skin" d="${skin(f.x, f.t)}"/>`).join('');
  const nails = FINGERS.map((f, k) => `<path class="kd-ep-fam__nail" d="${nail(f.x, f.t)}"/>
      <g clip-path="url(#mech-nail-${k})">
        <path class="kd-ep-fam__ntip" d="${tip(f.x, f.t)}"/>
        <path class="kd-ep-fam__nlun" d="${lun(f.x, f.t)}"/>
      </g>
      <path class="kd-ep-fam__nailline" d="${nail(f.x, f.t)}"/>`).join('');
  const spots = SPOTS.map(s =>
    `<ellipse class="kd-ep-fam__nspot" cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"/>`).join('');
  return `<svg class="kd-ep-fam__art" viewBox="0 0 380 132" role="img" aria-label="${escHTML(alt)}">
      <defs>${clips}</defs>${skins}${nails}${spots}
      <path class="kd-ep-fam__gline" d="M260 50 H274"/>
      <text class="kd-ep-fam__gtag kd-ep-fam__gtag--acc" x="280" y="54">${figLabel(labels, 'spots')}</text>
    </svg>`;
}

/** The metal-fingers figure: the same molecule twice, with the element's atoms built into it and
 *  without them. The bottom labels name what a bar IS and what does or does not happen to it —
 *  an earlier pass labelled the outcome "genes activated", which named nothing a reader could
 *  picture (Luneth 2026-07-29). Authored at SCALE 1 against the 700px --fork width. */
function metalFingersFigure(alt: string, labels: Record<string, string> | undefined): string {
  const STOPS = [104, 180, 256];
  const side = (dx: number, on: boolean): string => {
    const nodes = STOPS.map((x, k) => {
      const big = k === 1;
      const cls = on ? 'kd-ep-fam__znode' : 'kd-ep-fam__znode kd-ep-fam__znode--empty';
      return `<circle class="${cls}" cx="${x + dx}" cy="${big ? 74 : 76}" r="${big ? 14 : 7}"/>`;
    }).join('');
    const stems = STOPS.map((x, k) => on
      ? `<path class="kd-ep-fam__zstem" d="M${x + dx} ${k === 1 ? 92 : 87} V126" marker-end="url(#mech-mf-tip)"/>`
      : `<path class="kd-ep-fam__zstem kd-ep-fam__zstem--gone" d="M${x + dx} ${k === 1 ? 92 : 87} V108"/>`).join('');
    const bars = STOPS.map(x =>
      `<rect class="kd-ep-fam__gbar${on ? '' : ' kd-ep-fam__gbar--off'}" x="${x + dx - 32}" y="140" width="64" height="22" rx="4"/>`).join('');
    return `<path class="kd-ep-fam__strand" d="M${52 + dx} 74 C${82 + dx} 58 ${112 + dx} 90 ${142 + dx} 74 C${172 + dx} 58 ${202 + dx} 90 ${232 + dx} 74 C${262 + dx} 58 ${292 + dx} 90 ${308 + dx} 80"/>${nodes}${stems}${bars}`;
  };
  return `<svg class="kd-ep-fam__art" viewBox="0 0 700 216" role="img" aria-label="${escHTML(alt)}">
      <defs><marker id="mech-mf-tip" markerWidth="8" markerHeight="8" refX="4.5" refY="2.6" orient="auto">
        <path class="kd-ep-fam__ghead kd-ep-fam__ghead--acc" d="M0 0 L5.5 2.6 L0 5.2 Z"/></marker></defs>
      <text class="kd-ep-fam__gtag kd-ep-fam__gtag--acc" x="180" y="18" text-anchor="middle">${figLabel(labels, 'with')}</text>
      <text class="kd-ep-fam__gtag kd-ep-fam__gtag--mute" x="520" y="18" text-anchor="middle">${figLabel(labels, 'without')}</text>
      <line class="kd-ep-fam__zdiv" x1="350" y1="32" x2="350" y2="212"/>
      <text class="kd-ep-fam__glabel" x="180" y="46" text-anchor="middle">${figLabel(labels, 'molecule_on')}</text>
      ${side(0, true)}
      <text class="kd-ep-fam__gglyph kd-ep-fam__gglyph--sm" x="180" y="79" text-anchor="middle">${figLabel(labels, 'glyph')}</text>
      <text class="kd-ep-fam__glabel" x="180" y="178" text-anchor="middle">${figLabel(labels, 'bar_is_on')}</text>
      <text class="kd-ep-fam__gtag kd-ep-fam__gtag--acc" x="180" y="202" text-anchor="middle">${figLabel(labels, 'outcome_on')}</text>
      <text class="kd-ep-fam__glabel" x="520" y="46" text-anchor="middle">${figLabel(labels, 'molecule_off')}</text>
      ${side(340, false)}
      <text class="kd-ep-fam__glabel" x="520" y="126" text-anchor="middle">${figLabel(labels, 'no_finger')}</text>
      <text class="kd-ep-fam__glabel" x="520" y="178" text-anchor="middle">${figLabel(labels, 'bar_is_off')}</text>
      <text class="kd-ep-fam__gtag kd-ep-fam__gtag--mute" x="520" y="202" text-anchor="middle">${figLabel(labels, 'outcome_off')}</text>
    </svg>`;
}

/** Figure dispatch on a GENERIC key (never a slug) — keeps renderMechanism a pure projection. */
function mechanismFigure(key: string, alt: string, labels?: Record<string, string>): string {
  switch (key) {
    case 'rancidity':
      return rancidityFigure(alt);
    case 'cofactor_fork':
      return cofactorForkFigure(alt, labels);
    case 'decline_rail':
      return declineRailFigure(alt, labels);
    case 'reversal_rail':
      return reversalRailFigure(alt, labels);
    case 'nail_spots':
      return nailSpotsFigure(alt, labels);
    case 'metal_fingers':
      return metalFingersFigure(alt, labels);
    default:
      return '';
  }
}

/** A proportion field — `total` marks, `bands` of them styled, the remainder neutral. The
 *  picture IS the number, so no numeral is printed inside it; the legend rows carry the
 *  reading in text (which is also what a screen reader gets — the art is decorative). */
function proportionField(f: MechField): string {
  const band: string[] = [];
  f.bands.forEach((b) => {
    for (let k = 0; k < b.count; k++) {
      band.push(b.key);
    }
  });
  const marks: string[] = [];
  for (let k = 0; k < f.total; k++) {
    const key = band[k];
    const mod = key !== undefined ? ` kd-ep-fam__mark--${escHTML(key)}` : '';
    marks.push(`<circle class="kd-ep-fam__mark${mod}" cx="${6 + (k % f.columns) * 12}" cy="${6 + Math.floor(k / f.columns) * 12}" r="4.5"/>`);
  }
  const rows = Math.ceil(f.total / f.columns);
  const legend = f.bands.filter(b => b.label.length > 0).map(b =>
    `<div class="kd-ep-fam__fieldleg"><span class="kd-ep-fam__fieldkey kd-ep-fam__fieldkey--${escHTML(b.key)}"></span>${escHTML(b.label)}</div>`).join('');
  return `<svg class="kd-ep-fam__fieldart" viewBox="0 0 ${12 + (f.columns - 1) * 12} ${12 + (rows - 1) * 12}" aria-hidden="true">${marks.join('')}</svg>${legend}`;
}

/** A split side's evidence: a sealed-claim quote pulled BY ID (R3 — never hand-typed) or a
 *  proportion field. '' when the side carries neither, or the claim does not resolve. */
function mechEvidence(side: MechSide): string {
  if (side.field !== undefined) {
    return proportionField(side.field);
  }
  const c = side.quote_claim !== undefined ? getClaim(side.quote_claim) : null;
  if (c === null) {
    return '';
  }
  return `<blockquote class="kd-ep-fam__miniq">${glossify(collapseWS(c.verbatim))}<cite>${escHTML(getBookLabel(c.book))}</cite></blockquote>`;
}

/** The two-column split, emitted as a 2x2 GRID (both prose cells, then both evidence cells)
 *  so the evidence row top-aligns by construction whatever the prose does — a flex column
 *  with an auto top margin only moves the gap inside the shorter side. */
function renderMechSplit(left: MechSide, right: MechSide): string {
  const R = ' kd-ep-fam__splitcell--r';
  const prose = (s: MechSide, mod: string): string => `<div class="kd-ep-fam__splitcell${mod}">
        <div class="kd-ep-fam__splithd">${escHTML(s.head)}</div>
        <p class="kd-ep-fam__splittx">${glossify(collapseWS(s.text))}</p>
      </div>`;
  const evid = (s: MechSide, mod: string): string => {
    const body = mechEvidence(s);
    if (body.length === 0) {
      return `<div class="kd-ep-fam__splitcell${mod}"></div>`;
    }
    const cap = s.evidence_caption !== undefined
      ? `<div class="kd-ep-fam__evcap">${escHTML(s.evidence_caption)}</div>`
      : '';
    return `<div class="kd-ep-fam__splitcell kd-ep-fam__splitcell--ev${mod}">${cap}${body}</div>`;
  };
  return `<div class="kd-ep-fam__split">${prose(left, '')}${prose(right, R)}${evid(left, '')}${evid(right, R)}</div>`;
}

/** The per-element mechanism hero. Renders ONLY for a slug that has a mechanism-clarity entry
 *  (MECH_BY_SLUG.get → undefined for the other 90 → ''), so it self-suppresses with no per-slug
 *  branch. Each element's header is composed bespoke to that element's content: the split,
 *  bridge, and the two extra figure slots are all OPTIONAL and self-suppress, so an entry that
 *  carries none (selenium's) renders exactly the shape it always did. */
function renderMechanism(slug: string | null, layoutKey: string, category: string | null): string {
  const m = slug !== null ? MECH_BY_SLUG.get(slug) : undefined;
  if (m === undefined) {
    return '';
  }
  const beats = m.beats.map((b) => {
    const hook = (b.hook !== undefined && b.hook.length > 0)
      ? `<p class="kd-ep-fam__hook">${escHTML(b.hook)}</p>`
      : '';
    const turn = b.turn === true ? ' kd-ep-fam__step--turn' : '';
    return `
      <div class="kd-ep-fam__step${turn}">
        <span class="kd-ep-fam__num">${escHTML(b.n)}</span>
        <div class="kd-ep-fam__stepbody">
          <div class="kd-ep-fam__steptitle">${escHTML(b.title)}</div>
          <div class="kd-ep-fam__steptext">${glossify(collapseWS(b.text))}</div>
          ${hook}
        </div>
      </div>`;
  }).join('');
  const stat = m.stat !== undefined ? `
      <div class="kd-ep-fam__stat">
        <span class="kd-ep-fam__statread">${escHTML(m.stat.readout)}</span>
        <span class="kd-ep-fam__statnum">${escHTML(m.stat.value)}</span>
        <span class="kd-ep-fam__statlbl">${escHTML(m.stat.label)}</span>
      </div>` : '';
  // The hook opens the block on something checkable before any mechanism is explained; the coda
  // returns to it at the end. Both optional, so an entry carrying neither renders as before.
  const hook = m.hook !== undefined ? `<div class="kd-ep-fam__opener">
        <div class="kd-ep-fam__openerart">${mechanismFigure(m.hook.figure.key, m.hook.figure.alt, m.hook.figure.labels)}</div>
        <div>
          <p class="kd-ep-fam__openertx">${glossify(collapseWS(m.hook.text))}</p>
          <p class="kd-ep-fam__openerq">${glossify(collapseWS(m.hook.pivot))}</p>
        </div>
      </div>` : '';
  const coda = m.coda !== undefined
    ? `<p class="kd-ep-fam__coda">${glossify(collapseWS(m.coda))}</p>`
    : '';
  const split = m.split !== undefined ? renderMechSplit(m.split.left, m.split.right) : '';
  const bridge = m.bridge !== undefined
    ? `<p class="kd-ep-fam__bridge">${glossify(collapseWS(m.bridge))}</p>`
    : '';
  const preFig = m.figure_pre_beats !== undefined
    ? `<div class="kd-ep-fam__figure kd-ep-fam__figure--rail">${mechanismFigure(m.figure_pre_beats.key, m.figure_pre_beats.alt, m.figure_pre_beats.labels)}</div>`
    : '';
  const postFig = m.figure_post_beats !== undefined
    ? `<div class="kd-ep-fam__figure kd-ep-fam__figure--rail kd-ep-fam__figure--turn">${mechanismFigure(m.figure_post_beats.key, m.figure_post_beats.alt, m.figure_post_beats.labels)}</div>`
    : '';
  const stepsMod = m.beats_layout === 'row' ? ' kd-ep-fam__steps--row' : '';
  const heroFigMod = m.figure_labels !== undefined ? ' kd-ep-fam__figure--fork' : ' kd-ep-fam__figure--mech';
  return `<section class="kd-ep-fam kd-ep-fam--mech" data-category="${escHTML(category ?? '')}">
      <span class="kd-ep-fam__eyebrow">${escHTML(m.eyebrow)}</span>
      <h3 class="kd-ep-fam__kill">${escHTML(m.kill)}</h3>
      ${hook}
      <div class="kd-ep-fam__figure${heroFigMod}">${mechanismFigure(m.figure, m.figure_alt, m.figure_labels)}</div>
      ${split}
      ${bridge}
      ${preFig}
      <div class="kd-ep-fam__steps${stepsMod}">${beats}</div>
      ${postFig}
      ${coda}
      ${stat}
      ${fatFamilyQuote(m.quote_claim, m.highlight)}
      <div class="kd-ep-fam__note">${escHTML(MECHANISM_CLARITY.disclaimer)}</div>
      ${renderSourcesBlock(layoutKey)}
    </section>`;
}


/** The plant-derived "how it works" figure: a 4-stage flow — parent rock → glacial milk → the
 *  plant → colloidal (98%). Deterministic (no Math.random); reuses the .kd-ep-fam node/arrow
 *  classes, last node accent-solid as the payoff. Labels + arrow captions come from view-copy. */
function pdmFigure(): string {
  const W = 209;
  const NODES = [
    { x: 8, cx: 112.5, nameKey: 'kd_ep_pdm_fig_n1', solid: false },
    { x: 283, cx: 387.5, nameKey: 'kd_ep_pdm_fig_n2', solid: false },
    { x: 558, cx: 662.5, nameKey: 'kd_ep_pdm_fig_n3', solid: false },
    { x: 833, cx: 937.5, nameKey: 'kd_ep_pdm_fig_n4', solid: true },
  ];
  const nodes = NODES.map((n) => {
    // Geometry chosen in SCREEN terms (Luneth 2026-07-21). KEY LESSON: this SVG scales to the figure's
    // CSS width, so a user-unit delta is ~0.61x on screen — pick sizes for what LANDS on screen.
    // WIDTH: boxes 209 wide = +20 screen px each vs the old 176. To keep the arrow GAPS and TEXT the
    // same on screen, the viewBox grew 918 -> 1050 (all +132 goes into the 4 boxes; the three 66-unit
    // gaps are held) AND the --pdm figure CSS width grew 560 -> 640, so the scale (~0.61) is unchanged.
    // HEIGHT: box 76 (orig 60) grows LESS than the text (21px, orig 12.5) so the copy fills more of it.
    // The 98%/Colloidal two-line stack (98% y75 + Colloidal y100) is block-centred with room to breathe;
    // arrow captions sit at y24, ~7 screen px clear of the box tops. Single-line baseline y85 keeps the
    // 21px name optically centred on the box centre (78).
    const rect = `<rect class="kd-ep-fam__node kd-ep-fam__node--${n.solid ? 'solid' : 'soft'}" x="${n.x}" y="40" width="${W}" height="76" rx="12"/>`;
    const label = n.solid
      ? `<text class="kd-ep-fam__nabbr" x="${n.cx}" y="75" text-anchor="middle">${escHTML(ui('kd_ep_pdm_fig_n4stat'))}</text>
         <text class="kd-ep-fam__nname" x="${n.cx}" y="100" text-anchor="middle">${escHTML(ui(n.nameKey))}</text>`
      : `<text class="kd-ep-fam__nname" x="${n.cx}" y="85" text-anchor="middle">${escHTML(ui(n.nameKey))}</text>`;
    return rect + label;
  }).join('');
  const ARROWS = [
    { x1: 217, x2: 283, key: 'kd_ep_pdm_fig_a1' },
    { x1: 492, x2: 558, key: 'kd_ep_pdm_fig_a2' },
    { x1: 767, x2: 833, key: 'kd_ep_pdm_fig_a3' },
  ];
  const arrows = ARROWS.map((a) => {
    const mid = (a.x1 + a.x2) / 2;
    return `<path class="kd-ep-fam__arrowline" d="M${a.x1 + 4} 78 L${a.x2 - 4} 78" marker-end="url(#pdm-arrow)"/>
        <text class="kd-ep-fam__arrowlbl" x="${mid}" y="24" text-anchor="middle">${escHTML(ui(a.key))}</text>`;
  }).join('');
  return `<svg class="kd-ep-fam__art kd-ep-fam__art--pdm" viewBox="0 0 1050 130" role="img" aria-label="How plant-derived minerals form: parent rock is ground by glaciers into glacial milk, taken up and rebuilt by plants into colloidal minerals the body absorbs at about 98 percent">
      <defs><marker id="pdm-arrow" markerWidth="9" markerHeight="9" refX="5.5" refY="3" orient="auto"><path class="kd-ep-fam__arrowhead" d="M0 0 L6 3 L0 6 Z"/></marker></defs>
      ${arrows}${nodes}
    </svg>`;
}

/** The plant-derived "how it works" HERO — the omega-style experience for the 34 plant-derived
 *  minerals. Authored ONCE (view-copy + the sealed RARE-000061 quote) and rendered on every
 *  plant-derived page, gated on group_record (a DERIVED per-page datum, never a slug literal —
 *  R1 pure projection, entity_render_is_projection-safe). Reuses .kd-ep-fam + fatFamilyStep/Quote.
 *  §00.A: the step copy is our faithful summary (R4); every number traces to RARE-000061; the
 *  quote is Wallach's own sealed verbatim. Renders '' on non-plant-derived essentials. */
function renderPdmClarity(page: EssentialPage): string {
  if (page.group_record === undefined || page.group_record.length === 0) {
    return '';
  }
  return `<section class="kd-ep-fam">
      <span class="kd-ep-fam__eyebrow">${escHTML(ui('kd_ep_pdm_hero_eyebrow'))}</span>
      <h3 class="kd-ep-fam__kill">${escHTML(ui('kd_ep_pdm_hero_kill'))}</h3>
      <div class="kd-ep-fam__figure kd-ep-fam__figure--pdm">${pdmFigure()}</div>
      <div class="kd-ep-fam__steps">
        ${fatFamilyStep('01', 'kd_ep_pdm_s1_t', 'kd_ep_pdm_s1_b')}
        ${fatFamilyStep('02', 'kd_ep_pdm_s2_t', 'kd_ep_pdm_s2_b')}
        ${fatFamilyStep('03', 'kd_ep_pdm_s3_t', 'kd_ep_pdm_s3_b')}
        ${fatFamilyStep('04', 'kd_ep_pdm_s4_t', 'kd_ep_pdm_s4_b')}
      </div>
      ${fatFamilyQuote('WAL-CLM-RARE-000061', '98 %')}
      ${renderPdmSourcesBlock()}
    </section>`;
}

/** Omega-3 is the easy one — its forms box + a prominent CTA button to the full family experience (matches omega-9's). */
function renderFamCTA(): string {
  return `<button class="kd-ep-mirror__cta" type="button" data-kd-essential="Omega-6 (Linoleic Acid / LA)">
      <span class="kd-ep-mirror__cta-nm">${escHTML(ui('kd_ep_fam_crosslink'))}</span>
      <span class="kd-ep-mirror__cta-go">${escHTML(ui('kd_ep_fam_cta_go'))}</span>
      <span class="kd-ep-mirror__cta-chev" aria-hidden="true">›</span>
    </button>`;
}

/** The omega family whose clarity data carries the full `experience`, else undefined. Keyed off the
 *  name pattern + the DATA flag (never a per-slug branch) so the block dispatcher AND the at-a-glance
 *  source-deferral read the same truth. */
function fatExperienceFam(name: string) {
  const m = /^Omega-([369])\b/.exec(name);
  const fam = m !== null ? OMEGA_BY_FAMILY.get(`omega-${m[1]}`) : undefined;
  return fam?.experience === true ? fam : undefined;
}

/** True when the page's fatty-acid block renders its OWN Best-Youngevity sources, so the glance
 *  defers them: omega-6's experience (sources at the bottom) and omega-3's crosslink block (sources
 *  under the forms + CTA). Omega-9 is non_essential, so its glance carries sources itself, not here. */
function fatBlockOwnsSources(name: string): boolean {
  const m = /^Omega-([369])\b/.exec(name);
  const fam = m !== null ? OMEGA_BY_FAMILY.get(`omega-${m[1]}`) : undefined;
  return fam !== undefined && (fam.experience === true || fam.crosslink === true);
}

/** Which fatty-acid block a page gets — driven by the clarity DATA, never a per-slug branch (R1
 *  pure projection): omega-9 -> nothing (its own aside handles it); an omega whose data carries
 *  `experience` -> the family experience (which OWNS its sources, moved to the bottom); one carrying
 *  `crosslink` -> plain box + a link; else the plain forms box. Non-omega essentials get nothing. */
function fattyAcidBlockFor(layoutKey: string, name: string, tile: CoverageTile | null): string {
  if (tile?.noTargetReason === 'non_essential') {
    return '';
  }
  const fatExp = fatExperienceFam(name);
  if (fatExp !== undefined) {
    return renderOmega6Experience(fatExp.quote_claim, fatExp.highlight, layoutKey);
  }
  const m = /^Omega-([369])\b/.exec(name);
  const fam = m !== null ? OMEGA_BY_FAMILY.get(`omega-${m[1]}`) : undefined;
  if (fam === undefined) {
    return '';
  }
  const base = renderOmegaClarity(name);
  // Crosslink family (omega-3): forms box, then a prominent CTA to the full family experience,
  // then its OWN Best-Youngevity sources -- deferred out of the glance so forms + CTA sit ABOVE
  // sources (Luneth 2026-07-20). fatBlockOwnsSources() drives the glance deferral off the flag.
  return fam.crosslink === true ? renderOmega3Rich(fam) + renderFamCTA() + renderSourcesBlock(layoutKey) : base;
}

// ─── The page ───────────────────────────────────────────────────────────────

/** The back affordance — the drawer's existing essential-close handler returns to the grid. */
function backButton(): string {
  return '<button class="kd-ep-back" data-kd-action="essential-close" type="button">‹ All essentials</button>';
}

/**
 * Render the essential entity page. `layoutKey` is the Coverage/Knowledge join key
 * (e.g. 'Calcium'); the coverage meter + best sources join by it, while the page
 * body projects the slug-keyed artifact. `whyHTML` is the why-this-number box
 * computed in knowledge.ts (kept there to avoid an entity-page → knowledge cycle).
 */
export function renderEssentialPage(layoutKey: string, snapshot: CoverageSnapshot | null): string {
  const corpusEss = getEssentialByLayoutKey(layoutKey);
  const slug = corpusEss?.slug ?? null;
  const page = slug !== null ? getEssentialPage(slug) : null;
  const tile = tileOf(snapshot, layoutKey);
  const status: CoverageStatus = tile?.status ?? '';
  const deferSources = page !== null && (fatBlockOwnsSources(page.name) || (slug !== null && MECH_BY_SLUG.has(slug)));
  const glanceHTML = renderAtAGlance(layoutKey, slug, tile, status, snapshot, !deferSources);

  if (page === null) {
    // Graceful fallback: an essential with no sealed page record yet (e.g. the
    // non-essential 91st). Coverage meter + sources still join by layoutKey.
    const nm = escHTML(corpusEss?.common_name ?? layoutKey);
    return `<div class="kd-essential-deep kd-ep" data-category="${escHTML(corpusEss?.category ?? '')}">
      <div class="kd-ep-hero"><div class="kd-ep-hero__idblock"><h1 class="kd-ep-hero__name">${nm}</h1></div>${backButton()}</div>
      ${seclabel('At a glance', 'Daily Needs & How It Works')}
      ${glanceHTML}
      <div class="kd-ep-empty">${escHTML(ui('ep_empty_record'))}</div>
    </div>`;
  }

  const metaBits = [escHTML(page.category ?? ''), `${page.claim_count} ${plural(page.claim_count, 'claim')}`, `${page.books.length} ${plural(page.books.length, 'book')}`]
    .filter(s => s.length > 0).join(' · ');
  // Friendly name is the H1 (page.name = common_name); the scientific name shows as a
  // muted subtitle only when it differs (Vitamin A -> Retinol; omitted for Calcium).
  const sciSub = page.scientific_name !== page.name
    ? `<div class="kd-ep-hero__sci">${escHTML(page.scientific_name)}</div>`
    : '';
  // The non-essential GLANCE now carries this "not one of the 90" line, so suppress the top flag
  // when that treatment renders - the point is made once per card, not twice.
  const nonEss = (page.is_essential || tile?.noTargetReason === 'non_essential')
    ? ''
    : `<div class="kd-ep-flag">${escHTML(ui('ep_non_essential'))}</div>`;
  const ledeText = slug !== null ? essentialLede(slug) : '';
  const lede = ledeText.length > 0
    ? `<p class="kd-ep-lede">${escHTML(ledeText)}</p>`
    : '';

  return `<div class="kd-essential-deep kd-ep" data-category="${escHTML(corpusEss?.category ?? '')}">
    <div class="kd-ep-hero">
      ${page.symbol !== null && page.symbol.length > 0 ? `<div class="kd-ep-hero__sym">${escHTML(page.symbol)}</div>` : ''}
      <div class="kd-ep-hero__idblock">
        <h1 class="kd-ep-hero__name">${escHTML(page.name)}</h1>
        ${sciSub}
        <div class="kd-ep-hero__meta">${metaBits}</div>
      </div>
      ${backButton()}
    </div>
    ${nonEss}
    ${lede}
    ${seclabel('At a glance', 'Daily Needs & How It Works')}
    ${glanceHTML}
    ${fattyAcidBlockFor(layoutKey, page.name, tile)}
    ${renderMechanism(slug, layoutKey, corpusEss?.category ?? null)}
    ${renderPdmClarity(page)}
    ${renderFacetGroups(page)}
    ${renderConditionSection(page)}
    ${renderWorksWithSection(page)}
    ${renderGroupRecord(page)}
    ${renderRecord(page.record, page.claim_count)}
    ${renderRelatedSection(page)}
  </div>`;
}

/**
 * Filter the open "full record" in place against a keyword (delegated from the drawer's
 * input handler): hide non-matching claim cards, hide + collapse a group with no match,
 * and open a group that has one. A pure DOM toggle — no re-render, so scroll survives.
 */
export function applyRecordFilter(scope: HTMLElement, rawQuery: string): void {
  const q = rawQuery.trim().toLowerCase();
  scope.querySelectorAll<HTMLElement>('.kd-ep-kind').forEach((group) => {
    let any = false;
    group.querySelectorAll<HTMLElement>('.kd-ep-claim').forEach((card) => {
      // Match the card's visible text AND its data-question (the enrichment question is carried
      // as an attr, never printed on a record card — see renderRecordClaim). So a user who types
      // the question they'd naturally ask still finds the claim.
      const haystack = `${card.textContent ?? ''} ${card.dataset['question'] ?? ''}`.toLowerCase();
      const match = q.length === 0 || haystack.includes(q);
      card.classList.toggle('kd-hidden', !match);
      if (match) {
        any = true;
      }
    });
    group.classList.toggle('kd-hidden', q.length > 0 && !any);
    if (q.length > 0 && any) {
      (group as HTMLDetailsElement).open = true;
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// The CONDITION page (Phase H2, chunk 2 — the live Osteoporosis condition detail)
// ═══════════════════════════════════════════════════════════════════════════
//
// A PURE PROJECTION of the generated condition record (state/entity-page →
// conditions[slug]) joined with the sealed corpus at render time — same discipline
// as renderEssentialPage (no canonical value as a literal, no per-condition branch:
// osteoporosis is only the first slug styled, the renderer is data-driven and
// degrades gracefully for a condition with fewer claims / no protocol).
//
// Section order (the layout restyled to the live kd-ep-* system — Luneth 2026-07-22):
//   hero (category-tinted) · synopsis lede · Wallach's protocol (the REAL sourced
//   claims, NEVER composited — §00.A) · nutrients to restore (relationship-aware,
//   glimpse-then-dive) · best products for this · the full picture (every claim,
//   grouped + filterable) · related conditions · keep exploring.
//
// Colour: the HERO carries the condition's body-system CATEGORY colour (continuity
// with the ghost-number cards on the Conditions tab, Luneth's "hero-only" call); the
// claim groups keep the standard family colours (kindCategory), so the claim language
// stays consistent with the essentials page.

/** The back affordance — the drawer's condition-close handler returns to the grid. */
function conditionBackButton(): string {
  return '<button class="kd-ep-back" data-kd-action="condition-close" type="button">‹ All conditions</button>';
}

/**
 * The "broad category" steer atop an umbrella condition (cancer, dermatitis, …) —
 * points a browser at their specific subtype. Gated on a real subtype list + enough
 * claims to be worth it (thin umbrellas skip it). Ported from the old condition deep
 * view so the steer survives the redesign.
 */
const UMBRELLA_TIP_MIN_CLAIMS = 15;
function conditionUmbrellaTip(slug: string, claimCount: number): string {
  const kids = umbrellaChildren(slug);
  if (kids.length === 0 || claimCount < UMBRELLA_TIP_MIN_CLAIMS) {
    return '';
  }
  const examples = kids.slice(0, 2).map(n => `<em>${escHTML(n)}</em>`).join(', ');
  const eg = examples.length > 0 ? ` (e.g. ${examples})` : '';
  return `<p class="kd-ep-umbrella"><strong>${escHTML(ui('kd_ep_umbrella_lead'))}</strong> — ${escHTML(ui('kd_ep_umbrella_body'))}${eg}.</p>`;
}

/** One navigable nutrient pill → the essential's detail page (by layout key, the join the click handler routes on). */
function nutrientPill(slug: string, cls: string): string {
  const lk = getEssentialBySlug(slug)?.layout_key ?? slug;
  return pill(familiarEssentialName(slug), 'data-kd-essential', lk, cls);
}

/**
 * NUTRIENTS TO RESTORE — the relationship-aware hybrid (Luneth 2026-07-22): not a flat
 * unified list (loses the context of HOW each nutrient relates) and not a noisy three-up
 * split. A prominent glimpse — the directed "to restore" set, what to actually take —
 * then two collapsed lenses the reader can dive into: where the deficiency shows, and
 * the wider set Wallach cites alongside. All pills navigate to the essential's page.
 *
 * The relationship split is Wallach-sourced (§00.A): `restore` is the directed maps(E,C)
 * set from the artifact; the deficiency/also lenses come from the condition's claim ROLES
 * (essentialsInRoles), never re-derived from raw co-occurrence.
 */
function renderNutrientsToRestore(page: ConditionPage, c: CorpusCondition | null): string {
  const restore = page.restore;
  const cause = c !== null ? essentialsInRoles(c, ['deficiency_signs', 'causes']) : [];
  const shown = new Set([...restore, ...cause]);
  const also = c !== null ? c.essentials_involved.filter(s => !shown.has(s)) : [];
  if (restore.length === 0 && cause.length === 0 && also.length === 0) {
    return '';
  }

  // Primary glimpse — the directed "to restore" pills (green = the action). If `restore`
  // is empty (a condition with no directed set yet), the deficiency set stands in as the
  // headline so the block is never empty-headed.
  const primarySlugs = restore.length > 0 ? restore : cause;
  const primaryLabel = restore.length > 0 ? 'To restore' : 'Caused by these deficiencies';
  const primaryPills = primarySlugs.map(s => nutrientPill(s, 'kd-ep-pill--nut'));
  const primary = `<div class="kd-ep-nutri__grp">
      <div class="kd-ep-nutri__lbl"><i class="kd-ep-nutri__dot kd-ep-nutri__dot--restore"></i>${escHTML(primaryLabel)}<span class="kd-ep-nutri__n">${primarySlugs.length}</span></div>
      ${pillCloud(primaryPills, 12)}
    </div>`;

  // Dive-in lenses — collapsed, so the page opens on the glimpse, not the whole graph. Each
  // carries a clear Expand/Collapse pill on the right (the bare chevron read as un-clickable).
  const relToggle = '<span class="kd-ep-nutri__toggle"><span class="kd-ep-nutri__toggle-open">Expand ▾</span><span class="kd-ep-nutri__toggle-close">Collapse ▴</span></span>';
  const nutriLens = (dotCls: string, label: string, count: number, pillsHTML: string): string =>
    `<details class="kd-ep-nutri__rel">
        <summary><span class="kd-ep-nutri__lbl"><i class="kd-ep-nutri__dot kd-ep-nutri__dot--${dotCls}"></i>${escHTML(label)}<span class="kd-ep-nutri__n">${count}</span></span>${relToggle}</summary>
        <div class="kd-ep-cloud kd-ep-nutri__cloud">${pillsHTML}</div>
      </details>`;
  const lenses: string[] = [];
  // Show the deficiency lens only when `restore` is the primary (else it IS the primary).
  if (restore.length > 0 && cause.length > 0) {
    lenses.push(nutriLens('cause', 'Caused by these deficiencies', cause.length, cause.map(s => nutrientPill(s, 'kd-ep-pill--ctx')).join('')));
  }
  if (also.length > 0) {
    lenses.push(nutriLens('also', 'Also cited alongside', also.length, also.map(s => nutrientPill(s, 'kd-ep-pill--ctx')).join('')));
  }

  return seclabel('Nutrients to restore')
    + `<div class="kd-ep-nutri">${primary}${lenses.join('')}</div>`;
}

/**
 * WALLACH'S PROTOCOL — features the REAL sourced protocol claims (protocol-kind, then
 * a non-base-line dose claim), each as its own claim card. §00.A / the handoff's hard
 * rule: NEVER composite several claims into one paraphrase — every sentence stays
 * attributable to the claim it came from. The first (most specific regimen) opens by
 * default; the rest are one tap away. Green (--fam-action) = the "what to do" family.
 */
function renderConditionProtocol(page: ConditionPage): string {
  const claims = resolveClaims(page.protocol_claim_ids);
  if (claims.length === 0) {
    return '';
  }
  const cards = claims.map((cl, i) => renderRecordClaim(cl, i === 0)).join('');
  return seclabel('Wallach’s protocol')
    + `<div class="kd-ep-protocol">${cards}</div>`;
}

/** One best-product row for a condition — "covers N / M nutrients · $wholesale", clickable to the product. */
function condProductRow(rec: CoverageRec, total: number, isBest: boolean): string {
  const price = rec.price > 0 ? `$${rec.price.toFixed(2)}` : '—';
  const tag = isBest ? '<span class="kd-ep-vtag">best value</span>' : '';
  return `<button class="kd-ep-src" type="button" data-kd-product="${escHTML(rec.productId)}">
      <span class="kd-ep-src__ico"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="8" width="12" height="13" rx="2"/><path d="M9 8V5.5h6V8"/></svg></span>
      <span class="kd-ep-src__nm">${escHTML(rec.name)}${tag}</span>
      <span class="kd-ep-src__amt">covers ${rec.supplies} / ${total}</span>
      <span class="kd-ep-src__pr">${price}</span>
      <span class="kd-ep-src__chev">›</span>
    </button>`;
}

/**
 * BEST PRODUCTS FOR THIS — the vault products that deliver the MOST of the condition's
 * "to restore" nutrients, ranked by the shared cross-essential recommender
 * (rankProductsForCoverage: supplies + breadth + wholesale value, kid-filtered). Each row
 * shows how many of the M nutrients it covers + the wholesale price (the featured price).
 * §00.A: composition + price are recommender inputs, never a Wallach target.
 */
function renderConditionProducts(page: ConditionPage): string {
  const total = page.restore.length;
  if (total === 0) {
    return '';
  }
  const recs = rankProductsForCoverage({ want: page.restore, limit: 8 });
  if (recs.length === 0) {
    return '';
  }
  // "Best value" = most nutrients covered per dollar (perTenDollars), surfaced with a tag.
  let best: CoverageRec | null = null;
  for (const r of recs) {
    if (best === null || r.perTenDollars > best.perTenDollars) {
      best = r;
    }
  }
  const TOP = 5;
  const head = recs.slice(0, TOP).map(r => condProductRow(r, total, r.productId === best?.productId)).join('');
  const rest = recs.slice(TOP);
  const more = rest.length > 0
    ? `<details class="kd-ep-more"><summary>Show all ${recs.length} products</summary><div class="kd-ep-more__body">${rest.map(r => condProductRow(r, total, false)).join('')}</div></details>`
    : '';
  return seclabel('Best products for this', 'ranked by how many nutrients each covers')
    + `<div class="kd-ep-prods">${head}${more}</div>`;
}

/** "Related conditions" (orange) + "Keep exploring" (mixed) pill rails at the foot of a condition page. */
function renderConditionRelated(page: ConditionPage): string {
  const relatedCondSet = new Set(page.related_conditions);
  let out = '';
  if (page.related_conditions.length > 0) {
    const pills = page.related_conditions.map(slug => pill(conditionDisplayName(slug), 'data-kd-condition', slug, 'kd-ep-pill--cond'));
    out += seclabel('Related conditions') + pillCloud(pills, 12);
  }
  // Keep exploring = the co-occurrence graph MINUS the conditions already shown above
  // (no duplicate pill), each resolved to whatever entity type it is.
  const explore = page.related.filter(s => !relatedCondSet.has(s));
  if (explore.length > 0) {
    const pills = explore.map((slug) => {
      const ess = getEssentialBySlug(slug);
      if (ess !== null) {
        return pill(essentialDisplayName(slug), 'data-kd-essential', ess.layout_key, 'kd-ep-pill--explore');
      }
      const cond = getCondition(slug);
      if (cond !== null) {
        return pill(cond.display_name, 'data-kd-condition', slug, 'kd-ep-pill--explore');
      }
      return `<span class="kd-ep-pill kd-ep-pill--explore kd-ep-pill--static">${escHTML(humanizeSlug(slug))}</span>`;
    });
    out += seclabel('Keep exploring') + pillCloud(pills, 14);
  }
  return out;
}

/**
 * Render one condition entity page. `slug` is the catalog condition slug (the routing slot
 * in knowledge.ts). Projects the generated condition record; the corpus join + the synopsis
 * derivation resolve at render (nothing here holds a canonical value as a literal).
 */
export function renderConditionPage(slug: string): string {
  const page = getConditionPage(slug);
  const c = getCondition(slug);
  if (page === null) {
    // Graceful fallback: a condition with no generated record (should not happen — all 502
    // are derived — but never render `undefined`).
    const nm = escHTML(c?.display_name ?? humanizeSlug(slug));
    return `<div class="kd-essential-deep kd-ep kd-ep--cond">
      <div class="kd-ep-hero"><div class="kd-ep-hero__idblock"><h1 class="kd-ep-hero__name">${nm}</h1></div>${conditionBackButton()}</div>
      <div class="kd-ep-empty">${escHTML(ui('ep_empty_record'))}</div>
    </div>`;
  }

  const cat = conditionCategory(slug);
  const catStyle = cat !== null ? ` style="--cat:${escHTML(cat.color)}"` : '';
  // Author-vetted SVG glyph from the sealed curation, rendered UNescaped by design (it is
  // markup, not user text; its stroke inherits --cat). '' when the category carries no icon.
  const catIcon = (cat !== null && cat.icon.length > 0)
    ? `<div class="kd-ep-hero__sym kd-ep-hero__sym--cat"><svg viewBox="0 0 24 24" aria-hidden="true">${cat.icon}</svg></div>`
    : '';
  const catChip = cat !== null
    ? `<div class="kd-ep-hero__cat"><i></i>${escHTML(cat.label)}</div>`
    : '';
  const metaBits = [`${page.claim_count} ${plural(page.claim_count, 'claim')}`, `${page.books.length} ${plural(page.books.length, 'book')}`].join(' · ');
  const synopsis = c !== null ? conditionSynopsis(c) : '';
  const lede = synopsis.length > 0 ? `<p class="kd-ep-lede">${escHTML(synopsis)}</p>` : '';

  return `<div class="kd-essential-deep kd-ep kd-ep--cond"${catStyle}>
    <div class="kd-ep-hero">
      ${catIcon}
      <div class="kd-ep-hero__idblock">
        <h1 class="kd-ep-hero__name">${escHTML(page.name)}</h1>
        <div class="kd-ep-hero__subline">${catChip}${catChip.length > 0 ? '<span class="kd-ep-hero__sep">·</span>' : ''}<span class="kd-ep-hero__meta">${metaBits}</span></div>
      </div>
      ${conditionBackButton()}
    </div>
    ${conditionUmbrellaTip(slug, page.claim_count)}
    ${lede}
    ${renderConditionProtocol(page)}
    ${renderNutrientsToRestore(page, c)}
    ${renderConditionProducts(page)}
    ${renderRecord(page.record, page.claim_count, 'The full picture', 'every claim, grouped')}
    ${renderConditionRelated(page)}
  </div>`;
}
