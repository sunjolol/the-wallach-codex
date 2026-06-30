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
  CorpusClaim,
  CorpusCondition,
  CorpusEssential,
} from '../core/schemas/index.js';
import {
  conditionDisplayName,
  essentialDisplayName,
  getBookLabel,
  getCondition,
  listConditions,
  resolveClaims,
} from '../state/corpus.js';

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

// ─── Corpus claim rendering (Essentials deep-dive) ─────────────────────────

/** Most-salient claim kinds first; the rest fall after, alphabetically. */
const CORPUS_KIND_PRIORITY = ['deficiency_sign', 'toxicity_sign', 'dose', 'protocol', 'mechanism', 'prognosis'];

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

/** One corpus claim: paraphrase + optional dose + verbatim source + citation. */
function renderCorpusClaim(claim: CorpusClaim): string {
  const dose = formatDose(claim.dose);
  return `
    <div class="kd-claim">
      <p class="kd-claim__text">${escHTML(claim.claim_text)}</p>
      ${dose.length > 0 ? `<div class="kd-claim__dose">${escHTML(dose)}</div>` : ''}
      <blockquote class="kd-claim__verbatim">${escHTML(collapseWS(claim.verbatim))}</blockquote>
      <div class="kd-claim__cite">CITED · ${escHTML(getBookLabel(claim.book))}</div>
    </div>`;
}

/** The full "FROM THE CORPUS" block for one essential. */
export function renderCorpusForEssential(c: CorpusEssential): string {
  if (c.claim_count === 0) {
    return `
      <div class="kd-corpus">
        <div class="kd-corpus__head"><span class="kd-corpus__eyebrow"><span class="pulse-dot"></span>FROM THE WALLACH CORPUS</span></div>
        <p class="kd-corpus__empty">— no sealed claims extracted for this essential yet · the corpus is still being built out —</p>
      </div>`;
  }
  const groupsHTML = Object.keys(c.claims_by_kind).sort(corpusKindOrder).map((kind) => {
    const ids = c.claims_by_kind[kind] ?? [];
    const claimsHTML = resolveClaims(ids).map(renderCorpusClaim).join('');
    return `
      <div class="kd-corpus__group">
        <div class="kd-corpus__group-label">${escHTML(corpusKindLabel(kind))}</div>
        ${claimsHTML}
      </div>`;
  }).join('');

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
      ${condChips.length > 0 ? `<div class="kd-corpus__sub">IMPLICATED CONDITIONS</div><div class="kd-corpus__chips">${condChips}</div>` : ''}
      ${interactChips.length > 0 ? `<div class="kd-corpus__sub">WORKS ALONGSIDE</div><div class="kd-corpus__chips">${interactChips}</div>` : ''}
      ${groupsHTML}
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

/** One condition list row — click to expand the deep view. */
function renderConditionRow(c: CorpusCondition, selectedSlug: string | null): string {
  const ess = c.essentials_involved.slice(0, 6).map(s => essentialDisplayName(s)).join(' · ');
  const cls = `kd-condition-row${c.slug === selectedSlug ? ' is-selected' : ''}`;
  return `
    <div class="${cls}" data-kd-condition="${escHTML(c.slug)}" role="button" tabindex="0">
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
  const essChips = c.essentials_involved
    .map(s => `<span class="kd-corpus__chip kd-corpus__chip--ess">${escHTML(familiarEssentialName(s))}</span>`)
    .join('');
  const books = c.books_cited.map(b => getBookLabel(b)).join(' · ');

  return `
    <div class="kd-essential-deep kd-condition-deep">
      <button class="kd-essential-deep__close" data-kd-action="condition-close" title="Close (Esc)">×</button>
      <header class="kd-essential-deep__head">
        <div class="kd-essential-deep__name-block">
          <h3 class="kd-essential-deep__name">${escHTML(c.display_name)}</h3>
          <div class="kd-essential-deep__cat">CONDITION · ${c.claim_count} CLAIM${c.claim_count === 1 ? '' : 'S'}</div>
        </div>
      </header>
      ${synopsis.length > 0 ? `<p class="kd-condition-deep__synopsis">${escHTML(synopsis)}</p>` : ''}
      ${essChips.length > 0 ? `<div class="kd-corpus__sub">ADDRESSED BY</div><div class="kd-corpus__chips">${essChips}</div>` : ''}
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
