/**
 * views/knowledge-corpus.ts — sealed-corpus render helpers for the Knowledge drawer
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The render functions that surface the eden/corpus claim graph inside the
 * Knowledge drawer: the FROM-THE-CORPUS block in the Essentials deep-dive
 * (renderCorpusForEssential) and the whole Conditions tab (renderConditionsTab).
 * Split out of views/knowledge.ts (Phase ε.2 cleanup) so each file stays one
 * cohesive concern — the drawer shell/tabs there, the corpus claim rendering
 * here. Both are layer `views`; the one-way views → state → core flow is intact
 * (this module imports only state/ + core/).
 *
 * Pure render: reads the validated corpus via state/corpus.ts, holds no state,
 * escapes all text (escHTML; §00.B escape-by-default). Every claim shows the
 * neutral paraphrase + the EXACT book verbatim + its citation (§00.A).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type {
  CorpusBook,
  CorpusClaim,
  CorpusCondition,
  CorpusEssential,
  CorpusPlannedBook,
} from '../core/schemas/index.js';
import type { CoverageSnapshot, CoverageStatus, CoverageTile } from '../state/coverage.js';
import {
  conditionDisplayName,
  essentialDisplayName,
  getBookLabel,
  getClaimsForBook,
  getCondition,
  listBooksWithId,
  listConditions,
  listPlannedBooks,
  resolveClaims,
  umbrellaChildren,
} from '../state/corpus.js';
import { glossaryDef } from '../state/glossary.js';
import { glossify } from './glossify.js';

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

// ─── Intake-vs-target meter (essential deep-dive header) ────────────────────

/** The live coverage tile for an essential (carries intake-vs-target + fill). */
export function tileOf(snapshot: CoverageSnapshot | null, key: string): CoverageTile | null {
  if (snapshot === null) {
    return null;
  }
  return snapshot.tiles.find(t => t.name === key) ?? null;
}

/** Trim a dose number for display: whole above 100, one decimal below. */
function fmtAmount(n: number): string {
  if (!Number.isFinite(n)) {
    return '0';
  }
  const rounded = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return String(rounded);
}

/**
 * Compact intake-vs-Wallach-target meter, shown top-right of an essential
 * deep-dive. Rendered ONLY when the essential carries a numeric Wallach target;
 * otherwise returns '' and the caller keeps just the covered/not-covered pill
 * (Wallach states no number, so a ratio would be invented — §00.A). Pure render
 * over pre-computed coverage state.
 */
export function renderIntakeMeter(tile: CoverageTile | null, status: CoverageStatus): string {
  if (tile === null || tile.intakeVsTarget === null) {
    return '';
  }
  const { deliveredAmount, targetLow, targetHigh, unit } = tile.intakeVsTarget;
  const pct = Math.round(tile.fillPercent * 100);
  const barPct = Math.max(0, Math.min(100, pct));
  const goal = targetLow === targetHigh
    ? fmtAmount(targetLow)
    : `${fmtAmount(targetLow)}–${fmtAmount(targetHigh)}`;
  const tone = (status === 'covered' || status === 'trace')
    ? 'kd-meter--ok'
    : (status === 'partial' || status === 'gap' ? 'kd-meter--warn' : 'kd-meter--pending');
  return `
    <div class="kd-meter ${tone}">
      <div class="kd-meter__nums"><strong>${escHTML(fmtAmount(deliveredAmount))}</strong> / ${escHTML(goal)} ${escHTML(unit)}</div>
      <div class="kd-meter__track"><span class="kd-meter__fill" style="width:${barPct}%"></span></div>
      <div class="kd-meter__cap">${pct}% OF WALLACH GOAL</div>
    </div>`;
}

// ─── Book browser (Corpus tab -> open a book -> all its tier-1 claims) ──────

/**
 * The full tier-1 claim list of one book, grouped by kind — the view behind a
 * clicked Corpus-tab book row. This is the home for tier-1 claims that carry no
 * essential/condition (e.g. the colloidal-composition + daily-intake tables),
 * which therefore never surface on a tile. Tier-2 search-only claims are held
 * back by getClaimsForBook. Reuses renderCorpusClaim so citations stay uniform.
 */
export function renderBookDeep(bookId: string): string {
  const label = getBookLabel(bookId);
  const claims = getClaimsForBook(bookId);
  const closeBtn = '<button class="kd-book-deep__close" data-kd-action="book-close" title="Close (Esc)">×</button>';
  const head = `
    <div class="kd-book-deep__head">
      <span class="kd-book-deep__eyebrow"><span class="pulse-dot"></span>FROM THE WALLACH CORPUS · ${escHTML(label)}</span>
      <span class="kd-book-deep__count">${claims.length} CLAIM${claims.length === 1 ? '' : 'S'}</span>
    </div>`;
  if (claims.length === 0) {
    return `<div class="kd-book-deep">${closeBtn}${head}<p class="kd-corpus__empty">— no sealed claims for this book yet —</p></div>`;
  }
  const byKind = new Map<string, CorpusClaim[]>();
  for (const c of claims) {
    const arr = byKind.get(c.kind) ?? [];
    arr.push(c);
    byKind.set(c.kind, arr);
  }
  const groupsHTML = [...byKind.keys()].sort(corpusKindOrder).map((kind) => {
    const claimsHTML = (byKind.get(kind) ?? []).map(renderCorpusClaim).join('');
    return `
      <div class="kd-corpus__group">
        <div class="kd-corpus__group-label">${escHTML(corpusKindLabel(kind))}</div>
        ${claimsHTML}
      </div>`;
  }).join('');
  return `<div class="kd-book-deep">${closeBtn}${head}<div class="kd-corpus">${groupsHTML}</div></div>`;
}

// ─── Corpus claim rendering (Essentials deep-dive) ─────────────────────────

/**
 * Dose first — the recommended amount should be findable without scrolling (Luneth,
 * audit 2026-07-08); then the most-salient kinds, alphabetical after.
 */
const CORPUS_KIND_PRIORITY = ['dose', 'deficiency_sign', 'toxicity_sign', 'protocol', 'mechanism', 'prognosis'];

/** A claim kind slug → an uppercase human label (no literal map — §00.B). */
function corpusKindLabel(kind: string): string {
  return kind.replace(/[_-]+/g, ' ').toUpperCase();
}

/** Priority-then-alphabetical ordering for the claim-kind groups. */
function corpusKindOrder(a: string, b: string): number {
  const ia = CORPUS_KIND_PRIORITY.indexOf(a);
  const ib = CORPUS_KIND_PRIORITY.indexOf(b);
  const ra = ia === -1 ? CORPUS_KIND_PRIORITY.length : ia;
  const rb = ib === -1 ? CORPUS_KIND_PRIORITY.length : ib;
  return ra !== rb ? ra - rb : (a < b ? -1 : a > b ? 1 : 0);
}

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

/**
 * True when a claim is a row of Wallach's Fig. 8-1 "Base Line Nutritional
 * Supplement Program" dose table (Let's Play Doctor, ch. 8). Keyed off the dose
 * atom's `for_condition`, which the derive step already projects into the embed.
 * NOT the `dose-table` tag: that tag is overloaded (dddl uses it for prose
 * maintenance doses like germanium) AND tags aren't projected into the embed, so
 * `for_condition` is the precise, available signal. These verbatims are raw
 * 4-column rows (Nutrient · RDA · True Supplement Need · 30-Day Pharmacologic)
 * that read as an unlabeled run of numbers without their header — so the renderer
 * surfaces the column legend and keeps the source line-breaks.
 */
const FIG_8_1_FOR_CONDITION = 'base-line supplement program (true supplement need)';
function isFig81Row(claim: CorpusClaim): boolean {
  return claim.dose?.for_condition === FIG_8_1_FOR_CONDITION;
}

/**
 * The column legend for a Fig. 8-1 dose-table row — Wallach's OWN header names, each
 * wrapped as a glossary tooltip (dotted underline; hover/tap explains what "RDA" vs
 * "True Supplement Need" vs the pharmacologic dose mean) so the row's three numbers stop
 * reading as an unlabeled run. Only the column NAMES cross into the view; the numbers
 * live in the faithful verbatim rendered directly below it (§00.A).
 */
function renderFig81Legend(): string {
  const cols = ['RDA', 'True Supplement Need', '30-Day Pharmacologic'].map(glossCol).join(' · ');
  return `
      <div class="kd-claim__legend" role="note">
        <span class="kd-claim__legend-eyebrow">Fig. 8-1 columns</span>
        <span class="kd-claim__legend-cols">Nutrient · ${cols}</span>
      </div>`;
}

/** A legend column header wrapped as a glossary tooltip (definition from the lexicon). */
function glossCol(term: string): string {
  const def = glossaryDef(term);
  if (def === null) {
    return escHTML(term);
  }
  return `<span class="gloss" tabindex="0" role="button" aria-label="${escHTML(term)}: ${escHTML(def)}" data-def="${escHTML(def)}">${escHTML(term)}</span>`;
}

/**
 * The clicked nutrient's OWN row from a Fig. 8-1 verbatim. The sealed verbatim runs from
 * this nutrient's row into the NEXT one (a side-effect of the 60-char verbatim floor at
 * extraction time), so a reader on Biotin would otherwise see a stray Calcium row. Keep
 * the first line + any wrap continuation ("(time release)", "per day") and stop at the
 * next ALL-CAPS nutrient label or a footnote line. Faithful subset: the shown text is
 * still Wallach's exact row; the whole verbatim stays in the sealed data.
 */
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

/**
 * The context label for a dose value — WHAT the number is. A Fig. 8-1 row's number is
 * Wallach's "True Supplement Need" (his daily maintenance target); any other dose claim
 * carries its own for_condition (e.g. "maintenance", "serious illness"), minus a trailing
 * parenthetical qualifier. Sealed data only (§00.A) — no number crosses here.
 */
function doseContextLabel(claim: CorpusClaim): string {
  if (isFig81Row(claim)) {
    return 'True Supplement Need';
  }
  const fc = (claim.dose?.for_condition ?? '').trim();
  return fc.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/**
 * The dose card at the head of a dose claim: a bold, eye-scannable VALUE with a label
 * naming what it is (point of the audit-2026-07-08 rework). Value + label come straight
 * from the sealed dose atom; nothing is computed in the view (§00.A). Empty when the
 * claim has no structured dose.
 */
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

// ─── Source-table attribution header (Table/Fig ref → labeled header) ──

/**
 * The attribution header for a claim whose paraphrase named an internal Table/Figure/page.
 * Styled with the shared .kd-claim__legend (same box as the Fig. 8-1 column legend) so the
 * two provenance surfaces read as one system: the label as the accent eyebrow, a muted
 * qualifier beside it. Only the label crosses into the view; the faithful verbatim below
 * carries the table's actual content (§00.A).
 */
function renderRefHeader(label: string): string {
  return `
      <div class="kd-claim__legend" role="note">
        <span class="kd-claim__legend-eyebrow">${escHTML(label)}</span>
        <span class="kd-claim__legend-cols">as printed in Wallach's book</span>
      </div>`;
}

/** One corpus claim: paraphrase + optional dose card / table header + verbatim source + citation. */
function renderCorpusClaim(claim: CorpusClaim): string {
  const isTable = isFig81Row(claim);
  // A claim carrying source_table describes one of Wallach's numbered tables/figures: the ref
  // was removed from the sealed claim_text at mining time and the label surfaced here as a
  // labeled attribution header instead (front-facing-human-first). The Fig. 8-1 dose rows keep
  // their own dose-card + column-legend, so the table header is suppressed for them.
  const refLabel = (!isTable && typeof claim.source_table === 'string' && claim.source_table.length > 0)
    ? claim.source_table
    : null;
  // Fig. 8-1 rows show ONLY this nutrient's own row (fig81OwnRow drops the bled next-row +
  // footnotes) with source line-breaks kept (CSS pre-line). Every other verbatim collapses
  // its hard-wraps to one clean line. The verbatim shown is Wallach's exact words either way.
  const shownVerbatim = isTable ? fig81OwnRow(claim.verbatim) : collapseWS(claim.verbatim);
  const verbatimHTML = glossify(shownVerbatim);
  const verbatimCls = isTable ? 'kd-claim__verbatim kd-claim__verbatim--rows' : 'kd-claim__verbatim';
  return `
    <div class="kd-claim">
      <p class="kd-claim__text">${glossify(claim.claim_text)}</p>
      ${renderDoseBlock(claim)}
      ${isTable ? renderFig81Legend() : ''}
      ${refLabel !== null ? renderRefHeader(refLabel) : ''}
      <blockquote class="${verbatimCls}">${verbatimHTML}</blockquote>
      <div class="kd-claim__cite">CITED · ${escHTML(getBookLabel(claim.book))}</div>
    </div>`;
}

/** The full "FROM THE CORPUS" block for one essential. */
export function renderCorpusForEssential(c: CorpusEssential, whyHTML = ''): string {
  if (c.claim_count === 0) {
    return `
      <div class="kd-corpus">
        <div class="kd-corpus__head"><span class="kd-corpus__eyebrow"><span class="pulse-dot"></span>FROM THE WALLACH CORPUS</span></div>
        <p class="kd-corpus__empty">— no sealed claims extracted for this essential yet · the corpus is still being built out —</p>
      </div>`;
  }
  const renderGroup = (kind: string): string => {
    const ids = c.claims_by_kind[kind] ?? [];
    const claimsHTML = resolveClaims(ids).map(renderCorpusClaim).join('');
    return `
      <div class="kd-corpus__group">
        <div class="kd-corpus__group-label">${escHTML(corpusKindLabel(kind))}</div>
        ${claimsHTML}
      </div>`;
  };
  // Dose group LEADS the deep-dive (the recommended amounts — the first thing to see);
  // "why this number?" sits right under it; the chips + other kinds follow.
  const kinds = Object.keys(c.claims_by_kind).sort(corpusKindOrder);
  const doseHTML = kinds.filter(k => k === 'dose').map(renderGroup).join('');
  const restHTML = kinds.filter(k => k !== 'dose').map(renderGroup).join('');

  const condChips = c.conditions_treated
    .map(s => `<span class="kd-corpus__chip">${escHTML(conditionDisplayName(s))}</span>`)
    .join('');
  const interactChips = c.interacts_with
    .map(s => `<span class="kd-corpus__chip kd-corpus__chip--ess">${escHTML(essentialDisplayName(s))}</span>`)
    .join('');
  const books = c.books_cited.map(b => getBookLabel(b)).join(' · ');

  return `
    <div class="kd-corpus">
      <div class="kd-corpus__head">
        <span class="kd-corpus__eyebrow"><span class="pulse-dot"></span>FROM THE WALLACH CORPUS</span>
        <span class="kd-corpus__count">${c.claim_count} CLAIM${c.claim_count === 1 ? '' : 'S'}</span>
      </div>
      ${doseHTML}
      ${whyHTML}
      ${condChips.length > 0 ? `<div class="kd-corpus__sub">IMPLICATED CONDITIONS</div><div class="kd-corpus__chips">${condChips}</div>` : ''}
      ${interactChips.length > 0 ? `<div class="kd-corpus__sub">WORKS ALONGSIDE</div><div class="kd-corpus__chips">${interactChips}</div>` : ''}
      ${restHTML}
      <div class="kd-corpus__foot">SOURCE · ${escHTML(books)}</div>
    </div>`;
}

// ─── Conditions tab ────────────────────────────────────────────────────────

/** Most-salient claim roles first; the rest fall after, alphabetically. */
const CORPUS_ROLE_PRIORITY = ['causes', 'deficiency_signs', 'toxicity_signs', 'protocols', 'doses', 'prognosis'];

/** Priority-then-alphabetical ordering for the claim-role groups. */
function corpusRoleOrder(a: string, b: string): number {
  const ia = CORPUS_ROLE_PRIORITY.indexOf(a);
  const ib = CORPUS_ROLE_PRIORITY.indexOf(b);
  const ra = ia === -1 ? CORPUS_ROLE_PRIORITY.length : ia;
  const rb = ib === -1 ? CORPUS_ROLE_PRIORITY.length : ib;
  return ra !== rb ? ra - rb : (a < b ? -1 : a > b ? 1 : 0);
}

/**
 * Lowercased keyword blob for a condition row's `data-search` attribute so the
 * drawer search matches CONTENT — the nutrients involved, symptom names, and the
 * claim summaries + Wallach verbatims — not just the display name. Capped at 2500
 * chars so a many-claim condition (e.g. cancer) can't bloat the DOM. This is what
 * makes "smell" surface Anosmia; the full free-text corpus search is a later
 * ("Ask-Wallach") feature, but content-aware condition filtering ships now.
 */
function conditionSearchKeywords(c: CorpusCondition): string {
  const parts: string[] = [c.display_name, c.slug.replace(/_/g, ' ')];
  for (const e of c.essentials_involved) {
    parts.push(essentialDisplayName(e), e.replace(/-/g, ' '));
  }
  for (const s of c.other_substances_involved) {
    parts.push(s.replace(/_/g, ' '));
  }
  for (const cl of resolveClaims(Object.values(c.claims_by_role).flat())) {
    parts.push(cl.claim_text, cl.verbatim);
    for (const sym of cl.symptoms) {
      parts.push(sym.replace(/_/g, ' '));
    }
  }
  return parts.join(' ').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 2500);
}

/** One condition list row — click to expand the deep view. */
function renderConditionRow(c: CorpusCondition, selectedSlug: string | null): string {
  const ess = c.essentials_involved.slice(0, 6).map(s => essentialDisplayName(s)).join(' · ');
  const cls = `kd-condition-row${c.slug === selectedSlug ? ' is-selected' : ''}`;
  return `
    <div class="${cls}" data-kd-condition="${escHTML(c.slug)}" data-search="${escHTML(conditionSearchKeywords(c))}" role="button" tabindex="0">
      <div class="kd-condition-row__body">
        <h4 class="kd-condition-row__name">${escHTML(c.display_name)}</h4>
        <div class="kd-condition-row__meta">${ess.length > 0 ? escHTML(ess) : '— corpus entry —'}</div>
      </div>
      <div class="kd-condition-row__count">${c.claim_count}<small>claims</small></div>
    </div>`;
}

/**
 * Familiar label for an essential in the Conditions view — the letter vitamins
 * by the name a layperson recognizes ("Vitamin D", not the chemical display name
 * "Cholecalciferol"); everything else (B-vitamins, minerals, amino acids, fatty
 * acids) keeps its corpus display name, which is already the common name.
 */
function familiarEssentialName(slug: string): string {
  const letter = /^vitamin-([a-z]\d*)$/.exec(slug)?.[1];
  return letter !== undefined ? `Vitamin ${letter.toUpperCase()}` : essentialDisplayName(slug);
}

/**
 * Distinct essential slugs named across the claims of the given role buckets —
 * lets the synopsis quote only the nutrients of the role it summarizes (the
 * deficiency CAUSE vs the treatment), never lumping the two together (§00.A).
 */
function essentialsInRoles(c: CorpusCondition, roleKeys: string[]): string[] {
  const ids = roleKeys.flatMap(r => c.claims_by_role[r] ?? []);
  const seen = new Set<string>();
  for (const cl of resolveClaims(ids)) {
    for (const e of cl.essentials) {
      seen.add(e);
    }
  }
  return [...seen];
}

/**
 * Join familiar names as "A", "A and B", or "A, B and C" — capped at 4 with a
 * trailing "among others" so a condition implicated by many nutrients (e.g.
 * cancer) stays a sentence, not a wall.
 */
function joinEssentials(slugs: string[]): string {
  const MAX = 4;
  const names = slugs.slice(0, MAX).map(familiarEssentialName);
  const tail = slugs.length > MAX ? ', among others' : '';
  if (names.length <= 1) {
    return names.join('') + tail;
  }
  const last = names[names.length - 1] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${last}${tail}`;
}

/**
 * One labeled chip row of essentials in the condition deep-view. Empty when the
 * group has no members, so a condition with only a cause (or only a treatment)
 * shows just the one relevant group.
 */
function essentialChipRow(label: string, slugs: string[]): string {
  if (slugs.length === 0) {
    return '';
  }
  const chips = slugs
    .map(s => `<span class="kd-corpus__chip kd-corpus__chip--ess">${escHTML(familiarEssentialName(s))}</span>`)
    .join('');
  return `<div class="kd-corpus__sub">${escHTML(label)}</div><div class="kd-corpus__chips">${chips}</div>`;
}

/**
 * A condition-first lead-in that ties the condition to its nutrient(s) up front,
 * so clicking a condition opens WITH the connection instead of dropping the
 * reader mid-way into a nutrient's own write-up. Derived only from the
 * condition's Wallach-sourced claim structure (§00.A) and faithful to the claim
 * role it summarizes: a deficiency/cause role reads "linked to a deficiency of",
 * a treatment-only role "the protocol centers on". Empty when neither a
 * deficiency/cause nor a treatment nutrient is named for the condition (its
 * claim text already leads with the condition, so no lead-in is needed).
 */
function conditionSynopsis(c: CorpusCondition): string {
  const deficiency = essentialsInRoles(c, ['deficiency_signs', 'causes']);
  if (deficiency.length > 0) {
    return `Wallach links ${c.display_name} to a deficiency of ${joinEssentials(deficiency)}.`;
  }
  const treatment = essentialsInRoles(c, ['protocols', 'doses']);
  if (treatment.length > 0) {
    return `Wallach's protocol for ${c.display_name} centers on ${joinEssentials(treatment)}.`;
  }
  return '';
}

// An umbrella condition (cancer, dermatitis, ...) collects many subtypes; past this
// many surfaced claims the list is long enough to warrant the "search your specific
// type" tip. All 7 current umbrellas clear it; the gate future-proofs thin ones.
const UMBRELLA_TIP_MIN_CLAIMS = 15;

/**
 * The "broad category" note shown atop an umbrella condition -- steers a user
 * browsing e.g. Cancer toward their specific subtype, with two real examples.
 */
function renderUmbrellaTip(childDisplayNames: readonly string[]): string {
  const examples = childDisplayNames.slice(0, 2).map(n => `<em>${escHTML(n)}</em>`).join(', ');
  const eg = examples.length > 0 ? ` (e.g. ${examples})` : '';
  return `<p class="kd-condition-deep__umbrella-tip"><strong>Broad category</strong> \u2014 this collects every subtype. Search your specific type for a focused view${eg}.</p>`;
}

/**
 * The deep view for one condition — a condition-first synopsis, then claims
 * grouped by role + the essentials chips.
 */
function renderConditionDeep(slug: string): string {
  const c = getCondition(slug);
  if (c === null) {
    return '';
  }
  const groupsHTML = Object.keys(c.claims_by_role).sort(corpusRoleOrder).map((role) => {
    const ids = c.claims_by_role[role] ?? [];
    const claimsHTML = resolveClaims(ids).map(cl => renderCorpusClaim(cl)).join('');
    return `
      <div class="kd-corpus__group">
        <div class="kd-corpus__group-label">${escHTML(corpusKindLabel(role))}</div>
        ${claimsHTML}
      </div>`;
  }).join('');
  const synopsis = conditionSynopsis(c);
  // Split the involved essentials by claim role so the synopsis (which quotes the
  // deficiency CAUSE nutrients) always matches a labeled chip group — never a
  // silent disagreement between the lead-in and the chips (Luneth 2026-07-01).
  const causeEss = essentialsInRoles(c, ['deficiency_signs', 'causes']);
  const treatEss = essentialsInRoles(c, ['protocols', 'doses']);
  const primary = new Set([...causeEss, ...treatEss]);
  const otherEss = c.essentials_involved.filter(s => !primary.has(s));
  const chipRows = [
    essentialChipRow('DEFICIENCY / CAUSE', causeEss),
    essentialChipRow('TREATED WITH', treatEss),
    essentialChipRow('ALSO CITED', otherEss),
  ].join('');
  const books = c.books_cited.map(b => getBookLabel(b)).join(' · ');
  const umbrellaKids = umbrellaChildren(c.slug);
  const umbrellaTipHTML = (umbrellaKids.length > 0 && c.claim_count >= UMBRELLA_TIP_MIN_CLAIMS)
    ? renderUmbrellaTip(umbrellaKids)
    : '';

  return `
    <div class="kd-essential-deep kd-condition-deep">
      <button class="kd-essential-deep__close" data-kd-action="condition-close" title="Close (Esc)">×</button>
      <header class="kd-essential-deep__head">
        <div class="kd-essential-deep__name-block">
          <h3 class="kd-essential-deep__name">${escHTML(c.display_name)}</h3>
          <div class="kd-essential-deep__cat">CONDITION · ${c.claim_count} CLAIM${c.claim_count === 1 ? '' : 'S'}</div>
        </div>
      </header>
      ${umbrellaTipHTML}
      ${synopsis.length > 0 ? `<p class="kd-condition-deep__synopsis">${escHTML(synopsis)}</p>` : ''}
      ${chipRows}
      ${groupsHTML}
      <div class="kd-corpus__foot">SOURCE · ${escHTML(books)}</div>
    </div>`;
}

export function renderConditionsTab(selectedSlug: string | null): string {
  const conditions = listConditions();
  if (conditions.length === 0) {
    return '<div class="kd-empty">— no conditions in the corpus yet —</div>';
  }
  const deepHTML = selectedSlug !== null ? renderConditionDeep(selectedSlug) : '';
  const rowsHTML = conditions.map(c => renderConditionRow(c, selectedSlug)).join('');
  return `
    ${deepHTML}
    <div class="kd-section-head">CONDITIONS · ${conditions.length} · WALLACH CORPUS</div>
    ${rowsHTML}`;
}

// ─── Corpus tab (book list + book browser) ─────────────────────────────────

/** "WALLACH" / "WALLACH ET AL" — primary author surname + et-al marker. */
function authorLabel(authors: string[] | undefined): string {
  if (authors === undefined || authors.length === 0) {
    return 'WALLACH';
  }
  const first = authors[0] ?? '';
  const parts = first.trim().split(/\s+/);
  const surname = parts.length > 0 ? (parts[parts.length - 1] ?? first) : first;
  return authors.length > 1 ? `${surname.toUpperCase()} ET AL` : surname.toUpperCase();
}

/** The count cell: real claim total, or a muted 'queued' for un-mined in-housed books. */
function bookCountHTML(n: number): string {
  if (n > 0) {
    return `${n}<small>claims</small>`;
  }
  return '<span class="kd-book-row__count--queued">⋯</span><small>queued</small>';
}

/** One in-housed book row — driven by books-meta + REAL per-book claim_count. */
function renderBookRow(b: CorpusBook & { book_id: string }): string {
  const ed = (b.edition !== undefined && b.edition !== null && b.edition.length > 0) ? `${escHTML(b.edition)} ED · ` : '';
  const yr = (b.year !== undefined && b.year !== null) ? escHTML(String(b.year)) : '';
  return `
    <div class="kd-book-row" data-kd-book="${escHTML(b.book_id)}" role="button" tabindex="0">
      <div class="kd-book-row__spine"><span>${escHTML(b.code ?? '')}</span></div>
      <div class="kd-book-row__body">
        <h4 class="kd-book-row__title">${escHTML(b.title)}</h4>
        <div class="kd-book-row__meta">${escHTML(authorLabel(b.authors))} · ${ed}${yr}</div>
      </div>
      <div class="kd-book-row__count">${bookCountHTML(b.claim_count ?? 0)}</div>
    </div>`;
}

/** One planned ('coming soon') book row — grayed/dashed, not yet in-housed. */
function renderPlannedRow(b: CorpusPlannedBook): string {
  return `
    <div class="kd-book-row kd-book-row--planned">
      <div class="kd-book-row__spine"><span>${escHTML(b.code ?? '')}</span></div>
      <div class="kd-book-row__body">
        <h4 class="kd-book-row__title">${escHTML(b.title)}</h4>
        <div class="kd-book-row__meta">${escHTML(authorLabel(b.authors))} · COMING SOON</div>
      </div>
      <div class="kd-book-row__count kd-book-row__count--soon">—<small>soon</small></div>
    </div>`;
}

export function renderCorpusTab(selectedBook: string | null): string {
  if (selectedBook !== null) {
    return renderBookDeep(selectedBook);
  }
  const books = listBooksWithId();
  const planned = listPlannedBooks();
  const totalClaims = books.reduce((s, b) => s + (b.claim_count ?? 0), 0);
  const booksHTML = books.map(b => renderBookRow(b)).join('');
  const plannedHTML = planned.length > 0
    ? `<div class="kd-section-head">COMING SOON · ACQUIRING</div>${planned.map(p => renderPlannedRow(p)).join('')}`
    : '';

  return `
    <div class="kd-featured-citation">
      <div class="kd-featured-citation__eyebrow"><span class="pulse-dot"></span>SOURCE-RULE CORNERSTONE</div>
      <p class="kd-featured-citation__quote">The body needs 60 minerals, 16 vitamins, 12 amino acids, and 2 essential fatty acids — 90 essentials total. Plant-derived minerals are the only delivery vehicle that the body absorbs as nature intended.</p>
      <div class="kd-featured-citation__attr"><strong>Wallach</strong> · Dead Doctors Don\'t Lie · ch. 1 · paraphrase per primary corpus</div>
    </div>
    <div class="kd-section-head">PRIMARY CORPUS · WALLACH · ${books.length} BOOKS · ${totalClaims} CLAIMS</div>
    ${booksHTML}
    ${plannedHTML}`;
}
