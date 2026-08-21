/**
 * views/knowledge-orac.ts -- the Knowledge drawer's ORAC ("how fast you rust") tab
 * ===========================================================================
 *
 * A curated, urgency-first landing for Wallach's antioxidant / ORAC teaching -- the
 * "slow the rusting" half of his longevity model. The tab reads as nine numbered
 * sections: the editorial hero and the mirror-test decade bars + stolen-years rank
 * decline (01), the damage chain (02), the daily target (03), the food league-tables --
 * reach / scale / the field (04-06), the Youngevity supplement table (07), the
 * four-pieces / forces / payoff (08), and the full-record claims index (09).
 *
 * PURE PROJECTION (§00.A): no canonical value is a literal here. Every ORAC
 * NUMBER comes from state/orac.ts (orac-data.json, each value parsed by the generator
 * from a sealed claim's byte-faithful verbatim) and is interpolated into framing PROSE
 * that lives in view-copy.json. The essentials count is essentialCount() (canon).
 * The claim cards come from the search index (oracClaims()); the claim COUNT is
 * oracClaims().length -- derived at render, never a hardcoded literal.
 * When orac-data is absent/invalid (defensive; it is byte-gated in practice) the narrative
 * sections are omitted and the tab still renders hero + live claims.
 *
 * Layer: views/ -- reads state/ (search selectors + copy + orac numbers + essentials
 * count), never localStorage.
 * ===========================================================================
 */

import { type OracData, type OracFoodsData, type OracProductsData, SEARCH_FACETS, type SearchClaim } from '../core/schemas/index.js';
import { facetLabel, ui } from '../state/copy.js';
import { essentialCount } from '../state/coverage.js';
import { oracFoodsData } from '../state/orac-foods.js';
import { oracProductsData } from '../state/orac-products.js';
import { oracData } from '../state/orac.js';
import { composeCite, composeShortCite, oracClaims } from '../state/search.js';
import { glossify } from './glossify.js';
import { FORM_COLORS, formFamilyFromForm } from './knowledge-products.js';

const DASH = '–'; // en dash for numeric ranges

/** Collapse a book verbatim's hard line-wraps into one clean line (mirrors entity-page). */
function collapseWS(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

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
 * A numbered SECTION HEADER: big display number + a pre-built kicker + the heading.
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

// ─── §01 · the mirror test (Adelman aging-pigment, scrubbed through the decades) ──

/** The [low, high] ends of a Wallach age BAND ("30–40" -> [30, 40]). The band string is
 *  data (od.decades); the scrubber interpolates BETWEEN the measured points it derives,
 *  a reading device that never authors a Wallach number (see kd_orac_mirror_src_note). */
function bandEnds(band: string): [number, number] {
  const e = band.split(/[–-]/).map(s => Number(s.trim()));
  const lo = e[0] ?? 0;
  const hi = e[1] ?? lo;
  return [lo, hi];
}

function renderMirror(od: OracData): string {
  const d = od.decades;
  const capKeys = ['kd_orac_dec_cap1', 'kd_orac_dec_cap2', 'kd_orac_dec_cap3', 'kd_orac_dec_cap4'];
  // Anchor points (band-midpoint age -> pct), the scrub bounds and the four caps are ALL baked
  // from od.decades / view-copy, so the scrubber's JS reads them back and authors nothing (§00.A).
  const mids = d.rows.map((r) => { const [lo, hi] = bandEnds(r.age); return (lo + hi) / 2; });
  const meas = d.rows.map((r, i) => `${mids[i] ?? 0}:${r.pct}`).join(',');
  const firstBand = bandEnds(d.rows[0]?.age ?? '');
  const lastBand = bandEnds(d.rows[d.rows.length - 1]?.age ?? '');
  const rMin = firstBand[0];
  const rMax = lastBand[1];
  const span = rMax - rMin || 1;
  const startPct = d.rows[0]?.pct ?? 0;
  const startAge = Math.round(mids[0] ?? rMin);
  const caps = capKeys.map(k => ui(k)).join('|');
  const ticks = d.rows.map((r, i) => {
    const mid = mids[i] ?? rMin;
    const left = (mid - rMin) / span * 100;
    const on = Math.abs(mid - startAge) <= 5 ? ' kd-orac-tick--on' : '';
    return `<div class="kd-orac-tick${on}" data-age="${mid}" style="left:${left}%">${escHTML(r.age)}</div>`;
  }).join('');
  const subParts = ui('kd_orac_mirror_sub').split('{age}');
  const sub = `${emph(subParts[0] ?? '')}<span class="kd-orac-scrub__age">${startAge}</span>${emph(subParts[1] ?? '')}`;
  return `<div class="kd-orac-mirror" data-orac-scrub data-meas="${meas}" data-caps="${escHTML(caps)}">
    <div class="kd-orac-mirror__k">${escHTML(ui('kd_orac_mirror_k'))}</div>
    <h2 class="kd-orac-mirror__h">${fill('kd_orac_mirror_h')}</h2>
    <p class="kd-orac-mirror__body">${fill('kd_orac_mirror_body')}</p>
    <div class="kd-orac-cellwrap">
      <div class="kd-orac-cell"><div class="kd-orac-cell__nuc"></div><div class="kd-orac-cell__fill" style="height:${startPct}%"></div></div>
      <div class="kd-orac-read">
        <div class="kd-orac-read__pct"><span class="kd-orac-read__pctv">${startPct}</span>%</div>
        <div class="kd-orac-read__cap">${escHTML(ui(capKeys[0] ?? ''))}</div>
        <p class="kd-orac-read__sub">${sub}</p>
        <div class="kd-orac-scrub">
          <div class="kd-orac-scrub__lbl"><span aria-hidden="true">&#9668;</span>${escHTML(ui('kd_orac_scrub_label'))}<span aria-hidden="true">&#9658;</span></div>
          <input type="range" class="kd-orac-scrub__range" min="${rMin}" max="${rMax}" step="1" value="${startAge}" aria-label="${escHTML(ui('kd_orac_scrub_label'))}">
          <div class="kd-orac-ticks">${ticks}</div>
        </div>
      </div>
    </div>
    <div class="kd-orac-mirror__src">${escHTML(d.cite)} · ${escHTML(ui('kd_orac_mirror_src_note'))}</div>
  </div>`;
}

// ─── §01 · the stolen years (world-longevity decline) ────────────────────────

function renderSteal(od: OracData): string {
  const s = od.stolen_years;
  const r = od.rankings;
  const last = r.points.length - 1;
  // Ranks read in ink; only the newest (deepest decline) takes the accent.
  const cells = r.points.map((p, i) => {
    const style = i === last ? ' style="color:var(--ds-accent-deep)"' : '';
    return `<div class="kd-orac-rank__c">
      <div class="kd-orac-rank__yr">${escHTML(String(p.year))}</div>
      <div class="kd-orac-rank__v"${style}>${escHTML(String(p.rank))}${ordinal(p.rank)}</div>
    </div>`;
  }).join('<span class="kd-orac-rank__arrow">→</span>');
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

/** The five chain cards ride the pale→vivid accumulation ramp (--p0..--p4, defined in
 *  drawer-orac.css); the step count matches the kd_orac_chain_s1..s5 copy. */
function renderChain(): string {
  const cards = [0, 1, 2, 3, 4].map((i) => {
    const n = i + 1;
    return `<div class="kd-orac-chain__step" style="--f:var(--p${i})">
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
  // Grid order: piece 1 (here), 3 (here), 2 (diet), 4 (diet) -- the two "here" pieces lead.
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

// ─── §04–§06 · the food league-tables (reach / scale / the field) ────────────

/**
 * The CSS custom-property a food family maps to. The curation stores a token name
 * ('o-nut', 'o-spice', …) per row/category; every family reads its own --o-* colour
 * EXCEPT spices, which read a field-only --of-spice so recolouring the spice FOOD hue
 * cannot shift §07's supplement-leader fallback (which still reads --o-spice).
 */
function foodColorVar(token: string): string {
  return token === 'o-spice' ? 'var(--of-spice)' : `var(--${token})`;
}

/** §04 REACH: each curated food as a bar toward the daily target (pct is the label). */
function renderReach(f: OracFoodsData): string {
  const rows = f.reach.rows.map(r => `<div class="kd-orac-reach__row" style="--fc:${foodColorVar(r.color)}">
      <span class="kd-orac-reach__name"><i class="kd-orac-reach__dot" aria-hidden="true"></i>${escHTML(r.name)}</span>
      <span class="kd-orac-reach__track"><span class="kd-orac-reach__fill" style="width:${Math.min(100, r.pct)}%"></span>${r.over ? '<span class="kd-orac-reach__over"></span>' : ''}</span>
      <span class="kd-orac-reach__pct"><b>${r.pct}%</b> ${escHTML(ui('kd_orac_reach_of_day'))}</span>
    </div>`).join('');
  return `${sectionHeader('04', secKicker('kd_orac_reach_k'), 'kd_orac_reach_h')}
    <p class="kd-orac-p">${fill('kd_orac_reach_intro', { target: f.reach.target_display })}</p>
    <div class="kd-orac-reach" id="reach">${rows}</div>
    <div class="kd-orac-reach__rest">${fill('kd_orac_reach_rest')}</div>
    <div class="kd-orac-reach__cap">${fill('kd_orac_reach_cap', { cite: f.reach.cite })}</div>`;
}

/** §05 SCALE: the spice-outlier bars on one linear axis, with the fruit-vanishes note. */
function renderScale(f: OracFoodsData): string {
  const rows = f.scale.rows.map(r => `<div class="kd-orac-scale__row" style="--fc:${foodColorVar(r.color)}"><span class="kd-orac-scale__nm">${escHTML(r.name)}</span><span class="kd-orac-scale__tr"><span class="kd-orac-scale__fl" style="width:${r.bar}%"></span></span><span class="kd-orac-scale__vl">${escHTML(r.value_display)}</span></div>`).join('');
  return `${sectionHeader('05', secKicker('kd_orac_scale_k'), 'kd_orac_scale_h')}
    <div class="kd-orac-scale" id="scale">${rows}<p class="kd-orac-scale__note">${fill('kd_orac_scale_note', { cloves: f.scale.max_display })}</p></div>`;
}

// ── §06 THE FIELD — every food on one axis, positions baked at render ─────────

/** A comma-grouped display value ("314,446") reparsed to its number. This REFORMATS a
 *  sealed-derived figure (value_display originates in orac-foods-data.json); it authors
 *  nothing (§00.A). */
function foodValue(display: string): number {
  return Number(String(display).replace(/[^0-9.]/g, ''));
}

// The plot's ONE mapping. PLOT_FLOOR/PLOT_MAX are axis layout
// constants, not ORAC values: PLOT_MAX < 100 keeps the top dot clear of the right edge
// without padding the rail, and FLOOR is the log axis's left anchor.
const PLOT_FLOOR = 300;
const PLOT_MAX = 95.5;

/** Position (0–PLOT_MAX %) of a value on the log or linear axis, given the field's max. */
function plotPos(v: number, max: number, mode: 'log' | 'lin'): number {
  if (mode === 'lin') {
    return (max > 0 ? v / max : 0) * PLOT_MAX;
  }
  const loL = Math.log10(PLOT_FLOOR);
  const hiL = Math.log10(Math.max(PLOT_FLOOR + 1, max));
  const frac = (Math.log10(Math.max(PLOT_FLOOR, v)) - loL) / (hiL - loL);
  return frac * PLOT_MAX;
}

// Dots ride LOW in the lane; a collider is bumped a small step and alternated onto a second
// vertical band so touching values stay individually hoverable. All in %, so the same numbers
// drive log and linear.
const DOT_TOP_A = 64;
const DOT_TOP_B = 40;
const DOT_MIN_ADJ = 1.25;  // min centre-to-centre between neighbours (opposite bands allowed)
const DOT_MIN_SAME = 2.1;  // closer than this, push the collider onto the other vertical band

/** Spread one lane's dot positions: keep them apart horizontally, stagger unavoidable stacks
 *  vertically. Returns {left, top} per input index (input order preserved). */
function spreadLane(positions: number[]): Array<{ left: number; top: number }> {
  const order = positions.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const out: Array<{ left: number; top: number }> = positions.map(() => ({ left: 0, top: DOT_TOP_A }));
  let prevLeft = -Infinity;
  let prevBand = 1;
  for (const { p, i } of order) {
    let left = p;
    if (left - prevLeft < DOT_MIN_ADJ) {
      left = prevLeft + DOT_MIN_ADJ;
    }
    const band = (left - prevLeft < DOT_MIN_SAME) ? (prevBand === 0 ? 1 : 0) : 0;
    out[i] = { left, top: band === 0 ? DOT_TOP_A : DOT_TOP_B };
    prevLeft = left;
    prevBand = band;
  }
  return out;
}

/** §06 THE FIELD: every food on one shared axis, one dot each, split into family lanes.
 *  Every position is computed HERE (log AND linear) and baked into style + data-* so the
 *  static figure is correct with zero post-render JS; the mode toggle / hover / legend only
 *  read the baked values (progressive enhancement, wired in knowledge.ts mount). */
function renderField(od: OracData, f: OracFoodsData): string {
  const cats = f.tables.categories;
  const target = f.reach.target;
  const targetDisplay = f.reach.target_display;
  let max = 0;
  for (const cat of cats) {
    for (const r of cat.rows) {
      max = Math.max(max, foodValue(r.value_display));
    }
  }
  const baseBasis = cats[0]?.basis ?? '';
  const shareText = fill('kd_orac_field_tip_share', { target: targetDisplay });
  const clamp = (x: number): number => Math.max(5, Math.min(82, x));

  const lanes = cats.map((cat) => {
    const vals = cat.rows.map(r => foodValue(r.value_display));
    const posLog = spreadLane(vals.map(v => plotPos(v, max, 'log')));
    const posLin = spreadLane(vals.map(v => plotPos(v, max, 'lin')));
    const colorVar = foodColorVar(cat.color);
    const unit = `${ui('kd_orac_field_unit')} · ${cat.basis}`;
    let topIdx = 0;
    let topV = -Infinity;
    vals.forEach((v, i) => { if (v > topV) { topV = v; topIdx = i; } });
    const dotMeta = cat.rows.map((r, i) => ({
      r,
      v: vals[i] ?? 0,
      pl: posLog[i] ?? { left: 0, top: DOT_TOP_A },
      pn: posLin[i] ?? { left: 0, top: DOT_TOP_A },
    }));
    const dots = dotMeta.map(({ r, v, pl, pn }) => {
      const share = target > 0 ? v / target * 100 : 0;
      const shareStr = share >= 100 ? `${Math.round(share)}%` : `${share.toFixed(1)}%`;
      const barPct = Math.min(100, share);
      return `<span class="kd-orac-dot" style="left:${pl.left}%;top:${pl.top}%"`
        + ` data-left-log="${pl.left}" data-top-log="${pl.top}" data-left-lin="${pn.left}" data-top-lin="${pn.top}"`
        + ` data-n="${escHTML(r.name)}" data-vd="${escHTML(r.value_display)}" data-fam="${escHTML(cat.label)}"`
        + ` data-c="${colorVar}" data-unit="${escHTML(unit)}" data-share="${shareStr}"`
        + ` data-sharetext="${escHTML(shareText)}" data-barpct="${barPct}"></span>`;
    }).join('');
    const topRow = cat.rows[topIdx];
    const topL = clamp((posLog[topIdx] ?? { left: 0 }).left);
    const topN = clamp((posLin[topIdx] ?? { left: 0 }).left);
    const topLabel = topRow !== undefined
      ? `<span class="kd-orac-top" style="left:${topL}%" data-left-log="${topL}" data-left-lin="${topN}">${escHTML(topRow.name)} · <b>${escHTML(topRow.value_display)}</b></span>`
      : '';
    const sub = cat.basis !== baseBasis ? `<i>${escHTML(cat.basis)}</i>` : '';
    return `<div class="kd-orac-lane" data-fam="${escHTML(cat.key)}" style="--fc:${colorVar}">
        <div class="kd-orac-lane__n"><span><b>${escHTML(cat.label)}</b>${sub}</span><span class="kd-orac-lane__sw" aria-hidden="true"></span></div>
        <div class="kd-orac-rail">${dots}${topLabel}</div>
      </div>`;
  }).join('');

  const tgtLog = plotPos(target, max, 'log');
  const tgtLin = plotPos(target, max, 'lin');
  const logTicks: number[] = [];
  for (let e = Math.ceil(Math.log10(PLOT_FLOOR + 1)); Math.pow(10, e) < max; e++) {
    logTicks.push(Math.pow(10, e));
  }
  const linStep = 1e5;
  const linTicks: number[] = [0];
  for (let v = linStep; v < max; v += linStep) {
    linTicks.push(v);
  }
  const axisLog = logTicks.map(v => `<i class="kd-orac-axis__tick kd-orac-axis__tick--log" style="left:${plotPos(v, max, 'log')}%">${v.toLocaleString('en-US')}</i>`).join('');
  const axisLin = linTicks.map(v => `<i class="kd-orac-axis__tick kd-orac-axis__tick--lin" style="left:${plotPos(v, max, 'lin')}%">${v.toLocaleString('en-US')}</i>`).join('');
  const legend = cats.map(cat => `<button type="button" class="kd-orac-keyb" data-fam="${escHTML(cat.key)}" style="--fc:${foodColorVar(cat.color)}"><i aria-hidden="true"></i>${escHTML(cat.label)}</button>`).join('');

  return `${sectionHeader('06', secKicker('kd_orac_tables_k'), 'kd_orac_tables_h')}
    <p class="kd-orac-p">${fill('kd_orac_tables_intro')}</p>
    <div class="kd-orac-field" data-orac-field data-mode="log">
      <div class="kd-orac-fld__ctl">
        <span class="kd-orac-fld__hint"><i aria-hidden="true"></i>${escHTML(ui('kd_orac_field_hint'))}</span>
        <div class="kd-orac-seg">
          <button type="button" class="kd-orac-seg__btn" data-orac-mode="log">${escHTML(ui('kd_orac_field_log'))}</button>
          <button type="button" class="kd-orac-seg__btn" data-orac-mode="lin">${escHTML(ui('kd_orac_field_lin'))}</button>
        </div>
      </div>
      <div class="kd-orac-fld__plot">
        <div class="kd-orac-fld__lines"><div class="kd-orac-fld__tgt" style="left:${tgtLog}%" data-left-log="${tgtLog}" data-left-lin="${tgtLin}"><b>${escHTML(targetDisplay)} · ${escHTML(ui('kd_orac_field_tgt_suffix'))}</b></div></div>
        ${lanes}
        <div class="kd-orac-fld__axis">${axisLog}${axisLin}</div>
        <div class="kd-orac-fld__tip">
          <div class="kd-orac-tip__fam"><i aria-hidden="true"></i><span class="kd-orac-tip__fam-t"></span></div>
          <div class="kd-orac-tip__n"></div>
          <div class="kd-orac-tip__v"></div>
          <div class="kd-orac-tip__u"></div>
          <div class="kd-orac-tip__bar"><span></span></div>
          <div class="kd-orac-tip__pct"><b class="kd-orac-tip__pct-v"></b> <span class="kd-orac-tip__pct-t"></span></div>
        </div>
      </div>
    </div>
    <div class="kd-orac-fld__key">${legend}</div>
    <div class="kd-orac-fld__src">${fill('kd_orac_field_src', { cite: f.reach.cite })}</div>
    <div class="kd-orac-bridge">
      <div class="kd-orac-bridge__k">${escHTML(ui('kd_orac_bridge_k'))}</div>
      <p class="kd-orac-bridge__b">${fill('kd_orac_bridge_b', { low: od.target.low_display, high: od.target.high_display })}</p>
    </div>`;
}

// ── §06 field + §01 scrubber interactivity (progressive enhancement) ──────────
// Delegated from knowledge.ts mount(): the static render above is already correct, so these
// only READ the baked positions / data-* and mutate class + inline style. No number is
// authored here and no user-facing string is assembled — the tip text is baked at render.

/** Interpolate the mirror cell's fill + readout as the age scrubber moves (§01). */
export function oracScrubInput(input: HTMLInputElement): void {
  const root = input.closest<HTMLElement>('[data-orac-scrub]');
  if (root === null) {
    return;
  }
  const meas: Array<[number, number]> = (root.dataset['meas'] ?? '').split(',').map((pair) => {
    const parts = pair.split(':');
    return [Number(parts[0] ?? 0), Number(parts[1] ?? 0)] as [number, number];
  });
  const first = meas[0];
  const lastM = meas[meas.length - 1];
  if (first === undefined || lastM === undefined) {
    return;
  }
  const caps = (root.dataset['caps'] ?? '').split('|');
  const a = Number(input.value);
  let p = first[1];
  if (a <= first[0]) {
    p = first[1];
  }
  else if (a >= lastM[0]) {
    p = lastM[1];
  }
  else {
    for (let i = 0; i < meas.length - 1; i++) {
      const x = meas[i];
      const y = meas[i + 1];
      if (x !== undefined && y !== undefined && a >= x[0] && a <= y[0]) {
        p = x[1] + (y[1] - x[1]) * (a - x[0]) / (y[0] - x[0]);
        break;
      }
    }
  }
  let k = 0;
  meas.forEach((m, i) => { if (a >= m[0]) { k = i; } });
  const fill = root.querySelector<HTMLElement>('.kd-orac-cell__fill');
  const pv = root.querySelector<HTMLElement>('.kd-orac-read__pctv');
  const cap = root.querySelector<HTMLElement>('.kd-orac-read__cap');
  const age = root.querySelector<HTMLElement>('.kd-orac-scrub__age');
  if (fill !== null) { fill.style.height = `${p.toFixed(2)}%`; }
  if (pv !== null) { pv.textContent = String(Math.round(p)); }
  if (cap !== null) { cap.textContent = caps[k] ?? ''; }
  if (age !== null) { age.textContent = String(Math.round(a)); }
  root.querySelectorAll<HTMLElement>('.kd-orac-tick').forEach((t) => {
    const ta = Number(t.dataset['age']);
    t.classList.toggle('kd-orac-tick--on', Math.abs(ta - a) <= 5);
  });
}

function oracShowTip(field: HTMLElement, dot: HTMLElement): void {
  const tip = field.querySelector<HTMLElement>('.kd-orac-fld__tip');
  const plot = field.querySelector<HTMLElement>('.kd-orac-fld__plot');
  if (tip === null || plot === null) {
    return;
  }
  tip.style.setProperty('--fc', dot.dataset['c'] ?? 'var(--ds-accent)');
  const set = (sel: string, val: string): void => {
    const el = tip.querySelector<HTMLElement>(sel);
    if (el !== null) { el.textContent = val; }
  };
  set('.kd-orac-tip__fam-t', dot.dataset['fam'] ?? '');
  set('.kd-orac-tip__n', dot.dataset['n'] ?? '');
  set('.kd-orac-tip__v', dot.dataset['vd'] ?? '');
  set('.kd-orac-tip__u', dot.dataset['unit'] ?? '');
  set('.kd-orac-tip__pct-v', dot.dataset['share'] ?? '');
  set('.kd-orac-tip__pct-t', dot.dataset['sharetext'] ?? '');
  const bar = tip.querySelector<HTMLElement>('.kd-orac-tip__bar span');
  if (bar !== null) { bar.style.width = `${dot.dataset['barpct'] ?? '0'}%`; }
  const pr = plot.getBoundingClientRect();
  const dr = dot.getBoundingClientRect();
  const w = tip.offsetWidth || 232;
  const h = tip.offsetHeight || 168;
  let x = dr.left - pr.left + dr.width / 2 - w / 2;
  x = Math.max(6, Math.min(pr.width - w - 6, x));
  let y = dr.top - pr.top - h - 12;
  if (y < 4) { y = dr.top - pr.top + dr.height + 12; }
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
  tip.classList.add('kd-orac-fld__tip--on');
  const lane = dot.closest<HTMLElement>('.kd-orac-lane');
  field.querySelectorAll<HTMLElement>('.kd-orac-lane').forEach(l => l.classList.toggle('kd-orac-lane--hot', l === lane));
}

function oracHideTip(field: HTMLElement): void {
  if (field.classList.contains('kd-orac-field--pinned')) {
    return;
  }
  const tip = field.querySelector<HTMLElement>('.kd-orac-fld__tip');
  if (tip !== null) { tip.classList.remove('kd-orac-fld__tip--on'); }
  field.querySelectorAll<HTMLElement>('.kd-orac-lane--hot').forEach(l => l.classList.remove('kd-orac-lane--hot'));
}

function oracSetMode(field: HTMLElement, mode: 'log' | 'lin'): void {
  field.dataset['mode'] = mode;
  const leftKey = mode === 'lin' ? 'leftLin' : 'leftLog';
  const topKey = mode === 'lin' ? 'topLin' : 'topLog';
  field.querySelectorAll<HTMLElement>('.kd-orac-dot').forEach((d) => {
    const lv = d.dataset[leftKey];
    const tv = d.dataset[topKey];
    if (lv !== undefined) { d.style.left = `${lv}%`; }
    if (tv !== undefined) { d.style.top = `${tv}%`; }
  });
  field.querySelectorAll<HTMLElement>('.kd-orac-top').forEach((t) => {
    const lv = t.dataset[leftKey];
    if (lv !== undefined) { t.style.left = `${lv}%`; }
  });
  const tgt = field.querySelector<HTMLElement>('.kd-orac-fld__tgt');
  if (tgt !== null) {
    const lv = tgt.dataset[leftKey];
    if (lv !== undefined) { tgt.style.left = `${lv}%`; }
  }
  const pinned = field.querySelector<HTMLElement>('.kd-orac-dot--pin');
  if (pinned !== null) { oracShowTip(field, pinned); }
}

/** Hover a dot: show its tip unless a dot is pinned open. */
export function oracFieldHover(dot: HTMLElement): void {
  const field = dot.closest<HTMLElement>('.kd-orac-field');
  if (field === null || field.classList.contains('kd-orac-field--pinned')) {
    return;
  }
  oracShowTip(field, dot);
}

/** Leave a dot: hide the tip unless one is pinned. */
export function oracFieldOut(dot: HTMLElement): void {
  const field = dot.closest<HTMLElement>('.kd-orac-field');
  if (field !== null) { oracHideTip(field); }
}

/** Handle a click inside the ORAC field (mode toggle, legend filter, dot pin, plot clear).
 *  Returns true when the click was a field control, so the caller stops. */
export function oracFieldClick(target: HTMLElement): boolean {
  const field = target.closest<HTMLElement>('.kd-orac')?.querySelector<HTMLElement>('.kd-orac-field') ?? null;
  if (field === null) {
    return false;
  }
  const modeBtn = target.closest<HTMLElement>('[data-orac-mode]');
  if (modeBtn !== null) {
    oracSetMode(field, modeBtn.dataset['oracMode'] === 'lin' ? 'lin' : 'log');
    return true;
  }
  const keyBtn = target.closest<HTMLElement>('.kd-orac-keyb');
  if (keyBtn !== null) {
    const fam = keyBtn.dataset['fam'] ?? '';
    const off = keyBtn.classList.toggle('kd-orac-keyb--off');
    field.querySelectorAll<HTMLElement>('.kd-orac-lane').forEach((l) => {
      if (l.dataset['fam'] === fam) { l.style.display = off ? 'none' : ''; }
    });
    return true;
  }
  const dot = target.closest<HTMLElement>('.kd-orac-dot');
  if (dot !== null) {
    const wasPinned = field.classList.contains('kd-orac-field--pinned') && dot.classList.contains('kd-orac-dot--pin');
    field.querySelectorAll<HTMLElement>('.kd-orac-dot--pin').forEach(d => d.classList.remove('kd-orac-dot--pin'));
    if (wasPinned) {
      field.classList.remove('kd-orac-field--pinned');
      oracHideTip(field);
    }
    else {
      field.classList.add('kd-orac-field--pinned');
      dot.classList.add('kd-orac-dot--pin');
      oracShowTip(field, dot);
    }
    return true;
  }
  if (target.closest('.kd-orac-fld__plot') !== null) {
    field.classList.remove('kd-orac-field--pinned');
    field.querySelectorAll<HTMLElement>('.kd-orac-dot--pin').forEach(d => d.classList.remove('kd-orac-dot--pin'));
    oracHideTip(field);
    return true;
  }
  return false;
}

/**
 * A product's delivery-form FAMILY + accent hex, pulled from the SAME source the product detail pages
 * use (knowledge-products FORM_COLORS / formFamilyFromForm) so a supplement's badge + bar colour-match
 * its own full product page. Empty hex -> the CSS fallback tint.
 */
function formInfo(form: string): { label: string; color: string } {
  const fam = formFamilyFromForm(form);
  return { label: fam.charAt(0).toUpperCase() + fam.slice(1), color: FORM_COLORS[fam] ?? '' };
}

/**
 * §07 SUPPLEMENTS: Youngevity products with an OFFICIAL per-serving ORAC (source: ygy) -- the top
 * scorer as a standout "leader" card, the rest as a value league-table. Each row opens that product's
 * detail page: data-kd-product routes through the drawer's delegated handler (knowledge.ts), and because
 * the click fires on the ORAC tab, the drawer sets a breadcrumb back to ORAC + a "Go back" label. Every
 * number here is Youngevity composition / measured-property data -- never a Wallach amount (§00.A).
 */
function renderSupplements(p: OracProductsData): string {
  const L = p.leader;
  const li = formInfo(L.form);
  const lStyle = li.color.length > 0 ? ` style="--fc:${li.color}"` : '';
  const leader = `<button type="button" class="kd-orac-supp__leader" data-kd-product="${escHTML(L.product_id)}"${lStyle}>
      <span class="kd-orac-supp__tag">${escHTML(ui('kd_orac_supp_leader_tag'))}</span>
      <span class="kd-orac-supp__lead-top"><span class="kd-orac-supp__lead-name">${escHTML(L.name)}</span><span class="kd-orac-supp__form">${escHTML(li.label)}</span></span>
      <span class="kd-orac-supp__lead-meta"><span class="v"><strong>${escHTML(L.value_display)}</strong> ${escHTML(ui('kd_orac_supp_per_dollar'))}</span><span class="kd-orac-supp__dot" aria-hidden="true">·</span><span class="p">${escHTML(L.price_display)} ${escHTML(ui('kd_orac_supp_wholesale'))}</span></span>
      <span class="kd-orac-supp__lead-score"><span class="n">${escHTML(L.orac_display)}</span><span class="u">${escHTML(ui('kd_orac_supp_unit'))}</span></span>
    </button>`;
  const rows = p.rows.map((r) => {
    const fi = formInfo(r.form);
    const barStyle = fi.color.length > 0 ? `width:${r.bar}%;--fc:${fi.color}` : `width:${r.bar}%`;
    const badge = fi.color.length > 0 ? ` style="--fc:${fi.color}"` : '';
    return `<button type="button" class="kd-orac-supp__row" data-kd-product="${escHTML(r.product_id)}">
      <span class="kd-orac-supp__row-head"><span class="kd-orac-supp__row-name">${escHTML(r.name)}</span><span class="kd-orac-supp__form"${badge}>${escHTML(fi.label)}</span></span>
      <span class="kd-orac-supp__row-track"><span class="kd-orac-supp__row-fill" style="${barStyle}"></span></span>
      <span class="kd-orac-supp__row-nums"><span class="s">${escHTML(r.orac_display)}</span><span class="sub"><span class="v">${escHTML(r.value_display)}</span> ${escHTML(ui('kd_orac_supp_per_dollar'))} · ${escHTML(r.price_display)}</span></span>
      <span class="kd-orac-supp__go" aria-hidden="true">›</span>
    </button>`;
  }).join('');
  const cap = [p.cite, p.untested_note].filter(s => s.length > 0).join(' · ');
  return `${sectionHeader('07', secKicker('kd_orac_supp_k'), 'kd_orac_supp_h')}
    <p class="kd-orac-p">${fill('kd_orac_supp_intro')}</p>
    <div class="kd-orac-supp" id="supplements">
      ${leader}
      <div class="kd-orac-supp__rows">${rows}</div>
      ${cap.length > 0 ? `<div class="kd-orac-supp__cap">${escHTML(cap)}</div>` : ''}
    </div>`;
}

/** The §04–§06 food league-tables bundle (reach / scale / the field). */
function renderFoods(od: OracData, f: OracFoodsData): string {
  return `${renderReach(f)}
    ${renderScale(f)}
    ${renderField(od, f)}`;
}

/** The narrative bundle (§02–§08) that sits BETWEEN the hero and the claims record. */
function renderNarrative(od: OracData, ofd: OracFoodsData | null, opd: OracProductsData | null): string {
  return `${renderMirror(od)}
    ${renderSteal(od)}
    ${renderChain()}
    ${renderTarget(od)}
    ${ofd !== null ? renderFoods(od, ofd) : ''}
    ${opd !== null ? renderSupplements(opd) : ''}
    ${renderPieces(od)}`;
}

// ─── §09 · the full-record claims index ────────────────────────────────────

/**
 * One record card -- a native <details> disclosure (no JS wiring; the browser toggles it).
 * Collapsed shows question + one-line answer + compact cite;
 * expanded reveals the fuller answer (when it adds to the short one), Wallach's exact words
 * (glossified), and the full citation. composeCite/composeShortCite compose from the registry
 * never hand-typed.
 */
function oracClaimCard(c: SearchClaim): string {
  const cite = composeCite(c);
  const fullAnswer = c.answer.trim() === c.answer_short.trim()
    ? ''
    : `<p class="kd-orac-claim__full">${glossify(c.answer)}</p>`;
  return `<details class="kd-orac-claim">
      <summary class="kd-orac-claim__summary">
        <div class="kd-orac-claim__q">${escHTML(c.question)}</div>
        <span class="kd-orac-claim__chev" aria-hidden="true">▸</span>
        <p class="kd-orac-claim__a">${escHTML(c.answer_short)}</p>
        <div class="kd-orac-claim__src">${escHTML(composeShortCite(c))}</div>
      </summary>
      <div class="kd-orac-claim__body">
        ${fullAnswer}
        <blockquote class="kd-orac-claim__verbatim">“${glossify(collapseWS(c.verbatim))}”</blockquote>
        ${cite.length > 0 ? `<div class="kd-orac-claim__cite">— Dr. Joel Wallach · ${escHTML(cite)}</div>` : ''}
      </div>
    </details>`;
}

/**
 * Group the ORAC claims into facet sections, big-questions FIRST then the canonical
 * SEARCH_FACETS order. Section headers come from facetLabel() -- single-source,
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
 * The ORAC landing: the editorial hero (01) -> the narrative sections 01-08 (mirror test,
 * stolen years, damage chain, daily target, the food league-tables, the supplement table,
 * four pieces / forces / payoff) -> the full-record claims index (09). The narrative is
 * omitted if orac-data is missing.
 */
export function renderOracTab(): string {
  const claims = oracClaims();
  const od = oracData();
  const ofd = oracFoodsData();
  const opd = oracProductsData();
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

    ${od !== null ? renderNarrative(od, ofd, opd) : ''}

    ${sectionHeader('09', claimsKicker, 'kd_orac_claims_h')}
    <p class="kd-orac-p">${escHTML(ui('kd_orac_claims_intro'))}</p>
    <div class="kd-orac-claims">${oracClaimGroups(claims)}</div>
  </div>`;
}
