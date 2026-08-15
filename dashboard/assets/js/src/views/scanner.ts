/**
 * views/scanner.ts — the Scanner workspace (Scan · Confirm · Result)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * RE-CREATED 2026-08-13 from the design-approved demo
 * temporary/ready-to-be-ported/scanner-demo-3-verdict-r3.html — on the real
 * engine, ADAPTED not transplanted. Supersedes the v3 single-screen theatrical
 * port (fake ms + a cipher animation).
 *
 * THE REFRAME (Luneth): OCR is imperfect offline (local Tesseract), so the verdict
 * is WITHHELD until the user confirms the reads:  1. SCAN → 2. CONFIRM → 3. RESULT.
 *
 * WHAT IS REAL (no fabrication):
 *   · SCAN decodes the image with the vendored Tesseract (state/ocr.ocrToLabel) —
 *     local, zero network, and it does NOT run the verdict.
 *   · CONFIRM is the hero: every read is editable; an unmapped nutrient shows the
 *     real top-4 findNutrientCandidates; garbled ingredient words show
 *     findIngredientSuspects (the recovered legacy suggestion engine); the Wallach
 *     flags come from the engine's antiFlags (scoreLabel, non-logging) with their
 *     own nuance text. NO fabricated confidence number — a read is mapped ✓ or not.
 *   · RESULT fires runScan(correctedLabel): the ADD/SAVE/REJECT verdict + reasons
 *     trace to Wallach doctrine only; the 47→55 coverage delta is coverageDeltaForLabel
 *     (the live snapshot + the label's own amounts, never a hand-typed number).
 *   · Adopt lands the item marked provenance 'user_scanned' (the §5.4 wall). Scan
 *     history is the real FIFO (max 5). Every name is written via .textContent.
 *
 * §17 recovery: `git checkout HEAD -- dashboard/assets/js/src/views/scanner.ts`.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { RegimenItem, ScanLabel } from '../core/schemas/index.js';
import { on } from '../core/events.js';
import { essentialCount, getOrCompute, matchEssential } from '../state/coverage.js';
import {
  findIngredientSuspects,
  findNutrientCandidates,
  type IngredientSuspect,
  ocrToLabel,
} from '../state/ocr.js';
import { loadRgManual, saveRgManual } from '../state/regimen.js';
import {
  type AntiFlag,
  coverageDeltaForLabel,
  getHistory,
  getSaved,
  type HistoryEntry,
  humanizeName,
  removeSaved,
  runScan,
  saveScan,
  type ScanResult,
  scoreLabel,
  type Verdict,
} from '../state/scanner.js';

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

type ScState = 'idle' | 'scanning' | 'confirming' | 'result';
type Nutrient = NonNullable<ScanLabel['nutrients']>[number];

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }[c] as string));
}

const CLOSE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

const VERDICT_TONE: Record<Verdict, string> = {
  ADD: 'var(--ds-status-ok)',
  SAVE: 'var(--ds-status-warn)',
  REJECT: 'var(--ds-status-err)',
};

function verdictHeadline(v: Verdict): { head: string; sub: string } {
  if (v === 'ADD') {
    return { head: 'Aligns', sub: 'Worth adding' };
  }
  if (v === 'SAVE') {
    return { head: 'Partial', sub: 'Worth considering' };
  }
  return { head: 'Out', sub: 'Doesn’t fit the framework' };
}

// ─── STEP 1 · SCAN ─────────────────────────────────────────────────────────────

const SCAN_STEP_LABELS = ['Prepare', 'Load engine', 'Read label'];

/**
 * The Scan step while OCR runs: the staged progress indicator (concept C), fed live by the
 * real `lcscan:progress` events — the stepper + bar update in place (see mount's onProgress),
 * never a full re-render. Setup phases show an indeterminate sweep; the read phase fills for real.
 */
function renderScanning(): string {
  return `<div class="vd-scan">
        <button class="ds-btn-primary vd-newscan" type="button" disabled><b aria-hidden="true">+</b> New Scan</button>
        <div class="vd-drop vd-drop--busy">
          <div class="vd-prog is-indet" data-prog>
            <div class="vd-steps">
              <span class="vd-steps__i is-active" data-step="0">Prepare</span>
              <span class="vd-steps__i" data-step="1">Load engine</span>
              <span class="vd-steps__i" data-step="2">Read label</span>
            </div>
            <div class="vd-prog__track"><div class="vd-prog__fill" data-prog-fill></div></div>
            <div class="vd-prog__row">
              <span class="vd-prog__msg" data-prog-msg>Preparing the image…</span>
              <span class="vd-prog__pct" data-prog-pct></span>
            </div>
            <div class="vd-prog__note">OCR runs locally — slow by design, nothing uploaded</div>
          </div>
        </div>
      </div>`;
}

/** An honest, actionable failure card for the Scan step — shown instead of an infinite spinner when
 *  OCR can't load (the model fetch is blocked on a raw file:// open) or a read fails. Retry re-opens
 *  the file picker. */
function renderScanError(message: string): string {
  return `<div class="vd-error" role="alert">
      <span class="vd-error__ic" aria-hidden="true">!</span>
      <div class="vd-error__body">
        <div class="vd-error__t">Couldn’t read the label</div>
        <div class="vd-error__m">${escHTML(message)}</div>
      </div>
      <button class="ds-btn-primary vd-error__retry" type="button" data-sc-upload>Try again</button>
    </div>`;
}

/** Map an OCR failure to a plain, actionable line — a file:// model-fetch block gets specific guidance. */
function scanErrorMessage(e: unknown): string {
  const code = e instanceof Error ? e.message : String(e);
  if (code.includes('OCR_MODEL_UNREACHABLE')) {
    return 'Couldn’t reach the OCR language model. Check your connection and scan again.';
  }
  if (code.includes('OCR_TIMEOUT')) {
    return 'The OCR engine took too long to load and timed out. Scan again.';
  }
  return 'Something went wrong while reading that image. Try a clearer photo, or scan again.';
}

function renderScan(state: ScState, fileName: string | null, dataUrl: string | null): string {
  const done = state === 'confirming' || state === 'result';
  const badge = done ? 'is-done' : 'is-active';
  const stateChip = done
    ? '<span class="vd-step__state is-done">Done &check;</span>'
    : (state === 'scanning'
        ? '<span class="vd-step__state is-active">Reading…</span>'
        : '<span class="vd-step__state is-active">Start here</span>');
  const body = done
    ? `<div class="vd-scan">
        <button class="ds-btn-primary vd-newscan" type="button" data-sc-new><b aria-hidden="true">+</b> New Scan</button>
        <div class="vd-scan__thumb">
          ${dataUrl !== null ? `<img class="vd-scan__img" src="${escHTML(dataUrl)}" alt="Your scanned label">` : ''}
          <div class="vd-scan__meta">
            <span class="vd-scan__file">${escHTML(fileName ?? 'label image')}</span>
            <span class="vd-scan__done">&check; decoded locally · reads confirmed below</span>
            <span class="vd-yours">Yours · user-scanned</span>
          </div>
        </div>
      </div>`
    : (state === 'scanning'
        ? renderScanning()
        : `<div class="vd-scan">
        <button class="ds-btn-primary vd-newscan" type="button" data-sc-upload><b aria-hidden="true">+</b> New Scan</button>
        <button class="vd-drop" type="button" data-sc-upload>
          <span class="vd-drop__ic" aria-hidden="true">&uarr;</span>
          <span class="vd-drop__t">Upload a label image</span>
          <span class="vd-drop__n">or drop / paste an image here · OCR runs locally, slow by design, nothing uploaded</span>
        </button>
      </div>
      <div class="vd-scan__foot"><span>Default is image upload — OCR pre-fills the panel you confirm next.</span></div>`);
  return `
    <section class="vd-step vd-step--scan">
      <div class="vd-step__head">
        <span class="vd-step__badge ${badge}">1</span>
        <div class="vd-step__ttlwrap">
          <div class="vd-step__ttl">Scan a label</div>
          <div class="vd-step__sub">Upload or drop a photo — decoded on your machine, nothing uploaded.</div>
        </div>
        ${stateChip}
      </div>
      ${body}
    </section>`;
}

// ─── STEP 2 · CONFIRM ───────────────────────────────────────────────────────────

function nutrientRow(n: Nutrient, i: number, added: Set<string>, covered: Set<string>): string {
  const name = typeof n.name === 'string' ? n.name : '';
  const ess = matchEssential(name);
  if (ess !== null) {
    const plus = added.has(ess.name) ? '<span class="vd-nrow__r">+1</span>' : (covered.has(ess.name) ? '<span class="vd-nrow__cov">· already covered</span>' : '<span class="vd-nrow__cov">· counts toward your 90</span>');
    return `
      <div class="vd-nrow is-ok" data-nrow="${i}">
        <div class="vd-nrow__main">
          <span class="vd-nrow__g">&check;</span>
          <input class="vd-edit" maxlength="60" value="${escHTML(name)}" data-nedit="${i}" aria-label="Nutrient read (editable)">
          <span class="vd-nrow__amt"><input class="vd-amt" type="text" inputmode="decimal" maxlength="12" value="${escHTML(String(n.amount ?? ''))}" data-aedit="${i}" aria-label="Amount (editable)"><input class="vd-unit" type="text" maxlength="8" value="${escHTML(n.unit ?? '')}" data-uedit="${i}" aria-label="Unit (editable)"></span>
          <span class="vd-nrow__map"><span class="vd-nrow__arr" aria-hidden="true">&rarr;</span><b>${escHTML(ess.name)}</b>${plus}</span>
        </div>
      </div>`;
  }
  const cands = findNutrientCandidates(name).slice(0, 4);
  const btns = cands.map((c, k) =>
    `<button class="vd-sug__btn${k === 0 ? ' is-best' : ''}" type="button" data-nfix="${i}" data-nfix-val="${escHTML(c.word)}">${escHTML(c.word)}</button>`).join('');
  return `
    <div class="vd-nrow is-warn" data-nrow="${i}">
      <div class="vd-nrow__main">
        <span class="vd-nrow__g">!</span>
        <input class="vd-edit is-warn" maxlength="60" value="${escHTML(name)}" data-nedit="${i}" aria-label="Garbled read (editable)">
        <span class="vd-nrow__amt"><input class="vd-amt" type="text" inputmode="decimal" maxlength="12" value="${escHTML(String(n.amount ?? ''))}" data-aedit="${i}" aria-label="Amount (editable)"><input class="vd-unit" type="text" maxlength="8" value="${escHTML(n.unit ?? '')}" data-uedit="${i}" aria-label="Unit (editable)"></span>
        <span class="vd-nrow__map vd-nrow__map--pending">not recognized · pick a match or edit</span>
      </div>
      ${cands.length > 0
        ? `<div class="vd-sug"><span class="vd-sug__lab">Did you mean</span>${btns}<button class="vd-sug__keep" type="button" data-nkeep="${i}">&times; keep</button></div>`
        : ''}
    </div>`;
}

function flagRow(f: AntiFlag): string {
  const term = f.terms !== undefined && f.terms.length > 0 ? f.terms[0] : f.category;
  const reason = f.nuance ?? `On Wallach's anti-list (${escHTML(f.category)}).`;
  return `
    <div class="vd-flag">
      <span class="vd-flag__m">!</span>
      <div class="vd-flag__b">
        <span class="vd-flag__h"><b>${escHTML(term)}</b> — ${escHTML(f.category)}</span>
        <span class="vd-flag__r">${escHTML(reason)} <span class="vd-flag__cite">Wallach</span></span>
      </div>
    </div>`;
}

function suspectCard(s: IngredientSuspect): string {
  const chips = s.candidates.slice(0, 4).map((c, k) =>
    `<button class="vd-chip${k === 0 ? ' is-best' : ''}" type="button" data-ifix="${escHTML(s.word)}" data-ifix-val="${escHTML(c.word)}">${escHTML(c.word)}</button>`).join('');
  return `
    <div class="vd-ocr__card" data-suspect="${escHTML(s.word)}">
      <span class="vd-ocr__word">${escHTML(s.word)}</span>
      <span class="vd-ocr__arr" aria-hidden="true">&rarr;</span>
      ${chips}
      <button class="vd-ocr__x" type="button" data-idismiss="${escHTML(s.word)}" title="Dismiss" aria-label="Dismiss">&times;</button>
    </div>`;
}

function renderConfirm(label: ScanLabel, dismissed: Set<string>, dataUrl: string | null): string {
  const nutrients = label.nutrients ?? [];
  const delta = coverageDeltaForLabel(label);
  const added = new Set(delta.addedEssentials);
  const coveredNames = new Set(getOrCompute().tiles.filter(t => t.covered).map(t => t.name));
  const mapped = nutrients.filter(n => matchEssential(typeof n.name === 'string' ? n.name : '') !== null).length;
  const unmapped = nutrients.length - mapped;
  const rows = nutrients.map((n, i) => nutrientRow(n, i, added, coveredNames)).join('');

  const ingredients = label.ingredients ?? '';
  const suspects = findIngredientSuspects(ingredients, dismissed);
  const suspectPanel = suspects.length > 0
    ? `<div class="vd-ocr">
        <div class="vd-ocr__head"><span class="vd-ocr__t">Possible OCR errors</span><span class="vd-ocr__hint">Click a suggestion to fix, or &times; to dismiss</span></div>
        ${suspects.map(suspectCard).join('')}
      </div>`
    : '';

  const preview = scoreLabel(label);
  const flags = preview?.anti ?? [];
  const flagPanel = flags.length > 0
    ? `<div class="vd-flags">
        <div class="vd-flags__head"><span class="vd-flags__t">Ingredient flags · Wallach doctrine</span><span class="vd-flags__note">These surface once the reads are confirmed — and only the ingredients scan catches them, never the nutrition panel.</span></div>
        ${flags.map(flagRow).join('')}
      </div>`
    : '';

  return `
    <section class="vd-step vd-step--hero">
      <div class="vd-step__head">
        <span class="vd-step__badge is-active">2</span>
        <div class="vd-step__ttlwrap">
          <div class="vd-step__ttl">Confirm what we read</div>
          <div class="vd-step__sub">OCR is imperfect — fix any misread word before we judge it.</div>
        </div>
        <span class="vd-step__herotag">The hero step · verdict withheld until confirmed</span>
      </div>
      <div class="vd-cf">
        <div class="vd-cf__grid">
          <div class="vd-cf__edits">
            <div class="vd-cf-sec vd-cf-sec--name">
              <label class="vd-cf-name__lab" for="vd-sc-name">Product name</label>
              <input id="vd-sc-name" class="vd-cf-name__in" type="text" data-sc-name maxlength="80" value="${escHTML(humanizeName(label.name))}" placeholder="Name this product" spellcheck="false" aria-label="Product name">
              <span class="vd-cf-sec__hint">Name it so your saved items and regimen read cleanly — not a raw container guess.</span>
            </div>
            <div class="vd-cf-sec">
              <div class="vd-cf-sec__head">
                <span class="vd-cf-sec__t">Supplement Facts — what we read</span>
                <span class="vd-cf-sec__n">${nutrients.length} lines · ${mapped} mapped · ${unmapped} to check</span>
                <span class="vd-cf-sec__hint">Every row is editable. Clean reads are mapped &check;; garbled reads show ranked suggestions — pick one, or keep as-is.</span>
              </div>
              <div class="vd-nlist">${rows || '<div class="vd-nrow__covrow">No nutrient lines read — edit the ingredients below, or rescan.</div>'}</div>
            </div>
            <div class="vd-cf-sec">
              <div class="vd-cf-sec__head">
                <span class="vd-cf-sec__t">Other ingredients — what we read</span>
                <span class="vd-cf-sec__n">${suspects.length} suspect word${suspects.length === 1 ? '' : 's'}</span>
                <span class="vd-cf-sec__hint">These never appear on the nutrition panel — only an ingredients scan can catch a gluten source or a seed oil.</span>
              </div>
              <div>
                <label class="vd-ing__lab" for="vd-ing">Ingredients line (editable)</label>
                <textarea id="vd-ing" class="vd-ing" rows="2" maxlength="4000" spellcheck="false" data-ing aria-label="Ingredients (editable)">${escHTML(ingredients)}</textarea>
              </div>
              ${suspectPanel}
              ${flagPanel}
            </div>
          </div>
          <aside class="vd-cf__ref">
            <div class="vd-cf__ref-h">Your uploaded photo</div>
            ${dataUrl !== null ? `<img class="vd-cf__refimg" src="${escHTML(dataUrl)}" alt="Your uploaded label">` : ''}
            <div class="vd-cf__ref-n"><span class="vd-yours">Yours · user-provided</span> amounts are the label\'s own, not a Wallach target</div>
          </aside>
        </div>
        <div class="vd-cf__cta">
          <button class="ds-btn-primary" type="button" data-sc-confirm>Confirm scan <span aria-hidden="true">&rarr;</span> verdict</button>
          <span class="vd-cf__ctanote">Locks your corrections, then judges the confirmed reads against the Wallach corpus. No verdict is shown until you confirm.</span>
        </div>
      </div>
    </section>`;
}

// ─── STEP 3 · RESULT ─────────────────────────────────────────────────────────────

function reasonRows(result: ScanResult): string {
  const rows: string[] = [];
  for (const r of result.reasonsFor) {
    const items = r.items !== undefined && r.items.length > 0 ? ` — ${escHTML(r.items.join(', '))}` : '';
    rows.push(`<div class="vd-reason vd-reason--plus"><span class="vd-reason__m" aria-hidden="true">+</span><span class="vd-reason__t"><b>${escHTML(r.label)}</b>${items}</span></div>`);
  }
  for (const r of result.reasonsAgainst) {
    const items = r.items !== undefined && r.items.length > 0 ? ` — ${escHTML(r.items.join(', '))}` : '';
    const cls = /flag|reject|conflict/i.test(r.label) ? 'vd-reason--flag' : 'vd-reason--minus';
    const glyph = cls === 'vd-reason--flag' ? '!' : '&minus;';
    rows.push(`<div class="vd-reason ${cls}"><span class="vd-reason__m" aria-hidden="true">${glyph}</span><span class="vd-reason__t"><b>${escHTML(r.label)}</b>${items}</span></div>`);
  }
  return rows.join('');
}

function deltaField(before: number, added: number, total: number): string {
  let h = '';
  for (let i = 0; i < total; i++) {
    const cls = i < before ? 'covered' : (i < before + added ? 'scanadd' : '');
    h += `<i class="${cls}"></i>`;
  }
  return h;
}

function renderResult(result: ScanResult, origin: 'scan' | 'saved' | 'recent'): string {
  const tone = VERDICT_TONE[result.verdict];
  const { head, sub } = verdictHeadline(result.verdict);
  const delta = coverageDeltaForLabel(result.label);
  const total = essentialCount();
  const added = delta.after - delta.before;
  const name = humanizeName(result.label.name);
  const flags = result.anti.length;
  const alignedPct = result.alignment.total > 0 ? Math.round((result.alignment.aligned / result.alignment.total) * 100) : 0;

  const tierChip = (key: Verdict, big: string, small: string): string => {
    const on = result.verdict === key;
    return `<span class="vd-tier__c tier-${key === 'ADD' ? 'add' : key === 'SAVE' ? 'save' : 'out'}${on ? ' is-on' : ''}"${on ? ` style="background:${tone};color:${key === 'SAVE' ? 'var(--ds-ink)' : 'var(--ds-paper-light)'}"` : ''}>${big}<small>${small}</small></span>`;
  };

  return `
    <section class="vd-step vd-step--result">
          <div class="vd-step__head">
            <span class="vd-step__badge is-active">3</span>
            <div class="vd-step__ttlwrap">
              <div class="vd-step__ttl">The verdict</div>
              <div class="vd-step__sub">Fires only now — judged on the reads you confirmed.</div>
            </div>
            <span class="vd-step__state is-active">Result</span>
          </div>
          <article class="vd-card">
            <div class="vd-card__top">
              <span class="vd-live" style="background:${tone};box-shadow:0 0 0 3px color-mix(in srgb, ${tone} 22%, transparent)" aria-hidden="true"></span>
              <span class="vd-card__eyebrow">Wallach-alignment verdict · <b>${escHTML(name)}</b></span>
              <span class="vd-card__tag">Local · confirmed</span>
              <button class="ui-close" type="button" data-sc-clear aria-label="Close this verdict" title="Close">${CLOSE_SVG}</button>
            </div>
            <div class="vd-card__body">
              <div class="vd-judg">
                <div class="vd-verdict__eyebrow" style="color:${tone}">The verdict</div>
                <div class="vd-tier" role="img" aria-label="Verdict: ${escHTML(head)} — ${escHTML(sub)}">
                  ${tierChip('ADD', 'Add', 'aligns')}${tierChip('SAVE', 'Save', 'worth it')}${tierChip('REJECT', 'Reject', 'out')}
                </div>
                <h2 class="vd-verdict__h" style="color:${tone}">${head}<b>${sub}</b></h2>
                <p class="vd-verdict__deck">${added > 0 ? `Fills ${added} real gap${added === 1 ? '' : 's'} in your 90` : 'Adds no new coverage to your 90'}${flags > 0 ? `, and the ingredient scan flagged ${flags}.` : '.'}</p>
                <div class="vd-reasons">
                  <div class="vd-reasons__h">Why — grounded in Wallach doctrine</div>
                  ${reasonRows(result)}
                  <div class="vd-cite"><span class="vd-cite__b">Cited</span> Wallach corpus — alignment per source-rule allowlist.</div>
                </div>
              </div>
              <div class="vd-side">
                <div class="vd-impact">
                  <div class="vd-impact__h">Your coverage · active slot</div>
                  <div class="vd-delta">
                    <span class="vd-delta__from">${delta.before}</span>
                    <span class="vd-delta__arrow" aria-hidden="true">&rarr;</span>
                    <span class="vd-delta__to">${delta.after}</span>
                    <span class="vd-delta__den">of ${total}</span>
                    ${added > 0 ? `<span class="vd-delta__plus">+${added}</span>` : ''}
                  </div>
                  <div class="vd-field" aria-hidden="true">${deltaField(delta.before, added, total)}</div>
                  <div class="vd-field__legend">
                    <span class="vd-lg"><span class="vd-lg__s vd-lg__s--cov"></span>${delta.before} covered</span>
                    <span class="vd-lg"><span class="vd-lg__s vd-lg__s--add"></span>+${added} this scan</span>
                    <span class="vd-lg"><span class="vd-lg__s vd-lg__s--open"></span>${total - delta.after} open</span>
                  </div>
                </div>
                <div class="vd-stats">
                  <div class="vd-stat vd-stat--add"><div class="vd-stat__v">+${added}</div><div class="vd-stat__l">of ${total} added · ${delta.before} &rarr; ${delta.after}</div></div>
                  <div class="vd-stat vd-stat--flag"><div class="vd-stat__v">${flags}</div><div class="vd-stat__l">ingredient flag${flags === 1 ? '' : 's'}</div></div>
                  <div class="vd-stat">${result.alignment.aligned === 0 && result.alignment.misaligned === 0 && result.alignment.score === 0 ? `<div class="vd-stat__v">—</div><div class="vd-stat__l">form not on a label · judged on gaps + ingredients</div>` : `<div class="vd-stat__v">${alignedPct}%</div><div class="vd-stat__l">aligned · ${result.alignment.aligned} of ${result.alignment.total} nutrients</div>`}</div>
                  <div class="vd-stat"><div class="vd-stat__v">${result.gapFills.length}</div><div class="vd-stat__l">nutrients reach the 90</div></div>
                </div>
              </div>
            </div>
            <div class="vd-card__foot">
              <button class="ds-btn-primary vd-cta" type="button" data-sc-adopt>Add to regimen <span aria-hidden="true">&rarr;</span></button>
              <button class="ds-btn-ghost" type="button" data-sc-save>Save for later</button>
              <button class="vd-reject" type="button" data-sc-reject>${origin === 'saved' ? 'Delete' : 'Reject'}</button>
              <div class="vd-foot__note">
                <span class="vd-foot__prov"><span class="vd-yours">Yours · user-scanned</span> lands marked user-provided</span>
                <span class="vd-foot__sub">Never merged into the sealed Wallach / Youngevity canon — your data, on your device.</span>
              </div>
            </div>
          </article>
        </section>`;
}

/** SCAN-01: OCR read nothing — withhold the verdict (a REJECT here would judge the photo, not
 *  the product, violating section 00.A) and offer a way forward. */
function renderUnreadable(): string {
  return `
    <section class="vd-step vd-step--result">
      <div class="vd-step__head">
        <span class="vd-step__badge is-active">3</span>
        <div class="vd-step__ttlwrap">
          <div class="vd-step__ttl">Couldn't read this label</div>
          <div class="vd-step__sub">No verdict — we couldn't make out enough to judge it fairly.</div>
        </div>
        <span class="vd-step__state is-active">No read</span>
      </div>
      <article class="vd-card vd-card--unread">
        <div class="vd-unread">
          <span class="vd-unread__ic" aria-hidden="true">?</span>
          <div class="vd-unread__t">We couldn't read the nutrition panel or the ingredients on this image.</div>
          <p class="vd-unread__m">A verdict here would be about the photo, not the product — so we're withholding it. Try a sharper, straight-on photo, or add the reads yourself.</p>
          <div class="vd-unread__cta">
            <button class="ds-btn-primary" type="button" data-sc-upload>Scan a clearer image</button>
            <button class="ds-btn-ghost" type="button" data-sc-edit>Edit the reads</button>
          </div>
        </div>
      </article>
    </section>`;
}

function verdictPill(v: Verdict): string {
  if (v === 'ADD') {
    return '<span class="vd-pill vd-pill--aligns">Aligns</span>';
  }
  if (v === 'SAVE') {
    return '<span class="vd-pill vd-pill--save">Save</span>';
  }
  return '<span class="vd-pill vd-pill--out">Out</span>';
}

/** Compact relative age for a scan-history row: 'Now' / 'Nd' / 'Nw'. */
function relAge(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) {
    return '';
  }
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) {
    return 'Now';
  }
  if (days < 7) {
    return `${days}d`;
  }
  return `${Math.floor(days / 7)}w`;
}

/** One scan row — clickable to re-open its verdict (data-sc-open); a saved row carries a x. */
function scanRow(h: HistoryEntry, saved: boolean, index: number): string {
  const rm = saved
    ? `<button class="ui-close ui-close--sm rl-row__rm" type="button" data-sc-unsave="${h.id}" aria-label="Remove from saved" title="Remove">${CLOSE_SVG}</button>`
    : '';
  return `
    <div class="rl-row vd-hrow" data-sc-open="${h.id}" data-sc-src="${saved ? 'saved' : 'recent'}" data-sc-idx="${index}" role="button" tabindex="0" title="Re-open this verdict">
      <div class="rl-row__name">${escHTML(humanizeName(h.label.name))}</div>
      ${verdictPill(h.verdict)}
      <div class="rl-row__foot"><span class="rl-src is-own">Yours · user-scanned</span><span class="vd-when">${escHTML(relAge(h.ts))}</span></div>
      ${rm}
    </div>`;
}

/** The persistent rail: the durable Saved shelf (SCAN-04) over the auto Recent captures.
 *  Rendered in every state so a refresh always surfaces saved items; rows re-open on click. */
function renderRail(): string {
  const saved = getSaved().map((h, i) => scanRow(h, true, i)).join('');
  const recent = getHistory().map((h, i) => scanRow(h, false, i)).join('');
  return `
    <aside class="vd-rail">
      <div class="rail-panel">
        <div class="rail-panel__head">
          <div class="rail-panel__eyebrow">Saved</div>
          <div class="rail-panel__title">Saved for later</div>
          <div class="rail-panel__meta">Kept until you remove them · click to re-open</div>
        </div>
        <div class="rail-list">${saved || '<div class="rail-empty"><p>Nothing saved yet.</p><small>Hit &ldquo;Save for later&rdquo; on a verdict.</small></div>'}</div>
      </div>
      <div class="rail-panel">
        <div class="rail-panel__head">
          <div class="rail-panel__eyebrow">Recent</div>
          <div class="rail-panel__title">Recent captures</div>
          <div class="rail-panel__meta">Your last few scans · click to re-open</div>
        </div>
        <div class="rail-list">${recent || '<div class="rail-empty"><p>No scans yet.</p><small>Your captures land here.</small></div>'}</div>
      </div>
    </aside>`;
}

// ─── Mount ────────────────────────────────────────────────────────────────────

export function mount(container: HTMLElement): MountHandle {
  let state: ScState = 'idle';
  let label: ScanLabel | null = null;
  let result: ScanResult | null = null;
  let fileName: string | null = null;
  let imageDataUrl: string | null = null;
  let scanError: string | null = null;
  const dismissed = new Set<string>();
  // #6: where the shown verdict came from, so a re-opened SAVED item offers Delete (removes it
  // from the shelf) instead of a meaningless Reject. A fresh scan / recent re-open stays Reject.
  let resultOrigin: 'scan' | 'saved' | 'recent' = 'scan';
  let reopenedSavedId: number | null = null;

  const render = (): void => {
    let main = '';
    if (state === 'result' && result !== null) {
      const unreadable = result.sparseNutrients === true && result.sparseIngredients === true;
      main = renderScan(state, fileName, imageDataUrl) + (unreadable ? renderUnreadable() : renderResult(result, resultOrigin));
    }
    else if (state === 'confirming' && label !== null) {
      main = renderScan(state, fileName, imageDataUrl) + renderConfirm(label, dismissed, imageDataUrl);
    }
    else {
      main = (scanError !== null ? renderScanError(scanError) : '') + renderScan(state, fileName, imageDataUrl);
    }
    // The rail (Saved + Recent) is a persistent aside in every state, so a refresh always
    // surfaces saved items — the whole point of the shelf. renderRail reads live state each paint.
    container.innerHTML = `<div class="vd"><div class="coverage-grid"><div class="vd-main">${main}</div>${renderRail()}</div></div>`;
  };

  // Last-wins scan sequencing: the newest image owns the view. Every scan takes an id;
  // a superseded scan's late FileReader / OCR callbacks check the id and no-op, so a stale
  // read can never clobber the current one. This is what makes an upload + a paste fired
  // together safe: bumping the id + aborting the old reader means only the newest read
  // reaches Confirm, and state/ocr's shared Tesseract load stops the two from double-
  // injecting the engine and wedging the worker (the old "Reading the label…" forever hang).
  let scanSeq = 0;
  let activeReader: FileReader | null = null;

  /** Return the Scan step to idle after a failed / unreadable scan — current scan only. */
  const failScan = (seq: number, e: unknown): void => {
    if (seq !== scanSeq) {
      return; // a superseded scan's failure/abort is irrelevant — the newest scan owns the view
    }
    console.warn('[views/scanner] scan failed:', e);
    scanError = scanErrorMessage(e);
    state = 'idle';
    fileName = null;
    imageDataUrl = null;
    render();
  };

  const handleImageFile = (file: File): void => {
    // A new image supersedes any in-flight scan (last-wins). Bump the sequence FIRST so
    // the previous scan's pending callbacks fall stale, then abort its reader to stop the
    // old read promptly.
    const seq = ++scanSeq;
    if (activeReader !== null) {
      try {
        activeReader.abort();
      }
      catch {
        // abort is best-effort — a finished reader throws nothing that matters here
      }
    }
    fileName = file.name;
    state = 'scanning';
    imageDataUrl = null;
    scanError = null;
    render();
    const reader = new FileReader();
    activeReader = reader;
    reader.addEventListener('load', () => {
      if (seq !== scanSeq) {
        return; // superseded before this read finished
      }
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      imageDataUrl = dataUrl === '' ? null : dataUrl;
      ocrToLabel(dataUrl).then((out) => {
        if (seq !== scanSeq) {
          return; // superseded during OCR — drop the stale result
        }
        label = out.label;
        dismissed.clear();
        state = 'confirming';
        render();
      }).catch((e: unknown) => failScan(seq, e));
    });
    // A FileReader error/abort previously had no handler, so an unreadable file left the
    // Scan step stuck on "Reading the label…" forever. Route both to the guarded failScan
    // (a superseded reader's abort is dropped by the seq check, so it never resets state).
    reader.addEventListener('error', () => failScan(seq, reader.error));
    reader.addEventListener('abort', () => failScan(seq, new Error('file read aborted')));
    reader.readAsDataURL(file);
  };

  const pickImage = (): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      const f = input.files?.[0];
      if (f !== undefined) {
        handleImageFile(f);
      }
    });
    input.click();
  };

  /** Read the corrected label back out of the Confirm inputs + textarea. */
  const readCorrectedLabel = (): ScanLabel => {
    const base = label ?? { name: 'Scanned label', nutrients: [], ingredients: '' };
    const nutrients = (base.nutrients ?? []).map((n, i) => {
      const input = container.querySelector<HTMLInputElement>(`[data-nedit="${i}"]`);
      const next = input !== null ? input.value.trim() : (typeof n.name === 'string' ? n.name : '');
      const amtEl = container.querySelector<HTMLInputElement>(`[data-aedit="${i}"]`);
      const unitEl = container.querySelector<HTMLInputElement>(`[data-uedit="${i}"]`);
      const parsed = amtEl !== null ? Number.parseFloat(amtEl.value) : NaN;
      const amount = Number.isFinite(parsed) ? parsed : n.amount;
      const unit = unitEl !== null && unitEl.value.trim().length > 0 ? unitEl.value.trim() : n.unit;
      return { ...n, name: next, amount, unit };
    }).filter(n => typeof n.name === 'string' && n.name.length > 0);
    const ing = container.querySelector<HTMLTextAreaElement>('[data-ing]');
    const nameEl = container.querySelector<HTMLInputElement>('[data-sc-name]');
    const name = nameEl !== null && nameEl.value.trim().length > 0
      ? nameEl.value.trim()
      : (typeof base.name === 'string' ? base.name : 'Scanned label');
    return { ...base, name, nutrients, ingredients: ing !== null ? ing.value : (base.ingredients ?? '') };
  };

  const refreshRail = (): void => {
    const rail = container.querySelector('.vd-rail');
    if (rail !== null) {
      rail.outerHTML = renderRail();
    }
  };

  const clickHandler = (ev: Event): void => {
    const t = ev.target as HTMLElement | null;
    if (t === null) {
      return;
    }
    if (t.closest('[data-sc-upload]') !== null || t.closest('[data-sc-new]') !== null) {
      pickImage();
      return;
    }
    // nutrient suggestion pick — fix the input in place (demo-style, no full re-render)
    const nfix = t.closest<HTMLElement>('[data-nfix]');
    if (nfix !== null) {
      const i = nfix.dataset['nfix'];
      const val = nfix.dataset['nfixVal'];
      const input = container.querySelector<HTMLInputElement>(`[data-nedit="${i}"]`);
      if (input !== null && val !== undefined) {
        input.value = val;
        const row = nfix.closest<HTMLElement>('.vd-nrow');
        row?.classList.remove('is-warn');
        row?.classList.add('is-ok');
        const g = row?.querySelector('.vd-nrow__g');
        if (g !== null && g !== undefined) {
          g.innerHTML = '&check;';
        }
        nfix.closest('.vd-sug')?.remove();
        const map = row?.querySelector('.vd-nrow__map');
        if (map !== null && map !== undefined) {
          map.classList.remove('vd-nrow__map--pending');
          map.textContent = 'mapped';
        }
      }
      return;
    }
    const nkeep = t.closest<HTMLElement>('[data-nkeep]');
    if (nkeep !== null) {
      nkeep.closest('.vd-sug')?.remove();
      return;
    }
    // ingredient suspect fix — replace the word in the textarea
    const ifix = t.closest<HTMLElement>('[data-ifix]');
    if (ifix !== null) {
      const from = ifix.dataset['ifix'];
      const to = ifix.dataset['ifixVal'];
      const ta = container.querySelector<HTMLTextAreaElement>('[data-ing]');
      if (ta !== null && from !== undefined && to !== undefined) {
        ta.value = ta.value.replace(from, to);
      }
      ifix.closest('.vd-ocr__card')?.remove();
      return;
    }
    const idismiss = t.closest<HTMLElement>('[data-idismiss]');
    if (idismiss !== null) {
      idismiss.closest('.vd-ocr__card')?.remove();
      return;
    }
    // confirm → verdict
    if (t.closest('[data-sc-confirm]') !== null) {
      label = readCorrectedLabel();
      const r = runScan(label);
      if (r !== null) {
        result = r;
        state = 'result';
        resultOrigin = 'scan';
        reopenedSavedId = null;
        render();
      }
      else {
        // SCAN-07: scoring threw — say so inline instead of a dead button that does nothing.
        const cta = container.querySelector<HTMLElement>('.vd-cf__cta');
        if (cta !== null && cta.querySelector('.vd-cf__err') === null) {
          const err = document.createElement('div');
          err.className = 'vd-cf__err';
          err.setAttribute('role', 'alert');
          err.textContent = 'Something went wrong scoring this scan. Adjust a read and try Confirm again.';
          cta.appendChild(err);
        }
      }
      return;
    }
    // result actions
    if (t.closest('[data-sc-adopt]') !== null && result !== null) {
      const lbl = result.label;
      const item: RegimenItem = {
        id: Date.now(),
        label: { name: typeof lbl.name === 'string' ? lbl.name : 'Scanned label', nutrients: lbl.nutrients ?? [] },
        addedDate: new Date().toISOString().slice(0, 10),
        provenance: 'user_scanned',
      };
      saveRgManual([...loadRgManual(), item]);
      const btn = t.closest<HTMLButtonElement>('[data-sc-adopt]');
      if (btn !== null) {
        btn.textContent = '✓ Added to regimen';
        btn.disabled = true;
      }
      return;
    }
    // Unsave (x on a Saved row) — before data-sc-open, since it sits inside the row.
    const unsave = t.closest<HTMLElement>('[data-sc-unsave]');
    if (unsave !== null) {
      const rid = Number(unsave.dataset['scUnsave']);
      if (!Number.isNaN(rid)) {
        removeSaved(rid);
        refreshRail();
      }
      return;
    }
    // Re-open a Saved / Recent row: re-score its stored label against your CURRENT regimen.
    const openRow = t.closest<HTMLElement>('[data-sc-open]');
    if (openRow !== null) {
      // Resolve by (source list, index), NOT by id: two saved/recent entries can share a
      // Date.now()-derived id (R2-7), and an id lookup re-opens the WRONG row. A row's
      // position in its own list is unambiguous, even for pre-existing colliding data.
      const src = openRow.dataset['scSrc'];
      const idx = Number(openRow.dataset['scIdx']);
      const list = src === 'saved' ? getSaved() : getHistory();
      const entry = Number.isInteger(idx) ? list[idx] : undefined;
      if (entry !== undefined) {
        const r = scoreLabel(entry.label);
        if (r !== null) {
          label = entry.label;
          result = r;
          state = 'result';
          resultOrigin = src === 'saved' ? 'saved' : 'recent';
          reopenedSavedId = src === 'saved' && typeof entry.id === 'number' ? entry.id : null;
          imageDataUrl = null;
          fileName = typeof entry.label.name === 'string' ? entry.label.name : null;
          scanError = null;
          render();
        }
      }
      return;
    }
    // Couldn't-read -> back to Confirm to add the reads by hand.
    if (t.closest('[data-sc-edit]') !== null && label !== null) {
      state = 'confirming';
      render();
      return;
    }
    if (t.closest('[data-sc-save]') !== null && result !== null) {
      saveScan(result.label, result);
      const btn = t.closest<HTMLButtonElement>('[data-sc-save]');
      if (btn !== null) {
        btn.textContent = '✓ Saved';
        btn.disabled = true;
      }
      refreshRail();
      return;
    }
    if (t.closest('[data-sc-clear]') !== null) {
      state = 'idle';
      label = null;
      result = null;
      fileName = null;
      imageDataUrl = null;
      scanError = null;
      render();
      return;
    }
    if (t.closest('[data-sc-reject]') !== null) {
      // #6: a re-opened SAVED item's Delete removes it from the shelf; a fresh/recent Reject just closes.
      if (resultOrigin === 'saved' && reopenedSavedId !== null) {
        removeSaved(reopenedSavedId);
      }
      state = 'idle';
      label = null;
      result = null;
      fileName = null;
      imageDataUrl = null;
      resultOrigin = 'scan';
      reopenedSavedId = null;
      render();
    }
  };

  const dropHandler = (ev: DragEvent): void => {
    ev.preventDefault();
    const f = ev.dataTransfer?.files[0];
    if (f !== undefined) {
      handleImageFile(f);
    }
  };
  const dragHandler = (ev: DragEvent): void => {
    ev.preventDefault();
  };
  const pasteHandler = (ev: ClipboardEvent): void => {
    // SCAN-06: this listener is on document and the Scanner is never unmounted (only hidden),
    // so a paste while another workspace is up would start a hidden background OCR. Ignore
    // paste unless the Scanner is actually on screen.
    if (container.offsetParent === null) {
      return;
    }
    for (const it of Array.from(ev.clipboardData?.items ?? [])) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f !== null) {
          handleImageFile(f);
          return;
        }
      }
    }
  };

  // Live progress for the Scan step: the OCR pipeline dispatches window 'lcscan:progress' with
  // { stage, message, determinate, fraction }. Update the staged indicator in place — no re-render
  // (progress ticks fire many times/sec during recognition). Ignored unless we're scanning.
  const onProgress = (ev: Event): void => {
    if (state !== 'scanning') {
      return;
    }
    const root = container.querySelector<HTMLElement>('[data-prog]');
    if (root === null) {
      return;
    }
    const detail = (ev as CustomEvent<{ stage?: number; message?: string; determinate?: boolean; fraction?: number }>).detail;
    const stage = typeof detail.stage === 'number' ? detail.stage : 0;
    const determinate = detail.determinate === true;
    const pct = Math.max(0, Math.min(100, Math.round((detail.fraction ?? 0) * 100)));
    root.classList.toggle('is-indet', !determinate);
    for (const el of root.querySelectorAll<HTMLElement>('[data-step]')) {
      const i = Number(el.dataset['step']);
      el.classList.toggle('is-active', i === stage);
      el.classList.toggle('is-done', i < stage);
      el.textContent = (i < stage ? '✓ ' : '') + (SCAN_STEP_LABELS[i] ?? '');
    }
    const msgEl = root.querySelector('[data-prog-msg]');
    if (msgEl !== null) {
      msgEl.textContent = detail.message ?? '';
    }
    const pctEl = root.querySelector('[data-prog-pct]');
    if (pctEl !== null) {
      pctEl.textContent = determinate ? `${pct}%` : '';
    }
    if (determinate) {
      const fill = root.querySelector<HTMLElement>('[data-prog-fill]');
      if (fill !== null) {
        fill.style.width = `${pct}%`;
      }
    }
  };

  render();
  container.addEventListener('click', clickHandler);
  container.addEventListener('dragover', dragHandler);
  container.addEventListener('drop', dropHandler);
  document.addEventListener('paste', pasteHandler);
  window.addEventListener('lcscan:progress', onProgress);
  const unsub = on('scanner:scan-cleared', () => {
    state = 'idle';
    label = null;
    result = null;
    fileName = null;
    imageDataUrl = null;
    scanError = null;
    render();
  });

  return {
    update: render,
    unmount: () => {
      unsub();
      container.removeEventListener('click', clickHandler);
      container.removeEventListener('dragover', dragHandler);
      container.removeEventListener('drop', dropHandler);
      document.removeEventListener('paste', pasteHandler);
      window.removeEventListener('lcscan:progress', onProgress);
      container.innerHTML = '';
    },
  };
}
