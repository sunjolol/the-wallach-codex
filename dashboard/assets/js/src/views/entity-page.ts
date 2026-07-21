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
import { plural } from '../core/format.js';
import {
  type CorpusClaim,
  type EssentialPage,
  FattyAcidClaritySchema,
  SEARCH_FACETS,
  type SearchClaim,
} from '../core/schemas/index.js';
import { type CoverageSnapshot, type CoverageStatus, type CoverageTile, essentialNameOf, pdmGoalProvenance, type PdmGroupSummary, rankedPdmSources } from '../state/coverage.js';
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
} from '../state/corpus.js';
import { getEssentialPage } from '../state/entity-page.js';
import { essentialLede, essentialWhy } from '../state/entity-copy.js';
import { glossaryDef } from '../state/glossary.js';
import { composeCite, getSearchClaim } from '../state/search.js';
import { glossify } from './glossify.js';
import { tileOf } from './knowledge-corpus.js';
import { rankedSourcesForEssential, type RankedSourceRow } from './knowledge-products.js';

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
      <div class="kd-ep-claim__answer">${glossify(claim.answer)}</div>
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
function renderRecordClaim(claim: CorpusClaim): string {
  const isTable = isFig81Row(claim);
  const refLabel = (!isTable && typeof claim.source_table === 'string' && claim.source_table.length > 0)
    ? claim.source_table
    : null;
  const shownVerbatim = isTable ? fig81OwnRow(claim.verbatim) : collapseWS(claim.verbatim);
  const verbatimCls = isTable ? 'kd-ep-claim__verbatim kd-ep-claim__verbatim--rows' : 'kd-ep-claim__verbatim';
  return `<details class="kd-ep-claim">
    <summary class="kd-ep-claim__summary">
      <span class="kd-ep-claim__badge">?</span>
      <span class="kd-ep-claim__qblock"><span class="kd-ep-claim__q">${escHTML(truncate(claim.claim_text, 116))}</span></span>
      <span class="kd-ep-claim__chev">▸</span>
    </summary>
    <div class="kd-ep-claim__body">
      <div class="kd-ep-claim__answer">${glossify(claim.claim_text)}</div>
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
  const src = rankedPdmSources();
  const TOP = 5;
  const head = src.slice(0, TOP).map(s => pdmSrcRow(s)).join('');
  const rest = src.slice(TOP);
  const more = rest.length > 0
    ? `<details class="kd-ep-more"><summary>Show all ${src.length} sources</summary><div class="kd-ep-more__body">${rest.map(s => pdmSrcRow(s)).join('')}</div></details>`
    : '';
  const sourcesHTML = src.length > 0
    ? `<hr class="kd-ep-op__div">
      <div class="kd-ep-k kd-ep-op__srclabel">${escHTML(ui('kd_ep_pdm_srclabel'))}</div>
      ${head}${more}`
    : '';
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
    <div class="kd-ep-pdm-thera">
      <svg class="kd-ep-pdm-thera__mark" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.01"/></svg>
      <div>
        <div class="kd-ep-pdm-thera__label">${escHTML(ui('kd_ep_pdm_thera_label'))}</div>
        <div class="kd-ep-pdm-thera__body">${escHTML(ui('kd_ep_pdm_thera'))}</div>
      </div>
    </div>
    ${sourcesHTML}
  </div>`;
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
function renderGroupRecord(page: EssentialPage): string {
  const gr = page.group_record;
  if (gr === undefined || gr.length === 0) {
    return '';
  }
  const groups = [...gr].sort((a, b) => {
    const ra = recordKindRank(a.kind);
    const rb = recordKindRank(b.kind);
    return ra !== rb ? ra - rb : (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0);
  });
  let total = 0;
  const kindsHTML = groups.map((g) => {
    // Prefer the search-enriched shape for the above-the-fold card format (question + short
    // answer). Any id without enrichment falls back to the corpus-shape card so a future
    // unenriched addition still renders — never silently vanishes.
    const cards = g.claim_ids.map((id) => {
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
    return `<details class="kd-ep-kind" open data-family="${escHTML(kindCategory(g.kind))}">
      <summary><span class="kd-ep-kind__label">${escHTML(kindLabel(g.kind))}</span><span class="kd-ep-kind__count">${g.claim_ids.length}</span></summary>
      <div class="kd-ep-kind__body">${cards}</div>
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
          ${kindsHTML}
        </div>
      </details>`;
}

function renderRecord(page: EssentialPage): string {
  if (page.record.length === 0) {
    return '';
  }
  const groups = [...page.record].sort((a, b) => {
    const ra = recordKindRank(a.kind);
    const rb = recordKindRank(b.kind);
    return ra !== rb ? ra - rb : (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0);
  });
  const total = page.claim_count;
  // Few total claims (< 20) => expand every kind group by default; collapsing a 2-claim group
  // is pointless friction (Luneth). Large records stay collapsed so they remain scannable.
  const openKinds = total < 20 ? ' open' : '';
  const kindsHTML = groups.map((g) => {
    const claims = resolveClaims(g.claim_ids);
    if (claims.length === 0) {
      return '';
    }
    const cards = claims.map(renderRecordClaim).join('');
    return `<details class="kd-ep-kind"${openKinds} data-family="${escHTML(kindCategory(g.kind))}">
      <summary><span class="kd-ep-kind__label">${escHTML(kindLabel(g.kind))}</span><span class="kd-ep-kind__count">${claims.length}</span></summary>
      <div class="kd-ep-kind__body">${cards}</div>
    </details>`;
  }).join('');
  return seclabel('The full record', 'every claim · advanced')
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
  return `<svg class="kd-ep-fam__art" viewBox="0 0 680 196" role="img" aria-label="Three fatty acids: two essential (linolenic, linoleic) and one conditional (arachidonic)">
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

/** Wallach's OWN designation statement, from the sealed claim RARE-000109 (mapped to omega-3+6).
 *  Verbatim + cite come from the claim, never hand-typed (R3). '' if the claim is unresolved. */
function fatFamilyQuote(claimId: string | undefined): string {
  const c = claimId !== undefined ? getClaim(claimId) : null;
  if (c === null) {
    return '';
  }
  return `<div class="ds-pull-quote-wrap kd-ep-fam__quote">
      <blockquote class="ds-pull-quote">
        <p>${glossify(collapseWS(c.verbatim))}</p>
        <footer>— Dr. Joel Wallach · ${escHTML(getBookLabel(c.book))}</footer>
      </blockquote>
    </div>`;
}

/** The whole omega-6 experience section. */
function renderOmega6Experience(quoteClaim: string | undefined, layoutKey: string): string {
  return `<section class="kd-ep-fam">
      <span class="kd-ep-fam__eyebrow">${escHTML(ui('kd_ep_fam_eyebrow'))}</span>
      <h3 class="kd-ep-fam__kill">${escHTML(ui('kd_ep_fam_kill'))}</h3>
      <div class="kd-ep-fam__figure">${fatFamilyFigure()}</div>
      <div class="kd-ep-fam__steps">
        ${fatFamilyStep('01', 'kd_ep_fam_s1_t', 'kd_ep_fam_s1_b')}
        ${fatFamilyStep('02', 'kd_ep_fam_s2_t', 'kd_ep_fam_s2_b')}
        ${fatFamilyStep('03', 'kd_ep_fam_s3_t', 'kd_ep_fam_s3_b')}
      </div>
      ${fatFamilyQuote(quoteClaim)}
      <div class="kd-ep-fam__note">${escHTML(ui('kd_ep_fam_note'))}</div>
      ${renderSourcesBlock(layoutKey)}
    </section>`;
}

/** Omega-3 is the easy one — its plain forms box + a one-line link to the full family story. */
function renderFamCrossLink(): string {
  return `<button class="kd-ep-fam__xlink" type="button" data-kd-essential="Omega-6 (Linoleic Acid / LA)">${escHTML(ui('kd_ep_fam_crosslink'))} ›</button>`;
}

/** The omega family whose clarity data carries the full `experience`, else undefined. Keyed off the
 *  name pattern + the DATA flag (never a per-slug branch) so the block dispatcher AND the at-a-glance
 *  source-deferral read the same truth. */
function fatExperienceFam(name: string) {
  const m = /^Omega-([369])\b/.exec(name);
  const fam = m !== null ? OMEGA_BY_FAMILY.get(`omega-${m[1]}`) : undefined;
  return fam?.experience === true ? fam : undefined;
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
    return renderOmega6Experience(fatExp.quote_claim, layoutKey);
  }
  const m = /^Omega-([369])\b/.exec(name);
  const fam = m !== null ? OMEGA_BY_FAMILY.get(`omega-${m[1]}`) : undefined;
  if (fam === undefined) {
    return '';
  }
  const base = renderOmegaClarity(name);
  return fam.crosslink === true ? base + renderFamCrossLink() : base;
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
  const deferSources = page !== null && fatExperienceFam(page.name) !== undefined;
  const glanceHTML = renderAtAGlance(layoutKey, slug, tile, status, snapshot, !deferSources);

  if (page === null) {
    // Graceful fallback: an essential with no sealed page record yet (e.g. the
    // non-essential 91st). Coverage meter + sources still join by layoutKey.
    const nm = escHTML(corpusEss?.common_name ?? layoutKey);
    return `<div class="kd-essential-deep kd-ep">
      <div class="kd-ep-hero"><div class="kd-ep-hero__idblock"><h1 class="kd-ep-hero__name">${nm}</h1></div>${backButton()}</div>
      ${seclabel('At a glance', 'the essentials, in one place')}
      ${glanceHTML}
      <div class="kd-ep-empty">${escHTML(ui('ep_empty_record'))}</div>
    </div>`;
  }

  const metaBits = [escHTML(page.category ?? ''), `${page.claim_count} ${plural(page.claim_count, 'claim')}`, `${page.books.length} ${plural(page.books.length, 'book')}`]
    .filter(s => s.length > 0).join(' · ');
  const synonyms = page.synonyms.length > 0 ? ` · also: ${escHTML(page.synonyms.join(', '))}` : '';
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

  return `<div class="kd-essential-deep kd-ep">
    <div class="kd-ep-hero">
      ${page.symbol !== null && page.symbol.length > 0 ? `<div class="kd-ep-hero__sym">${escHTML(page.symbol)}</div>` : ''}
      <div class="kd-ep-hero__idblock">
        <h1 class="kd-ep-hero__name">${escHTML(page.name)}</h1>
        ${sciSub}
        <div class="kd-ep-hero__meta">${metaBits}${synonyms}</div>
      </div>
      ${backButton()}
    </div>
    ${nonEss}
    ${lede}
    ${seclabel('At a glance', 'the essentials, in one place')}
    ${glanceHTML}
    ${fattyAcidBlockFor(layoutKey, page.name, tile)}
    ${renderFacetGroups(page)}
    ${renderConditionSection(page)}
    ${renderWorksWithSection(page)}
    ${renderGroupRecord(page)}
    ${renderRecord(page)}
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
      const match = q.length === 0 || (card.textContent ?? '').toLowerCase().includes(q);
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
