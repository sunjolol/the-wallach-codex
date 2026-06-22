/**
 * views/scanner.ts — Scanner workspace view (v3 mockup parity)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Renders the scanner workspace per the v3 mockup
 * (dashboard/components/workspace-scanner-v3-PROPOSAL.html).
 *
 * Visual contract:
 *   - .scanner-grid 2-col: scanner-main (stage + pipeline + parsed + verdict) + scanner-side (history)
 *   - Scan stage: drop zone (idle) OR label canvas + OCR brackets (result)
 *   - OCR pipeline: 4 stages (EXTRACT · PARSE · MATCH · VERDICT)
 *   - Parsed ingredients list with status / mapped / confidence / heat tag
 *   - Verdict card: alignment headline + 4 stat slabs
 *   - Right rail: scan history with verdict pills
 *
 * Drives the native OCR pipeline via scanImage(dataUrl) (state/ocr.ts) and
 * listens to `scanner:scan-complete` for re-render on result.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { on } from '../core/events.js';
import { scanImage } from '../state/ocr.js';
import { loadRgManual, type RegimenItem, saveRgManual } from '../state/regimen.js';
import {
  getHistory,
  type HistoryEntry,
  type ScanLabel,
  type ScanResult,
  type Verdict,
} from '../state/scanner.js';

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

type ScanState = 'idle' | 'scanning' | 'result';

interface LegacyWindow extends Window {
  lcScan?: (label: ScanLabel, opts?: { logToRecent?: boolean }) => ScanResult;
  lcLastResult?: ScanResult;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }[c] as string));
}

function verdictPillClass(v: Verdict): string {
  if (v === 'ADD') {
    return 'verdict-pill verdict-pill--ok';
  }
  if (v === 'SAVE') {
    return 'verdict-pill verdict-pill--warn';
  }
  return 'verdict-pill verdict-pill--err';
}

function verdictHeadline(v: Verdict): string {
  if (v === 'ADD') {
    return 'ALIGNS WITH <em>WALLACH DOCTRINE</em>';
  }
  if (v === 'SAVE') {
    return 'PARTIAL · <em>WORTH CONSIDERING</em>';
  }
  return 'DOES NOT ALIGN · <em>FLAGGED FOR REVIEW</em>';
}

// ─── Scan stage ───────────────────────────────────────────────────────────

function renderStageEmpty(): string {
  return `
    <div class="scan-canvas scan-canvas--empty" data-sc-action="upload-click">
      <div class="scan-canvas__drop-mark">⌖</div>
      <div class="scan-canvas__drop-headline">Drop a label image · or paste · or click to upload</div>
      <div class="scan-canvas__drop-sub">// JPG · PNG · WEBP · HEIC — OCR runs locally, no upload to server</div>
      <div class="scan-canvas__drop-formats">
        <span>JPG</span><span>PNG</span><span>WEBP</span><span>HEIC</span>
      </div>
    </div>
  `;
}

function renderLabelBlock(label: ScanLabel): string {
  const brand = (label.brand ?? 'YOUNGEVITY').toString();
  const product = (label.name ?? '(unnamed)').toString();
  const servings = label.servings === undefined ? '— · — servings' : String(label.servings);
  const nutrientRows = (label.nutrients ?? []).slice(0, 8).map(n => `
    <div class="scan-label__row">
      <span>${escHTML(n.name)}</span>
      <span>${escHTML(n.amount ?? '')}${escHTML(n.unit ?? '')}</span>
      <span>—</span>
    </div>
  `).join('');
  return `
    <div class="scan-canvas scan-canvas--active">
      <div class="scan-label">
        <div class="scan-label__brand">${escHTML(brand)}</div>
        <div class="scan-label__product">${escHTML(product)}</div>
        <div class="scan-label__rule"></div>
        <h4 class="scan-label__section-title">Supplement Facts</h4>
        <div class="scan-label__serving">Serving Size · ${escHTML(servings)}</div>
        <div class="scan-label__rows">${nutrientRows}</div>
        <span class="ocr-bracket ocr-bracket--brand"></span>
        <span class="ocr-bracket ocr-bracket--product"></span>
        <span class="ocr-bracket ocr-bracket--serving"></span>
        <span class="ocr-bracket ocr-bracket--rows"></span>
      </div>
    </div>
  `;
}

function renderStage(state: ScanState, result: ScanResult | null): string {
  const canvasHTML = state === 'result' && result !== null
    ? renderLabelBlock(result.label)
    : renderStageEmpty();
  const regionCount = result?.label.nutrients?.length ?? 0;
  const confidence = result?.alignment.score.toFixed(2) ?? '—';
  const controlsActive = state === 'result' && result !== null;
  const metaHTML = controlsActive
    ? `
    <span>CAPTURE <strong class="ds-cipher" data-cipher-set="hexa">SC·B14F</strong></span>
    <span>·</span>
    <span>${regionCount} REGIONS</span>
    <span>·</span>
    <span>CONFIDENCE <strong>${escHTML(confidence)}</strong></span>
  `
    : `
    <span>CAPTURE <strong class="ds-cipher" data-cipher-set="hexa">SC·----</strong></span>
    <span>·</span>
    <span>0 REGIONS</span>
    <span>·</span>
    <span>READY</span>
  `;
  return `
    <section class="scan-stage">
      <header class="scan-stage__head">
        <div>
          <div class="scan-stage__kicker"><span class="pulse-dot"></span>STAGE · <span class="ds-cipher" data-cipher-set="hexa">CS·12B4</span></div>
          <h2 class="scan-stage__title">
            ${state === 'result' ? 'CAPTURED' : 'DROP A LABEL'}
            <em>// ${state === 'result' ? 'OCR + Eden grammar + vault lookup' : 'image goes here — paste, drop, upload'}</em>
          </h2>
        </div>
        <div class="scan-stage__head-stat">
          <span>RESOLUTION <strong>${state === 'result' ? '1080×1620' : '—'}</strong></span>
          <span>·</span>
          <span>CAPTURE <strong class="ds-cipher" data-cipher-set="time">${state === 'result' ? '0:08' : '—'}</strong> AGO</span>
        </div>
      </header>
      ${canvasHTML}
      <div class="scan-stage__controls">
        <span class="scan-stage__meta">${metaHTML}</span>
        <span class="scan-stage__spacer"></span>
        <button class="scan-btn" data-sc-action="retake"><span class="scan-btn__glyph">↺</span>RETAKE</button>
        <button class="scan-btn" data-sc-action="upload"><span class="scan-btn__glyph">⌃</span>UPLOAD</button>
        <button class="scan-btn" data-sc-action="crop"><span class="scan-btn__glyph">⌖</span>CROP</button>
      </div>
    </section>
  `;
}

// ─── OCR pipeline ─────────────────────────────────────────────────────────

interface StageSpec {
  name: string;
  sub: string;
  ms: string;
  status: 'done' | 'active' | 'queued';
}

function pipelineStages(state: ScanState): StageSpec[] {
  const allDone: StageSpec[] = [
    { name: 'EXTRACT', sub: 'tesseract OCR', ms: '1.42s', status: 'done' },
    { name: 'PARSE', sub: 'Eden grammar', ms: '0.31s', status: 'done' },
    { name: 'MATCH', sub: 'vault lookup', ms: '2.11s', status: 'done' },
    { name: 'VERDICT', sub: 'Wallach align', ms: '0.18s', status: 'done' },
  ];
  if (state === 'idle') {
    return allDone.map(s => ({ ...s, ms: '—', status: 'queued' as const }));
  }
  if (state === 'scanning') {
    return [
      { name: 'EXTRACT', sub: 'tesseract OCR', ms: '1.42s', status: 'done' },
      { name: 'PARSE', sub: 'Eden grammar', ms: '0.31s', status: 'done' },
      { name: 'MATCH', sub: 'vault lookup', ms: '2.11s', status: 'active' },
      { name: 'VERDICT', sub: 'Wallach align', ms: '—', status: 'queued' },
    ];
  }
  return allDone;
}

function renderPipeline(state: ScanState): string {
  const stages = pipelineStages(state);
  const stagesHTML = stages.map((s) => {
    const dotChar = s.status === 'done' ? '✓' : s.status === 'active' ? '●' : '○';
    return `
      <div class="stage stage--${s.status}">
        <div class="stage__dot">${dotChar}</div>
        <div class="stage__name">${escHTML(s.name)}</div>
        <div class="stage__sub">${escHTML(s.sub)}</div>
        <div class="stage__ms">${s.status === 'active' ? `<span class="ds-cipher" data-cipher-set="alphanum">${escHTML(s.ms)}</span>` : escHTML(s.ms)}</div>
      </div>
    `;
  }).join('');
  const total = state === 'result' ? '3.84s' : state === 'scanning' ? '2.84s' : '—';
  return `
    <section class="pipeline">
      <header class="pipeline__head">
        <div>
          <div class="pipeline__eyebrow">PIPELINE · <span class="ds-cipher" data-cipher-set="hexa">PL·24A7</span> · 4 STAGES</div>
          <h2 class="pipeline__title">Extract · Parse · Match · Verdict</h2>
        </div>
        <div class="pipeline__total">TOTAL ELAPSED <strong>${escHTML(total)}</strong> · target &lt;5s</div>
      </header>
      <div class="pipeline__stages">${stagesHTML}</div>
    </section>
  `;
}

// ─── Parsed ingredients ───────────────────────────────────────────────────

interface ParsedRow {
  status: 'ok' | 'warn' | 'err';
  raw: string;
  name: string;
  mapped: string;
  confidence: string;
  tag: { heat: 'sm' | 'md' | 'lg' | 'xl' | 'none'; sign?: string; text: string };
}

function renderParsedRow(row: ParsedRow): string {
  const statusChar = row.status === 'ok' ? '✓' : row.status === 'warn' ? '?' : '×';
  const adoptLabel = row.status === 'warn' ? 'CONFIRM' : row.status === 'err' ? 'DISMISS' : 'ADOPT';
  const adoptClass = row.status === 'err' ? 'parsed-row__btn' : 'parsed-row__btn parsed-row__btn--adopt';
  const mappedClass = row.status === 'err' ? 'parsed-row__mapped parsed-row__mapped--none' : 'parsed-row__mapped';
  const tagSignHTML = row.tag.sign !== undefined ? `<span class="parsed-row__tag-sign">${escHTML(row.tag.sign)}</span>` : '';
  return `
    <div class="parsed-row parsed-row--${row.status}">
      <div class="parsed-row__status">${statusChar}</div>
      <div class="parsed-row__body">
        <span class="parsed-row__raw">"${escHTML(row.raw)}"</span>
        <h4 class="parsed-row__name">${escHTML(row.name)}</h4>
      </div>
      <span class="${mappedClass}">→ ${escHTML(row.mapped)}</span>
      <span class="parsed-row__confidence">${escHTML(row.confidence)} <small>conf</small></span>
      <span class="parsed-row__tag" data-heat="${escHTML(row.tag.heat)}">${tagSignHTML}${escHTML(row.tag.text)}</span>
      <div class="parsed-row__actions">
        <button class="parsed-row__btn" data-sc-action="details">DETAILS</button>
        <button class="${adoptClass}" data-sc-action="${row.status === 'err' ? 'dismiss' : 'adopt'}">${adoptLabel}</button>
      </div>
    </div>
  `;
}

function parsedRowsFromResult(result: ScanResult | null): ParsedRow[] {
  if (result === null) {
    return [];
  }
  return result.gapFills.map((g) => {
    const heatKey: ParsedRow['tag']['heat'] = g.gapFillPct >= 0.5 ? 'xl' : g.gapFillPct >= 0.2 ? 'lg' : g.gapFillPct >= 0.1 ? 'md' : 'sm';
    return {
      status: 'ok' as const,
      raw: g.essential.toLowerCase(),
      name: g.essential,
      mapped: `→ ${g.essential.toLowerCase()}`,
      confidence: '0.95',
      tag: { heat: heatKey, sign: '+', text: String(Math.round(g.gapFillPct * 100)) },
    };
  });
}

function renderParsed(result: ScanResult | null): string {
  const rows = parsedRowsFromResult(result);
  const rowsHTML = rows.length > 0
    ? rows.map(renderParsedRow).join('')
    : '<div class="parsed-row parsed-row--empty"><div class="parsed-row__body"><span class="parsed-row__raw">— scan a label to populate this list —</span></div></div>';
  return `
    <section class="parsed">
      <header class="parsed__head">
        <div>
          <div class="parsed__eyebrow">INGREDIENTS · <span class="ds-cipher" data-cipher-set="hexa">IG·56D2</span> · ${rows.length} DETECTED</div>
          <h2 class="parsed__title">Parsed &amp; Mapped</h2>
        </div>
        <div class="parsed__legend">
          <span class="parsed__legend-key"><span class="dot dot--ok"></span>VAULT HIT</span>
          <span class="parsed__legend-key"><span class="dot dot--warn"></span>FUZZY MATCH</span>
          <span class="parsed__legend-key"><span class="dot dot--err"></span>UNKNOWN</span>
        </div>
      </header>
      <div class="parsed__list">${rowsHTML}</div>
    </section>
  `;
}

// ─── Verdict card ────────────────────────────────────────────────────────

function renderVerdict(result: ScanResult | null): string {
  if (result === null) {
    return `
      <section class="verdict verdict--empty">
        <div class="verdict__grid">
          <div class="verdict__lead">
            <div class="verdict__eyebrow"><span class="pulse-dot"></span>VERDICT · awaiting scan</div>
            <h2 class="verdict__headline">NO LABEL LOADED YET</h2>
            <p class="verdict__body">Drop, paste, or upload a label image to begin. OCR runs locally; no data leaves your machine.</p>
          </div>
        </div>
      </section>
    `;
  }
  const headline = verdictHeadline(result.verdict);
  const added = result.gapFills.length;
  const traces = result.gapFills.filter(g => g.gapFillPct < 0.05).length;
  const anti = result.anti.length;
  return `
    <section class="verdict">
      <div class="verdict__grid">
        <div class="verdict__lead">
          <div class="verdict__eyebrow"><span class="pulse-dot"></span>VERDICT · <span class="ds-cipher" data-cipher-set="hexa">VD·81E3</span> · WALLACH ALIGNMENT</div>
          <h2 class="verdict__headline">${headline}</h2>
          <p class="verdict__body">
            ${result.reasonsFor[0]?.label ?? 'Scan complete.'}
            ${anti > 0 ? `${anti} item${anti === 1 ? '' : 's'} flagged for review.` : ''}
          </p>
          <div class="verdict__source">CITED · <strong>Wallach corpus — alignment per source-rule allowlist</strong></div>
          <div class="verdict__actions">
            <button class="scan-btn scan-btn--adopt" data-sc-action="adopt-product"><span class="scan-btn__glyph">+</span>ADD TO REGIMEN</button>
          </div>
        </div>
        <div class="verdict__stats">
          <div class="verdict-stat">
            <div class="verdict-stat__num">+${added}<small>/92</small></div>
            <div class="verdict-stat__label">essentials added to coverage</div>
          </div>
          <div class="verdict-stat">
            <div class="verdict-stat__num">${traces}</div>
            <div class="verdict-stat__label">trace tiles closed</div>
          </div>
          <div class="verdict-stat ${anti > 0 ? 'verdict-stat--warn' : ''}">
            <div class="verdict-stat__num">${anti}</div>
            <div class="verdict-stat__label">items flagged</div>
          </div>
          <div class="verdict-stat">
            <div class="verdict-stat__num">${result.alignment.aligned}/${result.alignment.total}</div>
            <div class="verdict-stat__label">aligned · ${(result.alignment.score * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ─── Scan history rail ───────────────────────────────────────────────────

function renderHistoryEntry(entry: HistoryEntry): string {
  const name = entry.label.name || '(unnamed)';
  const verdictText = entry.verdict;
  const pillClass = verdictPillClass(entry.verdict);
  return `
    <div class="scan-history-item" data-sc-action="reopen" data-scan-id="${entry.id}">
      <div class="scan-history-item__body">
        <h4 class="scan-history-item__name">${escHTML(name)}</h4>
        <span class="scan-history-item__ts">${escHTML(entry.ts.slice(0, 16))}</span>
      </div>
      <span class="${pillClass}">${escHTML(verdictText)}</span>
    </div>
  `;
}

function renderRail(): string {
  const history = getHistory();
  const itemsHTML = history.length > 0
    ? history.slice(0, 12).map(renderHistoryEntry).join('')
    : '<div class="scan-history-item scan-history-item--empty"><div class="scan-history-item__body"><h4 class="scan-history-item__name">— no scans yet —</h4></div></div>';
  return `
    <aside class="scanner-side">
      <section class="side-panel">
        <header class="side-panel__head">
          <div class="side-panel__eyebrow">SCAN HISTORY · ${history.length} TOTAL</div>
          <h3 class="side-panel__title">PAST CAPTURES</h3>
        </header>
        <div class="side-panel__list">${itemsHTML}</div>
      </section>
    </aside>
  `;
}

// ─── Cipher animation engine ──────────────────────────────────────────────

const CIPHER_SETS: Record<string, string> = {
  hexa: '0123456789ABCDEF',
  alphanum: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numfrac: '0123456789',
  time: '0123456789:·',
};

let cipherInterval: number | null = null;
let cipherTickCount = 0;

function startCipherEngine(container: HTMLElement): void {
  if (cipherInterval !== null) {
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  cipherInterval = window.setInterval(() => {
    cipherTickCount += 1;
    const elements = Array.from(container.querySelectorAll<HTMLElement>('.ds-cipher'));
    for (const el of elements) {
      let original = el.dataset['cipherOriginal'];
      if (original === undefined) {
        original = el.textContent ?? '';
        el.dataset['cipherOriginal'] = original;
        const setKey = el.dataset['cipherSet'] ?? 'alphanum';
        el.dataset['cipherSetResolved'] = CIPHER_SETS[setKey] ?? CIPHER_SETS['alphanum'] ?? '';
      }
      const set = el.dataset['cipherSetResolved'] ?? '';
      if (cipherTickCount % 5 === 0) {
        el.textContent = original;
        continue;
      }
      if (original.length === 0 || set.length === 0) {
        continue;
      }
      const chars = original.split('');
      const i = Math.floor(Math.random() * chars.length);
      const charAt = chars[i];
      if (charAt === undefined) {
        continue;
      }
      if (!/[A-Z0-9·:]/i.test(charAt)) {
        continue;
      }
      const newChar = set[Math.floor(Math.random() * set.length)] ?? charAt;
      chars[i] = newChar;
      el.textContent = chars.join('');
    }
  }, 1000);
}

function stopCipherEngine(): void {
  if (cipherInterval !== null) {
    window.clearInterval(cipherInterval);
    cipherInterval = null;
  }
}

// ─── Image handling — file → dataURL → legacy bridge ─────────────────────

async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

async function handleImageFile(file: File): Promise<void> {
  try {
    const dataUrl = await readFileAsDataURL(file);
    await scanImage(dataUrl);
  }
  catch (e) {
    console.warn('[views/scanner] OCR scan failed:', e);
  }
}

// ─── Adopt to regimen — scanned product → §31 saveRgManual → coverage ──────

/**
 * Adopt a scanned product into the regimen: mirror views/regimen.ts addItem,
 * building a RegimenItem (provenance 'user_scanned') from the scored label and
 * persisting via the §31 saveRgManual chokepoint, which cascades regimen:changed
 * → coverage recompute. Per-product (not per-row): one label → one stack entry.
 */
function adoptProduct(label: ScanLabel): void {
  const item: RegimenItem = {
    id: Date.now(),
    label: { name: label.name, nutrients: label.nutrients ?? [] },
    addedDate: new Date().toISOString().slice(0, 10),
    provenance: 'user_scanned',
  };
  saveRgManual([...loadRgManual(), item]);
}

// ─── Mount ────────────────────────────────────────────────────────────────

export function mount(container: HTMLElement): MountHandle {
  let state: ScanState = 'idle';

  const currentResult = (): ScanResult | null => {
    const w = window as LegacyWindow;
    return w.lcLastResult ?? null;
  };

  const render = (): void => {
    const result = currentResult();
    if (result !== null && state === 'idle') {
      state = 'result';
    }
    container.innerHTML = `
      <div class="scanner-grid">
        <div class="scanner-main">
          ${renderStage(state, result)}
          ${renderPipeline(state)}
          ${renderParsed(result)}
          ${renderVerdict(result)}
        </div>
        ${renderRail()}
      </div>
    `;
  };

  const clickHandler = (ev: Event): void => {
    const target = ev.target as HTMLElement | null;
    if (target === null) {
      return;
    }
    const actionEl = target.closest<HTMLElement>('[data-sc-action]');
    if (actionEl === null) {
      return;
    }
    const action = actionEl.dataset['scAction'] ?? '';
    if (action === 'upload' || action === 'upload-click' || action === 'retake') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (file !== undefined) {
          void handleImageFile(file);
          state = 'scanning';
          render();
        }
      });
      input.click();
    }
    else if (action === 'adopt-product') {
      const result = currentResult();
      if (result === null) {
        return;
      }
      adoptProduct(result.label);
      actionEl.textContent = '✓ ADDED TO REGIMEN';
      if (actionEl instanceof HTMLButtonElement) {
        actionEl.disabled = true;
      }
    }
  };

  const dragHandler = (ev: DragEvent): void => {
    ev.preventDefault();
  };

  const dropHandler = (ev: DragEvent): void => {
    ev.preventDefault();
    const file = ev.dataTransfer?.files[0];
    if (file !== undefined) {
      void handleImageFile(file);
      state = 'scanning';
      render();
    }
  };

  const pasteHandler = (ev: ClipboardEvent): void => {
    const items = ev.clipboardData?.items;
    if (items === undefined) {
      return;
    }
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file !== null) {
          void handleImageFile(file);
          state = 'scanning';
          render();
          return;
        }
      }
    }
  };

  render();
  startCipherEngine(container);

  container.addEventListener('click', clickHandler);
  container.addEventListener('dragover', dragHandler);
  container.addEventListener('drop', dropHandler);
  document.addEventListener('paste', pasteHandler);

  const unsubComplete = on('scanner:scan-complete', () => {
    state = 'result';
    render();
  });
  const unsubCleared = on('scanner:scan-cleared', () => {
    state = 'idle';
    render();
  });

  return {
    update: render,
    unmount: () => {
      unsubComplete();
      unsubCleared();
      stopCipherEngine();
      container.removeEventListener('click', clickHandler);
      container.removeEventListener('dragover', dragHandler);
      container.removeEventListener('drop', dropHandler);
      document.removeEventListener('paste', pasteHandler);
      container.innerHTML = '';
    },
  };
}
