/**
 * views/knowledge-orac.ts -- the Knowledge drawer's ORAC ("how fast you rust") tab
 * ===========================================================================
 *
 * A curated, urgency-first landing for Wallach's antioxidant / ORAC teaching -- the
 * "slow the rusting" half of his longevity model. Signed-off design reference:
 * temporary/orac-EDITED.html (Luneth). Built in phases; THIS file is Phase 1 -- the
 * editorial hero (section 01) + the full-record claims index (section 09), both LIVE.
 * The urgency sections (mirror / stolen-years / damage-chain / target / forces) and the
 * food league-tables (sections 02-08) land in later phases.
 *
 * PURE PROJECTION (R1): no canonical value or per-topic literal. The claim cards come
 * straight from the search index (oracClaims() -> the 31 ORAC-family claims), grouped by
 * facet, big-questions first (the demo's lead) then canonical order. Prose is contained
 * (R4): every framing string is a view-copy id via ui(); Wallach's words are data (escaped).
 * The claim COUNT is oracClaims().length -- LIVE, never the demo's stale hardcoded "30".
 *
 * Layer: views/ -- reads state/ (search selectors + copy), never localStorage.
 * ===========================================================================
 */

import { SEARCH_FACETS, type SearchClaim } from '../core/schemas/index.js';
import { facetLabel, ui } from '../state/copy.js';
import { composeShortCite, oracClaims } from '../state/search.js';

// Hex escapes \x22 \x27 for " and ' -- the clean-view prose scanner (views_no_inline_prose)
// has no regex parser, so a bare quote in the char class would read to it as a string
// (mirrors knowledge-foods.ts / knowledge-topic.ts).
function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>\x22\x27]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

/**
 * Escape first, THEN turn the author's **bold** markers into <strong> -- the escaped text can
 * no longer inject markup and the tags we add are constants (the withVilliGloss pattern in
 * knowledge-foods.ts). Lets a view-copy deck carry emphasis without inlining HTML in the store.
 */
function emph(raw: string): string {
  return escHTML(raw).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/**
 * A demo-style numbered SECTION HEADER: big display number + a pre-built kicker + the heading.
 * The heading text is a view-copy id; the number is structural chrome (not prose).
 */
function sectionHeader(num: string, kickerHTML: string, headingKey: string): string {
  return `<div class="kd-orac-sec">
      <span class="kd-orac-sec__num">${escHTML(num)}</span>
      <div class="kd-orac-sec__body">
        ${kickerHTML}
        <h2 class="kd-orac-sec__h">${escHTML(ui(headingKey))}</h2>
      </div>
    </div>`;
}

/** One compact record card: the question + its one-line answer + the composed Wallach cite. */
function oracClaimCard(c: SearchClaim): string {
  return `<div class="kd-orac-claim">
      <div class="kd-orac-claim__q">${escHTML(c.question)}</div>
      <p class="kd-orac-claim__a">${escHTML(c.answer_short)}</p>
      <div class="kd-orac-claim__src">${escHTML(composeShortCite(c))}</div>
    </div>`;
}

/**
 * Group the ORAC claims into facet sections, big-questions FIRST (the signed-off demo's lead)
 * then the canonical SEARCH_FACETS order. Section headers come from facetLabel() -- single-source,
 * the same labels every other Knowledge surface uses. Empty facets are skipped.
 */
function oracClaimGroups(claims: SearchClaim[]): string {
  const order = ['big_question', ...SEARCH_FACETS.filter(f => f !== 'big_question')];
  return order.map((facet) => {
    const inFacet = claims.filter(c => c.facet === facet);
    if (inFacet.length === 0) {
      return '';
    }
    return `<div class="kd-orac-fgroup">
      <div class="kd-orac-fgroup__h">${escHTML(facetLabel(facet))}<span class="kd-orac-fgroup__n">${inFacet.length}</span></div>
      <div class="kd-orac-claimlist">${inFacet.map(oracClaimCard).join('')}</div>
    </div>`;
  }).join('');
}

/**
 * The ORAC landing (Phase 1): the editorial hero -> the full-record claims index, both live.
 * Later phases splice the urgency + food-table sections BETWEEN these two.
 */
export function renderOracTab(): string {
  const claims = oracClaims();
  const kicker = `<div class="kd-orac-sec__k">${escHTML(ui('kd_orac_claims_kicker').replace('{n}', String(claims.length)))}</div>`;
  return `<div class="kt-page kd-orac">
    <header class="kd-orac-hero">
      <div class="kd-orac-eyebrow">
        <span class="kd-orac-eyebrow__l">${escHTML(ui('kd_orac_eyebrow_l'))}</span>
        <span class="kd-orac-eyebrow__rule"></span>
        <span class="kd-orac-eyebrow__r">${escHTML(ui('kd_orac_eyebrow_r'))}</span>
      </div>
      <div class="kd-orac-hd">
        <span class="kd-orac-hd__num">01</span>
        <div>
          <h1 class="kd-orac-hero__h"><span class="l1">${escHTML(ui('kd_orac_hero_hl1'))}</span><span class="l2">${escHTML(ui('kd_orac_hero_hl2'))}</span></h1>
          <p class="kd-orac-hero__deck">${emph(ui('kd_orac_hero_deck'))}</p>
        </div>
      </div>
    </header>

    ${sectionHeader('09', kicker, 'kd_orac_claims_h')}
    <p class="kd-orac-p">${escHTML(ui('kd_orac_claims_intro'))}</p>
    <div class="kd-orac-claims">${oracClaimGroups(claims)}</div>
  </div>`;
}
