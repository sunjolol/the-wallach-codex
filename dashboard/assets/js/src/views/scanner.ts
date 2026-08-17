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
  isKnownNutrient,
  ocrToLabel,
} from '../state/ocr.js';
import { addOrBumpRegimenItem } from '../state/regimen.js';
import {
  type AntiFlag,
  coverageDeltaForLabel,
  getAntiIngredientWords,
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
    return { head: 'Neutral', sub: 'Worth considering' };
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
          ${dataUrl !== null ? `<button class="vd-scan__imgbtn" type="button" data-sc-zoom title="See the full label — click to enlarge"><img class="vd-scan__img" src="${escHTML(dataUrl)}" alt="Your scanned label — click to enlarge"></button>` : ''}
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
        <div class="vd-paste">
          <div class="vd-paste__lab">Or check an ingredients list</div>
          <textarea class="vd-paste__in" data-sc-paste rows="3" maxlength="4000" spellcheck="false" placeholder="Paste or type an ingredients list — e.g. water, modified tapioca starch, canola oil, salt. Or a single ingredient like wheat."></textarea>
          <button class="ds-btn-primary vd-paste__go" type="button" data-sc-paste-check>Check ingredients <span aria-hidden="true">&rarr;</span></button>
          <div class="vd-paste__hint">The image scan above is for <b>supplement labels</b> (it reads nutrient amounts). For a <b>food</b>, paste its ingredients here — only ingredients Wallach says to avoid (gluten, seed oils, added sugar, MSG, sweeteners, modified / processed) are flagged; anything else reads neutral.</div>
        </div>
      </div>`);
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
  const del = `<button class="ui-close ui-close--sm vd-nrow__del" type="button" data-ndel="${i}" aria-label="Remove this row" title="Remove this row">${CLOSE_SVG}</button>`;
  const ess = matchEssential(name);
  if (ess !== null) {
    const plus = added.has(ess.name) ? '<span class="vd-nrow__r">+1</span>' : (covered.has(ess.name) ? '<span class="vd-nrow__cov">· already covered</span>' : '<span class="vd-nrow__cov">· counts toward your 90</span>');
    return `
      <div class="vd-nrow is-ok" data-nrow="${i}" data-nmap="essential">
        <div class="vd-nrow__main">
          <span class="vd-nrow__g">&check;</span>
          <input class="vd-edit" maxlength="60" value="${escHTML(name)}" data-nedit="${i}" aria-label="Nutrient read (editable)">
          <span class="vd-nrow__amt"><input class="vd-amt" type="text" inputmode="decimal" maxlength="12" value="${escHTML(String(n.amount ?? ''))}" data-aedit="${i}" aria-label="Amount (editable)"><input class="vd-unit" type="text" maxlength="8" value="${escHTML(n.unit ?? '')}" data-uedit="${i}" aria-label="Unit (editable)"></span>
          <span class="vd-nrow__map"><span class="vd-nrow__arr" aria-hidden="true">&rarr;</span><b>${escHTML(ess.name)}</b>${plus}</span>
          ${del}
        </div>
      </div>`;
  }
  if (isKnownNutrient(name)) {
    // A correctly-read nutrient that is simply not one of Wallach's 90 tracked essentials (Protein,
    // etc.). Recognized and shown -- never flagged as an OCR error to "fix".
    return `
      <div class="vd-nrow is-ok is-untracked" data-nrow="${i}" data-nmap="untracked">
        <div class="vd-nrow__main">
          <span class="vd-nrow__g">&check;</span>
          <input class="vd-edit" maxlength="60" value="${escHTML(name)}" data-nedit="${i}" aria-label="Nutrient read (editable)">
          <span class="vd-nrow__amt"><input class="vd-amt" type="text" inputmode="decimal" maxlength="12" value="${escHTML(String(n.amount ?? ''))}" data-aedit="${i}" aria-label="Amount (editable)"><input class="vd-unit" type="text" maxlength="8" value="${escHTML(n.unit ?? '')}" data-uedit="${i}" aria-label="Unit (editable)"></span>
          <span class="vd-nrow__map"><span class="vd-nrow__cov">· read OK · not one of the 90</span></span>
          ${del}
        </div>
      </div>`;
  }
  const cands = findNutrientCandidates(name).slice(0, 4);
  const btns = cands.map((c, k) =>
    `<button class="vd-sug__btn${k === 0 ? ' is-best' : ''}" type="button" data-nfix="${i}" data-nfix-val="${escHTML(c.word)}">${escHTML(c.word)}</button>`).join('');
  return `
    <div class="vd-nrow is-warn" data-nrow="${i}" data-nmap="warn">
      <div class="vd-nrow__main">
        <span class="vd-nrow__g">!</span>
        <input class="vd-edit is-warn" maxlength="60" value="${escHTML(name)}" data-nedit="${i}" aria-label="Garbled read (editable)">
        <span class="vd-nrow__amt"><input class="vd-amt" type="text" inputmode="decimal" maxlength="12" value="${escHTML(String(n.amount ?? ''))}" data-aedit="${i}" aria-label="Amount (editable)"><input class="vd-unit" type="text" maxlength="8" value="${escHTML(n.unit ?? '')}" data-uedit="${i}" aria-label="Unit (editable)"></span>
        <span class="vd-nrow__map vd-nrow__map--pending">not recognized · pick a match or edit</span>
        ${del}
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

function suspectPanelHTML(suspects: IngredientSuspect[]): string {
  return suspects.length > 0
    ? `<div class="vd-ocr">
        <div class="vd-ocr__head"><span class="vd-ocr__t">Possible OCR errors</span><span class="vd-ocr__hint">Click a suggestion to fix, or &times; to dismiss</span></div>
        ${suspects.map(suspectCard).join('')}
      </div>`
    : '';
}

/** Shared count labels — same text at first render and on live refresh, never drifting apart. */
function suspectCountLabel(n: number): string {
  return `${n} suspect word${n === 1 ? '' : 's'}`;
}

function nutrientCountLabel(total: number, mapped: number): string {
  return `${total} lines · ${mapped} mapped · ${total - mapped} to check`;
}

function renderConfirm(label: ScanLabel, dismissed: Set<string>, dataUrl: string | null): string {
  const nutrients = label.nutrients ?? [];
  const delta = coverageDeltaForLabel(label);
  const added = new Set(delta.addedEssentials);
  const coveredNames = new Set(getOrCompute().tiles.filter(t => t.covered).map(t => t.name));
  const mapped = nutrients.filter(n => matchEssential(typeof n.name === 'string' ? n.name : '') !== null).length;
  const rows = nutrients.map((n, i) => nutrientRow(n, i, added, coveredNames)).join('');

  const ingredients = label.ingredients ?? '';
  const suspects = findIngredientSuspects(ingredients, dismissed, getAntiIngredientWords());
  const suspectPanel = suspectPanelHTML(suspects);

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
        <button class="ui-close vd-step__close" type="button" data-sc-clear aria-label="Cancel this scan" title="Cancel scan">${CLOSE_SVG}</button>
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
                <span class="vd-cf-sec__n" data-nutrient-count>${nutrientCountLabel(nutrients.length, mapped)}</span>
                <span class="vd-cf-sec__hint">Every row is editable. Clean reads are mapped &check;; garbled reads show ranked suggestions — pick one, or keep as-is.</span>
              </div>
              <div class="vd-nlist">${rows || '<div class="vd-nrow__covrow">No nutrient lines read — edit the ingredients below, or rescan.</div>'}</div>
            </div>
            <div class="vd-cf-sec">
              <div class="vd-cf-sec__head">
                <span class="vd-cf-sec__t">Other ingredients — what we read</span>
                <span class="vd-cf-sec__n" data-suspect-count>${suspectCountLabel(suspects.length)}</span>
                <span class="vd-cf-sec__hint">These never appear on the nutrition panel — only an ingredients scan can catch a gluten source or a seed oil.</span>
              </div>
              <div>
                <label class="vd-ing__lab" for="vd-ing">Ingredients line (editable)</label>
                <textarea id="vd-ing" class="vd-ing" rows="2" maxlength="4000" spellcheck="false" data-ing aria-label="Ingredients (editable)">${escHTML(ingredients)}</textarea>
              </div>
              <div class="vd-ocr-host" data-ocr-host>${suspectPanel}</div>
              ${flagPanel}
            </div>
          </div>
          <aside class="vd-cf__ref">
            <div class="vd-cf__ref-h">Your uploaded photo</div>
            ${dataUrl !== null ? `<button class="vd-cf__refbtn" type="button" data-sc-zoom title="See the full label — click to enlarge"><img class="vd-cf__refimg" src="${escHTML(dataUrl)}" alt="Your uploaded label — click to enlarge"><span class="vd-cf__refzoom" aria-hidden="true">&#10530;&nbsp;Enlarge</span></button>` : ''}
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

function renderResult(result: ScanResult, origin: 'scan' | 'saved' | 'recent'): string {
  const tone = VERDICT_TONE[result.verdict];
  const { head, sub } = verdictHeadline(result.verdict);
  const delta = coverageDeltaForLabel(result.label);
  const total = essentialCount();
  const added = delta.after - delta.before;
  const gaps = total - delta.after;
  const name = humanizeName(result.label.name);
  const flags = result.anti.length;

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
                  ${tierChip('ADD', 'Add', 'aligns')}${tierChip('SAVE', 'Save', 'neutral')}${tierChip('REJECT', 'Reject', 'out')}
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
                <div class="vd-cov-gauge">
                  <svg viewBox="0 0 200 122" class="vd-cov-svg" role="img" aria-label="${delta.after} of ${total} covered, ${gaps} still open">
                    <path class="vd-cov-arc-base" d="M20 100 A80 80 0 0 1 180 100"/>
                    <path class="vd-cov-arc-cov" d="M20 100 A80 80 0 0 1 180 100" pathLength="90" stroke-dasharray="${delta.before} 90"/>
                    ${added > 0 ? `<path class="vd-cov-arc-add" d="M20 100 A80 80 0 0 1 180 100" pathLength="90" stroke-dasharray="${added} 90" stroke-dashoffset="-${delta.before}"/>` : ''}
                    <text class="vd-cov-gnum" x="100" y="80" text-anchor="middle">${delta.after}</text>
                    <text class="vd-cov-gden" x="100" y="104" text-anchor="middle">OF ${total}</text>
                  </svg>
                </div>
                <div class="vd-cov-cap"><b>${gaps} gap${gaps === 1 ? '' : 's'} remain${gaps === 1 ? 's' : ''}</b> — the essentials to hunt next.</div>
                <div class="vd-cov-facts">
                  <div class="vd-cov-fact"><b>${added > 0 ? '+' : ''}${added}</b><span>reach the 90 this scan</span></div>
                  <div class="vd-cov-fact vd-cov-fact--flag"><b>${flags}</b><span>ingredient flag${flags === 1 ? '' : 's'}</span></div>
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
  // S11: original indices the user deleted in Confirm. readCorrectedLabel skips these so a
  // removed row can't be silently re-read from the stored label. Cleared on each fresh OCR.
  const removedRows = new Set<number>();
  // S10: the open full-label lightbox + an AbortController that unbinds its scrim/Escape listeners.
  let lightboxEl: HTMLElement | null = null;
  let lightboxAbort: AbortController | null = null;
  // S12: debounce handle for the live "Possible OCR errors" refresh.
  let suspectTimer = 0;
  // Live nutrient-row re-evaluation debounce (re-check a corrected read vs the essentials/known list).
  let nameTimer = 0;
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
        removedRows.clear();
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
    const nutrients = (base.nutrients ?? []).flatMap((n, i) => {
      if (removedRows.has(i)) {
        return []; // S11: deleted by the user — drop it, never fall back to the stored read
      }
      const input = container.querySelector<HTMLInputElement>(`[data-nedit="${i}"]`);
      const next = input !== null ? input.value.trim() : (typeof n.name === 'string' ? n.name : '');
      const amtEl = container.querySelector<HTMLInputElement>(`[data-aedit="${i}"]`);
      const unitEl = container.querySelector<HTMLInputElement>(`[data-uedit="${i}"]`);
      const parsed = amtEl !== null ? Number.parseFloat(amtEl.value) : Number.NaN;
      const amount = Number.isFinite(parsed) ? parsed : n.amount;
      const unit = unitEl !== null && unitEl.value.trim().length > 0 ? unitEl.value.trim() : n.unit;
      return next.length > 0 ? [{ ...n, name: next, amount, unit }] : [];
    });
    const ing = container.querySelector<HTMLTextAreaElement>('[data-ing]');
    const nameEl = container.querySelector<HTMLInputElement>('[data-sc-name]');
    const name = nameEl !== null && nameEl.value.trim().length > 0
      ? nameEl.value.trim()
      : (typeof base.name === 'string' ? base.name : 'Scanned label');
    return { ...base, name, nutrients, ingredients: ing !== null ? ing.value : (base.ingredients ?? '') };
  };

  /** S12: recompute the "Possible OCR errors" panel + its count from the live ingredients
   *  textarea. The delegated debounced input calls this; dismiss/fix call it directly. */
  const refreshSuspects = (): void => {
    const host = container.querySelector<HTMLElement>('[data-ocr-host]');
    const ta = container.querySelector<HTMLTextAreaElement>('[data-ing]');
    if (host === null || ta === null) {
      return;
    }
    const suspects = findIngredientSuspects(ta.value, dismissed, getAntiIngredientWords());
    host.innerHTML = suspectPanelHTML(suspects);
    const countEl = container.querySelector('[data-suspect-count]');
    if (countEl !== null) {
      countEl.textContent = suspectCountLabel(suspects.length);
    }
  };

  /** S11: after a row delete, keep the "N lines · M mapped · K to check" tally honest — recount
   *  from the rows still in the DOM rather than re-render (which would discard in-flight edits). */
  const recountNutrients = (): void => {
    const rows = container.querySelectorAll('.vd-nlist .vd-nrow[data-nrow]');
    let total = 0;
    let mapped = 0;
    for (const r of rows) {
      total++;
      if (r.getAttribute('data-nmap') === 'essential') {
        mapped++;
      }
    }
    const countEl = container.querySelector('[data-nutrient-count]');
    if (countEl !== null) {
      countEl.textContent = nutrientCountLabel(total, mapped);
    }
  };

  /** Live feedback: re-check ONE nutrient row against the essentials + known-nutrient list as its
   *  name is edited, updating the glyph / status / suggestions in place — never the input itself, so
   *  the cursor survives — so a correction like "Oat" -> "Fat" immediately shows a check. */
  const reevaluateNutrientRow = (rowEl: HTMLElement): void => {
    const input = rowEl.querySelector<HTMLInputElement>('.vd-edit[data-nedit]');
    if (input === null) {
      return;
    }
    const name = input.value.trim();
    const idx = rowEl.dataset['nrow'] ?? '';
    const glyph = rowEl.querySelector('.vd-nrow__g');
    const map = rowEl.querySelector<HTMLElement>('.vd-nrow__map');
    const main = rowEl.querySelector('.vd-nrow__main');
    rowEl.querySelector('.vd-sug')?.remove();
    const ess = matchEssential(name);
    if (ess !== null) {
      rowEl.className = 'vd-nrow is-ok';
      rowEl.dataset['nmap'] = 'essential';
      input.classList.remove('is-warn');
      if (glyph !== null) {
        glyph.innerHTML = '&check;';
      }
      if (map !== null) {
        const covered = new Set(getOrCompute().tiles.filter(t => t.covered).map(t => t.name)).has(ess.name);
        map.className = 'vd-nrow__map';
        map.innerHTML = `<span class="vd-nrow__arr" aria-hidden="true">&rarr;</span><b>${escHTML(ess.name)}</b><span class="vd-nrow__cov">${covered ? '· already covered' : '· counts toward your 90'}</span>`;
      }
    }
    else if (isKnownNutrient(name)) {
      rowEl.className = 'vd-nrow is-ok is-untracked';
      rowEl.dataset['nmap'] = 'untracked';
      input.classList.remove('is-warn');
      if (glyph !== null) {
        glyph.innerHTML = '&check;';
      }
      if (map !== null) {
        map.className = 'vd-nrow__map';
        map.innerHTML = '<span class="vd-nrow__cov">· read OK · not one of the 90</span>';
      }
    }
    else {
      rowEl.className = 'vd-nrow is-warn';
      rowEl.dataset['nmap'] = 'warn';
      input.classList.add('is-warn');
      if (glyph !== null) {
        glyph.innerHTML = '!';
      }
      if (map !== null) {
        map.className = 'vd-nrow__map vd-nrow__map--pending';
        map.textContent = 'not recognized · pick a match or edit';
      }
      const cands = findNutrientCandidates(name).slice(0, 4);
      if (cands.length > 0 && main !== null) {
        const btns = cands.map((c, k) =>
          `<button class="vd-sug__btn${k === 0 ? ' is-best' : ''}" type="button" data-nfix="${escHTML(idx)}" data-nfix-val="${escHTML(c.word)}">${escHTML(c.word)}</button>`).join('');
        const sug = document.createElement('div');
        sug.className = 'vd-sug';
        sug.innerHTML = `<span class="vd-sug__lab">Did you mean</span>${btns}<button class="vd-sug__keep" type="button" data-nkeep="${escHTML(idx)}">&times; keep</button>`;
        main.insertAdjacentElement('afterend', sug);
      }
    }
    recountNutrients();
  };

  /** S10: dismiss the full-label lightbox and unbind its listeners via the AbortController. */
  const closeLightbox = (): void => {
    if (lightboxEl !== null) {
      lightboxEl.remove();
      lightboxEl = null;
    }
    if (lightboxAbort !== null) {
      lightboxAbort.abort();
      lightboxAbort = null;
    }
  };

  /** S10: open the uploaded photo full-size so the user can verify the OCR against the real label.
   *  Mounts to document.body (the house .pf-overlay convention) so a view re-render can't wipe it. */
  const openLightbox = (): void => {
    if (imageDataUrl === null) {
      return;
    }
    closeLightbox();
    const el = document.createElement('div');
    el.className = 'vd-lightbox';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Full-size scanned label');
    el.innerHTML = `<button class="ui-close vd-lightbox__x" type="button" data-lb-close aria-label="Close full-size label" title="Close">${CLOSE_SVG}</button><img class="vd-lightbox__img" src="${escHTML(imageDataUrl)}" alt="Your scanned label at full size">`;
    const ac = new AbortController();
    el.addEventListener('click', (ev) => {
      const tgt = ev.target as HTMLElement | null;
      if (tgt !== null && (tgt === el || tgt.closest('[data-lb-close]') !== null)) {
        closeLightbox();
      }
    }, { signal: ac.signal });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        closeLightbox();
      }
    }, { signal: ac.signal });
    document.body.appendChild(el);
    lightboxAbort = ac;
    lightboxEl = el;
    el.querySelector<HTMLButtonElement>('[data-lb-close]')?.focus();
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
    // S10: click the uploaded thumbnail / photo -> open it full-size to verify the OCR.
    if (t.closest('[data-sc-zoom]') !== null) {
      openLightbox();
      return;
    }
    if (t.closest('[data-sc-upload]') !== null || t.closest('[data-sc-new]') !== null) {
      pickImage();
      return;
    }
    // Paste / type an ingredients list (or a single ingredient) -> straight to a verdict.
    // No OCR/confirm needed: the user typed it. runScan reuses the same antiFlags engine, so
    // gluten/seed-oil/modified/etc. reject and everything else reads NEUTRAL (the neutral default).
    if (t.closest('[data-sc-paste-check]') !== null) {
      const ta = container.querySelector<HTMLTextAreaElement>('[data-sc-paste]');
      const text = ta !== null ? ta.value.trim() : '';
      if (text.length === 0) {
        return;
      }
      const pasted: ScanLabel = { name: 'Pasted ingredients', nutrients: [], ingredients: text };
      const r = runScan(pasted);
      if (r !== null) {
        label = pasted;
        result = r;
        state = 'result';
        resultOrigin = 'scan';
        reopenedSavedId = null;
        imageDataUrl = null;
        render();
      }
      return;
    }
    // S11: per-row delete — record the original index so readCorrectedLabel drops it, then pull
    // the row from the DOM and keep the line tally honest. No re-render (would lose other edits).
    const ndel = t.closest<HTMLElement>('[data-ndel]');
    if (ndel !== null) {
      const idx = Number(ndel.dataset['ndel']);
      if (Number.isInteger(idx)) {
        removedRows.add(idx);
        ndel.closest('.vd-nrow')?.remove();
        recountNutrients();
      }
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
        if (row !== null) {
          reevaluateNutrientRow(row);
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
      // S12: re-run the pass so the corrected word drops out and the count updates.
      refreshSuspects();
      return;
    }
    const idismiss = t.closest<HTMLElement>('[data-idismiss]');
    if (idismiss !== null) {
      // S12: record the dismissal (lowercased, matching findIngredientSuspects) so a live
      // refresh keeps it gone, then recompute the panel.
      const w = idismiss.dataset['idismiss'];
      if (w !== undefined) {
        dismissed.add(w.toLowerCase());
      }
      refreshSuspects();
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
      const r = addOrBumpRegimenItem(item);
      const btn = t.closest<HTMLButtonElement>('[data-sc-adopt]');
      if (btn !== null) {
        btn.textContent = r.outcome === 'bumped'
          ? `✓ Already saved — bumped to ${r.dose}/day`
          : '✓ Added to regimen';
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

  // Debounced live refresh: the OCR-errors panel (ingredients textarea) AND the nutrient rows.
  const inputHandler = (ev: Event): void => {
    const target = ev.target as HTMLElement | null;
    if (target === null) {
      return;
    }
    if (target.matches('[data-ing]')) {
      window.clearTimeout(suspectTimer);
      suspectTimer = window.setTimeout(refreshSuspects, 250);
      return;
    }
    if (target.matches('.vd-edit[data-nedit]')) {
      const row = target.closest<HTMLElement>('.vd-nrow');
      if (row !== null) {
        window.clearTimeout(nameTimer);
        nameTimer = window.setTimeout(() => reevaluateNutrientRow(row), 150);
      }
    }
  };

  render();
  container.addEventListener('click', clickHandler);
  container.addEventListener('input', inputHandler);
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
      closeLightbox();
      window.clearTimeout(suspectTimer);
      window.clearTimeout(nameTimer);
      container.removeEventListener('click', clickHandler);
      container.removeEventListener('input', inputHandler);
      container.removeEventListener('dragover', dragHandler);
      container.removeEventListener('drop', dropHandler);
      document.removeEventListener('paste', pasteHandler);
      window.removeEventListener('lcscan:progress', onProgress);
      container.innerHTML = '';
    },
  };
}
