/**
 * views/knowledge-orac.ts -- the Knowledge drawer's ORAC ("how fast you rust") tab
 * ===========================================================================
 *
 * A curated, urgency-first landing for Wallach's antioxidant / ORAC teaching -- the
 * "slow the rusting" half of his longevity model. Signed-off design reference:
 * temporary/orac-EDITED.html (Luneth). Built in phases:
 *   Phase 1 (shipped): the editorial hero (01) + the full-record claims index (09).
 *   Phase 2 (THIS):   the narrative sections spliced BETWEEN hero and claims --
 *     the mirror-test (decade bars) + stolen-years (rank decline) urgency blocks,
 *     the damage chain (02), the daily target (03), and the four-pieces / forces /
 *     payoff (08). The food league-tables (04-07) await Phase-3 mining.
 *
 * PURE PROJECTION (R1/R3/§00.A): no canonical value is a literal here. Every ORAC
 * NUMBER comes from state/orac.ts (orac-data.json, each value parsed by the generator
 * from a sealed claim's byte-faithful verbatim) and is interpolated into framing PROSE
 * that lives in view-copy.json (R4). The essentials count is essentialCount() (canon).
 * The claim cards come from the search index (oracClaims() -> the 31 ORAC-family claims);
 * the claim COUNT is oracClaims().length -- LIVE, never the demo's stale hardcoded "30".
 * When orac-data is absent/invalid (defensive; it is byte-gated in practice) the narrative
 * sections are omitted and the tab still renders hero + live claims (§00.B #7).
 *
 * Layer: views/ -- reads state/ (search selectors + copy + orac numbers + essentials
 * count), never localStorage.
 * ===========================================================================
 */

import { type OracData, SEARCH_FACETS, type SearchClaim } from '../core/schemas/index.js';
import { facetLabel, ui } from '../state/copy.js';
import { essentialCount } from '../state/coverage.js';
import { oracData } from '../state/orac.js';
import { composeShortCite, oracClaims } from '../state/search.js';

const DASH = '–'; // en dash, matching the signed-off demo's numeric ranges

// Hex escapes \x22 \x27 for " and ' -- the clean-view prose scanner (views_no_inline_prose)
// has no regex parser, so a bare quote in the char class would read to it as a string
// (mirrors knowledge-foods.ts / knowledge-topic.ts).
function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>\x22\x27]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

/**
 * Escape first, THEN turn the author's **bold** / *italic* markers into <strong>/<em> --
 * the escaped text can no longer inject markup and the tags we add are constants (the
 * withVilliGloss pattern in knowledge-foods.ts). Order matters: ** is consumed before the
 * single-* pass so a bold run is not re-read as two italics. Lets a view-copy string carry
 * emphasis without inlining HTML in the store.
 */
function emph(raw: string): string {
  return escHTML(raw)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/**
 * A framing string by id with {token} placeholders filled from `repl`, then emphasised.
 * Interpolation happens BEFORE emph() escapes, so an injected value is escaped too (the
 * safe order); our values are all number strings, so nothing HTML-special is inserted.
 */
function fill(key: string, repl: Record<string, string> = {}): string {
  let s = ui(key);
  for (const k of Object.keys(repl)) {
    s = s.split(`{${k}}`).join(repl[k] ?? '');
  }
  return emph(s);
}

/** English ordinal suffix for a rank (17 -> "th", 21 -> "st") -- display chrome, not data. */
function ordinal(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) {
    return 'th';
  }
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
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

/** The small mono kicker line above a section heading (view-copy id). */
function secKicker(key: string): string {
  return `<div class="kd-orac-sec__k">${escHTML(ui(key))}</div>`;
}

// ─── §02 · the mirror test (Adelman aging-pigment decade table) ──────────────

/** Severity ramp for the four decade bars / four rank cells -- editorial chrome (CSS vars). */
const SEV_VARS = ['var(--sev-calm)', 'var(--sev-warn)', 'var(--sev-dang)', 'var(--sev-crit)'];

function renderMirror(od: OracData): string {
  const d = od.decades;
  const capKeys = ['kd_orac_dec_cap1', 'kd_orac_dec_cap2', 'kd_orac_dec_cap3', 'kd_orac_dec_cap4'];
  const cols = d.rows.map((r, i) => `<div class="kd-orac-dec">
      <div class="kd-orac-dec__bar"><div class="kd-orac-dec__fill" style="height:${r.pct}%;background:${SEV_VARS[i] ?? 'var(--sev-crit)'}"><div class="kd-orac-dec__pct" style="bottom:6px;">${r.pct}%<span class="kd-orac-dec__cap" style="display:block;">${escHTML(ui(capKeys[i] ?? ''))}</span></div></div></div>
      <div class="kd-orac-dec__age">${escHTML(ui('kd_orac_dec_age_prefix'))}${escHTML(r.age)}</div>
      <div class="kd-orac-dec__lbl">${escHTML(ui('kd_orac_dec_lbl'))}</div>
    </div>`).join('');
  return `<div class="kd-orac-mirror">
    <div class="kd-orac-mirror__k">${escHTML(ui('kd_orac_mirror_k'))}</div>
    <h2 class="kd-orac-mirror__h">${fill('kd_orac_mirror_h')}</h2>
    <p class="kd-orac-mirror__body">${fill('kd_orac_mirror_body')}</p>
    <div class="kd-orac-decades">${cols}</div>
    <div class="kd-orac-mirror__src">${escHTML(d.cite)}</div>
  </div>`;
}

// ─── §02 · the stolen years (world-longevity decline) ────────────────────────

function renderSteal(od: OracData): string {
  const s = od.stolen_years;
  const r = od.rankings;
  const cells = r.points.map((p, i) => `<div class="kd-orac-rank__c">
      <div class="kd-orac-rank__yr">${escHTML(String(p.year))}</div>
      <div class="kd-orac-rank__v" style="color:${SEV_VARS[i] ?? 'var(--sev-crit)'}">${escHTML(String(p.rank))}${ordinal(p.rank)}</div>
    </div>`).join('<span class="kd-orac-rank__arrow">→</span>');
  return `<div class="kd-orac-steal">
    <div class="kd-orac-steal__lead">${escHTML(ui('kd_orac_steal_lead'))}</div>
    <div class="kd-orac-steal__num">${escHTML(s.display)}</div>
    <p class="kd-orac-steal__body">${fill('kd_orac_steal_body', {
      shouldLow: String(s.should_low),
      shouldHigh: String(s.should_high),
      actual: String(s.actual),
      low: String(s.low),
      high: String(s.high),
    })}</p>
    <div class="kd-orac-rank">${cells}</div>
    <div class="kd-orac-mirror__src">${escHTML(r.cite)}</div>
  </div>`;
}

// ─── §02 · the damage chain (five lay-language steps) ────────────────────────

/** Per-step chrome colour ramp (calm -> critical) -- matches the signed-off demo's inline hues. */
const CHAIN_COLORS = ['#5a8ca8', '#c9902f', '#c85a2c', '#a03f2c', '#8a2f2f'];

function renderChain(): string {
  const cards = CHAIN_COLORS.map((c, i) => {
    const n = i + 1;
    return `<div class="kd-orac-chain__step" style="background:${c}">
      <div class="kd-orac-chain__i">${String(n).padStart(2, '0')}</div>
      <div class="kd-orac-chain__t">${escHTML(ui(`kd_orac_chain_s${n}_t`))}</div>
      <div class="kd-orac-chain__d">${escHTML(ui(`kd_orac_chain_s${n}_d`))}</div>
    </div>`;
  }).join('');
  return `${sectionHeader('02', secKicker('kd_orac_chain_k'), 'kd_orac_chain_h')}
    <p class="kd-orac-p">${fill('kd_orac_chain_intro')}</p>
    <div class="kd-orac-chain">${cards}</div>`;
}

// ─── §03 · the daily target ──────────────────────────────────────────────────

function renderTarget(od: OracData): string {
  const t = od.target;
  const dis = od.disease_target;
  return `${sectionHeader('03', secKicker('kd_orac_target_k'), 'kd_orac_target_h')}
    <p class="kd-orac-p">${fill('kd_orac_target_intro')}</p>
    <div class="kd-orac-target">
      <div class="kd-orac-target__main">
        <div class="kd-orac-target__lead">${escHTML(ui('kd_orac_target_lead'))}</div>
        <div class="kd-orac-target__num">${escHTML(t.low_display)}<em>${DASH}</em>${escHTML(t.high_display)}<span class="kd-orac-target__unit">${escHTML(ui('kd_orac_target_unit'))}</span></div>
        <p class="kd-orac-target__body">${fill('kd_orac_target_body', { baseAge: String(t.base_age) })}</p>
      </div>
      <div class="kd-orac-target__side">
        <div class="kd-orac-target__sk">${escHTML(ui('kd_orac_target_sk'))}</div>
        <div class="kd-orac-target__sn">${escHTML(dis.display)}</div>
        <div class="kd-orac-target__sb">${fill('kd_orac_target_sb', { diseaseMin: dis.min_display })}</div>
      </div>
    </div>`;
}

// ─── §08 · the four pieces / forces / payoff ─────────────────────────────────

function oracPiece(n: number, mod: string, repl: Record<string, string> = {}): string {
  return `<div class="kd-orac-piece kd-orac-piece--${mod}">
      <div class="kd-orac-piece__tag">${escHTML(ui(`kd_orac_piece${n}_tag`))}</div>
      <div class="kd-orac-piece__t">${escHTML(ui(`kd_orac_piece${n}_t`))}</div>
      <div class="kd-orac-piece__d">${fill(`kd_orac_piece${n}_d`, repl)}</div>
    </div>`;
}

function renderPieces(od: OracData): string {
  const t = od.target;
  const cal = od.calories;
  const cl = od.ceiling;
  const pay = od.payoff;
  const oracRange = `${t.low_display}${DASH}${t.high_display}`;
  // Demo grid order: piece 1 (here), 3 (here), 2 (diet), 4 (diet).
  const pieces = oracPiece(1, 'here', { orac: oracRange })
    + oracPiece(3, 'here')
    + oracPiece(2, 'diet', { calories: cal.display })
    + oracPiece(4, 'diet');
  return `${sectionHeader('08', secKicker('kd_orac_pieces_k'), 'kd_orac_pieces_h')}
    <p class="kd-orac-p">${fill('kd_orac_pieces_intro')}</p>
    <div class="kd-orac-pieces">${pieces}</div>
    <div class="kd-orac-abs">
      <div class="kd-orac-abs__txt">${fill('kd_orac_abs_txt')}</div>
      <button class="kd-orac-abs__btn" type="button" data-kd-tab="foods">${escHTML(ui('kd_orac_abs_btn'))}</button>
    </div>
    <p class="kd-orac-p" style="margin-top:34px; margin-bottom:12px; font-weight:700; font-size:1.25rem; text-align:center">${fill('kd_orac_forces_intro', { gap: String(cl.gap), baseAge: String(cl.base), ceiling: String(cl.ceiling) })}</p>
    <div class="kd-orac-forces">
      <div class="kd-orac-force kd-orac-force--a">
        <div class="kd-orac-force__k">${escHTML(ui('kd_orac_force_a_k'))}</div>
        <div class="kd-orac-force__t">${escHTML(ui('kd_orac_force_a_t'))}</div>
        <div class="kd-orac-force__d">${escHTML(ui('kd_orac_force_a_d'))}</div>
        <div class="kd-orac-force__big">${escHTML(ui('kd_orac_force_a_big'))}</div>
      </div>
      <div class="kd-orac-force__plus">+</div>
      <div class="kd-orac-force kd-orac-force--b">
        <div class="kd-orac-force__k">${fill('kd_orac_force_b_k', { essentials: String(essentialCount()) })}</div>
        <div class="kd-orac-force__t">${escHTML(ui('kd_orac_force_b_t'))}</div>
        <div class="kd-orac-force__d">${escHTML(ui('kd_orac_force_b_d'))}</div>
        <div class="kd-orac-force__big">${escHTML(ui('kd_orac_force_b_big'))}</div>
      </div>
    </div>
    <div class="kd-orac-payoff">
      <div class="kd-orac-payoff__n">${escHTML(pay.years_display)}</div>
      <p class="kd-orac-payoff__b">${fill('kd_orac_payoff_body', { weight: pay.weight_display, baseAge: String(t.base_age) })}</p>
      <div class="kd-orac-src">${escHTML(pay.cite)}</div>
    </div>`;
}

/** The narrative bundle (§02/§03/§08) that sits BETWEEN the hero and the claims record. */
function renderNarrative(od: OracData): string {
  return `${renderMirror(od)}
    ${renderSteal(od)}
    ${renderChain()}
    ${renderTarget(od)}
    ${renderPieces(od)}`;
}

// ─── §09 · the full-record claims index (Phase 1) ────────────────────────────

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
 * The ORAC landing: the editorial hero -> the §02/§03/§08 narrative sections (Phase 2, live
 * numbers) -> the full-record claims index. The narrative is omitted if orac-data is missing.
 */
export function renderOracTab(): string {
  const claims = oracClaims();
  const od = oracData();
  const claimsKicker = `<div class="kd-orac-sec__k">${escHTML(ui('kd_orac_claims_kicker').replace('{n}', String(claims.length)))}</div>`;
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

    ${od !== null ? renderNarrative(od) : ''}

    ${sectionHeader('09', claimsKicker, 'kd_orac_claims_h')}
    <p class="kd-orac-p">${escHTML(ui('kd_orac_claims_intro'))}</p>
    <div class="kd-orac-claims">${oracClaimGroups(claims)}</div>
  </div>`;
}
