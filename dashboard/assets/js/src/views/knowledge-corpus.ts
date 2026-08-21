/**
 * views/knowledge-corpus.ts — Conditions-tab render + condition derivations
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The Conditions TAB of the Knowledge drawer: the ghost-number card grid
 * (renderConditionsTab / renderConditionRow) + the coverage-tile lookup (tileOf)
 * shared with the essentials page. Split out of views/knowledge.ts so each file
 * stays one cohesive concern.
 *
 * The condition DETAIL view is no longer here: it moved to the unified entity page
 * (views/entity-page.ts::renderConditionPage) so a condition reuses
 * the same kd-ep-* vocabulary as an essential. This file still OWNS the two condition
 * derivations that page reuses — `conditionSynopsis` (the Wallach nutrient lead-in) and
 * `essentialsInRoles` (the deficiency/treat/also split) — plus `familiarEssentialName`;
 * all three are exported for the entity-page condition renderer.
 *
 * Pure render: reads the validated corpus via state/corpus.ts, holds no state,
 * escapes all text (escHTML; §00.B escape-by-default). Both layers stay views →
 * state → core (this module imports only state/ + core/).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { CorpusCondition } from '../core/schemas/index.js';
import type { CoverageSnapshot, CoverageTile } from '../state/coverage.js';
import { plural } from '../core/format.js';
import { conditionCategory } from '../state/condition-categories.js';
import {
  essentialDisplayName,
  listConditions,
  resolveClaims,
} from '../state/corpus.js';

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

// ─── Coverage tile lookup ────────────────────────────────────────

/** The live coverage tile for an essential (carries intake-vs-target + fill). */
export function tileOf(snapshot: CoverageSnapshot | null, key: string): CoverageTile | null {
  if (snapshot === null) {
    return null;
  }
  return snapshot.tiles.find(t => t.name === key) ?? null;
}

// ─── Conditions tab ────────────────────────────────────────────────────────

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

/**
 * One condition card — the "ghost number" design: a big
 * faded claim-count in the condition's body-system colour behind an Unbounded name,
 * over a category chip + a claim/nutrient count line. `--cat` carries the category
 * colour into the CSS (chip + ghost + hover/selected accent); an unmapped condition
 * omits the chip and falls back to the app accent. Click to expand the deep view.
 */
function renderConditionRow(c: CorpusCondition, selectedSlug: string | null): string {
  const cls = `kd-condition-row${c.slug === selectedSlug ? ' is-selected' : ''}`;
  const nutrients = c.essentials_involved.length;
  const cat = conditionCategory(c.slug);
  const catStyle = cat !== null ? ` style="--cat:${escHTML(cat.color)}"` : '';
  const catHTML = cat !== null
    ? `<div class="kd-condition-row__cat"><i></i>${escHTML(cat.label)}</div>`
    : '';
  return `
    <div class="${cls}"${catStyle} data-kd-condition="${escHTML(c.slug)}" data-search="${escHTML(conditionSearchKeywords(c))}" role="button" tabindex="0">
      <div class="kd-condition-row__ghost" aria-hidden="true">${c.claim_count}</div>
      ${catHTML}
      <h4 class="kd-condition-row__name">${escHTML(c.display_name)}</h4>
      <div class="kd-condition-row__foot">${c.claim_count} ${plural(c.claim_count, 'claim')} · ${nutrients} ${plural(nutrients, 'nutrient')}</div>
    </div>`;
}

/**
 * Familiar label for an essential in the Conditions view — the letter vitamins
 * by the name a layperson recognizes ("Vitamin D", not the chemical display name
 * "Cholecalciferol"); everything else (B-vitamins, minerals, amino acids, fatty
 * acids) keeps its corpus display name, which is already the common name. Exported
 * for the entity-page condition renderer's nutrient pills.
 */
export function familiarEssentialName(slug: string): string {
  const letter = /^vitamin-([a-z]\d*)$/.exec(slug)?.[1];
  return letter !== undefined ? `Vitamin ${letter.toUpperCase()}` : essentialDisplayName(slug);
}

/**
 * Distinct essential slugs named across the claims of the given role buckets —
 * lets the synopsis quote only the nutrients of the role it summarizes (the
 * deficiency CAUSE vs the treatment), never lumping the two together (§00.A).
 * Exported for the entity-page condition renderer's relationship-aware nutrients block.
 */
export function essentialsInRoles(c: CorpusCondition, roleKeys: string[]): string[] {
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
 * so opening a condition leads WITH the connection instead of dropping the reader
 * mid-way into a nutrient's own write-up. Derived only from the condition's
 * Wallach-sourced claim structure (§00.A) and faithful to the claim role it
 * summarizes: a deficiency/cause role reads "linked to a deficiency of", a
 * treatment-only role "the protocol centers on". Empty when neither a
 * deficiency/cause nor a treatment nutrient is named for the condition. Exported
 * for the entity-page condition renderer's lede.
 */
export function conditionSynopsis(c: CorpusCondition): string {
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
 * Conditions in the order the tab presents them: most-written-about first
 * (claim_count desc), alphabetical within a tie — the "sorted by how much Wallach
 * wrote" head rendered below. Presentation-only; the derive keeps conditions A–Z.
 */
function conditionsByWeight(conditions: readonly CorpusCondition[]): CorpusCondition[] {
  return [...conditions].sort((a, b) =>
    b.claim_count - a.claim_count
    || (a.display_name < b.display_name ? -1 : a.display_name > b.display_name ? 1 : 0));
}

/**
 * The Conditions TAB — the ghost-number card grid. The condition DETAIL view is
 * prepended by knowledge.ts (renderConditionPage from the unified entity page), so
 * this renders the grid only; `selectedSlug` still drives the card's is-selected accent.
 */
export function renderConditionsTab(selectedSlug: string | null): string {
  const conditions = listConditions();
  if (conditions.length === 0) {
    return '<div class="kd-empty">— no conditions in the corpus yet —</div>';
  }
  const rowsHTML = conditionsByWeight(conditions).map(c => renderConditionRow(c, selectedSlug)).join('');
  return `
    <div class="kd-section-head">ALL ${conditions.length} CONDITIONS · SORTED BY HOW MUCH WALLACH WROTE</div>
    <div class="kd-conditions-grid">${rowsHTML}</div>`;
}
